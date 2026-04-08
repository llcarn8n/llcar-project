# Engine Design Gaps: Designed vs Implemented

**Date:** 2026-04-08
**Source:** 9 engine-design specs vs 20 implementation files

---

## Spec 01: Architecture Overview

### Built
- Pipeline: Raw -> Normalizer -> Feature Extractor -> Fact Generator -> Rule Engine -> Diagnosis Builder
- Rule Engine (3 subsystems): FuelTrim Analyzer, Threshold Rules (103 JSON), Complex Rules (7 Python)
- Knowledge Base (4-level resolver)
- ML-Ready: Welford baselines with MAX_WINDOW=500, features_json persisted
- CUSUM (single timescale implemented)
- Severity Escalation (notice -> warning -> problem -> urgent)
- Data Tiers T1/T2/T3

### GAPS

#### GAP-A1: Batch Jobs (Cron) Not Automated
- **Designed:** 3 cron jobs: (1) correlation engine per trip, (2) baseline aggregation (population priors update), (3) recall matching (new recalls -> affected clients)
- **Built:** correlation_runner.py exists but must be called manually from Django shell. No cron schedule. No baseline aggregation job. No recall matching job.
- **Plan:** Create Django management commands for all 3 jobs. Set up cron via systemd timer or celery-beat. Population priors aggregation = SQL query grouping baselines by platform/brand -> update global thresholds.
- **Complexity:** Medium (2-3 days)
- **Priority:** P1 -- correlations and population priors are critical for accuracy

#### GAP-A2: CUSUM 3 Timescales
- **Designed:** CUSUM with 3 timescales: short (k=3, h=10), medium (k=5, h=15), long (k=8, h=25). DB columns: cusum_short, cusum_medium, cusum_long, degradation_detected, trend_per_day.
- **Built:** CUSUMDetector with single timescale (k=3, h=10). anomaly_scores table has cusum columns but they are never written (all default 0). No degradation_detected or trend_per_day written.
- **Plan:** (1) Add medium/long CUSUMDetectors. (2) In write_anomaly_scores(), compute and store all 3 cusum values. (3) Set degradation_detected = True if any cusum triggers. (4) Compute trend_per_day via linear regression on last 7 scores.
- **Complexity:** Low (1 day)
- **Priority:** P1 -- trend detection is a core selling point

#### GAP-A3: PDF Report Generation
- **Designed:** 3 output formats: App (JSON -> native UI), Dashboard (JSON -> React), PDF for STO (formal report with VIN, mileage, health scores, diagnoses).
- **Built:** Only JSON output. No PDF generation.
- **Plan:** Use WeasyPrint or reportlab. Template: VIN + mileage + date -> health scores table -> diagnoses list with evidence -> recommendations. Expose via GET /api/v2/report/pdf/?client_hash=X.
- **Complexity:** Medium (2 days)
- **Priority:** P2 -- important for "document for STO control" use case from CustDev

#### GAP-A4: Hybrid Architecture (App Offline Diagnostics)
- **Designed:** App should run: (1) Local LTFT traffic light (arithmetic only), (2) Local DTC lookup from dtc-index.json, (3) "Safe to drive?" check. All offline. Then send data to server for full diagnosis.
- **Built:** Server-side only. No offline diagnostic logic packaged for app consumption. App sends raw data, server does everything.
- **Plan:** Create a lightweight JSON config that the app downloads once: severity table, DTC subset (top-200 codes), threshold checks. App applies locally, then POSTs to server for full analysis.
- **Complexity:** Medium (3 days -- requires app-side changes too)
- **Priority:** P2 -- critical for offline experience, but app is not primary focus right now

---

## Spec 02: Vehicle Profile

### Built
- VehicleProfile dataclass with all fields: client_hash, brand, model, year, vin, generation, engine_code, engine_type, mileage_km, platform, modifications
- LTFT corrections: base_offset (euro2 -7.5%), tolerance_mult (LPG x1.5, GM x1.3, Japanese x0.7)
- KB resolution path: generation -> model -> brand -> universal
- DB persistence: vehicle_profiles table with UPSERT
- Auto-loading from DB in diagnose_latest_view

### GAPS

