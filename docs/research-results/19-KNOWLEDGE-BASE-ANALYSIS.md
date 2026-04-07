# Анализ базы знаний LLCAR для диагностического движка

**Дата:** 2026-04-07  
**Путь:** `D:/transfer4/knowledge-base/`  
**Цель:** Определить, что из KB полезно для диагностического движка, а что можно пропустить.

---

## 1. Иерархия данных: 4 уровня

```
Universal (764 ситуации) 
  -> Brand (503-1233 ситуаций)
    -> Model (443-635 ситуаций)
      -> Generation (0-192 уникальных ситуаций)
```

### Обнаруженная структура

| Уровень | Файлы | Пример |
|---------|-------|--------|
| Universal | `_common/situations-universal.json` | 764 ситуации, общие для всех авто |
| Brand | `brands/{brand}/situations.json` | chery: 1087, bmw: 1018, hyundai: 1233, li: 503 |
| Model | `brands/{brand}/models/{model}/situations.json` | chery/tiggo_8_pro: 450, bmw/1_series: 443 |
| Generation | `brands/{brand}/models/{model}/{gen}/situations.json` | bmw/x5/e53: 635, e70: 556, f15: 443 |

### Как уровни различаются

**Universal -> Brand:**
- Brand добавляет 67-836 уникальных ситуаций, НЕ существующих в universal
- Brand-only ситуации — это реальные болячки бренда: "Задиры в цилиндрах" (Hyundai, P0420/P0430), "Перерасход масла на 1.6" (Hyundai), "12V аккумулятор сел — как открыть машину" (Li Auto)
- Brand добавляет поля: `brand`, `models`, `icon`, `season`, `priority`, `severity`, `priceData`, `action_ru`, `desc`, `mentionIndex`
- Overlap с universal: 56-86% ситуаций наследуются из universal (chery: 430/1087, li: 432/503)

**Brand -> Model:**
- Модельный уровень — это ПОДМНОЖЕСТВО бренда (overlap = 100%), НЕ надмножество
- Tiggo 8 Pro: 450 из 1087 ситуаций Chery — отобраны релевантные для этой модели
- Модельный уровень добавляет: `reviewed_claude`, `source`, `color`, `title_en`, `level1_ru`, `severity`
- `level1_ru` — расширенное объяснение для конкретной модели

**Model -> Generation:**
- BMW X5 model-level: 443 ситуации (общий для всех поколений)
- E53 добавляет 192 уникальных ситуации (из мануала конкретного поколения)
- E70 добавляет 113 уникальных
- F15 добавляет 0 (всё из model-level)
- Всего 59 моделей имеют поколения (из 1061 модели)

### Вывод для движка
**РЕКОМЕНДАЦИЯ:** Движок должен делать resolution в 4 шага:
1. Загрузить universal baseline
2. Overlay brand-specific (добавить brand-only + перезаписать дублирующиеся)
3. Фильтр по model (взять только релевантные для модели)
4. Overlay generation (если есть — добавить generation-unique)

---

## 2. Ситуации: структура и поля

### Universal ситуация (764 записи)
```json
{
  "id": "yt_c5214a85",
  "title": "Анализ долгосрочной и краткосрочной коррекции топливоподачи",
  "quickAnswer": "...",
  "urgency": 5,
  "category": "engine",
  "layers": ["engine", "fuel", "electrical"],
  "facts_ru": ["LTFT норма +/-10%...", "STFT колеблется 0.5-2 сек..."],
  "dtc_codes": [],
  "priceRange": "3000-25000 руб",
  "canDrive": "допускается",
  "commonMistakes": ["Замена деталей без проверки...", "..."],
  "searchQueries": ["анализ долгосрочной и краткосрочной коррекции..."]
}
```

### Brand/Model ситуация (расширенные поля)
```json
{
  "id": "...",
  "title": "Проблемы с датчиками ABS и ESP",
  "title_en": "ABS/ESP sensor issues",
  "urgency": 4,
  "priority": 2,
  "severity": "high",
  "color": "#FF5722",
  "category": "electrical",
  "layers": ["electrical", "chassis"],
  "season": "winter",
  "quickAnswer": "...",
  "action_ru": "Заменить датчики ABS и очистить контакты",
  "level1_ru": "Коды B0004 и B0028 свидетельствуют о потере сигнала с датчиков ABS...",
  "facts_ru": ["Средний пробег до отказа: 40 000 км", "Цена датчика ABS (передний): 3 500 руб."],
  "dtc_codes": ["B0004", "B0028"],
  "priceData": {
    "items": [
      {"name": "Датчик ABS передний", "min": 3500, "max": 5500},
      {"name": "Работа по замене", "min": 1500, "max": 2500}
    ],
    "disclaimer": "Цены актуальны для 2026 года в РФ",
    "lastUpdated": "2026-03"
  },
  "brand": "chery",
  "models": ["tiggo_8_pro"],
  "mentionIndex": 12,
  "icon": "..."
}
```

