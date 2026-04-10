"""KnowledgeBase — 4-level resolver for DTC codes and diagnostic situations.

Resolution hierarchy (highest priority first):
  1. Generation-specific (add_generation_layer)
  2. Model-specific      (add_model_layer)
  3. Brand-specific      (add_brand_layer)
  4. Universal           (loaded in __init__)
  5. Fallback / None     (code not found)
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

    Levels: universal → brand → model → generation (most specific wins).
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

        # "brand/model" -> {"dtc": {...}, "situations": [...]}
        self._model_layers: Dict[str, Dict[str, Any]] = {}

        # "brand/model" -> {situation_id: situation_dict}
        self._model_situations_by_id: Dict[str, Dict[str, Dict[str, Any]]] = {}

        # "brand/model/generation" -> {"dtc": {...}, "situations": [...]}
        self._generation_layers: Dict[str, Dict[str, Any]] = {}

        # "brand/model/generation" -> {situation_id: situation_dict}
        self._generation_situations_by_id: Dict[str, Dict[str, Dict[str, Any]]] = {}

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
    # Model overlay
    # ------------------------------------------------------------------

    def add_model_layer(
        self,
        brand: str,
        model: str,
        dtc_path: Optional[str] = None,
        situations_path: Optional[str] = None,
    ) -> None:
        """Register a model-level data overlay."""
        key = f"{brand}/{model}"
        if key in self._model_layers:
            return  # already loaded

        layer: Dict[str, Any] = {"dtc": {}, "situations": []}
        if dtc_path and os.path.isfile(dtc_path):
            raw = _load_json(dtc_path)
            layer["dtc"] = raw.get("codes", {}) if isinstance(raw, dict) else {}
        if situations_path and os.path.isfile(situations_path):
            raw = _load_json(situations_path)
            layer["situations"] = raw if isinstance(raw, list) else raw.get("situations", [])

        self._model_layers[key] = layer
        self._model_situations_by_id[key] = {
            s["id"]: s for s in layer["situations"] if "id" in s
        }

    # ------------------------------------------------------------------
    # Generation overlay
    # ------------------------------------------------------------------

    def add_generation_layer(
        self,
        brand: str,
        model: str,
        generation: str,
        dtc_path: Optional[str] = None,
        situations_path: Optional[str] = None,
    ) -> None:
        """Register a generation-level data overlay."""
        key = f"{brand}/{model}/{generation}"
        if key in self._generation_layers:
            return  # already loaded

        layer: Dict[str, Any] = {"dtc": {}, "situations": []}
        if dtc_path and os.path.isfile(dtc_path):
            raw = _load_json(dtc_path)
            layer["dtc"] = raw.get("codes", {}) if isinstance(raw, dict) else {}
        if situations_path and os.path.isfile(situations_path):
            raw = _load_json(situations_path)
            layer["situations"] = raw if isinstance(raw, list) else raw.get("situations", [])

        self._generation_layers[key] = layer
        self._generation_situations_by_id[key] = {
            s["id"]: s for s in layer["situations"] if "id" in s
        }

    # ------------------------------------------------------------------
    # DTC resolution
    # ------------------------------------------------------------------

    def resolve_dtc(
        self,
        code: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Resolve a DTC code. Most specific layer wins.

        Resolution order: generation → model → brand → universal.
        After lookup, severity_overrides.json is applied as a final correction
        layer -- it fixes known inconsistencies in the upstream DTC databases.
        """
        result: Optional[Dict[str, Any]] = None

        # Generation layer (highest priority)
        if generation and model and brand:
            gen_key = f"{brand}/{model}/{generation}"
            if gen_key in self._generation_layers:
                gen_dtc = self._generation_layers[gen_key]["dtc"]
                if code in gen_dtc:
                    result = dict(gen_dtc[code])

        # Model layer
        if result is None and model and brand:
            model_key = f"{brand}/{model}"
            if model_key in self._model_layers:
                model_dtc = self._model_layers[model_key]["dtc"]
                if code in model_dtc:
                    result = dict(model_dtc[code])

        # Brand layer
        if result is None and brand and brand in self._brand_layers:
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
    # Situation filtering
    # ------------------------------------------------------------------

    @staticmethod
    def _is_diagnostic_situation(situation: Dict[str, Any]) -> bool:
        """Return True if situation is a real diagnostic entry, not a manual/maintenance excerpt."""
        sid = situation.get("id", "")
        source = situation.get("source", "")
        # Filter out maintenance entries and manual warnings
        if sid.startswith("maint_") or sid.startswith("man_"):
            return False
        if source in ("manual_warning", "maintenance"):
            return False
        return True

    # ------------------------------------------------------------------
    # Situation finders
    # ------------------------------------------------------------------

    def _get_situations(
        self,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return combined situation list (universal + brand + model + generation)."""
        base = list(self._universal_situations)
        if brand and brand in self._brand_layers:
            base.extend(self._brand_layers[brand]["situations"])
        if model and brand:
            model_key = f"{brand}/{model}"
            if model_key in self._model_layers:
                base.extend(self._model_layers[model_key]["situations"])
        if generation and model and brand:
            gen_key = f"{brand}/{model}/{generation}"
            if gen_key in self._generation_layers:
                base.extend(self._generation_layers[gen_key]["situations"])
        return base

    def find_situation_by_id(
        self,
        situation_id: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Look up a single situation by its 'id' field.

        Most specific layer wins: generation → model → brand → universal.
        Returns the situation dict or None if not found.
        """
        # Generation layer (highest priority)
        if generation and model and brand:
            gen_key = f"{brand}/{model}/{generation}"
            if gen_key in self._generation_situations_by_id:
                match = self._generation_situations_by_id[gen_key].get(situation_id)
                if match is not None:
                    return match

        # Model layer
        if model and brand:
            model_key = f"{brand}/{model}"
            if model_key in self._model_situations_by_id:
                match = self._model_situations_by_id[model_key].get(situation_id)
                if match is not None:
                    return match

        # Brand layer
        if brand and brand in self._brand_situations_by_id:
            brand_match = self._brand_situations_by_id[brand].get(situation_id)
            if brand_match is not None:
                return brand_match

        # Universal layer
        return self._universal_situations_by_id.get(situation_id)

    def find_situations_by_dtc(
        self,
        code: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return situations whose dtc_codes list contains *code*."""
        return [
            s for s in self._get_situations(brand, model, generation)
            if code in s.get("dtc_codes", [])
        ]

    def find_situations_by_category(
        self,
        category: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return situations matching a category directly.

        Maintenance / manual-warning excerpts are excluded to avoid
        polluting category-based fallback matching.
        """
        return [
            s for s in self._get_situations(brand, model, generation)
            if s.get("category") == category and self._is_diagnostic_situation(s)
        ]

    def find_situations_by_system_id(
        self,
        system_id: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Map system_id to categories via SYSTEM_TO_CATEGORY, then filter.

        Maintenance / manual-warning excerpts are excluded (same as
        find_situations_by_category).
        """
        categories = self.system_id_to_categories(system_id)
        if not categories:
            return []
        cat_set = set(categories)
        return [
            s for s in self._get_situations(brand, model, generation)
            if s.get("category") in cat_set and self._is_diagnostic_situation(s)
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
    # Curated DTC → situation map (highest-priority lookup)
    # ------------------------------------------------------------------

    def _load_dtc_situation_map(self) -> Dict[str, Dict[str, Any]]:
        """Lazily load and cache dtc_situation_map.json."""
        if hasattr(self, "_dtc_situation_map_cache"):
            return self._dtc_situation_map_cache

        map_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "data",
            "dtc_situation_map.json",
        )
        if os.path.isfile(map_path):
            raw = _load_json(map_path)
            # Strip _meta key, keep only DTC code entries
            self._dtc_situation_map_cache: Dict[str, Dict[str, Any]] = {
                k: v for k, v in raw.items() if not k.startswith("_")
            }
        else:
            self._dtc_situation_map_cache = {}

        return self._dtc_situation_map_cache

    def resolve_dtc_to_situation(
        self,
        code: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Highest-priority lookup: curated DTC -> situation map.

        If *code* is found in dtc_situation_map.json, iterates the
        situation_ids list and returns the first situation that exists
        in the KB (checking generation → model → brand → universal).

        Returns the situation dict or None if no curated mapping exists.
        """
        curated_map = self._load_dtc_situation_map()
        entry = curated_map.get(code)
        if entry is None:
            return None

        for sid in entry.get("situation_ids", []):
            situation = self.find_situation_by_id(
                sid, brand=brand, model=model, generation=generation,
            )
            if situation is not None:
                return situation

        return None

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
        self,
        code: str,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        generation: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Find situations matching a DTC code's SAE J2012 category."""
        classification = self.classify_dtc_by_range(code)
        if not classification:
            return []
        return self.find_situations_by_category(
            classification["category"], brand=brand, model=model, generation=generation,
        )

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # DB-backed DTC pattern loading
    # ------------------------------------------------------------------

    @staticmethod
    def load_dtc_patterns(cursor) -> List[Dict]:
        """Load multi-DTC patterns from dtc_patterns table.

        Works with both PostgreSQL (TEXT[] columns) and SQLite (JSON string columns).
        Returns a list of dicts with keys: codes (set), diagnosis, confidence_boost, description_ru.
        """
        cursor.execute(
            "SELECT pattern_codes, diagnosis, confidence_boost, description_ru FROM dtc_patterns"
        )
        patterns: List[Dict] = []
        for row in cursor.fetchall():
            codes = row[0]
            # Handle both PostgreSQL TEXT[] (returns list) and SQLite JSON string
            if isinstance(codes, str):
                codes = json.loads(codes)
            patterns.append({
                "codes": set(codes),
                "diagnosis": row[1],
                "confidence_boost": row[2],
                "description_ru": row[3],
            })
        return patterns

    @staticmethod
    def system_id_to_categories(system_id: str) -> List[str]:
        """Map a system_id to its parent categories."""
        return list(SYSTEM_TO_CATEGORY.get(system_id, []))
