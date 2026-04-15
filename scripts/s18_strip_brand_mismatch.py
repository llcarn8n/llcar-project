#!/usr/bin/env python3
"""Strip situations with wrong-brand mentions in title/qa.

E.g. bmw/.../ situation mentioning 'Geely', 'Lada', 'Toyota' → suspected cross-brand
contamination from ETL. Strip records whose title/qa explicitly names OTHER brand.
"""
from __future__ import annotations
import io, json, sys, re
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BRAND_KEYWORDS = {
    "audi": ["audi", "ауди"],
    "bmw": ["bmw", "бмв", "баварск"],
    "mercedes": ["mercedes", "мерседес", "mercedes-benz"],
    "toyota": ["toyota", "тойота"],
    "honda": ["honda", "хонда"],
    "lexus": ["lexus", "лексус"],
    "volkswagen": ["volkswagen", " vw ", "фольксваген"],
    "skoda": ["skoda", "шкода", "škoda"],
    "porsche": ["porsche", "порше"],
    "volvo": ["volvo", "вольво"],
    "kia": [" kia ", "киа"],
    "hyundai": ["hyundai", "хёндэ", "хендай"],
    "lada": [" lada ", "ваз", "лада", "приора", "гранта", "калина", "нива"],
    "renault": ["renault", "рено"],
    "nissan": ["nissan", "ниссан"],
    "mazda": [" mazda ", "мазда"],
    "chery": ["chery", "чери"],
    "geely": ["geely", "джили", "джилли"],
    "haval": ["haval", "хавал"],
    "jaguar": ["jaguar", "ягуар"],
    "ford": [" ford ", "форд"],
    "subaru": ["subaru", "субару"],
    "mitsubishi": ["mitsubishi", "мицубиси"],
    "land_rover": ["land rover", "ленд ровер", "range rover"],
    "infiniti": ["infiniti", "инфинити"],
    "jeep": [" jeep ", "джип"],
    "cadillac": ["cadillac", "кадиллак"],
    "chevrolet": ["chevrolet", "шевроле", "ниву", "lacetti"],
    "peugeot": ["peugeot", "пежо"],
    "citroen": ["citroen", "ситроен", "ситроэн"],
    "opel": [" opel ", "опель"],
    "suzuki": ["suzuki", "сузуки"],
    "byd": [" byd ", "бид"],
    "zeekr": [" zeekr ", "зикр"],
    "nio": [" nio ", "нио"],
    "xpeng": ["xpeng", "икспен"],
    "fiat": [" fiat ", "фиат"],
}


def main():
    kb = Path("llcar-dashboard/public/data/kb").resolve()
    stripped = 0
    touched = 0
    for sp in kb.rglob("situations.json"):
        parts = sp.relative_to(kb).parts
        if len(parts) < 3:
            continue
        this_brand = parts[0].lower()
        try:
            data = json.loads(sp.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        own_keywords = set(BRAND_KEYWORDS.get(this_brand, []))
        filtered = []
        before = len(data)
        for s in data:
            if not isinstance(s, dict):
                continue
            text = (s.get("title", "") + " " + s.get("qa", "")).lower()
            # If text mentions other brand (not own) — strip
            foreign = False
            for brand, kws in BRAND_KEYWORDS.items():
                if brand == this_brand:
                    continue
                for kw in kws:
                    # Must match whole word (surrounded by non-alpha)
                    if kw in text and kw not in own_keywords:
                        # Require word boundary for short kws
                        if len(kw) < 5:
                            if re.search(r"(?:^|[^a-zа-я])" + re.escape(kw.strip()) + r"(?:$|[^a-zа-я])", text):
                                foreign = True
                                break
                        else:
                            foreign = True
                            break
                if foreign:
                    break
            if foreign:
                continue
            filtered.append(s)
        if len(filtered) < before:
            sp.write_text(json.dumps(filtered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            stripped += before - len(filtered)
            touched += 1

    print(f"Stripped {stripped} cross-brand records from {touched} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
