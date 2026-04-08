"""Tests for Normalizer — validation, regime classification, engine context, tier detection."""
import pytest
from diagnostic.normalizer import (
    DrivingRegime,
    EngineContext,
    NormalizedPacket,
    normalize_packet,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_raw(**overrides) -> dict:
    """Return a valid raw packet dict with sensible defaults, applying overrides."""
    base = {
        # OBD
        "rpm": 800,
        "speed": 0,
        "coolant_temp": 90,
        "voltage": 13.8,
        "ltft_bank1": 2.0,
        "ltft_bank2": 1.5,
        "stft_bank1": -1.0,
        "stft_bank2": 0.5,
        "maf": 5.0,
        "map_pressure": 35.0,
        "o2_voltage": 0.45,
        "dtc_codes": [],
        # Accel
        "ax_avg": 0.0,
        "ax_std": 0.1,
        "ax_min": -0.5,
        "ax_max": 0.5,
        "ay_avg": 0.0,
        "ay_std": 0.1,
        "ay_min": -0.3,
        "ay_max": 0.3,
        "az_avg": 9.8,
        "az_std": 0.05,
        "az_min": 9.7,
        "az_max": 9.9,
        # Audio
        "dominant_freq": 440.0,
        "dominant_amp": 500.0,
        "audio_quality": 85.0,
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class TestValidation:
    """Validate that out-of-range values are rejected (set to None)."""

    def test_valid_packet_all_fields_present(self):
        pkt = normalize_packet(_make_raw())
        assert pkt.rpm == 800
        assert pkt.speed == 0
        assert pkt.coolant_temp == 90
        assert pkt.voltage == 13.8

    def test_impossible_rpm_rejected(self):
        pkt = normalize_packet(_make_raw(rpm=15000))
        assert pkt.rpm is None

    def test_negative_rpm_rejected(self):
        pkt = normalize_packet(_make_raw(rpm=-100))
        assert pkt.rpm is None

    def test_impossible_coolant_rejected(self):
        pkt = normalize_packet(_make_raw(coolant_temp=300))
        assert pkt.coolant_temp is None

    def test_coolant_below_range_rejected(self):
        pkt = normalize_packet(_make_raw(coolant_temp=-60))
        assert pkt.coolant_temp is None

    def test_impossible_speed_rejected(self):
        pkt = normalize_packet(_make_raw(speed=350))
        assert pkt.speed is None

    def test_voltage_above_range_rejected(self):
        pkt = normalize_packet(_make_raw(voltage=30))
        assert pkt.voltage is None

    def test_ltft_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(ltft_bank1=150))
        assert pkt.ltft_bank1 is None

    def test_stft_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(stft_bank2=-110))
        assert pkt.stft_bank2 is None

    def test_maf_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(maf=1500))
        assert pkt.maf is None

    def test_o2_voltage_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(o2_voltage=3.0))
        assert pkt.o2_voltage is None

    def test_dominant_freq_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(dominant_freq=25000))
        assert pkt.dominant_freq is None

    def test_dominant_amp_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(dominant_amp=15000))
        assert pkt.dominant_amp is None

    def test_audio_quality_out_of_range_rejected(self):
        pkt = normalize_packet(_make_raw(audio_quality=110))
        assert pkt.audio_quality is None

    def test_missing_field_becomes_none(self):
        raw = _make_raw()
        del raw["maf"]
        pkt = normalize_packet(raw)
        assert pkt.maf is None

    def test_boundary_values_accepted(self):
        """Values exactly on the boundary should be accepted."""
        pkt = normalize_packet(_make_raw(rpm=0, speed=300, coolant_temp=-50, o2_voltage=2.0))
        assert pkt.rpm == 0
        assert pkt.speed == 300
        assert pkt.coolant_temp == -50
        assert pkt.o2_voltage == 2.0


# ---------------------------------------------------------------------------
# Regime classification
# ---------------------------------------------------------------------------

class TestRegimeClassification:
    """Test driving regime detection."""

    def test_idle(self):
        pkt = normalize_packet(_make_raw(speed=2, ax_avg=0.0))
        assert pkt.regime == DrivingRegime.IDLE

    def test_city(self):
        pkt = normalize_packet(_make_raw(speed=40, ax_avg=0.5, ay_avg=0.3))
        assert pkt.regime == DrivingRegime.CITY

    def test_highway(self):
        pkt = normalize_packet(_make_raw(speed=100, ax_avg=0.2, ay_avg=0.1))
        assert pkt.regime == DrivingRegime.HIGHWAY

    def test_braking(self):
        pkt = normalize_packet(_make_raw(speed=60, ax_avg=-2.5, ay_avg=0.1))
        assert pkt.regime == DrivingRegime.BRAKING

    def test_acceleration(self):
        pkt = normalize_packet(_make_raw(speed=40, ax_avg=2.5, ay_avg=0.1))
        assert pkt.regime == DrivingRegime.ACCELERATION

    def test_cornering(self):
        pkt = normalize_packet(_make_raw(speed=40, ax_avg=0.3, ay_avg=3.0))
        assert pkt.regime == DrivingRegime.CORNERING

    def test_unknown_when_speed_none(self):
        """If speed cannot be validated, regime should be UNKNOWN."""
        pkt = normalize_packet(_make_raw(speed=999))
        assert pkt.regime == DrivingRegime.UNKNOWN


