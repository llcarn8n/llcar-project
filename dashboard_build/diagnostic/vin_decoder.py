"""VIN (Vehicle Identification Number) decoder.

Extracts brand, year, country, and WMI from a 17-character VIN string.
Covers 50+ common WMIs for Chinese, Japanese, Korean, German, and American
manufacturers.
"""

from __future__ import annotations

import re
import string
from typing import Optional

# ---------------------------------------------------------------------------
# WMI → Brand mapping (chars 1-3)
# ---------------------------------------------------------------------------
WMI_BRAND: dict[str, str] = {
    # ── Chinese ──────────────────────────────────────────────────────────
    "LVT": "Li Auto",
    "LFV": "FAW-VW",
    "LBV": "BYD",
    "LSV": "SAIC-VW",
    "LGB": "Geely",
    "LDC": "Changan",
    "LHG": "BAIC",
    "LJD": "Dongfeng",
    "LZW": "SAIC-GM-Wuling",
    "LVS": "Chery",
    "LVZ": "Nio",
    "LRW": "Tesla (China)",
    "LSJ": "SAIC MG",
    "LBE": "BYD (EV)",
    "LPA": "Changan (EV)",
    "LGX": "GAC",
    "LFP": "FAW Toyota",
    "LTV": "FAW Car",
    "LDN": "Soueast",
    "LKL": "Howo / Sinotruk",
    # ── Japanese ─────────────────────────────────────────────────────────
    "JTD": "Toyota",
    "JTE": "Toyota",
    "JTH": "Lexus",
    "JHM": "Honda",
    "JHL": "Honda",
    "JN1": "Nissan",
    "JN3": "Nissan",
    "JMZ": "Mazda",
    "JM1": "Mazda",
    "JS1": "Suzuki",
    "JS2": "Suzuki",
    "JF1": "Subaru",
    "JF2": "Subaru",
    "JMB": "Mitsubishi",
    # ── Korean ───────────────────────────────────────────────────────────
    "KNA": "Kia",
    "KNB": "Kia",
    "KND": "Kia",
    "KMH": "Hyundai",
    "KMJ": "Hyundai",
    "5NP": "Hyundai (USA)",
    "5XY": "Kia (USA)",
    "KPT": "SsangYong",
    # ── German ───────────────────────────────────────────────────────────
    "WBA": "BMW",
    "WBS": "BMW M",
    "WBY": "BMW i",
    "WVW": "Volkswagen",
    "WV1": "Volkswagen Commercial",
    "WAU": "Audi",
    "WA1": "Audi (SUV)",
    "WDB": "Mercedes-Benz",
    "WDD": "Mercedes-Benz",
    "WDC": "Mercedes-Benz (SUV)",
    "WMW": "MINI",
    "WP0": "Porsche",
    "WP1": "Porsche (SUV)",
    "WF0": "Ford (Germany)",
    # ── American ─────────────────────────────────────────────────────────
    "1FA": "Ford",
    "2FA": "Ford (Canada)",
    "3FA": "Ford (Mexico)",
    "1G1": "Chevrolet",
    "1GC": "Chevrolet (Truck)",
    "1C4": "Chrysler",
    "1C6": "Ram",
    "1FT": "Ford (Truck)",
    "1FM": "Ford (SUV)",
    "1N4": "Nissan (USA)",
    "5TD": "Toyota (USA)",
    "5YJ": "Tesla",
    "7SA": "Tesla",
    "2T1": "Toyota (Canada)",
    "3VW": "Volkswagen (Mexico)",
    # ── Other ────────────────────────────────────────────────────────────
    "SAL": "Land Rover",
    "SAJ": "Jaguar",
    "SCC": "Lotus",
    "VF1": "Renault",
    "VF3": "Peugeot",
    "VF7": "Citroën",
    "VSS": "SEAT",
    "ZAR": "Alfa Romeo",
    "ZFF": "Ferrari",
    "ZLA": "Lancia",
    "ZAM": "Maserati",
    "YV1": "Volvo",
}

# ---------------------------------------------------------------------------
# Year code (position 10): model year
# ---------------------------------------------------------------------------
_YEAR_CHARS = "ABCDEFGHJKLMNPRSTVWXY123456789"
_YEAR_START = 1980

