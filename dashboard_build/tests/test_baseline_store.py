"""Tests for BaselineStore — Welford online statistics with decay and DB serialization."""
import math
import pytest

from diagnostic.baseline_store import (
    MIN_BASELINE_SAMPLES,
    GOOD_BASELINE_SAMPLES,
    MAX_BASELINE_WINDOW,
    KEY_FEATURES,
    RegimeBaseline,
    BaselineStore,
)
from diagnostic.normalizer import DrivingRegime


# ---------------------------------------------------------------------------
# RegimeBaseline tests
# ---------------------------------------------------------------------------


class TestRegimeBaselineSingleUpdate:
    """Test Welford single-value behavior."""

    def test_single_update_sets_mean(self):
        b = RegimeBaseline()
        b.update(10.0)
        assert b.count == 1
        assert b.mean == 10.0

    def test_single_update_min_max(self):
        b = RegimeBaseline()
        b.update(5.0)
        assert b.min_val == 5.0
        assert b.max_val == 5.0

    def test_single_update_variance_zero(self):
        b = RegimeBaseline()
        b.update(42.0)
        assert b.variance == 0.0
        assert b.std == 0.0


class TestRegimeBaselineMultipleUpdates:
    """Test Welford convergence with multiple values."""

    def test_mean_of_known_sequence(self):
        b = RegimeBaseline()
        for v in [2, 4, 4, 4, 5, 5, 7, 9]:
            b.update(v)
        assert b.count == 8
        assert b.mean == pytest.approx(5.0)

    def test_variance_of_known_sequence(self):
        b = RegimeBaseline()
        for v in [2, 4, 4, 4, 5, 5, 7, 9]:
            b.update(v)
        # Population variance = 4.0, sample variance = 32/7 ≈ 4.571
        assert b.variance == pytest.approx(32.0 / 7.0, rel=1e-9)

    def test_std_of_known_sequence(self):
        b = RegimeBaseline()
        for v in [2, 4, 4, 4, 5, 5, 7, 9]:
            b.update(v)
        assert b.std == pytest.approx(math.sqrt(32.0 / 7.0), rel=1e-9)

    def test_min_max_tracked(self):
        b = RegimeBaseline()
        for v in [10, 3, 7, 15, 1, 8]:
            b.update(v)
        assert b.min_val == 1.0
        assert b.max_val == 15.0


class TestRegimeBaselineZScore:
    """Test z_score computation."""

    def test_z_score_with_sufficient_data(self):
        b = RegimeBaseline()
        # Insert enough samples: 30+ of value 10.0, then one outlier
        for _ in range(MIN_BASELINE_SAMPLES):
            b.update(10.0)
        # All same value → std = 0 → z_score should return 0.0
        assert b.z_score(10.0) == 0.0

    def test_z_score_with_variance(self):
        b = RegimeBaseline()
        # Build a baseline with known statistics
        values = list(range(1, MIN_BASELINE_SAMPLES + 1))
        for v in values:
            b.update(float(v))
        mean = b.mean
        std = b.std
        test_val = mean + 2 * std
        assert b.z_score(test_val) == pytest.approx(2.0, rel=1e-6)

    def test_z_score_insufficient_data_returns_zero(self):
        b = RegimeBaseline()
        for _ in range(MIN_BASELINE_SAMPLES - 1):
            b.update(5.0)
        assert b.z_score(100.0) == 0.0

    def test_z_score_zero_std_returns_zero(self):
        b = RegimeBaseline()
        for _ in range(MIN_BASELINE_SAMPLES + 10):
            b.update(7.0)
        assert b.z_score(999.0) == 0.0


class TestRegimeBaselineNoneHandling:
    """Test that None values are skipped."""

    def test_none_ignored(self):
        b = RegimeBaseline()
        b.update(5.0)
        b.update(None)
        b.update(None)
        b.update(10.0)
        assert b.count == 2
        assert b.mean == pytest.approx(7.5)

    def test_all_none_stays_empty(self):
        b = RegimeBaseline()
        b.update(None)
        b.update(None)
        assert b.count == 0
        assert b.mean == 0.0


class TestRegimeBaselineFreezeAtMaxWindow:
    """Test that baseline freezes at MAX_BASELINE_WINDOW."""

    def test_freeze_at_max_window(self):
        b = RegimeBaseline()
        for i in range(MAX_BASELINE_WINDOW):
            b.update(float(i))
        assert b.count == MAX_BASELINE_WINDOW
        frozen_mean = b.mean
        frozen_std = b.std
        # Next updates should be ignored
        b.update(999999.0)
        b.update(-999999.0)
        assert b.count == MAX_BASELINE_WINDOW
        assert b.mean == frozen_mean
        assert b.std == frozen_std


class TestRegimeBaselineSerialization:
    """Test to_dict / from_dict roundtrip."""

    def test_roundtrip_empty(self):
        b = RegimeBaseline()
        d = b.to_dict()
        restored = RegimeBaseline.from_dict(d)
        assert restored.count == 0
        assert restored.mean == 0.0
        assert restored.m2 == 0.0
        assert restored.min_val == float("inf")
        assert restored.max_val == float("-inf")

    def test_roundtrip_with_data(self):
        b = RegimeBaseline()
        for v in [3.0, 7.0, 11.0, 15.0]:
            b.update(v)
        d = b.to_dict()
        restored = RegimeBaseline.from_dict(d)
        assert restored.count == b.count
        assert restored.mean == pytest.approx(b.mean)
        assert restored.m2 == pytest.approx(b.m2)
        assert restored.min_val == b.min_val
        assert restored.max_val == b.max_val
        assert restored.variance == pytest.approx(b.variance)
        assert restored.std == pytest.approx(b.std)


