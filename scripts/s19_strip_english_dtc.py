#!/usr/bin/env python3
"""Strip English-only DTC titles from _dtc_index.json.titles.

Also filter {brand}/_dtc.json brand_codes/models to prefer records with note_ru.
English-only titles look like "Driver Frontal Stage 3 Deployment Control (Subfault)".
"""
from __future__ import annotations
import io, json, re, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

CYRILLIC_RE = re.compile(r"[а-яА-ЯёЁ]")


def has_cyrillic(s: str) -> bool:
    return bool(s) and bool(CYRILLIC_RE.search(s))


def main():
    kb = Path("llcar-dashboard/public/data/kb").resolve()

    # 1. Strip English-only from _dtc_index.json.titles
    idx_path = kb / "_dtc_index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    titles = idx.get("titles", {})
    before = len(titles)
    kept = {c: t for c, t in titles.items() if has_cyrillic(t.get("title_ru", ""))}
    idx["titles"] = kept
    idx["titles_total"] = len(kept)
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"_dtc_index.json titles: {before} → {len(kept)} (stripped {before - len(kept)} English-only)")

    # 2. Strip English-only from {brand}/_dtc.json
    brand_before = 0
    brand_after = 0
    for bdp in kb.glob("*/_dtc.json"):
        data = json.loads(bdp.read_text(encoding="utf-8"))
        # brand_codes
        bc = data.get("brand_codes", {})
        brand_before += len(bc)
        new_bc = {}
        for code, meta in bc.items():
            if isinstance(meta, dict):
                note = meta.get("note_ru", "") or ""
                if has_cyrillic(note):
                    new_bc[code] = meta
        data["brand_codes"] = new_bc
        # models
        new_models = {}
        for model, codes in data.get("models", {}).items():
            if not isinstance(codes, dict):
                continue
            filt = {}
            for code, meta in codes.items():
                if isinstance(meta, dict):
                    note = meta.get("note_ru", "") or ""
                    if has_cyrillic(note):
                        filt[code] = meta
            if filt:
                new_models[model] = filt
        data["models"] = new_models
        brand_after += len(new_bc) + sum(len(m) for m in new_models.values())
        bdp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Brand _dtc.json total codes: {brand_before} → {brand_after}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
