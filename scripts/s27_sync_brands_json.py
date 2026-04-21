#!/usr/bin/env python3
"""S27 H3.11b — синхронизировать public/data/brands/*.json с vehicles.json.

Landing использует brands-index.json + brands/<id>.json (не vehicles.json).
Добавляет новые модели из vehicles.json в brands/*.json + обновляет count
в brands-index.json. Создаёт новый brand JSON если нет (lifan).

Структура brand/*.json:
{id, name, name_ru, country, models: [
  {id, name, body_type, powertrain, generations: [{id, name, ys, ye, ...}]}
]}

Минимальное добавление: id, name, generations: [{id, name, ys, ye}] —
остальные поля остаются дефолтом/пустыми.
"""
from __future__ import annotations
import io
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


PUBLIC_DATA = Path("llcar-dashboard/public/data")
VEHICLES = json.loads(Path("llcar-dashboard/src/data/vehicles.json").read_text(encoding="utf-8"))
BRANDS_INDEX_PATH = PUBLIC_DATA / "brands-index.json"

# Дефолтные поля для новых брендов
DEFAULT_BRANDS = {
    "lifan": {"name_ru": "Лифан", "country": "CN"},
}


def make_gen_id(brand_id: str, model_id: str, gen_name: str, ys: int) -> str:
    """Упрощённый gen id — используем имя модели + year."""
    slug = model_id.replace(brand_id + "_", "")
    return f"{brand_id}_{slug}_{ys}"


def main():
    brands_idx = json.loads(BRANDS_INDEX_PATH.read_text(encoding="utf-8"))
    idx_by_id = {b["id"]: b for b in brands_idx}

    added_brands = 0
    updated_brands = 0
    added_models = 0
    added_gens = 0

    for v_brand in VEHICLES:
        bid = v_brand["id"]
        b_json_path = PUBLIC_DATA / "brands" / f"{bid}.json"

        # если brand JSON не существует — создать минимальный
        if not b_json_path.exists():
            defaults = DEFAULT_BRANDS.get(bid, {})
            new_brand = {
                "id": bid,
                "name": v_brand.get("name", bid),
                "name_ru": defaults.get("name_ru", v_brand.get("name", bid)),
                "country": defaults.get("country", ""),
                "models": [],
            }
            b_json_path.parent.mkdir(parents=True, exist_ok=True)
            b_json_path.write_text(json.dumps(new_brand, ensure_ascii=False, indent=2), encoding="utf-8")
            added_brands += 1
            # регистрируем в brands-index
            if bid not in idx_by_id:
                entry = {
                    "id": bid,
                    "name": new_brand["name"],
                    "name_ru": new_brand["name_ru"],
                    "country": new_brand["country"],
                    "models": 0,
                }
                brands_idx.append(entry)
                idx_by_id[bid] = entry
            print(f"[NEW BRAND] {bid}")

        # читаем brand JSON
        b_json = json.loads(b_json_path.read_text(encoding="utf-8"))
        existing_model_ids = {m["id"] for m in b_json.get("models", [])}

        brand_modified = False
        for v_model in v_brand.get("models", []):
            mid = v_model["id"]
            if mid in existing_model_ids:
                # модель уже есть — можно проверить добавить недостающие поколения
                existing = next(m for m in b_json["models"] if m["id"] == mid)
                existing_gen_names = {g.get("name") for g in existing.get("generations", [])}
                for g in v_model.get("generations", []):
                    if g.get("name") not in existing_gen_names:
                        new_gen = {
                            "id": make_gen_id(bid, mid, g.get("name", ""), g.get("ys", 2020)),
                            "name": g.get("name", ""),
                            "ys": g.get("ys", 2020),
                            "ye": g.get("ye", 2026),
                        }
                        existing.setdefault("generations", []).append(new_gen)
                        added_gens += 1
                        brand_modified = True
                continue

            # модели нет — добавляем
            new_model = {
                "id": mid,
                "name": v_model.get("name", mid),
                "body_type": "",
                "powertrain": "ice",
                "generations": [
                    {
                        "id": make_gen_id(bid, mid, g.get("name", ""), g.get("ys", 2020)),
                        "name": g.get("name", ""),
                        "ys": g.get("ys", 2020),
                        "ye": g.get("ye", 2026),
                    }
                    for g in v_model.get("generations", [])
                ],
            }
            b_json.setdefault("models", []).append(new_model)
            added_models += 1
            brand_modified = True

        if brand_modified:
            b_json_path.write_text(json.dumps(b_json, ensure_ascii=False, indent=2), encoding="utf-8")
            updated_brands += 1
            # обновляем count в index
            if bid in idx_by_id:
                idx_by_id[bid]["models"] = len(b_json["models"])

    # обновляем brands-index
    BRANDS_INDEX_PATH.write_text(json.dumps(brands_idx, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n[summary]")
    print(f"  added brands: {added_brands}")
    print(f"  updated brands: {updated_brands}")
    print(f"  added models: {added_models}")
    print(f"  added generations: {added_gens}")


if __name__ == "__main__":
    main()
