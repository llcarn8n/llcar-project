#!/usr/bin/env python3
"""S27 H3.3 Apply — финальный apply по готовому preview.

Читает .omc/research/s27-h33-preview.md (428 строк, решения уже приняты).
Применяет с фильтром 2001+ и без фейковых `<model>/<model>_main/` структур.

Правила:
 - oversize >10MB → skip
 - blacklist → skip
 - new_brand → skip (H3.4 отдельно)
 - target_gen с явным годом <2001 (одинарный или второй в диапазоне) → skip
 - target_gen оканчивается на `_main` (fallback no-suffix) → skip (будет обработано вручную отдельно по 137)
 - иначе: копия manual.md из D:/manuals-export/<brand>/<src_dir>/ в
   llcar-dashboard/public/data/kb/<brand>/<target_model>/<target_gen>/
 - если в dst уже есть manual.md → manual_variant.md (без потерь)
 - meta.json пишем/обновляем с {brand, model, generation, source:"kb", ingested_from, ingested_at, h33_reason}

Не-деструктивно. Streaming JSONL с flush.
"""
from __future__ import annotations
import argparse
import io
import json
import re
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


ROW_RE = re.compile(
    r"^\|\s*([a-z0-9_\-]+)\s*\|\s*([a-z0-9_\-]+)\s*\|\s*([\d.]+)\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([a-z0-9_\-:+ ()]+)\s*\|",
    re.I,
)

# Текущий decision-контекст в preview идёт как H2 раздел перед строками
SECTION_RE = re.compile(r"^##\s+([a-z_]+)\s*\((\d+)\)\s*$", re.I)

# Годы в slug
YEAR_SINGLE_RE = re.compile(r"_(19[89]\d|20[0-2]\d)$")
YEAR_RANGE_RE = re.compile(r"_(19[89]\d|20[0-2]\d)_(19[89]\d|20[0-2]\d)(?:_[a-z0-9]+)?$")
# год в середине: _YYYY_suffix
YEAR_MID_RE = re.compile(r"_(19[89]\d|20[0-2]\d)_[a-z]+$")


def parse_preview(path: Path) -> list[dict]:
    rows = []
    current_decision = "unknown"
    for ln in path.read_text(encoding="utf-8").splitlines():
        sm = SECTION_RE.match(ln)
        if sm:
            current_decision = sm.group(1).strip()
            continue
        m = ROW_RE.match(ln)
        if not m:
            continue
        brand, src_dir, size_mb, model, gen, reason = m.groups()
        rows.append({
            "brand": brand.strip(),
            "src_dir": src_dir.strip(),
            "size_mb": float(size_mb),
            "target_model": model.strip(),
            "target_gen": gen.strip(),
            "reason": reason.strip(),
            "decision": current_decision,
        })
    return rows


def gen_max_year(gen: str) -> int | None:
    """Max year из slug генерации, если есть. None если года нет."""
    m = YEAR_RANGE_RE.search(gen)
    if m:
        return int(m.group(2))
    m = YEAR_SINGLE_RE.search(gen)
    if m:
        return int(m.group(1))
    m = YEAR_MID_RE.search(gen)
    if m:
        return int(m.group(1))
    return None


def load_blacklist(path: Path) -> set[str]:
    if not path.exists():
        return set()
    result = set()
    for ln in path.read_text(encoding="utf-8").splitlines():
        if ln.strip().startswith("#") or not ln.strip():
            continue
        parts = ln.split()
        if parts:
            result.add(parts[0].lower())
    return result


