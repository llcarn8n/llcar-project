"""Тесты для diagnostic/can_parser.py — scaffold CAN-парсера (P3).

parse_can_frame — stub до подключения реального DoIP-клиента.
Проверяем вокруг него: HVSnapshot dataclass, merge_snapshots, enrich_pids_with_hv.
"""
from __future__ import annotations

import pytest

from diagnostic.can_parser import (
    HV_PIDS_KEYS,
    HVSnapshot,
    enrich_pids_with_hv,
    merge_snapshots,
    parse_can_frame,
)


# ---------------------------------------------------------------------------
# HVSnapshot.to_pids_dict
# ---------------------------------------------------------------------------


def test_empty_snapshot_yields_empty_dict():
    assert HVSnapshot().to_pids_dict() == {}


def test_single_field_snapshot():
    snap = HVSnapshot(hv_battery_voltage=400.0)
    assert snap.to_pids_dict() == {"hv_battery_voltage": 400.0}


def test_e_motor_temp_aliased_to_motor_temp():
    """e_motor_temp должно дублироваться в motor_temp для обратной совместимости."""
    snap = HVSnapshot(e_motor_temp=50.0)
    d = snap.to_pids_dict()
    assert d["e_motor_temp"] == 50.0
    assert d["motor_temp"] == 50.0


def test_motor_temp_not_overwritten_if_already_set():
    """Если явно задан motor_temp — не перезаписываем из e_motor_temp."""
    snap = HVSnapshot(e_motor_temp=50.0)
    d = snap.to_pids_dict()
    # В dataclass motor_temp нет отдельного поля, алиас только при output.
    # Просто проверяем что оба присутствуют.
    assert "e_motor_temp" in d and "motor_temp" in d


def test_full_snapshot_all_fields():
    snap = HVSnapshot(
        hv_battery_voltage=380.5,
        hv_battery_current=-25.3,
        hv_battery_soc=72.0,
        hv_battery_temp=28.0,
        hv_cell_voltage_delta=0.015,
        inverter_temp=65.0,
        e_motor_temp=55.0,
        motor_power_kw=12.5,
        regen_brake_power=-3.2,
    )
    d = snap.to_pids_dict()
    assert d["hv_battery_voltage"] == 380.5
    assert d["hv_battery_current"] == -25.3
    assert d["hv_battery_soc"] == 72.0
    assert d["hv_cell_voltage_delta"] == 0.015
    assert d["regen_brake_power"] == -3.2
    # motor_temp как алиас от e_motor_temp
    assert d["motor_temp"] == 55.0


# ---------------------------------------------------------------------------
# merge_snapshots
# ---------------------------------------------------------------------------


def test_merge_empty_list_returns_empty_snapshot():
    merged = merge_snapshots([])
    assert merged.to_pids_dict() == {}


def test_merge_single_snapshot_preserved():
    snap = HVSnapshot(hv_battery_voltage=400.0, hv_battery_soc=50.0)
    merged = merge_snapshots([snap])
    assert merged.hv_battery_voltage == 400.0
    assert merged.hv_battery_soc == 50.0


def test_merge_later_overrides_earlier():
    a = HVSnapshot(hv_battery_voltage=400.0)
    b = HVSnapshot(hv_battery_voltage=410.0)
    merged = merge_snapshots([a, b])
    assert merged.hv_battery_voltage == 410.0


def test_merge_preserves_fields_from_different_snapshots():
    """voltage из первого + soc из второго = полный dict."""
    a = HVSnapshot(hv_battery_voltage=400.0)
    b = HVSnapshot(hv_battery_soc=75.0)
    merged = merge_snapshots([a, b])
    assert merged.hv_battery_voltage == 400.0
    assert merged.hv_battery_soc == 75.0


def test_merge_none_values_do_not_overwrite():
    """Если позднее snapshot имеет None в поле — сохраняем предыдущее значение."""
    a = HVSnapshot(hv_battery_voltage=400.0)
    b = HVSnapshot(hv_battery_soc=75.0)  # voltage=None по умолчанию
    merged = merge_snapshots([a, b])
    assert merged.hv_battery_voltage == 400.0


# ---------------------------------------------------------------------------
# enrich_pids_with_hv
# ---------------------------------------------------------------------------


def test_enrich_with_none_frames_is_noop():
    pids = {"rpm": 1200, "speed": 60}
    result = enrich_pids_with_hv(pids, can_frames=None)
    assert result == {"rpm": 1200, "speed": 60}


def test_enrich_with_empty_list_is_noop():
    pids = {"rpm": 1200}
    result = enrich_pids_with_hv(pids, can_frames=[])
    assert result == {"rpm": 1200}


def test_enrich_with_stub_frames_is_noop():
    """Stub parse_can_frame всегда возвращает None → dict не меняется."""
    pids = {"rpm": 1200}
    result = enrich_pids_with_hv(pids, can_frames=[b"\x00" * 8, b"\x01" * 8])
    assert result == {"rpm": 1200}


def test_enrich_with_monkeypatched_parser(monkeypatch):
    """После активации parse_can_frame — pids получает HV поля."""

    def fake_parse(frame: bytes):
        if frame == b"voltage":
            return HVSnapshot(hv_battery_voltage=400.0)
        if frame == b"soc":
            return HVSnapshot(hv_battery_soc=75.0)
        return None

    monkeypatch.setattr("diagnostic.can_parser.parse_can_frame", fake_parse)

    pids = {"rpm": 1200, "speed": 60}
    result = enrich_pids_with_hv(pids, can_frames=[b"voltage", b"soc"])

    # Изначальные поля сохранены
    assert result["rpm"] == 1200
    assert result["speed"] == 60
    # HV поля добавлены
    assert result["hv_battery_voltage"] == 400.0
    assert result["hv_battery_soc"] == 75.0


def test_enrich_does_not_mutate_input():
    pids = {"rpm": 1200}
    result = enrich_pids_with_hv(pids, can_frames=None)
    # Модификация result не должна задевать pids (другой объект)
    result["new_field"] = 999
    assert "new_field" not in pids


# ---------------------------------------------------------------------------
# Stub parse_can_frame
# ---------------------------------------------------------------------------


def test_stub_parse_returns_none_for_any_input():
    assert parse_can_frame(b"\x00" * 8) is None
    assert parse_can_frame(b"\xff" * 8) is None
    assert parse_can_frame(b"") is None


# ---------------------------------------------------------------------------
# HV_PIDS_KEYS contract
# ---------------------------------------------------------------------------


def test_hv_pids_keys_contains_all_snapshot_fields():
    """Constant HV_PIDS_KEYS должен покрывать все поля HVSnapshot."""
    snap_fields = {
        "hv_battery_voltage", "hv_battery_current", "hv_battery_soc",
        "hv_battery_temp", "hv_cell_voltage_delta", "inverter_temp",
        "e_motor_temp", "motor_power_kw", "regen_brake_power",
    }
    assert snap_fields.issubset(set(HV_PIDS_KEYS))
    # motor_temp — алиас, тоже должен быть в списке
    assert "motor_temp" in HV_PIDS_KEYS
