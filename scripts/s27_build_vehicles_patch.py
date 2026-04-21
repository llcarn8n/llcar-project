#!/usr/bin/env python3
"""S27 H3.10 — сгенерировать patch для vehicles.json на 91 модель.

91 = 61 add_to_vehicles + 30 MID ratio (reclassified to add).

Для каждой модели:
 - display_name: из slug (с capitalization smart)
 - generations: из gen-slug'ов KB, year извлекаем через regex
 - year_start: мин год из gens или 2020 дефолт
 - year_end: 2026

Применяется поверх существующего vehicles.json: dodaет models к existing
brand entry (если brand есть) или пропускает с предупреждением.
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


VEHICLES_PATH = Path("llcar-dashboard/src/data/vehicles.json")
TRIAGE = json.loads(Path(".omc/research/s27-missing-models-triage.json").read_text(encoding="utf-8"))

BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}
KB_TO_VEH = {v: k for k, v in BRAND_ALIAS.items()}

# спецкейсы display names (только для тех что auto-capitalize угадает неправильно)
DISPLAY_NAME_OVERRIDES: dict[str, str] = {
    # review_merge реально новые
    "chery/tiggo_9": "Tiggo 9",
    "genesis/gv60": "GV60",
    "hongqi/hq9": "HQ9",
    "hyundai/kona": "Kona",
    "hyundai/staria": "Staria",
    "kia/ev9": "EV9",
    "mazda/cx5": "CX-5",
    "nissan/leaf": "Leaf",
    "opel/astra_k": "Astra K",
    "opel/vectra_c": "Vectra C",
    "peugeot/207": "207",
    "peugeot/407": "407",
    "volvo/s40": "S40",
    # brand/model → display_name
    "baic/bj60": "BJ60",
    "bmw/i4": "i4",
    "bmw/ix3": "iX3",
    "bmw/ix": "iX",
    "belgee/x50_plus": "X50 Plus",
    "byd/atto_3": "Atto 3",
    "byd/l_dmi_manual_rus": "L DMI",
    "byd/sealion": "SeaLion",
    "byd/song_l_dmi": "Song L DMI",
    "byd/song_plus": "Song Plus",
    "byd/yuan_plus": "Yuan Plus",
    "chery/arrizo_7": "Arrizo 7",
    "chery/arrizo": "Arrizo",
    "chery/a13": "A13",
    "chery/bonus": "Bonus",
    "chery/maintenance_and_owner_s_manual": "Бонус-справочник",
    "chery/tiggo_4": "Tiggo 4",
    "chery/tiggo_7_pro": "Tiggo 7 Pro",
    "chery/tiggo_8_pro": "Tiggo 8 Pro",
    "changan/cs35_plus": "CS35 Plus",
    "changan/cs75_plus": "CS75 Plus",
    "changan/q07": "Q07",
    "changan/sc7": "SC7",
    "changan/uni_k": "UNI-K",
    "changan/uni_t": "UNI-T",
    "changan/uni_v": "UNI-V",
    "changan/eado_plus": "Eado Plus",
    "chevrolet/rezzo": "Rezzo",
    "chevrolet/misc_949f8aaa": "Misc-949",
    "citroen/c3_picasso": "C3 Picasso",
    "citroen/xsara_picasso": "Xsara Picasso",
    "exeed/es": "ES",
    "exeed/et": "ET",
    "exeed/txl": "TXL",
    "faw_bestune/t77": "T77",
    "faw_bestune/t90": "T90",
    "faw_bestune/t99": "T99",
    "faw_bestune/b70": "B70",
    "fiat/bravo": "Bravo",
    "fiat/palio": "Palio",
    "fiat/grande_punto": "Grande Punto",
    "fiat/tipo": "Tipo",
    "ford/escape": "Escape",
    "ford/maverick": "Maverick",
    "ford/mustang_mach_e": "Mustang Mach-E",
    "forthing/t5": "T5",
    "forthing/m4": "M4",
    "gac/aion_lx": "Aion LX",
    "gac/s7": "S7",
    "geely/atlas": "Atlas",
    "genesis/gv60": "GV60",
    "haval/hover": "Hover",
    "honda/city": "City",
    "honda/crosstour": "Crosstour",
    "honda/hr_v": "HR-V",
    "hongqi/e_hs9": "E-HS9",
    "hongqi/hq9": "HQ9",
    "hyundai/i30": "i30",
    "hyundai/i40": "i40",
    "hyundai/ioniq5": "Ioniq 5",
    "hyundai/ix35": "ix35",
    "hyundai/kona": "Kona",
    "hyundai/starex": "Starex",
    "jac/s5": "S5",
    "jetour/t1": "T1",
    "jetour/x50": "X50",
    "jetour/x90": "X90",
    "kia/k8": "K8",
    "kia/niro": "Niro",
    "kia/picanto": "Picanto",
    "kia/spectra": "Spectra",
    "kia/venga": "Venga",
    "lada/2110": "ВАЗ-2110",
    "lada/kalina": "Kalina",
    "land_rover/rr_sport": "Range Rover Sport",
    "lexus/is": "IS",
    "lexus/gx": "GX",
    "lexus/lc": "LC",
    "lexus/rx270_rx350": "RX",
    "lexus/ux": "UX",
    "lifan/breez": "Breez",
    "lifan/solano": "Solano",
    "lifan/x50": "X50",
    "mazda/3": "3",
    "mazda/6": "6",
    "mazda/cx_3": "CX-3",
    "mazda/cx_60": "CX-60",
    "mazda/cx30": "CX-30",
    "mazda/cx7": "CX-7",
    "mazda/mpv": "MPV",
    "mazda/mx_5": "MX-5",
    "mazda/demio": "Demio",
    "mazda/mazda6": "6",
    "mercedes/a_class": "A-Class",
    "mercedes/c_class": "C-Class",
    "mercedes/e_class": "E-Class",
    "mercedes/s_class": "S-Class",
    "mercedes/g_class": "G-Class",
    "mercedes/cla": "CLA",
    "mercedes/gla": "GLA",
    "mercedes/glb": "GLB",
    "mercedes/glc": "GLC",
    "mercedes/gle": "GLE",
    "mercedes/gl_class": "GL-Class",
    "mercedes/m_class": "M-Class",
    "mercedes/ml_w164": "ML (W164)",
    "mercedes/sprinter": "Sprinter",
    "mercedes/vito": "Vito",
    "mercedes/viano": "Viano",
    "mercedes/eqs": "EQS",
    "mitsubishi/eclipse": "Eclipse",
    "mitsubishi/galant": "Galant",
    "mitsubishi/l200": "L200",
    "mitsubishi/pajero_sport": "Pajero Sport",
    "nissan/ariya": "Ariya",
    "nissan/juke": "Juke",
    "nissan/kicks": "Kicks",
    "nissan/primera": "Primera",
    "nissan/tiida": "Tiida",
    "opel/astra": "Astra",
    "opel/corsa_e": "Corsa-e",
    "opel/omega": "Omega",
    "opel/mokka": "Mokka",
    "opel/vectra": "Vectra",
    "peugeot/3008": "3008",
    "peugeot/307": "307",
    "peugeot/308": "308",
    "peugeot/508": "508",
    "peugeot/807": "807",
    "porsche/taycan": "Taycan",
    "renault/kangoo": "Kangoo",
    "renault/master": "Master",
    "skoda/fabia": "Fabia",
    "skoda/octavia": "Octavia",
    "skoda/scala": "Scala",
    "skoda/superb": "Superb",
    "subaru/legacy": "Legacy",
    "suzuki/jimny": "Jimny",
    "toyota/hilux": "Hilux",
    "toyota/mark": "Mark II",
    "toyota/prado": "Land Cruiser Prado",
    "toyota/rush": "Rush",
    "uaz/patriot": "Patriot",
    "uaz/sgr_bukhanka": "СГР Буханка",
    "uaz/hunter": "Hunter",
    "volkswagen/beetle": "Beetle",
    "volkswagen/golf": "Golf",
    "volkswagen/jetta": "Jetta",
    "volkswagen/passat": "Passat",
    "volkswagen/polo": "Polo",
    "volkswagen/tiguan": "Tiguan",
    "volvo/s80": "S80",
    "voyah/dream": "Dream",
    "voyah/passion": "Passion",
    "voyah/dreamer": "Dreamer",
    "voyah/free": "Free",
}


def auto_name(model_slug: str) -> str:
    """Capitalize with heuristics."""
    parts = model_slug.split("_")
    out = []
    for p in parts:
        if len(p) <= 2 and p.isalpha() and p.lower() == p:
            out.append(p.upper())
        elif p.isdigit():
            out.append(p)
        elif re.match(r"^[a-z]\d+$", p):  # q07, bj60
            out.append(p.upper())
        else:
            out.append(p.capitalize())
    return " ".join(out)


YEAR_RE = re.compile(r"_(19[89]\d|20[0-2]\d)")


def extract_year(gen_slug: str) -> int | None:
    m = YEAR_RE.search(f"_{gen_slug}")
    if m:
        return int(m.group(1))
    return None


def make_generation_name(model_name: str, gen_slug: str, year: int | None) -> tuple[str, int, int]:
    """Вернуть (gen_display_name, ys, ye)."""
    if year:
        return f"{model_name} {year}-н.в.", year, 2026
    # если нет года — general
    return f"{model_name} (актуальное)", 2015, 2026


def main():
    # берём всё кроме delete_junk и review_merge=rr_sport (очевидный alias)
    REVIEW_ALIAS_SKIP = {
        ("land_rover", "rr_sport"),  # ↔ range_rover_sport (тот же)
    }
    targets = []
    for r in TRIAGE:
        if r["suggest"] == "add_to_vehicles":
            targets.append(r)
        elif r["suggest"].startswith("rename") and r["ratio"] < 1.0:
            targets.append({**r, "suggest": "add_to_vehicles"})
        elif r["suggest"] == "new_brand_needed":
            targets.append(r)
        elif r["suggest"] == "review_merge":
            if (r["brand"], r["kb_model"]) not in REVIEW_ALIAS_SKIP:
                targets.append({**r, "suggest": "add_to_vehicles"})

    print(f"[info] total к добавлению: {len(targets)}")

    # backup
    backup = VEHICLES_PATH.with_suffix(".json.bak")
    backup.write_text(VEHICLES_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[backup] {backup}")

    # читаем vehicles.json
    vehicles = json.loads(VEHICLES_PATH.read_text(encoding="utf-8"))
    brand_index = {b["id"]: b for b in vehicles}

    # добавляем lifan brand если нет
    if "lifan" not in brand_index:
        lifan_entry = {
            "id": "lifan",
            "name": "Lifan",
            "models": [],
        }
        vehicles.append(lifan_entry)
        brand_index["lifan"] = lifan_entry
        print("[add-brand] lifan (новый бренд в vehicles.json)")

    added = 0
    skipped_brand_missing = 0
    skipped_existing = 0

    for r in targets:
        kb_brand = r["brand"]
        # KB brand → vehicles brand через reverse alias
        v_brand_id = KB_TO_VEH.get(kb_brand, kb_brand)
        if v_brand_id not in brand_index:
            skipped_brand_missing += 1
            print(f"[skip] {v_brand_id} нет в vehicles.json (это lifan, добавится отдельно)")
            continue

        brand_entry = brand_index[v_brand_id]
        kb_model = r["kb_model"]

        # display name
        key = f"{kb_brand}/{kb_model}"
        display = DISPLAY_NAME_OVERRIDES.get(key, auto_name(kb_model))

        # id в vehicles.json = <v_brand_id>_<kb_model>
        model_id = f"{v_brand_id}_{kb_model}"

        # проверка что не дубликат
        if any(m["id"] == model_id for m in brand_entry.get("models", [])):
            skipped_existing += 1
            continue

        # генерации
        generations = []
        for gen_slug in r["kb_gens"]:
            year = extract_year(gen_slug)
            gen_name, ys, ye = make_generation_name(display, gen_slug, year)
            generations.append({"name": gen_name, "ys": ys, "ye": ye})

        brand_entry.setdefault("models", []).append({
            "id": model_id,
            "name": display,
            "generations": generations,
        })
        added += 1

    # сохраняем
    VEHICLES_PATH.write_text(
        json.dumps(vehicles, ensure_ascii=False, indent=0).replace("\n", ""),
        encoding="utf-8"
    )
    # более читаемо
    VEHICLES_PATH.write_text(json.dumps(vehicles, ensure_ascii=False), encoding="utf-8")

    print(f"\n[summary] added: {added}, skip brand missing: {skipped_brand_missing}, skip existing: {skipped_existing}")
    print(f"[out] {VEHICLES_PATH}")


if __name__ == "__main__":
    main()
