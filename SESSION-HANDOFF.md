# SESSION HANDOFF — 2026-04-07 (Session 5 — ДЕТАЛЬНЫЙ)

> **ИНСТРУКЦИЯ:** Прочитай ВЕСЬ этот файл + `MEMORY.md` в `~/.claude/projects/.../memory/`
> **ВЕТКИ GIT:**
>   - `diagnostic-engine` — стабильный backend (Plans 1-4)
>   - `dashboard-v3` — **ТЕКУЩАЯ РАБОЧАЯ ветка** (frontend V3 + последние backend изменения)
> **ТЕСТЫ:** `cd "C:/Users/Петр/Downloads/Маркетинговые материалы/dashboard_build" && python -m pytest tests/ -v` → **433 pass**
> **FRONTEND BUILD:** `cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard" && npm run build`

---

## СЕРВЕР

- **IP:** 185.55.57.145
- **SSH:** `/tmp/llcar_ssh.sh "команда"` — скрипт использует SSH_ASKPASS с паролем `webadmin`
- **SCP:** `/tmp/llcar_scp.sh файл webadmin@185.55.57.145:путь`
- **SSH ключ:** `$HOME/.ssh/id_ed25519.txt` (с passphrase `webadmin`)
- **Django:** `/var/www/html/django/`
- **DB:** PostgreSQL `vehinfo`, user `webadmin`/`webadmin`, host `localhost:5432`
  - Django connection: `connections['vehinfo']`
  - psql: `PGPASSWORD=postgres psql -U postgres -d vehinfo`
  - **GRANT ALL** уже сделан для webadmin на все таблицы
- **Gunicorn:** два процесса:
  - `www-data` (PID ~1405300) — systemd, БЕЗ --reload, sudo restart НЕВОЗМОЖЕН (webadmin не в sudoers)
  - `webadmin` (PID ~1405656) — с `--reload`, автоподхватывает изменения файлов
  - **Перезагрузка:** `touch /var/www/html/django/llcar/wsgi.py` (для webadmin gunicorn)
- **Nginx:** `llcar.ru:443` → unix socket → gunicorn
- **Django settings:** `default` = SQLite (auth), `vehinfo` = PostgreSQL (все данные)

### Структура на сервере
```
/var/www/html/django/
├── llcar/                 ← Django project (settings.py, urls.py, wsgi.py)
├── dashboard/             ← Django app
│   ├── views.py           ← V1 API (api_data, api_anomaly, etc.) + v2/v3 SPA views
│   ├── urls.py            ← все URL routes включая api/v2/*
│   ├── anomaly_engine.py  ← СТАРЫЙ движок (НЕ ТРОГАТЬ)
│   ├── diagnostic/        ← НАШИ МОДУЛИ (Plan 1-4)
│   │   ├── api_views.py   ← 4 endpoints
│   │   ├── rules/threshold_rules.json ← 57 правил
│   │   └── ... (23 файла)
│   └── data/
│       ├── dtc-index-sample.json
│       ├── situations-sample.json
│       └── recalls-database.json ← 298 кампаний, 91 бренд
├── static/
│   ├── spa/               ← Dashboard V2 (stable)
│   └── spa-v3/            ← Dashboard V3 (dev, текущая работа)
├── manage.py
├── db.sqlite3             ← auth DB
└── venv/                  ← Python virtual env
```

### URL Routes на сервере (dashboard/urls.py)
```python
path('', views.dashboard, name='dashboard'),           # Старый dashboard
path('v2/', views.dashboard_v2, name='dashboard_v2'),   # → /static/spa/ (V2 SPA)
path('v3/', views.dashboard_v3, name='dashboard_v3'),   # → /static/spa-v3/ (V3 SPA)
path('api/data/', views.api_data),                       # V1 OBD data
path('api/anomaly/', views.api_anomaly),                 # V1 anomaly scores
path('api/anomaly/history/', views.api_anomaly_history), # V1 history
# ... другие V1 routes ...
path('api/v2/diagnose/', diagnose_view),                 # POST — полная диагностика (внешний)
path('api/v2/feedback/', feedback_view),                 # POST — обратная связь
path('api/v2/history/', history_view),                   # GET — история scores
path('api/v2/diagnose-latest/', diagnose_latest_view),   # GET — диагностика из серверных данных
```

