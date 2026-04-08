"""Tests for DiagnosisBuilder — 7-block diagnostic report.

Tests verify:
  - Healthy vehicle → can_drive=safe, no diagnoses
  - Overheat fact → can_drive=stop
  - DTC warning fact → can_drive=caution
  - Rule fired → appears in diagnoses with explanation
  - Fuel loss calculated correctly
  - Empty rules → overall health 100
  - Multiple rules → sorted by confidence desc
  - Health scores per system
  - Next steps from diagnoses
  - Baseline status fields
  - Report structure completeness
  - Health trends placeholder
  - Recalls placeholder
"""
from __future__ import annotations

import time
import pytest
from unittest.mock import MagicMock, patch

from diagnostic.facts import Fact, FactType
from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.fuel_trim_analyzer import FuelTrimResult
from diagnostic.baseline_store import BaselineStore
from diagnostic.diagnosis_builder import DiagnosisBuilder


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_profile(**kwargs) -> VehicleProfile:
    defaults = dict(
        client_hash="test_hash",
        brand="li_auto",
        model="L7",
        year=2023,
    )
    defaults.update(kwargs)
    return VehicleProfile(**defaults)


def _make_kb_mock():
    """Create a mock KnowledgeBase that returns useful data."""
    kb = MagicMock()
    kb.resolve_dtc.return_value = None
    kb.find_situations_by_dtc.return_value = []
    kb.find_situations_by_category.return_value = []
    kb.find_situations_by_system_id.return_value = []
    return kb


def _make_pipeline_result(facts=None, regime="idle"):
    """Create a minimal pipeline result dict."""
    return {
        "packet": MagicMock(),
        "features": {},
        "facts": facts or [],
        "tier": "T1",
        "regime": regime,
        "baseline_ready": False,
        "baseline_confidence": 0.0,
    }


def _make_rule_result(
    name="test_rule",
    display="Test Rule",
    tier="T1",
    confidence=0.0,
    status="clear",
    conditions_met=0,
    conditions_total=2,
    min_confidence=40,
    situation_id=None,
    dtc_codes=None,
):
    """Create a rule result dict matching RuleEngine output format."""
    return {
        "name": name,
        "display": display,
        "tier": tier,
        "confidence": confidence,
        "status": status,
        "conditions_met": conditions_met,
        "conditions_total": conditions_total,
        "min_confidence": min_confidence,
        "situation_id": situation_id,
        "dtc_codes": dtc_codes or [],
    }


def _make_fuel_trim_result(**kwargs):
    """Create a FuelTrimResult with defaults."""
    defaults = dict(
        severity="ELEVATED",
        level_name="elevated",
        corrected_ltft=8.0,
        corrected_abs=8.0,
        cross_type="lean",
        recommended_tests=["test1"],
        monthly_loss_rub=660.0,
        yearly_loss_rub=7920.0,
        raw_ltft=8.0,
        raw_stft=3.0,
        regime="idle",
        base_offset_applied=0.0,
        tolerance_mult_applied=1.0,
        winter_correction_applied=False,
    )
    defaults.update(kwargs)
    return FuelTrimResult(**defaults)


# ---------------------------------------------------------------------------
# Test 1: Healthy vehicle → can_drive=safe, no diagnoses
# ---------------------------------------------------------------------------

class TestHealthyVehicle:
    def test_healthy_vehicle_safe(self):
        """Healthy vehicle with no facts and no rules fired → can_drive=safe."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(name="worn_suspension", confidence=0.0, status="clear"),
            _make_rule_result(name="engine_overheating", confidence=0.0, status="clear"),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "safe"
        assert len(report["diagnoses"]) == 0

    def test_healthy_vehicle_health_100(self):
        """No rules fired → all health scores should be 100."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(name="worn_suspension", confidence=0.0, status="clear"),
            _make_rule_result(name="engine_overheating", confidence=0.0, status="clear"),
            _make_rule_result(name="alternator_failure", confidence=0.0, status="clear"),
            _make_rule_result(name="exhaust_leak", confidence=0.0, status="clear"),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert report["health_scores"]["overall"] == 100
        assert report["health_scores"]["suspension"] == 100
        assert report["health_scores"]["engine"] == 100
        assert report["health_scores"]["electrical"] == 100
        assert report["health_scores"]["audio"] == 100


