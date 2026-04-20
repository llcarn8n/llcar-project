"""Entry-point для обогащения pids-dict данными из CAN-шины.

Этот модуль — **единственное место, которое меняет инженер при подключении
реального DoIP-клиента**. Всё остальное (contract, типы, frontend) уже готово.

## Где вызывать

Legacy endpoint ``/api/data/`` формирует dict ``pids`` из OBD-данных.
Он живёт в Django-проекте ``llcar/`` (НЕ в этом ``dashboard_build/``),
поэтому мы не можем вставить hook напрямую. Инженер должен:

1. Найти views.py, где формируется response для ``/api/data/``.
2. Перед возвратом JsonResponse вызвать:

   .. code-block:: python

       from diagnostic.pids_enricher import enrich_api_data_pids
       pids = enrich_api_data_pids(pids, client_hash=client_hash)

3. Готово. Frontend автоматически подхватит новые поля через
   ``partDataResolver.ts`` — типы уже описаны в ``useLatestTelemetry.ts``.

## Как активировать реальные данные

Когда DoIP-клиент подключён (python-doipclient или аналог) — заменить
тело :func:`_fetch_can_frames`. Stub возвращает ``None``, поэтому
вызов :func:`enrich_api_data_pids` — no-op до активации.
"""
from __future__ import annotations

from typing import Any, Iterable, Optional

from .can_parser import enrich_pids_with_hv


def _fetch_can_frames(_client_hash: Optional[str]) -> Optional[Iterable[bytes]]:
    """Fetch raw CAN frames для данного клиента.

    **STUB**: возвращает ``None``. Реальная реализация подключает DoIP-клиент
    к адаптеру пользователя и забирает последний пакет CAN-frames, собранных
    сборщиком (обычно — кольцевой буфер по VIN / client_hash).

    Подсказки реализации:
    - Использовать ``python-doipclient`` или ``isotp`` для UDS over DoIP.
    - Держать ``per-client connection pool`` чтобы не переподключаться
      на каждый вызов /api/data/ (у нас рефреш раз в 30 секунд).
    - Timeout 500 мс — если CAN не отвечает, возвращаем None,
      и `enrich_api_data_pids` делает no-op (не ломает существующий поток).
    """
    return None


def enrich_api_data_pids(pids: dict[str, Any], client_hash: Optional[str] = None) -> dict[str, Any]:
    """Обогатить стандартный OBD ``pids`` полями из CAN-шины.

    Возвращает **новый** dict (pids не мутируется). При отсутствии CAN данных
    или ошибке чтения — возвращает исходный pids без изменений.

    После активации :func:`_fetch_can_frames`:
    - dict получит поля ``hv_battery_voltage``, ``hv_battery_current``,
      ``hv_battery_soc``, ``hv_battery_temp``, ``hv_cell_voltage_delta``,
      ``inverter_temp``, ``e_motor_temp``, ``motor_temp``, ``motor_power_kw``,
      ``regen_brake_power``.
    - Типы frontend (`PidsPayload`) уже содержат эти поля как optional.
    """
    try:
        frames = _fetch_can_frames(client_hash)
    except Exception:
        # CAN/DoIP не должен ронять /api/data/ — при любой ошибке fallback.
        return dict(pids)
    return enrich_pids_with_hv(pids, can_frames=frames)


__all__ = ['enrich_api_data_pids']
