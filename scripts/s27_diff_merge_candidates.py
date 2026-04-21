#!/usr/bin/env python3
"""S27 H3.1-fix — сравнение 79 merge_into кейсов.

Для каждого merge_into кандидата (из phase 4 triage):
 - victim: <brand>/<model>/<model>/manual.md
 - target: <brand>/<model>/<target_gen>/manual.md (если существует)
Сравнивает:
 - размер (байты, слова)
 - unique_ratio
 - первые 300 символов title/source
 - SequenceMatcher ratio (similarity)
Дает рекомендацию:
 - `keep_target` — у target больше/качественнее, victim как variant
 - `replace_with_victim` — victim лучше, заменить target
 - `keep_both_as_variants` — оба разные, оставить с суффиксом
 - `target_missing_no_conflict` — у target нет manual.md, просто rename victim → target
"""
from __future__ import annotations
import argparse
import io
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


GEN_YEAR_IN_SLUG_RE = re.compile(r"_(19[89]\d|20[0-2]\d)(?:_|$)")
TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)
PATTERNS = [
    re.compile(r"\((\d{4})(?:\s*[-–]\s*\d{4})?\)"),
    re.compile(r"\b(19[89]\d|20[0-2]\d)\s*[-–]\s*(?:19[89]\d|20[0-2]\d)\b"),
    re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*(?:г\.?|год)", re.I),
    re.compile(r"\bвыпуск(?:а|ов)?\s*с\s*(19[89]\d|20[0-2]\d)", re.I),
    re.compile(r"\b(?:from|since|model\s*year|MY)\s*(19[89]\d|20[0-2]\d)\b", re.I),
]


def extract_year(text: str) -> int | None:
    clean = TECH_FIELD_RE.sub("", text[:200000])
    for rx in PATTERNS:
        m = rx.search(clean)
        if m:
            try:
                y = int(m.group(1))
                if 1980 <= y <= 2027:
                    return y
            except (ValueError, IndexError):
                continue
    return None


def unique_ratio(text: str) -> float:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return 0.0
    return len(set(lines)) / len(lines)


def word_count(text: str) -> int:
    return len(re.findall(r"\w+", text))


