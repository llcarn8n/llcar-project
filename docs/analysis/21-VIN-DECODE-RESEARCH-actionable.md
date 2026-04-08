# 21-VIN-DECODE-RESEARCH: Actionable Analysis

## Key Findings

1. VIN structure: WMI (1-3) is standardized, VDS (4-8) is brand-specific, Year code (10) is standardized
2. 553 WMI codes in database -- covers all 58 brands
3. NHTSA API is free but FAILS for all Chinese and EU-market VINs -- only US-market works (~15-20% of Russian market)
4. No free API guarantees Chinese brand coverage
5. WMI alone is ambiguous: Tank/Haval share LGW, Zeekr/Geely share L6T, Exeed/Jetour/Omoda share Chery WMI
6. WMI + Year only narrows to 4+ candidates for 96.6% of generations
7. WMI + Year + Fuel + Body + Displacement narrows to 1 candidate for 1,039 of 2,097 records
8. Remaining 757 ambiguous cases: different models with identical specs (Audi A1 vs A3, BMW 1 vs 6, Hyundai Accent vs Elantra)
9. VDS tables documented for Japanese/Korean/German/American brands, but NOT for Chinese brands
10. Calibration ID (PID 09/04) is the most valuable OBD signal for identification -- unique per ECU firmware
11. Crowdsourcing CalID -> model mapping would give 100% identification for ANY brand
12. Chinese brands: VDS is undocumented, requires reverse-engineering from VIN samples

## What's Already Implemented

- VIN reading via OBD Mode 09 PID 02 (Android full implementation, iOS basic)
- WMI database with 553 codes
- Year code decoding
- VIN check digit validation data (translitMap + translitWeights)
- vehicles-ru.json with 7,436 trims and specs for matching

## What's NOT Implemented but SHOULD Be

### 1. Multi-level VIN decoder (P0)
**Problem:** VIN is read but not decoded beyond storage. No automatic vehicle identification.
**Approach:** 4-level decode pipeline:

**Level 1 (offline, instant):**
  - WMI -> brand (wmi-database.json)
  - Position 10 -> year
  - VDS position 4 -> model line (for brands with known VDS tables)
  - Filter vehicles-ru.json by brand + year -> candidate list

**Level 2 (OBD signals, ~5 sec):**
  - PID 0x51 -> fuel type (gas/diesel/EV/hybrid)
  - PID 0x00 -> supported PIDs fingerprint
  - PID 09/04 -> Calibration ID
  - MAF/MAP + RPM -> estimated displacement (+/- 200cc)
  - Intersect with Level 1 candidates

**Level 3 (API fallback, if online):**
  - NHTSA API for US-market VINs (WMI 1-5)
  - Cache results locally

**Level 4 (crowdsource):**
  - On first connection: ask user to confirm/select model from candidates
  - Save mapping: VDS + CalID -> confirmed model
  - Over time: auto-identify without asking

**Files to create:** `diagnostic_engine/vin_decoder.py`, `diagnostic_engine/data/vds_tables.json`
**Priority: P0** -- blocks Vehicle Profile, which blocks all vehicle-specific diagnostics

### 2. VDS tables for top-10 brands (P0)
**Problem:** VDS (positions 4-8) encodes model/engine/body but is brand-specific and undocumented for Chinese brands.
**Approach:** Create VDS tables in priority order:

**Phase 1 (documented, from Wikibooks/NHTSA):**
  - Toyota/Lexus: pos 8 = model (K=Camry, V=RAV4, U=Prius)
  - Hyundai/Kia: pos 4 = model line (D=Elantra, P=Sportage)
  - BMW: pos 4 = series, pos 5 = body
  - Mercedes: pos 4 = series, pos 5 = body
  - VW/Audi/Skoda: pos 4-5 = model code
  - Nissan/Honda: documented via NHTSA
  - Ford/GM: documented via NHTSA

