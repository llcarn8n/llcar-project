# P3 — интеграция CAN / LEEA 2.0 для EV-диагностики

**Цель:** подключить данные с высоковольтной шины Li Auto (HV-батарея, инвертор,
электромоторы, рекуперация) в существующий поток `/api/data/` так, чтобы 22+
правил EV-диагностики начали срабатывать на реальных данных, и чтобы hover на
компонентах 3D-твина показывал Voltage / SOC / Cell delta / HV temp вместо
«нет данных».

## 1. Зачем это нужно

LLCAR позиционируется как продвинутая EV-диагностика — без HV/инвертора/e-мотора
мы ничем не отличаемся от OBD2-сканеров (CarScanner, Torque). Сейчас в production
работает только общий `health_score` для EV-систем; конкретные правила (`soc_critical`,
`hv_battery_imbalance`, `battery_temp_high`, `charging_anomaly`, `inverter_overtemp`,
`e_motor_temp_high`, `motor_overheat` и др.) всегда «не сработало» потому что
параметры приходят `null`.

Связанные документы в памяти:
- `project_p3_backend_evpids_urgent.md` — бизнес-обоснование и acceptance
- `reference_can_bus_li_auto.md` — LEEA 2.0 протокол
- `reference_diagnostic_tables.md` — какие PID → какие правила

## 2. Архитектура

```
┌─────────────┐   DoIP   ┌──────────────────┐   frames[]
│ OBD Adapter │─────────▶│ _fetch_can_frames│─────────┐
│ (DoIP-capable)│         │ (TODO: реализация│         ▼
└─────────────┘         │  в pids_enricher)│   ┌──────────────────┐
                        └──────────────────┘   │ parse_can_frame  │
                                              │ (TODO: реализация │
                                              │  в can_parser)    │
                                              └────────┬─────────┘
                                                       │ HVSnapshot
                                                       ▼
                                              ┌──────────────────┐
                                              │  merge_snapshots │ ──┐
                                              └──────────────────┘   │
                                                                     ▼
┌──────────────┐   pids dict   ┌─────────────────────────┐   enriched pids
│ /api/data/   │──────────────▶│ enrich_api_data_pids    │────────────────┐
│ Django view  │               │ (pids_enricher.py)      │                │
└──────────────┘               └─────────────────────────┘                │
                                                                          ▼
                                                            ┌─────────────────────┐
                                                            │  JsonResponse json  │
                                                            └─────────┬───────────┘
                                                                      │
                                            frontend ────────────────▼
                                            ┌──────────────────────┐
                                            │ useLatestTelemetry   │
                                            │ (PidsPayload typed)  │
                                            └──────────┬───────────┘
                                                       ▼
                                            ┌──────────────────────┐
                                            │ partDataResolver     │ → hover tooltip
                                            │ (motor_temp,         │   на батарее/инверторе/моторе
                                            │  hv_battery_*)       │
                                            └──────────────────────┘
```

## 3. Что уже готово (Wave 3 + 4)

| Компонент | Файл | Статус |
|---|---|---|
| Backend HVSnapshot dataclass | `dashboard_build/diagnostic/can_parser.py` | ✅ готов, 9 полей |
| Backend merge/enrich helpers | `dashboard_build/diagnostic/can_parser.py` | ✅ готовы |
| Backend entry-point | `dashboard_build/diagnostic/pids_enricher.py` | ✅ готов, stub `_fetch_can_frames` |
| Python unit-тесты | `dashboard_build/tests/test_can_parser.py` | ✅ 17 тестов, все green |
| LEEA 2.0 mapping JSON | `scripts/leea2_pid_map.json` | ⚠️ **заготовка**, 4/9 полей с `"TBD"` |
| Frontend типы `PidsPayload` | `llcar-dashboard/src/hooks/useLatestTelemetry.ts` | ✅ готов |
| Frontend резолвер EV-полей | `llcar-dashboard/src/utils/partDataResolver.ts` | ✅ готов, без `as any` |
| Frontend catalog HV-компонентов | `llcar-dashboard/src/data/partCatalog.ts` | ✅ Батарея/Инвертор/e-Motor имеют params |
| `parse_can_frame()` implementation | `dashboard_build/diagnostic/can_parser.py` | ❌ **STUB, TO DO** |
| DoIP-клиент | `dashboard_build/diagnostic/pids_enricher.py:_fetch_can_frames` | ❌ **STUB, TO DO** |
| Django view hook в `/api/data/` | (не в этом репо) | ❌ **TO DO в prod Django** |

## 4. Что инженер должен сделать

### Шаг 1: подключить DoIP-клиент

Установить библиотеку (рекомендуется `python-doipclient`):
```bash
pip install python-doipclient
```

Заменить тело `_fetch_can_frames` в `dashboard_build/diagnostic/pids_enricher.py`:
```python
from doipclient import DoIPClient

_client_pool = {}  # per-VIN connection pool

def _fetch_can_frames(client_hash: Optional[str]) -> Optional[Iterable[bytes]]:
    if not client_hash:
        return None
    client = _client_pool.get(client_hash) or _connect(client_hash)
    try:
        return client.request_can_frames(timeout_ms=500)
    except Exception:
        return None
```

