"""Tests for S3 shadow validation tooling.

Covers:
  - diagnostic.api_views._compute_shadow_metrics (direct sqlite cursor)
  - diagnostic.api_views.shadow_metrics_view (query param parsing)
  - diagnostic.scripts.promote_shadow_rule (JSON + Python promotion)
"""
from __future__ import annotations

import json
import sqlite3

import pytest

from diagnostic.api_views import (
    _compute_shadow_metrics,
    _iso_days_between,
    _pearson_r,
    shadow_metrics_view,
)


# ---------------------------------------------------------------------------
# Fixtures & helpers
# ---------------------------------------------------------------------------

class MockGetRequest:
    """Mimics Django HttpRequest for GET endpoints."""

    def __init__(self, params=None):
        self.method = "GET"

        class _GET:
            def __init__(self, p):
                self._p = p or {}

            def get(self, key, default=None):
                return self._p.get(key, default)

        self.GET = _GET(params)


@pytest.fixture
def sqlite_cursor():
    """In-memory sqlite cursor pre-loaded with shadow_rule_log + eusama_tests."""
    conn = sqlite3.connect(":memory:")
    c = conn.cursor()
    c.execute("""CREATE TABLE shadow_rule_log (
        time TEXT NOT NULL, client_hash TEXT NOT NULL, rule_name TEXT NOT NULL,
        confidence REAL, conditions_met INTEGER, conditions_total INTEGER,
        features_snapshot TEXT
    )""")
    c.execute("""CREATE TABLE eusama_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_hash TEXT, time TEXT,
        front_left REAL, front_right REAL, rear_left REAL, rear_right REAL,
        pass_threshold REAL DEFAULT 40.0, notes TEXT
    )""")
    c.execute("""CREATE TABLE diagnosis_results (
        time TEXT, client_hash TEXT, rule_name TEXT, confidence REAL
    )""")
    conn.commit()
    yield c
    conn.close()


# ---------------------------------------------------------------------------
# Pearson helper
# ---------------------------------------------------------------------------

class TestPearsonR:
    def test_perfect_positive(self):
        assert _pearson_r([1, 2, 3], [2, 4, 6]) == pytest.approx(1.0)

    def test_perfect_negative(self):
        assert _pearson_r([1, 2, 3], [3, 2, 1]) == pytest.approx(-1.0)

    def test_uncorrelated_zero(self):
        # symmetric around mean — дает r=0
        r = _pearson_r([1, 2, 3, 4], [1, -1, 1, -1])
        assert abs(r) < 0.5

    def test_too_few_points(self):
        assert _pearson_r([1], [1]) is None

    def test_zero_variance(self):
        assert _pearson_r([1, 1, 1], [1, 2, 3]) is None


class TestDaysBetween:
    def test_iso_strings(self):
        d = _iso_days_between(
            "2026-04-01T00:00:00", "2026-04-08T12:00:00"
        )
        assert d == pytest.approx(7.5, abs=0.01)

    def test_invalid_returns_none(self):
        assert _iso_days_between("not-a-date", "2026-04-08") is None


# ---------------------------------------------------------------------------
# _compute_shadow_metrics via direct sqlite cursor
# ---------------------------------------------------------------------------

class TestComputeShadowMetrics:
    def test_empty_returns_zero_triggers(self, sqlite_cursor):
        m = _compute_shadow_metrics(
            sqlite_cursor, "some_rule", 30, 40.0, None
        )
        assert m["trigger_count"] == 0
        assert m["unique_clients"] == 0
        assert m["mean_confidence"] is None

    def test_triggers_without_eusama(self, sqlite_cursor):
        sqlite_cursor.execute(
            "INSERT INTO shadow_rule_log VALUES (?,?,?,?,?,?,?)",
            ("2026-04-10", "c1", "rule_x", 70.0, 2, 3, "{}"),
        )
        m = _compute_shadow_metrics(
            sqlite_cursor, "rule_x", 30, 40.0, None
        )
        assert m["trigger_count"] == 1
        assert m["unique_clients"] == 1
        assert m["mean_confidence"] == 70.0
        assert m["pairs_with_eusama"] == 0

    def test_pairs_precision_and_fpr_full_flow(self, sqlite_cursor):
        # 4 клиента: 2 с плохим EUSAMA (min_we < 40), 2 "чистых"
        shadow = [
            ("c1", 80.0),  # fired on bad EUSAMA  → TP
            ("c2", 65.0),  # fired on bad EUSAMA  → TP
            ("c3", 50.0),  # fired on clean       → FP
        ]
        for ch, conf in shadow:
            sqlite_cursor.execute(
                "INSERT INTO shadow_rule_log VALUES (?,?,?,?,?,?,?)",
                ("2026-04-10", ch, "rule_x", conf, 2, 3, "{}"),
            )
        eusama = [
            ("c1", 25.0, 30.0, 50.0, 50.0),   # min 25 → bad
            ("c2", 35.0, 45.0, 60.0, 60.0),   # min 35 → bad
            ("c3", 60.0, 65.0, 70.0, 70.0),   # min 60 → clean
            ("c4", 70.0, 75.0, 80.0, 80.0),   # clean, no shadow
        ]
        for ch, fl, fr, rl, rr in eusama:
            sqlite_cursor.execute(
                "INSERT INTO eusama_tests "
                "(client_hash, time, front_left, front_right, rear_left, rear_right)"
                " VALUES (?,?,?,?,?,?)",
                (ch, "2026-04-10", fl, fr, rl, rr),
            )
        m = _compute_shadow_metrics(
            sqlite_cursor, "rule_x", 30, 40.0, None
        )
        assert m["trigger_count"] == 3
        assert m["unique_clients"] == 3
        assert m["pairs_with_eusama"] == 3
        # Pearson: conf=[80,65,50], we=[25,35,60] - negative correlation
        assert m["pearson_r"] < 0
        # Precision: TP=2, FP=1 → 2/3
        assert m["precision_vs_eusama"] == pytest.approx(2 / 3)
        # Clean clients: c3, c4. Fired_clean: c3. FPR = 1/2
        assert m["clean_cohort_fpr"] == pytest.approx(0.5)

    def test_time_lead_against_parent(self, sqlite_cursor):
        sqlite_cursor.execute(
            "INSERT INTO shadow_rule_log VALUES (?,?,?,?,?,?,?)",
            ("2026-04-01T00:00:00", "c1", "rule_x", 70.0, 2, 3, "{}"),
        )
        sqlite_cursor.execute(
            "INSERT INTO diagnosis_results VALUES (?,?,?,?)",
            ("2026-04-11T00:00:00", "c1", "parent_rule", 60.0),
        )
        m = _compute_shadow_metrics(
            sqlite_cursor, "rule_x", 30, 40.0, "parent_rule"
        )
        assert m["median_lead_days"] == pytest.approx(10.0, abs=0.01)


