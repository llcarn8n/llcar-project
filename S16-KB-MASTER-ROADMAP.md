# S16 KB Master Roadmap
_Consolidation of 14 audit groups. Date: 2026-04-15. Source: D:/transfer4 → llcar-dashboard/public/data/kb/_

---

## Executive Summary

- **18 брендов из ~58 полностью отсутствуют** в dashboard (coverage 0%) — это ~130 моделей и ~25 000 ситуаций не доступны пользователям.
- **Системный bug подтверждён**: все задеплоенные поколения содержат ровно 10 ситуаций (иногда меньше) вместо 440–700+ из источника. Коэффициент покрытия ситуаций: 1–3% для большинства брендов.
- **Rich content (manual/parts/reviews/images) = 0%** в dashboard для всех 58 брендов — только dtc.json + situations.json + meta.json + videos.json на поколение.
- **DTC bug**: во многих брендах (Jeep, Jetour, Kia, Kaiyi) dtc.json файлы присутствуют, но пустые — 8000+ DTC-кодов не отображаются.
- **Naming mismatches** в 6 брендах создают маппинг-проблемы между transfer4 и dashboard path-ами.

---

## Brand Coverage Table

| Бренд | T4 моделей | llcar моделей | % моделей | Sit T4 (ориент.) | Sit llcar | % ситуаций | Статус |
|---|---|---|---|---|---|---|---|
| audi | 15 | 11 | 73% | ~6500 | ~110 | ~2% | Partial |
| baic | 6 | 0 | **0%** | ~2600 | 0 | **0%** | **ABSENT** |
| belgee | 5 | 0 | **0%** | ~2200 | 0 | **0%** | **ABSENT** |
| bestune (faw_bestune) | 4 | 2 | 50% | ~1800 | 20 | ~1% | Partial |
| bmw | 22 | 20 | 91% | ~9800 | 299 | ~3% | Good shell |
| byd | ~15 | 5 | 33% | ~6500 | 50 | ~1% | Partial |
| cadillac | 8 | 2 | 25% | ~3500 | 20 | ~1% | Partial |
| changan | ~14 | 4 | 29% | ~6000 | 40 | ~1% | Partial |
| chery | 23 | 4 | 17% | ~10000 | ~50 | ~1% | Partial |
| chevrolet | 24 | 1 | 4% | ~10500 | 13 | ~0.1% | Critical |
| citroen | 13 | 1 | 8% | ~5600 | ~8 | ~0.1% | Critical |
| daewoo | 11 | 0 | **0%** | ~4800 | 0 | **0%** | **ABSENT** |
| datsun | 4 | 0 | **0%** | ~1840 | 0 | **0%** | **ABSENT** |
| exeed | 11 | 3 | 27% | ~4900 | 30 | ~1% | Partial |
| fiat | 15 | 3 | 20% | ~6600 | 30 | ~0.5% | Partial |
| ford | 19 | 3 | 16% | ~8300 | 30 | ~0.4% | Critical |
| forthing | 12 | 0 | **0%** | ~462 | 0 | **0%** | **ABSENT** |
| gac | 13 | 0 | **0%** | ~471 | 0 | **0%** | **ABSENT** |
| geely | 20 | 4 | 20% | ~556 | 40 | ~7% | Partial |
| genesis | 6 | 0 | **0%** | ~447 | 0 | **0%** | **ABSENT** |
| haval | 10 | 4 | 40% | ~4500 | 40 | ~1% | Partial |
| honda | ~15 | 2 | 13% | ~6500 | 20 | ~0.3% | Critical |
| hongqi | ~5 | 0 | **0%** | ~2200 | 0 | **0%** | **ABSENT** |
| hyundai | 25 | 13 | 52% | ~11000 | 258 | ~2% | Best |
| infiniti | 11 | 4 | 36% | ~4800 | 40 | ~1% | Partial |
| jac | 6 | 2 | 33% | ~2600 | 20 | ~1% | Partial |
| jaecoo | 4 | 0 | **0%** | ~1760 | 0 | **0%** | **ABSENT** |
| jaguar | 7 | 1 | 14% | ~3000 | 10 | ~0.3% | Critical |
| jeep | 6 | 3 | 50% | ~2243 | 35 | ~1.6% | Partial |
| jetour | 8 | 2 | 25% | ~3558 | 20 | ~0.6% | Partial |
| kaiyi | 4 | 0 | **0%** | ~2634 | 0 | **0%** | **ABSENT** |
| kia | ~18 | 15 | 83% | ~9593 | 237 | ~2.5% | Good shell |
| lada | 10 | 5 | 50% | ~4600 | 50 | ~1% | Partial |
| land_rover | 10 | 2 | 20% | ~4500 | 20 | ~0.4% | Critical |
| lexus | 21 | 4 | 19% | ~9200 | 60 | ~0.7% | Critical |
| li_auto (li) | 8 | 0 | **0%** | ~3514 | 0 | **0%** | **ABSENT** |
| livan | 7 | 0 | **0%** | ~459 | 0 | **0%** | **ABSENT** |
| mazda | 39 | 6 | 15% | ~551 | 80 | ~15% | Partial |
| mercedes | 37 | 18 | 49% | ~647 | 250 | ~39% | Partial |
| mini | 5 | 2 | 40% | ~475 | 20 | ~4% | Partial |
| mitsubishi | 41 | 4 | 10% | ~18900 | 40 | ~0.2% | Critical |
| nissan | 43 | 7 | 16% | ~19800 | 90 | ~0.5% | Critical |
| omoda | 6 | 2 | 33% | ~2650 | 20 | ~1% | Partial |
| opel | 27 | 0* | **0%** | ~11900 | 30** | **0%** | **ABSENT** |
| peugeot | 7 | 1 | 14% | ~3000 | 14 | ~0.5% | Critical |
| porsche | 7 | 2 | 29% | ~3000 | 30 | ~1% | Partial |
| renault | 7 | 6 | 86% | ~3000 | 130 | ~4% | Good shell |
| skoda | 7 | 6 | 86% | ~3200 | 90 | ~3% | Good shell |
| ssangyong | 6 | 0 | **0%** | ~3970 | 0 | **0%** | **ABSENT** |
| subaru | 9 | 2 | 22% | ~6358 | 20 | ~0.3% | Critical |
| suzuki | 10 | 1 | 10% | ~6654 | 10 | ~0.15% | Critical |
| tank | 4 | 0 | **0%** | ~2831 | 0 | **0%** | **ABSENT** |
| toyota | 59 | 9 | 15% | ~38000 | 150 | ~0.4% | Critical |
| uaz | 6 | 1 | 17% | ~4200 | 10 | ~0.2% | Critical |
| volkswagen | 47 | 5 | 11% | ~29300 | 80 | ~0.3% | Critical |
| volvo | 17 | 4 | 24% | ~11000 | 50 | ~0.5% | Partial |
| voyah | 10 | 1 | 10% | ~6780 | 10 | ~0.1% | Critical |
| zeekr | 9 | 4 | 44% | ~5900 | 40 | ~0.7% | Partial |

