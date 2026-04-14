import json, os, glob

def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def count_situations(path):
    try:
        d = load_json(path)
        if isinstance(d, list):
            return len(d)
        elif isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, list) and len(v) > 0:
                    return len(v)
            return len(d)
    except:
        return 0

SRC = "D:/transfer4/knowledge-base/brands"
DST = "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard/public/data/kb"

brands = ['mitsubishi', 'nissan', 'omoda', 'opel']

print("=" * 70)
print("SOURCE ANALYSIS")
print("=" * 70)

for brand in brands:
    base = f"{SRC}/{brand}"
    models_dir = f"{base}/models"
    print(f"\n--- SRC {brand} ---")
    model_list = sorted(os.listdir(models_dir)) if os.path.isdir(models_dir) else []
    for m in model_list:
        mpath = f"{models_dir}/{m}"
        if not os.path.isdir(mpath):
            continue
        files = os.listdir(mpath)
        has_manual = any('manual' in x for x in files)
        has_reviews = any('review' in x for x in files)
        has_parts = 'parts-catalog.json' in files
        has_dtc = 'dtc.json' in files or 'dtc-model.json' in files
        has_sit = 'situations.json' in files
        has_img = 'images' in files and os.path.isdir(f"{mpath}/images")
        sit_count = count_situations(f"{mpath}/situations.json") if has_sit else 0
        flags = []
        if has_manual: flags.append('manual')
        if has_reviews: flags.append('reviews')
        if has_parts: flags.append('parts')
        if has_dtc: flags.append('dtc')
        if has_sit: flags.append(f'situations({sit_count})')
        if has_img: flags.append('images')
        print(f"  {m}: {', '.join(flags) if flags else 'EMPTY'}")

print("\n" + "=" * 70)
print("DESTINATION ANALYSIS")
print("=" * 70)

for brand in brands:
    bpath = f"{DST}/{brand}"
    print(f"\n--- DST {brand} ---")
    if not os.path.isdir(bpath):
        print("  MISSING")
        continue
    items = sorted(os.listdir(bpath))
    for m in items:
        mpath = f"{bpath}/{m}"
        if not os.path.isdir(mpath):
            print(f"  {m} (file)")
            continue
        gens = sorted(os.listdir(mpath))
        print(f"  {m}/")
        for gen in gens:
            gpath = f"{mpath}/{gen}"
            if not os.path.isdir(gpath):
                print(f"    {gen} (file)")
                continue
            files = os.listdir(gpath)
            has_manual = any('manual' in x for x in files)
            has_reviews = any('review' in x for x in files)
            has_parts = any('parts' in x for x in files)
            has_dtc = any('dtc' in x for x in files)
            has_sit = any('situation' in x for x in files)
            has_img = any('image' in x for x in files) or os.path.isdir(f"{gpath}/images")
            sit_count = 0
            for sf in files:
                if 'situation' in sf:
                    sit_count = count_situations(f"{gpath}/{sf}")
            flags = []
            if has_manual: flags.append('manual')
            if has_reviews: flags.append('reviews')
            if has_parts: flags.append('parts')
            if has_dtc: flags.append('dtc')
            if has_sit: flags.append(f'situations({sit_count})')
            if has_img: flags.append('images')
            print(f"    {gen}: {', '.join(flags) if flags else 'EMPTY'}")

print("\n" + "=" * 70)
print("MISSING MODELS (SRC models not in DST)")
print("=" * 70)

for brand in brands:
    src_models = set()
    models_dir = f"{SRC}/{brand}/models"
    if os.path.isdir(models_dir):
        for m in os.listdir(models_dir):
            if os.path.isdir(f"{models_dir}/{m}") and not m.startswith('_'):
                src_models.add(m)
    dst_models = set()
    bpath = f"{DST}/{brand}"
    if os.path.isdir(bpath):
        for m in os.listdir(bpath):
            if os.path.isdir(f"{bpath}/{m}") and not m.startswith('_'):
                dst_models.add(m)
    missing = src_models - dst_models
    extra = dst_models - src_models
    print(f"\n{brand}:")
    print(f"  SRC models: {len(src_models)}, DST models: {len(dst_models)}")
    print(f"  Missing in DST ({len(missing)}): {', '.join(sorted(missing))}")
    if extra:
        print(f"  Extra in DST (not in SRC): {', '.join(sorted(extra))}")
