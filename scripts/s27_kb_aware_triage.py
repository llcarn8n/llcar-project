#!/usr/bin/env python3
"""S27 H3.1-fix Phase 4 — KB-aware triage для model==gen мануалов.

Для каждого `<kb>/<brand>/<model>/<model>/manual.md` определяет:
 1. Какие РЕАЛЬНЫЕ поколения уже есть в модели в репе (без model==gen дубликатов)
 2. Какой год извлекается из content + D:\\источника (deep extract)
 3. Suggested action:
    - 0 real gens + year → `create <model>_<year>`
    - 0 real gens, no year → `manual triage` (нужен ручной ввод)
    - 1 real gen + year совпадает с ним → `merge into <existing_gen>` (если уже есть manual.md — flag конфликт)
    - 1 real gen, year разный → `create <model>_<year>` (новое поколение)
    - 1 real gen, year unknown → `merge into <existing_gen>` (fallback — единственное поколение)
    - >=2 real gens + year → `match to <existing_gen>` если year внутри range (по имени gen типа `b5_1997`), иначе `create <model>_<year>`
    - >=2 real gens, year unknown → `manual triage`

Outputs:
 - .omc/research/s27-kb-aware-triage.md — таблица с suggestions

После ручной верификации → apply-скрипт на колонке `decision`.
"""
from __future__ import annotations
import argparse
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


# === deep year extraction (тот же набор что в s27_extract_year_deep.py) ===
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


def extract_year(text: str, source_hint: str) -> tuple[int | None, str]:
    clean = strip_tech(text)
    combined = (source_hint or "") + "\n" + clean[:200000]
    for name, rx in PATTERNS:
        m = rx.search(combined)
        if not m:
            continue
        try:
            raw = m.group(1)
            y = int(raw)
            if y < 100:
                y = 2000 + y
            if 1980 <= y <= 2027:
                return y, name
        except (ValueError, IndexError):
            continue
    return None, ""


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
    """Returns '<brand>/<model>' → list[gen_slug] (real gens, exclude model==gen dubликаты)."""
    idx: dict[str, list[str]] = {}
    for brand_dir in sorted(kb.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith("_"):
                continue
            gens: list[str] = []
            for gen_dir in sorted(model_dir.iterdir()):
                if not gen_dir.is_dir() or gen_dir.name.startswith("_"):
                    continue
                if gen_dir.name == model_dir.name:
                    # model==gen дубликат — пропускаем
                    continue
                # проверяем есть ли manual.md или хотя бы meta.json (т.е. это gen а не misc)
                if (gen_dir / "manual.md").exists() or (gen_dir / "meta.json").exists() or (gen_dir / "situations.json").exists():
                    gens.append(gen_dir.name)
            if gens:
                idx[f"{brand_dir.name}/{model_dir.name}"] = gens
    return idx


def suggest_action(victim_year: int | None, existing_gens: list[str]) -> tuple[str, str]:
    """Return (action_code, rationale)."""
    if not existing_gens:
        if victim_year:
            return f"create:<model>_{victim_year}", "модель без поколений, год известен — создать с годом"
        return "manual_triage", "модель без поколений, год неизвестен — требуется ручной ввод"

    if len(existing_gens) == 1:
        only = existing_gens[0]
        only_year = extract_year_from_slug(only)
        if victim_year and only_year:
            if abs(victim_year - only_year) <= 3:
                return f"merge_into:{only}", f"единственное поколение {only} близко к {victim_year}"
            return f"create:<model>_{victim_year}", f"единственное поколение {only} ({only_year}) не совпадает с {victim_year}"
        # year unknown либо в gen нет года
        return f"merge_into:{only}", f"единственное поколение {only} — fallback merge"

    # >=2 gens
    if victim_year:
        # сортируем gens по году
        gens_with_year = [(g, extract_year_from_slug(g) or 0) for g in existing_gens]
        gens_with_year.sort(key=lambda x: x[1])
        # найти такой где year <= victim_year и следующий start > victim_year
        best = None
        for i, (g, y) in enumerate(gens_with_year):
            if y == 0:
                continue
            next_y = gens_with_year[i+1][1] if i+1 < len(gens_with_year) else 9999
            if y <= victim_year < next_y:
                best = g
                break
        if best:
            return f"merge_into:{best}", f"год {victim_year} попадает в range поколения {best}"
        return f"create:<model>_{victim_year}", f"год {victim_year} вне ranges существующих поколений"

    return "manual_triage", f"{len(existing_gens)} поколений, год неизвестен — ручной выбор"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--report", default=".omc/research/s27-kb-aware-triage.md")
    args = ap.parse_args()

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
    print(f"[info] model==gen victims: {len(victims)}")

    rows: list[dict] = []
    for m in victims:
        parts = m.relative_to(kb).parts
        brand, model, gen, _ = parts
        rel_model = f"{brand}/{model}"
        existing_gens = kb_idx.get(rel_model, [])
        try:
            text = m.read_text(encoding="utf-8", errors="replace")
        except Exception:
            text = ""
        source_hint = read_source_hints(brand, gen, src_root)
        year, reason = extract_year(text, source_hint)
        action, rationale = suggest_action(year, existing_gens)
        rows.append({
            "path": f"{brand}/{model}/{gen}",
            "existing_gens": existing_gens,
            "detected_year": year,
            "year_reason": reason,
            "action": action,
            "rationale": rationale,
        })

    # статистика
    by_action = {}
    for r in rows:
        key = r["action"].split(":")[0]
        by_action[key] = by_action.get(key, 0) + 1

    lines = [
        "# S27 H3.1-fix Phase 4 — KB-aware triage",
        "",
        f"**Всего model==gen мануалов:** {len(rows)}",
        "",
        "## Распределение по suggested action",
        "",
    ]
    for k, v in sorted(by_action.items(), key=lambda x: -x[1]):
        lines.append(f"- `{k}`: **{v}**")
    lines.append("")
    lines.append("## Легенда")
    lines.append("")
    lines.append("- `create:<model>_<year>` — создать новое поколение с извлечённым годом")
    lines.append("- `merge_into:<gen>` — переименовать в существующее поколение (manual.md уже там? → конфликт)")
    lines.append("- `manual_triage` — нужен ручной ввод, поставь decision в колонке")
    lines.append("")
    lines.append("## Таблица (отсортирована по action)")
    lines.append("")
    lines.append("| # | path | existing gens | year | suggested action | decision | rationale |")
    lines.append("|---:|---|---|---:|---|---|---|")
    rows.sort(key=lambda r: (r["action"], r["path"]))
    for i, r in enumerate(rows, 1):
        eg = ", ".join(r["existing_gens"]) if r["existing_gens"] else "—"
        yr = str(r["detected_year"]) if r["detected_year"] else "—"
        act = r["action"]
        rat = r["rationale"].replace("|", "\\|")
        lines.append(f"| {i} | `{r['path']}` | {eg} | {yr} | `{act}` | `____` | {rat} |")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {args.report}")
    print(f"[summary] {by_action}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
