#!/usr/bin/env python3
"""S27 — triage 694 unmatched D:/manuals-export entries.

Reads .omc/research/s27-ingest-diff.md, categorizes unmatched rows into:
  a) duplicate_gen   — canonicalized src_dir matches an existing gen in same brand
                       (e.g. rio_iii_ru → rio_iii, x50plus → x50_plus)
  b) new_gen         — src_dir looks like "<model_prefix>_<code>" where model_prefix
                       matches an existing model in same brand (bmw/x3_e83 → x3/new gen)
  c) new_model       — src_dir name is a clean model identifier for existing brand,
                       but the model itself is missing (audi/a1 → new model)
  d) garbage         — misc_<hex>, names with __, mostly digits, overly long, 0-byte

Also triages oversize entries (separate output file).

Outputs:
  .omc/research/s27-unmatched-triage.md  — categorized list with suggested actions
  .omc/research/s27-oversize-triage.md   — oversize list (>10MB) with content stats

NO writes to KB tree. Review-only.
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

HASH_SUFFIX = re.compile(r"_[0-9a-f]{8}$")
YEAR_SUFFIX = re.compile(r"_(19|20)\d{2}$")
LANG_SUFFIX = re.compile(r"_(ru|eng|en|de|fr)$")
MISC_HASH = re.compile(r"^misc_[0-9a-f]{8}$")
MANY_UNDERSCORES = re.compile(r"__{2,}")
DIGIT_DOMINATED = re.compile(r"^[\d_]+$")
TOO_LONG = 40  # chars — real model names are short


@dataclass
class Entry:
    brand: str
    src_dir: str
    size: int
    category: str = ""
    suggestion: str = ""


def canon(name: str) -> str:
    n = name.lower().strip()
    n = HASH_SUFFIX.sub("", n)
    n = YEAR_SUFFIX.sub("", n)
    n = LANG_SUFFIX.sub("", n)
    n = n.replace("-", "_").replace(" ", "_")
    # plus/Plus merge: x50plus ↔ x50_plus
    n = re.sub(r"(plus|pro|sport|touring|avant|coupe|limo)$", r"_\1", n)
    n = re.sub(r"__+", "_", n)
    return n


def index_kb_tree(kb_root: Path) -> dict[str, dict[str, list[str]]]:
    idx: dict[str, dict[str, list[str]]] = {}
    if not kb_root.is_dir():
        return idx
    for brand_dir in sorted(kb_root.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        models: dict[str, list[str]] = {}
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith("_"):
                continue
            gens = sorted(
                g.name for g in model_dir.iterdir()
                if g.is_dir() and not g.name.startswith("_")
            )
            models[model_dir.name] = gens
        idx[brand_dir.name] = models
    return idx


def classify(entry: Entry, kb_idx) -> tuple[str, str]:
    b = entry.brand
    d = entry.src_dir

    # garbage checks
    if MISC_HASH.match(d):
        return "garbage", "drop (misc hash)"
    if MANY_UNDERSCORES.search(d):
        return "garbage", "drop (__noise)"
    if DIGIT_DOMINATED.match(d):
        return "garbage", "drop (digit-only)"
    if len(d) > TOO_LONG:
        return "garbage", f"drop (too long, {len(d)} chars)"
    if entry.size < 50_000:
        return "garbage", f"drop (tiny, {entry.size}B)"

    if b not in kb_idx:
        return "new_brand", f"add brand to brands-index.json first"
    models = kb_idx[b]
    d_canon = canon(d)

    # duplicate gen — canonicalized name matches an existing gen
    for model, gens in models.items():
        for g in gens:
            if canon(g) == d_canon:
                return "duplicate_gen", f"alias of {b}/{model}/{g}"

    # new gen — d_canon starts with model or model prefix
    for model in models:
        m_canon = canon(model)
        if d_canon == m_canon:
            return "new_gen", f"add as new gen under {b}/{model}/"
        if d_canon.startswith(m_canon + "_") and len(d_canon) > len(m_canon) + 1:
            return "new_gen", f"add as {b}/{model}/{d_canon}"

    # new model — clean short name, no underscore model prefix match
    return "new_model", f"create {b}/{d}/{d}_gen/ + _model.json stub"


def parse_report(report: Path) -> list[Entry]:
    if not report.is_file():
        print(f"[error] report not found: {report}", file=sys.stderr)
        return []
    text = report.read_text(encoding="utf-8")
    entries: list[Entry] = []
    section: str = ""
    for line in text.splitlines():
        if line.startswith("## "):
            section = line[3:].split(" ", 1)[0]
            continue
        if section not in ("unmatched", "exact_model_nogens"):
            continue
        m = re.match(r"^\|\s*([a-z0-9_]+)\s*\|\s*([^\s|]+)\s*\|\s*([\d,]+)\s*\|", line)
        if not m:
            continue
        brand, src_dir, size_raw = m.groups()
        try:
            size = int(size_raw.replace(",", ""))
        except ValueError:
            size = 0
        entries.append(Entry(brand=brand, src_dir=src_dir, size=size))
    return entries


def write_triage(entries: list[Entry], out: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    by_cat: dict[str, list[Entry]] = {}
    for e in entries:
        counts[e.category] = counts.get(e.category, 0) + 1
        by_cat.setdefault(e.category, []).append(e)

    lines = ["# S27 unmatched triage", ""]
    lines.append(f"**Total:** {len(entries)}")
    for cat, n in sorted(counts.items(), key=lambda x: -x[1]):
        lines.append(f"- `{cat}`: {n}")
    lines.append("")

    order = ["new_gen", "new_model", "duplicate_gen", "new_brand", "garbage"]
    for cat in order:
        rows = by_cat.get(cat, [])
        if not rows:
            continue
        lines.append(f"## {cat} ({len(rows)})")
        lines.append("")
        lines.append("| Brand | Source dir | Size | Suggestion |")
        lines.append("|---|---|---:|---|")
        for e in sorted(rows, key=lambda x: (x.brand, x.src_dir))[:300]:
            lines.append(f"| {e.brand} | {e.src_dir} | {e.size:,} | {e.suggestion} |")
        if len(rows) > 300:
            lines.append(f"\n_...и ещё {len(rows) - 300}_\n")
        lines.append("")

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    return counts


def write_oversize_triage(src_root: Path, out: Path, threshold_mb: int = 10) -> int:
    """Walk D:/manuals-export for >threshold_mb manual.md and produce triage report."""
    lines = ["# S27 oversize manual.md triage", ""]
    lines.append(f"**Threshold:** >{threshold_mb}MB")
    lines.append("")
    lines.append("Эти файлы **пропущены** в Этапе A (ingest). Причина — поломанный экспорт с OCR-повторами "
                 "(пример: audi/a8 — 6.1M строк, \"### Примечание\" повторяется 20706 раз).")
    lines.append("Механическая дедупликация съест реальный контент, поэтому нужен **reexport из PDF** (S28).")
    lines.append("")
    lines.append("| Brand | Gen dir | Size (MB) | Path on D:\\\\ |")
    lines.append("|---|---|---:|---|")
    count = 0
    limit_bytes = threshold_mb * 1024 * 1024
    for brand_dir in sorted(src_root.iterdir()):
        if not brand_dir.is_dir():
            continue
        for gen_dir in sorted(brand_dir.iterdir()):
            if not gen_dir.is_dir():
                continue
            manual = gen_dir / "manual.md"
            if not manual.is_file():
                continue
            size = manual.stat().st_size
            if size < limit_bytes:
                continue
            count += 1
            mb = size / 1024 / 1024
            lines.append(f"| {brand_dir.name} | {gen_dir.name} | {mb:.1f} | `{manual}` |")
    lines.insert(2, f"**Count:** {count}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", default=".omc/research/s27-ingest-diff.md")
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src", default="D:/manuals-export")
    ap.add_argument("--unmatched-out", default=".omc/research/s27-unmatched-triage.md")
    ap.add_argument("--oversize-out", default=".omc/research/s27-oversize-triage.md")
    ap.add_argument("--threshold-mb", type=int, default=10)
    args = ap.parse_args()

    kb_idx = index_kb_tree(Path(args.kb_root))
    entries = parse_report(Path(args.report))
    for e in entries:
        cat, sug = classify(e, kb_idx)
        e.category = cat
        e.suggestion = sug

    unmatched_counts = write_triage(entries, Path(args.unmatched_out))
    oversize_count = write_oversize_triage(Path(args.src), Path(args.oversize_out), args.threshold_mb)

    print(f"[ok] Unmatched triaged: {len(entries)} → {args.unmatched_out}")
    for k, v in sorted(unmatched_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")
    print(f"[ok] Oversize listed: {oversize_count} → {args.oversize_out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
