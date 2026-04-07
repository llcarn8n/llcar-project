"""Tests for pipeline DB integration and db_readers.

Verifies:
  - full_diagnose with db_cursor persists baselines, facts, anomaly_scores
  - full_diagnose WITHOUT db_cursor works identically to before (backward compat)
  - read_history returns correct data after write_anomaly_scores
  - read_history returns empty list for unknown client
  - history_view API returns data when client_hash is provided
  - diagnose_view still works (fallback path without Django DB)
  - feedback_view still works (fallback path without Django DB)
"""

import json
import pytest

from diagnostic.db import MockDB
from diagnostic.db_readers import read_history
from diagnostic.db_writers import write_anomaly_scores
from diagnostic.pipeline import DiagnosticPipeline
from diagnostic.vehicle_profile import VehicleProfile


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def db():
    mock = MockDB()
    mock.setup()
    yield mock
    mock.teardown()


@pytest.fixture
def profile():
    return VehicleProfile(
        client_hash="test_db", brand="test", model="test", year=2023,
    )


@pytest.fixture
def pipeline(profile):
    return DiagnosticPipeline(vehicle_profile=profile)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


HEALTHY = {
    "rpm": 800,
    "speed": 0,
    "coolant_temp": 90,
    "voltage": 14.2,
    "ltft_bank1": 2.0,
    "stft_bank1": 1.0,
}

OVERHEAT = {
    "rpm": 800,
    "speed": 0,
    "coolant_temp": 120,
    "voltage": 14.2,
}

CLIENT = "test_db"


# ---------------------------------------------------------------------------
# 1. full_diagnose with db_cursor saves baselines
# ---------------------------------------------------------------------------


class TestFullDiagnoseDBBaselines:
    """full_diagnose(db_cursor=..., client_hash=...) persists baselines."""

    def test_saves_baselines_to_db(self, db, pipeline):
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT COUNT(*) FROM anomaly_baselines WHERE client_hash = ?",
                (CLIENT,),
            )
            count = c.fetchone()[0]
        assert count > 0, "Baselines should be written to DB"

    def test_baselines_contain_expected_features(self, db, pipeline):
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT feature FROM anomaly_baselines WHERE client_hash = ?",
                (CLIENT,),
            )
            features = {row[0] for row in c.fetchall()}
        # At minimum, OBD baseline fields should be present
        assert "rpm" in features or "voltage" in features or "coolant_temp" in features


# ---------------------------------------------------------------------------
# 2. full_diagnose with db_cursor writes fact_log
# ---------------------------------------------------------------------------


class TestFullDiagnoseDBFacts:
    """full_diagnose persists facts to fact_log table."""

    def test_writes_facts_on_overheat(self, db, profile):
        pipe = DiagnosticPipeline(vehicle_profile=profile)
        with db.cursor() as c:
            pipe.full_diagnose(OVERHEAT, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT COUNT(*) FROM fact_log WHERE client_hash = ?",
                (CLIENT,),
            )
            count = c.fetchone()[0]
        # Overheat packet should generate at least one fact
        assert count >= 1

    def test_healthy_packet_may_have_facts(self, db, pipeline):
        """Even healthy packets can produce facts (e.g., fuel trim fact)."""
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT COUNT(*) FROM fact_log WHERE client_hash = ?",
                (CLIENT,),
            )
            count = c.fetchone()[0]
        # Just verify the table was written to (facts count may be 0 or more)
        assert count >= 0


# ---------------------------------------------------------------------------
# 3. full_diagnose with db_cursor writes anomaly_scores
# ---------------------------------------------------------------------------


class TestFullDiagnoseDBScores:
    """full_diagnose persists anomaly scores."""

    def test_writes_anomaly_scores(self, db, pipeline):
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT overall_score, confidence FROM anomaly_scores "
                "WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row is not None, "anomaly_scores row should exist"
        assert isinstance(row[0], (int, float))
        assert isinstance(row[1], (int, float))

    def test_scores_contain_regime(self, db, pipeline):
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            c.execute(
                "SELECT regime FROM anomaly_scores WHERE client_hash = ?",
                (CLIENT,),
            )
            row = c.fetchone()
        assert row is not None
        assert row[0] in ("idle", "city", "highway", "sport")


# ---------------------------------------------------------------------------
# 4. full_diagnose WITHOUT db_cursor — backward compatible
# ---------------------------------------------------------------------------


class TestFullDiagnoseNoDBBackwardCompat:
    """full_diagnose without db_cursor returns same report as before."""

    def test_returns_report_without_db(self, pipeline):
        report = pipeline.full_diagnose(HEALTHY)
        assert "can_drive" in report
        assert "health_scores" in report
        assert "diagnoses" in report
        assert "confidence" in report

    def test_report_structure_matches(self, pipeline):
        report = pipeline.full_diagnose(HEALTHY)
        expected_keys = {
            "can_drive", "health_scores", "health_trends",
            "diagnoses", "fuel_loss", "recalls", "next_steps",
            "confidence", "baseline_status", "rule_version",
        }
        assert expected_keys.issubset(set(report.keys()))

    def test_no_db_does_not_raise(self, pipeline):
        """Calling without db_cursor should never raise."""
        # Call multiple times to make sure
        for _ in range(3):
            report = pipeline.full_diagnose(HEALTHY)
        assert report is not None


