"""Complex diagnostic rules implemented in Python.

These rules handle logic that cannot be expressed as simple threshold
comparisons in JSON: cross-analysis, pattern matching, regime-dependent
analysis, harmonic detection.

Each rule function has signature:
    def rule_xxx(features, packet, baselines, regime) -> Optional[dict]

Returns dict with:
    name, display, tier, confidence (0-100), status, conditions_met,
    conditions_total, min_confidence, situation_id, dtc_codes, details
Or None if rule doesn't apply.

Pipeline position: called by RuleEngine._run_python_rules after JSON rules.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional, Union


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _confidence_to_status(confidence: float) -> str:
    """Map confidence score to status string."""
    if confidence >= 70:
        return "likely"
    if confidence >= 40:
        return "possible"
    if confidence > 0:
        return "unlikely"
    return "clear"


def _make_result(
    name: str,
    display: str,
    tier: str,
    confidence: float,
    conditions_met: int,
    conditions_total: int,
    details: Dict[str, Any],
    *,
    min_confidence: int = 40,
    situation_id: Optional[str] = None,
    dtc_codes: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build a standardized result dict matching RuleEngine output format."""
    confidence = round(min(max(confidence, 0.0), 100.0), 1)
    return {
        "name": name,
        "display": display,
        "tier": tier,
        "confidence": confidence,
        "status": _confidence_to_status(confidence),
        "conditions_met": conditions_met,
        "conditions_total": conditions_total,
        "min_confidence": min_confidence,
        "situation_id": situation_id,
        "dtc_codes": dtc_codes or [],
        "details": details,
    }


def _regime_key(regime: Union[str, Enum]) -> str:
    """Normalize regime to string."""
    if isinstance(regime, Enum):
        return regime.value
    return str(regime)


# ---------------------------------------------------------------------------
# Rule 1: Fuel Bank Cross-Analysis (T1)
# ---------------------------------------------------------------------------

