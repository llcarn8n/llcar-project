# LLCAR — Полное описание системы

> Дата: 2026-04-08 | Ветка: dashboard-v3 | Тесты: 686 | Сервер: 185.55.57.145

---

## Что это такое

LLCAR (Long Life Car) — система диагностики автомобиля, которая через OBD-II адаптер (ELM327) читает данные с машины, анализирует их набором из 103 правил и 764 диагностических ситуаций, и выдаёт владельцу понятный отчёт: что сломано, можно ли ехать, сколько стоит ремонт, что проверить первым.

Система состоит из:
- **Веб-дашборд** (React, llcar.ru/v3/) — полный отчёт с графиками и 3D визуализацией
- **Мобильное приложение** (.NET MAUI, v1.04) — сбор данных + offline светофор
- **Серверный движок** (Django + PostgreSQL, 185.55.57.145) — полная диагностика

---

## Как работает диагностика (от сырых данных до отчёта)

```
Машина (OBD-II + акселерометр + микрофон)
    ↓
Мобильное приложение (собирает и отправляет на сервер)
    ↓
[1] Normalizer — валидация данных, определение режима (город/трасса/стоянка)
    ↓
[2] Feature Extractor — вычисляет метрики (вибрация, крест-фактор, частоты)
    ↓
[3] Fact Generator — создаёт типизированные факты (DTC, LTFT, аномалия, тренд)
    ↓
[4] FuelTrim Analyzer — отдельная подсистема для LTFT/STFT с коррекциями
    ↓
[5] Rule Engine — проверяет 103 JSON + 7 Python правил, считает уверенность
    ↓
[6] Diagnosis Builder — формирует 7-блочный отчёт с объяснениями из KB
    ↓
[7] API V2 — отдаёт JSON клиентам (дашборд, приложение, PDF)
```

---

## Бэкенд: 21 Python модуль, 6857 строк

### Ядро диагностики

**normalizer.py** (355 строк)
Что делает: принимает сырые данные с OBD/акселерометра/микрофона, валидирует (отсекает физически невозможные значения: RPM > 10000, coolant < -50°C), определяет режим движения (idle, city, highway, acceleration, braking, cornering) и контекст двигателя (прогрет ли, сколько минут работает, температура воздуха).
Зависит от: ничего (входная точка).
Выдаёт: NormalizedPacket с режимом, tier (T1/T2/T3), контекстом.

**feature_extractor.py** (136 строк)
Что делает: вычисляет производные метрики из нормализованных данных — общая вибрация (RMS трёх осей), крест-фактор (peak/RMS), соотношение форм, виртуальный источник частоты (двигатель или колесо), дельта LTFT-STFT.
Зависит от: normalizer.
Выдаёт: dict с числовыми метриками.

**facts.py** (432 строки)
Что делает: переводит метрики в семантические факты. 7 типов: DTC_ACTIVE (активная ошибка), LTFT_SEVERITY (коррекция топливной смеси), VIBRATION_ANOMALY (вибрация выше нормы), AUDIO_ANOMALY (шум выше нормы), CUSUM_ALARM (тренд ухудшения), CORRELATION (связь вибрации с оборотами), BASELINE_DRIFT (отклонение от персональной нормы). Каждый факт имеет severity, confidence, tier, детали.
Зависит от: knowledge_base (для DTC lookup), baseline_store (для z-score), fuel_trim_analyzer.
Выдаёт: List[Fact].

**fuel_trim_analyzer.py** (431 строка)
Что делает: анализирует долгосрочную (LTFT) и краткосрочную (STFT) коррекцию топливной смеси. 10 уровней от NORMAL (0-3%) до DANGEROUS (>37%). 5 коррекций: Евро-2/удалённый кат (-7.5% смещение), ГБО (×1.5 допуск), платформа (японские ×0.7 строже, GM ×1.3 мягче), зима <-15°C (-4% допуск), режим (холостой vs 2000 об/мин). Считает потери в рублях. Двойной режим (idle vs load) для локализации проблемы. Двойной банк (bank1 vs bank2) для определения локальной vs общей проблемы.
Зависит от: vehicle_profile (для коррекций).
Выдаёт: severity, тип проблемы, рекомендуемые бесплатные тесты, потери ₽/мес.

