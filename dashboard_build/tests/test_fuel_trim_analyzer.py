"""Tests for FuelTrimAnalyzer — TDD, 20 tests covering all requirements."""
import pytest

from diagnostic.vehicle_profile import VehicleProfile
from diagnostic.fuel_trim_analyzer import (
    FuelTrimAnalyzer, FuelTrimResult, DualRegimeResult, DualBankResult,
)
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

    def test_opposing_signs_no_classification(self):
        """ltft positive, stft negative (opposing signs) → None."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze(ltft=5.0, stft=-3.0, regime=DrivingRegime.IDLE)
        assert r.cross_type is None


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


# ===========================================================================
# Dual-regime LTFT analysis (idle vs 2000 RPM)
# ===========================================================================


class TestDualRegimeAnalysis:
    """Dual-regime LTFT comparison — key diagnostic differentiator.

    Professional mechanic technique:
      - Both bad → air leak / MAF
      - Idle only → adsorber / PCV valve
      - Load only → fuel pressure / injectors / catalytic converter
      - Both normal → no issue
    """

    def test_both_regimes_bad(self):
        """LTFT elevated on both idle and 2000 RPM → both_regimes pattern."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(ltft_idle=12.0, ltft_2000rpm=10.0)
        assert isinstance(r, DualRegimeResult)
        assert r.regime_pattern == "both_regimes"
        assert "утечка воздуха" in r.diagnosis_hint
        assert "MAF" in r.diagnosis_hint
        assert len(r.recommended_tests) > 0
        assert any("ДМРВ" in t for t in r.recommended_tests)

    def test_idle_only_bad(self):
        """LTFT elevated only at idle → idle_only pattern."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(ltft_idle=10.0, ltft_2000rpm=2.0)
        assert r.regime_pattern == "idle_only"
        assert "адсорбер" in r.diagnosis_hint
        assert "вентиляции картера" in r.diagnosis_hint
        assert len(r.recommended_tests) > 0
        assert any("адсорбер" in t.lower() for t in r.recommended_tests)

    def test_load_only_bad(self):
        """LTFT elevated only at 2000 RPM → load_only pattern."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(ltft_idle=2.0, ltft_2000rpm=10.0)
        assert r.regime_pattern == "load_only"
        assert "давление топлива" in r.diagnosis_hint
        assert "форсунки" in r.diagnosis_hint
        assert len(r.recommended_tests) > 0
        assert any("давление" in t.lower() for t in r.recommended_tests)

    def test_both_normal(self):
        """LTFT normal on both regimes → normal pattern."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(ltft_idle=2.0, ltft_2000rpm=1.5)
        assert r.regime_pattern == "normal"
        assert r.recommended_tests == []
        assert "в норме" in r.diagnosis_hint

    def test_severity_reflects_each_regime(self):
        """Idle severity and load severity computed independently."""
        a = FuelTrimAnalyzer(_default_profile())
        # idle=12% → PROBLEM, load=2% → NORMAL
        r = a.analyze_dual_regime(ltft_idle=12.0, ltft_2000rpm=2.0)
        assert r.idle_severity == "PROBLEM"
        assert r.load_severity == "NORMAL"

    def test_vehicle_corrections_applied(self):
        """Euro2 offset is applied before threshold comparison."""
        a = FuelTrimAnalyzer(_euro2_profile())
        # Euro2 offset = -7.5. Raw idle=-12 → corrected = (-12-(-7.5))/1.0 = -4.5 → abs=4.5 < 5 → normal
        # Raw load=-10 → corrected = (-10-(-7.5))/1.0 = -2.5 → abs=2.5 < 5 → normal
        r = a.analyze_dual_regime(ltft_idle=-12.0, ltft_2000rpm=-10.0)
        assert r.regime_pattern == "normal"

    def test_negative_ltft_both_bad(self):
        """Negative (rich) LTFT on both regimes is caught as both_regimes."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(ltft_idle=-10.0, ltft_2000rpm=-8.0)
        assert r.regime_pattern == "both_regimes"

    def test_stft_values_stored(self):
        """STFT values are stored in the result for downstream use."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_regime(
            ltft_idle=10.0, ltft_2000rpm=2.0,
            stft_idle=5.0, stft_2000rpm=1.0,
        )
        assert r.stft_idle == 5.0
        assert r.stft_2000rpm == 1.0
        assert r.ltft_idle == 10.0
        assert r.ltft_2000rpm == 2.0


# ===========================================================================
# Dual-bank LTFT analysis (Bank 1 vs Bank 2) — GAP-F2
# ===========================================================================


class TestDualBankAnalysis:
    """Dual-bank LTFT comparison to classify problem locality.

    symmetric  (delta < 3%): common problem (fuel, air, MAF)
    asymmetric (delta >= 3%): localized problem (injector, vacuum leak on one side)
    """

    def test_symmetric_identical_banks(self):
        """Both banks at same LTFT -> symmetric, delta=0."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=8.0, ltft_bank2=8.0)
        assert isinstance(r, DualBankResult)
        assert r.pattern == "symmetric"
        assert r.delta == pytest.approx(0.0)

    def test_symmetric_small_delta(self):
        """Banks differ by 2% -> symmetric (below 3% threshold)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=10.0, ltft_bank2=8.0)
        assert r.pattern == "symmetric"
        assert r.delta == pytest.approx(2.0)

    def test_asymmetric_large_delta(self):
        """Banks differ by 5% -> asymmetric (above 3% threshold)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=10.0, ltft_bank2=5.0)
        assert r.pattern == "asymmetric"
        assert r.delta == pytest.approx(5.0)

    def test_asymmetric_exact_threshold(self):
        """Banks differ by exactly 3% -> asymmetric (>= threshold)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=8.0, ltft_bank2=5.0)
        assert r.pattern == "asymmetric"
        assert r.delta == pytest.approx(3.0)

    def test_symmetric_just_below_threshold(self):
        """Banks differ by 2.9% -> symmetric (< 3%)."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=7.9, ltft_bank2=5.0)
        assert r.pattern == "symmetric"
        assert r.delta == pytest.approx(2.9)

    def test_symmetric_hint_contains_common_cause(self):
        """Symmetric diagnosis mentions common cause."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=8.0, ltft_bank2=8.0)
        assert "общая причина" in r.diagnosis_hint

    def test_asymmetric_hint_contains_localized_cause(self):
        """Asymmetric diagnosis mentions localized cause."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=15.0, ltft_bank2=5.0)
        assert "локальная причина" in r.diagnosis_hint
        assert "форсунка" in r.diagnosis_hint

    def test_negative_ltft_asymmetric(self):
        """Negative LTFT values (rich) with large delta -> asymmetric."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(ltft_bank1=-10.0, ltft_bank2=-3.0)
        assert r.pattern == "asymmetric"
        assert r.delta == pytest.approx(7.0)

    def test_vehicle_correction_applied(self):
        """Euro2 offset cancels out for delta computation (same offset both banks)."""
        a = FuelTrimAnalyzer(_euro2_profile())
        # offset = -7.5, mult = 1.0
        # corrected_b1 = (-12 - (-7.5)) / 1.0 = -4.5
        # corrected_b2 = (-10 - (-7.5)) / 1.0 = -2.5
        # delta = abs(-4.5 - (-2.5)) = 2.0 -> symmetric
        r = a.analyze_dual_bank(ltft_bank1=-12.0, ltft_bank2=-10.0)
        assert r.pattern == "symmetric"
        assert r.delta == pytest.approx(2.0)

    def test_stft_values_stored(self):
        """STFT values are stored in the result for downstream use."""
        a = FuelTrimAnalyzer(_default_profile())
        r = a.analyze_dual_bank(
            ltft_bank1=10.0, ltft_bank2=5.0,
            stft_bank1=3.0, stft_bank2=1.0,
        )
        assert r.stft_bank1 == 3.0
        assert r.stft_bank2 == 1.0
        assert r.ltft_bank1 == 10.0
        assert r.ltft_bank2 == 5.0

    def test_lpg_tolerance_affects_delta(self):
        """LPG tolerance mult=1.5 reduces effective delta between banks."""
        a = FuelTrimAnalyzer(_lpg_profile())
        # mult=1.5, offset=0
        # corrected_b1 = 9.0 / 1.5 = 6.0
        # corrected_b2 = 4.5 / 1.5 = 3.0
        # delta = abs(6.0 - 3.0) = 3.0 -> asymmetric (exactly at threshold)
        r = a.analyze_dual_bank(ltft_bank1=9.0, ltft_bank2=4.5)
        assert r.pattern == "asymmetric"
        assert r.delta == pytest.approx(3.0)