### Покрытие ценами

| Уровень | С ценами | Всего | Формат |
|---------|----------|-------|--------|
| Universal | 764/764 (100%) | 764 | `priceRange`: "3000-25000 руб" (текст) |
| Brand (Chery) | 14/1087 (1.3%) | 1087 | `priceData.items[]` с min/max |
| Model (Tiggo 8 Pro) | 9/450 (2%) | 450 | `priceData.items[]` с min/max |
| Brand (Hyundai) | 22/836 brand-only | 1233 | `priceData.items[]` с min/max |

**ВЫВОД:** Universal priceRange — текстовый диапазон, покрытие 100%. Brand/Model priceData — структурированный (можно показать "Датчик ABS: 3500-5500, работа: 1500-2500"), но покрытие <2%. Для MVP использовать priceRange, в будущем обогащать priceData.

---

## 3. Иерархия систем (hierarchy)

### Файлы
- `_common/hierarchy_ice.json` — шаблон для ДВС (5 доменов)
- `_common/hierarchy_bev.json` — шаблон для электро
- `_common/hierarchy_phev.json` — шаблон для гибридов
- `brands/{brand}/hierarchy.json` — копия шаблона с `template: "ice"`

### Структура (ICE)
```
Силовая установка (Powertrain)
  - Двигатель (Engine)
  - Трансмиссия (Transmission)
  - Топливная система (Fuel System)
Шасси (Chassis)
  - Подвеска (Suspension)
  - Рулевое управление (Steering)
  - Тормозная система (Brakes)
Кузов (Body)
  - Кузовная конструкция (Body Structure)
  - Двери и замки (Closures)
  - Стёкла и зеркала (Glass & Mirrors)
Салон (Cabin)
  - Сиденья (Seats)
  - Климат-контроль (HVAC)
  - Отделка салона (Interior)
Электроника (Electronics)
  - Системы помощи (ADAS)
  - Датчики и камеры (Sensors)
  - Освещение (Lighting)
```

### Маппинг на ситуации
Ситуации используют `category` и `layers` для привязки к системам:
- Categories: engine(190), electrical(65), general(28), suspension(27), body(23), drivetrain(20), tires(20), fuel(18), brakes(14), cooling(12), hvac(10), lighting(9), chassis(7), safety(5), infotainment(2)
- Layers: 18 уникальных значений (engine, fuel, electrical, cooling, exhaust, steering, suspension, brakes, chassis, drivetrain, body, interior, hvac, lighting, safety, infotainment, tires, general)

**ПРОБЛЕМА:** Hierarchy использует system names (Engine, Transmission, Fuel System), а ситуации используют другую таксономию (category + layers). Нет прямого system_id. Нужен маппинг.

**РЕКОМЕНДАЦИЯ:** Создать таблицу маппинга `category/layer -> hierarchy system_id`. Это позволит группировать ситуации по системам в UI ("Проблемы двигателя: 5 ситуаций, Подвеска: 2 ситуации").

---

## 4. DTC коды

### Структура на уровне модели
```
brands/{brand}/models/{model}/dtc.json
```

Пример (Chery Tiggo 8 Pro): 216 кодов, формат:
```json
{
  "B0001": {
    "note_ru": "Код B0001 (Управление раскрытием подушки водителя) на автомобилях Chery.",
    "common_fix_ru": "Немедленно обратиться в сервис для диагностики системы SRS.",
    "frequency": "rare",
    "severity_override": "critical",
    "source": "dtc_enrichment_v1",
    "system_id": "sensors",
    "can_drive": "no_stop"
  }
}
```

### Ключевые поля для движка
- `system_id` — привязка DTC к системе иерархии
- `severity_override` — critical/high/medium/low
- `can_drive` — можно ли ехать (no_stop, caution, ok)
- `common_fix_ru` — быстрый ответ пользователю
- `frequency` — rare/common/frequent

### Статистика файлов
- 924 файла dtc.json по всей KB
- BMW X5 поколения: каждое поколение имеет свой dtc.json (3.6MB каждый)
- DTC-index (`_common/dtc-index.json`) — meta-файл, пустой (codes: 0)

**ВЫВОД:** DTC на модельном уровне уже обогащены — содержат `system_id`, `can_drive`, `severity_override`. Это ГОТОВО для диагностического движка. Связка DTC -> ситуация через `dtc_codes[]` в ситуациях.

---

## 5. Каталог запчастей

### Структура
```
brands/{brand}/models/{model}/parts-catalog.json
```

