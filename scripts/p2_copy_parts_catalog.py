#!/usr/bin/env python3
"""S18 P2 — copy parts-catalog.json from D:/transfer4 to llcar KB per generation.

Source: D:/transfer4/knowledge-base/brands/{brand}/models/{model}/parts-catalog.json
Target: llcar-dashboard/public/data/kb/{brand}/{model}/{gen}/parts-catalog.json
       (same file copied to each gen dir of that model — parts are model-level)

Optionally caps parts list to top-N (default 200) to limit size.
"""
from __future__ import annotations
import argparse
import io
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def load_brand_map(path: Path) -> dict:
    if not path.is_file():
        return {"brands": {}, "models": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"brands": {}, "models": {}}


def resolve_brand_dst(b: str, m: dict) -> str:
    return m.get("brands", {}).get(b, b)


def resolve_model_dst(b: str, mdl: str, m: dict) -> str:
    key = f"{b}/{mdl}"
    mapped = m.get("models", {}).get(key)
    if mapped:
        return mapped.split("/", 1)[-1]
    return mdl


def cap_parts(data, max_parts: int):
    """Cap parts list to max_parts, keep everything else.
    Accepts dict {parts:[]} or raw list."""
    if isinstance(data, list):
        data = {"parts": data, "total_parts": len(data)}
    parts = data.get("parts")
    if not isinstance(parts, list) or len(parts) <= max_parts:
        return data
    # Prefer parts with prices or articul, else first max_parts
    def score(p):
        if not isinstance(p, dict):
            return 0
        s = 0
        if p.get("price") or p.get("price_rub"):
            s += 10
        if p.get("article") or p.get("articul") or p.get("oem_part_number"):
            s += 5
        if p.get("category") or p.get("system"):
            s += 2
        return s
    parts_sorted = sorted(parts, key=score, reverse=True)
    out = dict(data)
    out["parts"] = parts_sorted[:max_parts]
    out["parts_total_original"] = len(parts)
    out["parts_capped"] = True
    return out


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="D:/transfer4/knowledge-base/brands")
    p.add_argument("--dst", default="llcar-dashboard/public/data/kb")
    p.add_argument("--brand-map", default="scripts/transfer4_brand_mapping.json")
    p.add_argument("--max-parts", type=int, default=200)
    p.add_argument("--report", default=".omc/state/s18-p2-parts-report.md")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    bm = load_brand_map(Path(args.brand_map))

    written = 0
    skipped_no_src = 0
    skipped_no_dst = 0
    total_parts = 0
    log = [f"# S18 P2 parts-catalog copy (max_parts={args.max_parts}, dry={args.dry_run})"]

    for brand_dir in sorted(src.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        src_brand = brand_dir.name
        dst_brand = resolve_brand_dst(src_brand, bm)
        models_dir = brand_dir / "models"
        if not models_dir.is_dir():
            continue
        for src_model_dir in sorted(models_dir.iterdir()):
            if not src_model_dir.is_dir():
                continue
            src_model = src_model_dir.name
            pc = src_model_dir / "parts-catalog.json"
            if not pc.is_file():
                continue
            dst_model = resolve_model_dst(src_brand, src_model, bm)
            dst_model_dir = dst / dst_brand / dst_model
            if not dst_model_dir.is_dir():
                skipped_no_dst += 1
                continue
            # Load + cap
            try:
                data = json.loads(pc.read_text(encoding="utf-8"))
            except Exception as e:
                log.append(f"  ERR {src_brand}/{src_model}: {e}")
                continue
            capped = cap_parts(data, args.max_parts)
            parts_count = len(capped.get("parts", []) if isinstance(capped.get("parts"), list) else [])
            # Copy to each gen dir
            gens = [d for d in dst_model_dir.iterdir() if d.is_dir()]
            for gen in gens:
                out_path = gen / "parts-catalog.json"
                if not args.dry_run:
                    out_path.write_text(
                        json.dumps(capped, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                written += 1
                total_parts += parts_count
            log.append(f"  {dst_brand}/{dst_model}: {len(gens)} gens × {parts_count} parts")

    log.append(
        f"\n## TOTAL: {written} files written ({'dry' if args.dry_run else 'real'}), "
        f"total_parts={total_parts}, skipped_no_dst={skipped_no_dst}"
    )
    txt = "\n".join(log)
    print(txt[-2000:])
    if args.report:
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(txt, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
