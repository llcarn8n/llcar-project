#!/usr/bin/env python3
"""S28 Option D — copy slim DITA structure from transfer4 to dashboard kb.

Для каждого dashboard manual.md:
  1. Находим соответствующий `18-dita-manual.json` в transfer4 (gen-level если есть,
     иначе model-level)
  2. Извлекаем ТОЛЬКО structure: sections[].{id,title,icon}, topics[].{id,title,words,images}
     (БЕЗ content.ru — это раздувает bundle в 6 GB)
  3. Пишем `manual-dita-slim.json` рядом с manual.md

ManualViewer в S29 будет читать этот slim DITA для навигации (10-20 секций),
content будет подгружаться lazy.

Usage:
    python scripts/s28_copy_transfer4_dita.py                    # dry-run
    python scripts/s28_copy_transfer4_dita.py --apply            # write files
    python scripts/s28_copy_transfer4_dita.py --pilot bmw/x5/x5_e70,audi/a4/b8_2008 --apply
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
KB_ROOT = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
T4_ROOT = Path("D:/transfer4/knowledge-base/brands")
REPORT_MD = ROOT / ".omc" / "research" / "s28-dita-slim-copy.md"

MIN_SECTIONS_FOR_GOOD = 4


def find_dita(brand: str, model: str, gen: str | None) -> tuple[Path | None, str]:
    """Return (path, level) where level in {gen, model, none}."""
    model_dir = T4_ROOT / brand / "models" / model
    if not model_dir.exists():
        return None, "none"

    # Gen-level candidates with fuzzy matching
    if gen:
        candidates = [gen]
        if gen.startswith(f"{model}_"):
            candidates.append(gen[len(model) + 1:])
        m = re.match(r"^(.+?)_\d{4}(?:_\d{4})?$", gen)
        if m:
            candidates.append(m.group(1))
            if m.group(1).startswith(f"{model}_"):
                candidates.append(m.group(1)[len(model) + 1:])
        seen = set()
        candidates = [c for c in candidates if not (c in seen or seen.add(c))]
        try:
            real_dirs = [p for p in model_dir.iterdir() if p.is_dir()]
        except Exception:
            real_dirs = []
        for cand in candidates:
            for rd in real_dirs:
                if rd.name.lower() == cand.lower() or cand.lower() in rd.name.lower():
                    p = rd / "18-dita-manual.json"
                    if p.exists():
                        return p, "gen"

    p = model_dir / "18-dita-manual.json"
    if p.exists():
        return p, "model"
    return None, "none"


def slim_dita(full_dita: dict) -> dict:
    """Strip content.ru, keep only structure."""
    slim = {
        "version": full_dita.get("version", "1.0"),
        "model": full_dita.get("model", ""),
        "manuals": [],
    }
    for m in full_dita.get("manuals", []):
        slim_m = {
            "model": m.get("model", ""),
            "label": m.get("label", {}),
            "sections": [],
        }
        for s in m.get("sections", []):
            slim_s = {
                "id": s.get("id"),
                "title": s.get("title", {}),
                "icon": s.get("icon", ""),
                "topics": [],
            }
            for t in s.get("topics", []):
                t_title = t.get("title", {})
                t_title_slim = t_title if isinstance(t_title, dict) else {"ru": str(t_title)}
                slim_s["topics"].append({
                    "id": t.get("id"),
                    "title": t_title_slim,
                    "words": t.get("words", 0),
                    "images": t.get("images", 0),
                    "section_id": s.get("id"),
                })
            slim_m["sections"].append(slim_s)
        slim["manuals"].append(slim_m)
    return slim


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--pilot", type=str, default="")
    p.add_argument("--apply", action="store_true")
    args = p.parse_args()

    if args.pilot:
        rels = [r.strip() for r in args.pilot.split(",") if r.strip()]
    else:
        rels = [str(p.relative_to(KB_ROOT).parent.as_posix()) for p in KB_ROOT.rglob("manual.md")]

    print(f"Processing {len(rels)} gens (apply={args.apply})\n", flush=True)

    stats = {"gen_level_good": 0, "gen_level_flat": 0, "model_level_good": 0, "model_level_flat": 0, "missing": 0}
    total_size_kb = 0
    rows = []

    for rel in rels:
        parts = rel.split("/")
        if len(parts) >= 3:
            brand, model, gen = parts[0], parts[1], parts[2]
        elif len(parts) == 2:
            brand, model = parts
            gen = None
        else:
            continue

        dita_path, level = find_dita(brand, model, gen)
        if not dita_path:
            stats["missing"] += 1
            rows.append({"rel": rel, "status": "missing", "sections": 0, "size_kb": 0})
            continue

        try:
            full = json.loads(dita_path.read_text(encoding="utf-8"))
        except Exception as e:
            stats["missing"] += 1
            rows.append({"rel": rel, "status": f"parse_err: {type(e).__name__}", "sections": 0, "size_kb": 0})
            continue

        slim = slim_dita(full)
        total_sec = sum(len(m.get("sections", [])) for m in slim.get("manuals", []))
        good = total_sec >= MIN_SECTIONS_FOR_GOOD
        key = f"{level}_level_{'good' if good else 'flat'}"
        stats[key] = stats.get(key, 0) + 1

        # Пропускаем flat — они все в одном bucket "general" и раздувают bundle
        if not good:
            rows.append({"rel": rel, "status": key + "_SKIP", "sections": total_sec, "size_kb": 0})
            continue

        # Measure slim size
        slim_text = json.dumps(slim, ensure_ascii=False, indent=1)
        size_kb = len(slim_text.encode("utf-8")) / 1024
        total_size_kb += size_kb

        if args.apply:
            out_path = KB_ROOT / rel / "manual-dita-slim.json"
            out_path.write_text(slim_text, encoding="utf-8")

        rows.append({"rel": rel, "status": key, "sections": total_sec, "size_kb": round(size_kb, 1)})

    # Report
    total = len(rels)
    print("=" * 70)
    print("COPY SUMMARY")
    print("=" * 70)
    for k, v in stats.items():
        print(f"  {k:25s} : {v:4d} ({100*v/max(total,1):.1f}%)")
    print(f"\n  Total slim DITA size: {total_size_kb / 1024:.1f} MB")
    print(f"  Mean: {total_size_kb / max(len(rows), 1):.1f} KB per gen")

    top10 = sorted(rows, key=lambda r: -r["size_kb"])[:10]
    print("\nTOP 10 BIGGEST slim DITA:")
    for r in top10:
        print(f"  {r['rel']:55s} | {r['status']:25s} | {r['sections']:3d} sec | {r['size_kb']:.1f} KB")

    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_MD.open("w", encoding="utf-8") as f:
        f.write("# S28 Option D — slim DITA copy report\n\n")
        f.write(f"Mode: {'APPLY' if args.apply else 'DRY-RUN'}\n\n")
        f.write(f"Total gens: {total}\n\n| status | count | % |\n|---|--:|--:|\n")
        for k, v in stats.items():
            f.write(f"| {k} | {v} | {100*v/max(total,1):.1f}% |\n")
        f.write(f"\n**Total slim DITA size:** {total_size_kb / 1024:.1f} MB\n")
        f.write(f"**Mean:** {total_size_kb / max(len(rows), 1):.1f} KB per gen\n")
    print(f"\nReport: {REPORT_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
