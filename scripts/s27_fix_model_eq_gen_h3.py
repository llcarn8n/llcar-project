#!/usr/bin/env python3
"""S27 H3.1-fix — починить 152 manual.md в структуре <brand>/<model>/<model>/.

Стратегия:
 1. Для каждого `<kb>/<brand>/<model>/<model>/manual.md`:
    a. Прочитать первые 3KB файла
    b. Попытаться извлечь год из title/source/text (5 паттернов)
    c. Если год найден → rename gen-dir → `<model>_<year>`
       - если `<model>_<year>` уже существует → добавить `_v2` суффикс
    d. Если года нет → удалить gen-dir (+ добавить source в blacklist)
 2. Отчёт: .omc/research/s27-h3-fix-report.md
    - renamed: 46±, deleted: 106±, collisions: N

Usage:
    python scripts/s27_fix_model_eq_gen_h3.py --dry-run  # ничего не менять
    python scripts/s27_fix_model_eq_gen_h3.py --apply    # применить
"""
from __future__ import annotations
import argparse
import io
import json
import re
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# Year patterns (в порядке приоритета).
#   Важно: игнорируем технические поля `Chunks: 1984`, `p:1984`, `tier:1984`,
#   `len: 1984`, `chunk: 1984`, `layer:...`. Эти поля — количество chunks/pages,
#   а не год выпуска авто.
YEAR_PAREN_RE = re.compile(r"\((\d{4})(?:\s*[-–]\s*\d{4})?\)")
YEAR_RANGE_RE = re.compile(r"\b(19[89]\d|20[0-2]\d)\s*[-–]\s*(19[89]\d|20[0-2]\d)\b")
# модельный год `24MY`, `2024MY`, `MY2024`
MY_RE = re.compile(r"\b(?:MY)?(\d{2,4})\s*MY\b|\bMY\s*(\d{2,4})\b", re.I)
# timestamp в filename `20240501`, `2024_05_01`
DATESTAMP_RE = re.compile(r"\b(20[012]\d)[_\-]?(?:0[1-9]|1[0-2])[_\-]?(?:0[1-9]|[12]\d|3[01])\b")
YEAR_SINGLE_RE = re.compile(r"\b(19[89]\d|20[0-2]\d)\b")
# RU-паттерны «с 2008 г.», «выпуск с 2005», «с 2016 года»
RU_PROD_RE = re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*(?:г\.?|год)", re.I)
# EN-паттерны `(from 2008)`, `model year 2016`
EN_PROD_RE = re.compile(r"\b(?:from|since|model\s*year)\s+(19[89]\d|20[0-2]\d)\b", re.I)
# поля для исключения: Chunks: 1984  |  chunks:1984  |  p:42  |  tier:2  |  layer:...
TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)


def _strip_tech_fields(text: str) -> str:
    return TECH_FIELD_RE.sub("", text)