**rule_engine.py** (612 строк)
Что делает: оценивает 103 JSON-правила + 7 Python-правил. Каждое правило проверяет набор условий (порог + вес). Уверенность считается из трёх компонентов: совпадение условий (40%), отклонение от порога (40%), повторяемость (20% из БД). Поддерживает контекст: правила подвески не срабатывают на стоянке, топливные — только на прогретом. Cooldown 7 дней после отклонения пользователем. Минимум 3 последовательных срабатывания перед показом. Режим стабильности — снижает уверенность на 50% при переходах.
Зависит от: facts, escalation (для persistence).
Выдаёт: List[RuleResult] с confidence, status (likely/possible/unlikely/clear).

**diagnosis_builder.py** (760 строк)
Что делает: формирует 7-блочный отчёт из результатов правил + базы знаний.
- Блок 1: "Безопасно ли ехать?" (safe/caution/stop)
- Блок 2: Health Score 0-100 по 4 системам + общий, взвешенный по severity×confidence×persistence
- Блок 3: Список диагнозов с объяснениями, маршрутом ремонта, ценами, "частые ошибки"
- Блок 4: Потери топлива (₽/мес, ₽/год)
- Блок 5: Отзывные кампании
- Блок 6: Эскалация (история нарастания проблемы)
- Блок 7: Следующие шаги (рекомендации)

Для объяснений использует 6-уровневую цепочку поиска:
1. Вручную привязанные ситуации (top-50 DTC кодов)
2. Прямое совпадение DTC→ситуация
3. situation_id из правила
4. SAE J2012 диапазон DTC→категория (70% покрытие)
5. Категория + ключевые слова из названия правила
6. Пустой результат

Зависит от: knowledge_base, rule_engine, escalation, recalls_checker.
Выдаёт: полный JSON-отчёт.

**pipeline.py** (404 строки)
Что делает: оркестратор — запускает всю цепочку от сырых данных до отчёта. Также запускает контроль качества данных (_data_quality_check: если режим неизвестен или сенсоры мертвы — скрывает ненадёжные диагнозы), записывает результаты в БД.
Зависит от: всех модулей выше.
Выдаёт: полный отчёт + побочные эффекты (запись в БД).

### База знаний

**knowledge_base.py** (556 строк)
Что делает: 4-уровневый резолвер (universal → brand → model → generation). Загружает DTC-индекс (36,102 кода), ситуации (764 универсальных + бренд-специфичные), DTC-паттерны (20 мульти-кодовых), severity overrides, SAE J2012 диапазоны, ручные маппинги (50 кодов). Фильтрует мусор из мануалов (maintenance записи). Поддерживает ленивую загрузку слоёв модели и поколения.
Данные: 36K DTC кодов, 764+ ситуаций, 20 паттернов, 50 ручных маппингов, 15 SAE J2012 диапазонов.

**vehicle_profile.py** (140 строк, VehicleProfile dataclass)
Что делает: хранит данные о конкретном автомобиле — VIN, марка, модель, поколение, год, тип двигателя (ICE/PHEV/BEV), пробег, платформа, модификации (ГБО, Евро-2, чип-тюнинг). Вычисляет коэффициенты коррекции для FuelTrimAnalyzer.

**vin_decoder.py** (242 строки)
Что делает: декодирует VIN — WMI (первые 3 символа → марка, 80+ кодов), позиция 10 (→ год, 2010-2039), первый символ (→ страна). Валидация: 17 символов, нет I/O/Q.

**recalls_checker.py** (140 строк)
Что делает: проверяет отзывные кампании по марке/модели из offline базы (298 кампаний, 91 бренд). Кэширует JSON через lru_cache.

### Хранение и персистентность

**db.py** (174 строки) — MockDB для тестов + get_cursor() для PostgreSQL.
**db_writers.py** (403 строки) — запись в 7 таблиц: baselines, fact_log, anomaly_scores, dtc_events, diagnostic_persistence, vehicle_profiles, user_feedback.
**db_readers.py** (151 строка) — чтение истории, корреляций.
**baseline_store.py** (232 строки) — Welford online algorithm для персональных базовых линий (MAX_WINDOW=500 с decay). Z-score аномалий.

### Анализ трендов и корреляций