# ---------------------------------------------------------------------------
# Engine context
# ---------------------------------------------------------------------------

class TestEngineContext:
    """Test engine context (warm/cold, cold_start)."""

    def test_warm_engine(self):
        pkt = normalize_packet(_make_raw(coolant_temp=95))
        assert pkt.engine_context.warm is True
        assert pkt.engine_context.cold_start is False

    def test_cold_start(self):
        pkt = normalize_packet(_make_raw(coolant_temp=40))
        assert pkt.engine_context.warm is False
        assert pkt.engine_context.cold_start is True

    def test_lukewarm_neither_cold_start_nor_warm(self):
        """Coolant between 60 and 80: not warm, not cold_start."""
        pkt = normalize_packet(_make_raw(coolant_temp=70))
        assert pkt.engine_context.warm is False
        assert pkt.engine_context.cold_start is False

    def test_engine_context_none_coolant(self):
        """If coolant is out of range, engine context booleans default to False."""
        pkt = normalize_packet(_make_raw(coolant_temp=999))
        assert pkt.engine_context.warm is False
        assert pkt.engine_context.cold_start is False


# ---------------------------------------------------------------------------
# Tier detection
# ---------------------------------------------------------------------------

class TestTierDetection:
    """Test data tier classification (T1/T2/T3)."""

    def test_tier3_has_audio_and_accel(self):
        pkt = normalize_packet(_make_raw())
        assert pkt.tier == "T3"

    def test_tier2_has_accel_no_audio(self):
        raw = _make_raw()
        del raw["dominant_freq"]
        del raw["dominant_amp"]
        del raw["audio_quality"]
        pkt = normalize_packet(raw)
        assert pkt.tier == "T2"

    def test_tier1_no_accel_no_audio(self):
        raw = _make_raw()
        # Remove all accel fields
        for key in list(raw.keys()):
            if key.startswith(("ax_", "ay_", "az_")):
                del raw[key]
        # Remove all audio fields
        del raw["dominant_freq"]
        del raw["dominant_amp"]
        del raw["audio_quality"]
        pkt = normalize_packet(raw)
        assert pkt.tier == "T1"

    def test_tier1_obd_only(self):
        """Only OBD fields present."""
        raw = {
            "rpm": 800,
            "speed": 0,
            "coolant_temp": 90,
            "voltage": 13.8,
            "ltft_bank1": 2.0,
            "ltft_bank2": 1.5,
            "stft_bank1": -1.0,
            "stft_bank2": 0.5,
            "maf": 5.0,
            "map_pressure": 35.0,
            "o2_voltage": 0.45,
            "dtc_codes": [],
        }
        pkt = normalize_packet(raw)
        assert pkt.tier == "T1"


# ---------------------------------------------------------------------------
# GAP-P2: Regime stability
# ---------------------------------------------------------------------------

class TestRegimeStability:
    """GAP-P2: regime_stable field in NormalizedPacket."""

    def test_stable_by_default_no_previous(self):
        """Without previous_regime, regime_stable defaults to True."""
        pkt = normalize_packet(_make_raw(speed=0))
        assert pkt.regime_stable is True

    def test_stable_when_same_regime(self):
        """Same regime as previous -> regime_stable=True."""
        pkt = normalize_packet(
            _make_raw(speed=0),
            previous_regime=DrivingRegime.IDLE,
        )
        assert pkt.regime == DrivingRegime.IDLE
        assert pkt.regime_stable is True

    def test_unstable_when_regime_changed(self):
        """Different regime from previous -> regime_stable=False."""
        pkt = normalize_packet(
            _make_raw(speed=0),  # IDLE
            previous_regime=DrivingRegime.HIGHWAY,
        )
        assert pkt.regime == DrivingRegime.IDLE
        assert pkt.regime_stable is False

    def test_unstable_city_to_highway(self):
        """CITY -> HIGHWAY transition is unstable."""
        pkt = normalize_packet(
            _make_raw(speed=100, ax_avg=0.2, ay_avg=0.1),  # HIGHWAY
            previous_regime=DrivingRegime.CITY,
        )
        assert pkt.regime == DrivingRegime.HIGHWAY
        assert pkt.regime_stable is False

    def test_stable_highway_to_highway(self):
        """HIGHWAY -> HIGHWAY is stable."""
        pkt = normalize_packet(
            _make_raw(speed=100, ax_avg=0.2, ay_avg=0.1),  # HIGHWAY
            previous_regime=DrivingRegime.HIGHWAY,
        )
        assert pkt.regime == DrivingRegime.HIGHWAY
        assert pkt.regime_stable is True

    def test_default_packet_has_regime_stable(self):
        """NormalizedPacket default has regime_stable=True."""
        pkt = NormalizedPacket()
        assert pkt.regime_stable is True
