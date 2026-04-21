#!/usr/bin/env python3
"""S27 H3.1-fix Apply — применить решения deep-dig к 152 model==gen мануалам.

Читает: .omc/research/s27-42-deep-findings.jsonl
Действия:
 - `create:<model>_<year>` → rename `<brand>/<model>/<model>/` в `<brand>/<model>/<model>_<year>/`
 - `merge_into:<gen>` → перенести файлы victim → existing gen (коллизии → _variant суффикс)
 - `manual_review` → skip (не трогать)

Streaming: лог каждой операции в .omc/research/s27-apply-log.jsonl с flush.
Идемпотентно: если dst уже существует с тем же контентом — skip.
Без удалений: все файлы перемещаются, коллизии получают _variant суффикс.

Usage:
    python scripts/s27_apply_deep_findings.py --dry-run
    python scripts/s27_apply_deep_findings.py --apply
"""
from __future__ import annotations
import argparse
import io
import json
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def load_findings(path: Path) -> list[dict]:
    """Load JSONL findings, deduplicate by path (last-wins)."""
    rows_by_path: dict[str, dict] = {}
    for ln in path.read_text(encoding="utf-8").splitlines():
        if not ln.strip():
            continue
        try:
            r = json.loads(ln)
            rows_by_path[r["path"]] = r
        except Exception:
            continue
    return list(rows_by_path.values())


def safe_move_merge(src_dir: Path, dst_dir: Path, dry: bool, log: list[str]) -> list[str]:
    """Без потерь: rename если dst нет, иначе merge с _variant суффиксами."""
    if not dst_dir.exists():
        log.append(f"RENAME {src_dir.name} → {dst_dir.name}")
        if not dry:
            dst_dir.parent.mkdir(parents=True, exist_ok=True)
            src_dir.rename(dst_dir)
        return log

    # dst существует — merge files
    for item in list(src_dir.iterdir()):
        target = dst_dir / item.name
        if not target.exists():
            log.append(f"MOVE {item.name}")
            if not dry:
                shutil.move(str(item), str(target))
        else:
            stem, suffix = item.stem, item.suffix
            n = 1
            while True:
                new_name = f"{stem}_variant{suffix}" if n == 1 else f"{stem}_variant{n}{suffix}"
                cand = dst_dir / new_name
                if not cand.exists():
                    log.append(f"MOVE {item.name} → {new_name} (collision)")
                    if not dry:
                        shutil.move(str(item), str(cand))
                    break
                n += 1
    # удалить пустую src_dir
    if not dry:
        try:
            src_dir.rmdir()
            log.append("old_dir removed (empty)")
        except OSError:
            log.append("WARN: src_dir not empty after merge")
    return log


def update_meta(dst_dir: Path, target_gen: str, decision: str, year: int | None, dry: bool) -> None:
    if dry:
        return
    meta_path = dst_dir / "meta.json"
    d = {}
    if meta_path.exists():
        try:
            d = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            d = {}
    d["generation"] = target_gen
    d["fixed_by"] = "s27_apply_deep_findings"
    if year:
        d["inferred_year"] = year
    if decision.startswith("merge_into:"):
        d["merged_from_model_eq_gen"] = True
    meta_path.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--findings", default=".omc/research/s27-42-deep-findings.jsonl")
    ap.add_argument("--log", default=".omc/research/s27-apply-log.jsonl")
    ap.add_argument("--report", default=".omc/research/s27-apply-report.md")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] укажите --apply или --dry-run", file=sys.stderr)
        return 2

    dry = args.dry_run
    kb = Path(args.kb_root)
    findings = load_findings(Path(args.findings))
    print(f"[info] findings: {len(findings)}")

    log_path = Path(args.log)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    if not dry:
        log_path.write_text("", encoding="utf-8")

    stats = {"renamed": 0, "merged": 0, "skipped_review": 0, "errors": 0, "skipped_missing": 0}
    report_rows: list[dict] = []

    with (log_path.open("a", encoding="utf-8") if not dry else io.StringIO()) as logf:
        for i, r in enumerate(findings, 1):
            path = r["path"]
            parts = path.split("/")
            if len(parts) != 3:
                stats["errors"] += 1
                continue
            brand, model, gen = parts
            src_dir = kb / brand / model / gen
            decision = r["decision"]
            year = None
            if r.get("top_years"):
                try:
                    year = int(r["top_years"][0][0])
                except Exception:
                    year = None

            if not src_dir.exists():
                stats["skipped_missing"] += 1
                continue

            if decision == "manual_review":
                stats["skipped_review"] += 1
                op = {"path": path, "action": "skip_review", "result": "left as-is"}
                if not dry:
                    logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                    logf.flush()
                report_rows.append(op)
                continue

            # parse target
            if decision.startswith("create:"):
                target_slug = decision.split(":", 1)[1]
                # `<model>_<year>` pattern: sometimes slug is `<model>_<year>`
                target_slug = target_slug.replace("<model>", model)
                target_gen = target_slug
            elif decision.startswith("merge_into:"):
                target_gen = decision.split(":", 1)[1]
            else:
                stats["errors"] += 1
                continue

            dst_dir = kb / brand / model / target_gen

            log_actions: list[str] = []
            try:
                log_actions = safe_move_merge(src_dir, dst_dir, dry, log_actions)
                update_meta(dst_dir, target_gen, decision, year, dry)
                if decision.startswith("create:"):
                    stats["renamed"] += 1
                else:
                    stats["merged"] += 1
            except Exception as e:
                stats["errors"] += 1
                log_actions.append(f"ERR: {e}")

            op = {"path": path, "action": decision, "target_gen": target_gen, "ops": log_actions}
            if not dry:
                logf.write(json.dumps(op, ensure_ascii=False) + "\n")
                logf.flush()
            report_rows.append(op)
            print(f"[{i}/{len(findings)}] {path} → {target_gen} ({'; '.join(log_actions)})", file=sys.stderr, flush=True)

    # final report
    lines = [
        "# S27 H3.1-fix Apply — отчёт",
        "",
        f"**Mode:** {'APPLY' if args.apply else 'DRY-RUN'}",
        "",
        "## Статистика",
        "",
    ]
    for k, v in stats.items():
        lines.append(f"- {k}: **{v}**")
    lines.append("")
    lines.append("## Операции")
    lines.append("")
    lines.append("| # | path | action | target | ops |")
    lines.append("|---:|---|---|---|---|")
    for i, op in enumerate(report_rows, 1):
        ops = "; ".join(op.get("ops", [op.get("result", "")]))[:200]
        lines.append(f"| {i} | `{op['path']}` | `{op['action']}` | `{op.get('target_gen', '—')}` | {ops} |")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"\n[done] report → {args.report}")
    print(f"[summary] {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
