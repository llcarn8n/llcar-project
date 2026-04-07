# 18. Анализ иерархии DTC-кодов и стратегия маппинга DTC -> Ситуации

**Дата:** 2026-04-07  
**Автор:** Claude (diagnostic engine analysis)

---

## 1. Сравнение двух dtc-index.json

| Параметр | `common files all models/dtc-index.json` | `export/dtc-index.json` |
|---|---|---|
| Всего кодов | 36 102 | 36 102 |
| Top-level ключи | `meta`, `codes` | `meta`, `codes` |
| Meta | `{total: 36102, brand_top_codes: {}}` | Идентично |
| Поля кодов | `severity`, `title_ru`, `title_en`, `system_id`, `can_drive`, `source` | Идентично |
| **Различия** | **Нет** | **Файлы полностью идентичны** |

**Вывод:** Это одна и та же база. `export/dtc-index.json` -- копия. Достаточно одного источника.

---

## 2. Структура полей на каждом уровне иерархии

### 2.1. Универсальный уровень (36 102 кода)

| Поле | Описание | Покрытие |
|---|---|---|
| `severity` | Уровень серьезности | 100% |
| `title_ru` | Название на русском | 35 911 (99.5%) |
| `title_en` | Название на английском | 191 (0.5%) -- только для кодов без русского |
| `system_id` | Система автомобиля | 100% |
| `can_drive` | Можно ли ехать | 100% |
| `source` | Источник данных | 191 из `dsoprea/DtcLookup`, остальные 35 911 без метки |

### 2.2. Бренд-уровень (58 брендов, ~31 000 записей суммарно)

Дополнительные поля поверх универсального:

| Поле | Описание | Пример |
|---|---|---|
| `note_ru` | Развернутое описание для бренда | "Код B0091 на Chery Tiggo 7/8 Pro часто указывает на..." |
| `note_en` | Описание на английском | Для некоторых кодов |
| `common_fix_ru` | Типичное решение для бренда | "Переподключение разъема, стоимость 3-5 тыс. руб." |
| `frequency` | Частота встречаемости | `rare`, `occasional`, `common` |
| `severity_override` | Переопределение severity | Может отличаться от универсального |
| `fix_strategy` | Стратегия генерации фикса | `llm_technical`, `llm_diagnostic`, `llm_owner` и др. (BMW) |
| `fix_round` | Раунд обогащения | Числовой ID batch-а |
| `powertrain_filter` | Фильтр по типу силовой установки | `['ice']`, `['ev']` и др. (BMW) |
| `models` | Список применимых моделей | `['corolla', 'camry', 'rav4']` (Toyota) |
| `lang` | Язык контента | `en` для BMW (5480 из 5773) |

### 2.3. Модель-уровень

**Поля идентичны бренд-уровню.** Для Chery Tiggo 8 Pro: 216 кодов, 100% совпадение с brand-level.

### 2.4. Поколение-уровень (generation)

- 66 generation-level файлов dtc-model.json
- Бренды с поколениями: BMW, Daewoo, Ford, Honda, Hyundai, Kia, Mercedes-Benz, Mitsubishi, Renault, Subaru, Toyota
- **КРИТИЧЕСКИЙ ВЫВОД:** На текущий момент generation-level DTC **полностью идентичны** model-level и brand-level. Проверено на BMW X5 (e53/e70/f15 -- все 5773 кода, 0 различий) и Toyota Land Cruiser (200/70 vs model -- 0 различий).
- Поколения подготовлены как инфраструктура, но **уникальный контент на уровне поколений ещё не создан**.

---

## 3. Топ бренды по количеству обогащенных DTC

| Бренд | Кодов | Особенности |
|---|---|---|
| Audi | 6 216 | |
| Volkswagen | 6 155 | |
| BMW | 5 773 | powertrain_filter, fix_strategy, fix_round, lang |
| Porsche | 2 221 | |
| Lexus | 716 | |
| Jaguar | 685 | |
| Toyota | 675 | models field |
| Skoda | 481 | |
| Jeep | 375 | |
| Ford | 295 | |
| Chery | 216 | |

---

## 4. Распределение по типам (P/B/C/U)

| Префикс | Значение | Количество | % |
|---|---|---|---|
| **C** | Chassis (шасси) | 10 890 | 30.2% |
| **B** | Body (кузов) | 10 822 | 30.0% |
| **U** | Network (коммуникации) | 10 785 | 29.9% |
| **P** | Powertrain (силовая) | 3 605 | 10.0% |

