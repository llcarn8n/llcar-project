#!/usr/bin/env python3
"""S27 H3.3 — ручной mapping для 138 unresolved (основан на знании моделей).

Для каждой известной модели указываем (model, gen, note). Копируем из D:\\ в
kb/<dst_brand>/<model>/<gen>/manual.md с коллизионно-безопасным _variant.

Остальное (misc_* без известной атрибуции, multi-gen моделей где нельзя
определить без чтения файла) — оставляем на отдельную партию.
"""
from __future__ import annotations
import io
import json
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}

# (src_brand, src_dir) → (dst_brand, model, gen, note) или None для SKIP
MANUAL: dict[tuple[str, str], tuple[str, str, str, str] | None] = {
    # моно-генерационные (уверенно):
    ("byd", "yuan_plus"): ("byd", "yuan_plus", "yuan_plus_2022", "Atto 3 2022+"),
    ("voyah", "dreamer_2"): ("voyah", "dreamer", "dreamer_2_2022", "Dreamer 2 MPV 2022+"),
    ("exeed", "txtxl"): ("exeed", "txtxl", "txtxl_2023", "TXT/TXL 2023+"),
    ("livan", "x50"): ("livan", "x50", "x50_2023", "Livan X50 2023+"),
    ("chery", "arrizo_7"): ("chery", "arrizo_7", "arrizo_7_2013", "Arrizo 7 2013-2019"),
    ("land_rover", "rr_sport"): ("land_rover", "rr_sport", "rr_sport_l320_2005", "L320 2005-2013"),
    ("skoda", "scala"): ("skoda", "scala", "scala_2019", "Scala 2019+"),
    ("lada", "priora"): ("lada", "priora", "priora_2007", "Priora 2007-2018"),
    ("baic", "bj60"): ("baic", "bj60", "bj60_2023", "BJ60 2023+"),
    ("zeekr", "7x"): ("zeekr", "7x", "7x_2024", "Zeekr 7X 2024+"),
    ("peugeot", "307"): ("peugeot", "307", "307_2001", "307 2001-2008"),
    ("peugeot", "807"): ("peugeot", "807", "807_2002", "807 2002-2014"),
    ("peugeot", "308"): ("peugeot", "308", "308_2007", "308 first gen 2007-2013"),
    ("peugeot", "3008"): ("peugeot", "3008", "3008_2008", "3008 2008-2016"),
    ("peugeot", "508"): ("peugeot", "508", "508_2010", "508 2010-2018"),
    ("peugeot", "206"): ("peugeot", "206", "206_1998", "206 1998-2012"),
    ("porsche", "taycan"): ("porsche", "taycan", "taycan_2019", "Taycan 2019+"),
    ("porsche", "911"): ("porsche", "911", "911_996_1997", "996 1997-2005"),
    ("porsche", "boxster"): ("porsche", "boxster", "boxster_987_2004", "987 2004-2012"),
    ("kia", "picanto"): ("kia", "picanto", "picanto_sa_2004", "SA 2004-2011"),
    ("kia", "niro"): ("kia", "niro", "niro_2016", "Niro 2016+"),
    ("kia", "k8"): ("kia", "k8", "k8_2021", "K8 2021+"),
    ("kia", "venga"): ("kia", "venga", "venga_2009", "Venga 2009-2019"),
    ("kia", "spectra"): ("kia", "spectra", "spectra_2005", "ИжАвто 2005-2011"),
    ("mazda", "cx_60"): ("mazda", "cx_60", "cx_60_2022", "CX-60 2022+"),
    ("mazda", "cx_3"): ("mazda", "cx_3", "cx_3_2015", "CX-3 2015-2020"),
    ("mazda", "mazda6"): ("mazda", "mazda6", "mazda6_gg_2002", "GG 2002-2008"),
    ("lexus", "ux"): ("lexus", "ux", "ux_2018", "UX 2018+"),
    ("lexus", "lc"): ("lexus", "lc", "lc_2017", "LC 2017+"),
    ("lexus", "gx"): ("lexus", "gx", "gx_urj150_2009", "URJ150 2009-2023"),
    ("lexus", "is"): ("lexus", "is", "is_xe20_2005", "XE20 2005-2013 (неясно — default middle gen)"),
    ("ford", "ranger"): ("ford", "ranger", "ranger_t6_2011", "T6 2011-2021"),
    ("ford", "escape"): ("ford", "escape", "escape_2008", "2nd gen 2008-2012"),
    ("ford", "maverick"): ("ford", "maverick", "maverick_2021", "2021+"),
    ("chevrolet", "captiva"): ("chevrolet", "captiva", "captiva_c100_2006", "C100 2006-2011"),
    ("chevrolet", "rezzo"): ("chevrolet", "rezzo", "rezzo_2004", "Rezzo 2004-2008"),
    ("chevrolet", "lacetti"): ("chevrolet", "lacetti", "lacetti_2004", "J200 2004-2013"),
    ("chevrolet", "trailblazer"): ("chevrolet", "trailblazer", "trailblazer_2019", "2nd gen 2019+"),
    ("nissan", "tiida"): ("nissan", "tiida", "tiida_c11_2004", "C11 2004-2012"),
    ("nissan", "kicks"): ("nissan", "kicks", "kicks_2016", "P15 2016+"),
    ("nissan", "primera"): ("nissan", "primera", "primera_p12_2002", "P12 2002-2008"),
    ("nissan", "juke"): ("nissan", "juke", "juke_f15_2010", "F15 2010-2019"),
    ("infiniti", "fx"): ("infiniti", "fx", "fx_s50_2002", "S50 2002-2008"),
    ("hyundai", "starex"): ("hyundai", "starex", "starex_h1_2007", "TQ 2007-2021"),
    ("hyundai", "i40"): ("hyundai", "i40", "i40_2011", "2011-2019"),
    ("subaru", "legacy"): ("subaru", "legacy", "legacy_bp_2003", "BP 2003-2009"),
    ("mitsubishi", "l200"): ("mitsubishi", "l200", "l200_2005", "KA/KB 2005-2015"),
    ("mitsubishi", "galant"): ("mitsubishi", "galant", "galant_ix_2003", "9th gen 2003-2012"),
    ("honda", "hr_v"): ("honda", "hr_v", "hr_v_2015", "RU 2015+"),
    ("toyota", "rush"): ("toyota", "rush", "rush_2017", "F800 2017+"),
    ("citroen", "xsara"): ("citroen", "xsara", "xsara_1997", "1997-2006"),
    ("citroen", "xsara_picasso"): ("citroen", "xsara_picasso", "xsara_picasso_1999", "1999-2012"),
    ("opel", "vectra"): ("opel", "vectra", "vectra_c_2002", "Vectra C 2002-2008"),
    ("opel", "omega"): ("opel", "omega", "omega_b_1994", "Omega B 1994-2003"),
    ("renault", "master"): ("renault", "master", "master_ii_1998", "Master II 1998-2010"),
    ("fiat", "grande_punto"): ("fiat", "grande_punto", "grande_punto_2005", "199 2005-2018"),
    ("volkswagen", "beetle"): ("volkswagen", "beetle", "beetle_a5_2011", "A5 2011-2019"),
    ("jetour", "t1"): ("jetour", "t1", "t1_2022", "T1 2022+"),
    ("jetour", "x90"): ("jetour", "x90", "x90_2019", "X90 2019+"),
    ("jetour", "x50"): ("jetour", "x50", "x50_2024", "X50 2024+"),
    ("jetour", "dashing"): ("jetour", "dashing", "dashing_2022", "Dashing 2022+"),
    ("omoda", "c7"): ("omoda", "c7", "c7_2024", "C7 2024+"),
    ("geely", "cityray"): ("geely", "cityray", "cityray_2023", "Cityray 2023+"),
    ("chery", "a13"): ("chery", "a13", "a13_2009", "A13 Very 2009-2016"),
    ("chery", "chery_tiggo_9"): ("chery", "tiggo_9", "tiggo_9_2023", "Tiggo 9 2023+"),
    ("exeed", "es"): ("exeed", "es", "es_2023", "ES 2023+"),
    ("exeed", "exeed_et"): ("exeed", "et", "et_2023", "ET 2023+"),
    ("hongqi", "hongqi_ehs9"): ("hongqi", "ehs9", "ehs9_2020", "E-HS9 2020+"),
    ("hongqi", "hongqi_hq9"): ("hongqi", "hq9", "hq9_2022", "HQ9 2022+"),
    ("voyah", "dream"): ("voyah", "dream", "dream_2022", "Dream 2022+"),
    ("voyah", "passion"): ("voyah", "passion", "passion_2023", "Passion 2023+"),
    ("forthing", "m4"): ("forthing", "m4", "m4_2023", "M4 2023+"),
    ("jac", "s5"): ("jac", "s5", "s5_2013", "S5 2013+"),
    ("jac", "jac_s5_ru_manual"): ("jac", "s5", "s5_2013", "S5 RU manual (duplicate)"),
    ("haval", "h6"): ("haval", "h6", "h6_2011", "1st gen 2011-2020"),
    ("haval", "h5"): ("haval", "h5", "h5_2010", "H5 2010-2017"),
    ("belgee", "x50plus"): ("belgee", "x50_plus", "x50_plus_2025", "Belgee X50 Plus 2025"),
    ("ford", "explorer"): ("ford", "explorer", "explorer_u502_2010", "5th gen U502 2010-2019"),
    ("changan", "changan_q07"): ("changan", "q07", "q07_2021", "Q07 2021+"),
    ("uaz", "hunter"): ("uaz", "hunter", "hunter_2003", "Hunter 2003+"),
    ("uaz", "profi"): ("uaz", "profi", "profi_2017", "Profi 2017+"),
    ("uaz", "sgr_bukhanka"): ("uaz", "sgr_bukhanka", "sgr_bukhanka_2002", "СГР Буханка 2002+"),
    ("suzuki", "jimny"): ("suzuki", "jimny", "jimny_ft_1998", "FT 1998-2018"),
    ("chevrolet", "camaro"): ("chevrolet", "camaro", "camaro_2010", "5th gen 2010-2015"),
    # li через alias
    ("li", "l7"): ("li_auto", "l7", "l7_2022", "L7 2022+"),
    ("li", "l8"): ("li_auto", "l8", "l8_2022", "L8 2022+"),
    ("li", "l9"): ("li_auto", "l9", "l9_2022", "L9 2022+"),
    # mercedes через alias
    ("mercedes_benz", "vito"): ("mercedes", "vito", "vito_w447_2014", "W447 2014+"),
    ("mercedes_benz", "viano"): ("mercedes", "viano", "viano_w639_2003", "W639 2003-2014"),
    ("mercedes_benz", "m_class"): ("mercedes", "m_class", "m_class_w164_2005", "W164 2005-2011"),
    ("mercedes_benz", "misc_10f87275"): ("mercedes", "sprinter", "sprinter_w901_905_1995", "Sprinter T1N W901-905 1995-2006"),
    # bestune через alias
    ("bestune", "b70"): ("faw_bestune", "b70", "b70_2020", "B70 3rd gen 2020+"),
    ("bestune", "bestune_t90"): ("faw_bestune", "t90", "t90_2022", "T90 2022+"),
    # misc с известной атрибуцией (из прошлой сессии)
    ("uaz", "misc_66dd73e9"): ("uaz", "hunter", "hunter_2003", "UAZ Hunter УМЗ-4218 (duplicate)"),
    ("changan", "misc_d52243b0"): ("changan", "sc7", "sc7_2021", "Changan SC7 2021"),
    # SKIP pre-2001 или junk
    ("opel", "vectra_b"): None,  # 1995-2002, граница pre-2001
    ("fiat", "coupe"): None,  # 1993-2000
    ("ford", "escort"): None,  # European escort ended 2002, bordeline
    ("honda", "prelude"): None,  # ended 2001
    ("peugeot", "106"): None,  # 1991-2003 borderline
    ("datsun", "1000_v2_ru_reocr"): None,  # historical
    ("volvo", "440_460_480"): None,  # 1986-1996 pre-2001
    ("kia", "all"): None,  # junk aggregator
    ("nissan", "primera_v2_ru_reocr"): None,  # duplicate of primera
    ("honda", "misc_8201a6dc"): None,  # pre-2001 Honda Civic
    ("mercedes_benz", "190"): None,  # W201 1982-1993 pre-2001
    ("mercedes_benz", "ml"): None,  # duplicate of m_class
}


