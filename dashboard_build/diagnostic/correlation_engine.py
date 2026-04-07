"""Correlation Engine — batch analysis of accel↔audio↔OBD data.

Runs post-trip, not real-time. Detects mechanical problems through
cross-correlation of vibration, audio, and OBD telemetry.

5 correlations:
  1. vibration_rpm:        az_std vs RPM → engine mount wear
  2. audio_wheel:          dominant_freq / tire_freq = const → wheel bearing
  3. turn_click:           ay+audio impulse during cornering → CV joint
  4. vibration_speed_peak: az_std peak at specific speed → wheel imbalance
  5. highfreq_vibration:   high-freq audio + vibration → accessory bearing
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional


TIRE_DIAMETER = 0.63  # meters (standard 205/55 R16)
MIN_DATA_POINTS = 50
R_THRESHOLD = 0.6


@dataclass
class CorrelationResult:
    correlation_type: str    # vibration_rpm, audio_wheel, turn_click, vibration_speed_peak, highfreq_vibration
    r_value: float           # correlation coefficient
    slope: float             # regression slope
    p_value: float           # statistical significance
    data_points: int         # number of data points used
    regime: str              # driving regime during analysis
    diagnosis_hint: str      # engine_mount, wheel_bearing, cv_joint, wheel_balance, accessory_bearing
    significant: bool        # True if r > threshold AND data_points >= MIN_DATA_POINTS


def _linregress(x: List[float], y: List[float]):
    """Simple linear regression. Returns (r, slope, p_value).

    No scipy dependency. Uses Pearson correlation formula.
    P-value is approximate (good for n > 30).
    """
    n = len(x)
    if n < 2:
        return 0.0, 0.0, 1.0

    sx = sum(x)
    sy = sum(y)
    sxx = sum(xi * xi for xi in x)
    sxy = sum(xi * yi for xi, yi in zip(x, y))
    syy = sum(yi * yi for yi in y)

    denom = n * sxx - sx * sx
    if abs(denom) < 1e-10:
        return 0.0, 0.0, 1.0

    slope = (n * sxy - sx * sy) / denom

    r_num = n * sxy - sx * sy
    r_denom_sq = (n * sxx - sx * sx) * (n * syy - sy * sy)
    if r_denom_sq <= 0:
        return 0.0, slope, 1.0

    r = r_num / (r_denom_sq ** 0.5)
    r = max(-1.0, min(1.0, r))  # clamp

    # Approximate p-value
    if abs(r) >= 0.9999:
        p = 0.0
    elif n <= 2:
        p = 1.0
    else:
        t_stat = r * math.sqrt((n - 2) / (1 - r * r))
        # Rough approximation for two-tailed p-value
        p = 2.0 * math.exp(-0.717 * abs(t_stat) - 0.416 * t_stat * t_stat)
        p = max(0.0, min(1.0, p))

    return r, slope, p


class CorrelationEngine:
    """Batch correlation analysis for accel↔audio data.

    Each window dict should have keys:
        az_std, ay_std, rpm, speed, dominant_freq, dominant_amp, regime, timestamp
    Not all keys are required for every correlation.
    """

    def __init__(self, tire_diameter: float = TIRE_DIAMETER):
        self.tire_diameter = tire_diameter

    def analyze_trip(self, windows: List[dict]) -> List[CorrelationResult]:
        """Run all 5 correlations. Returns only significant results."""
        results = []

        for method in (self._vibration_rpm, self._audio_wheel, self._turn_click,
                       self._vibration_speed_peak, self._highfreq_vibration):
            result = method(windows)
            if result is not None and result.significant:
                results.append(result)

        return results

    def _vibration_rpm(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 1: az_std vs RPM -> engine mount wear.

        Linear regression. Significant when r > 0.6, slope > 0, n >= 50.
        """
        x, y = [], []  # x=RPM, y=az_std
        for w in windows:
            rpm = w.get("rpm")
            az = w.get("az_std")
            if rpm is not None and az is not None and rpm > 0:
                x.append(rpm)
                y.append(az)

        if len(x) < MIN_DATA_POINTS:
            return None

        r, slope, p = _linregress(x, y)
        sig = abs(r) > R_THRESHOLD and slope > 0 and len(x) >= MIN_DATA_POINTS

        return CorrelationResult(
            correlation_type="vibration_rpm",
            r_value=r, slope=slope, p_value=p,
            data_points=len(x), regime="all",
            diagnosis_hint="engine_mount",
            significant=sig,
        )

    def _audio_wheel(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 2: dominant_freq / tire_freq = constant -> wheel bearing.

        tire_freq = speed / (3.6 * pi * diameter)
        Check if freq_ratio = dominant_freq / tire_freq is stable (std < 0.5).
        Only windows with speed > 30 km/h.
        """
        ratios = []
        speeds = []
        freqs = []

        for w in windows:
            speed = w.get("speed")
            freq = w.get("dominant_freq")
            if speed is not None and freq is not None and speed > 30:
                tire_freq = speed / (3.6 * math.pi * self.tire_diameter)
                if tire_freq > 0.1:
                    ratio = freq / tire_freq
                    ratios.append(ratio)
                    speeds.append(speed)
                    freqs.append(freq)

        if len(ratios) < MIN_DATA_POINTS:
            return None

        # Check if ratio is stable (low std)
        mean_ratio = sum(ratios) / len(ratios)
        variance = sum((r - mean_ratio) ** 2 for r in ratios) / len(ratios)
        std_ratio = math.sqrt(variance)

        # Also do linear regression freq vs speed for r value
        r, slope, p = _linregress(speeds, freqs)

        sig = std_ratio < 0.5 and len(ratios) >= MIN_DATA_POINTS and abs(r) > R_THRESHOLD

        return CorrelationResult(
            correlation_type="audio_wheel",
            r_value=r, slope=slope, p_value=p,
            data_points=len(ratios), regime="highway",
            diagnosis_hint="wheel_bearing",
            significant=sig,
        )

    def _turn_click(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 3: ay vibration + audio impulse during cornering -> CV joint.

        Count windows where: regime=cornering AND ay_std > 2.5 AND dominant_amp > mean*1.5.
        Significant when 3+ matching windows found.
        """
        cornering_windows = [w for w in windows if w.get("regime") == "cornering"]

        if not cornering_windows:
            return None

        # Calculate mean dominant_amp across all windows for threshold
        amps = [w.get("dominant_amp", 0) for w in windows if w.get("dominant_amp") is not None]
        mean_amp = sum(amps) / len(amps) if amps else 0
        amp_threshold = mean_amp * 1.5

        matches = 0
        for w in cornering_windows:
            ay = w.get("ay_std", 0)
            amp = w.get("dominant_amp", 0)
            if ay is not None and ay > 2.5 and amp is not None and amp > amp_threshold:
                matches += 1

        sig = matches >= 3

        return CorrelationResult(
            correlation_type="turn_click",
            r_value=float(matches) / max(len(cornering_windows), 1),
            slope=0.0,
            p_value=0.0 if sig else 1.0,
            data_points=len(cornering_windows),
            regime="cornering",
            diagnosis_hint="cv_joint",
            significant=sig,
        )

    def _vibration_speed_peak(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 4: az_std peak at specific speed -> wheel imbalance.

        Group highway windows by speed bins (10 km/h).
        Find bin with max mean az_std.
        Significant when peak > 2x mean of adjacent bins.
        """
        highway = [w for w in windows
                    if w.get("speed") is not None and w.get("speed") > 60
                    and w.get("az_std") is not None]

        if len(highway) < MIN_DATA_POINTS:
            return None

        # Group by 10 km/h bins
        bins: Dict[int, List[float]] = {}
        for w in highway:
            bin_key = int(w["speed"] // 10) * 10  # 60, 70, 80, ...
            bins.setdefault(bin_key, []).append(w["az_std"])

        if len(bins) < 3:
            return None

        # Find bin with max mean
        bin_means = {k: sum(v) / len(v) for k, v in bins.items()}
        peak_bin = max(bin_means, key=bin_means.get)  # type: ignore[arg-type]
        peak_mean = bin_means[peak_bin]

        # Check adjacent bins
        adjacent = [bin_means[k] for k in bin_means if abs(k - peak_bin) == 10]
        if not adjacent:
            return None

        adj_mean = sum(adjacent) / len(adjacent)

        sig = adj_mean > 0 and peak_mean > 2.0 * adj_mean

        # Use speed vs az_std regression for r value
        speeds = [w["speed"] for w in highway]
        az_vals = [w["az_std"] for w in highway]
        r, slope, p = _linregress(speeds, az_vals)

        return CorrelationResult(
            correlation_type="vibration_speed_peak",
            r_value=r, slope=slope, p_value=p,
            data_points=len(highway),
            regime="highway",
            diagnosis_hint="wheel_balance",
            significant=sig,
        )

    def _highfreq_vibration(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 5: high-freq audio (>200 Hz) + vibration -> accessory bearing.

        Filter windows with dominant_freq > 200 Hz.
        Correlate dominant_amp vs total vibration (az_std as proxy).
        """
        filtered = []
        for w in windows:
            freq = w.get("dominant_freq")
            amp = w.get("dominant_amp")
            az = w.get("az_std")
            if freq is not None and amp is not None and az is not None and freq > 200:
                filtered.append(w)

        if len(filtered) < MIN_DATA_POINTS:
            return None

        amps = [w["dominant_amp"] for w in filtered]
        az_vals = [w["az_std"] for w in filtered]
        r, slope, p = _linregress(amps, az_vals)

        sig = abs(r) > 0.5 and len(filtered) >= MIN_DATA_POINTS  # lower threshold

        return CorrelationResult(
            correlation_type="highfreq_vibration",
            r_value=r, slope=slope, p_value=p,
            data_points=len(filtered),
            regime="all",
            diagnosis_hint="accessory_bearing",
            significant=sig,
        )

    @staticmethod
    def save_results(cursor, client_hash: str, trip_id: str,
                     results: List[CorrelationResult]) -> int:
        """Write correlation results to DB. Returns count."""
        module_name = type(cursor).__module__
        ph = '?' if 'sqlite' in module_name else '%s'
        now = datetime.now(timezone.utc).isoformat()

        count = 0
        for res in results:
            cursor.execute(
                f"""INSERT INTO correlation_results
                    (time, client_hash, trip_id, correlation_type, r_value, slope,
                     p_value, data_points, regime, diagnosis_hint)
                    VALUES ({ph},{ph},{ph},{ph},{ph},{ph},{ph},{ph},{ph},{ph})""",
                (now, client_hash, trip_id, res.correlation_type,
                 res.r_value, res.slope, res.p_value, res.data_points,
                 res.regime, res.diagnosis_hint)
            )
            count += 1
        return count
