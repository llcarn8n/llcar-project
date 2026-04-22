# S29 — Детальный план следующей сессии

**Ветка:** `dashboard-v3` · **Дата S28 close:** 2026-04-22 · **Модель:** MAKE NO MISTAKES + Senior Engineer · **Контекст:** свежий ~200K.

---

## ⚠⚠⚠ P0 CARRYOVER из S28 — завершить images pipeline (30-60 мин)

**КРИТИЧНО первым делом в S29.** S28 оставил незакрытые картинки.

### Факты на старте S29

- `images-manifest.txt` (Apr 21) — **159 893 hashes** (до Phase 5)
- `images-manifest-v2.txt` (Apr 22) — **422 387 hashes** (после Phase 5)
- **Delta:** **267 300 НОВЫХ hash'ей** которые Phase 5 добавил (image-alts перезаписали 101 manual.md на image-heavy версии)
- Сжато только 159 843 (старый манифест). Остальные **262K не сжаты**.
- На проде `/var/www/html/django/kb-images/` — ~38K-80K webp (upload частично, SSH reset on big chunks)

### Flow (4 шага, последовательно)

**ШАГ 1 — использовать v2 манифест как источник истины**
```bash
mv .omc/research/images-manifest.txt .omc/research/images-manifest-old.txt
mv .omc/research/images-manifest-v2.txt .omc/research/images-manifest.txt
wc -l .omc/research/images-manifest.txt  # должно быть 422387
```

**ШАГ 2 — compress delta (только новые 267K)**

`s28_compress_kb_images.py` resumable — skip already existing. Запустить повторно:
```bash
python scripts/s28_compress_kb_images.py --workers 8
# Скрипт пройдёт весь v2 манифест; skip уже сжатых 159K → обработает только delta 267K
# ETA ~2 часа (по темпу 27/s)
```

**ШАГ 3 — docompress остаток**

После compress staging содержит все 422K webp (~7-8 GB при тех же -40%).  
Проверка: `find .omc/staging/kb-images -name "*.webp" | wc -l` = ~422000.

**ШАГ 4 — resume upload**

`s28_upload_kb_images.sh` — skip existing shards. Старый v1 ломается на SSH reset в больших chunks. **Переделать на per-shard scp** (черновик был в session S28 но отклонён user на уровне tool-use). Код:
```bash
# scripts/s28_upload_kb_images_v2.sh — per-shard scp resumable
for shard in $(ls .omc/staging/kb-images/ | sort); do
  local_n=$(ls .omc/staging/kb-images/$shard | wc -l)
  remote_n=$(/tmp/llcar_ssh.sh "ls /var/www/html/django/kb-images/$shard 2>/dev/null | wc -l")
  if (( remote_n >= local_n )); then continue; fi
  /tmp/llcar_scp.sh -r .omc/staging/kb-images/$shard webadmin@185.55.57.145:/var/www/html/django/kb-images/
  sleep 2
done
```
ETA ~30-60 мин для всего remote.

### Acceptance P0

- Remote `find /var/www/html/django/kb-images -name "*.webp" | wc -l` == 422 387 ± error margin
- `curl -I https://llcar.ru/api/kb-image/<sample_hash_from_audi_q7>.webp` → 200 OK, Content-Length > 1KB
- Playwright: открыть Audi Q7 manual в UI → видны реальные картинки, не placeholder 1x1

### Что НЕ делать в S29 пока P0 не закрыт

Не переходить к ManualViewer DITA интеграции (§2) пока картинки не загружены — иначе UI будет показывать много placeholder'ов, что сорвёт UX тест.

---

## 0. Quick-start (первые 10 мин)