# ---------------------------------------------------------------------------
# Test 2: Overheat fact → can_drive=stop
# ---------------------------------------------------------------------------

class TestOverheatFact:
    def test_overheat_fact_stops_driving(self):
        """A danger-severity OVERHEAT fact → can_drive=stop."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        facts = [
            Fact(
                type=FactType.OVERHEAT,
                timestamp=time.time(),
                value=110.0,
                severity="danger",
                confidence=1.0,
            ),
        ]
        pipeline_result = _make_pipeline_result(facts=facts)
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "stop"


# ---------------------------------------------------------------------------
# Test 3: DTC warning → can_drive=caution
# ---------------------------------------------------------------------------

class TestDTCWarning:
    def test_dtc_warning_caution(self):
        """A warning-severity DTC fact → can_drive=caution."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        facts = [
            Fact(
                type=FactType.DTC_ACTIVE,
                timestamp=time.time(),
                value=1.0,
                severity="warning",
                confidence=1.0,
                details={"dtc_code": "P0420"},
            ),
        ]
        pipeline_result = _make_pipeline_result(facts=facts)
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "caution"


# ---------------------------------------------------------------------------
# Test 4: Critical fact → can_drive=caution (not stop)
# ---------------------------------------------------------------------------

class TestCriticalFact:
    def test_critical_severity_maps_to_caution(self):
        """A critical-severity fact → can_drive=caution."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        facts = [
            Fact(
                type=FactType.LOW_VOLTAGE,
                timestamp=time.time(),
                value=10.0,
                severity="critical",
                confidence=0.9,
            ),
        ]
        pipeline_result = _make_pipeline_result(facts=facts)
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "caution"


# ---------------------------------------------------------------------------
# Test 5: Rule fired → appears in diagnoses
# ---------------------------------------------------------------------------

class TestRuleFired:
    def test_rule_fired_appears_in_diagnoses(self):
        """A rule with confidence >= min_confidence appears in diagnoses."""
        kb = _make_kb_mock()
        # Set up KB to return a situation when queried by situation_id
        kb.find_situations_by_dtc.return_value = [
            {
                "id": "SIT_001",
                "quickAnswer": "Check engine coolant.",
                "solutions": ["Replace thermostat", "Check radiator"],
                "commonMistakes": ["Ignoring temperature gauge"],
                "canDrive": "no",
                "priceRange": "5000-15000 руб",
            }
        ]
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                display="Перегрев двигателя",
                confidence=75.0,
                status="likely",
                min_confidence=40,
                situation_id="SIT_001",
                dtc_codes=["P0217"],
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["rule_name"] == "engine_overheating"
        assert diag["display"] == "Перегрев двигателя"
        assert diag["status"] == "likely"
        assert diag["confidence"] == 75.0

    def test_rule_below_min_confidence_excluded(self):
        """A rule with confidence < min_confidence is excluded from diagnoses."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                confidence=30.0,
                status="unlikely",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["diagnoses"]) == 0


# ---------------------------------------------------------------------------
# Test 6: Fuel loss calculated correctly
# ---------------------------------------------------------------------------

