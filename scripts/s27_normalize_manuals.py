#!/usr/bin/env python3
"""S27 Этап F — normalize manual.md to unified structure (safe, mechanical).

Passes (in order):
  1. Strip DITA ID lines       (`x_y_z` | model | pdf_manual | tier:N | lang:ru | ...)
  2. Strip HTML-comment meta   (<!-- doc_type:... tier:... -->)
  3. Strip publisher boilerplate (УДК, ББК, ISBN, autor П.В., М.:,2014.- 648с, etc.)
  4. Drop Section placeholder   (### Section p.N without body)
  5. Merge multi-H1 adjacents   (# A / # B / # C — collapse to first non-empty)
  6. Drop orphan headers        (header without body in next 3 lines)
  7. Convert warn/note headers → callouts (> ⚠️ / > ℹ️)
  8. Dedupe consecutive lines   (≥5 identical in a row → keep one)
  9. Collapse blank runs        (>2 blanks → 2)
 10. Ensure YAML frontmatter    (derived brand/model/generation from kb path)

Cleanup pass (separate flag --delete-empty):
  - Remove any zero-byte manual.md + prune empty generation dirs

Usage:
    python scripts/s27_normalize_manuals.py                  # dry-run all
    python scripts/s27_normalize_manuals.py --limit 5        # first 5 files
    python scripts/s27_normalize_manuals.py --apply          # write in place
    python scripts/s27_normalize_manuals.py --apply --delete-empty
    python scripts/s27_normalize_manuals.py --path <file>    # single file
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


HEADER_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")

# Pass 1 — DITA ID lines
DITA_ID_RE = re.compile(
    r"^\s*`[a-z0-9_]+`\s*\|.*?\|\s*(pdf_manual|dita|service_manual|owners_manual)\b.*$",
    re.IGNORECASE,
)

# Pass 2 — HTML-comment meta
HTML_META_RE = re.compile(r"^\s*<!--\s*doc_type:.*?-->\s*$", re.IGNORECASE)

# Pass 3 — publisher boilerplate (full-line matches)
BOILERPLATE_PATTERNS = [
    ("udk",         re.compile(r"^\s*#?\s*УДК\s+[\d.]+.*$")),
    ("bbk",         re.compile(r"^\s*#?\s*[BВ]?ББ[КK]\s+[\d.,/ ]+.*$")),
    ("isbn",        re.compile(r"^\s*ISBN\s*:?\s*[\d\-Xx]+.*$")),
    ("publisher_m", re.compile(r"^\s*[-–—]?\s*[МM]\.:?,?\s*(19|20)\d{2}\.?\s*[-–—]\s*\d+\s*[cс].*$")),
    ("author",      re.compile(r"^\s*(Серебряков|Иванов|Петров|Сидоров|Смирнов|Кузнецов|Орлов|Лебедев|Семёнов)\s+[А-ЯЁ]\.[А-ЯЁ]\.\s*$")),
    ("marketing",   re.compile(r"^\s*ФОТОГРАФИЯ\s+ВОЗЬМИ\s+С\s+СОБОЙ\s+В\s+ДОРОГУ[!.]*\s*$", re.IGNORECASE)),
    ("series_ar",   re.compile(r"^\s*«?[Аа]рус»?\s*$")),
    ("series_n",    re.compile(r"^\s*Руководство\s+\d+\s*[:.]\s*$")),
    ("series_name", re.compile(r"^\s*Серия\s+[«\"][^»\"]+[»\"].*$", re.IGNORECASE)),
    ("kod",         re.compile(r"^\s*\(?Код\s+\d+\)?\s*$")),
    ("codex_all",   re.compile(r"^\s*[-–—]?\s*М\.:,\s+(19|20)\d{2}\.\s*[-–—]\s*\d+\s*с.*$")),
]

# Pass 4 — Section p.N placeholder
SECTION_PLACEHOLDER_RE = re.compile(r"^###\s+Section\s+p\.\d+\s*$", re.IGNORECASE)

# Pass 4b — manual-title metadata: "# Manual: X (N chunks)" — ETL artifact
MANUAL_TITLE_META_RE = re.compile(r"^#\s+Manual:\s+\S.*?\s+\(\d+\s+chunks?\)\s*$", re.IGNORECASE)

# Pass 7 — warning / note headers (trailing !/！/:/. stripped when comparing)
WARN_SET = {
    "внимание", "предупреждение", "осторожно", "предупреждать",
    "warning", "caution", "danger",
}
NOTE_SET = {
    "примечание", "добрые советы", "полезная информация", "означать",
    "note", "tip", "remark",
}


def classify_header_h3(line: str) -> str:
    m = re.match(r"^###\s+(.+?)\s*$", line)
    if not m:
        return ""
    raw = m.group(1).strip()
    # strip trailing punct variants
    stripped = re.sub(r"[!！:.…·]+\s*$", "", raw).strip().lower()
    if stripped in WARN_SET:
        return "warn"
    if stripped in NOTE_SET:
        return "note"
    return ""


def derive_meta(manual_path: Path, kb_root: Path) -> tuple[str, str, str]:
    try:
        rel = manual_path.relative_to(kb_root)
    except ValueError:
        return "", "", ""
    parts = rel.parts
    if len(parts) < 4:
        return "", "", ""
    return parts[0], parts[1], parts[2]


# ---------------------------------------------------------------------------
# Passes
# ---------------------------------------------------------------------------

def pass_strip_dita_ids(lines: list[str], stats: dict) -> list[str]:
    out = []
    for ln in lines:
        if DITA_ID_RE.match(ln):
            stats["dita_id_strip"] = stats.get("dita_id_strip", 0) + 1
            continue
        out.append(ln)
    return out


def pass_strip_html_meta(lines: list[str], stats: dict) -> list[str]:
    out = []
    for ln in lines:
        if HTML_META_RE.match(ln):
            stats["html_meta_strip"] = stats.get("html_meta_strip", 0) + 1
            continue
        out.append(ln)
    return out


def pass_strip_boilerplate(lines: list[str], stats: dict) -> list[str]:
    out = []
    for ln in lines:
        dropped = False
        for name, pat in BOILERPLATE_PATTERNS:
            if pat.match(ln):
                stats[f"boilerplate_{name}"] = stats.get(f"boilerplate_{name}", 0) + 1
                dropped = True
                break
        if not dropped:
            out.append(ln)
    return out


def pass_drop_section_placeholders(lines: list[str], stats: dict) -> list[str]:
    out = []
    for ln in lines:
        if SECTION_PLACEHOLDER_RE.match(ln):
            stats["section_placeholder_drop"] = stats.get("section_placeholder_drop", 0) + 1
            continue
        if MANUAL_TITLE_META_RE.match(ln):
            stats["manual_title_meta_drop"] = stats.get("manual_title_meta_drop", 0) + 1
            continue
        out.append(ln)
    return out


def pass_merge_multi_h1(lines: list[str], stats: dict) -> list[str]:
    """Several # H1 lines in a row with only empty lines between → keep first only."""
    out: list[str] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        m = re.match(r"^#\s+", ln)
        if not m:
            out.append(ln)
            i += 1
            continue
        # collect adjacent H1 block
        h1s = [ln]
        j = i + 1
        while j < len(lines):
            nxt = lines[j]
            if not nxt.strip():
                j += 1
                continue
            if re.match(r"^#\s+", nxt):
                h1s.append(nxt)
                j += 1
                continue
            break
        if len(h1s) == 1:
            out.append(ln)
            i += 1
            continue
        # pick the longest non-empty as representative
        rep = max(h1s, key=lambda h: len(h))
        out.append(rep)
        out.append("")
        stats["multi_h1_merge"] = stats.get("multi_h1_merge", 0) + (len(h1s) - 1)
        i = j
    return out


