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


class TestSpectralKurtosisProxy:
    """S23 A.26: SK proxy = m4/m2² − 2 over percussive amplitudes.

    Analytical baselines:
    - Uniform amps (|a|=const): m4/m2²=1 → SK≈−1 (no impulsiveness).
    - Gaussian |a|: E[|X|⁴]/E[|X|²]²=3 → SK≈1 (baseline noise).
    - Impulsive (few spikes among small): m4/m2²≫1 → SK≫4 (bearing-like).
    """

    def test_uniform_amps_is_not_impulsive(self):
        # Ровные амплитуды ⇒ отсутствие импульсности, SK ≈ −1.
        percussive = [(1000.0 + 100 * i, 0.5) for i in range(20)]
        pkt = _make_packet(audio_percussive=percussive)
        features = extract_features(pkt)
        assert features['spectral_kurtosis_audio'] is not None
        assert features['spectral_kurtosis_audio'] == pytest.approx(-1.0, abs=0.05)

    def test_bearing_6206_impulse_train_has_high_sk(self):
        # BPFO для 6206 @ 10 Hz = 35.7 Hz; модуляция carrier ~3 kHz.
        # Симулируем 18 слабых шумовых пиков + 3 резких удара на carrier-полосе.
        noise_peaks = [(500.0 + 50 * i, 0.03) for i in range(18)]
        impulse_peaks = [(2900.0, 1.2), (3000.0, 1.4), (3100.0, 1.1)]
        pkt = _make_packet(audio_percussive=noise_peaks + impulse_peaks)
        features = extract_features(pkt)
        assert features['spectral_kurtosis_audio'] is not None
        # Тяжёлые хвосты ⇒ SK значительно выше гауссового baseline (≈1)
        assert features['spectral_kurtosis_audio'] > 4.0
        # Kurtogram должен выбрать полосу 2000-5000 Гц (содержит carrier 3 kHz)
        assert features['kurtogram_best_band_low'] == 2000
        assert features['kurtogram_best_band_high'] == 5000


class TestOrderTracking:
    """S23 A.27: rpm_order_matches — счётчик пиков на {0.5,1,2,3,4}×rpm/60 ±0.05."""

    def test_matches_at_2400_rpm(self):
        # rpm=2400 ⇒ engine_base=40 Hz. Пики на 40/80/120 Hz = orders 1/2/3.
        peaks = [(40.0, 0.5), (80.0, 0.8), (120.0, 0.4), (777.0, 0.1)]
        pkt = _make_packet(rpm=2400.0, audio_peaks=peaks)
        features = extract_features(pkt)
        assert features['rpm_order_matches'] == 3
        assert features['order_1x_amp'] == pytest.approx(0.5, abs=0.01)
        assert features['order_2x_amp'] == pytest.approx(0.8, abs=0.01)

    def test_order_2x_invariant_across_rpm_sweep(self):
        # Run-up 1800→3000 rpm: 2× order на разных f (60,80,100 Hz),
        # но order_2x_amp должен оставаться стабилен (σ < 0.02).
        import statistics
        amps_2x = []
        for rpm_val in (1800.0, 2400.0, 3000.0):
            base = rpm_val / 60.0
            f_2x = base * 2.0
            peaks = [(base, 0.4), (f_2x, 0.75), (base * 3.0, 0.3)]
            pkt = _make_packet(rpm=rpm_val, audio_peaks=peaks)
            features = extract_features(pkt)
            assert features['order_2x_amp'] is not None
            amps_2x.append(features['order_2x_amp'])
        assert statistics.stdev(amps_2x) < 0.02