#### GAP-V1: VIN Auto-Decode Not Integrated Server-Side
- **Designed:** Full VIN decode pipeline: WMI (3 chars) -> brand (630 codes), char 10 -> year, VDS + vehicles-ru.json -> model shortlist, Fuel Type PID 0x51 -> ice/phev/bev. Engine code via Calibration ID.
- **Built:** Vehicle profile accepts brand/model/year as input. No VIN parsing on server. App reads VIN but doesn't parse it into structured profile fields.
- **Plan:** Add `VINDecoder` class: (1) WMI lookup from a static JSON (630 codes), (2) year from char 10, (3) model matching via vehicles-ru.json filter. Call on POST /api/v2/diagnose/ when vin is provided but brand/model are missing.
- **Complexity:** Low-Medium (1-2 days)
- **Priority:** P2 -- enables automatic profile creation

#### GAP-V2: Mileage Auto-Update from OBD
- **Designed:** Mileage updates from OBD PID 01A6 every trip. Mileage affects thresholds (200K km car has different norms).
- **Built:** mileage_km field exists in VehicleProfile but is never updated from OBD data. No mileage-aware threshold adjustment.
- **Plan:** (1) Parse PID 01A6 in normalizer if present. (2) Update vehicle_profile.mileage_km on each diagnose call. (3) Add mileage-based threshold modifiers (e.g., az_std threshold relaxed for high-mileage cars).
- **Complexity:** Low (1 day)
- **Priority:** P3 -- improves accuracy for high-mileage vehicles

#### GAP-V3: Chip-Tuning Detection
- **Designed:** Chip-tuning detection via Calibration ID (Mode 09 PID 04). Modified firmware -> adjust expectations.
- **Built:** modifications dict has chip_tuning field but it's only user-declared. No automatic detection.
- **Plan:** Parse Calibration ID, compare against known OEM calibration IDs per model. Flag mismatch as chip_tuning=true.
- **Complexity:** Low (1 day), but requires OEM calibration ID database (hard to source)
- **Priority:** P3

---

## Spec 03: Data Pipeline + Facts + ML-Ready

### Built
- Normalizer: validation bounds, regime classification (6 regimes), engine context (warm/cold_start), tier detection
- Feature Extractor: total_vibration, crest_factor, shape_ratio, ranges, ltft_abs, fuel_trim_delta, fuel_trim_sign_match, vibration_speed_ratio, virtual_freq_source/order
- Fact Generator: DTC_ACTIVE, MULTI_DTC_PATTERN, OVERHEAT, LOW_VOLTAGE
- Baseline Store: Welford with MAX_WINDOW=500, z-score, readiness checks
- features_json written to anomaly_scores (ML training data)
- fact_log table written on every diagnosis

### GAPS

#### GAP-P1: Fact Generator Missing 3 of 7 Fact Types
- **Designed:** 7 fact source types: (1) DTC facts, (2) LTFT/STFT facts via FuelTrimAnalyzer, (3) Threshold facts, (4) Z-score anomaly facts (T2/T3), (5) Multi-DTC patterns, (6) Trend facts (CUSUM, baseline drift, LTFT trend), (7) Correlation facts
- **Built:** Only 4 types in FactGenerator.generate(): DTC_ACTIVE, MULTI_DTC_PATTERN, OVERHEAT, LOW_VOLTAGE. Missing: LTFT_SEVERITY facts, VIBRATION_ANOMALY/AUDIO_ANOMALY z-score facts, trend facts (CUSUM_ALARM, BASELINE_DRIFT, LTFT_TREND), correlation facts.
- **Plan:** Add to FactGenerator: (1) `_ltft_severity_facts()` -- call FuelTrimAnalyzer inline and produce LTFT_SEVERITY fact. (2) `_zscore_anomaly_facts()` -- for each key feature, if baseline ready and |z| > 2.0 produce VIBRATION_ANOMALY or AUDIO_ANOMALY fact. (3) `_trend_facts()` -- requires history parameter, produce CUSUM_ALARM / BASELINE_DRIFT / LTFT_TREND. (4) `_correlation_facts()` -- requires correlation_results from DB, produce VIBRATION_RPM_CORRELATION / AUDIO_WHEEL_CORRELATION.
- **Complexity:** Medium (2 days)
- **Priority:** P0 -- facts are the foundation; without these, rules that depend on them fire incorrectly or not at all

#### GAP-P2: Normalizer Missing Regime Stability Filter
- **Designed:** "Do not diagnose during transitional regimes. If regime changed in the last 5 seconds -- skip. Only diagnose with stable regime > 10 seconds."
- **Built:** Regime classified per packet but no stability tracking. No multi-packet regime memory.
- **Plan:** Add regime_history buffer (last N regime values with timestamps). Property `regime_stable` = True if same regime for > 10 seconds. Pipeline uses this to gate fact generation.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- reduces false positives significantly