def pass_drop_orphan_headers(lines: list[str], stats: dict) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if HEADER_RE.match(ln):
            has_body = False
            for j in range(i + 1, min(i + 4, len(lines))):
                nxt = lines[j].strip()
                if not nxt:
                    continue
                if HEADER_RE.match(lines[j]):
                    break
                has_body = True
                break
            if not has_body:
                stats["orphan_header"] = stats.get("orphan_header", 0) + 1
                i += 1
                continue
        out.append(ln)
        i += 1
    return out


def pass_warn_note_callouts(lines: list[str], stats: dict) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        cls = classify_header_h3(ln)
        if cls in ("warn", "note"):
            body: list[str] = []
            j = i + 1
            blank_run = 0
            while j < len(lines):
                nxt = lines[j]
                if HEADER_RE.match(nxt):
                    break
                if not nxt.strip():
                    blank_run += 1
                    if blank_run >= 2:
                        break
                    body.append("")
                    j += 1
                    continue
                blank_run = 0
                body.append(nxt)
                j += 1
            while body and not body[-1].strip():
                body.pop()
            prefix = "⚠️ **Внимание:**" if cls == "warn" else "ℹ️ **Примечание:**"
            if body:
                out.append(f"> {prefix} {body[0].strip()}")
                for b in body[1:]:
                    out.append(f"> {b}" if b.strip() else ">")
            else:
                out.append(f"> {prefix}")
            out.append("")
            stats[f"callout_{cls}"] = stats.get(f"callout_{cls}", 0) + 1
            i = j
            continue
        out.append(ln)
        i += 1
    return out


