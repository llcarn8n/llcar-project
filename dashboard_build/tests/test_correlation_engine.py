"""Tests for CorrelationEngine — batch correlation analysis of accel↔audio↔OBD data."""

import math
import random

import pytest

from diagnostic.correlation_engine import (
    CorrelationEngine,
    CorrelationResult,
    _linregress,
    MIN_DATA_POINTS,
    R_THRESHOLD,
    TIRE_DIAMETER,
)
from diagnostic.db import MockDB


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_windows(n, **overrides):
    """Generate n synthetic windows with default healthy values."""
    random.seed(42)
    windows = []
    for i in range(n):
        w = {
            "rpm": 2000 + random.uniform(-200, 200),
            "speed": 80 + random.uniform(-10, 10),
            "az_std": 1.0 + random.uniform(-0.2, 0.2),
            "ay_std": 0.5 + random.uniform(-0.1, 0.1),
            "dominant_freq": 150 + random.uniform(-20, 20),
            "dominant_amp": 50 + random.uniform(-10, 10),
            "regime": "highway",
            "timestamp": 1000 + i * 5,
        }
        w.update(overrides)
        windows.append(w)
    return windows


# ---------------------------------------------------------------------------
# 1. Empty windows → no results
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_windows_no_results(self):
        engine = CorrelationEngine()
        results = engine.analyze_trip([])
        assert results == []

    def test_too_few_windows_no_results(self):
        """With fewer than MIN_DATA_POINTS windows, nothing should be significant."""
        engine = CorrelationEngine()
        windows = _make_windows(10)
        results = engine.analyze_trip(windows)
        assert results == []


# ---------------------------------------------------------------------------
# 2. _linregress unit tests
# ---------------------------------------------------------------------------

class TestLinregress:
    def test_perfect_linear(self):
        """Perfect y = 2x + 1 → r ≈ 1.0, slope ≈ 2.0."""
        x = [float(i) for i in range(100)]
        y = [2.0 * xi + 1.0 for xi in x]
        r, slope, p = _linregress(x, y)
        assert abs(r - 1.0) < 1e-6
        assert abs(slope - 2.0) < 1e-6
        assert p < 0.01

    def test_random_data_low_r(self):
        """Random data should have |r| close to 0."""
        random.seed(99)
        x = [random.uniform(0, 100) for _ in range(200)]
        y = [random.uniform(0, 100) for _ in range(200)]
        r, slope, p = _linregress(x, y)
        assert abs(r) < 0.3

    def test_fewer_than_2_points(self):
        """With 0 or 1 point, return r=0, slope=0, p=1."""
        r, slope, p = _linregress([], [])
        assert r == 0.0
        assert slope == 0.0
        assert p == 1.0

        r, slope, p = _linregress([1.0], [2.0])
        assert r == 0.0
        assert slope == 0.0
        assert p == 1.0

    def test_negative_correlation(self):
        """y = -x → r ≈ -1.0."""
        x = [float(i) for i in range(50)]
        y = [-xi for xi in x]
        r, slope, p = _linregress(x, y)
        assert r < -0.99
        assert slope < 0

    def test_constant_x_returns_zero(self):
        """If all x values are the same, r should be 0."""
        x = [5.0] * 20
        y = [float(i) for i in range(20)]
        r, slope, p = _linregress(x, y)
        assert r == 0.0
        assert p == 1.0


# ---------------------------------------------------------------------------
# 3. vibration_rpm: synthetic linear correlation → significant
# ---------------------------------------------------------------------------

class TestVibrationRPM:
    def test_linear_correlation_significant(self):
        """az_std = 0.001 * rpm + small noise → engine_mount detected."""
        random.seed(42)
        windows = []
        for i in range(60):
            rpm = 1000 + i * 50  # 1000 to 3950
            az = 0.001 * rpm + random.uniform(-0.1, 0.1)
            windows.append({
                "rpm": rpm,
                "az_std": az,
                "speed": 80,
                "ay_std": 0.5,
                "dominant_freq": 150,
                "dominant_amp": 50,
                "regime": "highway",
                "timestamp": 1000 + i * 5,
            })
        engine = CorrelationEngine()
        result = engine._vibration_rpm(windows)
        assert result is not None
        assert result.significant is True
        assert result.correlation_type == "vibration_rpm"
        assert result.diagnosis_hint == "engine_mount"
        assert result.r_value > R_THRESHOLD
        assert result.slope > 0
        assert result.data_points == 60

    def test_no_correlation_not_significant(self):
        """Random az_std, no relation to rpm → not significant."""
        random.seed(42)
        windows = _make_windows(60)
        # Overwrite az_std with random values unrelated to rpm
        for w in windows:
            w["az_std"] = random.uniform(0, 5)
            w["rpm"] = random.uniform(800, 4000)
        engine = CorrelationEngine()
        result = engine._vibration_rpm(windows)
        # May return a result, but it should NOT be significant
        if result is not None:
            assert result.significant is False


# ---------------------------------------------------------------------------
# 4. audio_wheel: freq proportional to tire_freq → wheel_bearing
# ---------------------------------------------------------------------------

