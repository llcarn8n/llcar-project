# Архитектурный ревью диагностического движка LLCAR

**Дата:** 2026-04-07
**Автор:** agent-architecture (автоматический анализ)
**Входные данные:** anomaly_engine.py, schema_anomaly.sql, YouTube synthesis, CustDev data

---

## 1. DATA FLOW: Normalizer → Facts → Rules → Diagnosis

**Текущее состояние:** Данные идут напрямую: raw features → z-score → anomaly_score → diagnostic_rules. Нет промежуточного слоя "фактов".

**Проблема:** Предложенная архитектура вводит "Fact Store", но не определяет, что такое "факт". Это критический пробел. Без чёткой модели фактов вся система рассыпается.

**Что такое "факт" в контексте диагностики автомобиля:**
Факт — это нормализованное утверждение о состоянии с временной меткой. Примеры:
- `LTFT_BANK1_HIGH(value=12.3%, severity=PROBLEM, regime=IDLE, timestamp=...)`
- `VIBRATION_Z_ANOMALY(z_score=3.2, regime=HIGHWAY, speed=95, timestamp=...)`
- `DTC_ACTIVE(code=P0171, ecu=7E8, timestamp=...)`
- `AUDIO_FREQ_MATCH_RPM(freq=45Hz, rpm=2700, correlation=0.87, timestamp=...)`

**Варианты:**

| Вариант | Описание | Трудоёмкость | Риск | Плюсы |
|---------|----------|-------------|------|-------|
| A. Без фактов | Оставить как сейчас: raw → score → rules | Минимум | Невозможно масштабировать до 100+ правил | Быстро |
| B. Typed facts (dataclass) | `@dataclass Fact(type, value, severity, context, timestamp)` | 2-3 дня | Низкий | Структурированность, отладка, логирование |
| C. Полный Fact Store (Rete-like) | Facts с индексацией, pattern matching, forward chaining | 2-3 недели | Overengineering | Масштабируется до 1000+ правил |

**Рекомендация: Вариант B.** Typed facts через dataclass + простой список фактов с фильтрацией по типу. Факты делятся на:
- **Instant facts** (одно наблюдение): DTC, пороговый z-score, показание датчика
- **Trend facts** (несколько наблюдений): CUSUM alarm, деградация, тренд LTFT
- **Correlation facts** (несколько сенсоров): accel↔audio совпадение, freq↔RPM корреляция

**Пропущенный шаг в архитектуре:** Между Normalizer и Facts нужен **Feature Extractor** (compute_derived_features в текущем коде). Правильный pipeline:

```
Raw Data → Normalizer → Feature Extractor → Fact Generator → Fact Store → Rule Engine → Diagnosis Builder
```

---

## 2. RULE ENGINE DESIGN

**Текущее состояние:** 7 правил как Python objects `DiagnosticRule` с conditions `[(feature, operator, threshold, weight)]`. Evaluate считает match_score + deviation_score + persistence_score.

**Проблема:** Текущий DiagnosticRule — это по сути простой threshold checker. Он не может выразить:
- Условия вида "LTFT > 10% И STFT < -5% НА ОДНОМ банке" (корреляция параметров)
- "Вибрация Z растёт с RPM" (зависимость от другого параметра)
- "P0171 + P0174 одновременно = подсос воздуха, а не проблема инжектора" (мульти-DTC)
- "Только когда прогрет > 80C и прошло > 10 минут" (контекст)
- Коррекции LTFT для ГБО/Евро-2/зима (модификация порогов)

**Варианты:**

| Вариант | Описание | Трудоёмкость | Масштабируемость | Обслуживание |
|---------|----------|-------------|------------------|--------------|
| A. Python classes (расширить текущее) | Каждое правило — класс с `evaluate()` | 1 неделя | 50-100 правил | Каждое правило — код, нужен деплой |
| B. JSON rules + interpreter | Rules в JSON/JSONB, Python-интерпретатор парсит | 2 недели | 200+ правил | Правила обновляются без деплоя |
| C. DSL (домен-специфичный язык) | Текстовый DSL типа `WHEN ltft_bank1 > 10% AND regime == IDLE THEN ...` | 3-4 недели | 500+ правил | Самый гибкий, но нужен парсер |

**Рекомендация: Гибрид A+B.**

Оставить Python-класс `DiagnosticRule` как базовый, но расширить его capabilities:

