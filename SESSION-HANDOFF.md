# SESSION HANDOFF — 2026-04-07 (Session 4 COMPLETE)

> **Прочитай этот файл + MEMORY.md + указанные spec/plan файлы**
> **GitHub:** https://github.com/llcarn8n/llcar-project
> **Live:** https://llcar.ru/v2/
> **Текущая ветка:** diagnostic-engine
> **Python:** 3.12, запуск тестов: `cd dashboard_build && python -m pytest tests/ -v`
> **Сервер:** 185.55.57.145, SSH через /tmp/llcar_ssh.sh, PostgreSQL + TimescaleDB, Django

---

## ЧТО СДЕЛАНО В СЕССИИ 4

### Фаза 1: Brainstorming + Design (9 секций)

Использовался superpowers:brainstorming. Все секции утверждены Петром.

**Файлы дизайна (docs/engine-design/):**

| Файл | Содержание | Ключевые решения |
|------|-----------|------------------|
| `01-ARCHITECTURE-OVERVIEW.md` | Общая архитектура | Подход C (Rule Engine + ML-Ready). Гибрид: приложение offline + сервер online. Тиры T1/T2/T3. Pipeline: Raw → Normalizer → Features → Facts → Rules → Diagnosis |
| `02-VEHICLE-PROFILE.md` | Профиль автомобиля | VIN через OBD Mode 09. LTFT коррекции: Евро-2 (-7.5%), ГБО (x1.5), GM (x1.3), японские (x0.7), зима (-4%). KB resolution path: generation→model→brand→universal |
| `03-DATA-PIPELINE-FACTS-ML.md` | Pipeline + факты + ML | 5 шагов pipeline. 3 типа фактов (мгновенные/трендовые/корреляционные). ML 3 этапа: Welford → калибровка весов → supervised. features_json пишется ВСЕГДА. User feedback обязателен |
| `04-KNOWLEDGE-BASE.md` | Knowledge Base | 4 уровня (universal→brand→model→generation). Реально уникальный контент на 2 (universal+brand), но архитектура СРАЗУ на 4. DTC patterns (мульти-DTC). Taxonomy mismatch: 36 system_id → ~12 categories. Recalls: интеграция существующей 9-tier системы из D:\transfer4 |
| `05-FUELTRIM-ANALYZER.md` | LTFT/STFT анализатор | Отдельная подсистема, НЕ правило. 10 уровней severity. 5 корректирующих факторов. Кросс-анализ LTFT vs STFT. 8 бесплатных тестов. Калькулятор потерь |
| `06-RULE-ENGINE.md` | Движок правил | Два типа: JSON (100+ простых) + Python (10-15 сложных). Confidence = match(40%) + deviation(40%) + persistence(20%). Статусы: likely/possible/unlikely/clear. Escalation: notice→warning→problem→urgent. Cooldown 7 дней. Версионирование весов v1→v2→v3 |
| `07-CORRELATION-ENGINE.md` | Корреляции accel↔audio | Batch post-trip, не real-time. 5 корреляций: vibration↔RPM, audio↔wheel, turn click, vibration↔speed peak, high-freq bearing. Min 50 points, join ±3 сек |
| `08-DATABASE-SCHEMA.md` | Схема БД | 9 таблиц: vehicle_profiles, anomaly_baselines, anomaly_scores (TimescaleDB), diagnostic_persistence, correlation_results, dtc_events, fact_log, user_feedback, dtc_patterns |
| `09-DIAGNOSIS-BUILDER-API.md` | Отчёт + API | 7 блоков: can_drive, health_scores, diagnoses, fuel_loss, recalls, escalation, next_steps. API v2: POST /diagnose/, /feedback/, GET /history/. 3 формата: JSON→app, JSON→dashboard, PDF→СТО |

### Фаза 2: Исследования агентов (7 файлов)

**Файлы исследований (docs/research-results/):**

