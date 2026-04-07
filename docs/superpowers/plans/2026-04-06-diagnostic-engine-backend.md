# Diagnostic Engine Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the anomaly scoring engine that powers the Orbital Diagnostic Center — regime classification, baselines, multi-sensor scoring, diagnostic rules, CUSUM change-point detection, and two new Django API endpoints.

**Architecture:** Pure Python module `anomaly_engine.py` with zero external dependencies (stdlib + math only). Plugs into existing Django views.py via two new endpoints (`/api/anomaly/`, `/api/anomaly/history/`). Uses same raw-SQL patterns as existing code. Three new TimescaleDB tables for storing baselines, scores, and persistence.

**Tech Stack:** Python 3.x, Django (raw SQL, no ORM), PostgreSQL/TimescaleDB, pytest for tests.

**Spec:** `docs/superpowers/specs/2026-04-06-orbital-diagnostic-center-design.md` sections 6.1-6.6

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `dashboard_build/anomaly_engine.py` | CREATE | Core logic: regime, baselines, scoring, rules, CUSUM, derived features |
| `dashboard_build/shape_decoder.py` | CREATE | Correct QTP shape bitfield decoder |
| `dashboard_build/views.py` | MODIFY | Add api_anomaly(), api_anomaly_history(), fix shape decoding |
| `dashboard_build/urls.py` | MODIFY | Add 2 new routes |
| `dashboard_build/schema_anomaly.sql` | CREATE | DB migration: 3 new tables |
| `dashboard_build/tests/__init__.py` | CREATE | Test package |
| `dashboard_build/tests/test_shape_decoder.py` | CREATE | Shape decoder unit tests |
| `dashboard_build/tests/test_regime.py` | CREATE | Regime classifier tests |
| `dashboard_build/tests/test_baseline.py` | CREATE | Baseline store tests |
| `dashboard_build/tests/test_derived.py` | CREATE | Derived features tests |
| `dashboard_build/tests/test_scoring.py` | CREATE | Anomaly scoring tests |
| `dashboard_build/tests/test_rules.py` | CREATE | Diagnostic rules tests |
| `dashboard_build/tests/test_cusum.py` | CREATE | CUSUM tests |
| `dashboard_build/tests/test_api.py` | CREATE | API endpoint integration tests |

---

### Task 1: Shape Decoder Fix

**Files:**
- Create: `dashboard_build/shape_decoder.py`
- Create: `dashboard_build/tests/__init__.py`
- Create: `dashboard_build/tests/test_shape_decoder.py`

- [ ] **Step 1: Create test package**

```bash
mkdir -p dashboard_build/tests
touch dashboard_build/tests/__init__.py
```

- [ ] **Step 2: Write failing tests for shape decoder**

```python
# dashboard_build/tests/test_shape_decoder.py
import pytest
from shape_decoder import decode_shape, decode_shape_bytes


class TestDecodeShape:
    """Test QTP shape bitfield decoding: LLLDDDDT format."""

    def test_all_zeros(self):
        result = decode_shape(0b00000000)
        assert result == {'level': 0, 'duration': 0, 'trend': 0}

    def test_max_level(self):
        # Level 6 (110), duration 0, trend 0
        result = decode_shape(0b11000000)
        assert result['level'] == 6

    def test_level_7_invalid_but_handled(self):
        # Level 7 (111) should be clamped to 6
        result = decode_shape(0b11100000)
        assert result['level'] == 6

    def test_max_duration(self):
        # Level 0, duration 15 (1111), trend 0
        result = decode_shape(0b00011110)
        assert result['duration'] == 15

    def test_trend_up(self):
        # Level 0, duration 0, trend 1
        result = decode_shape(0b00000001)
        assert result['trend'] == 1

    def test_combined_values(self):
        # Level 3 (011), duration 7 (0111), trend 1
        byte_val = (3 << 5) | (7 << 1) | 1  # 0b01101111 = 111
        result = decode_shape(byte_val)
        assert result == {'level': 3, 'duration': 7, 'trend': 1}

    def test_none_input(self):
        result = decode_shape(None)
        assert result is None

    def test_reconstruct_level_values(self):
        """Level values should map to positions between min and max."""
        avg, std = 5.0, 2.0
        mn, mx = 0.0, 10.0
        expected_levels = [
            mn,                     # 0: min
            avg - 0.7 * std,        # 1: 3.6
            avg - 0.3 * std,        # 2: 4.4
            avg,                    # 3: 5.0
            avg + 0.3 * std,        # 4: 5.6
            avg + 0.7 * std,        # 5: 6.4
            mx,                     # 6: max
        ]
        from shape_decoder import level_to_value
        for i, expected in enumerate(expected_levels):
            assert abs(level_to_value(i, mn, mx, avg, std) - expected) < 0.01


class TestDecodeShapeBytes:
    """Test batch decoding of 4 shape bytes per axis."""

    def test_four_bytes(self):
        shapes = [0b01100010, 0b10001001, 0b01000100, 0b11001111]
        results = decode_shape_bytes(shapes)
        assert len(results) == 4
        assert all('level' in r and 'duration' in r and 'trend' in r for r in results)

    def test_empty_list(self):
        assert decode_shape_bytes([]) == []

    def test_none_in_list(self):
        results = decode_shape_bytes([None, 0b01100010, None, 0b10001001])
        assert results[0] is None
        assert results[1] is not None
        assert results[2] is None
        assert results[3] is not None
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_shape_decoder.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'shape_decoder'`

- [ ] **Step 4: Implement shape decoder**

```python
# dashboard_build/shape_decoder.py
"""
QTP Shape Bitfield Decoder.

Each shape byte encodes a turning point in 8 bits: LLLDDDDT
- Bits 7-5 (3 bits): Level — quantized amplitude (0-6)
- Bits 4-1 (4 bits): Duration — time offset from previous point (log-scale)
- Bit 0 (1 bit): Trend — 0=down/stable, 1=up

The 7 quantization levels relative to window statistics:
  Level 0: min
  Level 1: avg - 0.7 * std
  Level 2: avg - 0.3 * std
  Level 3: avg (center)
  Level 4: avg + 0.3 * std
  Level 5: avg + 0.7 * std
  Level 6: max
"""


def decode_shape(byte_val):
    """Decode a single QTP shape byte into level, duration, trend."""
    if byte_val is None:
        return None
    byte_val = int(byte_val) & 0xFF
    level = (byte_val >> 5) & 0x07
    if level > 6:
        level = 6
    duration = (byte_val >> 1) & 0x0F
    trend = byte_val & 0x01
    return {'level': level, 'duration': duration, 'trend': trend}


def decode_shape_bytes(shape_list):
    """Decode a list of shape bytes (typically 4 per axis)."""
    return [decode_shape(b) for b in shape_list]


def level_to_value(level, mn, mx, avg, std):
    """Convert quantization level back to approximate physical value."""
    levels = [
        mn,
        avg - 0.7 * std,
        avg - 0.3 * std,
        avg,
        avg + 0.3 * std,
        avg + 0.7 * std,
        mx,
    ]
    idx = max(0, min(level, 6))
    return levels[idx]
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_shape_decoder.py -v`
Expected: All 10 tests PASS

- [ ] **Step 6: Commit**

```bash
git add dashboard_build/shape_decoder.py dashboard_build/tests/
git commit -m "feat: add correct QTP shape bitfield decoder

Fixes the bug where shape1-4 were decoded as acceleration values
via qtp_avg(). They are actually packed bitfields (LLLDDDDT):
3 bits level + 4 bits duration + 1 bit trend.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Regime Classifier

**Files:**
- Create: `dashboard_build/anomaly_engine.py` (first section)
- Create: `dashboard_build/tests/test_regime.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_regime.py
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import Regime, classify_regime


