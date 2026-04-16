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
    tire_diameter: float = TIRE_DIAMETER,
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
            tire_freq = speed / (3.6 * math.pi * tire_diameter)
            for harmonic in range(1, 13):
                expected = tire_freq * harmonic
                if abs(dom_freq - expected) < 5.0:
                    f["virtual_freq_source"] = "wheel"
                    f["virtual_freq_order"] = harmonic
                    break

    # ------------------------------------------------------------------
    # S21: suspension / audio diagnostic features
    # ------------------------------------------------------------------

    # 1. Vibration freq ratio: dominant_freq / wheel_rotation_freq
    f["vibration_freq_ratio"] = None
    if dom_freq is not None and speed is not None and speed > 5:
        tire_freq_val = speed / (3.6 * math.pi * tire_diameter)
        if tire_freq_val > 0.1:
            f["vibration_freq_ratio"] = round(dom_freq / tire_freq_val, 3)

    # 2. Engine harmonic match (bool as float)
    f["engine_harmonic_match"] = (
        1.0 if f["virtual_freq_source"] == "engine" else 0.0
    )

    # 3. RPM harmonic matches: count FFT peaks matching engine harmonics 1-4x
    f["rpm_harmonic_matches"] = 0
    if rpm is not None and rpm > 0 and packet.audio_peaks:
        engine_base = rpm / 60.0
        _matched = 0
        for _fv, _av in packet.audio_peaks:
            if _fv is None or _av is None or _av <= 0:
                continue
            for _order in range(1, 5):
                if abs(_fv - engine_base * _order) < 2.0:
                    _matched += 1
                    break
        f["rpm_harmonic_matches"] = _matched

    # 4. Vertical / lateral ratio (ball joint wear signature)
    _az = getattr(packet, "az_std", None)
    _ax = getattr(packet, "ax_std", None)
    if _az is not None and _ax is not None and _ax > 0.01:
        f["vertical_lateral_ratio"] = round(_az / _ax, 3)
    else:
        f["vertical_lateral_ratio"] = None

    # 5. Audio energy in 120-180 Hz band (bushing wear signature)
    f["audio_energy_band_120_180"] = None
    if packet.audio_peaks:
        _total = sum(a for _, a in packet.audio_peaks if a is not None and a > 0)
        _band = sum(a for fr, a in packet.audio_peaks
                    if fr is not None and a is not None and a > 0
                    and 120 <= fr <= 180)
        if _total > 0:
            f["audio_energy_band_120_180"] = round(_band / _total, 3)

    # 6. BPFO harmonic matches (wheel bearing signature)
    # Typical BPFO ~ 4x wheel_rps for standard 6-8 ball bearings
    f["bpfo_harmonic_matches"] = 0
    if speed is not None and speed > 20 and packet.audio_peaks:
        _wheel_rps = speed / (3.6 * math.pi * tire_diameter)
        _bpfo = 4.0 * _wheel_rps
        if _bpfo > 1.0:
            _bm = 0
            for _fv, _av in packet.audio_peaks:
                if _fv is None or _av is None or _av <= 0:
                    continue
                for _h in range(1, 8):
                    if abs(_fv - _bpfo * _h) < 3.0:
                        _bm += 1
                        break
            f["bpfo_harmonic_matches"] = _bm

    # 7. Percussive energy in 5-8 kHz band (knock/detonation signature)
    # percussive peaks = impacts/knocks separated from harmonic content
    f["percussive_energy_5k_8k"] = None
    f["percussive_peak_count_5k_8k"] = 0
    if packet.audio_percussive:
        _total_perc = sum(abs(a) for _, a in packet.audio_percussive
                         if a is not None and a > -9000)
        _band_perc = 0.0
        _band_count = 0
        for _pf, _pa in packet.audio_percussive:
            if _pf is not None and _pa is not None and _pa > -9000:
                if 5000 <= _pf <= 8000:
                    _band_perc += abs(_pa)
                    _band_count += 1
        if _total_perc > 0:
            f["percussive_energy_5k_8k"] = round(_band_perc / _total_perc, 3)
        f["percussive_peak_count_5k_8k"] = _band_count

    return f
