"""API views for the diagnostic engine.

Four endpoints:
  POST /api/v2/diagnose/          — run full diagnostic pipeline on data packets
  GET  /api/v2/diagnose-latest/   — diagnose using latest server-side data from DB
  POST /api/v2/feedback/          — log user feedback on a diagnosis
  GET  /api/v2/history/           — retrieve diagnostic history (placeholder)

Designed to work both inside Django and standalone (for testing without Django).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

# ---------------------------------------------------------------------------
# Django shim — allows tests to run without Django installed
# ---------------------------------------------------------------------------

try:
    from django.http import JsonResponse
    from django.views.decorators.csrf import csrf_exempt
except ImportError:
    def csrf_exempt(fn):  # type: ignore[misc]
        return fn

    class JsonResponse:                                          # type: ignore[no-redef]
        """Minimal JsonResponse shim for testing without Django."""

        def __init__(self, data: Any, status: int = 200, safe: bool = True, **kwargs: Any) -> None:
            self.status_code = status
            self.content = json.dumps(data).encode("utf-8")
            self._data = data

        @property
        def json_data(self) -> Any:
            return self._data


from .pipeline import DiagnosticPipeline
from .vehicle_profile import VehicleProfile

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# POST /api/v2/diagnose/
# ---------------------------------------------------------------------------

@csrf_exempt
def diagnose_view(request: Any) -> JsonResponse:
    """Run the full diagnostic cycle on submitted data packets.

    Expects JSON body:
        client_hash:      str (required)
        vehicle_profile:  dict (optional)
        data:             list[dict] (required, non-empty)
        dtc_codes:        list[str] (optional, merged into each packet)
        tier:             str (optional, unused for now)

    Returns the 7-block diagnostic report from the last packet.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Parse JSON body
    try:
        body: Dict[str, Any] = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    # Validate required fields
    client_hash = body.get("client_hash")
    if not client_hash:
        return JsonResponse({"error": "client_hash required"}, status=400)

    data_packets = body.get("data", [])
    if not data_packets:
        return JsonResponse({"error": "data required"}, status=400)

    # Build vehicle profile
    vp_data = body.get("vehicle_profile", {})
    profile = VehicleProfile(
        client_hash=client_hash,
        brand=vp_data.get("brand", "unknown"),
        model=vp_data.get("model", "unknown"),
        year=vp_data.get("year", 2020),
        vin=vp_data.get("vin"),
        generation=vp_data.get("generation"),
        platform=vp_data.get("platform"),
        modifications=vp_data.get("modifications", {}),
    )

    # Top-level DTC codes to inject into every packet
    dtc_codes = body.get("dtc_codes", [])

    # Try DB-backed pipeline (load baselines, persist results)
    try:
        from .db import get_cursor
        from .db_writers import load_baselines

        with get_cursor() as cursor:
            baselines = load_baselines(cursor, client_hash)
            pipeline = DiagnosticPipeline(vehicle_profile=profile, baselines=baselines)

            report: Dict[str, Any] = {}
            for packet in data_packets:
                if dtc_codes:
                    packet = {**packet, "dtc_codes": dtc_codes}
                report = pipeline.full_diagnose(
                    packet, db_cursor=cursor, client_hash=client_hash,
                )

            return JsonResponse(report, status=200)
    except Exception:
        # Fallback: run without DB (same as before)
        pipeline = DiagnosticPipeline(vehicle_profile=profile)
        report_fallback: Dict[str, Any] = {}
        for packet in data_packets:
            if dtc_codes:
                packet = {**packet, "dtc_codes": dtc_codes}
            report_fallback = pipeline.full_diagnose(packet)
        return JsonResponse(report_fallback or {}, status=200)


# ---------------------------------------------------------------------------
# GET /api/v2/diagnose-latest/
# ---------------------------------------------------------------------------

