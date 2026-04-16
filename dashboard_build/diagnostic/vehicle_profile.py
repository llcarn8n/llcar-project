"""VehicleProfile — dataclass with LTFT correction coefficients and KB resolution path."""
from __future__ import annotations

import math
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


_JAPANESE_BRANDS = frozenset({
    "toyota", "honda", "mazda", "subaru", "nissan",
    "mitsubishi", "suzuki", "lexus", "infiniti", "acura",
})

# Draper 1938 (DOI:10.2514/8.590) — первая окружная (1,0) мода детонации.
# f_{1,0} = ρ · c / (π · B), где ρ=1.841 — первый корень J'_1(ρ)=0,
# c — скорость звука в газах сгорания при T≈2500 K ≈ 1000 м/с.
_DRAPER_RHO_1_0 = 1.841
_DRAPER_C_DEFAULT = 1000.0  # м/с


@dataclass
class VehicleProfile:
    """Vehicle identity + per-vehicle correction factors for diagnostics."""

    # --- required ---
    client_hash: str
    brand: str
    model: str
    year: int

    # --- optional ---
    vin: Optional[str] = None
    generation: Optional[str] = None
    engine_code: Optional[str] = None
    engine_type: str = "ice"
    mileage_km: int = 0
    platform: Optional[str] = None
    tire_diameter: float = 0.63  # meters, default 205/55 R16
    modifications: Dict[str, Any] = field(default_factory=dict)

    # --- S23: engine geometry for knock/order diagnostics (A.31) ---
    bore_mm: Optional[int] = None          # диаметр цилиндра, мм
    cylinder_count: Optional[int] = None    # L3/L4/L5/L6/V6/V8/V10/V12
    turbo_blade_count: Optional[int] = None # число лопаток турбины (z), 10–14 типично

    # ------------------------------------------------------------------
    # LTFT correction properties
    # ------------------------------------------------------------------

    @property
    def ltft_base_offset(self) -> float:
        """Base LTFT offset: -7.5 if catalytic converter removed (euro2), else 0."""
        if self.modifications.get("euro2_removed_cat") is True:
            return -7.5
        return 0.0

    @property
    def ltft_tolerance_mult(self) -> float:
        """LTFT tolerance multiplier based on fuel / platform / brand.

        Priority: LPG > GM platform > Japanese brand > default (1.0).
        """
        if self.modifications.get("fuel_type") == "lpg":
            return 1.5
        if self.platform and self.platform.startswith("GM_"):
            return 1.3
        if self.brand.lower() in _JAPANESE_BRANDS:
            return 0.7
        return 1.0

    # ------------------------------------------------------------------
    # S23: knock frequency from bore (Draper 1938 формула, A.31)
    # ------------------------------------------------------------------

    @property
    def knock_expected_freq_from_bore(self) -> Optional[float]:
        """Ожидаемая частота первой окружной (1,0) моды детонации [Hz].

        f_{1,0} = ρ · c / (π · B), где ρ=1.841 (J'_1(ρ)=0), c≈1000 м/с.
        Draper C.S. (1938) NACA Technical Report 493, DOI:10.2514/8.590.

        Возвращает None, если bore_mm неизвестен (fallback: 5–8 kHz в правиле 1.15).

        Примеры:
            bore=72 мм → f≈8144 Гц (VW 1.4 TSI)
            bore=86 мм → f≈6817 Гц (BMW N20/B48 2.0)
            bore=100 мм → f≈5864 Гц (Porsche 4.0 flat-six)
        """
        if self.bore_mm is None or self.bore_mm <= 0:
            return None
        bore_m = self.bore_mm / 1000.0
        return round(_DRAPER_RHO_1_0 * _DRAPER_C_DEFAULT / (math.pi * bore_m), 1)

    # ------------------------------------------------------------------
    # Knowledge-base resolution path
    # ------------------------------------------------------------------

    @property
    def kb_resolution_path(self) -> List[str]:
        """Return KB lookup path, most-specific first.

        With generation:
            brand/{brand}/model/{model}/generation/{gen}
            brand/{brand}/model/{model}
            brand/{brand}
            universal

        Without generation: skip the generation level.
        """
        path: List[str] = []
        if self.generation is not None:
            path.append(
                f"brand/{self.brand}/model/{self.model}/generation/{self.generation}"
            )
        path.append(f"brand/{self.brand}/model/{self.model}")
        path.append(f"brand/{self.brand}")
        path.append("universal")
        return path

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def to_db_row(self) -> Dict[str, Any]:
        """Convert to a flat dict suitable for DB insertion."""
        return asdict(self)

    @classmethod
    def from_db_row(cls, row: Dict[str, Any]) -> VehicleProfile:
        """Reconstruct a VehicleProfile from a DB row dict."""
        return cls(**row)
