"""Tests for Feature Extractor — derived diagnostic features."""
import pytest
import math
from diagnostic.feature_extractor import extract_features
from diagnostic.normalizer import NormalizedPacket, DrivingRegime, EngineContext


def _make_packet(**kwargs):
    """Create a NormalizedPacket with sensible defaults, overridden by kwargs."""
    defaults = dict(
        regime=DrivingRegime.CITY,
        engine_context=EngineContext(),
        tier='T2',
    )
    defaults.update(kwargs)
    return NormalizedPacket(**defaults)


class TestTotalVibration:
    def test_computes_rms(self):
        pkt = _make_packet(ax_std=3.0, ay_std=4.0, az_std=0.0)
        features = extract_features(pkt)
        assert features['total_vibration'] == pytest.approx(5.0, abs=0.01)

    def test_none_if_no_accel(self):
        pkt = _make_packet()
        features = extract_features(pkt)
        assert features['total_vibration'] is None


class TestCrestFactor:
    def test_computes(self):
        pkt = _make_packet(
            az_avg=9.8, az_std=0.5, az_min=8.5, az_max=11.0,
        )
        features = extract_features(pkt)
        assert features['crest_factor_z'] is not None
        assert features['crest_factor_z'] > 1.0  # peak > rms always


class TestFuelTrimFeatures:
    def test_ltft_abs(self):
        pkt = _make_packet(ltft_bank1=-12.0)
        features = extract_features(pkt)
        assert features['ltft_abs'] == 12.0

    def test_fuel_trim_delta(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=-3.0)
        features = extract_features(pkt)
        assert features['fuel_trim_delta'] == 13.0

    def test_sign_match_same(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=5.0)
        features = extract_features(pkt)
        assert features['fuel_trim_sign_match'] is True

    def test_sign_match_different(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=-5.0)
        features = extract_features(pkt)
        assert features['fuel_trim_sign_match'] is False
