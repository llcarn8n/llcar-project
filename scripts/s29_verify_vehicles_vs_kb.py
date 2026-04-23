#!/usr/bin/env python3
"""S29 §3.1 H3.10 — verify vehicles.json models против kb/ папок.

Цель: найти orphans (model объявлен в UI, но нет kb/<brand>/<model>/) и
stray (kb-папка есть, но модель не в vehicles.json).

Выход: markdown-report + exit code (0 если 0 orphans, 2 если есть).

Usage:
    python scripts/s29_verify_vehicles_vs_kb.py
    python scripts/s29_verify_vehicles_vs_kb.py --report .omc/research/s29-orphan-models.md
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VEHICLES = ROOT / "llcar-dashboard" / "src" / "data" / "vehicles.json"
KB_ROOT = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
DEFAULT_REPORT = ROOT / ".omc" / "research" / "s29-orphan-models.md"


def model_slug(brand_id: str, model_id: str) -> str:
    """Strip brand prefix ('lada_granta' → 'granta')."""
    prefix = f"{brand_id}_"
    if model_id.startswith(prefix):
        return model_id[len(prefix):]
    return model_id


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = p.parse_args()

    if not VEHICLES.exists():
        print(f"[err] vehicles.json not found: {VEHICLES}", file=sys.stderr)
        return 1
    if not KB_ROOT.exists():
        print(f"[err] kb root not found: {KB_ROOT}", file=sys.stderr)
        return 1

    vehicles = json.loads(VEHICLES.read_text(encoding="utf-8"))

    orphans: list[tuple[str, str, str]] = []  # (brand, model_slug, original_id)
    present: list[tuple[str, str]] = []
    no_manual: list[tuple[str, str, int]] = []  # (brand, model, gens_count_without_manual)
    declared_pairs: set[tuple[str, str]] = set()

    for brand_obj in vehicles:
        brand_id = brand_obj["id"]
        for model_obj in brand_obj.get("models", []):
            full_id = model_obj["id"]
            slug = model_slug(brand_id, full_id)
            declared_pairs.add((brand_id, slug))
            kb_path = KB_ROOT / brand_id / slug
            if not kb_path.exists():
                orphans.append((brand_id, slug, full_id))
                continue
            # Check if at least one gen subdir has manual.md
            gens_with_md = 0
            gens_total = 0
            for child in kb_path.iterdir():
                if child.is_dir():
                    gens_total += 1
                    if (child / "manual.md").exists():
                        gens_with_md += 1
            if gens_total > 0 and gens_with_md == 0:
                no_manual.append((brand_id, slug, gens_total))
            present.append((brand_id, slug))

    # Stray: kb-папки без записи в vehicles.json
    strays: list[tuple[str, str]] = []
    for brand_dir in sorted(KB_ROOT.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir():
                continue
            if (brand_dir.name, model_dir.name) not in declared_pairs:
                strays.append((brand_dir.name, model_dir.name))

    # Build markdown report
    lines: list[str] = []
    lines.append("# S29 H3.10 — vehicles.json vs kb/ mismatch report")
    lines.append("")
    lines.append(f"- vehicles.json: **{sum(len(b.get('models', [])) for b in vehicles)}** model entries")
    lines.append(f"- kb/: **{len(present)}** modal'ов с папкой")
    lines.append(f"- **Orphans** (vehicle declared, no kb): **{len(orphans)}**")
    lines.append(f"- **No-manual** (kb exists, no manual.md in any gen): **{len(no_manual)}**")
    lines.append(f"- **Strays** (kb folder without vehicles entry): **{len(strays)}**")
    lines.append("")

    if orphans:
        lines.append("## Orphans — нужно или найти mapping, или удалить из vehicles.json")
        lines.append("")
        lines.append("| brand | model slug | original id |")
        lines.append("|---|---|---|")
        for b, s, o in orphans:
            lines.append(f"| {b} | {s} | `{o}` |")
        lines.append("")

    if no_manual:
        lines.append("## No-manual — kb-папка есть, gen-ы без manual.md")
        lines.append("")
        lines.append("| brand | model slug | gen count |")
        lines.append("|---|---|--:|")
        for b, s, n in no_manual:
            lines.append(f"| {b} | {s} | {n} |")
        lines.append("")

    if strays:
        lines.append("## Strays — kb/ папки не объявлены в vehicles.json")
        lines.append("")
        lines.append("| brand | model slug |")
        lines.append("|---|---|")
        for b, s in strays:
            lines.append(f"| {b} | {s} |")
        lines.append("")

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text("\n".join(lines), encoding="utf-8")

    print(f"[ok] report: {args.report}")
    print(f"[stats] orphans={len(orphans)} no_manual={len(no_manual)} strays={len(strays)}")

    return 2 if orphans else 0


if __name__ == "__main__":
    sys.exit(main())
