#!/usr/bin/env python3
"""Применить 10 решений из s27-title-codes-dig.jsonl (только те что не still_review)."""
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


def safe_move_merge(src: Path, dst: Path, dry: bool, log: list[str]) -> list[str]:
    if not dst.exists():
        log.append(f"RENAME → {dst.name}")
        if not dry:
            dst.parent.mkdir(parents=True, exist_ok=True)
            src.rename(dst)
        return log
    for item in list(src.iterdir()):
        target = dst / item.name
        if not target.exists():
            log.append(f"MOVE {item.name}")
            if not dry:
                shutil.move(str(item), str(target))
        else:
            stem, suffix = item.stem, item.suffix
            n = 1
            while True:
                new_name = f"{stem}_variant{suffix}" if n == 1 else f"{stem}_variant{n}{suffix}"
                cand = dst / new_name
                if not cand.exists():
                    log.append(f"MOVE {item.name} → {new_name}")
                    if not dry:
                        shutil.move(str(item), str(cand))
                    break
                n += 1
    if not dry:
        try:
            src.rmdir()
            log.append("src removed")
        except OSError:
            log.append("WARN src not empty")
    return log


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--jsonl", default=".omc/research/s27-title-codes-dig.jsonl")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] --apply или --dry-run", file=sys.stderr)
        return 2
    dry = args.dry_run
    kb = Path(args.kb_root)

    rows = []
    for ln in Path(args.jsonl).read_text(encoding="utf-8").splitlines():
        if ln.strip():
            rows.append(json.loads(ln))

    stats = {"applied": 0, "skipped": 0, "errors": 0}
    for r in rows:
        dec = r["decision"]
        if dec == "still_review":
            stats["skipped"] += 1
            continue
        brand, model, gen = r["path"].split("/")
        src = kb / brand / model / gen
        target = r["target"]
        dst = kb / brand / model / target
        if not src.exists():
            stats["errors"] += 1
            continue
        log: list[str] = []
        try:
            safe_move_merge(src, dst, dry, log)
            if not dry:
                meta = dst / "meta.json"
                d = {}
                if meta.exists():
                    try:
                        d = json.loads(meta.read_text(encoding="utf-8"))
                    except Exception:
                        pass
                d["generation"] = target
                d["fixed_by"] = "s27_apply_title_codes"
                meta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
            stats["applied"] += 1
            print(f"[{stats['applied']}] {r['path']} → {target}: {'; '.join(log)}")
        except Exception as e:
            stats["errors"] += 1
            print(f"ERR {r['path']}: {e}")
    print(f"\nsummary: {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