class TestRegimeClassification:

    def test_idle_by_speed(self):
        r = classify_regime(speed=0, rpm=750, ax_avg=0, ay_avg=0, az_std=0.3, road_type='standstill')
        assert r == Regime.IDLE

    def test_idle_by_road_type(self):
        r = classify_regime(speed=2, rpm=800, ax_avg=0, ay_avg=0, az_std=0.2, road_type='standstill')
        assert r == Regime.IDLE

    def test_braking(self):
        r = classify_regime(speed=60, rpm=2000, ax_avg=-3.0, ay_avg=0, az_std=1.0, road_type='asphalt')
        assert r == Regime.BRAKING

    def test_acceleration(self):
        r = classify_regime(speed=40, rpm=3000, ax_avg=3.5, ay_avg=0, az_std=1.0, road_type='asphalt')
        assert r == Regime.ACCELERATION

    def test_cornering(self):
        r = classify_regime(speed=50, rpm=2500, ax_avg=0, ay_avg=3.0, az_std=1.0, road_type='asphalt')
        assert r == Regime.CORNERING

    def test_highway(self):
        r = classify_regime(speed=100, rpm=2500, ax_avg=0.2, ay_avg=0.1, az_std=0.8, road_type='asphalt')
        assert r == Regime.HIGHWAY

    def test_city(self):
        r = classify_regime(speed=40, rpm=1800, ax_avg=0.5, ay_avg=0.3, az_std=1.2, road_type='asphalt')
        assert r == Regime.CITY

    def test_missing_obd_idle(self):
        """When OBD data is None, fall back to accel-only classification."""
        r = classify_regime(speed=None, rpm=None, ax_avg=0, ay_avg=0, az_std=0.2, road_type='standstill')
        assert r == Regime.IDLE

    def test_missing_obd_braking(self):
        r = classify_regime(speed=None, rpm=None, ax_avg=-3.0, ay_avg=0, az_std=1.0, road_type='asphalt')
        assert r == Regime.BRAKING

    def test_priority_braking_over_highway(self):
        """Braking at highway speed should classify as BRAKING, not HIGHWAY."""
        r = classify_regime(speed=100, rpm=1500, ax_avg=-3.0, ay_avg=0, az_std=1.5, road_type='asphalt')
        assert r == Regime.BRAKING
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_regime.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'anomaly_engine'`

- [ ] **Step 3: Implement regime classifier**

```python
# dashboard_build/anomaly_engine.py
"""
LLCAR Anomaly Detection Engine.

Multi-sensor diagnostic scoring for vehicle health monitoring.
Uses accelerometer, audio, and OBD-II data to detect mechanical faults.
"""
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Tuple


class Regime(Enum):
    IDLE = 'idle'
    CITY = 'city'
    HIGHWAY = 'highway'
    ACCELERATION = 'acceleration'
    BRAKING = 'braking'
    CORNERING = 'cornering'
    UNKNOWN = 'unknown'


def classify_regime(speed, rpm, ax_avg, ay_avg, az_std, road_type):
    """
    Classify driving regime from sensor readings.

    Priority order: idle -> braking -> acceleration -> cornering -> highway -> city.
    This ensures transient events override steady-state classification.
    """
    if speed is None and rpm is None:
        return _classify_accel_only(ax_avg, ay_avg, az_std, road_type)

    speed = speed or 0
    rpm = rpm or 0

    if speed < 3 or road_type == 'standstill':
        return Regime.IDLE

    if ax_avg is not None and ax_avg < -2.0 and speed > 5:
        return Regime.BRAKING

    if ax_avg is not None and ax_avg > 2.0:
        return Regime.ACCELERATION

    if ay_avg is not None and abs(ay_avg) > 2.5:
        return Regime.CORNERING

    if speed > 70:
        return Regime.HIGHWAY

    return Regime.CITY


def _classify_accel_only(ax_avg, ay_avg, az_std, road_type):
    """Fallback when OBD data is unavailable."""
    if road_type == 'standstill':
        return Regime.IDLE
    if ax_avg is not None and ax_avg < -2.0:
        return Regime.BRAKING
    if ax_avg is not None and ax_avg > 2.0:
        return Regime.ACCELERATION
    if ay_avg is not None and abs(ay_avg) > 2.5:
        return Regime.CORNERING
    if az_std is not None and az_std < 0.5:
        return Regime.IDLE
    return Regime.UNKNOWN
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_regime.py -v`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_regime.py
git commit -m "feat: add driving regime classifier (idle/city/highway/accel/brake/corner)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Baseline Store (Welford's Algorithm)

**Files:**
- Modify: `dashboard_build/anomaly_engine.py`
- Create: `dashboard_build/tests/test_baseline.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_baseline.py
import pytest
import math
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import RegimeBaseline, BaselineStore, Regime, POPULATION_PRIORS, z_score_with_fallback


class TestRegimeBaseline:

    def test_empty_baseline(self):
        bl = RegimeBaseline()
        assert bl.count == 0
        assert bl.mean == 0.0
        assert bl.std == 0.0

    def test_single_update(self):
        bl = RegimeBaseline()
        bl.update(10.0)
        assert bl.count == 1
        assert bl.mean == 10.0

    def test_multiple_updates_mean(self):
        bl = RegimeBaseline()
        for v in [2.0, 4.0, 6.0, 8.0, 10.0]:
            bl.update(v)
        assert bl.count == 5
        assert abs(bl.mean - 6.0) < 0.001

    def test_multiple_updates_std(self):
        bl = RegimeBaseline()
        values = [2.0, 4.0, 6.0, 8.0, 10.0]
        for v in values:
            bl.update(v)
        expected_std = math.sqrt(sum((v - 6.0)**2 for v in values) / (len(values) - 1))
        assert abs(bl.std - expected_std) < 0.001

    def test_z_score(self):
        bl = RegimeBaseline()
        for v in [10.0] * 50:
            bl.update(v)
        bl.update(12.0)  # Push mean slightly
        # With 50 values of 10 and 1 of 12, mean ~ 10.04, std ~ 0.28
        z = bl.z_score(12.0)
        assert z > 5.0  # Very far from mean

    def test_z_score_insufficient_data(self):
        bl = RegimeBaseline()
        bl.update(5.0)
        assert bl.z_score(10.0) == 0.0  # Not enough data

    def test_none_update_ignored(self):
        bl = RegimeBaseline()
        bl.update(5.0)
        bl.update(None)
        assert bl.count == 1

    def test_min_max_tracking(self):
        bl = RegimeBaseline()
        for v in [3.0, 1.0, 5.0, 2.0]:
            bl.update(v)
        assert bl.min_val == 1.0
        assert bl.max_val == 5.0


class TestBaselineStore:

    def test_get_creates_new(self):
        store = BaselineStore()
        bl = store.get(Regime.IDLE, 'az_std')
        assert bl.count == 0

    def test_update_multiple_features(self):
        store = BaselineStore()
        store.update(Regime.CITY, {'az_std': 1.5, 'speed': 40.0})
        assert store.get(Regime.CITY, 'az_std').count == 1
        assert store.get(Regime.CITY, 'speed').count == 1
        assert store.get(Regime.CITY, 'az_std').mean == 1.5

    def test_is_ready_needs_30_samples(self):
        store = BaselineStore()
        for i in range(29):
            store.update(Regime.CITY, {'az_std': 1.0 + i * 0.01, 'total_vibration': 2.0})
        assert not store.is_ready(Regime.CITY)
        store.update(Regime.CITY, {'az_std': 1.3, 'total_vibration': 2.0})
        assert store.is_ready(Regime.CITY)

    def test_confidence_scales_to_200(self):
        store = BaselineStore()
        for i in range(100):
            store.update(Regime.HIGHWAY, {'az_std': 0.8, 'total_vibration': 1.5})
        conf = store.confidence(Regime.HIGHWAY)
        assert 0.4 < conf < 0.6  # 100/200 = 0.5


class TestZScoreWithFallback:

    def test_empty_baseline_uses_population_prior(self):
        bl = RegimeBaseline()
        z = z_score_with_fallback(bl, 5.0, Regime.IDLE, 'az_std')
        # Population prior for idle az_std: mean=0.3, std=0.15
        # z = (5.0 - 0.3) / 0.15 = 31.3
        assert z > 30.0

    def test_full_baseline_ignores_prior(self):
        bl = RegimeBaseline()
        for _ in range(50):
            bl.update(1.0)
        z = z_score_with_fallback(bl, 1.0, Regime.IDLE, 'az_std')
        assert abs(z) < 0.1  # Value equals mean

    def test_blending_halfway(self):
        bl = RegimeBaseline()
        for i in range(15):  # Half of MIN_BASELINE_SAMPLES
            bl.update(1.0)
        z = z_score_with_fallback(bl, 1.0, Regime.IDLE, 'az_std')
        # Should be blended between population and individual
        assert isinstance(z, float)

    def test_none_value_returns_zero(self):
        bl = RegimeBaseline()
        z = z_score_with_fallback(bl, None, Regime.IDLE, 'az_std')
        assert z == 0.0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_baseline.py -v`
Expected: FAIL — `ImportError: cannot import name 'RegimeBaseline'`

- [ ] **Step 3: Implement baseline store**

Append to `dashboard_build/anomaly_engine.py`:

```python
# ── Baseline Store (Welford's Online Algorithm) ──────────────────────

MIN_BASELINE_SAMPLES = 30
GOOD_BASELINE_SAMPLES = 200

