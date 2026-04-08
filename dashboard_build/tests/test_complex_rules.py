"""Tests for complex Python diagnostic rules.

Tests verify:
  - rule_fuel_bank_cross: lean/rich/localized detection
  - rule_vibration_regime_dependency: regime-based vibration analysis
  - rule_audio_engine_harmonic: RPM harmonic detection
  - rule_warmup_anomaly: warm-engine anomaly detection
  - rule_speed_vibration_resonance: speed-specific vibration resonance
  - Integration with RuleEngine.run_all
  - Robustness with missing data
"""
from __future__ import annotations

import random
import pytest

from diagnostic.normalizer import NormalizedPacket, DrivingRegime
from diagnostic.baseline_store import BaselineStore, RegimeBaseline
from diagnostic.rule_engine import RuleEngine
from diagnostic.rules.complex_rules import (
    ALL_RULES,
    rule_fuel_bank_cross,
    rule_vibration_regime_dependency,
    rule_audio_engine_harmonic,
    rule_warmup_anomaly,
    rule_speed_vibration_resonance,
    _confidence_to_status,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_packet(**kwargs) -> NormalizedPacket:
    """Create a NormalizedPacket with given overrides."""
    defaults = dict(
        rpm=800.0,
        speed=0.0,
        coolant_temp=90.0,
        voltage=14.2,
        ltft_bank1=2.0,
        ltft_bank2=1.0,
        stft_bank1=1.0,
        regime=DrivingRegime.IDLE,
        tier="T1",
    )
    defaults.update(kwargs)
    return NormalizedPacket(**defaults)


def _make_features(**kwargs) -> dict:
    """Create a features dict with defaults for healthy vehicle."""
    defaults = dict(
        total_vibration=1.0,
        az_range=2.0,
        ltft_abs=2.0,
        crest_factor_x=1.2,
        crest_factor_y=1.1,
        crest_factor_z=1.3,
        vibration_speed_ratio=0.01,
        az_std=1.0,
    )
    defaults.update(kwargs)
    return defaults


def _make_baselines_store(regimes=None) -> BaselineStore:
    """Create a baseline store with samples for given regimes.

    Default: idle regime with 50 samples of 'normal' data.
    """
    store = BaselineStore()
    if regimes is None:
        regimes = ["idle"]

    random.seed(42)
    for regime in regimes:
        for _ in range(50):
            store.update(regime, {
                "az_std": 1.0 + random.gauss(0, 0.3),
                "total_vibration": 1.5 + random.gauss(0, 0.2),
                "dominant_amp": 0.5 + random.gauss(0, 0.1),
                "dominant_freq": 100.0 + random.gauss(0, 5.0),
            })
    return store


# ---------------------------------------------------------------------------
# Test: rule_fuel_bank_cross
# ---------------------------------------------------------------------------

class TestFuelBankCross:
    def test_both_banks_positive_lean_general(self):
        """Both banks > 5% → lean_general with confidence > 40."""
        packet = _make_packet(ltft_bank1=12.0, ltft_bank2=10.0)
        features = _make_features(ltft_abs=12.0)
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        assert result["name"] == "fuel_bank_cross"
        assert result["details"]["cross_type"] == "lean_general"
        assert result["confidence"] > 40
        assert result["tier"] == "T1"

    def test_both_banks_negative_rich_general(self):
        """Both banks < -5% → rich_general."""
        packet = _make_packet(ltft_bank1=-8.0, ltft_bank2=-7.0)
        features = _make_features(ltft_abs=8.0)
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        assert result["details"]["cross_type"] == "rich_general"
        assert result["confidence"] > 40

    def test_bank1_high_bank2_ok_localized(self):
        """Bank 1 high, Bank 2 ok → localized_bank1."""
        packet = _make_packet(ltft_bank1=15.0, ltft_bank2=2.0)
        features = _make_features(ltft_abs=15.0)
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        assert result["details"]["cross_type"] == "localized_bank1"

    def test_bank2_high_bank1_ok_localized(self):
        """Bank 2 high, Bank 1 ok → localized_bank2."""
        packet = _make_packet(ltft_bank1=1.0, ltft_bank2=14.0)
        features = _make_features(ltft_abs=14.0)
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        assert result["details"]["cross_type"] == "localized_bank2"

    def test_both_banks_under_threshold_returns_none(self):
        """Both banks < 5% → None (not applicable)."""
        packet = _make_packet(ltft_bank1=3.0, ltft_bank2=2.0)
        features = _make_features(ltft_abs=3.0)
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is None

    def test_missing_bank_data_returns_none(self):
        """Missing bank data → None."""
        packet = _make_packet(ltft_bank1=None, ltft_bank2=None)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is None

    def test_higher_ltft_gives_higher_confidence(self):
        """Higher LTFT magnitude → higher confidence."""
        packet_low = _make_packet(ltft_bank1=6.0, ltft_bank2=6.0)
        packet_high = _make_packet(ltft_bank1=20.0, ltft_bank2=18.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result_low = rule_fuel_bank_cross(features, packet_low, baselines, DrivingRegime.IDLE)
        result_high = rule_fuel_bank_cross(features, packet_high, baselines, DrivingRegime.IDLE)

        assert result_low is not None
        assert result_high is not None
        assert result_high["confidence"] > result_low["confidence"]


# ---------------------------------------------------------------------------
# Test: rule_vibration_regime_dependency
# ---------------------------------------------------------------------------

class TestVibrationRegimeDependency:
    def _build_baselines_with_elevated(self, elevated_regimes):
        """Build baselines where specified regimes have high az_std."""
        store = BaselineStore()
        random.seed(42)
        all_regimes = ["idle", "city", "highway"]
        for regime in all_regimes:
            for _ in range(50):
                base_val = 5.0 if regime in elevated_regimes else 1.0
                store.update(regime, {
                    "az_std": base_val + random.gauss(0, 0.3),
                    "total_vibration": 1.5 + random.gauss(0, 0.2),
                })
        return store

    def test_only_highway_high_wheel_balance(self):
        """Only highway vibration high → wheel_balance_tire."""
        store = self._build_baselines_with_elevated(["highway"])
        packet = _make_packet(az_std=5.0, speed=110, regime=DrivingRegime.HIGHWAY)
        features = _make_features(az_std=5.0)

        result = rule_vibration_regime_dependency(features, packet, store, DrivingRegime.HIGHWAY)
        assert result is not None
        assert result["details"]["pattern"] == "highway_only"

    def test_only_idle_high_engine_mount(self):
        """Only idle vibration high → engine_mount_misfire."""
        store = self._build_baselines_with_elevated(["idle"])
        packet = _make_packet(az_std=5.0, speed=0, regime=DrivingRegime.IDLE)
        features = _make_features(az_std=5.0)

        result = rule_vibration_regime_dependency(features, packet, store, DrivingRegime.IDLE)
        assert result is not None
        assert result["details"]["pattern"] == "idle_only"

    def test_all_regimes_high_general_wear(self):
        """All regimes high → general_suspension_wear."""
        store = self._build_baselines_with_elevated(["idle", "city", "highway"])
        packet = _make_packet(az_std=5.0, speed=60, regime=DrivingRegime.CITY)
        features = _make_features(az_std=5.0)

        result = rule_vibration_regime_dependency(features, packet, store, DrivingRegime.CITY)
        assert result is not None
        assert result["details"]["pattern"] == "all_regimes"

    def test_baselines_not_ready_returns_none(self):
        """Baselines with < 30 samples → None."""
        store = BaselineStore()
        # Only 10 samples — not enough
        for _ in range(10):
            store.update("idle", {"az_std": 1.0})
        packet = _make_packet(az_std=5.0)
        features = _make_features(az_std=5.0)

        result = rule_vibration_regime_dependency(features, packet, store, DrivingRegime.IDLE)
        assert result is None


# ---------------------------------------------------------------------------
# Test: rule_audio_engine_harmonic
# ---------------------------------------------------------------------------

class TestAudioEngineHarmonic:
    def test_freq_matches_rpm_harmonic(self):
        """Dominant freq matches RPM harmonic → engine noise detected."""
        # RPM=1800 → engine_base = 30 Hz; harmonic 2 = 60 Hz
        packet = _make_packet(rpm=1800, dominant_freq=61.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.CITY)
        assert result is not None
        assert result["name"] == "audio_engine_harmonic"
        assert result["details"]["harmonic_number"] == 2
        assert result["confidence"] > 40

    def test_freq_no_harmonic_match(self):
        """Freq doesn't match any harmonic → None."""
        # RPM=1800 → engine_base = 30 Hz; harmonics at 30,60,90...240
        # freq=500 doesn't match any
        packet = _make_packet(rpm=1800, dominant_freq=500.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.CITY)
        assert result is None

    def test_high_harmonic_valve_train(self):
        """Harmonic 4-8 → valve train / injector tick."""
        # RPM=1200 → base=20 Hz; harmonic 6 = 120 Hz
        packet = _make_packet(rpm=1200, dominant_freq=120.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        assert result["details"]["harmonic_number"] == 6
        assert "valve" in result["details"]["source"].lower() or "injector" in result["details"]["source"].lower()

    def test_low_harmonic_exhaust(self):
        """Harmonic 1-2 → exhaust / misfire."""
        # RPM=3000 → base=50 Hz; harmonic 1 = 50 Hz
        packet = _make_packet(rpm=3000, dominant_freq=51.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.CITY)
        assert result is not None
        assert result["details"]["harmonic_number"] == 1
        assert "exhaust" in result["details"]["source"].lower() or "misfire" in result["details"]["source"].lower()

    def test_missing_rpm_returns_none(self):
        """No RPM data → None."""
        packet = _make_packet(rpm=None, dominant_freq=100.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.IDLE)
        assert result is None

    def test_missing_dominant_freq_returns_none(self):
        """No audio freq → None."""
        packet = _make_packet(rpm=1800, dominant_freq=None)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_audio_engine_harmonic(features, packet, baselines, DrivingRegime.IDLE)
        assert result is None


# ---------------------------------------------------------------------------
# Test: rule_warmup_anomaly
# ---------------------------------------------------------------------------

class TestWarmupAnomaly:
    def test_warm_engine_high_vibration_fires(self):
        """Coolant > 80 + vibration z > 2.0 → fires."""
        store = _make_baselines_store()
        # Normal baselines have az_std ~ 1.0, so value=5.0 gives high z-score
        packet = _make_packet(coolant_temp=95.0, az_std=5.0)
        features = _make_features(az_std=5.0, ltft_abs=3.0)

        result = rule_warmup_anomaly(features, packet, store, DrivingRegime.IDLE)
        assert result is not None
        assert result["name"] == "warmup_anomaly"
        assert result["confidence"] > 40

    def test_warm_engine_high_ltft_fires(self):
        """Coolant > 80 + ltft_abs > 10 → fires."""
        store = _make_baselines_store()
        packet = _make_packet(coolant_temp=92.0, az_std=1.0)
        features = _make_features(az_std=1.0, ltft_abs=15.0)

        result = rule_warmup_anomaly(features, packet, store, DrivingRegime.IDLE)
        assert result is not None
        assert result["confidence"] > 40

    def test_cold_engine_returns_none(self):
        """Coolant < 70 → None (engine not warm yet)."""
        store = _make_baselines_store()
        packet = _make_packet(coolant_temp=55.0, az_std=5.0)
        features = _make_features(az_std=5.0, ltft_abs=15.0)

        result = rule_warmup_anomaly(features, packet, store, DrivingRegime.IDLE)
        assert result is None

    def test_warm_engine_normal_data_returns_none(self):
        """Warm engine but all values normal → None."""
        store = _make_baselines_store()
        packet = _make_packet(coolant_temp=90.0, az_std=1.0)
        features = _make_features(az_std=1.0, ltft_abs=3.0)

        result = rule_warmup_anomaly(features, packet, store, DrivingRegime.IDLE)
        assert result is None

    def test_missing_coolant_returns_none(self):
        """No coolant data → None."""
        store = _make_baselines_store()
        packet = _make_packet(coolant_temp=None, az_std=5.0)
        features = _make_features(az_std=5.0, ltft_abs=15.0)

        result = rule_warmup_anomaly(features, packet, store, DrivingRegime.IDLE)
        assert result is None


# ---------------------------------------------------------------------------
# Test: rule_speed_vibration_resonance
# ---------------------------------------------------------------------------

class TestSpeedVibrationResonance:
    def test_high_z_at_highway_speed_fires(self):
        """High vibration z-score at highway speed → resonance detected."""
        store = BaselineStore()
        random.seed(42)
        for _ in range(50):
            store.update("highway", {
                "az_std": 1.0 + random.gauss(0, 0.3),
            })

        # Value far above baseline
        packet = _make_packet(speed=90.0, az_std=5.0, regime=DrivingRegime.HIGHWAY)
        features = _make_features(az_std=5.0)

        result = rule_speed_vibration_resonance(features, packet, store, DrivingRegime.HIGHWAY)
        assert result is not None
        assert result["name"] == "speed_vibration_resonance"
        assert result["confidence"] > 40

    def test_low_z_returns_none(self):
        """Normal vibration z-score → None."""
        store = _make_baselines_store(["highway"])
        packet = _make_packet(speed=90.0, az_std=1.0, regime=DrivingRegime.HIGHWAY)
        features = _make_features(az_std=1.0)

        result = rule_speed_vibration_resonance(features, packet, store, DrivingRegime.HIGHWAY)
        assert result is None

    def test_missing_speed_returns_none(self):
        """No speed data → None."""
        store = _make_baselines_store(["highway"])
        packet = _make_packet(speed=None, az_std=5.0, regime=DrivingRegime.HIGHWAY)
        features = _make_features(az_std=5.0)

        result = rule_speed_vibration_resonance(features, packet, store, DrivingRegime.HIGHWAY)
        assert result is None


# ---------------------------------------------------------------------------
# Test: Integration with RuleEngine
# ---------------------------------------------------------------------------

class TestRuleEngineIntegration:
    def test_python_rules_appear_in_run_all(self):
        """Python rules results appear alongside JSON rule results in run_all."""
        engine = RuleEngine()
        packet = _make_packet(
            ltft_bank1=15.0, ltft_bank2=12.0,
            coolant_temp=90.0, rpm=800,
            regime=DrivingRegime.IDLE,
        )
        features = _make_features(ltft_abs=15.0)
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)
        names = [r["name"] for r in results]
        # fuel_bank_cross should appear (both banks > 5%)
        assert "fuel_bank_cross" in names

    def test_python_rules_sorted_with_json_rules(self):
        """All results (JSON + Python) sorted by confidence desc."""
        engine = RuleEngine()
        packet = _make_packet(
            ltft_bank1=20.0, ltft_bank2=18.0,
            coolant_temp=90.0, rpm=800,
            regime=DrivingRegime.IDLE,
        )
        features = _make_features(ltft_abs=20.0)
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)
        confidences = [r["confidence"] for r in results]
        assert confidences == sorted(confidences, reverse=True)

    def test_python_rules_dont_break_on_missing_data(self):
        """Python rules return None (not crash) when data is missing."""
        engine = RuleEngine()
        packet = NormalizedPacket()
        features = {}
        baselines = BaselineStore()

        # Should not raise
        results = engine.run_all([], features, baselines, DrivingRegime.UNKNOWN, packet)
        assert isinstance(results, list)


# ---------------------------------------------------------------------------
# Test: Result format
# ---------------------------------------------------------------------------

class TestResultFormat:
    def test_result_has_required_keys(self):
        """Every Python rule result has the standard keys."""
        packet = _make_packet(ltft_bank1=12.0, ltft_bank2=10.0)
        features = _make_features()
        baselines = _make_baselines_store()

        result = rule_fuel_bank_cross(features, packet, baselines, DrivingRegime.IDLE)
        assert result is not None
        required_keys = {
            "name", "display", "tier", "confidence", "status",
            "conditions_met", "conditions_total", "min_confidence",
            "situation_id", "dtc_codes", "details",
        }
        assert required_keys.issubset(result.keys())

    def test_status_mapping_correct(self):
        """Verify confidence → status mapping."""
        assert _confidence_to_status(75.0) == "likely"
        assert _confidence_to_status(70.0) == "likely"
        assert _confidence_to_status(50.0) == "possible"
        assert _confidence_to_status(40.0) == "possible"
        assert _confidence_to_status(20.0) == "unlikely"
        assert _confidence_to_status(0.0) == "clear"

    def test_all_rules_list_has_seven_entries(self):
        """ALL_RULES contains exactly 7 rule functions."""
        assert len(ALL_RULES) == 7
        for fn in ALL_RULES:
            assert callable(fn)
