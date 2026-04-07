"""Tests for EscalationManager — persistence tracking, cooldown, and severity escalation."""
import pytest
from datetime import datetime, timedelta, timezone

from diagnostic.escalation import (
    COOLDOWN_DAYS,
    ESCALATION_THRESHOLDS,
    LEVEL_NAMES,
    PersistenceRecord,
    EscalationManager,
)
from diagnostic.db import MockDB


def _iso(days_offset=0):
    """Helper: return ISO datetime string offset from 2026-04-01 UTC."""
    dt = datetime(2026, 4, 1, tzinfo=timezone.utc) + timedelta(days=days_offset)
    return dt.isoformat()


# ---------------------------------------------------------------------------
# Basic trigger behavior
# ---------------------------------------------------------------------------


class TestFirstTrigger:
    """Test 1: First trigger creates record with consecutive_count=1, level=0."""

    def test_first_trigger_creates_record(self):
        mgr = EscalationManager()
        rec = mgr.update("client1", "fuel_trim_high", 50, now=_iso(0))
        assert rec.consecutive_count == 1
        assert rec.escalation_level == 0
        assert rec.first_triggered == _iso(0)
        assert rec.last_triggered == _iso(0)
        assert rec.max_confidence == 50


class TestSecondTrigger:
    """Test 2: Second trigger increments count, level stays 0."""

    def test_second_trigger_increments(self):
        mgr = EscalationManager()
        mgr.update("client1", "fuel_trim_high", 50, now=_iso(0))
        rec = mgr.update("client1", "fuel_trim_high", 50, now=_iso(1))
        assert rec.consecutive_count == 2
        assert rec.escalation_level == 0


# ---------------------------------------------------------------------------
# Escalation level calculations
# ---------------------------------------------------------------------------


class TestEscalationToWarning:
    """Test 3: 3+ triggers over 3+ days with confidence > 40 → level 1 (warning)."""

    def test_escalates_to_warning(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 45, now=_iso(0))
        mgr.update("client1", "rule_a", 45, now=_iso(1))
        rec = mgr.update("client1", "rule_a", 45, now=_iso(3))
        assert rec.consecutive_count == 3
        assert rec.escalation_level == 1


class TestEscalationBlockedByLowConfidence:
    """Test 4: 3 triggers over 3+ days but confidence=30 → level stays 0."""

    def test_low_confidence_blocks_escalation(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 30, now=_iso(0))
        mgr.update("client1", "rule_a", 30, now=_iso(1))
        rec = mgr.update("client1", "rule_a", 30, now=_iso(3))
        assert rec.consecutive_count == 3
        assert rec.escalation_level == 0


class TestEscalationToUrgent:
    """Test 5: 10+ triggers over 14+ days with confidence=80 → level 3 (urgent)."""

    def test_escalates_to_urgent(self):
        mgr = EscalationManager()
        for i in range(10):
            rec = mgr.update("client1", "rule_a", 80, now=_iso(i * 2))
        # 10 triggers, days_active = 18 (day 0 to day 18), confidence 80
        assert rec.consecutive_count == 10
        assert rec.escalation_level == 3


# ---------------------------------------------------------------------------
# Dismiss and cooldown
# ---------------------------------------------------------------------------