### PostgreSQL таблицы
**Существующие (данные есть):**
- `qtp_packets` (44663) — метаданные пакетов
- `ecu_7e8` (25711) — OBD ДВС: p010c=RPM, p010d=Speed, p0105=Coolant, p0106=LTFT(raw→(v-128)*100/128), p0142=Voltage(mV)
- `ecu_7ea` (17200) — электромотор
- `ecu_7eb` (7360) — BMS/батарея
- `ecu_7ef` (7441) — охлаждение
- `accel_windows` (173854) — ax/ay/az avg/std/min/max
- `audio_windows` (85576) — freq_1..freq_10, amp_1..amp_10, quality

**Созданные нами (schema_anomaly.sql):**
- `vehicle_profiles` — PK client_hash
- `anomaly_baselines` — UNIQUE(client_hash, regime, feature), Welford stats
- `anomaly_scores` — TimescaleDB hypertable, 90 дней retention
- `diagnostic_persistence` — PK(client_hash, rule_name), escalation
- `correlation_results` — batch correlation results
- `dtc_events` — DTC коды с freeze frame
- `fact_log` — TimescaleDB hypertable, 180 дней retention
- `user_feedback` — confirmed/dismissed/resolved
- `dtc_patterns` — 7 мульти-DTC паттернов (INSERT ON CONFLICT)

---

## BACKEND — ФАЙЛЫ И ЧТО ОНИ ДЕЛАЮТ

### `dashboard_build/diagnostic/` (23 файла, все закоммичены)

