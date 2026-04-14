#!/usr/bin/env python3
"""
Fix KB schema issues surfaced by validate_kb_schema.py.

Strategy (Session 16 P3 Hybrid):
1. DTC codes:
   - Map manufacturer internals to OBD-II equivalents via OBD_II_MAP (preserve original
     in manufacturer_code list).
   - Drop anything else that does not match DTC_RE (cyrillic mojibake, '-', 'None',
     empty, single letters, non-hex strings, 11-digit part numbers, etc.).
2. Specific situation fixes:
   - Toyota Camry XV40 _008: fill urg=3 + default solutions.

Usage:
    python scripts/fix_kb_schema.py [--kb llcar-dashboard/public/data/kb] [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

DTC_RE = re.compile(r"^(?:[PBCU][0-9A-Fa-f]{4,6}|[0-9A-Fa-f]{4,8})$")

# Manufacturer internal → OBD-II equivalent
OBD_II_MAP = [
    (re.compile(r"^ECM-\d+$", re.I), "P0606"),      # ECM processor
    (re.compile(r"^HVB-\d+$", re.I), "P0A80"),      # HV battery deterioration
    (re.compile(r"^BMS-\d+$", re.I), "P0A80"),      # battery management system
    (re.compile(r"^ABS-\d+$", re.I), "C0035"),      # ABS wheel speed sensor
    (re.compile(r"^AWD-\d+$", re.I), "C0800"),      # AWD module
    (re.compile(r"^4WD-\d+$", re.I), "C0800"),
    (re.compile(r"^STC-\d+$", re.I), "C0561"),      # stability / traction control
    (re.compile(r"^ECT-\d+$", re.I), "P0115"),      # engine coolant temp
    (re.compile(r"^P4WD\d+$", re.I), "C0800"),      # BMW-style 4WD placeholder
]


def fix_dtc_list(codes: list) -> tuple[list[str], list[str]]:
    """
    Return (kept, original_mapped) where:
      kept — list of valid OBD-II codes (after mapping / filtering),
      original_mapped — original non-standard codes that we remapped (kept for
                        optional manufacturer_code field, not used by schema yet).
    """
    kept: list[str] = []
    seen: set[str] = set()
    original_mapped: list[str] = []

    if not isinstance(codes, list):
        return kept, original_mapped

    for raw in codes:
        if not isinstance(raw, str):
            continue
        c = raw.strip()
        if not c:
            continue
        # Already valid?
        if DTC_RE.match(c):
            if c not in seen:
                kept.append(c)
                seen.add(c)
            continue
        # Try manufacturer map
        mapped = None
        for pattern, target in OBD_II_MAP:
            if pattern.match(c):
                mapped = target
                break
        if mapped:
            original_mapped.append(c)
            if mapped not in seen:
                kept.append(mapped)
                seen.add(mapped)
            continue
        # Otherwise drop (mojibake, '-', 'None', 'B16XX', hex with 0x prefix,
        # long part numbers, cyrillic placeholders, single chars, etc.)
    return kept, original_mapped


SPECIFIC_SITUATION_PATCHES = {
    # path_relative_to_kb_root: {sit_id: patch_dict}
    "toyota/camry/xv40_2006/situations.json": {
        "toyota_camry_xv40_008": {
            "urg": 3,
            "solutions": [
                "Сверить с руководством пользователя по эксплуатации автомобиля",
                "Обратиться к официальному дилеру Toyota для диагностики",
            ],
        },
    },
}


def apply_specific_patch(rel_path: str, sit: dict) -> bool:
    patches = SPECIFIC_SITUATION_PATCHES.get(rel_path.replace("\\", "/"))
    if not patches:
        return False
    patch = patches.get(sit.get("id"))
    if not patch:
        return False
    changed = False
    for k, v in patch.items():
        if sit.get(k) != v:
            sit[k] = v
            changed = True
    return changed


def process_file(path: Path, kb_root: Path, dry_run: bool) -> dict:
    rel = str(path.relative_to(kb_root))
    stats = {"file": rel, "dtc_fixed": 0, "dtc_dropped": 0, "mapped": 0, "patched": 0}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return stats
    if not isinstance(data, list):
        return stats

    changed = False
    for sit in data:
        before_codes = sit.get("dtc_codes", [])
        if isinstance(before_codes, list):
            kept, mapped = fix_dtc_list(before_codes)
            if kept != before_codes:
                # Count changes
                before_valid = [c for c in before_codes if isinstance(c, str) and DTC_RE.match(c)]
                dropped = len([c for c in before_codes if isinstance(c, str) and c.strip() and not DTC_RE.match(c)]) - len(mapped)
                stats["dtc_fixed"] += max(0, len(kept) - len(before_valid))
                stats["dtc_dropped"] += max(0, dropped)
                stats["mapped"] += len(mapped)
                sit["dtc_codes"] = kept
                # Preserve original manufacturer codes in optional field
                if mapped:
                    existing = sit.get("manufacturer_code", [])
                    if not isinstance(existing, list):
                        existing = []
                    for m in mapped:
                        if m not in existing:
                            existing.append(m)
                    sit["manufacturer_code"] = existing
                changed = True
        # Solutions: drop empty strings / short garbage
        sols = sit.get("solutions")
        if isinstance(sols, list):
            cleaned = [s for s in sols if isinstance(s, str) and len(s.strip()) >= 5]
            if cleaned != sols and cleaned:
                sit["solutions"] = cleaned
                changed = True
        if apply_specific_patch(rel, sit):
            stats["patched"] += 1
            changed = True

    if changed and not dry_run:
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return stats


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    kb_root = Path(args.kb).resolve()
    if not kb_root.is_dir():
        print(f"ERROR: KB root not found: {kb_root}", file=sys.stderr)
        return 1

    totals = {"dtc_fixed": 0, "dtc_dropped": 0, "mapped": 0, "patched": 0, "files_changed": 0}
    for path in sorted(kb_root.rglob("situations.json")):
        s = process_file(path, kb_root, args.dry_run)
        if s["dtc_fixed"] or s["dtc_dropped"] or s["mapped"] or s["patched"]:
            totals["files_changed"] += 1
            print(f"{s['file']}: dropped={s['dtc_dropped']} mapped={s['mapped']} patched={s['patched']}")
        for k in ("dtc_fixed", "dtc_dropped", "mapped", "patched"):
            totals[k] += s[k]

    print(
        f"\nSummary: files_changed={totals['files_changed']} "
        f"dropped_dtc={totals['dtc_dropped']} mapped={totals['mapped']} patched={totals['patched']}"
    )
    if args.dry_run:
        print("(dry-run, no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
