# Diagnostic Engine — Plan 2: Rules & Diagnosis

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить к фундаменту (Plan 1) правила диагностики, FuelTrim Analyzer, Diagnosis Builder и API v2. После этого плана сервер полноценно диагностирует и возвращает отчёт.

**Architecture:** Новые модули в `dashboard_build/diagnostic/`. FuelTrim Analyzer — отдельная подсистема. Rule Engine — гибрид JSON + Python правил. Diagnosis Builder формирует 7-блочный отчёт. Django views для API.

**Tech Stack:** Python 3.12, Django, существующие модули из Plan 1.

**Depends on Plan 1:** pipeline.py, facts.py, knowledge_base.py, vehicle_profile.py, baseline_store.py, normalizer.py (DrivingRegime!), feature_extractor.py. Все 159 тестов pass.

**Spec:** `docs/engine-design/05-FUELTRIM-ANALYZER.md`, `06-RULE-ENGINE.md`, `09-DIAGNOSIS-BUILDER-API.md`

---

## File Structure

```
dashboard_build/diagnostic/
├── (Plan 1 — уже существует)
├── fuel_trim_analyzer.py      ← НОВЫЙ: LTFT/STFT подсистема
├── rule_engine.py             ← НОВЫЙ: правила + confidence + escalation
├── rules/                     ← НОВЫЙ: JSON правила
│   ├── __init__.py
│   ├── threshold_rules.json   ← 20+ простых пороговых правил
│   └── complex_rules.py       ← Python правила для сложной логики
├── diagnosis_builder.py       ← НОВЫЙ: 7-блочный отчёт
└── api_views.py               ← НОВЫЙ: Django views для API v2
```

---

## Task 1: FuelTrim Analyzer

**Files:**
- Create: `dashboard_build/diagnostic/fuel_trim_analyzer.py`
- Create: `dashboard_build/tests/test_fuel_trim_analyzer.py`

**Spec:** `docs/engine-design/05-FUELTRIM-ANALYZER.md`

**Реализовать:**

FuelTrimAnalyzer class:
- `__init__(vehicle_profile)` — загружает коэффициенты из VehicleProfile (ltft_base_offset, ltft_tolerance_mult)
- `analyze(ltft, stft, regime, coolant_temp, ambient_temp) → FuelTrimFact`

Алгоритм:
1. Применить сдвиг нуля (euro2: -7.5%)
2. Применить множитель допуска (ГБО: /1.5, GM: /1.3, японские: /0.7)
3. Применить зимнюю коррекцию (ambient < -15°C: -4%)
4. Модуль скорректированного → найти уровень в таблице

SEVERITY_TABLE (10 уровней):
- 0-3: NORMAL, 3-5: NORMAL, 5-7: BORDERLINE, 7-10: ELEVATED
- 10-15: PROBLEM, 15-25: DEFECT, 25-37: CRITICAL, >37: DANGER

Кросс-анализ LTFT vs STFT:
- Оба в плюс → lean (бедная)
- Оба в минус → rich (богатая)
- LTFT высокий, STFT болтается → chronic
- LTFT ок, STFT скачет → sensor

Рекомендуемые тесты (список строк) по типу проблемы.

Калькулятор потерь: ltft% × base_consumption × fuel_price × monthly_km / 100 / 100

**Тесты (минимум 15):**
- Нормальная коррекция 3% → NORMAL
- Проблемная 12% → PROBLEM
- Критичная 30% → CRITICAL
- Опасная 40% → DANGER
- Euro2 коррекция: LTFT -12% → corrected 4.5% → NORMAL
- ГБО: LTFT 18% → corrected 12% → PROBLEM (не DEFECT)
- GM платформа: 12% → corrected ~9.2% → ELEVATED (не PROBLEM)
- Японская марка: 8% → corrected ~11.4% → PROBLEM
- Зимняя коррекция: ambient=-20, ltft=-8% → corrected ~0% → NORMAL
- Кросс: оба в плюс → lean
- Кросс: оба в минус → rich
- Калькулятор: 15%, расход 10, цена 55, 1500 км → ~1237 руб
- Тесты для lean → содержат "крышка маслозаливной"
- Тесты для rich → содержат "ДМРВ"

- [ ] Step 1: Написать тесты
- [ ] Step 2: Запустить → fail
- [ ] Step 3: Реализовать FuelTrimAnalyzer
- [ ] Step 4: Запустить → pass
- [ ] Step 5: Full suite → all pass
- [ ] Step 6: Commit

