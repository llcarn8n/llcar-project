# 15. DTC Index & Situations: анализ данных для диагностического движка LLCAR

**Дата анализа:** 2026-04-07
**Файлы:**
- `common files all models/dtc-index.json` — 4.7 MB
- `common files all models/situations-universal.json` — 3.4 MB

---

## 1. DTC Index (dtc-index.json)

### 1.1 Общая структура

```
{
  "meta": {
    "total": 36102,
    "brand_top_codes": {}
  },
  "codes": {
    "P0001": { severity, title_ru, system_id, can_drive },
    "B0001": { ... },
    ...
  }
}
```

**Формат:** JSON-объект с двумя ключами верхнего уровня — `meta` и `codes`.
**Количество кодов:** 36 102 уникальных DTC-кодов.

### 1.2 Поля каждого DTC-кода

| Поле | Покрытие | Тип | Описание |
|------|----------|-----|----------|
| `severity` | 100% (36102) | string | Уровень серьёзности: critical, urgent, warning, info, medium, low, high |
| `title_ru` | 99.5% (35911) | string | Описание ошибки на русском языке |
| `system_id` | 100% (36102) | string | Идентификатор системы автомобиля (engine, body, brakes...) |
| `can_drive` | 100% (36102) | string | Можно ли продолжать движение |
| `title_en` | 0.5% (191) | string | Описание на английском (из dsoprea/DtcLookup) |
| `source` | 0.5% (191) | string | Источник данных (dsoprea/DtcLookup) |

**Важно:** 191 код (0.5%) имеют только английское описание — это коды из открытого проекта dsoprea/DtcLookup. Остальные 35 911 кодов имеют русскоязычные описания.

### 1.3 Распределение по типам кодов

| Тип | Количество | Диапазон | Назначение |
|-----|-----------|----------|------------|
| **P** (Powertrain) | 3 605 | P0001 — P3999 | Двигатель, трансмиссия, выхлоп |
| **B** (Body) | 10 822 | B0001 — B3FFF | Кузовная электрика, подушки, комфорт |
| **C** (Chassis) | 10 890 | C0035 — C3FFF | Шасси, ABS, ESP, подвеска |
| **U** (Network) | 10 785 | U0001 — U3FFF | CAN-шина, коммуникация блоков |

**Замечание:** P-кодов значительно меньше (10%), потому что они стандартизированы по SAE J2012. B/C/U кодов больше из-за производительских (manufacturer-specific) расширений.

### 1.4 Под-диапазоны P-кодов

| Диапазон | Количество | Система |
|----------|-----------|---------|
| P00xx | 99 | Общие (топливо, воздух) |
| P01xx | 98 | Топливо/воздух |
| P02xx | 100 | Топливо/воздух (доп.) |
| P03xx | 100 | Зажигание/пропуски |
| P04xx | 100 | Выхлопная система |
| P05xx | 100 | Скорость/холостой ход |
| P06xx | 100 | ECM/PCM |
| P07xx | 100 | Трансмиссия |
| P08xx-P09xx | 200 | Трансмиссия (доп.) |
| P2xxx | 1 280 | SAE/OEM расширенные |
| P3xxx+ | 1 328 | OEM-специфичные |

### 1.5 Распределение по серьёзности (severity)

| Severity | Количество | Доля | Описание |
|----------|-----------|------|----------|
| warning | 23 112 | 64.0% | Предупреждение, контроль нужен |
| info | 12 492 | 34.6% | Информационное, не критично |
| critical | 227 | 0.6% | Критично, остановка обязательна |
| urgent | 105 | 0.3% | Срочное, движение опасно |
| medium | 99 | 0.3% | Средний приоритет |
| low | 62 | 0.2% | Низкий приоритет |
| high | 5 | 0.0% | Высокий (редко используется) |

**Замечание:** 7 уровней severity — для движка стоит нормализовать до 4 уровней (critical/urgent/warning/info).

### 1.6 Распределение по системам (system_id)