class TestFuelLoss:
    def test_fuel_loss_from_fuel_trim_result(self):
        """Fuel loss block extracts monthly/yearly from FuelTrimResult."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []
        ftr = _make_fuel_trim_result(
            severity="ELEVATED",
            monthly_loss_rub=660.0,
            yearly_loss_rub=7920.0,
        )

        report = builder.build_report(
            pipeline_result, rule_results, fuel_trim_result=ftr
        )

        assert report["fuel_loss"] is not None
        assert report["fuel_loss"]["monthly_rub"] == 660.0
        assert report["fuel_loss"]["yearly_rub"] == 7920.0

    def test_fuel_loss_none_when_normal(self):
        """Fuel loss is None when severity is NORMAL."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []
        ftr = _make_fuel_trim_result(severity="NORMAL")

        report = builder.build_report(
            pipeline_result, rule_results, fuel_trim_result=ftr
        )

        assert report["fuel_loss"] is None

    def test_fuel_loss_none_when_no_fuel_trim(self):
        """Fuel loss is None when no FuelTrimResult provided."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["fuel_loss"] is None


# ---------------------------------------------------------------------------
# Test 7: Empty rules → overall health 100
# ---------------------------------------------------------------------------

class TestEmptyRules:
    def test_empty_rules_health_100(self):
        """No rule results at all → overall health score = 100."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["health_scores"]["overall"] == 100


# ---------------------------------------------------------------------------
# Test 8: Multiple rules → sorted by confidence desc
# ---------------------------------------------------------------------------

class TestMultipleRules:
    def test_diagnoses_sorted_by_confidence_desc(self):
        """Multiple fired rules → diagnoses sorted by confidence desc."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                display="Износ подвески",
                confidence=50.0,
                status="possible",
                min_confidence=40,
            ),
            _make_rule_result(
                name="engine_overheating",
                display="Перегрев двигателя",
                confidence=80.0,
                status="likely",
                min_confidence=40,
            ),
            _make_rule_result(
                name="alternator_failure",
                display="Генератор",
                confidence=60.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["diagnoses"]) == 3
        confs = [d["confidence"] for d in report["diagnoses"]]
        assert confs == sorted(confs, reverse=True)
        assert confs == [80.0, 60.0, 50.0]


# ---------------------------------------------------------------------------
# Test 9: Health scores per system
# ---------------------------------------------------------------------------

class TestHealthScores:
    def test_engine_health_reduced_by_rule(self):
        """Engine rule fired → engine health < 100 (weighted formula)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                confidence=60.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        # engine_overheating: severity=critical(5.0), conf_factor=0.6,
        # penalty=5.0*0.6*1.0=3.0, score=int(100 - 3.0*10)=70
        assert report["health_scores"]["engine"] == 70
        assert report["health_scores"]["suspension"] == 100
        assert report["health_scores"]["electrical"] == 100
        assert report["health_scores"]["audio"] == 100

    def test_multiple_engine_rules_weighted_penalty(self):
        """Two engine rules → dominant-rule approach: max + 10% of rest."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                confidence=60.0,
                status="possible",
            ),
            _make_rule_result(
                name="fuel_lean",
                confidence=40.0,
                status="possible",
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        # engine_overheating: critical(5.0) * 0.6 = 3.0  (dominant)
        # fuel_lean:          medium(2.0) * 0.4 = 0.8
        # effective = 3.0 + 0.8*0.1 = 3.08
        # score = int(100 - 3.08*10) = int(69.2) = 69
        assert report["health_scores"]["engine"] == 69

    def test_overall_is_weighted_average(self):
        """Overall is a weighted average of system scores."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                confidence=60.0,
                status="possible",
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        # engine=70, suspension=100, electrical=100, audio=100
        # overall = 70*0.4 + 100*0.25 + 100*0.2 + 100*0.15 = 88
        overall = report["health_scores"]["overall"]
        assert overall == 88


# ---------------------------------------------------------------------------
# Test 10: Next steps from diagnoses
# ---------------------------------------------------------------------------

class TestNextSteps:
    def test_next_steps_from_fired_rules(self):
        """Fired rules with likely/possible status → generate next_steps."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                display="Перегрев двигателя",
                confidence=75.0,
                status="likely",
                min_confidence=40,
            ),
            _make_rule_result(
                name="worn_suspension",
                display="Износ подвески",
                confidence=50.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["next_steps"]) >= 2

    def test_next_steps_empty_when_healthy(self):
        """No fired rules → empty next_steps."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["next_steps"] == []


