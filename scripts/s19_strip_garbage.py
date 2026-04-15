#!/usr/bin/env python3
"""Strip owner-manual warnings, mojibake, English-heavy situations and DTC titles."""
from __future__ import annotations
import io, json, re, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

CYRILLIC = re.compile(r"[а-яА-ЯёЁ]")
LATIN = re.compile(r"[a-zA-Z]")
# Mojibake / broken OCR: множество редких символов подряд
MOJIBAKE = re.compile(r"[\u00C0-\u00FF\u0370-\u03FF\u0530-\u058F]{2,}")
# OCR garbage: слова с перемешанными latin/cyrillic
MIXED_WORDS = re.compile(r"\b[а-яА-Я]+[a-zA-Z]+[а-яА-Я]+\b")
# Owner manual warning markers
WARN_MARKERS = [
    "запрещается", "запрещено", "предупреждение!", "внимание!", "осторожно!",
    "warning!", "caution!", "смертельн", "травм", "перед использованием",
    "в противном случае", "снимите защитную плёнку",
    "subfault", "deployment control", "sensor (subfault)",
]


def is_garbage_text(title: str, qa: str) -> tuple[bool, str]:
    text = f"{title} {qa}"
    lower = text.lower()
    cyr = len(CYRILLIC.findall(text))
    lat = len(LATIN.findall(text))

    # Mostly English → wrong
    if lat > 10 and cyr < lat * 0.3:
        return True, "mostly-english"
    # Mojibake patterns
    if MOJIBAKE.search(text):
        return True, "mojibake"
    # Many mixed letters (garbled OCR)
    mixed_count = len(MIXED_WORDS.findall(text))
    if mixed_count >= 3:
        return True, "mixed-ocr"
    # Owner manual warnings
    for marker in WARN_MARKERS:
        if marker in lower:
            return True, f"warn:{marker}"
    # Repeated #warning tags / OCR noise
    if text.count("#") >= 3 or text.count("<") >= 2:
        return True, "ocr-noise"
    return False, ""


def main():
    kb = Path("llcar-dashboard/public/data/kb").resolve()
    # Also strip /data/situations-universal.json
    uni = Path("llcar-dashboard/public/data/situations-universal.json").resolve()

    stripped_kb = 0
    touched_kb = 0
    reason_counts: dict[str, int] = {}

    for sp in kb.rglob("situations.json"):
        try:
            data = json.loads(sp.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        before = len(data)
        filtered = []
        for s in data:
            if not isinstance(s, dict):
                continue
            bad, reason = is_garbage_text(s.get("title", ""), s.get("qa", ""))
            if bad:
                reason_counts[reason] = reason_counts.get(reason, 0) + 1
                continue
            filtered.append(s)
        if len(filtered) < before:
            sp.write_text(json.dumps(filtered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            stripped_kb += before - len(filtered)
            touched_kb += 1

    # Universal file
    stripped_uni = 0
    try:
        udata = json.loads(uni.read_text(encoding="utf-8"))
        if isinstance(udata, list):
            before = len(udata)
            filtered = []
            for s in udata:
                if not isinstance(s, dict):
                    continue
                qa = s.get("quickAnswer") or s.get("qa") or ""
                bad, reason = is_garbage_text(s.get("title", ""), qa)
                if bad:
                    reason_counts[f"uni:{reason}"] = reason_counts.get(f"uni:{reason}", 0) + 1
                    continue
                filtered.append(s)
            if len(filtered) < before:
                uni.write_text(json.dumps(filtered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                stripped_uni = before - len(filtered)
    except Exception:
        pass

    # Also fix _dtc_index.json.titles — strip English-dominant
    idx_path = kb / "_dtc_index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    titles = idx.get("titles", {})
    before_t = len(titles)
    kept = {}
    for code, meta in titles.items():
        t = meta.get("title_ru", "") if isinstance(meta, dict) else ""
        cyr = len(CYRILLIC.findall(t))
        lat = len(LATIN.findall(t))
        if cyr >= 2 and cyr >= lat * 0.5:
            kept[code] = meta
    idx["titles"] = kept
    idx["titles_total"] = len(kept)
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"KB situations: -{stripped_kb} from {touched_kb} files")
    print(f"Universal: -{stripped_uni}")
    print(f"_dtc_index titles: {before_t} → {len(kept)} (-{before_t - len(kept)})")
    print(f"Reasons: {reason_counts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