@csrf_exempt
def diagnose_latest_view(request: Any) -> JsonResponse:
    """GET /api/v2/diagnose-latest/ — diagnose using latest server data.

    Reads latest OBD + accel + audio data from PostgreSQL,
    assembles a diagnostic packet, runs full_diagnose().

    Query params:
        client_hash: str (required)
        minutes: int (default 30, how far back to look for data)
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    client_hash = None
    minutes = 30
    if hasattr(request, "GET") and request.GET is not None:
        client_hash = request.GET.get("client_hash")
        minutes = int(request.GET.get("minutes", "30"))

    if not client_hash:
        return JsonResponse({"error": "client_hash required"}, status=400)

    try:
        from .db import get_cursor
        from .db_writers import load_baselines

        with get_cursor() as cursor:
            # 1. Get latest OBD data from ecu_7e8 (10 rows for baseline accumulation)
            cursor.execute("""
                SELECT p010c, p010d, p0105, p0106, p0107, p0142, p0104, p0111
                FROM ecu_7e8
                WHERE client_hash = %s
                  AND time > NOW() - INTERVAL '%s minutes'
                ORDER BY time DESC LIMIT 10
            """, [client_hash, minutes])

            obd_rows = cursor.fetchall()
            if not obd_rows:
                obd_rows = []

            # 2. Get latest accel window
            cursor.execute("""
                SELECT ax_avg, ax_std, ax_min, ax_max,
                       ay_avg, ay_std, ay_min, ay_max,
                       az_avg, az_std, az_min, az_max
                FROM accel_windows
                WHERE client_hash = %s
                  AND time > NOW() - INTERVAL '%s minutes'
                ORDER BY time DESC LIMIT 1
            """, [client_hash, minutes])

            accel_row = cursor.fetchone()

            # 3. Get latest audio window
            cursor.execute("""
                SELECT freq_1, amp_1, quality
                FROM audio_windows
                WHERE client_hash = %s
                  AND time > NOW() - INTERVAL '%s minutes'
                ORDER BY time DESC LIMIT 1
            """, [client_hash, minutes])

            audio_row = cursor.fetchone()

            # 4. Prepare accel + audio data (shared across all OBD packets)
            accel_data: Dict[str, Any] = {}
            if accel_row:
                (ax_avg, ax_std, ax_min, ax_max,
                 ay_avg, ay_std, ay_min, ay_max,
                 az_avg, az_std, az_min, az_max) = accel_row
                accel_data = {
                    "ax_avg": ax_avg, "ax_std": ax_std,
                    "ax_min": ax_min, "ax_max": ax_max,
                    "ay_avg": ay_avg, "ay_std": ay_std,
                    "ay_min": ay_min, "ay_max": ay_max,
                    "az_avg": az_avg, "az_std": az_std,
                    "az_min": az_min, "az_max": az_max,
                }

            audio_data: Dict[str, Any] = {}
            if audio_row:
                freq, amp, quality = audio_row
                audio_data = {
                    "dominant_freq": freq,
                    "dominant_amp": amp,
                    "audio_quality": quality,
                }

            # Check if we have any data at all
            if not obd_rows and not accel_data and not audio_data:
                return JsonResponse({
                    "error": "no_data",
                    "message": "No recent data found",
                    "minutes_searched": minutes,
                }, status=200)

            # 5. Load or create vehicle profile, then run diagnosis
            from .db_writers import load_vehicle_profile, save_vehicle_profile, write_dtc_events

            profile = load_vehicle_profile(cursor, client_hash)
            if profile is None:
                profile = VehicleProfile(
                    client_hash=client_hash,
                    brand="li_auto",
                    model="L7",
                    year=2023,
                )
                save_vehicle_profile(cursor, profile)

            # Load existing baselines
            baselines = load_baselines(cursor, client_hash)
            pipeline = DiagnosticPipeline(
                vehicle_profile=profile, baselines=baselines,
            )

            # 6. Process multiple OBD packets for baseline accumulation
            #    Iterate oldest-first so baselines build up properly;
            #    the last report (most recent packet) is the one returned.
            report: Dict[str, Any] = {}
            if obd_rows:
                for obd_row in reversed(obd_rows):  # oldest first
                    packet: Dict[str, Any] = {}
                    rpm, speed, coolant, ltft_raw, stft_raw, voltage_mv, load, throttle = obd_row
                    packet["rpm"] = rpm
                    packet["speed"] = speed
                    packet["coolant_temp"] = coolant
                    if ltft_raw is not None:
                        packet["ltft_bank1"] = round((ltft_raw - 128) * 100 / 128, 2)
                    if stft_raw is not None:
                        packet["stft_bank1"] = round((stft_raw - 128) * 100 / 128, 2)
                    if voltage_mv is not None:
                        packet["voltage"] = round(voltage_mv / 1000, 1)
                    if load is not None:
                        packet["engine_load"] = load
                    if throttle is not None:
                        packet["throttle_pos"] = throttle

                    # Add accel + audio to each packet
                    if accel_data:
                        packet.update(accel_data)
                    if audio_data:
                        packet.update(audio_data)

                    report = pipeline.full_diagnose(
                        packet, db_cursor=cursor, client_hash=client_hash,
                    )
            else:
                # No OBD data — run with accel/audio only
                packet = {}
                if accel_data:
                    packet.update(accel_data)
                if audio_data:
                    packet.update(audio_data)
                report = pipeline.full_diagnose(
                    packet, db_cursor=cursor, client_hash=client_hash,
                )

            # Write DTC events if present in last packet
            dtc_codes = packet.get("dtc_codes", [])
            if dtc_codes:
                freeze = {
                    "rpm": packet.get("rpm"),
                    "speed": packet.get("speed"),
                    "coolant_temp": packet.get("coolant_temp"),
                    "voltage": packet.get("voltage"),
                }
                write_dtc_events(cursor, client_hash, dtc_codes, freeze)

            # ----------------------------------------------------------
            # 6. Escalation — load, update per diagnosis, save
            # ----------------------------------------------------------
            try:
                from .escalation import EscalationManager

                em = EscalationManager()
                em.load_from_db(cursor, client_hash)

                for diag in report.get("diagnoses", []):
                    em.update(client_hash, diag["rule_name"],
                              int(diag.get("confidence", 0)))

                escalations = []
                for diag in report.get("diagnoses", []):
                    info = em.get_escalation_info(client_hash, diag["rule_name"])
                    if info and info.get("consecutive_count", 0) > 0:
                        escalations.append({
                            "rule_name": diag["rule_name"],
                            "display": diag.get("display", diag["rule_name"]),
                            **info,
                        })

                report["escalations"] = sorted(
                    escalations,
                    key=lambda x: x.get("level", 0),
                    reverse=True,
                )

                em.save_to_db(cursor, client_hash)
            except Exception:
                logger.debug("Escalation integration skipped: %s",
                             __import__("traceback").format_exc())

            # ----------------------------------------------------------
            # 7. Recalls — check offline campaign database
            # ----------------------------------------------------------
            try:
                from .recalls_checker import RecallsChecker

                checker = RecallsChecker()
                report["recalls"] = checker.check(
                    profile.brand, profile.model, profile.year,
                )
            except Exception:
                logger.debug("Recalls integration skipped")

            # ----------------------------------------------------------
            # 8. CUSUM — historical health trends
            # ----------------------------------------------------------
            try:
                from .db_readers import read_history
                from .cusum import CUSUMDetector

                history = read_history(cursor, client_hash, "7d")
                if history and len(history) >= 5:
                    detector = CUSUMDetector()
                    report["health_trends"] = detector.compute_all_trends(
                        history,
                    )
            except Exception:
                logger.debug("CUSUM integration skipped")

            # Add metadata
            report["data_source"] = {
                "has_obd": len(obd_rows) > 0,
                "obd_packets": len(obd_rows),
                "has_accel": accel_row is not None,
                "has_audio": audio_row is not None,
                "minutes_searched": minutes,
            }

            return JsonResponse(report, status=200)

    except Exception as e:
        logger.error("diagnose_latest failed: %s", str(e))
        return JsonResponse({"error": str(e)}, status=500)


# ---------------------------------------------------------------------------
# POST /api/v2/feedback/
# ---------------------------------------------------------------------------

@csrf_exempt
def feedback_view(request: Any) -> JsonResponse:
    """Log user feedback on a diagnostic rule result.

    Expects JSON body:
        client_hash:     str (required)
        rule_name:       str (required)
        action:          str (required — confirm / reject / unsure)
        diagnosis_time:  str (optional)
        comment:         str (optional)

    For now: logs to Python logger. DB persistence in Plan 3.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        body: Dict[str, Any] = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    # Validate required fields
    for field in ("client_hash", "rule_name", "action"):
        if not body.get(field):
            return JsonResponse({"error": f"{field} required"}, status=400)

    # Try to persist feedback to DB
    try:
        from .db import get_cursor
        from .db_writers import write_feedback

        with get_cursor() as cursor:
            write_feedback(
                cursor,
                body["client_hash"],
                body["rule_name"],
                body["action"],
                body.get("diagnosis_time"),
                body.get("comment"),
            )
    except Exception:
        logger.warning("DB write failed for feedback, logging only")

    # Always log feedback
    logger.info(
        "Feedback: client=%s rule=%s action=%s comment=%s",
        body["client_hash"],
        body["rule_name"],
        body["action"],
        body.get("comment", ""),
    )

    return JsonResponse({"success": True}, status=200)


