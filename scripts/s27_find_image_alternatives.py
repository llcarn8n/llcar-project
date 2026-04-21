#!/usr/bin/env python3
"""Для 360 manual.md без картинок — ищем в D:\\manuals-export альтернативы.

Логика:
 - Для каждого kb/<brand>/<model>/<gen>/manual.md без image refs:
   - смотрим все D:\\manuals-export/<brand>/<src_dir>/manual.md
   - выбираем те что содержат ![](images/<hash>.webp)
   - среди них берём тот у кого максимум уникальных hash'ей
   - проверяем fuzzy совпадение с model через имя src_dir
 - Вывод: CSV/MD таблица "что можно улучшить"
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
SRC = Path("D:/manuals-export")
IMG_RE = re.compile(r"!\[[^\]]*\]\(images/([a-f0-9]{8,64})\.webp\)")

# brand alias (source → kb)
BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}
# reverse — для поиска src в альтернативном брендовом папке
BRAND_REV = {v: [k for k, v2 in BRAND_ALIAS.items() if v2 == v] + [v] for v in set(BRAND_ALIAS.values())}


def count_images(md_path: Path) -> int:
    try:
        text = md_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return 0
    return len(set(IMG_RE.findall(text)))


def list_src_candidates(brand: str, model: str) -> list[tuple[str, Path, int]]:
    """Вернуть список (src_dir_name, path, image_count) для D:\\manuals-export/<brand>/*/manual.md
    где src_dir_name содержит model."""
    results = []
    brands_to_check = BRAND_REV.get(brand, [brand])
    for src_brand in brands_to_check:
        base = SRC / src_brand
        if not base.exists():
            continue
        for src_dir in base.iterdir():
            if not src_dir.is_dir():
                continue
            name = src_dir.name.lower()
            if model.lower() not in name:
                continue
            md = src_dir / "manual.md"
            if not md.exists():
                continue
            cnt = count_images(md)
            if cnt > 0:
                results.append((src_dir.name, md, cnt))
    return sorted(results, key=lambda x: -x[2])  # по убыванию картинок


def main():
    check_data = json.loads(Path(".omc/research/s27-images-check.json").read_text(encoding="utf-8"))
    no_img = check_data["no_images_manuals"]

    can_replace: list[dict] = []
    no_source_found: list[str] = []

    for rel in no_img:
        parts = rel.split("/")
        if len(parts) < 3:
            continue
        brand, model, gen = parts[0], parts[1], parts[2]
        candidates = list_src_candidates(brand, model)
        if candidates:
            top = candidates[0]
            can_replace.append({
                "rel": rel,
                "brand": brand, "model": model, "gen": gen,
                "best_src_dir": top[0],
                "best_src_path": str(top[1]).replace("\\", "/"),
                "image_count": top[2],
                "alternatives": [{"src_dir": c[0], "imgs": c[2]} for c in candidates[1:4]],
            })
        else:
            no_source_found.append(rel)

    print(f"[summary]")
    print(f"  всего без картинок:     {len(no_img)}")
    print(f"  можно заменить на версию с картинками: {len(can_replace)}")
    print(f"  картинок нет нигде в D:\\:  {len(no_source_found)}")

    # первые 30 можно заменить
    print(f"\n[первые 30 кандидаты на замену]")
    for r in can_replace[:30]:
        print(f"  {r['rel']} → D:\\{r['brand']}/{r['best_src_dir']} ({r['image_count']} img)")

    out = Path(".omc/research/s27-image-alternatives.json")
    out.write_text(json.dumps({
        "total_no_images": len(no_img),
        "can_replace": can_replace,
        "no_source_found": no_source_found,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[out] {out}")


if __name__ == "__main__":
    main()
