# LLCAR Master Roadmap — ВСЕ идеи и задачи

> Этот файл содержит ВСЕ задачи, идеи и планы из всех сессий.
> Ничего не потеряно. Отмечено что сделано и что нет.

---

## ВЫПОЛНЕНО (Sessions 1-5)

### Session 1-3: Brainstorming + Research + Design
- [x] 9 секций дизайна движка (docs/engine-design/01-09)
- [x] 7 исследований агентов (docs/research-results/17-23)
- [x] CustDev 1+2 анализ (14+36 респондентов)
- [x] Конкурентный анализ CarScanner
- [x] Продуктовая стратегия
- [x] Diagnostic tables & norms reference

### Session 4: Plan 1 Foundation
- [x] VehicleProfile — LTFT corrections, KB resolution path
- [x] KnowledgeBase — 4-level resolver, DTC patterns
- [x] Normalizer — DrivingRegime, validation, tier detection
- [x] Feature Extractor — vibration, crest factor, fuel trim
- [x] Facts — 14 FactTypes, FactGenerator
- [x] BaselineStore — Welford, MAX_WINDOW=500
- [x] DiagnosticPipeline — process() orchestrator
- [x] DB Schema v2 — 9 таблиц SQL

### Session 5: Plans 2-4 + Dashboard V3
- [x] FuelTrimAnalyzer — 8 levels, 5 corrections, cross-analysis, loss calc
- [x] RuleEngine — JSON + Python rules, confidence scoring
- [x] DiagnosisBuilder — 7-block report
- [x] API Views — POST /diagnose/, /feedback/, GET /history/
- [x] DB Connection Layer — MockDB + get_cursor()
- [x] DB Writers — save/load baselines, fact_log, scores, feedback, profile, dtc
- [x] EscalationManager — 4 levels, cooldown 7 days
- [x] CorrelationEngine — 5 batch correlations
- [x] Pipeline DB Integration — full_diagnose with persistence
- [x] CUSUM Detector — health trends ↑/→/↓
- [x] 57 JSON rules (was 15)
- [x] 5 Python complex rules
- [x] RecallsChecker — 298 campaigns, 91 brands
- [x] Dashboard V2 components (hook, DiagnosisCardV2, HealthTrends, FeedbackButtons)
- [x] Dashboard V3 branch + deploy
- [x] GET /api/v2/diagnose-latest/ — server-side diagnosis
- [x] Escalation + Recalls + CUSUM в diagnose-latest
- [x] Vehicle Profile DB persistence
- [x] DTC Events tracking
- [x] GLM анализ (3 скриншота, 10 visual bugs)
- [x] Luma генерации (6 изображений)
- [x] Empty states с skeleton + car heartbeat
- [x] Контраст текста (WCAG fix)
- [x] Онбординг с роботом (5 шагов)
- [x] MCP Context Mode установлен
- [x] MCP Memory Service установлен

---

## НЕ ВЫПОЛНЕНО — BACKEND

### Высокий приоритет

#### 23. Correlation Engine Cron Job
**Что:** Batch job на сервере для запуска CorrelationEngine после каждой поездки.
**Как:** Django management command `python manage.py run_correlations --client_hash=X`
**Шаги:**
1. Создать `dashboard_build/diagnostic/management/commands/run_correlations.py`
2. Читать accel_windows + audio_windows за последнюю поездку (группировка по packet_id или временному окну)
3. Join по времени с tolerance ±3 секунды
4. Добавить OBD данные из ecu_7e8 для каждого окна (RPM, speed)
5. Запустить CorrelationEngine.analyze_trip(windows)
6. Сохранить результаты через save_results()
7. Настроить cron на сервере: `*/30 * * * * cd /var/www/html/django && venv/bin/python manage.py run_correlations`
**Зависимости:** correlation_engine.py (готов), accel_windows + audio_windows + ecu_7e8 таблицы (есть данные)
**Файлы:** management/commands/run_correlations.py (новый)

#### 24. Больше правил (до 100+)
**Что:** Расширить threshold_rules.json и complex_rules.py
**Категории для добавления:**
- Марко-специфичные правила (Li Auto PHEV: battery SOC, range extender, electric motor)
- Правила по DTC кодам (P0171→fuel_lean boost, P0300→misfire boost)
- Правила для data из ecu_7ea (электромотор), ecu_7eb (BMS), ecu_7ef (охлаждение)
- Правила для PHEV/BEV (SOC < 20%, battery temp > 40°C, charging anomalies)
- Сезонные правила (зимние vs летние пороги)
**Файлы:** rules/threshold_rules.json, rules/complex_rules.py

#### 25. Мульти-пакетная диагностика
**Что:** diagnose_latest_view сейчас берёт ОДИН последний пакет. Нужно брать N последних и агрегировать.
**Как:** Читать 10-50 последних пакетов, пропускать каждый через pipeline, возвращать отчёт с baseline accumulation.
**Файлы:** api_views.py (diagnose_latest_view)

