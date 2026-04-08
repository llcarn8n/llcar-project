# 18-DTC-HIERARCHY-ANALYSIS: Actionable Analysis

## Key Findings

1. Two dtc-index.json files (common/ and export/) are IDENTICAL -- only one source needed
2. Brand-level DTC adds: note_ru, common_fix_ru, frequency, severity_override, fix_strategy, powertrain_filter, models
3. Generation-level DTC is identical to model-level and brand-level (no unique content)
4. Top enriched brands: Audi (6,216), VW (6,155), BMW (5,773), Porsche (2,221)
5. P013A missing from universal index but exists in brand-level for Audi/BMW/VW
6. 6 YouTube DTC codes have ZERO situation mappings: P013A, P0422, P2096, P0138, P0036, P2192
7. Only 300 of 36,102 DTC codes (0.8%) have any situation mappings
8. P0171 (lean) mapped to 520 situations across 39 different titles in 6 categories -- overly diffuse
9. system_id has 36 unique values with overlaps: engine/ignition/intake/fuel/emission/exhaust
10. Severity inconsistencies: P0171/P0172 rated "info" (should be "warning"), P0300 rated "urgent" but can_drive "yes_caution" (contradicts)

## What's Already Implemented

- DTC events with freeze frame storage
- 110 diagnostic rules
- Knowledge base 4-level resolver
- Correlation engine

## What's NOT Implemented but SHOULD Be

### 1. Add missing P013A to universal dtc-index (P0)
**Problem:** P013A (O2 Sensor Slow Response Rich-to-Lean B1S2) exists in brand-level but missing from universal.
**Files to modify:** `common files all models/dtc-index.json`
**Approach:** Add entry:
```json
"P013A": {
  "severity": "warning",
  "title_ru": "Медленный отклик кислородного датчика (обеднение-обогащение, Банк 1, Сенсор 2)",
  "system_id": "emission",
  "can_drive": "yes_caution"
}
```
Also scan for other brand-level codes missing from universal.
**Priority: P0**

### 2. DTC range-to-category mapping table (P0)
**Problem:** No structured mapping from DTC code ranges to diagnostic categories.
**Approach:** Create ~50-entry table based on SAE J2012:
```json
{
  "P0100-P0199": {"category": "sensors", "subcategory": "MAF/MAP/IAT/O2", "situations_category": "engine"},
  "P0200-P0299": {"category": "fuel_delivery", "subcategory": "injectors", "situations_category": "fuel"},
  "P0300-P0399": {"category": "ignition", "subcategory": "misfire", "situations_category": "engine"},
  "P0400-P0499": {"category": "emissions", "subcategory": "EGR/EVAP", "situations_category": "engine"},
  "P0500-P0599": {"category": "speed_idle", "situations_category": "engine"},
  "P0600-P0699": {"category": "ecu", "situations_category": "electrical"},
  "P0700-P0799": {"category": "transmission", "situations_category": "drivetrain"},
  "C0000-C0999": {"category": "chassis", "situations_category": "brakes"},
  "B0000-B0999": {"category": "body", "situations_category": "electrical"},
  "U0000-U0999": {"category": "network", "situations_category": "electrical"}
}
```
**Files to create:** `diagnostic_engine/data/dtc_range_categories.json`
**Priority: P0**

### 3. Fix severity inconsistencies for top-100 DTC codes (P0)
**Problem:** P0171/P0172 (lean/rich mixture) rated "info" -- should be "warning" minimum. P0300 rated "urgent" with can_drive "yes_caution" -- contradictory.
**Approach:** Review and fix top-100 most common P-codes. Rules:
  - critical/urgent + can_drive must be "no_stop" or "no_danger"
  - warning + can_drive = "yes_caution" is consistent
  - Fuel trim codes (P0171/P0172/P0174/P0175) should be "warning"
**Files to modify:** `common files all models/dtc-index.json`
**Priority: P0**

### 4. Normalize system_id to 10-12 categories (P1)
**Problem:** 36 unique system_id values with confusing overlaps.
**Approach:** Normalize to:
  - `engine` (absorb ignition, intake, fuel, emission, exhaust)
  - `ev` (absorb power-electronics, charging, battery-management)
  - `drivetrain` (transmission, drivetrain)
  - `brakes` (absorb brake-control)
  - `body` (absorb body-electrical, interior, comfort)
  - `sensors` (safety, airbag sensors)
  - `hvac` (absorb climate)
  - `chassis` (absorb suspension, steering)
  - `electrical` (absorb controller, display, audio, pump)
  - `infotainment`
  - `lighting`
  - `cooling`
**Files to modify:** `common files all models/dtc-index.json`, add migration script
**Priority: P1**

### 5. Curated multi-DTC correlation patterns (P1)
**Problem:** No multi-DTC pattern matching. P0171+P0174 together = intake air leak, but system doesn't know this.
**Approach:** Create correlation table for top-50 DTC combinations:
```json
{
  "patterns": [
    {"codes": ["P0171", "P0174"], "diagnosis": "Intake air leak (both banks)", "confidence_boost": 0.3, "situation_ids": ["fuel_lean_bank1"]},
    {"codes": ["P0300", "P0301", "P0302"], "diagnosis": "Ignition coil pack failure", "confidence_boost": 0.25},
    {"codes": ["P0171", "P0300"], "diagnosis": "Lean mixture causing misfires", "confidence_boost": 0.2},
    {"codes": ["P0420", "P0430"], "diagnosis": "Bad fuel quality or catalyst aging", "confidence_boost": 0.15}
  ]
}
```
**Files to create:** `diagnostic_engine/data/dtc_patterns.json`
**Priority: P1**

### 6. Create situations for 6 unmapped YouTube DTC codes (P1)
**Problem:** P013A, P0422, P2096, P0138, P0036, P2192 have zero situation mappings.
**Approach:** Create universal situations for each:
  - P013A: "Slow O2 sensor response" -> causes, diagnosis, cost
  - P0422: "Catalyst efficiency below threshold" (similar to P0420)
  - P2096: "Post-catalyst fuel trim lean" -> secondary cat issue
  - P0138: "O2 sensor high voltage" -> sensor fault or rich condition
  - P0036: "O2 heater circuit" -> heater relay/fuse/wiring
  - P2192: "System too rich" -> similar to P0172 but OBD-II extended
**Priority: P1**

### 7. Delta-only storage for generation DTC (P2)
**Problem:** Generation DTC files are 100% duplicates of brand-level (verified on BMW/Chery/Toyota).
**Approach:** Store only delta (severity_override, note_ru, common_fix_ru) at generation level, inherit everything else from brand. Saves ~90% storage and eliminates sync issues.
**Priority: P2** -- optimization, not blocking
