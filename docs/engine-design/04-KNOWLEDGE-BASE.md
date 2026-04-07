# Секция 4: Knowledge Base (4-level resolver)

**Дата:** 2026-04-07
**Статус:** утверждено Петром

---

## Иерархия: 4 уровня

```
Universal (764 ситуации, 36K DTC)
  └→ Brand (58 брендов, до 1233 ситуаций у Hyundai)
      └→ Model (857 моделей)
          └→ Generation (66 поколений)
```

**Принцип:** most specific wins. Ищем сначала в generation, потом model, потом brand, потом universal. Первый найденный — используем.

**Текущее состояние данных (исследование 23-SITUATIONS-SPECIFICITY.md):**
- Universal + Brand — основной уникальный контент сейчас
- Model — пока фильтр brand (подмножество по полю `models`)
- Generation — пока мануальные выдержки (1195 записей)

**Задача:** Наполнить model и generation уровни реальным диагностическим контентом — конкретные двигатели, конкретные цены, конкретные типичные проблемы по поколениям. Пример: "Перегрев двигателя" для BMW X5 E53 (M62 V8) и F15 (N55 I6 turbo) должен иметь РАЗНЫЕ причины, РАЗНЫЕ цены и РАЗНЫЕ маршрутные карты. Сейчас текст одинаковый — это нужно исправить.

Архитектура строится СРАЗУ на 4 уровня. Resolver работает на всех 4 с первого дня.

---

## Что хранится на каждом уровне

### Universal
- 36K DTC кодов: severity, title_ru, system_id, can_drive
- 764 ситуации: quickAnswer, urgency, canDrive, priceRange, commonMistakes
- Базовая информация для любого автомобиля

### Brand (58 брендов)
- DTC: brand-specific notes, common_fix_ru, frequency, severity_override
- 500-1200 ситуаций: реальные болячки бренда, action_ru, priceData, season
- Примеры: "На Chery ACTECO часто ДМРВ", "На Hyundai задиры в цилиндрах", "На Li Auto 12V аккумулятор сел"

### Model (857 моделей)
- DTC: model-specific (на данный момент дублирует brand-level — 0 различий)
- Ситуации: подмножество бренда — только релевантные для конкретной модели
- Фильтрация, а не добавление: Tiggo 8 Pro имеет 450 из 1087 ситуаций Chery

### Generation (66 поколений, 11 брендов)
- DTC: generation-specific dtc.json в подпапке
- Ситуации: уникальные из мануала поколения
- Пример: BMW X5 E53 добавляет +192 уникальных ситуации (DISA клапан M54, отличается от VANOS на F15 N55)
- Это единственный уровень где реально появляется НОВАЯ информация, специфичная для конкретного двигателя/шасси

---

## Что резолвится через KB

### 1. DTC код → описание + серьёзность + исправление
Пришёл P0171 → ищем в:
1. generation dtc-model.json (BMW X5 E53)
2. brand dtc-brand.json (BMW)
3. universal dtc-index.json

Каждый уровень может переопределить severity. Пример: P0171 = info в universal, но может быть warning для модели с известной проблемой.

### 2. DTC код → ситуации
P0171 → ищем ситуации с dtc_codes содержащим P0171.

**Проблема:** только 300 DTC из 36K привязаны к ситуациям (0.8%).

**Стратегия маппинга (три уровня):**
- Алгоритмический: system_id из DTC → category/layers из ситуаций (~70% покрытие)
- Полуавтоматический: таблица SAE J2012 диапазонов (~50 записей)
- Ручная курация: top-200 наиболее частых кодов с diagnostic flow
- Остальные: generic ответ по severity из DTC

### 3. Ситуация → маршрутная карта
Ситуация содержит quickAnswer, causes, solutions, priceRange, canDrive, commonMistakes. Diagnosis Builder берёт это и формирует "что делать" — от бесплатного к дорогому.

### 4. VIN/model/year → отзывные кампании
298 кампаний в оффлайн-базе. **9-уровневая система проверки уже полностью реализована** в основном проекте (D:\transfer4\frontend\screens\recalls.js, 1472 строки): локальная БД + Gazbuka (Росстандарт по VIN) + NHTSA + Porsche + Geely + Toyota/Lexus/GAC + Transport Canada + easy.gost.ru. Flask backend с CORS-прокси. Задача движка — ИНТЕГРИРОВАТЬ существующую систему, не реализовывать заново.

### 5. Brand/model → платформа
32 платформы, 115 моделей. Используется для:
- LTFT калибровки (GM-платформы = ±10%)
- Fallback ситуаций: VW/Skoda/Audi = одна платформа MQB → проблемы общие

---

## Taxonomy mismatch (критическая проблема)

Hierarchy systems (Engine, Transmission, Brakes) НЕ совпадают с situation categories/layers (engine, drivetrain, brakes). Нужна таблица маппинга:

| Hierarchy system_id | Situation category | Situation layers |
|--------------------|--------------------|-----------------|
| engine | engine | engine, fuel |
| transmission | drivetrain | drivetrain |
| brakes | brakes | brakes |
| electrical | electrical | electrical, battery |
| cooling | engine | cooling |
| exhaust | engine | exhaust, emissions |
| suspension | chassis | chassis, suspension |
| steering | chassis | steering |
| body | body | body, interior, exterior |

36 значений system_id в DTC нужно маппить на ~12 categories в ситуациях.

---

## Загрузка KB

### Сервер
- При старте: загружаем universal в память (36K DTC + 764 ситуаций + recalls + platforms = ~15MB)
- По запросу клиента: lazy load brand/model/generation по Vehicle Profile
- Кэшируем в памяти per brand (один клиент = один профиль = одна ветка KB)

### Приложение (offline)
- Universal dtc-index.json (4.9MB) кэшируется один раз при первом запуске
- Используется только для: severity + can_drive + title → DTC lookup и LTFT светофор
- Ситуации offline не нужны — полный отчёт формируется на сервере

---

## DTC Patterns (мульти-DTC)

Комбинации кодов, которые вместе означают конкретный диагноз. Это отдельная таблица/структура, не часть основного DTC-индекса.

| Паттерн | Диагноз | Почему важно |
|---------|---------|--------------|
| P0171 + P0174 | Подсос воздуха | Оба банка бедные = общий подсос (не инжектор одного банка) |
| P0300 + P0301 + P0302 | Катушка зажигания | Два соседних цилиндра = общая катушка (не свечи) |
| P0420 + P0430 | Некачественное топливо | Оба катализатора = не каталитик, а топливо |
| P0171 + P0101 | Неисправный ДМРВ | Бедная смесь + ошибка ДМРВ = ДМРВ |
| P0016 + P0011 | Проблема фазорегулятора | Рассогласование + управление VVT |

20-30 паттернов из YouTube кейсов + профессиональная литература. Заполняются вручную, не алгоритмически.

---

## Известные проблемы с данными

1. **Model DTC дублирует Brand** — на данный момент 0 различий. Можно пропустить model-level для DTC.
2. **Severity занижен** — P0171 (бедная смесь) = info в universal, должно быть warning. Нужна ревизия top-200 кодов.
3. **priceData покрытие** — только 1-2% ситуаций имеют структурированные цены на brand/model уровне. Остальные — текстовый priceRange.
4. **Parts catalog бесполезен** — 0% запчастей с ценами. Не интегрируем в движок.
5. **Recalls без VIN-диапазонов** — только brand/model/year matching, возможны ложные совпадения.