| Файл | Агент | Ключевые находки |
|------|-------|------------------|
| `17-SITUATIONS-ANALYSIS.md` | agent-situations | 483K ситуаций в 4 уровнях. 50% автоматизируемы. 94% упоминают OBD. Только 37/764 (5%) привязаны к DTC. Топ-20 правил определены |
| `18-DTC-HIERARCHY-ANALYSIS.md` | agent-dtc | Model/generation DTC дублирует brand (0 различий). 300/36K DTC привязаны к ситуациям (0.8%). P0171→520 ситуаций (размыто). Severity занижен: P0171=info, должен warning. Стратегия маппинга: system_id (70%) + SAE J2012 + top-200 курация |
| `19-KNOWLEDGE-BASE-ANALYSIS.md` | agent-kb | Brand ситуации: 56-86% наследуют universal. Generation: BMW X5 E53 +192 уникальных. Recalls: 298 кампаний, без VIN-диапазонов. Parts catalog: 0% с ценами — бесполезен. Taxonomy mismatch: hierarchy ≠ categories |
| `20-ARCHITECTURE-REVIEW.md` | agent-architecture | P0: Vehicle Profile + LTFT Analyzer + Typed Facts. LTFT = подсистема. Корреляции = batch. Multi-DTC паттерны. Freeze Frame. False positives: cooldown + min triggers + regime stability + quality gate + cold start filter |
| `21-VIN-DECODE-RESEARCH.md` | agent-vin-decode | NHTSA бесполезен для РФ (~15%). Нет API для китайских марок. VDS таблицы для 33 брендов. Лучшая стратегия: VDS offline (55-60%) → OBD PID 51 + MAF displacement (+15%) → CalID crowdsource (95%+) → короткий список (100%) |
| `22-VIN-OBD-READING.md` | agent-vin-obd | VIN уже читается в app v1.04 (Mode 09 PID 02). Баги: хардкод CAN ID (7E8/7E0, пропускает 7EA-7EF), iOS парсер хрупкий. Fuel Type PID 0x51 работает на Li Auto. 80% китайских (2018+) поддерживают Mode 09. 15% клонов ELM327 теряют кадры — retry уже есть |
| `23-SITUATIONS-SPECIFICITY.md` | agent-situations-specificity | 4-level иерархия ситуаций — фикция по контенту. Model = фильтр brand (0% unique). Generation "уникальные" = мануальные выдержки. 443 shared ID между E53/E70/F15 — 100% идентичный текст. НО: строим 4 уровня, будем наполнять |

### Фаза 3: Plan 1 Foundation — ВЫПОЛНЕН ✅

**Plan файл:** `docs/superpowers/plans/2026-04-07-diagnostic-engine-plan1-foundation.md`
**8 tasks, 159 тестов, все pass.**

**Созданные файлы кода:**

```
dashboard_build/
├── schema_anomaly.sql                    ← РАСШИРЕН: +6 таблиц, +DTC patterns, +escalation поля
├── anomaly_engine.py                     ← НЕ ТРОГАЛИ, существовал до нас (562 строки)
├── diagnostic/
│   ├── __init__.py                       ← пустой
│   ├── vehicle_profile.py               ← VehicleProfile dataclass, LTFT corrections, KB path
│   ├── knowledge_base.py                ← KnowledgeBase 4-level resolver, DTC patterns, taxonomy
│   ├── normalizer.py                    ← NormalizedPacket, DrivingRegime (!), EngineContext, validation
│   ├── feature_extractor.py             ← extract_features(): vibration, crest, fuel trim, virtual freq
│   ├── facts.py                         ← FactType enum (14), Fact dataclass, FactGenerator
│   ├── baseline_store.py               ← RegimeBaseline (Welford), BaselineStore, MAX_WINDOW=500
│   └── pipeline.py                      ← DiagnosticPipeline.process(raw) → {packet, features, facts, ...}
├── tests/
│   ├── __init__.py
│   ├── test_vehicle_profile.py          ← 17 тестов
│   ├── test_knowledge_base.py           ← 35 тестов
│   ├── test_normalizer.py               ← 31 тест
│   ├── test_feature_extractor.py        ← 7 тестов
│   ├── test_facts.py                    ← 20 тестов
│   ├── test_baseline_store.py           ← 34 теста
│   └── test_pipeline.py                ← 15 тестов
└── data/
    ├── dtc-index-sample.json            ← 5 DTC кодов для тестов
    └── situations-sample.json           ← 3 ситуации для тестов
```

**Детали каждого модуля:**

#### vehicle_profile.py
- `VehicleProfile` dataclass: client_hash, brand, model, year (required), vin, generation, engine_code, engine_type='ice', mileage_km=0, platform, modifications={}
- `ltft_base_offset` property: -7.5 если euro2_removed_cat, иначе 0.0
- `ltft_tolerance_mult` property: ГБО=1.5 (приоритет), GM_*=1.3, японские=0.7, default=1.0
- `kb_resolution_path` property: [generation, model, brand, universal] most-specific-first
- `to_db_row()`, `from_db_row()` — сериализация для БД
- JAPANESE_BRANDS = frozenset: toyota, honda, mazda, subaru, nissan, mitsubishi, suzuki, lexus, infiniti, acura

