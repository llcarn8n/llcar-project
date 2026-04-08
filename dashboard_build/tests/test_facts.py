"""Tests for Typed Facts — FactType, Fact, FactGenerator."""

import os
import pytest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DTC_INDEX_PATH = os.path.join(DATA_DIR, "dtc-index-sample.json")
SITUATIONS_PATH = os.path.join(DATA_DIR, "situations-sample.json")

from diagnostic.facts import Fact, FactType, FactGenerator
from diagnostic.knowledge_base import KnowledgeBase
from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.normalizer import NormalizedPacket, EngineContext, DrivingRegime
from diagnostic.feature_extractor import extract_features
from diagnostic.baseline_store import BaselineStore, RegimeBaseline


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
            "MULTI_DTC_PATTERN", "CORRELATION",
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


# ---------------------------------------------------------------------------
# Helpers for baseline-aware tests
# ---------------------------------------------------------------------------

def _make_ready_baselines(regime_str: str = "idle") -> BaselineStore:
    """Build a BaselineStore with az_std and total_vibration baselines
    that have enough samples (>=30) to be ready for z-score computation.
    """
    store = BaselineStore()

    # az_std: mean=0.5, std~0.1
    bl_az = RegimeBaseline(count=100, mean=0.5, m2=0.99, min_val=0.2, max_val=0.8)
    store.baselines[(regime_str, "az_std")] = bl_az

    # total_vibration: mean=1.0, std~0.2
    bl_tv = RegimeBaseline(count=100, mean=1.0, m2=3.96, min_val=0.4, max_val=1.6)
    store.baselines[(regime_str, "total_vibration")] = bl_tv

    return store


def _make_ready_baselines_with_audio(regime_str: str = "idle") -> BaselineStore:
    """Baselines ready for both vibration and audio features."""
    store = _make_ready_baselines(regime_str)

    # dominant_freq: mean=200, std~20
    bl_freq = RegimeBaseline(count=100, mean=200.0, m2=39600.0, min_val=150.0, max_val=250.0)
    store.baselines[(regime_str, "dominant_freq")] = bl_freq

    # dominant_amp: mean=50, std~5
    bl_amp = RegimeBaseline(count=100, mean=50.0, m2=2475.0, min_val=35.0, max_val=65.0)
    store.baselines[(regime_str, "dominant_amp")] = bl_amp

    return store


# ---------------------------------------------------------------------------
# LTFT severity
# ---------------------------------------------------------------------------

