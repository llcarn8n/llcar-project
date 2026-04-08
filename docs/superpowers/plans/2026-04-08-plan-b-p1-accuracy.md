# Plan B: P1 Backend Accuracy — Anti-False-Positive & Quality

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Reduce false positives, improve diagnostic accuracy through 8 backend changes.

**Architecture:** Changes in rule_engine, normalizer, diagnosis_builder, api_views, knowledge_base. Each task independent.

**Tech Stack:** Python 3.11, pytest, Django, PostgreSQL

---

### Task 5: Cooldown enforcement in rule engine
- Modify: `rule_engine.py` — check `escalation_manager.is_in_cooldown(rule_name)` before evaluating. If in cooldown → confidence=0.
- Modify: `pipeline.py` — wire escalation_manager to run_all()

### Task 6: Minimum 3 consecutive firings before display
- Modify: `diagnosis_builder.py` — in _build_diagnoses(), if consecutive_count < 3 and severity not critical → set status='monitoring', suppress from display but still count in health_scores.

### Task 7: Regime stability filter
- Modify: `normalizer.py` — add `regime_stable: bool` to NormalizedPacket. Track last 3 regimes.
- Modify: `pipeline.py` — if not regime_stable, reduce fact confidence by 50%.

### Task 8: Data quality gate
- Modify: `pipeline.py` — add _data_quality_check(). If >80% regimes UNKNOWN or feature variance ~0 → set report.data_quality='limited', suppress low-confidence diagnoses.

### Task 9: CUSUM 3 timescales
- Modify: `cusum.py` — add medium (k=5,h=15) and long (k=8,h=25) detectors.
- Modify: `db_writers.py` — write cusum_short/medium/long + degradation_detected to anomaly_scores.

### Task 10: DTC→Situation algorithmic mapping (0.8%→~70%)
- Modify: `knowledge_base.py` — use system_id from DTC → SYSTEM_TO_CATEGORY → find situations by category. Already partially built, just not wired.
- Modify: `diagnosis_builder.py` — use KB category fallback when direct DTC lookup fails.

### Task 11: Severity override for top-200 DTC codes
- Create: `dashboard_build/diagnostic/data/severity_overrides.json` — P0171=warning, P0300=critical, etc.
- Modify: `knowledge_base.py` — apply overrides after universal lookup.

### Task 12: Multi-packet aggregation in diagnose-latest
- Modify: `api_views.py` — after processing 10 packets through pipeline, aggregate features (avg numerics, max vibration, union DTCs) for final diagnosis.

### Task 13: Dual-regime LTFT comparison
- Modify: `fuel_trim_analyzer.py` — add analyze_dual_regime(ltft_idle, ltft_2000rpm) → regime_analysis field.

### Task 14: Correlation results → facts → rules
- Modify: `pipeline.py` — read correlation_results from DB, generate correlation facts.
- Modify: `facts.py` — add VIBRATION_RPM_CORRELATION etc. fact types.

### Task 15: POST /diagnose/ escalation integration
- Modify: `api_views.py` diagnose_view() — add escalation loading/saving, same as diagnose_latest_view.

### Task 16: PHEV/BEV hierarchy fix
- Fix: template files in common files — battery_pack, electric_motor, charging sections.

### Task 17: CAN ID parsing fix
- Fix Li Auto ECU visibility: hardcoded 7E8/7E0 → "7E" prefix check.

### Task 18: DTC severity normalization
- Fix P0171 info→warning, P0300 contradictions in dtc-index data.
