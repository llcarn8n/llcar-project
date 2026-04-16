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
    history: list = None,
) -> None:
    """Write health scores + features to anomaly_scores table.

    GAP-A2: Also computes and writes cusum_short/cusum_medium/cusum_long
    columns and degradation_detected flag using MultiScaleCUSUM.
    """
    from .cusum import MultiScaleCUSUM

    ph = _placeholder(cursor)
    now = _now_iso()
    scores = report.get("health_scores", {})

    # Find top diagnostic (highest confidence diagnosis)
    diagnoses = report.get("diagnoses", [])
    top_diag = diagnoses[0]["rule_name"] if diagnoses else None
    top_conf = int(diagnoses[0]["confidence"]) if diagnoses else 0

    features_json = json.dumps(features, default=str)

    # GAP-A2: Multi-scale CUSUM trends
    cusum_short = None
    cusum_medium = None
    cusum_long = None
    degradation = False

    if history and len(history) >= 5:
        ms_cusum = MultiScaleCUSUM()
        # Use overall_score for the aggregate CUSUM columns
        overall_values = [
            h["overall_score"] for h in history
            if h.get("overall_score") is not None
        ]
        if len(overall_values) >= 5:
            all_scales = ms_cusum.compute_all_scales(overall_values)
            cusum_short = all_scales["short"]
            cusum_medium = all_scales["medium"]
            cusum_long = all_scales["long"]
            degradation = ms_cusum.degradation_detected(history)

    cursor.execute(
        f"""INSERT INTO anomaly_scores
            (time, client_hash, regime, overall_score, suspension_score,
             engine_score, electrical_score, audio_score, confidence,
             top_diagnostic, top_diagnostic_confidence, features_json,
             cusum_short, cusum_medium, cusum_long, degradation_detected)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph},
                    {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
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
            cusum_short,
            cusum_medium,
            cusum_long,
            degradation,
        ),
    )


def save_vehicle_profile(cursor, profile: 'VehicleProfile') -> None:
    """UPSERT vehicle profile to DB."""
    ph = _placeholder(cursor)
    mods_json = json.dumps(profile.modifications) if profile.modifications else '{}'

    if ph == '?':
        cursor.execute("""
            INSERT OR REPLACE INTO vehicle_profiles
            (client_hash, brand, model, year, vin, generation, engine_code,
             engine_type, mileage_km, platform, modifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (profile.client_hash, profile.brand, profile.model, profile.year,
              profile.vin, profile.generation, profile.engine_code,
              profile.engine_type, profile.mileage_km, profile.platform, mods_json))
    else:
        cursor.execute("""
            INSERT INTO vehicle_profiles
            (client_hash, brand, model, year, vin, generation, engine_code,
             engine_type, mileage_km, platform, modifications)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (client_hash)
            DO UPDATE SET brand=EXCLUDED.brand, model=EXCLUDED.model, year=EXCLUDED.year,
                         vin=EXCLUDED.vin, generation=EXCLUDED.generation,
                         engine_code=EXCLUDED.engine_code, engine_type=EXCLUDED.engine_type,
                         mileage_km=EXCLUDED.mileage_km, platform=EXCLUDED.platform,
                         modifications=EXCLUDED.modifications
        """, (profile.client_hash, profile.brand, profile.model, profile.year,
              profile.vin, profile.generation, profile.engine_code,
              profile.engine_type, profile.mileage_km, profile.platform, mods_json))


def load_vehicle_profile(cursor, client_hash: str) -> Optional['VehicleProfile']:
    """Load vehicle profile from DB. Returns None if not found."""
    from .vehicle_profile import VehicleProfile
    ph = _placeholder(cursor)

    cursor.execute(
        f"""SELECT brand, model, year, vin, generation, engine_code,
                   engine_type, mileage_km, platform, modifications
            FROM vehicle_profiles WHERE client_hash = {ph}""",
        (client_hash,)
    )
    row = cursor.fetchone()
    if row is None:
        return None

    columns = ['brand', 'model', 'year', 'vin', 'generation', 'engine_code',
               'engine_type', 'mileage_km', 'platform', 'modifications']
    if hasattr(row, 'keys'):
        d = dict(row)
    else:
        d = dict(zip(columns, row))

    mods = d.get('modifications', '{}')
    if isinstance(mods, str):
        mods = json.loads(mods) if mods else {}

    return VehicleProfile(
        client_hash=client_hash,
        brand=d.get('brand', 'unknown'),
        model=d.get('model', 'unknown'),
        year=d.get('year', 2020),
        vin=d.get('vin'),
        generation=d.get('generation'),
        engine_code=d.get('engine_code'),
        engine_type=d.get('engine_type', 'ice'),
        mileage_km=d.get('mileage_km', 0),
        platform=d.get('platform'),
        modifications=mods,
    )


def write_dtc_events(cursor, client_hash: str, dtc_codes: list,
                     freeze_frame: dict = None, ecu: Optional[str] = None) -> int:
    """Write DTC events to dtc_events table. Returns count of new/updated rows.

    If the same DTC code is already active (resolved_at IS NULL) for this client,
    increment its occurrences counter instead of inserting a duplicate row.

    Args:
        cursor:       DB cursor (SQLite or PostgreSQL).
        client_hash:  Vehicle identifier.
        dtc_codes:    List of DTC code strings (e.g. ["P0300", "P0171"]).
        freeze_frame: Snapshot of OBD params at time of DTC.
        ecu:          ECU address that reported the DTC (e.g. "7E8").
    """
    ph = _placeholder(cursor)
    now = _now_iso()
    freeze_json = json.dumps(freeze_frame) if freeze_frame else None

    count = 0
    for code in dtc_codes:
        # Check if this DTC is already active (not resolved)
        cursor.execute(
            f"""SELECT id, occurrences FROM dtc_events
                WHERE client_hash = {ph} AND dtc_code = {ph}
                AND resolved_at IS NULL
                ORDER BY time DESC LIMIT 1""",
            (client_hash, code),
        )
        existing = cursor.fetchone()

        if existing is not None:
            # Increment occurrences on existing active DTC and update freeze_frame
            row_id = existing[0]
            old_occ = existing[1]
            if freeze_json is not None:
                cursor.execute(
                    f"UPDATE dtc_events SET occurrences = {ph}, time = {ph}, freeze_frame = {ph} WHERE id = {ph}",
                    (old_occ + 1, now, freeze_json, row_id),
                )
            else:
                cursor.execute(
                    f"UPDATE dtc_events SET occurrences = {ph}, time = {ph} WHERE id = {ph}",
                    (old_occ + 1, now, row_id),
                )
        else:
            # Insert new DTC event
            cursor.execute(
                f"""INSERT INTO dtc_events
                    (time, client_hash, dtc_code, ecu, freeze_frame, occurrences)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, 1)""",
                (now, client_hash, code, ecu, freeze_json),
            )
        count += 1
    return count


def resolve_cleared_dtcs(cursor, client_hash: str, active_codes: list) -> int:
    """Mark DTCs as resolved if they are no longer in the active set.

    For any dtc_events row where resolved_at IS NULL and dtc_code NOT in
    active_codes, set resolved_at = now.

    Args:
        cursor:       DB cursor (SQLite or PostgreSQL).
        client_hash:  Vehicle identifier.
        active_codes: List of DTC codes currently still active. Any active
                      DTC not in this list will be marked resolved.

    Returns:
        Number of rows resolved.
    """
    ph = _placeholder(cursor)
    now = _now_iso()

    # Find all currently-active (unresolved) DTCs for this client
    cursor.execute(
        f"""SELECT id, dtc_code FROM dtc_events
            WHERE client_hash = {ph} AND resolved_at IS NULL""",
        (client_hash,),
    )
    rows = cursor.fetchall()

    active_set = set(active_codes)
    resolved_count = 0
    for row in rows:
        row_id = row[0]
        dtc_code = row[1]
        if dtc_code not in active_set:
            cursor.execute(
                f"UPDATE dtc_events SET resolved_at = {ph} WHERE id = {ph}",
                (now, row_id),
            )
            resolved_count += 1

    return resolved_count


def write_shadow_log(
    cursor,
    client_hash: str,
    shadow_results: List[Dict[str, Any]],
    features: Dict[str, Any],
    timestamp: Optional[str] = None,
) -> int:
    """Write shadow rule results for calibration analysis. Returns rows written."""
    ph = _placeholder(cursor)
    ts = timestamp or _now_iso()
    features_json = json.dumps(
        {k: v for k, v in features.items() if v is not None}, default=str
    )
    count = 0
    for r in shadow_results:
        if r.get("confidence", 0) <= 0:
            continue
        cursor.execute(
            f"""INSERT INTO shadow_rule_log
                (time, client_hash, rule_name, confidence,
                 conditions_met, conditions_total, features_snapshot)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""",
            (ts, client_hash, r["name"], r["confidence"],
             r.get("conditions_met", 0), r.get("conditions_total", 0),
             features_json),
        )
        count += 1
    return count


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
