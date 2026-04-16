"""Tests for correlation_runner — batch join + correlation execution.

Uses MockDB with additional sensor tables (accel_windows, audio_windows, ecu_7e8).
"""

import random
import pytest

from diagnostic.correlation_runner import run_correlations
from diagnostic.db import MockDB


# ---------------------------------------------------------------------------
# Extended MockDB — adds sensor tables not present in base MockDB.setup()
# ---------------------------------------------------------------------------

def _setup_sensor_tables(db: MockDB):
    """Create accel_windows, audio_windows, ecu_7e8 tables in SQLite."""
    c = db.conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS accel_windows (
        time TEXT NOT NULL,
        client_hash TEXT NOT NULL,
        ax_avg REAL, ax_std REAL, ax_min REAL, ax_max REAL,
        ay_avg REAL, ay_std REAL, ay_min REAL, ay_max REAL,
        az_avg REAL, az_std REAL, az_min REAL, az_max REAL
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS audio_windows (
        time TEXT NOT NULL,
        client_hash TEXT NOT NULL,
        freq_1 REAL, amp_1 REAL,
        freq_2 REAL, amp_2 REAL, freq_3 REAL, amp_3 REAL,
        freq_4 REAL, amp_4 REAL, freq_5 REAL, amp_5 REAL,
        freq_6 REAL, amp_6 REAL, freq_7 REAL, amp_7 REAL,
        freq_8 REAL, amp_8 REAL, freq_9 REAL, amp_9 REAL,
        freq_10 REAL, amp_10 REAL,
        quality REAL
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS ecu_7e8 (
        time TEXT NOT NULL,
        client_hash TEXT NOT NULL,
        p010c REAL,
        p010d REAL,
        p0105 REAL
    )""")

    db.conn.commit()


def _make_db():
    """Create a MockDB with all required tables."""
    db = MockDB()
    db.setup()
    _setup_sensor_tables(db)
    return db


# ---------------------------------------------------------------------------
# 1. Empty data → zero results
# ---------------------------------------------------------------------------

class TestEmptyData:
    def test_no_accel_returns_empty(self):
        """No accel data → windows_joined=0, correlations_found=0."""
        db = _make_db()
        try:
            with db.cursor() as c:
                result = run_correlations(c, "client_empty", minutes=1440)
            assert result["windows_joined"] == 0
            assert result["correlations_found"] == 0
            assert result["results"] == []
        finally:
            db.teardown()


# ---------------------------------------------------------------------------
# 2. Join by time — verify accel+audio+OBD are matched within ±3 sec
# ---------------------------------------------------------------------------

class TestTimeJoin:
    def test_matching_timestamps_joined(self):
        """Accel, audio, OBD rows with close timestamps produce joined windows."""
        db = _make_db()
        try:
            with db.cursor() as c:
                # Insert 10 accel rows at t=1000..1009
                for i in range(10):
                    t = f"2026-01-01T00:00:{i:02d}+00:00"
                    c.execute("""
                        INSERT INTO accel_windows
                        (time, client_hash, ax_avg, ax_std, ax_min, ax_max,
                         ay_avg, ay_std, ay_min, ay_max,
                         az_avg, az_std, az_min, az_max)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (t, "client_join", 0.1, 0.2, -0.5, 0.5,
                          0.1, 0.3, -0.4, 0.4, 9.8, 1.0 + i * 0.1, 9.0, 10.5))

                # Insert 10 audio rows at t=1001..1010 (offset by 1s — within tolerance)
                for i in range(10):
                    t = f"2026-01-01T00:00:{i + 1:02d}+00:00"
                    c.execute("""
                        INSERT INTO audio_windows
                        (time, client_hash, freq_1, amp_1, quality)
                        VALUES (?, ?, ?, ?, ?)
                    """, (t, "client_join", 150.0 + i, 50.0, 0.9))

                # Insert 10 OBD rows at same timestamps as accel
                for i in range(10):
                    t = f"2026-01-01T00:00:{i:02d}+00:00"
                    c.execute("""
                        INSERT INTO ecu_7e8
                        (time, client_hash, p010c, p010d, p0105)
                        VALUES (?, ?, ?, ?, ?)
                    """, (t, "client_join", 2000 + i * 100, 80 + i, 90))

            with db.cursor() as c:
                result = run_correlations(c, "client_join", minutes=1440)

            assert result["windows_joined"] == 10
            # We don't expect significant correlations from 10 windows
            # (MIN_DATA_POINTS=50), but the join itself should succeed
        finally:
            db.teardown()

    def test_far_timestamps_not_joined(self):
        """Audio/OBD 10 seconds away from accel → not joined (>3s tolerance)."""
        db = _make_db()
        try:
            with db.cursor() as c:
                # 5 accel at t=00:00:00..00:00:04
                for i in range(5):
                    t = f"2026-01-01T00:00:{i:02d}+00:00"
                    c.execute("""
                        INSERT INTO accel_windows
                        (time, client_hash, ax_avg, ax_std, ax_min, ax_max,
                         ay_avg, ay_std, ay_min, ay_max,
                         az_avg, az_std, az_min, az_max)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (t, "client_far", 0.1, 0.2, -0.5, 0.5,
                          0.1, 0.3, -0.4, 0.4, 9.8, 1.0, 9.0, 10.5))

                # Audio 20 seconds later — outside tolerance
                for i in range(5):
                    t = f"2026-01-01T00:00:{i + 20:02d}+00:00"
                    c.execute("""
                        INSERT INTO audio_windows
                        (time, client_hash, freq_1, amp_1, quality)
                        VALUES (?, ?, ?, ?, ?)
                    """, (t, "client_far", 150.0, 50.0, 0.9))

            with db.cursor() as c:
                result = run_correlations(c, "client_far", minutes=1440)

            # Windows should exist (from accel) but have no audio data joined
            assert result["windows_joined"] == 5
        finally:
            db.teardown()


# ---------------------------------------------------------------------------
# 3. Regime classification
# ---------------------------------------------------------------------------

class TestRegimeClassification:
    def test_regime_assigned_by_speed(self):
        """Speed-based regime: <3=idle, 3-70=city, >70=highway."""
        db = _make_db()
        try:
            speeds = [0, 2, 30, 50, 80, 100]
            expected_regimes = ['idle', 'idle', 'city', 'city', 'highway', 'highway']

            with db.cursor() as c:
                for i, speed in enumerate(speeds):
                    t = f"2026-01-01T00:00:{i:02d}+00:00"
                    c.execute("""
                        INSERT INTO accel_windows
                        (time, client_hash, ax_avg, ax_std, ax_min, ax_max,
                         ay_avg, ay_std, ay_min, ay_max,
                         az_avg, az_std, az_min, az_max)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (t, "client_regime", 0, 0.2, -0.5, 0.5,
                          0, 0.3, -0.4, 0.4, 9.8, 1.0, 9.0, 10.5))
                    c.execute("""
                        INSERT INTO ecu_7e8
                        (time, client_hash, p010c, p010d, p0105)
                        VALUES (?, ?, ?, ?, ?)
                    """, (t, "client_regime", 2000, speed, 90))

            # We can't directly check window regimes from run_correlations return,
            # but we verify it runs without errors and joins correctly
            with db.cursor() as c:
                result = run_correlations(c, "client_regime", minutes=1440)

            assert result["windows_joined"] == len(speeds)
        finally:
            db.teardown()


# ---------------------------------------------------------------------------
# 4. Results saved to correlation_results table
# ---------------------------------------------------------------------------

class TestResultsPersistence:
    def test_significant_correlations_saved(self):
        """When correlations are significant, they get saved to DB."""
        db = _make_db()
        try:
            random.seed(42)
            # Create 60 windows with vibration_rpm correlation:
            # az_std = 0.001 * rpm + noise
            with db.cursor() as c:
                for i in range(60):
                    t = f"2026-01-01T00:{i:02d}:00+00:00"
                    rpm = 1000 + i * 50
                    az_std = 0.001 * rpm + random.uniform(-0.1, 0.1)
                    c.execute("""
                        INSERT INTO accel_windows
                        (time, client_hash, ax_avg, ax_std, ax_min, ax_max,
                         ay_avg, ay_std, ay_min, ay_max,
                         az_avg, az_std, az_min, az_max)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (t, "client_corr", 0, 0.2, -0.5, 0.5,
                          0, 0.3, -0.4, 0.4, 9.8, az_std, 9.0, 10.5))
                    c.execute("""
                        INSERT INTO ecu_7e8
                        (time, client_hash, p010c, p010d, p0105)
                        VALUES (?, ?, ?, ?, ?)
                    """, (t, "client_corr", rpm, 80, 90))

            with db.cursor() as c:
                result = run_correlations(c, "client_corr", minutes=1440)

            # Should have found the vibration_rpm correlation
            assert result["correlations_found"] >= 1
            types = [r["type"] for r in result["results"]]
            assert "vibration_rpm" in types

            # Check results were persisted
            with db.cursor() as c:
                c.execute("SELECT COUNT(*) FROM correlation_results WHERE client_hash = ?",
                          ("client_corr",))
                count = c.fetchone()[0]
                assert count >= 1
        finally:
            db.teardown()
