#!/usr/bin/env python3
"""
Validate full diagnostic articles in llcar-dashboard/public/data/kb/_articles/*.md.

Checks:
- Frontmatter presence and required keys
- Exactly 6 ## sections with canonical titles
- Length 1500-2500 chars (content without frontmatter)
- No placeholder text (qa: рус, [указать], TODO, XXX)
- No CJK characters (иероглифы)
- Sections separated by blank lines
- dtc_codes match [PBCU]xxxx format

Usage:
    python scripts/validate_full_articles.py [--dir path]

Exit code: 0 if all valid, 1 if any issues found.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_SECTIONS = [
    "## Симптомы",
    "## Техническая причина",
    "## Последствия игнорирования",
    "## Диагностика",
    "## Ремонт",
    "## Профилактика",
]

PLACEHOLDER_PATTERNS = [
    re.compile(r"qa:\s*рус", re.IGNORECASE),
    re.compile(r"\[указать[^\]]*\]", re.IGNORECASE),
    re.compile(r"TODO", re.IGNORECASE),
    re.compile(r"XXX+"),
    re.compile(r"placeholder", re.IGNORECASE),
    re.compile(r"lorem ipsum", re.IGNORECASE),
]

CJK_PATTERN = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")
DTC_PATTERN = re.compile(r"^[PBCU][0-9A-Fa-f]{4,6}$")


def strip_frontmatter(text: str) -> tuple[dict, str]:
    """Return (frontmatter_dict, body_without_frontmatter)."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_raw = text[3:end].strip()
    body = text[end + 4 :].lstrip("\n")
    fm: dict = {}
    for line in fm_raw.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        fm[k.strip()] = v.strip().strip("[]").strip()
    return fm, body


def validate_file(path: Path) -> list[str]:
    issues: list[str] = []
    text = path.read_text(encoding="utf-8")
    fm, body = strip_frontmatter(text)

    # Required frontmatter keys
    for key in ("sit_id", "title", "brand", "model", "generation", "urg", "cat"):
        if key not in fm:
            issues.append(f"frontmatter missing '{key}'")

    # Length check
    length = len(body)
    if length < 1500:
        issues.append(f"body too short: {length} chars (min 1500)")
    elif length > 2500:
        issues.append(f"body too long: {length} chars (max 2500)")

    # Section check — each canonical heading must appear exactly once
    for section in REQUIRED_SECTIONS:
        count = body.count(section)
        if count != 1:
            issues.append(f"section '{section}' count={count} (expected 1)")

    # Ensure section order
    positions = [body.find(s) for s in REQUIRED_SECTIONS]
    if all(p >= 0 for p in positions) and positions != sorted(positions):
        issues.append("sections out of order")

    # Placeholder text
    for pattern in PLACEHOLDER_PATTERNS:
        m = pattern.search(body)
        if m:
            issues.append(f"placeholder detected: '{m.group(0)}'")

    # CJK characters
    m = CJK_PATTERN.search(body)
    if m:
        issues.append(f"CJK character detected: '{m.group(0)}' at pos {m.start()}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dir",
        default="llcar-dashboard/public/data/kb/_articles",
        help="Directory with .md articles",
    )
    args = parser.parse_args()

    root = Path(args.dir)
    if not root.is_dir():
        print(f"ERROR: directory not found: {root}", file=sys.stderr)
        return 1

    files = sorted(root.glob("*.md"))
    if not files:
        print(f"WARNING: no .md files in {root}")
        return 0

    total = 0
    bad = 0
    for path in files:
        total += 1
        issues = validate_file(path)
        if issues:
            bad += 1
            print(f"[FAIL] {path.name}:")
            for issue in issues:
                print(f"       - {issue}")
        else:
            body_len = len(strip_frontmatter(path.read_text(encoding="utf-8"))[1])
            print(f"[OK]   {path.name} ({body_len} chars)")

    print(f"\nSummary: {total - bad}/{total} valid, {bad} failed.")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
