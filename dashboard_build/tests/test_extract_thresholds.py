"""Tests for extract_thresholds from situations quickAnswer text."""

import pytest
import sys
import os

# Add parent to path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from diagnostic.scripts.extract_thresholds import extract_thresholds


class TestGreaterThan:
    """Test 'gt' threshold extraction (более, больше, выше, свыше)."""

    def test_bolee_percent(self):
        result = extract_thresholds("более 10%")
        assert len(result) >= 1
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 10.0
        assert gt[0]['unit'] == '%'

    def test_vyshe_celsius(self):
        result = extract_thresholds("выше 105°C")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 105.0
        assert gt[0]['unit'] == '°C'

    def test_svyshe_rpm(self):
        result = extract_thresholds("свыше 3000 об/мин")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 3000.0
        assert gt[0]['unit'] == 'об/мин'

    def test_bolshe_bar(self):
        result = extract_thresholds("больше 0,5 бар")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 0.5
        assert gt[0]['unit'] == 'бар'

    def test_symbol_gt(self):
        result = extract_thresholds("давление >1.5")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 1.5

    def test_symbol_gt_with_unit(self):
        result = extract_thresholds("температура >105°C")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 105.0
        assert gt[0]['unit'] == '°C'


class TestLessThan:
    """Test 'lt' threshold extraction (менее, меньше, ниже)."""

    def test_nizhe_celsius(self):
        result = extract_thresholds("ниже 80°C")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 80.0
        assert lt[0]['unit'] == '°C'

    def test_menee_bar(self):
        result = extract_thresholds("менее 1.5 бар")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 1.5
        assert lt[0]['unit'] == 'бар'

    def test_menshe_volts(self):
        result = extract_thresholds("меньше 11В")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 11.0
        assert lt[0]['unit'] == 'В'

    def test_nizhe_percent(self):
        result = extract_thresholds("ниже 0.8%")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 0.8
        assert lt[0]['unit'] == '%'

    def test_symbol_lt(self):
        result = extract_thresholds("значение <0.5")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 0.5

    def test_symbol_lt_with_unit(self):
        result = extract_thresholds("напряжение <13В")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 13.0
        assert lt[0]['unit'] == 'В'


class TestRange:
    """Test 'range' threshold extraction (от X до Y)."""

    def test_ot_do_volts(self):
        result = extract_thresholds("от 13 до 14.5 В")
        rng = [r for r in result if r['type'] == 'range']
        assert len(rng) >= 1
        assert rng[0]['min'] == 13.0
        assert rng[0]['max'] == 14.5
        assert rng[0]['unit'] == 'В'

    def test_ot_do_rpm(self):
        result = extract_thresholds("от 800 до 2000 об/мин")
        rng = [r for r in result if r['type'] == 'range']
        assert len(rng) >= 1
        assert rng[0]['min'] == 800.0
        assert rng[0]['max'] == 2000.0
        assert rng[0]['unit'] == 'об/мин'

    def test_ot_do_no_unit(self):
        result = extract_thresholds("от 1000 до 2500")
        rng = [r for r in result if r['type'] == 'range']
        assert len(rng) >= 1
        assert rng[0]['min'] == 1000.0
        assert rng[0]['max'] == 2500.0
        assert rng[0]['unit'] == ''

    def test_v_diapazone(self):
        result = extract_thresholds("в диапазоне 80-105°C")
        rng = [r for r in result if r['type'] == 'range']
        assert len(rng) >= 1
        assert rng[0]['min'] == 80.0
        assert rng[0]['max'] == 105.0
        assert rng[0]['unit'] == '°C'


