"""Verification worker: check each source URL in raw GLM output.

For each source in raw/iter{N}/batch-{slug}.json:
  - If url starts with http(s): urllib.request HEAD/GET with 20s timeout
    -> status: ok|404|timeout|off-topic (heuristic)
  - If non-URL (ISBN/DOI/SAE number/standard ref): mark 'ref' (non-verifiable via HTTP)
  - Uses source-cache.json to avoid duplicate fetches across topics.

Writes raw/iter{N}/verify-{slug}.json.

Usage:
    python scripts/s20_verify_worker.py --iter 1 --slug shock-absorbers
    python scripts/s20_verify_worker.py --iter 1 --all
"""
from __future__ import annotations

import argparse
import hashlib
import json
import socket
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
CACHE_PATH = RESEARCH / "_meta" / "source-cache.json"

USER_AGENT = "Mozilla/5.0 (S20-AutoResearch/1.0) research-verifier"


def load_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def url_key(url: str) -> str:
    return hashlib.sha1(url.strip().lower().encode("utf-8")).hexdigest()[:16]


def check_url(url: str, timeout: float = 20.0) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    start = time.time()
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            code = resp.getcode()
            content_type = resp.headers.get("Content-Type", "")
            body = resp.read(4096).decode("utf-8", errors="replace") if "html" in content_type or "text" in content_type else ""
            elapsed = round(time.time() - start, 2)
            return {
                "status": "ok" if 200 <= code < 400 else f"http_{code}",
                "code": code,
                "content_type": content_type,
                "excerpt": body[:400],
                "elapsed_sec": elapsed,
            }
    except urllib.error.HTTPError as e:
        return {"status": f"http_{e.code}", "code": e.code, "excerpt": "", "elapsed_sec": round(time.time() - start, 2)}
    except (urllib.error.URLError, socket.timeout, TimeoutError) as e:
        return {"status": "timeout", "code": 0, "excerpt": "", "elapsed_sec": round(time.time() - start, 2), "error": str(e)[:200]}
    except Exception as e:
        return {"status": "error", "code": 0, "excerpt": "", "elapsed_sec": round(time.time() - start, 2), "error": str(e)[:200]}


def verify_one(iter_n: int, slug: str, cache: dict) -> Path | None:
    raw_path = RESEARCH / "raw" / f"iter{iter_n}" / f"batch-{slug}.json"
    if not raw_path.exists():
        print(f"[miss] {slug} — no raw file")
        return None
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    if not raw.get("parsed_ok"):
        print(f"[skip] {slug} — parsed_ok=False")
        return None
    parsed = raw["parsed"]
    sources = parsed.get("sources") or []
    out: dict = {
        "topic_slug": slug,
        "iter": iter_n,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
    }
    for s in sources:
        ref = (s.get("url_or_ref") or "").strip()
        if not ref:
            continue
        if not ref.startswith(("http://", "https://")):
            out["sources"][ref] = {"status": "ref", "note": "non-URL reference (ISBN/DOI/standard)"}
            continue
        key = url_key(ref)
        if key in cache:
            out["sources"][ref] = {**cache[key], "from_cache": True}
            continue
        result = check_url(ref)
        cache[key] = result
        out["sources"][ref] = result
        print(f"  [{result['status']}] {ref[:80]} ({result['elapsed_sec']}s)")
    out_path = RESEARCH / "raw" / f"iter{iter_n}" / f"verify-{slug}.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    save_cache(cache)
    ok_count = sum(1 for v in out["sources"].values() if v.get("status") == "ok")
    print(f"[done] {slug}: {ok_count}/{len(out['sources'])} ok")
    return out_path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--iter", type=int, required=True)
    p.add_argument("--slug")
    p.add_argument("--slugs")
    p.add_argument("--all", action="store_true")
    args = p.parse_args()

    if args.all:
        iter_dir = RESEARCH / "raw" / f"iter{args.iter}"
        slugs = [f.stem.replace("batch-", "") for f in sorted(iter_dir.glob("batch-*.json"))]
    elif args.slugs:
        slugs = [s.strip() for s in args.slugs.split(",") if s.strip()]
    elif args.slug:
        slugs = [args.slug]
    else:
        p.error("need --slug, --slugs or --all")

    cache = load_cache()
    ok = 0
    for s in slugs:
        if verify_one(args.iter, s, cache):
            ok += 1
    print(f"\nverify DONE: {ok}/{len(slugs)}")


if __name__ == "__main__":
    main()