_*Opel в llcar содержит 3 модели (astra_k, corsa_e, insignia_b) которых НЕТ в T4 — sync error_  
_**Opel llcar 30 situations — из несуществующего источника_

**Итого: ~270 моделей из ~850 T4 (32%), ~2365 ситуаций из ~300 000+ T4 (< 1%)**

---

## P0 — Missing Brands (создать с нуля)

Отсортированы по приоритету (РФ-рынок × объём T4 контента):

| Бренд | T4 dir | Моделей | Ситуаций T4 | Топ-модели | Оценка T4 size |
|---|---|---|---|---|---|
| **ssangyong** | `ssangyong/` | 6 | ~3970 | actyon, rexton, tivoli, kyron, korando, musso | ~15 MB |
| **tank** | `tank/` | 4 | ~2831 | 300, 500, 400, 700 | ~10 MB |
| **jaecoo** | `jaecoo/` | 4 | ~1760 | j7, j8, j6, j8_phev | ~8 MB (manual+parts) |
| **daewoo** | `daewoo/` | 11 | ~4800 | nexia, matiz, lanos, gentra, lacetti | ~18 MB + 8114 images |
| **datsun** | `datsun/` | 4 | ~1840 | on_do, mi_do | ~5 MB (full set) |
| **li_auto** | `li/` | 8 | ~3514 | li_l6, li_mega, li_i6, li_i8, li_one | ~12 MB |
| **gac** | `gac/` | 13 | ~471 | aion_s, aion_y, gs8, empow, gs4 | ~8 MB (EV focus) |
| **forthing** | `forthing/` | 12 | ~462 | t5, m4, friday, t5_evo | ~7 MB |
| **genesis** | `genesis/` | 6 | ~447 | g80, gv80, g70, gv70, gv60 | ~6 MB (premium) |
| **kaiyi** | `kaiyi/` | 4 | ~2634 | x3, x7, e5, showjet | ~6 MB |
| **hongqi** | `hongqi/` | 5 | ~2200 | h9, h5, hs5, ehs9 | ~5 MB |
| **belgee** | `belgee/` | 5 | ~2200 | x50, s50, x70, x50_plus | ~55 MB (x50=49MB manual) |
| **baic** | `baic/` | 6 | ~2600 | x55, x35, x7 | ~110 MB (x55=66MB manual) |
| **livan** | `livan/` | 7 | ~459 | solano, x3_pro, s6_pro | ~3 MB |
| **opel** | `opel/` | 27 | ~11900 | astra, corsa, insignia, vectra, zafira | ~40 MB |

