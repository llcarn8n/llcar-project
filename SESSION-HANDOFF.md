# SESSION HANDOFF — 2026-04-07 (Session 5 COMPLETE)

> **Прочитай этот файл + MEMORY.md**
> **GitHub:** https://github.com/llcarn8n/llcar-project
> **Live V2:** https://llcar.ru/v2/
> **Live V3:** https://llcar.ru/v3/
> **Ветки:** `diagnostic-engine` (backend stable), `dashboard-v3` (frontend dev)
> **Python:** 3.12, тесты: `cd dashboard_build && python -m pytest tests/ -v`
> **Сервер:** 185.55.57.145, SSH: `/tmp/llcar_ssh.sh`, SCP: `/tmp/llcar_scp.sh`
> **DB:** PostgreSQL `vehinfo`, Django connection `connections['vehinfo']`, user `webadmin`/`webadmin`
> **MCP:** Context Mode + mcp-memory-service установлены (активируются при рестарте)

---

## ЧТО СДЕЛАНО В СЕССИИ 5

### Plans 2-4 полностью выполнены
- **426 тестов**, все pass
- **62 правила** (57 JSON + 5 Python)
- **23 Python модуля** в diagnostic/
- **9 таблиц** в PostgreSQL (schema deployed, GRANT ALL to webadmin)
- **API v2** live: POST /diagnose/, POST /feedback/, GET /history/, GET /diagnose-latest/
- **Dashboard V3** deployed на /v3/ с роботом-маскотом, онбордингом, car heartbeat

### Ключевые модули

```
dashboard_build/diagnostic/
├── __init__.py
├── api_views.py          ← 4 endpoints (diagnose, feedback, history, diagnose-latest)
├── baseline_store.py     ← Welford online statistics
├── correlation_engine.py ← 5 batch correlations accel↔audio
├── cusum.py              ← CUSUM trend detector (↑/→/↓)
├── db.py                 ← MockDB + get_cursor() for Django
├── db_readers.py         ← read_history()
├── db_writers.py         ← save/load baselines, fact_log, scores, feedback
├── diagnosis_builder.py  ← 7-block report + escalation
├── escalation.py         ← PersistenceRecord, EscalationManager (4 levels, cooldown)
├── facts.py              ← 14 FactTypes, FactGenerator
├── feature_extractor.py  ← vibration, crest factor, fuel trim, virtual freq
├── fuel_trim_analyzer.py ← 8 severity levels, 5 corrections, cross-analysis
├── knowledge_base.py     ← 4-level resolver (universal→brand→model→gen)
├── normalizer.py         ← DrivingRegime, NormalizedPacket, validation
├── pipeline.py           ← full_diagnose() with optional DB persistence
├── recalls_checker.py    ← 298 campaigns, 91 brands, fuzzy matching
├── rule_engine.py        ← JSON + Python rules, confidence scoring
├── rules/
│   ├── __init__.py
│   ├── complex_rules.py  ← 5 Python rules (fuel_bank_cross, vibration_regime, etc.)
│   └── threshold_rules.json ← 57 JSON rules
└── vehicle_profile.py    ← VehicleProfile dataclass, LTFT corrections
```

### Dashboard V3 (llcar-dashboard/)
- Branch: `dashboard-v3`
- Vite base: `/static/spa-v3/`
- New components: DiagnosisCardV2, HealthTrends, FeedbackButtons, OnboardingTour
- Robot mascot: 4 variants in src/assets/
- Auto-fetch from /api/v2/diagnose-latest/ every 30s
- Text contrast fixed (WCAG)
- Luma images in luma-output/

---

## СЛЕДУЮЩИЕ ЗАДАЧИ (по порядку)

