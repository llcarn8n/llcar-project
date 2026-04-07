"""Tests for EscalationManager integration in DiagnosisBuilder.

Tests verify:
  - build_report without escalation_manager -> escalations = [] (backward compat)
  - build_report with escalation_manager -> escalations populated
  - Escalations sorted by level (urgent first, notice last)
  - Rules below min_confidence excluded from escalations
  - Escalation info contains required fields
  - Multiple rules with different escalation levels sorted correctly
  - Zero consecutive_count records excluded
"""
from __future__ import annotations

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from diagnostic.diagnosis_builder import DiagnosisBuilder
from diagnostic.escalation import EscalationManager
from diagnostic.vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_profile(**overrides) -> VehicleProfile:
    defaults = dict(
        client_hash="test_esc",
        brand="test",
        model="test",
        year=2023,
    )
    defaults.update(overrides)
    return VehicleProfile(**defaults)


def _make_kb_mock():
    kb = MagicMock()
    kb.resolve_dtc.return_value = None
    kb.find_situations_by_dtc.return_value = []
    kb.find_situations_by_category.return_value = []
    kb.find_situations_by_system_id.return_value = []
    return kb


def _make_pipeline_result(**overrides):
    defaults = {
        "packet": MagicMock(),
        "features": {},
        "facts": [],
        "tier": "T1",
        "regime": "idle",
        "baseline_ready": False,
        "baseline_confidence": 0.0,
    }
    defaults.update(overrides)
    return defaults