#### 26. Health Score v2 алгоритм
**Что:** Текущий health score = 100 - avg(confidence of fired rules). Это грубо.
**Улучшение:** Взвешенное среднее с учётом severity, persistence, и baseline confidence.
**Файлы:** diagnosis_builder.py (_compute_health_scores)

---

### Средний приоритет

#### 27. Freeze Frame при DTC
**Что:** Сейчас write_dtc_events сохраняет freeze frame. Нужно использовать его при диагностике.
**Как:** При DTC P0171: показать "при каких условиях возникло" (RPM, speed, coolant в момент ошибки)
**Файлы:** diagnosis_builder.py, api_views.py

#### 28. Baseline качество
**Что:** Показывать пользователю: "нужно ещё N поездок для точной диагностики"
**Как:** baseline_status уже возвращает ready/total_samples/samples_needed. Нужно показать в UI.
**Готовность:** Данные уже в API, нужен только frontend виджет.

#### 29. Rule Weight Calibration (v2)
**Что:** Калибровка весов правил на основе user_feedback (confirmed/dismissed).
**Как:** Если правило confirmed 80/100 раз → вес растёт. Если dismissed 40/50 → вес падает.
**Предусловие:** Нужно 50+ клиентов с feedback данными.
**Файлы:** Новый модуль calibration.py, обновление rule_engine.py

#### 30. Популяционные нормы
**Что:** Сравнение baselines текущего авто с "нормой" для такого же типа авто.
**Как:** Агрегация baselines всех клиентов с таким же brand/model → POPULATION_PRIORS
**Предусловие:** 50+ клиентов с одинаковой моделью
**Файлы:** Новый модуль population_norms.py

---

### Низкий приоритет (Plan 3+ идеи из спеков)

#### 31. PDF отчёт для СТО
**Что:** Генерация PDF с диагнозами для печати/отправки на СТО
**Описание из spec 09:** VIN, пробег, дата, Health Score, диагнозы, рекомендации
**Файлы:** Новый pdf_report.py (ReportLab или WeasyPrint)

#### 32. A/B тестирование весов
**Что:** Тестирование новых весов правил vs старых
**Как:** rule_version в отчёте, сравнение accuracy между v1 и v2
**Предусловие:** Калибровка весов (задача 29)

#### 33. Supervised ML (v3)
**Что:** ML модель вместо rule engine. features → diagnosis
**Предусловие:** 500+ клиентов с confirmed diagnoses
**Файлы:** ml_classifier.py (новый)

---

## НЕ ВЫПОЛНЕНО — FRONTEND (Dashboard V3)

### Высокий приоритет

#### 34. Recalls панель
**Что:** Компонент RecallsPanel.tsx — отзывные кампании из report.recalls
**UI:** Список карточек: severity badge (critical/high/medium), title_ru, date, count авто, source
**Размещение:** Под DiagnosisCardV2 или в отдельном табе
**Файлы:** src/components/panels/RecallsPanel.tsx (новый), Diagnostics.tsx (добавить)

#### 35. Escalation Timeline
**Что:** Визуализация нарастания серьёзности диагноза
**UI:** Горизонтальная шкала: notice → warning → problem → urgent. Отметки: first_seen, days_active, was_dismissed
**Данные:** report.escalations[].{first_seen, days_active, level, level_name, consecutive_count}
**Файлы:** src/components/panels/EscalationTimeline.tsx (новый)

#### 36. Next Steps панель
**Что:** Рекомендации из report.next_steps
**UI:** Ordered list с иконками: 🔧 Записаться на диагностику, 🧪 Провести тест крышки, etc.
**Файлы:** src/components/panels/NextSteps.tsx (новый)

#### 37. Fuel Loss виджет
**Что:** Потери топлива из report.fuel_loss
**UI:** Крупная цифра monthly_rub с ₽, yearly_rub, возможно sparkline за месяц
**Файлы:** src/components/panels/FuelLossWidget.tsx (новый)

### Средний приоритет

#### 38. Робот-подсказки
**Что:** При hover на диагноз — tooltip с роботом и простым объяснением
**UI:** Робот (default) + пузырь с текстом типа "Это значит что подвеска стучит"
**Файлы:** src/components/shared/RobotTooltip.tsx (новый)

#### 39. Mobile responsive
**Что:** Адаптация V3 под мобильные экраны
**Как:** Tailwind breakpoints: sm:col-span-12, md:col-span-6, lg:col-span-4
**Файлы:** Diagnostics.tsx, все панели

#### 40. Correlation Results в UI
**Что:** Показать результаты batch correlations (если есть)
**UI:** Карточки: "Обнаружена корреляция вибрация↔RPM → износ опор двигателя (r=0.72)"
**Данные:** Нужен GET endpoint для correlation_results
**Файлы:** Новый endpoint + CorrelationPanel.tsx

