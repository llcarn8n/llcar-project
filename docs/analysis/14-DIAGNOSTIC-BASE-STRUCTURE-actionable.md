# 14-DIAGNOSTIC-BASE-STRUCTURE: Actionable Analysis

## Key Findings

1. Knowledge Base: 288 GB, 58 brands, 999 models, 1061 directories
2. 3 hierarchy templates (ICE/BEV/PHEV) with 5 domains, 22 systems each
3. 25 base diagnostic situations covering P0-P2 priorities
4. 31 platform-sharing entries linking 115+ models across 25 brands
5. 553 WMI codes for VIN brand/country identification
6. BEV hierarchy has a bug: `template: "ice"` instead of `template: "bev"`, name fields inconsistent
7. PHEV hierarchy is a direct copy of ICE -- missing electric/battery systems entirely
8. searchQueries in situations_base.json hardcoded for Chery Tiggo only
9. facts_ru and sources arrays always empty in base situations
10. layers/system mapping inconsistency: `transmission_issue` points to `engine` instead of `transmission`

## What's Already Implemented

- 110 diagnostic rules (JSON + Python)
- Health Score v2 weighted algorithm
- Knowledge base with 4-level resolver (universal > brand > model > generation)
- Vehicle profile with LTFT corrections
- 298 recall campaigns integrated

## What's NOT Implemented but SHOULD Be

### 1. Fix PHEV hierarchy template (P0)
**Problem:** PHEV hierarchy is a copy of ICE, missing battery_pack, electric_motor, charging, regenerative_braking systems.
**Files to modify:** `common files all models/hierarchy_phev.json`
**Approach:** Merge ICE powertrain (engine, fuel_system, transmission, exhaust, cooling) with BEV additions (electric_motor, battery_pack, charging). 7 systems in powertrain domain instead of 5.
**Priority: P0** -- affects all PHEV/EREV vehicle diagnostics (Li Auto L7 is the primary test car!)

### 2. Fix BEV hierarchy naming bug (P0)
**Problem:** `template: "ice"` in BEV file, names duplicated with wrong values in `name.ru/en` vs `name_ru/name_en`.
**Files to modify:** `common files all models/hierarchy_bev.json`
**Approach:** Set template to "bev", normalize all system names to use `name.ru/en` consistently, remove duplicate `name_ru/name_en` fields.
**Priority: P0**

### 3. Category-to-hierarchy system mapping table (P0)
**Problem:** Situations use `category` + `layers`, hierarchy uses `system_id` -- no mapping exists.
**Files to create:** `diagnostic_engine/mappings/category_to_system.json`
**Approach:** Create a mapping table:
```
brakes -> chassis.brakes
engine -> powertrain.engine
chassis -> chassis.suspension / chassis.steering / chassis.wheels_tires
electrical -> electronics.electrical
hvac -> cabin.hvac
infotainment -> cabin.infotainment
lighting -> electronics.lighting
body -> body.body_structure / body.closures
sensors -> electronics.sensors
drivetrain -> powertrain.transmission
fuel -> powertrain.fuel_system
cooling -> powertrain.cooling
```
**Priority: P0** -- needed for UI system grouping and DTC routing

### 4. Fix transmission_issue layers (P1)
**Problem:** `transmission_issue` situation references `engine` layer instead of `drivetrain`/`transmission`.
**Files to modify:** `common files all models/situations_base.json` (item #4 in array)
**Priority: P1**

### 5. Generate brand-agnostic searchQueries (P1)
**Problem:** All 25 base situations have Chery-specific search queries.
**Files to modify:** `common files all models/situations_base.json`
**Approach:** Replace "Chery Tiggo" with "{brand} {model}" placeholder pattern, or generate generic queries like "check engine light causes", "brake vibration diagnosis".
**Priority: P1**

### 6. Platform-sharing fallback resolver (P1)
**Problem:** 32 platforms exist in data but no code uses them for diagnostic fallback.
**Files to create:** `diagnostic_engine/resolvers/platform_fallback.py`
**Approach:** When a model has fewer than 10 situations, query platform-sharing.json for sibling models, pull their situations with a "platform confidence" flag (0.5 weight).
**Priority: P1** -- valuable for new Chinese models with sparse data

### 7. Populate facts_ru in base situations (P2)
**Problem:** All 25 base situations have empty facts_ru arrays.
**Approach:** Pull top-3 most-cited facts from matched universal situations per category.
**Priority: P2**

### 8. DITA manual linking (P2)
**Problem:** 982 DITA manual files exist but no code links diagnostic results to manual sections.
**Files to create:** `diagnostic_engine/resolvers/manual_linker.py`
**Approach:** Match situation.layers to DITA section.systems[], return relevant topic IDs for "Read more in manual" button.
**Priority: P2** -- high value but needs UI work
