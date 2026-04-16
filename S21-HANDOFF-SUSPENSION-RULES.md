# S21 HANDOFF — Применение исследования S20 в production

**Дата создания:** 2026-04-16
**Предыдущий спринт:** S20 (research suspension + audio, завершён)
**Ветка S20:** `research-suspension-audio` (последний commit `26ec1b6`, запушен на origin)
**Задача этого спринта (S21):** применить результаты исследования в production коде `llcar-dashboard/` и `dashboard_build/`

---

## Часть 1 — Что уже сделано в S20 (краткая сводка для контекста)

В S20 проведено 4 волны исследования по теме «подвеска + аудио-диагностика через вибростенд». Результат — 6 актуальных deliverables в папке `docs/research/suspension-audio/final/`:

1. **REPORT.md** (1 491 строка, 14 частей) — integrated narrative от физики до bibliography
2. **new-rules-production-ready.json** (17 правил) — готовый JSON для merge в threshold_rules.json
3. **production-rules-crosscheck.md** (42 правила) — verdict по каждому existing rule
4. **custdev-snippets.json** (201 цитата диагностов из 36 интервью)
5. **sources-verified.json** (306 источников с HTTP verification)
6. **README.md** (навигация по final/)

Путь: `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\`

Convergence достигнут — 4 волны поиска дали diminishing returns. Никаких дополнительных WebSearch/GLM волн для S20 scope не требуется.

---

## Часть 2 — Состояние production кода сейчас

### 2.1 Файлы подлежащие изменению

**`llcar-dashboard/public/data/diagnostic-rules.json`** (103 правила всего, из них 22 suspension + 20 noise + 61 прочие)
- Формат: `{articles: [], rules: [{id, title, conditions, tier, dtc, type}]}`
- Conditions — строка comma-separated типа `"az_std > 3, total_vibration > 4, az_range > 8"`
- Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `z>` (z-score vs baseline), `between`, `in`

**`dashboard_build/diagnostic/rules/threshold_rules.json`** (дубликат с расширенной схемой)
- Формат расширенный: `{rules: [{name, display, tier, conditions: [{fact_type, operator, threshold, weight}], context, min_confidence, cooldown_minutes, situation_id, dtc_codes}]}`
- **Именно в этот формат нужно добавлять новые правила** — этот используется `rule_engine.py`
- `diagnostic-rules.json` (в dashboard) — его упрощённая проекция для UI

**`dashboard_build/diagnostic/rule_engine.py`** (engine evaluator правил)
- Строка 337: реализация operator `z>` (z-score vs baseline)
- Строки 290-360: все operator handlers
- НЕ менять без необходимости — engine стабильный

**`dashboard_build/diagnostic/correlation_engine.py`** (314 строк, 5 корреляций)
- `vibration_rpm`, `audio_wheel`, `turn_click`, `vibration_speed_peak`, `highfreq_vibration`
- Константы: `TIRE_DIAMETER = 0.63`, `MIN_DATA_POINTS = 50`, `R_THRESHOLD = 0.6`
- Требует feature extractor-ов для новых правил (см. P2 задачи ниже)

**`dashboard_build/diagnostic/feature_extractor.py`**
- Вычисляет `az_std`, `total_vibration`, `dominant_freq`, `dominant_amp`, `az_range`, `crest_factor_z` и т.д.
- Сюда добавлять новые feature extractors для новых правил (envelope, BPFO, kurtosis, ratio, etc.)

**`llcar-dashboard/src/pages/Diagnostics.tsx`** (UI отображения)
- Строка 55-58: `const SYSTEMS = [{key:'suspension',...}, {key:'audio',...}]`
- Строка 461, 517: `{activeSystem === 'suspension' && ...}` / `{activeSystem === 'audio' && ...}` рендер блоков
- **Обычно НЕ трогаем** — если не добавляем новых категорий

**`llcar-dashboard/src/components/diagnostics/RulesList.tsx`**
- Строка 92: regex-based классификация правил на категории (suspension, noise, engine, electrical, brake)
- При добавлении новых правил убедиться что regex их подхватит в правильную категорию (id + conditions поиск)

**`llcar-dashboard/src/components/panels/AudioTab.tsx`**
- 6 zones частотного анализа UI (<100 Hz, 100-300, 300-1k, 1-3k, 3-8k, >8k)
- Если добавляем hybrid audio+vibration правила, возможно нужно добавить визуализацию в этой панели

### 2.2 Где deploy happens

Production сервер: `185.55.57.145` (через SSH wrappers `/tmp/llcar_ssh.sh` и `/tmp/llcar_scp.sh`, пароль `webadmin` вшит, ключ `~/.ssh/id_ed25519.txt`).
Путь установки: `/var/www/html/django/static/spa-v3/`
Деплой скрипт: `scripts/deploy-v3.sh --frontend-only` (собирает через `npm run build` и загружает dist/ на сервер).

**ВАЖНО — gotcha из прошлых сессий:** `tar -xzf` на сервере НЕ удаляет файлы, только перезаписывает. Если переименовали/удалили файлы локально, надо удалить и на сервере вручную через `/tmp/llcar_ssh.sh "find ... -delete"`.

---

## Часть 3 — S21 приоритеты: что именно делать и в каком порядке

### 3.1 Priority 1 — Ready-to-deploy правила (минимум риска)

Эти правила **полностью подтверждены Wave 5 deeper verification** и их можно внедрять немедленно без shadow mode:

**P1.1 — Rule 5 `wheel_imbalance_speed_resonance`** (заменяет `wheel_imbalance`)

Что делать:
```
# В threshold_rules.json заменить правило wheel_imbalance на:
{
  "name": "wheel_imbalance_speed_resonance",
  "display": "Дисбаланс колёс (резонансная зона)",
  "tier": "T2",
  "conditions": [
    {"fact_type": "az_std",              "operator": "z>",      "threshold": 2.0,          "weight": 3},
    {"fact_type": "total_vibration",     "operator": ">",       "threshold": 3.0,          "weight": 2},
    {"fact_type": "speed",               "operator": "between", "threshold": [80, 120],    "weight": 2},
    {"fact_type": "vibration_freq_ratio_to_wheel_rpm", "operator": "between", "threshold": [0.85, 1.15], "weight": 2}
  ],
  "context": {"min_speed": 20, "passenger_car_default": true},
  "min_confidence": 40,
  "cooldown_minutes": 10080,
  "situation_id": null,
  "dtc_codes": []
}
```

Для SUV — second rule с window [70, 95] и contextually-detectable SUV flag из VIN decode (если доступен).

Зависимость: нужен feature extractor `vibration_freq_ratio_to_wheel_rpm` в `feature_extractor.py`. Это ratio между dominant_freq accelerometer и (speed/π/TIRE_DIAMETER). Если ratio ≈ 1.0 (range 0.85-1.15) — это wheel-order frequency. Код extractor-а — 15-20 строк.

Обоснование: Wave 5 WebSearch подтвердил резонансную зону 55-65 mph (90-105 km/h) для passenger cars, 50-75 mph (80-120 km/h) full range через Counteract Balancing и IRD LLC. Physics: force от дисбаланса ∝ speed², max effect на резонансе подвески.

**P1.2 — Rule 6 `engine_mount_harmonic_order`** (заменяет `engine_mount_wear`)

Что делать:
```
{
  "name": "engine_mount_harmonic_order",
  "display": "Износ опор двигателя (harmonic RPM orders)",
  "tier": "T2",
  "conditions": [
    {"fact_type": "rpm_harmonic_matches", "operator": ">=", "threshold": 3,    "weight": 3},
    {"fact_type": "rpm",                  "operator": ">",  "threshold": 1500, "weight": 1},
    {"fact_type": "az_std",               "operator": "z>", "threshold": 2.0,  "weight": 2}
  ],
  "context": {"harmonic_window_hz": 2, "harmonic_orders_to_check": [1, 2, 3, 4]},
  "min_confidence": 40,
  "cooldown_minutes": 10080,
  "situation_id": null,
  "dtc_codes": []
}
```

Зависимость: feature extractor `rpm_harmonic_matches`. Он делает FFT на audio или accel, ищет peaks at N × RPM/60 ± 2 Hz for N ∈ {1, 2, 3, 4}, возвращает count matched harmonics. Код extractor-а — 30-50 строк, зависит от того какое FFT там уже используется.

Обоснование: Wave 5 confirmation через EngineLabs (Understanding Engine Harmonics) и Fluidampr Engine Vibration PDF. SKF CM5003 явно требует harmonic family detection для engine mount diagnostic.

**P1.3 — Rule 7 `wheel_bearing_bpfo_envelope`** (заменяет `bearing_wear`)

Самое сложное из P1, потому что требует:
1. Envelope spectrum extractor (band-pass 500-2000 Hz → Hilbert envelope → FFT)
2. Bearing geometry database (N, Bd, Pd, α для каждой модели авто) или fallback на estimated values по wheel hub diameter

Новое правило:
```
{
  "name": "wheel_bearing_bpfo_envelope",
  "display": "Ступичный подшипник (BPFO envelope spectrum)",
  "tier": "T2",
  "conditions": [
    {"fact_type": "envelope_bpfo_harmonic_matches", "operator": ">=", "threshold": 5,   "weight": 3},
    {"fact_type": "envelope_amplitude_over_noise",   "operator": ">",  "threshold": 3.0, "weight": 2}
  ],
  "context": {"requires_bearing_geometry": true, "envelope_band_hz": [500, 2000]},
  "min_confidence": 50,
  "cooldown_minutes": 10080,
  "situation_id": null,
  "dtc_codes": []
}
```

Если bearing geometry недоступна (VIN не декодируется, нет в database), использовать **fallback rule `bearing_wear_legacy`** со старыми условиями (dominant_freq > 200, dominant_amp z>2.5) для Stage IV detection.

Обоснование: Wave 5 confirmation через SKF CM5003, BK Vibro Application Note, Brüel & Kjaer BO0501. Все industry sources единогласны — envelope analysis обязателен для Stage II-III bearing detection.

**Итого P1:** 3 правила ready-to-deploy. Требуют 3 новых feature extractor-а (harmonic matches, envelope BPFO, vibration_freq_ratio). 1-2 недели работы на developer.

### 3.2 Priority 2 — Shadow-mode правила (с A/B тестом)

Эти правила имеют правильное направление коррекции, но **точные пороги требуют measurement на реальной fleet**. Деплой через **shadow mode** (логирование срабатываний без уведомления пользователю) на 4-6 недель, потом анализ false-positive rate и финальная calibration.

**P2.1 — Скорректированные пороги `worn_suspension`** (узnаком переименовать в `shock_absorber_early_wear_corrected`)

Текущие conditions: `az_std > 3, total_vibration > 4, az_range > 8` (ловят только catastrophic)
Предлагаемые: `az_std > 1.0, total_vibration > 1.5, az_range > 3.0` + новое condition `damping_decrement_cycles > 2.5`

Почему shadow mode: peer-reviewed источники не дают точного абсолютного значения az_std у healthy амортизатора. MATEC BulTrans 2018 дал 0.05-0.15 g на ровной дороге, но это не production-calibrated порог. Нужно **собрать 20-30 trips от здоровых машин разных классов** (через наших beta-testers или штатных водителей), вычислить 90-percentile az_std — это и будет production threshold.

Shadow mode процедура:
1. Добавить новое правило как `shock_absorber_early_wear_shadow` в threshold_rules.json
2. Установить его в mode `log_only` (создать новое поле `shadow_mode: true` в правиле, если такого нет в engine — добавить)
3. 4 недели логирования срабатываний (без уведомлений пользователю)
4. Сравнить детектинг с user complaints / actual repairs
5. Выставить final thresholds

**P2.2 — Скорректированные пороги `shock_absorber_worn`** — same подход что P2.1.

**P2.3 — `stabilizer_link_worn` добавить freq band**

Current conditions: `ay_std z>2, speed > 30, total_vibration > 3`
Добавить: `dominant_freq between 80, 400`

Direction verified (diagnostic literature подтверждает что звук стоек stabilizer — «clunk», «thud», типично ≈100-300 Hz), но specific границы 80-400 Hz требуют measurement. Deploy в shadow с initial 80-400 Hz → через 2-4 недели narrow-down.

**Итого P2:** 3 правила через shadow mode. ~6-8 недель calibration wallclock.

### 3.3 Priority 3 — Новые правила (emerging)

**P3.1 — `ball_joint_early_wear`** (AZ/AX ratio)

Deploy условия:
```
{
  "name": "ball_joint_early_wear",
  "display": "Ранний износ шаровой опоры (AZ/AX ratio)",
  "tier": "T2",
  "conditions": [
    {"fact_type": "vertical_lateral_ratio", "operator": ">",       "threshold": 1.8,      "weight": 3},
    {"fact_type": "speed",                  "operator": "between", "threshold": [60, 80], "weight": 1},
    {"fact_type": "az_std",                 "operator": "<",       "threshold": 0.5,      "weight": 2}
  ],
  "context": {"requires_road_class_at_most": "B"},
  "min_confidence": 50,
  "cooldown_minutes": 10080
}
```

Feature extractor: `vertical_lateral_ratio = az_std / ax_std` — 5 строк кода.

Препятствие: требует `iso8608_road_class ≤ B` — это зависит от Priority 3 infrastructure (классификатор дороги). Пока classifier-а нет — деплоить без road-class condition, но с более высоким min_confidence.

**P3.2 — `bushing_wear_120_180hz`** (audio energy band)

Deploy условия:
```
{
  "name": "bushing_wear_120_180hz",
  "display": "Износ сайлентблоков (полоса 120-180 Hz)",
  "tier": "T2",
  "conditions": [
    {"fact_type": "audio_energy_band_120_180hz_ratio", "operator": ">",       "threshold": 0.15,      "weight": 3},
    {"fact_type": "speed",                             "operator": "between", "threshold": [40, 60], "weight": 1}
  ],
  "context": {"brand_calibration": {"Kia": [80,140], "Hyundai": [80,140], "Toyota": "baseline_higher"}},
  "min_confidence": 50
}
```

Feature extractor: `audio_energy_band_120_180hz_ratio` — считает energy в band 120-180 Hz и делит на total energy audio spectrum. ~15 строк кода.

**P3.3 — `audio_suspension_source_validation`** (gate rule)

Cross-correlation между audio и AZ, returns lag of maximum. Lag 5-15 ms = suspension source. Lag > 15 ms = не suspension.

Deploy: в engine добавить как global filter, а не отдельное правило. Если `audio_accel_lag_ms > 15` — suppressиvать все suspension-category rules trigger для этого сэмпла.

Feature extractor: `audio_accel_cross_correlation_lag_ms` — через numpy.correlate или scipy.signal.correlate на 1-секундном окне. ~20 строк кода.

**P3.4 — `adaptive_damper_hydraulic_dead`**

Требует:
1. VIN decode для определения `has_adaptive_suspension` (BMW EDC/DDC, ZF CDC, MagneRide, AirMatic)
2. Manual EUSAMA value input (пока не автоматизирован вибростенд-тест через мобильное приложение)
3. Список electrical DTCs для экскlюzения: C0575, C0580, C0585, C0590, C1521, C1525, 5F30, 5F31, 5F32

Conditions:
```
{"fact_type": "eusama_percent",         "operator": "<",  "threshold": 30,    "weight": 4},
{"fact_type": "has_adaptive_dtc",       "operator": "==", "threshold": false, "weight": 3},
{"fact_type": "has_adaptive_suspension","operator": "==", "threshold": true,  "weight": 2}
```

Низкий priority — применимо только для BMW/MB/VAG/GM с адаптивной подвеской, ~10% fleet.

**P3.5 — `knock_impulse_kurtosis`**

Добавить kurtosis к существующему `knock_detonation`:
```
Conditions:
{"fact_type": "audio_kurtosis",         "operator": ">",       "threshold": 6,           "weight": 3},
{"fact_type": "dominant_freq",          "operator": "between", "threshold": [5000,8000], "weight": 2},
{"fact_type": "impulse_duration_ms",    "operator": "<",       "threshold": 10,          "weight": 2}
```

Feature extractors: `audio_kurtosis` (scipy.stats.kurtosis в running window) + `impulse_duration_ms` (peak-detect + width-at-half-maximum). ~30 строк кода вместе.

**Итого P3:** 5 новых правил. Feature extractor работа ~2-3 недели developer.

### 3.4 Priority 4 — Strategic infrastructure (отдельный саб-спринт)

**P4.1 — ISO 8608 road classifier**
- Accumulate vertical acceleration PSD в rolling window (30-60 sec)
- Fit к reference lines ISO 8608 classes A-H
- Export as `iso8608_road_class` fact
- Unlocks road-class-gated rules (Rule 10, Rule 12)

**P4.2 — Per-car baseline accumulation improvements**
- Currently baseline накапливается в `regime_baselines` (highway, city, idle) per vehicle ID
- Improvement: persistence between trips (если сейчас нет), cross-vehicle transfer от similar cars при новой VIN

**P4.3 — VIN decode для TIRE_DIAMETER**
- Replace `TIRE_DIAMETER = 0.63` hardcode в `correlation_engine.py`
- Options: Carbase/CarAPI commercial (ежемесячная плата), NHTSA free dataset (limited coverage), manual entry в car profile
- Без этого `vibration_freq_ratio_to_wheel_rpm` даёт 8-15% error для SUV с 18-20" колёсами

**P4.4 — EUSAMA pre-test gate (Rule 1)**
- Требует input о tire pressure, shock absorber warmup, vehicle load, ambient temp
- В полевой режим (для диагноста) — user input в приложении
- В обычный режим — auto-check через TPMS (если доступно), OBD coolant temp как ambient proxy

### 3.5 Сводная таблица — план S21

| Priority | Что делать | Зависимости | Estimate |
|---|---|---|---|
| P1.1 | Rule 5 `wheel_imbalance_speed_resonance` | feature extractor vibration_freq_ratio | 2-3 дня |
| P1.2 | Rule 6 `engine_mount_harmonic_order` | feature extractor rpm_harmonic_matches | 3-5 дней |
| P1.3 | Rule 7 `wheel_bearing_bpfo_envelope` | envelope extractor + bearing geometry database | 1-2 недели |
| P2.1 | worn_suspension shadow mode | engine support для shadow_mode flag | 2-4 недели calibration |
| P2.2 | shock_absorber_worn shadow mode | same | same |
| P2.3 | stabilizer_link_worn freq band | none (just JSON) | 1 день deploy + 2-4 недели monitoring |
| P3.1 | Rule 10 `ball_joint_early_wear` | vertical_lateral_ratio extractor | 2 дня |
| P3.2 | Rule 12 `bushing_wear_120_180hz` | audio_energy_band_ratio extractor | 2-3 дня |
| P3.3 | Rule 3 `audio_suspension_source_validation` | audio_accel_lag extractor | 3-4 дня |
| P3.4 | Rule 15 `adaptive_damper_hydraulic_dead` | VIN decode + adaptive DTC list | 1 неделя (если VIN есть) |
| P3.5 | Rule 8 `knock_impulse_kurtosis` | audio_kurtosis + impulse_duration extractors | 2-3 дня |
| P4.1 | ISO 8608 road classifier | accumulate PSD, fit to ref | 2-3 недели |
| P4.2 | Per-car baseline improvements | engine changes | 1 неделя |
| P4.3 | VIN decode TIRE_DIAMETER | VIN API integration | 1 неделя + dataset |
| P4.4 | EUSAMA pre-test gate | user input flow OR TPMS integration | 1-2 недели |

**Общая оценка:** ~10-14 недель на полное внедрение всех P1+P2+P3+P4. Рекомендуемая последовательность:

1. Week 1-2: P1.1, P1.2 (ready-to-deploy low-risk wins)
2. Week 2-3: P2.3 (JSON-only), P3.1, P3.2, P3.5 (простые extractors)
3. Week 3-4: Deploy P1.3 и P3.3 (требуют envelope и cross-correlation)
4. Week 4-8: Shadow mode P2.1, P2.2 + calibration
5. Week 6-10: P3.4, P4.1, P4.2 параллельно
6. Week 10-14: P4.3, P4.4 finalization

---

## Часть 4 — Что в S22+ (deferred)

В файле `docs/research/suspension-audio/_meta/open-questions.md` — **165 unknowns** deferred из iterations 1-2 S20. Основные категории:

- **Suspension (76 unknowns):** gear ratios, firmware versions конкретных стендов (Bogehofmann, MAHA), OEM-specific closed pass/fail thresholds для FRF/transmissibility, calibration процедуры сервоклапанов, детальные спецификации конкретных сайлентблоков CR-V разных поколений, статистика отказов по маркам и регионам для восстановленных узлов
- **Vibrostand (33 unknowns):** market prices бу 4-post стендов, сравнение точности разных производителей стендов, комплексный анализ влияния адаптивных подвесок на корректность EUSAMA, специфические spec EUSAMA для коммерческого транспорта, ранги допустимой биения привалочной поверхности ступицы после корозии
- **Audio-correlations (data gaps):** статистика распределения частоты обломов по маркам и пробегам
- **Brands (proprietary data):** closed OEM databases BMW ISTA, VAG ERWIN, Mercedes Xentry — без платной подписки недоступно

S22+ spreints могут взять subset этих unknowns для focused research (например: «пневмоподвески ком.транспорт deep dive», «Chinese brands reliability statistics», «VIN decode dataset extension»).

---

## Часть 5 — Конкретные decision points для user'a

Перед началом S21 нужны решения:

### 5.1 Приоритизация — что первым?

**Option A — Conservative (low-risk wins first)**: начать с P1.1 и P1.2 (wheel_imbalance + engine_mount). Эти полностью подтверждены, минимум риска false-positive. ~1 неделя работы.

**Option B — Aggressive (maximum value fast)**: начать с P1.1-P1.3 + P3.1 + P3.2 параллельно. 5 правил в первые 2 недели. Требует 2 разработчиков или 1 полный месяц.

**Option C — Calibration-first**: сначала подготовить shadow mode infrastructure (engine changes) чтобы могли параллельно тестировать P2.1, P2.2. Это 1 неделя setup + затем все P1+P2+P3 вместе.

**Моя рекомендация: Option A** для минимизации риска regression, затем последовательно P2+P3 после того как P1 стабилен в production 1-2 недели.

### 5.2 VIN decode — purchase или build?

Для Rule 5 SUV variant и Rule 7 bearing geometry, и P4.3 TIRE_DIAMETER:
- **Commercial API** (Carbase, CarAPI) — ~$50-200/месяц, покрытие 95%+ brands globally
- **NHTSA free** — coverage limited, particularly weak для non-US cars
- **Manual database** — медленно строить, но полный контроль

**Моя рекомендация:** Commercial API при наличии budget (покрытие критично для адекватного service quality). Если budget constraints — NHTSA + manual для Russian brands отдельно.

### 5.3 Shadow mode — инвестировать в infra?

Для P2.1, P2.2 требуется engine support для `shadow_mode: true` флага в правилах. Это ~1 неделя разработчика.

**Альтернатива:** не делать shadow mode, а применить сразу новые пороги (1.0 g / 3.0 g) в production. Рискует generation false-positives и user complaints в первые дни.

**Моя рекомендация:** инвестировать в shadow mode infra — это даёт framework для ВСЕХ будущих rule calibrations, не только этих 2.

### 5.4 Deploy cadence — incremental or bulk?

- **Incremental (рекомендую)**: каждая правило деплоится отдельно с 2-3 днями monitoring между
- **Bulk**: все P1 вместе, все P3 вместе. Быстрее, но сложнее изолировать regression.

---

## Часть 6 — Ссылки на файлы (полные пути)

**Research материалы S20:**
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\README.md` — навигация
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\REPORT.md` — главный narrative отчёт
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\new-rules-production-ready.json` — 17 правил
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\production-rules-crosscheck.md` — 42 rules verdict
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\custdev-snippets.json` — 201 цитата
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\final\sources-verified.json` — audit

**Production код (цели изменений):**
- `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\diagnostic\rules\threshold_rules.json` — главный rules файл
- `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\diagnostic\rule_engine.py` — engine
- `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\diagnostic\correlation_engine.py` — 5 correlations
- `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\diagnostic\feature_extractor.py` — features
- `C:\Users\Петр\Downloads\Маркетинговые материалы\llcar-dashboard\public\data\diagnostic-rules.json` — UI version rules
- `C:\Users\Петр\Downloads\Маркетинговые материалы\llcar-dashboard\src\components\diagnostics\RulesList.tsx` — UI categorization
- `C:\Users\Петр\Downloads\Маркетинговые материалы\llcar-dashboard\src\components\panels\AudioTab.tsx` — 6 audio zones UI

**Deploy infrastructure:**
- `C:\Users\Петр\Downloads\Маркетинговые материалы\scripts\deploy-v3.sh` — скрипт деплоя
- Production server: `185.55.57.145` (через `/tmp/llcar_ssh.sh`, `/tmp/llcar_scp.sh`)
- Production path: `/var/www/html/django/static/spa-v3/`

**S22+ deferred items:**
- `C:\Users\Петр\Downloads\Маркетинговые материалы\docs\research\suspension-audio\_meta\open-questions.md` — 165 unknowns

---

## Часть 7 — Команды для старта S21

```bash
# 1. Перейти в корень проекта
cd "C:\Users\Петр\Downloads\Маркетинговые материалы"

