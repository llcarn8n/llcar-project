"""Tests for RuleEngine — threshold-based diagnostic rule evaluation.

Tests verify:
  - RuleCondition / DiagnosticRule dataclasses
  - JSON rule loading (>= 15 rules)
  - Confidence scoring (match / deviation / persistence components)
  - Status mapping (likely / possible / unlikely / clear)
  - Individual rule evaluations with realistic telemetry
  - Multi-rule firing
  - Edge cases: missing data, empty conditions, placeholder rules
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
import pytest
from unittest.mock import MagicMock

from diagnostic.normalizer import NormalizedPacket, DrivingRegime
from diagnostic.baseline_store import BaselineStore, RegimeBaseline
from diagnostic.rule_engine import (
    RuleCondition,
    DiagnosticRule,
    RuleEngine,
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
    )
    defaults.update(kwargs)
    return defaults


def _make_baselines_store() -> BaselineStore:
    """Create a baseline store with 50+ samples for key features at idle."""
    store = BaselineStore()
    # Seed baselines with 50 samples of "normal" data for idle regime
    for _ in range(50):
        store.update("idle", {
            "az_std": 1.0,
            "total_vibration": 1.5,
            "dominant_amp": 0.5,
            "dominant_freq": 100.0,
        })
    return store


# ---------------------------------------------------------------------------
# Test: Dataclass construction
# ---------------------------------------------------------------------------

class TestDataclasses:
    def test_rule_condition_creation(self):
        cond = RuleCondition(
            fact_type="az_std",
            operator=">",
            threshold=3.0,
            weight=3,
        )
        assert cond.fact_type == "az_std"
        assert cond.operator == ">"
        assert cond.threshold == 3.0
        assert cond.weight == 3
        assert cond.context is None

    def test_rule_condition_with_context(self):
        cond = RuleCondition(
            fact_type="rpm",
            operator="between",
            threshold=[600, 1200],
            weight=1,
            context={"note": "idle range"},
        )
        assert cond.context == {"note": "idle range"}
        assert cond.threshold == [600, 1200]

    def test_diagnostic_rule_defaults(self):
        rule = DiagnosticRule(
            name="test_rule",
            display="Test Rule",
            tier="T1",
            conditions=[],
        )
        assert rule.min_confidence == 40
        assert rule.cooldown_minutes == 10080
        assert rule.situation_id is None
        assert rule.dtc_codes == []

    def test_diagnostic_rule_full(self):
        cond = RuleCondition("rpm", ">", 1000, 2)
        rule = DiagnosticRule(
            name="high_rpm",
            display="High RPM",
            tier="T1",
            conditions=[cond],
            min_confidence=50,
            cooldown_minutes=1440,
            situation_id="SIT_001",
            dtc_codes=["P0300"],
        )
        assert rule.situation_id == "SIT_001"
        assert rule.dtc_codes == ["P0300"]
        assert len(rule.conditions) == 1


# ---------------------------------------------------------------------------
# Test: JSON loading
# ---------------------------------------------------------------------------

class TestJSONLoading:
    def test_json_rules_load_at_least_75(self):
        engine = RuleEngine()
        assert len(engine.rules) >= 75

    def test_json_rules_have_required_fields(self):
        engine = RuleEngine()
        for rule in engine.rules:
            assert isinstance(rule, DiagnosticRule)
            assert rule.name
            assert rule.display
            assert rule.tier in ("T1", "T2", "T3")
            assert isinstance(rule.conditions, list)

    def test_known_rules_present(self):
        engine = RuleEngine()
        names = {r.name for r in engine.rules}
        expected = {
            "worn_suspension", "engine_overheating", "alternator_failure",
            "wheel_imbalance_speed_resonance", "wheel_imbalance_general",
            "exhaust_leak", "bearing_wear", "wheel_bearing_bpfo_harmonic",
            "engine_mount_harmonic_order", "engine_mount_wear_legacy",
            "fuel_lean", "fuel_rich",
            "low_battery", "high_idle", "coolant_sensor",
            "oil_pressure_low", "catalyst_degradation", "misfire",
        }
        assert expected.issubset(names), f"Missing rules: {expected - names}"


# ---------------------------------------------------------------------------
# Test: Healthy vehicle — all rules clear/unlikely
# ---------------------------------------------------------------------------

class TestHealthyVehicle:
    def test_healthy_packet_all_clear_or_unlikely(self):
        """A completely normal vehicle should produce no likely/possible results."""
        engine = RuleEngine()
        packet = _make_packet(
            rpm=800, speed=0, coolant_temp=90, voltage=14.2,
            ltft_bank1=2.0, az_std=0.8,
            regime=DrivingRegime.IDLE,
        )
        features = _make_features(
            total_vibration=1.0, az_range=2.0, ltft_abs=2.0,
        )
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        for r in results:
            assert r["confidence"] < 40, (
                f"Rule '{r['name']}' has confidence {r['confidence']} on healthy vehicle"
            )
            assert r["status"] in ("clear", "unlikely"), (
                f"Rule '{r['name']}' status is '{r['status']}' on healthy vehicle"
            )


# ---------------------------------------------------------------------------
# Test: Specific rule triggers
# ---------------------------------------------------------------------------

class TestWornSuspension:
    def test_high_az_std_triggers_worn_suspension(self):
        """High az_std=5.0 + high vibration → worn_suspension likely."""
        engine = RuleEngine()
        packet = _make_packet(
            az_std=5.0, speed=60,
            regime=DrivingRegime.CITY,
        )
        features = _make_features(
            total_vibration=6.0, az_range=12.0,
        )
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        susp = next(r for r in results if r["name"] == "worn_suspension")
        assert susp["confidence"] > 60, f"Expected >60, got {susp['confidence']}"
        assert susp["status"] == "likely"


class TestEngineOverheating:
    def test_coolant_108_triggers_overheating(self):
        """Coolant=108 + rpm=1500 → engine_overheating likely."""
        engine = RuleEngine()
        packet = _make_packet(
            coolant_temp=108, rpm=1500,
            regime=DrivingRegime.CITY,
        )
        features = _make_features()
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        overheat = next(r for r in results if r["name"] == "engine_overheating")
        assert overheat["confidence"] > 60
        assert overheat["status"] == "likely"


class TestAlternatorFailure:
    def test_low_voltage_high_rpm_triggers_alternator(self):
        """Voltage=12.0, rpm=2000 → alternator_failure possible or likely."""
        engine = RuleEngine()
        packet = _make_packet(
            voltage=12.0, rpm=2000,
            regime=DrivingRegime.CITY,
        )
        features = _make_features()
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        alt = next(r for r in results if r["name"] == "alternator_failure")
        assert alt["confidence"] >= 40, f"Expected >=40, got {alt['confidence']}"
        assert alt["status"] in ("possible", "likely")


# ---------------------------------------------------------------------------
# Test: Multiple rules fire simultaneously
# ---------------------------------------------------------------------------

class TestMultipleRules:
    def test_multiple_rules_fire(self):
        """A bad vehicle can trigger multiple rules simultaneously."""
        engine = RuleEngine()
        packet = _make_packet(
            coolant_temp=110, voltage=11.5, rpm=2000, speed=0,
            az_std=5.0,
            regime=DrivingRegime.IDLE,
        )
        features = _make_features(
            total_vibration=6.0, az_range=12.0, ltft_abs=2.0,
        )
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        fired = [r for r in results if r["confidence"] >= 40]
        # Should fire: engine_overheating, alternator_failure, low_battery,
        # possibly worn_suspension, high_idle
        assert len(fired) >= 3, (
            f"Expected >=3 rules to fire, got {len(fired)}: "
            f"{[r['name'] for r in fired]}"
        )

    def test_results_sorted_by_confidence_desc(self):
        """run_all results are sorted by confidence descending."""
        engine = RuleEngine()
        packet = _make_packet(
            coolant_temp=110, voltage=11.5, rpm=2000,
            regime=DrivingRegime.CITY,
        )
        features = _make_features()
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        confidences = [r["confidence"] for r in results]
        assert confidences == sorted(confidences, reverse=True)


# ---------------------------------------------------------------------------
# Test: Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_no_matching_facts_confidence_zero(self):
        """Rule with conditions referencing missing features → confidence 0."""
        engine = RuleEngine()
        # Pass empty features and a packet with all None
        packet = NormalizedPacket()
        features = {}
        baselines = BaselineStore()

        results = engine.run_all([], features, baselines, DrivingRegime.UNKNOWN, packet)["results"]
        for r in results:
            assert r["confidence"] == 0, (
                f"Rule '{r['name']}' has confidence {r['confidence']} with no data"
            )

    def test_placeholder_rules_always_clear(self):
        """Placeholder rules (empty conditions) should always be clear."""
        engine = RuleEngine()
        packet = _make_packet(coolant_temp=110, voltage=11.5, rpm=5000)
        features = _make_features()
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        # Only oil_pressure_low remains as a true placeholder (empty conditions).
        # PHEV rules (battery_temp_high, soc_critical, range_extender_overwork,
        # motor_overheat) now have real conditions and are no longer placeholders.
        placeholders = [r for r in results if r["name"] in (
            "oil_pressure_low",
        )]
        for r in placeholders:
            assert r["confidence"] == 0
            assert r["status"] == "clear"

    def test_evaluate_rule_returns_dict_structure(self):
        """evaluate_rule returns a dict with expected keys."""
        engine = RuleEngine()
        rule = engine.rules[0]
        packet = _make_packet()
        features = _make_features()
        baselines = _make_baselines_store()

        result = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet
        )
        assert "name" in result
        assert "display" in result
        assert "tier" in result
        assert "confidence" in result
        assert "status" in result
        assert isinstance(result["confidence"], (int, float))
        assert result["status"] in ("likely", "possible", "unlikely", "clear")

    def test_confidence_never_exceeds_100(self):
        """Even with extreme values, confidence must cap at 100."""
        engine = RuleEngine()
        packet = _make_packet(
            coolant_temp=200, rpm=5000, voltage=5.0,
            az_std=20.0,
        )
        features = _make_features(
            total_vibration=30.0, az_range=50.0, ltft_abs=50.0,
        )
        baselines = _make_baselines_store()

        results = engine.run_all([], features, baselines, packet.regime, packet)["results"]
        for r in results:
            assert 0 <= r["confidence"] <= 100, (
                f"Rule '{r['name']}' confidence {r['confidence']} out of [0, 100]"
            )


# ---------------------------------------------------------------------------
# Test: Status mapping
# ---------------------------------------------------------------------------

class TestStatusMapping:
    def test_status_clear_at_zero(self):
        engine = RuleEngine()
        rule = DiagnosticRule("test", "Test", "T1", [])
        packet = _make_packet()
        result = engine.evaluate_rule(rule, [], {}, BaselineStore(), DrivingRegime.IDLE, packet)
        assert result["status"] == "clear"
        assert result["confidence"] == 0

    def test_z_score_operator(self):
        """z> operator uses baseline z-score comparison."""
        engine = RuleEngine()
        # Create a baseline with known mean=1.0, std~0.1
        store = BaselineStore()
        for _ in range(50):
            store.update("city", {"az_std": 1.0})

        # Value far above mean → high z-score
        cond = RuleCondition("az_std", "z>", 2.0, 3)
        rule = DiagnosticRule("test_z", "Test Z", "T2", [cond])

        packet = _make_packet(az_std=5.0, regime=DrivingRegime.CITY)
        features = {"az_std": 5.0}

        result = engine.evaluate_rule(
            rule, [], features, store, DrivingRegime.CITY, packet
        )
        # z-score of 5.0 when mean=1.0, std~0.0 → 0 (std=0 edge case)
        # Need to add variation to the baseline
        store2 = BaselineStore()
        import random
        random.seed(42)
        for _ in range(50):
            store2.update("city", {"az_std": 1.0 + random.gauss(0, 0.3)})

        result2 = engine.evaluate_rule(
            rule, [], features, store2, DrivingRegime.CITY, packet
        )
        # With std~0.3, z_score(5.0) = (5.0 - 1.0) / 0.3 ≈ 13, well above 2.0
        assert result2["confidence"] > 0


# ---------------------------------------------------------------------------
# Test: GAP-R2 — Cooldown enforcement
# ---------------------------------------------------------------------------

class TestCooldownEnforcement:
    """GAP-R2: Dismissed rules in cooldown period return confidence=0."""

    def test_cooldown_suppresses_rule(self):
        """Rule in cooldown returns confidence=0 even with all conditions met."""
        from diagnostic.escalation import EscalationManager

        engine = RuleEngine()
        esc = EscalationManager()

        # Use dates relative to now so test stays within 7-day cooldown regardless
        # of when it runs (prevents time-dependent flakiness).
        now = datetime.now(timezone.utc)
        trigger_iso = (now - timedelta(days=6)).isoformat()
        dismiss_iso = (now - timedelta(days=3)).isoformat()

        # Trigger and then dismiss
        esc.update("client1", "engine_overheating", 80, trigger_iso)
        esc.dismiss("client1", "engine_overheating", dismiss_iso)

        # Verify it's in cooldown (within 7 days)
        assert esc.is_in_cooldown("client1", "engine_overheating", now.isoformat())

        packet = _make_packet(coolant_temp=108, rpm=1500, regime=DrivingRegime.CITY)
        features = _make_features()
        baselines = _make_baselines_store()

        # Without cooldown — should fire
        rule = next(r for r in engine.rules if r.name == "engine_overheating")
        result_no_cooldown = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet,
        )
        assert result_no_cooldown["confidence"] > 60

        # With cooldown — should be suppressed
        result_with_cooldown = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet,
            escalation_manager=esc,
            client_hash="client1",
        )
        assert result_with_cooldown["confidence"] == 0
        assert result_with_cooldown["status"] == "clear"

    def test_expired_cooldown_allows_rule(self):
        """After cooldown expires (7+ days), rule fires normally."""
        from diagnostic.escalation import EscalationManager

        engine = RuleEngine()
        esc = EscalationManager()

        esc.update("client1", "engine_overheating", 80, "2026-03-01T00:00:00+00:00")
        esc.dismiss("client1", "engine_overheating", "2026-03-01T12:00:00+00:00")

        # 8+ days later — cooldown expired
        assert not esc.is_in_cooldown(
            "client1", "engine_overheating", "2026-03-10T00:00:00+00:00",
        )

        packet = _make_packet(coolant_temp=108, rpm=1500, regime=DrivingRegime.CITY)
        features = _make_features()
        baselines = _make_baselines_store()

        rule = next(r for r in engine.rules if r.name == "engine_overheating")
        result = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet,
            escalation_manager=esc,
            client_hash="client1",
        )
        assert result["confidence"] > 0

    def test_no_escalation_manager_backward_compat(self):
        """Without escalation_manager, cooldown check is skipped (backward compat)."""
        engine = RuleEngine()
        packet = _make_packet(coolant_temp=108, rpm=1500, regime=DrivingRegime.CITY)
        features = _make_features()
        baselines = _make_baselines_store()

        rule = next(r for r in engine.rules if r.name == "engine_overheating")
        result = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet,
        )
        assert result["confidence"] > 60

    def test_cooldown_in_run_all(self):
        """run_all passes escalation_manager/client_hash to evaluate_rule."""
        from diagnostic.escalation import EscalationManager

        engine = RuleEngine()
        esc = EscalationManager()

        # Relative dates — keeps dismissal within 7-day cooldown regardless of
        # run date (wall-clock dependency in is_in_cooldown).
        now = datetime.now(timezone.utc)
        esc.update("client1", "engine_overheating", 80, (now - timedelta(days=6)).isoformat())
        esc.dismiss("client1", "engine_overheating", (now - timedelta(days=3)).isoformat())

        packet = _make_packet(coolant_temp=108, rpm=1500, regime=DrivingRegime.CITY)
        features = _make_features()
        baselines = _make_baselines_store()

        results = engine.run_all(
            [], features, baselines, packet.regime, packet,
            escalation_manager=esc,
            client_hash="client1",
        )["results"]
        overheat = next(r for r in results if r["name"] == "engine_overheating")
        assert overheat["confidence"] == 0

    def test_cooldown_error_graceful_degradation(self):
        """If escalation_manager.is_in_cooldown raises, rule still evaluates."""
        engine = RuleEngine()
        esc_mock = MagicMock()
        esc_mock.is_in_cooldown.side_effect = RuntimeError("DB error")
        esc_mock.get_record.return_value = None

        packet = _make_packet(coolant_temp=108, rpm=1500, regime=DrivingRegime.CITY)
        features = _make_features()
        baselines = _make_baselines_store()

        rule = next(r for r in engine.rules if r.name == "engine_overheating")
        result = engine.evaluate_rule(
            rule, [], features, baselines, packet.regime, packet,
            escalation_manager=esc_mock,
            client_hash="client1",
        )
        # Should still fire despite the error
        assert result["confidence"] > 0


class TestShadowRulesIsolation:
    """S23 regression: shadow-правила не попадают в production output.

    Любой пакет, срабатывающий по shadow-правилам (SK/order/phase/HPBM),
    должен фиксироваться только в shadow_results, не в results.
    """

    _S23_SHADOW_NAMES = frozenset({
        "spectral_kurtosis_impulsive_bearing",
        "order_tracking_mount_wear_shadow",
        "phase_lag_shift_shadow",
        "damping_bandwidth_wide_shadow",
        "shock_absorber_early_wear_corrected",
        "shock_absorber_worn_corrected",
        "stabilizer_link_worn_freq",
    })

    def test_shadow_rules_never_in_production_output(self):
        engine = RuleEngine()
        # Максимально "звонкий" пакет: все shadow-триггеры одновременно.
        packet = _make_packet(
            rpm=2400.0, speed=60.0,
            az_std=4.0, ax_std=2.0,
            audio_peaks=[(40.0, 0.9), (80.0, 1.2), (120.0, 0.8), (10.0, 0.6)],
            audio_percussive=[(3000.0, 1.5), (3100.0, 1.3), (2900.0, 1.1),
                              (500.0, 0.02), (600.0, 0.02)],
            regime=DrivingRegime.CITY,
            tier="T2",
        )
        features = _make_features(
            spectral_kurtosis_audio=5.0,
            rpm_order_matches=3,
            order_2x_amp=1.2,
            ax_az_phase_proxy=0.1,
            hpbm_bandwidth_ratio=0.6,
            hpbm_applicable=True,
            wheel_hop_peak_freq=11.0,
            az_std=4.0, az_range=12.0,
            crest_factor_z=4.5,
            total_vibration=5.0,
            ay_std=2.0,
            dominant_freq=150.0,
        )
        baselines = _make_baselines_store()
        out = engine.run_all(
            [], features, baselines, packet.regime, packet,
        )
        prod_names = {r["name"] for r in out["results"]}
        shadow_names = {r["name"] for r in out["shadow_results"]}

        # Ни одно shadow-имя не должно оказаться в production results
        leaked = self._S23_SHADOW_NAMES & prod_names
        assert leaked == set(), (
            f"Shadow rules leaked into production: {leaked}"
        )
        # Все results имеют shadow_mode=False
        assert all(r.get("shadow_mode") is False for r in out["results"])
        # Все shadow_results имеют shadow_mode=True
        assert all(r.get("shadow_mode") is True for r in out["shadow_results"])

    def test_shadow_file_loads_all_seven_rules(self):
        engine = RuleEngine()
        shadow_named = {
            r.name for r in engine.rules
            if r.shadow_mode and r.name in self._S23_SHADOW_NAMES
        }
        assert shadow_named == self._S23_SHADOW_NAMES
