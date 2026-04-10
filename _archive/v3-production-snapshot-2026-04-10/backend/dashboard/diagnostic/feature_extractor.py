"""Feature Extractor — производные диагностические метрики.

Шаг 2 pipeline: NormalizedPacket → features dict.
Расширяет существующий compute_derived_features() из anomaly_engine.py.

Features computed:
  - total_vibration:       RMS of (ax_std, ay_std, az_std)
  - crest_factor_{x,y,z}:  peak / RMS per axis
  - shape_ratio_{x,y,z}:   std / range per axis
  - a{x,y,z}_range:        max - min per axis
  - ltft_abs:              abs(ltft_bank1)
  - fuel_trim_delta:       abs(ltft_bank1 - stft_bank1)
  - fuel_trim_sign_match:  True if ltft and stft have same sign
  - vibration_speed_ratio: total_vibration / max(speed, 1.0)
  - virtual_freq_source:   'engine' or 'wheel' or None
  - virtual_freq_order:    matched harmonic order or None
"""
from __future__ import annotations

import math
from typing import Dict, Optional, Union

from .normalizer import NormalizedPacket

# Tire diameter in meters (standard 205/55 R16 ≈ 0.63 m)
TIRE_DIAMETER = 0.63


def extract_features(
    packet: NormalizedPacket,
) -> Dict[str, Optional[Union[float, bool, str, int]]]:
    """Extract all derived features from a normalized packet.

    Returns a dict where every key is always present. Values are None when
    the required source fields are missing from the packet.
    """
    f: Dict[str, Optional[Union[float, bool, str, int]]] = {}

    # ------------------------------------------------------------------
    # Vibration features (T2)
    # ------------------------------------------------------------------
    stds = []
    for axis in ("x", "y", "z"):
        s = getattr(packet, f"a{axis}_std", None)
        if s is not None:
            stds.append(s)
    f["total_vibration"] = math.sqrt(sum(s * s for s in stds)) if stds else None

    for axis in ("x", "y", "z"):
        avg = getattr(packet, f"a{axis}_avg", None)
        std = getattr(packet, f"a{axis}_std", None)
        mn = getattr(packet, f"a{axis}_min", None)
        mx = getattr(packet, f"a{axis}_max", None)

        # Crest Factor = peak / RMS
        # peak = max(|min|, |max|),  RMS = sqrt(avg² + std²)
        if all(v is not None for v in (avg, std, mn, mx)):
            peak = max(abs(mn), abs(mx))
            rms = math.sqrt(avg * avg + std * std)
            f[f"crest_factor_{axis}"] = round(peak / rms, 3) if rms > 1e-9 else None
        else:
            f[f"crest_factor_{axis}"] = None

        # Shape Ratio = std / range,  range = max - min
        if std is not None and mn is not None and mx is not None:
            rng = mx - mn
            f[f"shape_ratio_{axis}"] = round(std / rng, 3) if rng > 1e-9 else None
        else:
            f[f"shape_ratio_{axis}"] = None

        # Range = max - min
        if mn is not None and mx is not None:
            f[f"a{axis}_range"] = round(mx - mn, 3)
        else:
            f[f"a{axis}_range"] = None

    # ------------------------------------------------------------------
    # Fuel Trim features (T1)
    # ------------------------------------------------------------------
    ltft = packet.ltft_bank1
    stft = packet.stft_bank1

    f["ltft_abs"] = abs(ltft) if ltft is not None else None

    f["fuel_trim_delta"] = (
        abs(ltft - stft) if ltft is not None and stft is not None else None
    )

    if ltft is not None and stft is not None:
        ltft_sign = 1 if ltft >= 0 else -1
        stft_sign = 1 if stft >= 0 else -1
        f["fuel_trim_sign_match"] = ltft_sign == stft_sign
    else:
        f["fuel_trim_sign_match"] = None

    # ------------------------------------------------------------------
    # Speed / vibration ratio (T2)
    # ------------------------------------------------------------------
    if f["total_vibration"] is not None and packet.speed is not None:
        f["vibration_speed_ratio"] = round(
            f["total_vibration"] / max(packet.speed, 1.0), 4
        )
    else:
        f["vibration_speed_ratio"] = None

    # ------------------------------------------------------------------
    # Virtual frequency identification (T3)
    # ------------------------------------------------------------------
    f["virtual_freq_source"] = None
    f["virtual_freq_order"] = None

    dom_freq = packet.dominant_freq
    rpm = packet.rpm
    speed = packet.speed

    if dom_freq is not None and rpm is not None and rpm > 0:
        # Try engine harmonics first: rpm/60 * order, orders 1-8
        engine_base = rpm / 60.0
        for order in range(1, 9):
            expected = engine_base * order
            if abs(dom_freq - expected) < 5.0:
                f["virtual_freq_source"] = "engine"
                f["virtual_freq_order"] = order
                break

        # If no engine match, try wheel harmonics: speed/(3.6*pi*d) * harmonic, 1-12
        if f["virtual_freq_source"] is None and speed is not None and speed > 5:
            tire_freq = speed / (3.6 * math.pi * TIRE_DIAMETER)
            for harmonic in range(1, 13):
                expected = tire_freq * harmonic
                if abs(dom_freq - expected) < 5.0:
                    f["virtual_freq_source"] = "wheel"
                    f["virtual_freq_order"] = harmonic
                    break

    return f