---

## Task 2: Rule Engine — threshold rules (JSON)

**Files:**
- Create: `dashboard_build/diagnostic/rule_engine.py`
- Create: `dashboard_build/diagnostic/rules/__init__.py`
- Create: `dashboard_build/diagnostic/rules/threshold_rules.json`
- Create: `dashboard_build/tests/test_rule_engine.py`

**Spec:** `docs/engine-design/06-RULE-ENGINE.md`

**Реализовать:**

RuleCondition dataclass: fact_type, operator ('>','<','==','z>','in','between'), threshold, weight, context (optional dict)

DiagnosticRule dataclass: name, display, tier, conditions (list), min_confidence=40, cooldown_minutes=10080 (7 дней), situation_id (optional), dtc_codes (list)

RuleEngine class:
- `__init__()` — загружает правила из JSON + Python
- `load_json_rules(path)` — загрузка из threshold_rules.json
- `evaluate_rule(rule, facts, features, baselines, regime) → dict` с confidence 0-100, status (likely/possible/unlikely/clear)
- `run_all(facts, features, baselines, regime) → List[dict]` — все правила, sorted by confidence desc

Confidence scoring (3 компонента):
- match_score (40%): сколько условий выполнено с учётом весов
- deviation_score (40%): насколько превышен порог
- persistence_score (20%): placeholder = 1 (будет из DB в Plan 3)

threshold_rules.json — минимум 15 правил:
- worn_suspension (T2): az_std > 3.0, total_vibration > 4.0, az_range > 8.0
- engine_overheating (T1): coolant > 100, rpm > 1200
- alternator_failure (T1): voltage < 13.0, rpm > 1000
- wheel_imbalance (T2): az_std z>2.0, total_vibration > 3.0, speed > 60
- exhaust_leak (T3): dominant_freq < 80, dominant_amp z>2.0
- bearing_wear (T3): dominant_freq > 200, dominant_amp z>2.5
- engine_mount_wear (T2+T3): az_std z>2.0, dominant_amp z>2.0, rpm > 1500
- fuel_lean (T1): ltft_abs > 10
- fuel_rich (T1): ltft_abs > 10 (negative)
- low_battery (T1): voltage < 12.0
- high_idle (T1): rpm > 1100, speed < 3
- coolant_sensor (T1): coolant < -20
- oil_pressure_low (T1): placeholder
- catalyst_degradation (T1): placeholder
- misfire (T1): placeholder

**Тесты (минимум 12):**
- Healthy packet → all rules confidence < 40 (clear/unlikely)
- High az_std=5.0 → worn_suspension likely (confidence > 60)
- Coolant=108 → engine_overheating likely
- Voltage=12.0, rpm=2000 → alternator_failure possible/likely
- Multiple rules can fire simultaneously
- JSON rules load correctly (count >= 15)
- Rule with no matching facts → confidence 0

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать RuleEngine + JSON rules
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 3: Diagnosis Builder — 7-блочный отчёт

**Files:**
- Create: `dashboard_build/diagnostic/diagnosis_builder.py`
- Create: `dashboard_build/tests/test_diagnosis_builder.py`

**Spec:** `docs/engine-design/09-DIAGNOSIS-BUILDER-API.md`

**Реализовать:**

DiagnosisBuilder class:
- `__init__(knowledge_base, vehicle_profile)`
- `build_report(pipeline_result, rule_results, fuel_trim_result=None, baseline_store=None) → dict`

7 блоков отчёта:

1. **can_drive**: safe/caution/stop — определяется по худшему факту (danger→stop, critical→caution, warning→caution, ok→safe)

2. **health_scores**: overall, suspension, engine, electrical, audio (0-100). Берутся из rule_results — если правило сработало по системе, score = 100 - avg_confidence.

3. **health_trends**: placeholder → / ↑ / ↓ (будет из CUSUM в Plan 3)

4. **diagnoses**: список диагнозов. Каждый: rule_name, display, status, confidence, explanation (из KB quickAnswer), evidence (из фактов), repair_roadmap (из KB solutions), common_mistakes, can_drive, price_range, situation_id

5. **fuel_loss**: monthly_rub, yearly_rub (из FuelTrimAnalyzer, если есть)

6. **recalls**: placeholder (интеграция в Plan 3)

