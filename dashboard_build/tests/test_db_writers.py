"""Tests for DB writer/reader functions — all use MockDB."""
import json
import pytest

from diagnostic.db import MockDB
from diagnostic.db_writers import (
    save_baselines,
    load_baselines,
    write_fact_log,
    write_anomaly_scores,
    write_feedback,
    save_vehicle_profile,
    load_vehicle_profile,
    write_dtc_events,
    _placeholder,
)
from diagnostic.db_readers import read_freeze_frames
from diagnostic.baseline_store import BaselineStore
from diagnostic.normalizer import DrivingRegime
from diagnostic.facts import Fact, FactType
from diagnostic.vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def db():
    mock = MockDB()
    mock.setup()
    yield mock
    mock.teardown()


CLIENT = "test_hash_abc123"


def _make_baseline_store() -> BaselineStore:
    """Build a small BaselineStore with known values."""
    store = BaselineStore()
    # Feed several values so count, mean, m2, min, max are non-trivial
    for v in [10.0, 20.0, 30.0]:
        store.update(DrivingRegime.CITY, {"az_std": v, "total_vibration": v * 2})
    for v in [50.0, 60.0]:
        store.update(DrivingRegime.HIGHWAY, {"az_std": v})
    return store


def _make_facts() -> list:
    """Return a small list of Fact objects."""
    return [
        Fact(
            type=FactType.DTC_ACTIVE,
            timestamp=1000.0,
            value=1.0,
            severity="warning",
            confidence=1.0,
            details={"dtc_code": "P0300", "resolved": True},
        ),
        Fact(
            type=FactType.OVERHEAT,
            timestamp=1001.0,
            value=110.5,
            severity="danger",
            confidence=1.0,
            details={"threshold": 105},
        ),
        Fact(
            type=FactType.LOW_VOLTAGE,
            timestamp=1002.0,
            value=12.1,
            severity="warning",
            confidence=0.9,
            details={"threshold_voltage": 13.0},
        ),
    ]


# ---------------------------------------------------------------------------
# _placeholder helper
# ---------------------------------------------------------------------------


class TestPlaceholder:
    """_placeholder detects cursor type correctly."""

    def test_sqlite_cursor_returns_question_mark(self, db):
        with db.cursor() as c:
            assert _placeholder(c) == "?"


# ---------------------------------------------------------------------------
# save_baselines
# ---------------------------------------------------------------------------


class TestSaveBaselines:
    """save_baselines writes correct rows via UPSERT."""

    def test_writes_correct_number_of_rows(self, db):
        store = _make_baseline_store()
        with db.cursor() as c:
            count = save_baselines(c, CLIENT, store)
        # city: az_std, total_vibration; highway: az_std → 3 rows
        assert count == 3

    def test_upsert_overwrites_existing_data(self, db):
        store = _make_baseline_store()
        with db.cursor() as c:
            save_baselines(c, CLIENT, store)

        # Update the store with more values
        store.update(DrivingRegime.CITY, {"az_std": 40.0})
        with db.cursor() as c:
            count = save_baselines(c, CLIENT, store)

        # Should still be 3 rows total (UPSERT, not INSERT)
        with db.cursor() as c:
            c.execute("SELECT COUNT(*) FROM anomaly_baselines WHERE client_hash = ?", (CLIENT,))
            total = c.fetchone()[0]
        assert total == 3
        assert count == 3

    def test_upsert_updates_values(self, db):
        store = _make_baseline_store()
        with db.cursor() as c:
            save_baselines(c, CLIENT, store)

        # Update with more data
        store.update(DrivingRegime.CITY, {"az_std": 40.0})
        with db.cursor() as c:
            save_baselines(c, CLIENT, store)

        # Verify the count field was updated (originally 3, now 4)
        with db.cursor() as c:
            c.execute(
                "SELECT count FROM anomaly_baselines WHERE client_hash = ? AND regime = ? AND feature = ?",
                (CLIENT, "city", "az_std"),
            )
            row = c.fetchone()
        assert row[0] == 4  # 3 original + 1 update


# ---------------------------------------------------------------------------
# load_baselines
# ---------------------------------------------------------------------------