#### GAP-P3: Quality Gate for Noisy/Broken Data
- **Designed:** If data is "noisy" or classifiers broken (all "cruising", all "standstill") -> show "data unreliable, diagnostics limited" instead of diagnosis.
- **Built:** No quality gate. Broken data passes through pipeline and may produce false diagnoses.
- **Plan:** Add `_data_quality_check()` in pipeline: (1) Check if >80% of recent regimes are UNKNOWN. (2) Check if variance of key features is near zero (stuck sensor). (3) If quality is poor, set report flag `data_quality: "limited"` and suppress diagnoses below confidence threshold.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- prevents garbage-in-garbage-out

#### GAP-P4: user_feedback Table -- No Weight Adjustment Loop
- **Designed:** User feedback drives weight calibration: rule fired 100 times, confirmed 80 -> weight grows. Fired 50, dismissed 40 -> weight drops, threshold rises. Per-platform threshold adjustment.
- **Built:** user_feedback table exists, write_feedback() works, feedback_view API logs feedback. But NO code reads feedback to adjust weights/thresholds. EscalationManager uses dismiss for cooldown only.
- **Plan:** (1) Add `FeedbackAnalyzer` class that reads user_feedback aggregates per rule. (2) Compute confirmation_rate per rule. (3) Adjust rule thresholds: confirmation_rate < 0.3 -> raise min_confidence by 10. (4) Expose via batch job.
- **Complexity:** Medium (2 days)
- **Priority:** P2 -- critical for Stage 2 weight calibration, but requires user base first

#### GAP-P5: Minutes Running / Ambient Temperature in Engine Context
- **Designed:** EngineContext should track: minutes_running (continuous driving time), ambient_temp (from OBD or GPS/weather).
- **Built:** EngineContext dataclass has fields but `minutes_running` is always 0.0 and `ambient_temp` is always None. Not computed in `_build_engine_context()`.
- **Plan:** (1) Pass ambient_temp from raw data if available (OBD PID 0x46 or from request). (2) Track minutes_running via session start time (first packet timestamp).
- **Complexity:** Low (0.5 day)
- **Priority:** P2 -- needed for winter correction and cold-start filtering

---

## Spec 04: Knowledge Base

### Built
- 4-level hierarchy: universal + brand overlays, model/generation reserved
- DTC resolution: brand -> universal fallback
- Situation finders: by DTC, by category, by system_id
- Multi-DTC patterns: 6 hardcoded patterns (P0171+P0174, etc.)
- SYSTEM_TO_CATEGORY taxonomy mapping (16 mappings)

### GAPS

#### GAP-K1: Model and Generation Layers Not Loaded
- **Designed:** Full 4-level resolution: generation -> model -> brand -> universal. 857 models, 66 generations with unique data.
- **Built:** KnowledgeBase.__init__() loads universal only. add_brand_layer() exists. No add_model_layer() or add_generation_layer() methods.
- **Plan:** (1) Add `add_model_layer(brand, model, dtc_path, situations_path)`. (2) Add `add_generation_layer(brand, model, generation, dtc_path, situations_path)`. (3) In resolve_dtc(), check generation -> model -> brand -> universal. (4) Lazy-load per client's vehicle profile.
- **Complexity:** Medium (1-2 days)
- **Priority:** P2 -- currently model and generation data is mostly filtering, not unique content

#### GAP-K2: DTC -> Situation Mapping (0.8% Coverage)
- **Designed:** 3-level strategy: (1) Algorithmic: system_id -> category/layers (~70% coverage), (2) Semi-automatic: SAE J2012 range table (~50 entries), (3) Manual curation: top-200 frequent codes with diagnostic flow.
- **Built:** Only direct DTC code -> situation matching via dtc_codes field in situations. 300 of 36K codes mapped (0.8%).
- **Plan:** (1) Implement algorithmic mapping: DTC code -> system_id (from dtc-index.json) -> SYSTEM_TO_CATEGORY -> situations by category. This is partially there in `find_situations_by_system_id()` but NOT used in diagnosis_builder. (2) Create SAE J2012 range-to-category mapping table. (3) Curate top-200 codes.
- **Complexity:** Medium (2 days for algorithmic, ongoing for curation)
- **Priority:** P1 -- dramatically improves diagnosis quality for DTC-based diagnoses

