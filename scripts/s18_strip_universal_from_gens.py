#!/usr/bin/env python3
"""Strip universal situations from per-gen situations.json.

Universal ситуации уже лежат в public/data/situations-universal.json (одним файлом),
SituationsList.tsx их и так загружает отдельно. В per-gen файлах они — лишний дубль.

Algorithm:
- Load universal IDs from source _common/situations-universal.json (or existing public copy)
- For each per-gen situations.json: filter out records whose id OR (брендспецифичный ETL-prefix+orig_id) matches universal
- If our ETL prefixed IDs like 'camry_xv70_TOYOTA-SW-abc123' → need to match by suffix after first segment
"""
from __future__ import annotations
import argparse, io, json, sys, re
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def extract_original_id(etl_id: str) -> str:
    """ETL made ids like '{model}_{orig_id}'. Try to extract the original part."""
    # Our ETL prefixed with dst_model_name + "_" + sanitized orig id
    # Source IDs: 'yt_c5214a85', 'TOYOTA-SW-abc123'
    # After sanitization they become lowercase+underscores
    # Best match: try last alphanumeric chunk (hash)
    # Fallback: return raw
    return etl_id


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    p.add_argument("--universal", default="llcar-dashboard/public/data/situations-universal.json")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    kb = Path(args.kb).resolve()
    uni_path = Path(args.universal).resolve()
    if not uni_path.is_file():
        print(f"ERROR: universal file not found: {uni_path}", file=sys.stderr)
        return 1

    universal = json.loads(uni_path.read_text(encoding="utf-8"))
    if not isinstance(universal, list):
        print("ERROR: universal is not a list", file=sys.stderr)
        return 1

    # Build universal ID set + title-key matcher (case: title+first DTC as fingerprint)
    uni_ids: set[str] = set()
    uni_fingerprints: set[str] = set()
    for u in universal:
        if not isinstance(u, dict):
            continue
        if u.get("id"):
            uni_ids.add(str(u["id"]).lower())
        # Fingerprint: title + first DTC
        title = (u.get("title") or "").strip().lower()[:80]
        dtc = u.get("dtc") or u.get("dtc_codes") or []
        dtc_key = (dtc[0] if isinstance(dtc, list) and dtc else "")
        fp = f"{title}|{dtc_key}"
        if len(title) > 10:
            uni_fingerprints.add(fp)

    files_scanned = 0
    total_before = 0
    total_after = 0
    records_stripped = 0
    for sp in kb.rglob("situations.json"):
        try:
            data = json.loads(sp.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        files_scanned += 1
        total_before += len(data)
        filtered = []
        for s in data:
            if not isinstance(s, dict):
                continue
            sid = str(s.get("id", "")).lower()
            # Check by direct ID match
            if sid in uni_ids:
                records_stripped += 1
                continue
            # Check by ID substring (ETL prefixed our orig ids)
            is_universal = False
            for uid in uni_ids:
                if len(uid) > 8 and uid in sid:
                    is_universal = True
                    break
            if is_universal:
                records_stripped += 1
                continue
            # Check by fingerprint
            title = (s.get("title") or "").strip().lower()[:80]
            dtc = s.get("dtc_codes") or []
            dtc_key = (dtc[0] if isinstance(dtc, list) and dtc else "")
            fp = f"{title}|{dtc_key}"
            if len(title) > 10 and fp in uni_fingerprints:
                records_stripped += 1
                continue
            filtered.append(s)
        total_after += len(filtered)
        if len(filtered) != len(data) and not args.dry_run:
            sp.write_text(
                json.dumps(filtered, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

    print(f"Files scanned: {files_scanned}")
    print(f"Records: {total_before} → {total_after} (stripped {records_stripped}, {records_stripped*100/total_before:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