| System ID | Количество | Описание |
|-----------|-----------|----------|
| ev | 11 502 | Электромобиль / электросистемы |
| body | 9 000 | Кузовная электрика |
| brakes | 6 405 | Тормозная система |
| sensors | 5 386 | Датчики (подушки, краш) |
| engine | 2 005 | Двигатель |
| drivetrain | 516 | Трансмиссия |
| hvac | 510 | Климат-контроль |
| interior | 505 | Салон |
| chassis | 115 | Шасси |
| Прочие (<15) | ~158 | climate, cooling, body-electrical, power-electronics, adas, ignition, intake, fuel, emission, electrical, comfort, brake-control, suspension, display, audio, safety, pump, steering, controller, parking, battery-management, charging и др. |

### 1.7 Возможность движения (can_drive)

| can_drive | Количество | Значение |
|-----------|-----------|----------|
| yes_caution | 23 296 | Можно, с осторожностью |
| yes_safe | 12 370 | Безопасно ехать |
| no_stop | 204 | Остановиться немедленно |
| check | 191 | Требуется проверка |
| no_danger | 41 | Нельзя ехать, опасно |

### 1.8 Примеры DTC-кодов

**P-коды (Powertrain):**
```
P0001: "Управление регулятором давления топлива" — severity=urgent, system=engine, can_drive=no_danger
P0100: "Неисправность цепи MAF (расходомер воздуха)" — severity=warning, system=intake, can_drive=yes_caution
P0171: "Бедная смесь (Банк 1)" — severity=info, system=engine, can_drive=yes_caution
P0300: "Обнаружены пропуски зажигания в нескольких цилиндрах" — severity=urgent, system=ignition, can_drive=yes_caution
P0420: "Эффективность катализатора ниже порога (Банк 1)" — severity=warning, system=exhaust, can_drive=yes_caution
P0700: "Неисправность системы управления КПП" — severity=urgent, system=drivetrain, can_drive=yes_caution
```

**B-коды (Body):**
```
B0001: "Управление раскрытием подушки водителя (стадия 1)" — severity=critical, system=sensors, can_drive=no_stop
B0002: "Управление раскрытием подушки водителя (стадия 2)" — severity=critical, system=sensors, can_drive=no_stop
```

**C-коды (Chassis):**
```
C0035: "Цепь датчика скорости ЛП колеса" — severity=critical, system=brake-control, can_drive=no_stop
C0040: "Цепь датчика скорости ПП колеса" — severity=critical, system=brake-control, can_drive=no_stop
```

**U-коды (Network):**
```
U0001: "Шина CAN высокоскоростная" — severity=urgent, system=ev, can_drive=yes_caution
U0002: "Производительность шины CAN" — severity=urgent, system=ev, can_drive=yes_caution
U0073: "Обрыв шины связи блока управления" — severity=urgent, system=ev, can_drive=yes_caution
```

---

## 2. Situations Universal (situations-universal.json)

### 2.1 Общая структура

```
[
  {
    "id": "yt_c5214a85",
    "title": "Анализ долгосрочных и краткосрочных топливных коррекций",
    "quickAnswer": "Развёрнутый ответ на русском...",
    "urgency": 5,
    "category": "engine",
    "layers": ["engine", "fuel", "electrical"],
    "facts_ru": ["Факт 1...", "Факт 2..."],
    "dtc_codes": [],
    "merged_count": 4,
    "source_type": "universal_merged",
    "universal": true,
    "searchQueries": ["запрос1", "запрос2"],
    "subtitle": "Краткое описание...",
    "sources": ["Источник 1", "Источник 2"],
    "priceRange": "3000-25000 руб",
    "canDrive": "ограниченно",
    "commonMistakes": ["Ошибка 1", "Ошибка 2"],
    "facts": ["Факт 1 (short)...", "Факт 2 (short)..."]
  },
  ...
]
```

**Формат:** JSON-массив объектов.
**Количество ситуаций:** 764 записи.
**Суммарный merged_count:** 3 549 исходных источников сведены в 764 ситуации.

### 2.2 Полный перечень полей

