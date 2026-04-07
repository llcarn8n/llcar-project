"""Tests for RecallsChecker — offline recalls database lookup.

Tests verify:
  - Database loads correctly (total_campaigns, brands_count)
  - Brand + model + year matching (Toyota LC200 2015)
  - Non-existent brand → empty
  - Year filtering (wrong year → no match)
  - Fuzzy model matching (word-level: "Tiggo" → "Chery Tiggo 8 Pro Max")
  - Results sorted by severity (critical first)
  - Non-existent DB path → no crash, empty
  - Year range parsing ("2024-2025" → [2024, 2025])
  - build_report with recalls_data → recalls block populated
  - build_report without recalls_data → recalls = [] (backward compat)
  - Brand-wide recall (campaign with no models list)
"""
from __future__ import annotations

import json
import os
import tempfile
import time

import pytest
from unittest.mock import MagicMock

from diagnostic.recalls_checker import RecallsChecker, _parse_years
from diagnostic.diagnosis_builder import DiagnosisBuilder
from diagnostic.facts import Fact, FactType
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


def _make_mini_db(campaigns=None, brands=None):
    """Create a temporary recalls DB file and return path."""
    db = {
        "_meta": {"total_campaigns": len(campaigns or [])},
        "brands": brands or {},
        "campaigns": campaigns or [],
    }
    fd, path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False)
    return path


# ---------------------------------------------------------------------------
# Test 1: Database loads correctly
# ---------------------------------------------------------------------------

class TestDatabaseLoad:
    def test_total_campaigns(self):
        """Real DB has 298 campaigns."""
        checker = RecallsChecker()
        assert checker.total_campaigns == 298

    def test_brands_count(self):
        """Real DB has 91 brands."""
        checker = RecallsChecker()
        assert checker.brands_count == 91


# ---------------------------------------------------------------------------
# Test 2: Non-existent DB path → empty, no crash
# ---------------------------------------------------------------------------

class TestMissingDatabase:
    def test_nonexistent_path_no_crash(self):
        """Non-existent DB path → no crash, 0 campaigns."""
        checker = RecallsChecker(db_path="/nonexistent/path/recalls.json")
        assert checker.total_campaigns == 0
        assert checker.brands_count == 0
        assert checker.check("toyota", "Camry", 2020) == []


# ---------------------------------------------------------------------------
# Test 3: Brand + model + year matching
# ---------------------------------------------------------------------------

class TestBrandModelYearMatch:
    def test_toyota_lc200_2013(self):
        """Toyota LC200 year 2013 should match TOYOTA-ROS-001."""
        checker = RecallsChecker()
        results = checker.check("toyota", "LC200", 2013)
        assert len(results) >= 1
        ids = [r["id"] for r in results]
        assert "TOYOTA-ROS-001" in ids

    def test_toyota_lc200_has_fields(self):
        """Each result has all required fields."""
        checker = RecallsChecker()
        results = checker.check("toyota", "LC200", 2013)
        assert len(results) >= 1
        r = results[0]
        for field in ("id", "brand", "title_ru", "severity", "system", "date",
                      "models", "source", "count"):
            assert field in r, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Test 4: Non-existent brand → empty
# ---------------------------------------------------------------------------

class TestNonexistentBrand:
    def test_unknown_brand_empty(self):
        """Unknown brand slug → no results."""
        checker = RecallsChecker()
        results = checker.check("nonexistent_brand_xyz", "SomeModel", 2020)
        assert results == []


# ---------------------------------------------------------------------------
# Test 5: Year filtering
# ---------------------------------------------------------------------------

class TestYearFiltering:
    def test_wrong_year_no_match(self):
        """TOYOTA-ROS-001 covers 2013 only. Year 2025 should not match it."""
        checker = RecallsChecker()
        results = checker.check("toyota", "LC200", 2025)
        ids = [r["id"] for r in results]
        assert "TOYOTA-ROS-001" not in ids

    def test_year_range_match(self):
        """CHERY-RCL-001 covers 2024-2025. Year 2024 should match."""
        checker = RecallsChecker()
        results = checker.check("chery", "Tiggo 7", 2024)
        ids = [r["id"] for r in results]
        assert "CHERY-RCL-001" in ids

    def test_year_range_no_match_outside(self):
        """CHERY-RCL-001 covers 2024-2025. Year 2022 should not match it."""
        checker = RecallsChecker()
        results = checker.check("chery", "Tiggo 7", 2022)
        ids = [r["id"] for r in results]
        assert "CHERY-RCL-001" not in ids


# ---------------------------------------------------------------------------
# Test 6: Fuzzy model matching
# ---------------------------------------------------------------------------

class TestFuzzyModelMatch:
    def test_tiggo_matches_tiggo_8_pro_max(self):
        """Word 'Tiggo' should match 'Chery Tiggo 8 Pro Max'."""
        checker = RecallsChecker()
        results = checker.check("chery", "Tiggo", 2023)
        # CHERY-SVC-001 has model "Chery Tiggo 8 Pro Max" with years 2023-2024
        ids = [r["id"] for r in results]
        assert "CHERY-SVC-001" in ids

    def test_partial_model_name_match(self):
        """'Prius' should match Toyota Prius campaign."""
        checker = RecallsChecker()
        results = checker.check("toyota", "Prius", 2014)
        assert len(results) >= 1
        # All results should contain Prius in their models
        for r in results:
            model_str = " ".join(r["models"]).lower()
            assert "prius" in model_str


# ---------------------------------------------------------------------------
# Test 7: Results sorted by severity
# ---------------------------------------------------------------------------

