#!/usr/bin/env python3
"""S27 · Этап G — shared quality guard for ingest scripts.

Exports a single function `is_junk(text)` returning `(tags, metrics)`.
`tags` is a list like `["junk:repetitive"]` or `["ok"]`. Used by
`s27_ingest_manuals_export.py` and `s27_ingest_oversize_normalized.py`
to reject picture-book / TOC / repetition junk before copying into KB.

Also exposes `load_blacklist()` which reads
`.omc/research/s27-source-blacklist.txt` (one relative path per line,
`brand/gen`) so previously-classified junk never gets re-ingested.
"""
from __future__ import annotations

import re
from pathlib import Path

TOC_RE = re.compile(r"^\s*\d+(?:\.\d+)*\.?\s+\S.{0,120}?\s*\.{2,}?\s*\d{1,4}\s*$")
TOC_LOOSE_RE = re.compile(r"^\s*\d+(?:\.\d+){1,5}\.?\s+\S.{2,120}?\s+\d{1,4}\s*$")
PART_LABEL_RE = re.compile(r"^\s*[А-ЯA-ZЁ][А-Яа-яA-Za-zЁё0-9 \-,/()]{2,50}\s+\d{1,4}\s*$")
IMAGE_REF_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
HEADER_RE = re.compile(r"^\s*#{1,6}\s+\S")
WORD_RE = re.compile(r"\w+", re.UNICODE)


def measure_text(text: str) -> dict:
    size_bytes = len(text.encode("utf-8"))
    total_lines = 0
    nonblank_lines = 0
    unique_set: set[str] = set()
    word_count = 0
    image_ref_count = 0
    image_ref_bytes = 0
    toc_line_count = 0
    part_label_count = 0

    for raw in text.split("\n"):
        total_lines += 1
        stripped = raw.strip()
        if not stripped:
            continue
        nonblank_lines += 1
        unique_set.add(stripped)
        word_count += len(WORD_RE.findall(raw))

        if HEADER_RE.match(raw):
            continue

        for m in IMAGE_REF_RE.finditer(raw):
            image_ref_count += 1
            image_ref_bytes += len(m.group(0).encode("utf-8"))

        if TOC_RE.match(raw) or TOC_LOOSE_RE.match(raw):
            toc_line_count += 1
        elif PART_LABEL_RE.match(raw):
            part_label_count += 1

    unique_lines = len(unique_set)
    return {
        "size_bytes": size_bytes,
        "total_lines": total_lines,
        "nonblank_lines": nonblank_lines,
        "unique_lines": unique_lines,
        "word_count": word_count,
        "image_ref_count": image_ref_count,
        "image_ref_bytes": image_ref_bytes,
        "toc_line_count": toc_line_count,
        "part_label_count": part_label_count,
        "unique_ratio": (unique_lines / nonblank_lines) if nonblank_lines else 0.0,
        "dup_ratio": (1.0 - unique_lines / nonblank_lines) if nonblank_lines else 0.0,
        "toc_ratio": (toc_line_count / nonblank_lines) if nonblank_lines else 0.0,
        "part_label_ratio": (part_label_count / nonblank_lines) if nonblank_lines else 0.0,
        "image_byte_ratio": (image_ref_bytes / size_bytes) if size_bytes else 0.0,
    }


def verdict_for(m: dict) -> list[str]:
    tags: list[str] = []
    nb = m["nonblank_lines"]
    if m["unique_ratio"] < 0.05 and nb > 200:
        tags.append("junk:repetitive")
    elif m["dup_ratio"] > 0.80 and nb > 200:
        tags.append("junk:repetitive_soft")
    if m["toc_ratio"] > 0.30:
        tags.append("junk:toc")
    if m["part_label_ratio"] > 0.30:
        tags.append("junk:parts_index")
    if m["image_byte_ratio"] > 0.30 and m["word_count"] < 5000:
        tags.append("junk:picture_book")
    if m["word_count"] < 500 and m["size_bytes"] > 1_000_000:
        tags.append("junk:thin")
    if not tags:
        tags.append("ok")
    return tags


# Hard-reject: strict repetitive + picture-book + thin.
# Soft categories (repetitive_soft, toc, parts_index) are reported but NOT
# hard-blocked — they can still be useful source material.
HARD_REJECT = {"junk:repetitive", "junk:picture_book", "junk:thin"}


def is_junk(text: str) -> tuple[list[str], dict]:
    m = measure_text(text)
    tags = verdict_for(m)
    return tags, m


def should_reject(tags: list[str]) -> bool:
    return any(t in HARD_REJECT for t in tags)


def load_blacklist(path: str = ".omc/research/s27-source-blacklist.txt") -> set[str]:
    p = Path(path)
    if not p.is_file():
        return set()
    out: set[str] = set()
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        out.add(line.replace("\\", "/"))
    return out


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("usage: s27_quality_guard.py <manual.md>", file=sys.stderr)
        sys.exit(1)
    p = Path(sys.argv[1])
    text = p.read_text(encoding="utf-8", errors="replace")
    tags, m = is_junk(text)
    print(f"verdict: {', '.join(tags)}")
    for k in ("size_bytes", "nonblank_lines", "unique_ratio", "dup_ratio",
              "toc_ratio", "part_label_ratio", "image_byte_ratio", "word_count"):
        v = m[k]
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
        else:
            print(f"  {k}: {v}")
    sys.exit(0 if not should_reject(tags) else 2)