class TestLoadBaselines:
    """load_baselines returns a properly reconstructed BaselineStore."""

    def test_empty_store_for_unknown_client(self, db):
        with db.cursor() as c:
            store = load_baselines(c, "nonexistent_client")
        assert len(store.baselines) == 0

    def test_roundtrip_preserves_count_mean_m2(self, db):
        original = _make_baseline_store()
        with db.cursor() as c:
            save_baselines(c, CLIENT, original)
        with db.cursor() as c:
            loaded = load_baselines(c, CLIENT)

        # Check city/az_std baseline matches
        orig_bl = original.get(DrivingRegime.CITY, "az_std")
        load_bl = loaded.get("city", "az_std")
        assert load_bl.count == orig_bl.count
        assert load_bl.mean == pytest.approx(orig_bl.mean)
        assert load_bl.m2 == pytest.approx(orig_bl.m2)

    def test_roundtrip_preserves_min_max(self, db):
        original = _make_baseline_store()
        with db.cursor() as c:
            save_baselines(c, CLIENT, original)
        with db.cursor() as c:
            loaded = load_baselines(c, CLIENT)

        orig_bl = original.get(DrivingRegime.CITY, "az_std")
        load_bl = loaded.get("city", "az_std")
        assert load_bl.min_val == pytest.approx(orig_bl.min_val)
        assert load_bl.max_val == pytest.approx(orig_bl.max_val)

    def test_roundtrip_preserves_all_regimes(self, db):
        original = _make_baseline_store()
        with db.cursor() as c:
            save_baselines(c, CLIENT, original)
        with db.cursor() as c:
            loaded = load_baselines(c, CLIENT)

        assert len(loaded.baselines) == len(original.baselines)
        # Both city and highway baselines should exist
        assert ("city", "az_std") in loaded.baselines
        assert ("highway", "az_std") in loaded.baselines
        assert ("city", "total_vibration") in loaded.baselines


# ---------------------------------------------------------------------------
# write_fact_log
# ---------------------------------------------------------------------------


class TestWriteFactLog:
    """write_fact_log writes facts with correct types and details."""

    def test_writes_all_facts(self, db):
        facts = _make_facts()
        with db.cursor() as c:
            count = write_fact_log(c, CLIENT, facts, tier="T1")
        assert count == 3
        with db.cursor() as c:
            c.execute("SELECT COUNT(*) FROM fact_log WHERE client_hash = ?", (CLIENT,))
            assert c.fetchone()[0] == 3

    def test_stores_correct_fact_types(self, db):
        facts = _make_facts()
        with db.cursor() as c:
            write_fact_log(c, CLIENT, facts, tier="T1")
        with db.cursor() as c:
            c.execute("SELECT fact_type FROM fact_log ORDER BY time")
            types = [row[0] for row in c.fetchall()]
        assert types == ["dtc_active", "overheat", "low_voltage"]

    def test_stores_details_as_json(self, db):
        facts = _make_facts()
        with db.cursor() as c:
            write_fact_log(c, CLIENT, facts, tier="T1")
        with db.cursor() as c:
            c.execute("SELECT details FROM fact_log WHERE fact_type = ?", ("dtc_active",))
            details_raw = c.fetchone()[0]
        details = json.loads(details_raw)
        assert details["dtc_code"] == "P0300"
        assert details["resolved"] is True

    def test_stores_tier_and_severity(self, db):
        facts = _make_facts()
        with db.cursor() as c:
            write_fact_log(c, CLIENT, facts, tier="T2")
        with db.cursor() as c:
            c.execute("SELECT tier, severity FROM fact_log WHERE fact_type = ?", ("overheat",))
            row = c.fetchone()
        assert row[0] == "T2"
        assert row[1] == "danger"


# ---------------------------------------------------------------------------
# write_anomaly_scores
# ---------------------------------------------------------------------------


