# S30 — Детальный план следующей сессии

**Ветка:** `dashboard-v3` · **Дата S29 close:** 2026-04-24 · **Модель:** MAKE NO MISTAKES + Senior Engineer · **Контекст:** свежий ~200K.

Этот план строится на данных собранных в S29 (см. `.omc/plans/s29-next-session.md` и `memory/project_session29_progress.md`). **S29 P0 закрыт полностью**: 422 387 webp на проде, 100% curl + Playwright verified. В S30 переходим к контентной работе: orphan ingest + DITA integration + долговые карамели.

---

## 🎯 Цель S30

Устранить разрыв **569 vehicles ↔ 484 kb folder ↔ 658 gens manual.md** — 199 моделей объявлены в UI, но у них нет kb-папок. Пользователь правильно указал: это НЕ фантомы — все мануалы физически лежат в `D:/manuals-export/`, просто не импортированы.

Параллельно: починить ManualViewer чтобы 480 gens получали реальную структуру (H2 sections → topics) вместо плоских 300 секций с cap.

---

## 📊 Фактическое состояние на старт S30

| метрика | значение | замечание |
|---|--:|---|
| Brands в kb/ | 77 | |
| Gens с manual.md | **658** | из них 480 с DITA slim, 178 plain MD |
| Gens с `manual-dita-slim.json` | **480** | commit `1c0dd74` |
| Vehicles.json models | **569** | заявлено в UI dropdown |
| Orphans (vehicles без kb/) | **199** | найдено в `.omc/research/s29-orphan-models.md` |
| No-manual gens | 52 | kb-папка есть, но внутри пусто |
| Strays (kb без vehicles) | 114 | kb-папка есть, но не в dropdown |
| Webp на проде | **422 387** (100% 200 OK) | ✅ S29 closed |
| URL route `/api/kb-image/` | ✅ commit `ea1d4b0` | |

**Verified в S29 финале:**
- curl HEAD: 100/100 sample = 200 OK
- Playwright browser: 37/37 kb-image requests на Audi A4 = 200 OK
- ManualViewer показывает картинки реально

---

## 🚨 P0-1 — Orphan ingest 199 моделей (2-3 часа)

### Контекст

User в S29: «У нас **нет фантомных моделей** — скорее всего им не нашлось изображений хотя они точно есть. У нас мануалов **гораздо больше**, полных мануалов **649** (reference commit `fd9a942` "S27 Этап H3 — ingest 442 мануалов (648 ok всего)"). Нам нужно полностью восстановить картину.»

**Проверено:** для `bestune` (4 orphans: b70, t77, t90, t99) все мануалы физически есть в `D:/manuals-export/bestune/` (`b70`, `t77`, `t99`, плюс `bestune_t90`). Аналогично будет для остальных 195.

### Подготовлено в S29

1. **`scripts/s29_full_manual_mapper.py`** (написан, но user не дал запустить — "unverifiable contents").
   - Для каждой модели vehicles.json ищет мануал через цепочку:
     1. `_kb_generations_index.json` direct/fuzzy match
     2. `D:/manuals-export/<brand>/<fuzzy>/`
     3. `D:/transfer4/knowledge-base/brands/<brand>/<fuzzy>/`
   - Выдаёт 3 категории: `in_kb` / `needs_ingest` / `not_found`

2. **`.omc/research/s29-orphan-models.md`** baseline отчёт (199 orphans список).

3. **`_kb_generations_index.json`** (15 KB) — authoritative mapping brand.model → [gens]. Это источник правды для правильного path resolution.

### План S30

**Шаг 1 — запустить mapper** (5 мин):
```bash
cd "Маркетинговые материалы"
python scripts/s29_full_manual_mapper.py
# → .omc/research/s29-full-mapper.md — полный отчёт с needs_ingest списком
# → .omc/research/s29-full-mapper.json — machine-readable для ingest скрипта
```

**Шаг 2 — написать `scripts/s30_ingest_orphans.py`** (30 мин):
- Input: `s29-full-mapper.json`
- Для каждой модели со `status == "needs_ingest_*"`:
  - Создать `kb/<brand>/<model_slug>/<inferred_gen>/`
  - Copy `<external.source>/manual.md` → `kb/<brand>/<model_slug>/<gen>/manual.md`
  - Copy `<external.source>/images/` если есть (уже сжаты на проде через manifest)
  - Normalize frontmatter через существующий `scripts/s27_normalize_manuals.py`
- Gen inference: если в external есть `manual.md` — без субпапок = `_<year>` fallback. Если есть gen-структура = копировать как есть.
- Quality guard: `unique_ratio > 0.25` (по правилу из S27 этап G)
- **НЕ dedup параграфов** (см. `feedback_no_dedup.md` — ломает качество 100%)

