#!/usr/bin/env python3
"""S27 H3.4 — применить 10 чистых new_brand через alias.

Все 3 новых бренда уже замаплены в scripts/transfer4_brand_mapping.json:
 - mercedes_benz → mercedes
 - li → li_auto
 - bestune → faw_bestune

Обрабатываем строки из preview секции `## new_brand (27)` где gen не оканчивается на `_main`
(т.е. есть реальный код шасси: W211, W205, A168, W638, W177, W223, W206, W213, coupe, W460_W463).

SKIP:
 - gen == `<model>_main` → уйдёт в H3.3 fallback отдельно
 - pre-2001 по факту (190_w201 — Mercedes W201 1982-1993)
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


ROWS = [
    # (src_brand, src_dir, dst_brand, model, gen, note)
    ("mercedes_benz", "e_class_w211", "mercedes", "e_class", "e_class_w211", "W211: 2002-2009"),
    ("mercedes_benz", "gle_coupe", "mercedes", "gle", "gle_coupe", "GLE Coupe 2015+"),
    ("mercedes_benz", "g_class_w460_w463", "mercedes", "g_class", "g_class_w460_w463", "W460/W463: 1979+ (в производстве)"),
    ("mercedes_benz", "a_class_w177", "mercedes", "a_class", "a_class_w177", "W177: 2018+"),
    ("mercedes_benz", "c_class_w205", "mercedes", "c_class", "c_class_w205", "W205: 2014-2021"),
    ("mercedes_benz", "c_class_w206", "mercedes", "c_class", "c_class_w206", "W206: 2021+"),
    ("mercedes_benz", "e_class_w213", "mercedes", "e_class", "e_class_w213", "W213: 2016-2023"),
    ("mercedes_benz", "s_class_w223", "mercedes", "s_class", "s_class_w223", "W223: 2020+"),
    ("mercedes_benz", "vito_viano_w638", "mercedes", "vito", "vito_viano_w638", "W638: 1996-2003 (до 2003, ОК)"),
    ("mercedes_benz", "a_class_w168", "mercedes", "a_class", "a_class_w168", "W168: 1997-2004 (до 2004, ОК)"),
]

SRC_ROOT = Path("D:/manuals-export")
KB_ROOT = Path("llcar-dashboard/public/data/kb")


def apply_row(r: tuple) -> dict:
    src_brand, src_dir, dst_brand, model, gen, note = r
    src_md = SRC_ROOT / src_brand / src_dir / "manual.md"
    if not src_md.exists():
        return {"status": "missing_src", "expected": str(src_md)}

    dst_dir = KB_ROOT / dst_brand / model / gen
    dst_md = dst_dir / "manual.md"
    action = "copy"
    if dst_md.exists():
        # коллизия — пишем _variant
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
    m["h34_note"] = note
    m["brand_alias"] = {"src": src_brand, "dst": dst_brand}
    meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"status": action, "target": str(dst_md.relative_to(KB_ROOT))}


def main() -> int:
    total = len(ROWS)
    ok = 0
    missing = 0
    results = []
    for r in ROWS:
        res = apply_row(r)
        results.append({"src": f"{r[0]}/{r[1]}", "dst": f"{r[2]}/{r[3]}/{r[4]}", **res})
        if res["status"].startswith("copy"):
            ok += 1
        elif res["status"] == "missing_src":
            missing += 1
        print(f"  {r[0]}/{r[1]} → {r[2]}/{r[3]}/{r[4]} — {res['status']}")

    log = Path(".omc/research/s27-h34-apply-log.jsonl")
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("w", encoding="utf-8") as f:
        for res in results:
            f.write(json.dumps(res, ensure_ascii=False) + "\n")

    print(f"\n[summary] total={total} ok={ok} missing={missing}")
    print(f"[log] {log}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