#### GAP-K3: dtc_patterns Table Not in DB
- **Designed:** DB table `dtc_patterns` with pattern_codes, diagnosis, confidence_boost, situation_id, description. 20-30 entries.
- **Built:** Patterns are hardcoded as DEFAULT_DTC_PATTERNS in knowledge_base.py (6 patterns). No DB table. Cannot update without code deploy.
- **Plan:** (1) Create dtc_patterns table in PostgreSQL. (2) Seed with current 6 + add 14-24 more from YouTube/professional sources. (3) Load at KB init time from DB instead of hardcode.
- **Complexity:** Low (1 day)
- **Priority:** P2 -- enables dynamic pattern updates

#### GAP-K4: Severity Override for Top-200 DTC Codes
- **Designed:** "P0171 (lean mixture) = info in universal, should be warning. Need revision of top-200 codes."
- **Built:** DTC severity used as-is from dtc-index.json. No override mechanism.
- **Plan:** Create severity_overrides.json with top-200 codes and correct severity values. Apply in resolve_dtc() after universal lookup.
- **Complexity:** Low (0.5 day for code, 2-3 days for data curation)
- **Priority:** P1 -- incorrect severity directly causes wrong can_drive decisions

---

## Spec 05: FuelTrim Analyzer

### Built
- 8 severity levels (0-3%, 3-5%, ..., >37%)
- 5 correction factors: euro2 offset, LPG multiplier, platform, winter correction, regime
- Cross-analysis: lean/rich/chronic/sensor classification
- 3 test lists: lean tests (5), rich tests (3), sensor tests (2)
- Financial loss calculator (monthly + yearly)
- FuelTrimResult dataclass with full trace

### GAPS

#### GAP-F1: Dual-Regime Comparison (Idle vs 2000 RPM)
- **Designed:** Compare LTFT at idle and 2000 RPM. If bad on both -> general problem (air leak). If only idle -> local problem (adsorber, crankcase ventilation valve).
- **Built:** FuelTrimAnalyzer.analyze() takes a single regime parameter. No multi-regime comparison logic. No storage/comparison of LTFT across regimes.
- **Plan:** (1) Store last LTFT per regime in pipeline state. (2) Add `analyze_dual_regime(ltft_idle, ltft_2000rpm)` method. (3) Return additional `regime_analysis` field: "both_regimes" / "idle_only" / "load_only". (4) Adjust recommended tests based on regime pattern.
- **Complexity:** Medium (1-2 days)
- **Priority:** P1 -- key differentiator from competitors, directly from YouTube analysis

#### GAP-F2: Bank 1 vs Bank 2 Comparison in FuelTrimAnalyzer
- **Designed:** "Bank 1 = Bank 2 -> common problem (fuel, air after throttle). Bank 1 != Bank 2 -> localized problem (injector one side, leak one side)."
- **Built:** complex_rules.py has `rule_fuel_bank_cross()` which does this at the rule level. But FuelTrimAnalyzer itself only processes bank 1. No dual-bank analysis in the analyzer.
- **Plan:** Add `analyze_dual_bank()` to FuelTrimAnalyzer that takes both banks, computes delta, classifies common vs localized, and adds to FuelTrimResult.
- **Complexity:** Low (0.5 day)
- **Priority:** P2 -- partially covered by complex rule, but analyzer should own this logic

#### GAP-F3: Population Norms Comparison
- **Designed:** "Compare with population norms: '80% of such cars have LTFT within 5%'."
- **Built:** No population statistics. Each car analyzed in isolation.
- **Plan:** (1) Batch job: aggregate LTFT baselines grouped by (platform, brand, mileage_bucket). (2) Store population_priors table. (3) In FuelTrimAnalyzer, add population_percentile to result: "Your LTFT is worse than 85% of similar cars."
- **Complexity:** Medium (2 days)
- **Priority:** P2 -- great for user engagement but requires data from 50+ clients

---

## Spec 06: Rule Engine

### Built
- 103 JSON threshold rules + 7 Python complex rules = 110 rules total
- Confidence scoring: match_score (40%) + deviation_score (40%) + persistence_score (placeholder 4%)
- Status mapping: likely (70+) / possible (40+) / unlikely (>0) / clear (0)
- Condition operators: >, <, ==, z>, between, in
- Context support in rule conditions
- Python rules: fuel_bank_cross, vibration_regime_dependency, audio_engine_harmonic, warmup_anomaly, speed_vibration_resonance, phev_battery_degradation, combined_drivetrain_stress

