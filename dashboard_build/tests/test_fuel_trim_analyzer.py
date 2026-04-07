"""Tests for FuelTrimAnalyzer — TDD, 20 tests covering all requirements."""
import pytest

from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.fuel_trim_analyzer import FuelTrimAnalyzer, FuelTrimResult
from diagnostic.normalizer import DrivingRegime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _default_profile(**overrides) -> VehicleProfile:
    """Create a default VehicleProfile with optional overrides."""
    defaults = dict(
        client_hash="test",
        brand="Kia",
        model="Rio",
        year=2020,
    )
    defaults.update(overrides)
    return VehicleProfile(**defaults)


def _euro2_profile() -> VehicleProfile:
    return _default_profile(
        brand="Lada", model="Vesta", year=2019,
        modifications={"euro2_removed_cat": True},
    )


def _lpg_profile() -> VehicleProfile:
    return _default_profile(modifications={"fuel_type": "lpg"})


def _gm_profile() -> VehicleProfile:
    return _default_profile(
        brand="Chevrolet", model="Cruze", year=2018, platform="GM_Delta2",
    )


def _japanese_profile() -> VehicleProfile:
    return _default_profile(brand="Toyota", model="Camry")


# ===========================================================================
# Severity level tests
# ===========================================================================


class TestSeverityLevels:
    """Severity lookup from corrected absolute LTFT value."""

    def test_normal_3_percent(self):
        """3% → NORMAL."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=3.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "NORMAL"

    def test_borderline_6_percent(self):
        """6% → BORDERLINE."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=6.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "BORDERLINE"

    def test_elevated_9_percent(self):
        """9% → ELEVATED."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=9.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "ELEVATED"

    def test_problem_12_percent(self):
        """12% → PROBLEM."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=12.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "PROBLEM"

    def test_defect_20_percent(self):
        """20% → DEFECT."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=20.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "DEFECT"

    def test_critical_30_percent(self):
        """30% → CRITICAL."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=30.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "CRITICAL"

    def test_danger_40_percent(self):
        """40% → DANGER."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=40.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "DANGER"


# ===========================================================================
# Vehicle correction tests
# ===========================================================================


class TestVehicleCorrections:
    """Base offset, tolerance multiplier, and winter correction."""

    def test_euro2_offset_normalizes(self):
        """Euro2: raw LTFT -12% → corrected = (-12 - (-7.5)) / 1.0 = -4.5 → abs=4.5 → NORMAL."""
        a = FuelTrimAnalyzer(_euro2_profile())
        r = a.analyze(ltft=-12.0, stft=-1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "NORMAL"
        assert abs(r.corrected_ltft - (-4.5)) < 0.01

    def test_lpg_tolerance_reduces_severity(self):
        """LPG: raw LTFT 18% → corrected = 18 / 1.5 = 12 → PROBLEM (not DEFECT)."""
        a = FuelTrimAnalyzer(_lpg_profile())
        r = a.analyze(ltft=18.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "PROBLEM"

    def test_gm_platform_tolerance(self):
        """GM: raw 12% → corrected = 12 / 1.3 ≈ 9.23 → ELEVATED (not PROBLEM)."""
        a = FuelTrimAnalyzer(_gm_profile())
        r = a.analyze(ltft=12.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "ELEVATED"

    def test_japanese_brand_tolerance(self):
        """Japanese: raw 8% → corrected = 8 / 0.7 ≈ 11.4 → PROBLEM."""
        a = FuelTrimAnalyzer(_japanese_profile())
        r = a.analyze(ltft=8.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "PROBLEM"

    def test_winter_correction_normalizes(self):
        """Winter: ambient=-20, ltft=-8% → corrected=-8, abs=8 → winter: max(0, 8-4)=4 → NORMAL."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=-8.0, stft=-1.0, regime=DrivingRegime.IDLE,
                       ambient_temp=-20.0)
        assert r.severity == "NORMAL"

    def test_no_winter_correction_above_minus15(self):
        """No winter correction when ambient=-10 (above threshold)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=-8.0, stft=-1.0, regime=DrivingRegime.IDLE,
                       ambient_temp=-10.0)
        # abs(corrected) = 8 → ELEVATED
        assert r.severity == "ELEVATED"


# ===========================================================================
# Cross-analysis LTFT vs STFT
# ===========================================================================


class TestCrossAnalysis:
    """Classify mixture direction from LTFT + STFT signs."""

    def test_both_positive_is_lean(self):
        """Both positive → lean (ltft<=10 avoids chronic)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=8.0, stft=5.0, regime=DrivingRegime.IDLE)
        assert r.cross_type == "lean"

    def test_both_negative_is_rich(self):
        """Both negative → rich (abs(ltft)<=10 avoids chronic)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=-8.0, stft=-5.0, regime=DrivingRegime.IDLE)
        assert r.cross_type == "rich"

    def test_chronic_high_ltft_low_stft(self):
        """abs(ltft)>10, abs(stft)<abs(ltft)*0.5 → chronic."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=20.0, stft=3.0, regime=DrivingRegime.IDLE)
        assert r.cross_type == "chronic"

    def test_sensor_low_ltft_high_stft(self):
        """abs(ltft)<=5, abs(stft)>10 → sensor."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=2.0, stft=15.0, regime=DrivingRegime.IDLE)
        assert r.cross_type == "sensor"


# ===========================================================================
# Recommended tests
# ===========================================================================


class TestRecommendedTests:
    """Recommended tests list varies by cross_type and severity."""

    def test_lean_contains_oil_cap(self):
        """lean → содержит 'крышка маслозаливной'."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=8.0, stft=5.0, regime=DrivingRegime.IDLE)
        joined = " ".join(r.recommended_tests).lower()
        assert "крышка маслозаливной" in joined

    def test_rich_contains_dmrv(self):
        """rich → содержит 'ДМРВ'."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=-8.0, stft=-5.0, regime=DrivingRegime.IDLE)
        joined = " ".join(r.recommended_tests)
        assert "ДМРВ" in joined

    def test_normal_severity_gives_no_tests(self):
        """NORMAL severity → empty recommended_tests."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=2.0, stft=1.0, regime=DrivingRegime.IDLE)
        assert r.severity == "NORMAL"
        assert r.recommended_tests == []