BASELINE_FEATURES = [
    'ax_avg', 'ay_avg', 'az_avg',
    'ax_std', 'ay_std', 'az_std',
    'ax_range', 'ay_range', 'az_range',
    'rpm', 'speed', 'coolant', 'voltage',
    'audio_quality', 'dominant_freq', 'dominant_amp',
    'total_vibration', 'crest_factor_z',
]

POPULATION_PRIORS = {
    (Regime.IDLE, 'az_std'): (0.3, 0.15),
    (Regime.IDLE, 'total_vibration'): (0.5, 0.2),
    (Regime.IDLE, 'rpm'): (750, 50),
    (Regime.CITY, 'az_std'): (1.2, 0.5),
    (Regime.CITY, 'total_vibration'): (2.0, 0.8),
    (Regime.CITY, 'speed'): (35, 12),
    (Regime.HIGHWAY, 'az_std'): (0.8, 0.3),
    (Regime.HIGHWAY, 'total_vibration'): (1.5, 0.5),
    (Regime.HIGHWAY, 'speed'): (90, 15),
}


@dataclass
class RegimeBaseline:
    count: int = 0
    mean: float = 0.0
    m2: float = 0.0
    min_val: float = float('inf')
    max_val: float = float('-inf')

    @property
    def variance(self):
        return self.m2 / max(self.count - 1, 1) if self.count > 1 else 0.0

    @property
    def std(self):
        return math.sqrt(self.variance)

    def update(self, value):
        if value is None:
            return
        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        delta2 = value - self.mean
        self.m2 += delta * delta2
        self.min_val = min(self.min_val, value)
        self.max_val = max(self.max_val, value)

    def z_score(self, value):
        if value is None or self.count < MIN_BASELINE_SAMPLES or self.std < 1e-9:
            return 0.0
        return (value - self.mean) / self.std


class BaselineStore:
    def __init__(self):
        self.baselines: Dict[Tuple[str, str], RegimeBaseline] = {}

    def get(self, regime: Regime, feature: str) -> RegimeBaseline:
        key = (regime.value, feature)
        if key not in self.baselines:
            self.baselines[key] = RegimeBaseline()
        return self.baselines[key]

    def update(self, regime: Regime, features: Dict[str, Optional[float]]):
        for feat, val in features.items():
            if val is not None:
                self.get(regime, feat).update(val)

    def is_ready(self, regime: Regime) -> bool:
        key_feats = ['az_std', 'total_vibration']
        return all(
            self.get(regime, f).count >= MIN_BASELINE_SAMPLES
            for f in key_feats
        )

    def confidence(self, regime: Regime) -> float:
        counts = [self.get(regime, f).count for f in BASELINE_FEATURES
                  if self.get(regime, f).count > 0]
        if not counts:
            return 0.0
        avg_count = sum(counts) / len(counts)
        return min(avg_count / GOOD_BASELINE_SAMPLES, 1.0)


def z_score_with_fallback(baseline, value, regime, feature):
    if value is None:
        return 0.0
    prior_key = (regime, feature)
    if baseline.count >= MIN_BASELINE_SAMPLES:
        return baseline.z_score(value)
    if prior_key in POPULATION_PRIORS:
        pop_mean, pop_std = POPULATION_PRIORS[prior_key]
        if baseline.count == 0:
            return (value - pop_mean) / max(pop_std, 1e-9)
        alpha = baseline.count / MIN_BASELINE_SAMPLES
        blended_mean = alpha * baseline.mean + (1 - alpha) * pop_mean
        blended_std = alpha * baseline.std + (1 - alpha) * pop_std
        return (value - blended_mean) / max(blended_std, 1e-9)
    return 0.0
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_baseline.py -v`
Expected: All 13 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_baseline.py
git commit -m "feat: add Welford baseline store with population priors

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Derived Diagnostic Features

**Files:**
- Modify: `dashboard_build/anomaly_engine.py`
- Create: `dashboard_build/tests/test_derived.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_derived.py
import pytest
import math
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import compute_derived_features


class TestCrestFactor:

    def test_sinusoidal_signal(self):
        """Pure sine: CF = sqrt(2) ≈ 1.414"""
        features = {'az_avg': 0.0, 'az_std': 1.0, 'az_min': -1.414, 'az_max': 1.414}
        derived = compute_derived_features(features)
        assert abs(derived['crest_factor_z'] - 1.414) < 0.01

    def test_impulsive_signal(self):
        """Spike: high CF (> 4.0)"""
        features = {'az_avg': 0.0, 'az_std': 0.5, 'az_min': -0.3, 'az_max': 8.0}
        derived = compute_derived_features(features)
        assert derived['crest_factor_z'] > 4.0

    def test_missing_values(self):
        features = {'az_avg': None, 'az_std': None, 'az_min': None, 'az_max': None}
        derived = compute_derived_features(features)
        assert derived.get('crest_factor_z') is None


class TestShapeRatio:

    def test_sinusoidal(self):
        """Sine wave: SR ≈ 0.354"""
        features = {'az_std': 0.707, 'az_min': -1.0, 'az_max': 1.0}
        derived = compute_derived_features(features)
        assert abs(derived['shape_ratio_z'] - 0.354) < 0.02

    def test_impulsive(self):
        """Sharp spike: SR < 0.10"""
        features = {'az_std': 0.2, 'az_min': -0.1, 'az_max': 10.0}
        derived = compute_derived_features(features)
        assert derived['shape_ratio_z'] < 0.10

    def test_zero_range(self):
        """Zero range should return None (avoid division by zero)."""
        features = {'az_std': 0.0, 'az_min': 5.0, 'az_max': 5.0}
        derived = compute_derived_features(features)
        assert derived.get('shape_ratio_z') is None


class TestVirtualFrequency:

    def test_engine_frequency_match(self):
        """Audio peak at firing frequency -> engine source."""
        features = {
            'rpm': 3000,
            'speed': 60,
            'dominant_freq': 100.0,  # 3000 * 4 / 120 = 100 Hz
            'dominant_amp': 500.0,
        }
        derived = compute_derived_features(features)
        assert derived['virtual_freq_source'] == 'engine'
        assert derived['virtual_freq_order'] == 2  # 2nd order (firing)

    def test_wheel_frequency_match(self):
        """Audio peak at tire harmonic -> wheel source."""
        features = {
            'rpm': 2000,
            'speed': 80,
            # Tire freq at 80 km/h ≈ 11.2 Hz, 8th harmonic ≈ 89.7 Hz
            'dominant_freq': 90.0,
            'dominant_amp': 300.0,
        }
        derived = compute_derived_features(features)
        assert derived['virtual_freq_source'] == 'wheel'

    def test_unknown_source(self):
        features = {
            'rpm': 2000,
            'speed': 60,
            'dominant_freq': 173.0,  # Does not match engine or wheel harmonics
            'dominant_amp': 200.0,
        }
        derived = compute_derived_features(features)
        assert derived['virtual_freq_source'] == 'unknown'

    def test_no_audio(self):
        features = {'rpm': 2000, 'speed': 60}
        derived = compute_derived_features(features)
        assert derived.get('virtual_freq_source') is None


class TestTotalVibration:

    def test_basic(self):
        features = {'ax_std': 3.0, 'ay_std': 4.0, 'az_std': 0.0}
        derived = compute_derived_features(features)
        assert abs(derived['total_vibration'] - 5.0) < 0.01
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_derived.py -v`
Expected: FAIL — `ImportError: cannot import name 'compute_derived_features'`

- [ ] **Step 3: Implement derived features**

Append to `dashboard_build/anomaly_engine.py`:

```python
# ── Derived Diagnostic Features ──────────────────────────────────────

TIRE_DIAMETER = 0.63  # meters, typical sedan
NUM_CYLINDERS = 4