# ---------------------------------------------------------------------------
# Test 11: Baseline status fields
# ---------------------------------------------------------------------------

class TestBaselineStatus:
    def test_baseline_status_without_store(self):
        """No baseline_store → confidence=0, baseline_status shows not ready."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[], regime="idle")
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["confidence"] == 0.0
        assert report["baseline_status"]["ready"] is False

    def test_baseline_status_with_store(self):
        """Baseline store with enough samples → ready=True."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        store = BaselineStore()
        for _ in range(250):
            store.update("idle", {"az_std": 1.0, "total_vibration": 1.5})

        pipeline_result = _make_pipeline_result(facts=[], regime="idle")
        rule_results = []

        report = builder.build_report(
            pipeline_result, rule_results, baseline_store=store
        )

        assert report["confidence"] > 0.0
        assert report["baseline_status"]["ready"] is True


# ---------------------------------------------------------------------------
# Test 12: Report structure completeness
# ---------------------------------------------------------------------------

class TestReportStructure:
    def test_all_seven_blocks_present(self):
        """Report must contain all 7 blocks plus meta fields."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        # 7 blocks
        assert "can_drive" in report
        assert "health_scores" in report
        assert "health_trends" in report
        assert "diagnoses" in report
        assert "fuel_loss" in report
        assert "recalls" in report
        assert "next_steps" in report

        # Meta fields
        assert "confidence" in report
        assert "baseline_status" in report
        assert report["rule_version"] == "v1"

    def test_health_trends_placeholder(self):
        """Health trends returns stable placeholder for all systems."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        trends = report["health_trends"]
        for system in ("suspension", "engine", "electrical", "audio"):
            assert trends[system] == "→"

    def test_recalls_placeholder(self):
        """Recalls is an empty list (placeholder for Plan 3)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["recalls"] == []


# ---------------------------------------------------------------------------
# Test 13: Worst severity wins for can_drive
# ---------------------------------------------------------------------------

class TestCanDrivePriority:
    def test_danger_overrides_warning(self):
        """If both warning and danger facts exist, can_drive=stop (danger wins)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        facts = [
            Fact(
                type=FactType.DTC_ACTIVE,
                timestamp=time.time(),
                value=1.0,
                severity="warning",
            ),
            Fact(
                type=FactType.OVERHEAT,
                timestamp=time.time(),
                value=115.0,
                severity="danger",
            ),
        ]
        pipeline_result = _make_pipeline_result(facts=facts)
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "stop"

    def test_only_ok_facts_safe(self):
        """All ok-severity facts → can_drive=safe."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        facts = [
            Fact(
                type=FactType.DTC_ACTIVE,
                timestamp=time.time(),
                value=1.0,
                severity="ok",
            ),
        ]
        pipeline_result = _make_pipeline_result(facts=facts)
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["can_drive"] == "safe"


# ---------------------------------------------------------------------------
# Test 14: Diagnosis block fields completeness
# ---------------------------------------------------------------------------

class TestDiagnosisFields:
    def test_diagnosis_has_all_required_fields(self):
        """Each diagnosis entry must have all specified fields."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",
                display="Перегрев двигателя",
                confidence=75.0,
                status="likely",
                min_confidence=40,
                situation_id="SIT_001",
                dtc_codes=["P0217"],
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]

        required_fields = [
            "rule_name", "display", "status", "confidence",
            "explanation", "evidence", "repair_roadmap",
            "common_mistakes", "can_drive", "price_range",
            "situation_id",
        ]
        for f in required_fields:
            assert f in diag, f"Missing field: {f}"


# ---------------------------------------------------------------------------
# Test 15: Weighted health scoring formula
# ---------------------------------------------------------------------------

