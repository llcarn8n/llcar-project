#!/usr/bin/env python3
"""S27 — после ручной проверки 14 'delete_junk' манулов: 1 удалить, 13 переименовать.

Логика:
 - move (rename): копировать manual.md в новую правильную папку, удалить старую gen-папку
 - delete: rmtree старую gen-папку (только pre-2001)
 - collisions: manual_variant.md
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


KB = Path("llcar-dashboard/public/data/kb")

# (current path) → (target brand, model, gen, note) или None для DELETE
ACTIONS: dict[str, tuple[str, str, str, str] | None] = {
    "byd/l_dmi_manual_rus/l_dmi_manual_rus_last": ("byd", "song_l_dmi", "song_l_dmi_2023", "BYD Song L DMI 2023"),
    "changan/2023_05_26__plus_owner_manual_rus__1/2023_05_26__plus_owner_manual_rus__1_2023": ("changan", "eado_plus", "eado_plus_2021", "EADO Plus 2021"),
    "datsun/1000_1200/1000_1200_1972": None,  # pre-2001 (1968-1973)
    "ford/2021_ford_mustang_mach_e_owners_manual_version_1_om_en/2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us": ("ford", "mustang_mach_e", "mustang_mach_e_2021", "Mustang Mach-E 2021 OM"),
    "ford/2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us_09/2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us_09_2020": ("ford", "mustang_mach_e", "mustang_mach_e_2021", "Mustang Mach-E 2021 v9 (variant)"),
    "haval/misc_2ca0da3c/misc_2ca0da3c_2005": ("haval", "hover", "hover_2005", "Great Wall Hover 2005-2010 (2.4л + 2.8 TCI)"),
    "kia/2019_kia/2019_kia_niro": ("kia", "niro", "niro_2016", "Kia Niro Hybrid/PHEV 2019 (merge into niro_2016)"),
    "lada/2008_d91309f0/2008_d91309f0_2004": ("lada", "2110", "2110_1996", "ВАЗ-2110/2111/2112i 1996-2007"),
    "livan/2008_11559170/2008_11559170_2005": ("lifan", "breez", "breez_2005", "Lifan Breez 520/520i 2005+ (новый бренд)"),
    "livan/misc_7fd8c177/misc_7fd8c177_2009": ("lifan", "solano", "solano_2009", "Lifan Solano 620/2009+ (новый бренд)"),
    "nissan/2023_nissan_ariya/2023_nissan_ariya_2023": ("nissan", "ariya", "ariya_2023", "Nissan Ariya 2023+"),
    "uaz/2008_2cad14d8/2008_2cad14d8_2005": ("uaz", "patriot", "patriot_2005", "UAZ Patriot 2005+ (3MZ-409.10)"),
    "uaz/misc_033d20b3/misc_033d20b3_2016": ("uaz", "patriot", "patriot_2016", "UAZ Patriot 2016+ (3MZ-40906)"),
    "uaz/misc_615771d0/misc_615771d0_2003": ("uaz", "hunter", "hunter_2003", "UAZ Hunter 2003+ (merge)"),
}


def safe_copy(src_md: Path, dst_dir: Path) -> tuple[str, Path]:
    dst_md = dst_dir / "manual.md"
    if not dst_md.exists():
        dst_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(src_md), str(dst_md))
        return "copy", dst_md
    n = 1
    while True:
        cand = dst_dir / (f"manual_variant.md" if n == 1 else f"manual_variant{n}.md")
        if not cand.exists():
            shutil.copy2(str(src_md), str(cand))
            return f"copy_variant({cand.name})", cand
        n += 1


def main():
    stats = {"moved": 0, "deleted": 0, "missing": 0, "errors": 0}
    for cur_path, action in ACTIONS.items():
        src_dir = KB / cur_path
        src_md = src_dir / "manual.md"
        if not src_md.exists():
            stats["missing"] += 1
            print(f"MISSING {cur_path}")
            continue

        try:
            if action is None:
                # delete
                shutil.rmtree(str(src_dir))
                # удалить parent если пустая
                parent = src_dir.parent
                if parent.exists() and not any(parent.iterdir()):
                    parent.rmdir()
                stats["deleted"] += 1
                print(f"DELETE {cur_path}")
            else:
                dst_brand, model, gen, note = action
                dst_dir = KB / dst_brand / model / gen
                copy_action, dst_md = safe_copy(src_md, dst_dir)

                # meta.json
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
                m["ingested_from"] = cur_path
                m["ingested_at"] = "2026-04-21"
                m["h3_junk_resolved"] = note
                meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

                # удалить исходную gen-папку
                shutil.rmtree(str(src_dir))
                # удалить parent если пустая
                parent = src_dir.parent
                if parent.exists() and not any(parent.iterdir()):
                    parent.rmdir()

                stats["moved"] += 1
                print(f"MOVE  {cur_path} → {dst_brand}/{model}/{gen} ({copy_action})")
        except Exception as e:
            stats["errors"] += 1
            print(f"ERR   {cur_path}: {e}")

    print(f"\n[summary] {stats}")


if __name__ == "__main__":
    main()
