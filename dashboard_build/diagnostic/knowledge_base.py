"""KnowledgeBase — 4-level resolver for DTC codes and diagnostic situations.

Resolution hierarchy (highest priority first):
  1. Vehicle-specific  (future)
  2. Brand-specific     (add_brand_layer)
  3. Universal          (loaded in __init__)
  4. Fallback / None    (code not found)
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Set, Tuple


# ---------------------------------------------------------------------------
# Static mappings
# ---------------------------------------------------------------------------

SYSTEM_TO_CATEGORY: Dict[str, List[str]] = {
    "engine": ["engine"],
    "fuel": ["engine"],
    "ignition": ["engine"],
    "cooling": ["engine"],
    "exhaust": ["engine"],
    "transmission": ["drivetrain"],
    "brakes": ["brakes"],
    "abs": ["brakes"],
    "electrical": ["electrical"],
    "battery": ["electrical"],
    "sensors": ["electrical"],
    "suspension": ["chassis"],
    "steering": ["chassis"],
    "chassis": ["chassis"],
    "body": ["body"],
    "airbag": ["safety"],
    "network": ["electrical"],
}

# Hard-coded multi-DTC patterns — each entry contains:
#   pattern_codes : frozenset of DTC codes that must ALL be present
#   situation_id  : identifier for the matched situation
#   boost         : confidence boost value
DEFAULT_DTC_PATTERNS: List[Dict[str, Any]] = [
    {"pattern_codes": frozenset({"P0171", "P0174"}), "situation_id": "air_leak", "boost": 25},
    {"pattern_codes": frozenset({"P0172", "P0175"}), "situation_id": "rich_mixture", "boost": 25},
    {"pattern_codes": frozenset({"P0300", "P0301", "P0302"}), "situation_id": "ignition_coil", "boost": 20},
    {"pattern_codes": frozenset({"P0420", "P0430"}), "situation_id": "bad_fuel", "boost": 20},
    {"pattern_codes": frozenset({"P0171", "P0101"}), "situation_id": "maf_failure", "boost": 25},
    {"pattern_codes": frozenset({"P0016", "P0011"}), "situation_id": "vvt_problem", "boost": 20},
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_json(path: str) -> Any:
    """Read and parse a UTF-8 JSON file."""
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# KnowledgeBase
# ---------------------------------------------------------------------------

class KnowledgeBase:
    """4-level resolver for DTC codes and diagnostic situations.

    Levels loaded so far: universal + per-brand overlays.
    Vehicle-specific level is reserved for future use.
    """

    def __init__(self, dtc_index_path: str, situations_path: str) -> None:
        raw_dtc = _load_json(dtc_index_path)
        self._universal_dtc: Dict[str, Dict[str, Any]] = raw_dtc.get("codes", {})
        self._universal_situations: List[Dict[str, Any]] = _load_json(situations_path)

        # Index universal situations by 'id' for O(1) lookup
        self._universal_situations_by_id: Dict[str, Dict[str, Any]] = {
            s["id"]: s for s in self._universal_situations if "id" in s
        }

        # brand -> {"dtc": {...}, "situations": [...]}
        self._brand_layers: Dict[str, Dict[str, Any]] = {}

        # brand -> {situation_id: situation_dict}
        self._brand_situations_by_id: Dict[str, Dict[str, Dict[str, Any]]] = {}

        # Severity overrides — loaded from data/severity_overrides.json if present
        self._severity_overrides: Dict[str, str] = {}
        overrides_path = os.path.join(
            os.path.dirname(os.path.abspath(dtc_index_path)),
            "severity_overrides.json",
        )
        if os.path.isfile(overrides_path):
            self._severity_overrides = _load_json(overrides_path)

    # ------------------------------------------------------------------
    # Brand overlay
    # ------------------------------------------------------------------

    def add_brand_layer(
        self,
        brand: str,
        dtc_path: str,
        situations_path: str,
    ) -> None:
        """Register a brand-level data overlay."""
        raw_dtc = _load_json(dtc_path)
        brand_situations = _load_json(situations_path)
        self._brand_layers[brand] = {
            "dtc": raw_dtc.get("codes", {}),
            "situations": brand_situations,
        }
        # Index brand situations by id for O(1) lookup
        self._brand_situations_by_id[brand] = {
            s["id"]: s for s in brand_situations if "id" in s
        }

    # ------------------------------------------------------------------
    # DTC resolution
    # ------------------------------------------------------------------

    def resolve_dtc(self, code: str, brand: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Resolve a DTC code. Brand layer overrides universal if present.

        After lookup, severity_overrides.json is applied as a final correction
        layer -- it fixes known inconsistencies in the upstream DTC databases.
        """
        result: Optional[Dict[str, Any]] = None

        if brand and brand in self._brand_layers:
            brand_dtc = self._brand_layers[brand]["dtc"]
            if code in brand_dtc:
                result = dict(brand_dtc[code])  # shallow copy

        if result is None and code in self._universal_dtc:
            result = dict(self._universal_dtc[code])

        # Apply severity override (highest priority correction layer)
        if result is not None and code in self._severity_overrides:
            result["severity"] = self._severity_overrides[code]

        return result

    # ------------------------------------------------------------------
    # Situation finders
    # ------------------------------------------------------------------

    def _get_situations(self, brand: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return combined situation list (universal + brand if specified)."""
        base = list(self._universal_situations)
        if brand and brand in self._brand_layers:
            base.extend(self._brand_layers[brand]["situations"])
        return base

    def find_situation_by_id(
        self, situation_id: str, brand: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Look up a single situation by its 'id' field.

        Brand layer takes priority over universal if brand is specified
        and the situation_id exists in the brand layer.
        Returns the situation dict or None if not found.
        """
        # Brand layer first (if specified)
        if brand and brand in self._brand_situations_by_id:
            brand_match = self._brand_situations_by_id[brand].get(situation_id)
            if brand_match is not None:
                return brand_match

        # Universal layer
        return self._universal_situations_by_id.get(situation_id)

    def find_situations_by_dtc(
        self, code: str, brand: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Return situations whose dtc_codes list contains *code*."""
        return [
            s for s in self._get_situations(brand)
            if code in s.get("dtc_codes", [])
        ]

    def find_situations_by_category(
        self, category: str, brand: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Return situations matching a category directly."""
        return [
            s for s in self._get_situations(brand)
            if s.get("category") == category
        ]

    def find_situations_by_system_id(
        self, system_id: str, brand: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Map system_id to categories via SYSTEM_TO_CATEGORY, then filter."""
        categories = self.system_id_to_categories(system_id)
        if not categories:
            return []
        cat_set = set(categories)
        return [
            s for s in self._get_situations(brand)
            if s.get("category") in cat_set
        ]

    # ------------------------------------------------------------------
    # Multi-DTC pattern matching
    # ------------------------------------------------------------------

    def match_dtc_pattern(
        self, codes: List[str]
    ) -> Optional[Dict[str, Any]]:
        """Check if *codes* match any known multi-DTC pattern (subset match).

        A pattern matches when all of its pattern_codes are present in *codes*.
        If multiple patterns match, the one with the highest boost wins.
        Returns dict with situation_id and boost, or None.
        """
        code_set: Set[str] = set(codes)
        best: Optional[Dict[str, Any]] = None

        for pattern in DEFAULT_DTC_PATTERNS:
            if pattern["pattern_codes"].issubset(code_set):
                if best is None or pattern["boost"] > best["boost"]:
                    best = {
                        "situation_id": pattern["situation_id"],
                        "boost": pattern["boost"],
                    }

        return best

    # ------------------------------------------------------------------
    # DTC range classification (SAE J2012)
    # ------------------------------------------------------------------

    _DTC_CODE_RE = re.compile(r"^([PBCU])(\d{4})$", re.IGNORECASE)

    def _load_dtc_ranges(self) -> List[Dict[str, Any]]:
        """Lazily load and cache dtc_range_categories.json."""
        if hasattr(self, "_dtc_ranges_cache"):
            return self._dtc_ranges_cache

        ranges_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "data",
            "dtc_range_categories.json",
        )
        if os.path.isfile(ranges_path):
            self._dtc_ranges_cache: List[Dict[str, Any]] = _load_json(ranges_path)
        else:
            self._dtc_ranges_cache = []

        return self._dtc_ranges_cache

    @staticmethod
    def _parse_dtc_code(code: str) -> Optional[Tuple[str, int]]:
        """Parse a DTC code into (prefix_letter, number). Returns None if invalid."""
        m = KnowledgeBase._DTC_CODE_RE.match(code)
        if not m:
            return None
        return m.group(1).upper(), int(m.group(2))

    def classify_dtc_by_range(self, code: str) -> Optional[Dict[str, str]]:
        """Classify a DTC code by SAE J2012 range.

        Returns {"category": ..., "system": ...} or None if no range matches.
        """
        parsed = self._parse_dtc_code(code)
        if parsed is None:
            return None
        prefix, number = parsed

        for entry in self._load_dtc_ranges():
            r_start = self._parse_dtc_code(entry["range_start"])
            r_end = self._parse_dtc_code(entry["range_end"])
            if r_start is None or r_end is None:
                continue
            if r_start[0] != prefix:
                continue
            if r_start[1] <= number <= r_end[1]:
                return {"category": entry["category"], "system": entry["system"]}

        return None

    def find_situations_by_dtc_range(
        self, code: str, brand: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Find situations matching a DTC code's SAE J2012 category."""
        classification = self.classify_dtc_by_range(code)
        if not classification:
            return []
        return self.find_situations_by_category(classification["category"], brand=brand)

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def system_id_to_categories(system_id: str) -> List[str]:
        """Map a system_id to its parent categories."""
        return list(SYSTEM_TO_CATEGORY.get(system_id, []))
