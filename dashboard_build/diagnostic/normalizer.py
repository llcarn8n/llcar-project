"""Normalizer — validates raw data, classifies driving regime, determines engine context and tier.

Responsibilities:
  1. Validate every raw OBD / accel / audio field against physical bounds.
  2. Classify the current driving regime (IDLE, CITY, HIGHWAY, ...).
  3. Determine engine context (warm, cold_start, minutes_running, ambient_temp).
  4. Detect data tier (T1 = OBD only, T2 = OBD+accel, T3 = OBD+accel+audio).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SessionTimer:
    """Track engine running time from first packet timestamp."""

    def __init__(self) -> None:
        self._first_time: Optional[str] = None

    def update(self, timestamp: str) -> float:
        """Return minutes elapsed since the first packet.

        Returns 0.0 for the very first call and on any parse error.
        """
        if self._first_time is None:
            # Try to parse before accepting — reject garbage early
            try:
                datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except (ValueError, TypeError, AttributeError):
                return 0.0
            self._first_time = timestamp
            return 0.0
        try:
            t0 = datetime.fromisoformat(self._first_time.replace("Z", "+00:00"))
            t1 = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            delta = (t1 - t0).total_seconds() / 60.0
            return max(0.0, delta)
        except (ValueError, TypeError, AttributeError):
            return 0.0


def validate_ambient_temp(value: Optional[float]) -> Optional[float]:
    """Return ambient temperature if within plausible range [-60, 60] C, else None."""
    if value is None:
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    if value < -60 or value > 60:
        return None
    return value


class DrivingRegime(Enum):
    """Driving regime classification."""
    IDLE = "idle"
    CITY = "city"
    HIGHWAY = "highway"
    ACCELERATION = "acceleration"
    BRAKING = "braking"
    CORNERING = "cornering"
    UNKNOWN = "unknown"


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class EngineContext:
    """Engine operating context derived from OBD telemetry."""
    warm: bool = False
    minutes_running: float = 0.0
    ambient_temp: Optional[float] = None
    cold_start: bool = False


@dataclass
class NormalizedPacket:
    """Validated and enriched data packet ready for the diagnostic engine."""

    # --- OBD fields (None = missing or rejected) ---
    rpm: Optional[float] = None
    speed: Optional[float] = None
    coolant_temp: Optional[float] = None
    voltage: Optional[float] = None
    ltft_bank1: Optional[float] = None
    ltft_bank2: Optional[float] = None
    stft_bank1: Optional[float] = None
    stft_bank2: Optional[float] = None
    maf: Optional[float] = None
    map_pressure: Optional[float] = None
    o2_voltage: Optional[float] = None
    dtc_codes: List[str] = field(default_factory=list)

    # --- Accelerometer fields ---
    ax_avg: Optional[float] = None
    ax_std: Optional[float] = None
    ax_min: Optional[float] = None
    ax_max: Optional[float] = None
    ay_avg: Optional[float] = None
    ay_std: Optional[float] = None
    ay_min: Optional[float] = None
    ay_max: Optional[float] = None
    az_avg: Optional[float] = None
    az_std: Optional[float] = None
    az_min: Optional[float] = None
    az_max: Optional[float] = None

    # --- Audio fields ---
    dominant_freq: Optional[float] = None
    dominant_amp: Optional[float] = None
    audio_quality: Optional[float] = None

    # --- Computed ---
    regime: DrivingRegime = DrivingRegime.UNKNOWN
    engine_context: EngineContext = field(default_factory=EngineContext)
    tier: str = "T1"
    regime_stable: bool = True  # GAP-P2: False when regime just changed


# ---------------------------------------------------------------------------
# Validation bounds
# ---------------------------------------------------------------------------

# field_name -> (min_inclusive, max_inclusive)
_VALIDATION_BOUNDS: Dict[str, Tuple[float, float]] = {
    "rpm": (0, 10_000),
    "speed": (0, 300),
    "coolant_temp": (-50, 250),
    "voltage": (0, 25),
    "ltft_bank1": (-100, 100),
    "ltft_bank2": (-100, 100),
    "stft_bank1": (-100, 100),
    "stft_bank2": (-100, 100),
    "maf": (0, 1000),
    "map_pressure": (0, 500),
    "o2_voltage": (0, 2.0),
    "dominant_freq": (0, 20_000),
    "dominant_amp": (0, 10_000),
    "audio_quality": (0, 100),
}

# Accel fields have no fixed physical bounds — they are passed through as-is.
_ACCEL_FIELDS = (
    "ax_avg", "ax_std", "ax_min", "ax_max",
    "ay_avg", "ay_std", "ay_min", "ay_max",
    "az_avg", "az_std", "az_min", "az_max",
)

_AUDIO_FIELDS = ("dominant_freq", "dominant_amp", "audio_quality")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _validate_field(raw: dict, name: str) -> Optional[float]:
    """Return value if present and within bounds, else None."""
    value = raw.get(name)
    if value is None:
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    bounds = _VALIDATION_BOUNDS.get(name)
    if bounds is not None:
        lo, hi = bounds
        if value < lo or value > hi:
            return None
    return value


def _classify_regime(
    speed: Optional[float],
    ax_avg: Optional[float],
    ay_avg: Optional[float],
) -> DrivingRegime:
    """Classify the driving regime from speed and accelerometer averages.

    Priority order:
      1. speed < 3             → IDLE
      2. ax < -2.0 & speed > 5 → BRAKING
      3. ax > 2.0              → ACCELERATION
      4. |ay| > 2.5            → CORNERING
      5. speed > 70            → HIGHWAY
      6. else                  → CITY
    """
    if speed is None:
        return DrivingRegime.UNKNOWN

    if speed < 3:
        return DrivingRegime.IDLE

    ax = ax_avg if ax_avg is not None else 0.0
    ay = ay_avg if ay_avg is not None else 0.0

    if ax < -2.0 and speed > 5:
        return DrivingRegime.BRAKING
    if ax > 2.0:
        return DrivingRegime.ACCELERATION
    if abs(ay) > 2.5:
        return DrivingRegime.CORNERING
    if speed > 70:
        return DrivingRegime.HIGHWAY

    return DrivingRegime.CITY


def _build_engine_context(
    coolant_temp: Optional[float],
    ambient_temp: Optional[float] = None,
    minutes_running: float = 0.0,
) -> EngineContext:
    """Derive engine context from coolant temperature and optional enrichments."""
    ctx = EngineContext()
    if coolant_temp is not None:
        ctx.warm = coolant_temp > 80
        ctx.cold_start = coolant_temp < 60
    ctx.ambient_temp = validate_ambient_temp(ambient_temp)
    ctx.minutes_running = max(0.0, float(minutes_running)) if minutes_running else 0.0
    return ctx


def _detect_tier(raw: dict) -> str:
    """Detect data tier based on sensor presence.

    T3 = has_audio + has_accel
    T2 = has_accel (no audio)
    T1 = OBD only
    """
    has_accel = any(raw.get(f) is not None for f in _ACCEL_FIELDS)
    has_audio = any(raw.get(f) is not None for f in _AUDIO_FIELDS)

    if has_accel and has_audio:
        return "T3"
    if has_accel:
        return "T2"
    return "T1"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def normalize_packet(
    raw: dict,
    previous_regime: Optional[DrivingRegime] = None,
) -> NormalizedPacket:
    """Validate raw telemetry dict and return a fully normalized packet.

    Fields outside physical bounds are set to None.
    Driving regime, engine context, and data tier are computed.

    Args:
        raw: Raw telemetry dict with OBD/accel/audio fields.
        previous_regime: If provided, regime_stable will be False when the
            current regime differs from the previous one (GAP-P2).
            When None, regime_stable defaults to True (backward compat).
    """
    # Validate bounded OBD fields
    rpm = _validate_field(raw, "rpm")
    speed = _validate_field(raw, "speed")
    coolant_temp = _validate_field(raw, "coolant_temp")
    voltage = _validate_field(raw, "voltage")
    ltft_bank1 = _validate_field(raw, "ltft_bank1")
    ltft_bank2 = _validate_field(raw, "ltft_bank2")
    stft_bank1 = _validate_field(raw, "stft_bank1")
    stft_bank2 = _validate_field(raw, "stft_bank2")
    maf = _validate_field(raw, "maf")
    map_pressure = _validate_field(raw, "map_pressure")
    o2_voltage = _validate_field(raw, "o2_voltage")

    # DTC codes — pass through as list of strings
    dtc_codes = raw.get("dtc_codes", [])
    if not isinstance(dtc_codes, list):
        dtc_codes = []

    # Validate audio fields
    dominant_freq = _validate_field(raw, "dominant_freq")
    dominant_amp = _validate_field(raw, "dominant_amp")
    audio_quality = _validate_field(raw, "audio_quality")

    # Accel fields — pass through if present (no bounds, physical sensors)
    accel_vals = {}
    for f in _ACCEL_FIELDS:
        val = raw.get(f)
        if val is not None:
            try:
                accel_vals[f] = float(val)
            except (TypeError, ValueError):
                accel_vals[f] = None
        else:
            accel_vals[f] = None

    # Computed fields
    regime = _classify_regime(speed, accel_vals.get("ax_avg"), accel_vals.get("ay_avg"))

    # Extract optional engine context enrichments from raw packet
    raw_ambient = raw.get("ambient_temp")
    raw_minutes = raw.get("minutes_running", 0.0)
    engine_context = _build_engine_context(
        coolant_temp,
        ambient_temp=raw_ambient,
        minutes_running=raw_minutes,
    )
    tier = _detect_tier(raw)

    # GAP-P2: Regime stability — False when regime just changed
    regime_stable = True
    if previous_regime is not None and previous_regime != regime:
        regime_stable = False

    return NormalizedPacket(
        rpm=rpm,
        speed=speed,
        coolant_temp=coolant_temp,
        voltage=voltage,
        ltft_bank1=ltft_bank1,
        ltft_bank2=ltft_bank2,
        stft_bank1=stft_bank1,
        stft_bank2=stft_bank2,
        maf=maf,
        map_pressure=map_pressure,
        o2_voltage=o2_voltage,
        dtc_codes=dtc_codes,
        ax_avg=accel_vals.get("ax_avg"),
        ax_std=accel_vals.get("ax_std"),
        ax_min=accel_vals.get("ax_min"),
        ax_max=accel_vals.get("ax_max"),
        ay_avg=accel_vals.get("ay_avg"),
        ay_std=accel_vals.get("ay_std"),
        ay_min=accel_vals.get("ay_min"),
        ay_max=accel_vals.get("ay_max"),
        az_avg=accel_vals.get("az_avg"),
        az_std=accel_vals.get("az_std"),
        az_min=accel_vals.get("az_min"),
        az_max=accel_vals.get("az_max"),
        dominant_freq=dominant_freq,
        dominant_amp=dominant_amp,
        audio_quality=audio_quality,
        regime=regime,
        engine_context=engine_context,
        tier=tier,
        regime_stable=regime_stable,
    )