**Критическое замечание по opel**: 3 текущих модели в llcar (astra_k, corsa_e, insignia_b) не соответствуют T4. Нужен полный пересоздать каталог.

---

## P1 — Situation Expansion (bug + массовая раскрутка)

### Подтверждение системного бага

**Bug:** Все ген-папки в llcar содержат ровно 10 (иногда меньше) ситуаций независимо от объёма в T4. Примеры:
- BMW x3/g45_2024: **9** ситуаций (явно truncated pipeline)
- Hyundai elantra/cn7_2020: **8** ситуаций
- Все остальные поколения: **10** (hard cap)
- T4 источник: 420–700+ ситуаций на модель

**Затронуты все бренды без исключения.** Это не design decision — пайплайн обрезает situations при импорте.

### Бренды с наибольшим потенциалом расширения

| Бренд | Текущих ситуаций | T4 ситуаций | Прирост | Приоритет |
|---|---|---|---|---|
| toyota | 150 | ~38000 | +37850 | CRITICAL |
| volkswagen | 80 | ~29300 | +29220 | CRITICAL |
| nissan | 90 | ~19800 | +19710 | CRITICAL |
| mitsubishi | 40 | ~18900 | +18860 | CRITICAL |
| kia | 237 | ~9593 | +9356 | HIGH |
| suzuki | 10 | ~6654 | +6644 | HIGH |
| subaru | 20 | ~6358 | +6338 | HIGH |
| chery | ~50 | ~10000 | +9950 | HIGH |
| ford | 30 | ~8300 | +8270 | HIGH |
| chevrolet | 13 | ~10500 | +10487 | HIGH |

**Оценка полного объёма:** при расширении до 100 ситуаций/поколение для всех существующих ~200 поколений = +18000 ситуаций (P1 реалистичная цель).

---

## P2 — Rich Content (manuals / parts / images)

### Manuals — топ-приоритеты по размеру

| Бренд/модель | T4 manual size | Тип | Заметка |
|---|---|---|---|
| changan/uni_t | 362 MB | DITA+MD | Требует chunked import |
| byd/song_plus | 398 MB + 195 MB dita | DITA+MD | Крупнейший одиночный мануал |
| changan/uni_k | 69 MB | DITA+MD | |
| changan/cs95 | 80 MB | DITA+MD | |
| baic/x55 | 66 MB | DITA+MD | |
| belgee/x50 | 49 MB | DITA+MD | |
| cadillac/escalade | 166 MB + 6431 img | DITA+MD | Огромная ценность |
| audi/q5 | 256 MB | chunked | Готов chunk_generation_map.json |
| bmw/x2, x3, x5 | 44–96 MB | DITA | |
| ford (все модели) | 8270 chunks | multi-MD | |

### Images — топ по количеству файлов

| Бренд | T4 images | Приоритет |
|---|---|---|
| kia | 13 487 | HIGH |
| toyota/camry | ~12 000 | HIGH |
| toyota/yaris | ~11 000 | HIGH |
| audi | ~15 000 brand | MEDIUM |
| suzuki | 8 427 | HIGH |
| daewoo | 8 114 | HIGH (СНГ-фокус) |
| skoda | 6 800 | MEDIUM |
| porsche | 5 352 | MEDIUM |
| mazda | 4 894 | MEDIUM |
| subaru/forester | 4 802 | MEDIUM |

### Parts-catalog — отсутствует везде, max value