| Файл | Строк | Что делает | Plan |
|------|-------|-----------|------|
| `__init__.py` | 0 | Пустой | 1 |
| `vehicle_profile.py` | 95 | VehicleProfile dataclass. LTFT corrections: euro2_removed_cat→-7.5%, lpg→x1.5, GM_*→x1.3, японские→x0.7. kb_resolution_path. to/from_db_row | 1 |
| `knowledge_base.py` | 191 | KnowledgeBase 4-level resolver. resolve_dtc(code, brand). find_situations_by_dtc/category/system_id. match_dtc_pattern(codes). SYSTEM_TO_CATEGORY mapping (17→7). DEFAULT_DTC_PATTERNS (6 штук) | 1 |
| `normalizer.py` | 283 | **DrivingRegime** enum (IDLE/CITY/HIGHWAY/ACCELERATION/BRAKING/CORNERING/UNKNOWN). EngineContext (warm/cold_start). NormalizedPacket — все OBD/accel/audio поля. normalize_packet(raw). Validation bounds | 1 |
| `feature_extractor.py` | 136 | extract_features(packet) → dict. total_vibration (RMS), crest_factor, shape_ratio, a{x,y,z}_range, ltft_abs, fuel_trim_delta, sign_match, vibration_speed_ratio, virtual_freq_source/order. TIRE_DIAMETER=0.63 | 1 |
| `facts.py` | 212 | FactType enum (14 типов). Fact dataclass (type, timestamp, value, severity, confidence, context, source_tier, details). FactGenerator: DTC facts, multi-DTC patterns, overheat (>105°C→danger), low voltage (<13V+rpm>1000→warning) | 1 |
| `baseline_store.py` | 232 | RegimeBaseline (Welford). MAX_WINDOW=500, MIN_SAMPLES=30, GOOD_SAMPLES=200. BaselineStore: get/update/is_ready/confidence. to_db_rows/from_db_rows. KEY_FEATURES=(az_std, total_vibration) | 1 |
| `pipeline.py` | ~190 | DiagnosticPipeline. process(raw) → {packet, features, facts, tier, regime, baseline_ready/confidence}. full_diagnose(raw, db_cursor=None, client_hash=None) → 7-block report. Integrates FuelTrimAnalyzer, RuleEngine, DiagnosisBuilder. Optional DB persistence | 1+2+3 |
| `fuel_trim_analyzer.py` | ~240 | FuelTrimAnalyzer(vehicle_profile). analyze(ltft, stft, regime, coolant_temp, ambient_temp) → FuelTrimResult. 8 severity levels (NORMAL→DANGER). Correction chain: offset→mult→winter. Cross-analysis: lean/rich/chronic/sensor. Loss calculator: corrected_abs/100 * consumption * price * km/100 | 2 |
| `rule_engine.py` | ~440 | RuleCondition/DiagnosticRule dataclasses. RuleEngine: load_json_rules, load_python_rules, evaluate_rule, run_all. Confidence = match(40%) + deviation(40%) + persistence(4%). Operators: >, <, ==, z>, between, in. _resolve_value: features first, then packet attrs. Status: likely(≥70)/possible(≥40)/unlikely(>0)/clear(0) | 2+4 |
| `rules/__init__.py` | 8 | RULES_DIR path | 2 |
| `rules/threshold_rules.json` | ~1000 | **57 правил**: engine(16), fuel(10), electrical(6), suspension(10), audio(11), combined(5). Placeholder: oil_pressure_low | 2+4 |
| `rules/complex_rules.py` | ~200 | **5 Python правил**: rule_fuel_bank_cross (lean/rich/localized), rule_vibration_regime_dependency (highway/idle/all), rule_audio_engine_harmonic (harmonics 1-8), rule_warmup_anomaly (cold vs warm), rule_speed_vibration_resonance. ALL_RULES list | 4 |
| `diagnosis_builder.py` | ~430 | DiagnosisBuilder(kb, profile). build_report(pipeline_result, rule_results, fuel_trim_result=None, baseline_store=None, escalation_manager=None, history=None, recalls_data=None). 7 blocks: can_drive(safe/caution/stop), health_scores(5 систем), health_trends(CUSUM), diagnoses(filtered by min_confidence), fuel_loss, escalations, recalls, next_steps. Meta: confidence, baseline_status, rule_version="v1" | 2+3+4 |
| `escalation.py` | ~200 | PersistenceRecord dataclass. EscalationManager: load_from_db, save_to_db, update, dismiss, is_in_cooldown, get_record, get_escalation_info. COOLDOWN_DAYS=7. 4 levels: notice(0d,1x,0%), warning(3d,3x,40%), problem(7d,5x,50%), urgent(14d,10x,70%). LEVEL_NAMES list | 3 |
| `correlation_engine.py` | ~300 | CorrelationResult dataclass. CorrelationEngine(tire_diameter=0.63). analyze_trip(windows) → List[significant]. 5 correlations: vibration_rpm(→engine_mount), audio_wheel(→wheel_bearing), turn_click(→cv_joint), vibration_speed_peak(→wheel_balance), highfreq_vibration(→accessory_bearing). _linregress (pure Python, no scipy). MIN_DATA_POINTS=50, R_THRESHOLD=0.6. save_results(cursor) | 3 |
| `cusum.py` | ~60 | CUSUMDetector(k=3.0, h=10.0). compute_trend(scores) → ↑/↓/→. compute_all_trends(history) → {suspension, engine, electrical, audio}. Two-sided CUSUM: s_pos=degradation, s_neg=improvement. Min 5 data points | 4 |
| `recalls_checker.py` | ~120 | RecallsChecker(db_path). _load(path). check(brand, model, year) → List[dict]. Fuzzy matching: brand slug + model substring + word-level + year range. _parse_years handles "2013" and "2024-2025" strings. Sort by severity(critical→high→medium→low). 298 campaigns, 91 brands | 4 |
| `db.py` | ~120 | get_cursor() → Django connections['vehinfo']. MockDB: in-memory SQLite, setup() creates 7 tables (baselines, persistence, fact_log, feedback, scores, correlations, profiles, dtc_events). cursor() context manager. teardown() | 3 |
| `db_writers.py` | ~250 | _placeholder(cursor): ?/s%. _now_iso(). save_baselines(cursor, hash, store) → UPSERT. load_baselines(cursor, hash) → BaselineStore. write_fact_log(cursor, hash, facts, tier). write_anomaly_scores(cursor, hash, report, features, regime). write_feedback(cursor, hash, rule, action, ...). save_vehicle_profile(cursor, profile). load_vehicle_profile(cursor, hash) → VehicleProfile|None. write_dtc_events(cursor, hash, codes, freeze) | 3+5 |
| `db_readers.py` | ~40 | read_history(cursor, hash, period="7d") → List[dict]. SQLite: no INTERVAL, just ORDER BY time DESC. PostgreSQL: WHERE time > NOW() - INTERVAL | 3 |
| `api_views.py` | ~350 | **4 view-функции:** diagnose_view (POST), feedback_view (POST), history_view (GET), diagnose_latest_view (GET). JsonResponse shim для тестов без Django. @csrf_exempt на все. diagnose_latest: reads ecu_7e8+accel+audio from DB → assembles packet → full_diagnose → escalation → recalls → CUSUM trends → vehicle_profile save/load → dtc_events. Fallback: работает без DB | 2+3+5 |

