"""Tests for KnowledgeBase — 4-level DTC/situation resolver."""

import os
import json
import pytest

# Paths to sample data
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DTC_INDEX_PATH = os.path.join(DATA_DIR, "dtc-index-sample.json")
SITUATIONS_PATH = os.path.join(DATA_DIR, "situations-sample.json")

from diagnostic.knowledge_base import KnowledgeBase


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def kb():
    """KnowledgeBase loaded with universal sample data."""
    return KnowledgeBase(DTC_INDEX_PATH, SITUATIONS_PATH)


@pytest.fixture
def brand_dtc_file(tmp_path):
    """Temporary brand-level DTC overlay JSON."""
    data = {
        "meta": {"total": 1},
        "codes": {
            "P0171": {
                "severity": "warning",
                "title_ru": "Бедная смесь (Li Auto специфика)",
                "system_id": "fuel",
                "can_drive": "yes_caution",
            }
        },
    }
    path = tmp_path / "brand-dtc.json"
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return str(path)


@pytest.fixture
def brand_situations_file(tmp_path):
    """Temporary brand-level situations overlay JSON."""
    data = [
        {
            "id": "lean_mixture_li",
            "title": "Обеднённая смесь (Li Auto)",
            "quickAnswer": "Проверьте форсунки Li Auto.",
            "urgency": 4,
            "category": "engine",
            "layers": ["engine", "fuel"],
            "dtc_codes": ["P0171"],
            "canDrive": "осторожно",
            "priceRange": "5000-30000 руб",
            "commonMistakes": ["Игнорирование TSB Li Auto"],
        }
    ]
    path = tmp_path / "brand-situations.json"
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return str(path)


@pytest.fixture
def kb_with_brand(kb, brand_dtc_file, brand_situations_file):
    """KnowledgeBase with a brand layer added."""
    kb.add_brand_layer("li_auto", brand_dtc_file, brand_situations_file)
    return kb


# ---------------------------------------------------------------------------
# DTC lookup
# ---------------------------------------------------------------------------

class TestResolveDtc:
    def test_known_code(self, kb):
        result = kb.resolve_dtc("P0171")
        assert result is not None
        assert result["severity"] == "warning"  # severity_overrides.json: info -> warning
        assert result["system_id"] == "engine"

    def test_unknown_code(self, kb):
        result = kb.resolve_dtc("Z9999")
        assert result is None

    def test_critical_code(self, kb):
        result = kb.resolve_dtc("B0001")
        assert result is not None
        assert result["severity"] == "critical"
        assert result["can_drive"] == "no_stop"

    def test_brand_overrides_universal(self, kb_with_brand):
        result = kb_with_brand.resolve_dtc("P0171", brand="li_auto")
        assert result is not None
        assert result["severity"] == "warning"  # brand override
        assert result["system_id"] == "fuel"  # brand override

    def test_brand_falls_back_to_universal(self, kb_with_brand):
        result = kb_with_brand.resolve_dtc("P0300", brand="li_auto")
        assert result is not None
        assert result["severity"] == "critical"  # severity_overrides.json: urgent -> critical

    def test_no_brand_ignores_brand_layer(self, kb_with_brand):
        result = kb_with_brand.resolve_dtc("P0171")
        assert result is not None
        assert result["severity"] == "warning"  # universal + severity override (info -> warning)


# ---------------------------------------------------------------------------
# Situation lookups
# ---------------------------------------------------------------------------

class TestFindSituationsByDtc:
    def test_code_with_situations(self, kb):
        results = kb.find_situations_by_dtc("P0171")
        assert len(results) >= 1
        assert results[0]["id"] == "lean_mixture"

    def test_code_without_situations(self, kb):
        results = kb.find_situations_by_dtc("B0001")
        assert results == []

    def test_brand_situations_merged(self, kb_with_brand):
        results = kb_with_brand.find_situations_by_dtc("P0171", brand="li_auto")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids  # universal
        assert "lean_mixture_li" in ids  # brand

    def test_no_brand_only_universal(self, kb_with_brand):
        results = kb_with_brand.find_situations_by_dtc("P0171")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids
        assert "lean_mixture_li" not in ids


class TestFindSituationsByCategory:
    def test_engine_category(self, kb):
        results = kb.find_situations_by_category("engine")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids
        assert "engine_overheat" in ids

    def test_chassis_category(self, kb):
        results = kb.find_situations_by_category("chassis")
        ids = [s["id"] for s in results]
        assert "suspension_noise" in ids

    def test_nonexistent_category(self, kb):
        results = kb.find_situations_by_category("nonexistent")
        assert results == []

    def test_brand_category_merged(self, kb_with_brand):
        results = kb_with_brand.find_situations_by_category("engine", brand="li_auto")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids
        assert "lean_mixture_li" in ids


