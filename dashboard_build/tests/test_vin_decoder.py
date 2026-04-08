"""Tests for vin_decoder module."""
import pytest
from diagnostic.vin_decoder import decode_vin, VINError, WMI_BRAND, YEAR_CODE_MAP


# ---------------------------------------------------------------------------
# Valid VIN decoding
# ---------------------------------------------------------------------------

class TestDecodeVinBasic:
    """Core happy-path tests."""

    def test_li_auto_2023(self):
        # LVT + P (2023) + China
        result = decode_vin("LVTMA2851PS123456")
        assert result["brand"] == "Li Auto"
        assert result["year"] == 2023
        assert result["country"] == "CN"
        assert result["wmi"] == "LVT"

    def test_toyota_japan(self):
        result = decode_vin("JTDKN3DU5A0123456")
        assert result["brand"] == "Toyota"
        assert result["country"] == "JP"
        assert result["wmi"] == "JTD"

    def test_bmw_germany(self):
        result = decode_vin("WBA12345678901234")
        assert result["brand"] == "BMW"
        assert result["country"] == "DE"
        assert result["wmi"] == "WBA"

    def test_ford_usa(self):
        result = decode_vin("1FAHP3F29CL123456")
        assert result["brand"] == "Ford"
        assert result["country"] == "US"
        assert result["wmi"] == "1FA"

    def test_byd_china(self):
        result = decode_vin("LBVNU1100PS654321")
        assert result["brand"] == "BYD"
        assert result["country"] == "CN"
        assert result["wmi"] == "LBV"

    def test_hyundai_korea(self):
        result = decode_vin("KMHDN46D19U123456")
        assert result["brand"] == "Hyundai"
        assert result["country"] == "KR"
        assert result["wmi"] == "KMH"

    def test_kia_korea(self):
        result = decode_vin("KNAGM4A77D5123456")
        assert result["brand"] == "Kia"
        assert result["country"] == "KR"
        assert result["wmi"] == "KNA"

    def test_mercedes_germany(self):
        result = decode_vin("WDBRF61J21F123456")
        assert result["brand"] == "Mercedes-Benz"
        assert result["country"] == "DE"
        assert result["wmi"] == "WDB"

    def test_volkswagen_germany(self):
        result = decode_vin("WVWZZZ3CZWE123456")
        assert result["brand"] == "Volkswagen"
        assert result["country"] == "DE"
        assert result["wmi"] == "WVW"

    def test_audi_germany(self):
        result = decode_vin("WAUZZZ8V9RA123456")
        assert result["brand"] == "Audi"
        assert result["country"] == "DE"
        assert result["wmi"] == "WAU"

    def test_tesla_usa(self):
        result = decode_vin("5YJ3E1EA1NF123456")
        assert result["brand"] == "Tesla"
        assert result["country"] == "US"
        assert result["wmi"] == "5YJ"

    def test_chevrolet_usa(self):
        result = decode_vin("1G1YY22G555123456")
        assert result["brand"] == "Chevrolet"
        assert result["country"] == "US"
        assert result["wmi"] == "1G1"

    def test_honda_japan(self):
        result = decode_vin("JHMGE8H59DC123456")
        assert result["brand"] == "Honda"
        assert result["country"] == "JP"
        assert result["wmi"] == "JHM"

    def test_nissan_japan(self):
        result = decode_vin("JN1TANT30Z0123456")
        assert result["brand"] == "Nissan"
        assert result["country"] == "JP"
        assert result["wmi"] == "JN1"

    def test_geely_china(self):
        result = decode_vin("LGBH12E41EY123456")
        assert result["brand"] == "Geely"
        assert result["country"] == "CN"
        assert result["wmi"] == "LGB"


# ---------------------------------------------------------------------------
# Year-code tests
# ---------------------------------------------------------------------------

class TestYearCode:
    """Verify year decoding for various model-year codes."""

    @pytest.mark.parametrize("char,expected_year", [
        ("N", 2022),
        ("P", 2023),
        ("R", 2024),
        ("S", 2025),
        ("T", 2026),
        ("A", 2010),
        ("B", 2011),
        ("C", 2012),
        ("K", 2019),
        ("L", 2020),
        ("M", 2021),
        ("V", 2027),
        ("W", 2028),
        ("X", 2029),
        ("Y", 2030),
        ("1", 2031),
        ("2", 2032),
        ("9", 2039),
    ])
    def test_year_char_mapping(self, char, expected_year):
        assert YEAR_CODE_MAP[char] == expected_year

    def test_year_extracted_from_position_10(self):
        # Position 10 (index 9) = 'R' → 2024
        result = decode_vin("LVTMA2851RS123456")
        assert result["year"] == 2024


