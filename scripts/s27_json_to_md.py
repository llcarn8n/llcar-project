#!/usr/bin/env python3
"""S27 — convert DITA-like JSON manuals to Markdown.

Schema (18-dita-manual.json from D:/transfer4/knowledge-base/brands/<brand>/models/<model>/):
    { version, format, model, manuals: [
        { model, label: {ru, en}, sections: [
            { id, title: {ru, en}, icon, topics: [
                { id, type, num, title: {ru, en}, systems, words, images,
                  subtopics: [...], content: {ru, en} }
            ] }
        ] }
    ] }

Output: manual.md with YAML frontmatter + H1 label + H2 per section + H3 per topic.
Prefers Russian content, falls back to English. Images referenced as ![](images/{hash}.webp)
left untouched — resolver in frontend handles them.

Usage:
    python scripts/s27_json_to_md.py <input.json> <output.md>
    python scripts/s27_json_to_md.py --batch <src_root> <dst_root> [--threshold 100000] [--dry-run]

Policy (S27):
    - Russia-first: prefer ru content; drop if neither ru nor en.
    - Preserve image refs (downstream s27_strip_manual_garbage.py cleans residual noise).
    - JSON stays on D:\\ disk; only MD goes into repo (see feedback_kb_storage_policy).
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def _text(node: dict, key: str = "") -> str:
    if not isinstance(node, dict):
        return ""
    if key and isinstance(node.get(key), dict):
        node = node[key]
    ru = (node.get("ru") or "").strip() if isinstance(node.get("ru"), str) else ""
    en = (node.get("en") or "").strip() if isinstance(node.get("en"), str) else ""
    return ru or en


def _emit_topic(topic: dict, depth: int, lines: list[str]) -> None:
    title = _text(topic.get("title", {}))
    if not title:
        return
    hashes = "#" * min(depth, 6)
    lines.append(f"{hashes} {title}")
    lines.append("")
    content = _text(topic.get("content", {}))
    if content:
        lines.append(content)
        lines.append("")
    subs = topic.get("subtopics") or []
    if isinstance(subs, list):
        for sub in subs:
            if isinstance(sub, dict):
                _emit_topic(sub, depth + 1, lines)


def _emit_section(section: dict, lines: list[str]) -> None:
    title = _text(section.get("title", {}))
    if not title:
        return
    icon = section.get("icon") or ""
    prefix = f"{icon} " if icon else ""
    lines.append(f"## {prefix}{title}")
    lines.append("")
    topics = section.get("topics") or []
    for topic in topics:
        if isinstance(topic, dict):
            _emit_topic(topic, 3, lines)


def convert(data: Any, *, brand: str = "", gen: str = "") -> str:
    """Render DITA-like JSON into a single Markdown string with YAML frontmatter."""
    manuals = data.get("manuals") if isinstance(data, dict) else None
    if not manuals or not isinstance(manuals, list):
        return ""
    manual = manuals[0]
    label = _text(manual.get("label", {}))
    model = data.get("model", "") if isinstance(data, dict) else ""

    lines: list[str] = ["---"]
    if brand:
        lines.append(f"brand: {brand}")
    if model:
        lines.append(f"model: {model}")
    if gen:
        lines.append(f"generation: {gen}")
    lines.append(f"source: dita")
    if label:
        lines.append(f"title: {label}")
    lines.append("---")
    lines.append("")

    if label:
        lines.append(f"# {label}")
        lines.append("")

    for section in manual.get("sections", []):
        if isinstance(section, dict):
            _emit_section(section, lines)

    return "\n".join(lines).rstrip() + "\n"


def _convert_one(src: Path, dst: Path, brand: str, gen: str) -> tuple[int, int]:
    try:
        data = json.loads(src.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[skip] {src}: {e}", file=sys.stderr)
        return 0, 0
    md = convert(data, brand=brand, gen=gen)
    if not md.strip():
        return 0, 0
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(md, encoding="utf-8")
    return src.stat().st_size, len(md.encode("utf-8"))


def _batch(src_root: Path, dst_root: Path, threshold: int, dry_run: bool) -> None:
    total_before = 0
    total_after = 0
    converted = 0
    skipped_small = 0

    for src in sorted(src_root.rglob("18-dita-manual.json")):
        size = src.stat().st_size
        if size < threshold:
            skipped_small += 1
            continue
        # D:/transfer4/knowledge-base/brands/<brand>/models/<model>/18-dita-manual.json
        parts = src.relative_to(src_root).parts
        brand = parts[0] if len(parts) >= 1 else ""
        model = parts[2] if len(parts) >= 3 else ""
        dst = dst_root / brand / model / "manual.md"
        if dry_run:
            print(f"[dry] {src} → {dst} ({size:,} B)")
            total_before += size
            continue
        before, after = _convert_one(src, dst, brand=brand, gen=model)
        if before:
            converted += 1
            total_before += before
            total_after += after

    tag = "dry-run" if dry_run else "apply"
    print(f"[{tag}] JSON candidates ≥{threshold:,}B: converted={converted} "
          f"skipped_small={skipped_small} before={total_before:,} after={total_after:,}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", nargs="?", help="Input DITA JSON (single-file mode)")
    ap.add_argument("output", nargs="?", help="Output MD path (single-file mode)")
    ap.add_argument("--batch", action="store_true",
                    help="Batch mode: input=src_root, output=dst_root")
    ap.add_argument("--threshold", type=int, default=100_000,
                    help="Batch mode: skip JSON smaller than this (bytes)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--brand", default="", help="Single-file mode: brand for frontmatter")
    ap.add_argument("--gen", default="", help="Single-file mode: generation for frontmatter")
    args = ap.parse_args()

    if not args.input or not args.output:
        ap.print_help()
        return 1

    if args.batch:
        _batch(Path(args.input), Path(args.output), args.threshold, args.dry_run)
        return 0

    src = Path(args.input)
    dst = Path(args.output)
    before, after = _convert_one(src, dst, brand=args.brand, gen=args.gen)
    if before:
        ratio = after / before * 100
        print(f"[ok] {src} → {dst} ({before:,} → {after:,} B, {ratio:.1f}%)")
    else:
        print(f"[empty] {src} produced no MD content", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
