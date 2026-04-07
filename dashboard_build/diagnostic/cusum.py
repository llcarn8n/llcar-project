"""CUSUM trend detector for health score series.

Uses two-sided CUSUM to detect if health scores are improving,
degrading, or stable over time.
"""
from __future__ import annotations
from typing import Dict, List


class CUSUMDetector:
    """Detects trends in health scores using CUSUM algorithm."""

    def __init__(self, k: float = 3.0, h: float = 10.0):
        """
        k: slack parameter (sensitivity). Higher = less sensitive.
        h: threshold for alarm. Higher = needs bigger shift to trigger.
        """
        self.k = k
        self.h = h

    def compute_trend(self, scores: List[float]) -> str:
        """Compute trend from a time series of health scores (0-100).

        Returns: "↑" (improving), "↓" (degrading), "→" (stable)

        Two-sided CUSUM:
        - S_pos accumulates evidence of degradation (scores dropping)
        - S_neg accumulates evidence of improvement (scores rising)

        Scores should be in chronological order (oldest first).
        """
        if len(scores) < 5:
            return "→"

        mean = sum(scores) / len(scores)
        s_pos = 0.0  # degradation detector
        s_neg = 0.0  # improvement detector

        for x in scores:
            s_pos = max(0.0, s_pos + (mean - x) - self.k)
            s_neg = max(0.0, s_neg + (x - mean) - self.k)

        if s_pos > self.h:
            return "↓"
        if s_neg > self.h:
            return "↑"
        return "→"

    def compute_all_trends(self, history: List[dict]) -> Dict[str, str]:
        """Compute trends for all 4 systems from anomaly_scores history.

        history: list of dicts with keys like 'suspension_score', 'engine_score', etc.
                 Should be in chronological order (oldest first).

        Returns: {"suspension": "→", "engine": "↓", "electrical": "→", "audio": "↑"}
        """
        systems = {
            "suspension": "suspension_score",
            "engine": "engine_score",
            "electrical": "electrical_score",
            "audio": "audio_score",
        }
        trends = {}
        for system, column in systems.items():
            values = [h[column] for h in history if h.get(column) is not None]
            trends[system] = self.compute_trend(values)
        return trends
