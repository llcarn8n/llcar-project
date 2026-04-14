#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deep analyze situations.json across 6 sample models."""
import json
import sys
import os
import io
import re
from collections import Counter

# Force UTF-8 stdout on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'D:/transfer4/knowledge-base/brands'
MODELS = [
    ('toyota', 'camry'),
    ('volkswagen', 'passat'),
    ('hyundai', 'solaris'),
    ('bmw', '3_series'),
    ('kia', 'rio'),
    ('audi', 'a4'),
]

OUT = 'C:/Users/Петр/Downloads/Маркетинговые материалы/.omc/state/s16-kb-audit'

def detect_gen_from_text(text, gens):
    """Return list of generation ids mentioned in text."""
    found = []
    tl = text.lower()
    for g in gens:
        gl = g.lower()
        if gl in tl:
            found.append(g)
    return found

def analyze_model(brand, model):
    path = f'{BASE}/{brand}/models/{model}/situations.json'
    print(f'\n{"="*80}\n{brand}/{model}  ({os.path.getsize(path)/1024:.1f} KB)')
    print(f'{"="*80}')

    d = json.load(open(path, encoding='utf-8'))
    if not isinstance(d, list):
        print('UNEXPECTED TOP TYPE:', type(d).__name__)
        return {}

    print(f'COUNT: {len(d)}')
    print(f'FIELDS (from rec 0): {list(d[0].keys())}')

    # Collect ALL fields used across records
    all_fields = Counter()
    for r in d:
        for k in r.keys():
            all_fields[k] += 1
    print(f'ALL FIELDS (field -> count):')
    for k, c in all_fields.most_common():
        pct = 100 * c / len(d)
        print(f'  {k}: {c} ({pct:.0f}%)')

    # Duplicates
    ids = [r.get('id') for r in d]
    id_dups = [i for i, c in Counter(ids).items() if c > 1]
    print(f'DUPLICATE IDs: {len(id_dups)} (sample: {id_dups[:5]})')

    # Look for generation-indicative fields
    gen_fields = [f for f in all_fields if 'gen' in f.lower() or 'year' in f.lower() or 'vin' in f.lower()]
    print(f'GEN-INDICATIVE FIELDS: {gen_fields}')

    # Load manual_generations.json if exists
    mg_path = f'{BASE}/{brand}/models/{model}/manual_generations.json'
    gens = []
    if os.path.exists(mg_path):
        try:
            mg = json.load(open(mg_path, encoding='utf-8'))
            print(f'MANUAL_GENERATIONS.JSON: {type(mg).__name__}')
            if isinstance(mg, dict):
                print(f'  TOP KEYS: {list(mg.keys())[:10]}')
                # try extract gen list
                if 'generations' in mg:
                    gens = [g.get('id') or g.get('name') or g.get('code') for g in mg['generations']]
                elif isinstance(mg, dict):
                    gens = list(mg.keys())
            elif isinstance(mg, list):
                print(f'  LEN: {len(mg)}; sample: {json.dumps(mg[0], ensure_ascii=False)[:300] if mg else "empty"}')
                gens = [g.get('id') or g.get('name') or g.get('code') for g in mg if isinstance(g, dict)]
            print(f'  GENS: {gens}')
        except Exception as e:
            print(f'  ERROR reading: {e}')
    else:
        print(f'MANUAL_GENERATIONS.JSON: NOT FOUND')

    # chunk_generation_map.json
    cg_path = f'{BASE}/{brand}/models/{model}/chunk_generation_map.json'
    if os.path.exists(cg_path):
        try:
            cg = json.load(open(cg_path, encoding='utf-8'))
            print(f'CHUNK_GENERATION_MAP.JSON: {type(cg).__name__}')
            if isinstance(cg, dict):
                print(f'  TOP KEYS sample: {list(cg.keys())[:5]}')
                # first value
                if cg:
                    fk = list(cg.keys())[0]
                    print(f'  SAMPLE entry [{fk}]: {json.dumps(cg[fk], ensure_ascii=False)[:300]}')
            elif isinstance(cg, list):
                print(f'  LEN: {len(cg)}; sample: {json.dumps(cg[0], ensure_ascii=False)[:300] if cg else "empty"}')
        except Exception as e:
            print(f'  ERROR: {e}')
    else:
        print(f'CHUNK_GENERATION_MAP.JSON: NOT FOUND')

    # Check subdirs with situations.json (already split per generation)
    model_dir = f'{BASE}/{brand}/models/{model}'
    subdir_gens = []
    for item in os.listdir(model_dir):
        p = os.path.join(model_dir, item)
        if os.path.isdir(p):
            sit = os.path.join(p, 'situations.json')
            if os.path.exists(sit):
                subdir_gens.append((item, os.path.getsize(sit)))
    print(f'PER-GEN situations.json subdirs: {subdir_gens}')

    # Sample record (full)
    print(f'\nSAMPLE RECORD 0 (full):')
    print(json.dumps(d[0], ensure_ascii=False, indent=2)[:1500])
    print(f'\nSAMPLE RECORD MID ({len(d)//2}):')
    print(json.dumps(d[len(d)//2], ensure_ascii=False, indent=2)[:1500])

    # Check title for generation hints
    if gens:
        gen_hits = Counter()
        for r in d:
            t = (r.get('title', '') + ' ' + str(r.get('quickAnswer', '')))
            for g in gens:
                if g and str(g).lower() in t.lower():
                    gen_hits[g] += 1
        print(f'\nGENERATION MENTIONS in title+quickAnswer: {dict(gen_hits)}')

    # Check content language - mojibake detection
    cjk_hits = 0
    cyrillic_hits = 0
    latin_only = 0
    placeholder_hits = 0
    empty_qa = 0
    for r in d:
        qa = str(r.get('quickAnswer', '')) + ' ' + str(r.get('title', ''))
        if not qa.strip():
            empty_qa += 1
            continue
        if re.search(r'[\u4e00-\u9fff]', qa):
            cjk_hits += 1
        if re.search(r'[А-Яа-я]', qa):
            cyrillic_hits += 1
        if re.search(r'qa:\s*рус\s*N\+?|TODO|placeholder|XXX', qa, re.I):
            placeholder_hits += 1
    print(f'\nCONTENT LANG: cyrillic={cyrillic_hits}, CJK={cjk_hits}, placeholders={placeholder_hits}, empty={empty_qa}')

    # DTC codes validity
    dtc_samples = []
    dtc_valid = 0
    dtc_invalid = 0
    total_with_dtc = 0
    for r in d[:300]:
        dtc = r.get('dtc_codes') or r.get('dtcCodes') or r.get('dtc') or []
        if isinstance(dtc, str):
            dtc = [dtc]
        if dtc:
            total_with_dtc += 1
            for code in dtc:
                code_s = str(code).strip().upper()
                if re.match(r'^[PBUC]\d{4}$', code_s):
                    dtc_valid += 1
                else:
                    dtc_invalid += 1
                if len(dtc_samples) < 10:
                    dtc_samples.append(code_s)
    print(f'DTC (first 300 recs): valid={dtc_valid}, invalid={dtc_invalid}, w/DTC={total_with_dtc}, samples={dtc_samples}')

    # Category breakdown
    cats = Counter(r.get('category') for r in d)
    print(f'CATEGORIES: {dict(cats.most_common(10))}')

    # content_type
    cts = Counter(r.get('content_type') or r.get('contentType') for r in d)
    print(f'CONTENT_TYPES: {dict(cts)}')

    # models field distribution (how often populated)
    models_populated = sum(1 for r in d if r.get('models'))
    print(f'MODELS FIELD POPULATED: {models_populated}/{len(d)}')
    # sample of 'models' field
    for r in d[:5]:
        m = r.get('models')
        if m:
            print(f'  models sample: {m}')
            break

    # source field (original)
    sources = Counter(r.get('source') for r in d if r.get('source'))
    print(f'SOURCES (top 5): {dict(sources.most_common(5))}')

    return {
        'count': len(d),
        'fields': dict(all_fields),
        'gens': gens,
        'gen_subdirs': subdir_gens,
        'cyrillic': cyrillic_hits,
        'placeholders': placeholder_hits,
    }

results = {}
for brand, model in MODELS:
    try:
        results[f'{brand}/{model}'] = analyze_model(brand, model)
    except Exception as e:
        print(f'ERROR {brand}/{model}: {e}')
        import traceback
        traceback.print_exc()

# Compare with dashboard kb layout
print('\n' + '='*80)
print('DASHBOARD LAYOUT (llcar-dashboard/public/data/kb):')
print('='*80)
DASH = 'C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard/public/data/kb'
if os.path.exists(DASH):
    for brand, model in MODELS:
        mdir = f'{DASH}/{brand}/{model}'
        if os.path.exists(mdir):
            subs = [d for d in os.listdir(mdir) if os.path.isdir(os.path.join(mdir, d))]
            print(f'{brand}/{model} subdirs: {subs}')
            for s in subs[:2]:
                sit = os.path.join(mdir, s, 'situations.json')
                if os.path.exists(sit):
                    try:
                        sd = json.load(open(sit, encoding='utf-8'))
                        print(f'  {s}/situations.json: count={len(sd) if isinstance(sd,list) else "?"}, first_id={sd[0].get("id") if isinstance(sd, list) and sd else "-"}')
                        if isinstance(sd, list) and sd:
                            print(f'  first keys: {list(sd[0].keys())}')
                    except Exception as e:
                        print(f'  err: {e}')
        else:
            print(f'{brand}/{model}: DOES NOT EXIST in dashboard')
else:
    print('dashboard dir not found')

# Summary JSON
open(f'{OUT}/results.json', 'w', encoding='utf-8').write(json.dumps(results, ensure_ascii=False, indent=2, default=str))
print('\nDONE.')