### `dashboard_build/tests/` (14 файлов тестов)

| Файл | Тестов | Что тестирует |
|------|--------|--------------|
| test_vehicle_profile.py | 17 | Создание, LTFT corrections, KB path, serialization |
| test_knowledge_base.py | 35 | DTC resolution, situations, system_id, multi-DTC patterns |
| test_normalizer.py | 31 | Validation, regime classification, engine context, tier |
| test_feature_extractor.py | 7 | total_vibration, crest_factor, fuel trim features |
| test_facts.py | 20 | Fact creation, DTC facts, multi-DTC, overheat, low voltage |
| test_baseline_store.py | 34 | Welford stats, z-score, freeze, readiness, DB serialization |
| test_pipeline.py | 15 | Healthy packet, DTC, overheat, baselines, edge cases |
| test_fuel_trim_analyzer.py | 23 | Severity levels, corrections, cross-analysis, loss calc |
| test_rule_engine.py | 19 | Dataclasses, JSON loading, healthy vehicle, triggers, z-score |
| test_diagnosis_builder.py | 25 | 7 blocks, can_drive, health scores, fuel loss, escalation fields |
| test_integration.py | 19 | full_diagnose end-to-end, DTC, overheating, fuel loss, vibration |
| test_api_views.py | 13 | diagnose/feedback/history views, validation, methods |
| test_db.py | 10 | MockDB setup, CRUD, constraints, get_cursor error |
| test_db_writers.py | 25 | save/load baselines roundtrip, fact_log, scores, feedback, vehicle_profile, dtc_events |
| test_escalation.py | 17 | First trigger, escalation levels, cooldown, dismiss, DB roundtrip |
| test_correlation_engine.py | 25 | _linregress, 5 correlations with synthetic data, save_results |
| test_cusum.py | 13 | Constant/decreasing/increasing, too few, noise, sharp drop, integration |
| test_complex_rules.py | 31 | 5 Python rules, integration with run_all |
| test_recalls_checker.py | 25 | DB loading, brand/model/year matching, fuzzy, severity sort |
| test_pipeline_db.py | 20 | full_diagnose with DB cursor, baselines persistence, history |
| test_escalation_integration.py | 9 | Escalation in build_report, backward compat |
| **ИТОГО** | **433** | |

### `dashboard_build/data/` (3 файла)

- `dtc-index-sample.json` — 5 DTC кодов для тестов (P0171, P0300, P0420, P0101, P0016)
- `situations-sample.json` — 3 ситуации для тестов
- `recalls-database.json` — **6271 строка**, 298 отзывных кампаний, 91 бренд. Скопирован из D:\transfer4\frontend\data\

### `dashboard_build/schema_anomaly.sql` — SQL схема (задеплоена на сервер)

---

## FRONTEND — ФАЙЛЫ И ЧТО ОНИ ДЕЛАЮТ

### `llcar-dashboard/` (React 18 + TypeScript + Vite + Zustand + Tailwind)

**Ветка:** `dashboard-v3`
**Vite base:** `/static/spa-v3/`
**Build:** `npm run build` → `dist/`
**Deploy:** `/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa-v3/`

### Новые/изменённые файлы (V3)

