"""Batch correlation runner — joins accel+audio+OBD and runs correlations.

Usage from Django shell or cron:
    from dashboard.diagnostic.correlation_runner import run_correlations
    run_correlations(cursor, client_hash, minutes=1440)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .correlation_engine import CorrelationEngine

logger = logging.getLogger(__name__)


def run_correlations(cursor, client_hash: str, minutes: int = 1440) -> dict:
    """Run batch correlations for a client using last N minutes of data.

    Steps:
    1. Read accel windows
    2. Read audio windows
    3. Read OBD data (ecu_7e8)
    4. Join by time (±3 sec tolerance)
    5. Run CorrelationEngine.analyze_trip()
    6. Save results

    Returns: {windows_joined, correlations_found, results: [...]}
    """
    # Detect SQL placeholder
    module_name = type(cursor).__module__
    ph = '?' if 'sqlite' in module_name else '%s'

    # 1. Read accel windows
    if ph == '?':
        cursor.execute("""
            SELECT time, ax_avg, ax_std, ax_min, ax_max,
                   ay_avg, ay_std, ay_min, ay_max,
                   az_avg, az_std, az_min, az_max
            FROM accel_windows
            WHERE client_hash = ?
            ORDER BY time DESC LIMIT 5000
        """, (client_hash,))
    else:
        cursor.execute("""
            SELECT time, ax_avg, ax_std, ax_min, ax_max,
                   ay_avg, ay_std, ay_min, ay_max,
                   az_avg, az_std, az_min, az_max
            FROM accel_windows
            WHERE client_hash = %s
              AND time > NOW() - INTERVAL '%s minutes'
            ORDER BY time DESC LIMIT 5000
        """, [client_hash, minutes])

    accel_cols = ['time', 'ax_avg', 'ax_std', 'ax_min', 'ax_max',
                  'ay_avg', 'ay_std', 'ay_min', 'ay_max',
                  'az_avg', 'az_std', 'az_min', 'az_max']
    accel_rows = [dict(zip(accel_cols, row)) for row in cursor.fetchall()]

    # 2. Read audio windows
    if ph == '?':
        cursor.execute("""
            SELECT time, freq_1, amp_1, freq_2, amp_2, freq_3, amp_3,
                   freq_4, amp_4, freq_5, amp_5, freq_6, amp_6,
                   freq_7, amp_7, freq_8, amp_8, freq_9, amp_9,
                   freq_10, amp_10, quality
            FROM audio_windows
            WHERE client_hash = ?
            ORDER BY time DESC LIMIT 5000
        """, (client_hash,))
    else:
        cursor.execute("""
            SELECT time, freq_1, amp_1, freq_2, amp_2, freq_3, amp_3,
                   freq_4, amp_4, freq_5, amp_5, freq_6, amp_6,
                   freq_7, amp_7, freq_8, amp_8, freq_9, amp_9,
                   freq_10, amp_10, quality
            FROM audio_windows
            WHERE client_hash = %s
              AND time > NOW() - INTERVAL '%s minutes'
            ORDER BY time DESC LIMIT 5000
        """, [client_hash, minutes])

    audio_cols = ['time', 'freq_1', 'amp_1', 'freq_2', 'amp_2', 'freq_3', 'amp_3',
                  'freq_4', 'amp_4', 'freq_5', 'amp_5', 'freq_6', 'amp_6',
                  'freq_7', 'amp_7', 'freq_8', 'amp_8', 'freq_9', 'amp_9',
                  'freq_10', 'amp_10', 'quality']
    audio_rows = [dict(zip(audio_cols, row)) for row in cursor.fetchall()]

    # 3. Read OBD data
    if ph == '?':
        cursor.execute("""
            SELECT time, p010c, p010d, p0105
            FROM ecu_7e8
            WHERE client_hash = ?
            ORDER BY time DESC LIMIT 5000
        """, (client_hash,))
    else:
        cursor.execute("""
            SELECT time, p010c, p010d, p0105
            FROM ecu_7e8
            WHERE client_hash = %s
              AND time > NOW() - INTERVAL '%s minutes'
            ORDER BY time DESC LIMIT 5000
        """, [client_hash, minutes])

    obd_cols = ['time', 'rpm', 'speed', 'coolant']
    obd_rows = [dict(zip(obd_cols, row)) for row in cursor.fetchall()]

    if not accel_rows:
        return {"windows_joined": 0, "correlations_found": 0, "results": []}

    # 4. Join by time (±3 sec tolerance)
    # Parse timestamps to epoch for matching
    def to_epoch(t):
        if isinstance(t, (int, float)):
            return float(t)
        if isinstance(t, str):
            try:
                return datetime.fromisoformat(t.replace('Z', '+00:00')).timestamp()
            except Exception:
                return 0
        if hasattr(t, 'timestamp'):
            return t.timestamp()
        return 0

    # Index audio and OBD by epoch
    audio_indexed = [(to_epoch(a['time']), a) for a in audio_rows]
    obd_indexed = [(to_epoch(o['time']), o) for o in obd_rows]

    TOLERANCE = 3.0  # seconds

    windows = []
    for accel in accel_rows:
        t = to_epoch(accel['time'])
        if t == 0:
            continue

        w = {
            'timestamp': t,
            'az_std': accel.get('az_std'),
            'ax_std': accel.get('ax_std'),
            'ay_std': accel.get('ay_std'),
            'az_avg': accel.get('az_avg'),
            'ax_avg': accel.get('ax_avg'),
            'ay_avg': accel.get('ay_avg'),
        }

        # Find closest audio (±3 sec)
        best_audio = None
        best_audio_dt = TOLERANCE + 1
        for at, audio in audio_indexed:
            dt = abs(at - t)
            if dt < best_audio_dt:
                best_audio_dt = dt
                best_audio = audio

        if best_audio and best_audio_dt <= TOLERANCE:
            w['dominant_freq'] = best_audio.get('freq_1')
            w['dominant_amp'] = best_audio.get('amp_1')
            w['audio_quality'] = best_audio.get('quality')

        # Find closest OBD (±3 sec)
        best_obd = None
        best_obd_dt = TOLERANCE + 1
        for ot, obd in obd_indexed:
            dt = abs(ot - t)
            if dt < best_obd_dt:
                best_obd_dt = dt
                best_obd = obd

        if best_obd and best_obd_dt <= TOLERANCE:
            w['rpm'] = best_obd.get('rpm')
            w['speed'] = best_obd.get('speed')

        # Classify regime based on speed
        speed = w.get('speed')
        if speed is not None:
            if speed < 3:
                w['regime'] = 'idle'
            elif speed > 70:
                w['regime'] = 'highway'
            else:
                w['regime'] = 'city'
        else:
            w['regime'] = 'unknown'

        windows.append(w)

    logger.info("Correlation runner: %d accel, %d audio, %d obd → %d joined windows",
                len(accel_rows), len(audio_rows), len(obd_rows), len(windows))

    # 5. Run correlations
    engine = CorrelationEngine()
    results = engine.analyze_trip(windows)

    # 6. Save results
    trip_id = f"batch_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    if results:
        CorrelationEngine.save_results(cursor, client_hash, trip_id, results)

    return {
        "windows_joined": len(windows),
        "correlations_found": len(results),
        "results": [
            {
                "type": r.correlation_type,
                "hint": r.diagnosis_hint,
                "r": round(r.r_value, 3),
                "points": r.data_points,
            }
            for r in results
        ],
    }