class TestNormRange:
    """Test 'norm_range' threshold extraction (норма X-Y)."""

    def test_norma_celsius(self):
        result = extract_thresholds("норма 80-95°C")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 80.0
        assert nrm[0]['max'] == 95.0
        assert nrm[0]['unit'] == '°C'

    def test_norma_bar(self):
        result = extract_thresholds("норма 3-4 бар")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 3.0
        assert nrm[0]['max'] == 4.0
        assert nrm[0]['unit'] == 'бар'

    def test_norma_colon_bar(self):
        result = extract_thresholds("норма: 2.0-4.5 бар")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 2.0
        assert nrm[0]['max'] == 4.5
        assert nrm[0]['unit'] == 'бар'

    def test_norma_endash_volts(self):
        result = extract_thresholds("норма 13.5–14.5 В")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 13.5
        assert nrm[0]['max'] == 14.5
        assert nrm[0]['unit'] == 'В'

    def test_norma_comma_decimals(self):
        result = extract_thresholds("норма 1,2–1,8 бар")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 1.2
        assert nrm[0]['max'] == 1.8

    def test_norma_no_unit(self):
        result = extract_thresholds("норма 25–35")
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert len(nrm) >= 1
        assert nrm[0]['min'] == 25.0
        assert nrm[0]['max'] == 35.0
        assert nrm[0]['unit'] == ''


class TestEdgeCases:
    """Test edge cases and special scenarios."""

    def test_no_thresholds(self):
        result = extract_thresholds("Просто текст без цифр и порогов.")
        assert result == []

    def test_empty_string(self):
        result = extract_thresholds("")
        assert result == []

    def test_numbers_without_threshold_context(self):
        # Just a number without comparison words should not match gt/lt patterns
        result = extract_thresholds("Замена через 60000 км")
        # Should not produce gt/lt matches (no "более"/"ниже" etc.)
        gt_lt = [r for r in result if r['type'] in ('gt', 'lt')]
        assert len(gt_lt) == 0

    def test_multiple_thresholds_in_one_text(self):
        text = "более 10%, ниже 80°C, норма 3-4 бар"
        result = extract_thresholds(text)
        types_found = {r['type'] for r in result}
        assert 'gt' in types_found
        assert 'lt' in types_found
        assert 'norm_range' in types_found
        assert len(result) >= 3

    def test_cyrillic_celsius(self):
        """Test with Cyrillic С instead of Latin C in °С."""
        result = extract_thresholds("выше 105°С")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 105.0

    def test_raw_field_present(self):
        result = extract_thresholds("более 10%")
        assert len(result) >= 1
        assert 'raw' in result[0]
        assert 'более 10%' in result[0]['raw']

    def test_case_insensitive(self):
        result = extract_thresholds("Более 10%")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['value'] == 10.0

    def test_kpa_unit(self):
        result = extract_thresholds("более 100 кПа")
        gt = [r for r in result if r['type'] == 'gt']
        assert len(gt) >= 1
        assert gt[0]['unit'] == 'кПа'

    def test_atm_unit(self):
        result = extract_thresholds("менее 2.0 атм")
        lt = [r for r in result if r['type'] == 'lt']
        assert len(lt) >= 1
        assert lt[0]['value'] == 2.0
        assert lt[0]['unit'] == 'атм'

    def test_real_world_text(self):
        """Test with a realistic quickAnswer fragment."""
        text = (
            "Долгосрочная коррекция (LTFT) выше 10% указывает на бедную смесь. "
            "Норма: 2.0-4.5 бар давления топлива. "
            "При температуре ниже 80°C двигатель работает на обогащённой смеси."
        )
        result = extract_thresholds(text)
        assert len(result) >= 3
        # Check gt
        gt = [r for r in result if r['type'] == 'gt']
        assert any(r['value'] == 10.0 and r['unit'] == '%' for r in gt)
        # Check norm_range
        nrm = [r for r in result if r['type'] == 'norm_range']
        assert any(r['min'] == 2.0 and r['max'] == 4.5 for r in nrm)
        # Check lt
        lt = [r for r in result if r['type'] == 'lt']
        assert any(r['value'] == 80.0 and r['unit'] == '°C' for r in lt)