```python
@dataclass
class RuleCondition:
    fact_type: str          # 'LTFT_HIGH', 'VIBRATION_ANOMALY', 'DTC_ACTIVE'
    operator: str           # '>', '<', '==', 'z>', 'in', 'between', 'trend>'
    threshold: Any
    weight: float
    context: Dict = None    # {'regime': 'idle', 'engine_warm': True}

@dataclass  
class DiagnosticRule:
    name: str
    display: str
    tier: str               # 'T1', 'T2', 'T3'
    conditions: List[RuleCondition]
    corrections: Dict       # {'lpg': {'ltft_threshold': '+10'}, 'euro2': ...}
    min_confidence: int     # minimum to trigger
    cooldown_minutes: int   # anti-spam
    situation_id: str       # link to situations-universal.json
    dtc_codes: List[str]    # associated DTC codes
```

"Hardcoded" Python правила для сложной логики (корреляции, тренды). JSON-правила в БД для простых threshold rules (которых большинство). Интерпретатор один и тот же.

**Почему не чистый JSON:** Правила типа "вибрация Z коррелирует с RPM через гармоники кратные engine_base_freq" невозможно выразить в JSON без Тьюринг-полного интерпретатора. А Тьюринг-полный интерпретатор JSON — это просто плохой Python.

**Почему не DSL:** У вас 5 клиентов и один разработчик. DSL — это проект на месяц. Вы его не окупите.

---

## 3. LTFT/STFT INTERPRETATION

**Текущее состояние:** В anomaly_engine.py нет LTFT/STFT вообще. Они есть только в qtp_packets на сервере, но движок их не использует.

**Проблема:** LTFT/STFT — это ГЛАВНЫЙ диагностический параметр ДВС. YouTube-таблица с 10 уровнями — это по сути готовая экспертная система для топливной коррекции. Она должна быть центральной частью движка, а не "ещё одним правилом".

**Рекомендация: Выделенная подсистема FuelTrimAnalyzer.**

```python
class FuelTrimAnalyzer:
    """Dedicated LTFT/STFT interpretation subsystem."""
    
    SEVERITY_TABLE = [
        (3,   'NORMAL',    'Норма'),
        (5,   'NORMAL',    'Норма, мониторить'),
        (7,   'BORDERLINE','Пограничная зона'),
        (10,  'ELEVATED',  'Верхняя граница'),
        (15,  'PROBLEM',   'Проблема'),
        (25,  'DEFECT',    'Значительный дефект'),
        (37,  'CRITICAL',  'Критично'),
        (999, 'DANGER',    'Нельзя ехать'),
    ]
    
    def __init__(self, vehicle_profile):
        self.corrections = self._build_corrections(vehicle_profile)
    
    def _build_corrections(self, profile):
        base = 0.0
        tolerance_mult = 1.0
        if profile.get('lpg'):
            tolerance_mult = 1.5   # +-15-20% vs +-10%
        if profile.get('euro2_removed_cat'):
            base -= 7.5           # -5...-10%
        if profile.get('platform') in GM_PLATFORMS:
            tolerance_mult = max(tolerance_mult, 1.3)
        if profile.get('brand') in JAPANESE_BRANDS:
            tolerance_mult = min(tolerance_mult, 0.7)
        return {'base_offset': base, 'tolerance_mult': tolerance_mult}
    
    def analyze(self, ltft, stft, regime, coolant_temp, ambient_temp):
        corrected = abs(ltft - self.corrections['base_offset'])
        corrected /= self.corrections['tolerance_mult']
        if ambient_temp is not None and ambient_temp < -15:
            corrected -= 4.0
        severity = self._classify(corrected)
        cross_diagnosis = self._cross_check(ltft, stft, regime)
        return FuelTrimFact(
            ltft=ltft, stft=stft,
            corrected_value=corrected,
            severity=severity,
            cross_diagnosis=cross_diagnosis,
            suggested_tests=self._suggest_tests(severity, cross_diagnosis),
        )
```

**Почему отдельная подсистема, а не правило:**
1. LTFT/STFT требует vehicle profile (марка, модификации) — это не просто threshold
2. 5 корректирующих факторов перемножаются — это калибровка, не условие
3. Кросс-анализ LTFT vs STFT (одинаковый знак = смесь, разный = система управления)
4. Привязка к бесплатным тестам (уникальное value proposition)
5. Режим замера (ХХ vs 2000 RPM) даёт разную диагностику

---

## 4. CORRELATION ENGINE (accel↔audio)

**Текущее состояние:** Корреляция accel↔audio = 0. Движки работают полностью независимо.

**Какие корреляции реально диагностически значимы:**