### GAPS

#### GAP-R1: Persistence Score is a Placeholder (4% fixed)
- **Designed:** Persistence component should be 20% of confidence (1 time -> 4%, 3 times -> 12%, 5+ times -> 20%). Requires reading from diagnostic_persistence table.
- **Built:** `_PERSISTENCE_RATIO = 0.2` hardcoded. No DB lookup. Every rule always gets 4% persistence bonus regardless of actual history.
- **Plan:** (1) Pass EscalationManager to RuleEngine.run_all(). (2) For each rule, look up consecutive_count from persistence records. (3) Compute persistence_ratio: count=1->0.2, count=3->0.6, count=5+->1.0. (4) Use real persistence_ratio * 20.0 for persistence_score.
- **Complexity:** Low (1 day)
- **Priority:** P0 -- confidence scores are systematically wrong without this; 16% of the score is missing

#### GAP-R2: Cooldown Not Enforced in Rule Engine
- **Designed:** Rules have cooldown_minutes (default 7 days). After user dismisses, rule should not fire for 7 days.
- **Built:** EscalationManager has is_in_cooldown() and dismiss(). But RuleEngine never checks cooldown before evaluating a rule. cooldown_minutes is loaded but unused.
- **Plan:** (1) Pass EscalationManager (or cooldown lookup function) to RuleEngine. (2) In evaluate_rule(), if is_in_cooldown() -> return confidence=0. (3) In full_diagnose(), wire escalation manager to rule engine.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- without this, dismissed diagnoses immediately reappear, destroying trust

#### GAP-R3: Rule Context Constraints Not Evaluated
- **Designed:** Each rule has context constraints: regime (only highway, only idle), warm engine required (coolant > 80), speed ranges, not cold start (first 3 min excluded).
- **Built:** DiagnosticRule dataclass does not have context fields. RuleCondition has a context dict but it's never checked against current regime/engine state. Rules can fire in wrong contexts (e.g., suspension rule fires during idle).
- **Plan:** (1) Add to DiagnosticRule: required_regimes, require_warm, min_speed, max_speed, exclude_cold_start. (2) Add to threshold_rules.json. (3) In evaluate_rule(), check all context constraints before evaluating conditions. Skip rule if context doesn't match.
- **Complexity:** Medium (1-2 days -- need to update 103 rules in JSON)
- **Priority:** P0 -- without context filtering, rules produce false positives in wrong driving conditions

#### GAP-R4: Minimum Consecutive Firings Before Display
- **Designed:** "Rule must fire minimum 3 times consecutively before showing to user. 1 firing = noise, 3 = pattern."
- **Built:** No minimum firings gate. Any rule that fires once with confidence >= min_confidence is shown.
- **Plan:** (1) In diagnosis_builder._build_diagnoses(), check escalation_manager for consecutive_count >= 3. (2) If count < 3 and severity < danger, suppress from diagnoses list. (3) Still count in health_scores to depress score.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- critical anti-false-positive measure

#### GAP-R5: Vehicle-Specific Threshold Corrections
- **Designed:** Rules should have corrections per LPG/Euro-2/platform. Example: LTFT threshold = 10% default, 15% for LPG, 13% for GM.
- **Built:** FuelTrimAnalyzer has corrections. But JSON rules have fixed thresholds with no vehicle-specific modification. Rule "fuel_lean" has threshold 10% regardless of vehicle profile.
- **Plan:** (1) Add optional `corrections` field to rule JSON: `{"lpg": {"threshold_mult": 1.5}, "gm_platform": {"threshold_mult": 1.3}}`. (2) In evaluate_rule(), apply corrections from VehicleProfile before threshold comparison.
- **Complexity:** Medium (1-2 days)
- **Priority:** P2 -- FuelTrimAnalyzer handles the main case, but other rules (vibration thresholds) need this too

---

## Spec 07: Correlation Engine

### Built
- All 5 correlations implemented:
  1. vibration_rpm (engine mount)
  2. audio_wheel (wheel bearing)
  3. turn_click (CV joint)
  4. vibration_speed_peak (wheel imbalance)
  5. highfreq_vibration (accessory bearing)
- CorrelationRunner: reads accel+audio+OBD, joins by time (+-3 sec), runs all 5
- DB save to correlation_results table
- API endpoint GET /api/v2/correlations/

