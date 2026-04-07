"""
LLCAR Anomaly Detection Engine.

Multi-sensor diagnostic scoring for vehicle health monitoring.
Uses accelerometer, audio, and OBD-II data to detect mechanical faults.

Components:
  - Regime classifier (idle/city/highway/accel/brake/corner)
  - Welford baseline store with population priors
  - Derived features (crest factor, shape ratio, virtual frequency)
  - Multi-sensor anomaly scoring with road correction
  - 7 diagnostic rules with confidence scoring
  - CUSUM change-point detection (3 time scales)
"""
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Tuple


# ── Regime Classification ───────────────────────────────────────────

class Regime(Enum):
    IDLE = 'idle'
    CITY = 'city'
    HIGHWAY = 'highway'
    ACCELERATION = 'acceleration'
    BRAKING = 'braking'
    CORNERING = 'cornering'
    UNKNOWN = 'unknown'


def classify_regime(speed, rpm, ax_avg, ay_avg, az_std, road_type):
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


# ── Baseline Store (Welford's Online Algorithm) ──────────────────

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

    def get(self, regime, feature: str) -> RegimeBaseline:
        key = (regime.value if isinstance(regime, Regime) else regime, feature)
        if key not in self.baselines:
            self.baselines[key] = RegimeBaseline()
        return self.baselines[key]

    def update(self, regime, features: Dict[str, Optional[float]]):
        for feat, val in features.items():
            if val is not None:
                self.get(regime, feat).update(val)

    def is_ready(self, regime) -> bool:
        key_feats = ['az_std', 'total_vibration']
        return all(
            self.get(regime, f).count >= MIN_BASELINE_SAMPLES
            for f in key_feats
        )

    def confidence(self, regime) -> float:
        counts = [self.get(regime, f).count for f in BASELINE_FEATURES
                  if self.get(regime, f).count > 0]
        if not counts:
            return 0.0
        avg_count = sum(counts) / len(counts)
        return min(avg_count / GOOD_BASELINE_SAMPLES, 1.0)


def z_score_with_fallback(baseline, value, regime, feature):
    if value is None:
        return 0.0
    # Accept both Regime enum and string
    regime_enum = regime if isinstance(regime, Regime) else Regime(regime) if regime in [r.value for r in Regime] else None
    prior_key = (regime_enum, feature) if regime_enum else None
    if baseline.count >= MIN_BASELINE_SAMPLES:
        return baseline.z_score(value)
    if prior_key and prior_key in POPULATION_PRIORS:
        pop_mean, pop_std = POPULATION_PRIORS[prior_key]
        if baseline.count == 0:
            return (value - pop_mean) / max(pop_std, 1e-9)
        alpha = baseline.count / MIN_BASELINE_SAMPLES
        blended_mean = alpha * baseline.mean + (1 - alpha) * pop_mean
        blended_std = alpha * baseline.std + (1 - alpha) * pop_std
        return (value - blended_mean) / max(blended_std, 1e-9)
    return 0.0


# ── Derived Diagnostic Features ─────────────────────────────────

TIRE_DIAMETER = 0.63
NUM_CYLINDERS = 4


def compute_derived_features(features):
    derived = {}

    # Total vibration (RMS of std values)
    stds = []
    for axis in ('x', 'y', 'z'):
        s = features.get(f'a{axis}_std')
        if s is not None:
            stds.append(s)
    derived['total_vibration'] = math.sqrt(sum(s * s for s in stds)) if stds else None

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

        for order in range(1, 9):
            expected = engine_base * order
            if abs(dom_freq - expected) < 5.0:
                best_source = 'engine'
                best_order = order
                break

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


# ── Anomaly Scoring ─────────────────────────────────────────────

FEATURE_WEIGHTS = {
    'suspension': {
        'az_std': 3.0, 'total_vibration': 2.5, 'az_range': 2.0,
        'ax_std': 1.0, 'ay_std': 1.5,
    },
    'engine': {
        'rpm': 2.0, 'coolant': 3.0,
        'dominant_freq': 2.0, 'dominant_amp': 1.5,
    },
    'electrical': {
        'voltage': 3.0,
    },
    'audio': {
        'audio_quality': 1.0,
        'dominant_freq': 2.0, 'dominant_amp': 2.5,
    },
}

ROAD_CORRECTION = {
    'standstill': {'az_std': 0.1, 'total_vibration': 0.1, 'ax_std': 0.1, 'ay_std': 0.1, 'az_range': 0.1},
    'asphalt':    {'az_std': 1.0, 'total_vibration': 1.0, 'ax_std': 1.0, 'ay_std': 1.0, 'az_range': 1.0},
    'gravel':     {'az_std': 0.3, 'total_vibration': 0.3, 'ax_std': 0.4, 'ay_std': 0.4, 'az_range': 0.3},
}


def compute_anomaly_score(features, baselines, regime, road_type='asphalt'):
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
        'regime': regime.value if isinstance(regime, Regime) else regime,
        'road_type': road_type,
    }


# ── Diagnostic Rules ────────────────────────────────────────────

REGIME_NAMES = {
    'idle': 'холостой',
    'city': 'город',
    'highway': 'трасса',
    'acceleration': 'разгон',
    'braking': 'торможение',
    'cornering': 'поворот',
    'unknown': 'неизвестно',
    'standstill': 'стоянка',
}


@dataclass
class DiagnosticRule:
    name: str
    display: str
    conditions: list

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
                    'confidence': 0, 'status': 'no_data'}

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
            'match_pct': round(met / total_weight * 100),
            'status': status,
        }


DIAGNOSTIC_RULES = [
    DiagnosticRule('worn_suspension', 'Износ подвески', [
        ('az_std', '>', 3.0, 3), ('total_vibration', '>', 4.0, 2),
        ('az_range', '>', 8.0, 2), ('ay_std', '>', 2.0, 1),
        ('az_std', 'z>', 2.0, 3),
    ]),
    DiagnosticRule('engine_overheating', 'Перегрев двигателя', [
        ('coolant', '>', 100, 3), ('coolant', 'z>', 2.0, 2), ('rpm', '>', 1200, 1),
    ]),
    DiagnosticRule('alternator_failure', 'Неисправность генератора', [
        ('voltage', '<', 13.0, 3), ('voltage', 'z>', 2.5, 2), ('rpm', '>', 1000, 1),
    ]),
    DiagnosticRule('wheel_imbalance', 'Дисбаланс колёс', [
        ('az_std', 'z>', 2.0, 2), ('total_vibration', '>', 3.0, 2),
        ('speed', '>', 60, 2), ('ax_std', 'z>', 1.5, 1),
    ]),
    DiagnosticRule('exhaust_leak', 'Утечка выхлопа', [
        ('dominant_freq', '<', 80, 2), ('dominant_amp', 'z>', 2.0, 3),
        ('audio_quality', '<', 40, 1),
    ]),
    DiagnosticRule('bearing_wear', 'Износ подшипников', [
        ('dominant_freq', '>', 200, 2), ('dominant_amp', 'z>', 2.5, 3),
        ('ay_std', 'z>', 2.0, 1),
    ]),
    DiagnosticRule('engine_mount_wear', 'Износ опор двигателя', [
        ('az_std', 'z>', 2.0, 3), ('dominant_amp', 'z>', 2.0, 2),
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


# ── CUSUM Change-Point Detection ────────────────────────────────

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
    def __init__(self, target_score=85, target=None):
        if target is not None:
            target_score = target
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