def extract_year_from_slug(slug: str) -> int | None:
    m = GEN_YEAR_IN_SLUG_RE.search(slug)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def build_kb_index(kb: Path) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for brand_dir in sorted(kb.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith((".", "_")):
            continue
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith((".", "_")):
                continue
            gens = []
            for g in sorted(model_dir.iterdir()):
                if g.is_dir() and not g.name.startswith((".", "_")) and g.name != model_dir.name:
                    if (g / "manual.md").exists() or (g / "meta.json").exists() or (g / "situations.json").exists():
                        gens.append(g.name)
            if gens:
                idx[f"{brand_dir.name}/{model_dir.name}"] = gens
    return idx


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--report", default=".omc/research/s27-merge-diff-report.md")
    args = ap.parse_args()

    kb = Path(args.kb_root)
    kb_idx = build_kb_index(kb)

    victims: list[Path] = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) == 4 and parts[1] == parts[2]:
            victims.append(m)

    rows: list[dict] = []
    for m in victims:
        brand, model, gen, _ = m.relative_to(kb).parts
        existing = kb_idx.get(f"{brand}/{model}", [])
        if not existing:
            continue  # нет target → не merge
        victim_text = m.read_text(encoding="utf-8", errors="replace")
        victim_year = extract_year(victim_text)

        # выбрать target: если 1 gen — он; если >=2 и year определён — подходящий; иначе newest
        if len(existing) == 1:
            target_gen = existing[0]
        elif victim_year:
            gens_years = [(g, extract_year_from_slug(g)) for g in existing]
            gens_years_valid = sorted([(g, y) for g, y in gens_years if y], key=lambda x: x[1])
            target_gen = None
            for i, (g, y) in enumerate(gens_years_valid):
                next_y = gens_years_valid[i+1][1] if i+1 < len(gens_years_valid) else 9999
                if y <= victim_year < next_y:
                    target_gen = g
                    break
            if not target_gen:
                # newest
                target_gen = max(gens_years_valid, key=lambda x: x[1])[0] if gens_years_valid else existing[-1]
        else:
            # >=2, no year → newest
            gens_years = [(g, extract_year_from_slug(g) or 0) for g in existing]
            target_gen = max(gens_years, key=lambda x: x[1])[0]

        target_manual = m.parent.parent / target_gen / "manual.md"
        row = {
            "path": f"{brand}/{model}/{gen}",
            "target_gen": target_gen,
            "victim_size_kb": len(victim_text) // 1024,
            "victim_words": word_count(victim_text),
            "victim_unique": round(unique_ratio(victim_text), 3),
            "victim_year": victim_year,
            "victim_head": victim_text[:160].replace("\n", " ").replace("|", "\\|")[:160],
        }
        if target_manual.exists():
            target_text = target_manual.read_text(encoding="utf-8", errors="replace")
            row.update({
                "target_exists": True,
                "target_size_kb": len(target_text) // 1024,
                "target_words": word_count(target_text),
                "target_unique": round(unique_ratio(target_text), 3),
                "target_year": extract_year(target_text),
                "target_head": target_text[:160].replace("\n", " ").replace("|", "\\|")[:160],
            })
            # Similarity (на первых 10KB — достаточно для diff)
            sim = SequenceMatcher(None, victim_text[:10000], target_text[:10000]).ratio()
            row["similarity"] = round(sim, 3)
            # decision
            if sim >= 0.85:
                row["recommendation"] = "DUPLICATE — drop victim"
            elif row["victim_words"] > row["target_words"] * 1.5:
                row["recommendation"] = "victim_larger — rename target→*_old, victim→target"
            elif row["target_words"] > row["victim_words"] * 1.5:
                row["recommendation"] = "target_larger — victim→target/manual_variant.md"
            else:
                row["recommendation"] = "both_comparable — keep as _variant"
        else:
            row["target_exists"] = False
            row["recommendation"] = "target_empty — simple rename victim→target"
        rows.append(row)

    # report
    lines = [
        "# S27 H3.1-fix — сравнение merge-кандидатов",
        "",
        f"Всего пар (victim vs target): **{len(rows)}**",
        "",
    ]
    from collections import Counter
    by_rec = Counter(r["recommendation"].split("—")[0].strip() for r in rows)
    for k, v in by_rec.most_common():
        lines.append(f"- `{k}`: **{v}**")
    lines.append("")
    lines.append("## Таблица сравнения")
    lines.append("")
    lines.append("| # | path | target | V kb | V wc | T kb | T wc | sim | rec |")
    lines.append("|---:|---|---|---:|---:|---:|---:|---:|---|")
    for i, r in enumerate(sorted(rows, key=lambda x: (x["recommendation"], x["path"])), 1):
        t_kb = r.get("target_size_kb", "—")
        t_wc = r.get("target_words", "—")
        sim = r.get("similarity", "—")
        lines.append(f"| {i} | `{r['path']}` | `{r['target_gen']}` | {r['victim_size_kb']} | {r['victim_words']} | {t_kb} | {t_wc} | {sim} | {r['recommendation']} |")
    lines.append("")
    lines.append("## Детальный diff (first 160 chars)")
    lines.append("")
    for r in rows:
        lines.append(f"### `{r['path']}` → target: `{r['target_gen']}`")
        lines.append(f"- **victim**: {r['victim_size_kb']}KB, {r['victim_words']} words, unique={r['victim_unique']}, year={r['victim_year']}")
        lines.append(f"  - head: `{r['victim_head']}`")
        if r.get("target_exists"):
            lines.append(f"- **target**: {r['target_size_kb']}KB, {r['target_words']} words, unique={r['target_unique']}, year={r.get('target_year')}")
            lines.append(f"  - head: `{r['target_head']}`")
            lines.append(f"- **similarity**: {r.get('similarity')}")
        lines.append(f"- **REC:** {r['recommendation']}")
        lines.append("")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] → {args.report}")
    print(f"[summary] {dict(by_rec)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
