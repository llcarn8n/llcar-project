"""Tests for DB connection layer — MockDB and get_cursor."""
import sqlite3
import pytest

from diagnostic.db import MockDB, get_cursor


# ---------------------------------------------------------------------------
# MockDB setup
# ---------------------------------------------------------------------------

EXPECTED_TABLES = [
    "anomaly_baselines",
    "diagnostic_persistence",
    "fact_log",
    "user_feedback",
    "anomaly_scores",
    "correlation_results",
    "vehicle_profiles",
]


class TestMockDBSetup:
    """MockDB.setup() creates all required tables."""

    def test_setup_creates_all_seven_tables(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            tables = [row[0] for row in c.fetchall()]
        for t in EXPECTED_TABLES:
            assert t in tables, f"Table '{t}' not created by MockDB.setup()"
        db.teardown()

    def test_setup_is_idempotent(self):
        """Calling setup() twice does not raise."""
        db = MockDB()
        db.setup()
        db.setup()
        db.teardown()


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------


class TestMockDBCrud:
    """Basic INSERT / SELECT through MockDB cursor."""

    def test_insert_and_select_anomaly_baselines(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "INSERT INTO anomaly_baselines (client_hash, regime, feature, count, mean) "
                "VALUES (?, ?, ?, ?, ?)",
                ("abc123", "city", "accel_rms", 10, 0.42),
            )
        with db.cursor() as c:
            c.execute(
                "SELECT client_hash, regime, feature, count, mean FROM anomaly_baselines"
            )
            row = c.fetchone()
        assert row[0] == "abc123"
        assert row[1] == "city"
        assert row[2] == "accel_rms"
        assert row[3] == 10
        assert row[4] == pytest.approx(0.42)
        db.teardown()

    def test_insert_and_select_correlation_results(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "INSERT INTO correlation_results "
                "(time, client_hash, trip_id, correlation_type, r_value, slope, p_value, data_points, regime, diagnosis_hint) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("2026-04-07T10:00:00Z", "abc123", "trip_1", "accel_audio", 0.85, 1.2, 0.001, 100, "highway", "bearing_wear"),
            )
        with db.cursor() as c:
            c.execute("SELECT * FROM correlation_results")
            row = c.fetchone()
        assert row is not None
        db.teardown()


# ---------------------------------------------------------------------------
# Constraint tests
# ---------------------------------------------------------------------------


class TestMockDBConstraints:
    """UNIQUE and PRIMARY KEY constraints behave correctly."""

    def test_anomaly_baselines_unique_constraint(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "INSERT INTO anomaly_baselines (client_hash, regime, feature) "
                "VALUES (?, ?, ?)",
                ("abc", "city", "accel_rms"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            with db.cursor() as c:
                c.execute(
                    "INSERT INTO anomaly_baselines (client_hash, regime, feature) "
                    "VALUES (?, ?, ?)",
                    ("abc", "city", "accel_rms"),
                )
        db.teardown()

    def test_diagnostic_persistence_primary_key(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "INSERT INTO diagnostic_persistence (client_hash, rule_name) "
                "VALUES (?, ?)",
                ("abc", "fuel_trim_lean"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            with db.cursor() as c:
                c.execute(
                    "INSERT INTO diagnostic_persistence (client_hash, rule_name) "
                    "VALUES (?, ?)",
                    ("abc", "fuel_trim_lean"),
                )
        db.teardown()

    def test_vehicle_profiles_primary_key(self):
        db = MockDB()
        db.setup()
        with db.cursor() as c:
            c.execute(
                "INSERT INTO vehicle_profiles (client_hash, brand, model) "
                "VALUES (?, ?, ?)",
                ("abc", "Li", "L7"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            with db.cursor() as c:
                c.execute(
                    "INSERT INTO vehicle_profiles (client_hash, brand, model) "
                    "VALUES (?, ?, ?)",
                    ("abc", "Li", "L7"),
                )
        db.teardown()


# ---------------------------------------------------------------------------
# get_cursor without Django
# ---------------------------------------------------------------------------


class TestGetCursor:
    """get_cursor() raises RuntimeError when Django is not available."""

    def test_raises_without_django(self):
        with pytest.raises(RuntimeError, match="Django not available"):
            with get_cursor() as c:
                pass


# ---------------------------------------------------------------------------
# Auto-commit behavior
# ---------------------------------------------------------------------------


class TestMockDBAutoCommit:
    """Cursor context manager auto-commits on exit."""

    def test_cursor_auto_commits(self):
        db = MockDB()
        db.setup()
        # Insert via one cursor context
        with db.cursor() as c:
            c.execute(
                "INSERT INTO fact_log (time, client_hash, fact_type) VALUES (?, ?, ?)",
                ("2026-04-07", "abc", "dtc"),
            )
        # Read from a fresh cursor — data should be committed
        with db.cursor() as c:
            c.execute("SELECT COUNT(*) FROM fact_log")
            assert c.fetchone()[0] == 1
        db.teardown()


# ---------------------------------------------------------------------------
# Teardown
# ---------------------------------------------------------------------------


class TestMockDBTeardown:
    """teardown() closes the connection."""

    def test_teardown_closes_connection(self):
        db = MockDB()
        db.setup()
        db.teardown()
        with pytest.raises(Exception):
            db.conn.execute("SELECT 1")