7. **next_steps**: приоритизированные рекомендации (из diagnoses)

Плюс: confidence, baseline_status, rule_version='v1'

**Тесты (минимум 10):**
- Healthy → can_drive=safe, no diagnoses
- Overheat fact → can_drive=stop
- DTC warning → can_drive=caution
- Rule fired → appears in diagnoses with explanation
- Fuel loss calculated correctly
- Empty rules → overall health 100
- Multiple rules → sorted by confidence

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать DiagnosisBuilder
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 4: Integration — Pipeline + Rules + Diagnosis в одном вызове

**Files:**
- Modify: `dashboard_build/diagnostic/pipeline.py` — добавить `full_diagnose(raw_data) → report`
- Create: `dashboard_build/tests/test_integration.py`

**Реализовать:**

Расширить DiagnosticPipeline:
- `__init__` дополнительно создаёт FuelTrimAnalyzer, RuleEngine, DiagnosisBuilder
- `full_diagnose(raw_data: dict) → dict` — полный цикл:
  1. process(raw_data) → pipeline_result
  2. fuel_trim_analyzer.analyze(...) если есть LTFT
  3. rule_engine.run_all(facts, features, baselines, regime)
  4. diagnosis_builder.build_report(...)
  5. Return полный отчёт

**Тесты (минимум 8):**
- Healthy packet → can_drive=safe, health_scores all > 80
- Packet with DTC P0171 → diagnoses non-empty
- Packet with coolant=110 → can_drive=stop
- Packet with LTFT=15% → fuel_loss present
- Packet with high vibration → suspension diagnosis
- Multiple packets → baselines accumulate
- Result contains all 7 blocks (can_drive, health_scores, diagnoses, fuel_loss, recalls, next_steps, baseline_status)

- [ ] Step 1: Написать тесты
- [ ] Step 2: Расширить pipeline.py
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 5: API Views — Django endpoints

**Files:**
- Create: `dashboard_build/diagnostic/api_views.py`
- Create: `dashboard_build/tests/test_api_views.py`

**Реализовать:**

Три view-функции (Django function-based views, без DRF для простоты):

1. `diagnose_view(request)` — POST /api/v2/diagnose/
   - Парсит JSON body: client_hash, vehicle_profile (optional), data, dtc_codes, tier
   - Создаёт/загружает VehicleProfile
   - Создаёт DiagnosticPipeline
   - Для каждого пакета в data: full_diagnose()
   - Возвращает JsonResponse с последним отчётом

2. `feedback_view(request)` — POST /api/v2/feedback/
   - Парсит: client_hash, rule_name, diagnosis_time, action, comment
   - Пока: логирует в fact_log (без DB, print/log)
   - Возвращает JsonResponse({success: True})

3. `history_view(request)` — GET /api/v2/history/
   - Параметры: client_hash, period (7d/30d/90d)
   - Пока: placeholder — возвращает пустой массив
   - Будет реализовано когда подключим DB в Plan 3

URL patterns (для добавления в Django urls.py на сервере):
```python
urlpatterns = [
    path('api/v2/diagnose/', diagnose_view),
    path('api/v2/feedback/', feedback_view),
    path('api/v2/history/', history_view),
]
```

**Тесты (минимум 6):**
- diagnose_view: valid request → 200, contains can_drive
- diagnose_view: missing client_hash → 400
- diagnose_view: GET method → 405
- feedback_view: valid → 200, success=True
- feedback_view: missing action → 400
- history_view: GET → 200, returns list

Использовать Django test client или просто unittest с mock request.

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать views
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Summary

| Task | Что создаём | Зависит от |
|------|------------|-----------|
| 1 | FuelTrim Analyzer | VehicleProfile (Plan 1) |
| 2 | Rule Engine + JSON rules | facts, features, baselines (Plan 1) |
| 3 | Diagnosis Builder | KB, VehicleProfile, facts (Plan 1) |
| 4 | Integration (full_diagnose) | Tasks 1-3 |
| 5 | API Views | Task 4 |

**После Plan 2:** сервер принимает POST /api/v2/diagnose/ → возвращает полный 7-блочный отчёт с диагнозами, health scores, fuel loss, маршрутными картами ремонта.

**Plan 3 (Advanced):** Correlation Engine batch, ML-ready layer, recalls integration, escalation с DB persistence, деплой на сервер.