| Корреляция | Что выявляет | Метод | Приоритет |
|------------|-------------|-------|-----------|
| vibration_z ~ f(RPM) | Подушки двигателя, дисбаланс | Линейная регрессия Z_std vs RPM | P0 |
| audio_freq ~ f(wheel_speed) | Ступичный подшипник | Frequency tracking: dominant_freq / tire_freq = const? | P0 |
| vibration_y + audio_click при повороте | ШРУС | Event detection: ay > 2.5 AND audio_spike AND cornering | P1 |
| vibration_z ~ f(speed) при speed > 80 | Балансировка колёс | Резонанс: Z_std пик в узком диапазоне speed | P1 |
| audio > 200Hz + vibration | Подшипник генератора/компрессора | Partial correlation при контроле RPM | P2 |

**Рекомендация: Batch computation, не real-time.**

Причины:
1. Корреляция требует МИНИМУМ 50-100 data points в одном режиме
2. accel_windows и audio_windows имеют РАЗНЫЕ временные окна
3. Нужен join по времени с tolerance ±2-3 секунды
4. Результат корреляции стабилен на протяжении поездки

**Хранение:** Добавить таблицу `correlation_results`:
```sql
CREATE TABLE correlation_results (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64),
    trip_id VARCHAR(64),
    correlation_type VARCHAR(40),
    r_value REAL,
    slope REAL,
    p_value REAL,
    data_points INTEGER,
    regime VARCHAR(20),
    diagnosis_hint VARCHAR(40)
);
```

---

## 5. OFFLINE/ONLINE SPLIT

**Offline (T1 only, в приложении):**
- LTFT/STFT severity classification (таблица 10 уровней) — чистая арифметика
- DTC lookup по локальной базе (dtc-index.json = 4.9MB, один раз скачать)
- Voltage check (< 13V = генератор)
- Coolant overheat (> 105C = stop)
- Простой "светофор": green/yellow/red

**Online (server):**
- Welford baselines (нужна история)
- CUSUM trends (нужна история)
- Correlation engine (нужен join данных)
- Мульти-DTC анализ (нужны ситуации + нормы по марке)
- Full diagnostic report с рекомендациями

**Синхронизация правил:**
При 5 клиентах и одном разработчике — зашить T1 правила в приложение hardcoded. Сервер возвращает `rule_version`; если `app_version < server_version` — показать "доступно обновление". Не строить систему синхронизации правил — overengineering.

---

## 6. WELFORD BASELINES

**6a. Персистентность.** save/load в БД. Схема уже предусмотрена.

**6b. Cold start.** Текущие POPULATION_PRIORS содержат только 9 записей. Расширить до всех regime × feature комбинаций:
- IDLE RPM: 600-900 для ДВС
- Highway speed: 80-120 (ПДД)
- Coolant: 85-95C (термостат)
- Voltage: 13.8-14.4V (генератор)

Маркировать confidence:
- `< 0.3` = "используем generic priors, результат индикативный"
- `0.3-0.7` = "начинаем набирать данные, результат предварительный"
- `> 0.7` = "персонализированный baseline, результат точный"

Показывать: "Для точной диагностики проедьте ещё 5 поездок"

**6c. Стагнация baseline при деградации.** Welford — бесконечный скользящий. Если машина деградирует медленно, baseline сдвигается, z-score остаётся маленьким. Решение: `MAX_BASELINE_WINDOW = 500`, при превышении — замораживать baseline.

---

## 7. BEST PRACTICES ИЗ АВТОДИАГНОСТИКИ

### 7a. Freeze Frame данные
При чтении DTC Mode 02 возвращает снимок параметров в момент ошибки. DTC P0171 при IDLE + coolant=30C = холодный пуск (не проблема). DTC P0171 при HIGHWAY + coolant=90C = реальная проблема.

**Рекомендация:** Читать freeze frame (Mode 02). Хранить как JSONB: `dtc_events(time, client_hash, dtc_code, freeze_frame JSONB)`.

### 7b. Readiness Monitors (Mode 01 PID 01)
Bitfield из 8 monitors. Если monitor "not ready" — ECU ещё не провёл тест. Не выдавать "система OK" если monitor не пройден.

### 7c. Mode 6 Test Results
Результаты тестов мониторов с min/max/actual. Позволяет видеть деградацию ДО появления DTC. Отложить до v3.

### 7d. Деревья неисправностей vs scoring
Autel/Launch используют fault trees, не scoring:
```
P0171 (Lean) →
  ├── Check LTFT > 10%? → Yes
  │   ├── Check STFT? → Positive = fuel delivery, Negative = sensor
  │   ├── Check MAF? → Low reading = MAF dirty/failed
  │   └── Check O2 voltage? → Stuck lean = sensor
  └── Check Freeze Frame → RPM, Load, CoolantTemp → context
```

