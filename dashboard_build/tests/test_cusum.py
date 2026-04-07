"""Tests for CUSUMDetector and its integration with DiagnosisBuilder.

Tests:
  1. Constant scores → stable "→"
  2. Decreasing scores → degrading "↓"
  3. Increasing scores → improving "↑"
  4. Too few scores → stable "→"
  5. Empty list → stable "→"
  6. Small fluctuation (noise) → stable "→"
  7. Sharp drop at end → degrading "↓"
  8. compute_all_trends with history dicts → correct per-system trends
  9. compute_all_trends with missing columns → "→" for missing
 10. build_report without history → all trends "→" (backward compat)
 11. build_report with degrading history → "↓" for that system
"""
from __future__ import annotations

import time
import pytest
from unittest.mock import MagicMock

from diagnostic.cusum import CUSUMDetector
from diagnostic.diagnosis_builder import DiagnosisBuilder
from diagnostic.vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_profile(**kwargs) -> VehicleProfile:
    defaults = dict(
        client_hash="test_hash",
        brand="li_auto",
        model="L7",
        year=2023,
    )
    defaults.update(kwargs)
    return VehicleProfile(**defaults)


def _make_kb_mock():
    kb = MagicMock()
    kb.resolve_dtc.return_value = None
    kb.find_situations_by_dtc.return_value = []
    kb.find_situations_by_category.return_value = []
    kb.find_situations_by_system_id.return_value = []
    return kb


def _make_pipeline_result(facts=None, regime="idle"):
    return {
        "packet": MagicMock(),
        "features": {},
        "facts": facts or [],
        "tier": "T1",
        "regime": regime,
        "baseline_ready": False,
        "baseline_confidence": 0.0,
    }


# ---------------------------------------------------------------------------
# CUSUMDetector unit tests
# ---------------------------------------------------------------------------

class TestCUSUMConstant:
    """Test 1: Constant scores → stable."""

    def test_constant_scores_stable(self):
        detector = CUSUMDetector()
        scores = [80, 80, 80, 80, 80, 80, 80]
        assert detector.compute_trend(scores) == "→"


class TestCUSUMDecreasing:
    """Test 2: Decreasing scores → degrading."""

    def test_decreasing_scores_degrading(self):
        detector = CUSUMDetector()
        scores = [100, 95, 90, 85, 80, 75, 70, 65, 60]
        assert detector.compute_trend(scores) == "↓"


class TestCUSUMIncreasing:
    """Test 3: Increasing scores → improving."""

    def test_increasing_scores_improving(self):
        detector = CUSUMDetector()
        scores = [60, 65, 70, 75, 80, 85, 90, 95, 100]
        assert detector.compute_trend(scores) == "↑"


class TestCUSUMTooFew:
    """Test 4: Too few scores → stable."""

    def test_too_few_scores_stable(self):
        detector = CUSUMDetector()
        scores = [80, 70]
        assert detector.compute_trend(scores) == "→"


class TestCUSUMEmpty:
    """Test 5: Empty list → stable."""

    def test_empty_list_stable(self):
        detector = CUSUMDetector()
        assert detector.compute_trend([]) == "→"


class TestCUSUMSmallFluctuation:
    """Test 6: Small fluctuation (noise) → stable."""

    def test_small_fluctuation_stable(self):
        detector = CUSUMDetector()
        scores = [80, 78, 82, 79, 81, 80]
        assert detector.compute_trend(scores) == "→"


class TestCUSUMSharpDrop:
    """Test 7: Sharp drop at end → degrading."""

    def test_sharp_drop_at_end_degrading(self):
        detector = CUSUMDetector()
        scores = [80, 80, 80, 80, 80, 80, 80, 50, 40, 30]
        assert detector.compute_trend(scores) == "↓"


class TestCUSUMComputeAllTrends:
    """Test 8: compute_all_trends with full history dicts."""

    def test_compute_all_trends_correct(self):
        detector = CUSUMDetector()

        # Build history: suspension stable, engine degrading,
        # electrical stable, audio improving
        history = []
        for i in range(10):
            history.append({
                "suspension_score": 80,
                "engine_score": 100 - i * 5,       # 100→55 decreasing
                "electrical_score": 90,
                "audio_score": 60 + i * 5,          # 60→105 increasing
            })

        trends = detector.compute_all_trends(history)

        assert trends["suspension"] == "→"
        assert trends["engine"] == "↓"
        assert trends["electrical"] == "→"
        assert trends["audio"] == "↑"


class TestCUSUMComputeAllTrendsMissing:
    """Test 9: compute_all_trends with missing columns → stable."""

    def test_missing_columns_stable(self):
        detector = CUSUMDetector()

        # Only suspension_score present, others missing
        history = [{"suspension_score": 80} for _ in range(10)]

        trends = detector.compute_all_trends(history)

        assert trends["suspension"] == "→"   # constant → stable
        assert trends["engine"] == "→"        # no data → stable
        assert trends["electrical"] == "→"    # no data → stable
        assert trends["audio"] == "→"         # no data → stable


# ---------------------------------------------------------------------------
# Integration with DiagnosisBuilder
# ---------------------------------------------------------------------------

class TestBuildReportWithoutHistory:
    """Test 10: build_report without history → all trends stable (backward compat)."""

    def test_build_report_no_history_all_stable(self):
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        # No history param → backward compatible
        report = builder.build_report(pipeline_result, rule_results)

        trends = report["health_trends"]
        for system in ("suspension", "engine", "electrical", "audio"):
            assert trends[system] == "→"


class TestBuildReportWithDegradingHistory:
    """Test 11: build_report with degrading history → ↓ for that system."""

    def test_build_report_with_degrading_engine_history(self):
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        # Engine scores degrading over time
        history = []
        for i in range(10):
            history.append({
                "suspension_score": 80,
                "engine_score": 100 - i * 5,       # 100→55 decreasing
                "electrical_score": 90,
                "audio_score": 85,
            })

        report = builder.build_report(
            pipeline_result, rule_results, history=history
        )

        trends = report["health_trends"]
        assert trends["engine"] == "↓"
        assert trends["suspension"] == "→"
        assert trends["electrical"] == "→"
        assert trends["audio"] == "→"


class TestCUSUMCustomParameters:
    """Test 12: Custom k and h parameters affect sensitivity."""

    def test_high_threshold_stays_stable(self):
        """With very high threshold h, even a clear trend stays stable."""
        detector = CUSUMDetector(k=3.0, h=10000.0)
        scores = [100, 95, 90, 85, 80, 75, 70, 65, 60]
        assert detector.compute_trend(scores) == "→"

    def test_low_threshold_detects_easily(self):
        """With very low threshold h and k, even small changes are detected."""
        detector = CUSUMDetector(k=0.1, h=1.0)
        scores = [80, 79, 78, 77, 76, 75, 74, 73, 72]
        assert detector.compute_trend(scores) == "↓"
