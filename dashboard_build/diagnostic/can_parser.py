"""CAN-шина парсер для EV PIDs (HV-батарея, инвертор, e-мотор).

Этот модуль — **scaffold для P3** (см. project_p3_backend_evpids_urgent.md).
Определяет контракт данных, которые будут приходить через LEEA 2.0 DoIP
с адаптеров, поддерживающих расширенный OBD2 + CAN.

Сейчас реализация-заглушка: все функции возвращают ``None``/пустой dict.
Frontend partDataResolver.ts уже умеет читать эти поля — когда парсер
оживёт, UI автоматически подхватит реальные значения.

## Контракт HV PIDs

Расширение стандартного dict ``pids`` (key → number) добавляет поля:

- ``hv_battery_voltage`` — напряжение высоковольтной батареи, В
- ``hv_battery_current`` — ток батареи (±, заряд/разряд), А
- ``hv_battery_soc`` — State-of-Charge, 0..100 %
- ``hv_battery_temp`` — средняя температура пакета, °C
- ``hv_cell_voltage_delta`` — max-min по ячейкам, В (норма <0.03)
- ``inverter_temp`` — температура силовой электроники, °C
- ``e_motor_temp`` — температура электродвигателя, °C
- ``regen_brake_power`` — рекуперация тормозов, кВт (отрицательные = рекуп)
- ``motor_power_kw`` — мгновенная мощность мотора, кВт
- ``motor_temp`` — алиас e_motor_temp для обратной совместимости

## Подключение (когда появится железо/протокол)

1. Имплементировать :func:`parse_can_frame` поверх реального DoIP клиента
   (см. ``reference_can_bus_li_auto.md`` для LEEA 2.0 PID mapping).
2. В ``pipeline.py`` вставить вызов :func:`enrich_pids_with_hv` в цикле
   сборки telemetry перед возвратом в API response.
3. Фронт уже готов: поля резолвятся через
   ``llcar-dashboard/src/utils/partDataResolver.ts``.

## Acceptance

После интеграции:
- Hover на «Батарея высоковольтная» в /v3/diagnostics показывает реальные
  Voltage/SOC/Cell delta (сейчас «нет данных»)
- Правила ``soc_critical``, ``hv_battery_imbalance``, ``battery_temp_high``,
  ``charging_anomaly``, ``inverter_overtemp``, ``e_motor_temp_high``
  срабатывают по реальным данным
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Iterable


# Имена ключей, которые frontend ожидает увидеть в pids dict.
HV_PIDS_KEYS = (
    'hv_battery_voltage',
    'hv_battery_current',
    'hv_battery_soc',
    'hv_battery_temp',
    'hv_cell_voltage_delta',
    'inverter_temp',
    'e_motor_temp',
    'motor_temp',
    'motor_power_kw',
    'regen_brake_power',
)


@dataclass(slots=True)
class HVSnapshot:
    """Типизированный снимок HV-данных за один такт CAN-опроса."""

    hv_battery_voltage: float | None = None
    hv_battery_current: float | None = None
    hv_battery_soc: float | None = None
    hv_battery_temp: float | None = None
    hv_cell_voltage_delta: float | None = None
    inverter_temp: float | None = None
    e_motor_temp: float | None = None
    motor_power_kw: float | None = None
    regen_brake_power: float | None = None

    def to_pids_dict(self) -> dict[str, float]:
        """Конвертирует snapshot в плоский dict, отфильтровав None.

        Возвращается ключами, совместимыми с текущим frontend
        ``partDataResolver.ts``. Дополнительно дублирует
        ``e_motor_temp`` как ``motor_temp`` для обратной совместимости.
        """
        raw = asdict(self)
        out: dict[str, float] = {k: v for k, v in raw.items() if isinstance(v, (int, float))}
        if 'e_motor_temp' in out and 'motor_temp' not in out:
            out['motor_temp'] = out['e_motor_temp']
        return out


def parse_can_frame(_frame: bytes) -> HVSnapshot | None:
    """Парсит одну CAN-frame из LEEA 2.0 потока в HVSnapshot.

    **STUB**: всегда возвращает ``None``. Реальная реализация будет
    разбирать 8-byte CAN payload, матчить PID → поле HVSnapshot,
    нормировать raw значения (voltage scaling, temperature offsets и т.д.)
    согласно docs Li Auto.

    См. ``reference_can_bus_li_auto.md`` для mapping таблицы.
    """
    return None


def merge_snapshots(snapshots: Iterable[HVSnapshot]) -> HVSnapshot:
    """Берёт последнее не-None значение каждого поля из серии snapshots.

    CAN присылает PIDs не синхронно — voltage может обновиться в одном
    frame, temperature в другом. Мержим в единый snapshot за такт.
    """
    merged = HVSnapshot()
    for snap in snapshots:
        for field in HV_PIDS_KEYS:
            if field not in ('motor_temp',):  # motor_temp — вычислимый алиас
                val = getattr(snap, field, None)
                if val is not None:
                    setattr(merged, field, val)
    return merged


def enrich_pids_with_hv(
    pids: dict[str, Any],
    can_frames: Iterable[bytes] | None = None,
) -> dict[str, Any]:
    """Обогащает plain pids dict полями из CAN (in-place safe копия).

    **STUB-режим**: если ``can_frames`` пуст или None — возвращает
    копию pids без изменений. Иначе парсит и мержит.

    Всегда возвращает НОВЫЙ dict — исходный никогда не мутируется.

    Использовать в ``pipeline.py`` после стандартного OBD-опроса:

    .. code-block:: python

        from .can_parser import enrich_pids_with_hv
        pids = {'rpm': 1200, 'speed': 60, ...}
        pids = enrich_pids_with_hv(pids, can_frames=collector.latest_can())
    """
    out = dict(pids)
    if not can_frames:
        return out
    snapshots = [snap for frame in can_frames if (snap := parse_can_frame(frame)) is not None]
    if not snapshots:
        return out
    merged = merge_snapshots(snapshots)
    out.update(merged.to_pids_dict())
    return out


__all__ = [
    'HV_PIDS_KEYS',
    'HVSnapshot',
    'enrich_pids_with_hv',
    'merge_snapshots',
    'parse_can_frame',
]
