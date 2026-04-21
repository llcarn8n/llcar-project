#!/usr/bin/env python3
"""S27 — ingest oversize (>10MB) manuals with in-memory normalization.

Reads source manual.md from D:\\manuals-export/<brand>/<gen>/, applies
s27_normalize_manuals.normalize() in memory, and writes the result into KB
*only if* the normalized size is ≤ --max-output-mb.

Source stays untouched (policy: D:\\ is source-of-truth).

Usage:
    python scripts/s27_ingest_oversize_normalized.py              # dry-run
    python scripts/s27_ingest_oversize_normalized.py --apply
    python scripts/s27_ingest_oversize_normalized.py --max-output-mb 30 --apply

Writes:
    .omc/research/s27-oversize-ingest.md  — per-file verdict table
"""
from __future__ import annotations

import argparse
import importlib.util
import io
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def _log(msg: str) -> None:
    try:
        print(msg)
    except Exception:
        try:
            sys.stderr.write(msg.encode("utf-8", errors="replace").decode("utf-8", "replace") + "\n")
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Load normalize() from sibling module (avoid relative import pain)
# ---------------------------------------------------------------------------
def _load_normalizer():
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location(
        "s27_normalize_manuals", here / "s27_normalize_manuals.py"
    )
    if not spec or not spec.loader:
        raise RuntimeError("cannot load s27_normalize_manuals.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.normalize


NORMALIZE = _load_normalizer()


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


# ---------------------------------------------------------------------------
# KB tree index + destination resolver (same logic as s27_ingest_manuals_export)
# ---------------------------------------------------------------------------
HASH_SUFFIX = re.compile(r"_[0-9a-f]{8}$")
LANG_YEAR_SUFFIX = re.compile(r"_(ru|eng|en|\d{4})$")
MISC_PREFIX = re.compile(r"^misc_[0-9a-f]{8}$")


def canon(name: str) -> str:
    n = name.lower().strip()
    n = HASH_SUFFIX.sub("", n)
    n = LANG_YEAR_SUFFIX.sub("", n)
    n = n.replace("-", "_").replace(" ", "_")
    return n


def index_kb(kb_root: Path) -> dict[str, dict[str, list[str]]]:
    idx: dict[str, dict[str, list[str]]] = {}
    if not kb_root.is_dir():
        return idx
    for brand_dir in sorted(kb_root.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("_"):
            continue
        models: dict[str, list[str]] = {}
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith("_"):
                continue
            gens = [g.name for g in sorted(model_dir.iterdir())
                    if g.is_dir() and not g.name.startswith("_")]
            models[model_dir.name] = gens
        idx[brand_dir.name] = models
    return idx


def resolve_destination(brand: str, src_dir: str, kb_idx, brand_map):
    brand = brand_map.get("brands", {}).get(brand, brand)
    if brand not in kb_idx:
        return None
    models = kb_idx[brand]
    # 1. Exact gen
    for model, gens in models.items():
        if src_dir in gens:
            return (brand, model, src_dir)
    # 2. Exact model
    if src_dir in models and models[src_dir]:
        return (brand, src_dir, models[src_dir][0])
    # 3. Fuzzy
    if MISC_PREFIX.match(src_dir):
        return None
    src_c = canon(src_dir)
    for model, gens in models.items():
        for g in gens:
            if canon(g) == src_c:
                return (brand, model, g)
        if canon(model) == src_c and gens:
            return (brand, model, gens[0])
    return None


@dataclass
class Row:
    brand: str
    src_dir: str
    src_size: int
    dst: Optional[tuple[str, str, str]]
    normalized_size: Optional[int]
    compression: Optional[float]
    passes: Optional[dict]
    action: str  # "write", "too-big", "no-dst"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default="D:/manuals-export")
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--brand-map", default="scripts/transfer4_brand_mapping.json")
    ap.add_argument("--min-input-mb", type=int, default=10,
                    help="Only consider source files larger than this")
    ap.add_argument("--max-output-mb", type=int, default=30,
                    help="Skip writing if normalized result still exceeds this")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--report", default=".omc/research/s27-oversize-ingest.md")
    ap.add_argument("--blacklist", default=".omc/research/s27-source-blacklist.txt",
                    help="Skip brand/gen pairs listed here (Этап G)")
    args = ap.parse_args()

    src_root = Path(args.src)
    kb_root = Path(args.kb_root)
    brand_map: dict = {"brands": {}, "models": {}}
    bm_path = Path(args.brand_map)
    if bm_path.is_file():
        brand_map = json.loads(bm_path.read_text(encoding="utf-8"))

    kb_idx = index_kb(kb_root)
    min_bytes = args.min_input_mb * 1024 * 1024
    max_out_bytes = args.max_output_mb * 1024 * 1024
    blacklist = _QG.load_blacklist(args.blacklist)
    if blacklist:
        _log(f"[info] blacklist: {len(blacklist)} entries from {args.blacklist}")

    rows: list[Row] = []
    for brand_dir in sorted(src_root.iterdir()):
        if not brand_dir.is_dir():
            continue
        for gen_dir in sorted(brand_dir.iterdir()):
            if not gen_dir.is_dir():
                continue
            manual = gen_dir / "manual.md"
            if not manual.is_file():
                continue
            size = manual.stat().st_size
            if size < min_bytes:
                continue

            dst = resolve_destination(brand_dir.name, gen_dir.name, kb_idx, brand_map)
            if not dst:
                rows.append(Row(brand_dir.name, gen_dir.name, size, None, None, None, None, "no-dst"))
                _log(f"[no-dst] {brand_dir.name}/{gen_dir.name} ({size/1e6:.1f}MB)")
                continue

            key = f"{brand_dir.name}/{gen_dir.name}"
            if key in blacklist:
                rows.append(Row(brand_dir.name, gen_dir.name, size, dst, None, None, None, "blacklist"))
                _log(f"[blacklist] {key} ({size/1e6:.1f}MB)")
                continue

            # Read + normalize
            try:
                text = manual.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                _log(f"[error] {manual}: {e}")
                continue
            dst_brand, dst_model, dst_gen = dst
            normalized, stats = NORMALIZE(text, dst_brand, dst_model, dst_gen)
            nsize = len(normalized.encode("utf-8"))
            compression = nsize / size if size else 1.0

            # Quality guard on normalized text — catches repetitive/thin/picture-book junk
            tags, qmetrics = _QG.is_junk(normalized)
            if _QG.should_reject(tags):
                qpasses = dict(stats) if stats else {}
                qpasses["_verdict"] = ",".join(tags)
                qpasses["_uniq_ratio"] = round(qmetrics["unique_ratio"], 4)
                rows.append(Row(brand_dir.name, gen_dir.name, size, dst, nsize, compression, qpasses, "junk"))
                _log(f"[junk] {key}: {','.join(tags)} "
                     f"uniq={qmetrics['unique_ratio']:.3f} "
                     f"({size/1e6:.1f}MB → {nsize/1e6:.1f}MB)")
                continue

            if nsize > max_out_bytes:
                rows.append(Row(brand_dir.name, gen_dir.name, size, dst, nsize, compression, stats, "too-big"))
                _log(f"[too-big] {brand_dir.name}/{gen_dir.name}: "
                      f"{size/1e6:.1f}MB → {nsize/1e6:.1f}MB "
                      f"(×{compression:.2f}, limit {args.max_output_mb}MB)")
                continue

            action = "write"
            if args.apply:
                target = kb_root / dst_brand / dst_model / dst_gen / "manual.md"
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(normalized, encoding="utf-8")
            rows.append(Row(brand_dir.name, gen_dir.name, size, dst, nsize, compression, stats, action))
            _log(f"[{'write' if args.apply else 'dry'}] {brand_dir.name}/{gen_dir.name}: "
                  f"{size/1e6:.1f}MB → {nsize/1e6:.1f}MB (×{compression:.2f})")

    # Report
    writes = [r for r in rows if r.action == "write"]
    too_big = [r for r in rows if r.action == "too-big"]
    no_dst = [r for r in rows if r.action == "no-dst"]
    junk_rows = [r for r in rows if r.action == "junk"]
    blk_rows = [r for r in rows if r.action == "blacklist"]

    lines = ["# S27 oversize ingest + normalize — dry-run" if not args.apply else "# S27 oversize ingest + normalize — apply", ""]
    lines.append(f"**Source min size:** {args.min_input_mb}MB · **Output max size:** {args.max_output_mb}MB")
    lines.append(f"**Totals:** write={len(writes)} too-big={len(too_big)} "
                 f"junk={len(junk_rows)} blacklist={len(blk_rows)} no-dst={len(no_dst)}")
    total_src = sum(r.src_size for r in writes)
    total_out = sum(r.normalized_size or 0 for r in writes)
    if writes:
        lines.append(f"**Compression (write only):** {total_src/1e6:.0f}MB → {total_out/1e6:.0f}MB "
                     f"(×{total_out/max(total_src,1):.2f})")
    lines.append("")

    def _table(rs: list[Row], title: str):
        if not rs:
            return
        lines.append(f"## {title} ({len(rs)})")
        lines.append("")
        lines.append("| brand/src | src MB | dst | norm MB | ×ratio | top hits |")
        lines.append("|---|---:|---|---:|---:|---|")
        for r in sorted(rs, key=lambda x: -x.src_size):
            dst_str = "/".join(r.dst) if r.dst else "—"
            norm = f"{r.normalized_size/1e6:.1f}" if r.normalized_size else "—"
            ratio = f"{r.compression:.2f}" if r.compression else "—"
            hits = ""
            if r.passes:
                hits = ", ".join(f"{k}={v}" for k, v in sorted(r.passes.items(), key=lambda x: -x[1])[:3])
            lines.append(f"| {r.brand}/{r.src_dir} | {r.src_size/1e6:.1f} | {dst_str} | {norm} | {ratio} | {hits} |")
        lines.append("")

    _table(writes, "write")
    _table(junk_rows, "junk (rejected by quality guard — Этап G)")
    _table(blk_rows, "blacklist (source marked as junk — Этап G)")
    _table(too_big, "too-big (requires split or aggressive dedup — S28)")
    _table(no_dst, "no-dst (no matching brand/model/gen in KB)")

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")

    mode = "apply" if args.apply else "dry-run"
    _log(f"\n[{mode}] write={len(writes)} too-big={len(too_big)} "
         f"junk={len(junk_rows)} blacklist={len(blk_rows)} no-dst={len(no_dst)} -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
