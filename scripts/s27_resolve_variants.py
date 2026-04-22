#!/usr/bin/env python3
"""S28 Phase 4 — resolve 53 manual_variant*.md coexisting with manual.md.

Стратегия (по каждой generation-папке где есть variant):
  - Compute md5 of each manual.md and manual_variant*.md
  - IDENTICAL (same md5) → удалить variant (shadow dup)
  - DIFFERENT:
      - если variant крупнее И unique_ratio выше — promote variant
        (mv manual.md → manual_legacy.md, mv manual_variant.md → manual.md)
      - иначе — оставить как есть (UI пусть покажет selector если впилен)

Dry-run по умолчанию. Флаг --apply для реальных изменений.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KB_DIR = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
REPORT_MD = ROOT / ".omc" / "research" / "s27-variants-report.md"
LOG_JSONL = ROOT / ".omc" / "research" / "s27-variants-apply-log.jsonl"


def md5_of_file(p: Path) -> str:
    h = hashlib.md5()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def unique_ratio(md_path: Path) -> float:
    """Доля уникальных непустых строк — грубый quality proxy."""
    try:
        with md_path.open("r", encoding="utf-8", errors="ignore") as f:
            lines = [ln.strip() for ln in f if ln.strip()]
    except Exception:
        return 0.0
    if not lines:
        return 0.0
    return len(set(lines)) / len(lines)


def find_variants() -> list[dict[str, object]]:
    """Find all manual_variant*.md files grouped by their generation directory."""
    groups: dict[Path, list[Path]] = {}
    for variant in KB_DIR.rglob("manual_variant*.md"):
        gen_dir = variant.parent
        groups.setdefault(gen_dir, []).append(variant)

    results = []
    for gen_dir, variants in groups.items():
        main = gen_dir / "manual.md"
        entry = {
            "gen_dir": str(gen_dir.relative_to(KB_DIR)).replace("\\", "/"),
            "main": main if main.exists() else None,
            "variants": sorted(variants),
        }
        results.append(entry)
    return results


def decide_action(main: Path | None, variant: Path) -> dict[str, object]:
    """Return {action, reason, from, to}."""
    v_size = variant.stat().st_size
    v_ur = unique_ratio(variant)
    if not main or not main.exists():
        # Нет основного → variant станет основным
        return {
            "action": "promote_no_main",
            "reason": "no manual.md — promote variant",
            "from": str(variant.relative_to(KB_DIR)).replace("\\", "/"),
            "to": str((variant.parent / "manual.md").relative_to(KB_DIR)).replace("\\", "/"),
            "v_size": v_size, "v_ur": round(v_ur, 3),
        }
    m_md5 = md5_of_file(main)
    v_md5 = md5_of_file(variant)
    if m_md5 == v_md5:
        return {
            "action": "delete_dup",
            "reason": "identical md5",
            "from": str(variant.relative_to(KB_DIR)).replace("\\", "/"),
            "md5": m_md5,
            "v_size": v_size, "v_ur": round(v_ur, 3),
        }
    m_size = main.stat().st_size
    m_ur = unique_ratio(main)
    # promote variant если он в 1.5× больше И unique_ratio не хуже на 10%
    if v_size > m_size * 1.5 and v_ur >= m_ur * 0.9:
        return {
            "action": "promote_variant",
            "reason": f"variant larger ({v_size} vs {m_size}), unique_ratio ok ({v_ur:.2f} vs {m_ur:.2f})",
            "from": str(variant.relative_to(KB_DIR)).replace("\\", "/"),
            "to": str(main.relative_to(KB_DIR)).replace("\\", "/"),
            "v_size": v_size, "m_size": m_size,
            "v_ur": round(v_ur, 3), "m_ur": round(m_ur, 3),
        }
    # Оставить оба (разные полезные)
    return {
        "action": "keep_both",
        "reason": f"main {m_size} B (ur={m_ur:.2f}) vs variant {v_size} B (ur={v_ur:.2f}) — no clear winner",
        "from": str(variant.relative_to(KB_DIR)).replace("\\", "/"),
        "v_size": v_size, "m_size": m_size,
        "v_ur": round(v_ur, 3), "m_ur": round(m_ur, 3),
    }


def apply_action(decision: dict[str, object]) -> dict[str, object]:
    action = decision["action"]
    result = dict(decision)
    try:
        if action == "delete_dup":
            variant = KB_DIR / decision["from"]
            variant.unlink()
            result["status"] = "applied"
        elif action == "promote_no_main":
            variant = KB_DIR / decision["from"]
            target = KB_DIR / decision["to"]
            variant.rename(target)
            result["status"] = "applied"
        elif action == "promote_variant":
            variant = KB_DIR / decision["from"]
            main = KB_DIR / decision["to"]
            # backup main → manual_legacy.md
            legacy = main.parent / "manual_legacy.md"
            if legacy.exists():
                legacy.unlink()
            main.rename(legacy)
            variant.rename(main)
            result["status"] = "applied"
        elif action == "keep_both":
            result["status"] = "skipped"
        else:
            result["status"] = "unknown_action"
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
    return result


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true",
                   help="Реально применить изменения (без него — dry-run).")
    args = p.parse_args()

    groups = find_variants()
    total_variants = sum(len(g["variants"]) for g in groups)
    print(f"[s27-resolve-variants] found {total_variants} variant files in {len(groups)} generations")

    decisions = []
    for g in groups:
        for v in g["variants"]:
            d = decide_action(g["main"], v)
            decisions.append(d)

    action_counts = {"delete_dup": 0, "promote_variant": 0, "promote_no_main": 0, "keep_both": 0}
    for d in decisions:
        action_counts[d["action"]] = action_counts.get(d["action"], 0) + 1

    print(f"[s27-resolve-variants] actions: {action_counts}")

    # Write report
    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_MD.open("w", encoding="utf-8") as f:
        f.write(f"# S27/S28 — manual_variant resolve report\n\n")
        f.write(f"Total variants: {total_variants}\n\n")
        f.write(f"Actions:\n")
        for k, v in action_counts.items():
            f.write(f"- `{k}`: **{v}**\n")
        f.write(f"\n## Details\n\n")
        f.write("| # | action | gen | reason |\n")
        f.write("|---|---|---|---|\n")
        for i, d in enumerate(decisions, 1):
            gen_dir = "/".join(d["from"].split("/")[:-1])
            f.write(f"| {i} | `{d['action']}` | `{gen_dir}` | {d.get('reason', '—')} |\n")

    print(f"[s27-resolve-variants] report: {REPORT_MD.relative_to(ROOT)}")

    if args.apply:
        print(f"\n[s27-resolve-variants] APPLYING...")
        with LOG_JSONL.open("w", encoding="utf-8") as log:
            for d in decisions:
                result = apply_action(d)
                log.write(json.dumps(result, ensure_ascii=False) + "\n")
        applied = sum(1 for d in decisions if d["action"] in ("delete_dup", "promote_no_main", "promote_variant"))
        print(f"[s27-resolve-variants] applied {applied} changes; log: {LOG_JSONL.relative_to(ROOT)}")
    else:
        print(f"\n[s27-resolve-variants] DRY-RUN complete. Run with --apply to make changes.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