# ---------------------------------------------------------------------------
# BaselineStore tests
# ---------------------------------------------------------------------------


class TestBaselineStoreGetUpdate:
    """Test store get and update operations."""

    def test_get_creates_new_baseline(self):
        store = BaselineStore()
        b = store.get("idle", "az_std")
        assert isinstance(b, RegimeBaseline)
        assert b.count == 0

    def test_get_with_enum(self):
        store = BaselineStore()
        b = store.get(DrivingRegime.IDLE, "az_std")
        assert isinstance(b, RegimeBaseline)

    def test_get_same_key_returns_same_object(self):
        store = BaselineStore()
        b1 = store.get("idle", "az_std")
        b2 = store.get("idle", "az_std")
        assert b1 is b2

    def test_get_enum_and_string_same_key(self):
        store = BaselineStore()
        b1 = store.get(DrivingRegime.IDLE, "az_std")
        b2 = store.get("idle", "az_std")
        assert b1 is b2

    def test_update_feeds_features(self):
        store = BaselineStore()
        features = {"az_std": 1.5, "total_vibration": 0.8, "some_other": 42.0}
        store.update("idle", features)
        assert store.get("idle", "az_std").count == 1
        assert store.get("idle", "az_std").mean == 1.5
        assert store.get("idle", "total_vibration").count == 1
        assert store.get("idle", "some_other").count == 1

    def test_update_with_enum(self):
        store = BaselineStore()
        store.update(DrivingRegime.HIGHWAY, {"az_std": 2.0})
        assert store.get("highway", "az_std").count == 1
        assert store.get("highway", "az_std").mean == 2.0

    def test_update_skips_none_values(self):
        store = BaselineStore()
        store.update("idle", {"az_std": None, "total_vibration": 1.0})
        assert store.get("idle", "az_std").count == 0
        assert store.get("idle", "total_vibration").count == 1


class TestBaselineStoreReadiness:
    """Test is_ready and confidence methods."""

    def test_is_ready_false_when_empty(self):
        store = BaselineStore()
        assert store.is_ready("idle") is False

    def test_is_ready_false_when_partial(self):
        store = BaselineStore()
        for _ in range(MIN_BASELINE_SAMPLES):
            store.update("idle", {"az_std": 1.0})
        # total_vibration not fed yet
        assert store.is_ready("idle") is False

    def test_is_ready_true_when_all_key_features_sufficient(self):
        store = BaselineStore()
        for _ in range(MIN_BASELINE_SAMPLES):
            store.update("idle", {"az_std": 1.0, "total_vibration": 0.5})
        assert store.is_ready("idle") is True

    def test_is_ready_with_enum(self):
        store = BaselineStore()
        for _ in range(MIN_BASELINE_SAMPLES):
            store.update(DrivingRegime.IDLE, {"az_std": 1.0, "total_vibration": 0.5})
        assert store.is_ready(DrivingRegime.IDLE) is True

    def test_confidence_zero_when_empty(self):
        store = BaselineStore()
        assert store.confidence("idle") == 0.0

    def test_confidence_partial(self):
        store = BaselineStore()
        n = GOOD_BASELINE_SAMPLES // 2
        for _ in range(n):
            store.update("idle", {"az_std": 1.0, "total_vibration": 0.5})
        expected = n / GOOD_BASELINE_SAMPLES
        assert store.confidence("idle") == pytest.approx(expected, rel=1e-6)

    def test_confidence_capped_at_one(self):
        store = BaselineStore()
        for _ in range(GOOD_BASELINE_SAMPLES + 100):
            store.update("idle", {"az_std": 1.0, "total_vibration": 0.5})
        assert store.confidence("idle") == 1.0


class TestBaselineStoreDBSerialization:
    """Test to_db_rows / from_db_rows roundtrip."""

    def test_to_db_rows_empty_store(self):
        store = BaselineStore()
        rows = store.to_db_rows("client_abc")
        assert rows == []

    def test_to_db_rows_structure(self):
        store = BaselineStore()
        for _ in range(5):
            store.update("idle", {"az_std": 1.0, "total_vibration": 0.5})
        rows = store.to_db_rows("client_abc")
        assert len(rows) == 2
        row = rows[0]
        assert "client_hash" in row
        assert row["client_hash"] == "client_abc"
        assert "regime" in row
        assert "feature" in row
        assert "count" in row
        assert "mean" in row
        assert "m2" in row
        assert "min_val" in row
        assert "max_val" in row

    def test_roundtrip(self):
        store = BaselineStore()
        for i in range(50):
            store.update("idle", {"az_std": float(i), "total_vibration": float(i) * 0.1})
        for i in range(30):
            store.update("highway", {"az_std": float(i) + 10.0})

        rows = store.to_db_rows("client_xyz")
        restored = BaselineStore.from_db_rows(rows)

        # Check idle/az_std
        orig = store.get("idle", "az_std")
        rest = restored.get("idle", "az_std")
        assert rest.count == orig.count
        assert rest.mean == pytest.approx(orig.mean)
        assert rest.m2 == pytest.approx(orig.m2)
        assert rest.min_val == orig.min_val
        assert rest.max_val == orig.max_val

        # Check highway/az_std
        orig_h = store.get("highway", "az_std")
        rest_h = restored.get("highway", "az_std")
        assert rest_h.count == orig_h.count
        assert rest_h.mean == pytest.approx(orig_h.mean)

    def test_roundtrip_preserves_is_ready(self):
        store = BaselineStore()
        for _ in range(MIN_BASELINE_SAMPLES):
            store.update("city", {"az_std": 2.0, "total_vibration": 1.0})
        assert store.is_ready("city") is True

        rows = store.to_db_rows("client_abc")
        restored = BaselineStore.from_db_rows(rows)
        assert restored.is_ready("city") is True