**cusum.py** (170 строк) — CUSUM детектор 3 timescale (short k=3/h=10, medium k=5/h=15, long k=8/h=25). Определяет тренды ↑/→/↓ и degradation_detected.
**correlation_engine.py** (314 строк) — 5 типов batch-корреляций: вибрация↔RPM (опоры двигателя), аудио↔скорость колеса (ступичный подшипник), вибрация+звук в повороте (ШРУС), вибрация на конкретной скорости (дисбаланс колёс), высокочастотный звук↔вибрация (подшипник генератора/кондиционера).
**correlation_runner.py** (205 строк) — Django management command для cron (*/30 минут).
**escalation.py** (232 строки) — 4 уровня эскалации: notice → warning → problem → urgent. Cooldown 7 дней после dismiss. Последовательный счётчик.

### Инструменты

**weight_calibrator.py** (136 строк) — анализ обратной связи пользователей (confirmed/dismissed), расчёт accuracy по правилам, рекомендации по корректировке порогов.
**scripts/extract_thresholds.py** — извлечение числовых порогов из текстов ситуаций (279 порогов из 169 ситуаций).
**scripts/validate_vehicles.py** — валидация годов выпуска в базе автомобилей (нашёл 206 проблем).

### API Endpoints

| Endpoint | Метод | Назначение |
|----------|-------|-----------|
| /api/v2/diagnose/ | POST | Диагностика по отправленным данным |
| /api/v2/diagnose-latest/ | GET | Диагностика по последним данным на сервере |
| /api/v2/feedback/ | POST | Обратная связь (подтвердил/отклонил диагноз) |
| /api/v2/history/ | GET | История здоровья за период |
| /api/v2/correlations/ | GET | Результаты корреляций |
| /api/anomaly/ | GET | Старое V1 API (режим, дорога, системы) |
| /api/data/ | GET | Сырые данные (OBD, accel, audio) |
| /api/anomaly/history/ | GET | История V1 |

---

## Фронтенд: 48 компонентов, 9722 строк

### Страницы

**Dashboard.tsx** (336 строк) — Обзор: Health Score с кольцевой диаграммой, 3D цифровой двойник (Three.js), 4 прибора (обороты, скорость, температура ОЖ, вибрация), чек-лист систем, дельта здоровья vs предыдущий замер, статус-бар (режим, дорога, погода, время).

**Diagnostics.tsx** (431 строка) — Диагностика: карточка V2 с диагнозами и объяснениями, кнопка "Запустить диагностику", 3D сфера вибрации (SmartSphere), NVH спектр аудио, чек-лист систем, подсистемы с wear% и трендами, график здоровья (ECharts), таймлайн, сравнение поездок, рекомендации, отзывные кампании, калибровка, Expert mode (CoherenceMap, CUSUMChart, PseudoOrderPlot).

**Trips.tsx** (281 строка) — Поездки: Leaflet карта с маршрутами (цвет = вибрация), список поездок со статистикой.

### Ключевые компоненты

| Компонент | Строк | Что показывает |
|-----------|-------|----------------|
| DiagnosisCardV2 | 644 | Карточка диагноза: статус, объяснение, параметры со шкалами, freeze frame, roadmap, цена, feedback кнопки |
| SidebarContent | 726 | Боковая панель: ECU статус, DTC коды, напряжение, база знаний |
| VehicleSetup | 601 | Онбординг: выбор марки/модели из 58 брендов, модификации |
| ConnectionWizard | 508 | 5-шаговый визард подключения OBD адаптера с картинками |
| AnomalyTimeline | 380 | ECharts график здоровья по 5 системам за период |
| SmartSphere | 272 | Three.js 3D сфера вибрации X/Y/Z |
| AudioSpectrum | 271 | NVH спектр: 4 зоны (дорога/двигатель/навесное/шум), зоны дождя |
| InstrumentCard | 249 | 4 прибора: RPM, скорость, температура ОЖ, вибрация |
| DigitalTwinCanvas | — | Three.js 3D модель автомобиля с точками состояния |
| PseudoOrderPlot | 311 | Expert: амплитуда вибрации vs RPM (резонансы) |

### Стиль

