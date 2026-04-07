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
        """Engine rule fired → engine health < 100."""
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

        assert report["health_scores"]["engine"] == 40  # 100 - 60
        assert report["health_scores"]["suspension"] == 100
        assert report["health_scores"]["electrical"] == 100
        assert report["health_scores"]["audio"] == 100

    def test_multiple_engine_rules_average(self):
        """Two engine rules with different confidence → engine = 100 - average."""
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

        # Average confidence of fired engine rules: (60+40)/2 = 50
        # Engine score = 100 - 50 = 50
        assert report["health_scores"]["engine"] == 50

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

        # engine=40, suspension=100, electrical=100, audio=100
        # Weighted average depends on weights in builder
        overall = report["health_scores"]["overall"]
        assert 0 < overall < 100


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
