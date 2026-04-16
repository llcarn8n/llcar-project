"""Harvest unknowns from iter{N} raw files into topics-queue for next iteration.

Reads all raw/iter{N}/batch-*.json with parsed.unknowns[] lists, dedupes by
normalized slug, appends to topics-queue.json as new topics with iter_origin=N.

Usage:
    python scripts/s20_harvest_unknowns.py --iter 1
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
SEED = RESEARCH / "_meta" / "seed-topics.json"
QUEUE = RESEARCH / "_meta" / "topics-queue.json"
ITER_LOG = RESEARCH / "_meta" / "iterations.log"


def slugify(text: str) -> str:
    """Simplified slug: lower, strip, keep alphanum + cyrillic, collapse spaces to -."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"\s+", "-", text)
    return text[:80].strip("-")


def infer_category(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ("peer-review", "sae", "doi", "iso", "гост", "диссерт", "laborat", "scientific")):
        return "scientific-evidence"
    if any(k in t for k in ("вибро", "vibrost", "eusama", "boge", "rig", "стенд")):
        return "vibrostand"
    if any(k in t for k in ("частот", "spectr", "audio", "звук", "шум", "mic")):
        return "audio-correlations"
    if any(k in t for k in ("bmw", "toyota", "kia", "lada", "geely", "bylorus", "ford", "audi", "mercedes")):
        return "brands"
    if any(k in t for k in ("диагност", "практик", "оши", "custdev", "expert")):
        return "expert-practice"
    return "suspension"


def load_existing_slugs() -> set[str]:
    slugs: set[str] = set()
    if SEED.exists():
        for t in json.loads(SEED.read_text(encoding="utf-8"))["topics"]:
            slugs.add(t["slug"])
    if QUEUE.exists():
        for t in json.loads(QUEUE.read_text(encoding="utf-8")).get("topics", []):
            slugs.add(t["slug"])
    return slugs


def load_queue() -> dict:
    if QUEUE.exists():
        return json.loads(QUEUE.read_text(encoding="utf-8"))
    return {"schema_version": 1, "topics": []}


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--iter", type=int, required=True)
    args = p.parse_args()

    iter_dir = RESEARCH / "raw" / f"iter{args.iter}"
    if not iter_dir.exists():
        raise SystemExit(f"no such iter dir: {iter_dir}")
    existing = load_existing_slugs()
    queue = load_queue()
    new_topics: list[dict] = []
    next_id = max((t.get("id", 0) for t in queue["topics"]), default=1000) + 1
    if next_id < 1000:
        next_id = 1000

    seen_new: set[str] = set()
    for fp in sorted(iter_dir.glob("batch-*.json")):
        data = json.loads(fp.read_text(encoding="utf-8"))
        if not data.get("parsed_ok"):
            continue
        parsed = data.get("parsed") or {}
        origin_slug = parsed.get("topic_slug") or fp.stem.replace("batch-", "")
        for unknown_text in parsed.get("unknowns", []):
            if not unknown_text or not isinstance(unknown_text, str):
                continue
            slug = slugify(unknown_text)
            if not slug or slug in existing or slug in seen_new:
                continue
            seen_new.add(slug)
            new_topics.append(
                {
                    "id": next_id,
                    "slug": slug,
                    "category": infer_category(unknown_text),
                    "priority": 2,
                    "title": unknown_text[:120],
                    "prompt_hint": unknown_text,
                    "status": "queued",
                    "iter_origin": args.iter,
                    "origin_topic_slug": origin_slug,
                    "unknown_text": unknown_text,
                }
            )
            next_id += 1

    queue["topics"].extend(new_topics)
    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2), encoding="utf-8")

    log_line = (
        f"{datetime.now(timezone.utc).isoformat()} | iter={args.iter} | "
        f"new_unknowns={len(new_topics)} | queue_total={len(queue['topics'])}\n"
    )
    with ITER_LOG.open("a", encoding="utf-8") as f:
        f.write(log_line)
    print(f"harvested {len(new_topics)} new topics from iter{args.iter}")
    for t in new_topics[:10]:
        print(f"  +{t['id']} [{t['category']}] {t['slug']}")
    if len(new_topics) > 10:
        print(f"  ... and {len(new_topics) - 10} more")


if __name__ == "__main__":
    main()
