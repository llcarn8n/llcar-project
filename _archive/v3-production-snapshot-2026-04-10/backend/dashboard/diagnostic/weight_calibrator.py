"""WeightCalibrator — analyze user feedback to suggest rule weight adjustments.

Reads user_feedback table, computes per-rule accuracy, and recommends
threshold changes for rules with low accuracy and sufficient samples.

This is a reporting/analysis tool. It does NOT modify rules automatically.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from dataclasses import dataclass


@dataclass
class RuleAccuracy:
    """Accuracy metrics for a single rule."""
    rule_name: str
    confirmed: int
    dismissed: int
    resolved: int
    total: int
    accuracy: float  # confirmed / (confirmed + dismissed), 0-1
    sufficient_data: bool  # total >= min_samples
    recommendation: str  # "keep", "increase_threshold", "review"


class WeightCalibrator:
    """Analyze user feedback to suggest rule weight adjustments."""

    MIN_SAMPLES = 10  # Minimum feedback entries to make recommendations

    def __init__(self, min_samples: int = 10):
        self.MIN_SAMPLES = min_samples

    def analyze(self, feedback_rows: List[Dict[str, Any]]) -> List[RuleAccuracy]:
        """Compute accuracy per rule from feedback data.

        Args:
            feedback_rows: List of dicts with keys: rule_name, action
                          action is one of: 'confirmed', 'dismissed', 'resolved'

        Returns:
            List of RuleAccuracy sorted by accuracy ascending (worst first)
        """
        # Group by rule_name
        rules: Dict[str, Dict[str, int]] = {}
        for row in feedback_rows:
            name = row.get("rule_name", "")
            action = row.get("action", "")
            if name not in rules:
                rules[name] = {"confirmed": 0, "dismissed": 0, "resolved": 0}
            if action in rules[name]:
                rules[name][action] += 1

        results = []
        for name, counts in rules.items():
            confirmed = counts["confirmed"] + counts["resolved"]  # resolved = confirmed + fixed
            dismissed = counts["dismissed"]
            total = confirmed + dismissed
            accuracy = confirmed / total if total > 0 else 0.0
            sufficient = total >= self.MIN_SAMPLES

            if not sufficient:
                recommendation = "insufficient_data"
            elif accuracy >= 0.7:
                recommendation = "keep"
            elif accuracy >= 0.5:
                recommendation = "review"
            else:
                recommendation = "increase_threshold"

            results.append(RuleAccuracy(
                rule_name=name,
                confirmed=confirmed,
                dismissed=dismissed,
                resolved=counts["resolved"],
                total=total,
                accuracy=round(accuracy, 3),
                sufficient_data=sufficient,
                recommendation=recommendation,
            ))

        return sorted(results, key=lambda r: r.accuracy)

    def generate_report(self, results: List[RuleAccuracy]) -> str:
        """Generate human-readable report of rule accuracy."""
        lines = ["# Rule Weight Calibration Report", ""]

        problems = [r for r in results if r.recommendation == "increase_threshold"]
        reviews = [r for r in results if r.recommendation == "review"]
        good = [r for r in results if r.recommendation == "keep"]
        insufficient = [r for r in results if r.recommendation == "insufficient_data"]

        if problems:
            lines.append(f"## ⚠ Rules to Fix ({len(problems)})")
            for r in problems:
                lines.append(f"- **{r.rule_name}**: accuracy {r.accuracy:.0%} ({r.confirmed}/{r.total}) → INCREASE THRESHOLD")
            lines.append("")

        if reviews:
            lines.append(f"## 🔍 Rules to Review ({len(reviews)})")
            for r in reviews:
                lines.append(f"- **{r.rule_name}**: accuracy {r.accuracy:.0%} ({r.confirmed}/{r.total})")
            lines.append("")

        if good:
            lines.append(f"## ✅ Good Rules ({len(good)})")
            for r in good:
                lines.append(f"- {r.rule_name}: {r.accuracy:.0%}")
            lines.append("")

        if insufficient:
            lines.append(f"## ℹ Insufficient Data ({len(insufficient)})")
            for r in insufficient:
                lines.append(f"- {r.rule_name}: {r.total} samples (need {self.MIN_SAMPLES}+)")

        return "\n".join(lines)
