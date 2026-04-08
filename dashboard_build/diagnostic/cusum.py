"""CUSUM trend detector for health score series.

Uses two-sided CUSUM to detect if health scores are improving,
degrading, or stable over time.

Supports 3 timescales (GAP-A2):
  - Short:  k=3, h=10  — detects rapid changes (few trips)
  - Medium: k=5, h=15  — detects gradual drift (weeks)
  - Long:   k=8, h=25  — detects slow degradation (months)
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


# ---------------------------------------------------------------------------
# GAP-A2: Multi-Scale CUSUM — 3 timescales
# ---------------------------------------------------------------------------

# Timescale configurations: (name, k, h)
_TIMESCALES = [
    ("short", 3.0, 10.0),
    ("medium", 5.0, 15.0),
    ("long", 8.0, 25.0),
]


class MultiScaleCUSUM:
    """Wraps 3 CUSUMDetectors at different timescales (short/medium/long).

    Returns trends from the MOST SENSITIVE timescale that triggered.
    Priority: short > medium > long (short detects fastest).
    """

    def __init__(self) -> None:
        self.detectors: Dict[str, CUSUMDetector] = {}
        for name, k, h in _TIMESCALES:
            self.detectors[name] = CUSUMDetector(k=k, h=h)

    def compute_trend(self, scores: List[float]) -> str:
        """Compute trend using the most sensitive triggered timescale.

        Checks short first (most sensitive), then medium, then long.
        Returns the trend from the first timescale that detects a change.
        If none trigger, returns stable "→".
        """
        for name in ("short", "medium", "long"):
            trend = self.detectors[name].compute_trend(scores)
            if trend != "\u2192":  # not "→"
                return trend
        return "\u2192"  # "→"

    def compute_all_scales(self, scores: List[float]) -> Dict[str, str]:
        """Compute trends at all 3 timescales for a single score series.

        Returns: {"short": "↓", "medium": "→", "long": "→"}
        """
        return {
            name: self.detectors[name].compute_trend(scores)
            for name in ("short", "medium", "long")
        }

    def compute_all_trends(self, history: List[dict]) -> Dict[str, str]:
        """Compute trends for all 4 systems using multi-scale detection.

        Returns trends from the most sensitive timescale that triggered
        for each system.
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

    def compute_all_trends_detailed(
        self, history: List[dict],
    ) -> Dict[str, Dict[str, str]]:
        """Compute per-timescale trends for all 4 systems.

        Returns: {
            "suspension": {"short": "→", "medium": "→", "long": "→"},
            "engine":     {"short": "↓", "medium": "→", "long": "→"},
            ...
        }
        """
        systems = {
            "suspension": "suspension_score",
            "engine": "engine_score",
            "electrical": "electrical_score",
            "audio": "audio_score",
        }
        detailed: Dict[str, Dict[str, str]] = {}
        for system, column in systems.items():
            values = [h[column] for h in history if h.get(column) is not None]
            detailed[system] = self.compute_all_scales(values)
        return detailed

    def degradation_detected(self, history: List[dict]) -> bool:
        """Return True if ANY system at ANY timescale shows degradation."""
        detailed = self.compute_all_trends_detailed(history)
        for system_trends in detailed.values():
            for trend in system_trends.values():
                if trend == "\u2193":  # "↓"
                    return True
        return False
