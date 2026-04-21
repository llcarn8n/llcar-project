#!/usr/bin/env python3
"""S27 H3.9 — сгенерировать индекс всех существующих gen-папок в kb/.

Формат JSON:
{
  "version": 1,
  "generated_at": "2026-04-21",
  "brands": {
    "mercedes": {
      "models": {
        "e_class": ["e_class_w211", "e_class_w213", "xv60_2012"]
      }
    }
  }
}

Используется в llcar-dashboard/src/utils/kbPath.ts как fallback когда
deriveKBGenPath не находит совпадения — берёт первый gen из индекса для модели.
"""
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


KB_ROOT = Path("llcar-dashboard/public/data/kb")
OUT_TS = Path("llcar-dashboard/src/data/kb-generations-index.json")
OUT_PUBLIC = Path("llcar-dashboard/public/data/kb/_kb_generations_index.json")


def scan() -> dict:
    brands: dict[str, dict] = {}
    for brand_dir in sorted(KB_ROOT.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        brand = brand_dir.name
        models: dict[str, list[str]] = {}
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir():
                continue
            gens_with_manual: list[str] = []
            for gen_dir in sorted(model_dir.iterdir()):
                if not gen_dir.is_dir():
                    continue
                manual_md = gen_dir / "manual.md"
                if manual_md.exists() and manual_md.stat().st_size > 1024:  # > 1KB
                    gens_with_manual.append(gen_dir.name)
            if gens_with_manual:
                models[model_dir.name] = gens_with_manual
        if models:
            brands[brand] = {"models": models}
    return {
        "version": 1,
        "generated_at": "2026-04-21",
        "brands": brands,
    }


def main() -> int:
    data = scan()
    brand_count = len(data["brands"])
    model_count = sum(len(b["models"]) for b in data["brands"].values())
    gen_count = sum(
        len(gens)
        for b in data["brands"].values()
        for gens in b["models"].values()
    )

    # JSON файл для импорта через TS
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # копия в public/ на случай если кто-то хочет fetch
    OUT_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_PUBLIC.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    print(f"[done] brands={brand_count} models={model_count} generations={gen_count}")
    print(f"[out] {OUT_TS}")
    print(f"[out] {OUT_PUBLIC}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
