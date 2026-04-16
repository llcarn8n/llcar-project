# Suspension + Audio Diagnostic Expertise (S20)

> Глубокая экспертиза по диагностике подвески через вибростенд + корреляции с аудио-сигналом.
> Собрана через рой GLM 5.1 агентов с верификацией источников. ~50 тем покрытия + ~20 follow-up.

---

## Структура

```
suspension-audio/
├── README.md                              ← этот файл (карта раздела)
├── METHOD.md                              ← как читать findings, что значат статусы
│
├── _meta/                                 ← мета-файлы пайплайна
│   ├── seed-topics.json                   50 seed-тем (40 base + 10 scientific-evidence)
│   ├── topics-queue.json                  очередь unknowns после iter1 (185 → 20 curated для iter2)
│   ├── coverage-checklist.md              30+ assertions для finalize gate
│   ├── glm-prompt-template.md             единый system+user prompt для GLM
│   ├── iterations.log                     timeline каждой итерации
│   ├── findings-index.json                master index: topic → MD → counts/status
│   ├── source-cache.json                  WebFetch URL cache (hash → result)
│   ├── progress.json                      runtime monitoring (ungated)
│   └── custdev-snippets.json              201 цитаты из 36 транскриптов
│
├── topics/                                ← основные deliverables (один MD per topic)
│   ├── suspension/                        12 тем — узлы подвески
│   ├── audio-correlations/                8 тем — звуковые сигнатуры дефектов
│   ├── vibrostand/                        5 тем — методология стенда
│   ├── brands/                            7 тем — brand-specifics
│   ├── expert-practice/                   8 тем — практика диагностики (custdev, cross-check vs prod code)
│   └── scientific-evidence/               10 тем — peer-reviewed only (DOI/SAE/ISO/ISBN)
│
└── raw/                                   ← сырые GLM ответы + verify
    ├── iter0/                             smoke test note
    ├── iter1/                             50 batch-{slug}.json + 50 verify-{slug}.json
    └── iter2/                             follow-up topics (15-20)
```

---

## Категории и темы

### `suspension/` — 12 тем (узлы подвески)

- shock-absorbers · struts-mcpherson · multilink-rear · ball-joints · tie-rods-ends
- stabilizer-bars-links · rubber-bushings · coil-springs · spring-seats-mounts
- air-suspension · adaptive-damping-mrc-amr · leaf-springs-commercial

### `audio-correlations/` — 8 тем (звуковые сигнатуры)

- frequency-ranges-per-defect · knock-impulse-signatures · harmonic-vs-broadband
- speed-dependence · load-dependence · spectrogram-patterns-susp
- road-surface-artifacts · mic-placement-cabin-vs-arch

### `vibrostand/` — 5 тем (методология стенда)

- resonance-method (EUSAMA/BOGE) · pass-criteria-norms-russia-eu (ГОСТ/ISO) · accelerometer-mounting-standards
- 4-post-hydraulic · shaker-eigenfrequency

### `brands/` — 7 тем (brand-specifics)

- bmw-mb-audi · toyota-honda-mazda · hyundai-kia-genesis · russian-lada-uaz-moskvich
- chinese-byd-geely-chery-changan · renault-peugeot-citroen · american-ford-gm

### `expert-practice/` — 8 тем (практика + кросс-чеки)

- diagnostic-sequence-standard · custdev-insights (201 quote из 36 transcripts) · common-diagnostician-mistakes
- field-tricks-no-equipment · edge-cases · new-rules-emerging
- cross-check-correlation-engine (с реальной проверкой `dashboard_build/diagnostic/correlation_engine.py`)
- cross-check-threshold-rules (с реальной проверкой `threshold_rules.json`)

### `scientific-evidence/` — 10 тем (ТОЛЬКО peer-reviewed)

Отдельный раздел с жёсткими ограничениями источников: ТОЛЬКО peer-reviewed journals (DOI), SAE Technical Papers, ISO/ГОСТ, книги SAE/Springer/Elsevier (ISBN), PhD dissertations, OEM TSB. Каждый claim имеет `evidence_level` ∈ {A, B, C, D}.