class TestLtftSeverity:
    def test_ltft_severity_normal(self, generator):
        """LTFT=2.0 with default profile → corrected_abs=2.0 → normal."""
        packet = _make_packet(ltft_bank1=2.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "normal"
        assert ltft_facts[0].details["level_name"] == "normal_low"

    def test_ltft_severity_borderline(self, generator):
        """LTFT=6.0 → corrected_abs=6.0 → borderline."""
        packet = _make_packet(ltft_bank1=6.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "borderline"

    def test_ltft_severity_problem(self, generator):
        """LTFT=12.0 → problem."""
        packet = _make_packet(ltft_bank1=12.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "problem"

    def test_ltft_severity_danger(self, generator):
        """LTFT=40.0 → danger."""
        packet = _make_packet(ltft_bank1=40.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "danger"

    def test_ltft_severity_negative(self, generator):
        """Negative LTFT=-8.0 → abs=8.0 → elevated."""
        packet = _make_packet(ltft_bank1=-8.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "elevated"

    def test_ltft_severity_no_ltft(self, generator):
        """No LTFT data → no LTFT_SEVERITY fact."""
        packet = _make_packet(ltft_bank1=None, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert ltft_facts == []

    def test_ltft_severity_winter_correction(self, generator):
        """LTFT=8.0 with ambient=-20 → winter correction subtracts 4 → abs=4.0 → normal."""
        packet = _make_packet(
            ltft_bank1=8.0, rpm=800.0, speed=0.0,
            engine_context=EngineContext(ambient_temp=-20.0),
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        assert ltft_facts[0].severity == "normal"
        assert ltft_facts[0].details["winter_correction"] is True
        assert ltft_facts[0].value == pytest.approx(4.0)

    def test_ltft_severity_details_populated(self, generator):
        """Details dict includes raw_ltft, corrected values, and profile corrections."""
        packet = _make_packet(ltft_bank1=10.0, rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)

        ltft_facts = [f for f in facts if f.type == FactType.LTFT_SEVERITY]
        assert len(ltft_facts) == 1
        d = ltft_facts[0].details
        assert d["raw_ltft"] == 10.0
        assert "corrected_ltft" in d
        assert "corrected_abs" in d
        assert "offset_applied" in d
        assert "mult_applied" in d


# ---------------------------------------------------------------------------
# Vibration anomaly (z-score)
# ---------------------------------------------------------------------------

class TestVibrationAnomaly:
    def test_vibration_anomaly_detected(self, generator):
        """az_std far above baseline mean → VIBRATION_ANOMALY fact."""
        baselines = _make_ready_baselines("idle")
        # az_std baseline: mean=0.5, std=0.1 → value=1.0 → z=5.0
        packet = _make_packet(
            az_std=1.0, az_avg=0.0, az_min=-1.0, az_max=1.0,
            ax_std=0.1, ax_avg=0.0, ax_min=-0.1, ax_max=0.1,
            ay_std=0.1, ay_avg=0.0, ay_min=-0.1, ay_max=0.1,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        vib = [f for f in facts if f.type == FactType.VIBRATION_ANOMALY]
        assert len(vib) >= 1
        az_fact = [f for f in vib if f.details["feature"] == "az_std"]
        assert len(az_fact) == 1
        assert abs(az_fact[0].details["z_score"]) > 2.0

    def test_vibration_anomaly_urgent_severity(self, generator):
        """z > 3.0 → severity=urgent."""
        baselines = _make_ready_baselines("idle")
        # az_std baseline: mean=0.5, std=0.1 → value=1.5 → z=10.0
        packet = _make_packet(
            az_std=1.5, az_avg=0.0, az_min=-1.5, az_max=1.5,
            ax_std=0.1, ax_avg=0.0, ax_min=-0.1, ax_max=0.1,
            ay_std=0.1, ay_avg=0.0, ay_min=-0.1, ay_max=0.1,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        az_facts = [
            f for f in facts
            if f.type == FactType.VIBRATION_ANOMALY and f.details["feature"] == "az_std"
        ]
        assert len(az_facts) == 1
        assert az_facts[0].severity == "urgent"

    def test_no_vibration_anomaly_normal_values(self, generator):
        """Values within baseline → no VIBRATION_ANOMALY fact."""
        baselines = _make_ready_baselines("idle")
        # az_std=0.5 (mean) → z=0; total_vibration=sqrt(0.5^2+0.7^2+0.5^2)≈0.995 ≈ mean 1.0
        packet = _make_packet(
            az_std=0.5, az_avg=0.0, az_min=-0.5, az_max=0.5,
            ax_std=0.7, ax_avg=0.0, ax_min=-0.7, ax_max=0.7,
            ay_std=0.5, ay_avg=0.0, ay_min=-0.5, ay_max=0.5,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        vib = [f for f in facts if f.type == FactType.VIBRATION_ANOMALY]
        assert vib == []

    def test_no_anomaly_without_baselines(self, generator):
        """No baselines passed → no anomaly facts."""
        packet = _make_packet(
            az_std=5.0, az_avg=0.0, az_min=-5.0, az_max=5.0,
            ax_std=0.1, ax_avg=0.0, ax_min=-0.1, ax_max=0.1,
            ay_std=0.1, ay_avg=0.0, ay_min=-0.1, ay_max=0.1,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features)  # no baselines

        vib = [f for f in facts if f.type == FactType.VIBRATION_ANOMALY]
        assert vib == []

    def test_no_anomaly_baselines_not_ready(self, generator):
        """Baselines exist but not ready (too few samples) → no anomaly facts."""
        store = BaselineStore()
        # Only 5 samples — not enough
        bl = RegimeBaseline(count=5, mean=0.5, m2=0.04, min_val=0.3, max_val=0.7)
        store.baselines[("idle", "az_std")] = bl
        store.baselines[("idle", "total_vibration")] = RegimeBaseline(
            count=5, mean=1.0, m2=0.16, min_val=0.6, max_val=1.4,
        )

        packet = _make_packet(
            az_std=5.0, az_avg=0.0, az_min=-5.0, az_max=5.0,
            ax_std=0.1, ax_avg=0.0, ax_min=-0.1, ax_max=0.1,
            ay_std=0.1, ay_avg=0.0, ay_min=-0.1, ay_max=0.1,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=store)

        vib = [f for f in facts if f.type == FactType.VIBRATION_ANOMALY]
        assert vib == []


# ---------------------------------------------------------------------------
# Audio anomaly (z-score)
# ---------------------------------------------------------------------------

class TestAudioAnomaly:
    def test_audio_anomaly_detected(self, generator):
        """dominant_freq far above baseline → AUDIO_ANOMALY fact."""
        baselines = _make_ready_baselines_with_audio("idle")
        # dominant_freq baseline: mean=200, std=20 → value=300 → z=5.0
        packet = _make_packet(
            dominant_freq=300.0, dominant_amp=50.0, audio_quality=80.0,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        audio = [f for f in facts if f.type == FactType.AUDIO_ANOMALY]
        assert len(audio) >= 1
        freq_fact = [f for f in audio if f.details["feature"] == "dominant_freq"]
        assert len(freq_fact) == 1
        assert abs(freq_fact[0].details["z_score"]) > 2.0

    def test_no_audio_anomaly_normal_values(self, generator):
        """Audio values near baseline → no AUDIO_ANOMALY fact."""
        baselines = _make_ready_baselines_with_audio("idle")
        # Exactly at mean
        packet = _make_packet(
            dominant_freq=200.0, dominant_amp=50.0, audio_quality=80.0,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        audio = [f for f in facts if f.type == FactType.AUDIO_ANOMALY]
        assert audio == []

    def test_audio_anomaly_amp_spike(self, generator):
        """dominant_amp far above baseline → AUDIO_ANOMALY on amp."""
        baselines = _make_ready_baselines_with_audio("idle")
        # dominant_amp baseline: mean=50, std=5 → value=80 → z=6.0
        packet = _make_packet(
            dominant_freq=200.0, dominant_amp=80.0, audio_quality=80.0,
            rpm=800.0, speed=0.0, regime=DrivingRegime.IDLE,
        )
        features = extract_features(packet)
        facts = generator.generate(packet, features, baselines=baselines)

        amp_facts = [
            f for f in facts
            if f.type == FactType.AUDIO_ANOMALY and f.details["feature"] == "dominant_amp"
        ]
        assert len(amp_facts) == 1
        assert abs(amp_facts[0].details["z_score"]) > 2.0


# ---------------------------------------------------------------------------
# CUSUM alarm
# ---------------------------------------------------------------------------

class TestCusumAlarm:
    def test_cusum_alarm_on_degrading(self, generator):
        """health_trends with degrading system → CUSUM_ALARM fact."""
        trends = {"engine": "\u2193", "suspension": "\u2192"}
        packet = _make_packet(rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features, health_trends=trends)

        cusum = [f for f in facts if f.type == FactType.CUSUM_ALARM]
        assert len(cusum) == 1
        assert cusum[0].details["system"] == "engine"
        assert cusum[0].severity == "warning"

    def test_cusum_alarm_multiple_degrading(self, generator):
        """Multiple degrading systems → multiple CUSUM_ALARM facts."""
        trends = {
            "engine": "\u2193",
            "suspension": "\u2193",
            "electrical": "\u2192",
            "audio": "\u2191",
        }
        packet = _make_packet(rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features, health_trends=trends)

        cusum = [f for f in facts if f.type == FactType.CUSUM_ALARM]
        assert len(cusum) == 2
        systems = {f.details["system"] for f in cusum}
        assert systems == {"engine", "suspension"}

    def test_no_cusum_alarm_when_stable(self, generator):
        """All systems stable → no CUSUM_ALARM fact."""
        trends = {
            "engine": "\u2192",
            "suspension": "\u2192",
            "electrical": "\u2192",
            "audio": "\u2192",
        }
        packet = _make_packet(rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features, health_trends=trends)

        cusum = [f for f in facts if f.type == FactType.CUSUM_ALARM]
        assert cusum == []

    def test_no_cusum_alarm_without_trends(self, generator):
        """No health_trends → no CUSUM_ALARM facts."""
        packet = _make_packet(rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features)  # no health_trends

        cusum = [f for f in facts if f.type == FactType.CUSUM_ALARM]
        assert cusum == []

    def test_cusum_alarm_improving_not_triggered(self, generator):
        """Improving trend ("↑") should NOT produce CUSUM_ALARM."""
        trends = {"engine": "\u2191", "suspension": "\u2191"}
        packet = _make_packet(rpm=800.0, speed=0.0)
        features = extract_features(packet)
        facts = generator.generate(packet, features, health_trends=trends)

        cusum = [f for f in facts if f.type == FactType.CUSUM_ALARM]
        assert cusum == []


# ---------------------------------------------------------------------------
# Backward compatibility
# ---------------------------------------------------------------------------

class TestBackwardCompatibility:
    def test_generate_without_optional_params(self, generator):
        """generate() still works without baselines/health_trends (backward compat)."""
        packet = _make_packet(
            dtc_codes=["P0171"], coolant_temp=110.0,
            voltage=12.5, rpm=2000.0, speed=60.0,
        )
        features = extract_features(packet)
        # Call without optional params — must not raise
        facts = generator.generate(packet, features)
        assert isinstance(facts, list)
        # Should still produce the original 4 fact types
        types = {f.type for f in facts}
        assert FactType.DTC_ACTIVE in types
        assert FactType.OVERHEAT in types
        assert FactType.LOW_VOLTAGE in types