# ===========================================================================
# Loss calculator
# ===========================================================================


class TestLossCalculator:
    """Monthly / yearly financial loss estimation."""

    def test_loss_calculation_default_params(self):
        """15%, consumption=10, price=55, km=1500 → ~1237 rub/month."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=15.0, stft=1.0, regime=DrivingRegime.IDLE)
        # monthly = 15 / 100 * 10 * 55 * 1500 / 100 = 15 * 10 * 55 * 15 / 100
        #         = 0.15 * 10 * 55 * 15 = 0.15 * 8250 = 1237.5
        assert abs(r.monthly_loss_rub - 1237.5) < 1.0
        assert abs(r.yearly_loss_rub - 1237.5 * 12) < 12.0


# ===========================================================================
# FuelTrimResult dataclass completeness
# ===========================================================================


class TestResultDataclass:
    """Ensure FuelTrimResult has all required fields."""

    def test_result_has_all_fields(self):
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=12.0, stft=5.0, regime=DrivingRegime.IDLE)
        assert isinstance(r, FuelTrimResult)
        assert hasattr(r, "severity")
        assert hasattr(r, "level_name")
        assert hasattr(r, "corrected_ltft")
        assert hasattr(r, "cross_type")
        assert hasattr(r, "recommended_tests")
        assert hasattr(r, "monthly_loss_rub")
        assert hasattr(r, "yearly_loss_rub")
        assert hasattr(r, "raw_ltft")
        assert hasattr(r, "raw_stft")
        assert r.raw_ltft == 12.0
        assert r.raw_stft == 5.0