**Phase 2 (reverse-engineer from VIN samples):**
  - Chery/Omoda/Jaecoo: pos 4 likely = model (D=Tiggo 7, F=Tiggo 8)
  - Haval/Tank: pos 4 = brand line (F=Haval, B=Wey)
  - Geely/Zeekr, BYD, Changan, Li Auto: need VIN sample collection

**Format:**
```json
{
  "toyota": {
    "wmi_codes": ["JT*", "4T*"],
    "positions": {
      "4": {"type": "body_drive", "values": {"B": {"body": "sedan", "drive": "2wd"}}},
      "8": {"type": "model", "values": {"K": "Camry", "V": "RAV4"}}
    }
  }
}
```
**Files to create:** `diagnostic_engine/data/vds_tables.json`
**Priority: P0**

### 3. OBD-based displacement estimation (P1)
**Problem:** No standard PID for engine displacement, but it can be calculated from MAF + RPM.
**Approach:**
```python
def estimate_displacement(maf_max, rpm_max, ve=0.85, air_density=1.184):
    """Estimate engine displacement from MAF sensor data.
    Accuracy: +/- 200cc (sufficient for our 400cc+ differences)."""
    return (maf_max * 60) / (rpm_max * ve * air_density)
```
Collect MAF peak values during first few drives, compute estimate.
**Files to create:** Add to `diagnostic_engine/vin_decoder.py`
**Priority: P1** -- significantly narrows candidate list

### 4. Calibration ID database (crowdsourced) (P1)
**Problem:** CalID uniquely identifies ECU firmware -> engine/model, but no mapping database exists.
**Approach:**
  - Read CalID (0904) and CVN (0906) during first connection
  - Store with confirmed brand/model/year in DB
  - After N users confirm same CalID = same model, mark as "verified"
  - Start matching CalID prefix patterns per brand
**Files to create:** `diagnostic_engine/data/cal_id_database.json`, API endpoint to submit/query
**Table:** `calibration_ids(cal_id TEXT, brand TEXT, model TEXT, year INT, confirmed_count INT)`
**Priority: P1** -- becomes more valuable with user growth

### 5. VIN check digit validation (P1)
**Problem:** translitMap and translitWeights exist in wmi-database.json but no validation code.
**Approach:**
```python
def validate_vin_check_digit(vin: str) -> bool:
    """Validate position 9 check digit (mandatory for North American VINs)."""
    # Sum of (char_value * positional_weight) mod 11 = check digit
    # For Chinese VINs (L prefix), position 9 is NOT a check digit
    if vin[0] == 'L':
        return True  # Skip validation for Chinese VINs
    ...
```
**Priority: P1**

### 6. Sub-brand resolution for shared WMI (P1)
**Problem:** Tank/Haval share LGW, Zeekr/Geely share L6T, Exeed/Jetour/Omoda share Chery WMI codes.
**Approach:** Use `brands` field in WMI database + VDS position to disambiguate. For LGW: pos 4 = F(Haval), B(Wey), C(Ora/GWM EV), E(Pickup). Need VDS table.
**Priority: P1** -- affects 25% of new car sales in Russia

### 7. NHTSA API integration as fallback (P2)
**Problem:** Works only for US-market VINs but is free and detailed.
**Approach:** For VINs with WMI starting with 1-5 (North America), call NHTSA DecodeVinValues endpoint. Cache results. Returns: Make, Model, Year, Engine details, Body class.
**Priority: P2** -- only ~15-20% of Russian market, but zero cost

### 8. UDS VIN fallback (22 F190) (P2)
**Problem:** ~20% of vehicles don't support Mode 09 PID 02 (especially BEVs and pre-2017 China models).
**Approach:** If Mode 09 fails, try UDS command `22 F190` (ReadDataByIdentifier, DID F190 = VIN). Works on many modern ECUs.
**Priority: P2** -- +10-15% vehicle coverage
