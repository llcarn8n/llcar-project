"""Parallel GLM worker dispatcher.

Runs s20_glm_worker.py across N topics in parallel (subprocess pool).
Resume-safe: workers skip topics with parsed_ok=True raw files.

Usage:
    python scripts/s20_dispatch_batch.py --iter 1 --batch 1 --size 5
    python scripts/s20_dispatch_batch.py --iter 1 --ids 1,2,3,4,5
    python scripts/s20_dispatch_batch.py --iter 2 --source queue --limit 10
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
SEED = RESEARCH / "_meta" / "seed-topics.json"
QUEUE = RESEARCH / "_meta" / "topics-queue.json"
WORKER = Path(__file__).parent / "s20_glm_worker.py"


def load_topics(source: str, ids: list[int] | None, batch: int | None, size: int, limit: int | None) -> list[dict]:
    if source == "seed":
        topics = json.loads(SEED.read_text(encoding="utf-8"))["topics"]
    elif source == "queue":
        topics = json.loads(QUEUE.read_text(encoding="utf-8"))["topics"]
    else:
        raise SystemExit(f"unknown source: {source}")
    if ids:
        topics = [t for t in topics if t.get("id") in ids]
    elif batch is not None:
        start = (batch - 1) * size
        topics = topics[start : start + size]
    elif limit is not None:
        topics = topics[:limit]
    return topics


def run_one(topic_id: int, iter_n: int) -> tuple[int, int, str]:
    cmd = [sys.executable, str(WORKER), "--topic-id", str(topic_id), "--iter", str(iter_n)]
    start = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=240, encoding="utf-8", errors="replace")
        elapsed = int(time.time() - start)
        out = (r.stdout or "") + (r.stderr or "")
        last = out.strip().splitlines()[-1] if out.strip() else ""
        return topic_id, r.returncode, f"{elapsed}s | {last[:200]}"
    except subprocess.TimeoutExpired:
        return topic_id, 124, f"TIMEOUT after {int(time.time() - start)}s"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--iter", type=int, required=True)
    p.add_argument("--batch", type=int)
    p.add_argument("--size", type=int, default=5)
    p.add_argument("--ids", help="comma-separated topic ids")
    p.add_argument("--source", choices=["seed", "queue"], default="seed")
    p.add_argument("--limit", type=int)
    p.add_argument("--workers", type=int, default=5, help="max parallel workers")
    p.add_argument("--pause", type=int, default=10, help="seconds pause between batches")
    args = p.parse_args()

    ids = [int(x) for x in args.ids.split(",")] if args.ids else None
    topics = load_topics(args.source, ids, args.batch, args.size, args.limit)
    if not topics:
        print("no topics to process")
        return
    print(f"dispatching {len(topics)} topics, workers={args.workers}, iter={args.iter}")
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(run_one, t["id"], args.iter): t for t in topics}
        results: list[tuple[int, int, str]] = []
        for fut in concurrent.futures.as_completed(futures):
            topic = futures[fut]
            try:
                tid, rc, note = fut.result()
                results.append((tid, rc, note))
                status = "OK" if rc == 0 else f"RC={rc}"
                print(f"  [{status}] id={tid} slug={topic['slug']} | {note}")
            except Exception as e:
                print(f"  [EXC] id={topic['id']} slug={topic['slug']} | {e}")
                results.append((topic["id"], -1, str(e)[:200]))
    ok = sum(1 for _, rc, _ in results if rc == 0)
    print(f"\nBATCH DONE: {ok}/{len(results)} OK")
    failed = [tid for tid, rc, _ in results if rc != 0]
    if failed:
        print(f"FAILED IDs (rerun with --ids {','.join(map(str, failed))}): {failed}")


if __name__ == "__main__":
    main()