# 2. Убедиться что на правильной ветке (dashboard-v3 — основная ветка разработки)
git checkout dashboard-v3

# 3. Подтянуть S20 research в dashboard-v3 (через PR merge или cherry-pick)
# Option A: merge PR через GitHub UI
# PR URL: https://github.com/llcarn8n/llcar-project/pull/new/research-suspension-audio
# Target: dashboard-v3 (НЕ main)

# Option B: merge локально
git merge research-suspension-audio --no-ff -m "merge S20 research — suspension+audio deliverables"

# 4. Создать новую ветку под S21
git checkout -b s21-suspension-rules-production

# 5. Открыть production-ready JSON
cat docs/research/suspension-audio/final/new-rules-production-ready.json | python -m json.tool | head -50

# 6. Начать с P1.1 (wheel_imbalance_speed_resonance)
# Редактировать dashboard_build/diagnostic/rules/threshold_rules.json
# Заменить wheel_imbalance правило на новое (из new-rules-production-ready.json #5)

# 7. Добавить feature extractor vibration_freq_ratio в feature_extractor.py
# ~15 строк кода

# 8. Запустить тесты
python -m pytest dashboard_build/tests/test_rules.py -v

# 9. Локально проверить
cd llcar-dashboard && npm run dev
# Открыть http://localhost:5173, найти страницу Diagnostics → проверить что правило правильно отображается