### GAPS

#### GAP-C1: Correlation Results Not Fed Into Facts/Rules
- **Designed:** "Correlation facts feed into Rule Engine as normal facts -- then processed by rules." Fact types: VIBRATION_RPM_CORRELATION, AUDIO_WHEEL_CORRELATION.
- **Built:** CorrelationRunner saves to DB. But pipeline.full_diagnose() never reads correlation_results. No correlation facts generated. Correlations exist in isolation.
- **Plan:** (1) In full_diagnose(), after pipeline processing, read recent correlation_results from DB for this client. (2) For each significant result, generate a correlation Fact. (3) Add corresponding rules that fire on correlation facts (e.g., if vibration_rpm correlation r > 0.7 -> "engine mount wear" diagnosis).
- **Complexity:** Medium (1-2 days)
- **Priority:** P1 -- correlations are the competitive advantage but currently disconnected from diagnosis

#### GAP-C2: Partial Correlation (RPM-controlled)
- **Designed:** Correlation 5 (highfreq_vibration) should use partial correlation: audio<->vibration at fixed RPM.
- **Built:** Simple linear regression of amplitude vs az_std across all RPM values. Not controlling for RPM.
- **Plan:** Group windows by RPM bins (500 RPM wide). Compute correlation within each bin. Report the bin with strongest correlation.
- **Complexity:** Low (0.5 day)
- **Priority:** P3 -- refinement, not critical

#### GAP-C3: Correlation Runner Not Triggered Automatically
- **Designed:** "Runs as cron job on server after trip data upload."
- **Built:** Must be called manually: `run_correlations(cursor, client_hash)`.
- **Plan:** (1) Create Django management command `run_correlations_batch`. (2) Set up cron every 15 min or trigger after data upload via signal. (3) Run for all clients with new data since last run.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- overlaps with GAP-A1

---

## Spec 08: Database Schema

### Built
- All 9 tables designed are implemented:
  1. vehicle_profiles
  2. anomaly_baselines
  3. anomaly_scores (hypertable)
  4. diagnostic_persistence
  5. correlation_results
  6. dtc_events
  7. fact_log
  8. user_feedback
  9. dtc_patterns (hardcoded in Python, not in DB -- see GAP-K3)
- MockDB creates SQLite versions for testing
- Read/write functions for all tables

### GAPS

#### GAP-D1: dtc_patterns Not a DB Table
- **Designed:** dtc_patterns table in PostgreSQL with dynamic CRUD.
- **Built:** Hardcoded in knowledge_base.py as Python frozensets.
- **Plan:** See GAP-K3 (same issue).
- **Priority:** P2

#### GAP-D2: anomaly_scores Missing CUSUM/Trend Columns
- **Designed:** Columns: cusum_short, cusum_medium, cusum_long, degradation_detected, trend_per_day, road_type.
- **Built:** Table has these columns in DB but write_anomaly_scores() never writes them. All default to 0/NULL/FALSE.
- **Plan:** See GAP-A2 (same issue). Compute and write these values in write_anomaly_scores().
- **Priority:** P1

#### GAP-D3: dtc_events Missing ECU Field and resolved_at
- **Designed:** dtc_events should have: ecu (source ECU: 7E8, 7EA...), resolved_at (when code disappeared), occurrences (how many times appeared).
- **Built:** write_dtc_events() writes time, client_hash, dtc_code, freeze_frame, occurrences. No ecu field. No resolved_at tracking (every DTC is an INSERT, never updated when code clears).
- **Plan:** (1) Add ecu to write_dtc_events() params. (2) Before INSERT, check if same DTC already active (resolved_at IS NULL). If so, increment occurrences instead of inserting new row. (3) When DTC list no longer contains a code, SET resolved_at = now.
- **Complexity:** Low (1 day)
- **Priority:** P2 -- important for DTC history tracking

#### GAP-D4: Retention Policies Not Set
- **Designed:** anomaly_scores: 90-day retention. fact_log: 180-day retention.
- **Built:** No retention policies. Data grows indefinitely.
- **Plan:** For TimescaleDB: `SELECT add_retention_policy('anomaly_scores', INTERVAL '90 days');` and same for fact_log (180 days).
- **Complexity:** Trivial (5 min)
- **Priority:** P2 -- will matter at scale

---

## Spec 09: Diagnosis Builder + API