def pass_dedupe_consecutive(lines: list[str], stats: dict) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip():
            j = i + 1
            while j < len(lines) and lines[j] == line:
                j += 1
            run = j - i
            if run >= 5:
                out.append(line)
                stats["dedup_consecutive"] = stats.get("dedup_consecutive", 0) + (run - 1)
                i = j
                continue
        out.append(line)
        i += 1
    return out


def pass_collapse_blanks(lines: list[str], stats: dict) -> list[str]:
    out: list[str] = []
    blank_run = 0
    for line in lines:
        if not line.strip():
            blank_run += 1
            if blank_run <= 2:
                out.append(line)
        else:
            blank_run = 0
            out.append(line)
    if len(out) < len(lines):
        stats["blank_collapse"] = len(lines) - len(out)
    return out


def pass_ensure_frontmatter(text: str, brand: str, model: str, gen: str, stats: dict) -> str:
    if text.startswith("---\n") or not brand:
        return text
    lines = ["---", f"brand: {brand}"]
    if model:
        lines.append(f"model: {model}")
    if gen:
        lines.append(f"generation: {gen}")
    lines.append("source: kb")
    lines.append("---")
    lines.append("")
    stats["frontmatter_added"] = 1
    return "\n".join(lines) + "\n" + text


def normalize(text: str, brand: str, model: str, gen: str) -> tuple[str, dict[str, int]]:
    stats: dict[str, int] = {}
    lines = text.split("\n")

    lines = pass_strip_dita_ids(lines, stats)
    lines = pass_strip_html_meta(lines, stats)
    lines = pass_strip_boilerplate(lines, stats)
    lines = pass_drop_section_placeholders(lines, stats)
    lines = pass_merge_multi_h1(lines, stats)
    lines = pass_drop_orphan_headers(lines, stats)
    lines = pass_warn_note_callouts(lines, stats)
    lines = pass_dedupe_consecutive(lines, stats)
    lines = pass_collapse_blanks(lines, stats)

    while lines and not lines[-1].strip():
        lines.pop()
    lines.append("")
    text = "\n".join(lines)
    text = pass_ensure_frontmatter(text, brand, model, gen, stats)
    return text, stats


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def process(manual_path: Path, kb_root: Path, apply: bool) -> tuple[int, int, dict[str, int]]:
    try:
        text = manual_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"[skip] {manual_path}: {e}", file=sys.stderr)
        return 0, 0, {}
    before = len(text.encode("utf-8"))
    brand, model, gen = derive_meta(manual_path, kb_root)
    text, stats = normalize(text, brand, model, gen)
    after = len(text.encode("utf-8"))
    if after == before and not stats:
        return before, after, {}
    if apply:
        manual_path.write_text(text, encoding="utf-8")
    return before, after, stats