#### knowledge_base.py
- `KnowledgeBase(dtc_index_path, situations_path)` — загружает universal
- `add_brand_layer(brand, dtc_path, situations_path)` — brand overlay
- `resolve_dtc(code, brand)` → dict or None (brand overrides universal)
- `find_situations_by_dtc(code, brand)` → list
- `find_situations_by_category(category, brand)` → list
- `find_situations_by_system_id(system_id, brand)` → list (через SYSTEM_TO_CATEGORY)
- `match_dtc_pattern(codes)` → dict or None (subset match, highest boost)
- `system_id_to_categories(system_id)` → list (static)
- SYSTEM_TO_CATEGORY: 17 system_ids → 7 categories
- DEFAULT_DTC_PATTERNS: 6 паттернов (air_leak, rich_mixture, ignition_coil, bad_fuel, maf_failure, vvt_problem)

#### normalizer.py
- **ВАЖНО:** Использует `DrivingRegime`, НЕ `Regime`!
- `DrivingRegime` enum: IDLE, CITY, HIGHWAY, ACCELERATION, BRAKING, CORNERING, UNKNOWN
- `EngineContext` dataclass: warm (coolant>80), cold_start (coolant<60), minutes_running, ambient_temp
- `NormalizedPacket` dataclass: все OBD/accel/audio поля + regime + engine_context + tier
- `normalize_packet(raw: dict) → NormalizedPacket`
- Validation bounds: rpm 0-10000, speed 0-300, coolant -50..250, voltage 0-25, ltft/stft -100..100
- Tier: T3 (accel+audio), T2 (accel), T1 (OBD only)

#### feature_extractor.py
- `extract_features(packet: NormalizedPacket) → dict`
- Features: total_vibration (RMS), crest_factor_{x,y,z}, shape_ratio_{x,y,z}, a{x,y,z}_range, ltft_abs, fuel_trim_delta, fuel_trim_sign_match, vibration_speed_ratio, virtual_freq_source, virtual_freq_order
- TIRE_DIAMETER = 0.63

#### facts.py
- `FactType` enum: 14 типов (DTC_ACTIVE, LTFT_SEVERITY, OVERHEAT, LOW_VOLTAGE, VIBRATION_ANOMALY, AUDIO_ANOMALY, THRESHOLD_BREACH, CUSUM_ALARM, BASELINE_DRIFT, LTFT_TREND, DEGRADATION, VIBRATION_RPM_CORRELATION, AUDIO_WHEEL_CORRELATION, MULTI_DTC_PATTERN)
- `Fact` dataclass: type, timestamp, value=0.0, severity='ok', confidence=1.0, context={}, source_tier='T1', details={}
- `FactGenerator(vehicle_profile, knowledge_base)` — generate(packet, features) → List[Fact]
- Генерирует: DTC facts (severity mapping), Multi-DTC patterns, Overheat (>105°C → danger), Low voltage (<13V при rpm>1000 → warning)

#### baseline_store.py
- `RegimeBaseline` dataclass: count, mean, m2, min_val, max_val
- Welford online algorithm с freeze при count >= MAX_BASELINE_WINDOW (500)
- z_score: 0.0 если count < MIN_BASELINE_SAMPLES (30)
- to_dict() / from_dict() для сериализации
- `BaselineStore`: dict[(regime_str, feature)] → RegimeBaseline
- get(), update(), is_ready() (KEY_FEATURES: az_std, total_vibration), confidence()
- to_db_rows(client_hash), from_db_rows(rows)

#### pipeline.py
- `DiagnosticPipeline(vehicle_profile, dtc_index_path, situations_path, baselines)`
- `process(raw_data: dict) → dict` с ключами: packet, features, facts, tier, regime, baseline_ready, baseline_confidence
- Шаги: normalize → extract features → collect baseline features (numeric + OBD) → update baselines → generate facts

---

## СЛЕДУЮЩИЙ ШАГ: Plan 2 — Rules & Diagnosis

**Plan файл:** `docs/superpowers/plans/2026-04-07-diagnostic-engine-plan2-rules-diagnosis.md`

**5 tasks:**