### Built
- 7-block report: can_drive, health_scores, health_trends, diagnoses, fuel_loss, escalations/recalls, next_steps
- Health Score v2: per-system weighted scores with dominant-rule approach, severity weights, persistence factor
- can_drive: safe/caution/stop from worst fact severity
- Diagnoses enriched with KB data (quickAnswer, solutions, commonMistakes)
- Fuel loss calculator integrated
- Escalation integration in diagnose_latest_view
- Recalls integration via RecallsChecker
- CUSUM health trends from history
- API: 5 endpoints (diagnose, diagnose-latest, feedback, history, correlations)

### GAPS

#### GAP-B1: Recalls Not Integrated with 9-Tier System
- **Designed:** "DO NOT reimplement. INTEGRATE the existing 9-tier parallel check system (recalls.js, 1472 lines)." Sources: local DB + Gazbuka + NHTSA + Porsche + Geely + Toyota/Lexus/GAC + Transport Canada + easy.gost.ru.
- **Built:** RecallsChecker uses only the offline local DB (298 campaigns). Does not call any of the 9 external APIs.
- **Plan:** (1) Port the Flask backend (web_control.py, lines 5106-5485) recall checking to Django. (2) Use aiohttp for parallel API calls. (3) Cache results in Redis/DB for 24 hours. (4) Merge online results with offline DB.
- **Complexity:** High (3-5 days -- port 380 lines of Flask + 5 external APIs)
- **Priority:** P2 -- 298 offline campaigns already provides value; online enrichment is enhancement

#### GAP-B2: find_situation_by_id() Not Implemented
- **Designed:** Rules with situation_id should resolve KB situation directly.
- **Built:** Comment in diagnosis_builder.py line 489: "TODO Plan 3: add KnowledgeBase.find_situation_by_id()". Currently only DTC-based KB lookup works. Rules without DTC codes get empty KB data (no quickAnswer, no repair roadmap).
- **Plan:** (1) Index situations by id on KB load. (2) Add find_situation_by_id(situation_id, brand) -> dict. (3) Use in _resolve_kb_data() when rule has situation_id. This unlocks KB data for non-DTC rules (vibration, audio, etc.).
- **Complexity:** Low (0.5 day)
- **Priority:** P0 -- many rules have situation_id but it's never used; repair roadmaps are empty for non-DTC diagnoses

#### GAP-B3: API v2 Missing from Spec: /api/v2/profile/ Endpoint
- **Designed:** Vehicle profile should be manageable (create/update via onboarding flow).
- **Built:** Profile is created inline during /api/v2/diagnose/ and /api/v2/diagnose-latest/. No dedicated profile management endpoint.
- **Plan:** Add GET/POST /api/v2/profile/?client_hash=X. GET returns profile. POST creates/updates. Allows app to manage profile independently from diagnosis.
- **Complexity:** Low (0.5 day)
- **Priority:** P3

#### GAP-B4: Diagnose View Not Using Escalation
- **Designed:** Escalation should be wired into every diagnosis cycle.
- **Built:** diagnose_latest_view (GET) has escalation integration. But diagnose_view (POST) does NOT -- it calls pipeline.full_diagnose() without passing escalation_manager. Escalations are missing from POST /api/v2/diagnose/ responses.
- **Plan:** Add escalation loading/saving to diagnose_view() POST handler, same as diagnose_latest_view.
- **Complexity:** Low (0.5 day)
- **Priority:** P1 -- POST endpoint gives incomplete results without escalation

---

## Summary: Priority Matrix

### P0 -- Must Fix (fundamentally broken without these)

| Gap | Description | Complexity |
|-----|-------------|-----------|
| GAP-P1 | Fact Generator missing LTFT_SEVERITY, Z-score anomaly, trend, correlation facts | 2 days |
| GAP-R1 | Persistence score hardcoded at 4% (should be 0-20% from DB) | 1 day |
| GAP-R3 | Rule context constraints not evaluated (regime, warm engine, speed range) | 1-2 days |
| GAP-B2 | find_situation_by_id() not implemented -- repair roadmaps empty for non-DTC rules | 0.5 day |

**Total P0: ~5 days**

### P1 -- High Priority (significant accuracy/quality impact)