| Файл | Что делает |
|------|-----------|
| `src/hooks/useDiagnosticV2.ts` | Хук: fetchLatest() GET /api/v2/diagnose-latest/ (30s refresh), fetchHistory() GET /api/v2/history/ (60s refresh), sendFeedback() POST /api/v2/feedback/. Типы: DiagnosticReport, Diagnosis, Escalation, Recall, HistoryEntry |
| `src/stores/dashboardStore.ts` | +`useV2Api: boolean`, +`toggleV2Api()` |
| `src/components/diagnostics/DiagnosisCardV2.tsx` | V2 карточка. Empty state: car-heartbeat image + status dots (Движок/Правила/Baseline). Loaded: can_drive badge (safe/caution/stop с пульсацией), fuel_loss alert (₽/мес, ₽/год), diagnoses list (display, status badge, confidence%, explanation, repair_roadmap steps, price_range, FeedbackButtons). Baseline calibration status footer. Loading indicator (spinning dot) |
| `src/components/panels/HealthTrends.tsx` | Empty: skeleton sparklines с "--" scores. Loaded: 5 SVG sparklines (overall, suspension, engine, electrical, audio) + current score + trend arrow (↑/→/↓ с цветами). Data count footer |
| `src/components/panels/FeedbackButtons.tsx` | Два кнопки: "✓ Подтверждаю" (green) / "✗ Не так" (yellow). После нажатия → "Подтверждено/Отклонено — спасибо!". Disable во время отправки |
| `src/components/onboarding/OnboardingTour.tsx` | 5-шаговый tour с роботом-маскотом. localStorage key: `llcar-onboarding-v3-done`. Steps: Привет→Здоровье→Диагнозы→Безопасность→Готово. Back/Next/Skip кнопки. Step dots. Fullscreen overlay с backdrop blur |
| `src/pages/Diagnostics.tsx` | +import OnboardingTour, DiagnosisCardV2, HealthTrends, useDiagnosticV2. Кнопка "API V1/V2" (right-24, z-20). V2 mode: DiagnosisCardV2 вместо DiagnosisCard (col-span-4/4/4 вместо 3/4/5). V2 health scores в подсистемах с trend arrows. HealthTrends panel (col-span-3). AnomalyTimeline shrinks to col-span-6 |
| `src/theme.ts` | text.muted: rgba(255,255,255,0.45) (was 0.3). text.secondary: rgba(255,255,255,0.75) (was 0.6). WCAG contrast fix |
| `src/styles/glass.css` | +@keyframes spin, fadeIn, bounce |
| `src/assets/robot-default.png` | Робот LLCAR — стоит уверенно |
| `src/assets/robot-thumbsup.png` | Робот — thumbs up, подмигивает |
| `src/assets/robot-shield.png` | Робот — со щитом (безопасность) |
| `src/assets/robot-celebrate.png` | Робот — прыгает с конфетти |
| `src/assets/car-heartbeat.jpg` | Luma генерация — контур авто с линией ЭКГ |

### Существующие файлы (НЕ трогали, работают)

| Файл | Что делает |
|------|-----------|
| `src/pages/Dashboard.tsx` | Главная: Health Score circle, Digital Twin, 4 instrument cards (RPM, Speed, Coolant, Vibration) |
| `src/pages/Diagnostics.tsx` | Диагностика (V1+V2 toggle) |
| `src/pages/Trips.tsx` | Поездки: Leaflet карта |
| `src/components/panels/DiagnosisCard.tsx` | V1 карточка диагнозов (ConfidenceBar, StatusBadge, TrendArrow, CusumDot) |
| `src/components/panels/AudioSpectrum.tsx` | NVH спектрограмма |
| `src/components/panels/AnomalyTimeline.tsx` | 7-дневный таймлайн здоровья |
| `src/components/panels/TimelineScrubber.tsx` | Скроллер времени |
| `src/components/three/SmartSphere.tsx` | 3D визуализация вибрации (Three.js) |
| `src/components/shared/GlassPanel.tsx` | Стеклянная панель (reusable) |
| `src/components/shared/HealthBar.tsx` | Progress bar здоровья |
| `src/components/shared/StatusBadge.tsx` | Бейдж статуса (ok/warning/critical/offline) |
| `src/hooks/useApiData.ts` | Generic fetch hook (V1 API) |
| `src/layouts/MainLayout.tsx` | Общий layout с навигацией |

