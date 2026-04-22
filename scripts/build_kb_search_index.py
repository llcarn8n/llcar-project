#!/usr/bin/env python3
"""S28 — build bundled kb-search-index.json for global KB search.

Объединяет:
  - llcar-dashboard/src/data/kb-generations-index.json  (структура kb/ на диске)
  - llcar-dashboard/public/data/brands/<id>.json        (human-readable имена, годы)

Выход: llcar-dashboard/src/data/kb-search-index.json  — плоский массив Fuse-ready
      записей, bundled в SPA. Без этого файла KBGlobalSearch показывает пусто.

Стратегия сопоставления:
  1. Для каждого brand/model/gen из kb-index пытаемся найти запись в brands/<id>.json
     по эвристике нормализации имён (lowercase, убрать пробелы/дефисы/точки).
  2. Если не нашли model — используем slug как human-readable (capitalize).
  3. Если не нашли gen — fallback: genSlug capitalize + годы unknown.

Size check: ожидаемый output 100-200 KB, gzip ~30-40 KB.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
KB_INDEX = ROOT / "llcar-dashboard" / "src" / "data" / "kb-generations-index.json"
BRANDS_DIR = ROOT / "llcar-dashboard" / "public" / "data" / "brands"
BRANDS_INDEX = ROOT / "llcar-dashboard" / "public" / "data" / "brands-index.json"
OUT = ROOT / "llcar-dashboard" / "src" / "data" / "kb-search-index.json"

# BRAND_ALIAS: kb-index brand → brands/*.json brand
# Отражает src/utils/kbPath.ts BRAND_ALIAS (kb-brand → vehicles.brand reverse).
KB_TO_BRANDS: dict[str, str] = {
    "mercedes": "mercedes_benz",
    "li_auto": "li",
    "faw_bestune": "bestune",
}


def normalize(s: str) -> str:
    """Для матчинга: lowercase + убрать всё кроме [a-z0-9]."""
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def match_model(models: list[dict[str, Any]], model_slug: str) -> dict[str, Any] | None:
    """Найти brand.models[].entry по slug.
    Пробуем: id == slug, normalize(name) == normalize(slug), name startswith, etc.
    """
    slug_norm = normalize(model_slug)
    for m in models:
        if m.get("id") == model_slug:
            return m
        if normalize(m.get("id", "")) == slug_norm:
            return m
        if normalize(m.get("name", "")) == slug_norm:
            return m
    # fuzzy: name contains slug without prefix (e.g. "bmw_x5" → "X5")
    for m in models:
        name_n = normalize(m.get("name", ""))
        if name_n and (name_n in slug_norm or slug_norm in name_n):
            return m
    return None


def match_generation(gens: list[dict[str, Any]], gen_slug: str) -> dict[str, Any] | None:
    """Найти brand.models[].generations[].entry по slug.
    Года часто зашиты в slug (e.g. `e70_2007` → матчим по ys=2007).
    Возвращает None если уверенного совпадения нет — caller покажет capitalize_slug,
    чтобы разные gen_slug'и были визуально различны в search dropdown.
    """
    if not gens:
        return None
    # 1. По ID (самое надёжное)
    for g in gens:
        if g.get("id") == gen_slug:
            return g
    # 2. По году в slug (e70_2007 → ys=2007)
    year_match = re.search(r"_(19\d{2}|20\d{2})", gen_slug)
    year = int(year_match.group(1)) if year_match else None
    # 3. По кодовому имени кузова (e70, f15, b8 и т.д.) + опционально год
    chassis_match = re.search(r"\b([a-z]\d{1,3}[a-z]?)\b", gen_slug.lower())
    chassis = chassis_match.group(1) if chassis_match else None

    best_score = 0
    best_gen: dict[str, Any] | None = None
    for g in gens:
        name_low = g.get("name", "").lower()
        score = 0
        if year and g.get("ys") == year:
            score += 3
        if chassis and chassis in name_low:
            score += 4
        # Римские цифры
        roman_match = re.search(r"\b(i{1,3}v?|v|vi{0,3}|ix|x)\b", gen_slug.lower())
        if roman_match and f" {roman_match.group(1)} " in f" {name_low} ":
            score += 2
        if score > best_score:
            best_score = score
            best_gen = g
    # Score threshold: нужно минимум 3 (год ИЛИ chassis), иначе None — unique capitalize fallback
    return best_gen if best_score >= 3 else None


_HEX_SUFFIX_RE = re.compile(r"_[a-f0-9]{6,}$")


def capitalize_slug(slug: str) -> str:
    """Для fallback когда в brands не нашли.
    e.g. "bj60_2023" → "BJ60 2023", "tiggo_7_pro" → "Tiggo 7 Pro".
    Убирает trailing hex-хвосты (например `_d95e08c2` — artifact dedup'а)."""
    # Убираем артефактный hex-suffix (hash от ingest коллизии)
    cleaned = _HEX_SUFFIX_RE.sub("", slug)
    parts = cleaned.split("_")
    out = []
    for p in parts:
        if p.isdigit() and len(p) == 4:
            out.append(p)
        elif len(p) <= 4 and p.isalpha():
            # Кодовые имена кузова (e70, f15, bj40, x5) — все буквы/цифры в верх
            out.append(p.upper())
        else:
            out.append(p.capitalize())
    return " ".join(out)


def main() -> int:
    if not KB_INDEX.exists():
        print(f"ERROR: kb-generations-index.json not found at {KB_INDEX}", file=sys.stderr)
        return 1

    kb_index = json.loads(KB_INDEX.read_text(encoding="utf-8"))
    brands_dict = kb_index.get("brands", {})

    # Load brands-index for human-readable brand names
    brands_meta: dict[str, dict[str, Any]] = {}
    if BRANDS_INDEX.exists():
        bi = json.loads(BRANDS_INDEX.read_text(encoding="utf-8"))
        for b in bi:
            brands_meta[b["id"]] = b

    # Cache of loaded brands/<id>.json
    brand_data_cache: dict[str, dict[str, Any]] = {}

    def load_brand_data(brand_id: str) -> dict[str, Any] | None:
        """Load brands/<id>.json (with kb→brands alias)."""
        brand_file_id = KB_TO_BRANDS.get(brand_id, brand_id)
        if brand_file_id in brand_data_cache:
            return brand_data_cache[brand_file_id]
        f = BRANDS_DIR / f"{brand_file_id}.json"
        if not f.exists():
            brand_data_cache[brand_file_id] = None
            return None
        data = json.loads(f.read_text(encoding="utf-8"))
        brand_data_cache[brand_file_id] = data
        return data

    entries: list[dict[str, Any]] = []
    stats = {
        "total": 0, "matched_brand": 0, "matched_model": 0, "matched_gen": 0,
        "no_brand": 0, "no_model": 0, "no_gen": 0,
    }

    for brand_slug, brand_entry in brands_dict.items():
        brand_data = load_brand_data(brand_slug)
        brand_meta = brands_meta.get(KB_TO_BRANDS.get(brand_slug, brand_slug), {})

        # Human-readable brand name
        if brand_data:
            brand_name = brand_data.get("name", brand_slug.upper())
            brand_name_ru = brand_data.get("name_ru", brand_name)
            stats["matched_brand"] += 1
        elif brand_meta:
            brand_name = brand_meta.get("name", brand_slug.upper())
            brand_name_ru = brand_meta.get("name_ru", brand_name)
            stats["matched_brand"] += 1
        else:
            brand_name = brand_slug.upper()
            brand_name_ru = brand_name
            stats["no_brand"] += 1

        for model_slug, gen_slugs in brand_entry.get("models", {}).items():
            brand_models = (brand_data or {}).get("models", []) or []
            model_match = match_model(brand_models, model_slug)

            if model_match:
                model_name = model_match.get("name", capitalize_slug(model_slug))
                gens_list = model_match.get("generations", []) or []
                stats["matched_model"] += 1
            else:
                model_name = capitalize_slug(model_slug)
                gens_list = []
                stats["no_model"] += 1

            for gen_slug in gen_slugs:
                gen_match = match_generation(gens_list, gen_slug)
                if gen_match:
                    gen_name = gen_match.get("name", capitalize_slug(gen_slug))
                    ys = gen_match.get("ys")
                    ye = gen_match.get("ye")
                    gen_id = gen_match.get("id")
                    stats["matched_gen"] += 1
                else:
                    gen_name = capitalize_slug(gen_slug)
                    ys = None
                    ye = None
                    gen_id = None
                    stats["no_gen"] += 1

                # Build display label "BMW X5 E70 2007-2013"
                label_bits = [brand_name, model_name]
                if gen_name and gen_name != model_name:
                    # Strip model from gen if duplicated
                    label_bits.append(gen_name)
                label = " ".join(label_bits)

                entries.append({
                    "bid": brand_slug,  # kb slug (e.g. "mercedes") — path on disk
                    "vid": KB_TO_BRANDS.get(brand_slug, brand_slug),  # vehicles/brands/*.json id ("mercedes_benz") — used by setVehicleProfile
                    "bn": brand_name,
                    "bnru": brand_name_ru,
                    "mslug": model_slug,
                    "mn": model_name,
                    "gslug": gen_slug,
                    "gn": gen_name,
                    "gid": gen_id,
                    "ys": ys,
                    "ye": ye,
                    "path": f"{brand_slug}/{model_slug}/{gen_slug}",
                    "label": label,
                })
                stats["total"] += 1

    # Write output
    OUT.write_text(
        json.dumps(entries, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    size_kb = OUT.stat().st_size / 1024

    print(f"[build_kb_search_index] wrote {OUT.relative_to(ROOT)}")
    print(f"  entries: {stats['total']}")
    print(f"  matched: brand {stats['matched_brand']}, model {stats['matched_model']}, gen {stats['matched_gen']}")
    print(f"  unmatched: brand {stats['no_brand']}, model {stats['no_model']}, gen {stats['no_gen']}")
    print(f"  size: {size_kb:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