#### 41. Data Source индикатор
**Что:** Показать откуда берутся данные (OBD есть / Акселерометр есть / Аудио есть)
**Данные:** report.data_source.{has_obd, has_accel, has_audio}
**UI:** 3 точки с подписями (как в empty state, но для loaded state)
**Файлы:** DiagnosisCardV2.tsx (модификация)

### Низкий приоритет

#### 42. Тёмная/светлая тема
**Что:** Toggle между dark HUD и light clean тема
**Как:** CSS variables в theme.ts + toggle в store + Tailwind dark: prefix
**Файлы:** theme.ts, dashboardStore.ts, все компоненты

#### 43. Export to PDF
**Что:** Кнопка "Скачать отчёт" → PDF с диагнозами
**Как:** html2canvas + jsPDF или серверная генерация
**Файлы:** src/utils/exportPdf.ts (новый)

#### 44. Сравнение поездок
**Что:** Выбрать 2 поездки и сравнить health scores
**UI:** Side-by-side view с diff
**Файлы:** src/pages/Compare.tsx (новый)

---

## НЕ ВЫПОЛНЕНО — МАРКЕТИНГ

#### 45. Лендинг LLCAR
**Что:** Промо-страница для привлечения пользователей
**Hero:** Luma image #4 (SUV + голограмма) или custom
**Секции:** Как работает, Преимущества, Health Score demo, Скачать, CTA
**Технологии:** Static HTML или Next.js
**Файлы:** Отдельный проект или поддомен landing.llcar.ru

#### 46. Промо-видео
**Что:** 30-60 сек видео для лендинга/YouTube
**Как:** Luma video генерация (ray-2 или ray-3)
**Сценарий:** Машина → OBD адаптер → телефон → диагноз → маршрут ремонта

#### 47. Робот-маскот Guidelines
**Что:** Стандарт использования робота LLCAR
**Что есть:** 11 вариантов в папке "помощник" (Error_Codes_Caricature_*.png)
**Что нужно:** SVG версии, гайдлайн по использованию (когда какой вариант)

---

## НЕ ВЫПОЛНЕНО — ПРИЛОЖЕНИЕ (отложено пользователем)

#### 48. Интеграция API v2 в мобильное приложение
**Что:** MAUI приложение (v1.04) отправляет данные на /api/v2/diagnose/
**Текущий код:** _archive/old-app-v104/llcarv104/
**Что менять:** HTTP client → POST /api/v2/diagnose/ вместо старого формата
**Показывать:** Светофор can_drive, топ-3 диагноза, feedback кнопки

#### 49. CustDev 3
**Что:** Валидация нового функционала с пользователями
**Гипотезы:** Health Score понятен? Маршрут ремонта полезен? Робот нравится?
**Метод:** 10-15 интервью с автовладельцами

#### 50. Монетизация
**Что:** Бесплатные тесты (8 шт из FuelTrim) + подписка на полную диагностику
**Модель:** Freemium: бесплатно = health score + топ-1 диагноз, подписка = все диагнозы + маршруты + recalls
**Цена:** Из CustDev: 50-150 руб/мес или 500-1500 руб/год

---

## ДИЗАЙН-РЕШЕНИЯ (утверждены Петром)

1. **HUD/Sci-Fi стиль** — остаётся, НЕ менять на flat design (GLM предлагал — отклонено)
2. **Cyan/teal accent** — основной цвет бренда
3. **Glass morphism panels** — backdrop-filter: blur + полупрозрачный фон
4. **Orbitron шрифт** — для заголовков и меток
5. **Rajdhani шрифт** — для текстового контента
6. **Consolas/monospace** — для чисел и данных
7. **Робот-маскот** — используется в empty states, онбординге, подсказках
8. **3D визуализация** — только для акселерометра (SmartSphere), НЕ для всего dashboard
9. **Progressive disclosure** — basic view + EXPERT toggle + V2 toggle
10. **Дизайн не минимализм без осей** — графики должны иметь оси и подписи (feedback из ранних сессий)

---

## ТЕХНИЧЕСКИЙ ДОЛГ

1. **anomaly_engine.py** (562 строки) — старый движок, дублирует функционал diagnostic/. Нужно полностью заменить при деплое
2. **Два gunicorn процесса** — www-data (systemd) и webadmin (manual). Нужно оставить один
3. **SQLite default DB** — Django auth. Не мигрировали в PostgreSQL
4. **TypeScript strict mode** — llcar-dashboard не в strict mode, есть any типы
5. **npm chunks > 500KB** — Vite warning, нужен code-splitting для Three.js
6. **recalls-database.json** — 6271 строка, загружается каждый запрос. Нужно кэшировать
7. **EchoVault pip package** — установлен но сломан (v0.2.8). Можно удалить: `pip uninstall echovault`