**Замечание:** P-коды -- всего 10%, но это самые частые коды на практике (OBD-II стандарт). B/C/U коды в основном manufacturer-specific и покрываются через EV, body, brakes, sensors system_id.

### P-коды по system_id

| system_id | Количество |
|---|---|
| engine | 2 003 |
| ev | 1 007 |
| drivetrain | 513 |
| cooling | 12 |
| ignition | 9 |
| power-electronics | 9 |
| intake | 8 |
| fuel | 8 |
| emission | 8 |
| climate | 6 |
| и другие | < 5 каждый |

---

## 5. Распределение по severity

| Severity | Количество | % | Описание |
|---|---|---|---|
| warning | 23 112 | 64.0% | Предупреждение, нужна диагностика |
| info | 12 492 | 34.6% | Информационный, незначительно |
| critical | 227 | 0.63% | Критический, остановиться немедленно |
| urgent | 105 | 0.29% | Срочный, опасен при продолжении |
| medium | 99 | 0.27% | Средний |
| low | 62 | 0.17% | Низкий приоритет |
| high | 5 | 0.01% | Высокий |

## 6. Распределение по can_drive

| can_drive | Количество | % | Значение |
|---|---|---|---|
| yes_caution | 23 296 | 64.5% | Можно ехать, осторожно |
| yes_safe | 12 370 | 34.3% | Можно ехать спокойно |
| no_stop | 204 | 0.57% | Остановиться немедленно |
| check | 191 | 0.53% | Проверить перед поездкой |
| no_danger | 41 | 0.11% | Нельзя ехать, опасно |

---

## 7. Анализ 17+ YouTube DTC кодов

### Наличие в универсальной базе

| Код | severity | system_id | can_drive | Название | В базе? |
|---|---|---|---|---|---|
| P0171 | info | engine | yes_caution | Бедная смесь (банк 1) | Да |
| P0172 | info | engine | yes_caution | Богатая смесь (банк 1) | Да |
| P0130 | warning | emission | yes_caution | Цепь кислородного датчика (банк 1, сенсор 1) | Да |
| P0134 | warning | engine | yes_caution | Кислородный датчик (банк 1) | Да |
| **P013A** | **---** | **---** | **---** | **O2 Sensor Slow Response Rich-to-Lean B1S2** | **НЕТ в универсальной!** |
| P0300 | urgent | ignition | yes_caution | Случайные пропуски зажигания | Да |
| P0301 | urgent | ignition | yes_caution | Пропуски зажигания в цилиндре 1 | Да |
| P0302 | urgent | ignition | yes_caution | Пропуски зажигания в цилиндре 2 | Да |
| P0303 | urgent | ignition | yes_caution | Пропуски зажигания в цилиндре 3 | Да |
| P0304 | urgent | ignition | yes_caution | Пропуски зажигания в цилиндре 4 | Да |
| P0101 | warning | intake | yes_caution | Диапазон/производительность MAF | Да |
| P0441 | info | engine | yes_safe | Система испарительных выбросов (EVAP) | Да |
| P0455 | info | engine | yes_safe | Значительная утечка EVAP | Да |
| P0016 | urgent | engine | no_danger | Корреляция распредвал/коленвал (банк 1) | Да |
| P0011 | urgent | engine | no_danger | Положение VVT распредвала (банк 1) | Да |
| P0422 | warning | engine | yes_caution | Эффективность катализатора | Да |
| P2096 | warning | engine | yes_caution | Бедная топливная коррекция | Да |
| P0138 | warning | emission | yes_caution | Лямбда-зонд (высокое напряжение) | Да |
| P0036 | urgent | engine | yes_caution | Цепь нагревателя кислородного датчика (банк 1) | Да |
| P2192 | warning | engine | yes_caution | Чрезмерно богатая смесь | Да |
| P2187 | warning | engine | yes_caution | Чрезмерно бедная смесь | Да |

### P013A -- ПРОБЕЛ В БАЗЕ

P013A ("O2 Sensor Slow Response - Rich to Lean Bank 1 Sensor 2") отсутствует в универсальном dtc-index.json, но найден в brand-level для Audi, BMW и Volkswagen. Нужно добавить в универсальную базу.

### Покрытие YouTube DTC в ситуациях