# 10. Deploy в staging (если есть) или в production после QA
./scripts/deploy-v3.sh --frontend-only
```

---

## Часть 8 — Контекст предыдущих session

Если нужно восстановить память о том что было раньше:

- **SESSION-HANDOFF.md** (root) — предыдущая сессия S19 (Gen-First KB reorganization, отложено)
- **docs/research/suspension-audio/final/REPORT.md** — полный research отчёт S20 (это и есть базис для S21)
- **S16-KB-MASTER-ROADMAP.md** — сводная карта 58 брендов (для context KB структуры, не relevantно для S21)
- **VERIFIER-FINDINGS-S16-P4.md** — находки верификатора (также не relevantно для S21)

Memory пользователя:
- `C:\Users\Петр\.claude\projects\C--Users------Downloads------------------------\memory\MEMORY.md` — index
- `project_session20_progress.md` — S20 progress memory
- Ключевые feedback entries: V2=frozen stable / V3=active, НЕ удалять фичи без разрешения, планировать перед кодом, verify before generate

---

**Этот handoff готов для открытия в новой сессии.** Claude в новой сессии должен начать с чтения этого файла + `docs/research/suspension-audio/final/REPORT.md` Part XIII (roadmap) + `new-rules-production-ready.json`. Далее — с user'ом согласовать приоритизацию по Части 5 (decision points) и начать с выбранного option.