Все 58 брендов: **0 parts-catalog.json** в llcar. T4 содержит каталоги у большинства моделей. Импорт parts — ключевое для LLM-диагноста ("что заменить").

---

## Naming Mismatches (mapping dict)

```python
BRAND_NAME_MAP = {
    # T4 dir name → llcar KB dir name
    "mercedes_benz":   "mercedes",          # confirmed OK (group10)
    "li":              "li_auto",            # T4=li, llcar=? (нет вообще — выбрать li_auto)
    "faw_bestune":     "bestune",            # llcar использует faw_bestune — оставить
    "land_rover":      "land_rover",         # OK (оба одинаковые)
    "ssang_yong":      "ssangyong",          # если встретится вариант с _
}

MODEL_NAME_FIXES = {
    # T4 model dir → llcar model dir (внутри бренда)
    "jaguar/f-pace":   "jaguar/f_pace",      # дефис → подчёркивание (дубль в T4!)
    "jaguar/f_pace":   "jaguar/f_pace",      # канонический
    "honda/cr_v":      "honda/cr_v",         # т.ж. cr-v, crv — нужна дедупликация
    "honda/cr-v":      "honda/cr_v",         # alias
    "honda/fit_jazz":  "honda/fit",          # alias
    "honda/jazz":      "honda/fit",          # alias
    "honda/hrv_1999":  "honda/hr_v",         # alias
    "lexus/es250":     "lexus/es",           # alias
    "lexus/es350":     "lexus/es",           # alias
    "lexus/gx460":     "lexus/gx",           # alias
    "lexus/lx470":     "lexus/lx",           # alias
    "lexus/lx570":     "lexus/lx",           # alias
    "lexus/nx200":     "lexus/nx",           # alias
    "lexus/rx300":     "lexus/rx",           # alias
    "kia/optima_k5":   "kia/k5",             # alias (K5 Optima)
    "kia/ev9_my24":    "kia/ev9",            # model year suffix
    "byd/atto_3":      "byd/atto_3",         # yuan_2021 в llcar — mismatch
    "bmw/ix3_2":       "bmw/ix3",            # suffix _2
    "bmw/5_e28":       "bmw/5_series",       # old gen субкаталог
    "opel/astra":      "opel/astra",         # llcar имеет astra_k (нет в T4)
    "opel/corsa":      "opel/corsa",         # llcar имеет corsa_e (нет в T4)
    "forthing/forthing__friday": "forthing/friday",  # двойной underscore
}

LLCAR_ORPHANS = [
    # Существуют в llcar но нет в T4 — синтезированный контент
    "bmw/i5_g60_2023",
    "bmw/i7_g70_2022",
    "bmw/z4_g29_2018",
    "cadillac/xt6/2019",
    "kia/telluride",    # надо проверить — может быть в _all
    "audi/q4_e_tron",
    "audi/rs6",
    "opel/astra_k",
    "opel/corsa_e",
    "opel/insignia_b",
]
```

---

## Recommended ETL Scripts

### Script 1: P0 — Create Missing Brand (минимальный деплой)