def rule_fuel_bank_cross(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Cross-analysis of LTFT Bank 1 vs Bank 2.

    Detects whether fuel trim issues are systemic (both banks) or
    localized (one bank only), which narrows the root cause.

    - Both positive > 5%: general lean (air leak downstream of throttle)
    - Both negative < -5%: general rich (fuel pressure, MAF issue)
    - One bank high, other ok (diff > 8%): localized injector issue
    - Only fires when at least one bank |value| > 5%
    """
    bank1 = getattr(packet, "ltft_bank1", None)
    bank2 = getattr(packet, "ltft_bank2", None)

    if bank1 is None and bank2 is None:
        return None

    # Default missing bank to 0 (single-bank vehicles)
    b1 = float(bank1) if bank1 is not None else 0.0
    b2 = float(bank2) if bank2 is not None else 0.0

    # Gate: at least one bank must exceed ±5%
    if abs(b1) <= 5.0 and abs(b2) <= 5.0:
        return None

    # Determine cross-type
    cross_type: str
    conditions_met = 0
    conditions_total = 3

    diff = abs(b1 - b2)

    if b1 > 5.0 and b2 > 5.0:
        cross_type = "lean_general"
        conditions_met = 3  # both banks positive, both above threshold
    elif b1 < -5.0 and b2 < -5.0:
        cross_type = "rich_general"
        conditions_met = 3
    elif diff > 8.0 and abs(b1) > abs(b2):
        cross_type = "localized_bank1"
        conditions_met = 2
    elif diff > 8.0 and abs(b2) > abs(b1):
        cross_type = "localized_bank2"
        conditions_met = 2
    elif abs(b1) > 5.0 or abs(b2) > 5.0:
        # One bank above threshold but difference not large enough for localized
        cross_type = "lean_general" if max(b1, b2) > 0 else "rich_general"
        conditions_met = 2
    else:
        return None

    # Confidence: base 40 + magnitude bonus (up to +40)
    magnitude = max(abs(b1), abs(b2))
    # Scale: 5% → 0 bonus, 25% → full 40 bonus
    magnitude_bonus = min((magnitude - 5.0) / 20.0, 1.0) * 40.0
    confidence = 40.0 + magnitude_bonus

    # Localized issues slightly lower confidence (harder to confirm)
    if cross_type.startswith("localized"):
        confidence *= 0.85

    return _make_result(
        name="fuel_bank_cross",
        display="Кросс-анализ топливных банков",
        tier="T1",
        confidence=confidence,
        conditions_met=conditions_met,
        conditions_total=conditions_total,
        details={
            "cross_type": cross_type,
            "bank1": b1,
            "bank2": b2,
            "difference": round(diff, 1),
        },
    )


# ---------------------------------------------------------------------------
# Rule 2: Vibration Regime Dependency (T2)
# ---------------------------------------------------------------------------

def rule_vibration_regime_dependency(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Checks what regime the vibration is worst in using baselines.

    Compares baseline means across regimes to detect which regime has
    the highest vibration. This reveals regime-specific problems:
    - ONLY highway mean elevated → wheel balance / tire issue
    - ONLY idle mean elevated → engine mount / misfire
    - ALL regimes elevated → general suspension wear
    - Needs baselines to be ready (count >= 30 for at least 2 regimes)

    The "elevated" threshold is relative: a regime's mean is considered
    elevated if it is significantly above the overall cross-regime average.
    """
    # Check baselines across key regimes
    target_regimes = ["idle", "city", "highway"]
    means: Dict[str, float] = {}
    ready_count = 0

    for reg in target_regimes:
        bl = baselines.get(reg, "az_std")
        if bl.count >= 30:
            ready_count += 1
            means[reg] = bl.mean

    # Need at least 2 regimes with baselines ready
    if ready_count < 2:
        return None

    ready_regimes = [r for r in target_regimes if r in means]

    # Compute overall average mean across ready regimes
    overall_mean = sum(means[r] for r in ready_regimes) / len(ready_regimes)

    # Absolute threshold: a mean above this indicates generally elevated vibration
    absolute_high = 3.0

    # A regime is "elevated" if its mean is significantly above the cross-regime avg
    # (relative check: > 2x overall, or > overall + 1.5)
    elevated_regimes = []
    for r in ready_regimes:
        relative_threshold = min(overall_mean * 2.0, overall_mean + 1.5)
        if means[r] > relative_threshold and means[r] > 1.5:
            elevated_regimes.append(r)

    # Check if ALL regimes are absolutely high (general wear pattern)
    all_absolutely_high = all(
        means[r] > absolute_high for r in ready_regimes
    ) and len(ready_regimes) >= 2

    if not elevated_regimes and not all_absolutely_high:
        return None

    # Classify pattern
    if all_absolutely_high and not elevated_regimes:
        # All regimes are high but none stands out relatively
        pattern = "all_regimes"
        display = "Вибрация на всех режимах — износ подвески"
        high_regimes = list(ready_regimes)
    elif elevated_regimes == ["highway"]:
        pattern = "highway_only"
        display = "Вибрация только на трассе — балансировка/шины"
        high_regimes = elevated_regimes
    elif elevated_regimes == ["idle"]:
        pattern = "idle_only"
        display = "Вибрация только на холостых — опоры/пропуски"
        high_regimes = elevated_regimes
    elif set(elevated_regimes) == set(ready_regimes) and len(elevated_regimes) >= 3:
        pattern = "all_regimes"
        display = "Вибрация на всех режимах — износ подвески"
        high_regimes = elevated_regimes
    else:
        pattern = "mixed"
        display = "Вибрация на нескольких режимах"
        high_regimes = elevated_regimes if elevated_regimes else list(ready_regimes)

    conditions_met = len(high_regimes)
    conditions_total = len(ready_regimes)

    # Confidence based on severity
    if pattern == "all_regimes":
        # Use absolute magnitude
        max_mean = max(means[r] for r in high_regimes)
        confidence = min(45.0 + (max_mean - absolute_high) * 10.0, 85.0)
    else:
        # Use ratio of elevated regime to overall
        max_mean = max(means[r] for r in high_regimes)
        ratio = max_mean / overall_mean if overall_mean > 0 else 1.0
        confidence = min(45.0 + (ratio - 1.5) * 15.0, 85.0)

    return _make_result(
        name="vibration_regime_dependency",
        display=display,
        tier="T2",
        confidence=confidence,
        conditions_met=conditions_met,
        conditions_total=conditions_total,
        details={
            "pattern": pattern,
            "means": {r: round(means[r], 2) for r in ready_regimes},
            "high_regimes": high_regimes,
            "overall_mean": round(overall_mean, 2),
        },
    )


# ---------------------------------------------------------------------------
# Rule 3: Audio Engine Harmonic (T3)
# ---------------------------------------------------------------------------

def rule_audio_engine_harmonic(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Checks if dominant audio frequency matches an engine RPM harmonic.

    engine_base = rpm / 60
    Check harmonics 1-8: if dominant_freq ~ engine_base * N (+-5 Hz)
    - Higher harmonics (4-8): valve train, injector tick
    - Lower harmonics (1-2): exhaust pulse, misfiring cylinder
    - Confidence higher for closer frequency match
    """
    rpm = getattr(packet, "rpm", None)
    dominant_freq = getattr(packet, "dominant_freq", None)

    if rpm is None or dominant_freq is None:
        return None

    rpm = float(rpm)
    dominant_freq = float(dominant_freq)

    if rpm <= 0 or dominant_freq <= 0:
        return None

    engine_base = rpm / 60.0
    tolerance = 5.0  # Hz

    best_match = None
    best_deviation = tolerance + 1  # Initialize above tolerance

    for n in range(1, 9):
        harmonic_freq = engine_base * n
        deviation = abs(dominant_freq - harmonic_freq)
        if deviation <= tolerance and deviation < best_deviation:
            best_deviation = deviation
            best_match = n

    if best_match is None:
        return None

    # Determine source category
    if best_match <= 2:
        source = "Exhaust pulse / misfiring cylinder"
    else:
        source = "Valve train / injector tick"

    # Confidence: closer match → higher confidence
    # deviation=0 → 75, deviation=5 → 45
    match_quality = 1.0 - (best_deviation / tolerance)
    confidence = 45.0 + match_quality * 30.0

    harmonic_freq = engine_base * best_match

    return _make_result(
        name="audio_engine_harmonic",
        display="Шум совпадает с гармоникой двигателя",
        tier="T3",
        confidence=confidence,
        conditions_met=1,
        conditions_total=1,
        details={
            "harmonic_number": best_match,
            "harmonic_freq_hz": round(harmonic_freq, 1),
            "dominant_freq_hz": dominant_freq,
            "deviation_hz": round(best_deviation, 1),
            "engine_base_hz": round(engine_base, 1),
            "source": source,
        },
    )


# ---------------------------------------------------------------------------
# Rule 4: Warmup Anomaly (T1+T2)
# ---------------------------------------------------------------------------

def rule_warmup_anomaly(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Detects problems that persist after engine warmup.

    Skip if coolant < 70 (engine not warm yet).
    If coolant > 80 AND vibration z-score > 2.0 → real issue (not cold start).
    If coolant > 80 AND ltft_abs > 10 → real fuel issue (not cold enrichment).
    Confidence = combination of warmth + anomaly severity.
    """
    coolant = getattr(packet, "coolant_temp", None)
    if coolant is None:
        return None

    coolant = float(coolant)
    if coolant < 70.0:
        return None

    # Need coolant > 80 for confident warmup detection
    if coolant <= 80.0:
        return None

    # Check vibration anomaly
    vib_anomaly = False
    vib_z = 0.0
    az_std_val = features.get("az_std")
    if az_std_val is None:
        az_std_val = getattr(packet, "az_std", None)

    if az_std_val is not None:
        regime_key = _regime_key(regime)
        bl = baselines.get(regime_key, "az_std")
        if bl.count >= 30:
            vib_z = bl.z_score(float(az_std_val))
            if vib_z > 2.0:
                vib_anomaly = True

    # Check fuel anomaly
    fuel_anomaly = False
    ltft_abs = features.get("ltft_abs")
    if ltft_abs is not None:
        ltft_abs = float(ltft_abs)
        if ltft_abs > 10.0:
            fuel_anomaly = True

    if not vib_anomaly and not fuel_anomaly:
        return None

    # Build details
    conditions_met = 0
    conditions_total = 3  # warmup + vibration + fuel
    conditions_met += 1  # warmup always met if we got here

    anomaly_types = []
    if vib_anomaly:
        conditions_met += 1
        anomaly_types.append("vibration")
    if fuel_anomaly:
        conditions_met += 1
        anomaly_types.append("fuel_trim")

    # Confidence: warmup gives base, anomaly severity adds
    warmth_factor = min((coolant - 80.0) / 20.0, 1.0)  # 80→0, 100→1
    severity = 0.0
    if vib_anomaly:
        severity = max(severity, min((vib_z - 2.0) / 3.0, 1.0))
    if fuel_anomaly and ltft_abs is not None:
        severity = max(severity, min((ltft_abs - 10.0) / 15.0, 1.0))

    confidence = 35.0 + warmth_factor * 15.0 + severity * 30.0

    # Both anomalies at once increase confidence
    if vib_anomaly and fuel_anomaly:
        confidence += 10.0

    return _make_result(
        name="warmup_anomaly",
        display="Аномалия сохраняется после прогрева",
        tier="T1",
        confidence=confidence,
        conditions_met=conditions_met,
        conditions_total=conditions_total,
        details={
            "coolant_temp": coolant,
            "anomaly_types": anomaly_types,
            "vibration_z": round(vib_z, 2),
            "ltft_abs": ltft_abs,
        },
    )


# ---------------------------------------------------------------------------
# Rule 5: Speed-Vibration Resonance (T2)
# ---------------------------------------------------------------------------

def rule_speed_vibration_resonance(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Detects resonance: vibration peak at specific speed.

    Compare current vibration z-score with baseline.
    If z > 2.5 AND speed is available → resonance at this speed.
    Typical: wheel balance resonance at 80-100 km/h.
    """
    speed = getattr(packet, "speed", None)
    if speed is None:
        return None
    speed = float(speed)

    if speed <= 0:
        return None

    az_std_val = features.get("az_std")
    if az_std_val is None:
        az_std_val = getattr(packet, "az_std", None)
    if az_std_val is None:
        return None
    az_std_val = float(az_std_val)

    regime_key = _regime_key(regime)
    bl = baselines.get(regime_key, "az_std")
    if bl.count < 30:
        return None

    z = bl.z_score(az_std_val)
    if z <= 2.5:
        return None

    # Determine speed range category
    if 70.0 <= speed <= 110.0:
        speed_category = "highway_resonance"
        display = f"Резонансная вибрация на ~{int(speed)} км/ч (балансировка)"
    elif 30.0 <= speed <= 60.0:
        speed_category = "city_resonance"
        display = f"Резонансная вибрация на ~{int(speed)} км/ч"
    else:
        speed_category = "other_resonance"
        display = f"Резонансная вибрация на ~{int(speed)} км/ч"

    # Confidence: z=2.5 → 45, z=5.0 → 70
    confidence = min(45.0 + (z - 2.5) * 10.0, 85.0)

    return _make_result(
        name="speed_vibration_resonance",
        display=display,
        tier="T2",
        confidence=confidence,
        conditions_met=2,
        conditions_total=2,
        details={
            "speed_kmh": speed,
            "z_score": round(z, 2),
            "speed_category": speed_category,
        },
    )


# ---------------------------------------------------------------------------
# Rule 6: PHEV Battery Degradation (T1)
# ---------------------------------------------------------------------------

def rule_phev_battery_degradation(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Detects signs of high-voltage battery degradation in PHEV/BEV.

    Combines multiple indicators:
    - SOC dropping faster than expected (low SOC at moderate speed)
    - Battery temp elevated (above 40 C)
    - Cell voltage delta high (imbalance between cells > 0.2V)
    - Range extender kicking in too often (SOC < 25% while driving)

    Confidence increases with number of concurrent symptoms.
    Only fires for vehicles that report HV battery data.
    """
    soc = getattr(packet, "hv_battery_soc", None)
    if soc is None:
        return None

    soc = float(soc)

    # Collect symptoms
    symptoms: List[str] = []
    conditions_met = 0
    conditions_total = 4

    # Symptom 1: Low SOC while driving
    speed = getattr(packet, "speed", None)
    if speed is not None and float(speed) > 20.0 and soc < 25.0:
        symptoms.append("rapid_soc_drop")
        conditions_met += 1

    # Symptom 2: Elevated battery temperature
    batt_temp = getattr(packet, "hv_battery_temp", None)
    if batt_temp is not None and float(batt_temp) > 40.0:
        symptoms.append("elevated_battery_temp")
        conditions_met += 1

    # Symptom 3: Cell voltage imbalance
    cell_delta = getattr(packet, "hv_cell_voltage_delta", None)
    if cell_delta is not None and float(cell_delta) > 0.2:
        symptoms.append("cell_imbalance")
        conditions_met += 1

    # Symptom 4: Range extender running while SOC not critically low
    re_runtime = getattr(packet, "range_extender_runtime", None)
    if re_runtime is not None and float(re_runtime) > 600 and soc > 10.0:
        symptoms.append("early_range_extender")
        conditions_met += 1

    if conditions_met < 2:
        return None

    # Confidence: 2 symptoms → 45, 3 → 60, 4 → 80
    confidence = 30.0 + conditions_met * 15.0

    # Severity boost for cell imbalance (strongest degradation signal)
    if "cell_imbalance" in symptoms:
        confidence += 10.0

    return _make_result(
        name="phev_battery_degradation",
        display="Признаки деградации ВВБ (PHEV/BEV)",
        tier="T1",
        confidence=confidence,
        conditions_met=conditions_met,
        conditions_total=conditions_total,
        details={
            "soc_pct": soc,
            "symptoms": symptoms,
            "battery_temp": float(batt_temp) if batt_temp is not None else None,
            "cell_delta_v": float(cell_delta) if cell_delta is not None else None,
        },
        dtc_codes=["P0A80", "P0A09"],
    )


# ---------------------------------------------------------------------------
# Rule 7: Combined Drivetrain Stress (T1+T2)
# ---------------------------------------------------------------------------

def rule_combined_drivetrain_stress(
    features: Dict[str, Any],
    packet: Any,
    baselines: Any,
    regime: Any,
) -> Optional[Dict[str, Any]]:
    """Detects drivetrain stress by combining engine, vibration, and audio signals.

    Cross-correlates:
    - High RPM with low speed → possible clutch/torque converter slip
    - Elevated vibration z-score at speed → drivetrain resonance
    - Low-frequency audio anomaly (< 100 Hz) → mechanical rumble
    - Fuel trim instability → load-induced mixture issues

    At least 2 of 4 signals must be present.
    This rule catches drivetrain problems that no single-tier rule can detect.
    """
    conditions_met = 0
    conditions_total = 4
    stress_signals: List[str] = []

    # Signal 1: RPM/speed mismatch (high RPM, low speed = slip)
    rpm = getattr(packet, "rpm", None)
    speed = getattr(packet, "speed", None)
    rpm_speed_ratio = None
    if rpm is not None and speed is not None:
        rpm_val = float(rpm)
        speed_val = float(speed)
        if speed_val > 10.0 and rpm_val > 2500.0:
            rpm_speed_ratio = rpm_val / speed_val
            if rpm_speed_ratio > 80.0:  # Abnormally high ratio
                stress_signals.append("rpm_speed_mismatch")
                conditions_met += 1

    # Signal 2: Vibration anomaly
    az_std_val = features.get("az_std")
    if az_std_val is None:
        az_std_val = getattr(packet, "az_std", None)

    vib_z = 0.0
    if az_std_val is not None:
        regime_key = _regime_key(regime)
        bl = baselines.get(regime_key, "az_std")
        if bl.count >= 30:
            vib_z = bl.z_score(float(az_std_val))
            if vib_z > 2.0:
                stress_signals.append("vibration_elevated")
                conditions_met += 1

    # Signal 3: Low-frequency audio anomaly
    dominant_freq = getattr(packet, "dominant_freq", None)
    dominant_amp = getattr(packet, "dominant_amp", None)
    if dominant_freq is not None and dominant_amp is not None:
        freq = float(dominant_freq)
        if 20.0 < freq < 100.0:
            # Check amplitude z-score
            regime_key = _regime_key(regime)
            bl_amp = baselines.get(regime_key, "dominant_amp")
            if bl_amp.count >= 30:
                amp_z = bl_amp.z_score(float(dominant_amp))
                if amp_z > 2.0:
                    stress_signals.append("low_freq_rumble")
                    conditions_met += 1

    # Signal 4: Fuel trim instability under load
    ltft_abs = features.get("ltft_abs")
    stft_val = getattr(packet, "stft_bank1", None)
    if ltft_abs is not None and stft_val is not None:
        ltft_abs_val = float(ltft_abs)
        stft_abs_val = abs(float(stft_val))
        if ltft_abs_val > 8.0 and stft_abs_val > 5.0:
            stress_signals.append("fuel_trim_instability")
            conditions_met += 1

    if conditions_met < 2:
        return None

    # Confidence: 2 → 45, 3 → 60, 4 → 80
    confidence = 25.0 + conditions_met * 15.0

    # Extra boost if both vibration and audio match (strong physical signal)
    if "vibration_elevated" in stress_signals and "low_freq_rumble" in stress_signals:
        confidence += 10.0

    return _make_result(
        name="combined_drivetrain_stress",
        display="Комплексная нагрузка на трансмиссию",
        tier="T1",
        confidence=confidence,
        conditions_met=conditions_met,
        conditions_total=conditions_total,
        details={
            "stress_signals": stress_signals,
            "rpm_speed_ratio": round(rpm_speed_ratio, 1) if rpm_speed_ratio else None,
            "vibration_z": round(vib_z, 2),
        },
    )


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

ALL_RULES = [
    rule_fuel_bank_cross,
    rule_vibration_regime_dependency,
    rule_audio_engine_harmonic,
    rule_warmup_anomaly,
    rule_speed_vibration_resonance,
    rule_phev_battery_degradation,
    rule_combined_drivetrain_stress,
]
