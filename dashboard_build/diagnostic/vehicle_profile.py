"""VehicleProfile — dataclass with LTFT correction coefficients and KB resolution path."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


_JAPANESE_BRANDS = frozenset({
    "toyota", "honda", "mazda", "subaru", "nissan",
    "mitsubishi", "suzuki", "lexus", "infiniti", "acura",
})


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
