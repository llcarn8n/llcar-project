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


def read_correlation_results(
    cursor, client_hash: str, limit: int = 50,
) -> List[Dict[str, Any]]:
    """Read recent significant correlation results for a client.

    Args:
        cursor:      DB cursor (SQLite or PostgreSQL).
        client_hash: Vehicle identifier.
        limit:       Max rows to return.

    Returns:
        List of dicts with correlation_type, r_value, diagnosis_hint, etc.
    """
    module_name = type(cursor).__module__
    ph = "?" if "sqlite" in module_name else "%s"

    cursor.execute(
        f"""
        SELECT correlation_type, r_value, slope, p_value,
               data_points, regime, diagnosis_hint, time
        FROM correlation_results
        WHERE client_hash = {ph}
        ORDER BY time DESC
        LIMIT {ph}
        """,
        (client_hash, limit),
    )

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def read_history(cursor, client_hash: str, period: str = "7d") -> List[Dict[str, Any]]:
    """Read anomaly_scores history for a client, aggregated by time bucket.

    Группируем записи по корзинам времени (минута/10 мин/час/4 часа/12 часов
    в зависимости от периода) и берём среднее по score-полям — это даёт
    стабильный тренд даже когда backend пишет повторяющиеся значения.
    top_diagnostic: last() в PostgreSQL (TimescaleDB), MAX в SQLite fallback.

    Args:
        cursor:      DB cursor (SQLite or PostgreSQL).
        client_hash: Vehicle identifier.
        period:      '1h', '24h', '7d', '30d', '90d' — time window.

    Returns:
        List of dicts with averaged scores + bucket timestamps, newest first.
    """
    # (days, PG interval string, SQLite strftime format)
    CFG = {
        "1h":  (1,  "1 minute",    "%Y-%m-%d %H:%M:00"),
        "24h": (1,  "10 minutes",  "%Y-%m-%d %H:00:00"),
        "7d":  (7,  "1 hour",      "%Y-%m-%d %H:00:00"),
        "30d": (30, "4 hours",     "%Y-%m-%d 00:00:00"),
        "90d": (90, "12 hours",    "%Y-%m-%d 00:00:00"),
    }
    days, pg_bucket, sqlite_fmt = CFG.get(period, CFG["7d"])

    module_name = type(cursor).__module__
    is_sqlite = "sqlite" in module_name

    if is_sqlite:
        cursor.execute(
            f"""
            SELECT strftime('{sqlite_fmt}', time)               AS time,
                   CAST(AVG(overall_score)    AS INTEGER)       AS overall_score,
                   CAST(AVG(suspension_score) AS INTEGER)       AS suspension_score,
                   CAST(AVG(engine_score)     AS INTEGER)       AS engine_score,
                   CAST(AVG(electrical_score) AS INTEGER)       AS electrical_score,
                   CAST(AVG(audio_score)      AS INTEGER)       AS audio_score,
                   AVG(confidence)                              AS confidence,
                   MAX(top_diagnostic)                          AS top_diagnostic,
                   CAST(AVG(top_diagnostic_confidence) AS INTEGER) AS top_diagnostic_confidence
            FROM anomaly_scores
            WHERE client_hash = ? AND time > datetime('now', ?)
            GROUP BY strftime('{sqlite_fmt}', time)
            ORDER BY time DESC
            LIMIT 500
            """,
            (client_hash, f"-{days} days"),
        )
    else:
        cursor.execute(
            """
            SELECT time_bucket(%s::INTERVAL, time)               AS time,
                   AVG(overall_score)::INT                       AS overall_score,
                   AVG(suspension_score)::INT                    AS suspension_score,
                   AVG(engine_score)::INT                        AS engine_score,
                   AVG(electrical_score)::INT                    AS electrical_score,
                   AVG(audio_score)::INT                         AS audio_score,
                   AVG(confidence)                               AS confidence,
                   last(top_diagnostic, time)                    AS top_diagnostic,
                   AVG(top_diagnostic_confidence)::INT           AS top_diagnostic_confidence
            FROM anomaly_scores
            WHERE client_hash = %s AND time > NOW() - (%s || ' days')::INTERVAL
            GROUP BY time_bucket(%s::INTERVAL, time)
            ORDER BY time DESC
            LIMIT 500
            """,
            (pg_bucket, client_hash, days, pg_bucket),
        )

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
