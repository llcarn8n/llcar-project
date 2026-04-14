#!/usr/bin/env python3
"""
Merge Li Auto DTC titles (36k universal OBD-II codes) into _dtc_index.json.

Source: D:/transfer4/knowledge-base/export/dtc-index.json
    { "meta": {...}, "codes": { "B0001": { "severity": "critical",
      "title_ru": "...", "system_id": "sensors", "can_drive": "no_stop" }, ... } }

Target: llcar-dashboard/public/data/kb/_dtc_index.json
    { "generated_at": "...", "total_codes": N, "total_mappings": M,
      "index": { "CODE": [ { sit_id, title, brand, model, generation, urg, cat }, ... ] } }

Strategy:
    Add a new top-level field `titles` in _dtc_index.json, mapping CODE → {title_ru, severity, system_id}
    This preserves the existing `index` untouched; the frontend DtcSearch can look up titles
    by code from `titles` as enrichment.

Usage:
    python scripts/merge_liauto_dtc_codes.py
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

DTC_RE = re.compile(r"^[PBCU][0-9A-Fa-f]{4,6}$")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="D:/transfer4/knowledge-base/export/dtc-index.json")
    parser.add_argument("--dst", default="llcar-dashboard/public/data/kb/_dtc_index.json")
    args = parser.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    if not src.is_file():
        print(f"ERROR: {src} not found", file=sys.stderr)
        return 1
    if not dst.is_file():
        print(f"ERROR: {dst} not found", file=sys.stderr)
        return 1

    src_data = json.loads(src.read_text(encoding="utf-8"))
    dst_data = json.loads(dst.read_text(encoding="utf-8"))

    src_codes = src_data.get("codes", {})
    titles: dict[str, dict] = {}
    dropped = 0
    for code, meta in src_codes.items():
        if not isinstance(meta, dict):
            continue
        # Filter to valid OBD-II format only
        if not DTC_RE.match(code):
            dropped += 1
            continue
        entry = {
            "title_ru": meta.get("title_ru", ""),
            "severity": meta.get("severity", ""),
            "system_id": meta.get("system_id", ""),
            "can_drive": meta.get("can_drive", ""),
        }
        # Drop empty entries
        if not entry["title_ru"]:
            continue
        titles[code] = entry

    # Preserve existing fields, add titles
    dst_data["titles"] = titles
    dst_data["titles_total"] = len(titles)
    dst_data["titles_source"] = "liauto_export_v1"

    dst.write_text(
        json.dumps(dst_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    index_size = len(dst_data.get("index", {}))
    print(
        f"Merged: {len(titles)} DTC titles added to _dtc_index.json "
        f"(existing index: {index_size} codes with situation refs, dropped invalid: {dropped})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
