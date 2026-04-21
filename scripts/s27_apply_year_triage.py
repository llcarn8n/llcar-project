#!/usr/bin/env python3
"""S27 H3.1-fix Phase 3 — применить auto-plan + ручной triage для rename model==gen.

Читает:
 - .omc/research/s27-manual-year-auto-plan.md (колонка `year`)
 - .omc/research/s27-manual-year-triage.md   (колонка `year`)

Делает:
 - Для каждого `<brand>/<model>/<model>/`:
     * year=YYYY → rename в `<brand>/<model>/<model>_<year>/`, обновить meta.json
     * year=generic → rename в `<brand>/<model>/<model>_generic/`
     * year=skip → оставить как есть, пометить `needs_review:true` в meta.json
     * year=`____` (не заполнено) → пропустить, предупредить
 - Collision: если `<model>_<year>` существует → `<model>_<year>_v2`

Usage:
    python scripts/s27_apply_year_triage.py --dry-run
    python scripts/s27_apply_year_triage.py --apply
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


# Строка md-таблицы: | # | `<path>` | `YYYY` | ... |  или  | `<path>` | YYYY | ... |
ROW_RE = re.compile(r"^\|\s*(?:\d+\s*\|\s*)?`?([a-z0-9_\-]+/[a-z0-9_\-]+/[a-z0-9_\-]+)`?\s*\|\s*`?([^|`]+?)`?\s*\|", re.I)


def parse_year_table(path: Path) -> dict[str, str]:
    """Возвращает {'brand/model/gen': 'year_or_directive'}."""
    result: dict[str, str] = {}
    if not path.exists():
        return result
    for ln in path.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(ln)
        if not m:
            continue
        rel, year_raw = m.group(1).strip(), m.group(2).strip()
        # Skip header row — "year" placeholder или "---"
        if year_raw.lower() in ("year", "---", ":---"):
            continue
        result[rel] = year_raw
    return result


def validate_year(raw: str) -> tuple[str, int | None]:
    """Return (directive, year_int). directive: 'year', 'generic', 'skip', 'empty'."""
    raw_clean = raw.strip().strip("`").lower()
    if raw_clean in ("____", "", "___", "-"):
        return "empty", None
    if raw_clean == "generic":
        return "generic", None
    if raw_clean == "skip":
        return "skip", None
    try:
        y = int(raw_clean)
        if 1980 <= y <= 2027:
            return "year", y
    except ValueError:
        pass
    return "empty", None  # unknown — trait as empty


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--auto-plan", default=".omc/research/s27-manual-year-auto-plan.md")
    ap.add_argument("--triage", default=".omc/research/s27-manual-year-triage.md")
    ap.add_argument("--report", default=".omc/research/s27-h3-rename-report.md")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] укажите --apply или --dry-run (не оба)", file=sys.stderr)
        return 2

    kb = Path(args.kb_root)
    auto = parse_year_table(Path(args.auto_plan))
    tri = parse_year_table(Path(args.triage))
    print(f"[info] auto-plan entries: {len(auto)}")
    print(f"[info] triage entries: {len(tri)}")

    # объединяем: triage переопределяет auto
    combined = {**auto, **tri}

    stats = {"renamed": 0, "generic": 0, "skipped": 0, "empty": 0, "collisions": 0, "missing": 0}
    report_rows: list[str] = []

    for rel, year_raw in sorted(combined.items()):
        parts = rel.split("/")
        if len(parts) != 3:
            continue
        brand, model, gen = parts
        gen_dir = kb / brand / model / gen
        if not gen_dir.exists():
            stats["missing"] += 1
            report_rows.append(f"| {rel} | — | MISSING (already renamed?) |")
            continue

        directive, year = validate_year(year_raw)

        if directive == "empty":
            stats["empty"] += 1
            report_rows.append(f"| {rel} | — | EMPTY (не заполнен) |")
            continue

        if directive == "skip":
            stats["skipped"] += 1
            # update meta
            if args.apply:
                meta = gen_dir / "meta.json"
                if meta.exists():
                    try:
                        d = json.loads(meta.read_text(encoding="utf-8"))
                    except Exception:
                        d = {}
                else:
                    d = {}
                d["needs_review"] = True
                meta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
            report_rows.append(f"| {rel} | skip | flagged needs_review |")
            continue

        if directive == "generic":
            new_gen = f"{model}_generic"
        else:  # year
            new_gen = f"{model}_{year}"

        new_dir = gen_dir.parent / new_gen
        if new_dir.exists() and new_dir != gen_dir:
            alt = f"{new_gen}_v2"
            new_dir = gen_dir.parent / alt
            new_gen = alt
            stats["collisions"] += 1
            if new_dir.exists():
                report_rows.append(f"| {rel} | {year_raw} | COLLISION (double) — skipped |")
                continue

        if directive == "generic":
            stats["generic"] += 1
        else:
            stats["renamed"] += 1
        report_rows.append(f"| {rel} | {year_raw} | → {brand}/{model}/{new_gen} |")

        if args.apply:
            gen_dir.rename(new_dir)
            meta = new_dir / "meta.json"
            if meta.exists():
                try:
                    d = json.loads(meta.read_text(encoding="utf-8"))
                except Exception:
                    d = {}
            else:
                d = {}
            d["generation"] = new_gen
            if directive == "year":
                d["inferred_year"] = year
            elif directive == "generic":
                d["generic_manual"] = True
            meta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    # final report
    lines = [
        "# S27 H3.1-fix Phase 3 — rename-отчёт",
        "",
        f"**Mode:** {'APPLY' if args.apply else 'DRY-RUN'}",
        "",
        "## Статистика",
        "",
    ]
    for k, v in stats.items():
        lines.append(f"- {k}: **{v}**")
    lines.append("")
    lines.append("## Детали")
    lines.append("")
    lines.append("| path | year | action |")
    lines.append("|---|---|---|")
    lines.extend(report_rows)

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {args.report}")
    print(f"[summary] {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
