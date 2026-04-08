"""DB reader functions for diagnostic data."""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional


def read_freeze_frames(
    cursor, client_hash: str, dtc_codes: List[str],
) -> Dict[str, Dict[str, Any]]:
    """Read the most recent freeze frame for each DTC code.

    Args:
        cursor:      DB cursor (SQLite or PostgreSQL).
        client_hash: Vehicle identifier.
        dtc_codes:   List of DTC codes to look up (e.g. ["P0171", "P0300"]).

    Returns:
        Dict mapping dtc_code -> freeze_frame dict (parsed JSON).
        Only codes that have freeze_frame data are included.
    """
    if not dtc_codes:
        return {}

    module_name = type(cursor).__module__
    ph = "?" if "sqlite" in module_name else "%s"

    result: Dict[str, Dict[str, Any]] = {}

    for code in dtc_codes:
        if ph == "?":
            cursor.execute(
                """
                SELECT freeze_frame, time
                FROM dtc_events
                WHERE client_hash = ? AND dtc_code = ?
                ORDER BY time DESC, id DESC
                LIMIT 1
                """,
                (client_hash, code),
            )
        else:
            cursor.execute(
                """
                SELECT freeze_frame, time
                FROM dtc_events
                WHERE client_hash = %s AND dtc_code = %s
                ORDER BY time DESC
                LIMIT 1
                """,
                (client_hash, code),
            )

        row = cursor.fetchone()
        if row is None:
            continue

        freeze_raw, timestamp = row[0], row[1]
        if freeze_raw is None:
            continue

        try:
            frame = json.loads(freeze_raw) if isinstance(freeze_raw, str) else freeze_raw
        except (json.JSONDecodeError, TypeError):
            continue

        frame["timestamp"] = timestamp
        result[code] = frame

    return result


def read_history(cursor, client_hash: str, period: str = "7d") -> List[Dict[str, Any]]:
    """Read anomaly_scores history for a client.

    Args:
        cursor:      DB cursor (SQLite or PostgreSQL).
        client_hash: Vehicle identifier.
        period:      '7d', '30d', '90d' — time window for results.

    Returns:
        List of dicts with scores + timestamps, newest first.
    """
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)

    # Detect placeholder style
    module_name = type(cursor).__module__
    ph = "?" if "sqlite" in module_name else "%s"

    # SQLite doesn't have INTERVAL, use different syntax
    if ph == "?":
        cursor.execute(
            """
            SELECT time, overall_score, suspension_score, engine_score,
                   electrical_score, audio_score, confidence, top_diagnostic,
                   top_diagnostic_confidence
            FROM anomaly_scores
            WHERE client_hash = ?
            ORDER BY time DESC
            LIMIT 1000
            """,
            (client_hash,),
        )
    else:
        cursor.execute(
            """
            SELECT time, overall_score, suspension_score, engine_score,
                   electrical_score, audio_score, confidence, top_diagnostic,
                   top_diagnostic_confidence
            FROM anomaly_scores
            WHERE client_hash = %s AND time > NOW() - INTERVAL '%s days'
            ORDER BY time DESC
            LIMIT 1000
            """,
            (client_hash, days),
        )

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
