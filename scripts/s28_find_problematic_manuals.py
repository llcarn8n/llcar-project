#!/usr/bin/env python3
"""S28 — find large manual.md files WITHOUT H2 headers.

Парсер `parseMarkdownSections` в `llcar-dashboard/src/components/kb/ManualViewer.tsx`
fallback'ом создаёт одну секцию «Содержание» если ни одного `^## ` заголовка нет.
Для больших мануалов (500KB+) это блокирует main thread при expand.

Выход: `.omc/research/s28-manuals-no-h2.md` — таблица problematic мануалов +
JSON список для batch GLM re-ingest.

Флаг --exclude-image-alts убирает из списка 129 мануалов которые будут
заменены в Фазе 5 (иначе GLM зря поработает).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KB_DIR = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
IMAGE_ALTS = ROOT / ".omc" / "research" / "s27-image-alternatives.json"
OUT_MD = ROOT / ".omc" / "research" / "s28-manuals-no-h2.md"
OUT_JSON = ROOT / ".omc" / "research" / "s28-manuals-no-h2.json"

MIN_SIZE_BYTES = 300 * 1024  # 300 KB


def has_h2(md_path: Path) -> bool:
    """Быстрая проверка: есть ли хоть один '^## ' (H2 markdown)?"""
    try:
        with md_path.open("r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("## ") or line.startswith("### "):
                    return True
    except Exception:
        return True  # на всякий — считаем ок чтобы не тронули
    return False


def count_headers(md_path: Path) -> tuple[int, int, int]:
    """Возвращает (h1_count, h2_count, h3_count)."""
    h1 = h2 = h3 = 0
    try:
        with md_path.open("r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("# "):
                    h1 += 1
                elif line.startswith("## "):
                    h2 += 1
                elif line.startswith("### "):
                    h3 += 1
    except Exception:
        pass
    return h1, h2, h3


def word_count_approx(md_path: Path) -> int:
    """Грубая оценка: size_bytes / 6 (средняя длина русского слова + пробел)."""
    try:
        return md_path.stat().st_size // 6
    except Exception:
        return 0


def load_image_alts_paths() -> set[str]:
    """Загружает relative paths из can_replace[] в s27-image-alternatives.json."""
    if not IMAGE_ALTS.exists():
        return set()
    data = json.loads(IMAGE_ALTS.read_text(encoding="utf-8"))
    return {entry["rel"] for entry in data.get("can_replace", [])}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--min-size-kb", type=int, default=300,
                   help="Минимальный размер файла в KB (default 300).")
    p.add_argument("--exclude-image-alts", action="store_true",
                   help="Исключить мануалы из s27-image-alternatives.can_replace (будут перезаписаны в Фазе 5).")
    args = p.parse_args()

    min_bytes = args.min_size_kb * 1024
    excluded_paths = load_image_alts_paths() if args.exclude_image_alts else set()

    problematic: list[dict[str, object]] = []
    total_scanned = 0
    skipped_image_alt = 0

    for md_path in KB_DIR.rglob("manual.md"):
        total_scanned += 1
        size = md_path.stat().st_size
        if size < min_bytes:
            continue

        h1, h2, h3 = count_headers(md_path)
        if h2 > 0 or h3 > 0:
            continue  # есть структура — не трогаем

        rel = str(md_path.relative_to(KB_DIR)).replace("\\", "/")
        # rel формата "bmw/x5/x5_e70_2007/manual.md"
        if rel in excluded_paths:
            skipped_image_alt += 1
            continue

        parts = rel.split("/")
        entry = {
            "rel": rel,
            "brand": parts[0] if len(parts) > 0 else "?",
            "model": parts[1] if len(parts) > 1 else "?",
            "gen": parts[2] if len(parts) > 2 else "?",
            "size_kb": round(size / 1024, 1),
            "words_approx": word_count_approx(md_path),
            "h1_count": h1,
            "h2_count": h2,
            "h3_count": h3,
            "in_image_alts": rel in excluded_paths,
        }
        problematic.append(entry)

    problematic.sort(key=lambda e: -e["size_kb"])  # от крупных к мелким

    # Write markdown report
    with OUT_MD.open("w", encoding="utf-8") as f:
        f.write(f"# S28 — problematic manuals (no H2 headers)\n\n")
        f.write(f"Scanned: {total_scanned} manual.md\n\n")
        f.write(f"Min size: {args.min_size_kb} KB\n\n")
        if args.exclude_image_alts:
            f.write(f"Excluded {skipped_image_alt} manuals from image-alternatives (will be rewritten in Phase 5)\n\n")
        f.write(f"Found {len(problematic)} problematic manuals.\n\n")
        f.write("| # | brand / model / gen | size KB | ≈words | H1 |\n")
        f.write("|---|---|--:|--:|--:|\n")
        for i, e in enumerate(problematic, 1):
            f.write(f"| {i} | `{e['brand']}/{e['model']}/{e['gen']}` | {e['size_kb']} | {e['words_approx']:,} | {e['h1_count']} |\n")

    OUT_JSON.write_text(
        json.dumps(problematic, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"[s28-find-problematic] scanned {total_scanned} manual.md files")
    print(f"[s28-find-problematic] found {len(problematic)} problematic (no H2, size >= {args.min_size_kb} KB)")
    if args.exclude_image_alts:
        print(f"[s28-find-problematic] excluded {skipped_image_alt} image-alts candidates")
    if problematic:
        print("\nTop 10 by size:")
        for e in problematic[:10]:
            print(f"  {e['size_kb']:>8.1f} KB  {e['rel']}  (~{e['words_approx']:,} words)")
    print(f"\nOutput: {OUT_MD.relative_to(ROOT)}")
    print(f"        {OUT_JSON.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
