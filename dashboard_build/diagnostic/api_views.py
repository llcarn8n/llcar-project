"""API views for the diagnostic engine.

Three endpoints:
  POST /api/v2/diagnose/  — run full diagnostic pipeline on data packets
  POST /api/v2/feedback/  — log user feedback on a diagnosis
  GET  /api/v2/history/   — retrieve diagnostic history (placeholder)

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
