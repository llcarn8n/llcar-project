"""Find vehicles.json models that have NO entry in kb-generations-index.json,
but whose underlying folder actually exists somewhere under the same brand.

Usage: python scripts/audit_missing_kb_models.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[1]
VEHICLES = ROOT / "src" / "data" / "vehicles.json"
KB_INDEX = ROOT / "src" / "data" / "kb-generations-index.json"
KB_DIR = ROOT / "public" / "data" / "kb"


def normalize(name: str) -> str:
    s = name.lower().replace(" ", "_")
    return re.sub(r"[^a-z0-9_]", "", s)


def main() -> None:
    with VEHICLES.open(encoding="utf-8") as f:
        vehicles = json.load(f)
    with KB_INDEX.open(encoding="utf-8") as f:
        kb_index = json.load(f)

    kb_brands = kb_index.get("brands", {})
    missing: list[tuple[str, str, str]] = []  # (brand_id, model_name, discovered_path)
    hidden: list[tuple[str, str, str]] = []   # model exists under a different parent

    for brand in vehicles:
        brand_id = brand["id"]
        kb_brand = kb_brands.get(brand_id)
        kb_models = (kb_brand or {}).get("models", {})

        for model in brand["models"]:
            # vehicles.json id is brand-prefixed: "chery_tiggo_7"
            model_raw = model["name"]
            norm = normalize(model_raw)

            if norm in kb_models:
                continue  # OK — directly indexed

            # Not found at top level — search recursively for a folder with that
            # slug anywhere under the brand's KB tree.
            brand_dir = KB_DIR / brand_id
            if not brand_dir.exists():
                missing.append((brand_id, model_raw, "<no brand dir>"))
                continue

            found_path = None
            for candidate in brand_dir.rglob(norm):
                if candidate.is_dir():
                    manual = candidate / "manual.md"
                    if manual.exists():
                        rel = candidate.relative_to(KB_DIR).as_posix()
                        found_path = rel
                        break
            if found_path:
                hidden.append((brand_id, model_raw, found_path))
            else:
                missing.append((brand_id, model_raw, "<not on disk>"))

    print(f"=== HIDDEN (manual exists but UI can't reach) — {len(hidden)} ===")
    for b, m, p in hidden:
        print(f"  {b}/{m!r}  -->{p}")
    print()
    print(f"=== MISSING (no manual on disk at all) — {len(missing)} ===")
    for b, m, p in missing[:40]:
        print(f"  {b}/{m!r}  ({p})")
    if len(missing) > 40:
        print(f"  ...and {len(missing) - 40} more")


if __name__ == "__main__":
    main()