---

## MCP СЕРВЕРЫ

### Установлены (активируются при рестарте Claude Code)

1. **Context Mode** (6700 stars) — сжатие контекста на 98%
   - Установлен: `claude mcp add context-mode -- npx -y context-mode`
   - Конфиг: `C:\Users\Петр\.claude.json` (project-level)
   - Что делает: sandbox'ит tool output → raw data не попадает в контекст → сессии длятся дольше
   - Repo: github.com/mksglu/context-mode

2. **mcp-memory-service** (1600 stars) — persistent memory с semantic search
   - Установлен: `pip install mcp-memory-service` + `claude mcp add memory -- python -m mcp_memory_service`
   - Конфиг: `C:\Users\Петр\.claude.json` (project-level)
   - Что делает: SQLite + ONNX embeddings, knowledge graph, web dashboard localhost:8000
   - Repo: github.com/doobidoo/mcp-memory-service

### Не установлен (рассмотреть позже)
- **Engram** (2300 stars) — Go binary, требует установки Go. Альтернатива EchoVault
- **EchoVault** — v0.2.8 СЛОМАН (больше не MCP server, стал git object store)

---

## LUMA ГЕНЕРАЦИИ

Файлы в `luma-output/`:
1. `01-concept-dashboard-main.jpg` — концепт главной (16:9, 3D авто + glass panels)
2. `02-concept-diagnostics-v2.jpg` — концепт диагностики V2 (16:9, карточки + roadmap)
3. `03-promo-phone-obd.jpg` — промо телефон+OBD (16:9, псевдо-кириллица)
4. `04-promo-hero-splitscreen.jpg` — hero лендинга (21:9, SUV + голограмма)
5. `05-icons-empty-states.jpg` — 4 иконки (1:1, radar/car-pulse/gear/chart)
6. `06-illustration-car-heartbeat.jpg` — car heartbeat (4:3, используется в empty state)

---

## ВЫПОЛНЕННЫЕ ЗАДАЧИ (Session 5)

| # | Задача | Коммит | Статус |
|---|--------|--------|--------|
| P2-T1 | FuelTrim Analyzer | 70e3608 + 38b0c89 | Done |
| P2-T2 | Rule Engine + JSON rules | a7494e4 + a87fdb1 | Done |
| P2-T3 | Diagnosis Builder | 9e12b5c + 2d28dda | Done |
| P2-T4 | Integration full_diagnose | 0399558 + 0afed3b | Done |
| P2-T5 | API Views | f3f2a28 + d5e4ffb + e8c7e23 | Done |
| P3-T1 | DB Schema + Connection | 0067e15 | Done |
| P3-T2 | DB Writers | 2d4e0ad | Done |
| P3-T3 | Escalation Manager | 033c334 | Done |
| P3-T4 | Correlation Engine | b08e3a3 | Done |
| P3-T5 | Pipeline DB Integration | 756b10a | Done |
| P3-T6 | Escalation в Builder | 16de20e | Done |
| P3-T7 | Server Deploy + Smoke | — | Done |
| P4-T1 | CUSUM тренды | 468da8f | Done |
| P4-T2 | 57 JSON правил | — | Done |
| P4-T3 | 5 Python правил | — | Done |
| P4-T4 | Recalls Checker | — | Done |
| P4-T5 | Dashboard API v2 hook | 469e3ed | Done |
| P4-T6 | Графики трендов | 469e3ed | Done |
| P4-T7 | DiagnosisCard + Feedback | 469e3ed | Done |
| — | GLM анализ (3 скриншота) | — | Done |
| — | Luma генерации (6 изображений) | — | Done |
| — | Dashboard V3 branch + deploy | a3a93f6 | Done |
| — | GET /api/v2/diagnose-latest/ | 84af1aa | Done |
| — | Empty states (skeleton + car heartbeat) | 56a493a | Done |
| — | Контраст текста WCAG | 56a493a | Done |
| — | Онбординг с роботом | 56a493a | Done |
| — | Escalation в diagnose_latest | d0a4e3a | Done |
| — | Recalls в diagnose_latest | d0a4e3a | Done |
| — | CUSUM в diagnose_latest | d0a4e3a | Done |
| — | Vehicle Profile DB | 4310ba1 | Done |
| — | DTC Events tracking | 4310ba1 | Done |
| — | MCP Context Mode install | — | Done |
| — | MCP Memory Service install | — | Done |