### Backend (17-24)
| # | Задача | Файлы |
|---|--------|-------|
| 17 | EscalationManager в diagnose_latest | api_views.py — load/save escalation from diagnostic_persistence |
| 18 | Recalls в diagnose_latest | api_views.py — RecallsChecker.check(), добавить в отчёт |
| 19 | CUSUM в diagnose_latest | api_views.py — read_history → pass to build_report(history=) |
| 20 | Anomaly scores persistence | api_views.py — уже частично работает, проверить |
| 21 | Vehicle Profile из DB | Загружать/сохранять VehicleProfile из vehicle_profiles |
| 22 | DTC Events tracking | Запись DTC кодов в dtc_events с freeze frame |
| 23 | Correlation Engine cron | Batch job: read accel+audio, join, run correlations |
| 24 | Ещё правила (до 100+) | Больше марко-специфичных правил |

### Frontend (25-32)
| # | Задача | Файлы |
|---|--------|-------|
| 25 | V2 Health Scores в подсистемах | Diagnostics.tsx — уже частично |
| 26 | Recalls панель | Новый компонент — отзывные кампании |
| 27 | Escalation Timeline | Визуализация нарастания серьёзности |
| 28 | Next Steps панель | Рекомендации из next_steps |
| 29 | Fuel Loss виджет | Красивый виджет потерь топлива |
| 30 | Робот-подсказки | Tooltip с роботом для каждого диагноза |
| 31 | Mobile responsive | Адаптация под мобильные |
| 32 | Тёмная/светлая тема | Toggle между темами |

### Маркетинг (33-34)
| # | Задача |
|---|--------|
| 33 | Лендинг LLCAR |
| 34 | Промо-видео |

---

## ВАЖНЫЕ ЗАМЕТКИ

1. **DrivingRegime, НЕ Regime** — normalizer.py
2. **GRANT ALL** уже сделан для webadmin на все таблицы
3. **gunicorn www-data** (systemd) НЕ имеет sudo restart — используем touch wsgi.py для webadmin gunicorn (--reload)
4. **PID маппинг:** p010c=RPM, p010d=Speed, p0105=Coolant, p0106=LTFT (raw→(v-128)*100/128), p0142=Voltage(mV/1000)
5. **Робот-маскот:** 4 варианта в llcar-dashboard/src/assets/robot-*.png
6. **Luma output:** 6 изображений в luma-output/
7. **Context Mode MCP** установлен — активируется при рестарте Claude Code
8. **mcp-memory-service** установлен — persistent memory с semantic search
9. **Режимы сессии:** MAKE NO MISTAKES + Senior Engineer
10. **localStorage key для онбординга:** llcar-onboarding-v3-done

---

## GIT КОММИТЫ СЕССИИ 5

```
Plan 2:
  70e3608 feat: FuelTrimAnalyzer (23 tests)
  38b0c89 fix: FuelTrim review fixes
  a7494e4 feat: RuleEngine + 15 JSON rules (19 tests)
  a87fdb1 fix: Rule Engine deviation scaling
  9e12b5c feat: DiagnosisBuilder 7-block report (25 tests)
  2d28dda fix: DiagnosisBuilder review fixes
  0399558 feat: full_diagnose() integration (19 tests)
  0afed3b fix: Integration DTC test fix
  f3f2a28 feat: API Views 3 endpoints (13 tests)
  d5e4ffb fix: API Views packet mutation fix
  e8c7e23 fix: @csrf_exempt for API v2

Plan 3:
  0067e15 feat: DB Schema + MockDB (10 tests)
  2d4e0ad feat: DB Writers (18 tests)
  033c334 feat: EscalationManager (17 tests)
  b08e3a3 feat: CorrelationEngine 5 correlations (25 tests)
  756b10a feat: Pipeline DB Integration + API updates (20 tests)
  16de20e feat: Escalation в DiagnosisBuilder (9 tests)

Plan 4:
  468da8f feat: CUSUM trends (13 tests)
  xxxxxxx feat: 57 JSON rules (expanded from 15)
  xxxxxxx feat: 5 Python complex rules (31 tests)
  xxxxxxx feat: RecallsChecker (25 tests)
  469e3ed feat: Dashboard V2 components
  f0e7566 Plan 4 committed

Dashboard V3:
  a3a93f6 feat: V3 branch + robot mascot
  84af1aa feat: diagnose-latest endpoint + auto-fetch
  56a493a feat: contrast fix + onboarding + car heartbeat
```