```python
#!/usr/bin/env python3
"""
p0_create_brand.py — импорт отсутствующего бренда из T4 в llcar KB.
Создаёт: _brand.json + для каждой модели/_all/situations.json → per-gen structure.

Usage: python p0_create_brand.py --brand ssangyong --max-situations 50
"""

import json, os, shutil
from pathlib import Path

T4_BASE = Path("D:/transfer4/knowledge-base/brands")
LLCAR_BASE = Path("llcar-dashboard/public/data/kb")

BRAND_MAP = {
    "li": "li_auto",
    "mercedes_benz": "mercedes",
    # add others from BRAND_NAME_MAP above
}

def create_brand(brand_t4: str, max_sit: int = 50):
    src = T4_BASE / brand_t4
    dst_name = BRAND_MAP.get(brand_t4, brand_t4)
    dst = LLCAR_BASE / dst_name
    dst.mkdir(parents=True, exist_ok=True)

    models = [d for d in (src / "models").iterdir() if d.is_dir() and not d.name.startswith("_")]
    
    for model_dir in models:
        sit_file = model_dir / "situations.json"
        dtc_file = model_dir / "dtc.json"
        manual_gens = model_dir / "manual_generations.json"
        
        # Определить поколения
        if manual_gens.exists():
            gens = json.loads(manual_gens.read_text())["generations"]
        else:
            gens = [{"id": f"{model_dir.name}_gen1", "year_start": 2020}]
        
        # Распределить situations по поколениям
        situations = []
        if sit_file.exists():
            all_sit = json.loads(sit_file.read_text())
            situations = all_sit[:max_sit * len(gens)]
        
        for i, gen in enumerate(gens):
            gen_id = gen.get("id", f"gen{i+1}")
            gen_dir = dst / model_dir.name / gen_id
            gen_dir.mkdir(parents=True, exist_ok=True)
            
            # situations.json (slice per gen)
            gen_sit = situations[i*max_sit:(i+1)*max_sit]
            (gen_dir / "situations.json").write_text(json.dumps(gen_sit, ensure_ascii=False, indent=2))
            
            # dtc.json
            if dtc_file.exists():
                shutil.copy(dtc_file, gen_dir / "dtc.json")
            
            # meta.json stub
            meta = {"model": model_dir.name, "generation": gen_id,
                    "year_start": gen.get("year_start", 2020), "source": "t4_import"}
            (gen_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    
    # _brand.json
    brand_meta = {"brand": dst_name, "models_count": len(models),
                  "imported_from": str(src), "import_date": "2026-04-15"}
    (dst / "_brand.json").write_text(json.dumps(brand_meta, ensure_ascii=False, indent=2))
    print(f"Created {dst_name}: {len(models)} models")

# P0 brands ordered by priority:
P0_BRANDS = ["ssangyong", "tank", "jaecoo", "daewoo", "datsun", "li",
             "gac", "forthing", "genesis", "kaiyi", "hongqi", "belgee", "baic", "livan"]

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--brand", required=True)
    p.add_argument("--max-situations", type=int, default=50)
    args = p.parse_args()
    create_brand(args.brand, args.max_situations)
```

### Script 2: P1 — Situation Expansion (10 → полные)

```python
#!/usr/bin/env python3
"""
p1_expand_situations.py — раскрутка situations с 10 до полного объёма.
Для каждого существующего gen в llcar находит T4 source и копирует все ситуации.

Usage: python p1_expand_situations.py --brand kia --target 100
"""

import json
from pathlib import Path

T4_BASE = Path("D:/transfer4/knowledge-base/brands")
LLCAR_BASE = Path("llcar-dashboard/public/data/kb")

REVERSE_BRAND_MAP = {"mercedes": "mercedes_benz", "li_auto": "li", "faw_bestune": "faw_bestune"}

def expand_situations(brand_llcar: str, target: int = 100):
    brand_t4 = REVERSE_BRAND_MAP.get(brand_llcar, brand_llcar)
    src_brand = T4_BASE / brand_t4
    dst_brand = LLCAR_BASE / brand_llcar
    
    if not dst_brand.exists():
        print(f"SKIP {brand_llcar}: not in llcar")
        return
    
    updated = 0
    for model_dir in dst_brand.iterdir():
        if not model_dir.is_dir() or model_dir.name.startswith("_"):
            continue
        
        # Find T4 situations source (try direct match, then alias resolution)
        t4_sit_file = src_brand / "models" / model_dir.name / "situations.json"
        if not t4_sit_file.exists():
            print(f"  MISS {model_dir.name}: no T4 source")
            continue
        
        all_sit = json.loads(t4_sit_file.read_text())
        gens = [d for d in model_dir.iterdir() if d.is_dir()]
        per_gen = min(target, len(all_sit) // max(len(gens), 1))
        
        for i, gen_dir in enumerate(sorted(gens)):
            sit_slice = all_sit[i*per_gen:(i+1)*per_gen]
            if not sit_slice:
                sit_slice = all_sit[:per_gen]  # fallback: repeat first gen
            (gen_dir / "situations.json").write_text(
                json.dumps(sit_slice, ensure_ascii=False, indent=2))
            updated += 1
        
        print(f"  {model_dir.name}: {len(gens)} gens × {per_gen} situations")
    
    print(f"Done {brand_llcar}: {updated} gen-files updated")

# P1 priority order (biggest ROI first):
P1_BRANDS = ["toyota", "volkswagen", "nissan", "mitsubishi", "kia",
             "suzuki", "subaru", "chery", "ford", "chevrolet",
             "hyundai", "bmw", "haval", "honda", "lada"]

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--brand", required=True)
    p.add_argument("--target", type=int, default=100)
    args = p.parse_args()
    expand_situations(args.brand, args.target)
```