| Поле | Покрытие | Тип | Описание |
|------|----------|-----|----------|
| `id` | 764/764 | string | Уникальный ID (yt_, buni_, rev_, diag_, msf_, video_, yt2_...) |
| `title` | 764/764 | string | Заголовок ситуации |
| `quickAnswer` | 764/764 | string | Развёрнутый ответ/инструкция (196-2890 символов, среднее 820) |
| `urgency` | 764/764 | int (1-5) | Срочность (5 = критично, 1 = информационно) |
| `category` | 764/764 | string | Категория (engine, electrical, brakes...) |
| `layers` | 764/764 | string[] | Затронутые системы |
| `facts_ru` | 764/764 | string[] | Факты на русском с источниками |
| `facts` | 764/764 | string[] | Сокращённые факты |
| `dtc_codes` | 743/764 | string[] | Связанные DTC-коды (заполнено у 6 записей) |
| `merged_count` | 743/764 | int | Сколько источников объединено |
| `source_type` | 748/764 | string | Тип источника |
| `universal` | 764/764 | bool | Всегда true (универсальные) |
| `searchQueries` | 764/764 | string[] | Поисковые запросы для matching |
| `subtitle` | 764/764 | string | Сокращённое описание |
| `sources` | 764/764 | string[] | Ссылки на источники |
| `priceRange` | 764/764 | string | Диапазон стоимости ремонта |
| `canDrive` | 764/764 | string | Можно ли продолжать движение |
| `commonMistakes` | 764/764 | string[] | Типичные ошибки владельцев |
| `steps` | 95/764 | string[] | Пошаговая инструкция |
| `prices` | 95/764 | string[] | Детализированные цены |
| `quickAnswer_original` | 94/764 | string | Оригинальный ответ до переработки |
| `desc` | 21/764 | string | Короткое описание |
| `icon` | 21/764 | string | Эмодзи-иконка |
| `season` | 21/764 | string | Сезонность (all, winter, summer) |
| `priority` | 21/764 | string | Приоритет (P0, P1...) |
| `action_ru` | 5/764 | string | Рекомендуемое действие |
| `brand_coverage` | 5/764 | int | Количество брендов, к которым применимо |
| `frequency` | 5/764 | string | Частота проблемы (common, rare...) |

### 2.3 Распределение по категориям

| Категория | Количество | Доля |
|-----------|-----------|------|
| engine | 255 | 33.4% |
| electrical | 90 | 11.8% |
| general | 75 | 9.8% |
| brakes | 72 | 9.4% |
| body | 66 | 8.6% |
| suspension | 43 | 5.6% |
| tires | 39 | 5.1% |
| drivetrain | 30 | 3.9% |
| fuel | 23 | 3.0% |
| cooling | 17 | 2.2% |
| hvac | 16 | 2.1% |
| chassis | 12 | 1.6% |
| safety | 10 | 1.3% |
| lighting | 9 | 1.2% |
| infotainment | 7 | 0.9% |

### 2.4 Распределение по типу источника

| Source Type | Количество | Описание |
|-------------|-----------|----------|
| universal_merged | 497 | Объединённые из нескольких YouTube/текстовых источников |
| brand_universal | 164 | Универсальные по бренду (из мануалов) |
| merged_article | 42 | Статьи, объединённые по теме |
| reviews_mined | 40 | Добыто из отзывов drom.ru и др. |
| review_universal_extraction | 5 | Универсальные извлечения из отзывов |
| N/A | 16 | Без указания типа |

### 2.5 Распределение по срочности

| Urgency | Количество | Описание |
|---------|-----------|----------|
| 5 (критично) | 181 | Немедленные действия |
| 4 (высокая) | 255 | Скоро, не затягивать |
| 3 (средняя) | 236 | Плановый ремонт |
| 2 (низкая) | 81 | Информационно |
| 1 (минимальная) | 11 | Справочное |

### 2.6 Распределение по ID-префиксам (типы источников)

| Префикс | Количество | Источник |
|----------|-----------|----------|
| yt_ | 399 | YouTube видео |
| buni_ | 164 | Brand universal (мануалы) |
| video_ | 52 | Видео (другие) |
| rev_ | 49 | Отзывы владельцев |
| yt2_ | 28 | YouTube (второй парсинг) |
| maint_ | 22 | Обслуживание |
| diag_ | 20 | Диагностика |
| msf_ | 16 | Безопасность/MSF |
| Единичные | 14 | engine_, oil_, used_, strange_, fuel_, insurance_, wiper_, tires_, winter_, key_, ac_, russification_, parking_ |