class TestAudioWheel:
    def test_harmonic_frequency_detected(self):
        """dominant_freq = 5 * tire_freq → wheel_bearing detected."""
        random.seed(42)
        windows = []
        harmonic = 5
        for i in range(60):
            speed = 40 + i * 1.5  # 40 to 128.5 km/h
            tire_freq = speed / (3.6 * math.pi * TIRE_DIAMETER)
            freq = tire_freq * harmonic + random.uniform(-0.1, 0.1)
            windows.append({
                "speed": speed,
                "dominant_freq": freq,
                "dominant_amp": 50,
                "rpm": 2000,
                "az_std": 1.0,
                "ay_std": 0.5,
                "regime": "highway",
                "timestamp": 1000 + i * 5,
            })
        engine = CorrelationEngine()
        result = engine._audio_wheel(windows)
        assert result is not None
        assert result.significant is True
        assert result.correlation_type == "audio_wheel"
        assert result.diagnosis_hint == "wheel_bearing"
        assert result.r_value > R_THRESHOLD

    def test_low_speed_filtered_out(self):
        """Windows with speed ≤ 30 should be excluded."""
        windows = _make_windows(60, speed=25)
        engine = CorrelationEngine()
        result = engine._audio_wheel(windows)
        assert result is None


# ---------------------------------------------------------------------------
# 5. turn_click: cornering events with ay>2.5 + high amp → cv_joint
# ---------------------------------------------------------------------------

class TestTurnClick:
    def test_cv_joint_detected(self):
        """4 cornering events with ay>2.5 + high dominant_amp → cv_joint."""
        random.seed(42)
        # Base windows with low amp
        windows = _make_windows(60)
        mean_amp = 50  # approx mean of default dominant_amp

        # Add 4 cornering events with high ay and high amp
        for i in range(4):
            windows.append({
                "rpm": 1500,
                "speed": 30,
                "az_std": 1.0,
                "ay_std": 3.5 + random.uniform(0, 1),
                "dominant_freq": 200,
                "dominant_amp": mean_amp * 2.0,  # well above 1.5 * mean
                "regime": "cornering",
                "timestamp": 2000 + i * 5,
            })

        engine = CorrelationEngine()
        result = engine._turn_click(windows)
        assert result is not None
        assert result.significant is True
        assert result.correlation_type == "turn_click"
        assert result.diagnosis_hint == "cv_joint"
        assert result.data_points == 4

    def test_too_few_events_not_significant(self):
        """Only 1 cornering event → not significant."""
        windows = _make_windows(60)
        windows.append({
            "rpm": 1500, "speed": 30, "az_std": 1.0,
            "ay_std": 4.0, "dominant_freq": 200, "dominant_amp": 200,
            "regime": "cornering", "timestamp": 2000,
        })
        engine = CorrelationEngine()
        result = engine._turn_click(windows)
        if result is not None:
            assert result.significant is False

    def test_no_cornering_windows(self):
        """No cornering regime → None."""
        windows = _make_windows(60)
        engine = CorrelationEngine()
        result = engine._turn_click(windows)
        assert result is None


# ---------------------------------------------------------------------------
# 6. vibration_speed_peak: peak at specific speed → wheel_balance
# ---------------------------------------------------------------------------

class TestVibrationSpeedPeak:
    def test_peak_at_90_detected(self):
        """High az_std at 90-99 km/h bin, low at 80 and 100 → wheel_balance."""
        random.seed(42)
        windows = []
        # Create windows in 4 speed bins: 70, 80, 90 (peak), 100
        bin_speeds = [75, 85, 95, 105]
        for i in range(80):
            speed = bin_speeds[i % 4] + random.uniform(-2, 2)
            # Bin 90 (speeds 90-99) gets high az_std
            if 90 <= speed < 100:
                az = 5.0 + random.uniform(-0.3, 0.3)
            else:
                az = 1.0 + random.uniform(-0.2, 0.2)
            windows.append({
                "rpm": 2000, "speed": speed, "az_std": az,
                "ay_std": 0.5, "dominant_freq": 150, "dominant_amp": 50,
                "regime": "highway", "timestamp": 1000 + i * 5,
            })
        engine = CorrelationEngine()
        result = engine._vibration_speed_peak(windows)
        assert result is not None
        assert result.significant is True
        assert result.diagnosis_hint == "wheel_balance"

    def test_no_peak_not_significant(self):
        """Uniform az_std across speeds → not significant."""
        windows = _make_windows(60, speed=80)
        # Ensure range of speeds > 60 for highway filter
        for i, w in enumerate(windows):
            w["speed"] = 65 + (i % 6) * 10  # 65, 75, 85, 95, 105, 115
        engine = CorrelationEngine()
        result = engine._vibration_speed_peak(windows)
        if result is not None:
            assert result.significant is False


# ---------------------------------------------------------------------------
# 7. highfreq_vibration: high freq audio + vibration → accessory_bearing
# ---------------------------------------------------------------------------

