# 20-ARCHITECTURE-REVIEW: Actionable Analysis

## Key Findings

1. Current anomaly_engine.py is a scoring prototype (z-score + CUSUM + persistence) -- no awareness of vehicle type, modifications, or weather
2. No LTFT/STFT interpretation in the engine -- the #1 diagnostic parameter for ICE is completely absent
3. No intermediate "Fact" layer between raw data and rules -- limits scalability
4. Current DiagnosticRule is a simple threshold checker, cannot express multi-parameter correlations, context requirements, or multi-DTC logic
5. accel<->audio correlation = 0 -- engines work completely independently
6. No Vehicle Profile concept -- blocks LTFT corrections for LPG/Euro2/Japanese/GM specifics
7. No temporal patterns: cold start vs warm engine, season, trip duration
8. No multi-DTC correlation logic (P0171+P0174 = air leak)
9. No severity escalation over time (week 1 warning -> week 2 problem -> week 3 urgent)
10. Welford baselines lack persistence, cold-start handling, and degradation stagnation protection
11. False positive prevention missing: cooldown per rule, minimum trigger count, regime stability filter, data quality gate
12. Freeze Frame (Mode 02) not used for DTC context analysis

## What's Already Implemented

- Anomaly engine with z-score + CUSUM + persistence scoring
- 110 diagnostic rules
- Health Score v2 (weighted)
- Fuel trim analyzer (8 levels, 5 corrections)
- Correlation engine (5 batch correlations)
- CUSUM trend detection
- Escalation manager (4 levels)
- DTC events with freeze frame

## What's NOT Implemented but SHOULD Be

### 1. Vehicle Profile dataclass (P0)
**Problem:** Engine doesn't know which car is being diagnosed. Blocks LTFT corrections, reference values, brand-specific diagnostics.
**Approach:** Create and wire into all analyzers:
```python
@dataclass
class VehicleProfile:
    vin: Optional[str]
    brand: str
    model: str
    generation: Optional[str]
    year: int
    engine_type: str  # 'ice', 'phev', 'bev'
    mileage_km: int
    modifications: Dict  # {'lpg': True, 'euro2_removed_cat': True, 'chip_tuned': False}
    platform: Optional[str]  # from platform-sharing.json
    power_hp: Optional[float]  # from vehicles-ru.json
    fuel_consumption_ref: Optional[float]
    curb_weight_kg: Optional[float]
```
**Files to modify:** `anomaly_engine.py`, create `diagnostic_engine/models/vehicle_profile.py`
**Priority: P0** -- THE #1 blocker. Without this, LTFT analyzer corrections are impossible.

### 2. Typed Facts intermediate layer (P0)
**Problem:** Data flows directly from raw features to rules with no structured intermediate representation. Can't log, audit, or compose diagnostic reasoning.
**Approach:** Create typed facts with 3 categories:
```python
@dataclass
class Fact:
    type: str           # 'LTFT_HIGH', 'VIBRATION_ANOMALY', 'DTC_ACTIVE'
    value: Any
    severity: str       # 'normal', 'borderline', 'problem', 'critical'
    context: Dict       # {'regime': 'idle', 'engine_warm': True}
    timestamp: datetime
    confidence: float   # 0.0-1.0

# Categories:
# Instant facts: single observation (DTC, threshold breach)
# Trend facts: multiple observations (CUSUM alarm, degradation)
# Correlation facts: multiple sensors (accel<->audio, freq<->RPM)
```
**Files to create:** `diagnostic_engine/models/facts.py`
**Pipeline becomes:** Raw Data -> Normalizer -> Feature Extractor -> **Fact Generator -> Fact Store** -> Rule Engine -> Diagnosis Builder
**Priority: P0** -- foundation for scaling to 500+ rules

### 3. LTFT/STFT Analyzer as dedicated subsystem (P0)
**Problem:** LTFT/STFT is the most important ICE diagnostic parameter. Currently not used in anomaly_engine.py at all. Already have fuel trim analyzer with 8 levels and 5 corrections -- but it needs integration with the fact/rule pipeline.
**What to add:**
  - EngineContext awareness: warm engine (coolant > 80C), regime (idle vs 2000 RPM)
  - Vehicle Profile corrections: LPG (+50% tolerance), Euro2 removed cat (-7.5% offset), Japanese brands (-30% tolerance), GM platforms (+30% tolerance)
  - Cross-diagnosis: LTFT+STFT same sign = mixture issue, different sign = control system issue
  - Link to free diagnostic tests (unique value proposition from CustDev)
**Files to modify:** Integrate existing fuel_trim_analyzer with Vehicle Profile and Fact pipeline
**Priority: P0**

