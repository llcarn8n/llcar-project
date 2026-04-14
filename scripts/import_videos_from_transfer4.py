#!/usr/bin/env python3
"""
Import video links from D:/transfer4/knowledge-base/brands/{brand}/models/{model}/video.md
into llcar-dashboard/public/data/kb/{brand}/{model}/{gen}/videos.json.

Source format (per video block in video.md):
    ### <title>
    <metadata line>
    > Видео: [<channel>](<url>) (<duration>)
    ...

Output videos.json schema (consumed by KnowledgeBase.tsx):
    [{ "title": str, "url": str, "channel": str, "duration": str }]

Matching strategy: transfer4 stores one video.md per MODEL (no generation split).
We map `transfer4/{brand}/models/{model}/` → ALL generations under
`llcar-dashboard/public/data/kb/{brand}/{model}/*/`, copying the same list.
Duplicates within a single videos.json are filtered by URL.

Usage:
    python scripts/import_videos_from_transfer4.py [--src D:/transfer4/knowledge-base/brands]
                                                   [--dst llcar-dashboard/public/data/kb]
                                                   [--limit 999]
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path


# "> Видео: [channel](url) (duration)"
VIDEO_RE = re.compile(
    r"^>\s*Видео:\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*\(([^)]+)\))?\s*$"
)
# "### <title>"
TITLE_RE = re.compile(r"^###\s+(.+?)\s*$")


def parse_video_md(path: Path) -> list[dict]:
    """Return list of videos parsed from a video.md transcript file."""
    videos: list[dict] = []
    current_title: str | None = None
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        m_title = TITLE_RE.match(line)
        if m_title:
            current_title = m_title.group(1).strip()
            continue
        m_video = VIDEO_RE.match(line)
        if m_video and current_title:
            channel, url, duration = m_video.groups()
            videos.append({
                "title": current_title,
                "url": url.strip(),
                "channel": channel.strip(),
                "duration": (duration or "").strip(),
            })
            # Allow multiple > lines but use the first one per title
            current_title = None
    return videos


def dedup_by_url(videos: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for v in videos:
        u = v.get("url")
        if u and u not in seen:
            seen.add(u)
            out.append(v)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="D:/transfer4/knowledge-base/brands")
    parser.add_argument("--dst", default="llcar-dashboard/public/data/kb")
    parser.add_argument(
        "--limit", type=int, default=999,
        help="Max number of model→generation mappings to write",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    if not src.is_dir():
        print(f"ERROR: src not found: {src}", file=sys.stderr)
        return 1
    if not dst.is_dir():
        print(f"ERROR: dst not found: {dst}", file=sys.stderr)
        return 1

    total_videos = 0
    total_files_written = 0
    total_skipped_empty = 0
    total_no_match = 0

    # Iterate all brand/models/{model}/video.md in src
    for video_md in sorted(src.rglob("video.md")):
        try:
            rel_parts = video_md.relative_to(src).parts
            # Expect: <brand>/models/<model>/video.md
            if len(rel_parts) != 4 or rel_parts[1] != "models":
                continue
            brand_id, _, model_id, _ = rel_parts
        except Exception:
            continue

        videos = dedup_by_url(parse_video_md(video_md))
        if not videos:
            total_skipped_empty += 1
            continue

        # Find matching generation directories in LLCAR KB
        model_dir = dst / brand_id / model_id
        if not model_dir.is_dir():
            total_no_match += 1
            continue

        gen_dirs = [d for d in model_dir.iterdir() if d.is_dir()]
        if not gen_dirs:
            total_no_match += 1
            continue

        for gen_dir in gen_dirs:
            out_path = gen_dir / "videos.json"
            existing: list[dict] = []
            if out_path.is_file():
                try:
                    existing = json.loads(out_path.read_text(encoding="utf-8"))
                    if not isinstance(existing, list):
                        existing = []
                except Exception:
                    existing = []
            merged = dedup_by_url(existing + videos)
            if args.dry_run:
                print(f"DRY {out_path}: +{len(merged) - len(existing)} (total {len(merged)})")
            else:
                out_path.write_text(
                    json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                print(f"{out_path.relative_to(dst)}: {len(merged)} videos")
            total_videos += len(merged)
            total_files_written += 1
            if total_files_written >= args.limit:
                break
        if total_files_written >= args.limit:
            break

    print(
        f"\nSummary: files_written={total_files_written}, "
        f"total_videos={total_videos}, empty_source={total_skipped_empty}, "
        f"no_kb_match={total_no_match}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