| # | Task | Файлы | Зависит от |
|---|------|-------|-----------|
| 1 | FuelTrim Analyzer | `diagnostic/fuel_trim_analyzer.py` + тесты | VehicleProfile |
| 2 | Rule Engine + JSON rules | `diagnostic/rule_engine.py` + `rules/threshold_rules.json` + тесты | facts, features, baselines |
| 3 | Diagnosis Builder | `diagnostic/diagnosis_builder.py` + тесты | KB, tasks 1-2 |
| 4 | Integration (full_diagnose) | Modify `diagnostic/pipeline.py` + тесты | Tasks 1-3 |
| 5 | API Views | `diagnostic/api_views.py` + тесты | Task 4 |

**Что будет после Plan 2:** POST /api/v2/diagnose/ → полный 7-блочный отчёт.

**Что останется на Plan 3 (Advanced):**
- Correlation Engine (batch accel↔audio)
- ML-ready layer (fact_log запись в DB, user_feedback)
- Recalls интеграция (существующая 9-tier система)
- Escalation с DB persistence (diagnostic_persistence)
- Baseline persistence в DB (anomaly_baselines)
- Деплой на сервер (schema + код + gunicorn restart)

---

## GIT КОММИТЫ СЕССИИ 4

```
Дизайн и исследования:
  8276d9f - Diagnostic engine analysis: 4 research docs (17-20)
  9a69949 - VIN research: decode APIs (21) + OBD reading (22)
  13f8105 - Engine design: sections 1-3
  0cd393b - Engine design: sections 4-5
  16806f0 - Engine design: section 6
  6ad07e8 - Engine design: section 7
  04a07ce - Engine design: sections 8-9
  e66ce4b - Spec self-review fixes
  98b599e - Fix KB: restore 4-level hierarchy
  b8aea4b - Research: situations specificity (23)

Планы:
  3bb6521 - Plan 1: Foundation
  4ccebe5 - Session 4 handoff
  e831170 - Plan 2: Rules & Diagnosis

Plan 1 implementation:
  a549014 - feat: DB schema v2
  11184df - feat: VehicleProfile (17 tests)
  5d7ee1a - feat: KnowledgeBase (35 tests)
  9b1693d - feat: Normalizer (31 tests)
  55d6d8d - feat: Feature Extractor (7 tests)
  f213fdb - feat: Typed Facts (20 tests)
  49d6119 - feat: BaselineStore (34 tests)
  4d73dad - feat: Pipeline (15 tests)
```

---

## КЛЮЧЕВЫЕ ПРЕДУПРЕЖДЕНИЯ ДЛЯ СЛЕДУЮЩЕЙ СЕССИИ

1. **DrivingRegime, НЕ Regime** — normalizer.py использует `DrivingRegime` enum. Все модули импортируют оттуда.
2. **Тесты запускать из dashboard_build:** `cd dashboard_build && python -m pytest tests/ -v`
3. **159 тестов должны pass** перед любыми изменениями
4. **schema_anomaly.sql НЕ задеплоен** на сервер — таблицы ещё не созданы
5. **Recalls система уже реализована** в D:\transfer4\frontend\screens\recalls.js (1472 строки) — интегрировать, не делать заново
6. **anomaly_engine.py** (старый) — НЕ трогать, он может использоваться текущим dashboard. Новый движок в diagnostic/
7. **Режимы сессии: MAKE NO MISTAKES + Senior Engineer** — оба активированы

---

## DEPLOY (когда будет готово)

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard"
rm -rf dist && npm run build
eval $(ssh-agent -s) && ssh-add /tmp/id_ed25519
/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa/
/tmp/llcar_ssh.sh "chmod -R a+r /var/www/html/django/static/spa/ && find /var/www/html/django/static/spa/ -type d -exec chmod a+x {} \;"
```

Деплой Python кода (diagnostic модуль):
```bash
# Копировать модуль
/tmp/llcar_scp.sh -r dashboard_build/diagnostic webadmin@185.55.57.145:/var/www/html/django/dashboard_build/
# Копировать schema
/tmp/llcar_scp.sh dashboard_build/schema_anomaly.sql webadmin@185.55.57.145:/tmp/
# Создать таблицы
/tmp/llcar_ssh.sh "psql -U postgres -d vehinfo -f /tmp/schema_anomaly.sql"
# Перезапустить gunicorn
/tmp/llcar_ssh.sh "sudo systemctl restart gunicorn"
```
