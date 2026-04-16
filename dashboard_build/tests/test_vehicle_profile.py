"""Tests for VehicleProfile dataclass."""
import pytest
from diagnostic.vehicle_profile import VehicleProfile


class TestVehicleProfileCreation:
    """Test basic creation and defaults."""

    def test_basic_creation_with_defaults(self):
        vp = VehicleProfile(
            client_hash="abc123",
            brand="Toyota",
            model="Camry",
            year=2020,
        )
        assert vp.client_hash == "abc123"
        assert vp.brand == "Toyota"
        assert vp.model == "Camry"
        assert vp.year == 2020
        assert vp.vin is None
        assert vp.generation is None
        assert vp.engine_code is None
        assert vp.engine_type == "ice"
        assert vp.mileage_km == 0
        assert vp.platform is None
        assert vp.modifications == {}

    def test_full_creation_all_fields(self):
        mods = {"euro2_removed_cat": True, "fuel_type": "lpg"}
        vp = VehicleProfile(
            client_hash="xyz789",
            brand="Chevrolet",
            model="Cruze",
            year=2018,
            vin="XUUTA69E0JA012345",
            generation="J400",
            engine_code="F16D4",
            engine_type="ice",
            mileage_km=120000,
            platform="GM_Delta2",
            modifications=mods,
        )
        assert vp.vin == "XUUTA69E0JA012345"
        assert vp.generation == "J400"
        assert vp.engine_code == "F16D4"
        assert vp.engine_type == "ice"
        assert vp.mileage_km == 120000
        assert vp.platform == "GM_Delta2"
        assert vp.modifications == mods


class TestLTFTCorrections:
    """Test LTFT base offset and tolerance multiplier properties."""

    def test_no_modifications_offset_zero(self):
        vp = VehicleProfile(
            client_hash="a", brand="Toyota", model="Camry", year=2020
        )
        assert vp.ltft_base_offset == 0.0

    def test_no_modifications_tolerance_default(self):
        vp = VehicleProfile(
            client_hash="a", brand="Ford", model="Focus", year=2020
        )
        assert vp.ltft_tolerance_mult == 1.0

    def test_euro2_removed_cat_offset(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Lada",
            model="Vesta",
            year=2019,
            modifications={"euro2_removed_cat": True},
        )
        assert vp.ltft_base_offset == -7.5

    def test_euro2_removed_cat_false_offset_zero(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Lada",
            model="Vesta",
            year=2019,
            modifications={"euro2_removed_cat": False},
        )
        assert vp.ltft_base_offset == 0.0

    def test_lpg_tolerance(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Kia",
            model="Rio",
            year=2019,
            modifications={"fuel_type": "lpg"},
        )
        assert vp.ltft_tolerance_mult == 1.5

    def test_gm_platform_tolerance(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Chevrolet",
            model="Cruze",
            year=2018,
            platform="GM_Delta2",
        )
        assert vp.ltft_tolerance_mult == 1.3

    def test_japanese_brand_tolerance(self):
        for brand in [
            "Toyota", "Honda", "Mazda", "Subaru", "Nissan",
            "Mitsubishi", "Suzuki", "Lexus", "Infiniti", "Acura",
        ]:
            vp = VehicleProfile(
                client_hash="a", brand=brand, model="X", year=2020
            )
            assert vp.ltft_tolerance_mult == 0.7, f"Failed for {brand}"

    def test_japanese_brand_case_insensitive(self):
        vp = VehicleProfile(
            client_hash="a", brand="toyota", model="Camry", year=2020
        )
        assert vp.ltft_tolerance_mult == 0.7

    def test_lpg_overrides_japanese(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Toyota",
            model="Camry",
            year=2020,
            modifications={"fuel_type": "lpg"},
        )
        assert vp.ltft_tolerance_mult == 1.5

    def test_lpg_overrides_gm(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Chevrolet",
            model="Cruze",
            year=2018,
            platform="GM_Delta2",
            modifications={"fuel_type": "lpg"},
        )
        assert vp.ltft_tolerance_mult == 1.5


