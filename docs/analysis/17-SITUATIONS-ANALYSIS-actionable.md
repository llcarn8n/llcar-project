# 17-SITUATIONS-ANALYSIS: Actionable Analysis

## Key Findings

1. 4-level hierarchy: universal (764) -> brand (36,301) -> model (415,258) -> generation (30,785) = 483,108 total
2. 94% of situations mention OBD-II parameters, 63% mention audio symptoms, 32% mention vibration/accelerometer
3. 50% of situations are fully automatable (OBD data + concrete thresholds)
4. 382 situations contain specific numerical thresholds (temperature, pressure, voltage, percentage)
5. Only 6 of 764 universal situations have DTC codes in the dtc_codes field
6. 25 base situations serve as UI categories (containers), not diagnostic results
7. Top 10 situations by verification: oil consumption (289 merged), water leak (170), fuel consumption (148)
8. Rule format proposed with triggers, confidence, corrections, hierarchy_override
9. 7 trigger types defined: DTC_PRESENT, PID_THRESHOLD, PID_RATE_OF_CHANGE, ACCEL_PATTERN, AUDIO_PATTERN, CORRELATION, TIME_CONDITION
10. 3-stage DTC mapping strategy: text extraction -> semantic matching -> expert verification

## What's Already Implemented

- 110 diagnostic rules (JSON + Python) -- roughly covers Waves 1-2 partially
- Health Score v2 (weighted)
- Fuel trim analyzer (8 levels)
- Correlation engine (5 batch correlations)
- CUSUM trend detection

## What's NOT Implemented but SHOULD Be

### 1. Extract numerical thresholds from 382 situations into machine-readable rules (P0)
**Problem:** 382 situations contain concrete thresholds in text form ("LTFT > 10%", "coolant > 105C"), but these aren't extracted into rule conditions.
**Approach:** Write a parser script to extract:
  - Temperature thresholds (128 situations): `X C` or `X degrees`
  - Pressure thresholds (121 situations): `X bar`, `X kPa`, `X atm`
  - Percentage thresholds (35 situations): `> X%` or `< X%`
  - RPM thresholds (24 situations): `X RPM` or `X obmin`
  - Voltage thresholds (41 situations): `X V` or `X volt`
  - LTFT/STFT specific (19 situations)
Output: structured rule conditions ready for the rule engine.
**Files to create:** `scripts/extract_thresholds.py`, `diagnostic_engine/data/extracted_thresholds.json`
**Priority: P0** -- unlocks ~200 new rules automatically

### 2. Parent base_situation_id mapping for 764 universal situations (P0)
**Problem:** No link between 764 universal situations and 25 base situations (UI categories).
**Approach:** Map each universal situation to a parent base via category + keyword matching:
```
brake_spongy -> situations with category="brakes" (72)
engine_noise -> situations with category="engine" + keyword="check engine|шум|noise" (~50)
oil_consumption -> situations with category="engine" + keyword="масл|oil" (~30)
fuel_consumption -> situations with category="fuel" (23) + category="engine" + keyword="расход" (~15)
battery_12v -> situations with category="electrical" + keyword="12v|акк|battery" (~20)
strange_sounds -> situations with layers intersecting ["chassis","engine"] + keyword="звук|стук|скрип" (~50)
```
**Files to create:** `diagnostic_engine/mappings/base_situation_map.json`
**Priority: P0** -- needed for UI navigation

### 3. Wave 2 rules: OBD + Audio hybrid (P1)
**Problem:** 261 situations (34%) combine OBD + audio symptoms. Current rules don't use audio data with OBD.
**Top candidates:**
  - Oil consumption (maslozhor) -- OBD (oil level, LTFT) + audio (engine knock)
  - Engine won't start -- OBD (cranking RPM, fuel pressure) + audio (starter sound)
  - Long warmup / cold cabin -- OBD (coolant temp vs time)
  - Check Engine algorithm -- OBD (DTC codes) + situation matching
  - High fuel consumption -- OBD (LTFT + fuel flow rate)
**Approach:** Create 15 new rules for top situations by merged_count that combine data sources.
**Priority: P1**

### 4. Wave 3 rules: OBD + Accelerometer + Audio (P1)
**Problem:** 189 situations (25%) need all 3 data sources. No rules exist for these.
**Top candidates:**
  - Spongy/squeaking brakes (audio + accel + ABS data)
  - Suspension knocking (accel + audio pattern)
  - CVT/transmission jerking (accel + OBD RPM)
  - Steering pull/vibration (accel pattern at speed)
  - Strange sounds (audio pattern matching)
**Files to modify:** Add accel+audio trigger types to rule engine
**Priority: P1**

### 5. Situation hierarchy resolution in diagnostic result (P1)
**Problem:** When returning diagnostic results, need to resolve situation at most specific level available.
**Approach:** Implement 4-step resolution:
  1. Check generation-level situations (if generation known)
  2. Check model-level situations
  3. Check brand-level situations
  4. Fallback to universal
  Most specific level with matching situation_id wins. But per research #23, model and generation levels mostly duplicate brand -- so practically this is: brand-overlay on universal.
**Files to modify:** `diagnostic_engine/resolvers/situation_resolver.py`
**Priority: P1**

### 6. canDrive field normalization and UI integration (P2)
**Problem:** canDrive in situations is free-text ("ограниченно", "нет", "да, но..."), not structured.
**Approach:** Normalize to enum: `stop_immediately`, `limited_caution`, `yes_monitor`, `yes_safe`. Map existing 764 values. Display prominently in UI with color coding.
**Priority: P2**

### 7. Audio/Accel pattern signatures database (P2)
**Problem:** 480 situations mention sound symptoms, 245 mention vibration -- but no reference patterns exist for matching.
**Approach:** Start collecting labeled audio/accel samples from real diagnostics. Build pattern library incrementally.
**Priority: P2** -- long-term project, critical for competitive advantage