def compute_derived_features(features):
    """
    Compute diagnostic features from raw sensor data.

    Returns dict with: crest_factor_{x,y,z}, shape_ratio_{x,y,z},
    total_vibration, virtual_freq_source, virtual_freq_order.
    """
    derived = {}

    # Total vibration (RMS of std values)
    stds = []
    for axis in ('x', 'y', 'z'):
        s = features.get(f'a{axis}_std')
        if s is not None:
            stds.append(s)
    derived['total_vibration'] = math.sqrt(sum(s * s for s in stds)) if stds else None

    # Per-axis derived features
    for axis in ('x', 'y', 'z'):
        avg = features.get(f'a{axis}_avg')
        std = features.get(f'a{axis}_std')
        mn = features.get(f'a{axis}_min')
        mx = features.get(f'a{axis}_max')

        # Crest Factor = peak / RMS
        if std is not None and avg is not None and mn is not None and mx is not None:
            peak = max(abs(mn), abs(mx))
            rms = math.sqrt(avg * avg + std * std)
            derived[f'crest_factor_{axis}'] = round(peak / rms, 3) if rms > 1e-9 else None
        else:
            derived[f'crest_factor_{axis}'] = None

        # Shape Ratio = std / range
        if std is not None and mn is not None and mx is not None:
            rng = mx - mn
            derived[f'shape_ratio_{axis}'] = round(std / rng, 3) if rng > 1e-9 else None
        else:
            derived[f'shape_ratio_{axis}'] = None

        # Range
        if mn is not None and mx is not None:
            derived[f'a{axis}_range'] = round(mx - mn, 3)
        else:
            derived[f'a{axis}_range'] = None

    # Virtual frequency identification
    rpm = features.get('rpm')
    speed = features.get('speed')
    dom_freq = features.get('dominant_freq')
    dom_amp = features.get('dominant_amp')

    if dom_freq is not None and dom_amp is not None and rpm and rpm > 0:
        engine_base = rpm / 60.0
        best_source = 'unknown'
        best_order = None

        # Check engine harmonics (orders 1-8)
        for order in range(1, 9):
            expected = engine_base * order
            if abs(dom_freq - expected) < 5.0:
                best_source = 'engine'
                best_order = order
                break

        # Check wheel harmonics if not engine
        if best_source == 'unknown' and speed and speed > 5:
            tire_freq = speed / (3.6 * math.pi * TIRE_DIAMETER)
            for harmonic in range(1, 13):
                expected = tire_freq * harmonic
                if abs(dom_freq - expected) < 5.0:
                    best_source = 'wheel'
                    best_order = harmonic
                    break

        derived['virtual_freq_source'] = best_source
        derived['virtual_freq_order'] = best_order
    else:
        derived['virtual_freq_source'] = None
        derived['virtual_freq_order'] = None

    return derived
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_derived.py -v`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_derived.py
git commit -m "feat: add derived diagnostic features (crest factor, shape ratio, virtual freq)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Anomaly Scoring Engine

**Files:**
- Modify: `dashboard_build/anomaly_engine.py`
- Create: `dashboard_build/tests/test_scoring.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_scoring.py
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import (
    compute_anomaly_score, BaselineStore, Regime,
    FEATURE_WEIGHTS, ROAD_CORRECTION
)


def _trained_store():
    """Build a baseline store with 50 samples of 'normal' city driving."""
    store = BaselineStore()
    for _ in range(50):
        store.update(Regime.CITY, {
            'az_std': 1.2, 'ax_std': 0.5, 'ay_std': 0.6,
            'total_vibration': 1.5, 'az_range': 3.0,
            'rpm': 1800, 'coolant': 85, 'voltage': 14.2,
            'audio_quality': 50, 'dominant_freq': 100, 'dominant_amp': 500,
        })
    return store


class TestAnomalyScore:

    def test_healthy_car_scores_high(self):
        store = _trained_store()
        features = {
            'az_std': 1.2, 'ax_std': 0.5, 'ay_std': 0.6,
            'total_vibration': 1.5, 'az_range': 3.0,
            'rpm': 1800, 'coolant': 85, 'voltage': 14.2,
            'audio_quality': 50, 'dominant_freq': 100, 'dominant_amp': 500,
        }
        result = compute_anomaly_score(features, store, Regime.CITY)
        assert result['overall'] >= 80

    def test_high_vibration_scores_low(self):
        store = _trained_store()
        features = {
            'az_std': 8.0,  # Way above baseline of 1.2
            'ax_std': 0.5, 'ay_std': 0.6,
            'total_vibration': 8.1, 'az_range': 15.0,
            'rpm': 1800, 'coolant': 85, 'voltage': 14.2,
            'audio_quality': 50, 'dominant_freq': 100, 'dominant_amp': 500,
        }
        result = compute_anomaly_score(features, store, Regime.CITY)
        assert result['overall'] < 50
        assert result['systems']['suspension']['score'] < 30

    def test_gravel_correction_reduces_penalty(self):
        store = _trained_store()
        features = {
            'az_std': 5.0, 'ax_std': 2.0, 'ay_std': 1.5,
            'total_vibration': 5.5, 'az_range': 10.0,
            'rpm': 1800, 'coolant': 85, 'voltage': 14.2,
        }
        score_asphalt = compute_anomaly_score(features, store, Regime.CITY, 'asphalt')
        score_gravel = compute_anomaly_score(features, store, Regime.CITY, 'gravel')
        assert score_gravel['overall'] > score_asphalt['overall']

    def test_missing_features_dont_crash(self):
        store = _trained_store()
        features = {'az_std': 1.2}
        result = compute_anomaly_score(features, store, Regime.CITY)
        assert 'overall' in result
        assert isinstance(result['overall'], int)

    def test_returns_per_system_breakdown(self):
        store = _trained_store()
        features = {'az_std': 1.2, 'coolant': 85, 'voltage': 14.2}
        result = compute_anomaly_score(features, store, Regime.CITY)
        assert 'suspension' in result['systems']
        assert 'engine' in result['systems']
        assert 'electrical' in result['systems']
        assert 'audio' in result['systems']

    def test_feature_status_classification(self):
        store = _trained_store()
        features = {
            'az_std': 1.2,  # Normal (z ≈ 0)
            'coolant': 120,  # Very high (z >> 3)
            'voltage': 14.2,
        }
        result = compute_anomaly_score(features, store, Regime.CITY)
        engine_feats = result['systems']['engine']['features']
        assert engine_feats['coolant']['status'] == 'critical'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_scoring.py -v`
Expected: FAIL — `ImportError: cannot import name 'compute_anomaly_score'`

- [ ] **Step 3: Implement anomaly scoring**

Append to `dashboard_build/anomaly_engine.py`:

```python
# ── Anomaly Scoring ──────────────────────────────────────────────────

FEATURE_WEIGHTS = {
    'suspension': {
        'az_std': 3.0,
        'total_vibration': 2.5,
        'az_range': 2.0,
        'ax_std': 1.0,
        'ay_std': 1.5,
    },
    'engine': {
        'rpm': 2.0,
        'coolant': 3.0,
        'dominant_freq': 2.0,
        'dominant_amp': 1.5,
    },
    'electrical': {
        'voltage': 3.0,
    },
    'audio': {
        'audio_quality': 1.0,
        'dominant_freq': 2.0,
        'dominant_amp': 2.5,
    },
}

ROAD_CORRECTION = {
    'standstill': {'az_std': 0.1, 'total_vibration': 0.1, 'ax_std': 0.1, 'ay_std': 0.1, 'az_range': 0.1},
    'asphalt':    {'az_std': 1.0, 'total_vibration': 1.0, 'ax_std': 1.0, 'ay_std': 1.0, 'az_range': 1.0},
    'gravel':     {'az_std': 0.3, 'total_vibration': 0.3, 'ax_std': 0.4, 'ay_std': 0.4, 'az_range': 0.3},
}


