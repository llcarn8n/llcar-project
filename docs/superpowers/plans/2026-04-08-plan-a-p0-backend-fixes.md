# Plan A: P0 Backend Fixes — Diagnostic Engine Critical Bugs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix 4 critical bugs that make the diagnostic engine produce wrong results.

**Architecture:** All changes in dashboard_build/diagnostic/. Each fix is independent — can be done in parallel. Tests must stay at 454+ pass.

**Tech Stack:** Python 3.11, pytest, Django

---

### Task 1: FactGenerator — Add Missing Fact Types

**Files:**
- Modify: `dashboard_build/diagnostic/facts.py`
- Modify: `dashboard_build/diagnostic/pipeline.py` (pass baselines to FactGenerator)
- Test: `dashboard_build/tests/test_facts.py`

**Problem:** FactGenerator produces only 4 of 7 fact types (DTC_ACTIVE, MULTI_DTC_PATTERN, OVERHEAT, LOW_VOLTAGE). Missing: LTFT_SEVERITY, VIBRATION_ANOMALY, AUDIO_ANOMALY, CUSUM_ALARM.

- [ ] Add FactType enum values: LTFT_SEVERITY, VIBRATION_ANOMALY, AUDIO_ANOMALY, CUSUM_ALARM, BASELINE_DRIFT
- [ ] Add `_ltft_severity_facts(packet)`: if packet has ltft field, classify severity using FuelTrimAnalyzer severity table thresholds (>5% = borderline, >10% = problem, >25% = critical). Don't instantiate full analyzer — just threshold check.
- [ ] Add `_zscore_anomaly_facts(packet, baselines)`: for az_std, total_vibration — if baselines.is_ready() and |baselines.z_score(feature, value)| > 2.0, produce VIBRATION_ANOMALY fact. Same for dominant_freq, dominant_amp → AUDIO_ANOMALY.
- [ ] Add `_cusum_facts(health_trends)`: if any system trend == "↓", produce CUSUM_ALARM fact for that system.
- [ ] Update `generate()` signature to accept optional `baselines: BaselineStore = None` and `health_trends: dict = None`.
- [ ] Update pipeline.py `process()` to pass baselines to fact generator.
- [ ] Write 8+ tests for new fact types.
- [ ] Run: `python -m pytest tests/ -v` → all pass

---

### Task 2: Persistence Score — Real Values from DB

**Files:**
- Modify: `dashboard_build/diagnostic/rule_engine.py`
- Test: `dashboard_build/tests/test_rule_engine.py`

**Problem:** Persistence component is hardcoded at 4% (0.2 ratio × 20 max). Should scale 0-20% based on consecutive_count from diagnostic_persistence table.

- [ ] Add optional `escalation_manager` parameter to `RuleEngine.run_all(facts, packet, escalation_manager=None)`
- [ ] In confidence calculation, replace hardcoded persistence: if escalation_manager provided, get record for rule_name. `persistence_ratio = min(consecutive_count / 5, 1.0)`. Else `persistence_ratio = 0.2` (backward compat).
- [ ] Wire escalation_manager through pipeline.full_diagnose() → rule_engine.run_all()
- [ ] Write 4 tests: no manager (backward), count=0, count=3, count=5+
- [ ] Run: `python -m pytest tests/ -v` → all pass

---

### Task 3: Rule Context Constraints

**Files:**
- Modify: `dashboard_build/diagnostic/rule_engine.py`
- Modify: `dashboard_build/diagnostic/rules/threshold_rules.json`
- Test: `dashboard_build/tests/test_rule_engine.py`

**Problem:** Rules fire in wrong driving conditions. Suspension rule fires at idle, fuel rules fire on cold engine.

- [ ] Add optional `"context"` field to JSON rule format: `{"regimes": ["city","highway"], "require_warm": true, "min_speed": 0, "max_speed": 200}`
- [ ] In `evaluate_rule()`, before condition evaluation: check `rule.get("context")`. If present, validate against packet regime/coolant/speed. If mismatch → return confidence=0.
- [ ] Add context to key rules in threshold_rules.json:
  - Suspension rules (worn_suspension, wheel_imbalance): `"context": {"min_speed": 20}` 
  - Fuel rules (fuel_lean, fuel_rich, etc.): `"context": {"require_warm": true}`
  - Audio rules (exhaust_leak, bearing_wear): `"context": {"min_speed": 10}`
  - Engine idle rules (high_idle): `"context": {"regimes": ["idle"]}`
- [ ] Write 3 tests: context match, context mismatch, no context (backward compat)
- [ ] Run: `python -m pytest tests/ -v` → all pass

---

### Task 4: find_situation_by_id()

**Files:**
- Modify: `dashboard_build/diagnostic/knowledge_base.py`
- Modify: `dashboard_build/diagnostic/diagnosis_builder.py`
- Test: `dashboard_build/tests/test_knowledge_base.py`

**Problem:** Rules with situation_id get empty KB data (no repair roadmap, no quickAnswer, no price_range). There's a TODO comment in diagnosis_builder.py.

- [ ] In KnowledgeBase.__init__(), build `self._situations_by_id: Dict[str, dict]` index from all loaded situations.
- [ ] Add method `find_situation_by_id(situation_id: str, brand: str = None) -> Optional[dict]`: look up by id, try brand-specific first, then universal.
- [ ] In diagnosis_builder.py `_resolve_kb_data()`, if rule has situation_id and DTC lookup returned nothing, try `kb.find_situation_by_id(situation_id)`.
- [ ] Write 3 tests: found by id, not found, brand-specific override.
- [ ] Run: `python -m pytest tests/ -v` → all pass
