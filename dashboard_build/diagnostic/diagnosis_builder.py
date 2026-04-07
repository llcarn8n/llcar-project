"""DiagnosisBuilder — assembles a 7-block diagnostic report from pipeline,
rule engine, fuel-trim, and baseline data.

Report blocks:
  1. can_drive:     safe / caution / stop
  2. health_scores: overall, suspension, engine, electrical, audio (0-100)
  3. health_trends: placeholder → / ↑ / ↓
  4. diagnoses:     list of structured diagnosis entries
  5. fuel_loss:     monthly_rub / yearly_rub
  6. recalls:       placeholder (empty list)
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
    # engine
    "engine_overheating": "engine",
    "fuel_lean": "engine",
    "fuel_rich": "engine",
    "high_idle": "engine",
    "misfire": "engine",
    "catalyst_degradation": "engine",
    "engine_mount_wear": "engine",
    # electrical
    "alternator_failure": "electrical",
    "low_battery": "electrical",
    "coolant_sensor": "electrical",
    # audio
    "exhaust_leak": "audio",
    "bearing_wear": "audio",
}

# System weights for overall score calculation
_SYSTEM_WEIGHTS: Dict[str, float] = {
    "engine": 0.40,
    "suspension": 0.25,
    "electrical": 0.20,
    "audio": 0.15,
}

_ALL_SYSTEMS = ("suspension", "engine", "electrical", "audio")

# Severity → can_drive mapping (worst wins)
_SEVERITY_TO_DRIVE: Dict[str, str] = {
    "danger": "stop",
    "critical": "caution",
    "warning": "caution",
    "ok": "safe",
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
    ) -> Dict[str, Any]:
        """Build the full 7-block diagnostic report.

        Args:
            pipeline_result: Dict from DiagnosticPipeline.process().
            rule_results:    List of dicts from RuleEngine.run_all().
            fuel_trim_result: Optional FuelTrimResult from FuelTrimAnalyzer.
            baseline_store:  Optional BaselineStore for confidence/readiness.

        Returns:
            Dict with keys: can_drive, health_scores, health_trends,
            diagnoses, fuel_loss, recalls, next_steps, confidence,
            baseline_status, rule_version.
        """
        facts: List[Fact] = pipeline_result.get("facts", [])
        regime: str = pipeline_result.get("regime", "idle")

        # Block 1: can_drive
        can_drive = self._compute_can_drive(facts)

        # Block 2: health_scores
        health_scores = self._compute_health_scores(rule_results)

        # Block 3: health_trends (placeholder)
        health_trends = self._compute_health_trends()

        # Block 4: diagnoses
        diagnoses = self._build_diagnoses(pipeline_result, rule_results)

        # Block 5: fuel_loss
        fuel_loss = self._compute_fuel_loss(fuel_trim_result)

        # Block 6: recalls (placeholder)
        recalls: List[Any] = []

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

    @staticmethod
    def _compute_health_scores(rule_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute per-system and overall health scores.

        For each system, find rules that fired (confidence > 0).
        System score = 100 - average(confidence of fired rules).
        If no rules fired → 100.
        Overall = weighted average of system scores.
        """
        # Collect fired confidence per system
        system_confidences: Dict[str, List[float]] = {s: [] for s in _ALL_SYSTEMS}

        for rr in rule_results:
            system = _RULE_TO_SYSTEM.get(rr["name"])
            if system is None:
                continue
            # Intentionally includes all confidence > 0, not just >= min_confidence.
            # Health score is a lower-level signal: even sub-threshold anomalies
            # should depress it slightly. Diagnosis list uses min_confidence filter.
            if rr["confidence"] > 0:
                system_confidences[system].append(rr["confidence"])

        # Compute per-system scores
        scores: Dict[str, Any] = {}
        for system in _ALL_SYSTEMS:
            confs = system_confidences[system]
            if confs:
                avg_conf = sum(confs) / len(confs)
                scores[system] = round(max(0, 100 - avg_conf))
            else:
                scores[system] = 100

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
    def _compute_health_trends() -> Dict[str, str]:
        """Placeholder: all systems stable. Will use CUSUM in Plan 3."""
        return {system: "→" for system in _ALL_SYSTEMS}

    # ------------------------------------------------------------------
    # Block 4: diagnoses
    # ------------------------------------------------------------------

    def _build_diagnoses(
        self,
        pipeline_result: Dict[str, Any],
        rule_results: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Build the diagnoses list from fired rules.

        Only includes rules where confidence >= the rule's min_confidence.
        Each diagnosis is enriched with KB data if available.
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

            diagnosis: Dict[str, Any] = {
                "rule_name": rr["name"],
                "display": rr["display"],
                "status": rr["status"],
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
          3. Fallback to empty dict.
        """
        # Try DTC codes first
        dtc_codes = rule_result.get("dtc_codes", [])
        for code in dtc_codes:
            situations = self._kb.find_situations_by_dtc(code, brand=brand)
            if situations:
                return situations[0]

        # TODO Plan 3: add KnowledgeBase.find_situation_by_id() and use
        # rule_result.get("situation_id") here for rules without DTC codes.
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
                explanation = diag.get("explanation", "")
                step = f"{diag['display']}: {explanation}" if explanation else diag["display"]
                steps.append(step)
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