class TestDismiss:
    """Test 6: dismiss sets user_dismissed_at and resets consecutive_count."""

    def test_dismiss_resets_count(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        mgr.update("client1", "rule_a", 50, now=_iso(1))
        mgr.dismiss("client1", "rule_a", now=_iso(2))
        rec = mgr.get_record("client1", "rule_a")
        assert rec.consecutive_count == 0
        assert rec.user_dismissed_at == _iso(2)


class TestCooldownBlocksUpdate:
    """Test 7: Rule in cooldown → update returns record WITHOUT incrementing."""

    def test_cooldown_blocks_increment(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        mgr.dismiss("client1", "rule_a", now=_iso(1))
        # Try to update 3 days later (still in 7-day cooldown)
        rec = mgr.update("client1", "rule_a", 60, now=_iso(4))
        assert rec.consecutive_count == 0  # not incremented
        assert rec.max_confidence == 50     # not updated


class TestCooldownExpiry:
    """Test 8: After 7 days, cooldown expires and update works again."""

    def test_cooldown_expires(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        mgr.dismiss("client1", "rule_a", now=_iso(1))
        # Update after cooldown period
        rec = mgr.update("client1", "rule_a", 60, now=_iso(8))
        assert rec.consecutive_count == 1
        assert rec.max_confidence == 60


# ---------------------------------------------------------------------------
# Max confidence tracking
# ---------------------------------------------------------------------------


class TestMaxConfidence:
    """Test 9: max_confidence tracks the highest value seen."""

    def test_higher_confidence_updates(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 30, now=_iso(0))
        mgr.update("client1", "rule_a", 70, now=_iso(1))
        rec = mgr.update("client1", "rule_a", 50, now=_iso(2))
        assert rec.max_confidence == 70  # kept highest, didn't drop to 50


# ---------------------------------------------------------------------------
# Info and lookup
# ---------------------------------------------------------------------------


class TestGetEscalationInfo:
    """Test 10: get_escalation_info returns correct dict with all fields."""

    def test_escalation_info_dict(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 55, now=_iso(0))
        mgr.update("client1", "rule_a", 60, now=_iso(5))
        info = mgr.get_escalation_info("client1", "rule_a")
        assert info is not None
        assert info["first_seen"] == _iso(0)
        assert info["days_active"] == 5
        assert info["level"] == 0
        assert info["level_name"] == "notice"
        assert info["consecutive_count"] == 2
        assert info["was_dismissed"] is False
        assert info["max_confidence"] == 60


class TestIsCooldown:
    """Test 11: is_in_cooldown True during cooldown, False after."""

    def test_in_cooldown(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        mgr.dismiss("client1", "rule_a", now=_iso(1))
        assert mgr.is_in_cooldown("client1", "rule_a", now=_iso(3)) is True
        assert mgr.is_in_cooldown("client1", "rule_a", now=_iso(8)) is False


# ---------------------------------------------------------------------------
# Independence of rules
# ---------------------------------------------------------------------------


class TestMultipleRulesIndependent:
    """Test 12: Multiple rules tracked independently."""

    def test_rules_dont_interfere(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        mgr.update("client1", "rule_a", 50, now=_iso(1))
        mgr.update("client1", "rule_b", 30, now=_iso(0))

        rec_a = mgr.get_record("client1", "rule_a")
        rec_b = mgr.get_record("client1", "rule_b")
        assert rec_a.consecutive_count == 2
        assert rec_b.consecutive_count == 1
        assert rec_a.max_confidence == 50
        assert rec_b.max_confidence == 30


# ---------------------------------------------------------------------------
# DB round-trip
# ---------------------------------------------------------------------------


class TestDBRoundtrip:
    """Test 13: load_from_db + save_to_db roundtrip with MockDB."""

    def test_save_and_load(self):
        mock = MockDB()
        mock.setup()

        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 55, now=_iso(0))
        mgr.update("client1", "rule_a", 65, now=_iso(3))
        mgr.update("client1", "rule_a", 70, now=_iso(5))

        with mock.cursor() as c:
            mgr.save_to_db(c, "client1")

        # Load into a fresh manager
        mgr2 = EscalationManager()
        with mock.cursor() as c:
            mgr2.load_from_db(c, "client1")

        rec = mgr2.get_record("client1", "rule_a")
        assert rec is not None
        assert rec.consecutive_count == 3
        assert rec.max_confidence == 70
        assert rec.first_triggered == _iso(0)
        assert rec.last_triggered == _iso(5)

        mock.teardown()


# ---------------------------------------------------------------------------
# Unknown rule lookup
# ---------------------------------------------------------------------------


class TestGetRecordUnknown:
    """Test 14: get_record returns None for unknown rule."""

    def test_unknown_rule_returns_none(self):
        mgr = EscalationManager()
        assert mgr.get_record("client1", "nonexistent") is None
        assert mgr.get_escalation_info("client1", "nonexistent") is None


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


class TestDismissUnknownRule:
    """Dismissing an unknown rule is a no-op."""

    def test_dismiss_unknown_does_nothing(self):
        mgr = EscalationManager()
        mgr.dismiss("client1", "unknown_rule", now=_iso(0))  # should not raise


class TestEscalationToProblem:
    """Level 2 (problem): 5+ triggers over 7+ days with confidence > 50."""

    def test_escalates_to_problem(self):
        mgr = EscalationManager()
        for i in range(5):
            rec = mgr.update("client1", "rule_x", 55, now=_iso(i * 2))
        # 5 triggers, days_active = 8 (day 0 to day 8), confidence 55
        assert rec.consecutive_count == 5
        assert rec.escalation_level == 2


class TestCooldownFalseWithoutDismiss:
    """is_in_cooldown returns False when never dismissed."""

    def test_no_dismiss_no_cooldown(self):
        mgr = EscalationManager()
        mgr.update("client1", "rule_a", 50, now=_iso(0))
        assert mgr.is_in_cooldown("client1", "rule_a", now=_iso(0)) is False
