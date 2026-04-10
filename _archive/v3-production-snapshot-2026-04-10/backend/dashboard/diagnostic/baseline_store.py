"""BaselineStore — Welford online statistics with decay and DB serialization.

Maintains per-regime, per-feature running statistics using Welford's online
algorithm.  Each RegimeBaseline tracks count, mean, M2, min, max and freezes
once MAX_BASELINE_WINDOW samples have been collected (natural decay — the
baseline represents the first N observations and stops drifting).

BaselineStore aggregates baselines across regimes and features, exposes
readiness checks against KEY_FEATURES, and provides DB serialization.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MIN_BASELINE_SAMPLES: int = 30
"""Minimum samples before z-score is considered meaningful."""

GOOD_BASELINE_SAMPLES: int = 200
"""Number of samples at which confidence reaches 1.0."""

MAX_BASELINE_WINDOW: int = 500
"""After this many samples the baseline freezes — no further updates accepted."""

KEY_FEATURES: Tuple[str, ...] = ("az_std", "total_vibration")
"""Features that must all reach MIN_BASELINE_SAMPLES for a regime to be "ready"."""


# ---------------------------------------------------------------------------
# RegimeBaseline — Welford online statistics for a single (regime, feature)
# ---------------------------------------------------------------------------

@dataclass
class RegimeBaseline:
    """Running statistics for one (regime, feature) pair.

    Uses Welford's online algorithm for numerically stable incremental
    mean / variance computation.
    """

    count: int = 0
    mean: float = 0.0
    m2: float = 0.0
    min_val: float = field(default_factory=lambda: float("inf"))
    max_val: float = field(default_factory=lambda: float("-inf"))

    # -- derived properties --------------------------------------------------

    @property
    def variance(self) -> float:
        """Sample variance (Bessel-corrected).  Returns 0.0 if count < 2."""
        if self.count < 2:
            return 0.0
        return self.m2 / (self.count - 1)

    @property
    def std(self) -> float:
        """Sample standard deviation."""
        return math.sqrt(self.variance)

    # -- update ---------------------------------------------------------------

    def update(self, value: Optional[float]) -> None:
        """Incorporate a new observation via Welford's algorithm.

        * Skips ``None`` values silently.
        * Freezes once ``count >= MAX_BASELINE_WINDOW`` — no further updates.
        """
        if value is None:
            return
        if self.count >= MAX_BASELINE_WINDOW:
            return

        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        delta2 = value - self.mean
        self.m2 += delta * delta2

        if value < self.min_val:
            self.min_val = value
        if value > self.max_val:
            self.max_val = value

    # -- z-score --------------------------------------------------------------

    def z_score(self, value: float) -> float:
        """Return z-score of *value* relative to this baseline.

        Returns ``0.0`` when:
          - fewer than ``MIN_BASELINE_SAMPLES`` collected, or
          - standard deviation is zero (constant baseline).
        """
        if self.count < MIN_BASELINE_SAMPLES:
            return 0.0
        s = self.std
        if s == 0.0:
            return 0.0
        return (value - self.mean) / s

    # -- serialization --------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to a plain dict (JSON-safe)."""
        return {
            "count": self.count,
            "mean": self.mean,
            "m2": self.m2,
            "min_val": self.min_val,
            "max_val": self.max_val,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> RegimeBaseline:
        """Reconstruct from a dict produced by :meth:`to_dict`."""
        return cls(
            count=d["count"],
            mean=d["mean"],
            m2=d["m2"],
            min_val=d["min_val"],
            max_val=d["max_val"],
        )


# ---------------------------------------------------------------------------
# BaselineStore — collection of baselines keyed by (regime, feature)
# ---------------------------------------------------------------------------

def _regime_key(regime: Union[str, Enum]) -> str:
    """Normalize a regime to its string value."""
    if isinstance(regime, Enum):
        return regime.value
    return str(regime)


class BaselineStore:
    """Per-vehicle collection of ``RegimeBaseline`` objects.

    Keys are ``(regime_str, feature_name)`` tuples.  Regimes can be passed as
    ``DrivingRegime`` enums or plain strings — both map to the same key.
    """

    def __init__(self) -> None:
        self.baselines: Dict[Tuple[str, str], RegimeBaseline] = {}

    # -- access ---------------------------------------------------------------

    def get(self, regime: Union[str, Enum], feature: str) -> RegimeBaseline:
        """Return the baseline for *(regime, feature)*, creating it if needed."""
        key = (_regime_key(regime), feature)
        if key not in self.baselines:
            self.baselines[key] = RegimeBaseline()
        return self.baselines[key]

    def update(self, regime: Union[str, Enum], features: Dict[str, Any]) -> None:
        """Feed a dict of ``{feature_name: value}`` into the store.

        Each non-``None`` value is forwarded to the corresponding
        ``RegimeBaseline.update``.
        """
        rk = _regime_key(regime)
        for feat, val in features.items():
            if val is None:
                continue
            key = (rk, feat)
            if key not in self.baselines:
                self.baselines[key] = RegimeBaseline()
            self.baselines[key].update(val)

    # -- readiness ------------------------------------------------------------

    def is_ready(self, regime: Union[str, Enum]) -> bool:
        """True when all ``KEY_FEATURES`` have >= ``MIN_BASELINE_SAMPLES``."""
        rk = _regime_key(regime)
        for feat in KEY_FEATURES:
            bl = self.baselines.get((rk, feat))
            if bl is None or bl.count < MIN_BASELINE_SAMPLES:
                return False
        return True

    def confidence(self, regime: Union[str, Enum]) -> float:
        """Average collection progress for ``KEY_FEATURES``, capped at 1.0.

        ``0.0`` when nothing collected; ``1.0`` when every key feature has
        >= ``GOOD_BASELINE_SAMPLES`` observations.
        """
        rk = _regime_key(regime)
        total = 0.0
        for feat in KEY_FEATURES:
            bl = self.baselines.get((rk, feat))
            if bl is not None:
                total += min(bl.count / GOOD_BASELINE_SAMPLES, 1.0)
        avg = total / len(KEY_FEATURES)
        return min(avg, 1.0)

    # -- DB serialization -----------------------------------------------------

    def to_db_rows(self, client_hash: str) -> List[Dict[str, Any]]:
        """Serialize every baseline to a list of flat dicts for DB storage.

        Each row contains: ``client_hash``, ``regime``, ``feature``,
        ``count``, ``mean``, ``m2``, ``min_val``, ``max_val``.
        """
        rows: List[Dict[str, Any]] = []
        for (regime, feature), bl in self.baselines.items():
            row = bl.to_dict()
            row["client_hash"] = client_hash
            row["regime"] = regime
            row["feature"] = feature
            rows.append(row)
        return rows

    @classmethod
    def from_db_rows(cls, rows: List[Dict[str, Any]]) -> BaselineStore:
        """Reconstruct a BaselineStore from rows produced by :meth:`to_db_rows`.

        The ``client_hash`` field in each row is ignored (store is per-vehicle).
        """
        store = cls()
        for row in rows:
            regime = row["regime"]
            feature = row["feature"]
            bl = RegimeBaseline.from_dict(row)
            store.baselines[(regime, feature)] = bl
        return store