def compute_anomaly_score(features, baselines, regime, road_type='asphalt'):
    """
    Compute anomaly score 0-100 with per-system breakdown.

    Score mapping: z=0 -> 100 (healthy), z=4 -> 0 (broken).
    """
    road_factors = ROAD_CORRECTION.get(road_type, ROAD_CORRECTION['asphalt'])

    system_scores = {}
    all_weighted_z = []
    all_weights = []

    for system, weights in FEATURE_WEIGHTS.items():
        feat_details = {}
        sys_z_sum = 0.0
        sys_w_sum = 0.0

        for feat, weight in weights.items():
            val = features.get(feat)
            if val is None:
                feat_details[feat] = {'z': 0.0, 'value': None, 'status': 'missing'}
                continue

            bl = baselines.get(regime, feat)
            raw_z = z_score_with_fallback(bl, val, regime, feat)
            correction = road_factors.get(feat, 1.0)
            corrected_z = raw_z * correction
            anomaly_z = abs(corrected_z)

            if anomaly_z < 1.5:
                status = 'ok'
            elif anomaly_z < 3.0:
                status = 'warning'
            else:
                status = 'critical'

            feat_details[feat] = {
                'z': round(corrected_z, 2),
                'value': round(val, 2),
                'baseline_mean': round(bl.mean, 2) if bl.count > 0 else None,
                'baseline_std': round(bl.std, 2) if bl.count > 0 else None,
                'status': status,
            }
            sys_z_sum += anomaly_z * weight
            sys_w_sum += weight

        if sys_w_sum > 0:
            avg_z = sys_z_sum / sys_w_sum
            system_score = max(0, min(100, int(100 - avg_z * 25)))
        else:
            system_score = -1
            avg_z = 0

        system_scores[system] = {
            'score': system_score,
            'avg_z': round(avg_z, 2),
            'features': feat_details,
        }
        if sys_w_sum > 0:
            all_weighted_z.append(avg_z * sys_w_sum)
            all_weights.append(sys_w_sum)

    if all_weights:
        total_z = sum(all_weighted_z) / sum(all_weights)
        overall = max(0, min(100, int(100 - total_z * 25)))
    else:
        overall = -1

    return {
        'overall': overall,
        'systems': system_scores,
        'confidence': baselines.confidence(regime),
        'regime': regime.value,
        'road_type': road_type,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_scoring.py -v`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_scoring.py
git commit -m "feat: add multi-sensor anomaly scoring with road correction

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Diagnostic Rules + Confidence

**Files:**
- Modify: `dashboard_build/anomaly_engine.py`
- Create: `dashboard_build/tests/test_rules.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_rules.py
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import DiagnosticRule, DIAGNOSTIC_RULES, run_diagnostics, BaselineStore, Regime


def _trained_store():
    store = BaselineStore()
    for _ in range(50):
        store.update(Regime.CITY, {
            'az_std': 1.2, 'total_vibration': 1.5, 'az_range': 3.0,
            'ay_std': 0.6, 'coolant': 85, 'voltage': 14.2,
            'dominant_freq': 100, 'dominant_amp': 500, 'audio_quality': 50,
            'speed': 40, 'ax_std': 0.5,
        })
    return store


class TestDiagnosticRule:

    def test_all_conditions_met_high_confidence(self):
        rule = DiagnosticRule(
            name='test_rule', display='Test',
            conditions=[('az_std', '>', 3.0, 3), ('total_vibration', '>', 4.0, 2)]
        )
        features = {'az_std': 5.0, 'total_vibration': 6.0}
        store = _trained_store()
        result = rule.evaluate(features, store, Regime.CITY, history_length=5)
        assert result['confidence'] >= 60
        assert result['status'] in ('likely', 'possible')

    def test_no_conditions_met_zero_confidence(self):
        rule = DiagnosticRule(
            name='test_rule', display='Test',
            conditions=[('az_std', '>', 10.0, 3)]
        )
        features = {'az_std': 1.0}
        store = _trained_store()
        result = rule.evaluate(features, store, Regime.CITY)
        assert result['confidence'] == 0

    def test_partial_conditions_moderate_confidence(self):
        rule = DiagnosticRule(
            name='test_rule', display='Test',
            conditions=[
                ('az_std', '>', 3.0, 3),
                ('total_vibration', '>', 4.0, 2),
                ('ay_std', '>', 2.0, 1),
            ]
        )
        features = {'az_std': 5.0, 'total_vibration': 3.0, 'ay_std': 0.5}
        store = _trained_store()
        result = rule.evaluate(features, store, Regime.CITY)
        assert 0 < result['confidence'] < 70

    def test_persistence_bonus(self):
        rule = DiagnosticRule(
            name='test_rule', display='Test',
            conditions=[('az_std', '>', 3.0, 3)]
        )
        features = {'az_std': 5.0}
        store = _trained_store()
        r1 = rule.evaluate(features, store, Regime.CITY, history_length=1)
        r5 = rule.evaluate(features, store, Regime.CITY, history_length=5)
        assert r5['confidence'] > r1['confidence']


class TestRunDiagnostics:

    def test_returns_sorted_by_confidence(self):
        store = _trained_store()
        features = {
            'az_std': 8.0, 'total_vibration': 9.0, 'az_range': 15.0,
            'ay_std': 3.0, 'coolant': 85, 'voltage': 14.2,
            'dominant_freq': 100, 'dominant_amp': 500,
            'speed': 40, 'ax_std': 0.5, 'audio_quality': 50,
        }
        results = run_diagnostics(features, store, Regime.CITY)
        assert len(results) > 0
        for i in range(len(results) - 1):
            assert results[i]['confidence'] >= results[i + 1]['confidence']

    def test_worn_suspension_detected(self):
        store = _trained_store()
        features = {
            'az_std': 8.0, 'total_vibration': 9.0, 'az_range': 15.0,
            'ay_std': 3.0, 'ax_std': 0.5,
        }
        results = run_diagnostics(features, store, Regime.CITY)
        names = [r['name'] for r in results if r['confidence'] > 30]
        assert 'worn_suspension' in names

    def test_healthy_car_no_alerts(self):
        store = _trained_store()
        features = {
            'az_std': 1.2, 'total_vibration': 1.5, 'az_range': 3.0,
            'ay_std': 0.6, 'coolant': 85, 'voltage': 14.2,
            'dominant_freq': 100, 'dominant_amp': 500,
            'speed': 40, 'ax_std': 0.5, 'audio_quality': 50,
        }
        results = run_diagnostics(features, store, Regime.CITY)
        high_conf = [r for r in results if r['confidence'] > 40]
        assert len(high_conf) == 0

    def test_all_rules_exist(self):
        expected = ['worn_suspension', 'engine_overheating', 'alternator_failure',
                    'wheel_imbalance', 'exhaust_leak', 'bearing_wear', 'engine_mount_wear']
        rule_names = [r.name for r in DIAGNOSTIC_RULES]
        for name in expected:
            assert name in rule_names
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_rules.py -v`
Expected: FAIL — `ImportError: cannot import name 'DiagnosticRule'`

- [ ] **Step 3: Implement diagnostic rules**

Append to `dashboard_build/anomaly_engine.py`:

```python
# ── Diagnostic Rules ─────────────────────────────────────────────────

@dataclass
class DiagnosticRule:
    name: str
    display: str
    conditions: list  # [(feature, operator, threshold, weight), ...]

    def evaluate(self, features, baselines, regime, history_length=1):
        met = 0
        total_weight = 0
        deviation_scores = []

        for feat, op, thresh, weight in self.conditions:
            val = features.get(feat)
            total_weight += weight

            if val is None:
                continue

            matched = False
            excess_ratio = 0.0

            if op == '>' and val > thresh:
                matched = True
                excess_ratio = (val - thresh) / max(abs(thresh), 0.1)
            elif op == '<' and val < thresh:
                matched = True
                excess_ratio = (thresh - val) / max(abs(thresh), 0.1)
            elif op == 'z>':
                bl = baselines.get(regime, feat)
                z = abs(z_score_with_fallback(bl, val, regime, feat))
                if z > thresh:
                    matched = True
                    excess_ratio = z / 5.0

            if matched:
                met += weight
                deviation_scores.append(min(excess_ratio, 3.0) / 3.0 * weight)

        if total_weight == 0:
            return {'name': self.name, 'display': self.display,
                    'confidence': 0, 'met_conditions': 0, 'total_conditions': 0,
                    'match_pct': 0, 'status': 'no_data'}

        match_score = (met / total_weight) * 40
        dev_score = (sum(deviation_scores) / total_weight) * 40 if deviation_scores else 0
        persistence_score = min(history_length / 5.0, 1.0) * 20

        confidence = max(0, min(100, int(match_score + dev_score + persistence_score)))

        if confidence >= 70:
            status = 'likely'
        elif confidence >= 40:
            status = 'possible'
        elif confidence > 0:
            status = 'unlikely'
        else:
            status = 'clear'

        return {
            'name': self.name, 'display': self.display,
            'confidence': confidence,
            'met_conditions': met, 'total_conditions': total_weight,
            'match_pct': round(met / total_weight * 100),
            'status': status,
        }


DIAGNOSTIC_RULES = [
    DiagnosticRule('worn_suspension', 'Износ подвески', [
        ('az_std', '>', 3.0, 3),
        ('total_vibration', '>', 4.0, 2),
        ('az_range', '>', 8.0, 2),
        ('ay_std', '>', 2.0, 1),
        ('az_std', 'z>', 2.0, 3),
    ]),
    DiagnosticRule('engine_overheating', 'Перегрев двигателя', [
        ('coolant', '>', 100, 3),
        ('coolant', 'z>', 2.0, 2),
        ('rpm', '>', 1200, 1),
    ]),
    DiagnosticRule('alternator_failure', 'Неисправность генератора', [
        ('voltage', '<', 13.0, 3),
        ('voltage', 'z>', 2.5, 2),
        ('rpm', '>', 1000, 1),
    ]),
    DiagnosticRule('wheel_imbalance', 'Дисбаланс колёс', [
        ('az_std', 'z>', 2.0, 2),
        ('total_vibration', '>', 3.0, 2),
        ('speed', '>', 60, 2),
        ('ax_std', 'z>', 1.5, 1),
    ]),
    DiagnosticRule('exhaust_leak', 'Утечка выхлопа', [
        ('dominant_freq', '<', 80, 2),
        ('dominant_amp', 'z>', 2.0, 3),
        ('audio_quality', '<', 40, 1),
    ]),
    DiagnosticRule('bearing_wear', 'Износ подшипников', [
        ('dominant_freq', '>', 200, 2),
        ('dominant_amp', 'z>', 2.5, 3),
        ('ay_std', 'z>', 2.0, 1),
    ]),
    DiagnosticRule('engine_mount_wear', 'Износ опор двигателя', [
        ('az_std', 'z>', 2.0, 3),
        ('dominant_amp', 'z>', 2.0, 2),
        ('rpm', '>', 1500, 1),
    ]),
]


def run_diagnostics(features, baselines, regime, persistence_counts=None):
    if persistence_counts is None:
        persistence_counts = {}
    results = []
    for rule in DIAGNOSTIC_RULES:
        history = persistence_counts.get(rule.name, 1)
        result = rule.evaluate(features, baselines, regime, history)
        results.append(result)
    results.sort(key=lambda r: r['confidence'], reverse=True)
    return results
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_rules.py -v`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_rules.py
git commit -m "feat: add 7 diagnostic rules with confidence scoring

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: CUSUM Change-Point Detection

**Files:**
- Modify: `dashboard_build/anomaly_engine.py`
- Create: `dashboard_build/tests/test_cusum.py`

- [ ] **Step 1: Write failing tests**

```python
# dashboard_build/tests/test_cusum.py
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import CUSUMDetector, DegradationTracker


class TestCUSUMDetector:

    def test_stable_signal_no_alarm(self):
        det = CUSUMDetector(k=5, h=15, target=85)
        for _ in range(100):
            result = det.update(85)
        assert not result['alarm']

    def test_sustained_drop_triggers_alarm(self):
        det = CUSUMDetector(k=5, h=15, target=85)
        for _ in range(20):
            det.update(85)
        alarm_triggered = False
        for _ in range(10):
            result = det.update(60)  # Score drops to 60
            if result['alarm']:
                alarm_triggered = True
        assert alarm_triggered

    def test_single_spike_no_alarm(self):
        det = CUSUMDetector(k=5, h=15, target=85)
        for _ in range(50):
            det.update(85)
        det.update(50)  # Single bad reading
        result = det.update(85)  # Back to normal
        assert not result['alarm']

    def test_new_alarm_flag(self):
        det = CUSUMDetector(k=3, h=10, target=85)
        results = []
        for _ in range(20):
            results.append(det.update(50))
        new_alarms = [r for r in results if r.get('new_alarm')]
        assert len(new_alarms) == 1

    def test_reset(self):
        det = CUSUMDetector(k=3, h=10, target=85)
        for _ in range(20):
            det.update(50)
        det.reset()
        assert not det.alarm
        assert det.s_high == 0.0


class TestDegradationTracker:

    def test_healthy_driving(self):
        tracker = DegradationTracker(target_score=85)
        for _ in range(100):
            result = tracker.update(85)
        assert not result['degradation_detected']

    def test_gradual_degradation(self):
        tracker = DegradationTracker(target_score=85)
        for i in range(100):
            score = 85 - i * 0.3  # Slow decline
            result = tracker.update(max(score, 0))
        assert result['degradation_detected']
        assert result['trend_per_day'] < 0

    def test_trend_calculation(self):
        tracker = DegradationTracker(target_score=85)
        for _ in range(60):
            tracker.update(80)
        result = tracker.update(80)
        # Stable at 80 -> trend should be near 0
        assert abs(result['trend_per_day']) < 1.0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard_build && python -m pytest tests/test_cusum.py -v`
Expected: FAIL — `ImportError: cannot import name 'CUSUMDetector'`

- [ ] **Step 3: Implement CUSUM**

Append to `dashboard_build/anomaly_engine.py`:

```python
# ── CUSUM Change-Point Detection ─────────────────────────────────────

@dataclass
class CUSUMDetector:
    k: float = 5.0
    h: float = 15.0
    s_high: float = 0.0
    s_low: float = 0.0
    alarm: bool = False
    alarm_start_idx: int = -1
    sample_count: int = 0
    target: float = 0.0

    def update(self, value):
        self.sample_count += 1
        badness = self.target - value
        self.s_high = max(0, self.s_high + badness - self.k)
        self.s_low = min(0, self.s_low + badness + self.k)
        was_alarm = self.alarm

        if self.s_high > self.h:
            if not self.alarm:
                self.alarm = True
                self.alarm_start_idx = self.sample_count
            magnitude = self.s_high
        elif self.s_low < -self.h:
            self.alarm = False
            self.s_high = 0.0
            magnitude = abs(self.s_low)
        else:
            magnitude = max(self.s_high, abs(self.s_low))

        return {
            'alarm': self.alarm,
            'cusum_value': round(self.s_high, 2),
            'magnitude': round(magnitude, 2),
            'started_at': self.alarm_start_idx if self.alarm else None,
            'new_alarm': self.alarm and not was_alarm,
        }

    def reset(self):
        self.s_high = 0.0
        self.s_low = 0.0
        self.alarm = False


class DegradationTracker:
    def __init__(self, target_score=85):
        self.short = CUSUMDetector(k=3, h=10, target=target_score)
        self.medium = CUSUMDetector(k=5, h=15, target=target_score)
        self.long = CUSUMDetector(k=8, h=25, target=target_score)
        self.history: List[float] = []
        self.max_history = 1000

    def update(self, score):
        self.history.append(score)
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

        short_r = self.short.update(score)
        medium_r = self.medium.update(score)
        long_r = self.long.update(score)
        trend = self._compute_trend(50)

        return {
            'current_score': score,
            'short_term': short_r,
            'medium_term': medium_r,
            'long_term': long_r,
            'trend_per_day': round(trend, 2),
            'degradation_detected': short_r['alarm'] or medium_r['alarm'] or long_r['alarm'],
        }

    def _compute_trend(self, n):
        data = self.history[-n:]
        if len(data) < 10:
            return 0.0
        n_pts = len(data)
        x_mean = (n_pts - 1) / 2.0
        y_mean = sum(data) / n_pts
        num = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(data))
        den = sum((i - x_mean) ** 2 for i in range(n_pts))
        if abs(den) < 1e-9:
            return 0.0
        slope_per_sample = num / den
        samples_per_day = 144
        return slope_per_sample * samples_per_day
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard_build && python -m pytest tests/test_cusum.py -v`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/anomaly_engine.py dashboard_build/tests/test_cusum.py
git commit -m "feat: add CUSUM change-point detection (3 time scales)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: DB Schema + API Endpoints + URL Routes

**Files:**
- Create: `dashboard_build/schema_anomaly.sql`
- Modify: `dashboard_build/views.py`
- Modify: `dashboard_build/urls.py`
- Create: `dashboard_build/tests/test_api.py`

- [ ] **Step 1: Create DB schema**

```sql
-- dashboard_build/schema_anomaly.sql
-- Run on server: psql -U postgres -d vehinfo -f schema_anomaly.sql

