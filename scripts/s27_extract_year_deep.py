#!/usr/bin/env python3
"""S27 H3.1-fix Phase 2 — глубокое извлечение года выпуска для model==gen мануалов.

Стратегия (без удаления!):
 1. Читать весь manual.md (до 200KB), искать года через расширенные паттерны
 2. Читать D:\\manuals-export/<brand>/<src_dir>/meta.json, manual_meta.json (если есть)
 3. Искать год в Source: <filename.pdf> — часто содержит год
 4. Для тех что ВСЁ ЕЩЁ не определились — дампить первые 2000 символов в triage-файл
    для РУЧНОГО ввода года пользователем

Usage:
    python scripts/s27_extract_year_deep.py --dry-run
    # После ручной разметки triage файла → apply-скрипт читает year и делает rename
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


# Расширенный набор паттернов года
PATTERNS = [
    ("paren", re.compile(r"\((\d{4})(?:\s*[-–]\s*\d{4})?\)")),
    ("range", re.compile(r"\b(19[89]\d|20[0-2]\d)\s*[-–]\s*(?:19[89]\d|20[0-2]\d)\b")),
    ("ru_prod", re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*(?:г\.?|год)", re.I)),
    ("ru_vypusk", re.compile(r"выпуск(?:а|ов)?\s*с\s*(19[89]\d|20[0-2]\d)", re.I)),
    ("ru_god", re.compile(r"(19[89]\d|20[0-2]\d)\s*(?:года?|г\.)\s*в[ыы]?пуска", re.I)),
    ("ru_s_god", re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*г", re.I)),
    ("en_from", re.compile(r"\b(?:from|since|model\s*year|MY)\s*(19[89]\d|20[0-2]\d)\b", re.I)),
    ("my_suffix", re.compile(r"\b(\d{2})\s*MY\b", re.I)),
    ("datestamp", re.compile(r"\b(20[012]\d)(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b")),
    ("filename_year", re.compile(r"_(19[89]\d|20[0-2]\d)[_.\-]")),  # в filename
    ("source_year", re.compile(r"[Ss]ource:\s*.{0,100}?(19[89]\d|20[0-2]\d)")),
]

TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)


def strip_tech(text: str) -> str:
    return TECH_FIELD_RE.sub("", text)


def extract_year_deep(text: str, source_hint: str = "") -> tuple[int | None, str]:
    """Return (year, reason) or (None, '')."""
    clean_text = strip_tech(text)
    combined = (source_hint or "") + "\n" + clean_text[:200000]
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
    """Читать D:\\manuals-export/<brand>/<src_dir>/*.json, source_info.txt итд."""
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
    # имена файлов (PDF) из images.json или корня
    try:
        for child in base.iterdir():
            if child.suffix.lower() in (".pdf", ".md", ".json", ".txt"):
                hints.append(child.name)
    except Exception:
        pass
    return "\n".join(hints)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--triage-out", default=".omc/research/s27-manual-year-triage.md")
    ap.add_argument("--auto-plan-out", default=".omc/research/s27-manual-year-auto-plan.md")
    args = ap.parse_args()

    kb = Path(args.kb_root)
    src_root = Path(args.src_root)

    victims: list[Path] = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) == 4 and parts[1] == parts[2]:
            victims.append(m)
    print(f"[info] model==gen: {len(victims)}")

    auto_found: list[tuple[str, int, str]] = []  # (path, year, reason)
    need_manual: list[tuple[str, str, str]] = []  # (path, preview, size_str)

    for m in victims:
        parts = m.relative_to(kb).parts
        brand, model, gen, _ = parts
        try:
            text = m.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        size_kb = len(text) // 1024
        source_hint = read_source_hints(brand, gen, src_root)
        year, reason = extract_year_deep(text, source_hint)
        rel = f"{brand}/{model}/{gen}"
        if year:
            auto_found.append((rel, year, reason))
        else:
            # preview: первые 3 непустые строки
            lines = [ln.strip() for ln in text.splitlines() if ln.strip()][:6]
            preview = " | ".join(lines)[:300]
            # + пробуем вытянуть source filename
            src_match = re.search(r"[Ss]ource:\s*([^\n]{5,120})", text[:500])
            src_info = src_match.group(1).strip() if src_match else ""
            need_manual.append((rel, f"{preview}  ||| SRC: {src_info}", f"{size_kb}KB"))

    # Auto-plan отчёт (что переименуется автоматом)
    lines = [
        "# S27 H3.1-fix Phase 2 — Auto-rename план (deep extract)",
        "",
        f"Всего model==gen: **{len(victims)}**",
        f"- Авто-год найден: **{len(auto_found)}**",
        f"- Требуют ручного ввода: **{len(need_manual)}**",
        "",
        "## Auto-rename таблица",
        "",
        "| path | year | pattern |",
        "|---|---:|---|",
    ]
    for rel, y, reason in sorted(auto_found):
        lines.append(f"| {rel} | {y} | `{reason}` |")
    Path(args.auto_plan_out).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] auto-plan → {args.auto_plan_out}")
    print(f"       auto-found: {len(auto_found)}")

    # Triage файл — РУЧНОЙ ввод года для оставшихся
    tri_lines = [
        "# S27 H3.1-fix — ручной triage для model==gen мануалов",
        "",
        "## Инструкция",
        "",
        "Ниже таблица мануалов где авто-extract не нашёл год выпуска.",
        "Вам нужно:",
        "1. Открыть сам файл `llcar-dashboard/public/data/kb/<path>/manual.md` если preview недостаточно",
        "2. Найти год первого выпуска поколения",
        "3. Вписать 4-значный год в колонку `year` (например `2008`)",
        "4. Если мануал не привязан к конкретному поколению (универсальный) — вписать `generic`",
        "5. Если мануал дубликат/мусор — вписать `skip`",
        "",
        "После заполнения запустите:",
        "```",
        "python scripts/s27_apply_year_triage.py --apply",
        "```",
        "",
        "Он переименует `<brand>/<model>/<model>/` → `<brand>/<model>/<model>_<year>/` и обновит meta.json.",
        "",
        f"## Таблица ({len(need_manual)} мануалов)",
        "",
        "| # | path | year | size | preview (первые строки + source) |",
        "|---:|---|---|---:|---|",
    ]
    for i, (rel, preview, size_str) in enumerate(sorted(need_manual), 1):
        # escape pipes and newlines in preview
        safe = preview.replace("|", "\\|").replace("\n", " ")[:240]
        tri_lines.append(f"| {i} | `{rel}` | `____` | {size_str} | {safe} |")

    Path(args.triage_out).write_text("\n".join(tri_lines), encoding="utf-8")
    print(f"[done] triage → {args.triage_out}")
    print(f"       need manual input: {len(need_manual)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
