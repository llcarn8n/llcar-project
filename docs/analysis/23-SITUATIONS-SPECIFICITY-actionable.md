# 23-SITUATIONS-SPECIFICITY: Actionable Analysis

## Key Findings

1. **4-level hierarchy is a fiction.** Only 2 layers have unique content: Universal (764 diagnostic situations) and Brand (+200-800 manual_warnings)
2. Model level = pure subset of Brand level. 100% overlap, 0% unique content across all tested brands (BMW, Chery, Hyundai)
3. Generation level adds only manual_warning entries (1,195 across entire DB), zero diagnostic adaptation
4. Universal-to-Brand "differences" are OCR artifacts ("букси-ровке" -> "буксировке"), not semantic changes
5. 85-95% of brand-only content is manual_warning (service manual excerpts), not diagnostic situations
6. Real unique diagnostic content per brand: ~30 situations (review_mining: ~10, autoresearch: ~19, swarm_agent: ~12)
7. No generation-specific adaptation exists: same prices for E53 (2000-2006) and F15 (2013-2018), same diagnostic text for M62 and N55 engines
8. 405,751 model-level records = ~836 copies of ~485 records each = massive duplication
9. Renault has 213 duplicate bugs across all models (data quality issue)
10. The "models" field in brand-level situations is the actual filter mechanism, making model-level files redundant

## What's Already Implemented

- Knowledge base with 4-level resolver (universal > brand > model > generation)
- 764 universal situations loaded and served

## What's NOT Implemented but SHOULD Be

### 1. Separate manual_warning from diagnostic situations in data and code (P0)
**Problem:** manual_warning entries (service manual excerpts) are mixed with real diagnostic situations, inflating counts and polluting search/matching results. When the rule engine matches a DTC to situations, it shouldn't return "Replacing main bearings" as a diagnostic result.
**Approach:**
  - Add `content_type` field: `diagnostic` | `manual_reference` | `manual_warning`
  - Tag all `source_type: "manual_warning"` and `source_type: "manual_regex"` entries
  - In situation resolver: filter to `diagnostic` only for rule engine matching
  - Show `manual_reference` in separate "Service manual" section
**Scale of impact:** Removes ~95% of brand-only noise. E.g., BMW brand goes from 593 "unique" situations to ~40 real diagnostic situations.
**Files to modify:** Situation resolver, brand situation files
**Priority: P0** -- single biggest quality improvement for diagnostic accuracy

### 2. Simplify resolver to 2-level: Universal + Brand overlay (P0)
**Problem:** Model and generation files are redundant (0 unique content). 4-level resolution wastes compute and creates maintenance burden.
**Approach:**
  - Resolution becomes: Universal -> Brand overlay (using `models` field as filter)
  - If user's model is in situation's `models` array (or `models` is empty/"_all") -> include
  - No need to load model-level or generation-level files
  - This eliminates loading 983 model files and 66 generation files
**Files to modify:** `diagnostic_engine/resolvers/situation_resolver.py`
**Priority: P0** -- simplification that improves both performance and correctness

### 3. Generation-specific diagnostic overlays (P1)
**Problem:** No generation-specific diagnostic content exists. BMW E53 (M62 engine, 2000-2006) gets identical text to F15 (N55/B58, 2013-2018). This is wrong.
**Approach:** Create a NEW type of generation overlay with REAL specifics:
```json
{
  "generation_overlays": {
    "bmw_x5_e53": {
      "engine_codes": ["M62B44", "M54B30", "M57D30"],
      "known_issues": [
        {"issue": "VANOS seal failure", "affected_engines": ["M62B44"], "mileage_range": "100000-200000"},
        {"issue": "Coolant expansion tank crack", "typical_cost": "3000-5000 RUB"},
        {"issue": "Transfer case actuator motor failure"}
      ],
      "price_multiplier": 0.7,  // older cars = cheaper parts
      "parts_availability": "aftermarket_excellent"
    },
    "bmw_x5_f15": {
      "engine_codes": ["N55B30", "N57D30", "B58B30"],
      "known_issues": [
        {"issue": "Valve cover gasket oil leak", "affected_engines": ["N55B30"]},
        {"issue": "Electronic thermostat failure"},
        {"issue": "Air suspension compressor wear"}
      ],
      "price_multiplier": 1.2,  // newer = more expensive
      "parts_availability": "oem_only_some_parts"
    }
  }
}
```
**Data source:** drive2.ru forums, drom.ru reviews, YouTube diagnostics per generation
**Files to create:** `diagnostic_engine/data/generation_overlays/` directory with per-brand files
**Priority: P1** -- high user value, but requires data collection effort

### 4. Deduplicate knowledge base (P1)
**Problem:** 405,751 model records are copies. 483,108 total entries when only ~2,000-3,000 are unique.
**Approach:**
  - Keep only: `situations-universal.json` (764) + `brands/{brand}/situations.json` (~60 files)
  - Delete all model-level and generation-level situation files
  - Move manual_warnings to separate `brands/{brand}/manual-extracts.json`
  - Result: ~60 files instead of 983+66 = ~1049 files
  - Saves significant storage and eliminates sync/duplication bugs
**Priority: P1** -- architecture cleanup

### 5. Fix Renault data bug (P1)
**Problem:** 213 identical duplicates exist across all Renault models -- data quality issue.
**Approach:** Investigate Renault brand-level situations, find and remove 213 duplicate entries.
**Files to check:** `D:/transfer4/knowledge-base/brands/renault/situations.json`
**Priority: P1**

### 6. Brand-specific real diagnostic content enrichment (P2)
**Problem:** Only ~30 truly unique diagnostic situations per brand (from review_mining, autoresearch, swarm_agent). The rest is either universal copy or manual excerpts.
**Approach:** For top-10 brands on Russian market, collect real brand-specific diagnostic knowledge:
  - Hyundai: "Cylinder scoring on Theta II engines", "12V battery drain issue"
  - BMW: "VANOS problems", "Coolant system plastic parts failure"
  - Chery: "ACTECO turbo issues", "CVT reliability"
  - Li Auto: "Range extender oil consumption", "12V system behavior"
  - Toyota: "Toyota-specific DTC interpretations"
**Source:** drive2.ru journals, drom.ru reviews, brand-specific YouTube channels
**Priority: P2** -- high differentiation value but requires significant content creation

### 7. Price adaptation by generation year range (P2)
**Problem:** Same price shown for 2006 car and 2024 car. E.g., brake pad replacement costs differ by 2-3x between old and new generations.
**Approach:** Add `price_year_multiplier` based on generation year range:
  - 2000-2010 cars: multiplier 0.6 (cheaper aftermarket parts)
  - 2011-2018 cars: multiplier 1.0 (baseline)
  - 2019-2026 cars: multiplier 1.3 (newer = more expensive, fewer aftermarket options)
  Apply to priceRange when displaying to user.
**Priority: P2**