```bash
# 1. Проверить чистое состояние
git log --oneline -10
git status

# 2. Запустить wsgi.py touch если деплой S28 не докатился
bash scripts/deploy-v3.sh --skip-build

# 3. Сэмпл картинки на проде
curl -I https://llcar.ru/api/kb-image/ad71e933fbfdf788b632ccbb2dbfee5af96d1416a4f1790053a75496ec8c4152.webp
# ожидание: 200 OK, Content-Length > 1KB (не 64B placeholder)
# если 404/404-placeholder → upload upload неполный, запустить scripts/s28_upload_kb_images.sh

# 4. Прочитать в memory (один проход):
cat .claude/projects/*/memory/project_s28_big_manuals_freeze.md
cat .omc/plans/s29-next-session.md  # this file
cat .omc/research/s28-dita-slim-copy.md
cat .omc/research/s28-compress-progress.jsonl | tail -3
```

**Known blockers S28 → S29 carryover:**
1. Images upload возможно неполный (~140K из 159893) из-за SSH abort — см. `.omc/research/s28-upload-v2-progress.log`
2. Манифест устарел (Apr 21 vs Phase 5 commit Apr 22) — `images-manifest-v2.txt` уже перегенерирован в S28 end, **сравнить delta**

---

## 1. Состояние проекта (S28 итоги)

### Commits в S28 (финальная цепочка)

```
21b1170  fix(kb-images): migrate KB_IMAGES_ROOT → /var/www/html/django/kb-images
1c0dd74  data(kb): S28 slim DITA structure (480 gens) + compression/upload scripts
b9a66e7  fix(kb): cap ManualViewer at 300 visible sections
55401c1  Revert paragraph-chunking (wrong approach)
ac3c881  data(kb): S28 Batch 2 — 101 image-alts + 4 variants + H2 chunking
863d124  feat(kb): global search (Fuse.js) + in-manual fixes + stats
7d6f2ef  fix(stability): ErrorBoundary, AbortController, SQL parameterization
```

### Данные в `llcar-dashboard/public/data/kb/` (658 gens)

| метрика | значение |
|---|--:|
| Всего `manual.md` | 658 |
| С картинками (≥1 `![`) | **494** (75.1%) |
| Без картинок | 164 (24.9%) |
| `manual-dita-slim.json` есть | **480** (73.0%) |
| `manual_noimg_backup.md` (Phase 5 backups) | 101 (~182 MB) |
| Размер kb директории | 2.1 GB (включая backups) |
| Bundle после deploy (exclude backups) | **~1.9 GB** |

### Картинки (staging `.omc/staging/kb-images/`)

| метрика | значение |
|---|--:|
| Сжато webp | 159 843 |
| Source total | 5.02 GB |
| Staging size | **2.98 GB** (-40.6%) |
| Quality | 55 |
| Max width | 1400 px (Lanczos) |
| Sharding | 2-level by hash[:2] (256 dirs) |

### ManualViewer temporary fix (нужно убрать в S29)

```typescript
// llcar-dashboard/src/components/kb/ManualViewer.tsx:547
const MAX_RENDERED_SECTIONS = 300
const filteredMdSections = useMemo(
  () => allFilteredMdSections.slice(0, MAX_RENDERED_SECTIONS),
  [allFilteredMdSections]
)
```
Это затычка для freeze. В S29 заменяется на DITA rendering.

---

## 2. P0 — ManualViewer slim DITA integration (3-4 часа)

### 2.1 Архитектурный подход

Две параллельные ветви данных:
- **DITA mode** (для 480 gens с `manual-dita-slim.json`): rendering из DITA sections, content lazy-loaded
- **MD mode** (для 178 остальных): текущий flat rendering с cap-300

Переключение детектируется в `useEffect` при загрузке мануала.

### 2.2 Новый файл: `llcar-dashboard/src/utils/manualDitaLoader.ts`

