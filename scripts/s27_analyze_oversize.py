#!/usr/bin/env python3
"""S27 — deep analysis of oversize manual.md files.

For each D:/manuals-export/<brand>/<gen>/manual.md larger than --threshold-mb:
  - total lines, blank lines, unique lines
  - top-5 most repeated lines
  - ratio signals: blank_ratio, top1_ratio, unique_ratio
  - heuristic verdict: real | garbage | mixed
  - match against public/data/kb/ (is this gen already in KB tree?)

Verdict rules:
  - top1_ratio > 0.02 AND unique_ratio < 0.10   → garbage (heavy header repeats)
  - top1_ratio > 0.01 AND unique_ratio < 0.25   → mixed (OCR-heavy but some real text)
  - otherwise                                    → real (long manual, OCR-light)

Writes .omc/research/s27-oversize-analysis.md with per-file rows + aggregate stats.
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from collections import Counter
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


GEN_SUFFIX_STRIP = re.compile(r"_(ru|eng|en|\d{4})$")
HASH_SUFFIX = re.compile(r"_[0-9a-f]{8}$")


def canon(name: str) -> str:
    n = name.lower().strip()
    n = HASH_SUFFIX.sub("", n)
    n = GEN_SUFFIX_STRIP.sub("", n)
    n = n.replace("-", "_").replace(" ", "_")
    return n


def index_kb(kb_root: Path) -> dict[str, dict[str, set[str]]]:
    idx: dict[str, dict[str, set[str]]] = {}
    if not kb_root.is_dir():
        return idx
    for brand_dir in kb_root.iterdir():
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        models: dict[str, set[str]] = {}
        for model_dir in brand_dir.iterdir():
            if not model_dir.is_dir() or model_dir.name.startswith("_"):
                continue
            gens = {g.name for g in model_dir.iterdir()
                    if g.is_dir() and not g.name.startswith("_")}
            models[model_dir.name] = gens
        idx[brand_dir.name] = models
    return idx


def is_matched(brand: str, gen: str, idx) -> bool:
    if brand not in idx:
        return False
    for model, gens in idx[brand].items():
        if gen in gens:
            return True
        if gen == model:
            return True
        c = canon(gen)
        for g in gens:
            if canon(g) == c:
                return True
        if canon(model) == c:
            return True
    return False


def analyze(path: Path) -> dict:
    total = 0
    blank = 0
    counter: Counter[str] = Counter()
    try:
        with path.open("r", encoding="utf-8", errors="replace") as f:
            for line in f:
                total += 1
                stripped = line.rstrip("\n\r")
                if not stripped.strip():
                    blank += 1
                else:
                    counter[stripped] += 1
    except OSError as e:
        return {"error": str(e), "total": 0, "blank": 0}
    unique = len(counter)
    top = counter.most_common(5)
    top1 = top[0][1] if top else 0
    return {
        "size": path.stat().st_size,
        "total": total,
        "blank": blank,
        "unique": unique,
        "top": top,
        "top1": top1,
        "blank_ratio": blank / total if total else 0,
        "top1_ratio": top1 / total if total else 0,
        "unique_ratio": unique / total if total else 0,
    }


def verdict(stats: dict) -> str:
    t1 = stats.get("top1_ratio", 0)
    u = stats.get("unique_ratio", 1)
    if t1 > 0.02 and u < 0.10:
        return "garbage"
    if t1 > 0.01 and u < 0.25:
        return "mixed"
    return "real"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default="D:/manuals-export")
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--threshold-mb", type=int, default=10)
    ap.add_argument("--out", default=".omc/research/s27-oversize-analysis.md")
    args = ap.parse_args()

    src = Path(args.src)
    kb_idx = index_kb(Path(args.kb_root))
    limit = args.threshold_mb * 1024 * 1024

    entries = []
    for brand_dir in sorted(src.iterdir()):
        if not brand_dir.is_dir():
            continue
        for gen_dir in sorted(brand_dir.iterdir()):
            if not gen_dir.is_dir():
                continue
            manual = gen_dir / "manual.md"
            if not manual.is_file():
                continue
            if manual.stat().st_size < limit:
                continue
            stats = analyze(manual)
            if "error" in stats:
                continue
            v = verdict(stats)
            matched = is_matched(brand_dir.name, gen_dir.name, kb_idx)
            entries.append({
                "brand": brand_dir.name,
                "gen": gen_dir.name,
                "matched": matched,
                "verdict": v,
                **stats,
            })
            top1_raw = stats["top"][0][0][:40].replace("\n", " ") if stats["top"] else ""
            print(f"[{v[:3]}] {brand_dir.name}/{gen_dir.name}: "
                  f"{stats['size']/1e6:.1f}MB, {stats['total']} lines, "
                  f"top1={stats['top1']}×«{top1_raw}» ({stats['top1_ratio']*100:.1f}%), "
                  f"unique={stats['unique_ratio']*100:.1f}%, "
                  f"matched={matched}")

    # Write report
    lines = ["# S27 oversize manual.md — полный анализ", ""]
    lines.append(f"**Threshold:** >{args.threshold_mb}MB")
    lines.append(f"**Found:** {len(entries)}")
    lines.append("")
    by_v: dict[str, list[dict]] = {}
    for e in entries:
        by_v.setdefault(e["verdict"], []).append(e)
    lines.append("## Summary")
    lines.append("| verdict | count | note |")
    lines.append("|---|---:|---|")
    notes = {
        "garbage": "top-1 строка > 2% от всего + unique < 10% → OCR повторы заголовков, содержание утрачено",
        "mixed": "OCR шум значимый, но видимо есть и реальный текст — нужна ручная проверка или aggressive dedup",
        "real": "длинный мануал, OCR-шум небольшой — можно ingest'ить при увеличении лимита или split по главам",
    }
    for v in ["garbage", "mixed", "real"]:
        rows = by_v.get(v, [])
        lines.append(f"| `{v}` | {len(rows)} | {notes[v]} |")
    lines.append("")

    for v in ["real", "mixed", "garbage"]:
        rows = sorted(by_v.get(v, []), key=lambda x: -x["size"])
        if not rows:
            continue
        lines.append(f"## {v} ({len(rows)})")
        lines.append("")
        lines.append("| brand/gen | size MB | lines | blank% | top1% | unique% | matched | top1 sample |")
        lines.append("|---|---:|---:|---:|---:|---:|:-:|---|")
        for e in rows:
            top1_text = (e["top"][0][0][:60] + "…") if e["top"] and len(e["top"][0][0]) > 60 else (e["top"][0][0] if e["top"] else "")
            top1_text = top1_text.replace("|", "\\|")
            lines.append(
                f"| {e['brand']}/{e['gen']} | {e['size']/1e6:.1f} | "
                f"{e['total']:,} | {e['blank_ratio']*100:.1f} | "
                f"{e['top1_ratio']*100:.2f} | {e['unique_ratio']*100:.1f} | "
                f"{'✓' if e['matched'] else '·'} | `{top1_text}` |"
            )
        lines.append("")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")

    # Also write JSON dump for programmatic use
    json_out = out.with_suffix(".json")
    json_out.write_text(
        json.dumps([{k: (v if not isinstance(v, list) else v[:3])
                    for k, v in e.items() if k != "top"} | {"top5": e["top"][:5]}
                   for e in entries], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n[ok] {len(entries)} файлов проанализировано → {out}")
    print(f"     counts: garbage={len(by_v.get('garbage',[]))} "
          f"mixed={len(by_v.get('mixed',[]))} "
          f"real={len(by_v.get('real',[]))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