**Шаг 3 — batch ingest** (45 мин, автономно):
```bash
python scripts/s30_ingest_orphans.py --apply --report .omc/research/s30-ingest-done.md
```

**Шаг 4 — regenerate index** (10 мин):
```bash
python scripts/s27_rebuild_kb_index.py
# обновляет _kb_generations_index.json + _kb_manifest.json
```

**Шаг 5 — verify** (10 мин):
```bash
python scripts/s29_verify_vehicles_vs_kb.py
# ожидание: orphans ≤ 10 (остаток для ручной проверки)

python scripts/s29_full_manual_mapper.py
# ожидание: needs_ingest == 0, in_kb ≥ 565, not_found ≤ 4
```

**Шаг 6 — images manifest rebuild** (15 мин) если новые мануалы имеют новые картинки:
```bash
python scripts/s27_audit_image_refs.py  # rebuild images-manifest.txt
bash scripts/s29_upload_kb_images_v3.sh  # upload delta
```

**Acceptance:**
- `s29_verify_vehicles_vs_kb.py` orphans = 0 (или user явно одобрил остаток)
- UI dropdown: все модели открываются и показывают мануал (не пустую страницу)
- 0 × 404 на `/api/kb-image/*` в Network Playwright для 5 случайных моделей

---

## 🚨 P0-2 — ManualViewer DITA integration (3-4 часа)

### Почему важно

480 gens имеют `manual-dita-slim.json` с настоящей структурой (H2 sections → topics), но UI показывает cap-300 плоских секций из парсинга `manual.md`. Это затычка из S28 (`b9a66e7`).

### Анализ текущего кода (найдено в S29)

`llcar-dashboard/src/components/kb/ManualViewer.tsx` (1132 строки):

| строка | контекст |
|---|---|
| 32-35 | `ManualData` interface уже есть (DITA JSON) |
| 412 | `type ViewMode = 'dita' \| 'md'` уже объявлен |
| 416 | `const [data, setData] = useState<ManualData \| null>(null)` |
| 447-455 | Fetch DITA: **`data/manuals/${brandId}_${modelId}.json`** — **старый путь, не работает!** Должен быть `data/kb/<brand>/<model>/<gen>/manual-dita-slim.json` |
| 436 | `hasDita = !!(data && data.manuals && data.manuals.length > 0)` |
| 540-543 | Auto-select `md` over `dita` — нужно инвертировать если есть DITA |
| 549 | `MAX_RENDERED_SECTIONS = 300` — cap затычка |
| 667-750 | `renderDitaView()` уже написан, работает, просто `data` всегда null |

**Главный fix:** исправить fetch URL в `useEffect` (строки 447-455).

### План S30

**Шаг 1 — поправить fetch DITA** (30 мин):

Было:
```tsx
// строка 451
fetch(`${import.meta.env.BASE_URL}data/manuals/${brandId}_${modelId}.json`)
```

Надо:
```tsx
// kbGenPath приходит как "audi/a4/b8_2008" или null
useEffect(() => {
  if (!kbGenPath) return
  const abort = new AbortController()
  setLoading(true)
  fetch(`${import.meta.env.BASE_URL}data/kb/${kbGenPath}/manual-dita-slim.json`, {
    signal: abort.signal
  })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      setData(d)
      setLoading(false)
    })
    .catch(() => { setData(null); setLoading(false) })
  return () => abort.abort()
}, [kbGenPath])  // ← kbGenPath вместо [brandId, modelName]
```

**Шаг 2 — auto-select DITA mode** (5 мин):

Строка 540-543:
```tsx
useEffect(() => {
  // Prefer DITA over MD if both available
  if (hasDita) setViewMode('dita')
  else if (hasMd) setViewMode('md')
}, [hasDita, hasMd])
```

**Шаг 3 — убрать cap-300 в DITA mode** (20 мин):

Cap остаётся для `viewMode === 'md'` (178 gens без DITA, fallback). Повысить до 500-1000 чтобы хватало для большинства md-only мануалов. Для DITA mode cap не нужен — там 20-30 sections × 50-200 topics, структура уже ограничена.

**Шаг 4 — in-manual search работает с DITA topics** (45 мин):

Добавить в `renderDitaView()`:
- Filter `manual.sections[].topics[]` где `topic.title.ru.toLowerCase().includes(debouncedQuery)`
- Highlight через существующий `highlightText(topic.title.ru, debouncedQuery)`
- На клик по matched topic — scroll и expand содержимого

