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

    # ------------------------------------------------------------------
    # S21 Research: advanced diagnostic features
    # ------------------------------------------------------------------

    # 8. Wheel hop FFT peak detection (10-12 Hz normal, 7-8 Hz = low tire pressure)
    f["wheel_hop_peak_freq"] = None
    f["wheel_hop_peak_shifted"] = 0.0
    if packet.audio_peaks:
        # Find strongest peak in 5-15 Hz range (wheel hop zone)
        _best_wh_freq = None
        _best_wh_amp = 0.0
        for _fv, _av in packet.audio_peaks:
            if _fv is not None and _av is not None and 5 <= _fv <= 15:
                if _av > _best_wh_amp:
                    _best_wh_amp = _av
                    _best_wh_freq = _fv
        if _best_wh_freq is not None:
            f["wheel_hop_peak_freq"] = round(_best_wh_freq, 1)
            # Shifted = 1.0 if peak is in 5-9 Hz (below normal 10-12 Hz)
            f["wheel_hop_peak_shifted"] = 1.0 if _best_wh_freq < 9.0 else 0.0

    # 9. Aquaplaning indicators: ay spike + loss of wheel hop peak
    f["ay_spike_ratio"] = None
    _ay_std_val = getattr(packet, "ay_std", None)
    _az_std_val = getattr(packet, "az_std", None)
    if _ay_std_val is not None and _az_std_val is not None and _az_std_val > 0.01:
        f["ay_spike_ratio"] = round(_ay_std_val / _az_std_val, 3)

    # 10. az_peak absolute (for ISO 2631 critical safety)
    _az_max = getattr(packet, "az_max", None)
    _az_min = getattr(packet, "az_min", None)
    if _az_max is not None and _az_min is not None:
        f["az_peak_abs"] = round(max(abs(_az_max), abs(_az_min)), 3)
    else:
        f["az_peak_abs"] = None

    # ------------------------------------------------------------------
    # S23 Research: advanced vibration / order / SK / HPBM features
    # (proxies — полный анализ требует raw audio, см. A.26–A.34)
    # ------------------------------------------------------------------

    # 11. Spectral Kurtosis proxy (A.26)
    # Полный SK = ⟨|X(t,f)|⁴⟩/⟨|X(t,f)|²⟩² − 2 по STFT. Здесь proxy по percussive peaks:
    # тяжесть хвостов амплитудного распределения ⇒ импульсность.
    f["spectral_kurtosis_audio"] = None
    if packet.audio_percussive:
        _perc_amps = [
            abs(_a) for _, _a in packet.audio_percussive
            if _a is not None and _a > -9000 and _a != 0
        ]
        if len(_perc_amps) >= 4:
            _n = len(_perc_amps)
            _m2 = sum(_a * _a for _a in _perc_amps) / _n
            _m4 = sum(_a ** 4 for _a in _perc_amps) / _n
            if _m2 > 1e-9:
                _sk_proxy = _m4 / (_m2 * _m2) - 2.0
                f["spectral_kurtosis_audio"] = round(_sk_proxy, 3)

    # 12. Kurtogram best band proxy (A.26)
    # Разбиваем audio-полосу на 5 поддиапазонов, вычисляем SK для каждого,
    # возвращаем полосу с максимальным SK.
    f["kurtogram_best_band_low"] = None
    f["kurtogram_best_band_high"] = None
    f["kurtogram_best_sk"] = None
    if packet.audio_peaks or packet.audio_percussive:
        _bands = [(0, 500), (500, 2000), (2000, 5000), (5000, 10000), (10000, 22050)]
        _all_peaks = []
        for _fv, _av in (packet.audio_peaks or []):
            if _fv is not None and _av is not None and _av > 0:
                _all_peaks.append((_fv, _av))
        for _fv, _av in (packet.audio_percussive or []):
            if _fv is not None and _av is not None and _av > -9000 and _av != 0:
                _all_peaks.append((_fv, abs(_av)))
        _best_sk = None
        _best_band = None
        for _lo, _hi in _bands:
            _in_band = [_a for _f, _a in _all_peaks if _lo <= _f < _hi]
            if len(_in_band) >= 3:
                _n = len(_in_band)
                _m2 = sum(_a * _a for _a in _in_band) / _n
                _m4 = sum(_a ** 4 for _a in _in_band) / _n
                if _m2 > 1e-9:
                    _sk = _m4 / (_m2 * _m2) - 2.0
                    if _best_sk is None or _sk > _best_sk:
                        _best_sk = _sk
                        _best_band = (_lo, _hi)
        if _best_band is not None:
            f["kurtogram_best_band_low"] = _best_band[0]
            f["kurtogram_best_band_high"] = _best_band[1]
            f["kurtogram_best_sk"] = round(_best_sk, 3)

    # 13. RPM order matches (A.27 Order Tracking)
    # Счётчик audio_peaks, чьи безразмерные порядки попадают в {0.5,1.0,2.0,3.0,4.0} ±0.05.
    # Инвариантно к RPM → устойчивее чем rpm_harmonic_matches в Гц.
    f["rpm_order_matches"] = 0
    f["order_1x_amp"] = None
    f["order_2x_amp"] = None
    f["order_05_amp"] = None
    if rpm is not None and rpm > 800 and packet.audio_peaks:
        _engine_base = rpm / 60.0
        if _engine_base > 0.5:
            _targets = (0.5, 1.0, 2.0, 3.0, 4.0)
            _matched = 0
            _order_amps = {0.5: None, 1.0: None, 2.0: None}
            for _fv, _av in packet.audio_peaks:
                if _fv is None or _av is None or _av <= 0:
                    continue
                _order = _fv / _engine_base
                for _t in _targets:
                    if abs(_order - _t) < 0.05:
                        _matched += 1
                        if _t in _order_amps:
                            _cur = _order_amps[_t]
                            if _cur is None or _av > _cur:
                                _order_amps[_t] = _av
                        break
            f["rpm_order_matches"] = _matched
            if _order_amps[1.0] is not None:
                f["order_1x_amp"] = round(_order_amps[1.0], 4)
            if _order_amps[2.0] is not None:
                f["order_2x_amp"] = round(_order_amps[2.0], 4)
            if _order_amps[0.5] is not None:
                f["order_05_amp"] = round(_order_amps[0.5], 4)

    # 14. ax_az phase proxy (A.33 Phase Angle)
    # Полный фазовый сдвиг между стендом и кузовом недоступен без синхронного
    # tacho-сигнала. Proxy: корреляция std(ax) и std(az) через нормированное
    # отношение — при плохом демпфировании продольные и вертикальные колебания
    # десинхронизируются → их соотношение становится близко к 1 (полная связь)
    # или дрейфует к 0 (развязка). |ax_az_phase_proxy| < 0.3 = слабая синхронизация.
    f["ax_az_phase_proxy"] = None
    if _ax is not None and _az is not None:
        _denom = math.sqrt(_ax * _ax + _az * _az)
        if _denom > 0.01:
            _proxy = (_az - _ax) / _denom
            f["ax_az_phase_proxy"] = round(_proxy, 3)

    # 15. HPBM bandwidth ratio (A.34)
    # Ширина пика wheel_hop (9-14 Гц) на уровне -3 дБ от пика, делённая на f_peak.
    # hpbm_applicable=true только при явном пике (>= 2× выше соседей).
    f["hpbm_bandwidth_ratio"] = None
    f["hpbm_applicable"] = False
    if packet.audio_peaks:
        # Собираем пики в резонансной зоне wheel_hop 7-20 Hz
        _wh_peaks = [
            (_fv, _av) for _fv, _av in packet.audio_peaks
            if _fv is not None and _av is not None and 7 <= _fv <= 20 and _av > 0
        ]
        if _wh_peaks:
            _wh_peaks.sort(key=lambda p: -p[1])
            _peak_f, _peak_a = _wh_peaks[0]
            _half_power_threshold = _peak_a / math.sqrt(2.0)
            # Границы −3 дБ: минимальная и максимальная частота среди пиков выше уровня
            _above_half = [_fv for _fv, _av in _wh_peaks if _av >= _half_power_threshold]
            if len(_above_half) >= 2 and _peak_f > 0.1:
                _f_low = min(_above_half)
                _f_high = max(_above_half)
                _bandwidth = _f_high - _f_low
                f["hpbm_bandwidth_ratio"] = round(_bandwidth / _peak_f, 3)
                # applicable: 2× доминирующий пик над следующим + явный wheel hop диапазон
                _second_a = _wh_peaks[1][1] if len(_wh_peaks) > 1 else 0.0
                _symmetric = abs(_peak_f - (_f_low + _f_high) / 2.0) / _peak_f < 0.15
                f["hpbm_applicable"] = bool(
                    _peak_a > 2.0 * _second_a and _symmetric and 9.0 <= _peak_f <= 14.0
                )

    return f
