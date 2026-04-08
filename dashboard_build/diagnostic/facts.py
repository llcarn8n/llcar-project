"""Typed Facts — structured diagnostic observations produced by FactGenerator.

Pipeline position: NormalizedPacket + features → FactGenerator → List[Fact]

Each Fact has a type (FactType enum), severity, confidence, and context.
FactGenerator applies deterministic rules to produce facts from a single
telemetry packet + its extracted features.

Current rules:
  - DTC_ACTIVE:        one fact per active DTC code, severity from KB
  - MULTI_DTC_PATTERN: if 2+ codes match a known pattern in KB
  - OVERHEAT:          coolant_temp > 105 → danger
  - LOW_VOLTAGE:       voltage < 13.0 AND rpm > 1000 → warning
  - LTFT_SEVERITY:     fuel-trim corrected abs through severity table
  - VIBRATION_ANOMALY: z-score > 2.0 on vibration features vs baseline
  - AUDIO_ANOMALY:     z-score > 2.0 on audio features vs baseline
  - CUSUM_ALARM:       CUSUM trend detector shows degradation ("↓")
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from .knowledge_base import KnowledgeBase
from .normalizer import NormalizedPacket
from .vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# FactType enum
# ---------------------------------------------------------------------------

class FactType(Enum):
    """All recognized diagnostic fact types."""
    DTC_ACTIVE = "dtc_active"
    LTFT_SEVERITY = "ltft_severity"
    OVERHEAT = "overheat"
    LOW_VOLTAGE = "low_voltage"
    VIBRATION_ANOMALY = "vibration_anomaly"
    AUDIO_ANOMALY = "audio_anomaly"
    THRESHOLD_BREACH = "threshold_breach"
    CUSUM_ALARM = "cusum_alarm"
    BASELINE_DRIFT = "baseline_drift"
    LTFT_TREND = "ltft_trend"
    DEGRADATION = "degradation"
    VIBRATION_RPM_CORRELATION = "vibration_rpm_correlation"
    AUDIO_WHEEL_CORRELATION = "audio_wheel_correlation"
    MULTI_DTC_PATTERN = "multi_dtc_pattern"


# ---------------------------------------------------------------------------
# Fact dataclass
# ---------------------------------------------------------------------------

@dataclass
class Fact:
    """A single diagnostic observation."""
    type: FactType
    timestamp: float
    value: float = 0.0
    severity: str = "ok"
    confidence: float = 1.0
    context: Dict[str, Any] = field(default_factory=dict)
    source_tier: str = "T1"
    details: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# FactGenerator
# ---------------------------------------------------------------------------

class FactGenerator:
    """Produces typed facts from a normalized packet and its features.

    Args:
        vehicle_profile: Vehicle identity and correction factors.
        knowledge_base:  DTC/situation resolver.
    """

    def __init__(
        self,
        vehicle_profile: VehicleProfile,
        knowledge_base: KnowledgeBase,
    ) -> None:
        self._profile = vehicle_profile
        self._kb = knowledge_base

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        packet: NormalizedPacket,
        features: Dict[str, Optional[Union[float, bool, str, int]]],
        baselines: Optional[Any] = None,
        health_trends: Optional[Dict[str, str]] = None,
    ) -> List[Fact]:
        """Generate all applicable facts for the given packet + features.

        Args:
            packet: Normalized telemetry packet.
            features: Extracted feature dict from feature_extractor.
            baselines: Optional BaselineStore for z-score anomaly detection.
            health_trends: Optional dict of system→trend from CUSUM detector
                           (e.g. {"engine": "↓", "suspension": "→"}).

        Returns a list of Fact objects (may be empty).
        """
        now = time.time()
        facts: List[Fact] = []

        # Original 4 fact types
        facts.extend(self._dtc_facts(packet, now))
        facts.extend(self._multi_dtc_facts(packet, now))
        facts.extend(self._overheat_facts(packet, now))
        facts.extend(self._low_voltage_facts(packet, now))

        # New fact types
        facts.extend(self._ltft_severity_facts(packet, now))
        facts.extend(self._zscore_anomaly_facts(packet, features, baselines, now))
        facts.extend(self._cusum_facts(health_trends, now))

        return facts

    # ------------------------------------------------------------------
    # DTC facts
    # ------------------------------------------------------------------

    def _dtc_facts(self, packet: NormalizedPacket, ts: float) -> List[Fact]:
        """One DTC_ACTIVE fact per active DTC code."""
        facts: List[Fact] = []
        brand = self._profile.brand

        for code in packet.dtc_codes:
            resolved = self._kb.resolve_dtc(code, brand=brand)
            if resolved is not None:
                severity = resolved.get("severity", "warning")
            else:
                # Unknown DTC — default to warning
                severity = "warning"

            facts.append(Fact(
                type=FactType.DTC_ACTIVE,
                timestamp=ts,
                value=1.0,
                severity=severity,
                confidence=1.0,
                context={"regime": packet.regime.value},
                source_tier=packet.tier,
                details={
                    "dtc_code": code,
                    "resolved": resolved is not None,
                    "title_ru": resolved.get("title_ru", "") if resolved else "",
                    "system_id": resolved.get("system_id", "") if resolved else "",
                },
            ))

        return facts

    # ------------------------------------------------------------------
    # Multi-DTC pattern
    # ------------------------------------------------------------------

    def _multi_dtc_facts(self, packet: NormalizedPacket, ts: float) -> List[Fact]:
        """MULTI_DTC_PATTERN if 2+ codes match a known pattern."""
        if len(packet.dtc_codes) < 2:
            return []

        match = self._kb.match_dtc_pattern(packet.dtc_codes)
        if match is None:
            return []

        return [Fact(
            type=FactType.MULTI_DTC_PATTERN,
            timestamp=ts,
            value=float(match["boost"]),
            severity="warning",
            confidence=min(1.0, 0.7 + match["boost"] / 100.0),
            context={"dtc_codes": list(packet.dtc_codes)},
            source_tier=packet.tier,
            details={
                "situation_id": match["situation_id"],
                "boost": match["boost"],
                "code_count": len(packet.dtc_codes),
            },
        )]

    # ------------------------------------------------------------------
    # Overheat
    # ------------------------------------------------------------------

    def _overheat_facts(self, packet: NormalizedPacket, ts: float) -> List[Fact]:
        """OVERHEAT if coolant_temp > 105."""
        if packet.coolant_temp is None or packet.coolant_temp <= 105:
            return []

        return [Fact(
            type=FactType.OVERHEAT,
            timestamp=ts,
            value=packet.coolant_temp,
            severity="danger",
            confidence=1.0,
            context={"rpm": packet.rpm, "speed": packet.speed},
            source_tier=packet.tier,
            details={"threshold": 105},
        )]

    # ------------------------------------------------------------------
    # Low voltage
    # ------------------------------------------------------------------

    def _low_voltage_facts(self, packet: NormalizedPacket, ts: float) -> List[Fact]:
        """LOW_VOLTAGE if voltage < 13.0 AND rpm > 1000."""
        if packet.voltage is None or packet.rpm is None:
            return []
        if packet.voltage >= 13.0 or packet.rpm <= 1000:
            return []

        return [Fact(
            type=FactType.LOW_VOLTAGE,
            timestamp=ts,
            value=packet.voltage,
            severity="warning",
            confidence=0.9,
            context={"rpm": packet.rpm, "speed": packet.speed},
            source_tier=packet.tier,
            details={"threshold_voltage": 13.0, "threshold_rpm": 1000},
        )]

    # ------------------------------------------------------------------
    # LTFT severity
    # ------------------------------------------------------------------

    # Severity table: (lo_inclusive, hi_exclusive, severity, level_name)
    _LTFT_SEVERITY_TABLE = [
        (0,   3,   "normal",     "normal_low"),
        (3,   5,   "normal",     "normal_high"),
        (5,   7,   "borderline", "borderline"),
        (7,  10,   "elevated",   "elevated"),
        (10,  15,  "problem",    "problem"),
        (15,  25,  "defect",     "defect"),
        (25,  37,  "critical",   "critical"),
        (37, 999,  "danger",     "danger"),
    ]

    def _ltft_severity_facts(self, packet: NormalizedPacket, ts: float) -> List[Fact]:
        """LTFT_SEVERITY — run LTFT through severity table inline.

        Uses the vehicle profile's ltft_base_offset and ltft_tolerance_mult
        to correct the raw LTFT value before severity lookup.
        """
        if packet.ltft_bank1 is None:
            return []

        ltft = packet.ltft_bank1
        offset = self._profile.ltft_base_offset
        mult = self._profile.ltft_tolerance_mult

        corrected = (ltft - offset) / mult
        corrected_abs = abs(corrected)

        # Winter correction: if ambient_temp < -15, reduce abs by 4
        ambient = packet.engine_context.ambient_temp
        winter_applied = False
        if ambient is not None and ambient < -15.0:
            corrected_abs = max(0.0, corrected_abs - 4.0)
            winter_applied = True

        # Severity lookup
        severity = "normal"
        level_name = "normal_low"
        for lo, hi, sev, lvl in self._LTFT_SEVERITY_TABLE:
            if lo <= corrected_abs < hi:
                severity = sev
                level_name = lvl
                break

        return [Fact(
            type=FactType.LTFT_SEVERITY,
            timestamp=ts,
            value=corrected_abs,
            severity=severity,
            confidence=1.0,
            context={"regime": packet.regime.value},
            source_tier=packet.tier,
            details={
                "raw_ltft": ltft,
                "corrected_ltft": corrected,
                "corrected_abs": corrected_abs,
                "level_name": level_name,
                "offset_applied": offset,
                "mult_applied": mult,
                "winter_correction": winter_applied,
            },
        )]

    # ------------------------------------------------------------------
    # Z-score anomaly facts (vibration + audio)
    # ------------------------------------------------------------------

    # Vibration features to check — maps feature key to packet attr or features key
    _VIBRATION_ZSCORE_FEATURES = ("az_std", "total_vibration")
    _AUDIO_ZSCORE_FEATURES = ("dominant_freq", "dominant_amp")

    def _zscore_anomaly_facts(
        self,
        packet: NormalizedPacket,
        features: Dict[str, Optional[Union[float, bool, str, int]]],
        baselines: Optional[Any],
        ts: float,
    ) -> List[Fact]:
        """VIBRATION_ANOMALY / AUDIO_ANOMALY — produce anomaly fact when |z-score| > 2.0.

        For each key feature, if the baseline is ready (enough samples) and the
        current z-score exceeds the threshold, produce a typed anomaly fact.
        """
        if baselines is None:
            return []

        facts: List[Fact] = []
        regime = packet.regime

        # Check if baseline is ready for this regime
        if not baselines.is_ready(regime):
            return []

        # Vibration features
        for feat_key in self._VIBRATION_ZSCORE_FEATURES:
            value = self._resolve_feature_value(packet, features, feat_key)
            if value is None:
                continue

            bl = baselines.get(regime, feat_key)
            z = bl.z_score(value)
            if abs(z) > 2.0:
                facts.append(Fact(
                    type=FactType.VIBRATION_ANOMALY,
                    timestamp=ts,
                    value=value,
                    severity="warning" if abs(z) < 3.0 else "urgent",
                    confidence=min(1.0, baselines.confidence(regime)),
                    context={"regime": regime.value, "feature": feat_key},
                    source_tier=packet.tier,
                    details={
                        "feature": feat_key,
                        "z_score": round(z, 3),
                        "baseline_mean": round(bl.mean, 4),
                        "baseline_std": round(bl.std, 4),
                        "baseline_count": bl.count,
                    },
                ))

        # Audio features
        for feat_key in self._AUDIO_ZSCORE_FEATURES:
            value = self._resolve_feature_value(packet, features, feat_key)
            if value is None:
                continue

            bl = baselines.get(regime, feat_key)
            z = bl.z_score(value)
            if abs(z) > 2.0:
                facts.append(Fact(
                    type=FactType.AUDIO_ANOMALY,
                    timestamp=ts,
                    value=value,
                    severity="warning" if abs(z) < 3.0 else "urgent",
                    confidence=min(1.0, baselines.confidence(regime)),
                    context={"regime": regime.value, "feature": feat_key},
                    source_tier=packet.tier,
                    details={
                        "feature": feat_key,
                        "z_score": round(z, 3),
                        "baseline_mean": round(bl.mean, 4),
                        "baseline_std": round(bl.std, 4),
                        "baseline_count": bl.count,
                    },
                ))

        return facts

    @staticmethod
    def _resolve_feature_value(
        packet: NormalizedPacket,
        features: Dict[str, Optional[Union[float, bool, str, int]]],
        key: str,
    ) -> Optional[float]:
        """Resolve a feature value from the packet first, then features dict."""
        # Try packet attribute (e.g. az_std, dominant_freq)
        val = getattr(packet, key, None)
        if val is not None:
            return float(val)
        # Fall back to features dict (e.g. total_vibration)
        val = features.get(key)
        if val is not None and isinstance(val, (int, float)):
            return float(val)
        return None

    # ------------------------------------------------------------------
    # CUSUM alarm facts
    # ------------------------------------------------------------------

    def _cusum_facts(
        self,
        health_trends: Optional[Dict[str, str]],
        ts: float,
    ) -> List[Fact]:
        """CUSUM_ALARM — if any system's CUSUM trend is "↓" (degrading), produce a fact."""
        if health_trends is None:
            return []

        facts: List[Fact] = []
        for system, trend in health_trends.items():
            if trend == "\u2193":  # "↓"
                facts.append(Fact(
                    type=FactType.CUSUM_ALARM,
                    timestamp=ts,
                    value=1.0,
                    severity="warning",
                    confidence=0.85,
                    context={"system": system, "trend": trend},
                    source_tier="T1",
                    details={
                        "system": system,
                        "trend_direction": "degrading",
                    },
                ))

        return facts
