# 15-DTC-INDEX-SITUATIONS: Actionable Analysis

## Key Findings

1. 36,102 DTC codes with 99.5% Russian descriptions, 7 severity levels, can_drive field
2. 764 universal situations with detailed answers, prices, common mistakes
3. **Critical gap:** Only 6 of 764 situations have explicit DTC mappings (11 unique codes linked)
4. 31 additional situations mention DTC codes in text but not in the `dtc_codes` field
5. 7 severity levels in DTC (should be normalized to 4)
6. 191 codes have English-only descriptions (from dsoprea/DtcLookup)
7. dtc-index.json is 4.7 MB -- too large for frontend loading
8. Only 95 of 764 situations have step-by-step instructions (steps field)
9. searchQueries provide ~2,292 search indices across 764 situations
10. Top situation by merged_count: oil consumption (289 sources merged)

## What's Already Implemented

- DTC events with freeze frame storage
- Health Score v2 with weighted algorithm
- Knowledge base 4-level resolver
- 110 diagnostic rules
- Fuel trim analyzer (8 levels, 5 corrections)

## What's NOT Implemented but SHOULD Be

### 1. DTC-to-Situation keyword mapping engine (P0)
**Problem:** 758 of 764 situations have no DTC codes linked. This is the single biggest data gap.
**Approach:** Build a 3-stage pipeline:
  - Stage 1 (auto): Parse DTC codes from quickAnswer/facts_ru text via regex `[PBCU][0-9A-F]{4}` -> ~37 situations
  - Stage 2 (auto): Semantic matching: tokenize DTC title_ru, match against situation title + searchQueries via TF-IDF/BM25 inverted index -> ~300-400 situations
  - Stage 3 (manual): Curate top-50 most common P-codes with explicit situation mappings
**Files to create:**
  - `diagnostic_engine/mappings/dtc_situation_map.json` (curated)
  - `diagnostic_engine/scripts/build_dtc_mapping.py` (auto-generator)
**Estimated result:** 680 of 764 situations with DTC links (~89% coverage)
**Priority: P0**

### 2. Severity normalization (P0)
**Problem:** DTC has 7 levels (critical/urgent/high/medium/warning/low/info), situations have 5 urgency levels (1-5). Inconsistent.
**Approach:** Normalize to 4 levels:
```
critical + urgent -> CRITICAL (332 codes) -> urgency 5
high + medium -> HIGH (104 codes) -> urgency 4
warning -> WARNING (23,112 codes) -> urgency 3
info + low -> INFO (12,554 codes) -> urgency 1-2
```
**Files to modify:** `diagnostic_engine/models.py` (add severity normalizer), `anomaly_engine.py`
**Priority: P0**

### 3. DTC API endpoint with situation matching (P0)
**Problem:** No API endpoint exists: `GET /api/dtc/{code}` -> DTC info + matched situations.
**Approach:** Create endpoint that:
  1. Looks up DTC in dtc-index
  2. Matches situations via direct dtc_codes, system_id->category, keyword matching
  3. Ranks by merged_count * urgency * relevance_score
  4. Returns DiagnosticResult with quickAnswer, priceRange, commonMistakes, steps
**Files to create:** `llcar-dashboard/api/dtc_lookup.py` or add to existing Django views
**Priority: P0**

### 4. Lazy-load DTC index for frontend (P1)
**Problem:** 4.7 MB dtc-index.json too large for browser.
**Approach:** Split into prefix-based chunks:
  - `dtc-P0.json`, `dtc-P1.json`, ..., `dtc-U3.json` (~16 files, ~300KB each)
  - OR create minimal index: `dtc-index-minimal.json` (code -> severity + can_drive, ~500KB)
  - Full details loaded on demand per code
**Files to create:** `scripts/split_dtc_index.py`, deploy split files to static
**Priority: P1**

### 5. Translate 191 English-only DTC descriptions to Russian (P1)
**Problem:** 191 codes from dsoprea/DtcLookup have no title_ru.
**Approach:** Batch translate via GPT/Claude API, validate, merge into dtc-index.json.
**Files to modify:** `common files all models/dtc-index.json`
**Priority: P1**

### 6. Add steps/prices for top-50 situations (P2)
**Problem:** Only 95/764 (12.4%) situations have step-by-step instructions.
**Approach:** Start with top-50 by merged_count (oil consumption, water leak, fuel consumption, engine won't start, corrosion...). Generate steps from quickAnswer + facts_ru.
**Priority: P2**

### 7. Inverted search index for situation matching (P2)
**Problem:** No full-text search over 764 situations + 2,292 search queries.
**Approach:** Build inverted index: word -> [situation_ids]. At query time: tokenize DTC title_ru -> lookup -> score by TF-IDF.
**Files to create:** `diagnostic_engine/search/inverted_index.py`
**Priority: P2**