YEAR_CODE: dict[str, int] = {}
for _i, _ch in enumerate(_YEAR_CHARS):
    YEAR_CODE[_ch] = _YEAR_START + _i
# After 2009 (year code "9"), the cycle repeats from "A" = 2010
for _i, _ch in enumerate(_YEAR_CHARS):
    _year = _YEAR_START + 30 + _i
    if _ch not in YEAR_CODE or _year > YEAR_CODE[_ch]:
        YEAR_CODE[_ch] = _year

# Build a correct mapping: VIN year codes cycle every 30 years.
# The standard defines: A=1980/2010, B=1981/2011, ..., 9=2009/2039.
# We resolve ambiguity by preferring the newer cycle (>= 2010).
YEAR_CODE_MAP: dict[str, int] = {}
_cycle = "ABCDEFGHJKLMNPRSTVWXY123456789"  # 30 chars
for _idx, _c in enumerate(_cycle):
    # First cycle: 1980 + idx, second cycle: 2010 + idx
    YEAR_CODE_MAP[_c] = 2010 + _idx  # prefer the newer cycle

# ---------------------------------------------------------------------------
# Country from first character of VIN
# ---------------------------------------------------------------------------
COUNTRY_RANGES: dict[str, str] = {
    "1": "US",
    "2": "CA",  # Canada
    "3": "MX",  # Mexico
    "4": "US",
    "5": "US",
    "6": "AU",  # Australia
    "7": "NZ",  # New Zealand (7A-7E) — but Tesla uses 7SA
    "8": "AR",  # Argentina (8A-8E)
    "9": "BR",  # Brazil
    "J": "JP",
    "K": "KR",
    "L": "CN",
    "M": "IN",  # India
    "N": "TR",  # Turkey (limited)
    "P": "PH",  # Philippines (limited)
    "R": "AE",  # UAE (limited)
    "S": "GB",
    "T": "CH",  # Switzerland / Czech / Hungary
    "V": "FR",
    "W": "DE",
    "X": "RU",
    "Y": "SE",  # Sweden / Finland
    "Z": "IT",
}


# ---------------------------------------------------------------------------
# Transliteration value for check-digit validation
# ---------------------------------------------------------------------------
_TRANSLITERATION = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7, "H": 8,
    "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "P": 7, "R": 9,
    "S": 2, "T": 3, "U": 4, "V": 5, "W": 6, "X": 7, "Y": 8, "Z": 9,
}
_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]


def _char_value(ch: str) -> int:
    if ch.isdigit():
        return int(ch)
    return _TRANSLITERATION.get(ch, 0)


def _check_digit(vin: str) -> str:
    """Compute the VIN check digit (position 9) per ISO 3779."""
    total = sum(_char_value(c) * w for c, w in zip(vin, _WEIGHTS))
    remainder = total % 11
    return "X" if remainder == 10 else str(remainder)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class VINError(ValueError):
    """Raised when a VIN string is invalid."""


def decode_vin(vin: str) -> dict:
    """Decode a 17-character VIN into structured vehicle metadata.

    Parameters
    ----------
    vin : str
        A 17-character Vehicle Identification Number.

    Returns
    -------
    dict
        Keys: ``brand``, ``year``, ``country``, ``wmi``.
        If a WMI or year code is unknown the corresponding value is ``None``.

    Raises
    ------
    VINError
        If *vin* is not exactly 17 valid characters (A-Z 0-9, excluding I/O/Q).
    """
    vin = vin.strip().upper()

    if len(vin) != 17:
        raise VINError(
            f"VIN must be exactly 17 characters, got {len(vin)}: {vin!r}"
        )

    invalid = set(vin) - set(string.ascii_uppercase + string.digits) | (
        set(vin) & {"I", "O", "Q"}
    )
    if invalid:
        raise VINError(
            f"VIN contains invalid characters: {', '.join(sorted(invalid))}"
        )

    wmi = vin[:3]
    year_char = vin[9]
    country_char = vin[0]

    brand: Optional[str] = WMI_BRAND.get(wmi)
    year: Optional[int] = YEAR_CODE_MAP.get(year_char)
    country: Optional[str] = COUNTRY_RANGES.get(country_char)

    return {
        "brand": brand,
        "year": year,
        "country": country,
        "wmi": wmi,
    }
