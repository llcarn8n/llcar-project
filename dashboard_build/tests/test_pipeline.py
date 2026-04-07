"""Tests for DiagnosticPipeline — full cycle orchestrator."""

import os
import pytest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DTC_INDEX_PATH = os.path.join(DATA_DIR, "dtc-index-sample.json")
SITUATIONS_PATH = os.path.join(DATA_DIR, "situations-sample.json")

from diagnostic.pipeline import DiagnosticPipeline
from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.facts import FactType


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def profile():
    return VehicleProfile(
        client_hash="test_pipeline",
        brand="li_auto",
        model="L7",
        year=2023,
    )


@pytest.fixture
def pipeline(profile):
    return DiagnosticPipeline(
        vehicle_profile=profile,
        dtc_index_path=DTC_INDEX_PATH,
        situations_path=SITUATIONS_PATH,
    )


# ---------------------------------------------------------------------------
# 1. Healthy packet — minimal OBD, no alarms
# ---------------------------------------------------------------------------

class TestHealthyPacket:
    def test_healthy_packet_structure(self, pipeline):
        raw = {
            "rpm": 1200,
            "speed": 45,
            "coolant_temp": 87,
            "voltage": 14.2,
        }
        result = pipeline.process(raw)

        # All required keys present
        assert "packet" in result
        assert "features" in result
        assert "facts" in result
        assert "tier" in result
        assert "regime" in result
        assert "baseline_ready" in result
        assert "baseline_confidence" in result

    def test_healthy_packet_tier(self, pipeline):
        raw = {
            "rpm": 1200,
            "speed": 45,
            "coolant_temp": 87,
            "voltage": 14.2,
        }
        result = pipeline.process(raw)
        assert result["tier"] == "T1"

    def test_healthy_packet_regime(self, pipeline):
        raw = {
            "rpm": 1200,
            "speed": 45,
            "coolant_temp": 87,
            "voltage": 14.2,
        }
        result = pipeline.process(raw)
        assert result["regime"] == "city"

    def test_healthy_packet_no_danger_facts(self, pipeline):
        raw = {
            "rpm": 1200,
            "speed": 45,
            "coolant_temp": 87,
            "voltage": 14.2,
        }
        result = pipeline.process(raw)
        danger_facts = [f for f in result["facts"] if f.severity == "danger"]
        assert len(danger_facts) == 0


# ---------------------------------------------------------------------------
# 2. DTC generates facts
# ---------------------------------------------------------------------------

class TestDtcFacts:
    def test_dtc_produces_fact(self, pipeline):
        raw = {
            "rpm": 800,
            "speed": 0,
            "coolant_temp": 90,
            "voltage": 14.0,
            "dtc_codes": ["P0171"],
        }
        result = pipeline.process(raw)

        dtc_facts = [f for f in result["facts"] if f.type == FactType.DTC_ACTIVE]
        assert len(dtc_facts) >= 1
        assert dtc_facts[0].details["dtc_code"] == "P0171"


# ---------------------------------------------------------------------------
# 3. Overheat generates danger
# ---------------------------------------------------------------------------

class TestOverheatDanger:
    def test_overheat_produces_danger(self, pipeline):
        raw = {
            "rpm": 2000,
            "speed": 60,
            "coolant_temp": 110,
            "voltage": 14.0,
        }
        result = pipeline.process(raw)

        danger_facts = [f for f in result["facts"] if f.severity == "danger"]
        assert len(danger_facts) >= 1

    def test_overheat_fact_type(self, pipeline):
        raw = {
            "rpm": 2000,
            "speed": 60,
            "coolant_temp": 110,
            "voltage": 14.0,
        }
        result = pipeline.process(raw)

        overheat_facts = [f for f in result["facts"] if f.type == FactType.OVERHEAT]
        assert len(overheat_facts) == 1
        assert overheat_facts[0].severity == "danger"


# ---------------------------------------------------------------------------
# 4. Baseline updates after enough packets
# ---------------------------------------------------------------------------