CREATE TABLE IF NOT EXISTS anomaly_baselines (
    id SERIAL PRIMARY KEY,
    client_hash VARCHAR(64) NOT NULL,
    regime VARCHAR(20) NOT NULL,
    feature VARCHAR(40) NOT NULL,
    count INTEGER DEFAULT 0,
    mean DOUBLE PRECISION DEFAULT 0,
    m2 DOUBLE PRECISION DEFAULT 0,
    min_val DOUBLE PRECISION DEFAULT 1e18,
    max_val DOUBLE PRECISION DEFAULT -1e18,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_hash, regime, feature)
);
CREATE INDEX IF NOT EXISTS idx_baselines_client ON anomaly_baselines(client_hash);

CREATE TABLE IF NOT EXISTS anomaly_scores (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    regime VARCHAR(20),
    road_type VARCHAR(20),
    overall_score INTEGER,
    suspension_score INTEGER,
    engine_score INTEGER,
    electrical_score INTEGER,
    audio_score INTEGER,
    confidence REAL,
    cusum_short REAL DEFAULT 0,
    cusum_medium REAL DEFAULT 0,
    cusum_long REAL DEFAULT 0,
    degradation_detected BOOLEAN DEFAULT FALSE,
    trend_per_day REAL DEFAULT 0,
    top_diagnostic VARCHAR(40),
    top_diagnostic_confidence INTEGER DEFAULT 0,
    features_json JSONB
);
SELECT create_hypertable('anomaly_scores', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_scores_client_time ON anomaly_scores(client_hash, time DESC);

CREATE TABLE IF NOT EXISTS diagnostic_persistence (
    client_hash VARCHAR(64) NOT NULL,
    rule_name VARCHAR(40) NOT NULL,
    consecutive_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    PRIMARY KEY(client_hash, rule_name)
);

SELECT add_retention_policy('anomaly_scores', INTERVAL '90 days', if_not_exists => TRUE);
```

- [ ] **Step 2: Write API integration tests**

```python
# dashboard_build/tests/test_api.py
import pytest
import json
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from anomaly_engine import (
    classify_regime, Regime, BaselineStore,
    compute_derived_features, compute_anomaly_score,
    run_diagnostics, DegradationTracker,
)


class TestFullPipeline:
    """Integration test: simulate full anomaly scoring pipeline."""

    def test_end_to_end_healthy(self):
        """Simulate 100 windows of healthy city driving, then score."""
        store = BaselineStore()
        for _ in range(100):
            features = {
                'ax_avg': 0.1, 'ay_avg': 0.05, 'az_avg': -9.8,
                'ax_std': 0.5, 'ay_std': 0.6, 'az_std': 1.2,
                'ax_min': -1.0, 'ax_max': 1.0,
                'ay_min': -1.2, 'ay_max': 1.2,
                'az_min': -11.0, 'az_max': -8.6,
                'rpm': 1800, 'speed': 40, 'coolant': 85, 'voltage': 14.2,
                'dominant_freq': 100, 'dominant_amp': 500, 'audio_quality': 50,
            }
            regime = classify_regime(
                features['speed'], features['rpm'],
                features['ax_avg'], features['ay_avg'],
                features['az_std'], 'asphalt'
            )
            assert regime == Regime.CITY

            derived = compute_derived_features(features)
            features.update(derived)
            store.update(regime, features)

        # Now score a normal reading
        score = compute_anomaly_score(features, store, regime)
        assert score['overall'] >= 80

        diags = run_diagnostics(features, store, regime)
        high = [d for d in diags if d['confidence'] > 40]
        assert len(high) == 0

    def test_end_to_end_fault_detection(self):
        """Build baseline, then introduce fault -> should detect."""
        store = BaselineStore()
        for _ in range(50):
            store.update(Regime.CITY, {
                'az_std': 1.2, 'total_vibration': 1.5, 'az_range': 3.0,
                'ay_std': 0.6, 'ax_std': 0.5,
                'coolant': 85, 'voltage': 14.2,
                'dominant_freq': 100, 'dominant_amp': 500, 'audio_quality': 50,
                'speed': 40, 'rpm': 1800,
            })

        # Introduce suspension fault
        fault_features = {
            'az_std': 7.0, 'total_vibration': 7.5, 'az_range': 14.0,
            'ay_std': 2.5, 'ax_std': 0.5,
            'coolant': 85, 'voltage': 14.2,
            'dominant_freq': 100, 'dominant_amp': 500, 'audio_quality': 50,
            'speed': 40, 'rpm': 1800,
        }
        score = compute_anomaly_score(fault_features, store, Regime.CITY)
        assert score['overall'] < 50

        diags = run_diagnostics(fault_features, store, Regime.CITY)
        assert diags[0]['name'] == 'worn_suspension'
        assert diags[0]['confidence'] > 40

    def test_degradation_tracking(self):
        """Gradually worsening scores should trigger CUSUM alarm."""
        tracker = DegradationTracker(target_score=85)
        for i in range(80):
            score = max(0, 85 - i * 0.5)
            result = tracker.update(score)
        assert result['degradation_detected']
        assert result['trend_per_day'] < -5
```

- [ ] **Step 3: Run tests to verify they pass** (these are integration tests using existing code)

Run: `cd dashboard_build && python -m pytest tests/test_api.py -v`
Expected: All 3 tests PASS

- [ ] **Step 4: Add API endpoints to views.py**

Add these imports at top of `dashboard_build/views.py`:

```python
from anomaly_engine import (
    classify_regime, Regime, BaselineStore, RegimeBaseline,
    compute_derived_features, compute_anomaly_score,
    run_diagnostics, DegradationTracker, CUSUMDetector,
    z_score_with_fallback, BASELINE_FEATURES,
)
```

Add two new view functions at the end of `dashboard_build/views.py`:

```python
# ── Anomaly Scoring API ──────────────────────────────────────────────

def _load_baselines(client_hash):
    store = BaselineStore()
    with _vehinfo() as c:
        c.execute("""
            SELECT regime, feature, count, mean, m2, min_val, max_val
            FROM anomaly_baselines WHERE client_hash = %s
        """, [client_hash])
        for row in _dictfetchall(c):
            try:
                regime = Regime(row['regime'])
            except ValueError:
                continue
            bl = store.get(regime, row['feature'])
            bl.count = row['count']
            bl.mean = row['mean']
            bl.m2 = row['m2']
            bl.min_val = row['min_val']
            bl.max_val = row['max_val']
    return store


def _save_baselines(client_hash, store):
    with _vehinfo() as c:
        for (regime_str, feat), bl in store.baselines.items():
            if bl.count == 0:
                continue
            c.execute("""
                INSERT INTO anomaly_baselines
                    (client_hash, regime, feature, count, mean, m2, min_val, max_val, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (client_hash, regime, feature)
                DO UPDATE SET count=EXCLUDED.count, mean=EXCLUDED.mean,
                    m2=EXCLUDED.m2, min_val=EXCLUDED.min_val,
                    max_val=EXCLUDED.max_val, updated_at=NOW()
            """, [client_hash, regime_str, feat, bl.count, bl.mean,
                  bl.m2, bl.min_val, bl.max_val])


def _extract_features(client_hash, minutes=10):
    cf = "AND client_hash = %s" if client_hash else ""
    params = [client_hash] if client_hash else []
    features = {}
    road_type = 'asphalt'

    with _vehinfo() as c:
        c.execute(f"""
            SELECT ax_avg, ay_avg, az_avg, ax_std, ay_std, az_std,
                   ax_min, ax_max, ay_min, ay_max, az_min, az_max
            FROM accel_windows
            WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, params)
        rows = _dictfetchall(c)

    if rows:
        r = rows[0]
        features.update({
            'ax_avg': qtp_avg(r['ax_avg']), 'ay_avg': qtp_avg(r['ay_avg']), 'az_avg': qtp_avg(r['az_avg']),
            'ax_std': qtp_std(r['ax_std']), 'ay_std': qtp_std(r['ay_std']), 'az_std': qtp_std(r['az_std']),
            'ax_min': qtp_avg(r['ax_min']), 'ax_max': qtp_avg(r['ax_max']),
            'ay_min': qtp_avg(r['ay_min']), 'ay_max': qtp_avg(r['ay_max']),
            'az_min': qtp_avg(r['az_min']), 'az_max': qtp_avg(r['az_max']),
        })

    with _vehinfo() as c:
        c.execute(f"""
            SELECT p010c, p010d, p0105, p0142
            FROM ecu_7e8
            WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, params)
        rows = _dictfetchall(c)

    if rows:
        r = rows[0]
        features['rpm'] = float(r['p010c']) if r.get('p010c') is not None else None
        features['speed'] = float(r['p010d']) if r.get('p010d') is not None else None
        features['coolant'] = float(r['p0105']) if r.get('p0105') is not None else None
        features['voltage'] = round(float(r['p0142']) / 1000.0, 1) if r.get('p0142') is not None else None

    with _vehinfo() as c:
        c.execute(f"""
            SELECT freq_1, amp_1, freq_2, amp_2, freq_3, amp_3,
                   freq_4, amp_4, freq_5, amp_5, quality
            FROM audio_windows
            WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, params)
        rows = _dictfetchall(c)

    if rows:
        r = rows[0]
        pairs = []
        for i in range(1, 6):
            f = r.get(f'freq_{i}')
            a = r.get(f'amp_{i}')
            if f and f > 0:
                pairs.append((float(f), abs(float(a)) if a else 0))
        if pairs:
            dominant = max(pairs, key=lambda p: p[1])
            features['dominant_freq'] = dominant[0]
            features['dominant_amp'] = dominant[1]
        features['audio_quality'] = float(r['quality']) if r.get('quality') is not None else None

    with _vehinfo() as c:
        c.execute(f"""
            SELECT road_type FROM qtp_packets
            WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, params)
        rows = _dictfetchall(c)
    if rows and rows[0].get('road_type'):
        road_type = rows[0]['road_type']

    return features, road_type


@require_GET
@never_cache
def api_anomaly(request):
    """GET /api/anomaly/?client=HASH — live anomaly score + diagnostics."""
    client = request.GET.get('client', '')
    if not client:
        return JsonResponse({'error': 'client parameter required'}, status=400)

    features, road_type = _extract_features(client, minutes=10)
    if not features:
        return JsonResponse({
            'overall': -1, 'status': 'no_data',
            'message': 'No data in last 10 minutes',
            'systems': {}, 'diagnostics': [], 'change_points': {},
        })

    baselines = _load_baselines(client)
    regime = classify_regime(
        speed=features.get('speed'), rpm=features.get('rpm'),
        ax_avg=features.get('ax_avg'), ay_avg=features.get('ay_avg'),
        az_std=features.get('az_std'), road_type=road_type,
    )

    derived = compute_derived_features(features)
    features.update(derived)
    baselines.update(regime, features)
    _save_baselines(client, baselines)

    score_result = compute_anomaly_score(features, baselines, regime, road_type)

    # Load persistence
    persistence = {}
    with _vehinfo() as c:
        c.execute("SELECT rule_name, consecutive_count FROM diagnostic_persistence WHERE client_hash = %s", [client])
        for row in _dictfetchall(c):
            persistence[row['rule_name']] = row['consecutive_count']

    diagnostics = run_diagnostics(features, baselines, regime, persistence)

    # Update persistence
    with _vehinfo() as c:
        for diag in diagnostics:
            new_count = persistence.get(diag['name'], 0) + 1 if diag['confidence'] >= 40 else 0
            c.execute("""
                INSERT INTO diagnostic_persistence (client_hash, rule_name, consecutive_count, last_triggered)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (client_hash, rule_name)
                DO UPDATE SET consecutive_count = EXCLUDED.consecutive_count, last_triggered = NOW()
            """, [client, diag['name'], new_count])

    # CUSUM on historical scores
    with _vehinfo() as c:
        c.execute("""
            SELECT overall_score FROM anomaly_scores
            WHERE client_hash = %s AND overall_score IS NOT NULL
            ORDER BY time DESC LIMIT 200
        """, [client])
        hist_rows = _dictfetchall(c)

    scores_hist = [r['overall_score'] for r in reversed(hist_rows)]
    target = sum(scores_hist[:20]) / 20 if len(scores_hist) >= 20 else 85
    tracker = DegradationTracker(target_score=target)
    change_points = {}
    for s in scores_hist:
        change_points = tracker.update(s)
    if score_result['overall'] >= 0:
        change_points = tracker.update(score_result['overall'])

    # Store score
    top_diag = diagnostics[0] if diagnostics else None
    with _vehinfo() as c:
        c.execute("""
            INSERT INTO anomaly_scores
                (time, client_hash, regime, road_type, overall_score,
                 suspension_score, engine_score, electrical_score, audio_score,
                 confidence, degradation_detected, trend_per_day,
                 top_diagnostic, top_diagnostic_confidence, features_json)
            VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, [
            client, regime.value, road_type, score_result['overall'],
            score_result['systems'].get('suspension', {}).get('score', -1),
            score_result['systems'].get('engine', {}).get('score', -1),
            score_result['systems'].get('electrical', {}).get('score', -1),
            score_result['systems'].get('audio', {}).get('score', -1),
            score_result['confidence'],
            change_points.get('degradation_detected', False),
            change_points.get('trend_per_day', 0),
            top_diag['name'] if top_diag else None,
            top_diag['confidence'] if top_diag else 0,
            json.dumps({k: round(v, 3) if isinstance(v, float) else v for k, v in features.items()}),
        ])

    return JsonResponse({
        'overall': score_result['overall'],
        'status': 'ok' if score_result['overall'] >= 80 else 'warning' if score_result['overall'] >= 50 else 'critical',
        'confidence': round(score_result['confidence'], 2),
        'regime': score_result['regime'],
        'road_type': road_type,
        'systems': score_result['systems'],
        'diagnostics': [d for d in diagnostics if d['confidence'] > 0],
        'change_points': change_points,
        'features': {k: round(v, 3) if isinstance(v, float) else v for k, v in features.items()},
    })


@require_GET
@never_cache
def api_anomaly_history(request):
    """GET /api/anomaly/history/?client=HASH&days=7"""
    client = request.GET.get('client', '')
    try:
        days = min(int(request.GET.get('days', 7)), 90)
    except (ValueError, TypeError):
        days = 7

    if not client:
        return JsonResponse({'error': 'client parameter required'}, status=400)

    bucket_minutes = max(1, int(days * 24 * 60 / 500))

    with _vehinfo() as c:
        c.execute(f"""
            SELECT time_bucket('{bucket_minutes} minutes', time) AS bucket,
                   AVG(overall_score)::int AS score,
                   AVG(suspension_score)::int AS suspension,
                   AVG(engine_score)::int AS engine,
                   AVG(electrical_score)::int AS electrical,
                   AVG(audio_score)::int AS audio,
                   AVG(confidence)::real AS confidence,
                   BOOL_OR(degradation_detected) AS degradation,
                   AVG(trend_per_day)::real AS trend
            FROM anomaly_scores
            WHERE client_hash = %s AND time > NOW() - INTERVAL '{days} days'
            GROUP BY bucket ORDER BY bucket
        """, [client])
        rows = _dictfetchall(c)

    return JsonResponse({
        'history': [{
            'time': r['bucket'].isoformat(),
            'score': r['score'],
            'suspension': r['suspension'],
            'engine': r['engine'],
            'electrical': r['electrical'],
            'audio': r['audio'],
            'confidence': round(r['confidence'] or 0, 2),
            'degradation': r['degradation'],
            'trend': round(r['trend'] or 0, 2),
        } for r in rows],
        'days': days,
    })


def qtp_avg(v):
    """Convert QTP byte to acceleration m/s^2."""
    return round((v - 128) / 128.0 * 9.81, 2) if v is not None else None
```

- [ ] **Step 5: Add URL routes**

Add to `dashboard_build/urls.py`:

```python
    path('api/anomaly/', views.api_anomaly, name='api_anomaly'),
    path('api/anomaly/history/', views.api_anomaly_history, name='api_anomaly_history'),
```

- [ ] **Step 6: Run all tests**

Run: `cd dashboard_build && python -m pytest tests/ -v`
Expected: All ~48 tests PASS

- [ ] **Step 7: Commit**

```bash
git add dashboard_build/schema_anomaly.sql dashboard_build/views.py dashboard_build/urls.py dashboard_build/tests/test_api.py
git commit -m "feat: add /api/anomaly/ and /api/anomaly/history/ endpoints

New DB tables: anomaly_baselines, anomaly_scores, diagnostic_persistence.
Full pipeline: feature extraction -> regime -> baselines -> scoring -> rules -> CUSUM.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 8: Deploy to server**

```bash
# 1. Copy files to server
scp -i /tmp/id_ed25519 dashboard_build/anomaly_engine.py dashboard_build/shape_decoder.py dashboard_build/schema_anomaly.sql webadmin@185.55.57.145:/var/www/html/django/dashboard/

# 2. SSH and run migration
ssh -i /tmp/id_ed25519 webadmin@185.55.57.145
cd /var/www/html/django
psql -U postgres -d vehinfo -f dashboard/schema_anomaly.sql

# 3. Copy views.py and urls.py
# (use scp for updated files)

# 4. Restart gunicorn
kill -HUP $(cat /tmp/gunicorn.pid)

# 5. Test endpoint
curl -s "https://llcar.ru/api/anomaly/?client=YOUR_CLIENT_HASH" | python3 -m json.tool
```

Expected: JSON with `overall`, `systems`, `diagnostics`, `change_points`.

---

## Summary

| Task | Tests | Lines of Code | What it delivers |
|---|---|---|---|
| 1. Shape Decoder | 10 | ~40 | Correct QTP bitfield parsing |
| 2. Regime Classifier | 10 | ~45 | Driving mode classification |
| 3. Baseline Store | 13 | ~75 | Welford's algorithm + population priors |
| 4. Derived Features | 11 | ~70 | Crest factor, shape ratio, virtual frequency |
| 5. Anomaly Scoring | 6 | ~60 | Multi-sensor 0-100 score with road correction |
| 6. Diagnostic Rules | 7 | ~80 | 7 rules with confidence scoring |
| 7. CUSUM | 8 | ~55 | Change-point detection at 3 scales |
| 8. API + Deploy | 3 | ~150 | Django endpoints + DB schema + deploy |
| **Total** | **68** | **~575** | **Complete diagnostic engine** |