### 4. Engine Context (temporal patterns) (P1)
**Problem:** No awareness of cold start vs warm engine, trip duration, season.
**Approach:**
```python
@dataclass
class EngineContext:
    warm: bool              # coolant > 80C
    minutes_running: float
    ambient_temp: Optional[float]
    altitude: Optional[float]
    regime: str             # 'cold_start', 'warmup', 'idle', 'city', 'highway'
```
**Why it matters:** DTC P0171 during cold start with coolant=30C = normal. Same DTC at highway with coolant=90C = real problem. Without context, every cold-start enrichment triggers false positive.
**Files to create:** `diagnostic_engine/models/engine_context.py`
**Priority: P1** -- key to reducing false positives

### 5. False positive prevention (4 mechanisms) (P1)
**Problem:** No anti-spam, no minimum trigger count, no regime stability check, no data quality gate.
**Approach:** Add to rule engine:
  1. **Cooldown per rule per client:** If dismissed, don't show for 7 days
  2. **Minimum trigger count:** Rule must fire N consecutive times before alerting (configurable per rule, default 3)
  3. **Regime stability filter:** Don't diagnose during transient regimes (acceleration, deceleration)
  4. **Data quality gate:** If data is noisy (high variance, missing values), show "insufficient data" instead of diagnosis
**Files to modify:** `anomaly_engine.py`, `diagnostic_engine/rule_engine.py`
**Priority: P1** -- false positives = trust killer

### 6. Rule engine extension for complex conditions (P1)
**Problem:** Current DiagnosticRule can only do simple threshold checks. Cannot express:
  - "LTFT > 10% AND STFT < -5% on same bank"
  - "Vibration Z increases with RPM"
  - "P0171 + P0174 simultaneously"
  - "Only when warm > 80C and running > 10 minutes"
**Approach:** Hybrid A+B from research: Keep Python classes for complex rules (correlations, trends), add JSON rule interpreter for simple threshold rules (majority). Single evaluation interface.
**Files to modify:** `diagnostic_engine/rule_engine.py`
**Priority: P1**

### 7. Batch correlation engine: accel<->audio (P1)
**Problem:** Currently 0 correlation between accelerometer and audio data.
**Top correlations to implement:**
  1. vibration_z ~ f(RPM) -> engine mount deterioration (P0)
  2. audio_freq ~ f(wheel_speed) -> wheel bearing (P0)
  3. vibration_y + audio_click during turn -> CV joint (P1)
  4. vibration_z ~ f(speed) at speed > 80 -> wheel balance (P1)
  5. audio > 200Hz + vibration -> alternator/compressor bearing (P2)
**Approach:** Batch computation (not real-time). Minimum 50-100 data points per regime. Join by time with +/-2-3 sec tolerance.
**Files to create:** `diagnostic_engine/correlation/accel_audio.py`
**SQL:** Add `correlation_results` table
**Priority: P1** -- competitive advantage, already have data from app

### 8. Severity escalation over time (P1)
**Problem:** A warning that persists for weeks should escalate automatically.
**Approach:** Track first_triggered timestamp per diagnostic finding. Escalation rules:
  - Week 1: warning stays warning
  - Week 2: warning -> problem
  - Week 3+: problem -> urgent
  - User dismissed -> reset cooldown, not escalation counter
**Files to modify:** `diagnostic_persistence` table, escalation_manager.py
**Priority: P1**

### 9. Freeze Frame context analysis (P2)
**Problem:** Freeze frame data is stored but not used for DTC interpretation.
**Approach:** When DTC appears, check freeze frame: RPM, load, coolant temp, speed. Use to distinguish:
  - P0171 at idle + warm = real lean issue
  - P0171 at cold start + low coolant = normal cold enrichment
  - P0300 at high RPM + high load = fuel starvation
  - P0300 at idle + warm = ignition issue
**Priority: P2**

### 10. Welford baseline improvements (P2)
**Problem:** No persistence (lost on restart), no cold start handling, baseline drifts with degradation.
**Approach:**
  - Persist baselines to DB (schema exists but not wired)
  - Mark confidence level: <0.3 = generic priors, 0.3-0.7 = preliminary, >0.7 = personalized
  - MAX_BASELINE_WINDOW = 500 to prevent degradation masking
  - Show user: "Drive 5 more trips for accurate diagnostics"
**Priority: P2**

### 11. Readiness Monitors (Mode 01 PID 01) (P2)
**Problem:** ECU readiness monitors not checked. If monitor "not ready", can't confirm system OK.
**Approach:** Read readiness bitfield, display: "Catalyst monitor: not complete (drive 50 more km)". Don't show "system OK" for incomplete monitors.
**Priority: P2**