class TestSeveritySorting:
    def test_critical_before_high(self):
        """Results are sorted by severity: critical < high < medium < low."""
        path = _make_mini_db(
            campaigns=[
                {
                    "id": "TEST-LOW",
                    "brand": "testbrand",
                    "models": ["Model A"],
                    "years": "2020-2025",
                    "severity": "low",
                    "system": "engine",
                    "date": "2024-01-01",
                },
                {
                    "id": "TEST-CRITICAL",
                    "brand": "testbrand",
                    "models": ["Model A"],
                    "years": "2020-2025",
                    "severity": "critical",
                    "system": "fuel",
                    "date": "2024-06-01",
                },
                {
                    "id": "TEST-HIGH",
                    "brand": "testbrand",
                    "models": ["Model A"],
                    "years": "2020-2025",
                    "severity": "high",
                    "system": "brakes",
                    "date": "2024-03-01",
                },
            ],
            brands={"testbrand": {"name": "TestBrand", "slug": "testbrand"}},
        )
        try:
            checker = RecallsChecker(db_path=path)
            results = checker.check("testbrand", "Model A", 2023)
            assert len(results) == 3
            severities = [r["severity"] for r in results]
            assert severities == ["critical", "high", "low"]
        finally:
            os.unlink(path)


# ---------------------------------------------------------------------------
# Test 8: _parse_years helper
# ---------------------------------------------------------------------------

class TestParseYears:
    def test_empty_string(self):
        assert _parse_years("") == []

    def test_none(self):
        assert _parse_years(None) == []

    def test_single_year(self):
        assert _parse_years("2013") == [2013]

    def test_year_range(self):
        assert _parse_years("2024-2025") == [2024, 2025]

    def test_wide_range(self):
        assert _parse_years("2013-2016") == [2013, 2014, 2015, 2016]

    def test_list_passthrough(self):
        assert _parse_years([2020, 2021]) == [2020, 2021]

    def test_invalid_string(self):
        assert _parse_years("abc") == []


# ---------------------------------------------------------------------------
# Test 9: build_report with recalls_data
# ---------------------------------------------------------------------------

class TestBuildReportRecalls:
    def test_recalls_data_passed_through(self):
        """build_report with recalls_data → recalls block populated."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        fake_recalls = [
            {"id": "RECALL-001", "severity": "high", "title_ru": "Test recall"},
        ]

        report = builder.build_report(
            pipeline_result, rule_results, recalls_data=fake_recalls,
        )

        assert report["recalls"] == fake_recalls
        assert len(report["recalls"]) == 1
        assert report["recalls"][0]["id"] == "RECALL-001"

    def test_recalls_default_empty(self):
        """build_report without recalls_data → recalls = [] (backward compat)."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(pipeline_result, rule_results)

        assert report["recalls"] == []

    def test_recalls_none_explicit(self):
        """build_report with recalls_data=None → recalls = []."""
        kb = _make_kb_mock()
        profile = _make_profile()
        builder = DiagnosisBuilder(kb, profile)

        pipeline_result = _make_pipeline_result(facts=[])
        rule_results = []

        report = builder.build_report(
            pipeline_result, rule_results, recalls_data=None,
        )

        assert report["recalls"] == []


# ---------------------------------------------------------------------------
# Test 10: Brand-wide recall (no models in campaign)
# ---------------------------------------------------------------------------

class TestBrandWideRecall:
    def test_campaign_without_models_matches_any_model(self):
        """Campaign with empty models list → matches any model of that brand."""
        path = _make_mini_db(
            campaigns=[
                {
                    "id": "BRAND-WIDE-001",
                    "brand": "testbrand",
                    "models": [],
                    "years": "2020-2025",
                    "severity": "medium",
                    "system": "airbag",
                    "date": "2024-01-01",
                },
            ],
            brands={"testbrand": {"name": "TestBrand", "slug": "testbrand"}},
        )
        try:
            checker = RecallsChecker(db_path=path)
            results = checker.check("testbrand", "AnyModel", 2023)
            assert len(results) == 1
            assert results[0]["id"] == "BRAND-WIDE-001"
        finally:
            os.unlink(path)


# ---------------------------------------------------------------------------
# Test 11: Case-insensitive brand and model matching
# ---------------------------------------------------------------------------

class TestCaseInsensitive:
    def test_uppercase_brand(self):
        """Brand matching is case-insensitive."""
        path = _make_mini_db(
            campaigns=[
                {
                    "id": "CASE-001",
                    "brand": "Toyota",
                    "models": ["Camry"],
                    "years": "2020",
                    "severity": "low",
                    "system": "engine",
                    "date": "2024-01-01",
                },
            ],
            brands={"toyota": {"name": "Toyota"}},
        )
        try:
            checker = RecallsChecker(db_path=path)
            results = checker.check("TOYOTA", "Camry", 2020)
            assert len(results) == 1
        finally:
            os.unlink(path)

    def test_uppercase_model(self):
        """Model matching is case-insensitive."""
        path = _make_mini_db(
            campaigns=[
                {
                    "id": "CASE-002",
                    "brand": "toyota",
                    "models": ["Toyota CAMRY"],
                    "years": "2020",
                    "severity": "low",
                    "system": "engine",
                    "date": "2024-01-01",
                },
            ],
            brands={"toyota": {"name": "Toyota"}},
        )
        try:
            checker = RecallsChecker(db_path=path)
            results = checker.check("toyota", "camry", 2020)
            assert len(results) == 1
        finally:
            os.unlink(path)
