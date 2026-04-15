# Final deliverables — S20 Suspension + Audio research

Дата: 2026-04-16. Ветка: `research-suspension-audio`. Финальная сборка: коммит `6beada3`.

Эта папка содержит только **актуальные, финальные** материалы S20 research. Весь audit trail, pipeline data и backup материалы — в родительских директориях `../_meta/`, `../topics/`, `../raw/` (не для прямого чтения, а для воспроизводимости).

---

## Что в этой папке

### 1. `REPORT.md` (1 491 строка) — **главный deliverable**

Полный integrated narrative отчёт. 14 частей + подсекции XI.7-XI.10 (cross-reference audio↔vibration, deeper verification partials, final verdict, checkpoint summary) + XII.6 (scenarios). Читается линейно от Part I (Введение) до Part XIV (Bibliography). Каждый факт имеет inline URL или resolvable DOI/SAE number.

Это тот документ, который нужно **читать целиком**, если хочется понять всё от физики до конкретных правил и roadmap.

### 2. `new-rules-production-ready.json` (211 строк, 17 правил) — **готово к merge в production**

Schema-compatible JSON, формат совпадает с `llcar-dashboard/public/data/diagnostic-rules.json`. Каждое правило имеет:
- `id`, `title`, `conditions`, `tier`, `dtc`, `type` — стандартные поля
- `_category` — `gate` / `upgrade` / `new`
- `_source` — живые URL или SAE paper numbers
- `_replaces` (если upgrade) — какое production rule заменяет
- `_physics` — краткое обоснование
- `_action` — что делать пользователю при срабатывании

**3 gate-правила**: `eusama_test_gate`, `road_class_iso8608_normalization`, `audio_suspension_source_validation`.
**6 upgrades** существующих: `shock_absorber_early_wear_corrected`, `wheel_imbalance_speed_resonance`, `engine_mount_harmonic_order`, `wheel_bearing_bpfo_envelope`, `knock_impulse_kurtosis`, `brake_dtv_developed_120kmh`.
**8 fully-new**: `ball_joint_early_wear`, `ball_joint_measured_play`, `bushing_wear_120_180hz`, `wheel_bearing_inner_race_sidebands`, `crest_factor_bearing_alarm`, `adaptive_damper_hydraulic_dead`, `brake_judder_btv_zero_dtv`, `strut_mount_bearing_turn`.

Integration: взять 11 fully-new + 6 upgrades → append к `threshold_rules.json` → удалить старые версии replaced rules из массива. Требует новых feature extractors (order detection, envelope spectrum, kurtosis, AZ/AX ratio, audio-accel cross-correlation, energy-band ratio) — разобрано в Part XIII REPORT.md.

### 3. `production-rules-crosscheck.md` (117 строк) — **42 production правила с verdict**

Детальный разбор каждого из 22 suspension + 20 noise правил из `diagnostic-rules.json`. Verdict: ✓ (полностью подтверждено), ⚠ (требует коррекции), ➕ (рекомендуется дополнение). Сводка:
- Suspension: 17/22 ✓, 5/22 ⚠ (требуют коррекции порогов), 3/22 ➕.
- Noise: 19/20 ✓, 1/20 ⚠ (bearing_wear upgrade), 2/20 ➕.

### 4. `custdev-snippets.json` (201 цитата из 36 интервью)

201 реплика реальных пользователей/диагностов из CUSTDEV2 транскриптов. Извлечены по 25 ключевым словам (подвеск, амортизатор, стойк, сайлент, шаров, стабилизатор, вибр, стук, скрип, хруст, ШРУС, подшипник, ступ). Для каждого snippet: interviewee, цитата, контекст ±, keywords_matched. Используется для business validation — что реально замечают и жалуются люди.

### 5. `sources-verified.json` (306 источников с HTTP verification status)

Registry всех упомянутых в research источников с их verification status:
- 28/28 SAE Technical Papers verified через sae.org
- 20/44 DOI verified через doi.org resolver
- 19/44 DOI definitely fake (HTTP 404)
- 5/44 uncertain (HTTP 403 — publisher блокирует HEAD)
- 231 ISBN/ГОСТ/ISO/non-URL refs — требуют manual проверки

