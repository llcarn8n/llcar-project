#!/usr/bin/env python3
"""S27 — переименовать 22 KB модели чтобы slug совпал с vehicles.json (ratio=1.0).

Все 22 — безопасные: либо `_2/_3` ID-suffix в vehicles.json (одна модель, два entry с разными ID),
либо нормализация (cs35_plus → _cs35_plus, ehs9 → e_hs9, cx7 → cx_7).

Логика:
 - переместить все gen-папки из old_path в new_path (с merge при коллизии)
 - удалить old_path если пуст
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

# (kb_brand, kb_model) → (new_brand, new_model)
RENAMES = [
    ("bmw", "ix3", "bmw", "ix3_2"),
    ("byd", "dolphin", "byd", "dolphin_2"),
    ("byd", "han", "byd", "han_2"),
    ("changan", "cs35_plus", "changan", "_cs35_plus"),
    ("forthing", "friday", "forthing", "_friday"),
    ("geely", "cityray", "geely", "_cityray"),
    ("hongqi", "ehs9", "hongqi", "e_hs9"),
    ("mazda", "cx7", "mazda", "cx_7"),
    ("omoda", "c5", "omoda", "_c5"),
    ("renault", "kangoo", "renault", "kangoo_2"),
    ("skoda", "fabia", "skoda", "fabia_2"),
    ("skoda", "octavia", "skoda", "octavia_3"),
    ("skoda", "scala", "skoda", "scala_2"),
    ("skoda", "superb", "skoda", "superb_2"),
    ("toyota", "hilux", "toyota", "hilux_2"),
    ("volkswagen", "golf", "volkswagen", "golf_2"),
    ("volkswagen", "jetta", "volkswagen", "jetta_2"),
    ("volkswagen", "passat", "volkswagen", "passat_2"),
    ("volkswagen", "polo", "volkswagen", "polo_2"),
    ("volkswagen", "tiguan", "volkswagen", "tiguan_2"),
    ("voyah", "dreamer", "voyah", "dreamer_2"),
    ("voyah", "free", "voyah", "free_2"),
]


def merge_dir(src: Path, dst: Path) -> list[str]:
    log = []
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return [f"RENAME -> {dst}"]
    # сливаем gen-папки
    for gen_dir in list(src.iterdir()):
        if not gen_dir.is_dir():
            continue
        target = dst / gen_dir.name
        if not target.exists():
            shutil.move(str(gen_dir), str(target))
            log.append(f"MOVE gen {gen_dir.name}")
        else:
            # коллизия — пробуем как _variant
            n = 1
            while True:
                cand = dst / f"{gen_dir.name}_variant{n if n>1 else ''}"
                if not cand.exists():
                    shutil.move(str(gen_dir), str(cand))
                    log.append(f"MOVE gen {gen_dir.name} -> {cand.name} (collision)")
                    break
                n += 1
    # удаляем пустую src
    try:
        src.rmdir()
        log.append("rmdir src")
    except OSError:
        log.append("WARN src not empty")
    return log


def main():
    stats = {"renamed": 0, "merged": 0, "missing": 0, "errors": 0}
    for kb_brand, kb_model, new_brand, new_model in RENAMES:
        src = KB / kb_brand / kb_model
        dst = KB / new_brand / new_model
        if not src.exists():
            stats["missing"] += 1
            print(f"MISSING {kb_brand}/{kb_model}")
            continue
        try:
            log = merge_dir(src, dst)
            if dst.exists() and "RENAME" in str(log):
                stats["renamed"] += 1
            else:
                stats["merged"] += 1
            print(f"{kb_brand}/{kb_model} -> {new_brand}/{new_model}: {'; '.join(log)}")
        except Exception as e:
            stats["errors"] += 1
            print(f"ERR {kb_brand}/{kb_model}: {e}")
    print(f"\n[summary] {stats}")


if __name__ == "__main__":
    main()