SRC_ROOT = Path("D:/manuals-export")
KB_ROOT = Path("llcar-dashboard/public/data/kb")


def apply_one(src_brand: str, src_dir: str, mapping) -> dict:
    src_md = SRC_ROOT / src_brand / src_dir / "manual.md"
    if not src_md.exists():
        return {"action": "missing_src"}
    if mapping is None:
        return {"action": "skip_pre2001_or_junk"}

    dst_brand, model, gen, note = mapping
    dst_dir = KB_ROOT / dst_brand / model / gen
    dst_md = dst_dir / "manual.md"
    action = "copy"
    if dst_md.exists():
        n = 1
        while True:
            cand = dst_dir / (f"manual_variant.md" if n == 1 else f"manual_variant{n}.md")
            if not cand.exists():
                dst_md = cand
                action = f"copy_variant({cand.name})"
                break
            n += 1

    dst_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(src_md), str(dst_md))

    meta = dst_dir / "meta.json"
    m = {}
    if meta.exists():
        try:
            m = json.loads(meta.read_text(encoding="utf-8"))
        except Exception:
            pass
    m.setdefault("brand", dst_brand)
    m.setdefault("model", model)
    m.setdefault("generation", gen)
    m["source"] = "kb"
    m["ingested_from"] = f"{src_brand}/{src_dir}"
    m["ingested_at"] = "2026-04-21"
    m["h33_manual_map"] = note
    if src_brand in BRAND_ALIAS:
        m["brand_alias"] = {"src": src_brand, "dst": dst_brand}
    meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"action": action, "target": f"{dst_brand}/{model}/{gen}"}


def main() -> int:
    stats = {"applied": 0, "skipped": 0, "missing_src": 0, "variant": 0, "total": len(MANUAL)}
    log = Path(".omc/research/s27-h33-manual138-log.jsonl")
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("w", encoding="utf-8") as f:
        for (sb, sd), mapping in MANUAL.items():
            res = apply_one(sb, sd, mapping)
            op = {"src": f"{sb}/{sd}", "mapping": mapping, **res}
            f.write(json.dumps(op, ensure_ascii=False) + "\n")
            f.flush()
            a = res["action"]
            if a.startswith("copy"):
                stats["applied"] += 1
                if "variant" in a:
                    stats["variant"] += 1
            elif a == "missing_src":
                stats["missing_src"] += 1
            else:
                stats["skipped"] += 1
            print(f"  {sb}/{sd} → {res}")

    print(f"\n[summary] {stats}")
    print(f"[log] {log}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
