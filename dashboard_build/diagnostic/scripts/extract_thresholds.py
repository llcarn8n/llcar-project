#!/usr/bin/env python3
"""Extract numerical thresholds from situations quickAnswer text."""

import json
import re
import os
import sys

# Patterns to match Russian and symbol-based thresholds
# Order matters: range/norm patterns must come before gt/lt to avoid partial matches
PATTERNS = [
    # "от 13 до 14.5 В", "от 800 до 2000", "в диапазоне 80-105°C"
    (r'(?:от|в диапазоне)\s+([\d.,]+)\s*(?:до|-)\s*([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч|[Аа]тм|кПа|бар)?', 'range'),
    # "норма 13.5-14.5В", "норма: 3-4 бар", "нормальное значение 80-95°C"
    (r'(?:норма|нормальн\w+\s+значени\w+)\s*[:=]?\s*([\d.,]+)\s*[-–]\s*([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч|[Аа]тм|кПа|бар)?', 'norm_range'),
    # "более 10%", "больше 105°C", "выше 3000 об/мин", "свыше 600°C"
    (r'(?:более|больше|выше|свыше)\s+([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч|[Аа]тм|кПа|бар)', 'gt'),
    # "менее 13В", "ниже 80°C", "меньше 600 об/мин"
    (r'(?:менее|меньше|ниже)\s+([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч|[Аа]тм|кПа|бар)', 'lt'),
    # ">105°C", "≥80%", "> 3000"
    (r'[>≥]\s*([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч)?', 'gt'),
    # "<13В", "≤600", "< 0.5"
    (r'[<≤]\s*([\d.,]+)\s*(%|°[CС]|[ВV]|об/мин|км/ч)?', 'lt'),
]


def extract_thresholds(text: str) -> list:
    """Extract numerical thresholds from Russian text.

    Returns a list of dicts, each with:
      - type: 'gt', 'lt', 'range', or 'norm_range'
      - value (for gt/lt) or min/max (for range/norm_range): float
      - unit: str (may be empty)
      - raw: the matched substring
    """
    results = []
    for pattern, kind in PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            groups = match.groups()
            if kind in ('range', 'norm_range'):
                results.append({
                    'type': kind,
                    'min': float(groups[0].replace(',', '.')),
                    'max': float(groups[1].replace(',', '.')),
                    'unit': (groups[2] or '').strip() if len(groups) > 2 and groups[2] else '',
                    'raw': match.group(0),
                })
            else:
                results.append({
                    'type': kind,
                    'value': float(groups[0].replace(',', '.')),
                    'unit': (groups[1] or '').strip() if len(groups) > 1 and groups[1] else '',
                    'raw': match.group(0),
                })
    return results


def main():
    # Find situations file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, '..', '..', '..')
    sit_path = os.path.join(project_root, 'common files all models', 'situations-universal.json')

    if not os.path.exists(sit_path):
        print(f"ERROR: {sit_path} not found", file=sys.stderr)
        sys.exit(1)

    with open(sit_path, encoding='utf-8') as f:
        situations = json.load(f)

    output = {}
    total_thresholds = 0

    for sit in situations:
        sid = sit.get('id', '')
        text = sit.get('quickAnswer', '')
        thresholds = extract_thresholds(text)
        if thresholds:
            output[sid] = {
                'title': sit.get('title', '')[:100],
                'category': sit.get('category', ''),
                'thresholds': thresholds,
            }
            total_thresholds += len(thresholds)

    # Save output
    out_dir = os.path.join(script_dir, '..', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'situation_thresholds.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Extracted {total_thresholds} thresholds from {len(output)}/{len(situations)} situations")
    print(f"Saved to {out_path}")


if __name__ == '__main__':
    main()
