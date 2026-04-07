"""Tests for API views — diagnose, feedback, history endpoints.

Uses MockRequest instead of Django test client so tests run
without Django installed.
"""

import json
import os
import pytest

# ---------------------------------------------------------------------------
# Mock request helper
# ---------------------------------------------------------------------------


class MockRequest:
    """Minimal request object mimicking Django's HttpRequest."""

    def __init__(self, method="POST", body=None):
        self.method = method
        self.body = json.dumps(body).encode("utf-8") if body else b"{}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse(response):
    """Return (status_code, parsed_json) from a JsonResponse."""
    return response.status_code, json.loads(response.content)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_DIAGNOSE_BODY = {
    "client_hash": "test_api_001",
    "vehicle_profile": {
        "brand": "li_auto",
        "model": "L7",
        "year": 2023,
    },
    "data": [
        {
            "rpm": 800,
            "speed": 0,
            "coolant_temp": 90,
            "voltage": 14.2,
        },
    ],
}

VALID_FEEDBACK_BODY = {
    "client_hash": "test_api_001",
    "rule_name": "engine_overheating",
    "diagnosis_time": "2026-04-07T12:00:00Z",
    "action": "confirm",
    "comment": "Yes, engine was hot",
}


# ---------------------------------------------------------------------------
# diagnose_view tests
# ---------------------------------------------------------------------------

class TestDiagnoseView:
    """Tests for POST /api/v2/diagnose/."""

    def test_valid_request_returns_200_with_can_drive(self):
        from diagnostic.api_views import diagnose_view

        req = MockRequest(method="POST", body=VALID_DIAGNOSE_BODY)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert "can_drive" in data
        assert data["can_drive"] in ("safe", "caution", "stop")

    def test_missing_client_hash_returns_400(self):
        from diagnostic.api_views import diagnose_view

        body = {
            "vehicle_profile": {"brand": "li_auto", "model": "L7", "year": 2023},
            "data": [{"rpm": 800}],
        }
        req = MockRequest(method="POST", body=body)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 400
        assert "error" in data

    def test_get_method_returns_405(self):
        from diagnostic.api_views import diagnose_view

        req = MockRequest(method="GET", body=VALID_DIAGNOSE_BODY)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 405
        assert "error" in data

    def test_missing_data_returns_400(self):
        from diagnostic.api_views import diagnose_view

        body = {
            "client_hash": "test_api_002",
            "data": [],
        }
        req = MockRequest(method="POST", body=body)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 400
        assert "error" in data

    def test_report_contains_all_blocks(self):
        from diagnostic.api_views import diagnose_view

        req = MockRequest(method="POST", body=VALID_DIAGNOSE_BODY)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 200
        for key in ("can_drive", "health_scores", "health_trends",
                     "diagnoses", "fuel_loss", "recalls", "next_steps",
                     "confidence", "baseline_status", "rule_version"):
            assert key in data, f"Missing report key: {key}"

    def test_dtc_codes_passed_to_packets(self):
        from diagnostic.api_views import diagnose_view

        body = {
            "client_hash": "test_api_dtc",
            "data": [
                {"rpm": 800, "speed": 0, "coolant_temp": 90, "voltage": 14.2},
            ],
            "dtc_codes": ["P0171"],
        }
        req = MockRequest(method="POST", body=body)
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert "can_drive" in data

    def test_malformed_json_returns_400(self):
        from diagnostic.api_views import diagnose_view

        req = MockRequest(method="POST")
        req.body = b"not-json{{"
        resp = diagnose_view(req)
        status, data = _parse(resp)

        assert status == 400
        assert "error" in data


# ---------------------------------------------------------------------------
# feedback_view tests
# ---------------------------------------------------------------------------

class TestFeedbackView:
    """Tests for POST /api/v2/feedback/."""

    def test_valid_feedback_returns_200(self):
        from diagnostic.api_views import feedback_view

        req = MockRequest(method="POST", body=VALID_FEEDBACK_BODY)
        resp = feedback_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert data["success"] is True

    def test_missing_action_returns_400(self):
        from diagnostic.api_views import feedback_view

        body = {
            "client_hash": "test_api_001",
            "rule_name": "engine_overheating",
        }
        req = MockRequest(method="POST", body=body)
        resp = feedback_view(req)
        status, data = _parse(resp)

        assert status == 400
        assert "error" in data
        assert "action" in data["error"]

    def test_missing_rule_name_returns_400(self):
        from diagnostic.api_views import feedback_view

        body = {
            "client_hash": "test_api_001",
            "action": "confirm",
        }
        req = MockRequest(method="POST", body=body)
        resp = feedback_view(req)
        status, data = _parse(resp)

        assert status == 400
        assert "error" in data
        assert "rule_name" in data["error"]

    def test_get_method_returns_405(self):
        from diagnostic.api_views import feedback_view

        req = MockRequest(method="GET")
        resp = feedback_view(req)
        status, data = _parse(resp)

        assert status == 405


# ---------------------------------------------------------------------------
# history_view tests
# ---------------------------------------------------------------------------

class TestHistoryView:
    """Tests for GET /api/v2/history/."""

    def test_get_returns_200_with_list(self):
        from diagnostic.api_views import history_view

        req = MockRequest(method="GET")
        resp = history_view(req)
        status, data = _parse(resp)

        assert status == 200
        assert isinstance(data, list)

    def test_post_method_returns_405(self):
        from diagnostic.api_views import history_view

        req = MockRequest(method="POST")
        resp = history_view(req)
        status, data = _parse(resp)

        assert status == 405
        assert "error" in data