class TestKBResolutionPath:
    """Test kb_resolution_path property."""

    def test_with_generation(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Toyota",
            model="Camry",
            year=2020,
            generation="XV70",
        )
        expected = [
            "brand/Toyota/model/Camry/generation/XV70",
            "brand/Toyota/model/Camry",
            "brand/Toyota",
            "universal",
        ]
        assert vp.kb_resolution_path == expected

    def test_without_generation(self):
        vp = VehicleProfile(
            client_hash="a",
            brand="Toyota",
            model="Camry",
            year=2020,
        )
        expected = [
            "brand/Toyota/model/Camry",
            "brand/Toyota",
            "universal",
        ]
        assert vp.kb_resolution_path == expected


class TestSerialization:
    """Test to_db_row and from_db_row roundtrip."""

    def test_to_db_row_returns_dict(self):
        vp = VehicleProfile(
            client_hash="abc",
            brand="Toyota",
            model="Camry",
            year=2020,
        )
        row = vp.to_db_row()
        assert isinstance(row, dict)
        assert row["client_hash"] == "abc"
        assert row["brand"] == "Toyota"
        assert row["model"] == "Camry"
        assert row["year"] == 2020
        assert row["engine_type"] == "ice"
        assert row["mileage_km"] == 0
        assert row["modifications"] == {}

    def test_from_db_row_creates_profile(self):
        row = {
            "client_hash": "abc",
            "brand": "Toyota",
            "model": "Camry",
            "year": 2020,
            "vin": None,
            "generation": None,
            "engine_code": None,
            "engine_type": "ice",
            "mileage_km": 0,
            "platform": None,
            "modifications": {},
        }
        vp = VehicleProfile.from_db_row(row)
        assert vp.client_hash == "abc"
        assert vp.brand == "Toyota"
        assert vp.year == 2020

    def test_roundtrip(self):
        original = VehicleProfile(
            client_hash="xyz",
            brand="Chevrolet",
            model="Cruze",
            year=2018,
            vin="VIN123",
            generation="J400",
            engine_code="F16D4",
            engine_type="ice",
            mileage_km=120000,
            platform="GM_Delta2",
            modifications={"euro2_removed_cat": True},
        )
        row = original.to_db_row()
        restored = VehicleProfile.from_db_row(row)
        assert restored == original


class TestDraperKnockFreqFromBore:
    """S23 A.31: f_{1,0} = 1.841 · c / (π · B), c=1000 м/с, Draper 1938.

    Верификация против Brecq 2003 (SAE 2003-01-1915) и Di Gaeta 2018
    (Applied Energy): отклонение ≤±50 Hz допустимо.
    """

    def test_none_if_bore_unknown(self):
        vp = VehicleProfile(client_hash="h", brand="X", model="Y", year=2020)
        assert vp.knock_expected_freq_from_bore is None

    def test_bore_72mm_vw_1_4_tsi(self):
        vp = VehicleProfile(
            client_hash="h", brand="VW", model="Golf", year=2020, bore_mm=72
        )
        assert vp.knock_expected_freq_from_bore == pytest.approx(8139.0, abs=50)

    def test_bore_86mm_bmw_n20(self):
        vp = VehicleProfile(
            client_hash="h", brand="BMW", model="320i", year=2018, bore_mm=86
        )
        assert vp.knock_expected_freq_from_bore == pytest.approx(6814.0, abs=50)

    def test_bore_100mm_porsche_flat_six(self):
        vp = VehicleProfile(
            client_hash="h", brand="Porsche", model="991", year=2019, bore_mm=100
        )
        assert vp.knock_expected_freq_from_bore == pytest.approx(5860.0, abs=50)

    def test_bore_zero_or_negative_returns_none(self):
        vp = VehicleProfile(
            client_hash="h", brand="X", model="Y", year=2020, bore_mm=0
        )
        assert vp.knock_expected_freq_from_bore is None
