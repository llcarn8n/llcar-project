"""Tests for validate_vehicles script."""

import json
import os
import tempfile

import pytest

# Allow import from scripts directory
import sys

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", "diagnostic", "scripts"),
)
from validate_vehicles import validate_vehicles


def _write_json(tmp_path: str, brands: list) -> str:
    """Helper: write a minimal vehicles-ru.json and return its path."""
    path = os.path.join(tmp_path, "vehicles.json")
    data = {"version": "test", "brands": brands}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return path


class TestValidateVehicles:
    """Tests for the validate_vehicles function."""

    def test_clean_data_no_issues(self, tmp_path):
        """Normal data with valid year ranges produces zero issues."""
        path = _write_json(
            str(tmp_path),
            [
                {
                    "name": "Toyota",
                    "models": [
                        {
                            "name": "Camry",
                            "generations": [
                                {"name": "XV70", "ys": 2017, "ye": 2024},
                                {"name": "XV80", "ys": 2024, "ye": None},
                            ],
                        }
                    ],
                }
            ],
        )
        result = validate_vehicles(path)
        assert result["total"] == 2
        total_issues = sum(len(v) for v in result["issues"].values())
        assert total_issues == 0

    def test_inverted_range_detected(self, tmp_path):
        """End year before start year is flagged as inverted_range."""
        path = _write_json(
            str(tmp_path),
            [
                {
                    "name": "TestBrand",
                    "models": [
                        {
                            "name": "BadModel",
                            "generations": [
                                {"name": "Gen1", "ys": 2020, "ye": 2015},
                            ],
                        }
                    ],
                }
            ],
        )
        result = validate_vehicles(path)
        assert len(result["issues"]["inverted_range"]) == 1
        assert "BadModel" in result["issues"]["inverted_range"][0]

    def test_null_start_year_detected(self, tmp_path):
        """Missing ys is flagged as null_years."""
        path = _write_json(
            str(tmp_path),
            [
                {
                    "name": "TestBrand",
                    "models": [
                        {
                            "name": "NoYear",
                            "generations": [
                                {"name": "Gen1", "ye": 2020},
                            ],
                        }
                    ],
                }
            ],
        )
        result = validate_vehicles(path)
        assert len(result["issues"]["null_years"]) == 1
        assert "NoYear" in result["issues"]["null_years"][0]

    def test_impossible_year_detected(self, tmp_path):
        """Year before 1900 is flagged as impossible_year."""
        path = _write_json(
            str(tmp_path),
            [
                {
                    "name": "AncientBrand",
                    "models": [
                        {
                            "name": "TimeMachine",
                            "generations": [
                                {"name": "Gen1", "ys": 1800, "ye": 2020},
                            ],
                        }
                    ],
                }
            ],
        )
        result = validate_vehicles(path)
        assert len(result["issues"]["impossible_year"]) == 1
        assert "1800" in result["issues"]["impossible_year"][0]

    def test_zero_span_detected(self, tmp_path):
        """Start year == end year is flagged as zero_span."""
        path = _write_json(
            str(tmp_path),
            [
                {
                    "name": "ShortLived",
                    "models": [
                        {
                            "name": "OneYear",
                            "generations": [
                                {"name": "Gen1", "ys": 2023, "ye": 2023},
                            ],
                        }
                    ],
                }
            ],
        )
        result = validate_vehicles(path)
        assert len(result["issues"]["zero_span"]) == 1
        assert "2023-2023" in result["issues"]["zero_span"][0]
