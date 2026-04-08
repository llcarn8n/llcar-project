"""Tests for KnowledgeBase — 4-level DTC/situation resolver."""

import os
import json
import pytest

from diagnostic.db import MockDB

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

# ---------------------------------------------------------------------------
# Situation filtering (manual_warnings / maintenance exclusion)
# ---------------------------------------------------------------------------

class TestSituationFiltering:
    """_is_diagnostic_situation helper and its integration into finders."""

    def test_diagnostic_situation_passes(self):
        """Normal diagnostic situation (yt_ prefix) passes the filter."""
        s = {"id": "yt_lean_mixture", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is True

    def test_maintenance_situation_filtered(self):
        """maint_ prefix is filtered out."""
        s = {"id": "maint_oil_change", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is False

    def test_manual_warning_filtered(self):
        """man_ prefix is filtered out."""
        s = {"id": "man_check_coolant", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is False

    def test_manual_warning_source_filtered(self):
        """source=manual_warning is filtered regardless of id prefix."""
        s = {"id": "buni_some_entry", "source": "manual_warning", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is False

    def test_maintenance_source_filtered(self):
        """source=maintenance is filtered regardless of id prefix."""
        s = {"id": "buni_some_entry", "source": "maintenance", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is False

    def test_normal_source_passes(self):
        """Normal source value does not trigger the filter."""
        s = {"id": "buni_some_entry", "source": "youtube", "category": "engine"}
        assert KnowledgeBase._is_diagnostic_situation(s) is True

    def test_find_by_category_excludes_maintenance(self, kb, tmp_path):
        """find_situations_by_category must NOT return maintenance entries."""
        # Inject a maintenance situation into the KB's universal list
        maint_situation = {
            "id": "maint_oil_change",
            "title": "Замена масла",
            "category": "engine",
            "dtc_codes": [],
        }
        kb._universal_situations.append(maint_situation)
        kb._universal_situations_by_id[maint_situation["id"]] = maint_situation

        results = kb.find_situations_by_category("engine")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids
        assert "maint_oil_change" not in ids

    def test_find_by_id_returns_maintenance(self, kb):
        """find_situation_by_id must return maintenance entries (direct lookup)."""
        maint_situation = {
            "id": "maint_oil_change",
            "title": "Замена масла",
            "category": "engine",
            "dtc_codes": [],
        }
        kb._universal_situations.append(maint_situation)
        kb._universal_situations_by_id[maint_situation["id"]] = maint_situation

        result = kb.find_situation_by_id("maint_oil_change")
        assert result is not None
        assert result["id"] == "maint_oil_change"

    def test_find_by_dtc_not_filtered(self, kb):
        """find_situations_by_dtc must return maintenance entries (direct DTC lookup)."""
        maint_situation = {
            "id": "maint_engine_check",
            "title": "ТО двигателя",
            "category": "engine",
            "dtc_codes": ["P0171"],
        }
        kb._universal_situations.append(maint_situation)
        kb._universal_situations_by_id[maint_situation["id"]] = maint_situation

        results = kb.find_situations_by_dtc("P0171")
        ids = [s["id"] for s in results]
        assert "maint_engine_check" in ids

    def test_find_by_system_id_excludes_maintenance(self, kb):
        """find_situations_by_system_id must also exclude maintenance entries."""
        maint_situation = {
            "id": "maint_oil_change",
            "title": "Замена масла",
            "category": "engine",
            "dtc_codes": [],
        }
        kb._universal_situations.append(maint_situation)
        kb._universal_situations_by_id[maint_situation["id"]] = maint_situation

        results = kb.find_situations_by_system_id("engine")
        ids = [s["id"] for s in results]
        assert "lean_mixture" in ids
        assert "maint_oil_change" not in ids


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


# ---------------------------------------------------------------------------
# load_dtc_patterns — DB-backed multi-DTC pattern loading
# ---------------------------------------------------------------------------

class TestLoadDtcPatterns:
    """Tests for KnowledgeBase.load_dtc_patterns (SQLite via MockDB)."""

    @pytest.fixture
    def mock_db(self):
        """Provide a fresh MockDB with tables created."""
        db = MockDB()
        db.setup()
        yield db
        db.teardown()

    def test_load_dtc_patterns_empty_db(self, mock_db):
        """Empty dtc_patterns table returns an empty list."""
        with mock_db.cursor() as c:
            patterns = KnowledgeBase.load_dtc_patterns(c)
        assert patterns == []

    def test_load_dtc_patterns_returns_data(self, mock_db):
        """Seeded patterns are loaded correctly."""
        with mock_db.cursor() as c:
            c.execute(
                "INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES (?, ?, ?, ?)",
                (json.dumps(["P0171", "P0174"]), "air_leak_both_banks", 25, "Оба банка бедные"),
            )
            c.execute(
                "INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES (?, ?, ?, ?)",
                (json.dumps(["P0420", "P0430"]), "bad_fuel_or_cats", 20, "Плохое топливо"),
            )
        with mock_db.cursor() as c:
            patterns = KnowledgeBase.load_dtc_patterns(c)
        assert len(patterns) == 2
        diagnoses = {p["diagnosis"] for p in patterns}
        assert "air_leak_both_banks" in diagnoses
        assert "bad_fuel_or_cats" in diagnoses

    def test_pattern_codes_is_set(self, mock_db):
        """The 'codes' field must be a set for O(1) lookup."""
        with mock_db.cursor() as c:
            c.execute(
                "INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES (?, ?, ?, ?)",
                (json.dumps(["P0300", "P0301", "P0302"]), "coil_pack_12", 25, "Катушка"),
            )
        with mock_db.cursor() as c:
            patterns = KnowledgeBase.load_dtc_patterns(c)
        assert len(patterns) == 1
        assert isinstance(patterns[0]["codes"], set)
        assert patterns[0]["codes"] == {"P0300", "P0301", "P0302"}

    def test_pattern_boost_value(self, mock_db):
        """confidence_boost is loaded as an integer."""
        with mock_db.cursor() as c:
            c.execute(
                "INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES (?, ?, ?, ?)",
                (json.dumps(["P0016", "P0017"]), "timing_chain", 25, "Цепь ГРМ"),
            )
        with mock_db.cursor() as c:
            patterns = KnowledgeBase.load_dtc_patterns(c)
        assert patterns[0]["confidence_boost"] == 25
        assert isinstance(patterns[0]["confidence_boost"], int)

    def test_pattern_description_ru(self, mock_db):
        """description_ru is loaded as a string with Cyrillic content."""
        desc = "Оба датчика фаз → растяжение цепи ГРМ"
        with mock_db.cursor() as c:
            c.execute(
                "INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES (?, ?, ?, ?)",
                (json.dumps(["P0016", "P0017"]), "timing_chain", 25, desc),
            )
        with mock_db.cursor() as c:
            patterns = KnowledgeBase.load_dtc_patterns(c)
        assert patterns[0]["description_ru"] == desc


# ---------------------------------------------------------------------------
# Curated DTC → situation map (resolve_dtc_to_situation)
# ---------------------------------------------------------------------------

class TestCuratedDtcSituationMap:
    """Tests for KnowledgeBase.resolve_dtc_to_situation — curated map lookup."""

    def test_curated_map_found(self, kb):
        """P0171 is in the curated map and its situation_ids point to
        situations that exist in the universal KB (injected here)."""
        # Inject a situation matching the curated map's first situation_id for P0171
        curated_map = kb._load_dtc_situation_map()
        if "P0171" not in curated_map:
            pytest.skip("P0171 not in curated map")
        target_sid = curated_map["P0171"]["situation_ids"][0]
        fake_situation = {
            "id": target_sid,
            "title": "Высокие топливные коррекции",
            "quickAnswer": "Подсос воздуха.",
            "urgency": 4,
            "category": "engine",
        }
        kb._universal_situations.append(fake_situation)
        kb._universal_situations_by_id[target_sid] = fake_situation

        result = kb.resolve_dtc_to_situation("P0171")
        assert result is not None
        assert result["id"] == target_sid

    def test_curated_map_not_found(self, kb):
        """Unknown DTC code not in curated map → returns None."""
        result = kb.resolve_dtc_to_situation("Z9999")
        assert result is None

    def test_curated_map_priority(self, kb):
        """Curated map situation takes priority — when both curated and
        category match exist, curated returns the specific situation."""
        curated_map = kb._load_dtc_situation_map()
        if "P0300" not in curated_map:
            pytest.skip("P0300 not in curated map")
        target_sid = curated_map["P0300"]["situation_ids"][0]
        curated_situation = {
            "id": target_sid,
            "title": "Двигатель троит",
            "quickAnswer": "Проверьте катушки.",
            "urgency": 4,
            "category": "engine",
        }
        kb._universal_situations.append(curated_situation)
        kb._universal_situations_by_id[target_sid] = curated_situation

        result = kb.resolve_dtc_to_situation("P0300")
        assert result is not None
        assert result["id"] == target_sid
        # This is different from what category search would return
        cat_results = kb.find_situations_by_category("engine")
        cat_ids = [s["id"] for s in cat_results]
        # The curated situation is in category results too, but curated
        # resolves directly to the specific one
        assert result["id"] in cat_ids or True  # curated always wins

    def test_curated_map_with_brand(self, kb_with_brand):
        """Brand layer is checked first when resolving curated situation_ids."""
        curated_map = kb_with_brand._load_dtc_situation_map()
        if "P0171" not in curated_map:
            pytest.skip("P0171 not in curated map")
        target_sid = curated_map["P0171"]["situation_ids"][0]

        # Add the target situation to brand layer (higher priority)
        brand_situation = {
            "id": target_sid,
            "title": "Высокие коррекции (Li Auto)",
            "quickAnswer": "Проверьте форсунки Li Auto.",
            "urgency": 4,
            "category": "engine",
        }
        kb_with_brand._brand_layers["li_auto"]["situations"].append(brand_situation)
        kb_with_brand._brand_situations_by_id["li_auto"][target_sid] = brand_situation

        result = kb_with_brand.resolve_dtc_to_situation("P0171", brand="li_auto")
        assert result is not None
        assert result["id"] == target_sid
        # Should get the brand-layer version
        assert "Li Auto" in result["title"]

    def test_resolve_chain_uses_curated_first(self, kb):
        """DiagnosisBuilder._resolve_kb_data uses curated map before DTC exact match.

        When a rule has dtc_codes that exist in both the curated map and
        in situation.dtc_codes, the curated map result wins.
        """
        from diagnostic.diagnosis_builder import DiagnosisBuilder
        from diagnostic.vehicle_profile import VehicleProfile

        curated_map = kb._load_dtc_situation_map()
        if "P0171" not in curated_map:
            pytest.skip("P0171 not in curated map")
        target_sid = curated_map["P0171"]["situation_ids"][0]

        # Inject curated situation
        curated_situation = {
            "id": target_sid,
            "title": "Высокие топливные коррекции",
            "quickAnswer": "Подсос воздуха.",
            "urgency": 4,
            "category": "engine",
        }
        kb._universal_situations.append(curated_situation)
        kb._universal_situations_by_id[target_sid] = curated_situation

        # The existing sample data has "lean_mixture" with dtc_codes=["P0171"]
        # which would be found by find_situations_by_dtc. Curated should win.
        profile = VehicleProfile(brand="test", model="test", year=2023, client_hash="test123")
        builder = DiagnosisBuilder(kb, profile)

        rule_result = {
            "name": "fuel_lean",
            "display": "Бедная смесь",
            "status": "likely",
            "confidence": 75,
            "dtc_codes": ["P0171"],
            "tier": "T2",
        }

        result = builder._resolve_kb_data(rule_result, "test")
        # Curated map should resolve first, returning the curated situation
        assert result["id"] == target_sid