- 708 файлов parts-catalog.json
- Chery Tiggo 8 Pro: 3688 деталей, 15 систем

### Поля запчасти
```json
{
  "system": "",
  "system_en": "",
  "part_name": "PM0008002\nВЕТРОВОЕ И ЗАДНЕЕ СТЕКЛА/СТЕКЛА ДВЕРЕЙ",
  "subsystem": "",
  "part_number": "PM0008002",
  "source_url": "",
  "source": "manual:chunks-manual-tiggo_4_pro.md"
}
```

### Покрытие
- С part_number: 3593/3688 (97%)
- С ценой: 0/3688 (0%)
- С system: 95/3688 (2.6%)

**ВЫВОД:** Каталог запчастей НЕ содержит цен. Part numbers есть, но без привязки к ценам. Для "cost estimate" в движке использовать `priceData` из ситуаций, а не parts-catalog. Parts-catalog полезен только для поиска OEM part numbers.

**РЕКОМЕНДАЦИЯ:** SKIP для MVP. В будущем можно парсить цены с exist.ru/autodoc.ru по part_number.

---

## 6. DITA-мануалы

### Структура
```
brands/{brand}/models/{model}/18-dita-manual.json
```

- 982 файла по всей KB (почти на каждую модель)
- Формат: sections -> topics

### Пример структуры
```json
{
  "version": "1.0",
  "format": "dita-like",
  "model": "tiggo_8_pro",
  "manuals": [{
    "model": "tiggo_8_pro",
    "label": {"ru": "Chery Tiggo 8 Pro — Руководство"},
    "sections": [
      {
        "id": "engine",
        "title": {"ru": "Двигатель"},
        "topics": [{
          "id": "chery_tiggo_8_pro_engine_t000_b6c66ad2",
          "type": "task",
          "title": {"ru": "Замена элемента воздушного фильтра"},
          "section_id": "engine",
          "systems": ["engine"],
          "words": 861,
          "content": {"ru": "...текст процедуры..."}
        }]
      }
    ]
  }]
}
```

### Статистика Tiggo 8 Pro
- 1 мануал, 12 секций, 607 топиков
- Каждый топик привязан к `systems[]` (engine, fuel, etc.)
- Содержит полный текст процедур (content.ru)

**ЦЕННОСТЬ ДЛЯ ДВИЖКА:** Высокая. Можно линковать диагностическую ситуацию к конкретному разделу мануала:
- Ситуация "Замена воздушного фильтра" -> topic_id `chery_tiggo_8_pro_engine_t000_b6c66ad2`
- Связка через `systems[]` совпадающие с `layers[]` ситуации

**РЕКОМЕНДАЦИЯ:** Реализовать "Подробнее в мануале" кнопку в диагностическом результате. Маппинг: situation.layers -> dita.sections -> relevant topics.

---

## 7. Platform sharing

### Структура
```
D:/transfer4/knowledge-base/platform-sharing.json
```

32 платформы, связывающие модели разных брендов:
```
MQB: VW Golf, Tiguan, Passat, Jetta, Caddy + Skoda Octavia, Karoq, Kodiaq + Audi A3, Q3
PQ25: VW Polo + Skoda Rapid, Fabia
MLB: Audi Q5, A4, A6, Q7 + VW Touareg + Porsche Cayenne, Macan
K3: Hyundai Tucson + Kia Sportage
K5: Hyundai Elantra + Kia Cerato, K5
SU2: Hyundai Creta + Kia Seltos
```

**ЦЕННОСТЬ ДЛЯ ДВИЖКА:** Средняя-высокая. Если у Kia Sportage мало данных, можно заимствовать ситуации с Hyundai Tucson (та же платформа K3). Правило:
- Same platform + same system domain = ~80% совпадение проблем
- Powertrain может отличаться (разные моторы), но chassis/body/electrical — очень похожи

**РЕКОМЕНДАЦИЯ:** Использовать как fallback: если для модели мало ситуаций (<10), подтягивать ситуации с platform siblings. Пометить их как "может быть актуально на основе общей платформы".

---

## 8. Recalls (отзывные кампании)

### Структура
```
_common/recalls-database.json
```

- 298 кампаний
- 91 бренд (включая китайские: geely, chery, haval, byd, li_auto, etc.)
- Источник: Росстандарт + NHTSA

### Поля кампании
```json
{
  "id": "TOYOTA-ROS-001",
  "brand": "toyota",
  "models": ["Lexus LX570", "Toyota LC200"],
  "date": "2021-01-29",
  "count": 82405,
  "title_ru": "Проблема нагревателя омывателя лобового стекла",
  "description_ru": "Отзыву подлежат 82 405 автомобилей...",
  "severity": "critical",
  "system": "fuel",
  "years": "2013",
  "source": "rosstandart",
  "type": "recall"
}
```