**Шаг 5 — topic content rendering** (45 мин):

Для DITA: topic метадата есть (`words`, `images`), но нет content. Варианты:
- **A (lazy + index):** при клике на topic открывать secondary fetch к manual.md, но матчить по `topic.title.ru` регулярочным поиском → extract блок между заголовками.
- **B (preload в slim):** нет, content в slim не кладётся чтобы сохранить вес ~100 KB/model.
- **C (hybrid):** manual.md уже загружен в `mdRaw`. Написать `findTopicInManual(mdRaw, topic.title.ru)` → вернёт offsets → rendering через существующий `renderMarkdownContent`.

**Рекомендуется C** — manual.md всё равно грузится для MD view, не добавляем лишний fetch.

**Шаг 6 — тестирование** (30 мин):

Playwright сценарии:
1. Открыть Audi A4 b8_2008 → DITA mode видно ~10-20 sections
2. Click "Тормозная система" → expand 30+ topics
3. Click "Grip handle cover with power window switch..." → content появляется
4. Search "тормоз" → filter topics, highlight
5. Открыть Chery Bonus (model без DITA) → fallback на MD mode, cap-500

### Коммиты

```
feat(kb): ManualViewer DITA integration — 480 gens получают структуру вместо cap-300
fix(kb): MD-mode cap повышен 300→500 для non-DITA fallback
```

---

## ⚠️ P0-3 — Финальный deploy S30 (15 мин)

После ingest + ManualViewer:

```bash
cd llcar-dashboard
npm run build
cd ..
bash scripts/deploy-v3.sh  # rsync build/ + kb/ (новые orphan мануалы)
# Images уже на проде — не будут re-uploaded
```

**Verify:**
- `curl -I https://llcar.ru/v3/kb` → 200 OK
- Playwright 5 случайных моделей из orphan-fixed списка → видят manual + images

---

## ⏰ P1 — RULES-REFERENCE v2.1 merge — **DEADLINE 2026-05-17**

**На 2026-04-24 осталось 23 дня.** На 2026-05-10 нужно **обязательно** стартовать merge чтобы успеть.

Контекст: `memory/project_s24_merge_todo.md`.

Задача:
- Shadow-валидация v2.1 правил на живых данных (CorrelationEngine prod)
- Метрики: % accuracy vs v2.0 baseline
- Если green → merge v2.1 → v2.0 (update docs/RULES-REFERENCE.md)
- Удалить `docs/RULES-REFERENCE-v2.1.md`

**Оценка:** shadow 2-3 дня + merge 1 день = 4 дня работы. Запустить не позже 2026-05-10.

---

## 🔧 P2 — PDF bookmarks для 178 gens без DITA (workstation-only, 1 день)

Из плана S29 §4. Детали в `.omc/plans/s29-next-session.md`. Выполнить когда получится сесть за workstation (там PDFs).

---

## 🔧 P2 — 52 no-manual gens + 114 strays (1-2 часа)

**52 no-manual:** kb-папка есть, gens есть, но `manual.md` нет ни в одном gen. Причина: либо ingest падал, либо source не был найден. Скрипт:
```bash
python scripts/s30_diagnose_no_manual.py --report .omc/research/s30-no-manual-diagnosis.md
```

**114 strays:** kb-папка есть, но модели нет в vehicles.json. Скорее всего:
- Старые названия которые были переименованы в vehicles.json
- Модели с `_<suffix>` которые зашли через ingest но не попали в dropdown

Варианты: либо добавить в vehicles.json, либо удалить kb-папку (редко).

---

## 🚫 Non-goals в S30

- ❌ Re-ingest всех мануалов с нуля (отдельный multi-day трек)
- ❌ Paragraph-chunking попытки (доказано неверно в S28)
- ❌ GLM batch classifier full run (избыточен при DITA + PDF bookmarks)
- ❌ Backend diagnostic rules (отдельный P3 трек)
- ❌ Android/iOS work
- ❌ Images re-upload (уже 100% на проде)

---

## 🎬 Session-end checklist S30

- [ ] orphans ≤ 10 (verify report)
- [ ] ManualViewer DITA mode работает для 480 gens (Playwright 3 случайных)
- [ ] Cap-300 удалён для DITA, повышен 300→500 для MD fallback
- [ ] `npm run build` clean, 0 TS errors
- [ ] Deploy успешен
- [ ] Memory update: `project_session30_progress.md` с числами + commit hashes
- [ ] MEMORY.md index обновлён: `[✅ S30 P0 closed]`
- [ ] Если не завершили — `.omc/plans/s31-next-session.md` с остатками

---

## 📁 Ключевые файлы S30