---

## ОСТАВШИЕСЯ ЗАДАЧИ

### Backend
| # | Задача | Сложность | Описание |
|---|--------|-----------|----------|
| 23 | Correlation Engine cron | Сложная | Batch job на сервере: читать accel_windows+audio_windows за поездку, join по времени (±3 сек), запустить CorrelationEngine.analyze_trip(), write results to correlation_results. Можно через Django management command или cron |
| 24 | Ещё правила (до 100+) | Средняя | Добавить марко-специфичные правила (Li Auto, Chery, BMW). Правила по DTC кодам. Правила для PHEV/BEV |

### Frontend (Dashboard V3)
| # | Задача | Сложность | Описание |
|---|--------|-----------|----------|
| 26 | Recalls панель | Средняя | Новый компонент RecallsPanel.tsx — показывает отзывные кампании из report.recalls. Severity badge, дата, описание, кол-во затронутых авто |
| 27 | Escalation Timeline | Средняя | Визуализация escalation: когда впервые обнаружено, сколько дней active, текущий level (notice→warning→problem→urgent), was_dismissed |
| 28 | Next Steps панель | Лёгкая | Показать report.next_steps как ordered list с action items |
| 29 | Fuel Loss виджет | Лёгкая | Красивый виджет: monthly_rub, yearly_rub, sparkline потерь за месяц |
| 30 | Робот-подсказки | Средняя | При hover на диагноз — tooltip с роботом и простым объяснением |
| 31 | Mobile responsive | Средняя | Tailwind breakpoints: sm:col-span-12, md:col-span-6, lg:col-span-4 |
| 32 | Тёмная/светлая тема | Сложная | CSS variables + toggle в store + Tailwind dark: prefix |

### Маркетинг
| # | Задача | Сложность | Описание |
|---|--------|-----------|----------|
| 33 | Лендинг LLCAR | Сложная | Промо-страница с hero image от Luma (#4), описание фич, CTA |
| 34 | Промо-видео | Средняя | Luma video генерация для лендинга |

### Отложено (пользователь сказал "позже")
| # | Задача |
|---|--------|
| 8 | Мобильное приложение — интеграция API v2 (MAUI) |
| 9 | CustDev 3 — валидация нового функционала |
| 10 | Монетизация — бесплатные тесты + подписка |

---

## КЛЮЧЕВЫЕ ПРЕДУПРЕЖДЕНИЯ

1. **DrivingRegime, НЕ Regime** — normalizer.py
2. **Тесты:** `cd dashboard_build && python -m pytest tests/ -v` → 433 pass
3. **Frontend build:** `cd llcar-dashboard && npm run build`
4. **Deploy backend:** `scp file webadmin@185.55.57.145:/var/www/html/django/dashboard/diagnostic/file`
5. **Deploy frontend:** `scp -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa-v3/`
6. **Reload:** `touch /var/www/html/django/llcar/wsgi.py`
7. **GRANT ALL** уже сделан — не нужно повторять
8. **anomaly_engine.py** — старый движок, НЕ ТРОГАТЬ
9. **PID маппинг:** p010c=RPM, p010d=Speed, p0105=Coolant, p0106=LTFT raw(→(v-128)*100/128), p0142=Voltage(mV/1000)
10. **Робот-маскот:** 4 PNG в src/assets/robot-*.png (из папки "помощник")
11. **Онбординг localStorage:** `llcar-onboarding-v3-done`
12. **Vite base path V3:** `/static/spa-v3/` (V2 = `/static/spa/`)
13. **Context Mode MCP** — `npx -y context-mode`, активируется при рестарте
14. **mcp-memory-service** — `python -m mcp_memory_service`, активируется при рестарте
