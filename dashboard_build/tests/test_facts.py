"""Tests for Typed Facts — FactType, Fact, FactGenerator."""

import os
import pytest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DTC_INDEX_PATH = os.path.join(DATA_DIR, "dtc-index-sample.json")
SITUATIONS_PATH = os.path.join(DATA_DIR, "situations-sample.json")

from diagnostic.facts import Fact, FactType, FactGenerator
from diagnostic.knowledge_base import KnowledgeBase
from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.normalizer import NormalizedPacket
from diagnostic.feature_extractor import extract_features


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def kb():
    return KnowledgeBase(DTC_INDEX_PATH, SITUATIONS_PATH)


@pytest.fixture
def profile():
    return VehicleProfile(
        client_hash="test123",
        brand="li_auto",
        model="L7",
        year=2023,
    )


@pytest.fixture
def generator(profile, kb):
    return FactGenerator(profile, kb)


def _make_packet(**kwargs) -> NormalizedPacket:
    """Helper to build a NormalizedPacket with overrides."""
    return NormalizedPacket(**kwargs)


# ---------------------------------------------------------------------------
# Fact dataclass
# ---------------------------------------------------------------------------

class TestFactCreation:
    def test_defaults(self):
        f = Fact(type=FactType.DTC_ACTIVE, timestamp=1000.0)
        assert f.type == FactType.DTC_ACTIVE
        assert f.timestamp == 1000.0
        assert f.value == 0.0
        assert f.severity == "ok"
        assert f.confidence == 1.0
        assert f.context == {}
        assert f.source_tier == "T1"
        assert f.details == {}

    def test_custom_values(self):
        f = Fact(
            type=FactType.OVERHEAT,
            timestamp=2000.0,
            value=110.0,
            severity="danger",
            confidence=0.95,
            context={"coolant_temp": 110},
            source_tier="T2",
            details={"threshold": 105},
        )
        assert f.type == FactType.OVERHEAT
        assert f.value == 110.0
        assert f.severity == "danger"
        assert f.confidence == 0.95
        assert f.context == {"coolant_temp": 110}
        assert f.source_tier == "T2"
        assert f.details == {"threshold": 105}


# ---------------------------------------------------------------------------
# FactType enum
# ---------------------------------------------------------------------------

class TestFactTypeEnum:
    def test_all_members_exist(self):
        expected = {
            "DTC_ACTIVE", "LTFT_SEVERITY", "OVERHEAT", "LOW_VOLTAGE",
            "VIBRATION_ANOMALY", "AUDIO_ANOMALY", "THRESHOLD_BREACH",
            "CUSUM_ALARM", "BASELINE_DRIFT", "LTFT_TREND", "DEGRADATION",
            "VIBRATION_RPM_CORRELATION", "AUDIO_WHEEL_CORRELATION",
            "MULTI_DTC_PATTERN",
        }
        actual = {m.name for m in FactType}
        assert expected == actual


# ---------------------------------------------------------------------------
# DTC facts
# ---------------------------------------------------------------------------

class TestDtcFacts:
    def test_single_dtc_produces_fact(self, generator):
        packet = _make_packet(dtc_codes=["P0171"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        dtc_facts = [f for f in facts if f.type == FactType.DTC_ACTIVE]
        assert len(dtc_facts) == 1
        assert dtc_facts[0].details["dtc_code"] == "P0171"
        assert dtc_facts[0].severity in ("ok", "info", "warning", "urgent", "critical", "danger")

    def test_unknown_dtc_still_produces_fact(self, generator):
        packet = _make_packet(dtc_codes=["Z9999"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        dtc_facts = [f for f in facts if f.type == FactType.DTC_ACTIVE]
        assert len(dtc_facts) == 1
        assert dtc_facts[0].details["dtc_code"] == "Z9999"
        assert dtc_facts[0].severity == "warning"  # unknown → warning

    def test_critical_dtc_severity(self, generator):
        packet = _make_packet(dtc_codes=["B0001"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        dtc_facts = [f for f in facts if f.type == FactType.DTC_ACTIVE]
        assert len(dtc_facts) == 1
        assert dtc_facts[0].severity == "critical"

    def test_no_dtc_no_dtc_facts(self, generator):
        packet = _make_packet(dtc_codes=[], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        dtc_facts = [f for f in facts if f.type == FactType.DTC_ACTIVE]
        assert dtc_facts == []


# ---------------------------------------------------------------------------
# Multi-DTC pattern
# ---------------------------------------------------------------------------

class TestMultiDtcPattern:
    def test_matching_pattern_produces_fact(self, generator):
        packet = _make_packet(dtc_codes=["P0171", "P0174"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        multi = [f for f in facts if f.type == FactType.MULTI_DTC_PATTERN]
        assert len(multi) == 1
        assert multi[0].details["situation_id"] == "air_leak"
        assert multi[0].details["boost"] == 25

    def test_single_dtc_no_multi_pattern(self, generator):
        packet = _make_packet(dtc_codes=["P0171"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        multi = [f for f in facts if f.type == FactType.MULTI_DTC_PATTERN]
        assert multi == []

    def test_unrelated_codes_no_multi_pattern(self, generator):
        packet = _make_packet(dtc_codes=["P0420", "B0001"], rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        multi = [f for f in facts if f.type == FactType.MULTI_DTC_PATTERN]
        assert multi == []


# ---------------------------------------------------------------------------
# Overheat
# ---------------------------------------------------------------------------

class TestOverheat:
    def test_overheat_detected(self, generator):
        packet = _make_packet(coolant_temp=110.0, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        oh = [f for f in facts if f.type == FactType.OVERHEAT]
        assert len(oh) == 1
        assert oh[0].severity == "danger"
        assert oh[0].value == 110.0

    def test_no_overheat_at_normal_temp(self, generator):
        packet = _make_packet(coolant_temp=90.0, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        oh = [f for f in facts if f.type == FactType.OVERHEAT]
        assert oh == []

    def test_no_overheat_when_missing(self, generator):
        packet = _make_packet(coolant_temp=None, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        oh = [f for f in facts if f.type == FactType.OVERHEAT]
        assert oh == []

    def test_boundary_105_not_overheat(self, generator):
        """Exactly 105 should NOT trigger (> 105 required)."""
        packet = _make_packet(coolant_temp=105.0, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        oh = [f for f in facts if f.type == FactType.OVERHEAT]
        assert oh == []


# ---------------------------------------------------------------------------
# Low voltage
# ---------------------------------------------------------------------------

class TestLowVoltage:
    def test_low_voltage_at_high_rpm(self, generator):
        packet = _make_packet(voltage=12.5, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert len(lv) == 1
        assert lv[0].severity == "warning"
        assert lv[0].value == 12.5

    def test_no_low_voltage_at_low_rpm(self, generator):
        """Low voltage at idle (rpm <= 1000) — alternator may not be charging. No fact."""
        packet = _make_packet(voltage=12.5, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert lv == []

    def test_no_low_voltage_when_normal(self, generator):
        packet = _make_packet(voltage=14.2, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert lv == []

    def test_no_low_voltage_when_missing(self, generator):
        packet = _make_packet(voltage=None, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert lv == []

    def test_boundary_13_not_low_voltage(self, generator):
        """Exactly 13.0 should NOT trigger (< 13.0 required)."""
        packet = _make_packet(voltage=13.0, rpm=2000.0, speed=60.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert lv == []

    def test_boundary_rpm_1000_not_low_voltage(self, generator):
        """Exactly rpm=1000 should NOT trigger (> 1000 required)."""
        packet = _make_packet(voltage=12.5, rpm=1000.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        lv = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert lv == []
