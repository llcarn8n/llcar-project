#!/usr/bin/env python3
"""Сверка покрытия: что из kb-index есть в vehicles.json, что нет."""
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


BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}


def main():
    kb = json.loads(Path("llcar-dashboard/src/data/kb-generations-index.json").read_text(encoding="utf-8"))
    vehicles = json.loads(Path("llcar-dashboard/src/data/vehicles.json").read_text(encoding="utf-8"))

    # vehicles.json: [ {id: "kia", models: [{id: "kia_k5", name: "K5", generations: [{name: "K5 II 2023-н.в.", ...}]}]} ]
    # id модели: "<brand>_<model>" → но generation name может быть любой
    v_brands: dict[str, dict] = {}
    for b in vehicles:
        bid_orig = b["id"]
        # перевести в KB-имя через alias
        bid = BRAND_ALIAS.get(bid_orig, bid_orig)
        v_brands[bid] = {
            "name": b.get("name", bid),
            "vehicles_id": bid_orig,
            "models": {}
        }
        for m in b.get("models", []):
            mid = m["id"]
            # "kia_k5" → "k5"; для alias: "mercedes_benz_e_class" → "e_class"
            for prefix in (bid_orig, bid):
                if mid.startswith(f"{prefix}_"):
                    model_slug = mid[len(prefix)+1:]
                    break
            else:
                model_slug = mid
            v_brands[bid]["models"][model_slug] = {
                "name": m.get("name", model_slug),
                "generations": [g.get("name", "") for g in m.get("generations", [])]
            }

    kb_brands = kb["brands"]

    # сравниваем
    only_in_kb: list[tuple[str, str, int]] = []  # (brand, model, gen_count)
    only_in_vehicles: list[tuple[str, str]] = []
    matched_brands = 0
    missing_brands_in_vehicles: list[str] = []

    for bid, bdata in kb_brands.items():
        if bid not in v_brands:
            missing_brands_in_vehicles.append(bid)
            for m, gens in bdata["models"].items():
                only_in_kb.append((bid, m, len(gens)))
            continue
        matched_brands += 1
        for m, gens in bdata["models"].items():
            if m not in v_brands[bid]["models"]:
                only_in_kb.append((bid, m, len(gens)))

    for bid, bdata in v_brands.items():
        if bid not in kb_brands:
            continue
        for m, mdata in bdata["models"].items():
            if m not in kb_brands[bid]["models"]:
                only_in_vehicles.append((bid, m))

    # отчёт
    print(f"[summary] vehicles brands: {len(v_brands)} | KB brands: {len(kb_brands)}")
    print(f"[missing in vehicles.json] {len(missing_brands_in_vehicles)} брендов:")
    for b in missing_brands_in_vehicles:
        gens = sum(len(g) for g in kb_brands[b]["models"].values())
        print(f"  - {b} (в KB: {len(kb_brands[b]['models'])} моделей, {gens} поколений)")
    print(f"\n[missing models in vehicles.json] {len(only_in_kb)} пар brand/model:")
    for b, m, c in sorted(only_in_kb, key=lambda x: (x[0], x[1]))[:60]:
        print(f"  - {b}/{m} ({c} поколений)")
    if len(only_in_kb) > 60:
        print(f"  ... и ещё {len(only_in_kb)-60}")

    # сохраняем полный
    report = {
        "kb_brands": len(kb_brands),
        "vehicles_brands": len(v_brands),
        "missing_brands_in_vehicles": missing_brands_in_vehicles,
        "missing_models_in_vehicles": [
            {"brand": b, "model": m, "kb_gens": kb_brands[b]["models"][m]}
            for b, m, _ in only_in_kb
        ],
        "only_in_vehicles_not_kb": [{"brand": b, "model": m} for b, m in only_in_vehicles],
    }
    out = Path(".omc/research/s27-kb-vs-vehicles.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[out] {out}")


if __name__ == "__main__":
    main()
