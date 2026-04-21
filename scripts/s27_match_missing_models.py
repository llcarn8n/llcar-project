#!/usr/bin/env python3
"""Для 160 моделей в KB что отсутствуют в vehicles.json — найти alias или пометить.

Логика:
 - Для каждой (kb_brand, kb_model):
   - Ищем в vehicles.json по fuzzy match (Levenshtein / substring / token intersection)
   - Если best match >= 0.85 → suggest alias
   - Если есть общие токены → suggest "rename"
   - Если слаг явно мусорный (misc_*, _ru_reocr, _stub, __*) → suggest "delete"
   - Иначе → suggest "add to vehicles.json"

Вывод: MD таблица для ручного подтверждения.
"""
from __future__ import annotations
import difflib
import io
import json
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


VEHICLES = json.loads(Path("llcar-dashboard/src/data/vehicles.json").read_text(encoding="utf-8"))
KB = json.loads(Path("llcar-dashboard/src/data/kb-generations-index.json").read_text(encoding="utf-8"))
DIFF = json.loads(Path(".omc/research/s27-kb-vs-vehicles.json").read_text(encoding="utf-8"))

# vehicles.json brand id → KB brand directory
BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}
# обратное направление для resolve KB brand → vehicles brand
KB_TO_VEH = {v: k for k, v in BRAND_ALIAS.items()}


# index vehicles по brand -> { slug: {name, id} }
V_INDEX: dict[str, dict[str, dict]] = {}
for b in VEHICLES:
    bid = b["id"]
    V_INDEX[bid] = {}
    for m in b.get("models", []):
        mid = m["id"]
        slug = mid[len(bid)+1:] if mid.startswith(f"{bid}_") else mid
        V_INDEX[bid][slug] = {"name": m.get("name", slug), "id": mid}


JUNK_PATTERNS = [
    re.compile(r"^misc_[a-f0-9]{4,}$"),
    re.compile(r".*_v2_ru_reocr$"),
    re.compile(r".*__stub$"),
    re.compile(r"^_[a-z]+$"),  # _cs55 и т.д.
    re.compile(r"^\d{4}_\w+"),  # 2021_ford_mustang_*
    re.compile(r"^2\d{3}_05_26_"),  # 2023_05_26__plus_*
    re.compile(r"^\d{2}__"),  # 24__dmi_rus__1
    re.compile(r".*_maintenance_and_owner_s_manual.*"),
    re.compile(r".*owner_manual.*"),
    re.compile(r"^l_dmi_manual.*"),
    re.compile(r"^bestune_.*"),  # не надо — bestune — prefix, но мы это уже alias'им
]


def is_junk(model: str) -> bool:
    for p in JUNK_PATTERNS:
        if p.match(model):
            return True
    return False


def fuzzy_match(brand: str, kb_model: str) -> tuple[str, float, str] | None:
    """Вернуть (veh_slug, ratio, veh_name) или None."""
    v_models = V_INDEX.get(brand, {})
    if not v_models:
        return None
    best = None
    best_ratio = 0.0
    # нормализуем для сравнения
    def norm(s: str) -> str:
        return s.lower().replace("_", "").replace("-", "").replace(" ", "")
    kb_n = norm(kb_model)
    for slug, v in v_models.items():
        v_n = norm(slug)
        r1 = difflib.SequenceMatcher(None, kb_n, v_n).ratio()
        # также сравним с именем модели
        v_name_n = norm(v["name"])
        r2 = difflib.SequenceMatcher(None, kb_n, v_name_n).ratio()
        r = max(r1, r2)
        # substring bonus
        if v_n and (v_n in kb_n or kb_n in v_n):
            r = max(r, 0.92)
        # token intersection bonus
        kb_toks = set(kb_model.lower().split("_"))
        v_toks = set(slug.lower().split("_"))
        if kb_toks & v_toks and len(kb_toks & v_toks) / max(len(kb_toks), len(v_toks)) > 0.5:
            r = max(r, 0.90)
        if r > best_ratio:
            best_ratio = r
            best = (slug, r, v["name"])
    return best


def main():
    missing = DIFF["missing_models_in_vehicles"]
    rows: list[dict] = []
    for item in missing:
        kb_brand = item["brand"]
        # vehicles.json мог иметь бренд под другим slug (alias)
        v_brand = KB_TO_VEH.get(kb_brand, kb_brand)
        brand = v_brand if v_brand in V_INDEX else kb_brand
        model = item["model"]
        kb_gens = item.get("kb_gens", [])

        # для отсутствующих брендов сразу new
        if brand not in V_INDEX:
            rows.append({
                "brand": kb_brand, "kb_model": model, "gens": len(kb_gens),
                "suggest": "new_brand_needed",
                "match": "—", "ratio": 0.0, "kb_gens": kb_gens,
            })
            continue

        # junk?
        if is_junk(model):
            rows.append({
                "brand": brand, "kb_model": model, "gens": len(kb_gens),
                "suggest": "delete_junk",
                "match": "—", "ratio": 0.0, "kb_gens": kb_gens,
            })
            continue

        match = fuzzy_match(brand, model)
        if match and match[1] >= 0.85:
            rows.append({
                "brand": brand, "kb_model": model, "gens": len(kb_gens),
                "suggest": f"rename→{match[0]}",
                "match": f"{match[0]} ({match[2]})", "ratio": match[1], "kb_gens": kb_gens,
            })
        elif match and match[1] >= 0.6:
            rows.append({
                "brand": brand, "kb_model": model, "gens": len(kb_gens),
                "suggest": "review_merge",
                "match": f"{match[0]} ({match[2]})", "ratio": match[1], "kb_gens": kb_gens,
            })
        else:
            rows.append({
                "brand": brand, "kb_model": model, "gens": len(kb_gens),
                "suggest": "add_to_vehicles",
                "match": "—", "ratio": match[1] if match else 0.0, "kb_gens": kb_gens,
            })

    # группируем по suggest
    from collections import Counter
    c = Counter(r["suggest"].split("→")[0] for r in rows)
    print("[summary]")
    for k, v in c.most_common():
        print(f"  {k}: {v}")

    # MD
    lines = [
        "# S27 H3.9b — сопоставление 160 KB моделей с vehicles.json",
        "",
        f"- всего: **{len(rows)}**",
    ]
    for k, v in c.most_common():
        lines.append(f"- {k}: **{v}**")
    lines.append("")
    # сортируем
    rows.sort(key=lambda r: (r["brand"], r["kb_model"]))
    for suggest in ("rename", "review_merge", "add_to_vehicles", "new_brand_needed", "delete_junk"):
        subset = [r for r in rows if r["suggest"].startswith(suggest)]
        if not subset:
            continue
        lines.append(f"## {suggest} ({len(subset)})")
        lines.append("")
        lines.append("| brand | kb_model | gens | match | ratio | kb_gens |")
        lines.append("|---|---|---:|---|---:|---|")
        for r in subset:
            gens_preview = ", ".join(r["kb_gens"][:3])
            if len(r["kb_gens"]) > 3:
                gens_preview += f" +{len(r['kb_gens'])-3}"
            lines.append(f"| {r['brand']} | `{r['kb_model']}` | {r['gens']} | {r['match']} | {r['ratio']:.2f} | `{gens_preview}` |")
        lines.append("")

    out = Path(".omc/research/s27-missing-models-triage.md")
    out.write_text("\n".join(lines), encoding="utf-8")
    out_json = Path(".omc/research/s27-missing-models-triage.json")
    out_json.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[out] {out}")
    print(f"[out] {out_json}")


if __name__ == "__main__":
    main()
