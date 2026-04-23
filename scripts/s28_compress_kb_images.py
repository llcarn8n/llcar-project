#!/usr/bin/env python3
"""S28 Phase 6 — batch webp compression для всех используемых KB images.

Из manifest (`.omc/research/images-manifest.txt` — hash'и использованные в manual.md)
берём только нужные ~385K hash'ей, сжимаем q55 + max_width 1400.

Output: `.omc/staging/kb-images/<hash[:2]>/<hash>.webp` (2-level sharding).
Resumable: если output уже существует — skip.
Parallel: multiprocessing.Pool(8).
Progress log: `.omc/research/s28-compress-progress.jsonl`.

Usage:
    python scripts/s28_compress_kb_images.py --quality 55 --max-width 1400
    python scripts/s28_compress_kb_images.py --resume   # пропустить уже сжатые
    python scripts/s28_compress_kb_images.py --workers 8
"""
from __future__ import annotations

import argparse
import io
import json
import multiprocessing as mp
import sys
import time
from pathlib import Path
from PIL import Image

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("D:/manuals-export")
STAGING = ROOT / ".omc" / "staging" / "kb-images"
MANIFEST = ROOT / ".omc" / "research" / "images-manifest.txt"
PROGRESS = ROOT / ".omc" / "research" / "s28-compress-progress.jsonl"


def load_manifest() -> dict[str, Path]:
    """Return dict hash → source_path from TSV manifest."""
    if not MANIFEST.exists():
        return {}
    mapping: dict[str, Path] = {}
    for line in MANIFEST.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) != 2:
            continue
        h, path_str = parts
        if len(h) == 64:
            mapping[h] = Path(path_str)
    return mapping


def compress_one(args: tuple) -> dict:
    hash_, src_path_str, quality, max_width = args
    src = Path(src_path_str)
    dst = STAGING / hash_[:2] / f"{hash_}.webp"
    tmp = dst.with_suffix(".webp.tmp")
    if dst.exists():
        return {"hash": hash_, "status": "skipped_existing", "dst_kb": dst.stat().st_size // 1024}
    try:
        orig_size = src.stat().st_size
        img = Image.open(src)
        orig_wh = img.size
        w, h = orig_wh
        if w > max_width:
            scale = max_width / w
            img = img.resize((max_width, max(1, int(round(h * scale)))), Image.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        # atomic: write to .tmp, then rename to final — scp -r никогда не увидит partial webp
        if tmp.exists():
            tmp.unlink()
        img.save(tmp, format="webp", quality=quality, method=6)
        tmp.replace(dst)
        new_size = dst.stat().st_size
        return {
            "hash": hash_,
            "status": "done",
            "orig_kb": orig_size // 1024,
            "new_kb": new_size // 1024,
            "ratio": round(new_size / orig_size, 3),
        }
    except Exception as e:
        return {"hash": hash_, "status": f"error: {type(e).__name__}: {e}"}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--quality", type=int, default=55)
    p.add_argument("--max-width", type=int, default=1400)
    p.add_argument("--workers", type=int, default=8)
    p.add_argument("--limit", type=int, default=0, help="0 = all")
    args = p.parse_args()

    if not SOURCE_ROOT.exists():
        print(f"ERROR: {SOURCE_ROOT} not found", file=sys.stderr)
        return 1

    mapping = load_manifest()
    if not mapping:
        print(f"ERROR: manifest empty or missing: {MANIFEST}", file=sys.stderr)
        return 1
    print(f"[compress] manifest: {len(mapping)} hashes", flush=True)

    # Build work items — filter to files that actually exist
    work: list[tuple] = []
    missing = 0
    for h, src in mapping.items():
        if not src.exists():
            missing += 1
            continue
        work.append((h, str(src), args.quality, args.max_width))

    print(f"[compress] existing sources: {len(work)} / missing {missing}", flush=True)
    if args.limit > 0:
        work = work[: args.limit]
        print(f"[compress] limiting to {args.limit}", flush=True)

    STAGING.mkdir(parents=True, exist_ok=True)
    PROGRESS.parent.mkdir(parents=True, exist_ok=True)

    stats = {"done": 0, "skipped_existing": 0, "error": 0}
    total_orig_kb = 0
    total_new_kb = 0
    t0 = time.time()

    with PROGRESS.open("a", encoding="utf-8") as log, mp.Pool(args.workers) as pool:
        for i, r in enumerate(pool.imap_unordered(compress_one, work, chunksize=20), 1):
            log.write(json.dumps(r) + "\n")
            if i % 500 == 0:
                log.flush()
            status = r["status"]
            if status == "done":
                stats["done"] += 1
                total_orig_kb += r.get("orig_kb", 0)
                total_new_kb += r.get("new_kb", 0)
            elif status == "skipped_existing":
                stats["skipped_existing"] += 1
            else:
                stats["error"] += 1
            if i % 1000 == 0:
                dt = time.time() - t0
                print(f"[compress] {i}/{len(work)} ({dt:.0f}s, {i/dt:.1f}/s) stats={stats} saved={total_orig_kb-total_new_kb} KB", flush=True)

    print(f"\n[compress] Done in {time.time()-t0:.0f}s", flush=True)
    print(f"[compress] Stats: {stats}")
    if total_orig_kb:
        print(f"[compress] Size: {total_new_kb/1024:.1f} MB from {total_orig_kb/1024:.1f} MB ({100*(1-total_new_kb/total_orig_kb):.1f}% saved)")
    print(f"[compress] Staging: {STAGING}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
