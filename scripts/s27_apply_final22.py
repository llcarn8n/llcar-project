#!/usr/bin/env python3
"""S27 — финальный apply для оставшихся 24 model==gen мануалов.

Правила жёстко прописаны:
 - mazda/6/6: SKIP (это 0KB redirect-файл, нарочно оставлен)
 - single-gen модели: merge в единственное существующее поколение
 - multi-gen с source year hint: merge в подходящий (byd/han → han_2, byd/tang → tang_ev, etc.)
 - multi-gen без year: merge в newest
 - no-gen: create <model>_main (с needs_review flag)
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


# Жёстко прописанные решения
DECISIONS: dict[str, dict] = {
    "mazda/6/6": {"action": "skip", "reason": "redirect-файл (0KB)"},
    "baic/bj40/bj40": {"action": "merge", "target": "bj40_2019"},
    "baic/x7/x7": {"action": "merge", "target": "x7_2020"},
    "belgee/x50/x50": {"action": "merge", "target": "x50_plus"},
    "belgee/x70/x70": {"action": "merge", "target": "x70_2024"},
    "byd/dolphin/dolphin": {"action": "merge", "target": "dolphin_2"},
    "byd/han/han": {"action": "merge", "target": "han_2", "reason": "Honor Edition 2024"},
    "byd/tang/tang": {"action": "merge", "target": "tang_ev", "reason": "BYD_Tang_EV_2022"},
    "chevrolet/cruze/cruze": {"action": "merge", "target": "j400_2016"},
    "faw_bestune/t77/t77": {"action": "merge", "target": "t77_gen1_2018"},
    "faw_bestune/t99/t99": {"action": "merge", "target": "t99_gen1_2020"},
    "gac/gs5/gs5": {"action": "create", "target": "gs5_main", "needs_review": True},
    "haval/f7/f7": {"action": "merge", "target": "f7_2019"},
    "hongqi/h9/h9": {"action": "create", "target": "h9_main", "needs_review": True},
    "jetour/dashing/dashing": {"action": "merge", "target": "dashing_gen1_2022"},
    "kaiyi/x7/x7": {"action": "merge", "target": "x7_2024"},
    "kia/k5/k5": {"action": "merge", "target": "k5_ru"},
    "lexus/es/es": {"action": "merge", "target": "xv60_2012"},
    "lexus/nx/nx": {"action": "merge", "target": "az10_2014"},
    "nissan/terrano/terrano": {"action": "merge", "target": "d10_2014"},
    "renault/logan/logan": {"action": "merge", "target": "logan_sandero", "reason": "title: Logan+Sandero"},
    "tank/300/300": {"action": "merge", "target": "gen_2020"},
    "toyota/camry/camry": {"action": "merge", "target": "v50_2011"},
    "volkswagen/golf/golf": {"action": "merge", "target": "mk7_2012"},
}


def safe_move_merge(src: Path, dst: Path, dry: bool) -> list[str]:
    log: list[str] = []
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
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.apply == args.dry_run:
        print("[err] --apply или --dry-run", file=sys.stderr)
        return 2
    dry = args.dry_run
    kb = Path(args.kb_root)

    stats = {"merged": 0, "created": 0, "skipped": 0, "missing": 0, "errors": 0}
    for path, d in DECISIONS.items():
        brand, model, gen = path.split("/")
        src = kb / brand / model / gen
        if not src.exists():
            stats["missing"] += 1
            continue
        if d["action"] == "skip":
            stats["skipped"] += 1
            print(f"SKIP {path} — {d.get('reason', '')}")
            continue

        target = d["target"]
        dst = kb / brand / model / target
        try:
            log = safe_move_merge(src, dst, dry)
            if not dry:
                meta = dst / "meta.json"
                m = {}
                if meta.exists():
                    try:
                        m = json.loads(meta.read_text(encoding="utf-8"))
                    except Exception:
                        pass
                m["generation"] = target
                m["fixed_by"] = "s27_apply_final22"
                if d["action"] == "create":
                    m["generic_manual"] = True
                if d.get("needs_review"):
                    m["needs_review"] = True
                meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
            if d["action"] == "merge":
                stats["merged"] += 1
            else:
                stats["created"] += 1
            extra = f" ({d['reason']})" if d.get("reason") else ""
            print(f"{d['action'].upper()} {path} → {target}{extra}: {'; '.join(log)}")
        except Exception as e:
            stats["errors"] += 1
            print(f"ERR {path}: {e}")
    print(f"\nsummary: {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
