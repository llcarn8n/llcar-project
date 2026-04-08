# 16-VEHICLES-RECALLS: Actionable Analysis

## Key Findings

1. vehicles-ru.json: 58 brands, 461 models, 966 generations, 7,436 trims with full specs
2. recalls-database.json: 298 campaigns, 46 brands, 1.84M affected vehicles, 2016-2026
3. 77% of trims have fuel consumption data (combined), 17% have CO2 emissions
4. Only 3% of trims have engine codes (229 out of 7,436)
5. `aspiration` field is chaotic: 50+ variants from "naturally_aspirated" to full BMW marketing text
6. No ECU addresses, no normative parameter values, no VIN patterns in vehicle data
7. Recalls have NO VIN ranges -- only brand/model/year matching possible
8. 57 EV/PHEV/HEV/EREV models covered with battery_kwh and range_km
9. 12 brands have no recall campaigns (mostly Chinese)
10. 38% of recalls are CRITICAL severity

## What's Already Implemented

- 298 recall campaigns in database
- Health Score v2 with weighted algorithm
- Vehicle profile with LTFT corrections (brand-level)

## What's NOT Implemented but SHOULD Be

### 1. Vehicle identification from OBD data (P0)
**Problem:** No automatic vehicle identification. User must manually select brand/model/year.
**Approach:** After VIN read (or manual entry), match against vehicles-ru.json:
  - WMI (positions 1-3) -> brand
  - Year code (position 10) -> year
  - Filter generations by year range (ys/ye)
  - Narrow by OBD fuel type (PID 0x51) -> petrol/diesel/EV
  - Narrow by displacement (estimated from MAF/RPM)
  - Present 1-3 candidates for user confirmation
**Files to create:** `diagnostic_engine/vehicle_identifier.py`
**Priority: P0** -- blocks vehicle-specific normalization

### 2. Reference parameter extraction for Health Score (P0)
**Problem:** Health Score uses generic thresholds, not vehicle-specific reference values.
**What vehicles-ru.json provides:**
  - `engine.power_hp` / `engine.torque_nm` -> compare with OBD calculated power
  - `performance.fuel_consumption_combined_l100km` -> deviation tracking
  - `dimensions.curb_weight_kg` -> accelerometer normalization
  - `dimensions.fuel_tank_l` -> remaining range calculation
  - `powertrain` type -> determine which sensors are available
**Files to modify:** `anomaly_engine.py` (add vehicle_spec parameter), Health Score calculation
**Approach:** Load vehicle spec after identification, pass to all analyzers:
```python
class VehicleSpec:
    power_hp: float
    torque_nm: float
    fuel_consumption_ref: float
    curb_weight_kg: float
    fuel_tank_l: float
    powertrain: str  # 'ice', 'phev', 'bev', 'hev', 'erev'
    transmission_type: str
```
**Priority: P0**

### 3. Recall matching API endpoint (P1)
**Problem:** Recalls exist in DB but no endpoint matches them to user's vehicle.
**Approach:** `GET /api/recalls/{brand}/{model}?year=YYYY` returns filtered, severity-sorted recalls.
**Algorithm:**
  1. Exact brand match
  2. Fuzzy model match (models[] array contains various spellings)
  3. Year range check (parse "2014-2019" format)
  4. Sort by severity: critical > high > medium > low
**Files to create:** Add to existing Django API views
**Priority: P1**

### 4. Recall-triggered warnings in diagnostics (P1)
**Problem:** When a DTC system matches a recall system for the user's model, no cross-reference shown.
**Approach:** During diagnosis, if DTC `system_id` matches any recall `system` for user's brand/model/year, display: "Known recall campaign for this system: {title_ru}".
**Files to modify:** diagnostic result builder, dashboard UI
**Priority: P1**

### 5. Aspiration field normalization (P1)
**Problem:** 50+ different values for aspiration field, from structured to marketing text.
**Approach:** Normalize to enum: `na`, `turbo`, `twin_turbo`, `supercharged`, `electric`, `hybrid`. Script to bulk-update vehicles-ru.json.
**Files to create:** `scripts/normalize_aspiration.py`
**Priority: P1** -- needed for accurate engine profile

### 6. Drivetrain normalization (P2)
**Problem:** AWD/4wd/awd/4WD used inconsistently.
**Approach:** Normalize to: `fwd`, `rwd`, `awd`, `4wd`. Script to bulk-update.
**Priority: P2**

### 7. ECU address mapping by model (P2)
**Problem:** No OBD-II PID -> ECU mapping per model. Critical for multi-ECU diagnostics.
**Approach:** Start with known vehicles (Li Auto L7 -- 7 ECUs confirmed). Build incrementally via crowdsourcing from app users.
**Files to create:** `diagnostic_engine/data/ecu_map.json`
**Priority: P2** -- high value but high effort

### 8. Normative parameter values per model (P2)
**Problem:** No reference values for idle RPM, oil pressure, coolant temp per model.
**Approach:** Start with generic ranges:
  - Idle RPM: 600-900 (ICE), 0 (BEV)
  - Coolant temp: 85-95C
  - Oil pressure: 1.5-4.5 bar at idle
  - Voltage: 13.8-14.4V (engine running)
  Then override per brand/model from forum data (drive2.ru/drom.ru).
**Priority: P2**

### 9. VIN-level recall check via gazbuka.ru API (P2)
**Problem:** Current recalls only match brand/model/year, not specific VIN.
**Approach:** Integrate gazbuka.ru VIN check API for precise recall matching.
**Priority: P2** -- depends on API availability/terms