### Покрытие
- С VIN range: 0/298 (нет VIN-диапазонов!)
- С годами: 176/298
- С severity: 298/298
- С system: 298/298

### Топ брендов по отзывам
Mercedes: 64, Audi: 25, VW: 17, BMW: 15, Jeep: 15, Volvo: 13, Porsche: 12, Toyota: 11, Skoda: 10

### Системы отзывов
airbag, battery, body, brakes, cooling, electrical, engine, fuel, interior, lighting, safety, software, steering, suspension, transmission

**ЦЕННОСТЬ ДЛЯ ДВИЖКА:** Средняя. Можно показывать: "Для вашей модели {model} ({year}) известны отзывные кампании: {title_ru}". НО: нет VIN-диапазонов, поэтому нельзя точно сказать "ваш VIN затронут". Только на уровне model + year.

**РЕКОМЕНДАЦИЯ:** Интегрировать как информационный блок. При диагностике, если DTC совпадает с system отзыва для данного brand/model/year — показать предупреждение: "Известна отзывная кампания по этой системе".

---

## 9. Общая статистика KB

| Тип данных | Количество файлов | Покрытие |
|-----------|-------------------|----------|
| situations.json | 983 | Все модели + бренды + поколения |
| dtc.json | 924 | Почти все модели |
| 18-dita-manual.json | 982 | Почти все модели |
| parts-catalog.json | 708 | ~67% моделей |
| Бренды | 60 | Полное покрытие рынка РФ |
| Модели | 1061 | Включая все поколения |
| Модели с поколениями | 59 | В основном BMW, Audi, другие premium |

---

## 10. Рекомендации для диагностического движка

### ПРИОРИТЕТ 1 — Интегрировать сразу

1. **Ситуации (4-level resolution)**
   - Universal -> Brand -> Model -> Generation
   - Самый конкретный уровень "побеждает" для одинаковых ID
   - Brand-only ситуации — ключевая ценность (реальные болячки)
   - 428 ситуаций общие для всех 3+ уровней

2. **DTC коды (модельные)**
   - Уже обогащены: system_id, can_drive, severity, common_fix_ru
   - Связь с ситуациями через `dtc_codes[]`
   - 924 файла, готовы к использованию

3. **Recalls как триггеры**
   - Матчинг по brand + model + year + system
   - Показывать при совпадении с диагностируемой системой

### ПРИОРИТЕТ 2 — Интегрировать позже

4. **DITA-мануалы как "Read more"**
   - 982 файла, 607 топиков на модель
   - Связка через systems/layers
   - Требует UI для отображения

5. **Platform sharing как fallback**
   - 32 платформы
   - Для моделей с малым количеством данных
   - Заимствование ситуаций с platform siblings

### ПРИОРИТЕТ 3 — Skip для MVP

6. **Parts catalog**
   - Нет цен (0%)
   - Part numbers полезны только для поиска на autodoc/exist
   - Для cost estimate использовать priceData из ситуаций

7. **DTC-index** (`_common/dtc-index.json`)
   - Пустой (0 кодов), не использовать

### Критические проблемы

1. **Маппинг taxonomy:** Hierarchy systems != situation categories/layers. Нужна таблица маппинга.
2. **priceData покрытие:** Только 1-2% ситуаций имеют структурированные цены на brand/model уровне. Universal priceRange — текст, не парсится. Нужен enrichment.
3. **VIN в recalls:** Нет VIN-диапазонов. Только brand/model/year matching.
4. **Generation resolution:** Только 59/1061 моделей имеют поколения. Для остальных Model — финальный уровень.

---

## 11. Схема интеграции в движок

```
Пользователь вводит: VIN + DTC коды

1. VIN -> brand + model + year + generation (через vehicles-ru.json + WMI)
2. Загрузить ситуации: universal + brand-overlay + model-filter + gen-overlay
3. DTC matching: dtc.json (модель) -> severity, can_drive, system_id
4. Situation matching: dtc_codes[] пересечение с пользовательскими DTC
5. Recall check: brand + model + year + system -> показать если есть
6. Platform fallback: если ситуаций < 10 для модели -> siblings
7. Manual link: situation.layers -> dita.sections -> relevant topics
8. Price estimate: priceData (если есть) или priceRange (fallback)

Результат: DiagnosticReport {
  situations: [...],    // отсортированы по urgency * severity
  dtc_details: [...],   // can_drive, common_fix_ru
  recalls: [...],       // если есть для этой модели
  manual_refs: [...],   // ссылки на мануал
  cost_estimate: {...}  // min-max по priceData/priceRange
}
```
