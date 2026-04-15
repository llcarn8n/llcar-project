#!/usr/bin/env python3
"""S18 P2 — generate manual_meta.json + images.json per generation.

manual_meta.json: { "source_path": "...", "size_bytes": N, "has_pdf": bool,
                    "has_dita": bool, "chunks": {...} }
images.json: [{filename, relative_path, size, category}]

Lightweight — no bulk copy, just metadata index.
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
    p.add_argument("--images-max", type=int, default=500, help="Max images to index per gen")
    p.add_argument("--report", default=".omc/state/s18-p2-manualmeta-report.md")
    args = p.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    bm = load_brand_map(Path(args.brand_map))

    manual_written = 0
    images_written = 0
    total_images_indexed = 0
    log = [f"# S18 P2 manual_meta + images.json"]

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
            dst_model = resolve_model_dst(src_brand, src_model, bm)
            dst_model_dir = dst / dst_brand / dst_model
            if not dst_model_dir.is_dir():
                continue

            # Manual meta
            manual = src_model_dir / "manual.md"
            dita = src_model_dir / "18-dita-manual.json"
            pdf_dir = src_model_dir / "pdfs"
            has_pdf = pdf_dir.is_dir() and any(pdf_dir.glob("*.pdf"))
            manual_meta = None
            if manual.is_file() or dita.is_file():
                manual_meta = {
                    "brand": dst_brand,
                    "model": dst_model,
                    "source_path_rel": f"{src_brand}/models/{src_model}/",
                    "manual_md_size": manual.stat().st_size if manual.is_file() else 0,
                    "has_dita": dita.is_file(),
                    "has_pdf": has_pdf,
                    "variants": sorted([p.name for p in src_model_dir.glob("manual-*.md")])[:10],
                }

            # Images index
            images_dir = src_model_dir / "images"
            images_idx = []
            if images_dir.is_dir():
                for img in sorted(images_dir.iterdir())[:args.images_max]:
                    if img.is_file() and img.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
                        images_idx.append({
                            "filename": img.name,
                            "size": img.stat().st_size,
                            "source_rel": f"{src_brand}/models/{src_model}/images/{img.name}",
                        })

            # Write per gen
            gens = [d for d in dst_model_dir.iterdir() if d.is_dir()]
            for gen in gens:
                if manual_meta:
                    (gen / "manual_meta.json").write_text(
                        json.dumps(manual_meta, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                    manual_written += 1
                if images_idx:
                    (gen / "images.json").write_text(
                        json.dumps(images_idx, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                    images_written += 1
                    total_images_indexed += len(images_idx)

    log.append(f"\nTOTAL: manual_meta={manual_written} images.json={images_written} "
               f"indexed_images={total_images_indexed}")
    txt = "\n".join(log)
    print(txt)
    if args.report:
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(txt, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
