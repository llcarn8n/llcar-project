#!/usr/bin/env python3
"""S27 — near-duplicate paragraph dedup via MinHash LSH (datasketch).

Intra-file dedup: splits manual.md into paragraphs (blank-line separated),
detects clusters of near-duplicate paragraphs via MinHash+LSH, keeps the
first occurrence in each cluster (size >= --min-duplicates), drops the rest.

Preserves structure: keeps H1-H6 headers, YAML frontmatter, code blocks,
image refs, warnings/notes callouts (as written by s27_normalize_manuals).
Only deduplicates *body* paragraphs.

Usage:
    python scripts/s27_dedupe_near_paragraphs.py --path <file>    # single
    python scripts/s27_dedupe_near_paragraphs.py                  # all KB
    python scripts/s27_dedupe_near_paragraphs.py --apply
    python scripts/s27_dedupe_near_paragraphs.py --min-size-mb 10 # only big

Params:
    --threshold     Jaccard similarity (0.0-1.0), default 0.85
    --num-perm      MinHash permutations, default 128
    --k             shingle size (words), default 5
    --min-dupes     cluster size to trigger drop, default 3
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

try:
    from datasketch import MinHash, MinHashLSH
except ImportError:
    print("ERROR: pip install datasketch", file=sys.stderr)
    sys.exit(1)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n+", re.DOTALL)
HEADER_RE = re.compile(r"^#{1,6}\s+")
CALLOUT_RE = re.compile(r"^>\s")
IMAGE_RE = re.compile(r"^!\[")
CODE_FENCE_RE = re.compile(r"^```")
WORD_RE = re.compile(r"\w+", re.UNICODE)


def shingles(text: str, k: int) -> set[str]:
    words = WORD_RE.findall(text.lower())
    if len(words) < k:
        return {" ".join(words)} if words else set()
    return {" ".join(words[i:i + k]) for i in range(len(words) - k + 1)}


def minhash(text: str, num_perm: int, k: int) -> MinHash | None:
    sh = shingles(text, k)
    if not sh:
        return None
    m = MinHash(num_perm=num_perm)
    for s in sh:
        m.update(s.encode("utf-8"))
    return m


def is_structural(paragraph: str) -> bool:
    """Structure-preserving paragraphs (never dedup): headers, frontmatter ends, code fences, lone images."""
    lines = paragraph.split("\n")
    first = lines[0].strip()
    if HEADER_RE.match(first):
        return True
    if CODE_FENCE_RE.match(first):
        return True
    if all(IMAGE_RE.match(ln.strip()) or not ln.strip() for ln in lines):
        return True
    return False


def is_too_short(paragraph: str) -> bool:
    """Paragraphs with < 15 words are probably structural or small — skip."""
    return len(WORD_RE.findall(paragraph)) < 15


def split_paragraphs(text: str) -> tuple[str, list[str]]:
    """Return (frontmatter_or_empty, list_of_paragraphs)."""
    fm = ""
    body = text
    m = FRONTMATTER_RE.match(text)
    if m:
        fm = m.group(0)
        body = text[m.end():]
    # Walk line-by-line respecting code blocks
    paragraphs: list[str] = []
    cur: list[str] = []
    in_code = False
    for line in body.split("\n"):
        if CODE_FENCE_RE.match(line):
            in_code = not in_code
            cur.append(line)
            continue
        if in_code:
            cur.append(line)
            continue
        if line.strip() == "":
            if cur:
                paragraphs.append("\n".join(cur))
                cur = []
            continue
        cur.append(line)
    if cur:
        paragraphs.append("\n".join(cur))
    return fm, paragraphs


def dedupe(paragraphs: list[str], *, threshold: float, num_perm: int, k: int,
           min_dupes: int) -> tuple[list[str], int, int]:
    """Returns (kept_paragraphs, dropped_count, clusters_found)."""
    lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
    signatures: list[MinHash | None] = []
    assignments: list[int] = [-1] * len(paragraphs)  # cluster id per para, -1 = unclustered
    next_cluster = 0

    for i, para in enumerate(paragraphs):
        if is_structural(para) or is_too_short(para):
            signatures.append(None)
            continue
        m = minhash(para, num_perm, k)
        signatures.append(m)
        if m is None:
            continue
        dupes = lsh.query(m)
        if dupes:
            # Join first cluster's id
            first_id = int(dupes[0])
            cluster_id = assignments[first_id]
            if cluster_id < 0:
                cluster_id = next_cluster
                next_cluster += 1
                assignments[first_id] = cluster_id
            assignments[i] = cluster_id
        try:
            lsh.insert(str(i), m)
        except ValueError:
            pass  # duplicate key — shouldn't happen

    # Count cluster sizes
    cluster_sizes: dict[int, int] = {}
    for c in assignments:
        if c >= 0:
            cluster_sizes[c] = cluster_sizes.get(c, 0) + 1

    # Paragraphs to drop: those assigned to cluster of size >= min_dupes,
    # except the *first* one in each cluster
    cluster_first: dict[int, int] = {}
    for idx, c in enumerate(assignments):
        if c >= 0 and c not in cluster_first:
            cluster_first[c] = idx

    kept: list[str] = []
    dropped = 0
    clusters_applied = 0
    seen_clusters: set[int] = set()
    for idx, para in enumerate(paragraphs):
        c = assignments[idx]
        if c >= 0 and cluster_sizes[c] >= min_dupes and idx != cluster_first[c]:
            dropped += 1
            if c not in seen_clusters:
                clusters_applied += 1
                seen_clusters.add(c)
            continue
        kept.append(para)
    return kept, dropped, clusters_applied


def process(path: Path, *, threshold: float, num_perm: int, k: int,
            min_dupes: int, apply: bool) -> tuple[int, int, int, int]:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"[err] {path}: {e}", file=sys.stderr)
        return 0, 0, 0, 0
    before = len(text.encode("utf-8"))
    fm, paras = split_paragraphs(text)
    if not paras:
        return before, before, 0, 0
    kept, dropped, clusters = dedupe(
        paras, threshold=threshold, num_perm=num_perm, k=k, min_dupes=min_dupes
    )
    if dropped == 0:
        return before, before, 0, 0
    new_text = fm + "\n\n".join(kept)
    if not new_text.endswith("\n"):
        new_text += "\n"
    after = len(new_text.encode("utf-8"))
    if apply:
        path.write_text(new_text, encoding="utf-8")
    return before, after, dropped, clusters


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--path", default=None)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--threshold", type=float, default=0.85)
    ap.add_argument("--num-perm", type=int, default=128)
    ap.add_argument("--k", type=int, default=5)
    ap.add_argument("--min-dupes", type=int, default=3)
    ap.add_argument("--min-size-mb", type=float, default=0,
                    help="Only process manual.md larger than this (MB)")
    ap.add_argument("--report", default=".omc/research/s27-dedupe-stats.md")
    args = ap.parse_args()

    kb_root = Path(args.kb_root).resolve()
    if args.path:
        paths = [Path(args.path)]
    else:
        paths = sorted(kb_root.rglob("manual.md"))

    min_bytes = int(args.min_size_mb * 1024 * 1024)
    total_before = total_after = total_dropped = total_clusters = 0
    touched = 0
    per_file: list[tuple[str, int, int, int, int]] = []

    for p in paths:
        sz = p.stat().st_size
        if sz < min_bytes:
            continue
        b, a, d, c = process(
            p,
            threshold=args.threshold, num_perm=args.num_perm, k=args.k,
            min_dupes=args.min_dupes, apply=args.apply,
        )
        if b == 0 or d == 0:
            continue
        touched += 1
        total_before += b
        total_after += a
        total_dropped += d
        total_clusters += c
        try:
            rel = str(p.relative_to(kb_root))
        except ValueError:
            rel = str(p)
        per_file.append((rel, b, a, d, c))
        print(f"[{'apply' if args.apply else 'dry'}] {rel}: "
              f"{b/1e6:.1f}MB -> {a/1e6:.1f}MB "
              f"(-{(b-a)/1e6:.1f}MB, dropped {d} in {c} clusters)")

    mode = "apply" if args.apply else "dry-run"
    diff = total_before - total_after
    print(f"\n[{mode}] touched {touched}; paras dropped {total_dropped} "
          f"in {total_clusters} clusters; "
          f"{total_before/1e6:.0f}MB -> {total_after/1e6:.0f}MB "
          f"(-{diff/1e6:.0f}MB, -{diff/max(total_before,1)*100:.1f}%)")

    lines = [f"# S27 near-paragraph dedup — {mode}", ""]
    lines.append(f"**Params:** threshold={args.threshold} k={args.k} "
                 f"num_perm={args.num_perm} min_dupes={args.min_dupes}")
    lines.append(f"**Files touched:** {touched}")
    lines.append(f"**Size:** {total_before:,}B -> {total_after:,}B "
                 f"(-{diff:,}B, -{diff / max(total_before,1) * 100:.1f}%)")
    lines.append(f"**Paragraphs dropped:** {total_dropped} in {total_clusters} clusters")
    lines.append("")
    lines.append("## Top-30 reductions")
    lines.append("| file | before | after | dropped | clusters |")
    lines.append("|---|---:|---:|---:|---:|")
    for r, b, a, d, c in sorted(per_file, key=lambda x: -(x[1] - x[2]))[:30]:
        lines.append(f"| {r} | {b:,} | {a:,} | {d} | {c} |")

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[info] report -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