### Шаг 2: реализовать `parse_can_frame`

В `dashboard_build/diagnostic/can_parser.py` заменить stub `parse_can_frame`
на реальный парсинг с lookup-таблицей из `scripts/leea2_pid_map.json`:

```python
import json
from pathlib import Path

_MAP_CACHE = None

def _load_map():
    global _MAP_CACHE
    if _MAP_CACHE is None:
        _MAP_CACHE = json.loads(
            Path(__file__).parents[2] / 'scripts' / 'leea2_pid_map.json'
        ).read_text(encoding='utf-8')
    return _MAP_CACHE

def parse_can_frame(frame: bytes) -> HVSnapshot | None:
    can_id, payload = _split_can_id(frame)
    spec = _MAP_CACHE['frames_by_id'].get(can_id)
    if not spec: return None
    raw = _extract_bytes(payload, spec['bytes'])
    value = raw * spec['scale'] + (spec.get('offset') or 0)
    return HVSnapshot(**{spec['field']: value})
```

### Шаг 3: заполнить `"TBD"` в mapping JSON

По порядку приоритета (что шлёт Li7 на CAN):
1. `hv_cell_voltage_delta` — критично для правила `hv_battery_imbalance`
2. `inverter_temp` — для `inverter_overtemp`
3. `e_motor_temp` — для `e_motor_temp_high`, `motor_overheat`
4. `motor_power_kw`, `regen_brake_power` — для `charging_anomaly`, regen метрик

Источники:
- Реверс на реальной Li7 через CAN-сниффер (рекомендуется SavvyCAN)
- Vendor docs (если получишь доступ к LEEA 2.0 DBC)
- Community-карты Li Auto из forums

После заполнения в JSON ставить `"verified": true`.

### Шаг 4: подключить hook в Django view `/api/data/`

Найти handler `/api/data/` в production Django (не в этом репо, обычно
`/var/www/html/django/llcar/views.py` или аналог).

Перед JsonResponse добавить:
```python
from dashboard_build.diagnostic.pids_enricher import enrich_api_data_pids
...
pids = enrich_api_data_pids(pids, client_hash=client_hash)
return JsonResponse({"accel": accel, "audio": audio, "pids": pids})
```

## 5. Acceptance criteria

После интеграции:

1. **Hover на «Батарея высоковольтная» в `/v3/diagnostics`** показывает реальные:
   - HV Voltage (В)
   - SOC (%)
   - Cell delta (В)
   Сейчас все три — «нет данных».

2. **Hover на «Инвертор»** → «Confidence» может остаться пустым (требует rule-level confidence),
   но `Voltage 12V` и `Temperature` (новое поле, можно добавить) — реальные.

3. **Hover на «Электромотор передний/задний»** → Temp + Power kW реальные.

4. **Правила срабатывают на реальных данных:**
   - `soc_critical` → срабатывает при SOC < 15%
   - `hv_battery_imbalance` → при cell_delta > 0.1 В
   - `battery_temp_high` → при hv_battery_temp > 50°C
   - `inverter_overtemp` → при inverter_temp > 90°C
   - `e_motor_temp_high` → при e_motor_temp > 120°C

5. **Unit-тесты после реализации `parse_can_frame` остаются зелёными:**
   ```bash
   cd dashboard_build && python -m pytest tests/test_can_parser.py -v
   ```

6. **Curl-smoke реального response:**
   ```bash
   curl -sk 'https://llcar.ru/api/data/?client_hash=<real-li7>&minutes=10' | jq '.pids[-1]'
   ```
   Должны быть поля `hv_battery_voltage`, `hv_battery_soc`, `hv_battery_temp`, и т.д.

## 6. Tips

- **Кэшировать connection pool** — не переподключаться на каждый вызов `/api/data/`
  (у нас 30-секундный refresh).
- **Timeout 500 мс** — если CAN не отвечает, возвращать `None`, пусть endpoint
  работает без HV-полей (они optional).
- **Обратная совместимость** — `enrich_pids_with_hv` не ломает существующий
  поток: если frames None/empty — dict pids не меняется.
- **Testing на dev** — можно `monkeypatch.setattr` `parse_can_frame` на fake
  функцию которая возвращает synthetic `HVSnapshot` — фронт увидит данные.

## 7. Связанные файлы

- `dashboard_build/diagnostic/can_parser.py` — dataclass + helpers
- `dashboard_build/diagnostic/pids_enricher.py` — entry point
- `dashboard_build/tests/test_can_parser.py` — тесты
- `scripts/leea2_pid_map.json` — mapping заготовка
- `llcar-dashboard/src/hooks/useLatestTelemetry.ts` — frontend типы
- `llcar-dashboard/src/utils/partDataResolver.ts` — frontend резолвер
- `llcar-dashboard/src/data/partCatalog.ts` — привязка к 3D-мешам

---

_Документ создан в Wave 4 сессии S25 (2026-04-20). После реализации `parse_can_frame`
обновить раздел 3 на `✅ готов` и заархивировать этот TODO._
