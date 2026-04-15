#!/usr/bin/env python3
"""Move per-gen model-level files UP to model-level dir, dedupe.

Files that are model-level (same in every gen of a model):
  parts-catalog.json, reviews.md, manual_meta.json, images.json

After this script:
  {brand}/{model}/parts-catalog.json  — one file per model
  {brand}/{model}/reviews.md
  {brand}/{model}/manual_meta.json
  {brand}/{model}/images.json

  {brand}/{model}/{gen}/situations.json  — per-gen (unchanged)
  {brand}/{model}/{gen}/videos.json      — per-gen (unchanged)
  {brand}/{model}/{gen}/dtc.json         — per-gen (unchanged, auto-generated)
"""
from __future__ import annotations
import hashlib, io, json, shutil, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

MODEL_LEVEL_FILES = ["parts-catalog.json", "reviews.md", "manual_meta.json", "images.json"]


def main():
    kb = Path("llcar-dashboard/public/data/kb").resolve()
    moved = 0
    deleted_dups = 0

    for brand in sorted(kb.iterdir()):
        if not brand.is_dir() or brand.name.startswith("_"):
            continue
        for model in brand.iterdir():
            if not model.is_dir():
                continue
            gens = [d for d in model.iterdir() if d.is_dir()]
            if not gens:
                continue

            for fname in MODEL_LEVEL_FILES:
                # Collect all per-gen copies of this file
                gen_copies: list[Path] = []
                for g in gens:
                    f = g / fname
                    if f.is_file():
                        gen_copies.append(f)
                if not gen_copies:
                    continue

                # Pick canonical content (by hash majority; first if tied)
                hashes: dict[str, list[Path]] = {}
                for c in gen_copies:
                    h = hashlib.md5(c.read_bytes()).hexdigest()
                    hashes.setdefault(h, []).append(c)
                best_hash = max(hashes, key=lambda h: len(hashes[h]))
                canonical = hashes[best_hash][0]

                # Move canonical to model dir if not present
                target = model / fname
                if not target.is_file():
                    shutil.copy2(canonical, target)
                    moved += 1

                # Delete all gen-level copies
                for c in gen_copies:
                    c.unlink()
                    deleted_dups += 1

    print(f"Model-level files moved: {moved}")
    print(f"Per-gen duplicates deleted: {deleted_dups}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