| Код | Ситуаций (brand/model) | Покрытие |
|---|---|---|
| P0171 | 520 | Отличное |
| P0172 | 438 | Отличное |
| P0300 | 281 | Хорошее |
| P0130 | 201 | Хорошее |
| P0301 | 110 | Хорошее |
| P0302 | 86 | Хорошее |
| P0303 | 76 | Хорошее |
| P0304 | 71 | Хорошее |
| P0011 | 75 | Хорошее |
| P0101 | 46 | Среднее |
| P0016 | 45 | Среднее |
| P0134 | 37 | Среднее |
| P0441 | 12 | Низкое |
| P0455 | 10 | Низкое |
| P2187 | 7 | Низкое |
| P013A | 0 | Нет |
| P0422 | 0 | Нет |
| P2096 | 0 | Нет |
| P0138 | 0 | Нет |
| P0036 | 0 | Нет |
| P2192 | 0 | Нет |

**6 из 21 кода не имеют привязанных ситуаций.** Это в основном emission/catalyst коды и вторичные лямбда-зонды.

---

## 8. Текущее состояние маппинга DTC -> Ситуации

### Статистика

| Метрика | Значение |
|---|---|
| Всего ситуаций (все уровни) | 451 559 |
| Ситуации с привязанными DTC кодами | 10 191 (2.3%) |
| Уникальные DTC в ситуациях | 300 |
| Универсальные ситуации с DTC | 6 из 764 (0.8%) |

### Проблемы текущего маппинга

1. **Крайне низкое покрытие:** Только 300 из 36 102 DTC кодов (0.8%) имеют привязанные ситуации
2. **Только 2.3% ситуаций** содержат DTC-привязки
3. **Универсальные ситуации почти без DTC:** 6 из 764 (12 уникальных кодов)
4. **P0171 в 520 ситуациях** -- хороший пример, но это лидер. Медиана -- 0.
5. **Дублирование:** P0171 привязан к 39 уникальным названиям ситуаций, из 6 разных категорий (engine, fuel, drivetrain, electrical, body, hvac) -- это избыточно размытый маппинг

---

## 9. Стратегия маппинга DTC -> Ситуации

### Ключевой вопрос: алгоритмический или ручной маппинг?

**Ответ: гибридный подход (3 уровня).**

### Уровень 1: Алгоритмический маппинг по system_id (автоматический)

```
DTC.system_id = "engine" → situations.layers includes "engine"
DTC.system_id = "brakes" → situations.layers includes "brakes"
DTC.system_id = "ev"     → situations.layers includes "ev" | "battery"
```

**Покрытие:** ~70% кодов. Работает для однозначных связей типа:
- P0300-P0304 (ignition) → ситуация "Пропуски зажигания"
- C-коды (brakes) → ситуации "Проблемы с тормозами"

**Ограничение:** system_id слишком крупный (2003 P-кодов имеют system_id="engine"). Нужна вторичная фильтрация.

### Уровень 2: Кластеризация DTC по диапазонам (полуавтоматический)

SAE J2012 определяет семантику по диапазонам:

| Диапазон | Подсистема | Пример ситуации |
|---|---|---|
| P0100-P0199 | Датчики (MAF, MAP, IAT, O2) | "Проблемы с датчиками ДВС" |
| P0200-P0299 | Форсунки и топливоподача | "Проблемы с топливной системой" |
| P0300-P0399 | Зажигание и пропуски | "Пропуски зажигания" |
| P0400-P0499 | EGR и EVAP | "Выхлоп / система рециркуляции" |
| P0500-P0599 | Скорость, холостой ход | "Проблемы с холостым ходом" |
| P0600-P0699 | ECU внутренние | "Неисправность блока управления" |
| P2000-P2999 | Расширенные OBD | По подкатегории |

**Реализация:** Таблица `dtc_range_to_situation_category` -- ~50 записей, создается один раз.

### Уровень 3: Ручная курация для топ-кодов (ручной)

Для 100-200 самых частых кодов (по данным CustDev, YouTube, и frequency из brand-level):
- P0171/P0172 → "Бедная/богатая смесь" + причины + диагностика
- P0300-P0304 → "Пропуски зажигания" + алгоритм определения цилиндра
- P0016/P0011 → "Проблема с фазами ГРМ"

**Формат курации:**
```json
{
  "P0171": {
    "situation_ids": ["fuel_lean_bank1"],
    "related_codes": ["P0174", "P2187", "P2177"],
    "diagnostic_flow": "check_maf → check_vacuum_leaks → check_fuel_pressure",
    "correlation_rules": {
      "P0171+P0174": "Утечка воздуха во впуске (обе банки)",
      "P0171+P0300": "Бедная смесь вызывает пропуски"
    }
  }
}
```

### Рекомендуемый план реализации

#### Фаза 1: Инфраструктура (1-2 дня)

1. **Добавить P013A** и другие пропущенные коды в dtc-index.json
2. Создать таблицу `dtc_range_to_category` (50 записей) для алгоритмического маппинга
3. Определить формат `dtc_situation_map.json` для ручной курации

