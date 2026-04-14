"""Build dtc.json skeleton per generation from situations.json files.
Aggregates unique DTCs referenced in situations of each gen with their category.
"""
import json, glob, os
from collections import defaultdict

ROOT = 'llcar-dashboard/public/data/kb'
files = glob.glob(os.path.join(ROOT, '**', 'situations.json'), recursive=True)
count = 0

# Category prefix mapping for DTC codes
def code_category(code):
    if not code: return 'unknown'
    p = code[0].upper()
    if p == 'P':
        if code.startswith('P0A') or code.startswith('P0B') or code.startswith('P0C') or code.startswith('P0D'):
            return 'hv_electric'
        if code.startswith('P07') or code.startswith('P17'):
            return 'transmission'
        if code.startswith('P02') or code.startswith('P2'):
            return 'engine'
        if code.startswith('P01') or code.startswith('P00'):
            return 'engine'
        return 'engine'
    if p == 'C': return 'chassis'
    if p == 'B': return 'body'
    if p == 'U': return 'network'
    return 'unknown'

for f in files:
    if '.omc' in f: continue
    gen_dir = os.path.dirname(f)
    dtc_file = os.path.join(gen_dir, 'dtc.json')
    if os.path.exists(dtc_file): continue

    with open(f, 'r', encoding='utf-8') as fh: data = json.load(fh)
    codes = defaultdict(lambda: {'count': 0, 'situations': [], 'category': ''})
    for sit in data:
        sit_cat = sit.get('cat', '')
        for c in sit.get('dtc_codes', []):
            c = str(c).strip()
            if not c or c in ('—','None',''): continue
            entry = codes[c]
            entry['count'] += 1
            entry['situations'].append(sit.get('id',''))
            if not entry['category']:
                entry['category'] = code_category(c)
    if not codes: continue

    dtc_out = {
        'generated_at': '2026-04-14',
        'total_codes': len(codes),
        'codes': dict(sorted(codes.items(), key=lambda kv: -kv[1]['count']))
    }
    with open(dtc_file, 'w', encoding='utf-8') as fh:
        json.dump(dtc_out, fh, ensure_ascii=False, indent=2)
    count += 1

print(f'Created dtc.json for {count} generations')
