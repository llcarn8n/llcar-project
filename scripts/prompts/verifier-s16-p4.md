# Verifier Prompt — Session 16 P4

Тебе нужно fact-check ситуации для ОДНОГО автомобиля и **записать findings в JSON-файл на диск**.

## Цель
Проверить `situations.json` для `{BRAND} {MODEL} {GENERATION}` на достоверность технических данных:
- **Engine code** (правильный ли код двигателя для поколения)
- **Platform** (правильная ли платформа)
- **Battery chem/capacity** (EV: правильная химия/ёмкость аккумулятора)
- **DTC validity** (валидные ли OBD-II коды, применимые к этому поколению)
- **OEM parts** (правильные ли артикулы, если упомянуты)

## Входные данные
- Файл: `{FILE_PATH}`
- Генерация: `{BRAND} {MODEL} {GENERATION}` (годы выпуска, платформа)

## Обязательный финальный шаг (КРИТИЧНО — R1)

**После ВСЕХ проверок ОБЯЗАТЕЛЬНО запиши findings в файл:**

```
.omc/state/s16-p4-verifier/{BRAND_ID}_{MODEL_ID}.json
```

где `{BRAND_ID}_{MODEL_ID}` — snake_case имена из пути к situations.json (например `hiphi_x`, `nio_et7`).

## Формат findings

```json
[
  {
    "sit_id": "hiphi_x_001",
    "field": "dtc_codes",
    "current": ["P0A80"],
    "corrected": ["P0A7F"],
    "confidence": "high|medium|low",
    "source": "HiPhi service manual / OBD-II standard / Wikipedia / reasoning",
    "reason": "P0A80 relates to battery capacity deterioration; for this gen actual code is P0A7F (hybrid/EV battery system performance)"
  }
]
```

Правила:
- `confidence: high` — источник первичный (service manual, OEM spec, OBD-II standard).
- `confidence: medium` — reasoning + cross-check из 2+ публичных источников.
- `confidence: low` — догадка. **НЕ применяется автоматически**, только логируется.
- Если всё корректно — записать пустой массив `[]`.

## Что НЕ делать
- Не редактировать `situations.json` напрямую.
- Не галлюцинировать номера запчастей / batch numbers.
- Не добавлять коды, которых нет в OBD-II стандарте без указания manufacturer source.

## Рабочий процесс
1. Прочитай `{FILE_PATH}` (используй Read tool).
2. Для каждой ситуации — проверь поля.
3. Соберай findings в массив.
4. **ОБЯЗАТЕЛЬНО: Write tool → `.omc/state/s16-p4-verifier/{BRAND_ID}_{MODEL_ID}.json`** с JSON-массивом.
5. В финальном ответе укажи количество findings + путь к записанному файлу.

## Пример запуска
- `{BRAND}=HiPhi`, `{MODEL}=X`, `{GENERATION}=2021`
- `{FILE_PATH}=llcar-dashboard/public/data/kb/hiphi/x/x_2021/situations.json`
- `{BRAND_ID}_{MODEL_ID}=hiphi_x`
- Output file: `.omc/state/s16-p4-verifier/hiphi_x.json`