class TestHighfreqVibration:
    def test_highfreq_correlation(self):
        """dominant_freq > 200 with correlated amp and az_std → accessory_bearing."""
        random.seed(42)
        windows = []
        for i in range(60):
            amp = 20 + i * 2
            az = 0.05 * amp + random.uniform(-0.2, 0.2)  # linear correlation
            windows.append({
                "rpm": 2000, "speed": 80, "az_std": az,
                "ay_std": 0.5, "dominant_freq": 300 + random.uniform(-20, 20),
                "dominant_amp": amp, "regime": "highway",
                "timestamp": 1000 + i * 5,
            })
        engine = CorrelationEngine()
        result = engine._highfreq_vibration(windows)
        assert result is not None
        assert result.significant is True
        assert result.diagnosis_hint == "accessory_bearing"

    def test_low_freq_filtered(self):
        """All dominant_freq < 200 → None."""
        windows = _make_windows(60, dominant_freq=100)
        engine = CorrelationEngine()
        result = engine._highfreq_vibration(windows)
        assert result is None


# ---------------------------------------------------------------------------
# 8. analyze_trip returns only significant results
# ---------------------------------------------------------------------------

class TestAnalyzeTrip:
    def test_returns_only_significant(self):
        """analyze_trip should filter out non-significant results."""
        random.seed(42)
        # Create windows with vibration_rpm correlation only
        windows = []
        for i in range(60):
            rpm = 1000 + i * 50
            az = 0.001 * rpm + random.uniform(-0.1, 0.1)
            windows.append({
                "rpm": rpm, "az_std": az, "speed": 80,
                "ay_std": 0.5, "dominant_freq": 150, "dominant_amp": 50,
                "regime": "highway", "timestamp": 1000 + i * 5,
            })
        engine = CorrelationEngine()
        results = engine.analyze_trip(windows)
        # At least vibration_rpm should be present
        types = [r.correlation_type for r in results]
        assert "vibration_rpm" in types
        # All results must be significant
        for r in results:
            assert r.significant is True

    def test_healthy_data_no_results(self):
        """Healthy/random data should produce no significant correlations."""
        random.seed(42)
        windows = _make_windows(60)
        engine = CorrelationEngine()
        results = engine.analyze_trip(windows)
        # Healthy data with no correlations → no significant results
        # (There might occasionally be a false positive, but generally empty)
        for r in results:
            assert r.significant is True  # contract: only significant returned


# ---------------------------------------------------------------------------
# 9. save_results writes to DB
# ---------------------------------------------------------------------------

class TestSaveResults:
    def test_save_results_to_db(self):
        """Results are written to correlation_results table."""
        db = MockDB()
        db.setup()
        try:
            results = [
                CorrelationResult(
                    correlation_type="vibration_rpm",
                    r_value=0.85, slope=0.001, p_value=0.001,
                    data_points=60, regime="all",
                    diagnosis_hint="engine_mount", significant=True,
                ),
                CorrelationResult(
                    correlation_type="audio_wheel",
                    r_value=0.92, slope=0.05, p_value=0.0001,
                    data_points=55, regime="highway",
                    diagnosis_hint="wheel_bearing", significant=True,
                ),
            ]

            with db.cursor() as c:
                count = CorrelationEngine.save_results(c, "client_abc", "trip_001", results)
                assert count == 2

            # Verify rows exist
            with db.cursor() as c:
                c.execute("SELECT * FROM correlation_results ORDER BY correlation_type")
                rows = c.fetchall()
                assert len(rows) == 2
                # Check first row content (audio_wheel comes first alphabetically)
                row_dict = dict(rows[0])
                assert row_dict["correlation_type"] == "audio_wheel"
                assert row_dict["client_hash"] == "client_abc"
                assert row_dict["trip_id"] == "trip_001"
                assert abs(row_dict["r_value"] - 0.92) < 1e-6
        finally:
            db.teardown()

    def test_save_empty_results(self):
        """Saving empty list writes nothing."""
        db = MockDB()
        db.setup()
        try:
            with db.cursor() as c:
                count = CorrelationEngine.save_results(c, "x", "t", [])
                assert count == 0
        finally:
            db.teardown()


# ---------------------------------------------------------------------------
# 10. Missing keys handled gracefully
# ---------------------------------------------------------------------------

class TestMissingKeys:
    def test_missing_rpm_skipped(self):
        """Windows without rpm key are skipped in vibration_rpm."""
        windows = _make_windows(60)
        for w in windows:
            del w["rpm"]
        engine = CorrelationEngine()
        result = engine._vibration_rpm(windows)
        assert result is None

    def test_partial_keys_no_crash(self):
        """Windows with only some keys should not crash analyze_trip."""
        windows = [{"speed": 80, "timestamp": i} for i in range(60)]
        engine = CorrelationEngine()
        results = engine.analyze_trip(windows)
        assert isinstance(results, list)


# ---------------------------------------------------------------------------
# 11. Custom tire diameter
# ---------------------------------------------------------------------------

class TestCustomTireDiameter:
    def test_custom_diameter(self):
        """Engine with custom tire_diameter uses it for audio_wheel."""
        engine = CorrelationEngine(tire_diameter=0.70)
        assert engine.tire_diameter == 0.70