| Gap | Description | Complexity |
|-----|-------------|-----------|
| GAP-A1 | Batch jobs (correlation, baseline aggregation, recall matching) not automated | 2-3 days |
| GAP-A2 | CUSUM 3 timescales + degradation_detected + trend_per_day | 1 day |
| GAP-P2 | Regime stability filter (no diagnosis during transitions) | 0.5 day |
| GAP-P3 | Quality gate for noisy/broken data | 0.5 day |
| GAP-K2 | DTC -> situation mapping at 0.8% (should be ~70% via system_id) | 2 days |
| GAP-K4 | Severity override for top-200 DTC codes | 0.5 day + curation |
| GAP-F1 | Dual-regime LTFT comparison (idle vs 2000 RPM) | 1-2 days |
| GAP-R2 | Cooldown not enforced in rule engine | 0.5 day |
| GAP-R4 | Minimum 3 consecutive firings before display | 0.5 day |
| GAP-C1 | Correlation results not fed into facts/rules | 1-2 days |
| GAP-C3 | Correlation runner not triggered automatically | 0.5 day |
| GAP-B4 | POST /api/v2/diagnose/ missing escalation integration | 0.5 day |
| GAP-D2 | anomaly_scores CUSUM/trend columns never written | overlap with GAP-A2 |

**Total P1: ~10-12 days**

### P2 -- Medium Priority (enhancements)

| Gap | Description | Complexity |
|-----|-------------|-----------|
| GAP-A3 | PDF report generation | 2 days |
| GAP-A4 | Offline diagnostics package for app | 3 days |
| GAP-V1 | VIN auto-decode server-side | 1-2 days |
| GAP-P4 | Feedback -> weight adjustment loop | 2 days |
| GAP-P5 | minutes_running / ambient_temp in EngineContext | 0.5 day |
| GAP-K1 | Model/generation KB layers | 1-2 days |
| GAP-K3 | dtc_patterns DB table instead of hardcode | 1 day |
| GAP-F2 | Bank 1 vs Bank 2 in FuelTrimAnalyzer | 0.5 day |
| GAP-F3 | Population norms comparison | 2 days |
| GAP-R5 | Vehicle-specific threshold corrections in rules | 1-2 days |
| GAP-B1 | 9-tier recalls integration (external APIs) | 3-5 days |
| GAP-D3 | DTC events: ecu field, resolved_at tracking | 1 day |
| GAP-D4 | Retention policies for TimescaleDB | 5 min |

**Total P2: ~18-22 days**

### P3 -- Low Priority (nice-to-have)

| Gap | Description | Complexity |
|-----|-------------|-----------|
| GAP-V2 | Mileage auto-update from OBD | 1 day |
| GAP-V3 | Chip-tuning detection via Calibration ID | 1 day |
| GAP-C2 | Partial correlation (RPM-controlled) | 0.5 day |
| GAP-B3 | Dedicated /api/v2/profile/ endpoint | 0.5 day |

**Total P3: ~3 days**

---

## Design Ideas From Specs That Could Improve the System

### 1. A/B Testing for Rule Weights (from Spec 06)
The spec mentions "A/B testing: new client can get v1 or v2 for accuracy comparison." This is a powerful idea. Implementation: add `weight_version` field to vehicle_profiles. Route clients to different weight sets. Track accuracy metrics per version. Cheap to implement once feedback loop (GAP-P4) is working.

### 2. Platform-Based Fallback for Situations (from Spec 04)
"VW/Skoda/Audi = one platform MQB -> problems are shared." When a specific model has sparse data, fall back to platform-level situations and thresholds. This multiplies effective data coverage for accuracy.

### 3. "How Much You Lose Per Month" as Primary CTA (from Spec 05)
The fuel loss calculator is built but buried in the report. The spec emphasizes this as "the most tangible symptom, convertible to rubles." Consider promoting this to a top-level dashboard widget and push notification trigger.

### 4. Freeze Frame Context for DTC Severity (from Spec 08)
"P0171 at idle + coolant 30C = cold start (not a problem). P0171 on highway + coolant 90C = real problem." Freeze frames are stored but never used for severity adjustment. Adding freeze-frame-aware severity would reduce false positives for transient DTC codes.

### 5. "Safe to Drive" as the First Screen (from Spec 09)
The spec is very clear: "Most important -- first thing user sees." The can_drive logic works but the dashboard and app should make this the hero element, not buried in a JSON response. Design opportunity.

### 6. Welford Baseline Population Priors (from Spec 03)
"All Chery Tiggo 8 Pro at 30-50K km have az_std=1.2 on highway." Instead of starting each new client from scratch, initialize baselines with population priors from similar vehicles. Dramatically reduces the cold-start problem (currently need 30+ samples before z-scores work).
