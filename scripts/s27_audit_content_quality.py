#!/usr/bin/env python3
"""S27 · Этап G — content quality audit.

READ-ONLY audit that scans every `manual.md` in one or more roots and
classifies it against five junk patterns:

  junk:repetitive    — dup_ratio > 0.8  (unique_lines/total < 0.2 inverse)
                       Primary criterion — < 0.05 unique_ratio for hard junk.
  junk:toc           — toc_ratio > 0.3  (TOC-dominated, dot-leader lines)
  junk:parts_index   — part_label_ratio > 0.3  (part-name + page# index)
  junk:picture_book  — image_byte_ratio > 0.3  (bytes spent on ![](…))
  junk:thin          — word_count < 500 AND size > 1MB  (OCR-empty)

Usage:
    python scripts/s27_audit_content_quality.py                   # both roots
    python scripts/s27_audit_content_quality.py --root <dir>      # one root
    python scripts/s27_audit_content_quality.py --root <dir> --label <name>
    python scripts/s27_audit_content_quality.py --json-out <file.jsonl>

Outputs per root:
    .omc/research/s27-content-quality-<label>.md   — human-readable verdict table
    .omc/research/s27-content-quality-<label>.jsonl — machine-readable metrics
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------
# TOC-dominated: "4.5.2. Система климат-контроля .... 111" or "4.6.Мультимедиа 129"
TOC_RE = re.compile(r"^\s*\d+(?:\.\d+)*\.?\s+\S.{0,120}?\s*\.{2,}?\s*\d{1,4}\s*$")
# Also accept the "no dot leaders" variant which is very common in these junk files
TOC_LOOSE_RE = re.compile(r"^\s*\d+(?:\.\d+){1,5}\.?\s+\S.{2,120}?\s+\d{1,4}\s*$")

# Part-index: "Дверная ручка 19" / "Наружное зеркало заднего вида 39"
PART_LABEL_RE = re.compile(r"^\s*[А-ЯA-ZЁ][А-Яа-яA-Za-zЁё0-9 \-,/()]{2,50}\s+\d{1,4}\s*$")

# Image reference: inline or standalone `![alt](images/<hash>.webp)` / `.png` / `.jpg`
IMAGE_REF_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")

WORD_RE = re.compile(r"\w+", re.UNICODE)

# Header detection (to exclude from TOC scoring — actual H1..H6 are real content)
HEADER_RE = re.compile(r"^\s*#{1,6}\s+\S")


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
@dataclass
class FileMetrics:
    path: str
    size_bytes: int
    total_lines: int
    nonblank_lines: int
    unique_lines: int
    word_count: int
    image_ref_count: int
    image_ref_bytes: int
    toc_line_count: int
    part_label_count: int
    header_count: int

    @property
    def dup_ratio(self) -> float:
        if self.nonblank_lines == 0:
            return 0.0
        return 1.0 - (self.unique_lines / self.nonblank_lines)

    @property
    def unique_ratio(self) -> float:
        if self.nonblank_lines == 0:
            return 0.0
        return self.unique_lines / self.nonblank_lines

    @property
    def toc_ratio(self) -> float:
        if self.nonblank_lines == 0:
            return 0.0
        return self.toc_line_count / self.nonblank_lines

    @property
    def part_label_ratio(self) -> float:
        if self.nonblank_lines == 0:
            return 0.0
        return self.part_label_count / self.nonblank_lines

    @property
    def image_byte_ratio(self) -> float:
        if self.size_bytes == 0:
            return 0.0
        return self.image_ref_bytes / self.size_bytes


def measure(path: Path) -> FileMetrics | None:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        print(f"[err] {path}: {e}", file=sys.stderr)
        return None
    size_bytes = len(text.encode("utf-8"))

    total_lines = 0
    nonblank_lines = 0
    unique_set: set[str] = set()
    word_count = 0
    image_ref_count = 0
    image_ref_bytes = 0
    toc_line_count = 0
    part_label_count = 0
    header_count = 0

    for raw in text.split("\n"):
        total_lines += 1
        stripped = raw.strip()
        if not stripped:
            continue
        nonblank_lines += 1
        unique_set.add(stripped)
        word_count += len(WORD_RE.findall(raw))

        # header → skip further classification (real content)
        if HEADER_RE.match(raw):
            header_count += 1
            continue

        # image refs (can appear multiple times per line)
        for m in IMAGE_REF_RE.finditer(raw):
            image_ref_count += 1
            image_ref_bytes += len(m.group(0).encode("utf-8"))

        if TOC_RE.match(raw) or TOC_LOOSE_RE.match(raw):
            toc_line_count += 1
        elif PART_LABEL_RE.match(raw):
            part_label_count += 1

    return FileMetrics(
        path=str(path),
        size_bytes=size_bytes,
        total_lines=total_lines,
        nonblank_lines=nonblank_lines,
        unique_lines=len(unique_set),
        word_count=word_count,
        image_ref_count=image_ref_count,
        image_ref_bytes=image_ref_bytes,
        toc_line_count=toc_line_count,
        part_label_count=part_label_count,
        header_count=header_count,
    )


def verdict(m: FileMetrics) -> list[str]:
    tags: list[str] = []
    # Primary: hard repetitive junk (user-flagged threshold)
    if m.unique_ratio < 0.05 and m.nonblank_lines > 200:
        tags.append("junk:repetitive")
    # Soft repetitive — dup_ratio > 0.8 but > 0.05 unique
    elif m.dup_ratio > 0.8 and m.nonblank_lines > 200:
        tags.append("junk:repetitive_soft")
    if m.toc_ratio > 0.30:
        tags.append("junk:toc")
    if m.part_label_ratio > 0.30:
        tags.append("junk:parts_index")
    if m.image_byte_ratio > 0.30 and m.word_count < 5000:
        # Floor: if file has >5K words despite images, it's a real illustrated manual
        tags.append("junk:picture_book")
    if m.word_count < 500 and m.size_bytes > 1_000_000:
        tags.append("junk:thin")
    if not tags:
        tags.append("ok")
    return tags


# ---------------------------------------------------------------------------
# Scan + report
# ---------------------------------------------------------------------------
def scan(root: Path, jsonl_fh=None) -> list[FileMetrics]:
    """Scan manual.md files under root.

    If jsonl_fh is given, writes one JSON line per file *immediately* and
    flushes to disk — partial progress survives crashes/kills.
    """
    results: list[FileMetrics] = []
    files = sorted(root.rglob("manual.md"))
    total = len(files)
    for i, p in enumerate(files, 1):
        m = measure(p)
        if m is None:
            continue
        results.append(m)
        if jsonl_fh is not None:
            tags = verdict(m)
            row = asdict(m)
            row["rel"] = rel_path(m.path, root)
            row["verdict"] = tags
            row["unique_ratio"] = round(m.unique_ratio, 4)
            row["dup_ratio"] = round(m.dup_ratio, 4)
            row["toc_ratio"] = round(m.toc_ratio, 4)
            row["part_label_ratio"] = round(m.part_label_ratio, 4)
            row["image_byte_ratio"] = round(m.image_byte_ratio, 4)
            jsonl_fh.write(json.dumps(row, ensure_ascii=False) + "\n")
            jsonl_fh.flush()
        if i % 10 == 0 or i == total:
            print(f"  [{i}/{total}] {rel_path(m.path, root)[:60]}", file=sys.stderr, flush=True)
    return results


def rel_path(p: Path | str, root: Path) -> str:
    try:
        return str(Path(p).resolve().relative_to(root.resolve())).replace("\\", "/")
    except ValueError:
        return str(p).replace("\\", "/")


def write_report(results: list[FileMetrics], root: Path, label: str, out_md: Path,
                 out_jsonl: Path, skip_jsonl: bool = False) -> None:
    # Classify all
    entries: list[tuple[FileMetrics, list[str], str]] = []
    for m in results:
        tags = verdict(m)
        entries.append((m, tags, rel_path(m.path, root)))

    # JSONL (skip if scan already streamed it)
    if not skip_jsonl:
        out_jsonl.parent.mkdir(parents=True, exist_ok=True)
        with out_jsonl.open("w", encoding="utf-8") as fh:
            for m, tags, rel in entries:
                row = asdict(m)
                row["rel"] = rel
                row["verdict"] = tags
                row["unique_ratio"] = round(m.unique_ratio, 4)
                row["dup_ratio"] = round(m.dup_ratio, 4)
                row["toc_ratio"] = round(m.toc_ratio, 4)
                row["part_label_ratio"] = round(m.part_label_ratio, 4)
                row["image_byte_ratio"] = round(m.image_byte_ratio, 4)
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    # MD report
    total = len(entries)
    total_bytes = sum(m.size_bytes for m, _, _ in entries)
    by_tag: dict[str, list[tuple[FileMetrics, str]]] = {}
    for m, tags, rel in entries:
        for t in tags:
            by_tag.setdefault(t, []).append((m, rel))

    lines: list[str] = []
    lines.append(f"# S27 · Content quality audit — `{label}`")
    lines.append("")
    lines.append(f"**Root:** `{root}`")
    lines.append(f"**Files scanned:** {total}")
    lines.append(f"**Total size:** {total_bytes/1e6:.1f} MB")
    lines.append("")
    lines.append("## Verdict summary")
    lines.append("")
    lines.append("| verdict | files | total MB |")
    lines.append("|---|---:|---:|")
    for tag in sorted(by_tag.keys(), key=lambda t: (-len(by_tag[t]), t)):
        items = by_tag[tag]
        tbytes = sum(x[0].size_bytes for x in items)
        lines.append(f"| `{tag}` | {len(items)} | {tbytes/1e6:.1f} |")
    lines.append("")

    # Per-verdict tables (junk categories first, then ok)
    order = [
        "junk:repetitive",
        "junk:repetitive_soft",
        "junk:toc",
        "junk:parts_index",
        "junk:picture_book",
        "junk:thin",
        "ok",
    ]
    for tag in order:
        items = by_tag.get(tag, [])
        if not items:
            continue
        lines.append(f"## `{tag}` ({len(items)} files)")
        lines.append("")
        lines.append("| file | size MB | lines | uniq% | dup% | toc% | part% | img% | words |")
        lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
        for m, rel in sorted(items, key=lambda x: -x[0].size_bytes):
            lines.append(
                f"| {rel} | {m.size_bytes/1e6:.2f} | {m.nonblank_lines} | "
                f"{m.unique_ratio*100:.1f} | {m.dup_ratio*100:.1f} | "
                f"{m.toc_ratio*100:.1f} | {m.part_label_ratio*100:.1f} | "
                f"{m.image_byte_ratio*100:.1f} | {m.word_count} |"
            )
        lines.append("")

    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text("\n".join(lines), encoding="utf-8")


def derive_label(root: Path) -> str:
    # Use the last path component, sanitised
    name = root.name or root.drive.strip(":\\/") or "root"
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", name).strip("-").lower() or "root"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", action="append", default=None,
                    help="Root dir to scan (repeatable). Default: both KB + D:/manuals-export")
    ap.add_argument("--label", action="append", default=None,
                    help="Label for report filename (one per --root, in order)")
    ap.add_argument("--report-dir", default=".omc/research")
    args = ap.parse_args()

    if args.root:
        roots = [Path(r) for r in args.root]
        labels = args.label or []
        while len(labels) < len(roots):
            labels.append(derive_label(roots[len(labels)]))
    else:
        roots = [Path("llcar-dashboard/public/data/kb"), Path("D:/manuals-export")]
        labels = ["repo", "source"]

    report_dir = Path(args.report_dir)
    overall: list[tuple[str, int, int, dict[str, int]]] = []

    for root, label in zip(roots, labels):
        if not root.is_dir():
            print(f"[skip] {root} — not a directory", file=sys.stderr)
            continue
        print(f"[scan] {root} (label={label})", file=sys.stderr)
        out_md = report_dir / f"s27-content-quality-{label}.md"
        out_jsonl = report_dir / f"s27-content-quality-{label}.jsonl"
        out_jsonl.parent.mkdir(parents=True, exist_ok=True)
        # Streaming write: one JSON per file, flushed — survives crash/kill
        with out_jsonl.open("w", encoding="utf-8") as jfh:
            results = scan(root, jsonl_fh=jfh)
        write_report(results, root, label, out_md, out_jsonl, skip_jsonl=True)
        tag_counts: dict[str, int] = {}
        for m in results:
            for t in verdict(m):
                tag_counts[t] = tag_counts.get(t, 0) + 1
        overall.append((label, len(results), sum(m.size_bytes for m in results), tag_counts))
        print(f"[done] {label}: {len(results)} files → {out_md.name}", file=sys.stderr)

    # Terminal summary
    print("")
    for label, n, total_bytes, tag_counts in overall:
        print(f"[{label}] files={n} size={total_bytes/1e6:.0f}MB "
              + " ".join(f"{k}={v}" for k, v in sorted(tag_counts.items(), key=lambda x: -x[1])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
