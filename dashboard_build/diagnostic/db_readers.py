"""DB reader functions for diagnostic data."""
from __future__ import annotations

from typing import Any, Dict, List


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
