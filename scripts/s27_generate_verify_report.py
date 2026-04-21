#!/usr/bin/env python3
"""Сгенерировать verification report для 130 missing моделей.

Для каждой модели:
 - читаем первые 50 строк первого manual.md
 - вытаскиваем H1/H2 заголовки и года
 - автоматическое определение названия модели и годов
 - рекомендация: skip (дубликат в vehicles под alias) / add_to_vehicles / review

Вывод: .omc/research/s27-h310-verify.md (структурированный по брендам,
user просматривает и одобряет батчами).
"""
from __future__ import annotations
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


KB = Path("llcar-dashboard/public/data/kb")
VEHICLES = json.loads(Path("llcar-dashboard/src/data/vehicles.json").read_text(encoding="utf-8"))
TRIAGE = json.loads(Path(".omc/research/s27-missing-models-triage.json").read_text(encoding="utf-8"))

BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}
KB_TO_VEH = {v: k for k, v in BRAND_ALIAS.items()}

# vehicles.json index
V_INDEX: dict[str, dict] = {}
for b in VEHICLES:
    bid_orig = b["id"]
    bid = BRAND_ALIAS.get(bid_orig, bid_orig)
    V_INDEX[bid] = {"vehicles_id": bid_orig, "name": b.get("name", bid), "models": {}}
    for m in b.get("models", []):
        mid = m["id"]
        for prefix in (bid_orig, bid):
            if mid.startswith(f"{prefix}_"):
                slug = mid[len(prefix)+1:]
                break
        else:
            slug = mid
        V_INDEX[bid]["models"][slug] = {
            "name": m.get("name", slug),
            "id": mid,
            "gens": [g.get("name", "") for g in m.get("generations", [])],
        }


TITLE_RE = re.compile(r"^#{1,3}\s+(.+)$", re.M)
YEAR_RE = re.compile(r"\b(19[89]\d|20[0-2]\d)\b")


def sample_manual(gen_dir: Path) -> tuple[list[str], set[str], int]:
    """Вернуть (titles[:5], years, size_kb)."""
    md = gen_dir / "manual.md"
    if not md.exists():
        return [], set(), 0
    text = md.read_text(encoding="utf-8", errors="replace")[:5000]
    titles = [t.strip() for t in TITLE_RE.findall(text)[:5]]
    years = set(YEAR_RE.findall(text[:3000]))
    size_kb = md.stat().st_size // 1024
    return titles, years, size_kb


def main():
    lines = [
        "# S27 H3.10 — Ручная верификация моделей",
        "",
        "Для каждой модели показан sample content (заголовки + годы). Нужно утвердить действие:",
        "- **skip**: модель уже есть в vehicles.json под alias, kbPath.ts fallback работает",
        "- **add**: реально новая модель — добавить в vehicles.json",
        "- **delete**: мусорный файл (pre-2001 / battle junk)",
        "",
    ]

    from collections import defaultdict
    by_brand = defaultdict(list)
    for r in TRIAGE:
        by_brand[r["brand"]].append(r)

    for brand in sorted(by_brand.keys()):
        rows = by_brand[brand]
        v_brand = V_INDEX.get(brand, {})
        v_brand_id = v_brand.get("vehicles_id", brand)
        v_models_list = list(v_brand.get("models", {}).keys()) if v_brand else []

        lines.append(f"## {brand} ({len(rows)} моделей)")
        lines.append("")
        lines.append(f"**Vehicles.json brand id:** `{v_brand_id}`")
        lines.append(f"**Существующие модели в vehicles.json:** {', '.join(v_models_list) or '(нет)'}")
        lines.append("")

        for r in rows:
            m = r["kb_model"]
            gens = r["kb_gens"]
            lines.append(f"### `{brand}/{m}` ({len(gens)} поколений)")

            for gen in gens[:3]:  # показываем только первые 3 gen
                gen_dir = KB / brand / m / gen
                titles, years, size_kb = sample_manual(gen_dir)
                lines.append(f"- **{gen}** ({size_kb}KB, годы: {sorted(years)})")
                for t in titles:
                    t_clean = t[:120].replace("|", "\\|")
                    lines.append(f"  - `{t_clean}`")
            if len(gens) > 3:
                lines.append(f"  - ... и ещё {len(gens)-3} поколений")

            lines.append("")
            lines.append(f"**Триаж рекомендует:** {r['suggest']}")
            if r.get("match") and r["match"] != "—":
                lines.append(f"**Вариант в vehicles.json:** {r['match']}")
            lines.append("")
            lines.append("**Решение:** ☐ skip  ☐ add  ☐ delete  ☐ rename → `_____`")
            lines.append("")

    out = Path(".omc/research/s27-h310-verify.md")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[out] {out} ({out.stat().st_size // 1024} KB)")
    print(f"[stats] brands: {len(by_brand)}, models: {sum(len(v) for v in by_brand.values())}")


if __name__ == "__main__":
    main()