**Рекомендация:** Гибрид. Scoring для detection ("у вас проблема"), fault tree для explanation ("вот что проверить"). Это то, что situations-universal.json уже частично делает с `quickAnswer` и `commonMistakes`.

### 7e. False positives — проблема #1

Что отсутствует:
1. **Cooldown per rule per client.** Dismissed → не показывать 7 дней
2. **Minimum trigger count.** Правило должно сработать N раз подряд
3. **Regime stability filter.** Не диагностировать при переходных режимах
4. **Quality gate.** Если данные "шумные" — показать "данные ненадёжны"

---

## 8. ЧТО ОТСУТСТВУЕТ В АРХИТЕКТУРЕ

### 8a. Vehicle Profile — КРИТИЧЕСКИЙ пробел

```python
@dataclass
class VehicleProfile:
    vin: Optional[str]
    brand: str
    model: str
    generation: Optional[str]   # e53, e70, f15
    year: int
    engine_type: str            # 'ice', 'phev', 'bev'
    mileage_km: int
    modifications: Dict         # {'lpg': True, 'euro2_removed_cat': True}
    platform: Optional[str]     # from platform-sharing.json
```

### 8b. Temporal Patterns
Холодный пуск vs прогретый двигатель, начало/конец поездки, сезонность.

```python
@dataclass
class EngineContext:
    warm: bool              # coolant > 80C
    minutes_running: float
    ambient_temp: Optional[float]
    altitude: Optional[float]
```

### 8c. Multi-DTC Correlation
- P0171 + P0174 = подсос воздуха
- P0300 + P0301 + P0302 = катушка зажигания
- P0420 + P0430 = некачественное топливо

Таблица `dtc_patterns(pattern_codes TEXT[], diagnosis TEXT, confidence_boost INTEGER, situation_id TEXT)`.

### 8d. Severity Escalation Over Time
- Неделя 1: warning → Неделя 2: problem → Неделя 3: urgent

```sql
ALTER TABLE diagnostic_persistence ADD COLUMN
    first_triggered TIMESTAMPTZ,
    max_confidence INTEGER DEFAULT 0,
    escalation_level INTEGER DEFAULT 0,
    user_dismissed_at TIMESTAMPTZ;
```

### 8e. Маппинг DTC → Situations
36,102 DTC и 764 ситуации, связей почти нет. Стратегия 80/20:
1. Top-50 наиболее частых P-кодов (~80% реальных случаев)
2. Маппить через system_id → category
3. Для остальных — generic ответ по severity

---

## ИТОГОВАЯ ПРИОРИТИЗАЦИЯ

| # | Задача | Влияние | Сложность | Приоритет |
|---|--------|---------|-----------|-----------|
| 1 | Vehicle Profile (8a) | Блокирует LTFT коррекции | 1 день | P0 |
| 2 | LTFT/STFT Analyzer (3) | Главный диагностический параметр | 2 дня | P0 |
| 3 | Typed Facts (1) | Фундамент для масштабирования | 2 дня | P0 |
| 4 | Создать anomaly_baselines таблицу (6) | Без этого baselines теряются | 0.5 дня | P0 |
| 5 | Cold start / engine warm context (8b) | Снижение false positives | 1 день | P1 |
| 6 | Rule engine extension (2) | Поддержка 100+ правил | 3 дня | P1 |
| 7 | DTC patterns (8c) + top-50 mapping (8e) | Мульти-DTC диагностика | 2 дня | P1 |
| 8 | Severity escalation (8d) | UX — "когда в сервис?" | 1 день | P1 |
| 9 | Batch correlation engine (4) | Конкурентное преимущество | 1 неделя | P2 |
| 10 | Freeze frame (7a) + Readiness (7b) | Профессиональный уровень | 1 неделя | P2 |
| 11 | Baseline decay (6c) | Долгосрочная точность | 1 день | P2 |
| 12 | Offline T1 rules (5) | Нужно обновление приложения | 2 недели | P3 |

---

## ГЛАВНЫЙ ВЫВОД

Текущий anomaly_engine.py — хороший прототип scoring-системы (z-score + CUSUM + persistence), но он работает как "слепой" — не знает какая машина, какие модификации, какая погода, и не умеет интерпретировать самый важный параметр (LTFT). 

**Прежде чем добавлять 100 правил, нужно построить фундамент:**
1. Vehicle Profile
2. LTFT Analyzer
3. Typed Facts

Без этих трёх блоков масштабирование будет наращивать количество false positives, а не качество диагностики.
