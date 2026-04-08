"""DB connection layer — wraps Django's 'vehinfo' PostgreSQL connection.

For tests: use MockDB context manager that provides an in-memory SQLite fallback.
"""
from __future__ import annotations

import contextlib
import json
from typing import Any, Generator

try:
    from django.db import connections
    _HAS_DJANGO = True
except ImportError:
    _HAS_DJANGO = False


@contextlib.contextmanager
def get_cursor() -> Generator:
    """Yield a DB cursor for the vehinfo database."""
    if not _HAS_DJANGO:
        raise RuntimeError("Django not available — use MockDB for testing")
    conn = connections['vehinfo']
    with conn.cursor() as cursor:
        yield cursor


class MockDB:
    """In-memory SQLite database for testing without PostgreSQL.

    Usage:
        mock = MockDB()
        mock.setup()
        with mock.cursor() as c:
            c.execute("INSERT INTO ...")
        mock.teardown()
    """

    def __init__(self):
        import sqlite3
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row

    def setup(self):
        """Create all diagnostic tables in SQLite (simplified, no TimescaleDB)."""
        c = self.conn.cursor()

        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_baselines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_hash TEXT NOT NULL,
            regime TEXT NOT NULL,
            feature TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            mean REAL DEFAULT 0,
            m2 REAL DEFAULT 0,
            min_val REAL DEFAULT 1e18,
            max_val REAL DEFAULT -1e18,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(client_hash, regime, feature)
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS diagnostic_persistence (
            client_hash TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            consecutive_count INTEGER DEFAULT 0,
            first_triggered TEXT,
            last_triggered TEXT,
            max_confidence INTEGER DEFAULT 0,
            escalation_level INTEGER DEFAULT 0,
            user_dismissed_at TEXT,
            PRIMARY KEY(client_hash, rule_name)
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS fact_log (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            fact_type TEXT NOT NULL,
            severity TEXT,
            confidence REAL,
            tier TEXT,
            details TEXT
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            client_hash TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            diagnosis_time TEXT,
            action TEXT NOT NULL,
            comment TEXT
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_scores (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            regime TEXT,
            overall_score INTEGER,
            suspension_score INTEGER,
            engine_score INTEGER,
            electrical_score INTEGER,
            audio_score INTEGER,
            confidence REAL,
            top_diagnostic TEXT,
            top_diagnostic_confidence INTEGER DEFAULT 0,
            features_json TEXT,
            cusum_short TEXT,
            cusum_medium TEXT,
            cusum_long TEXT,
            degradation_detected INTEGER DEFAULT 0
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS correlation_results (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            trip_id TEXT,
            correlation_type TEXT NOT NULL,
            r_value REAL,
            slope REAL,
            p_value REAL,
            data_points INTEGER,
            regime TEXT,
            diagnosis_hint TEXT
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS vehicle_profiles (
            client_hash TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            vin TEXT,
            generation TEXT,
            engine_code TEXT,
            engine_type TEXT DEFAULT 'ice',
            mileage_km INTEGER DEFAULT 0,
            platform TEXT,
            modifications TEXT DEFAULT '{}'
        )""")

        c.execute("""CREATE TABLE IF NOT EXISTS dtc_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            dtc_code TEXT NOT NULL,
            ecu TEXT,
            freeze_frame TEXT,
            occurrences INTEGER DEFAULT 1,
            resolved_at TEXT
        )""")

        self.conn.commit()

    @contextlib.contextmanager
    def cursor(self):
        """Yield an SQLite cursor, auto-commit on exit."""
        c = self.conn.cursor()
        try:
            yield c
            self.conn.commit()
        finally:
            pass

    def teardown(self):
        """Close the in-memory database."""
        self.conn.close()