class TestBaselineUpdates:
    def test_baseline_becomes_ready_after_enough_packets(self, pipeline):
        """Process 35 idle packets with az_std → baselines.is_ready('idle')."""
        for i in range(35):
            raw = {
                "rpm": 750,
                "speed": 0,
                "coolant_temp": 90,
                "voltage": 14.0,
                "az_std": 0.05 + i * 0.001,
                "az_avg": 9.81,
                "az_min": 9.5,
                "az_max": 10.1,
                "ax_std": 0.02,
                "ax_avg": 0.0,
                "ax_min": -0.1,
                "ax_max": 0.1,
                "ay_std": 0.03,
                "ay_avg": 0.0,
                "ay_min": -0.1,
                "ay_max": 0.1,
            }
            pipeline.process(raw)

        assert pipeline.baselines.is_ready("idle") is True

    def test_baseline_not_ready_with_few_packets(self, pipeline):
        """Process just 5 packets — baseline should NOT be ready."""
        for i in range(5):
            raw = {
                "rpm": 750,
                "speed": 0,
                "coolant_temp": 90,
                "voltage": 14.0,
                "az_std": 0.05,
                "az_avg": 9.81,
                "az_min": 9.5,
                "az_max": 10.1,
                "ax_std": 0.02,
                "ax_avg": 0.0,
                "ax_min": -0.1,
                "ax_max": 0.1,
                "ay_std": 0.03,
                "ay_avg": 0.0,
                "ay_min": -0.1,
                "ay_max": 0.1,
            }
            pipeline.process(raw)

        assert pipeline.baselines.is_ready("idle") is False


# ---------------------------------------------------------------------------
# 5. T3 with all sensors
# ---------------------------------------------------------------------------

class TestT3AllSensors:
    def test_t3_tier_with_all_sensors(self, pipeline):
        raw = {
            "rpm": 2000,
            "speed": 60,
            "coolant_temp": 90,
            "voltage": 14.0,
            # accel
            "ax_avg": 0.1, "ax_std": 0.05, "ax_min": -0.2, "ax_max": 0.3,
            "ay_avg": 0.0, "ay_std": 0.03, "ay_min": -0.1, "ay_max": 0.15,
            "az_avg": 9.81, "az_std": 0.08, "az_min": 9.5, "az_max": 10.1,
            # audio
            "dominant_freq": 440.0,
            "dominant_amp": 50.0,
            "audio_quality": 85.0,
        }
        result = pipeline.process(raw)
        assert result["tier"] == "T3"

    def test_t3_total_vibration_present(self, pipeline):
        raw = {
            "rpm": 2000,
            "speed": 60,
            "coolant_temp": 90,
            "voltage": 14.0,
            # accel
            "ax_avg": 0.1, "ax_std": 0.05, "ax_min": -0.2, "ax_max": 0.3,
            "ay_avg": 0.0, "ay_std": 0.03, "ay_min": -0.1, "ay_max": 0.15,
            "az_avg": 9.81, "az_std": 0.08, "az_min": 9.5, "az_max": 10.1,
            # audio
            "dominant_freq": 440.0,
            "dominant_amp": 50.0,
            "audio_quality": 85.0,
        }
        result = pipeline.process(raw)
        assert result["features"]["total_vibration"] is not None
        assert result["features"]["total_vibration"] > 0


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestPipelineEdgeCases:
    def test_empty_raw_data(self, pipeline):
        """Pipeline should handle empty dict without crashing."""
        result = pipeline.process({})
        assert result["packet"] is not None
        assert result["regime"] == "unknown"

    def test_custom_baselines_injected(self, profile):
        """Pipeline accepts an external BaselineStore."""
        from diagnostic.baseline_store import BaselineStore
        custom_baselines = BaselineStore()
        pipe = DiagnosticPipeline(
            vehicle_profile=profile,
            dtc_index_path=DTC_INDEX_PATH,
            situations_path=SITUATIONS_PATH,
            baselines=custom_baselines,
        )
        assert pipe.baselines is custom_baselines

    def test_result_baseline_confidence_is_float(self, pipeline):
        raw = {"rpm": 1000, "speed": 30, "coolant_temp": 85, "voltage": 14.0}
        result = pipeline.process(raw)
        assert isinstance(result["baseline_confidence"], float)
        assert 0.0 <= result["baseline_confidence"] <= 1.0

    def test_result_baseline_ready_is_bool(self, pipeline):
        raw = {"rpm": 1000, "speed": 30, "coolant_temp": 85, "voltage": 14.0}
        result = pipeline.process(raw)
        assert isinstance(result["baseline_ready"], bool)
