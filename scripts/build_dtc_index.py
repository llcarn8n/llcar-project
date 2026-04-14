"""Build DTC -> Situation index from all situations.json files."""
import json
import glob
import os
from collections import defaultdict

ROOT = 'llcar-dashboard/public/data/kb'
files = glob.glob(os.path.join(ROOT, '**', 'situations.json'), recursive=True)

dtc_index = defaultdict(list)

for f in files:
    norm = f.replace('\\', '/')
    parts = norm.split('/')
    try:
        i = parts.index('kb')
        brand = parts[i + 1]
        model = parts[i + 2]
        gen = parts[i + 3]
    except (ValueError, IndexError):
        continue

    with open(f, 'r', encoding='utf-8') as fh:
        data = json.load(fh)

    for sit in data:
        sid = sit.get('id', '')
        for code in sit.get('dtc_codes', []):
            code = str(code).strip()
            if code and code not in ('—', 'None', ''):
                dtc_index[code].append({
                    'sit_id': sid,
                    'title': sit.get('title', '')[:100],
                    'brand': brand,
                    'model': model,
                    'generation': gen,
                    'urg': sit.get('urg', 0),
                    'cat': sit.get('cat', ''),
                })

sorted_index = dict(sorted(dtc_index.items()))

out_path = os.path.join(ROOT, '_dtc_index.json')
with open(out_path, 'w', encoding='utf-8') as fh:
    json.dump({
        'generated_at': '2026-04-14',
        'total_codes': len(sorted_index),
        'total_mappings': sum(len(v) for v in sorted_index.values()),
        'index': sorted_index,
    }, fh, ensure_ascii=False, indent=2)

print(f'Total unique DTCs: {len(sorted_index)}')
print(f'Total mappings: {sum(len(v) for v in sorted_index.values())}')
print('Top-20 most common:')
top = sorted(sorted_index.items(), key=lambda kv: -len(kv[1]))[:20]
for code, sits in top:
    print(f'  {code:<10}: {len(sits)} ситуаций')
print(f'Index written: {out_path}')
