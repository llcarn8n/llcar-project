# 19-KNOWLEDGE-BASE-ANALYSIS: Actionable Analysis

## Key Findings

1. 4-level situation resolution confirmed: Universal (764) -> Brand (503-1233) -> Model (443-635) -> Generation (0-192 unique)
2. Brand-only situations are real value: "cylinder scoring" (Hyundai), "12V battery dead - how to open" (Li Auto)
3. Brand adds fields: brand, models, icon, season, priority, severity, priceData, action_ru, mentionIndex
4. Model level is a SUBSET of brand (100% overlap, 0 unique content)
5. priceData coverage: universal 100% (text), brand/model only 1-2% (structured with min/max)
6. 982 DITA manual files with 607 topics per model -- high diagnostic value but unused
7. 708 parts-catalog files but 0% have prices, 97% have part numbers
8. 32 platforms connect 115+ models for knowledge sharing
9. Taxonomy mismatch: hierarchy uses system names, situations use category+layers -- no mapping table
10. 298 recall campaigns with severity/system but NO VIN ranges

## What's Already Implemented

- Knowledge base with 4-level resolver
- 298 recall campaigns
- Vehicle profile with LTFT corrections

## What's NOT Implemented but SHOULD Be

### 1. Separate manual_warning from diagnostic situations (P0)
**Problem:** ~95% of brand-only content is manual_warning (service manual excerpts), not diagnostic situations. They pollute search results and inflate situation counts.
**Approach:**
  - Add `type` field to all situations: `diagnostic` vs `manual_reference`
  - Filter manual_warnings out of diagnostic matching
  - Show manual_warnings only in "Manual reference" section of UI
  - Brand-only truly diagnostic: review_mining (~10), autoresearch (~19), swarm_agent (~12) per brand
**Files to modify:** Situation resolver to filter by type, brand situation files to tag
**Priority: P0** -- dramatically improves diagnostic precision

### 2. Structured priceData enrichment pipeline (P1)
**Problem:** Only 1-2% of brand/model situations have structured prices (min/max/items). Universal has 100% but text-only "3000-25000 руб".
**Approach:**
  - Phase 1: Parse universal priceRange text into structured format: extract min/max from "3000-25000 руб" pattern
  - Phase 2: For top-50 situations by merged_count, add itemized priceData from YouTube/forum data
  - Phase 3: Price indexing by region (Moscow vs regions)
**Files to create:** `scripts/parse_price_ranges.py`
**Priority: P1** -- users explicitly want cost estimates (CustDev insight)

### 3. DITA manual -> situation linking (P1)
**Problem:** 982 DITA manual files with full repair procedures exist but aren't linked to diagnostic situations.
**Approach:**
  - Match situation.layers -> DITA section.systems[]
  - For each diagnostic result, find relevant DITA topics
  - Expose as "Procedure from manual" button in diagnostic UI
  - Start with top 3 brands: BMW, Chery, Hyundai (most complete manuals)
**Files to create:** `diagnostic_engine/resolvers/manual_linker.py`
**Example:** Situation "Air filter replacement" -> DITA topic `chery_tiggo_8_pro_engine_t000_b6c66ad2` with full step-by-step text
**Priority: P1**

### 4. Platform sibling fallback for sparse models (P1)
**Problem:** New Chinese models may have <10 situations. Platform-sharing.json links models that share components.
**Approach:**
  - When model has fewer than 10 matched situations
  - Look up platform siblings from platform-sharing.json
  - Pull their situations with confidence_weight = 0.5
  - Tag as "Based on shared platform with {sibling_model}"
  - Rule: same platform + same system domain = ~80% problem overlap (chassis/body/electrical)
  - Exception: powertrain may differ -- skip powertrain situations from siblings
**Files to create:** `diagnostic_engine/resolvers/platform_fallback.py`
**Priority: P1**

### 5. Recall cross-reference during diagnostics (P1)
**Problem:** Recalls exist but aren't shown when diagnosing related systems.
**Approach:** When diagnostic finds DTC in system X for brand/model/year, check recalls where system matches. Show: "Known recall: {title_ru} ({severity}, {count} vehicles affected)".
**Files to modify:** Diagnostic result builder
**Priority: P1**

### 6. Parts catalog OEM number lookup (P2)
**Problem:** 708 parts-catalog files with 97% part_number coverage but no prices. Still useful for OEM part identification.
**Approach:** When diagnostic recommends component replacement, look up OEM part number from parts-catalog. Display: "OEM Part: {part_number}. Search on autodoc.ru/exist.ru for pricing."
**Priority: P2** -- useful but not critical for MVP

### 7. Flatten hierarchy: remove model/generation files (P2)
**Problem:** Per research #23, model files are pure subsets of brand (0 unique content), generation adds only manual_warnings.
**Approach:** Instead of storing 983 situation files:
  - Keep universal + brand situations only
  - Use `models` field in brand situations for model filtering
  - Move manual_warnings to separate `brands/{brand}/manual-warnings/` directory
  - Save ~400MB disk and eliminate duplication bugs
**Priority: P2** -- architecture improvement, not user-facing
