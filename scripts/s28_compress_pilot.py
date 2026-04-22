#!/usr/bin/env python3
"""S28 Phase 6 — pilot webp compression on 500 random files.

Берёт 500 случайных .webp из D:/manuals-export/*/images/, сжимает каждый в
3 режимах (quality 55/60/65, downscale до max 1400px по ширине), складывает в
.omc/staging/pilot/q55|q60|q65/ и пишет отчёт.

Цель: выбрать quality который визуально OK и даёт минимум размера.
"""
from __future__ import annotations

import argparse
import io
import json
import random
import sys
import time
from pathlib import Path
from PIL import Image

# Force UTF-8 stdout on Windows cp1251 consoles
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("D:/manuals-export")
STAGING = ROOT / ".omc" / "staging" / "pilot"
REPORT_MD = ROOT / ".omc" / "research" / "s28-compress-pilot.md"

QUALITIES = [55, 60, 65]
MAX_WIDTH = 1400


def find_sample(n: int, seed: int = 42) -> list[Path]:
    """Собирает n случайных webp из source_root/**/images/."""
    all_webp: list[Path] = []
    print(f"[pilot] scanning {SOURCE_ROOT} for webp files...", flush=True)
    t0 = time.time()
    for p in SOURCE_ROOT.rglob("*.webp"):
        all_webp.append(p)
        if len(all_webp) > 50000:
            break  # достаточный пул для sample
    dt = time.time() - t0
    print(f"[pilot] found {len(all_webp)} webp in {dt:.1f}s (capped at 50k)", flush=True)
    rng = random.Random(seed)
    rng.shuffle(all_webp)
    return all_webp[:n]


def compress_one(src: Path, dst_dir: Path, quality: int) -> tuple[int, int, tuple[int, int], tuple[int, int]]:
    """Compress src → dst_dir/<name>.webp at given quality + downscale.
    Returns (orig_size, new_size, orig_wh, new_wh)."""
    try:
        orig_size = src.stat().st_size
        img = Image.open(src)
        orig_wh = img.size
        w, h = orig_wh
        if w > MAX_WIDTH:
            scale = MAX_WIDTH / w
            new_h = max(1, int(round(h * scale)))
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
        new_wh = img.size
        dst = dst_dir / src.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, format="webp", quality=quality, method=6)
        new_size = dst.stat().st_size
        return orig_size, new_size, orig_wh, new_wh
    except Exception as e:
        print(f"[pilot] ERROR on {src.name}: {e}", flush=True)
        return 0, 0, (0, 0), (0, 0)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=500, help="Number of sample files")
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    if not SOURCE_ROOT.exists():
        print(f"ERROR: {SOURCE_ROOT} not found", file=sys.stderr)
        return 1

    sample = find_sample(args.n, args.seed)
    if not sample:
        print("ERROR: no webp files found", file=sys.stderr)
        return 1

    print(f"[pilot] compressing {len(sample)} files x {len(QUALITIES)} qualities...", flush=True)

    results: dict[int, list[dict]] = {q: [] for q in QUALITIES}
    t0 = time.time()

    for i, src in enumerate(sample):
        for q in QUALITIES:
            dst_dir = STAGING / f"q{q}"
            orig, new, o_wh, n_wh = compress_one(src, dst_dir, q)
            if orig > 0:
                results[q].append({
                    "name": src.name,
                    "brand": src.parts[-3] if len(src.parts) >= 3 else "?",
                    "orig_kb": round(orig / 1024, 1),
                    "new_kb": round(new / 1024, 1),
                    "ratio": round(new / orig, 3),
                    "orig_wh": list(o_wh),
                    "new_wh": list(n_wh),
                })
        if (i + 1) % 100 == 0:
            print(f"[pilot] {i+1}/{len(sample)} ({time.time()-t0:.0f}s)", flush=True)

    print(f"[pilot] done in {time.time()-t0:.0f}s", flush=True)

    # Write report
    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_MD.open("w", encoding="utf-8") as f:
        f.write(f"# S28 Phase 6 — webp compression pilot ({len(sample)} files)\n\n")
        f.write(f"Source: `D:/manuals-export/**/*.webp` (sample of {len(sample)} random, seed={args.seed})\n")
        f.write(f"Downscale: ≤{MAX_WIDTH}px wide (Lanczos), method=6\n\n")

        f.write("## Size summary\n\n")
        f.write("| quality | total MB | saved % | avg ratio | sample size |\n")
        f.write("|--:|--:|--:|--:|--:|\n")
        for q in QUALITIES:
            entries = results[q]
            if not entries:
                continue
            total_orig = sum(e["orig_kb"] for e in entries) / 1024
            total_new = sum(e["new_kb"] for e in entries) / 1024
            saved_pct = (1 - total_new / total_orig) * 100 if total_orig else 0
            avg_ratio = sum(e["ratio"] for e in entries) / len(entries)
            f.write(f"| q{q} | {total_new:.1f} (from {total_orig:.1f}) | **{saved_pct:.1f}%** | {avg_ratio:.3f} | {len(entries)} |\n")
        f.write("\n")

        f.write("## Extrapolation to full KB\n\n")
        f.write("Source total (only used hashes from manifest ≈ 385K, avg ~48 KB): **~17.7 GB**\n\n")
        f.write("| quality | estimated prod size |\n|--:|--:|\n")
        for q in QUALITIES:
            entries = results[q]
            if not entries:
                continue
            avg_ratio = sum(e["ratio"] for e in entries) / len(entries)
            est_gb = 17.7 * avg_ratio
            f.write(f"| q{q} | **~{est_gb:.1f} GB** |\n")
        f.write("\n")

        # Top 10 pairs for visual comparison (largest originals first)
        f.write("## Visual spot-check (10 samples, ordered by orig size)\n\n")
        f.write("Open each original vs compressed pair to visually verify readability.\n\n")
        if results[60]:
            top10 = sorted(results[60], key=lambda e: -e["orig_kb"])[:10]
            f.write("| # | name | brand | orig KB | q55 | q60 | q65 |\n")
            f.write("|---|---|---|--:|--:|--:|--:|\n")
            for i, e in enumerate(top10, 1):
                # Find matching entries in other qualities
                q55 = next((x for x in results[55] if x["name"] == e["name"]), {})
                q65 = next((x for x in results[65] if x["name"] == e["name"]), {})
                f.write(f"| {i} | `{e['name'][:30]}...` | {e['brand']} | {e['orig_kb']} | {q55.get('new_kb', '—')} | {e['new_kb']} | {q65.get('new_kb', '—')} |\n")
        f.write("\n")
        f.write(f"Sample files in: `{STAGING.relative_to(ROOT)}/q55/`, `/q60/`, `/q65/`\n")

    print(f"[pilot] report: {REPORT_MD.relative_to(ROOT)}", flush=True)
    print(f"[pilot] staging: {STAGING.relative_to(ROOT)}", flush=True)

    # Save JSON too for downstream
    json_path = REPORT_MD.with_suffix(".json")
    json_path.write_text(
        json.dumps({q: results[q] for q in QUALITIES}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