```typescript
export interface DitaTopic {
  id: string
  title: { ru: string; en?: string }
  words: number
  images: number
  section_id: string
}

export interface DitaSection {
  id: string        // "engine" | "brakes" | ...
  title: { ru: string; en?: string }
  icon: string
  topics: DitaTopic[]
}

export interface ManualDita {
  version: string
  model: string
  manuals: Array<{
    model: string
    label: { ru: string; en?: string }
    sections: DitaSection[]
  }>
}

const cache = new Map<string, ManualDita | null>()  // null = tried and missing

export async function loadManualDita(
  brandId: string, model: string, gen: string,
  signal?: AbortSignal
): Promise<ManualDita | null> {
  const key = `${brandId}/${model}/${gen}`
  if (cache.has(key)) return cache.get(key)!
  const url = `/v3/data/kb/${key}/manual-dita-slim.json`  // basename /v3
  try {
    const resp = await fetch(url, { signal })
    if (!resp.ok) { cache.set(key, null); return null }
    const data = await resp.json() as ManualDita
    cache.set(key, data)
    return data
  } catch {
    cache.set(key, null)
    return null
  }
}

// Helper: find topic content in manual.md text by fuzzy title match
// Returns [start, end] offsets within mdText, or null if not found.
export function findTopicInManual(
  mdText: string, topic: DitaTopic
): [number, number] | null {
  const title = topic.title.ru
  const anchor = title.slice(0, Math.min(50, title.length)).trim()
  if (!anchor) return null
  // Try: ### <title> then ## <title> then plain match
  const patterns = [
    `### ${anchor}`,
    `## ${anchor}`,
    anchor,
  ]
  for (const p of patterns) {
    const idx = mdText.indexOf(p)
    if (idx < 0) continue
    // End = next ### or ## or EOF
    const endPat = /^(#{1,3}) /m
    const searchFrom = idx + p.length
    const match = endPat.exec(mdText.slice(searchFrom))
    const end = match ? searchFrom + match.index : mdText.length
    return [idx, end]
  }
  return null
}
```

### 2.3 Изменения в `ManualViewer.tsx`

Добавить в state:
```typescript
const [manualDita, setManualDita] = useState<ManualDita | null>(null)
const [expandedDitaSection, setExpandedDitaSection] = useState<string | null>(null)
const [activeDitaTopic, setActiveDitaTopic] = useState<DitaTopic | null>(null)
```

В `useEffect` параллельно с manual.md:
```typescript
useEffect(() => {
  if (!brandId || !model || !generation) return
  const abort = new AbortController()
  loadManualDita(brandId, model, generation, abort.signal)
    .then(setManualDita)
    .catch(() => setManualDita(null))
  return () => abort.abort()
}, [brandId, model, generation])
```

Rendering logic:
- Если `manualDita` есть → `renderDitaView()` (новый метод)
- Иначе → `renderMdView()` (текущий) с cap-300

`renderDitaView()`:
```tsx
// 10-20 H2 sections (collapsible)
manualDita.manuals[0].sections.map(s => (
  <CollapsibleGroup
    key={s.id}
    icon={s.icon}
    title={s.title.ru}
    count={s.topics.length}
    expanded={expandedDitaSection === s.id}
    onToggle={() => setExpandedDitaSection(expandedDitaSection === s.id ? null : s.id)}
  >
    {s.topics.map(t => (
      <TopicItem
        key={t.id}
        title={t.title.ru}
        words={t.words}
        images={t.images}
        onClick={() => setActiveDitaTopic(t)}
      />
    ))}
  </CollapsibleGroup>
))

// Active topic content panel (right/below)
{activeDitaTopic && (
  <TopicContent
    topic={activeDitaTopic}
    mdText={mdText}
    searchQuery={debouncedQuery}
  />
)}
```

`TopicContent` использует `findTopicInManual(mdText, topic)` и рендерит через существующий `renderMarkdownContent`.

### 2.4 In-manual search в DITA mode

Search по `title` всех topics + в content активного topic:
- Filter `manualDita.sections[].topics[]` where `title.ru.toLowerCase().includes(q)`
- Группировать hit'ы по section
- Highlight title через `highlightText`
- При выборе topic — scroll to его content и highlight совпадений

### 2.5 Убрать cap-300 когда готово

```typescript
// После подтверждения UX в dev:
// const MAX_RENDERED_SECTIONS = 300  // DELETE
const filteredMdSections = allFilteredMdSections  // без slice
// const isTruncated = false  // DELETE
```

Cap остаётся для 178 gens без DITA (md mode), но в коде удаляется безусловно если используем `if (manualDita) { dita } else { md_flat }`. Для md-only gens freeze возможен на 71K sections — нужно оставить cap 500-1000 в md-mode fallback.

### 2.6 Acceptance criteria (5 Playwright сценариев)

```
1. /kb → select BMW X5 E70 → DITA mode видно 15 секций
   (🔧 Двигатель ▸ 211 topics / 🛑 Тормоза ▸ 141 / ...)
