# METHOD — как читать findings и что значат статусы

## Структура каждого MD-файла в `topics/`

### Для general topics (`suspension/`, `audio-correlations/`, `vibrostand/`, `brands/`, `expert-practice/`)

```
# Title
Slug + Категория + Priority

## Описание
2-4 абзаца — что это, как устроено, почему ломается

## Симптомы
Маркированный список с severity (LOW/MEDIUM/HIGH) + when (при каких условиях)

## Vibration signature
Axes / freq range Hz / amplitude g / az_std / pattern (impulse/harmonic/broadband/resonance)

## Audio signature
Freq range / character / impulse|continuous / speed-dep / load-dep / mapping на 6 zones AudioTab.tsx

## Vibrostand method
Stand type / key metric / pass/fail thresholds / standard reference

## Brand specifics
Per-brand notes (модели, типичные дефекты, OEM partnumbers)

## Expert sequence
Пошаговая диагностическая процедура (action / check / tool)

## Correlations with other defects
Как отличить от других похожих дефектов

## Sources
[verified|unverified|contradicted] [type] url_or_ref — relevance
- type: forum | manual | sae | gost | iso | book | video

## Unknowns
Список того, что GLM не знает уверенно — пошло в iter2 как новые темы

## Meta
confidence_self / training_cutoff_note / synthesized timestamp
```

### Для scientific-evidence topics (`scientific-evidence/`)

Дополнительно:
- **Claims** с `evidence_level` ∈ {A, B, C, D} + citations + caveats
- **Key formulas** (если применимо)
- **Datasets and samples** (если есть public datasets)
- **Vibrostand relevance** (method + validated metrics + known limitations)
- **Contradictions in literature** (где есть competing PoVs)
- **Sources** обогащённые: type/url_or_ref/authors/year/title/evidence_level/relevance
  - **Жёсткое ограничение:** ТОЛЬКО peer-reviewed (DOI), SAE Technical Papers, ISO/ГОСТ/DIN, книги SAE/Springer/Elsevier (ISBN), PhD dissertations, OEM TSB

## Status labels на factoids

Inline-метка перед каждым source:

- `[verified]` — URL живой + содержание соответствует теме (WebFetch ok + relevance match), или claim подтверждён ≥2 независимыми peer-reviewed публикациями
- `[unverified]` — recall only, не проверено через WebFetch; либо URL недоступен (404, timeout); либо non-URL ref (SAE-номер, ISBN, ГОСТ) — корректность не проверена через web
- `[contradicted]` — нашли opposite в другом достоверном источнике; такие findings выкинуты из основных secций, перенесены в `findings-index.json`
- `[ref]` (только в `verify-*.json`) — non-URL reference (ISBN/DOI/SAE-номер), не подлежит HTTP-проверке

## Evidence levels (только для `scientific-evidence/`)

- **A** — replicated peer-reviewed (≥2 independent publications)
- **B** — single peer-reviewed с N≥20 выборкой
- **C** — OEM bulletin / international standard
- **D** — dissertation / conference proceedings

## Как воспроизвести pipeline

```bash
# 1. Setup (разовое)
git checkout research-suspension-audio
pip install json-repair python-docx

# 2. Iter N (повторяемое)
python scripts/s20_dispatch_batch.py --iter N --source seed --workers 5  # или --source queue для unknowns
python scripts/s20_verify_worker.py  --iter N --all
python scripts/s20_synthesize_topic.py --iter N --all
python scripts/s20_harvest_unknowns.py --iter N

# 3. CUSTDEV (разовое)
python scripts/s20_parse_custdev.py
```

Идемпотентность: все скрипты пропускают уже-сделанное (raw файл с `parsed_ok=True` + MD есть → skip).
Resume: после прерывания просто запусти ту же команду — продолжит с того же места.

## Stop-criterion для iterations

Итерации останавливаются когда:
1. `topics-queue.json` пуст (`status:queued` count == 0), И
2. Последние 2 итерации вернули `new_unknowns == 0`

Иначе hard cap = 10 итераций (после чего forced stop, остатки → `_meta/open-questions.md`).

## Что НЕ в scope этого раздела

- Изменение production кода (`llcar-dashboard/src/`, `dashboard_build/`) — read-only для контекста
- Обновление `threshold_rules.json` / `correlation_engine.py` — отдельный спринт S21 на основе `topics/expert-practice/new-rules-emerging.md`
- Прочие узлы NVH (двигатель, трансмиссия, тормоза, кузов) — отдельные спринты
- Импорт мануалов / изображений на prod — отдельный спринт