#### Фаза 2: Алгоритмический маппинг (автоматизация)

1. Маппинг `system_id + dtc_range → situation_category`
2. Резолвер с приоритетами: **generation > model > brand > universal**
3. Fallback: если нет бренд-уровня, использовать универсальный

#### Фаза 3: Ручная курация топ-кодов (итерационно)

1. Начать с 21 YouTube DTC (уже проанализированы)
2. Расширить до топ-50 по frequency из brand-level данных
3. Затем топ-100 по P0115, P0117, P0118 и другим лидерам из ситуаций

#### Фаза 4: Корреляции (продвинутый уровень)

1. Пары/тройки кодов → ситуация (P0171+P0174 = утечка впуска)
2. DTC + live data → ситуация (P0171 + LTFT > 25% = подтвержденная утечка)
3. DTC + пробег → ситуация (P0016 + >100к км = растяжение цепи)

---

## 10. Критические проблемы и рекомендации

### Проблема 1: Дублирование brand/model/generation DTC
На данный момент content на всех уровнях идентичен (проверено BMW, Chery, Toyota). Нужно либо:
- **A)** Генерировать уникальный контент для поколений (BMW E53 vs F15 реально отличаются по двигателям)
- **B)** Убрать дублирование и хранить только дельту на каждом уровне

**Рекомендация:** Вариант B -- хранить только `severity_override`, `common_fix_ru`, `note_ru` на подуровнях, fallback на родительский уровень.

### Проблема 2: system_id не стандартизирован
36 уникальных system_id значений, многие пересекаются:
- `engine` vs `ignition` vs `intake` vs `fuel` vs `emission` vs `exhaust`
- `body` vs `interior` vs `comfort` vs `body-electrical`
- `brakes` vs `brake-control`

**Рекомендация:** Нормализовать до 10-12 основных категорий с подкатегориями.

### Проблема 3: Несоответствие severity для YouTube кодов
- P0171/P0172 (бедная/богатая смесь) = `info` -- занижено, должно быть `warning`
- P0300 (пропуски зажигания) = `urgent`, `can_drive=yes_caution` -- противоречие, при urgent логичнее `no_danger` или `check`

**Рекомендация:** Ревью severity для топ-100 кодов.

### Проблема 4: 98% ситуаций без DTC привязки
451 559 ситуаций, из них только 10 191 с dtc_codes. Большинство ситуаций -- симптомные ("стук при повороте"), а не DTC-ориентированные. Это нормально, но нужен обратный маппинг: DTC → возможные симптомы.

---

## 11. Итоговая архитектура резолвера

```
Input: DTC code + brand + model + generation (optional)

1. Lookup generation-level dtc-model.json
   → if found AND has unique data → use it
2. Lookup model-level dtc-model.json
   → if found → merge (generation overrides model)
3. Lookup brand-level dtc-brand.json
   → if found → merge (model overrides brand)
4. Lookup universal dtc-index.json
   → always exists → base layer

5. Apply situation mapping:
   a) Check manual curation table (top ~200 codes)
   b) Check dtc_range_to_category table
   c) Fallback: match by system_id ↔ situation.layers

6. Return merged DTC object:
   {
     code: "P0171",
     title_ru: "Бедная смесь (банк 1)",           // universal
     note_ru: "На Chery Tiggo...",                  // brand/model
     common_fix_ru: "Проверить MAF, вакуум...",     // brand/model
     severity: "warning",                            // override from brand
     can_drive: "yes_caution",                       // universal
     situations: ["fuel_lean_bank1", ...],           // mapped
     related_codes: ["P0174", "P2187"],              // curated
     diagnostic_flow: "check_maf → ..."              // curated
   }
```

---

## 12. Файлы для работы

| Файл | Путь | Назначение |
|---|---|---|
| Универсальные DTC | `common files all models/dtc-index.json` | 36 102 кода, base layer |
| Бренд DTC | `D:/transfer4/knowledge-base/brands/{brand}/dtc-brand.json` | 58 брендов, до 6 216 кодов |
| Модель DTC | `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/dtc-model.json` | Уровень модели |
| Поколение DTC | `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/{gen}/dtc-model.json` | 66 файлов, 11 брендов |
| Универсальные ситуации | `common files all models/situations-universal.json` | 764 ситуации |
| Бренд ситуации | `D:/transfer4/knowledge-base/brands/{brand}/situations.json` | Brand-level |
| Модель ситуации | `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/situations.json` | Model-level |