class TestWriteAnomalyScores:
    """write_anomaly_scores stores health scores and features."""

    def _make_report(self):
        return {
            "health_scores": {
                "overall": 85,
                "suspension": 90,
                "engine": 75,
                "electrical": 95,
                "audio": 88,
            },
            "confidence": 0.82,
            "diagnoses": [
                {"rule_name": "fuel_trim_lean", "confidence": 78},
                {"rule_name": "bearing_wear", "confidence": 45},
            ],
        }

    def test_stores_all_five_scores(self, db):
        report = self._make_report()
        features = {"az_std": 0.5, "total_vibration": 1.2}
        with db.cursor() as c:
            write_anomaly_scores(c, CLIENT, report, features, "city")
        with db.cursor() as c:
            c.execute(
                "SELECT overall_score, suspension_score, engine_score, "
                "electrical_score, audio_score FROM anomaly_scores WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] == 85   # overall
        assert row[1] == 90   # suspension
        assert row[2] == 75   # engine
        assert row[3] == 95   # electrical
        assert row[4] == 88   # audio

    def test_stores_features_json(self, db):
        report = self._make_report()
        features = {"az_std": 0.5, "total_vibration": 1.2}
        with db.cursor() as c:
            write_anomaly_scores(c, CLIENT, report, features, "city")
        with db.cursor() as c:
            c.execute("SELECT features_json FROM anomaly_scores WHERE client_hash = ?", (CLIENT,))
            raw = c.fetchone()[0]
        parsed = json.loads(raw)
        assert parsed["az_std"] == pytest.approx(0.5)
        assert parsed["total_vibration"] == pytest.approx(1.2)

    def test_stores_top_diagnostic(self, db):
        report = self._make_report()
        features = {"az_std": 0.5}
        with db.cursor() as c:
            write_anomaly_scores(c, CLIENT, report, features, "highway")
        with db.cursor() as c:
            c.execute(
                "SELECT top_diagnostic, top_diagnostic_confidence FROM anomaly_scores "
                "WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] == "fuel_trim_lean"
        assert row[1] == 78

    def test_handles_empty_diagnoses(self, db):
        report = {
            "health_scores": {"overall": 100},
            "confidence": 0.0,
            "diagnoses": [],
        }
        features = {}
        with db.cursor() as c:
            write_anomaly_scores(c, CLIENT, report, features, "idle")
        with db.cursor() as c:
            c.execute(
                "SELECT top_diagnostic, top_diagnostic_confidence FROM anomaly_scores "
                "WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] is None
        assert row[1] == 0


# ---------------------------------------------------------------------------
# write_feedback
# ---------------------------------------------------------------------------


class TestWriteFeedback:
    """write_feedback writes user feedback to user_feedback table."""

    def test_writes_all_fields(self, db):
        with db.cursor() as c:
            write_feedback(
                c,
                CLIENT,
                rule_name="fuel_trim_lean",
                action="confirm",
                diagnosis_time="2026-04-07T12:00:00Z",
                comment="Yes, this matches my experience",
            )
        with db.cursor() as c:
            c.execute(
                "SELECT client_hash, rule_name, action, diagnosis_time, comment "
                "FROM user_feedback WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] == CLIENT
        assert row[1] == "fuel_trim_lean"
        assert row[2] == "confirm"
        assert row[3] == "2026-04-07T12:00:00Z"
        assert row[4] == "Yes, this matches my experience"

    def test_stores_action_and_handles_null_comment(self, db):
        with db.cursor() as c:
            write_feedback(c, CLIENT, rule_name="bearing_wear", action="dismiss")
        with db.cursor() as c:
            c.execute(
                "SELECT action, comment FROM user_feedback WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] == "dismiss"
        assert row[1] is None


# ---------------------------------------------------------------------------
# save_vehicle_profile / load_vehicle_profile
# ---------------------------------------------------------------------------


class TestSaveVehicleProfile:
    """save_vehicle_profile writes vehicle profile to DB."""

    def test_writes_to_db(self, db):
        profile = VehicleProfile(
            client_hash=CLIENT, brand="li_auto", model="L7", year=2023,
        )
        with db.cursor() as c:
            save_vehicle_profile(c, profile)
        with db.cursor() as c:
            c.execute(
                "SELECT brand, model, year FROM vehicle_profiles WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row[0] == "li_auto"
        assert row[1] == "L7"
        assert row[2] == 2023


class TestLoadVehicleProfile:
    """load_vehicle_profile returns a VehicleProfile or None."""

    def test_returns_vehicle_profile_object(self, db):
        profile = VehicleProfile(
            client_hash=CLIENT, brand="li_auto", model="L7", year=2023,
            vin="LFV123", engine_type="phev",
        )
        with db.cursor() as c:
            save_vehicle_profile(c, profile)
        with db.cursor() as c:
            loaded = load_vehicle_profile(c, CLIENT)
        assert isinstance(loaded, VehicleProfile)
        assert loaded.brand == "li_auto"
        assert loaded.model == "L7"
        assert loaded.year == 2023
        assert loaded.vin == "LFV123"
        assert loaded.engine_type == "phev"

    def test_returns_none_for_unknown_client(self, db):
        with db.cursor() as c:
            loaded = load_vehicle_profile(c, "nonexistent_hash")
        assert loaded is None

    def test_roundtrip_preserves_all_fields_including_modifications(self, db):
        mods = {"euro2_removed_cat": True, "fuel_type": "lpg", "custom_exhaust": "borla"}
        profile = VehicleProfile(
            client_hash=CLIENT,
            brand="toyota",
            model="Camry",
            year=2019,
            vin="JTDBR123456",
            generation="XV70",
            engine_code="2AR-FE",
            engine_type="ice",
            mileage_km=85000,
            platform="TNGA-K",
            modifications=mods,
        )
        with db.cursor() as c:
            save_vehicle_profile(c, profile)
        with db.cursor() as c:
            loaded = load_vehicle_profile(c, CLIENT)

        assert loaded.client_hash == CLIENT
        assert loaded.brand == "toyota"
        assert loaded.model == "Camry"
        assert loaded.year == 2019
        assert loaded.vin == "JTDBR123456"
        assert loaded.generation == "XV70"
        assert loaded.engine_code == "2AR-FE"
        assert loaded.engine_type == "ice"
        assert loaded.mileage_km == 85000
        assert loaded.platform == "TNGA-K"
        assert loaded.modifications == mods


# ---------------------------------------------------------------------------
# write_dtc_events
# ---------------------------------------------------------------------------


class TestWriteDtcEvents:
    """write_dtc_events writes DTC events to dtc_events table."""

    def test_writes_correct_number_of_rows(self, db):
        codes = ["P0300", "P0171", "P0420"]
        with db.cursor() as c:
            count = write_dtc_events(c, CLIENT, codes)
        assert count == 3
        with db.cursor() as c:
            c.execute(
                "SELECT COUNT(*) FROM dtc_events WHERE client_hash = ?", (CLIENT,),
            )
            assert c.fetchone()[0] == 3

    def test_stores_freeze_frame_as_json(self, db):
        codes = ["P0300"]
        freeze = {"rpm": 2500, "speed": 60, "coolant_temp": 90, "voltage": 14.2}
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, codes, freeze_frame=freeze)
        with db.cursor() as c:
            c.execute(
                "SELECT freeze_frame FROM dtc_events WHERE client_hash = ?", (CLIENT,),
            )
            raw = c.fetchone()[0]
        parsed = json.loads(raw)
        assert parsed["rpm"] == 2500
        assert parsed["speed"] == 60
        assert parsed["coolant_temp"] == 90
        assert parsed["voltage"] == pytest.approx(14.2)

    def test_handles_empty_dtc_codes_list(self, db):
        with db.cursor() as c:
            count = write_dtc_events(c, CLIENT, [])
        assert count == 0
        with db.cursor() as c:
            c.execute(
                "SELECT COUNT(*) FROM dtc_events WHERE client_hash = ?", (CLIENT,),
            )
            assert c.fetchone()[0] == 0


# ---------------------------------------------------------------------------
# read_freeze_frames
# ---------------------------------------------------------------------------


class TestReadFreezeFrames:
    """read_freeze_frames reads freeze frame data for DTC codes."""

    def test_returns_freeze_frame_for_existing_dtc(self, db):
        freeze = {"rpm": 2500, "speed": 60, "coolant_temp": 90, "voltage": 14.2}
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, ["P0300"], freeze_frame=freeze)
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, ["P0300"])
        assert "P0300" in result
        assert result["P0300"]["rpm"] == 2500
        assert result["P0300"]["speed"] == 60
        assert result["P0300"]["coolant_temp"] == 90
        assert result["P0300"]["voltage"] == pytest.approx(14.2)
        assert "timestamp" in result["P0300"]

    def test_returns_empty_for_unknown_dtc(self, db):
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, ["P9999"])
        assert result == {}

    def test_returns_empty_for_empty_dtc_list(self, db):
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, [])
        assert result == {}

    def test_returns_most_recent_freeze_frame(self, db):
        freeze_old = {"rpm": 800, "speed": 0}
        freeze_new = {"rpm": 3000, "speed": 100}
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, ["P0171"], freeze_frame=freeze_old)
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, ["P0171"], freeze_frame=freeze_new)
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, ["P0171"])
        assert result["P0171"]["rpm"] == 3000
        assert result["P0171"]["speed"] == 100

    def test_returns_multiple_dtc_freeze_frames(self, db):
        freeze1 = {"rpm": 1000}
        freeze2 = {"rpm": 2000}
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, ["P0300"], freeze_frame=freeze1)
            write_dtc_events(c, CLIENT, ["P0420"], freeze_frame=freeze2)
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, ["P0300", "P0420"])
        assert result["P0300"]["rpm"] == 1000
        assert result["P0420"]["rpm"] == 2000

    def test_skips_dtc_without_freeze_frame(self, db):
        with db.cursor() as c:
            write_dtc_events(c, CLIENT, ["P0300"])  # no freeze_frame
        with db.cursor() as c:
            result = read_freeze_frames(c, CLIENT, ["P0300"])
        assert result == {}