### 2.7 Слои (layers) — частота

| Layer | Упоминаний |
|-------|-----------|
| engine | 320 |
| electrical | 140 |
| body | 100 |
| brakes | 88 |
| suspension | 61 |
| general | 60 |
| drivetrain | 49 |
| fuel | 43 |
| tires | 43 |
| hvac | 35 |
| chassis | 35 |
| cooling | 30 |
| infotainment | 11 |
| lighting | 10 |
| safety | 10 |
| steering | 3 |
| exhaust | 1 |
| interior | 1 |

### 2.8 Ценовой диапазон

- **Минимальная стоимость:** 0 руб (мойка двигателя — бесплатная профилактика)
- **Максимальная стоимость:** 2 000 000 руб (битое/перевёрнутое авто)
- **Средний диапазон:** 4 187 — 34 506 руб

### 2.9 Топ-10 самых подтверждённых проблем (по merged_count)

| Merged | Категория | Проблема |
|--------|-----------|----------|
| 289 | engine | Повышенный расход моторного масла (масложор) |
| 170 | body | Протечка воды в салон через люк или уплотнители |
| 148 | fuel | Повышенный расход топлива: причины |
| 96 | engine | Двигатель не заводится: диагностика по симптомам |
| 79 | body | Коррозия кузовных элементов |
| 67 | engine | Долгий прогрев двигателя / холодная печка |
| 57 | brakes | Замена тормозных колодок и дисков: ресурс и подбор |
| 55 | cooling | Правильная процедура замены антифриза без воздушных пробок |
| 50 | engine | Загорелся Check Engine: алгоритм действий |
| 49 | general | Слабый холод от кондиционера |

### 2.10 Связь с DTC-кодами

Только **6 из 764** ситуаций содержат явные DTC-коды:

| ID | Ситуация | DTC-коды |
|----|----------|----------|
| buni_8943ed2b | Буст давления ACTECO 1.5T/1.6T | P0234, P0299 |
| buni_eb0203ab | EPB parking brake warning | C2200 |
| buni_83a65cff | Батарея 12V (BYD) | P0615, P0616 |
| buni_ef780251 | Проблемы с батареей и зарядкой EV | P0A80, P0AF0 |
| buni_1c47749f | Ошибки давления шин | C0750, C0755, C0760, C0765 |
| buni_32f29836 | Проблемы с мультимедиа | U0100 |

**Вывод:** Связка situations <-> DTC практически отсутствует. Это главный разрыв в данных.

### 2.11 Примеры записей разных типов

**universal_merged (YouTube):**
```json
{
  "id": "yt_c5214a85",
  "title": "Анализ долгосрочных и краткосрочных топливных коррекций",
  "category": "engine",
  "urgency": 5,
  "layers": ["engine", "fuel", "electrical"],
  "priceRange": "3000-25000 руб",
  "canDrive": "ограниченно",
  "merged_count": 4,
  "quickAnswer": "Анализ долгосрочных и краткосрочных топливных коррекций позволяет выявить...",
  "facts_ru": ["LTFT более ±10% указывает на...", "STFT реагирует за 0.5-2 секунды..."],
  "commonMistakes": ["Замена форсунок без проверки давления...", "Игнорирование коррекций более ±15%"]
}
```

**brand_universal (мануалы):**
```json
{
  "id": "buni_96a907fd",
  "title": "Проблемы с работой мотора, если коды не были пере-программированы...",
  "category": "engine",
  "urgency": 5,
  "merged_count": 3
}
```

**reviews_mined (отзывы):**
```json
{
  "id": "rev_98b07f43",
  "title": "Двигатель не заводится: диагностика по симптомам",
  "category": "engine",
  "urgency": 5,
  "merged_count": 96,
  "quickAnswer": "Проблема упоминается в 96 отзывах владельцев различных марок..."
}
```

