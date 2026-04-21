#!/usr/bin/env python3
"""S27 Этап H2.1 — audit image refs в manual.md против D:\manuals-export/*/images/.

Проходит по всем `llcar-dashboard/public/data/kb/*/*/*/manual.md`, извлекает
все `![...](images/<sha256>.webp)`-ссылки, проверяет существование в
`D:\manuals-export/*/images/<hash>.webp`. Отчёт:
  • сколько refs всего
  • сколько уникальных hash'ей
  • сколько найдено в D:\, сколько орфанов (битых)
  • per-file breakdown: файлы с broken_refs > 0

Также пишет `images-manifest.txt` со списком найденных hash-путей (для
`sync-kb-images.sh`).

Usage:
    python scripts/s27_audit_image_refs.py             # dry-run по всему репо
    python scripts/s27_audit_image_refs.py --src D:/manuals-export
    python scripts/s27_audit_image_refs.py --manifest-out .omc/research/images-manifest.txt
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from collections import defaultdict
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


IMAGE_REF_RE = re.compile(r"!\[[^\]]*\]\(images/([0-9a-f]{64})\.webp\)", re.IGNORECASE)
HTML_IMG_RE = re.compile(r"<!--\s*image:\s*([0-9a-f]{64})\.(?:webp|jpg|png)\s*-->", re.IGNORECASE)


def build_src_index(src_root: Path) -> dict[str, Path]:
    """Scan D:\manuals-export/*/images/*.webp → {hash: path}."""
    idx: dict[str, Path] = {}
    if not src_root.is_dir():
        print(f"[warn] src not found: {src_root}", file=sys.stderr)
        return idx
    count = 0
    for webp in src_root.rglob("*.webp"):
        stem = webp.stem.lower()
        if len(stem) == 64 and all(c in "0123456789abcdef" for c in stem):
            idx[stem] = webp
            count += 1
            if count % 50000 == 0:
                print(f"  [index] {count} webp indexed", file=sys.stderr)
    print(f"[done] src index: {len(idx)} unique hash'ей", file=sys.stderr)
    return idx


def scan_md(kb_root: Path) -> dict[Path, set[str]]:
    """Scan manual.md files, collect hash'es per file."""
    result: dict[Path, set[str]] = {}
    files = sorted(kb_root.rglob("manual.md"))
    for p in files:
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"[err] {p}: {e}", file=sys.stderr)
            continue
        hashes: set[str] = set()
        # Only active markdown refs `![](images/<hash>.webp)` — рендерятся в UI.
        # HTML-comments `<!-- image: X -->` НЕ рендерятся (markdown их игнорирует),
        # их считаем отдельно как "inactive" для очистки через normalize.
        for m in IMAGE_REF_RE.finditer(text):
            hashes.add(m.group(1).lower())
        result[p] = hashes
    return result


def count_inactive(kb_root: Path) -> int:
    """Count HTML-comment image refs (not rendered in UI) for cleanup report."""
    count = 0
    for p in kb_root.rglob("manual.md"):
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        count += len(HTML_IMG_RE.findall(t))
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src", default="D:/manuals-export")
    ap.add_argument("--report", default=".omc/research/s27-image-refs-audit.md")
    ap.add_argument("--manifest-out", default=".omc/research/images-manifest.txt",
                    help="File with <hash> <src-path> (tab-separated) for sync-kb-images.sh")
    args = ap.parse_args()

    kb_root = Path(args.kb_root)
    src_root = Path(args.src)

    print(f"[scan] markdown refs in {kb_root}...", file=sys.stderr)
    per_file = scan_md(kb_root)
    total_files = len(per_file)
    files_with_refs = sum(1 for h in per_file.values() if h)
    all_hashes: set[str] = set()
    for hs in per_file.values():
        all_hashes |= hs
    inactive_count = count_inactive(kb_root)
    print(f"  files: {total_files} (with refs: {files_with_refs})", file=sys.stderr)
    print(f"  active markdown hash'ей: {len(all_hashes)}", file=sys.stderr)
    print(f"  inactive HTML-comment refs (not rendered): {inactive_count}", file=sys.stderr)

    print(f"[scan] indexing src webp in {src_root}...", file=sys.stderr)
    src_idx = build_src_index(src_root)

    found = all_hashes & set(src_idx.keys())
    missing = all_hashes - set(src_idx.keys())
    pct_found = 100 * len(found) / max(len(all_hashes), 1)

    # Per-file broken count
    per_file_broken: list[tuple[Path, int, int]] = []
    for p, hashes in per_file.items():
        if not hashes:
            continue
        broken = len(hashes - set(src_idx.keys()))
        per_file_broken.append((p, len(hashes), broken))

    # Manifest: hash + src path
    manifest = Path(args.manifest_out)
    manifest.parent.mkdir(parents=True, exist_ok=True)
    with manifest.open("w", encoding="utf-8") as fh:
        for h in sorted(found):
            src = src_idx[h]
            fh.write(f"{h}\t{src}\n")
    print(f"[done] manifest: {len(found)} hashes → {manifest}", file=sys.stderr)

    # Report MD
    lines = [f"# S27 Этап H2.1 — image refs audit", ""]
    lines.append(f"**KB root:** `{kb_root}`  ·  **Src:** `{src_root}`")
    lines.append(f"**MD файлов:** {total_files} · с ref'ами: {files_with_refs}")
    lines.append(f"**Active markdown hash'ей** (рендерятся в UI): {len(all_hashes):,}")
    lines.append(f"**Inactive HTML-comments** (не рендерятся, artifacts S27 B): {inactive_count:,}")
    lines.append("")
    lines.append(f"**Найдено в D:\\:** {len(found):,} ({pct_found:.1f}%)")
    lines.append(f"**Битых (missing):** {len(missing):,} ({100 - pct_found:.1f}%)")
    lines.append("")

    broken_files = sorted([t for t in per_file_broken if t[2] > 0], key=lambda x: -x[2])
    if broken_files:
        lines.append(f"## Файлы с битыми refs ({len(broken_files)})")
        lines.append("")
        lines.append("| file | total refs | broken | % broken |")
        lines.append("|---|---:|---:|---:|")
        for p, total, broken in broken_files[:50]:
            rel = str(p.relative_to(kb_root)).replace("\\", "/")
            pct = 100 * broken / max(total, 1)
            lines.append(f"| {rel} | {total} | {broken} | {pct:.1f}% |")
        lines.append("")
        if len(broken_files) > 50:
            lines.append(f"... и ещё {len(broken_files) - 50}")
            lines.append("")

    lines.append("## Sample missing hash'ей (до 30)")
    lines.append("")
    for h in sorted(missing)[:30]:
        lines.append(f"- `{h}`")

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {out}", file=sys.stderr)

    # Summary
    print(f"\n[summary] {len(found):,}/{len(all_hashes):,} found ({pct_found:.1f}%); "
          f"broken {len(missing):,} ({100-pct_found:.1f}%)")
    if missing and pct_found < 95:
        print(f"[warn] broken refs > 5% — нужно расследование", file=sys.stderr)
    return 0 if not missing else (2 if pct_found < 95 else 0)


if __name__ == "__main__":
    sys.exit(main())
