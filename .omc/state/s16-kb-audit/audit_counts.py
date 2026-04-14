import json, os, glob

def count_list(path, key=None):
    try:
        with open(path, encoding='utf-8') as f:
            d = json.load(f)
        if isinstance(d, list): return len(d)
        if key and key in d: return len(d[key])
        for k in ('codes','situations','items','data'):
            if k in d and isinstance(d[k], list): return len(d[k])
        return 0
    except:
        return 0

src_base = 'D:/transfer4/knowledge-base/brands'
kb_base = 'C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard/public/data/kb'

brands = ['jeep', 'jetour', 'kaiyi', 'kia']

print("=== SOURCE (D:/transfer4) ===")
for brand in brands:
    bpath = f'{src_base}/{brand}/models'
    models = sorted([m for m in os.listdir(bpath) if not m.startswith('_')])
    sit = sum(count_list(p) for p in glob.glob(f'{bpath}/*/situations.json'))
    dtc = sum(count_list(p, 'codes') for p in glob.glob(f'{bpath}/*/dtc-model.json'))
    manual = len(glob.glob(f'{bpath}/*/manual*.md'))
    reviews = len(glob.glob(f'{bpath}/*/reviews.md'))
    parts = len(glob.glob(f'{bpath}/*/parts-catalog.json'))
    images = len(glob.glob(f'{src_base}/{brand}/images/*'))
    print(f"\n{brand.upper()}")
    print(f"  models ({len(models)}): {models}")
    print(f"  situations={sit}, dtc_codes={dtc}, manual_md={manual}, reviews={reviews}, parts={parts}, images={images}")

print("\n=== KB (llcar-dashboard) ===")
for brand in ['jeep', 'jetour', 'kia']:
    bp = f'{kb_base}/{brand}'
    models = sorted([d for d in os.listdir(bp)
                     if os.path.isdir(f'{bp}/{d}') and not d.startswith('_') and not d.startswith('.')])
    gens = []
    for m in models:
        mp = f'{bp}/{m}'
        gens += [g for g in os.listdir(mp)
                 if os.path.isdir(f'{mp}/{g}') and not g.startswith('_') and not g.startswith('.')]
    sit = sum(count_list(p) for p in glob.glob(f'{bp}/*/*/situations.json'))
    dtc = sum(count_list(p) for p in glob.glob(f'{bp}/*/*/dtc.json'))
    print(f"\n{brand.upper()}")
    print(f"  models ({len(models)}): {models}")
    print(f"  generations ({len(gens)}): {gens}")
    print(f"  situations={sit}, dtc_entries={dtc}")

print("\nkaiyi: NOT IN KB (absent)")
