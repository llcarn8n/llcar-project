#!/usr/bin/env python3
"""S27 H3.1-fix Phase 5 — автономное разрешение ВСЕХ 152 model==gen victims.

Стратегия (БЕЗ удалений, ни один файл не теряется):
 1. deep-extract year (whole file + D:\\источник)
 2. собирать KB index реальных поколений
 3. decision logic:
    - 0 real gens + year → create `<model>_<year>`
    - 0 real gens, no year → create `<model>_unknown` (flag needs_review:true)
    - 1 real gen + year matches its range → rename victim → existing_gen (коллизия manual.md → _variant.md)
    - 1 real gen + year differs OR year unknown → rename → existing_gen (merge)
    - >=2 real gens + year found, matches range → merge into that gen
    - >=2 real gens, year unknown → merge into NEWEST gen (latest year in slug)

 4. Collisions (новая папка уже существует):
    - Если target gen-dir существует → merge:
      * manual.md → если у target уже есть manual.md → сохранить victim как `manual_variant.md`
      * meta.json, index.json → не трогать target; copy из victim с суффиксом `_variant`
    - victim gen-dir удаляется ПОСЛЕ копирования содержимого (файлы не теряются)

Usage:
    python scripts/s27_autoresolve_all.py --dry-run
    python scripts/s27_autoresolve_all.py --apply
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
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)
PATTERNS = [
    ("paren", re.compile(r"\((\d{4})(?:\s*[-–]\s*\d{4})?\)")),
    ("range", re.compile(r"\b(19[89]\d|20[0-2]\d)\s*[-–]\s*(?:19[89]\d|20[0-2]\d)\b")),
    ("ru_prod", re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*(?:г\.?|год)", re.I)),
    ("ru_vypusk", re.compile(r"выпуск(?:а|ов)?\s*с\s*(19[89]\d|20[0-2]\d)", re.I)),
    ("ru_god", re.compile(r"(19[89]\d|20[0-2]\d)\s*(?:года?|г\.)\s*в[ыы]?пуска", re.I)),
    ("en_from", re.compile(r"\b(?:from|since|model\s*year|MY)\s*(19[89]\d|20[0-2]\d)\b", re.I)),
    ("my_suffix", re.compile(r"\b(\d{2})\s*MY\b", re.I)),
    ("datestamp", re.compile(r"\b(20[012]\d)(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b")),
    ("filename_year", re.compile(r"_(19[89]\d|20[0-2]\d)[_.\-]")),
    ("source_year", re.compile(r"[Ss]ource:\s*.{0,100}?(19[89]\d|20[0-2]\d)")),
]
GEN_YEAR_IN_SLUG_RE = re.compile(r"_(19[89]\d|20[0-2]\d)(?:_|$)")


def strip_tech(text: str) -> str:
    return TECH_FIELD_RE.sub("", text)


def extract_year(text: str, source_hint: str) -> int | None:
    clean = strip_tech(text)
    combined = (source_hint or "") + "\n" + clean[:200000]
    for _name, rx in PATTERNS:
        m = rx.search(combined)
        if not m:
            continue
        try:
            raw = m.group(1)
            y = int(raw)
            if y < 100:
                y = 2000 + y
            if 1980 <= y <= 2027:
                return y
        except (ValueError, IndexError):
            continue
    return None


def read_source_hints(brand: str, src_dir: str, src_root: Path) -> str:
    hints: list[str] = []
    base = src_root / brand / src_dir
    if not base.exists():
        return ""
    for fname in ("meta.json", "manual_meta.json", "source_info.txt", "info.txt"):
        p = base / fname
        if p.exists():
            try:
                hints.append(p.read_text(encoding="utf-8", errors="replace")[:4000])
            except Exception:
                pass
    try:
        for child in base.iterdir():
            if child.suffix.lower() in (".pdf", ".md", ".json", ".txt"):
                hints.append(child.name)
    except Exception:
        pass
    return "\n".join(hints)


def extract_year_from_slug(slug: str) -> int | None:
    m = GEN_YEAR_IN_SLUG_RE.search(slug)
    if m:
        try:
            y = int(m.group(1))
            if 1980 <= y <= 2027:
                return y
        except ValueError:
            pass
    return None


def build_kb_index(kb: Path) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for brand_dir in sorted(kb.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_") or brand_dir.name.startswith("."):
            continue
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith("_") or model_dir.name.startswith("."):
                continue
            gens: list[str] = []
            for gen_dir in sorted(model_dir.iterdir()):
                if not gen_dir.is_dir() or gen_dir.name.startswith("_") or gen_dir.name.startswith("."):
                    continue
                if gen_dir.name == model_dir.name:
                    continue
                if (gen_dir / "manual.md").exists() or (gen_dir / "meta.json").exists() or (gen_dir / "situations.json").exists():
                    gens.append(gen_dir.name)
            if gens:
                idx[f"{brand_dir.name}/{model_dir.name}"] = gens
    return idx


def decide(victim_year: int | None, existing_gens: list[str]) -> tuple[str, str, str]:
    """Return (action, target_gen, rationale).

    action: 'create_new' | 'merge_into'
    target_gen: новое имя gen-slug
    """
    if not existing_gens:
        if victim_year:
            return "create_new", f"_year_{victim_year}", f"0 gens + year {victim_year}"
        return "create_new", "_unknown", "0 gens, no year → <model>_unknown"

    # имеем >=1 существующих gen
    gens_with_year = [(g, extract_year_from_slug(g)) for g in existing_gens]

    if len(existing_gens) == 1:
        only_g, only_y = gens_with_year[0]
        if victim_year and only_y:
            if abs(victim_year - only_y) <= 3:
                return "merge_into", only_g, f"1 gen {only_g}, year близко ({victim_year}~{only_y})"
            # разные годы → создать новый
            return "create_new", f"_year_{victim_year}", f"1 gen {only_g}({only_y}) ≠ {victim_year} → новое"
        # year unknown → merge в единственное
        return "merge_into", only_g, f"1 gen {only_g} — fallback merge"

    # >=2 существующих gens
    if victim_year:
        sorted_y = sorted(((g, y) for g, y in gens_with_year if y), key=lambda x: x[1])
        for i, (g, y) in enumerate(sorted_y):
            next_y = sorted_y[i+1][1] if i+1 < len(sorted_y) else 9999
            if y <= victim_year < next_y:
                return "merge_into", g, f"year {victim_year} ∈ [{y}..{next_y})"
        return "create_new", f"_year_{victim_year}", f"year {victim_year} вне ranges"

    # year unknown + >=2 gens → merge в newest (по year in slug)
    with_year = [(g, y) for g, y in gens_with_year if y]
    if with_year:
        newest = max(with_year, key=lambda x: x[1])[0]
        return "merge_into", newest, f">=2 gens, год неизв. → newest {newest}"
    # None имеет year в slug — merge в lex-max
    fallback = sorted(existing_gens)[-1]
    return "merge_into", fallback, f">=2 gens без года в slug → lex-last {fallback}"


def safe_move_merge(src_dir: Path, dst_dir: Path) -> list[str]:
    """Перемещает содержимое src_dir в dst_dir, сохраняя все файлы.
    Коллизии → суффикс `_variant_<N>` для перемещаемого файла.
    Возвращает список действий.
    """
    log: list[str] = []
    if not dst_dir.exists():
        dst_dir.parent.mkdir(parents=True, exist_ok=True)
        src_dir.rename(dst_dir)
        log.append(f"rename → {dst_dir.name}")
        return log

    # dst уже существует — сливаем файлы
    for item in list(src_dir.iterdir()):
        target = dst_dir / item.name
        if not target.exists():
            shutil.move(str(item), str(target))
            log.append(f"move {item.name}")
        else:
            # коллизия — переименовываем с суффиксом
            stem = item.stem
            suffix = item.suffix
            n = 1
            while True:
                new_name = f"{stem}_variant{n}{suffix}" if n > 1 else f"{stem}_variant{suffix}"
                candidate = dst_dir / new_name
                if not candidate.exists():
                    shutil.move(str(item), str(candidate))
                    log.append(f"move {item.name} → {new_name}")
                    break
                n += 1
    # src_dir должна быть пустой — удалить
    try:
        src_dir.rmdir()
        log.append("old_dir removed")
    except OSError:
        log.append("WARN old_dir not empty after merge")
    return log


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--report", default=".omc/research/s27-autoresolve-report.md")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] укажите --apply или --dry-run", file=sys.stderr)
        return 2

    kb = Path(args.kb_root)
    src_root = Path(args.src_root)
    print("[info] building KB index...")
    kb_idx = build_kb_index(kb)
    print(f"[info] models with real gens: {len(kb_idx)}")

    victims: list[Path] = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) == 4 and parts[1] == parts[2]:
            victims.append(m)
    print(f"[info] victims: {len(victims)}")

    stats = {"create_new": 0, "merge_into": 0, "errors": 0, "total": len(victims)}
    rows: list[dict] = []

    for m in victims:
        parts = m.relative_to(kb).parts
        brand, model, gen, _ = parts
        try:
            text = m.read_text(encoding="utf-8", errors="replace")
        except Exception:
            stats["errors"] += 1
            continue
        source_hint = read_source_hints(brand, gen, src_root)
        year = extract_year(text, source_hint)
        existing_gens = kb_idx.get(f"{brand}/{model}", [])
        action, target_suffix, rationale = decide(year, existing_gens)

        # формируем target_gen_name
        if action == "create_new":
            if target_suffix == "_unknown":
                target_gen = f"{model}_unknown"
            else:
                target_gen = f"{model}{target_suffix}"  # _year_YYYY → <model>_year_YYYY, некрасиво
                # лучше: <model>_<year>
                if target_suffix.startswith("_year_"):
                    y = target_suffix[len("_year_"):]
                    target_gen = f"{model}_{y}"
        else:
            target_gen = target_suffix  # имя существующего gen

        src_dir = m.parent
        dst_dir = src_dir.parent / target_gen
        row = {
            "path": f"{brand}/{model}/{gen}",
            "year": year,
            "existing_gens": existing_gens,
            "action": action,
            "target": target_gen,
            "rationale": rationale,
            "log": [],
        }

        if args.apply:
            if src_dir == dst_dir:
                row["log"].append("same — no-op")
                continue
            try:
                row["log"] = safe_move_merge(src_dir, dst_dir)
                # update meta.json в dst
                meta = dst_dir / "meta.json"
                d = {}
                if meta.exists():
                    try:
                        d = json.loads(meta.read_text(encoding="utf-8"))
                    except Exception:
                        d = {}
                d["generation"] = target_gen
                if year:
                    d["inferred_year"] = year
                if target_gen.endswith("_unknown"):
                    d["needs_review"] = True
                meta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception as e:
                row["log"].append(f"ERR: {e}")
                stats["errors"] += 1
                continue

        stats[action] += 1
        rows.append(row)

    # report
    lines = [
        "# S27 H3.1-fix Phase 5 — Auto-resolve отчёт",
        "",
        f"**Mode:** {'APPLY' if args.apply else 'DRY-RUN'}",
        f"**Всего victims:** {stats['total']}",
        f"- create_new: **{stats['create_new']}**",
        f"- merge_into: **{stats['merge_into']}**",
        f"- errors: **{stats['errors']}**",
        "",
        "## Таблица решений",
        "",
        "| # | path | year | existing | action | target | rationale |",
        "|---:|---|---:|---|---|---|---|",
    ]
    for i, r in enumerate(rows, 1):
        eg = ", ".join(r["existing_gens"]) if r["existing_gens"] else "—"
        yr = str(r["year"]) if r["year"] else "—"
        rat = r["rationale"].replace("|", "\\|")
        lines.append(f"| {i} | `{r['path']}` | {yr} | {eg} | {r['action']} | `{r['target']}` | {rat} |")

    if args.apply:
        lines.append("")
        lines.append("## Лог действий (если APPLY)")
        lines.append("")
        for r in rows:
            if r["log"]:
                lines.append(f"- `{r['path']}` → `{r['target']}`: {'; '.join(r['log'])}")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {args.report}")
    print(f"[summary] {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
