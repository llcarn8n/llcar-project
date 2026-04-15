#!/usr/bin/env python3
"""S18 P2 — copy reviews.md from D:/transfer4 to llcar KB per generation."""
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
    p.add_argument("--max-size", type=int, default=50000, help="Max bytes per reviews.md")
    p.add_argument("--report", default=".omc/state/s18-p2-reviews-report.md")
    args = p.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    bm = load_brand_map(Path(args.brand_map))

    written = 0
    skipped = 0
    truncated = 0
    log = [f"# S18 P2 reviews.md copy (max_size={args.max_size}B)"]

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
            rv = src_model_dir / "reviews.md"
            if not rv.is_file():
                continue
            dst_model = resolve_model_dst(src_brand, src_model, bm)
            dst_model_dir = dst / dst_brand / dst_model
            if not dst_model_dir.is_dir():
                skipped += 1
                continue
            try:
                text = rv.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            if len(text) > args.max_size:
                text = text[:args.max_size] + "\n\n---\n(Truncated — see D:/transfer4 for full)"
                truncated += 1
            gens = [d for d in dst_model_dir.iterdir() if d.is_dir()]
            for gen in gens:
                (gen / "reviews.md").write_text(text, encoding="utf-8")
                written += 1

    log.append(f"\nTOTAL: written={written} skipped_no_dst={skipped} truncated={truncated}")
    txt = "\n".join(log)
    print(txt[-1000:])
    if args.report:
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(txt, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