def safe_copy(src_md: Path, dst_dir: Path, dry: bool) -> tuple[str, Path]:
    dst_md = dst_dir / "manual.md"
    if not dst_md.exists():
        if not dry:
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(src_md), str(dst_md))
        return "copy", dst_md
    n = 1
    while True:
        cand = dst_dir / (f"manual_variant.md" if n == 1 else f"manual_variant{n}.md")
        if not cand.exists():
            if not dry:
                shutil.copy2(str(src_md), str(cand))
            return f"copy_variant({cand.name})", cand
        n += 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--preview", default=".omc/research/s27-h33-preview.md")
    ap.add_argument("--blacklist", default=".omc/research/s27-source-blacklist.txt")
    ap.add_argument("--log", default=".omc/research/s27-h33-apply-log.jsonl")
    ap.add_argument("--max-size-mb", type=float, default=10.0)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] укажи --apply ИЛИ --dry-run", file=sys.stderr)
        return 2
    dry = args.dry_run

    kb = Path(args.kb_root)
    src_root = Path(args.src_root)
    rows = parse_preview(Path(args.preview))
    blacklist = load_blacklist(Path(args.blacklist))
    print(f"[info] preview rows: {len(rows)}, blacklist entries: {len(blacklist)}")

    stats = {
        "copied": 0, "copy_variant": 0,
        "skipped_oversize": 0, "skipped_blacklist": 0,
        "skipped_new_brand": 0, "skipped_pre2001": 0,
        "skipped_fallback_main": 0, "skipped_missing_src": 0,
        "errors": 0, "total": len(rows),
    }

    log_path = Path(args.log)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    if not dry:
        log_path.write_text("", encoding="utf-8")

    logf_ctx = log_path.open("a", encoding="utf-8") if not dry else io.StringIO()
    with logf_ctx as logf:
        for i, r in enumerate(rows, 1):
            brand, src_dir = r["brand"], r["src_dir"]
            key = f"{brand}/{src_dir}".lower()
            decision = r["decision"]
            gen = r["target_gen"]
            model = r["target_model"]

            def log_skip(action: str, extra: dict | None = None):
                op = {"i": i, "path": key, "action": action, "gen": gen}
                if extra:
                    op.update(extra)
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()

            if key in blacklist:
                stats["skipped_blacklist"] += 1
                log_skip("blacklist")
                continue

            if r["size_mb"] > args.max_size_mb:
                stats["skipped_oversize"] += 1
                log_skip("oversize", {"size_mb": r["size_mb"]})
                continue

            if decision == "new_brand":
                stats["skipped_new_brand"] += 1
                log_skip("new_brand")
                continue

            # fallback `_main` — требуется ручная обработка по 137 списку
            if gen.endswith("_main"):
                stats["skipped_fallback_main"] += 1
                log_skip("fallback_main_manual_later")
                continue

            # фильтр 2001+
            y = gen_max_year(gen)
            if y is not None and y < 2001:
                stats["skipped_pre2001"] += 1
                log_skip("pre2001", {"year": y})
                continue

            src_md = src_root / brand / src_dir / "manual.md"
            if not src_md.exists():
                stats["skipped_missing_src"] += 1
                log_skip("missing_src", {"expected": str(src_md)})
                continue

            dst_dir = kb / brand / model / gen
            try:
                action, dst_md = safe_copy(src_md, dst_dir, dry)
                if action == "copy":
                    stats["copied"] += 1
                else:
                    stats["copy_variant"] += 1

                if not dry:
                    meta = dst_dir / "meta.json"
                    m = {}
                    if meta.exists():
                        try:
                            m = json.loads(meta.read_text(encoding="utf-8"))
                        except Exception:
                            pass
                    m.setdefault("brand", brand)
                    m.setdefault("model", model)
                    m.setdefault("generation", gen)
                    m["source"] = "kb"
                    m["ingested_from"] = f"{brand}/{src_dir}"
                    m["ingested_at"] = "2026-04-21"
                    m["h33_decision"] = decision
                    m["h33_reason"] = r["reason"]
                    if decision == "review_merge":
                        m["needs_review"] = True
                    meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

                op = {"i": i, "path": key, "action": action,
                      "target": f"{brand}/{model}/{gen}", "decision": decision, "year": y}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                if i % 50 == 0 or i == len(rows):
                    print(f"[{i}/{len(rows)}] {key} → {brand}/{model}/{gen}", file=sys.stderr, flush=True)
            except Exception as e:
                stats["errors"] += 1
                op = {"i": i, "path": key, "action": "error", "error": str(e)}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                print(f"[{i}] ERR {key}: {e}", file=sys.stderr)

    print(f"\n[summary] {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
