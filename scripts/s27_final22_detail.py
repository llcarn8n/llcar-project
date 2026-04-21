"""Детальный дамп 22 оставшихся model==gen — с анализом содержимого + source."""
from __future__ import annotations
import io
import json
import re
import sys
from pathlib import Path
from collections import Counter

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


YEAR_RE = re.compile(r"\b(19[89]\d|20[0-2]\d)\b")
TECH = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)
SRC_RE = re.compile(r"[Ss]ource:\s*([^\n]+)", re.I)


def all_years(text: str) -> Counter:
    clean = TECH.sub("", text[:50000])
    c = Counter()
    for m in YEAR_RE.finditer(clean):
        y = int(m.group(1))
        if 1985 <= y <= 2027:
            c[y] += 1
    return c


def main() -> int:
    kb = Path("llcar-dashboard/public/data/kb")
    src_root = Path("D:/manuals-export")
    rows = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) != 4 or parts[1] != parts[2]:
            continue
        brand, model, gen, _ = parts
        text = m.read_text(encoding="utf-8", errors="replace")
        # existing gens
        mdir = kb / brand / model
        existing = {}
        for g in sorted(mdir.iterdir()):
            if g.is_dir() and g.name != gen and not g.name.startswith((".", "_")):
                if (g / "manual.md").exists():
                    try:
                        g_text = (g / "manual.md").read_text(encoding="utf-8", errors="replace")[:20000]
                        g_years = all_years(g_text).most_common(2)
                    except Exception:
                        g_years = []
                    existing[g.name] = g_years
        years = all_years(text).most_common(5)
        src_dir_d = src_root / brand / gen
        pdfs = []
        src_mb = 0.0
        if src_dir_d.exists():
            try:
                for child in src_dir_d.iterdir():
                    if child.is_file():
                        src_mb += child.stat().st_size
                        if child.suffix.lower() == ".pdf":
                            pdfs.append(child.name)
            except Exception:
                pass
            src_mb /= 1e6

        src_match = SRC_RE.search(text[:500])
        src_hint = src_match.group(1).strip() if src_match else ""
        head = "\n".join(ln.strip() for ln in text.splitlines() if ln.strip())[:400]
        rows.append({
            "path": f"{brand}/{model}/{gen}",
            "size_kb": len(text) // 1024,
            "words": len(re.findall(r"\w+", text)),
            "existing": existing,
            "top_years": years,
            "src_pdfs": pdfs[:3],
            "src_mb": round(src_mb, 1),
            "source_line": src_hint[:200],
            "head": head,
        })

    rows.sort(key=lambda r: r["path"])
    out = Path(".omc/research/s27-final22-detail.md")

    lines = [f"# S27 — 22 оставшихся model==gen (детально)\n",
             f"Всего: **{len(rows)}**\n", ""]
    for i, r in enumerate(rows, 1):
        lines.append(f"## {i}. `{r['path']}`")
        lines.append(f"- **size**: {r['size_kb']}KB / {r['words']:,} words")
        eg_str = ", ".join(f"{k}({v[0][0] if v else '?'})" for k, v in r["existing"].items()) or "—"
        lines.append(f"- **existing gens** (+ top year): {eg_str}")
        lines.append(f"- **top years in content**: {r['top_years'] or '—'}")
        lines.append(f"- **Source: line**: `{r['source_line']}`")
        lines.append(f"- **D:\\ pdfs** ({r['src_mb']}MB): {r['src_pdfs'] or '—'}")
        lines.append(f"- **head**: `{r['head'][:200]}`")
        lines.append("")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"total: {len(rows)}")
    print(f"out: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