2. Click 🔧 Двигатель → раскрывается список 211 topics
3. Click на "Снятие ГБЦ" → content загружается в правой панели
4. Search "гбц" → highlight в title + scroll to первого match
5. /kb → select Audi Q7 (no DITA) → fallback на md mode, cap-300 работает
```

### 2.7 Оценка: 3-4 часа

- 30 мин: `manualDitaLoader.ts` + типы
- 1 час: `renderDitaView()` + CollapsibleGroup + TopicItem components
- 1 час: `TopicContent` + `findTopicInManual` + lookup
- 30 мин: in-manual search integration в DITA mode
- 30 мин: убрать cap в md mode или оставить на 1000
- 30 мин: playwright smoke + fix

### 2.8 Commit plan

```
feat(kb): ManualViewer slim DITA rendering — 480 gens получают реальную структуру
  - new: src/utils/manualDitaLoader.ts
  - mod: src/components/kb/ManualViewer.tsx
  - Remove MAX_RENDERED_SECTIONS cap where DITA available

fix(kb): md-mode fallback cap raised 300→1000 for non-DITA gens
```

---

## 3. P0 — S27 отложенные (2-3 часа)

### 3.1 H3.10 — verify 130 моделей vehicles.json

Читать `.omc/plans/s27-h3-next-session.md` — там полный список.

Суть: 130 моделей объявлены в `llcar-dashboard/src/data/vehicles.json` но нет соответствующего `kb/<brand>/<model>/manual.md`. Два сценария:
- Модель реально существует → нужно найти/ingest manual
- Модель фиктивная (scraping noise) → удалить из vehicles.json

**Скрипт:**
```bash
python scripts/s29_verify_vehicles_vs_kb.py --report .omc/research/s29-orphan-models.md
```
(нужно написать — 50 LOC, iterate vehicles.json, check kb path, classify)

**Acceptance:** 0 vehicles.json models без kb кроме явно помеченных `source: external`.

### 3.2 11 IMAGES_ONLY моделей (workstation задача)

Из `D:/transfer4/knowledge-base/STRUCTURE.md` строка 82-94:
- honda/city, hyundai/ioniq, li/li_i6/i8/l6/mega/one, mazda/3_series/6, mercedes/ml, opel/vectra

У них **images есть, manual.md удалён 03.04**. Нужно:
- Поход на workstation (где transfer4 живёт)
- `git log --diff-filter=D -- **/manual.md` в transfer4 за 2026-04-03 — найти удалённые
- Restore через `git show <commit>^:<path> > <path>`
- Re-apply в dashboard kb через `scripts/s27_ingest_transfer4.py` (если такой есть) или copy

---

## 4. P1 — S28 Option A (PDF bookmarks, 1 день)

**Только на workstation.** PDFs хранятся там по user'у.

### 4.1 Подготовка

```bash
# На workstation:
pip install pypdf pdfplumber
```

### 4.2 Скрипт `scripts/s29_pdf_bookmarks_to_sections.py`

```python
#!/usr/bin/env python3
"""Extract PDF bookmarks → manual-sections.json.

Для каждого gen из dashboard kb, найти соответствующий PDF в transfer4/downloads
или manuals-export. Извлечь outline через pypdf. Build manual-sections.json
со структурой:
  [{
    "title": "ГЛАВА 3. ДВИГАТЕЛЬ",
    "level": 1,
    "page": 45,
    "topics": [
      {"title": "3.1 Снятие", "page": 46, "level": 2},
      ...
    ]
  }]

Сопоставление bookmark.page → позиция в manual.md:
1. Если в manual.md есть chunk'и с метадата-строкой `chunk_id | src | ... | p:N`,
   матчим по p:N
2. Иначе: OCR pipeline может хранить в metadata `page:N` или `<!-- p:N -->`
3. Иначе: fuzzy text match первых 50 chars bookmark.title в manual.md
"""
```

Что искать в D:/transfer4:
```bash
find D:/transfer4/downloads -name "*.pdf" -size +1M
find D:/transfer4/knowledge-base/brands/*/pdfs -name "*.pdf"
find D:/transfer4/knowledge-base/brands/*/models/*/pdfs -name "*.pdf"
```

### 4.3 Acceptance

- 178 gens без DITA получают `manual-dita-slim.json` (или equivalent `manual-sections.json`)
- Минимум 50% gens покрыты (остальные — PDF без outline, scan-only)

---

## 5. P2 — fallback для 30-80 gens без DITA и без PDF outline

**Варианты (выбрать в S30):**

### A. MinerU re-OCR

`D:/transfer4/.venv-mineru/` готов. Запуск:
```python
# Pseudo:
from magic_pdf.pipe.UNIPipe import UNIPipe
for pdf in remaining_gens_pdfs:
    pipe = UNIPipe(pdf.read_bytes(), ...)
    pipe.pipe_classify()
    pipe.pipe_analyze()
    pipe.pipe_parse()  # produces structured MD + JSON with font info
    # → H1/H2/H3 based on font-size hierarchy
```

### B. GLM classifier (fallback)

Готовый скрипт `scripts/s28_glm_sections.py`. Запустить:
```bash
export ZAI_API_KEY=$(grep -m1 '"ZAI_API_KEY"' ~/.claude.json | sed 's/.*"ZAI_API_KEY": *"\([^"]*\)".*/\1/')
python scripts/s28_glm_sections.py --apply --parallel 12 --batch-size 100
```
~30-50 часов full batch. Качество 90%+.

---

## 6. P3 — S22 RULES-REFERENCE merge (DEADLINE 2026-05-17)

**Отсчёт:** на 2026-04-22 осталось **25 дней**.

Задача описана в `project_s24_merge_todo.md`. Нужно:
- Shadow-валидация v2.1 правил на живых данных (CorrelationEngine prod)
- Метрики: % accuracy vs v2.0 baseline
- Merge v2.1 → v2.0 при green metrics
- Удалить `docs/RULES-REFERENCE-v2.1.md`, оставить только v2.0

**Прогон 2-3 дня shadow → merge 1 день = 4 дня работы.** Запустить не позже 2026-05-10 чтобы успеть до deadline.

---

## 7. P3 — Mobile pass (Track A)

Из `project_remaining_tracks.md`. После S22 merge если время осталось.

---

## 8. Файлы и артефакты готовые

### Scripts
| файл | назначение |
|---|---|
| `scripts/s28_glm_sections.py` | GLM classifier (fallback) |
| `scripts/s28_copy_transfer4_dita.py` | slim DITA extraction — re-run если transfer4 обновится |
| `scripts/s28_compress_kb_images.py` | resumable batch compression |
| `scripts/s28_upload_kb_images.sh` | chunked tar-over-ssh uploader |
| `scripts/s27_audit_image_refs.py` | rebuild `images-manifest.txt` |

### Research
| файл | содержание |
|---|---|
| `.omc/research/s28-dita-slim-copy.md` | coverage отчёт 480 gens |
| `.omc/research/s28-dita-coverage.json` | полные match details |
| `.omc/research/s28-transfer4-source-coverage.jsonl` | coverage per-gen |
| `.omc/research/s28-manuals-no-h2.md` | 6 проблемных (устарело после cap fix) |
| `.omc/research/s28-compress-progress.jsonl` | compression log |
| `.omc/research/s28-upload-v2-progress.log` | upload progress |
| `.omc/research/images-manifest-v2.txt` | rebuilt manifest после Phase 5 |

### Memory (читать первыми)
1. `project_s28_big_manuals_freeze.md` — полное исследование freeze + DITA mapping
2. `project_s27_h3_complete.md` — S27 tail
3. `project_s27_images_pending.md` — истор images status
4. `project_llcar_backend_bugs_2026-04-21.md` — P0 backend отдельный трек

---

## 9. Env & Secrets

| var | где | для чего |
|---|---|---|
| `ZAI_API_KEY` | `~/.claude.json` | GLM classifier |
| `KB_IMAGES_ROOT` | Django env (optional override) | путь к картинкам |
| SSH wrapper `/tmp/llcar_ssh.sh` | auto-создаётся `deploy-v3.sh` | SCP/SSH под webadmin |

**User SSH user:** `webadmin@185.55.57.145`  
**Static path:** `/var/www/html/django/static/spa-v3/`  
**KB images path:** `/var/www/html/django/kb-images/<hash[:2]>/<hash>.webp`  
**API endpoint:** `/api/kb-image/<hash>`

---

## 10. Рисковая матрица S29

| риск | вероятность | impact | mitigation |
|---|---|---|---|
| ManualViewer DITA rendering ломает md mode | средняя | высокий | feature flag `useDita = !!manualDita`, fallback гарантирован |
| `findTopicInManual` fuzzy match провалится для 20% topics | средняя | средний | fallback на offset из DITA если анкор не нашёлся, или show "see manual.md" ссылка |
| Upload images добавил ~25% новых hash'ей (Phase 5) | высокая | средний | compress delta + upload; resumable скрипт pick up |
| PDF bookmarks в 50%+ PDFs отсутствуют | средняя | средний | B-path на GLM для остатка |
| Context blows up mid-session | низкая | высокий | работать в дисциплине: pre-compact save каждые 70% |

---

## 11. Non-goals в S29

- ❌ Re-ingest всех мануалов с нуля (отдельный multi-day трек)
- ❌ Paragraph-chunking попытки (доказано неверно)
- ❌ ManualViewer parser regex изменения (текущий `/^(#{1,3})/` правильный)
- ❌ GLM batch classifier full run (избыточен при DITA + PDF bookmarks)
- ❌ Backend diagnostic rules (отдельный P3 трек)
- ❌ Android/iOS work

---

## 12. Session-end checklist S29

Прежде чем закрыть:
- [ ] `npm run build` clean, 0 TS errors
- [ ] Deploy успешен (`bash scripts/deploy-v3.sh --skip-build`)
- [ ] Curl 5 случайных картинок на проде → 200 OK
- [ ] Playwright smoke 5 сценариев из §2.6 → 5 passes
- [ ] Коммиты имеют понятные messages + Co-Authored-By
- [ ] Memory update: `project_session29_progress.md` с числами и commit hashes
- [ ] MEMORY.md index обновлён
- [ ] Если не завершили — `.omc/plans/s30-next-session.md` с оставшимися задачами

---

## 13. Открытые вопросы (обсудить с user первым делом)

1. **Upload status:** удалось ли залить все 160K+ картинок в S28 end? Если нет — finish upload P0 в S29 start (20 мин).
2. **UX выбор:** DITA view показывает sections inline со списком topics (accordion) или сплит-панель (sections слева, content справа)?
3. **In-manual search в DITA mode:** искать только по title или также по content? Если по content — нужен server-side search через backend endpoint или fetch manual.md целиком в браузер?
4. **Когда убрать cap-300:** после DITA integration для всех gens с DITA, или поднять до 1000 для md-mode fallback?

---

## 14. Контрольные числа (sanity check S29 start)

Если эти числа изменились — что-то поломалось в S28 end:

```
дашборд kb манулы:     658
dita-slim.json файлов: 480
средний slim размер:   98.6 KB
staging webp:          159 843 (возможно больше если Phase 5 delta сжали)
staging total:         2.98 GB
bundle kb (no backups): ~1.9 GB
remote webp:           ≤159 843 (должно стремиться к этой цифре)
```
