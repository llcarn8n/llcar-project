#!/usr/bin/env python3
"""S18 import model-level DTC notes from D:/transfer4.

Source: D:/transfer4/knowledge-base/brands/{brand}/models/{model}/dtc.json
        structure: { "brand": ..., "model": ..., "codes": { "CODE": {note_ru, common_fix, ...} } }

Target: llcar-dashboard/public/data/kb/{brand}/{model}/{gen}/dtc_brand_notes.json
        structure: { "brand": ..., "model": ..., "codes": { ... } }  (same, per gen)

Also brand-level: D:/transfer4/knowledge-base/brands/{brand}/dtc-brand.json → llcar-dashboard/public/data/kb/{brand}/_brand_dtc.json
"""
from __future__ import annotations
import argparse, io, json, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def load_brand_map(path):
    if not path.is_file():
        return {"brands": {}, "models": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"brands": {}, "models": {}}


def resolve_brand_dst(b, m):
    return m.get("brands", {}).get(b, b)


def resolve_model_dst(b, mdl, m):
    key = f"{b}/{mdl}"
    mapped = m.get("models", {}).get(key)
    if mapped:
        return mapped.split("/", 1)[-1]
    return mdl


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="D:/transfer4/knowledge-base/brands")
    p.add_argument("--dst", default="llcar-dashboard/public/data/kb")
    p.add_argument("--brand-map", default="scripts/transfer4_brand_mapping.json")
    args = p.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    bm = load_brand_map(Path(args.brand_map))

    brand_written = 0
    model_written = 0
    total_codes = 0

    for brand_dir in sorted(src.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        src_brand = brand_dir.name
        dst_brand = resolve_brand_dst(src_brand, bm)
        dst_brand_dir = dst / dst_brand
        if not dst_brand_dir.is_dir():
            continue

        # Brand-level
        bp = brand_dir / "dtc-brand.json"
        if bp.is_file():
            try:
                bd = json.loads(bp.read_text(encoding="utf-8"))
                codes = bd.get("codes") if isinstance(bd, dict) else None
                if codes:
                    (dst_brand_dir / "_brand_dtc.json").write_text(
                        json.dumps(bd, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                    brand_written += 1
                    total_codes += len(codes) if isinstance(codes, (dict, list)) else 0
            except Exception:
                pass

        # Model-level
        models_dir = brand_dir / "models"
        if not models_dir.is_dir():
            continue
        for src_model_dir in sorted(models_dir.iterdir()):
            if not src_model_dir.is_dir():
                continue
            src_model = src_model_dir.name
            dp = src_model_dir / "dtc.json"
            if not dp.is_file():
                continue
            dst_model = resolve_model_dst(src_brand, src_model, bm)
            dst_model_dir = dst_brand_dir / dst_model
            if not dst_model_dir.is_dir():
                continue
            try:
                dd = json.loads(dp.read_text(encoding="utf-8"))
                codes = dd.get("codes") if isinstance(dd, dict) else None
                if not codes:
                    continue
                count = len(codes) if isinstance(codes, (dict, list)) else 0
                gens = [d for d in dst_model_dir.iterdir() if d.is_dir()]
                for gen in gens:
                    (gen / "dtc_brand_notes.json").write_text(
                        json.dumps(dd, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                    model_written += 1
                    total_codes += count
            except Exception:
                pass

    print(f"brand-level files: {brand_written}, model-level files: {model_written}, total_codes: {total_codes}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
