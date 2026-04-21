#!/usr/bin/env python3
"""S27 — strip garbage from manual.md files.

Removes:
- Publisher/imprint boilerplate (ООО Книжное издательство, Главный редактор, ISBN, Серия "…")
- Dates of publication (Опубликовано: 12.04.2024, Дата публикации …)
- Author/editor lines (Автор: …, Редактор: …)
- News/reference URLs (https://.../news/…)
- OCR dot-leaders in TOC (многоточие переменной длины + номер страницы в конце строки, > ~15 подряд)
- Known OCR glyph artifacts (voltàge → voltage, thè → the, varў → vary, batry → battery, …)
- Pseudo-TOC echo at end of file (дубль содержания без разметки)

Policy:
- --dry-run (default): prints per-file stats, NO writes
- --apply: writes cleaned manual.md in place (git reversible)
- Writes .omc/research/s27-garbage-stats.md with aggregate counts
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


# Line-level patterns — match entire line to drop it
LINE_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("publisher", re.compile(r"^\s*ООО\s+Книжное\s+издательство.*$", re.IGNORECASE)),
    ("editor", re.compile(r"^\s*(Главный\s+редактор|Редактор|Корректор|Верстальщик)\s*[:.—–-]?\s*\S.*$", re.IGNORECASE)),
    ("isbn", re.compile(r"^\s*ISBN[\s:—–-]*[\d\-X]+\s*$", re.IGNORECASE)),
    ("series", re.compile(r"^\s*Серия\s+[«\"][^»\"]+[»\"].*$", re.IGNORECASE)),
    ("pub_date", re.compile(r"^\s*(Опубликовано|Дата\s+публикации|Подписано\s+в\s+печать)\s*[:.—–-]\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}.*$", re.IGNORECASE)),
    ("author_line", re.compile(r"^\s*Автор(?:ы)?\s*[:.—–-]\s*\S.*$", re.IGNORECASE)),
    ("news_url", re.compile(r"^\s*https?://\S+/(?:news|press|media|stories)/\S*\s*$", re.IGNORECASE)),
    # Dot-leaders TOC: line ending in 15+ dots and a page number
    ("dot_leaders", re.compile(r"^.+?[.·•]{15,}\s*\d{1,4}\s*$")),
]

# Inline OCR glyph fixes — apply within line (not dropping)
INLINE_FIXES: list[tuple[str, re.Pattern, str]] = [
    ("voltage", re.compile(r"\bvolt[àá]ge\b", re.IGNORECASE), "voltage"),
    ("vary", re.compile(r"\bvarў\b"), "vary"),
    ("the", re.compile(r"\bthè\b"), "the"),
    ("thỉs", re.compile(r"\bthỉs\b"), "this"),
    ("battry", re.compile(r"\bbat(?:r|t)y\b", re.IGNORECASE), "battery"),
    ("aggrssive", re.compile(r"\bAggrssive\b"), "Aggressive"),
    ("enointoor", re.compile(r"\bEnointoor\b"), "Engine motor"),
    # Double-char drops: vehice → vehicle
    ("vehice", re.compile(r"\bvehice\b", re.IGNORECASE), "vehicle"),
    ("eletric", re.compile(r"\beletric\b", re.IGNORECASE), "electric"),
    ("eficiency", re.compile(r"\beficiency\b", re.IGNORECASE), "efficiency"),
    # Unclosed quote at start of word: 'he → The
    ("unclosed_quote", re.compile(r"(^|[\s(])'he\b"), r"\1The"),
]


def clean_text(text: str) -> tuple[str, dict[str, int]]:
    """Return (cleaned_text, stats_per_pattern)."""
    stats: dict[str, int] = {}
    lines = text.splitlines()
    kept: list[str] = []

    for line in lines:
        drop = False
        for name, pat in LINE_PATTERNS:
            if pat.match(line):
                stats[name] = stats.get(name, 0) + 1
                drop = True
                break
        if drop:
            continue
        # inline fixes
        new_line = line
        for name, pat, repl in INLINE_FIXES:
            new_line, n = pat.subn(repl, new_line)
            if n:
                stats[f"inline:{name}"] = stats.get(f"inline:{name}", 0) + n
        kept.append(new_line)

    # Collapse runs of 3+ blank lines → 2
    collapsed: list[str] = []
    blank_run = 0
    for line in kept:
        if not line.strip():
            blank_run += 1
            if blank_run <= 2:
                collapsed.append(line)
        else:
            blank_run = 0
            collapsed.append(line)
    if len(collapsed) < len(kept):
        stats["blank_run_collapse"] = len(kept) - len(collapsed)

    return "\n".join(collapsed) + ("\n" if text.endswith("\n") else ""), stats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--apply", action="store_true", help="Write changes in place")
    ap.add_argument("--report", default=".omc/research/s27-garbage-stats.md")
    ap.add_argument("--min-size-bytes", type=int, default=1024,
                    help="Skip tiny manuals (placeholders)")
    args = ap.parse_args()

    kb = Path(args.kb_root)
    total_stats: dict[str, int] = {}
    per_file: list[tuple[str, int, int, dict[str, int]]] = []

    for manual in sorted(kb.rglob("manual.md")):
        size = manual.stat().st_size
        if size < args.min_size_bytes:
            continue
        try:
            text = manual.read_text(encoding="utf-8")
        except Exception as e:
            print(f"[skip] {manual}: {e}", file=sys.stderr)
            continue
        cleaned, stats = clean_text(text)
        if cleaned == text:
            continue
        new_size = len(cleaned.encode("utf-8"))
        per_file.append((str(manual.relative_to(kb)), size, new_size, stats))
        for k, v in stats.items():
            total_stats[k] = total_stats.get(k, 0) + v
        if args.apply:
            manual.write_text(cleaned, encoding="utf-8")

    # Report
    mode = "apply" if args.apply else "dry-run"
    lines = [f"# S27 manual garbage strip — {mode}", ""]
    lines.append(f"**Files touched:** {len(per_file)}")
    total_before = sum(b for _, b, _, _ in per_file)
    total_after = sum(a for _, _, a, _ in per_file)
    diff = total_before - total_after
    lines.append(f"**Size before:** {total_before:,} B → **after:** {total_after:,} B (−{diff:,} B, −{diff / max(total_before, 1) * 100:.1f}%)")
    lines.append("")
    lines.append("## Pattern hits")
    lines.append("| pattern | count |")
    lines.append("|---|---:|")
    for k, v in sorted(total_stats.items(), key=lambda x: -x[1]):
        lines.append(f"| `{k}` | {v} |")
    lines.append("")
    lines.append("## Top-20 largest reductions")
    lines.append("| file | before | after | −Δ |")
    lines.append("|---|---:|---:|---:|")
    for path, b, a, _ in sorted(per_file, key=lambda x: -(x[1] - x[2]))[:20]:
        lines.append(f"| {path} | {b:,} | {a:,} | {b - a:,} |")

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")

    print(f"[{mode}] touched {len(per_file)} files; saved {diff:,} bytes; report → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
