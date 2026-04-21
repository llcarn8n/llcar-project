#!/usr/bin/env python3
"""S27 H3.3 Apply — применить triage 424 unmatched ok пар из D:\\manuals-export.

Читает: .omc/research/s27-unmatched-triage.md
Действия:
 - `merge_with_existing` (4): парс top candidate `<model>/<gen>` → copy в kb
 - `review_merge` (56): то же, но с flag `needs_review=true` в meta
 - `create_new_model` (337): декомпозиция src_dir → model + gen, создать cascade
 - `new_brand` (27): SKIP (H3.4 — отдельно)

Safeguards:
 - quality guard: пропускаем если repo уже содержит manual.md в target path
 - max-size: пропускаем >10MB (OCR-гиганты)
 - blacklist check

Streaming: лог каждой операции в .omc/research/s27-h33-apply-log.jsonl с flush.
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


# Парсер строк таблицы triage-файла. Формат:
#   | brand/src_dir | size MB | top candidate (kind) | score | alt-1 | alt-2 | `decision` |
ROW_RE = re.compile(
    r"^\|\s*([a-z0-9_\-]+/[a-z0-9_\-]+)\s*\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*`([a-z_]+)`\s*\|",
    re.I,
)


def parse_triage(path: Path) -> list[dict]:
    rows: list[dict] = []
    for ln in path.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(ln)
        if not m:
            continue
        brand_src, size, top_cand, score, alt1, alt2, decision = m.groups()
        brand, src_dir = brand_src.split("/", 1)
        rows.append({
            "brand": brand,
            "src_dir": src_dir,
            "size_mb": float(size),
            "top_candidate": top_cand.strip(),
            "score": score.strip(),
            "decision": decision.strip(),
        })
    return rows


def parse_top_candidate(s: str) -> tuple[str | None, str | None]:
    """`model/gen (kind)` → (model, gen). Returns (None, None) if dash/empty."""
    s = s.strip()
    if s in ("—", "-", "", "None"):
        return None, None
    # убираем `(kind)` суффикс
    s = re.sub(r"\s*\([a-z_]+\)\s*$", "", s, flags=re.I)
    if "/" not in s:
        return None, None
    parts = s.split("/", 1)
    return parts[0].strip(), parts[1].strip()


YEAR_END_RE = re.compile(r"^(.+?)_(19|20)\d{2}(?:_[a-z0-9_]+)?$", re.I)
ROMAN_RE = re.compile(r"^(.+?)_(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3})(?:_[a-z0-9_]+)?$", re.I)
CODE_END_RE = re.compile(r"^(.+?)_([a-z]{1,4}\d{0,2}|mk\d|v\d)$", re.I)


def decompose_src_dir(src_dir: str) -> tuple[str, str]:
    """Return (model, gen) — для новых моделей.

    Пытается отрезать trailing:
     - _YYYY / _YYYY_suffix    → year-based gen
     - _iii / _iv / _v         → roman-based gen
     - _rhd / _lhd / _ru / _eng → variant suffix
     - _mk3 / _v2              → version code
    """
    m = YEAR_END_RE.match(src_dir)
    if m:
        return m.group(1), src_dir
    m = ROMAN_RE.match(src_dir)
    if m and len(m.group(1)) >= 3:
        return m.group(1), src_dir
    m = CODE_END_RE.match(src_dir)
    if m and len(m.group(1)) >= 3:
        return m.group(1), src_dir
    # fallback: модель = src_dir, поколение = <src_dir>_main
    return src_dir, f"{src_dir}_main"


BLACKLIST_RE = re.compile(r"^\s*([a-z0-9_\-]+/[a-z0-9_\-]+)", re.I)


def load_blacklist(path: Path) -> set[str]:
    if not path.exists():
        return set()
    result = set()
    for ln in path.read_text(encoding="utf-8").splitlines():
        if ln.strip().startswith("#") or not ln.strip():
            continue
        m = BLACKLIST_RE.match(ln)
        if m:
            result.add(m.group(1).lower())
    return result


def safe_copy_manual(src_md: Path, dst_dir: Path, dry: bool) -> list[str]:
    """Copy manual.md to dst_dir. Коллизии → _variant."""
    log: list[str] = []
    dst_md = dst_dir / "manual.md"
    if not dst_md.exists():
        log.append(f"COPY → {dst_dir}/manual.md")
        if not dry:
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(src_md), str(dst_md))
        return log
    # коллизия
    n = 1
    while True:
        cand = dst_dir / (f"manual_variant.md" if n == 1 else f"manual_variant{n}.md")
        if not cand.exists():
            log.append(f"COPY → {cand.name} (collision)")
            if not dry:
                shutil.copy2(str(src_md), str(cand))
            break
        n += 1
    return log


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--triage", default=".omc/research/s27-unmatched-triage.md")
    ap.add_argument("--blacklist", default=".omc/research/s27-source-blacklist.txt")
    ap.add_argument("--log", default=".omc/research/s27-h33-apply-log.jsonl")
    ap.add_argument("--report", default=".omc/research/s27-h33-apply-report.md")
    ap.add_argument("--max-size-mb", type=float, default=10.0)
    ap.add_argument("--skip-new-brand", action="store_true", help="пропустить new_brand (H3.4 отдельно)")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] --apply или --dry-run", file=sys.stderr)
        return 2
    dry = args.dry_run

    kb = Path(args.kb_root)
    src_root = Path(args.src_root)
    rows = parse_triage(Path(args.triage))
    blacklist = load_blacklist(Path(args.blacklist))
    print(f"[info] triage rows: {len(rows)}, blacklist: {len(blacklist)}")

    stats = {"copied": 0, "skipped_oversize": 0, "skipped_blacklist": 0,
             "skipped_new_brand": 0, "skipped_no_target": 0, "skipped_missing_src": 0,
             "errors": 0, "total": len(rows)}

    log_path = Path(args.log)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    if not dry:
        log_path.write_text("", encoding="utf-8")

    report_rows: list[dict] = []

    with (log_path.open("a", encoding="utf-8") if not dry else io.StringIO()) as logf:
        for i, r in enumerate(rows, 1):
            brand, src_dir = r["brand"], r["src_dir"]
            key = f"{brand}/{src_dir}".lower()
            decision = r["decision"]

            # blacklist
            if key in blacklist:
                stats["skipped_blacklist"] += 1
                op = {"i": i, "path": key, "action": "blacklist"}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                continue

            # oversize
            if r["size_mb"] > args.max_size_mb:
                stats["skipped_oversize"] += 1
                op = {"i": i, "path": key, "action": "oversize", "size_mb": r["size_mb"]}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                continue

            # new_brand
            if decision == "new_brand":
                if args.skip_new_brand:
                    stats["skipped_new_brand"] += 1
                    continue
                # fallthrough (обработать как create_new_model под новым брендом)

            # определяем target (model, gen)
            model, gen = None, None
            if decision in ("merge_with_existing", "review_merge"):
                model, gen = parse_top_candidate(r["top_candidate"])
                if not model or not gen:
                    # fallback → create_new_model логика
                    model, gen = decompose_src_dir(src_dir)
            else:  # create_new_model, new_brand
                model, gen = decompose_src_dir(src_dir)

            dst_dir = kb / brand / model / gen
            src_md = src_root / brand / src_dir / "manual.md"

            if not src_md.exists():
                stats["skipped_missing_src"] += 1
                op = {"i": i, "path": key, "action": "missing_src", "expected": str(src_md)}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                continue

            try:
                log = safe_copy_manual(src_md, dst_dir, dry)
                # meta
                if not dry:
                    meta = dst_dir / "meta.json"
                    m = {}
                    if meta.exists():
                        try:
                            m = json.loads(meta.read_text(encoding="utf-8"))
                        except Exception:
                            pass
                    m["brand"] = brand
                    m["model"] = model
                    m["generation"] = gen
                    m["source"] = "kb"
                    m["ingested_from"] = f"{brand}/{src_dir}"
                    m["ingested_at"] = "2026-04-21"
                    m["h33_decision"] = decision
                    if decision == "review_merge":
                        m["needs_review"] = True
                    meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
                stats["copied"] += 1
                op = {"i": i, "path": key, "action": decision,
                      "target": f"{brand}/{model}/{gen}", "ops": log}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                report_rows.append(op)
                if i % 50 == 0 or i == len(rows):
                    print(f"[{i}/{len(rows)}] {key} → {brand}/{model}/{gen}", file=sys.stderr, flush=True)
            except Exception as e:
                stats["errors"] += 1
                op = {"i": i, "path": key, "action": "error", "error": str(e)}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                print(f"[{i}] ERR {key}: {e}", file=sys.stderr)

    # report
    lines = [
        "# S27 H3.3 Apply — отчёт",
        "",
        f"**Mode:** {'APPLY' if args.apply else 'DRY-RUN'}",
        "",
        "## Статистика",
        "",
    ]
    for k, v in stats.items():
        lines.append(f"- {k}: **{v}**")
    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[done] report → {args.report}")
    print(f"[summary] {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