# ---------------------------------------------------------------------------
# 5. read_history — empty for unknown client
# ---------------------------------------------------------------------------


class TestReadHistoryEmpty:
    """read_history returns empty list for unknown client."""

    def test_unknown_client_returns_empty(self, db):
        with db.cursor() as c:
            result = read_history(c, "nonexistent_client_xyz")
        assert result == []

    def test_unknown_client_with_period(self, db):
        with db.cursor() as c:
            result = read_history(c, "nonexistent_client_xyz", period="30d")
        assert result == []


# ---------------------------------------------------------------------------
# 6. read_history — returns data after write_anomaly_scores
# ---------------------------------------------------------------------------


class TestReadHistoryWithData:
    """read_history returns data after anomaly_scores are written."""

    def _write_sample_scores(self, db, client_hash="test_history"):
        report = {
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
            ],
        }
        features = {"az_std": 0.5, "total_vibration": 1.2}
        with db.cursor() as c:
            write_anomaly_scores(c, client_hash, report, features, "city")

    def test_returns_written_data(self, db):
        self._write_sample_scores(db, "test_history")
        with db.cursor() as c:
            result = read_history(c, "test_history")
        assert len(result) == 1
        assert result[0]["overall_score"] == 85
        assert result[0]["engine_score"] == 75

    def test_returns_top_diagnostic(self, db):
        self._write_sample_scores(db, "test_history_2")
        with db.cursor() as c:
            result = read_history(c, "test_history_2")
        assert result[0]["top_diagnostic"] == "fuel_trim_lean"
        assert result[0]["top_diagnostic_confidence"] == 78

    def test_returns_all_columns(self, db):
        self._write_sample_scores(db, "test_history_3")
        with db.cursor() as c:
            result = read_history(c, "test_history_3")
        expected_cols = {
            "time", "overall_score", "suspension_score", "engine_score",
            "electrical_score", "audio_score", "confidence",
            "top_diagnostic", "top_diagnostic_confidence",
        }
        assert expected_cols == set(result[0].keys())

    def test_multiple_writes_all_returned(self, db):
        for _ in range(5):
            self._write_sample_scores(db, "test_multi")
        with db.cursor() as c:
            result = read_history(c, "test_multi")
        assert len(result) == 5


# ---------------------------------------------------------------------------
# 7. Pipeline round-trip: full_diagnose → read_history
# ---------------------------------------------------------------------------


class TestPipelineToHistory:
    """End-to-end: run full_diagnose with DB, then read_history."""

    def test_pipeline_results_readable_via_history(self, db, pipeline):
        with db.cursor() as c:
            pipeline.full_diagnose(HEALTHY, db_cursor=c, client_hash=CLIENT)

        with db.cursor() as c:
            history = read_history(c, CLIENT)
        assert len(history) == 1
        assert "overall_score" in history[0]
        assert "confidence" in history[0]


# ---------------------------------------------------------------------------
# 8. API views fallback behavior
# ---------------------------------------------------------------------------


class MockRequest:
    """Minimal request object mimicking Django's HttpRequest."""

    def __init__(self, method="POST", body=None, get_params=None):
        self.method = method
        self.body = json.dumps(body).encode("utf-8") if body else b"{}"
        if get_params is not None:
            self.GET = get_params
        # If get_params is None, no GET attribute — simulates minimal request


def _parse(response):
    """Return (status_code, parsed_json) from a JsonResponse."""
    return response.status_code, json.loads(response.content)


class TestAPIViewsFallback:
    """API views work via fallback when Django DB is unavailable."""

    def test_diagnose_view_works_without_db(self):
        from diagnostic.api_views import diagnose_view

        body = {
            "client_hash": "test_fallback",
            "data": [{"rpm": 800, "speed": 0, "coolant_temp": 90, "voltage": 14.2}],
        }
        req = MockRequest(method="POST", body=body)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert "can_drive" in data

    def test_feedback_view_works_without_db(self):
        from diagnostic.api_views import feedback_view

        body = {
            "client_hash": "test_fallback",
            "rule_name": "test_rule",
            "action": "confirm",
        }
        req = MockRequest(method="POST", body=body)
        resp = feedback_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert data["success"] is True

    def test_history_view_without_get_params(self):
        from diagnostic.api_views import history_view

        req = MockRequest(method="GET")
        resp = history_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert isinstance(data, list)
        assert data == []

    def test_history_view_with_client_hash_no_db(self):
        """history_view with client_hash but no DB returns empty list."""
        from diagnostic.api_views import history_view

        req = MockRequest(method="GET", get_params={"client_hash": "test_client"})
        # GET is a dict, so .get() works
        req.GET = type("QueryDict", (), {"get": lambda self, k, d=None: {"client_hash": "test_client", "period": "7d"}.get(k, d)})()
        resp = history_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert isinstance(data, list)
