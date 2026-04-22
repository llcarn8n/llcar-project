#!/usr/bin/env python3
"""S28 Phase 5 — apply 129 image-alternatives from s27-image-alternatives.json.

Для каждого entry in `can_replace[]`:
  1. Читаем best_src_path (D:/manuals-export/<brand>/<src_dir>/manual.md — версия с картинками)
  2. Проверяем quality через s27_quality_guard.is_junk() + unique_ratio >= 0.25
     (повышенный threshold — нам нужен readable контент, не просто not-junk)
  3. Бэкап текущего kb/.../manual.md → manual_noimg_backup.md
  4. Копируем best_src_path → kb/.../manual.md
  5. Логируем decision + reason

Dry-run default, --apply для реальных изменений.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s27_quality_guard import is_junk, should_reject  # noqa: E402

KB_DIR = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
IMAGE_ALTS = ROOT / ".omc" / "research" / "s27-image-alternatives.json"
REPORT_MD = ROOT / ".omc" / "research" / "s27-image-alts-applied.md"
LOG_JSONL = ROOT / ".omc" / "research" / "s27-image-alts-applied.jsonl"

UNIQUE_RATIO_MIN = 0.25  # повышенный threshold для replacements
MIN_SIZE_KB = 20         # source должен быть нетривиален


def assess_source(src_path: Path) -> dict:
    """Return {ok: bool, reason: str, metrics: dict}."""
    if not src_path.exists():
        return {"ok": False, "reason": "source_not_found", "metrics": {}}
    size_bytes = src_path.stat().st_size
    if size_bytes < MIN_SIZE_KB * 1024:
        return {"ok": False, "reason": f"too_small_{size_bytes}", "metrics": {"size": size_bytes}}
    try:
        text = src_path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return {"ok": False, "reason": f"read_failed_{type(e).__name__}", "metrics": {}}
    tags, m = is_junk(text)
    if should_reject(tags):
        return {"ok": False, "reason": f"quality_guard_rejected: {','.join(tags)}", "metrics": m}
    if m["unique_ratio"] < UNIQUE_RATIO_MIN:
        return {
            "ok": False,
            "reason": f"unique_ratio_too_low_{m['unique_ratio']:.3f}",
            "metrics": m,
        }
    return {"ok": True, "reason": "passed", "metrics": m, "tags": tags}


def apply_one(entry: dict, apply: bool) -> dict:
    rel = entry["rel"]  # "belgee/x50_plus/x50_plus_2025/manual.md"
    src_path = Path(entry["best_src_path"])
    dst_path = KB_DIR / rel

    assessment = assess_source(src_path)
    result = {
        "rel": rel,
        "src": str(src_path),
        "image_count": entry.get("image_count", 0),
        "assessment_ok": assessment["ok"],
        "reason": assessment["reason"],
    }
    if assessment.get("metrics"):
        m = assessment["metrics"]
        result["src_size_kb"] = round(m.get("size_bytes", 0) / 1024, 1)
        result["src_unique_ratio"] = round(m.get("unique_ratio", 0), 3)
        result["src_word_count"] = m.get("word_count", 0)

    if not assessment["ok"]:
        result["action"] = "skipped"
        return result

    if not dst_path.exists():
        result["action"] = "skipped_no_dst"
        result["reason"] = f"dst_not_found: {dst_path}"
        return result

    dst_size = dst_path.stat().st_size
    src_size = src_path.stat().st_size
    result["dst_size_kb"] = round(dst_size / 1024, 1)

    # Защита: если src меньше 30% от dst — подозрительно, скорее всего не тот мануал
    if src_size < dst_size * 0.3:
        result["action"] = "skipped_src_too_small"
        result["reason"] = f"src {src_size}B < 30% of dst {dst_size}B"
        return result

    if apply:
        try:
            backup = dst_path.parent / "manual_noimg_backup.md"
            if backup.exists():
                backup.unlink()
            shutil.copy2(dst_path, backup)
            shutil.copy2(src_path, dst_path)
            result["action"] = "applied"
        except Exception as e:
            result["action"] = "failed"
            result["reason"] = f"copy_failed: {type(e).__name__}: {e}"
    else:
        result["action"] = "dry_run_would_apply"
    return result


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true")
    p.add_argument("--limit", type=int, default=0, help="Limit number of entries (0 = all)")
    args = p.parse_args()

    if not IMAGE_ALTS.exists():
        print(f"ERROR: {IMAGE_ALTS} not found", file=sys.stderr)
        return 1

    data = json.loads(IMAGE_ALTS.read_text(encoding="utf-8"))
    entries = data.get("can_replace", [])
    if args.limit > 0:
        entries = entries[:args.limit]
    print(f"[s27-apply-image-alts] processing {len(entries)} candidates (threshold unique_ratio>={UNIQUE_RATIO_MIN})")

    results = []
    stats = {"applied": 0, "dry_run_would_apply": 0, "skipped": 0,
             "skipped_no_dst": 0, "skipped_src_too_small": 0, "failed": 0}
    LOG_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with LOG_JSONL.open("w", encoding="utf-8") as log:
        for e in entries:
            r = apply_one(e, args.apply)
            stats[r["action"]] = stats.get(r["action"], 0) + 1
            log.write(json.dumps(r, ensure_ascii=False) + "\n")
            results.append(r)

    # Markdown report
    with REPORT_MD.open("w", encoding="utf-8") as f:
        f.write(f"# S27/S28 Phase 5 — image-alternatives apply report\n\n")
        f.write(f"Mode: {'APPLY' if args.apply else 'DRY-RUN'}\n\n")
        f.write(f"Total candidates: {len(entries)}\n\n")
        f.write("Summary:\n")
        for k, v in stats.items():
            f.write(f"- `{k}`: **{v}**\n")
        f.write(f"\n## Details (top 30 by image_count)\n\n")
        f.write("| # | rel | src_KB | ur | imgs | action | reason |\n")
        f.write("|---|---|--:|--:|--:|---|---|\n")
        top30 = sorted(results, key=lambda r: -r.get("image_count", 0))[:30]
        for i, r in enumerate(top30, 1):
            f.write(f"| {i} | `{r['rel']}` | {r.get('src_size_kb', '—')} | {r.get('src_unique_ratio', '—')} | {r.get('image_count', 0)} | `{r['action']}` | {r['reason']} |\n")

    print(f"[s27-apply-image-alts] stats: {stats}")
    print(f"[s27-apply-image-alts] report: {REPORT_MD.relative_to(ROOT)}")
    print(f"[s27-apply-image-alts] log:    {LOG_JSONL.relative_to(ROOT)}")
    if not args.apply:
        print(f"\n[s27-apply-image-alts] DRY-RUN complete. Run with --apply to make changes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
