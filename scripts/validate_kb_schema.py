#!/usr/bin/env python3
"""
Validate all situations.json across the KB against a strict schema.

Checks each situation:
- Required fields: id, title, qa, urg, cat, dtc_codes, solutions, content_type
- urg: int 1-5
- cat: must be in CAT_ENUM
- dtc_codes: list of strings matching ^[PBCU][0-9A-Fa-f]{4,6}$
- solutions: non-empty list of strings
- content_type: must be in {diagnostic, guide, full_article}
- If content_type == full_article → full_article_path must exist and file present
- qa: string, 50-5000 chars
- id: unique per file
- No CJK characters anywhere

Usage:
    python scripts/validate_kb_schema.py [--kb llcar-dashboard/public/data/kb]

Exit code 0 if all valid, 1 otherwise. Prints per-file summary + details on failures.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

CAT_ENUM = {
    "engine", "transmission", "chassis", "electrical", "cooling",
    "brakes", "ac", "fuel", "steering", "body",
}

CONTENT_TYPE_ENUM = {"diagnostic", "guide", "full_article"}

# Accept standard OBD-II (P/B/C/U + 4-6 hex) OR manufacturer-specific
# 4-8 hex codes used by BMW ISTA, Mercedes XENTRY, VAG long-form (e.g. B108454).
DTC_RE = re.compile(r"^(?:[PBCU][0-9A-Fa-f]{4,6}|[0-9A-Fa-f]{4,8})$")
CJK_RE = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")


def validate_situation(s: dict, file_path: Path, kb_root: Path) -> list[str]:
    issues: list[str] = []
    sid = s.get("id", "<no-id>")

    # Required fields
    for field in ("id", "title", "qa", "urg", "cat", "solutions", "content_type"):
        if field not in s:
            issues.append(f"[{sid}] missing required field '{field}'")

    # urg range
    urg = s.get("urg")
    if not isinstance(urg, int) or not (1 <= urg <= 5):
        issues.append(f"[{sid}] urg must be int 1-5, got {urg!r}")

    # cat enum
    cat = s.get("cat")
    if cat and cat not in CAT_ENUM:
        issues.append(f"[{sid}] cat '{cat}' not in enum {sorted(CAT_ENUM)}")

    # content_type enum
    ct = s.get("content_type")
    if ct and ct not in CONTENT_TYPE_ENUM:
        issues.append(f"[{sid}] content_type '{ct}' not in enum {sorted(CONTENT_TYPE_ENUM)}")

    # full_article_path presence + file existence
    if ct == "full_article":
        fap = s.get("full_article_path")
        if not fap:
            issues.append(f"[{sid}] content_type=full_article but full_article_path missing")
        else:
            # Resolve relative to kb_root
            article_path = kb_root / fap
            if not article_path.is_file():
                issues.append(f"[{sid}] full_article_path '{fap}' — file not found at {article_path}")

    # DTC codes format
    dtc_codes = s.get("dtc_codes", [])
    if not isinstance(dtc_codes, list):
        issues.append(f"[{sid}] dtc_codes must be list")
    else:
        for code in dtc_codes:
            if not isinstance(code, str) or not DTC_RE.match(code):
                issues.append(f"[{sid}] invalid DTC code: {code!r}")

    # solutions non-empty list
    solutions = s.get("solutions", [])
    if not isinstance(solutions, list) or len(solutions) == 0:
        issues.append(f"[{sid}] solutions must be non-empty list")
    else:
        for i, sol in enumerate(solutions):
            if not isinstance(sol, str) or len(sol.strip()) < 5:
                issues.append(f"[{sid}] solution[{i}] too short or wrong type")

    # qa length
    qa = s.get("qa", "")
    if not isinstance(qa, str):
        issues.append(f"[{sid}] qa must be string")
    elif len(qa) < 50:
        issues.append(f"[{sid}] qa too short ({len(qa)} chars, min 50)")
    elif len(qa) > 5000:
        issues.append(f"[{sid}] qa too long ({len(qa)} chars, max 5000)")

    # CJK characters
    full_text = f"{s.get('title', '')} {qa} {' '.join(solutions) if isinstance(solutions, list) else ''}"
    m = CJK_RE.search(full_text)
    if m:
        issues.append(f"[{sid}] CJK character detected: '{m.group(0)}'")

    return issues


def validate_file(path: Path, kb_root: Path) -> tuple[int, int, list[str]]:
    """Return (total_situations, invalid_situations, issue_lines)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return (0, 1, [f"{path}: JSON parse error — {e}"])

    if not isinstance(data, list):
        return (0, 1, [f"{path}: root must be array, got {type(data).__name__}"])

    total = len(data)
    bad_sits = 0
    all_issues: list[str] = []

    # Check duplicate IDs
    seen_ids = set()
    for s in data:
        sid = s.get("id")
        if sid in seen_ids:
            all_issues.append(f"{path}: duplicate id '{sid}'")
        seen_ids.add(sid)

    for s in data:
        issues = validate_situation(s, path, kb_root)
        if issues:
            bad_sits += 1
            for issue in issues:
                all_issues.append(f"{path.relative_to(kb_root)}: {issue}")

    return (total, bad_sits, all_issues)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--kb",
        default="llcar-dashboard/public/data/kb",
        help="Root of KB directory",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Print per-file OK lines"
    )
    args = parser.parse_args()

    kb_root = Path(args.kb).resolve()
    if not kb_root.is_dir():
        print(f"ERROR: KB root not found: {kb_root}", file=sys.stderr)
        return 1

    files = sorted(kb_root.rglob("situations.json"))
    if not files:
        print(f"WARNING: no situations.json found under {kb_root}")
        return 0

    total_files = len(files)
    total_sits = 0
    total_bad = 0
    failed_files = 0
    all_issues: list[str] = []

    for path in files:
        t, bad, issues = validate_file(path, kb_root)
        total_sits += t
        total_bad += bad
        if issues:
            failed_files += 1
            all_issues.extend(issues)
            print(f"[FAIL] {path.relative_to(kb_root)}: {bad}/{t} situations invalid")
        elif args.verbose:
            print(f"[OK]   {path.relative_to(kb_root)} ({t} situations)")

    if all_issues:
        print("\n--- Issue details ---")
        for issue in all_issues[:100]:
            print(f"  {issue}")
        if len(all_issues) > 100:
            print(f"  ... and {len(all_issues) - 100} more")

    print(
        f"\nSummary: {total_files - failed_files}/{total_files} files OK, "
        f"{total_sits - total_bad}/{total_sits} situations valid, "
        f"{len(all_issues)} issues total."
    )
    return 0 if total_bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