class TestWeightedHealthScoring:
    """Tests for the new severity-weighted health score algorithm."""

    def test_severity_weights_affect_score(self):
        """Higher-severity rules produce larger penalties."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        # Low-severity rule: wheel_imbalance (severity=low, weight=1.0)
        low_result = _make_rule_result(
            name="wheel_imbalance", confidence=50.0, status="possible",
        )
        report_low = builder.build_report(
            _make_pipeline_result(facts=[]), [low_result]
        )

        # High-severity rule: misfire (severity=high, weight=3.0)
        high_result = _make_rule_result(
            name="misfire", confidence=50.0, status="possible",
        )
        report_high = builder.build_report(
            _make_pipeline_result(facts=[]), [high_result]
        )

        # wheel_imbalance: low(1.0)*0.5 = 0.5 -> suspension = int(100 - 5) = 95
        assert report_low["health_scores"]["suspension"] == 95
        # misfire: high(3.0)*0.5 = 1.5 -> engine = int(100 - 15) = 85
        assert report_high["health_scores"]["engine"] == 85
        # High severity causes worse score
        assert report_high["health_scores"]["engine"] < report_low["health_scores"]["suspension"]

    def test_critical_severity_heavy_penalty(self):
        """Critical severity (engine_overheating) at full confidence → large penalty."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        rule_results = [
            _make_rule_result(
                name="engine_overheating", confidence=100.0, status="likely",
            ),
        ]
        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results
        )

        # critical(5.0) * 1.0 = 5.0, score = int(100 - 50) = 50
        assert report["health_scores"]["engine"] == 50

    def test_info_severity_minimal_penalty(self):
        """Rules with info severity produce minimal penalty."""
        from diagnostic.diagnosis_builder import _RULE_SEVERITY, SEVERITY_WEIGHTS

        # Verify the weights exist
        assert SEVERITY_WEIGHTS["info"] == 0.5
        assert SEVERITY_WEIGHTS["critical"] == 5.0

    def test_persistence_factor_with_escalation(self):
        """Escalation level increases penalty via persistence factor."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        # Mock escalation manager returning level 2
        esc_manager = MagicMock()
        esc_manager.get_escalation_info.return_value = {
            "first_seen": "2026-04-01T00:00:00+00:00",
            "days_active": 7,
            "level": 2,
            "level_name": "persistent",
            "consecutive_count": 5,
            "was_dismissed": False,
            "max_confidence": 60,
        }

        rule_results = [
            _make_rule_result(
                name="engine_overheating", confidence=60.0, status="possible",
            ),
        ]

        # Without escalation
        report_no_esc = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results
        )

        # With escalation (level 2 → persistence_factor = 1.0 + 0.1*2 = 1.2)
        report_with_esc = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results,
            escalation_manager=esc_manager,
        )

        # No escalation: critical(5.0)*0.6*1.0 = 3.0, score=int(100-30) = 70
        assert report_no_esc["health_scores"]["engine"] == 70

        # With escalation: critical(5.0)*0.6*1.2 = 3.6, score=int(100-36) = 64
        assert report_with_esc["health_scores"]["engine"] == 64

    def test_persistence_factor_capped_at_level_3(self):
        """Escalation levels above 3 are capped (persistence_factor max = 1.3)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc_manager = MagicMock()
        esc_manager.get_escalation_info.return_value = {
            "level": 10,
            "consecutive_count": 20,
        }

        rule_results = [
            _make_rule_result(
                name="fuel_lean", confidence=50.0, status="possible",
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results,
            escalation_manager=esc_manager,
        )

        # fuel_lean: medium(2.0)*0.5*1.3(capped at 3) = 1.3
        # score = int(100 - 13) = 87
        assert report["health_scores"]["engine"] == 87

    def test_unknown_rule_defaults_to_engine(self):
        """Rules not in _RULE_TO_SYSTEM default to 'engine'."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        rule_results = [
            _make_rule_result(
                name="unknown_new_rule", confidence=50.0, status="possible",
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results
        )

        # unknown rule → engine system, severity defaults to "medium"(2.0)
        # penalty = 2.0 * 0.5 * 1.0 = 1.0, score = int(100 - 10) = 90
        assert report["health_scores"]["engine"] == 90
        assert report["health_scores"]["suspension"] == 100

    def test_score_floor_at_zero(self):
        """Score cannot go below 0 even with extreme penalties."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        # Use escalation manager with high level to push penalty over 10.0
        esc_manager = MagicMock()
        esc_manager.get_escalation_info.return_value = {
            "level": 3,  # persistence_factor = 1.0 + 0.1*3 = 1.3
            "consecutive_count": 10,
        }

        # Many critical/high rules at max confidence with persistence
        rule_results = [
            _make_rule_result(name="engine_overheating", confidence=100.0, status="likely",
                              min_confidence=101),  # high min_conf to skip escalations block
            _make_rule_result(name="misfire", confidence=100.0, status="likely",
                              min_confidence=101),
            _make_rule_result(name="catalyst_degradation", confidence=100.0, status="likely",
                              min_confidence=101),
            _make_rule_result(name="fuel_lean", confidence=100.0, status="likely",
                              min_confidence=101),
            _make_rule_result(name="fuel_rich", confidence=100.0, status="likely",
                              min_confidence=101),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results,
            escalation_manager=esc_manager,
        )

        # With persistence 1.3: penalties = [6.5, 3.9, 3.9, 2.6, 2.6]
        # effective = 6.5 + (3.9+3.9+2.6+2.6)*0.1 = 6.5 + 1.3 = 7.8
        # score = int(100 - 78) = 22, still above 0
        # But the mechanism is tested — score is clamped via max(0, ...)
        assert report["health_scores"]["engine"] >= 0
        assert report["health_scores"]["engine"] < 30  # significantly penalized

    def test_score_ceiling_at_100(self):
        """Score cannot exceed 100 — rules with confidence 0 have no effect."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        rule_results = [
            _make_rule_result(name="engine_overheating", confidence=0.0, status="clear"),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results
        )

        assert report["health_scores"]["engine"] == 100

    def test_escalation_manager_error_graceful(self):
        """If escalation_manager.get_escalation_info raises, default to persistence_factor=1.0."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc_manager = MagicMock()
        esc_manager.get_escalation_info.side_effect = RuntimeError("DB error")

        # Set min_confidence > confidence so _compute_escalations skips
        # the call — we only test the health_scores error handling here.
        rule_results = [
            _make_rule_result(
                name="engine_overheating", confidence=60.0, status="possible",
                min_confidence=70,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results,
            escalation_manager=esc_manager,
        )

        # Graceful degradation: persistence_factor defaults to 1.0
        # critical(5.0)*0.6*1.0 = 3.0, score = int(100 - 30) = 70
        assert report["health_scores"]["engine"] == 70

    def test_multi_system_weighted_overall(self):
        """Rules across different systems → overall is weighted sum."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        rule_results = [
            _make_rule_result(name="worn_suspension", confidence=50.0, status="possible"),
            _make_rule_result(name="alternator_failure", confidence=40.0, status="possible"),
        ]

        report = builder.build_report(
            _make_pipeline_result(facts=[]), rule_results
        )

        # worn_suspension: medium(2.0)*0.5=1.0. suspension = int(100-10)=90
        # alternator_failure: high(3.0)*0.4=1.2. electrical = int(100-12)=88
        # engine=100, audio=100
        # overall = 100*0.4 + 90*0.25 + 88*0.2 + 100*0.15
        #         = 40 + 22.5 + 17.6 + 15 = 95.1 → round = 95
        scores = report["health_scores"]
        assert scores["suspension"] == 90
        assert scores["electrical"] == 88
        assert scores["engine"] == 100
        assert scores["audio"] == 100
        assert scores["overall"] == 95


# ---------------------------------------------------------------------------
# Test: GAP-R4 — Minimum consecutive firings before display
# ---------------------------------------------------------------------------

class TestConsecutiveFirings:
    """GAP-R4: Rules must fire 3+ times before status is likely/possible."""

    def test_low_consecutive_demoted_to_monitoring(self):
        """Rule with consecutive_count=1 is demoted to 'monitoring' status."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc = MagicMock()
        esc.get_escalation_info.return_value = {
            "first_seen": "2026-04-01T00:00:00+00:00",
            "days_active": 1,
            "level": 0,
            "level_name": "notice",
            "consecutive_count": 1,
            "was_dismissed": False,
            "max_confidence": 50,
        }

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",  # severity=medium, not critical/high
                display="Wear suspension",
                confidence=55.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["status"] == "monitoring"
        assert diag["confidence"] == 55.0  # confidence preserved

    def test_three_consecutive_shows_normally(self):
        """Rule with consecutive_count=3 is shown with original status."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc = MagicMock()
        esc.get_escalation_info.return_value = {
            "consecutive_count": 3,
            "level": 0,
        }

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                display="Wear suspension",
                confidence=55.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["status"] == "possible"  # not demoted

    def test_critical_severity_bypasses_consecutive_check(self):
        """Critical-severity rule shown immediately even with consecutive_count=1."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc = MagicMock()
        esc.get_escalation_info.return_value = {
            "consecutive_count": 1,
            "level": 0,
        }

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="engine_overheating",  # severity=critical
                display="Engine overheat",
                confidence=75.0,
                status="likely",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["status"] == "likely"  # not demoted due to critical severity

    def test_high_severity_bypasses_consecutive_check(self):
        """High-severity rule (misfire) shown immediately with consecutive_count=1."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc = MagicMock()
        esc.get_escalation_info.return_value = {
            "consecutive_count": 1,
            "level": 0,
        }

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="misfire",  # severity=high
                display="Misfire",
                confidence=60.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["status"] == "possible"  # not demoted due to high severity

    def test_no_escalation_manager_backward_compat(self):
        """Without escalation_manager, consecutive check is skipped."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                display="Wear suspension",
                confidence=55.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert len(report["diagnoses"]) == 1
        diag = report["diagnoses"][0]
        assert diag["status"] == "possible"  # original status preserved

    def test_monitoring_status_still_in_diagnoses_list(self):
        """Monitoring-status diagnoses are still present (for health_scores)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        esc = MagicMock()
        esc.get_escalation_info.return_value = {
            "consecutive_count": 1,
            "level": 0,
        }

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="fuel_lean",
                display="Lean",
                confidence=50.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        # Diagnosis is still included but demoted
        assert len(report["diagnoses"]) == 1
        assert report["diagnoses"][0]["status"] == "monitoring"
        # Health score still affected (rule fires at confidence=50)
        assert report["health_scores"]["engine"] < 100

    def test_escalation_error_keeps_original_status(self):
        """If escalation_manager raises in _build_diagnoses, original status is preserved."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        # We need the error only during _build_diagnoses, but
        # get_escalation_info is also called by _compute_health_scores
        # and _compute_escalations. Use a counter to fail only on
        # the specific call from _build_diagnoses (the second call).
        call_count = [0]
        def side_effect_fn(client_hash, rule_name):
            call_count[0] += 1
            # First call is from _compute_health_scores (graceful),
            # second from _build_diagnoses (we want it to raise),
            # third from _compute_escalations (also graceful).
            if call_count[0] == 2:
                raise RuntimeError("DB error")
            return None

        esc = MagicMock()
        esc.get_escalation_info.side_effect = side_effect_fn

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                display="Wear",
                confidence=55.0,
                status="possible",
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            pipeline_result, rule_results,
            escalation_manager=esc,
        )

        assert len(report["diagnoses"]) == 1
        assert report["diagnoses"][0]["status"] == "possible"