**Запись с пошаговой инструкцией (steps + prices):**
```json
{
  "id": "yt_355f02d5",
  "title": "Вибрация и толчки педали тормоза при обычном торможении",
  "steps": [
    "Шаг 1: Остановите автомобиль в безопасном месте...",
    "Шаг 2: Визуально осмотрите тормозные диски...",
    "Шаг 3: Проверьте тормозные колодки — минимально допустимая толщина по ECE R13 — 2 мм..."
  ],
  "prices": [
    "Диагностика: 1500-3000 руб",
    "Тормозные диски (аналог, передние, LADA Vesta): 3500-5500 руб",
    "Работа по замене: 2500-4000 руб",
    "Итого: 7500-12500 руб"
  ]
}
```

**Сезонная запись (MSF):**
```json
{
  "id": "msf_fire_hazard",
  "title": "Пожароопасность в автомобиле",
  "season": "all",
  "icon": "🔥",
  "desc": "Не храните аэрозоли, зажигалки и легковоспламеняющиеся жидкости в салоне...",
  "priority": "P0"
}
```

---

## 3. Взаимосвязь файлов

### 3.1 Текущее состояние связи

```
dtc-index.json (36 102 кода) ←→ situations-universal.json (764 ситуации)
                                        ↓
                              Только 6 ситуаций содержат dtc_codes
                              (всего 11 уникальных DTC в привязках)
```

**Проблема:** Из 36 102 DTC-кодов только 11 (0.03%) явно привязаны к ситуациям. Связь практически отсутствует.

### 3.2 Потенциальная связь через system_id ↔ category/layers

| DTC system_id | Situations category | Совпадение |
|---------------|--------------------|----|
| engine (2005) | engine (255) | Да |
| body (9000) | body (66) | Да |
| brakes (6405) | brakes (72) | Да |
| drivetrain (516) | drivetrain (30) | Да |
| hvac (510) | hvac (16) | Да |
| ev (11502) | electrical (90) | Частично |
| sensors (5386) | — | Нет прямого аналога |
| interior (505) | — | Нет прямого аналога |

---

## 4. Рекомендации для диагностического движка

### 4.1 Архитектура маппинга DTC → Situation

**Проблема #1:** Только 6 из 764 ситуаций имеют явные DTC-коды.

**Решение:** Создать промежуточный маппинг-слой:

```typescript
interface DTCMapping {
  // Прямой маппинг (dtc_codes в situations)
  direct: Map<string, SituationId[]>;
  
  // Маппинг по system_id → category
  systemCategory: Map<string, string[]>;
  
  // Маппинг по severity → urgency
  severityUrgency: Map<string, number>;
  
  // Маппинг по keyword match (title_ru DTC → title situation)
  keyword: Map<string, SituationId[]>;
}
```

**Конкретные шаги:**
1. Для каждого DTC-кода из dtc-index — найти ситуации, где `title` или `quickAnswer` упоминают ключевые слова из `title_ru` кода
2. Для P03xx (зажигание) — привязать к ситуациям с `layers: ["engine"]` и keyword "зажигание", "пропуски"
3. Для B0001-B0002 (подушки) — привязать к `category: "safety"`
4. Для C-кодов (ABS/ESP) — привязать к `category: "brakes"`

### 4.2 Нормализация severity

Текущие 7 уровней severity в DTC → привести к 4:

```
critical + urgent → CRITICAL (332 кода) → urgency 5
high + medium → HIGH (104 кода) → urgency 4  
warning → WARNING (23 112 кодов) → urgency 3
info + low → INFO (12 554 кода) → urgency 1-2
```

### 4.3 Оптимизация для рантайма

**Проблема:** dtc-index.json — 4.7 MB. Загружать целиком в браузер неприемлемо.

**Решения:**

1. **Lazy-load по префиксу:** Разбить на 4 файла (P.json, B.json, C.json, U.json) или 16 файлов (P0.json, P1.json, ..., U3.json)
2. **Trie-структура:** Для быстрого поиска по коду использовать trie (prefix tree)
3. **Server-side API:** При считывании кода ELM327 → запрос на сервер → ответ с DTC info + matched situations
4. **Minimal index + details on demand:**
   ```
   dtc-index-minimal.json (код → severity + can_drive) ~500KB
   dtc-details/{P0001}.json (полная запись) — по запросу
   ```

