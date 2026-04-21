#!/usr/bin/env python3
"""S27 — apply a triage category from s27-unmatched-triage.md.

Reads the triage report, extracts "add as <brand>/<model>/<gen>" suggestions,
and copies manual.md (with oversize + empty guards) into the KB tree.

Usage:
    python scripts/s27_apply_triage.py --category new_gen          # dry-run
    python scripts/s27_apply_triage.py --category new_gen --apply  # write

Supported categories:
    new_gen     — add new generation to existing model (safest)
    new_model   — create new model dir + stub _model.json (extends KB tree)

Guards:
    --max-size-mb (default 10): skip manuals larger than threshold
    --dedup: when multiple src_dirs resolve to same dst, keep the largest manual.md
"""
from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


ROW_RE = re.compile(r"^\|\s*([a-z0-9_]+)\s*\|\s*([^\s|]+)\s*\|\s*([\d,]+)\s*\|\s*(.+?)\s*\|\s*$")
ADD_AS_RE = re.compile(r"add as ([a-z0-9_]+)/([a-z0-9_]+)/([a-z0-9_]+)")
CREATE_RE = re.compile(r"create ([a-z0-9_]+)/([a-z0-9_]+)/([a-z0-9_]+)/")


def parse_category(report: Path, category: str) -> list[tuple[str, str, int, str, str, str]]:
    """Return list of (brand, src_dir, size, dst_brand, dst_model, dst_gen)."""
    out: list[tuple[str, str, int, str, str, str]] = []
    text = report.read_text(encoding="utf-8")
    current = ""
    for line in text.splitlines():
        if line.startswith("## "):
            current = line[3:].split(" ", 1)[0]
            continue
        if current != category:
            continue
        m = ROW_RE.match(line)
        if not m:
            continue
        brand, src_dir, size_raw, suggestion = m.groups()
        parsed = ADD_AS_RE.search(suggestion) or CREATE_RE.search(suggestion)
        if not parsed:
            continue
        dst_brand, dst_model, dst_gen = parsed.groups()
        try:
            size = int(size_raw.replace(",", ""))
        except ValueError:
            size = 0
        out.append((brand, src_dir, size, dst_brand, dst_model, dst_gen))
    return out


def dedup_by_dst(rows, prefer_largest: bool):
    groups = defaultdict(list)
    for r in rows:
        dst_key = (r[3], r[4], r[5])
        groups[dst_key].append(r)
    selected = []
    for dst_key, items in groups.items():
        if len(items) == 1 or not prefer_largest:
            selected.extend(items)
            continue
        winner = max(items, key=lambda x: x[2])
        selected.append(winner)
    return selected


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", default=".omc/research/s27-unmatched-triage.md")
    ap.add_argument("--src-root", default="D:/manuals-export")
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--category", choices=["new_gen", "new_model"], required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--max-size-mb", type=int, default=10)
    ap.add_argument("--dedup", action="store_true", default=True,
                    help="Deduplicate dst: keep largest manual when multiple src map to same dst")
    args = ap.parse_args()

    rows = parse_category(Path(args.report), args.category)
    print(f"[info] Parsed {len(rows)} rows in category '{args.category}'")

    if args.dedup:
        rows = dedup_by_dst(rows, prefer_largest=True)
        print(f"[info] After dedup: {len(rows)}")

    src_root = Path(args.src_root)
    kb_root = Path(args.kb_root)
    limit = args.max_size_mb * 1024 * 1024
    copied = 0
    skipped_oversize = 0
    created_models = 0

    for brand, src_dir, size, dst_brand, dst_model, dst_gen in rows:
        if size > limit:
            skipped_oversize += 1
            continue
        src = src_root / brand / src_dir / "manual.md"
        if not src.is_file():
            continue
        dst_dir = kb_root / dst_brand / dst_model / dst_gen
        will_create_model = args.category == "new_model" and not (kb_root / dst_brand / dst_model).is_dir()
        action = "APPLY" if args.apply else "DRY"
        print(f"[{action}] {brand}/{src_dir} → {dst_brand}/{dst_model}/{dst_gen} ({size:,}B)"
              + (" +model.stub" if will_create_model else ""))
        if args.apply:
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_dir / "manual.md")
            copied += 1
            if will_create_model:
                stub = kb_root / dst_brand / dst_model / "_model.json"
                if not stub.is_file():
                    stub.write_text(json.dumps({
                        "id": dst_model,
                        "brand": dst_brand,
                        "name": dst_model.replace("_", " ").title(),
                        "source": "s27-auto-stub",
                        "generations": [dst_gen],
                    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                    created_models += 1

    mode = "apply" if args.apply else "dry-run"
    print(f"[{mode}] copied={copied} skipped_oversize={skipped_oversize} new_models={created_models}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
