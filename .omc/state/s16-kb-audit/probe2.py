#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = 'D:/transfer4/knowledge-base/brands'

# Check if subdir situations.json differs from parent
pairs = [
    ('bmw/models/3_series/situations.json', 'bmw/models/3_series/f30/situations.json'),
    ('bmw/models/3_series/situations.json', 'bmw/models/3_series/f34/situations.json'),
    ('kia/models/rio/situations.json', 'kia/models/rio/2017/situations.json'),
    ('kia/models/rio/situations.json', 'kia/models/rio/2021/situations.json'),
    ('audi/models/a4/situations.json', 'audi/models/a4/1997_2001/situations.json'),
]
for parent, sub in pairs:
    pp = f'{BASE}/{parent}'
    sp = f'{BASE}/{sub}'
    if not (os.path.exists(pp) and os.path.exists(sp)):
        print(f'SKIP {sub}: sub_exists={os.path.exists(sp)}')
        continue
    try:
        p = json.load(open(pp, encoding='utf-8'))
        s = json.load(open(sp, encoding='utf-8'))
    except Exception as e:
        print(f'ERR {sub}: {e}')
        continue
    pids = set(r.get('id') for r in p if isinstance(r, dict))
    sids = set(r.get('id') for r in s if isinstance(r, dict))
    print(f'\n{sub}: parent={len(pids)} sub={len(sids)} overlap={len(pids & sids)} sub_only={len(sids - pids)} parent_only={len(pids - sids)}')
    if sids == pids:
        print('  -> IDENTICAL (subdir is pure copy of parent)')
    elif sids.issubset(pids):
        print('  -> SUBSET (subdir filters parent)')
    else:
        print('  -> DIFFERENT SET')
    # check if subdir records have gen-indicating fields
    if s and isinstance(s[0], dict):
        sample = s[0]
        gen_related = {k: sample.get(k) for k in ['generation', 'gen', 'gen_id', 'generation_id', 'year', 'years', 'model_gen']}
        print(f'  gen-fields in sub[0]: {gen_related}')

# Look at manual_generations.json structure in depth
print('\n' + '='*80)
print('MANUAL_GENERATIONS.JSON deep look')
print('='*80)
for model in ['toyota/models/camry', 'hyundai/models/solaris', 'bmw/models/3_series', 'kia/models/rio', 'audi/models/a4']:
    mg = f'{BASE}/{model}/manual_generations.json'
    if not os.path.exists(mg): continue
    d = json.load(open(mg, encoding='utf-8'))
    print(f'\n{model}/manual_generations.json:')
    print(json.dumps(d, ensure_ascii=False, indent=2)[:1500])

# chunk_generation_map.json full structure
print('\n' + '='*80)
print('CHUNK_GENERATION_MAP.JSON deep look')
print('='*80)
for model in ['toyota/models/camry', 'kia/models/rio']:
    cg = f'{BASE}/{model}/chunk_generation_map.json'
    if not os.path.exists(cg): continue
    d = json.load(open(cg, encoding='utf-8'))
    print(f'\n{model}/chunk_generation_map.json: {len(d)} entries')
    for k, v in list(d.items())[:5]:
        print(f'  {k}: {json.dumps(v, ensure_ascii=False)[:300]}')

# info.json (for generation authoritative list)
print('\n' + '='*80)
print('INFO.JSON (gen list)')
print('='*80)
for model in ['toyota/models/camry', 'bmw/models/3_series', 'kia/models/rio', 'audi/models/a4']:
    ip = f'{BASE}/{model}/info.json'
    if not os.path.exists(ip): continue
    d = json.load(open(ip, encoding='utf-8'))
    print(f'\n{model}/info.json: keys={list(d.keys()) if isinstance(d,dict) else type(d).__name__}')
    if isinstance(d, dict):
        g = d.get('generations') or d.get('gens')
        if g:
            print(f'  generations: {json.dumps(g, ensure_ascii=False)[:800]}')
        else:
            print(json.dumps(d, ensure_ascii=False, indent=2)[:600])

# Does situations record sometimes have 'year' field inside facts? (free text)
# Check toyota camry: hunt 'xv' 'v40' 'v50' patterns in title/quickAnswer
print('\n' + '='*80)
print('HEURISTIC: gen-tokens in title/qa')
print('='*80)
import re
camry = json.load(open(f'{BASE}/toyota/models/camry/situations.json', encoding='utf-8'))
tokens = ['xv30','xv40','xv50','xv70','v50','v55','v40','v30','v70','xv10','xv20']
hit = {t:0 for t in tokens}
for r in camry:
    text = ((r.get('title') or '') + ' ' + (r.get('quickAnswer') or '') + ' ' + (r.get('subtitle') or '')).lower()
    for t in tokens:
        if re.search(rf'\b{t}\b', text):
            hit[t] += 1
print(f'Camry 697 records, gen-token hits: {hit}')
# year hits
year_pat = re.compile(r'\b(19|20)\d{2}\b')
year_count = 0
for r in camry:
    text = ((r.get('title') or '') + ' ' + (r.get('quickAnswer') or ''))
    if year_pat.search(text):
        year_count += 1
print(f'Records with year mention: {year_count}/{len(camry)}')

bmw = json.load(open(f'{BASE}/bmw/models/3_series/situations.json', encoding='utf-8'))
bmw_tokens = ['e30','e36','e46','e90','e92','f30','f31','f34','g20','g21','g28']
hit = {t:0 for t in bmw_tokens}
for r in bmw:
    text = ((r.get('title') or '') + ' ' + (r.get('quickAnswer') or '') + ' ' + (r.get('subtitle') or '')).lower()
    for t in bmw_tokens:
        if re.search(rf'\b{t}\b', text):
            hit[t] += 1
print(f'BMW 3 series 464 records, gen-token hits: {hit}')

# VW Passat b5/b6/b7/b8
vw = json.load(open(f'{BASE}/volkswagen/models/passat/situations.json', encoding='utf-8'))
vw_tokens = ['b5','b6','b7','b8','b9']
hit = {t:0 for t in vw_tokens}
for r in vw:
    text = ((r.get('title') or '') + ' ' + (r.get('quickAnswer') or '') + ' ' + (r.get('subtitle') or '')).lower()
    for t in vw_tokens:
        if re.search(rf'\b{t}\b', text):
            hit[t] += 1
print(f'VW Passat 641 records, gen-token hits: {hit}')

# Audi A4 b5/b6/b7/b8/b9/b10
audi = json.load(open(f'{BASE}/audi/models/a4/situations.json', encoding='utf-8'))
audi_tokens = ['b5','b6','b7','b8','b9','b10']
hit = {t:0 for t in audi_tokens}
for r in audi:
    text = ((r.get('title') or '') + ' ' + (r.get('quickAnswer') or '') + ' ' + (r.get('subtitle') or '')).lower()
    for t in audi_tokens:
        if re.search(rf'\b{t}\b', text):
            hit[t] += 1
print(f'Audi A4 468 records, gen-token hits: {hit}')

print('DONE.')
