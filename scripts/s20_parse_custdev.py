"""Parse CUSTDEV2 transcripts → snippets JSON keyed by suspension/audio defects.

Reads CUSTDEV2/Транскрипты/*.docx, extracts paragraphs containing keywords
related to suspension/vibration/noise diagnostics, with surrounding context.

Usage:
    python scripts/s20_parse_custdev.py
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from docx import Document  # python-docx

ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS = ROOT / "CUSTDEV2" / "Транскрипты"
OUT_PATH = ROOT / "docs" / "research" / "suspension-audio" / "_meta" / "custdev-snippets.json"

KEYWORDS = [
    "подвеск", "амортизатор", "стойк", "сайлент", "сайлентблок", "шаров",
    "стабилизатор", "пружин", "рычаг", "тяг", "пыльник", "опор",
    "вибр", "стук", "скрип", "хруст", "клацан", "дребез", "гул", "шум",
    "вибростенд", "стенд", "руль бьёт", "руль бьет", "ходов",
    "ШРУС", "ступ", "подшипник",
]

# precompile keyword regex (whole word search, case-insensitive)
KW_RE = re.compile("|".join(KEYWORDS), re.IGNORECASE)


def extract_paragraphs(doc_path: Path) -> list[str]:
    try:
        doc = Document(str(doc_path))
    except Exception as e:
        print(f"  [err] {doc_path.name}: {e}")
        return []
    return [p.text.strip() for p in doc.paragraphs if p.text.strip()]


def find_snippets(paragraphs: list[str], interviewee: str, doc_name: str) -> list[dict]:
    out: list[dict] = []
    for i, para in enumerate(paragraphs):
        m = KW_RE.search(para)
        if not m:
            continue
        kws = sorted({kw.lower() for kw in KW_RE.findall(para)})
        before = paragraphs[i - 1] if i > 0 else ""
        after = paragraphs[i + 1] if i + 1 < len(paragraphs) else ""
        out.append(
            {
                "interviewee": interviewee,
                "doc": doc_name,
                "para_idx": i,
                "quote": para,
                "context_before": before[:400],
                "context_after": after[:400],
                "keywords_matched": kws,
            }
        )
    return out


def interviewee_from_filename(name: str) -> str:
    m = re.search(r"(?:Информант|Интервью|Респондент)\s*(?:№|#)?\s*(\d+)", name, re.IGNORECASE)
    return f"Информант {m.group(1)}" if m else name.rsplit(".", 1)[0]


def main() -> None:
    if not TRANSCRIPTS.exists():
        raise SystemExit(f"transcripts dir missing: {TRANSCRIPTS}")
    docs = sorted(TRANSCRIPTS.glob("*.docx")) + sorted(TRANSCRIPTS.glob("*.doc"))
    if not docs:
        raise SystemExit(f"no .docx files in {TRANSCRIPTS}")
    all_snippets: list[dict] = []
    print(f"parsing {len(docs)} transcripts...")
    for d in docs:
        if d.name.startswith("~$"):
            continue  # skip Office lock files
        interviewee = interviewee_from_filename(d.name)
        paras = extract_paragraphs(d)
        snippets = find_snippets(paras, interviewee, d.name)
        all_snippets.extend(snippets)
        print(f"  {d.name}: {len(snippets)} snippets")

    payload = {
        "schema_version": 1,
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "total_snippets": len(all_snippets),
        "total_docs": len(docs),
        "keywords_used": KEYWORDS,
        "snippets": all_snippets,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nwrote {len(all_snippets)} snippets from {len(docs)} docs to {OUT_PATH.relative_to(ROOT)}")
    # quick keyword distribution
    kw_counts: dict[str, int] = {}
    for s in all_snippets:
        for kw in s["keywords_matched"]:
            kw_counts[kw] = kw_counts.get(kw, 0) + 1
    top = sorted(kw_counts.items(), key=lambda x: -x[1])[:10]
    print("\ntop keywords:")
    for kw, c in top:
        print(f"  {kw}: {c}")


if __name__ == "__main__":
    main()
