# S27 Этап H3 — план следующей сессии

**Дата создания:** 2026-04-21
**Предыдущий commit:** `bdf1e80` (fix deploy tar-over-ssh)
**Ветка:** `dashboard-v3`

---

## Что сделано (summary)

Коммиты H3:
- `fd9a942` H3.1-H3.8 — ingest 442 манулов (648 ok всего)
- `4094ad8` H3.9 — UI mapping через kb-generations-index
- `5e279cb` H3.9b — brand alias + junk_resolved
- `a162553` H3.9c — dedupe orphans
- `924129e` H3.10 — vehicles.json +108 моделей
- `bdf1e80` deploy fix tar-over-ssh

**KB сейчас:** 707 физических файлов (648 основных manual.md + 59 variant'ов), 59 брендов, 366 моделей, 652 поколения. Bundle 1.6 GB. На прод загружено через tar-over-ssh, доступ по `/static/spa-v3/data/kb/`.

**vehicles.json:** 58 брендов (+lifan = 59), +108 моделей (baic/bj60, porsche/taycan, kia/ev9, hongqi/hq9, и т.д.)

**kbPath.ts:** BRAND_ALIAS (mercedes_benz→mercedes, li→li_auto, bestune→faw_bestune) + fallback через kb-generations-index.json.

---

## H3.12 — variants 59 manual_variant.md

**Проблема:** После H3.3/H3.4/H3.9b коллизии при ingest создали `manual_variant.md`/`manual_variant2.md` рядом с основными `manual.md`. UI фетчит только `manual.md` — variant'ы **невидимы в UI**.

**Что делать:**
1. `find llcar-dashboard/public/data/kb -name 'manual_variant*.md'` — список 59
2. Для каждого сравнить с основным `manual.md`:
   - Если идентичные (md5 совпадает) → удалить variant
   - Если variant крупнее и лучше → переименовать в основной, старый → manual_old.md
   - Если оба полезные (разные версии/года) → оставить, но **научить UI показывать selector**:
     - В ManualViewer.tsx добавить dropdown "выбрать версию"
     - Загрузить по умолчанию manual.md, при выборе — manual_variant*.md
3. Написать `scripts/s27_resolve_variants.py` для автоматизации

**Файлы:**
- `scripts/s27_resolve_variants.py` (NEW)
- `llcar-dashboard/src/components/kb/ManualViewer.tsx` (EDIT — добавить selector)
- `.omc/research/s27-variants-report.md` (NEW)

**Оценка:** 1-2 часа

---

## H3.13 — обновить статистику в UI/лендинге

**Задача:** Обновить цифры манулов/брендов/моделей в UI.

**Шаги:**
1. `grep -rE '[0-9]{2,3}\s*(мануал|manual|модел|бренд|brand|model)' llcar-dashboard/src/` — найти hardcoded
2. Типичные места:
   - Landing page стата-блок
   - SEO meta descriptions
   - About page
   - Sidebar KB counter
3. Заменить на актуальные: **648 мануалов, 59 брендов, 366 моделей, 652 поколения**
4. Рассмотреть переход на динамическое вычисление из kb-generations-index.json

**Файлы (искать):**
- `llcar-dashboard/src/pages/Landing*.tsx`
- `llcar-dashboard/src/components/landing/`
- `llcar-dashboard/src/pages/KnowledgeBase.tsx`

**Оценка:** 30-60 мин

---

## H3.14 — полнотекстовый поиск по мануалам

**Задача:** Реализовать поиск по 648 manual.md (648 * avg 500KB = ~300MB текста).

**Варианты реализации:**

### Вариант A — client-side MiniSearch/FlexSearch (build-time index)
- Build-time: скрипт генерирует `kb-search-index.json` с N-gram индексом (~30-50MB)
- При загрузке Dashboard: lazy-load индекс
- Поиск мгновенный, но первая загрузка медленная
- Pros: нет backend changes, работает offline
- Cons: 30-50MB к bundle

### Вариант B — backend /api/kb-search
- Django endpoint `/api/kb-search/?q=...` — читает manual.md on-the-fly, ripgrep
- Pros: нет bundle overhead
- Cons: каждый запрос читает диск, латентность

### Вариант C — PostgreSQL FTS
- ETL manual.md → `kb_manuals` table с tsvector
- Django view с pg_trgm
- Pros: быстро, ranked results
- Cons: инфраструктура

**Рекомендация:** Вариант A (client-side) с chunking по гену — загружать index только для выбранного brand.

**Файлы:**
- `scripts/s27_build_search_index.py` (NEW)
- `llcar-dashboard/src/components/kb/ManualSearch.tsx` (NEW)
- `llcar-dashboard/src/pages/KnowledgeBase.tsx` (EDIT — integrate search)

**Оценка:** 3-4 часа

---

## H3.15 — картинки на прод (из `project_s27_images_pending.md`)

**Задача:** 299 мануалов содержат 385 726 ссылок на `.webp` картинки. На проде `/var/kb-images/` — **пусто**. Все картинки → 404 → placeholder.

**Шаги:**
1. Проверить `scripts/sync-kb-images.sh` — работает ли sync D:\manuals-export/*/images/ → /var/kb-images/
2. Dry-run `scripts/sync-kb-images.sh --check-only` — какие hash'и нужны (`image_refs_audit.json`)
3. Убедиться что в `deploy-v3.sh` `--exclude='*.webp'` не блокирует manual-side (они всё равно через /api/kb-image/)
4. Запустить rsync/tar-over-ssh `D:\manuals-export/*/images/*.webp` → `webadmin@...:/var/kb-images/<hash[:2]>/<hash>.webp`
   - **Объём:** ~30-50 GB, 385K файлов
   - Время: часы
5. Проверить `/api/kb-image/<hash>.webp` возвращает 200
6. Playwright open 5 rich manuals и verify `<img>` реально показываются

**Варианты:**
- Sync через tar-over-ssh (один session, ~30GB tarball)
- Sync через scp -r по батчам (по 1000 файлов = 385 батчей)
- Установить rsync в Git bash (best но требует installation)

**Файлы:**
- `scripts/sync-kb-images.sh` (EDIT — проверить + добавить tar fallback)
- Docs: `docs/KB-IMAGES.md` (EDIT — описать процесс)

**Оценка:** 4-6 часов (из-за объёма upload)

---

## H3.16 — 129 замен картинок (из `project_s27_images_pending.md`)

**Задача:** 360 мануалов без картинок, 129 можно улучшить заменив на версии из других `D:\manuals-export/<brand>/<src_dir>/` где есть картинки.

**Список:** `.omc/research/s27-image-alternatives.json`

**Шаги:**
1. Проверить 129 replace-кандидатов (картинка-копии src vs target по содержимому — не хуже ли?)
2. Применить с quality guard
3. Commit + redeploy

**Оценка:** 1-2 часа

---

## H3.17 — manually verify 22 EXACT rename cases

**Задача:** 22 EXACT fuzzy-match кейса где ratio=1.0 (skipped в H3.10 — kbPath.ts fallback). Проверить руками что они реально alias в vehicles.json.

Из KB:
- `volkswagen/golf` → vehicles `golf_2` (Golf Mk1/Mk2 manuals внутри)
- `skoda/octavia` → vehicles `octavia_3` (Octavia A4 1996-2010)
- `bmw/ix3` → vehicles `ix3_2` (внутри **BMW i3** не iX3!)  ⚠️ несовпадение
- ... и т.д.

**Шаги:**
1. Прочитать manual.md каждой из 22 моделей
2. Если содержимое = модель в vehicles.json под `_2/_3` id → skip (работает через fallback)
3. Если содержимое ≠ модель (как `bmw/ix3` где i3 внутри) → **переименовать KB папку** или **добавить в vehicles.json отдельную модель**

**Оценка:** 1-2 часа (по 5-7 мин на модель)

---

## H3.18 — оптимизация bundle

**Задача:** Bundle 1.6GB — vite warning "chunks larger than 500KB". Нужно code-splitting или backend streaming.

**Варианты:**
- **A:** lazy-load manual.md через React.lazy() (уже есть?)
- **B:** вынести KB данные в отдельный CDN-path (не `/static/spa-v3/data/`)
- **C:** backend endpoint `/api/kb-manual/<brand>/<model>/<gen>/` с gzip + Range-requests

**Оценка:** 2-3 часа

---

## Порядок исполнения следующей сессии

**Приоритеты:**

1. **(30 мин)** Playwright smoke-test на проде: проверить что UI реально открывает 5 рандомных мануалов (lifan, porsche, mercedes, kia, chery). Если что-то не работает — fix.
2. **(1 час)** H3.13 — обновить stats (648/59/366) в UI — быстрый win, user требует.
3. **(2 часа)** H3.12 — разобрать 59 variants.
4. **(3-4 часа)** H3.14 — search по мануалам.
5. **(4-6 часов)** H3.15 — картинки на прод.
6. **(1-2 часа)** H3.16 — 129 замен картинок.
7. **(1-2 часа)** H3.17 — 22 EXACT manually verify.
8. **(2-3 часа)** H3.18 — bundle optimization (если нужно).

**Всего:** 14-21 час работы на следующую сессию(и).

---

## Blocking dependencies

- **H3.12 variants** и **H3.17 EXACT verify** требуют expertise в модельных линейках. Для авто-принятия решений недостаточно.
- **H3.14 search** независим, можно делать параллельно.
- **H3.15 картинки** требует ~30GB передачи, может блокировать deploy.
- **H3.13 stats** — самое быстрое, сделать первым для user visible effect.

---

## Important gotchas

1. **rsync не установлен** в Windows bash — использовать tar-over-ssh через `deploy-v3.sh` (уже починено в bdf1e80).
2. **BASE_URL = `/static/spa-v3/`**, а не `/v3/` — URL для manual.md: `https://llcar.ru/static/spa-v3/data/kb/<path>`.
3. **BRAND_ALIAS в kbPath.ts** — mercedes_benz/li/bestune: при обновлении vehicles.json или KB-структуры сверять оба.
4. **nginx отдаёт SPA fallback** для отсутствующих путей — возвращает 200 HTML 3365B. Проверять content-type в curl.
5. **dedup параграфов запрещён** (`feedback_no_dedup.md`) — ломает качество мануалов.
6. **Pre-2001 удалять** только если production полностью закончилось до 2001. Если поколение extends past 2001 — сохраняем (user правило).

---

## Критичные файлы состояния

| Файл | Роль |
|---|---|
| `llcar-dashboard/src/utils/kbPath.ts` | BRAND_ALIAS + fallback к kb-index |
| `llcar-dashboard/src/data/kb-generations-index.json` | 59/366/652 структура |
| `llcar-dashboard/src/data/vehicles.json` | UI brand/model/gen список |
| `scripts/deploy-v3.sh` | deploy с tar fallback (bdf1e80) |
| `scripts/s27_build_kb_index.py` | регенерация kb-index |
| `scripts/s27_build_vehicles_patch.py` | +108 моделей в vehicles.json |
| `.omc/research/s27-h310-verify.md` | 130 моделей verify (отчёт) |
| `.omc/research/s27-image-alternatives.json` | 129 замен картинок |
| `/var/kb-images/` на проде | ПУСТО — картинки требуют sync |