# ---------------------------------------------------------------------------
# shadow_metrics_view (HTTP layer)
# ---------------------------------------------------------------------------

class TestShadowMetricsView:
    def test_missing_rule_name_400(self):
        resp = shadow_metrics_view(MockGetRequest())
        assert resp.status_code == 400
        assert "error" in json.loads(resp.content)

    def test_post_method_not_allowed(self):
        req = MockGetRequest({"rule_name": "rule_x"})
        req.method = "POST"
        resp = shadow_metrics_view(req)
        assert resp.status_code == 405

    def test_unknown_rule_returns_empty(self, monkeypatch):
        from diagnostic import api_views

        class _DummyCursorCtx:
            def __enter__(self_inner):
                conn = sqlite3.connect(":memory:")
                c = conn.cursor()
                c.execute(
                    "CREATE TABLE shadow_rule_log (time TEXT, client_hash TEXT, "
                    "rule_name TEXT, confidence REAL, conditions_met INT, "
                    "conditions_total INT, features_snapshot TEXT)"
                )
                c.execute(
                    "CREATE TABLE eusama_tests (id INTEGER PRIMARY KEY, "
                    "client_hash TEXT, time TEXT, front_left REAL, "
                    "front_right REAL, rear_left REAL, rear_right REAL)"
                )
                self_inner._conn = conn
                return c

            def __exit__(self_inner, *a):
                self_inner._conn.close()

        monkeypatch.setattr(
            "diagnostic.db.get_cursor", lambda: _DummyCursorCtx()
        )
        resp = shadow_metrics_view(MockGetRequest({"rule_name": "rule_x"}))
        assert resp.status_code == 200
        data = json.loads(resp.content)
        assert data["rule_name"] == "rule_x"
        assert data["trigger_count"] == 0
        assert data["promotion_ready"] is False


# ---------------------------------------------------------------------------
# promote_shadow_rule (JSON + Python)
# ---------------------------------------------------------------------------

class TestPromoteShadowRule:
    def test_json_dry_run_finds_existing(self):
        from diagnostic.scripts.promote_shadow_rule import promote

        ok, msg = promote("spectral_kurtosis_impulsive_bearing", dry_run=True)
        assert ok
        assert "shadow_rules.json" in msg
        assert "true -> false" in msg.lower()

    def test_python_dry_run_finds_order_2x(self):
        from diagnostic.scripts.promote_shadow_rule import promote

        ok, msg = promote("order_2x_imbalance_l4", dry_run=True)
        assert ok
        assert "complex_rules.py" in msg

    def test_unknown_rule_fails(self):
        from diagnostic.scripts.promote_shadow_rule import promote

        ok, msg = promote("definitely_not_a_rule", dry_run=True)
        assert not ok
        assert "not found" in msg

    def test_criteria_check(self):
        from diagnostic.scripts.promote_shadow_rule import meets_promotion_criteria

        ok, reasons = meets_promotion_criteria(
            {
                "precision_vs_eusama": 0.75,
                "clean_cohort_fpr": 0.10,
                "median_lead_days": 12.0,
            },
            requires_lead=True,
        )
        assert ok
        assert not reasons

    def test_criteria_fails_low_precision(self):
        from diagnostic.scripts.promote_shadow_rule import meets_promotion_criteria

        ok, reasons = meets_promotion_criteria(
            {
                "precision_vs_eusama": 0.50,
                "clean_cohort_fpr": 0.10,
                "median_lead_days": 12.0,
            },
            requires_lead=True,
        )
        assert not ok
        assert any("precision" in r for r in reasons)

    def test_criteria_fails_high_fpr(self):
        from diagnostic.scripts.promote_shadow_rule import meets_promotion_criteria

        ok, reasons = meets_promotion_criteria(
            {
                "precision_vs_eusama": 0.75,
                "clean_cohort_fpr": 0.20,
                "median_lead_days": 12.0,
            },
            requires_lead=True,
        )
        assert not ok
        assert any("fpr" in r.lower() for r in reasons)

    def test_criteria_skip_lead_when_not_required(self):
        from diagnostic.scripts.promote_shadow_rule import meets_promotion_criteria

        ok, reasons = meets_promotion_criteria(
            {
                "precision_vs_eusama": 0.80,
                "clean_cohort_fpr": 0.10,
                "median_lead_days": None,
            },
            requires_lead=False,
        )
        assert ok
