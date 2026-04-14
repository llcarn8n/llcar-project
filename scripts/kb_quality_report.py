"""Generate KB quality metrics report.
Aggregates qa length distribution, DTC coverage, category/urgency spread per brand.
"""
import json
import glob
import os
from collections import defaultdict, Counter

ROOT = 'llcar-dashboard/public/data/kb'
files = [f for f in glob.glob(os.path.join(ROOT, '**', 'situations.json'), recursive=True) if '.omc' not in f]

total_situations = 0
brand_sits = defaultdict(int)
brand_gens = defaultdict(set)
qa_buckets = Counter()
urg_dist = Counter()
cat_dist = Counter()
ct_dist = Counter()
dtc_per_sit = []
short_qa = []
long_qa = []

for f in files:
    norm = f.replace('\\', '/')
    parts = norm.split('/')
    i = parts.index('kb')
    brand = parts[i + 1]
    model = parts[i + 2]
    gen = parts[i + 3]

    with open(f, 'r', encoding='utf-8') as fh:
        data = json.load(fh)

    brand_gens[brand].add(f'{model}/{gen}')
    brand_sits[brand] += len(data)
    total_situations += len(data)

    for s in data:
        qa = s.get('qa', '')
        qa_len = len(qa)
        if qa_len < 100:
            short_qa.append(f'{brand}/{model}/{gen}::{s.get("id")}: {qa_len}')
            qa_buckets['<100'] += 1
        elif qa_len < 300:
            qa_buckets['100-299'] += 1
        elif qa_len < 500:
            qa_buckets['300-499'] += 1
        elif qa_len < 800:
            qa_buckets['500-799'] += 1
        elif qa_len < 1500:
            qa_buckets['800-1499'] += 1
        else:
            qa_buckets['1500+'] += 1
            long_qa.append(f'{brand}/{model}/{gen}::{s.get("id")}: {qa_len}')

        urg_dist[s.get('urg', 0)] += 1
        cat_dist[s.get('cat', '')] += 1
        ct_dist[s.get('content_type', '')] += 1
        dtc_per_sit.append(len(s.get('dtc_codes', [])))

report = {
    'generated_at': '2026-04-14',
    'kb_totals': {
        'brands': len(brand_sits),
        'generations': sum(len(g) for g in brand_gens.values()),
        'situations': total_situations,
        'avg_situations_per_generation': round(total_situations / max(sum(len(g) for g in brand_gens.values()), 1), 1),
    },
    'qa_length_distribution': dict(qa_buckets),
    'urgency_distribution': {str(k): v for k, v in sorted(urg_dist.items())},
    'category_distribution': dict(sorted(cat_dist.items())),
    'content_type_distribution': dict(ct_dist),
    'dtc_stats': {
        'avg_per_situation': round(sum(dtc_per_sit) / max(len(dtc_per_sit), 1), 2),
        'max': max(dtc_per_sit) if dtc_per_sit else 0,
        'zero_dtc_situations': sum(1 for d in dtc_per_sit if d == 0),
    },
    'brand_situations_count': dict(sorted(brand_sits.items(), key=lambda kv: -kv[1])),
    'short_qa_count': len(short_qa),
    'full_articles_count (qa>=1500)': len(long_qa),
}

out_path = os.path.join(ROOT, '_quality_report.json')
with open(out_path, 'w', encoding='utf-8') as fh:
    json.dump(report, fh, ensure_ascii=False, indent=2)

print(f'Report written: {out_path}')
print(f'Total: {report["kb_totals"]["brands"]} brands, '
      f'{report["kb_totals"]["generations"]} generations, '
      f'{report["kb_totals"]["situations"]} situations')
print(f'QA distribution: {dict(qa_buckets)}')
print(f'Full articles (qa>=1500): {len(long_qa)}')
print(f'Short qa (<100): {len(short_qa)}')
print(f'Top 10 brands by situation count:')
for brand, count in list(report['brand_situations_count'].items())[:10]:
    print(f'  {brand}: {count}')