def delete_empties(kb_root: Path, apply: bool) -> tuple[int, int]:
    """Remove zero-byte manual.md + prune empty gen-dirs."""
    removed_files = 0
    pruned_dirs = 0
    for manual in sorted(kb_root.rglob("manual.md")):
        try:
            if manual.stat().st_size == 0:
                if apply:
                    manual.unlink()
                print(f"[empty] rm {manual.relative_to(kb_root)}")
                removed_files += 1
                gen_dir = manual.parent
                if apply and not any(gen_dir.iterdir()):
                    gen_dir.rmdir()
                    pruned_dirs += 1
        except OSError:
            continue
    return removed_files, pruned_dirs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--path", default=None, help="Single manual.md")
    ap.add_argument("--limit", type=int, default=0, help="Process first N files only")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--delete-empty", action="store_true",
                    help="Also cleanup zero-byte manual.md files")
    ap.add_argument("--report", default=".omc/research/s27-normalize-stats.md")
    args = ap.parse_args()

    kb_root = Path(args.kb_root).resolve()
    if args.path:
        paths = [Path(args.path)]
    else:
        paths = sorted(kb_root.rglob("manual.md"))
        if args.limit:
            paths = paths[: args.limit]

    total_before = 0
    total_after = 0
    agg: dict[str, int] = {}
    touched = 0
    per_file: list[tuple[str, int, int, dict[str, int]]] = []

    for p in paths:
        b, a, s = process(p, kb_root, args.apply)
        if b == 0:
            continue
        if b == a and not s:
            continue
        touched += 1
        total_before += b
        total_after += a
        for k, v in s.items():
            agg[k] = agg.get(k, 0) + v
        try:
            rel = p.relative_to(kb_root)
        except ValueError:
            rel = p
        per_file.append((str(rel), b, a, s))

    diff = total_before - total_after
    mode = "apply" if args.apply else "dry-run"
    print(f"[{mode}] touched {touched} files; saved {diff:,}B "
          f"({diff / max(total_before, 1) * 100:.1f}%)")
    for k, v in sorted(agg.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

    if args.delete_empty:
        r, d = delete_empties(kb_root, args.apply)
        print(f"[{'rm' if args.apply else 'would-rm'}] empty manuals: {r}, pruned dirs: {d}")

    lines = [f"# S27 normalize manual.md — {mode}", ""]
    lines.append(f"**Files touched:** {touched}")
    lines.append(f"**Size:** {total_before:,}B → {total_after:,}B "
                 f"(−{diff:,}B, −{diff / max(total_before, 1) * 100:.1f}%)")
    lines.append("")
    lines.append("## Pass hits")
    lines.append("| pass | count |")
    lines.append("|---|---:|")
    for k, v in sorted(agg.items(), key=lambda x: -x[1]):
        lines.append(f"| `{k}` | {v} |")
    lines.append("")
    lines.append("## Top-30 largest reductions")
    lines.append("| file | before | after | −Δ | top hits |")
    lines.append("|---|---:|---:|---:|---|")
    for path, b, a, s in sorted(per_file, key=lambda x: -(x[1] - x[2]))[:30]:
        hits = ", ".join(f"{k}={v}" for k, v in sorted(s.items(), key=lambda x: -x[1])[:3])
        lines.append(f"| {path} | {b:,} | {a:,} | {b - a:,} | {hits} |")

    out = Path(args.report)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[info] report → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