- sci-eusama-correlation-validity · sci-damping-ratio-vs-wear · sci-bushing-fatigue-lab-tests
- sci-resonance-theory-foundation (quarter-car) · sci-accelerometer-placement-iso
- sci-smartphone-sensor-validity · sci-road-input-psd-spectra (ISO 8608)
- sci-strut-wear-signature-empirical · sci-ball-joint-fatigue-models
- sci-machine-learning-suspension-diagnostic (2018-2024 review)

---

## Метод

Подробно — `METHOD.md`. Кратко: **autoresearch-семантика** — fixed seed 50 тем + iterative loop (unknowns → новые темы → след. итерация).
GLM 5.1 (`mcp__glm__ask` через z.ai) выдаёт structured JSON; Claude верифицирует через WebFetch/WebSearch (где URL); для научных источников citations (DOI/ISBN/SAE-номер) помечаются `[ref]` без HTTP-проверки.

Pipeline (scripts/):
1. `s20_glm_worker.py` — single-topic GLM call (resume-safe, idempotent)
2. `s20_dispatch_batch.py` — parallel pool (5 workers, 10s pause)
3. `s20_json_repair.py` — surgical fix for missing `}` before `]` в array-of-objects (частая ошибка GLM)
4. `s20_verify_worker.py` — URL checks via urllib (20s timeout, source-cache dedup)
5. `s20_synthesize_topic.py` — raw + verify → MD с inline-метками `[verified]/[unverified]/[contradicted]`
6. `s20_harvest_unknowns.py` — unknowns → topics-queue для следующей итерации
7. `s20_parse_custdev.py` — DOCX → snippets JSON

---

## Покрытие и качество

См. `_meta/coverage-checklist.md` — 30+ обязательных утверждений.
Финальная экспертиза = `≥ 90% checklist закрыто` + `≥ 60% findings verified` + 0 finding из forums в `scientific-evidence/`.

Текущие counts: см. `_meta/findings-index.json`.

## Ограничения и honest gaps

1. **GLM hallucinated URLs.** Часто GLM генерирует плауасибельные URL форумов (drive2.ru/b/XXX), которые не существуют. Verifier их ловит и отмечает `[unverified]`.
2. **Нет live web-recall.** GLM работает по training memory — может пропустить публикации после cutoff (~2024).
3. **CUSTDEV транскрипты — речевой формат.** Парсинг по keyword-match даёт ~80% in-context результаты, ~20% noise.
4. **Verify не проверяет non-URL refs.** SAE/ISBN/ГОСТ помечаются `[ref]` без реальной проверки. Полная валидация требует доступа к Google Scholar / SAE Digital Library / ScienceDirect.
5. **iter2 ограничена 20 темами** из 185 harvested unknowns (curated subset). Остальные 165 → `_meta/topics-queue.json` со статусом `deferred` для follow-up в S22.

## Follow-up (для S21+)

См. `topics/expert-practice/new-rules-emerging.md` — список новых diagnostic rules emerge из findings.
Главные кандидаты для production:
- Понизить пороги `worn_suspension.az_std` (3.0 → 1.0) и `az_range` (8.0 → 3.0) — текущие захватывают только critical wear
- Добавить order-detection в `vibration_rpm` (1×/2×/3× engine RPM) — снизит false positives от broadband noise
- Per-tire-size `TIRE_DIAMETER` (вместо хардкода 0.63m) — VIN-decode даёт точный размер
- BPFO/BPFI geometry-based bearing detection для `audio_wheel` (Saegusa et al., SAE 2014-01-0914)

## Branch & commit history

Ветка `research-suspension-audio`. PR target — `dashboard-v3` (НЕ `main`).
Коммиты в формате `research(susp): <phase> — <delta>` (см. `git log --oneline docs/research/suspension-audio/`).
