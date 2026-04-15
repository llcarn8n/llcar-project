#!/usr/bin/env python3
"""S18 cleanup — rename ugly gen dir names + dedupe identical situations.json.

Ugly patterns:
  - ends with '_stub', '_0', '_present'
  - contains triple underscore '__'
  - overly long (>30 chars)

Actions:
  1. Dedup: hash situations.json across model's gens; if two gens have identical content,
     keep the clean-named one, delete the ugly duplicate.
  2. Rename: if dir still has ugly name after dedup, rename to `gen_{year}` extracted from name
     (e.g., 'ssangyong__musso__musso_2018_present_0' → 'gen_2018'), fallback to first 20 chars.
"""
from __future__ import annotations
import argparse, hashlib, io, re, shutil, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

UGLY_RE = re.compile(r"(__|_stub$|_0$|_present|^[a-z_]+_\d+_\d+_\d+)", re.I)
YEAR_RE = re.compile(r"(19\d{2}|20\d{2})")


def is_ugly(name: str) -> bool:
    if len(name) > 30:
        return True
    if UGLY_RE.search(name):
        return True
    return False


def extract_year(name: str) -> str | None:
    m = YEAR_RE.search(name)
    return m.group(1) if m else None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    kb = Path(args.kb).resolve()

    renamed = 0
    removed_dups = 0
    collisions = 0

    for brand in sorted(kb.iterdir()):
        if not brand.is_dir() or brand.name.startswith("_"):
            continue
        for model in brand.iterdir():
            if not model.is_dir():
                continue
            gens = [g for g in model.iterdir() if g.is_dir()]
            if not gens:
                continue

            # Dedup by situations.json hash — prefer clean-named gen
            by_hash: dict[str, list[Path]] = {}
            for g in gens:
                sp = g / "situations.json"
                if not sp.is_file():
                    continue
                h = hashlib.md5(sp.read_bytes()).hexdigest()
                by_hash.setdefault(h, []).append(g)
            for h, dup_list in by_hash.items():
                if len(dup_list) <= 1:
                    continue
                # Keep the cleanest-named one
                dup_list.sort(key=lambda g: (is_ugly(g.name), len(g.name)))
                keeper = dup_list[0]
                for dup in dup_list[1:]:
                    print(f"  DUP: {dup} → removing (keeper={keeper.name})")
                    if not args.dry_run:
                        shutil.rmtree(dup)
                    removed_dups += 1

            # Rename remaining ugly dirs
            for g in list(model.iterdir()):
                if not g.is_dir():
                    continue
                if not is_ugly(g.name):
                    continue
                year = extract_year(g.name)
                new_name = f"gen_{year}" if year else g.name[:20]
                # Avoid collision
                if (model / new_name).exists() and (model / new_name) != g:
                    print(f"  COLLIDE: {g.name} → {new_name} exists, skipping")
                    collisions += 1
                    continue
                print(f"  RENAME: {g.name} → {new_name}")
                if not args.dry_run:
                    g.rename(model / new_name)
                renamed += 1

    print(f"\nTOTAL: removed_dups={removed_dups}, renamed={renamed}, collisions={collisions}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