HUD/sci-fi — тёмная тема, cyan (#00E5FF) и teal (#00D4AA) акценты, glassmorphism (backdrop-filter: blur), шрифты Orbitron (заголовки) + Rajdhani (текст) + Consolas (числа). CSS переменные для тёмной/светлой темы. Утверждён Петром — НЕ менять на flat design.

---

## База данных: PostgreSQL + TimescaleDB

### Таблицы с данными (сервер 185.55.57.145)

| Таблица | Строк | Описание |
|---------|-------|----------|
| accel_windows | 173,854 | Окна вибрации (avg/std/min/max по X/Y/Z, 4.5 сек) |
| audio_windows | 85,576 | Окна аудио (доминантная частота, амплитуда, качество) |
| qtp_packets | 44,663 | Метаданные пакетов (геохеш, дорога, погода, сезон) |
| ecu_7e8 | 25,711 | ECU двигатель (63 PID колонки: RPM, coolant, voltage, LTFT, O2 и др.) |
| ecu_7ea | 17,200 | ECU электромотор (Li Auto PHEV) |
| vehicle_data_packets | 12,352 | Агрегированные пакеты |
| anomaly_scores | 12,333 | Результаты диагностики (health scores, CUSUM, features) |
| ecu_7ef | 7,441 | ECU система охлаждения |
| ecu_7eb | 7,360 | ECU BMS (батарея) |
| fact_log | 5,817 | Сгенерированные факты |
| anomaly_baselines | 60 | Персональные нормы (Welford) |
| diagnostic_persistence | 8 | Эскалация диагнозов |
| correlation_results | 0 | Batch-корреляции (cron настроен) |
| dtc_events | 0 | DTC ошибки (нет реальных DTC с авто) |
| user_feedback | 1 | Обратная связь |
| vehicle_profiles | 1 | Профиль авто |

6 клиентов, 2 активных (b5f2f6... — 26K пакетов, 362f5a... — 12K пакетов).

---

## База знаний: D:\transfer4\knowledge-base (288 GB)

| Ресурс | Объём | Описание |
|--------|-------|----------|
| dtc-index.json | 4.9MB, 36,102 кода | Универсальный словарь DTC (severity, title_ru, system_id, can_drive) |
| situations-universal.json | 3.4MB, 764 ситуации | Диагностические ситуации (quickAnswer, priceRange, urgency) |
| recalls-database.json | 399KB, 298 кампаний | Отзывные по 91 бренду |
| vehicles-ru.json | 7.7MB | 58 брендов, 461 модель, 966 поколений |
| wmi-database.json | 39KB | WMI коды для VIN |
| brands/ | 58 папок | По каждому бренду: ситуации (до 1233), DTC (до 6216), модели |
| models/ | 999 папок | Мануалы (333 полных), DITA структуры, запчасти, обзоры |
| kb.db | 661MB | SQLite: 23,597 записей scraped content |
| hierarchy_ice/phev/bev.json | 3 шаблона | Иерархии систем по типу двигателя |

---

## Правила диагностики

### 103 JSON-правила (threshold_rules.json)

По доменам:
- Двигатель: 15 (перегрев, LTFT lean/rich, misfire, катализатор, EGR)
- Подвеска: 11 (износ, дисбаланс, опоры, ШРУС)
- Электрика: 6 (генератор, батарея, напряжение)
- Аудио: 8 (подшипники, выхлоп, шум)
- Остальные: 63 (DTC-boost правила, PHEV/BEV, сезонные, комбинированные)

Каждое правило: conditions[], context (режим, прогрев, скорость), confidence weights, dtc_codes[], situation_id, min_confidence.

### 7 Python-правил (complex_rules.py)

- Корреляция вибрация↔RPM → опоры двигателя
- Корреляция аудио частота↔скорость колеса → ступичный подшипник
- Click в повороте + вибрация Y → ШРУС
- Вибрация пик на конкретной скорости → дисбаланс
- Высокочастотный звук↔вибрация → подшипник навесного

### 20 мульти-DTC паттернов (dtc_patterns)

P0171+P0174 = подсос воздуха, P0300+P0301+P0302 = катушка, P0420+P0430 = плохое топливо, P0016+P0011 = фазорегулятор, P0016+P0017 = цепь ГРМ, и ещё 15.

---

## Деплой и инфраструктура

| Компонент | Расположение |
|-----------|-------------|
| Frontend V3 (активный) | /var/www/html/django/static/spa-v3/ |
| Frontend V2 (frozen fallback) | /var/www/html/django/static/spa/ |
| Backend | /var/www/html/django/dashboard/diagnostic/ |
| Данные | /var/www/html/django/dashboard/data/ |
| Gunicorn | webadmin с --reload, unix socket |
| Cron | */30 run_correlations |
| Скрипт деплоя | scripts/deploy-v3.sh |
| Скрипт мониторинга | scripts/server-check.sh |

---

## Что из спецификаций реализовано

### 9 секций дизайна (docs/engine-design/01-09)

| Секция | Статус | Детали |
|--------|--------|--------|
| 01: Архитектура | **Реализовано полностью** | Pipeline, dual-layer (app+server), 3 tier |
| 02: Vehicle Profile | **Реализовано** | Dataclass, LTFT corrections, VIN decode, onboarding |
| 03: Data Pipeline + Facts | **Реализовано** | Normalizer, FeatureExtractor, FactGenerator (7 типов), ML-ready features_json |
| 04: Knowledge Base | **Реализовано** | 4-level resolver, DTC patterns, severity overrides, SAE J2012, manual_warning filter |
| 05: FuelTrim Analyzer | **Реализовано** | 10 levels, 5 corrections, dual-regime, dual-bank, loss calc |
| 06: Rule Engine | **Реализовано** | JSON+Python, confidence 3-component, context, cooldown, min triggers, regime stability |
| 07: Correlation Engine | **Реализовано** | 5 batch correlations, cron, correlation→facts pipeline |
| 08: Database Schema | **Реализовано** | 9+ таблиц, TimescaleDB, retention policies |
| 09: Diagnosis Builder + API | **Реализовано** | 7-block report, 6-level KB lookup chain, API V2 endpoints |

### Из Master Roadmap (50 задач)

- Sessions 1-3 (research + design): **все выполнены**
- Session 4 (Plan 1 Foundation): **все 8 модулей выполнены**
- Session 5 (Plans 2-4): **все выполнены** (FuelTrim, RuleEngine, DiagnosisBuilder, API, DB, Escalation, Correlations, CUSUM, Rules, Recalls, Dashboard V3)
- Session 6: **все 11 задач** (V2 default, light theme, Health Score v2, 110 rules, code-splitting, TypeScript strict, CustDev 3 docs)
- Session 7 Plans A-D (36 задач): **30/36 выполнены**
- Session 7 Plans E-H (20 задач): **20/20 выполнены**

### Что НЕ реализовано (из спеков и планов)

| Что | Почему | Когда |
|-----|--------|-------|
| Offline диагностика в приложении | Нужна интеграция API V2 в MAUI | После CustDev 3 |
| Rule weight calibration v2 | Нужно 50+ клиентов с feedback | 3-6 месяцев |
| Population norms | Нужно 50+ клиентов одной модели | 3-6 месяцев |
| ML classifier v3 | Нужно 500+ клиентов | 6-12 месяцев |
| 9-tier recalls (внешние API) | Gazbuka, NHTSA, Porsche — нужны API ключи | По необходимости |
| Полные roadmaps (solutions[]) | В 764 ситуациях solutions пусто | Ручное наполнение |

---

## Тестирование

686 тестов, 0 failures. Покрытие по модулям:

| Модуль | Тестов | Что проверяется |
|--------|--------|-----------------|
| test_knowledge_base | 73 | DTC lookup, situations, 4-level resolve, patterns, range, filter |
| test_diagnosis_builder | 45+ | 7 blocks, health score, escalation, KB lookup chain |
| test_facts | 40+ | 7 типов фактов, генерация, edge cases |
| test_fuel_trim_analyzer | 42 | 10 levels, 5 corrections, dual-regime, dual-bank |
| test_rule_engine | 35 | Confidence, context, cooldown, min triggers |
| test_normalizer | 52 | Validation, regime, SessionTimer, ambient_temp |
| test_pipeline | 18 | Full pipeline, data quality gate |
| test_vin_decoder | 64 | WMI, year codes, country, validation |
| test_extract_thresholds | 32 | Regex patterns for Russian text |
| test_db_writers | 30+ | All write operations |
| test_baseline_store | 20+ | Welford, z-score |
| test_escalation | 26 | 4 levels, cooldown, consecutive |
| test_recalls_checker | 25 | Brand match, severity |
| test_weight_calibrator | 7 | Accuracy, recommendations |
| test_validate_vehicles | 5 | Year validation |
| другие | 70+ | Integration, pipeline_db, correlation, cusum |
