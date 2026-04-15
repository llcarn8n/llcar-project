#!/usr/bin/env python3
"""Consolidate DTC sources:
- _dtc_index.json (light): universal titles + sit_refs index (kept small, fetched always)
- {brand}/_dtc.json: ONE file per brand containing brand-level + all model-level codes
  (fetched lazy when user selects a brand — UI already loads per-brand data)

Removes separate _brand_dtc.json and _model_dtc.json files.
"""
from __future__ import annotations
import argparse, io, json, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    args = p.parse_args()

    kb = Path(args.kb).resolve()
    idx_path = kb / "_dtc_index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    # Drop heavy fields if previously added
    idx.pop("brands", None)
    idx.pop("models", None)
    idx.pop("brands_count", None)
    idx.pop("models_count", None)

    # Per-brand aggregator
    per_brand_dtc: dict[str, dict] = {}

    # Brand-level files
    for bdp in kb.glob("*/_brand_dtc.json"):
        try:
            d = json.loads(bdp.read_text(encoding="utf-8"))
            codes = d.get("codes") if isinstance(d, dict) else None
            if codes:
                brand = bdp.parent.name
                per_brand_dtc.setdefault(brand, {"brand_codes": {}, "models": {}})
                per_brand_dtc[brand]["brand_codes"] = codes
            bdp.unlink()
        except Exception:
            pass

    # Model-level files
    for mdp in kb.glob("*/*/_model_dtc.json"):
        try:
            d = json.loads(mdp.read_text(encoding="utf-8"))
            codes = d.get("codes") if isinstance(d, dict) else None
            if codes:
                brand = mdp.parent.parent.name
                model = mdp.parent.name
                per_brand_dtc.setdefault(brand, {"brand_codes": {}, "models": {}})
                per_brand_dtc[brand]["models"][model] = codes
            mdp.unlink()
        except Exception:
            pass

    # Write per-brand consolidated DTC
    total_brand_codes = 0
    total_model_codes = 0
    for brand, data in per_brand_dtc.items():
        out_path = kb / brand / "_dtc.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        total_brand_codes += len(data.get("brand_codes", {}))
        total_model_codes += sum(len(m) for m in data.get("models", {}).values())

    # Save _dtc_index.json without heavy fields
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    idx_size = idx_path.stat().st_size
    print(f"Per-brand DTC files: {len(per_brand_dtc)} (total brand_codes={total_brand_codes}, model_codes={total_model_codes})")
    print(f"_dtc_index.json: {idx_size/1024/1024:.2f} MB (universal titles + sit refs only)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
