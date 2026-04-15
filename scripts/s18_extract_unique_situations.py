#!/usr/bin/env python3
"""Extract unique situations into batch files for GLM verification."""
from __future__ import annotations
import argparse, io, json, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    p.add_argument("--out", default=".omc/state/s18-verifier-batches")
    p.add_argument("--batch-size", type=int, default=20)
    args = p.parse_args()

    kb = Path(args.kb).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    seen = {}
    for sit_path in kb.rglob("situations.json"):
        try:
            data = json.loads(sit_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        parts = sit_path.relative_to(kb).parts
        brand = parts[0] if len(parts) > 0 else ""
        model = parts[1] if len(parts) > 1 else ""
        gen = parts[2] if len(parts) > 2 else ""
        for s in data:
            if not isinstance(s, dict):
                continue
            sid = s.get("id")
            if not sid or sid in seen:
                continue
            seen[sid] = {
                "id": sid,
                "title": s.get("title", ""),
                "qa": s.get("qa", "")[:500],
                "dtc_codes": s.get("dtc_codes", []),
                "brand": brand,
                "model": model,
                "cat": s.get("cat", ""),
                "urg": s.get("urg", 0),
            }

    unique = list(seen.values())
    print(f"Unique: {len(unique)}")

    # Split into batches
    batches = [unique[i:i+args.batch_size] for i in range(0, len(unique), args.batch_size)]
    for i, batch in enumerate(batches):
        (out / f"batch_{i:04d}.json").write_text(
            json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print(f"Wrote {len(batches)} batches of {args.batch_size} to {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