def _make_rule_result(
    name="worn_suspension",
    display="Износ подвески",
    tier="T2",
    confidence=70.0,
    status="likely",
    conditions_met=3,
    conditions_total=3,
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


def _make_escalation_manager(client_hash, rules_data):
    """Create EscalationManager with pre-populated records.

    rules_data: list of (rule_name, consecutive_count, days_ago, max_confidence) tuples.
    """
    em = EscalationManager()
    base = datetime(2026, 4, 1, tzinfo=timezone.utc)

    for rule_name, count, days_ago, conf in rules_data:
        first_iso = (base - timedelta(days=days_ago)).isoformat()
        now_iso = base.isoformat()
        for _ in range(count):
            em.update(client_hash, rule_name, conf, now=now_iso)
        # Fix first_triggered to simulate actual time spread
        rec = em.get_record(client_hash, rule_name)
        if rec:
            rec.first_triggered = first_iso
            rec.escalation_level = em._calc_level(rec, now_iso)

    return em


# ---------------------------------------------------------------------------
# Test 1: Backward compatibility — no escalation_manager
# ---------------------------------------------------------------------------

class TestNoEscalationManager:
    def test_build_report_without_escalation_manager(self):
        """build_report without escalation_manager -> escalations = []."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result()
        rule_results = [
            _make_rule_result(name="worn_suspension", confidence=70.0),
        ]

        report = builder.build_report(pipeline_result, rule_results)

        assert "escalations" in report
        assert report["escalations"] == []

    def test_escalations_key_always_present(self):
        """Escalations key is always in the report, even with no rules."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        report = builder.build_report(_make_pipeline_result(), [])

        assert "escalations" in report
        assert isinstance(report["escalations"], list)


# ---------------------------------------------------------------------------
# Test 2: Escalations populated when manager provided
# ---------------------------------------------------------------------------

class TestEscalationsPopulated:
    def test_escalation_info_populated(self):
        """build_report with escalation_manager -> escalations populated."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = _make_escalation_manager("test_esc", [
            # (rule_name, consecutive_count, days_ago, max_confidence)
            ("worn_suspension", 3, 5, 70),
        ])

        rule_results = [
            _make_rule_result(
                name="worn_suspension",
                display="Износ подвески",
                confidence=70.0,
                min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        assert len(report["escalations"]) == 1
        esc = report["escalations"][0]
        assert esc["rule_name"] == "worn_suspension"
        assert esc["display"] == "Износ подвески"
        assert esc["consecutive_count"] == 3


# ---------------------------------------------------------------------------
# Test 3: Escalations sorted by level (urgent first)
# ---------------------------------------------------------------------------

class TestEscalationsSortedByLevel:
    def test_sorted_urgent_first(self):
        """Multiple escalations sorted by level descending (urgent first)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = _make_escalation_manager("test_esc", [
            # notice level: 1 trigger, 0 days ago
            ("alternator_failure", 1, 0, 50),
            # warning level: 3 triggers, 5 days ago, conf > 40
            ("worn_suspension", 3, 5, 70),
            # urgent level: 10 triggers, 20 days ago, conf > 70
            ("engine_overheating", 10, 20, 80),
        ])

        rule_results = [
            _make_rule_result(
                name="alternator_failure", display="Генератор",
                confidence=50.0, min_confidence=40,
            ),
            _make_rule_result(
                name="worn_suspension", display="Износ подвески",
                confidence=70.0, min_confidence=40,
            ),
            _make_rule_result(
                name="engine_overheating", display="Перегрев двигателя",
                confidence=80.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        escalations = report["escalations"]
        assert len(escalations) == 3
        levels = [e["level"] for e in escalations]
        assert levels == sorted(levels, reverse=True)
        # Urgent (level 3) should be first
        assert escalations[0]["rule_name"] == "engine_overheating"
        assert escalations[0]["level"] == 3


# ---------------------------------------------------------------------------
# Test 4: Rules below min_confidence excluded
# ---------------------------------------------------------------------------

class TestBelowMinConfidenceExcluded:
    def test_low_confidence_rule_excluded_from_escalations(self):
        """Rules with confidence < min_confidence are excluded from escalations."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = _make_escalation_manager("test_esc", [
            ("worn_suspension", 5, 10, 30),
        ])

        rule_results = [
            _make_rule_result(
                name="worn_suspension", display="Износ подвески",
                confidence=30.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        assert report["escalations"] == []


# ---------------------------------------------------------------------------
# Test 5: Escalation info contains required fields
# ---------------------------------------------------------------------------

class TestEscalationInfoFields:
    def test_required_fields_present(self):
        """Each escalation dict contains all required fields."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = _make_escalation_manager("test_esc", [
            ("worn_suspension", 5, 10, 70),
        ])

        rule_results = [
            _make_rule_result(
                name="worn_suspension", display="Износ подвески",
                confidence=70.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        assert len(report["escalations"]) == 1
        esc = report["escalations"][0]

        required_fields = [
            "rule_name", "display",
            "first_seen", "days_active", "level", "level_name",
            "consecutive_count", "was_dismissed", "max_confidence",
        ]
        for f in required_fields:
            assert f in esc, f"Missing field: {f}"

        assert isinstance(esc["level"], int)
        assert isinstance(esc["level_name"], str)
        assert isinstance(esc["consecutive_count"], int)
        assert isinstance(esc["was_dismissed"], bool)


# ---------------------------------------------------------------------------
# Test 6: Multiple rules with different levels sorted correctly
# ---------------------------------------------------------------------------

class TestMultipleRulesLevels:
    def test_two_rules_different_levels(self):
        """Two rules with different escalation levels sorted correctly."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = _make_escalation_manager("test_esc", [
            # problem level: 5 triggers, 8 days, conf > 50
            ("fuel_lean", 5, 8, 60),
            # notice level: 1 trigger, 0 days
            ("low_battery", 1, 0, 45),
        ])

        rule_results = [
            _make_rule_result(
                name="fuel_lean", display="Бедная смесь",
                confidence=60.0, min_confidence=40,
            ),
            _make_rule_result(
                name="low_battery", display="Низкий заряд",
                confidence=45.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        escalations = report["escalations"]
        assert len(escalations) == 2
        # problem (level 2) should be before notice (level 0)
        assert escalations[0]["rule_name"] == "fuel_lean"
        assert escalations[0]["level"] >= escalations[1]["level"]


# ---------------------------------------------------------------------------
# Test 7: Zero consecutive_count excluded
# ---------------------------------------------------------------------------

class TestZeroConsecutiveExcluded:
    def test_zero_consecutive_count_excluded(self):
        """Records with consecutive_count=0 (e.g. dismissed) are excluded."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = EscalationManager()
        now_iso = datetime(2026, 4, 1, tzinfo=timezone.utc).isoformat()
        # Create record then dismiss it (sets consecutive_count=0)
        em.update("test_esc", "worn_suspension", 70, now=now_iso)
        em.dismiss("test_esc", "worn_suspension", now=now_iso)

        rule_results = [
            _make_rule_result(
                name="worn_suspension", display="Износ подвески",
                confidence=70.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        assert report["escalations"] == []


# ---------------------------------------------------------------------------
# Test 8: Rule not in escalation manager returns no escalation
# ---------------------------------------------------------------------------

class TestRuleNotInManager:
    def test_unknown_rule_no_escalation(self):
        """Rule that has no record in EscalationManager is excluded."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        em = EscalationManager()  # empty manager

        rule_results = [
            _make_rule_result(
                name="worn_suspension", display="Износ подвески",
                confidence=70.0, min_confidence=40,
            ),
        ]

        report = builder.build_report(
            _make_pipeline_result(), rule_results, escalation_manager=em
        )

        assert report["escalations"] == []