### 4.4 Диагностический пайплайн

```
ELM327/OBD2 → считывание DTC кодов
       ↓
[1] Lookup в dtc-index.json → severity, system_id, can_drive, title_ru
       ↓
[2] Match situations по:
    a) Прямой dtc_codes match (6 ситуаций)
    b) system_id → category match  
    c) Keyword matching (title_ru → searchQueries)
    d) layers intersection
       ↓
[3] Ранжирование ситуаций:
    - По merged_count (больше подтверждений → выше)
    - По urgency (критичнее → выше)
    - По relevance score (количество совпавших layers)
       ↓
[4] Формирование ответа пользователю:
    - DTC title_ru + severity
    - can_drive рекомендация
    - Top-3 matched situations с quickAnswer
    - priceRange + commonMistakes
    - steps (если есть)
```

### 4.5 Приоритеты обогащения данных

1. **CRITICAL:** Автоматически привязать P-коды к ситуациям через keyword matching (P0171 "бедная смесь" → situations с "бедная смесь" в title/quickAnswer). Ожидается ~200-500 новых связок.

2. **HIGH:** Для топ-50 самых частых DTC-кодов (P0300, P0171, P0420, P0440, P0700 и др.) — ручная привязка к ситуациям с валидацией.

3. **MEDIUM:** Заполнить title_ru для 191 кода, у которых только английское описание.

4. **LOW:** Добавить `steps` и `prices` для оставшихся 669 ситуаций (сейчас только у 95).

### 4.6 Поисковый движок

Для matching DTC ↔ situations использовать `searchQueries` из ситуаций:
- 764 ситуации содержат в среднем 3 поисковых запроса = ~2 292 поисковых индекса
- Построить inverted index: слово → [situation_ids]
- При поиске по DTC title_ru — токенизировать → lookup в inverted index → score по TF-IDF или BM25

### 4.7 Формат ответа для UI

```typescript
interface DiagnosticResult {
  // Из dtc-index
  code: string;              // "P0171"
  title: string;             // "Бедная смесь (Банк 1)"
  severity: 'critical' | 'urgent' | 'warning' | 'info';
  canDrive: 'no_stop' | 'no_danger' | 'yes_caution' | 'yes_safe' | 'check';
  system: string;            // "engine"
  
  // Из matched situations
  situations: {
    title: string;
    quickAnswer: string;
    urgency: number;
    priceRange: string;
    canDrive: string;
    commonMistakes: string[];
    facts: string[];
    steps?: string[];        // Если доступны
    prices?: string[];       // Если доступны
    relevanceScore: number;  // 0-1
  }[];
}
```

---

## 5. Ключевые выводы

### Сильные стороны данных
1. **36 102 DTC-кода** с русскоязычными описаниями — покрывает ~99.5% всех стандартных и OEM-кодов
2. **764 ситуации** с развёрнутыми ответами, фактами, ценами, типичными ошибками
3. **3 549 объединённых источников** — высокая верифицированность данных
4. **can_drive** поле в обоих файлах — критично для безопасности
5. **searchQueries** — готовые индексы для поиска

### Слабые стороны / что нужно доработать
1. **Главный разрыв:** Связь DTC ↔ situations почти отсутствует (6 из 764)
2. **Неконсистентные severity:** 7 уровней в DTC, 5 уровней urgency в situations — нужна нормализация
3. **Нет стандартных описаний:** Для P-кодов нет причин (causes), симптомов (symptoms), решений (fixes) в dtc-index — только title_ru. Вся эта информация есть только в situations.
4. **Размер:** 4.7 MB dtc-index нужно оптимизировать для фронтенда
5. **steps/prices** заполнены только для 12.4% ситуаций
6. **191 код без русского описания** (только английское из dsoprea/DtcLookup)

### Рекомендуемый план действий
1. Построить автоматический keyword-маппинг DTC → situations (можно GPT-assisted)
2. Нормализовать severity/urgency в единую шкалу
3. Создать API endpoint: `GET /api/dtc/{code}` → DTC info + matched situations
4. Для фронтенда — lazy-load DTC по префиксу, situations — по category
5. Добавить steps/prices для топ-50 ситуаций по merged_count
