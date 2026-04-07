"""FuelTrimAnalyzer — vehicle-aware LTFT/STFT analysis with severity, cross-analysis,
recommended tests, and financial loss estimation.

Pipeline position: called by DiagnosisBuilder with raw fuel-trim values
                   from a NormalizedPacket.

Correction chain:
  1. Base offset   (euro2 cat removal → -7.5 %)
  2. Tolerance mult (LPG /1.5, GM /1.3, Japanese /0.7)
  3. Winter correction (ambient < -15 °C → reduce abs by 4 %)
  4. Absolute corrected → severity table lookup

Cross-analysis classifies mixture direction (lean / rich / chronic / sensor).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .normalizer import DrivingRegime
from .vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Severity table (10 levels, inclusive lower bound, exclusive upper bound)
# ---------------------------------------------------------------------------

_SEVERITY_TABLE = [
    #  (lo, hi,  severity,     level_name)
    (0,   3,   "NORMAL",     "normal_low"),
    (3,   5,   "NORMAL",     "normal_high"),
    (5,   7,   "BORDERLINE", "borderline"),
    (7,  10,   "ELEVATED",   "elevated"),
    (10,  15,  "PROBLEM",    "problem"),
    (15,  25,  "DEFECT",     "defect"),
    (25,  37,  "CRITICAL",   "critical"),
    (37, 999,  "DANGER",     "danger"),
]


def _severity_lookup(abs_corrected: float) -> tuple[str, str]:
    """Return (severity, level_name) for the given absolute corrected LTFT."""
    for lo, hi, severity, level_name in _SEVERITY_TABLE:
        if lo <= abs_corrected < hi:
            return severity, level_name
    # Fallback (should not happen with 999 ceiling)
    return "DANGER", "danger"


# ---------------------------------------------------------------------------
# Recommended tests by cross_type
# ---------------------------------------------------------------------------

_TESTS_LEAN = [
    "Крышка маслозаливной горловины — открыть на ХХ, смотреть LTFT",
    "Масляный щуп — вынуть на ХХ, смотреть LTFT",
    "Сравнить LTFT на ХХ и 2000 об/мин",
    "Проверить крышку бензобака",
    "Дымогенератор (500-3000 руб)",
]

_TESTS_RICH = [
    "Отключение ДМРВ — отсоединить разъём",
    "Заглушить адсорбер — пережать шланг",
    "Проверить клапан продувки адсорбера",
]

_TESTS_SENSOR = [
    "Проверить датчик кислорода",
    "Проверить катализатор",
]

_CROSS_TESTS = {
    "lean": _TESTS_LEAN,
    "rich": _TESTS_RICH,
    "chronic": _TESTS_LEAN,   # same as lean
    "sensor": _TESTS_SENSOR,
}


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class FuelTrimResult:
    """Structured result of fuel-trim analysis."""
    severity: str
    level_name: str
    corrected_ltft: float
    corrected_abs: float
    cross_type: Optional[str]
    recommended_tests: List[str]
    monthly_loss_rub: float
    yearly_loss_rub: float
    raw_ltft: float
    raw_stft: float
    regime: str = ""
    coolant_temp: Optional[float] = None
    ambient_temp: Optional[float] = None
    base_offset_applied: float = 0.0
    tolerance_mult_applied: float = 1.0
    winter_correction_applied: bool = False


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------

class FuelTrimAnalyzer:
    """Vehicle-aware fuel-trim analyzer.

    Args:
        vehicle_profile: provides ``ltft_base_offset`` and ``ltft_tolerance_mult``.
    """

    def __init__(self, vehicle_profile: VehicleProfile) -> None:
        self._profile = vehicle_profile

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(
        self,
        ltft: float,
        stft: float,
        regime: DrivingRegime,
        coolant_temp: Optional[float] = None,
        ambient_temp: Optional[float] = None,
        *,
        base_consumption: float = 10.0,
        fuel_price: float = 55.0,
        monthly_km: float = 1500.0,
    ) -> FuelTrimResult:
        """Analyze fuel-trim values and return a structured result.

        Correction chain:
          1. Subtract base_offset  (euro2 cat removal shifts LTFT by -7.5)
          2. Divide by tolerance_mult  (LPG, GM, Japanese)
          3. Winter correction  (ambient < -15 °C → reduce absolute by 4 %)
          4. Severity lookup from absolute corrected value
        """
        offset = self._profile.ltft_base_offset
        mult = self._profile.ltft_tolerance_mult

        # Step 1 + 2: apply base offset and tolerance multiplier
        corrected = (ltft - offset) / mult

        # Step 3: winter correction
        winter_applied = False
        if ambient_temp is not None and ambient_temp < -15.0:
            winter_applied = True
            corrected_abs = max(0.0, abs(corrected) - 4.0)
        else:
            corrected_abs = abs(corrected)

        # Step 4: severity from table
        severity, level_name = _severity_lookup(corrected_abs)

        # Cross-analysis
        cross_type = self._cross_analyze(ltft, stft)

        # Recommended tests (empty if severity is NORMAL)
        if severity == "NORMAL":
            tests: List[str] = []
        else:
            tests = list(_CROSS_TESTS.get(cross_type, []))  # defensive copy

        # Financial loss
        monthly_loss = self._calc_monthly_loss(
            corrected_abs, base_consumption, fuel_price, monthly_km,
        )

        return FuelTrimResult(
            severity=severity,
            level_name=level_name,
            corrected_ltft=corrected,
            corrected_abs=corrected_abs,
            cross_type=cross_type,
            recommended_tests=tests,
            monthly_loss_rub=monthly_loss,
            yearly_loss_rub=monthly_loss * 12,
            raw_ltft=ltft,
            raw_stft=stft,
            regime=regime.value,
            coolant_temp=coolant_temp,
            ambient_temp=ambient_temp,
            base_offset_applied=offset,
            tolerance_mult_applied=mult,
            winter_correction_applied=winter_applied,
        )

    # ------------------------------------------------------------------
    # Cross-analysis
    # ------------------------------------------------------------------

    @staticmethod
    def _cross_analyze(ltft: float, stft: float) -> Optional[str]:
        """Classify mixture direction from LTFT + STFT.

        Priority (first match wins):
          1. chronic: abs(ltft)>10 and abs(stft) < abs(ltft)*0.5
          2. sensor:  abs(ltft)<=5 and abs(stft)>10
          3. lean:    ltft>0 and stft>0
          4. rich:    ltft<0 and stft<0
          5. None:    no clear classification
        """
        abs_ltft = abs(ltft)
        abs_stft = abs(stft)

        if abs_ltft > 10 and abs_stft < abs_ltft * 0.5:
            return "chronic"
        if abs_ltft <= 5 and abs_stft > 10:
            return "sensor"
        if ltft > 0 and stft > 0:
            return "lean"
        if ltft < 0 and stft < 0:
            return "rich"
        return None

    # ------------------------------------------------------------------
    # Financial loss
    # ------------------------------------------------------------------

    @staticmethod
    def _calc_monthly_loss(
        corrected_abs: float,
        base_consumption: float,
        fuel_price: float,
        monthly_km: float,
    ) -> float:
        """Calculate monthly fuel over-spend in rubles.

        Formula:  abs(corrected_ltft) / 100 * base_consumption * fuel_price * monthly_km / 100
        """
        return corrected_abs / 100.0 * base_consumption * fuel_price * monthly_km / 100.0
