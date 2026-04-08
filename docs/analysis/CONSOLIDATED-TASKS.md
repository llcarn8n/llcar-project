# Консолидированный список задач из 3 анализов

> Дубли убраны. Уже сделанное в Session 6 отмечено.

## УЖЕ СДЕЛАНО (Session 6)
- ✅ Health Score v2 weighted algorithm
- ✅ Freeze Frame DTC display
- ✅ PDF report for STO
- ✅ Correlation cron management command (created, not scheduled)
- ✅ Code-splitting (2.7MB→108KB)
- ✅ TypeScript strict mode
- ✅ Recalls lru_cache
- ✅ Rules 81→110
- ✅ Light theme CSS variables
- ✅ Vehicle onboarding (58 brands select)
- ✅ Connection Wizard (6-step OBD guide)

---

## P0 — КРИТИЧЕСКИЕ БАГИ (диагностика сломана без них)

| # | GAP | Описание | Файлы | Сложность |
|---|-----|---------|-------|-----------|
| 1 | GAP-P1 | FactGenerator: 4/7 типов фактов. Нет LTFT_SEVERITY, z-score аномалий (VIBRATION_ANOMALY, AUDIO_ANOMALY), трендов (CUSUM_ALARM), корреляций | facts.py | 2 дня |
| 2 | GAP-R1 | Persistence score: захардкожен 4% вместо 0-20% из БД diagnostic_persistence | rule_engine.py | 1 день |
| 3 | GAP-R3 | Rule context: режим/прогрев/скорость не проверяются → ложные срабатывания | rule_engine.py, threshold_rules.json | 1-2 дня |
| 4 | GAP-B2 | find_situation_by_id() — TODO в коде → repair roadmaps пустые для не-DTC правил | knowledge_base.py, diagnosis_builder.py | 0.5 дня |

**Итого P0: ~5 дней**

---

## P1 — ВЫСОКИЙ ПРИОРИТЕТ (точность и качество)

| # | GAP | Описание | Сложность |
|---|-----|---------|-----------|
| 5 | GAP-R2 | Cooldown не проверяется в rule engine → dismissed диагнозы возвращаются | 0.5 дня |
| 6 | GAP-R4 | Минимум 3 последовательных срабатывания перед показом | 0.5 дня |
| 7 | GAP-P2 | Regime stability filter (не диагностировать при переходах) | 0.5 дня |
| 8 | GAP-P3 | Quality gate для шумных/сломанных данных | 0.5 дня |
| 9 | GAP-A2 | CUSUM 3 timescale (short/medium/long) + degradation_detected | 1 день |
| 10 | GAP-K2 | DTC→Situation mapping: 0.8%→~70% через system_id | 2 дня |
| 11 | GAP-K4 | Severity override для top-200 DTC кодов | 0.5 дня + данные |
| 12 | GAP-F1 | Dual-regime LTFT (idle vs 2000 RPM) — ключевое отличие от конкурентов | 1-2 дня |
| 13 | GAP-C1 | Correlation results → facts → rules (сейчас изолированы) | 1-2 дня |
| 14 | GAP-B4 | POST /api/v2/diagnose/ без escalation integration | 0.5 дня |
| 15 | Research | PHEV/BEV hierarchy fix (шаблоны = копии ICE) | 1 день |
| 16 | Research | CAN ID fix: хардкод 7E8 → 7E* prefix (Li Auto ECU 7EA-7EF) | 0.5 дня |
| 17 | Research | DTC severity normalization (P0171 info→warning) | 0.5 дня |
| 18 | Plans | Multi-packet diagnostics (1 пакет → 10-50) | 0.5 дня |
| 19 | Plans | RobotTooltip wiring (компонент есть, не подключён) | 0.5 дня |

**Итого P1: ~10-12 дней**

---

## P2 — СРЕДНИЙ ПРИОРИТЕТ (улучшения)

| # | GAP | Описание | Сложность |
|---|-----|---------|-----------|
| 20 | GAP-V1 | VIN auto-decode server-side | 1-2 дня |
| 21 | GAP-P4 | Feedback → weight adjustment loop | 2 дня |
| 22 | GAP-P5 | minutes_running / ambient_temp в EngineContext | 0.5 дня |
| 23 | GAP-K1 | Model/generation KB layers (сейчас только universal+brand) | 1-2 дня |
| 24 | GAP-K3 | dtc_patterns в БД вместо хардкода | 1 день |
| 25 | GAP-F2 | Bank 1 vs Bank 2 в FuelTrimAnalyzer | 0.5 дня |
| 26 | GAP-A4 | Offline diagnostics package для приложения | 3 дня |
| 27 | GAP-D3 | DTC events: ecu field, resolved_at tracking | 1 день |
| 28 | GAP-D4 | TimescaleDB retention policies (90/180 дней) | 5 мин |
| 29 | Plans | PseudoOrderPlot (amplitude vs RPM, expert mode) | 3-4 часа |
| 30 | Plans | Weather zones markArea на графиках | 0.5 дня |
| 31 | Plans | Data Source indicator в loaded state | 15 мин |
| 32 | Plans | LED pulsing StatusPills | 1 час |
| 33 | Plans | Trend arrows на metric cards | 1 час |
| 34 | Plans | Cold/warm trip analysis | 3-4 часа |
| 35 | Plans | Knowledge Base sidebar | 4-6 часов |
| 36 | Plans | Mobile responsive polish | 4-6 часов |

---

## QUICK WINS (< 1 час каждый)

| # | Что | Время |
|---|-----|-------|
| Q1 | Data Source indicator в loaded state | 15 мин |
| Q2 | RobotTooltip подключить к DiagnosisCardV2 | 30 мин |
| Q3 | Weather zones markArea на аудио/вибрации графиках | 30 мин |
| Q4 | LED pulsing на StatusPills | 1 час |
| Q5 | Trend arrows на InstrumentCard метриках | 1 час |
| Q6 | TimescaleDB retention policies | 5 мин |