### Existing (reuse, не переписывать!)

| путь | роль |
|---|---|
| `scripts/s29_full_manual_mapper.py` | fuzzy mapper — запустить первым делом |
| `scripts/s29_verify_vehicles_vs_kb.py` | verify orphans после ingest |
| `scripts/s27_normalize_manuals.py` | frontmatter normalizer — reuse в ingest |
| `scripts/s27_audit_image_refs.py` | rebuild images-manifest.txt |
| `scripts/s28_copy_transfer4_dita.py` | slim DITA extractor (если нужно для новых orphans) |
| `scripts/s29_upload_kb_images_v3.sh` | upload delta на прод |
| `scripts/s29_verify_kb_images.sh` | sample curl test |
| `scripts/deploy-v3.sh` | production deploy |
| `llcar-dashboard/public/data/kb/_kb_generations_index.json` | authoritative mapping (15 KB) |
| `llcar-dashboard/src/components/kb/ManualViewer.tsx` | 1132 строки, DITA infra уже есть, fetch URL сломан |

### New (создать в S30)

| путь | роль |
|---|---|
| `scripts/s30_ingest_orphans.py` | batch copy D:/manuals-export → kb/ |
| `scripts/s30_diagnose_no_manual.py` | check 52 no-manual gens |
| `.omc/research/s29-full-mapper.md` | full mapping report (from s29_full_manual_mapper.py) |
| `.omc/research/s29-full-mapper.json` | machine-readable ingest plan |
| `.omc/research/s30-ingest-done.md` | ingest результаты |

---

## 💾 Memory files для чтения первым делом

1. `memory/project_session29_progress.md` — итоги S29, verify результаты, текущая инфра
2. `memory/reference_s29_pipeline_learnings.md` — **10 технических находок** (atomic write, tar-over-ssh, SSH rate-limit, etc.) — reusable для любой будущей upload работы
3. `memory/project_s24_merge_todo.md` — v2.1 merge детали (deadline 2026-05-17)
4. `memory/feedback_no_dedup.md` — НЕ делать dedup параграфов (критично для ingest quality)
5. `memory/feedback_use_transfer4_first.md` — D:/transfer4 = primary source

---

## 🔐 Env & Secrets (из S29)

| var | где | для чего |
|---|---|---|
| `ZAI_API_KEY` | `~/.claude.json` | GLM classifier (опционально) |
| `KB_IMAGES_ROOT` | Django env | `/var/www/html/django/kb-images/` (migrated в 21b1170) |
| SSH wrapper `/tmp/llcar_ssh.sh` | auto через `deploy-v3.sh` | SSH/tar upload |

**Host:** `webadmin@185.55.57.145`

---

## 🎯 Прогноз времени S30

| задача | оценка |
|---|--:|
| P0-1 Orphan ingest | 2-3 часа |
| P0-2 ManualViewer DITA | 3-4 часа |
| P0-3 Deploy + verify | 30 мин |
| P1 RULES-REFERENCE v2.1 merge | отложить на 2026-05-10+ |
| P2 no-manual + strays | опционально, 1-2 часа |
| Buffer | 1 час |
| **ИТОГО** | **6-8 часов** |

Если сессия короче — приоритет P0-1 orphan ingest (самая видимая ценность для пользователя).

---

## 📌 Рисковая матрица S30

| риск | вероятность | impact | mitigation |
|---|---|---|---|
| Mapper не покроет все 199 orphans из-за fuzzy thresholds | средняя | средний | понизить threshold до 0.65; ручной review remaining |
| ManualViewer DITA fix ломает md-mode | средняя | высокий | feature flag через `viewMode`, fallback гарантирован |
| Some orphan manuals имеют broken frontmatter | низкая | средний | normalizer перед commit'ом, сравнить before/after |
| RULES-REFERENCE deadline подходит | низкая | высокий | строгое правило: start по позже 2026-05-10 |
| Context exhaustion в S30 (много работы) | средняя | высокий | Save-Early protocol (MEMORY.md при 70%); разбить на S30a/S30b |

---

## 🔗 Git (закоммичено в S29)

**Репо:** https://github.com/llcarn8n/llcar-project.git  
**Ветка:** `dashboard-v3`  
**Последние коммиты S29:**
- `dff05fa` docs(kb-images): S29 pipeline learnings
- `ee3bd3f` chore(logs): update s29 upload progress log
- `785a369` ops(kb-images): S29 P0 complete — 422387 webp на проде (100% 200 OK)
- `ea1d4b0` fix(backend): register /api/kb-image/<hash> URL route

**НЕ запушено** — user решит когда.
