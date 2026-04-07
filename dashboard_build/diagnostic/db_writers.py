"""DB writer/reader functions for diagnostic data persistence.

All functions accept a cursor (from MockDB or Django connections['vehinfo']).
SQL uses %s placeholders (PostgreSQL style). MockDB's SQLite adapter
should handle ? vs %s internally, OR use the same placeholder style.

IMPORTANT: MockDB uses SQLite which uses ? placeholders. PostgreSQL uses %s.
To handle both, use a helper that detects the cursor type.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .baseline_store import BaselineStore
from .facts import Fact


def _now_iso() -> str:
    """Current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()


def _placeholder(cursor) -> str:
    """Return SQL placeholder: ? for SQLite, %s for PostgreSQL."""
    module_name = type(cursor).__module__
    if "sqlite" in module_name:
        return "?"
    return "%s"


def save_baselines(cursor, client_hash: str, baselines: BaselineStore) -> int:
    """UPSERT all baselines for a client. Returns count of rows written.

    Uses BaselineStore.to_db_rows(client_hash) for serialization.
    SQL: INSERT ... ON CONFLICT(client_hash, regime, feature) DO UPDATE
    """
    rows = baselines.to_db_rows(client_hash)
    ph = _placeholder(cursor)
    now = _now_iso()

    count = 0
    for row in rows:
        # SQLite uses "INSERT OR REPLACE", PostgreSQL uses "ON CONFLICT DO UPDATE"
        if ph == "?":
            cursor.execute(
                """INSERT OR REPLACE INTO anomaly_baselines
                (client_hash, regime, feature, count, mean, m2, min_val, max_val, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    client_hash,
                    row["regime"],
                    row["feature"],
                    row["count"],
                    row["mean"],
                    row["m2"],
                    row["min_val"],
                    row["max_val"],
                    now,
                ),
            )
        else:
            cursor.execute(
                """INSERT INTO anomaly_baselines
                (client_hash, regime, feature, count, mean, m2, min_val, max_val, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (client_hash, regime, feature)
                DO UPDATE SET count=EXCLUDED.count, mean=EXCLUDED.mean, m2=EXCLUDED.m2,
                             min_val=EXCLUDED.min_val, max_val=EXCLUDED.max_val,
                             updated_at=EXCLUDED.updated_at""",
                (
                    client_hash,
                    row["regime"],
                    row["feature"],
                    row["count"],
                    row["mean"],
                    row["m2"],
                    row["min_val"],
                    row["max_val"],
                    now,
                ),
            )
        count += 1

    return count


def load_baselines(cursor, client_hash: str) -> BaselineStore:
    """Load all baselines for a client from DB. Returns BaselineStore."""
    ph = _placeholder(cursor)
    cursor.execute(
        f"SELECT regime, feature, count, mean, m2, min_val, max_val "
        f"FROM anomaly_baselines WHERE client_hash = {ph}",
        (client_hash,),
    )
    rows_raw = cursor.fetchall()

    # Convert to list of dicts (works for both sqlite3.Row and psycopg2 tuples)
    columns = ["regime", "feature", "count", "mean", "m2", "min_val", "max_val"]
    rows: List[Dict[str, Any]] = []
    for row in rows_raw:
        if isinstance(row, dict):
            rows.append(row)
        elif hasattr(row, "keys"):
            rows.append(dict(row))
        else:
            rows.append(dict(zip(columns, row)))

    return BaselineStore.from_db_rows(rows)


def write_fact_log(
    cursor, client_hash: str, facts: List[Fact], tier: str
) -> int:
    """Write facts to fact_log table. Returns count of rows written."""
    ph = _placeholder(cursor)
    now = _now_iso()
    count = 0

    for fact in facts:
        details_json = json.dumps(fact.details) if fact.details else "{}"
        cursor.execute(
            f"""INSERT INTO fact_log
                (time, client_hash, fact_type, severity, confidence, tier, details)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (
                now,
                client_hash,
                fact.type.value,
                fact.severity,
                fact.confidence,
                tier,
                details_json,
            ),
        )
        count += 1

    return count


def write_anomaly_scores(
    cursor,
    client_hash: str,
    report: dict,
    features: dict,
    regime: str,
) -> None:
    """Write health scores + features to anomaly_scores table."""
    ph = _placeholder(cursor)
    now = _now_iso()
    scores = report.get("health_scores", {})

    # Find top diagnostic (highest confidence diagnosis)
    diagnoses = report.get("diagnoses", [])
    top_diag = diagnoses[0]["rule_name"] if diagnoses else None
    top_conf = int(diagnoses[0]["confidence"]) if diagnoses else 0

    features_json = json.dumps(features, default=str)

    cursor.execute(
        f"""INSERT INTO anomaly_scores
            (time, client_hash, regime, overall_score, suspension_score,
             engine_score, electrical_score, audio_score, confidence,
             top_diagnostic, top_diagnostic_confidence, features_json)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph},
                    {ph}, {ph}, {ph}, {ph})""",
        (
            now,
            client_hash,
            regime,
            scores.get("overall", 100),
            scores.get("suspension", 100),
            scores.get("engine", 100),
            scores.get("electrical", 100),
            scores.get("audio", 100),
            report.get("confidence", 0.0),
            top_diag,
            top_conf,
            features_json,
        ),
    )


def write_feedback(
    cursor,
    client_hash: str,
    rule_name: str,
    action: str,
    diagnosis_time: Optional[str] = None,
    comment: Optional[str] = None,
) -> None:
    """Write user feedback to user_feedback table."""
    ph = _placeholder(cursor)
    now = _now_iso()

    cursor.execute(
        f"""INSERT INTO user_feedback
            (time, client_hash, rule_name, diagnosis_time, action, comment)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
        (now, client_hash, rule_name, diagnosis_time, action, comment),
    )
