"""RuleEngine — threshold-based diagnostic rule evaluation.

Pipeline position: Facts + Features + Baselines → RuleEngine → List[RuleResult]

The engine loads rules from JSON (threshold_rules.json) and evaluates each
rule against the current telemetry (features dict + NormalizedPacket fields).
Each rule produces a confidence score (0-100) and a status string.

Confidence scoring has 3 components:
  - match_score   (40%): fraction of conditions met, weighted
  - deviation_score (40%): how far beyond thresholds values are
  - persistence_score (0-20%): scales with consecutive firing count from
    EscalationManager.  count=0→0%, 1→4%, 3→12%, 5+→20%.
    Falls back to 4% when no escalation_manager is provided.

Status mapping:
  - confidence >= 70 → "likely"
  - confidence >= 40 → "possible"
  - confidence >  0  → "unlikely"
  - confidence == 0  → "clear"
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from .baseline_store import BaselineStore
from .normalizer import DrivingRegime, NormalizedPacket

# Type-only import to avoid circular dependency at runtime
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .escalation import EscalationManager

# ---------------------------------------------------------------------------
# Rule directory
# ---------------------------------------------------------------------------

_RULES_DIR = Path(__file__).parent / "rules"

# ---------------------------------------------------------------------------
# Persistence scoring
# ---------------------------------------------------------------------------

_PERSISTENCE_WEIGHT: float = 20.0
"""Maximum points from the persistence component."""

_PERSISTENCE_FALLBACK_RATIO: float = 0.2
"""Default ratio when no escalation_manager is available (backward compat)."""


def _persistence_ratio_from_count(consecutive_count: int) -> float:
    """Map consecutive firing count to persistence ratio (0.0 .. 1.0).

    Mapping:
      count=0 → 0.0  (never fired before, no bonus)
      count=1 → 0.2  (first occurrence, minimal bonus)
      count=2 → 0.4
      count=3 → 0.6
      count=4 → 0.8
      count>=5 → 1.0  (maximum persistence)
    """
    if consecutive_count <= 0:
        return 0.0
    return min(consecutive_count * 0.2, 1.0)

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class RuleCondition:
    """A single condition within a diagnostic rule.

    Attributes:
        fact_type:  Feature/field name to check (e.g. "az_std", "rpm").
        operator:   Comparison operator: '>', '<', '==', 'z>', 'between', 'in'.
        threshold:  Comparison value.  For 'between' → [lo, hi]; for 'in' → list.
        weight:     Relative importance of this condition (higher = more important).
        context:    Optional metadata dict.
    """
    fact_type: str
    operator: str
    threshold: Any
    weight: int = 1
    context: Optional[Dict[str, Any]] = None


@dataclass
class RuleContext:
    """Driving-context constraints that must be satisfied before a rule fires.

    All fields are optional; only specified fields are checked.

    Attributes:
        regimes:      Allowed driving regimes (e.g. ["highway", "city"]).
                      Empty list = any regime is acceptable.
        require_warm: If True, engine must be warm (coolant_temp >= 70).
                      If False, engine must be cold (coolant_temp < 70).
                      If None, no engine warmth check.
        min_speed:    Minimum speed (km/h) required.  None = no check.
    """
    regimes: List[str] = field(default_factory=list)
    require_warm: Optional[bool] = None
    min_speed: Optional[float] = None


@dataclass
class DiagnosticRule:
    """A complete diagnostic rule with one or more conditions.

    Attributes:
        name:             Machine-readable rule identifier.
        display:          Human-readable display name (Russian).
        tier:             Data tier required: "T1", "T2", or "T3".
        conditions:       List of conditions (all evaluated; weighted).
        min_confidence:   Threshold below which the result is suppressed (default 40).
        cooldown_minutes: Minimum time between firings (default 10080 = 7 days).
        situation_id:     Optional link to a KB situation.
        dtc_codes:        Associated DTC codes (informational).
        context:          Optional driving-context constraints.
    """
    name: str
    display: str
    tier: str
    conditions: List[RuleCondition]
    min_confidence: int = 40
    cooldown_minutes: int = 10080
    situation_id: Optional[str] = None
    dtc_codes: List[str] = field(default_factory=list)
    context: Optional[RuleContext] = None


# ---------------------------------------------------------------------------
# RuleEngine
# ---------------------------------------------------------------------------


class RuleEngine:
    """Evaluates diagnostic rules against telemetry features and baselines.

    On construction, loads all rules from ``threshold_rules.json`` in the
    ``rules/`` sub-package directory.  Additional Python-defined rules can
    be registered via ``add_rule()``.

    Usage::

        engine = RuleEngine()
        results = engine.run_all(facts, features, baselines, regime, packet)
        # results: List[dict] sorted by confidence desc
    """

    def __init__(self) -> None:
        self.rules: List[DiagnosticRule] = []
        self._load_default_rules()
        self._python_rules = self._load_python_rules()

    # ------------------------------------------------------------------
    # Rule loading
    # ------------------------------------------------------------------

    def _load_default_rules(self) -> None:
        """Load the built-in threshold rules from the rules/ directory."""
        json_path = _RULES_DIR / "threshold_rules.json"
        if json_path.exists():
            self.load_json_rules(json_path)

    def load_json_rules(self, path: Union[str, Path]) -> None:
        """Load rules from a JSON file and append to self.rules.

        Args:
            path: Path to a JSON file with ``{"rules": [...]}`` structure.
        """
        path = Path(path)
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for rd in data.get("rules", []):
            conditions = []
            for cd in rd.get("conditions", []):
                conditions.append(RuleCondition(
                    fact_type=cd["fact_type"],
                    operator=cd["operator"],
                    threshold=cd["threshold"],
                    weight=cd.get("weight", 1),
                    context=cd.get("context"),
                ))

            # Parse optional context constraints
            ctx_data = rd.get("context")
            rule_context: Optional[RuleContext] = None
            if ctx_data is not None:
                rule_context = RuleContext(
                    regimes=ctx_data.get("regimes", []),
                    require_warm=ctx_data.get("require_warm"),
                    min_speed=ctx_data.get("min_speed"),
                )

            rule = DiagnosticRule(
                name=rd["name"],
                display=rd["display"],
                tier=rd["tier"],
                conditions=conditions,
                min_confidence=rd.get("min_confidence", 40),
                cooldown_minutes=rd.get("cooldown_minutes", 10080),
                situation_id=rd.get("situation_id"),
                dtc_codes=rd.get("dtc_codes", []),
                context=rule_context,
            )
            self.rules.append(rule)

    def add_rule(self, rule: DiagnosticRule) -> None:
        """Register an additional rule (e.g. Python-defined)."""
        self.rules.append(rule)

    def _load_python_rules(self) -> list:
        """Load Python rule functions from complex_rules module."""
        from .rules.complex_rules import ALL_RULES
        return list(ALL_RULES)

    def _run_python_rules(
        self,
        facts: list,
        features: Dict[str, Any],
        baselines: BaselineStore,
        regime: Union[str, Enum],
        packet: NormalizedPacket,
    ) -> List[Dict[str, Any]]:
        """Run all Python rules and collect results.

        Each Python rule receives (features, packet, baselines, regime)
        and returns a result dict or None.  Failing rules are silently
        skipped to avoid one broken rule poisoning the entire pipeline.
        """
        results: List[Dict[str, Any]] = []
        for rule_fn in self._python_rules:
            try:
                result = rule_fn(features, packet, baselines, regime)
                if result is not None:
                    results.append(result)
            except Exception:
                pass  # Skip failing rules silently
        return results

    # ------------------------------------------------------------------
    # Value resolution
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_value(
        fact_type: str,
        features: Dict[str, Any],
        packet: NormalizedPacket,
    ) -> Optional[float]:
        """Look up a value by field name: features dict first, then packet attrs.

        Returns None if the value is not found or not numeric.
        """
        # Try features dict first
        val = features.get(fact_type)
        if val is not None:
            try:
                return float(val)
            except (TypeError, ValueError):
                return None

        # Fall back to packet attribute
        val = getattr(packet, fact_type, None)
        if val is not None:
            try:
                return float(val)
            except (TypeError, ValueError):
                return None

        return None

    # ------------------------------------------------------------------
    # Condition evaluation
    # ------------------------------------------------------------------

    @staticmethod
    def _evaluate_condition(
        cond: RuleCondition,
        value: Optional[float],
        baselines: BaselineStore,
        regime: Union[str, Enum],
    ) -> Tuple[bool, float]:
        """Evaluate a single condition.

        Returns:
            (met, deviation_ratio):
              - met:   True if condition is satisfied
              - deviation_ratio:  how far beyond the threshold the value is
                (0.0 if not met, capped at 1.0)
        """
        if value is None:
            return False, 0.0

        op = cond.operator
        threshold = cond.threshold

        if op == ">":
            met = value > threshold
            if met:
                if threshold == 0:
                    dev = 0.0
                else:
                    # Scale deviation so a 10% overshoot = full deviation
                    scale = max(abs(threshold) * 0.1, 1.0)
                    dev = min(abs(value - threshold) / scale, 1.0)
            else:
                dev = 0.0
            return met, dev

        if op == "<":
            met = value < threshold
            if met:
                if threshold == 0:
                    # threshold=0 is a directional check (e.g. ltft < 0)
                    dev = 0.0
                else:
                    scale = max(abs(threshold) * 0.1, 1.0)
                    dev = min(abs(threshold - value) / scale, 1.0)
            else:
                dev = 0.0
            return met, dev

        if op == "==":
            tolerance = abs(threshold) * 0.01 if threshold != 0 else 0.01
            met = abs(value - threshold) <= tolerance
            return met, (1.0 if met else 0.0)

        if op == "z>":
            # Z-score comparison against baseline
            regime_key = regime.value if isinstance(regime, Enum) else str(regime)
            bl = baselines.get(regime_key, cond.fact_type)
            z = bl.z_score(value)
            met = z > threshold
            if met and threshold != 0:
                dev = min(abs(z - threshold) / abs(threshold), 1.0)
            elif met:
                dev = min(abs(z), 1.0)
            else:
                dev = 0.0
            return met, dev

        if op == "between":
            lo, hi = threshold[0], threshold[1]
            met = lo <= value <= hi
            return met, (1.0 if met else 0.0)

        if op == "in":
            met = value in threshold
            return met, (1.0 if met else 0.0)

        # Unknown operator
        return False, 0.0

    # ------------------------------------------------------------------
    # Rule evaluation
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Context checking
    # ------------------------------------------------------------------

    @staticmethod
    def _check_context(
        rule: DiagnosticRule,
        regime: Union[str, Enum],
        packet: NormalizedPacket,
    ) -> bool:
        """Check if the current driving context matches the rule's context constraints.

        Returns True if context matches (or rule has no context), False otherwise.
        """
        ctx = rule.context
        if ctx is None:
            return True

        # Check regimes
        if ctx.regimes:
            regime_str = regime.value if isinstance(regime, Enum) else str(regime)
            if regime_str not in ctx.regimes:
                return False

        # Check require_warm
        if ctx.require_warm is not None:
            coolant = getattr(packet, "coolant_temp", None)
            if coolant is not None:
                is_warm = coolant >= 70.0
                if ctx.require_warm and not is_warm:
                    return False
                if not ctx.require_warm and is_warm:
                    return False

        # Check min_speed
        if ctx.min_speed is not None:
            speed = getattr(packet, "speed", None)
            if speed is not None and speed < ctx.min_speed:
                return False

        return True

    # ------------------------------------------------------------------
    # Rule evaluation
    # ------------------------------------------------------------------

    def evaluate_rule(
        self,
        rule: DiagnosticRule,
        facts: list,
        features: Dict[str, Any],
        baselines: BaselineStore,
        regime: Union[str, Enum],
        packet: NormalizedPacket,
        escalation_manager: Optional[Any] = None,
        client_hash: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluate a single rule against current data.

        Args:
            rule:       The DiagnosticRule to evaluate.
            facts:      List of Fact objects (reserved for future correlation).
            features:   Extracted features dict.
            baselines:  BaselineStore for z-score computations.
            regime:     Current driving regime.
            packet:     NormalizedPacket with raw OBD/accel/audio fields.
            escalation_manager: Optional EscalationManager for persistence lookup.
            client_hash: Optional client identifier for escalation_manager lookups.

        Returns:
            Dict with keys: name, display, tier, confidence (0-100),
            status (likely/possible/unlikely/clear), conditions_met,
            conditions_total, situation_id, dtc_codes.
        """
        if not rule.conditions:
            return self._make_result(rule, 0.0, 0, 0)

        # --- GAP-R2: Cooldown enforcement ---
        # If the user dismissed this rule and it's still in cooldown,
        # return confidence=0 immediately to prevent reappearance.
        if escalation_manager is not None and client_hash is not None:
            try:
                if escalation_manager.is_in_cooldown(client_hash, rule.name):
                    return self._make_result(rule, 0.0, 0, len(rule.conditions))
            except Exception:
                pass  # Graceful degradation — proceed without cooldown check

        # --- Context gate: if driving context doesn't match, rule can't fire ---
        if not self._check_context(rule, regime, packet):
            return self._make_result(rule, 0.0, 0, len(rule.conditions))

        total_weight = sum(c.weight for c in rule.conditions)
        met_weight = 0
        deviations: List[float] = []
        evaluated_count = 0
        met_count = 0

        for cond in rule.conditions:
            value = self._resolve_value(cond.fact_type, features, packet)
            if value is None:
                # Condition cannot be evaluated — skip it
                continue

            evaluated_count += 1
            met, dev = self._evaluate_condition(cond, value, baselines, regime)

            if met:
                met_weight += cond.weight
                met_count += 1
                deviations.append(dev)

        # If no conditions could be evaluated, confidence is 0
        if evaluated_count == 0:
            return self._make_result(rule, 0.0, 0, len(rule.conditions))

        # --- Confidence scoring ---

        # Component 1: match_score (40%)
        # Fraction of weighted conditions met out of total weight
        match_ratio = met_weight / total_weight if total_weight > 0 else 0.0
        match_score = match_ratio * 40.0

        # Component 2: deviation_score (40%)
        # Average deviation across met conditions, scaled by match_ratio
        # so partial matches don't inflate confidence via deviation alone
        if deviations:
            avg_deviation = sum(deviations) / len(deviations)
        else:
            avg_deviation = 0.0
        deviation_score = avg_deviation * match_ratio * 40.0

        # Component 3: persistence_score (max 20%)
        # Look up consecutive firing count from escalation_manager if available
        persistence_ratio = _PERSISTENCE_FALLBACK_RATIO
        if escalation_manager is not None and client_hash is not None:
            try:
                rec = escalation_manager.get_record(client_hash, rule.name)
                if rec is not None:
                    persistence_ratio = _persistence_ratio_from_count(
                        rec.consecutive_count,
                    )
                else:
                    # No record = never fired before → no persistence bonus
                    persistence_ratio = 0.0
            except Exception:
                pass  # Graceful degradation — use fallback
        persistence_score = persistence_ratio * _PERSISTENCE_WEIGHT

        # Total confidence
        confidence = match_score + deviation_score + persistence_score

        # Only apply persistence if at least one condition was met
        if met_count == 0:
            confidence = 0.0

        # Cap at 100
        confidence = min(confidence, 100.0)

        # Round to 1 decimal
        confidence = round(confidence, 1)

        return self._make_result(
            rule, confidence, met_count, len(rule.conditions)
        )

    # ------------------------------------------------------------------
    # Run all rules
    # ------------------------------------------------------------------

    def run_all(
        self,
        facts: list,
        features: Dict[str, Any],
        baselines: BaselineStore,
        regime: Union[str, Enum],
        packet: NormalizedPacket,
        escalation_manager: Optional[Any] = None,
        client_hash: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Evaluate all loaded rules, return results sorted by confidence desc.

        Args:
            facts:      List of Fact objects.
            features:   Extracted features dict.
            baselines:  BaselineStore for z-score computations.
            regime:     Current driving regime.
            packet:     NormalizedPacket with raw fields.
            escalation_manager: Optional EscalationManager for persistence-based
                                confidence scoring.  When provided along with
                                client_hash, each rule's persistence component
                                scales with its consecutive firing count.
            client_hash: Optional client identifier used with escalation_manager.

        Returns:
            List of result dicts, sorted by confidence descending.
        """
        results = []
        for rule in self.rules:
            result = self.evaluate_rule(
                rule, facts, features, baselines, regime, packet,
                escalation_manager=escalation_manager,
                client_hash=client_hash,
            )
            results.append(result)

        # Run Python rules (complex logic beyond JSON thresholds)
        python_results = self._run_python_rules(
            facts, features, baselines, regime, packet,
        )
        results.extend(python_results)

        results.sort(key=lambda r: r["confidence"], reverse=True)
        return results

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _make_result(
        rule: DiagnosticRule,
        confidence: float,
        conditions_met: int,
        conditions_total: int,
    ) -> Dict[str, Any]:
        """Build a standardized result dict."""
        if confidence >= 70:
            status = "likely"
        elif confidence >= 40:
            status = "possible"
        elif confidence > 0:
            status = "unlikely"
        else:
            status = "clear"

        return {
            "name": rule.name,
            "display": rule.display,
            "tier": rule.tier,
            "confidence": confidence,
            "status": status,
            "conditions_met": conditions_met,
            "conditions_total": conditions_total,
            "situation_id": rule.situation_id,
            "dtc_codes": rule.dtc_codes,
        }
