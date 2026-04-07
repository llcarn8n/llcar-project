# SESSION HANDOFF — 2026-04-07 (Session 4)

> Прочитай MEMORY.md + `docs/engine-design/*.md` + `docs/superpowers/plans/2026-04-07-diagnostic-engine-plan1-foundation.md`
> **GitHub:** https://github.com/llcarn8n/llcar-project
> **Live:** https://llcar.ru/v2/
> **Текущая ветка:** diagnostic-engine

---

## ТЕКУЩИЙ ШАГ: Выполнение Plan 1 через Subagent-Driven Development

### Что сделано в сессии 4

**Brainstorming (superpowers):**
- 9 секций дизайна утверждены и записаны в `docs/engine-design/01-09-*.md`
- 7 исследований агентов записаны в `docs/research-results/17-23-*.md`

**Design docs (docs/engine-design/):**
1. `01-ARCHITECTURE-OVERVIEW.md` — общая архитектура, тиры T1/T2/T3, гибрид offline/online
2. `02-VEHICLE-PROFILE.md` — VIN через OBD, LTFT коррекции, KB resolution path
3. `03-DATA-PIPELINE-FACTS-ML.md` — 5-шаговый pipeline, typed facts, ML training 3 этапа
4. `04-KNOWLEDGE-BASE.md` — 4-level resolver (universal→brand→model→generation), DTC patterns
5. `05-FUELTRIM-ANALYZER.md` — 10 уровней severity, 5 коррекций, 8 бесплатных тестов
6. `06-RULE-ENGINE.md` — JSON+Python правила, confidence scoring, escalation, weight versioning
7. `07-CORRELATION-ENGINE.md` — 5 корреляций accel↔audio, batch post-trip
8. `08-DATABASE-SCHEMA.md` — 9 таблиц (vehicle_profiles, baselines, scores, persistence, correlations, dtc_events, fact_log, user_feedback, dtc_patterns)
9. `09-DIAGNOSIS-BUILDER-API.md` — 7 блоков отчёта, recalls интеграция (9-tier уже в D:\transfer4), API v2

**Research docs (docs/research-results/):**
- 17: Situations analysis (764 sit, 50% automatable, top-20 rules)
- 18: DTC hierarchy (4-level, 36K codes, mapping strategy)
- 19: Knowledge base (483K situations, taxonomy mismatch)
- 20: Architecture review (Vehicle Profile, LTFT, Facts = P0)
- 21: VIN decode (NHTSA бесполезен для РФ, CalID crowdsource best)
- 22: VIN OBD reading (уже реализовано в app v1.04, баги найдены)
- 23: Situations specificity (4-level = фикция, реально 2, но строим 4)

**Plan 1: Foundation** записан в `docs/superpowers/plans/2026-04-07-diagnostic-engine-plan1-foundation.md`
- 8 tasks, ~62 теста
- Tasks: DB schema, VehicleProfile, KnowledgeBase, Normalizer, Feature Extractor, Facts, BaselineStore, Pipeline

### Следующий шаг
- Запустить superpowers:subagent-driven-development для выполнения Plan 1
- Task 1 первый (DB schema на сервер)

---

## КЛЮЧЕВЫЕ РЕШЕНИЯ

- KB = 4 уровня (данные пока на 2, но архитектура сразу на 4)
- LTFT/STFT = отдельная подсистема FuelTrim Analyzer (не правило)
- Recalls = интеграция существующей 9-tier системы из D:\transfer4
- ML = 3 этапа: Welford → калибровка весов → supervised
- Корреляции accel↔audio = batch, не real-time
- User feedback = обязательный для ML ground truth
- Приложение: VIN уже читается через OBD (Mode 09 PID 02)

---

## GIT

```
Ветка: diagnostic-engine
Коммиты сессии 4:
  8276d9f - Diagnostic engine analysis: 4 research docs
  9a69949 - VIN research: decode APIs + OBD reading
  13f8105 - Engine design: sections 1-3
  0cd393b - Engine design: sections 4-5
  16806f0 - Engine design: section 6
  6ad07e8 - Engine design: section 7
  04a07ce - Engine design: sections 8-9
  e66ce4b - Spec self-review fixes
  98b599e - Fix KB: restore 4-level hierarchy
  b8aea4b - Research: situations specificity
  3bb6521 - Plan 1: Foundation
```

## DEPLOY

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard"
rm -rf dist && npm run build
eval $(ssh-agent -s) && ssh-add /tmp/id_ed25519
/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa/
```
