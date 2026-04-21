#!/usr/bin/env python3
"""S27 — ingest D:/manuals-export into public/data/kb/.

Source layout: D:/manuals-export/<brand>/<gen_or_model_dir>/manual.md + images/{sha256}.webp
Target layout: llcar-dashboard/public/data/kb/<brand>/<model>/<gen>/manual.md

Policy:
- Only copies manual.md (images stay on D:\\ and are served via /api/kb-image/{hash})
- Dry-run by default; --apply actually writes
- --create-new creates new gen dirs; without it, only updates existing
- Writes ingest diff report to .omc/research/s27-ingest-diff.md
"""
from __future__ import annotations

import argparse
import importlib.util
import io
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def _load_quality_guard():
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location(
        "s27_quality_guard", here / "s27_quality_guard.py"
    )
    if not spec or not spec.loader:
        raise RuntimeError("cannot load s27_quality_guard.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_QG = _load_quality_guard()


@dataclass
class IngestPair:
    brand: str
    src_dir: str
    src_manual: Path
    src_manual_size: int
    match_type: str  # "exact_gen", "exact_model", "fuzzy_gen", "unmatched"
    dst_path: Optional[Path] = None
    dst_exists: bool = False
    notes: str = ""


@dataclass
class Report:
    pairs: list[IngestPair] = field(default_factory=list)

    def add(self, p: IngestPair) -> None:
        self.pairs.append(p)

    def by_type(self, t: str) -> list[IngestPair]:
        return [p for p in self.pairs if p.match_type == t]


GEN_SUFFIX_STRIP = re.compile(r"_(ru|eng|en|\d{4})$")
HASH_SUFFIX = re.compile(r"_[0-9a-f]{8}$")
MISC_PREFIX = re.compile(r"^misc_[0-9a-f]{8}$")


def canonicalize(name: str) -> str:
    """Normalize a gen/model dir name for fuzzy matching."""
    n = name.lower().strip()
    n = HASH_SUFFIX.sub("", n)
    n = GEN_SUFFIX_STRIP.sub("", n)
    n = n.replace("-", "_").replace(" ", "_")
    return n


def index_kb_tree(kb_root: Path) -> dict[str, dict[str, list[str]]]:
    """Walk public/data/kb/<brand>/<model>/<gen>/ and build a lookup index.

    Returns: { brand_id: { model_id: [gen_id, ...] } }
    """
    idx: dict[str, dict[str, list[str]]] = {}
    if not kb_root.is_dir():
        return idx
    for brand_dir in sorted(kb_root.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        brand = brand_dir.name
        idx[brand] = {}
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith("_"):
                continue
            model = model_dir.name
            gens: list[str] = []
            for g in sorted(model_dir.iterdir()):
                if g.is_dir() and not g.name.startswith("_"):
                    gens.append(g.name)
            idx[brand][model] = gens
    return idx


def resolve_destination(
    brand: str,
    src_dir: str,
    kb_idx: dict[str, dict[str, list[str]]],
    brand_map: dict,
) -> tuple[str, Optional[str], Optional[str]]:
    """Return (match_type, model, gen) or ("unmatched", None, None).

    Tries in order:
      1. brand_map['brands'] remap
      2. src_dir matches an existing generation directory exactly
      3. src_dir matches an existing model directory exactly (target = first gen)
      4. Canonicalized fuzzy match against any gen id under brand
    """
    brand = brand_map.get("brands", {}).get(brand, brand)
    if brand not in kb_idx:
        return "unmatched", None, None
    models = kb_idx[brand]

    # 1. Exact gen match
    for model, gens in models.items():
        if src_dir in gens:
            return "exact_gen", model, src_dir

    # 2. Exact model match
    if src_dir in models:
        gens = models[src_dir]
        if gens:
            return "exact_model", src_dir, gens[0]
        return "exact_model_nogens", src_dir, None

    # 3. Fuzzy gen match (canonicalize both sides)
    src_canon = canonicalize(src_dir)
    if MISC_PREFIX.match(src_dir):
        return "unmatched", None, None
    for model, gens in models.items():
        for g in gens:
            if canonicalize(g) == src_canon:
                return "fuzzy_gen", model, g
        if canonicalize(model) == src_canon and gens:
            return "fuzzy_model", model, gens[0]

    return "unmatched", None, None


def scan_source(src_root: Path, kb_idx, brand_map) -> Report:
    report = Report()
    if not src_root.is_dir():
        print(f"[error] Source not found: {src_root}", file=sys.stderr)
        return report

    for brand_dir in sorted(src_root.iterdir()):
        if not brand_dir.is_dir():
            continue
        brand = brand_dir.name
        for sub in sorted(brand_dir.iterdir()):
            if not sub.is_dir():
                continue
            manual = sub / "manual.md"
            if not manual.is_file():
                continue
            size = manual.stat().st_size
            if size == 0:
                continue  # skip empty

            mtype, model, gen = resolve_destination(brand, sub.name, kb_idx, brand_map)
            dst_path: Optional[Path] = None
            dst_exists = False
            if model and gen:
                dst_path = Path("llcar-dashboard/public/data/kb") / (
                    brand_map.get("brands", {}).get(brand, brand)
                ) / model / gen
                dst_exists = dst_path.is_dir()

            report.add(
                IngestPair(
                    brand=brand,
                    src_dir=sub.name,
                    src_manual=manual,
                    src_manual_size=size,
                    match_type=mtype,
                    dst_path=dst_path,
                    dst_exists=dst_exists,
                )
            )
    return report


def write_report(report: Report, out_path: Path) -> None:
    lines = ["# S27 ingest diff — D:/manuals-export → public/data/kb/", ""]
    totals = {}
    for p in report.pairs:
        totals[p.match_type] = totals.get(p.match_type, 0) + 1
    lines.append(f"**Total pairs:** {len(report.pairs)}")
    for t, n in sorted(totals.items(), key=lambda x: -x[1]):
        lines.append(f"- `{t}`: {n}")
    lines.append("")

    for t in ["exact_gen", "exact_model", "fuzzy_gen", "fuzzy_model", "exact_model_nogens", "unmatched"]:
        pairs = report.by_type(t)
        if not pairs:
            continue
        lines.append(f"## {t} ({len(pairs)})")
        lines.append("")
        lines.append("| Brand | Source dir | Size | → Dst | exists |")
        lines.append("|---|---|---:|---|:-:|")
        for p in pairs:
            dst_repr = str(p.dst_path).replace("\\", "/") if p.dst_path else "—"
            lines.append(
                f"| {p.brand} | {p.src_dir} | {p.src_manual_size:,} | {dst_repr} | {'✓' if p.dst_exists else '·'} |"
            )
        lines.append("")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")


def apply_ingest(report: Report, create_new: bool, max_size_mb: int,
                 blacklist: set[str] | None = None) -> tuple[int, int, int, int]:
    """Returns (copied, skipped_oversize, skipped_junk, skipped_blacklist)."""
    copied = 0
    skipped_oversize = 0
    skipped_junk = 0
    skipped_blacklist = 0
    blacklist = blacklist or set()
    limit = max_size_mb * 1024 * 1024
    for p in report.pairs:
        if p.match_type == "unmatched":
            continue
        if not p.dst_path:
            continue
        if not p.dst_exists and not create_new:
            continue

        key = f"{p.brand}/{p.src_dir}"
        if key in blacklist:
            print(f"[skip-blacklist] {key}", file=sys.stderr)
            skipped_blacklist += 1
            continue

        if p.src_manual_size > limit:
            print(
                f"[skip-oversize] {key}: "
                f"{p.src_manual_size/1024/1024:.1f}MB > {max_size_mb}MB",
                file=sys.stderr,
            )
            skipped_oversize += 1
            continue

        # Quality guard — reject repetitive/picture-book/thin junk before copy
        try:
            text = p.src_manual.read_text(encoding="utf-8", errors="replace")
            tags, _metrics = _QG.is_junk(text)
        except Exception as e:
            print(f"[err-read] {key}: {e}", file=sys.stderr)
            skipped_junk += 1
            continue
        if _QG.should_reject(tags):
            print(f"[skip-junk] {key}: {','.join(tags)}", file=sys.stderr)
            skipped_junk += 1
            continue

        p.dst_path.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p.src_manual, p.dst_path / "manual.md")
        copied += 1
    return copied, skipped_oversize, skipped_junk, skipped_blacklist


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default="D:/manuals-export")
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--brand-map", default="scripts/transfer4_brand_mapping.json")
    ap.add_argument("--report", default=".omc/research/s27-ingest-diff.md")
    ap.add_argument("--apply", action="store_true", help="Actually copy manual.md into KB")
    ap.add_argument("--create-new", action="store_true", help="Create new gen dirs if missing")
    ap.add_argument("--max-size-mb", type=int, default=10,
                    help="Skip manuals larger than this (likely OCR garbage). Default 10MB")
    ap.add_argument("--blacklist", default=".omc/research/s27-source-blacklist.txt",
                    help="Blacklist of <brand>/<src_dir> pairs to skip (Этап G)")
    args = ap.parse_args()

    src_root = Path(args.src)
    kb_root = Path(args.kb_root)
    brand_map_path = Path(args.brand_map)
    brand_map: dict = {"brands": {}, "models": {}}
    if brand_map_path.is_file():
        brand_map = json.loads(brand_map_path.read_text(encoding="utf-8"))

    kb_idx = index_kb_tree(kb_root)
    print(f"[info] KB index: {sum(len(m) for m in kb_idx.values())} models across {len(kb_idx)} brands")

    report = scan_source(src_root, kb_idx, brand_map)
    print(f"[info] Source pairs: {len(report.pairs)}")

    write_report(report, Path(args.report))
    print(f"[info] Report: {args.report}")

    blacklist = _QG.load_blacklist(args.blacklist)
    if blacklist:
        print(f"[info] Blacklist entries: {len(blacklist)} (from {args.blacklist})")

    if args.apply:
        copied, osz, junk, blk = apply_ingest(report, args.create_new, args.max_size_mb, blacklist)
        print(f"[apply] copied: {copied}; skipped oversize: {osz}; "
              f"junk: {junk}; blacklist: {blk}")
    else:
        limit = args.max_size_mb * 1024 * 1024
        eligible = sum(
            1 for p in report.pairs
            if p.dst_path and (p.dst_exists or args.create_new) and p.src_manual_size <= limit
        )
        oversize = sum(
            1 for p in report.pairs
            if p.dst_path and (p.dst_exists or args.create_new) and p.src_manual_size > limit
        )
        print(f"[dry-run] would copy: {eligible}; skip (oversize >{args.max_size_mb}MB): {oversize}")
        print(f"  run with --apply to commit; use --max-size-mb N to change oversize threshold")

    return 0


if __name__ == "__main__":
    sys.exit(main())