# ---------------------------------------------------------------------------
# Country detection
# ---------------------------------------------------------------------------

class TestCountry:
    """Country from first VIN character."""

    @pytest.mark.parametrize("first_char,expected_country", [
        ("1", "US"),
        ("2", "CA"),
        ("3", "MX"),
        ("4", "US"),
        ("5", "US"),
        ("J", "JP"),
        ("K", "KR"),
        ("L", "CN"),
        ("S", "GB"),
        ("V", "FR"),
        ("W", "DE"),
        ("Z", "IT"),
        ("X", "RU"),
        ("Y", "SE"),
    ])
    def test_country_detection(self, first_char, expected_country):
        # Build a minimal valid VIN starting with the given char
        vin = first_char + "A" * 16
        result = decode_vin(vin)
        assert result["country"] == expected_country


# ---------------------------------------------------------------------------
# Unknown WMI / year gracefully returns None
# ---------------------------------------------------------------------------

class TestUnknownValues:
    """Unknown WMI or year code returns None, not an error."""

    def test_unknown_wmi(self):
        vin = "AA1234567890ABCDE"
        result = decode_vin(vin)
        assert result["brand"] is None
        assert result["wmi"] == "AA1"

    def test_country_none_for_unknown_prefix(self):
        # 'H' is not in our mapping
        vin = "HA1234567890ABCDE"
        result = decode_vin(vin)
        assert result["country"] is None


# ---------------------------------------------------------------------------
# Validation / error handling
# ---------------------------------------------------------------------------

class TestVINValidation:
    """Malformed VINs should raise VINError."""

    def test_too_short(self):
        with pytest.raises(VINError, match="17 characters"):
            decode_vin("LVTMA285")

    def test_too_long(self):
        with pytest.raises(VINError, match="17 characters"):
            decode_vin("LVTMA2851PS123456X")

    def test_empty_string(self):
        with pytest.raises(VINError, match="17 characters"):
            decode_vin("")

    def test_contains_I(self):
        with pytest.raises(VINError, match="invalid characters"):
            decode_vin("LVTMA2851IS12345I")

    def test_contains_O(self):
        with pytest.raises(VINError, match="invalid characters"):
            decode_vin("LVTMA2851OS12345O")

    def test_contains_Q(self):
        with pytest.raises(VINError, match="invalid characters"):
            decode_vin("LVTMA2851QS12345Q")

    def test_lowercase_accepted(self):
        """Lower-case VINs should be normalized to uppercase without error."""
        result = decode_vin("lvtma2851ps123456")
        assert result["brand"] == "Li Auto"

    def test_whitespace_stripped(self):
        result = decode_vin("  LVTMA2851PS123456  ")
        assert result["brand"] == "Li Auto"


# ---------------------------------------------------------------------------
# WMI catalogue completeness
# ---------------------------------------------------------------------------

class TestWMICatalogue:
    """Verify the catalogue has sufficient coverage."""

    def test_at_least_50_wmi_entries(self):
        assert len(WMI_BRAND) >= 50

    def test_major_chinese_brands_present(self):
        chinese = {"LVT", "LFV", "LBV", "LSV", "LGB", "LDC"}
        assert chinese.issubset(WMI_BRAND.keys())

    def test_major_japanese_brands_present(self):
        japanese = {"JTD", "JHM", "JN1", "JMZ", "JS1", "JF1"}
        assert japanese.issubset(WMI_BRAND.keys())

    def test_major_german_brands_present(self):
        german = {"WBA", "WVW", "WAU", "WDB", "WDD"}
        assert german.issubset(WMI_BRAND.keys())

    def test_major_american_brands_present(self):
        american = {"1FA", "1G1", "1C4", "5YJ"}
        assert american.issubset(WMI_BRAND.keys())

    def test_korean_brands_present(self):
        korean = {"KNA", "KMH"}
        assert korean.issubset(WMI_BRAND.keys())