# ---------------------------------------------------------------------------
# GET /api/v2/history/
# ---------------------------------------------------------------------------

@csrf_exempt
def history_view(request: Any) -> JsonResponse:
    """Retrieve diagnostic history for a vehicle.

    Parameters (query string):
        client_hash:  str (required)
        period:       7d / 30d / 90d (default 7d)

    Returns list of anomaly_scores dicts or empty list on error/missing data.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    client_hash = None
    period = "7d"
    if hasattr(request, "GET") and request.GET is not None:
        client_hash = request.GET.get("client_hash")
        period = request.GET.get("period", "7d")

    if not client_hash:
        return JsonResponse([], safe=False, status=200)

    try:
        from .db import get_cursor
        from .db_readers import read_history

        with get_cursor() as cursor:
            data = read_history(cursor, client_hash, period)
    except Exception:
        data = []

    return JsonResponse(data, safe=False, status=200)


# ---------------------------------------------------------------------------
# GET /api/v2/correlations/
# ---------------------------------------------------------------------------

@csrf_exempt
def correlations_view(request: Any) -> JsonResponse:
    """GET /api/v2/correlations/ — get latest correlation results for a client."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    client_hash = None
    if hasattr(request, "GET") and request.GET is not None:
        client_hash = request.GET.get("client_hash")

    if not client_hash:
        return JsonResponse([], safe=False, status=200)

    try:
        from .db import get_cursor

        with get_cursor() as cursor:
            module_name = type(cursor).__module__
            ph = "?" if "sqlite" in module_name else "%s"

            if ph == "?":
                cursor.execute("""
                    SELECT time, correlation_type, r_value, slope, p_value,
                           data_points, regime, diagnosis_hint
                    FROM correlation_results
                    WHERE client_hash = ?
                    ORDER BY time DESC LIMIT 20
                """, (client_hash,))
            else:
                cursor.execute("""
                    SELECT time, correlation_type, r_value, slope, p_value,
                           data_points, regime, diagnosis_hint
                    FROM correlation_results
                    WHERE client_hash = %s
                      AND time > NOW() - INTERVAL '30 days'
                    ORDER BY time DESC LIMIT 20
                """, (client_hash,))

            columns = [
                "time", "correlation_type", "r_value", "slope",
                "p_value", "data_points", "regime", "diagnosis_hint",
            ]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return JsonResponse(results, safe=False, status=200)
    except Exception:
        return JsonResponse([], safe=False, status=200)
