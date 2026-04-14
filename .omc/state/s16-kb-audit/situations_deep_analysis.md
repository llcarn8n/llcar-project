# Deep Analysis: situations.json → per-generation ETL

Source: `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/situations.json`
Target: `llcar-dashboard/public/data/kb/{brand}/{model}/{gen}/situations.json`

---

## 1. Executive Summary — ETL algorithm

**Verdict: Situations in `D:/transfer4` are NOT pre-tagged by generation. Direct split is impossible.** Only **~1%** of records contain explicit gen codes (e.g. `f30`, `xv70`, `b8`) in any text field, and there is zero `generation` / `gen_id` field on the record itself. Even the existing per-gen subdirs (`bmw/3_series/f30/situations.json`, `kia/rio/2017/`) are **mostly the same data** as the parent (BMW f30 = 443/464 = 95% of parent, identical to f34 — the brand-level file copied with 21 records dropped).

**Recommended algorithm: "Universal-Plus-Targeted" (UPT)**

```
FOR each (brand, model) in kb-audit:
  gens       = info.json.generations            # authoritative list with {id, ys, ye}
  sits       = situations.json                   # source: 400-700 records
  chunk_map  = chunk_generation_map.json         # optional manual->gen mapping
  man_gens   = manual_generations.json           # optional manual->gen mapping

  FOR each s in sits:
    tags = detect_gen_tags(s)      # text-scan for e36, xv70, b5 etc. (rare: <1%)
    tags |= map_source(s.source)    # if source mentions manual-N.md, lookup chunk_map[N]
    tags |= map_years(s.facts_ru, gens)   # year-in-text → gen whose [ys,ye] covers it

    IF tags is empty:
      s.__gens = ALL_GENS           # treat as universal (applies to every generation)
    ELSE:
      s.__gens = tags

  FOR each gen in gens:
    out_path = kb/{brand}/{model}/{gen.short_id}/situations.json
    records  = [transform(s) for s in sits if gen.id in s.__gens]
    records  = dedupe(records, key='id')
    write(out_path, records)
```

**Key rule**: when gen cannot be detected, **duplicate the situation to every gen** (mark `__universal: true`). This matches what the KB actually is: 85-95% of source records are universal brand/model knowledge (reviews, warnings, DTC codes) that are valid across all generations. Current dashboard already follows this pattern (b8_2014 and b8_2015 share same first_id `vw_passat_b8_001`).

---

## 2. Per-model findings

### 2.1 toyota/camry (3.0 MB, 697 recs)
- Source declares 6 gens in code (v50, v55, v70, xv30, xv40, xv50), info.json lists them with gen_id.
- **Zero gen-tokens in title/qa**: 0 hits for xv30/xv40/xv50/v50/v55, only 1 hit for xv70.
- **147/697 records mention a year** → usable for year→gen matching against `ys..ye`.
- `chunk_generation_map.json` maps manual filenames → gen_id with high/medium confidence (11 entries).
- `models` field populated in 61/697 (cross-brand reviews like `['rav4','camry']`).
- DTC: 50 valid samples, 0 invalid. 100% Cyrillic, 1 CJK stray, 1 placeholder.
- Dashboard already has `v50_2011/`, `xv40_2006/`, `xv70_2018/` (10 records each, custom IDs like `toyota_camry_v50_2ar_fe_timing_chain_stretch`).
- Per-gen subdirs: **none** (no `camry/xv50/situations.json`).

### 2.2 volkswagen/passat (2.9 MB, 641 recs)
- **No** `manual_generations.json`, **no** `chunk_generation_map.json`, **no** per-gen subdirs.
- Gen-token hits: b5=0, b6=0, b7=1, b8=6, b9=2 → **0.8%** of records tagged.
- `models` field (35/641) lists cross-model lists: `['golf','passat','jetta','tiguan','polo']`.
- DTC: 66 valid, 2 invalid; samples `P0730, P0741, P2711`, repair_cost_rub present on 18.
- Dashboard has only `b8_2014/` and `b8_2015/` (both count=10, identical first_id — duplicated).
- Verdict: **zero generation signal in source**; must rely on year-in-text + universal-default.

