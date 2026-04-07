"""Recalls Checker — searches local recalls database for matching campaigns.

Uses the offline Росстандарт/NHTSA/OEM database (298 campaigns, 91 brands).
Matches by brand slug + model name (fuzzy substring) + year.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional


_DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "recalls-database.json")


def _parse_years(years_raw: Any) -> List[int]:
    """Parse the years field into a list of ints.

    Accepts:
      - "" / None         → []
      - "2013"            → [2013]
      - "2024-2025"       → [2024, 2025]
      - [2013, 2014, ...] → as-is
    """
    if isinstance(years_raw, list):
        return [int(y) for y in years_raw]
    if not years_raw:
        return []
    s = str(years_raw).strip()
    if not s:
        return []
    if "-" in s:
        parts = s.split("-", 1)
        try:
            start, end = int(parts[0]), int(parts[1])
            return list(range(start, end + 1))
        except (ValueError, IndexError):
            return []
    try:
        return [int(s)]
    except ValueError:
        return []


class RecallsChecker:
    """Search offline recalls database for matching campaigns."""

    def __init__(self, db_path: str = None):
        path = db_path or _DEFAULT_DB_PATH
        self._campaigns: List[Dict[str, Any]] = []
        self._brands: Dict[str, Dict[str, Any]] = {}
        self._load(path)

    def _load(self, path: str) -> None:
        """Load recalls database from JSON file."""
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as f:
            db = json.load(f)
        self._campaigns = db.get("campaigns", [])
        self._brands = db.get("brands", {})

    def check(self, brand: str, model: str, year: int) -> List[Dict[str, Any]]:
        """Search for recalls matching brand + model + year.

        brand: brand slug (e.g. "toyota", "bmw", "chery")
        model: model name (e.g. "Camry", "X5", "Tiggo 8 Pro")
        year: production year

        Returns list of matching campaign dicts with keys:
            id, brand, title_ru, description_ru, severity, system, date, models, source, count
        """
        brand_lower = brand.lower().strip()
        model_lower = model.lower().strip()

        matches = []
        for campaign in self._campaigns:
            # Match brand
            if campaign.get("brand", "").lower() != brand_lower:
                continue

            # Match year (if campaign has years)
            years = _parse_years(campaign.get("years", ""))
            if years and year not in years:
                continue

            # Match model (fuzzy: model name appears in any of the campaign's models)
            campaign_models = campaign.get("models", [])
            model_match = False
            for cm in campaign_models:
                cm_lower = cm.lower()
                # Check if user's model appears in campaign model or vice versa
                if model_lower in cm_lower or cm_lower in model_lower:
                    model_match = True
                    break
                # Also check individual words (e.g. "Tiggo" in "Chery Tiggo 8 Pro")
                for word in model_lower.split():
                    if len(word) >= 3 and word in cm_lower:
                        model_match = True
                        break
                if model_match:
                    break

            if not model_match and campaign_models:
                continue

            # If campaign has no models list, match by brand only (brand-wide recall)
            matches.append({
                "id": campaign.get("id", ""),
                "brand": campaign.get("brand", ""),
                "title_ru": campaign.get("title_ru", ""),
                "description_ru": campaign.get("description_ru", ""),
                "severity": campaign.get("severity", "medium"),
                "system": campaign.get("system", ""),
                "date": campaign.get("date", ""),
                "models": campaign.get("models", []),
                "source": campaign.get("source", ""),
                "count": campaign.get("count", 0),
            })

        # Sort by severity (critical first) then date (newest first)
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        matches.sort(key=lambda x: (
            severity_order.get(x.get("severity", "medium"), 2),
            x.get("date", "") or "",
        ))

        return matches

    @property
    def total_campaigns(self) -> int:
        return len(self._campaigns)

    @property
    def brands_count(self) -> int:
        return len(self._brands)