### Script 3: P2 — Parts + Manual enrichment

```python
#!/usr/bin/env python3
"""
p2_enrich_rich_content.py — копирует parts-catalog.json и manual.md в gen-папки.
Также генерирует images index (не копирует сами файлы — только manifest).

Usage: python p2_enrich_rich_content.py --brand audi --content parts
       python p2_enrich_rich_content.py --brand toyota --content manual
       python p2_enrich_rich_content.py --brand kia --content images-index
"""

import json, shutil
from pathlib import Path

T4_BASE = Path("D:/transfer4/knowledge-base/brands")
LLCAR_BASE = Path("llcar-dashboard/public/data/kb")

def enrich(brand_llcar: str, content: str):
    brand_t4 = {"mercedes": "mercedes_benz"}.get(brand_llcar, brand_llcar)
    src_brand = T4_BASE / brand_t4
    dst_brand = LLCAR_BASE / brand_llcar
    
    for model_dir in dst_brand.iterdir():
        if not model_dir.is_dir() or model_dir.name.startswith("_"):
            continue
        t4_model = src_brand / "models" / model_dir.name
        
        if content == "parts":
            src_f = t4_model / "parts-catalog.json"
            if src_f.exists():
                for gen_dir in model_dir.iterdir():
                    if gen_dir.is_dir():
                        shutil.copy(src_f, gen_dir / "parts-catalog.json")
                        print(f"  parts → {gen_dir}")
        
        elif content == "manual":
            # Find best manual.md (prefer per-gen, fallback to model-level)
            manuals = sorted(t4_model.glob("manual*.md"))
            if manuals:
                # Copy smallest manual per gen as preview (full text too large)
                gens = sorted([d for d in model_dir.iterdir() if d.is_dir()])
                for i, gen_dir in enumerate(gens):
                    src_m = manuals[min(i, len(manuals)-1)]
                    shutil.copy(src_m, gen_dir / "manual.md")
                    print(f"  manual → {gen_dir.name} ({src_m.stat().st_size//1024}KB)")
        
        elif content == "images-index":
            img_dir = t4_model / "images"
            if img_dir.exists():
                imgs = [f.name for f in img_dir.iterdir() if f.suffix in ('.webp', '.jpg', '.png')]
                index = {"count": len(imgs), "files": imgs[:50], "source": str(img_dir)}
                for gen_dir in model_dir.iterdir():
                    if gen_dir.is_dir():
                        (gen_dir / "images-index.json").write_text(
                            json.dumps(index, ensure_ascii=False, indent=2))
                print(f"  images-index: {model_dir.name} → {len(imgs)} files indexed")

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--brand", required=True)
    p.add_argument("--content", choices=["parts", "manual", "images-index"], required=True)
    args = p.parse_args()
    enrich(args.brand, args.content)
```

---

## S17+ Sprint Planning

| Sprint | Задачи | Ожидаемый результат |
|---|---|---|
| **S17-P0** | Создать 8 отсутствующих брендов (ssangyong, tank, jaecoo, daewoo, datsun, li_auto, gac, forthing) | +~18 000 ситуаций, +56 моделей |
| **S17-P0b** | Создать 7 оставшихся (genesis, kaiyi, hongqi, belgee, baic, livan, opel-rebuild) | +~22 000 ситуаций, +65 моделей |
| **S17-P1** | Expand situations: toyota, vw, nissan, mitsubishi, kia (target 100/gen) | +50 000 ситуаций для топ-5 |
| **S17-P1b** | Expand: suzuki, subaru, chery, ford, chevrolet, honda, haval, lada | +30 000 ситуаций |
| **S17-P2** | Parts-catalog для всех 58 брендов (bulk copy, ~1 час) | Огромный value для LLM-диагноста |
| **S17-P2b** | Images-index для топ-10 брендов по image count | Визуальный контент в UI |
| **S17-P2c** | Manual enrichment chunked: начать с audi/q5, toyota, bmw/x3/x5 | |
| **S17-fix** | Починить _brand.json счётчики (models_count, situations) для всех брендов | Корректная статистика |
| **S17-fix** | Resolve naming mismatches (f-pace/f_pace, cr-v/cr_v, и др.) | Стабильный маппинг |
| **S17-fix** | DTC bug: заполнить пустые dtc.json (jeep, jetour, kia, kaiyi) | +8234 DTC-кодов видимы |