Audit trail — позволяет для любого упомянутого в REPORT.md DOI/SAE number узнать, проверен ли он мной и какой код ответа.

---

## Что НЕ в этой папке (и почему)

Оставлено в родительских директориях для audit trail и воспроизводимости:

**`../_meta/REPORT-wave2-draft-backup.md`** — backup промежуточной Wave 2 версии REPORT.md (685 строк, фрагментарная). Сохранён для сравнения «до и после» финального rewrite.

**`../_meta/wave3-addendum.md`, `wave4-addendum.md`** — промежуточные факты-сборки по итогам отдельных волн поиска. Все полезные данные из них уже integrated в REPORT.md. Сохранены как audit trail.

**`../_meta/new-rules-consolidated.json`** — старая версия generated rules файла (до user feedback про чистый production-ready формат). Заменена в final/ на `new-rules-production-ready.json`.

**`../_meta/coverage-checklist.md`, `iterations.log`, `progress.json`, `source-cache.json`, `seed-topics.json`, `topics-queue.json`, `findings-index.json`, `glm-prompt-template.md`** — operational data pipeline (какие темы искали, в каком порядке, когда завершили итерацию). Не нужны для конечного пользователя.

**`../_meta/open-questions.md`** (165 deferred items) — список unknowns из итераций 1-2, которые перенесены в S22+. Полезно для следующего спринта, но не для текущего reading.

**`../topics/` (70 MD файлов, 6 114 строк)** — raw выходы GLM-агентов по каждой теме. Содержат много hallucinated-URL (особенно форумы). Частично вошли в narrative REPORT.md (только cross-verified факты). **Не рекомендуется к прямому reading** — hallucinations могут сбивать с толку. Держатся как source material для аудита происхождения фактов.

**`../raw/iter1/`, `../raw/iter2/`** — сырые JSON-выходы GLM-вызовов. Совсем pipeline internal.

---

## Как пользоваться

### Читать хочется всё

→ `REPORT.md` от начала до конца. ~1500 строк, 14 частей, linear flow от физики до bibliography.

### Нужно вытащить новые правила в production

→ `new-rules-production-ready.json` открыть, скопировать rules массив в `llcar-dashboard/public/data/diagnostic-rules.json`. Внимание: перед append удалить из существующего массива rules с id из `_replaces` поля (worn_suspension, wheel_imbalance, engine_mount_wear, bearing_wear, knock_detonation) — иначе будут дубликаты.

### Нужно оценить существующие правила

→ `production-rules-crosscheck.md` — пробежать таблицу, увидеть verdicts и conкретные требуемые коррекции.

### Нужно проверить конкретный источник из REPORT.md

→ `sources-verified.json`, искать по DOI/SAE/URL. Если нет — проверить вручную через doi.org/sae.org.

### Нужен голос реальных пользователей

→ `custdev-snippets.json`, фильтр по keywords (например `подшипник` или `стабилизатор`), получить набор цитат.

---

## Checklist соответствия требованиям (user feedback)

- ✓ Только подтверждённые факты (hallucinations исключены)
- ✓ 17 new rules в production-ready JSON формате
- ✓ 42 existing rules cross-checked с verdict
- ✓ Audio+vibration cross-reference (Section XI.7 REPORT.md)
- ✓ Deeper verification 6 partial rules (Section XI.8-XI.9 REPORT.md): 3 ready-to-deploy, 3 нужна shadow-mode calibration
- ✓ Scenarios для каждого нового правила (Section XII.6 REPORT.md)
- ✓ Полный bibliography (Section XIV REPORT.md, 10 групп)
- ✓ Narrative style, не таблицы-outtakes (весь REPORT.md переписан)

---

## Git

- Ветка: `research-suspension-audio`
- Последний commit: `6beada3` (на момент создания этой сборки)
- PR URL: https://github.com/llcarn8n/llcar-project/pull/new/research-suspension-audio (target `dashboard-v3`, НЕ `main`)

Для следующих спринтов (S21 — применение правил в production, S22 — 165 deferred unknowns) брать REPORT.md Part XIII как отправную точку по приоритизации.
