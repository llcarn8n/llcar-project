#!/usr/bin/env python3
"""Build/update _articles_index.json from files in _articles/.

Scans _articles/*.md, reads each file header + metrics, tries to match to a
situation in situations.json by filename stem == situation id. Adds missing
entries to index; preserves existing entries.

Usage:
    python scripts/build_articles_index.py [--kb llcar-dashboard/public/data/kb]
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path


def count_sections(text: str) -> int:
    """Count emoji-section headers (🔍 🔧 ⚠ 📊 🛠 🛡)."""
    markers = ["🔍", "🔧", "⚠", "📊", "🛠", "🛡"]
    count = 0
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("## "):
            for m in markers:
                if m in line:
                    count += 1
                    break
    return count


def infer_topic(text: str) -> str:
    """Topic = first H1 or first non-empty line, trimmed."""
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()[:200]
    for line in text.splitlines():
        s = line.strip()
        if s:
            return s[:200]
    return ""


def find_situation(sit_id: str, kb_root: Path) -> dict | None:
    """Find situation by id, return {brand, model, generation, cat, urg} + paths."""
    for path in kb_root.rglob("situations.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        for s in data:
            if s.get("id") == sit_id:
                parts = path.relative_to(kb_root).parts
                brand = parts[0] if len(parts) >= 1 else ""
                model = parts[1] if len(parts) >= 2 else ""
                generation = parts[2] if len(parts) >= 3 else ""
                return {
                    "sit_id": sit_id,
                    "brand": brand,
                    "model": model,
                    "generation": generation,
                    "cat": s.get("cat", ""),
                    "urg": s.get("urg", 0),
                }
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kb", default="llcar-dashboard/public/data/kb")
    args = parser.parse_args()
    kb_root = Path(args.kb).resolve()

    idx_path = kb_root / "_articles_index.json"
    articles_dir = kb_root / "_articles"
    if not articles_dir.is_dir():
        print(f"ERROR: {articles_dir} not found")
        return 1

    # Load existing index (preserve structure)
    if idx_path.is_file():
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
    else:
        idx = {"version": 1, "articles": []}
    articles_list = idx.setdefault("articles", [])
    indexed_files = {a["file"] for a in articles_list}

    # Scan _articles/*.md
    files = sorted(f.name for f in articles_dir.glob("*.md"))
    added = 0
    for fname in files:
        rel = f"_articles/{fname}"
        if rel in indexed_files:
            continue
        p = articles_dir / fname
        text = p.read_text(encoding="utf-8", errors="replace")
        sit_id = p.stem  # assume filename stem == situation id
        meta = find_situation(sit_id, kb_root) or {}
        entry = {
            "sit_id": sit_id,
            "file": rel,
            "brand": meta.get("brand", ""),
            "model": meta.get("model", ""),
            "generation": meta.get("generation", ""),
            "length_chars": len(text),
            "sections": count_sections(text),
            "urg": meta.get("urg", 0),
            "cat": meta.get("cat", ""),
            "topic": infer_topic(text),
        }
        articles_list.append(entry)
        indexed_files.add(rel)
        added += 1
        print(f"+ {rel}")

    # Sort by sit_id for stability
    articles_list.sort(key=lambda a: a["sit_id"])
    idx["articles"] = articles_list
    idx["updated"] = "2026-04-15"

    idx_path.write_text(
        json.dumps(idx, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\nAdded {added} entries. Total articles indexed: {len(articles_list)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