### 2.3 hyundai/solaris (1.7 MB, 470 recs)
- Only **1 generation in info.json** (`solaris_ii_2017_2017`, Solaris 2017-н.в.). Dashboard also has `rb_2011/` (pre-2017) — but `chunk_generation_map.json` reason: "only one generation exists".
- `manual_generations.json` all 3 manuals map to same gen_id.
- 100% Cyrillic, 0 CJK, 0 placeholders. DTC all valid.
- Verdict: **trivial split** — all records → single gen (+ dashboard's rb_2011 might be legacy artefact, verify separately).

### 2.4 bmw/3_series (1.8 MB, 464 recs)
- Per-gen subdirs **exist**: `f30/situations.json` (443), `f34/situations.json` (443). Both are identical SUBSETS of parent (443/464 overlap, 0 sub-only). The 21 parent-only records likely got dropped because `models` didn't match.
- `e36/` subdir has manuals but **no** situations.json.
- Gen-token hits: e30=0, e36=0, e46=0, e90=1, e92=1, f30=2, f34=0, g20=2 → **1.3%**.
- `manual_generations.json`: 3 manuals, confidence medium/low; note `manual-3_series_f34.md` has gen_id=null.
- DTC: 94 valid, 7 invalid (15-char like `P17BF` on Audi adjacent).
- Dashboard already has `f30_2012/` and `g20_2019/` (10 records each).

### 2.5 kia/rio (1.7 MB, 449 recs in parent)
- Per-gen subdirs: `2017/situations.json` (519 recs), `2021/situations.json` (447 recs). Both have OVERLAP 420 with parent and 99/27 subdir-only records — i.e. they have additional content beyond the parent.
- info.json lists only 1 gen (`Rio I 2017-2024`) yet dashboard has 4 gens (`dc_2000, jb_2005, qb_2011, fb_2017`).
- `chunk_generation_map.json`: 3 entries, 1 null mapping.
- **Insight**: the D:/transfer4 kia/rio tree has more complete gen split than info.json declares. The subdirs can be trusted as pre-filtered.
- DTC: 31 valid, 0 invalid; `P0000` appearing (junk, must filter).

### 2.6 audi/a4 (1.8 MB, 468 recs)
- info.json lists only `A4 1994-2001` (B5). Dashboard has `b8_2008/` and `b9_2015/` — info.json is incomplete.
- `chunk_generation_map.json`: 1 entry mapping manual-a4.md → B5.
- `manual_generations.json`: 4 manuals, 3 map to B5, 1 null.
- Per-gen subdir `1997_2001/` exists but has **no** situations.json.
- Gen-token hits: b5=0, b6=1, b7=0, b8=3, b9=1, b10=0 → **1.1%**.
- DTC valid=54, invalid=2.

---

## 3. Content quality summary (all 6 models)

| model          | count | cyrillic | CJK | placeholders | DTC valid/invalid (n=300) |
|----------------|-------|----------|-----|--------------|---------------------------|
| toyota/camry   | 697   | 697      | 1   | 1            | 50/0                      |
| vw/passat      | 641   | 641      | 1   | 1            | 66/2                      |
| hyundai/solaris| 470   | 470      | 0   | 0            | 29/0                      |
| bmw/3_series   | 464   | 464      | 0   | 0            | 94/7                      |
| kia/rio        | 449   | 449      | 0   | 0            | 31/0                      |
| audi/a4        | 468   | 468      | 0   | 0            | 54/2                      |

**Verdict: source content is HIGH quality.** Nearly 100% Russian prose, negligible mojibake/CJK contamination, valid DTC codes (filter `P0000` and 5-char codes). Fields `quickAnswer`, `facts_ru`, `sources`, `dtc_codes`, `priceRange`, `canDrive`, `commonMistakes` are populated on 85-95% of records.

**Schema drift (source vs dashboard)**:
- source: `quickAnswer, urgency, category, facts_ru, sources, priceRange, canDrive, commonMistakes, dtc_codes, layers, icon, searchQueries, season, priority`
- dashboard: `qa, urg, cat, solutions, price_range, mileage_range, content_type, dtc_codes, full_article_path`
- **ETL must map** `quickAnswer→qa, urgency→urg, category→cat, priceRange→price_range`, synthesize `solutions` from `facts_ru+commonMistakes`, drop `searchQueries/season/layers/icon/subtitle`.

---

## 4. ETL strategy (authoritative)

**Step 1 — Get gen list**: from `info.json.generations[].id` → authoritative. Supplement with dashboard subdirs already present (preserve existing short IDs like `b8_2014`, `xv70_2018`).

**Step 2 — Classify each situation**:
1. If `D:/transfer4/.../{model}/{gen_dir}/situations.json` exists **and** subdir records are a proper superset of parent (kia/rio case) → **use subdir as-is**, not parent.
2. Else scan record text for gen-codes (`e36`, `f30`, `xv70`, `b8`, `rb`, `hc`, `qb`, `fb`) → **confidence: high** (if ≥1 hit).
3. Else scan `source` field: if value like `"manual_warning"` or `"swarm_agent:research_rio"`, look up chunk_generation_map.json / manual_generations.json → **confidence: medium**.
4. Else scan all text for years `(19|20)\d{2}` → filter to gens whose `[ys..ye]` covers it → **confidence: low**.
5. Else **mark universal** → emit record into every gen folder.

**Step 3 — Transform** (field remap to dashboard schema).

**Step 4 — Dedupe** by `id` per gen.

**Step 5 — Cap** to top-N per gen (e.g. sort by `urgency desc, reviewed_claude desc, has_dtc desc`, keep top 50-100). Currently dashboard has only 10 per gen — expand.

---

## 5. Usability estimate

For the 6 sampled models (total 3189 source records):
- **~85% universal** — applies to every gen (safe auto-duplicate). After dedupe across 6 models: ~2700 usable records.
- **~10% cross-brand reviews** (`models:[rav4,camry]` or reviews mining) — keep as universal only on the exact model listed.
- **~3-5% gen-specific** — detectable via gen-code or year-in-text.
- **~1% junk** — placeholders, empty qa, invalid DTC (`P0000`), CJK stray; **drop**.

**Projected per-gen output** (after UPT algorithm, 6 sample models × ~3-4 gens avg):
- camry (6 gens): ~500 universal × 6 = 3000 records across gens, +gen-specific ~30. **~80-150 usable per gen** (after dedup-within-gen cap).
- passat (4 gens b5..b8): ~500 × 4 + ~10 gen-specific. Similar density.
- solaris (1-2 gens): ~400 per gen.
- bmw 3 (4-6 gens): existing f30/f34 subdirs give 443 each; +e90/g20 heuristic.
- rio (4 gens): subdirs give 447-519; split by heuristic for dc/jb.
- audi a4 (5 gens b5..b9): ~450 universal × 5 + gen-specific.

**Total projected: ~60,000-80,000 situation records** across full KB (58 brands × ~10 models × ~3 gens × ~100 situations) — a **20-50× expansion** from current 10/gen placeholder state.

**Primary risks**:
1. Universal-duplication = same content in every gen folder → dashboard must show gen-specific ones FIRST in UI.
2. Year-based mapping is noisy when review text mentions unrelated years.
3. `kia/rio` subdirs have extra content beyond parent — must prefer subdir when present.
4. BMW `e36/` has no situations.json — must generate via UPT from parent only.

---

## Files referenced (absolute)
- Source: `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/situations.json` (6 files, 1.7-3.0 MB each)
- Target: `C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard/public/data/kb/{brand}/{model}/{gen}/situations.json`
- Mappings: `manual_generations.json`, `chunk_generation_map.json`, `info.json` (alongside each situations.json)
- Analysis artefacts: `C:/Users/Петр/Downloads/Маркетинговые материалы/.omc/state/s16-kb-audit/{analyze.py, probe2.py, analysis_raw.txt, probe2_raw.txt, results.json}`