def extract_year(text_head: str) -> int | None:
    """Извлечь год выпуска авто из первых 3KB. Приоритет:
       1. (YYYY) или (YYYY-YYYY) в первых 500 байт  — явный range
       2. YYYY-YYYY range
       3. YYMY/YYYYMY (модельный год)
       4. YYYYMMDD (дата печати в filename)
       5. Одиночный YYYY в первых 200 байт (title/source) — послед. средство
       Техн. поля `Chunks:N`, `p:N` вырезаются до поиска.
    """
    clean = _strip_tech_fields(text_head)
    head500 = clean[:500]
    head200 = clean[:200]
    head1500 = clean[:1500]

    # 0. RU/EN «с 2008 г.» / `from 2005` — явный маркер года выпуска
    for rx in (RU_PROD_RE, EN_PROD_RE):
        m = rx.search(head1500)
        if m:
            y = int(m.group(1))
            if 1980 <= y <= 2027:
                return y

    # 1. (YYYY) в первых 500
    m = YEAR_PAREN_RE.search(head500)
    if m:
        y = int(m.group(1))
        if 1980 <= y <= 2027:
            return y

    # 2. YYYY-YYYY
    m = YEAR_RANGE_RE.search(head500)
    if m:
        y = int(m.group(1))
        if 1980 <= y <= 2027:
            return y

    # 3. модельный год `24MY` / `MY2024`
    m = MY_RE.search(head500)
    if m:
        raw = m.group(1) or m.group(2)
        if raw:
            y = int(raw)
            if y < 100:
                y = 2000 + y
            if 1980 <= y <= 2027:
                return y

    # 4. timestamp в filename (20240501)
    m = DATESTAMP_RE.search(head500)
    if m:
        y = int(m.group(1))
        if 1980 <= y <= 2027:
            return y

    # 5. одиночный YYYY — только в первых 200 байт (title/source)
    m = YEAR_SINGLE_RE.search(head200)
    if m:
        y = int(m.group(1))
        if 1980 <= y <= 2027:
            return y

    # Fallback: (YYYY) в полном head
    m = YEAR_PAREN_RE.search(clean)
    if m:
        y = int(m.group(1))
        if 1980 <= y <= 2027:
            return y
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--blacklist", default=".omc/research/s27-source-blacklist.txt")
    ap.add_argument("--report", default=".omc/research/s27-h3-fix-report.md")
    ap.add_argument("--apply", action="store_true", help="действительно применять")
    ap.add_argument("--dry-run", action="store_true", help="только dry-run")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] укажите либо --apply либо --dry-run (не оба)", file=sys.stderr)
        return 2

    kb = Path(args.kb_root)
    # Найти все model==gen пары
    victims: list[Path] = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) == 4 and parts[1] == parts[2]:
            victims.append(m)
    print(f"[info] найдено model==gen: {len(victims)}")

    renamed: list[tuple[str, str, int]] = []  # (old, new, year)
    deleted: list[str] = []  # old paths
    collisions: list[tuple[str, str]] = []

    blacklist_lines: list[str] = []

    for m in victims:
        parts = m.relative_to(kb).parts
        brand, model, gen, _ = parts
        gen_dir = m.parent  # .../<brand>/<model>/<model>/
        try:
            head = m.read_text(encoding="utf-8", errors="replace")[:3000]
        except Exception:
            print(f"[warn] не могу прочесть: {m}", file=sys.stderr)
            continue
        year = extract_year(head)
        if year:
            new_gen = f"{model}_{year}"
            new_dir = gen_dir.parent / new_gen
            if new_dir.exists():
                # collision
                alt = f"{model}_{year}_v2"
                new_dir = gen_dir.parent / alt
                new_gen = alt
                collisions.append((f"{brand}/{model}/{gen}", f"{brand}/{model}/{alt}"))
                if new_dir.exists():
                    # глухая collision — удалить исходник, добавить в blacklist
                    deleted.append(f"{brand}/{model}/{gen}")
                    blacklist_lines.append(f"{brand}/{model}  # collision w/ {alt}")
                    if args.apply:
                        shutil.rmtree(gen_dir)
                    continue
            renamed.append((f"{brand}/{model}/{gen}", f"{brand}/{model}/{new_gen}", year))
            if args.apply:
                gen_dir.rename(new_dir)
                # fix meta.json
                meta = new_dir / "meta.json"
                if meta.exists():
                    try:
                        d = json.loads(meta.read_text(encoding="utf-8"))
                        d["generation"] = new_gen
                        d["inferred_year"] = year
                        meta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
                    except Exception:
                        pass
        else:
            # года нет — delete + blacklist source
            deleted.append(f"{brand}/{model}/{gen}")
            blacklist_lines.append(f"{brand}/{model}  # generic manual, no gen year")
            if args.apply:
                shutil.rmtree(gen_dir)

    # Append blacklist
    if args.apply and blacklist_lines:
        bp = Path(args.blacklist)
        existing = set(bp.read_text(encoding="utf-8").splitlines()) if bp.exists() else set()
        new_lines = [ln for ln in blacklist_lines if ln.split("#")[0].strip() not in existing]
        with bp.open("a", encoding="utf-8") as f:
            f.write("\n# --- S27 H3.1-fix generic manual cleanup ---\n")
            for ln in new_lines:
                f.write(ln + "\n")
        print(f"[info] добавлено в blacklist: {len(new_lines)}")

    # Report
    lines = [
        "# S27 H3.1-fix — отчёт по починке model==gen дубликатов",
        "",
        f"**Mode:** {'APPLY' if args.apply else 'DRY-RUN'}",
        f"**Всего victims:** {len(victims)}",
        f"**Renamed (с извлечённым годом):** {len(renamed)}",
        f"**Deleted (года нет):** {len(deleted)}",
        f"**Collisions (добавлен _v2):** {len(collisions)}",
        "",
        "## Renamed (gen определён через год)",
        "",
        "| old path | new path | year |",
        "|---|---|---|",
    ]
    for o, n, y in sorted(renamed):
        lines.append(f"| {o} | {n} | {y} |")
    lines.append("")
    lines.append(f"## Deleted (generic, no year, blacklisted) — {len(deleted)}")
    lines.append("")
    for d in sorted(deleted):
        lines.append(f"- {d}")
    if collisions:
        lines.append("")
        lines.append(f"## Collisions — {len(collisions)}")
        lines.append("")
        for o, n in collisions:
            lines.append(f"- {o} → {n}")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {args.report}")
    print(f"[summary] renamed={len(renamed)}, deleted={len(deleted)}, collisions={len(collisions)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