class TestFindSituationsBySystemId:
    def test_engine_system(self, kb):
        results = kb.find_situations_by_system_id("engine")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids

    def test_fuel_system_maps_to_engine(self, kb):
        results = kb.find_situations_by_system_id("fuel")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids

    def test_suspension_maps_to_chassis(self, kb):
        results = kb.find_situations_by_system_id("suspension")
        ids = [s["id"] for s in results]
        assert "suspension_noise" in ids

    def test_unknown_system_id(self, kb):
        results = kb.find_situations_by_system_id("unknown_system")
        assert results == []


# ---------------------------------------------------------------------------
# Multi-DTC pattern matching
# ---------------------------------------------------------------------------

class TestMatchDtcPattern:
    def test_exact_match(self, kb):
        result = kb.match_dtc_pattern(["P0171", "P0174"])
        assert result is not None
        assert result["situation_id"] == "air_leak"
        assert result["boost"] == 25

    def test_superset_match(self, kb):
        """Codes are a superset of a pattern — should still match."""
        result = kb.match_dtc_pattern(["P0171", "P0174", "P0420"])
        assert result is not None
        assert result["situation_id"] == "air_leak"

    def test_no_match(self, kb):
        result = kb.match_dtc_pattern(["B0001"])
        assert result is None

    def test_unrelated_codes(self, kb):
        result = kb.match_dtc_pattern(["P0420", "B0001"])
        assert result is None

    def test_ignition_pattern(self, kb):
        result = kb.match_dtc_pattern(["P0300", "P0301", "P0302"])
        assert result is not None
        assert result["situation_id"] == "ignition_coil"

    def test_partial_pattern_no_match(self, kb):
        """Only one code from a two-code pattern — should NOT match."""
        result = kb.match_dtc_pattern(["P0171"])
        assert result is None

    def test_multiple_patterns_highest_boost(self, kb):
        """When multiple patterns match, return the one with highest boost."""
        result = kb.match_dtc_pattern(["P0171", "P0174", "P0420", "P0430"])
        assert result is not None
        # air_leak (boost=25) beats bad_fuel (boost=20)
        assert result["situation_id"] == "air_leak"


# ---------------------------------------------------------------------------
# system_id_to_categories static mapping
# ---------------------------------------------------------------------------

class TestSystemIdToCategories:
    def test_engine(self):
        assert KnowledgeBase.system_id_to_categories("engine") == ["engine"]

    def test_fuel(self):
        assert KnowledgeBase.system_id_to_categories("fuel") == ["engine"]

    def test_suspension(self):
        assert KnowledgeBase.system_id_to_categories("suspension") == ["chassis"]

    def test_brakes(self):
        assert KnowledgeBase.system_id_to_categories("brakes") == ["brakes"]

    def test_abs(self):
        assert KnowledgeBase.system_id_to_categories("abs") == ["brakes"]

    def test_battery(self):
        assert KnowledgeBase.system_id_to_categories("battery") == ["electrical"]

    def test_airbag(self):
        assert KnowledgeBase.system_id_to_categories("airbag") == ["safety"]

    def test_network(self):
        assert KnowledgeBase.system_id_to_categories("network") == ["electrical"]

    def test_body(self):
        assert KnowledgeBase.system_id_to_categories("body") == ["body"]

    def test_unknown_system(self):
        assert KnowledgeBase.system_id_to_categories("unknown") == []


# ---------------------------------------------------------------------------
# DTC range classification (SAE J2012)
# ---------------------------------------------------------------------------

class TestDtcRangeClassification:
    def test_p0171_classified_as_engine(self, kb):
        """P0171 is in P0100-P0199 range → engine/sensors per SAE J2012."""
        result = kb.classify_dtc_by_range("P0171")
        assert result is not None
        assert result["category"] == "engine"
        assert result["system"] == "sensors"

    def test_p0300_classified_as_ignition(self, kb):
        result = kb.classify_dtc_by_range("P0300")
        assert result is not None
        assert result["category"] == "engine"
        assert result["system"] == "ignition"

    def test_p0700_classified_as_transmission(self, kb):
        result = kb.classify_dtc_by_range("P0700")
        assert result is not None
        assert result["category"] == "drivetrain"
        assert result["system"] == "transmission"

    def test_b1234_classified_as_body(self, kb):
        result = kb.classify_dtc_by_range("B1234")
        assert result is not None
        assert result["category"] == "body"
        assert result["system"] == "body"

    def test_c0045_classified_as_chassis(self, kb):
        result = kb.classify_dtc_by_range("C0045")
        assert result is not None
        assert result["category"] == "chassis"
        assert result["system"] == "chassis"

    def test_u0100_classified_as_network(self, kb):
        result = kb.classify_dtc_by_range("U0100")
        assert result is not None
        assert result["category"] == "electrical"
        assert result["system"] == "network"

    def test_unknown_code_returns_none(self, kb):
        result = kb.classify_dtc_by_range("X9999")
        assert result is None

    def test_find_situations_by_dtc_range_returns_results(self, kb):
        """P0171 range → engine category → should find engine situations."""
        results = kb.find_situations_by_dtc_range("P0171")
        assert len(results) >= 1
        categories = [s.get("category") for s in results]
        assert "engine" in categories
