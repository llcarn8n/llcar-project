"""DiagnosisBuilder — assembles a 7-block diagnostic report from pipeline,
rule engine, fuel-trim, and baseline data.

Report blocks:
  1. can_drive:     safe / caution / stop
  2. health_scores: overall, suspension, engine, electrical, audio (0-100)
  3. health_trends: placeholder → / ↑ / ↓
  4. diagnoses:     list of structured diagnosis entries
  5. fuel_loss:     monthly_rub / yearly_rub
  6. escalations:   persistence/escalation info from EscalationManager
  6b. recalls:      placeholder (empty list)
  7. next_steps:    prioritized recommendations

Plus meta: confidence, baseline_status, rule_version.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .baseline_store import BaselineStore, GOOD_BASELINE_SAMPLES, MIN_BASELINE_SAMPLES, KEY_FEATURES
from .facts import Fact
from .fuel_trim_analyzer import FuelTrimResult
from .knowledge_base import KnowledgeBase
from .vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Rule → system mapping
# ---------------------------------------------------------------------------

_RULE_TO_SYSTEM: Dict[str, str] = {
    # suspension
    "worn_suspension": "suspension",
    "wheel_imbalance": "suspension",
    "harsh_road_surface": "suspension",
    "front_suspension_worn": "suspension",
    "lateral_instability": "suspension",
    "shock_absorber_worn": "suspension",
    "stabilizer_link_worn": "suspension",
    "high_crest_vertical": "suspension",
    "vibration_at_speed": "suspension",
    "idle_vibration_high": "suspension",
    "suspension_rattle": "suspension",
    "rough_road_impact": "suspension",
    "tire_flat_vibration": "suspension",
    "axle_vibration": "suspension",
    "cv_joint_click": "suspension",
    "brake_vibration": "suspension",
    "vibration_with_dtc": "suspension",
    # engine
    "engine_overheating": "engine",
    "fuel_lean": "engine",
    "fuel_rich": "engine",
    "high_idle": "engine",
    "misfire": "engine",
    "catalyst_degradation": "engine",
    "engine_mount_wear": "engine",
    "engine_overrev": "engine",
    "stalling_risk": "engine",
    "high_rpm_idle": "engine",
    "low_rpm_idle": "engine",
    "coolant_overtemp_warning": "engine",
    "cold_engine_driving": "engine",
    "intake_vacuum_low": "engine",
    "intake_vacuum_high": "engine",
    "maf_reading_low": "engine",
    "maf_reading_high": "engine",
    "fuel_lean_bank2": "engine",
    "fuel_rich_bank2": "engine",
    "stft_high_oscillation": "engine",
    "fuel_system_lean_idle": "engine",
    "fuel_system_rich_idle": "engine",
    "o2_sensor_stuck_lean": "engine",
    "o2_sensor_stuck_rich": "engine",
    "oil_pressure_low": "engine",
    "idle_speed_oscillation": "engine",
    "thermostat_stuck_open": "engine",
    "thermostat_stuck_closed": "engine",
    "egr_malfunction": "engine",
    "excessive_fuel_consumption": "engine",
    "vacuum_leak": "engine",
    "injector_imbalance": "engine",
    "catalytic_overtemp": "engine",
    "engine_load_high": "engine",
    "throttle_stuck": "engine",
    "p0171_lean_boost": "engine",
    "p0300_misfire_boost": "engine",
    "p0420_catalyst_boost": "engine",
    "p0442_evap_leak": "engine",
    "winter_cold_start_anomaly": "engine",
    "summer_overheat_risk": "engine",
    "warmup_too_slow": "engine",
    "idle_rpm_instability": "engine",
    "turbo_lag_excessive": "engine",
    "oil_pressure_warning": "engine",
    "transmission_slip": "engine",
    "ac_compressor_overload": "engine",
    "catalytic_light_off_slow": "engine",
    "combined_drivetrain_stress": "engine",
    # electrical
    "alternator_failure": "electrical",
    "low_battery": "electrical",
    "coolant_sensor": "electrical",
    "charging_high": "electrical",
    "voltage_drop_idle": "electrical",
    "battery_deep_discharge": "electrical",
    "charging_intermittent": "electrical",
    # electrical — PHEV/BEV
    "battery_temp_high": "electrical",
    "soc_critical": "electrical",
    "range_extender_overwork": "electrical",
    "motor_overheat": "electrical",
    "battery_soc_low": "electrical",
    "e_motor_temp_high": "electrical",
    "charging_anomaly": "electrical",
    "regen_brake_weak": "electrical",
    "hv_battery_imbalance": "electrical",
    "inverter_overtemp": "electrical",
    "phev_battery_degradation": "electrical",
    # audio
    "exhaust_leak": "audio",
    "bearing_wear": "audio",
    "belt_squeal": "audio",
    "turbo_whistle": "audio",
    "brake_squeal": "audio",
    "intake_noise": "audio",
    "valve_train_noise": "audio",
    "knock_detonation": "audio",
    "wind_noise": "audio",
    "rumble_low_freq": "audio",
    "whistle_high_freq": "audio",
    "power_steering_noise": "audio",
    "drivetrain_vibration": "audio",
    "compressor_noise": "audio",
    "fuel_pump_noise": "audio",
    "starter_grinding": "audio",
    "loose_heat_shield": "audio",
    "water_pump_noise": "audio",
    "timing_chain_rattle": "audio",
    "audio_speed_correlation": "audio",
    "brake_pad_wear": "audio",
    # complex rules
    "fuel_bank_cross": "engine",
    "vibration_regime_dependency": "suspension",
    "audio_engine_harmonic": "audio",
    "warmup_anomaly": "engine",
    "speed_vibration_resonance": "suspension",
}

# System weights for overall score calculation
_SYSTEM_WEIGHTS: Dict[str, float] = {
    "engine": 0.40,
    "suspension": 0.25,
    "electrical": 0.20,
    "audio": 0.15,
}

_ALL_SYSTEMS = ("suspension", "engine", "electrical", "audio")

# Severity weights — how much each severity level penalises health
SEVERITY_WEIGHTS: Dict[str, float] = {
    "info": 0.5,
    "low": 1.0,
    "medium": 2.0,
    "high": 3.0,
    "critical": 5.0,
}

# Rule → severity mapping (rules without an entry default to "medium")
_RULE_SEVERITY: Dict[str, str] = {
    # suspension
    "worn_suspension": "medium",
    "wheel_imbalance": "low",
    # engine
    "engine_overheating": "critical",
    "fuel_lean": "medium",
    "fuel_rich": "medium",
    "high_idle": "low",
    "misfire": "high",
    "catalyst_degradation": "high",
    "engine_mount_wear": "medium",
    # electrical
    "alternator_failure": "high",
    "low_battery": "medium",
    "coolant_sensor": "medium",
    # audio
    "exhaust_leak": "medium",
    "bearing_wear": "high",
}

# Severity → can_drive mapping (worst wins)
_SEVERITY_TO_DRIVE: Dict[str, str] = {
    "danger": "stop",
    "critical": "caution",
    "warning": "caution",
    "ok": "safe",
    "normal": "safe",
    "borderline": "safe",
    "elevated": "caution",
    "problem": "caution",
    "defect": "stop",
    "info": "safe",
}

# Priority order for can_drive: stop > caution > safe
_DRIVE_PRIORITY: Dict[str, int] = {
    "safe": 0,
    "caution": 1,
    "stop": 2,
}


# ---------------------------------------------------------------------------
# DiagnosisBuilder
# ---------------------------------------------------------------------------


class DiagnosisBuilder:
    """Assembles a 7-block diagnostic report.

    Args:
        knowledge_base: KnowledgeBase for looking up situation details.
        vehicle_profile: VehicleProfile for brand/model context.
    """

    def __init__(
        self,
        knowledge_base: KnowledgeBase,
        vehicle_profile: VehicleProfile,
    ) -> None:
        self._kb = knowledge_base
        self._profile = vehicle_profile

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build_report(
        self,
        pipeline_result: Dict[str, Any],
        rule_results: List[Dict[str, Any]],
        fuel_trim_result: Optional[FuelTrimResult] = None,
        baseline_store: Optional[BaselineStore] = None,
        escalation_manager: Optional[Any] = None,
        history: Optional[List[Dict[str, Any]]] = None,
        recalls_data: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Build the full 7-block diagnostic report.

        Args:
            pipeline_result: Dict from DiagnosticPipeline.process().
            rule_results:    List of dicts from RuleEngine.run_all().
            fuel_trim_result: Optional FuelTrimResult from FuelTrimAnalyzer.
            baseline_store:  Optional BaselineStore for confidence/readiness.
            escalation_manager: Optional EscalationManager for persistence/escalation info.
            history: Optional list of score dicts for CUSUM trend detection.
            recalls_data: Optional list of recall dicts from RecallsChecker.check().

        Returns:
            Dict with keys: can_drive, health_scores, health_trends,
            diagnoses, fuel_loss, escalations, recalls, next_steps, confidence,
            baseline_status, rule_version.
        """
        facts: List[Fact] = pipeline_result.get("facts", [])
        regime: str = pipeline_result.get("regime", "idle")

        # Block 1: can_drive
        can_drive = self._compute_can_drive(facts)

        # Block 2: health_scores
        health_scores = self._compute_health_scores(rule_results, escalation_manager)

        # Block 3: health_trends (CUSUM-based)
        health_trends = self._compute_health_trends(history)

        # Block 4: diagnoses (pass escalation_manager for GAP-R4 consecutive check)
        diagnoses = self._build_diagnoses(
            pipeline_result, rule_results, escalation_manager,
        )

        # Block 5: fuel_loss
        fuel_loss = self._compute_fuel_loss(fuel_trim_result)

        # Block 6: escalations
        escalations = self._compute_escalations(rule_results, escalation_manager)

        # Block 6b: recalls
        recalls = recalls_data if recalls_data is not None else []

        # Block 7: next_steps
        next_steps = self._build_next_steps(diagnoses)

        # Meta fields
        confidence = self._compute_confidence(baseline_store, regime)
        baseline_status = self._compute_baseline_status(baseline_store, regime)

        return {
            "can_drive": can_drive,
            "health_scores": health_scores,
            "health_trends": health_trends,
            "diagnoses": diagnoses,
            "fuel_loss": fuel_loss,
            "escalations": escalations,
            "recalls": recalls,
            "next_steps": next_steps,
            "confidence": confidence,
            "baseline_status": baseline_status,
            "rule_version": "v1",
        }

    # ------------------------------------------------------------------
    # Block 1: can_drive
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_can_drive(facts: List[Fact]) -> str:
        """Determine can_drive from the worst fact severity.

        Mapping: danger→stop, critical→caution, warning→caution, ok→safe.
        If no facts, defaults to safe.
        """
        worst = "safe"
        worst_priority = _DRIVE_PRIORITY[worst]

        for fact in facts:
            # Unknown severity defaults to caution (safety-first in car diagnostics)
            drive_status = _SEVERITY_TO_DRIVE.get(fact.severity, "caution")
            priority = _DRIVE_PRIORITY.get(drive_status, 0)
            if priority > worst_priority:
                worst = drive_status
                worst_priority = priority

        return worst

    # ------------------------------------------------------------------
    # Block 2: health_scores
    # ------------------------------------------------------------------

    def _compute_health_scores(
        self,
        rule_results: List[Dict[str, Any]],
        escalation_manager: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Compute per-system and overall health scores using weighted formula.

        For each fired rule (confidence > 0):
          - severity_weight  = SEVERITY_WEIGHTS[rule_severity]
          - confidence_factor = confidence / 100
          - persistence_factor = 1.0 + 0.1 * min(escalation_level, 3)
          - penalty += severity_weight * confidence_factor * persistence_factor

        System score = max(0, min(100, int(100 - penalty * 10)))
        Overall = weighted average of system scores using _SYSTEM_WEIGHTS.
        """
        # Collect per-rule penalties grouped by system
        system_rule_penalties: Dict[str, List[float]] = {s: [] for s in _ALL_SYSTEMS}

        for rr in rule_results:
            # Map rule to system; rules not in the mapping default to 'engine'
            system = _RULE_TO_SYSTEM.get(rr["name"], "engine")
            # Intentionally includes all confidence > 0, not just >= min_confidence.
            # Health score is a lower-level signal: even sub-threshold anomalies
            # should depress it slightly. Diagnosis list uses min_confidence filter.
            if rr["confidence"] <= 0:
                continue

            # Severity weight
            severity = _RULE_SEVERITY.get(rr["name"], "medium")
            severity_weight = SEVERITY_WEIGHTS.get(severity, SEVERITY_WEIGHTS["medium"])

            # Confidence factor (0..1)
            confidence_factor = rr["confidence"] / 100.0

            # Persistence factor from escalation manager
            persistence_factor = 1.0
            if escalation_manager is not None:
                try:
                    info = escalation_manager.get_escalation_info(
                        self._profile.client_hash, rr["name"]
                    )
                    if info is not None:
                        esc_level = info.get("level", 0)
                        persistence_factor = 1.0 + 0.1 * min(esc_level, 3)
                except Exception:
                    pass  # Graceful degradation — ignore escalation errors

            rule_penalty = severity_weight * confidence_factor * persistence_factor
            system_rule_penalties[system].append(rule_penalty)

        # Compute per-system scores using dominant-rule approach.
        # The worst rule carries full weight; remaining rules contribute 10%
        # each, preventing noise-stacking when many rules fire at low confidence.
        scores: Dict[str, Any] = {}
        for system in _ALL_SYSTEMS:
            penalties = system_rule_penalties[system]
            if not penalties:
                scores[system] = 100
                continue
            penalties_sorted = sorted(penalties, reverse=True)
            effective = penalties_sorted[0] + sum(penalties_sorted[1:]) * 0.1
            scores[system] = max(0, min(100, int(100 - effective * 10)))

        # Overall = weighted average
        overall = 0.0
        for system, weight in _SYSTEM_WEIGHTS.items():
            overall += scores[system] * weight
        scores["overall"] = round(overall)

        return scores

    # ------------------------------------------------------------------
    # Block 3: health_trends (placeholder)
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_health_trends(history: list = None) -> Dict[str, str]:
        """Compute health trends using CUSUM on historical scores.

        If no history or too few data points, returns stable (→) for all.
        """
        if not history or len(history) < 5:
            return {s: "→" for s in _ALL_SYSTEMS}

        from .cusum import CUSUMDetector
        detector = CUSUMDetector()
        return detector.compute_all_trends(history)

    # ------------------------------------------------------------------
    # Block 4: diagnoses
    # ------------------------------------------------------------------

    # Minimum consecutive firings before a rule is shown as likely/possible.
    # Critical-severity rules bypass this requirement (shown immediately).
    _MIN_CONSECUTIVE_FIRINGS = 3
    _BYPASS_SEVERITIES = frozenset({"critical", "high"})

    def _build_diagnoses(
        self,
        pipeline_result: Dict[str, Any],
        rule_results: List[Dict[str, Any]],
        escalation_manager: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        """Build the diagnoses list from fired rules.

        Only includes rules where confidence >= the rule's min_confidence.
        Each diagnosis is enriched with KB data if available.

        GAP-R4: Rules that have fired fewer than _MIN_CONSECUTIVE_FIRINGS
        times are demoted to status='monitoring' (unless severity is
        critical/high). They still count toward health_scores but are not
        shown as actionable diagnoses to the user.
        """
        facts: List[Fact] = pipeline_result.get("facts", [])
        brand = self._profile.brand
        diagnoses: List[Dict[str, Any]] = []

        for rr in rule_results:
            min_conf = rr.get("min_confidence", 40)
            if rr["confidence"] < min_conf:
                continue

            # Try to get KB situation data
            kb_data = self._resolve_kb_data(rr, brand)

            # Collect evidence from facts matching this rule's tier
            evidence = self._collect_evidence(facts, rr)

            # Determine effective status (may be demoted to 'monitoring')
            effective_status = rr["status"]

            # GAP-R4: Require 3+ consecutive firings before displaying
            # as likely/possible. Critical/high severity rules bypass this.
            if escalation_manager is not None:
                severity = _RULE_SEVERITY.get(rr["name"], "medium")
                if severity not in self._BYPASS_SEVERITIES:
                    try:
                        info = escalation_manager.get_escalation_info(
                            self._profile.client_hash, rr["name"]
                        )
                        consecutive = 0
                        if info is not None:
                            consecutive = info.get("consecutive_count", 0)
                        if consecutive < self._MIN_CONSECUTIVE_FIRINGS:
                            effective_status = "monitoring"
                    except Exception:
                        pass  # Graceful degradation — keep original status

            diagnosis: Dict[str, Any] = {
                "rule_name": rr["name"],
                "display": rr["display"],
                "status": effective_status,
                "confidence": rr["confidence"],
                "explanation": kb_data.get("quickAnswer", f"Диагностика: {rr['display']}"),
                "evidence": evidence,
                "repair_roadmap": kb_data.get("solutions", []),
                "common_mistakes": kb_data.get("commonMistakes", []),
                "can_drive": kb_data.get("canDrive", "осторожно"),
                "price_range": kb_data.get("priceRange", ""),
                "situation_id": rr.get("situation_id"),
            }
            diagnoses.append(diagnosis)

        # Sort by confidence desc
        diagnoses.sort(key=lambda d: d["confidence"], reverse=True)

        return diagnoses

    def _resolve_kb_data(
        self,
        rule_result: Dict[str, Any],
        brand: str,
    ) -> Dict[str, Any]:
        """Try to resolve KB situation data for a rule result.

        Strategy:
          1. If rule has dtc_codes, try find_situations_by_dtc for each code.
          2. If rule has situation_id, use it directly.
          3. If rule has dtc_codes, try find_situations_by_dtc_range (SAE J2012).
          4. Fallback: search by category + keyword from rule name.
          5. Fallback to empty dict.
        """
        # Try DTC codes first (exact match)
        dtc_codes = rule_result.get("dtc_codes", [])
        for code in dtc_codes:
            situations = self._kb.find_situations_by_dtc(code, brand=brand)
            if situations:
                return situations[0]

        # Try situation_id lookup for rules without DTC codes
        situation_id = rule_result.get("situation_id")
        if situation_id:
            situation = self._kb.find_situation_by_id(situation_id, brand=brand)
            if situation is not None:
                return situation

        # Try DTC range classification (SAE J2012 fallback)
        for code in dtc_codes:
            situations = self._kb.find_situations_by_dtc_range(code, brand=brand)
            if situations:
                return situations[0]

        # Fallback: match by category + keywords from rule name/display
        rule_name = rule_result.get("name", "")
        display = rule_result.get("display", "")
        category = rule_result.get("tier", "").lower()

        # Map rule name prefixes to KB categories
        _CAT_MAP = {
            "engine": "engine", "overheating": "engine", "coolant": "engine",
            "fuel": "engine", "ltft": "engine", "stft": "engine",
            "misfire": "engine", "catalyst": "engine", "lambda": "engine",
            "suspension": "suspension", "worn": "suspension", "shock": "suspension",
            "spring": "suspension", "bearing": "suspension", "vibrat": "suspension",
            "electr": "electrical", "voltage": "electrical", "battery": "electrical",
            "alternator": "electrical", "starter": "electrical",
            "audio": "audio", "noise": "audio", "squeal": "audio",
            "knock": "audio", "rattle": "audio", "hum": "audio",
        }
        matched_cat = None
        search_term = rule_name.lower().replace("_", " ")
        for prefix, cat in _CAT_MAP.items():
            if prefix in search_term:
                matched_cat = cat
                break

        if matched_cat:
            try:
                cat_situations = self._kb.find_situations_by_category(
                    matched_cat, brand=brand,
                )
                # Find best match by keyword overlap with display name
                display_words = set(display.lower().split())
                best = None
                best_score = 0
                for s in cat_situations:
                    title = s.get("title", "").lower()
                    title_words = set(title.split())
                    score = len(display_words & title_words)
                    if score > best_score:
                        best_score = score
                        best = s
                if best and best_score > 0:
                    return best
                # No keyword match — return first situation in category
                if cat_situations:
                    return cat_situations[0]
            except Exception:
                pass

        return {}

    @staticmethod
    def _collect_evidence(
        facts: List[Fact],
        rule_result: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Collect relevant facts as evidence for a diagnosis.

        Filters facts matching the rule's tier.
        """
        tier = rule_result.get("tier", "T1")
        evidence: List[Dict[str, Any]] = []

        for fact in facts:
            if fact.source_tier == tier:
                evidence.append({
                    "type": fact.type.value,
                    "severity": fact.severity,
                    "value": fact.value,
                    "confidence": fact.confidence,
                    "details": fact.details,
                })

        return evidence

    # ------------------------------------------------------------------
    # Block 5: fuel_loss
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_fuel_loss(
        fuel_trim_result: Optional[FuelTrimResult],
    ) -> Optional[Dict[str, float]]:
        """Extract fuel loss from FuelTrimResult if severity is not NORMAL."""
        if fuel_trim_result is None:
            return None
        if fuel_trim_result.severity == "NORMAL":
            return None
        return {
            "monthly_rub": fuel_trim_result.monthly_loss_rub,
            "yearly_rub": fuel_trim_result.yearly_loss_rub,
        }

    # ------------------------------------------------------------------
    # Block 6: escalations
    # ------------------------------------------------------------------

    def _compute_escalations(
        self,
        rule_results: List[Dict[str, Any]],
        escalation_manager: Optional[Any],
    ) -> List[Dict[str, Any]]:
        """Build escalation info for fired rules.

        Returns list of escalation dicts sorted by level (urgent first).
        Returns empty list if no escalation_manager provided.
        """
        if escalation_manager is None:
            return []

        escalations: List[Dict[str, Any]] = []
        for rr in rule_results:
            if rr["confidence"] < rr.get("min_confidence", 40):
                continue
            try:
                info = escalation_manager.get_escalation_info(
                    self._profile.client_hash, rr["name"]
                )
                if info is not None and info.get("consecutive_count", 0) > 0:
                    escalations.append({
                        "rule_name": rr["name"],
                        "display": rr["display"],
                        **info,
                    })
            except Exception:
                pass  # Graceful degradation

        return sorted(escalations, key=lambda x: x.get("level", 0), reverse=True)

    # ------------------------------------------------------------------
    # Block 7: next_steps
    # ------------------------------------------------------------------

    @staticmethod
    def _build_next_steps(diagnoses: List[Dict[str, Any]]) -> List[str]:
        """Build prioritized recommendations from diagnoses.

        For each diagnosis with status likely/possible, add a recommendation.
        Sorted by confidence desc (diagnoses are already sorted).
        """
        steps: List[str] = []
        for diag in diagnoses:
            if diag["status"] in ("likely", "possible"):
                # Use repair roadmap first step if available, else can_drive advice
                roadmap = diag.get("repair_roadmap", [])
                can_drive = diag.get("can_drive", "")
                if roadmap:
                    steps.append(f"{diag['display']}: {roadmap[0]}")
                elif can_drive and can_drive != "осторожно":
                    steps.append(f"{diag['display']}: {can_drive}")
                else:
                    explanation = diag.get("explanation", "")
                    # Don't repeat display name in explanation
                    if explanation and diag["display"] not in explanation:
                        steps.append(f"{diag['display']}: {explanation}")
                    else:
                        steps.append(diag["display"])
        return steps

    # ------------------------------------------------------------------
    # Meta: confidence
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_confidence(
        baseline_store: Optional[BaselineStore],
        regime: str,
    ) -> float:
        """Diagnostic confidence based on baseline readiness."""
        if baseline_store is None:
            return 0.0
        return baseline_store.confidence(regime)

    # ------------------------------------------------------------------
    # Meta: baseline_status
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_baseline_status(
        baseline_store: Optional[BaselineStore],
        regime: str,
    ) -> Dict[str, Any]:
        """Build baseline status dict."""
        if baseline_store is None:
            return {
                "ready": False,
                "total_samples": 0,
                "samples_needed": MIN_BASELINE_SAMPLES,
            }

        ready = baseline_store.is_ready(regime)

        # Count total samples across key features for this regime
        total_samples = 0
        for feat in KEY_FEATURES:
            bl = baseline_store.baselines.get((regime, feat))
            if bl is not None:
                total_samples += bl.count

        # Samples needed: minimum required across all key features
        samples_needed = 0
        if not ready:
            for feat in KEY_FEATURES:
                bl = baseline_store.baselines.get((regime, feat))
                current = bl.count if bl is not None else 0
                remaining = max(0, MIN_BASELINE_SAMPLES - current)
                samples_needed += remaining

        return {
            "ready": ready,
            "total_samples": total_samples,
            "samples_needed": samples_needed,
        }
