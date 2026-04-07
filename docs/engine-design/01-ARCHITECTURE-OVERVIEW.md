# Секция 1: Общая архитектура диагностического движка

**Дата:** 2026-04-07
**Статус:** утверждено Петром

---

## Подход: Rule Engine + ML-Ready (Подход C)

Движок = набор правил (rules), которые работают поверх нормализованных фактов (facts). Правила извлекаются из трёх источников: DTC-индекс, 764 ситуации, YouTube-кейсы. Все правила хранятся в JSON/Python, не в БД. Архитектура закладывает точки для ML: Welford baselines для обучения без учителя, сбор фичей для будущих моделей.

---

## Гибрид: приложение (offline) + сервер (online)

### Приложение (.NET MAUI) — offline диагностика

- **Vehicle Profile** — онбординг: VIN через OBD (автоматически), марка/модель/поколение (автоопределение из VIN + выбор из короткого списка), модификации (ГБО, Евро-2)
- **Local LTFT Светофор** — таблица 10 уровней, чистая арифметика, работает без интернета
- **Local DTC Lookup** — dtc-index.json (4.9MB, кэшируется один раз), severity + can_drive + title_ru
- **"Безопасно ли ехать?"** — coolant > 105C, voltage < 13V, severity=danger DTC → "НЕ ЕХАТЬ"
- Отправка данных на сервер через POST /api/diagnose/

### Сервер (Django, 185.55.57.145) — полная диагностика

**Data Pipeline:**
```
Raw Data → Normalizer → Feature Extractor → Fact Generator → Fact Store → Rule Engine → Diagnosis Builder
```

**Rule Engine (3 подсистемы):**
1. FuelTrim Analyzer — выделенная подсистема LTFT/STFT (10 уровней + 5 коррекций)
2. Threshold Rules — JSON-правила, 100+ штук, интерпретируются движком
3. Correlation Rules — Python-правила для сложной логики (accel↔audio)

**Knowledge Base (4-level resolver):**
- Universal → Brand → Model → Generation (most specific wins)
- 36K DTC кодов, 764+ ситуаций, 298 отзывных, 32 платформы
- DTC Patterns — мульти-DTC корреляции (P0171+P0174 = подсос)

**Diagnosis Builder:**
- Severity + canDrive ("безопасно ли ехать?")
- Маршрутная карта ремонта (бесплатное → дешёвое → дорогое)
- "Сколько теряешь в месяц" (калькулятор)
- Escalation (notice → warning → problem → urgent)
- PDF для контроля СТО

**ML-Ready Layer:**
- Welford baselines (per client x regime, с decay, MAX_WINDOW=500)
- anomaly_scores → TimescaleDB (90-day retention)
- CUSUM (3 timescales) + severity escalation
- features_json → future ML training data

**Batch Jobs (cron):**
- Correlation engine (accel↔audio, per trip)
- Baseline aggregation (population priors update)
- Recall matching (new recalls → affected clients)

---

## Data Tiers

| Tier | Источники | Диагностика |
|------|-----------|-------------|
| T1 | OBD-II (ELM327): LTFT, STFT, RPM, coolant, voltage, DTC | Двигатель, топливная, электрика, коррекции |
| T2 | T1 + акселерометр (смартфон) | + подвеска, балансировка, опоры двигателя |
| T3 | T2 + аудио (микрофон смартфона) | + подшипники, выхлоп, кросс-корреляции |

---

## Формат вывода диагноза

Движок ВСЕГДА генерирует полный отчёт. Слой отображения решает что показать:
- Приложение → светофор + одна фраза
- Дашборд → полный отчёт + графики + тренды
- PDF → формальный отчёт для СТО

---

## Ключевые решения

1. **Vehicle Profile** — обязательный, с онбординга. Блокирует LTFT коррекции.
2. **Feature Extractor** — отдельный шаг между Normalizer и Facts.
3. **FuelTrim Analyzer** — выделенная подсистема, не правило.
4. **4-level KB resolver** — universal → brand → model → generation.
5. **DTC Patterns** — мульти-DTC корреляции.
6. **Severity Escalation** — notice → warning → problem → urgent (по времени).
7. **Batch jobs** — корреляции, baseline aggregation, recall matching.
8. **Baseline decay** — MAX_WINDOW=500, не бесконечный Welford.
9. **Typed Facts** — промежуточный слой между сырыми данными и правилами.
10. **ML-Ready** — features_json + user_feedback + версионирование весов.
