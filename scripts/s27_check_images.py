#!/usr/bin/env python3
"""Проверка наличия изображений для всех manual.md в kb/.

Считает:
 - сколько manual.md содержат ссылки ![](images/<hash>.webp)
 - сколько ссылок уникальных
 - сколько из них есть в D:\\manuals-export/*/images/<hash>.webp
 - сколько broken (в D:\\ не найдено)

НЕ трогает /var/kb-images/ на сервере (это отдельная проверка).
"""
from __future__ import annotations
import io
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


KB = Path("llcar-dashboard/public/data/kb")
SRC = Path("D:/manuals-export")
IMG_RE = re.compile(r"!\[[^\]]*\]\(images/([a-f0-9]{8,64})\.webp\)")


def build_src_index() -> set[str]:
    """Все hash'и .webp что физически есть в D:\\manuals-export/*/images/"""
    hashes: set[str] = set()
    for brand_dir in SRC.iterdir():
        if not brand_dir.is_dir():
            continue
        for model_dir in brand_dir.iterdir():
            if not model_dir.is_dir():
                continue
            img_dir = model_dir / "images"
            if not img_dir.exists():
                continue
            for f in img_dir.iterdir():
                if f.suffix.lower() == ".webp":
                    hashes.add(f.stem)
    return hashes


def scan_manuals() -> dict:
    stats = {
        "total_manuals": 0,
        "with_images": 0,
        "without_images": 0,
        "total_refs": 0,
        "unique_hashes": set(),
        "per_manual": [],
    }
    for md in KB.rglob("manual.md"):
        if md.stat().st_size < 100:
            continue
        stats["total_manuals"] += 1
        try:
            text = md.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        hashes = set(IMG_RE.findall(text))
        if hashes:
            stats["with_images"] += 1
            stats["total_refs"] += len(hashes)
            stats["unique_hashes"].update(hashes)
            stats["per_manual"].append({
                "rel": str(md.relative_to(KB)).replace("\\", "/"),
                "ref_count": len(hashes),
            })
        else:
            stats["without_images"] += 1
            stats["per_manual"].append({
                "rel": str(md.relative_to(KB)).replace("\\", "/"),
                "ref_count": 0,
            })
    return stats


def main():
    print("[scan] KB manuals…")
    stats = scan_manuals()

    print("[scan] D:\\manuals-export images…")
    src_hashes = build_src_index()

    unique = stats["unique_hashes"]
    found_in_src = unique & src_hashes
    broken = unique - src_hashes

    print(f"\n=== МАНУАЛЫ ===")
    print(f"Всего manual.md:        {stats['total_manuals']}")
    print(f"С картинками:           {stats['with_images']} ({100*stats['with_images']/max(1,stats['total_manuals']):.1f}%)")
    print(f"Без картинок:           {stats['without_images']} ({100*stats['without_images']/max(1,stats['total_manuals']):.1f}%)")
    print(f"\n=== ССЫЛКИ НА КАРТИНКИ ===")
    print(f"Всего ссылок:           {stats['total_refs']}")
    print(f"Уникальных hash:        {len(unique)}")
    print(f"\n=== ФИЗИЧЕСКИЙ ИСТОЧНИК (D:\\manuals-export) ===")
    print(f"Всего .webp в D:\\:      {len(src_hashes)}")
    print(f"Из используемых найдено:{len(found_in_src)} ({100*len(found_in_src)/max(1,len(unique)):.2f}%)")
    print(f"Битые (нет в D:\\):     {len(broken)} ({100*len(broken)/max(1,len(unique)):.2f}%)")

    # без картинок — топ 15 примеров
    no_img = [p for p in stats["per_manual"] if p["ref_count"] == 0][:15]
    print(f"\n=== ПРИМЕРЫ БЕЗ КАРТИНОК (топ 15) ===")
    for p in no_img:
        print(f"  {p['rel']}")

    out = Path(".omc/research/s27-images-check.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        "total_manuals": stats["total_manuals"],
        "with_images": stats["with_images"],
        "without_images": stats["without_images"],
        "total_refs": stats["total_refs"],
        "unique_hashes": len(unique),
        "src_total": len(src_hashes),
        "found_in_src": len(found_in_src),
        "broken": len(broken),
        "broken_samples": sorted(broken)[:50],
        "no_images_manuals": [p["rel"] for p in stats["per_manual"] if p["ref_count"] == 0],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[out] {out}")


if __name__ == "__main__":
    main()
