# S27 Этап H3 — план следующей сессии

**Дата:** 2026-04-21 (обновлён в конце текущей сессии)
**Последний коммит:** `<sha после brands sync>` (см. `git log --oneline | head -5`)
**Ветка:** `dashboard-v3`

---

## Финальное состояние после текущей сессии

### Что сделано

**Коммиты H3 (в порядке):**
- `fd9a942` H3.1-H3.8 — ingest 442 манулов (648 ok total)
- `4094ad8` H3.9 UI mapping через kb-generations-index
- `5e279cb` H3.9b brand alias + 14 junk_resolved + image stats
- `a162553` H3.9c dedupe 3 orphan src_dir + verify report
- `924129e` H3.10 — vehicles.json +108 моделей
- `bdf1e80` fix(deploy): tar-over-ssh fallback
- `52fef25` docs(plan): детальный план след. сессии
- `<new>` fix(landing): sync brands/*.json +108 моделей

**Данные:**
- **648 manual.md** основных + 59 variants = 707 файлов
- **59 брендов** (+lifan), 366 моделей, 652 поколения в KB
- vehicles.json: +108 моделей, 59 брендов
- brands-index.json + brands/*.json: sync'нуто (39 обновлено, +lifan.json)

**Прод (llcar.ru):**
- Все 648 manual.md загружены через `/static/spa-v3/data/kb/`
- Taycan, Lifan, BAIC BJ60 и т.д. видны в UI
- Build OK (31s, 0 TS errors)
- `/var/kb-images/` **пусто** — картинки не загружены

**Критические исправления в deploy-v3.sh (`bdf1e80`):**
- rsync → tar-over-ssh fallback (rsync нет в Windows bash)
- tar грузит всю `data/` (а не только `kb/`) — иначе brands/*.json не попадёт

### Что открылось в текущей сессии

- **Exeed TXL/TXTXL мануалы содержат "Chery"** — это нормально (Exeed = премиум-суббренд Chery, оригинальный текст от Chery). **Не баг.**
- **BASE_URL SPA = `/static/spa-v3/`**, а не `/v3/`. Curl проверки должны использовать полный путь.
- **2 источника для UI:**
  - Landing → `public/data/brands-index.json` + `brands/<id>.json`
  - Knowledge Base → `src/data/vehicles.json` (import в JS bundle)
  - Оба нужно синхронизировать!

---

## H3.12 — разобраться с 59 manual_variant.md

**Проблема:** После H3.3/H3.4/H3.9b коллизии создали `manual_variant.md`/`manual_variant2.md` рядом с основными `manual.md`. UI фетчит только `manual.md` — variant'ы **невидимы**.

**Объём:** 59 файлов (707 всего − 648 main).

**План:**
1. `find llcar-dashboard/public/data/kb -name 'manual_variant*.md'` — список 59
2. Для каждого сравнить с основным `manual.md` (md5sum):
   - Идентичные → удалить variant
   - Variant крупнее/лучше → заменить основной, старый → `manual_old.md`
   - Разные полезные → научить UI показывать selector (ManualViewer dropdown "выбрать версию")
3. Написать `scripts/s27_resolve_variants.py` с auto-dedup по md5 + stats

**Файлы:**
- `scripts/s27_resolve_variants.py` (NEW)
- `llcar-dashboard/src/components/kb/ManualViewer.tsx` (если нужен selector)
- `.omc/research/s27-variants-report.md` (NEW)

**Оценка:** 1-2 часа

---

## H3.13 — обновить статистику на Landing/UI

**Задача:** Показать реальные цифры: **648 мануалов, 59 брендов, 366 моделей, 652 поколения**. Сейчас в UI возможно hardcoded 221/548 (из прошлых этапов).

**Шаги:**
1. `grep -rE '[0-9]{2,3}\s*(мануал|manual|модел|бренд|brand|model)' llcar-dashboard/src/` — найти hardcoded
2. Места где искать:
   - `src/pages/Landing.tsx` — hero/stats section
   - `src/components/landing/` — stat-cards
   - `src/pages/KnowledgeBase.tsx` — сайдбар-counter
   - SEO meta descriptions (index.html)
3. Лучше — **динамически** через `useMemo(() => ... kbIndex.brands)` — чтобы автоматом обновлялось при следующих ingest

**Файлы:** по результату grep

**Оценка:** 30-60 мин

---

## H3.14 — полнотекстовый поиск по мануалам

**Задача:** Поиск по 648 manual.md (avg 500KB/file = ~300MB текста суммарно).

**Варианты (выбрать A):**

### Вариант A — client-side MiniSearch (рекомендуется)
- Build-time: `scripts/s27_build_search_index.py` генерит `kb-search-index.json` (~20-40MB)
- Lazy-load индекс только при открытии Dashboard search
- MiniSearch в SPA — мгновенный fuzzy-поиск
- Результаты: `{brand, model, gen, section_title, snippet, score}`
- Клик → открывает manual с highlighting

### Вариант B — backend /api/kb-search
- Django endpoint reads manual.md via ripgrep
- Дешево но медленно

### Вариант C — PostgreSQL FTS
- ETL manual.md → kb_manuals table с tsvector
- Сложнее setup

**Рекомендация:** A. Chunk по brand'у — загружать только индекс текущего brand (сокращает initial load).

**Файлы:**
- `scripts/s27_build_search_index.py` (NEW)
- `llcar-dashboard/src/components/kb/ManualSearch.tsx` (NEW)
- `llcar-dashboard/src/pages/KnowledgeBase.tsx` (EDIT — integrate)
- `npm install minisearch`

**Оценка:** 3-4 часа

---

## H3.15 — загрузить 385K картинок на прод

**Задача:** 299 мануалов содержат **385 726 уникальных** `.webp` hash-ссылок. На проде `/var/kb-images/` **пусто** → все `<img>` = placeholder.

**Источник:** `D:\manuals-export/*/images/<hash>.webp` — все 385K есть локально (100%).

**Шаги:**
1. Проверить `scripts/sync-kb-images.sh` — работает ли (нужно `rsync`, в Windows bash нет)
2. Добавить `tar-over-ssh` fallback для картинок (аналогично deploy-v3.sh)
3. **Объём:** проверить через `du -sh D:\manuals-export/*/images/` — ~30-50 GB
4. Варианты передачи:
   - **A:** один большой tarball → SSH → extract (1 session, ~30GB за час по 100mbps)
   - **B:** rsync с флагом `--partial --append` (если установить Cygwin rsync)
   - **C:** batch scp по 10K файлов (40 итераций)
5. Проверить `/api/kb-image/<hash>.webp` 200 после
6. Playwright open 5 rich manuals, verify `<img>` не placeholder

**Backend:** Django endpoint уже есть (`/api/kb-image/<hash>.webp`), только данных нет.

**Файлы:**
- `scripts/sync-kb-images.sh` (EDIT — добавить tar fallback)
- `docs/KB-IMAGES.md` (EDIT — описать процесс)

**Критично:** 30GB upload может блокировать 1-2 часа. Если SSH нестабилен — chunked upload.

**Оценка:** 4-8 часов (включая upload time)

---

## H3.16 — 129 замен мануалов (улучшение картинок)

**Источник:** `.omc/research/s27-image-alternatives.json` содержит 129 пар где `D:\manuals-export/<brand>/<other_src_dir>/manual.md` имеет **картинки**, а текущий в KB их нет.

**Примеры:**
- `bmw/x5/f15_2013/manual.md` (0 img) ← заменить на `D:\bmw/x5_e70/manual.md` (1800 img)
- `chery/arrizo_7/arrizo_7_2013/manual.md` (0 img) ← `D:\chery/arrizo_7_m16_service_manual/manual.md` (5067 img)
- `chery/tiggo_7_pro/tiggo_7_pro_max_restyled/manual.md` ← D:\chery/tiggo_7_pro (6962 img)

**Шаги:**
1. Quality guard на каждом: новый manual > 100 KB и unique_ratio > 0.25
2. Spot-check 10 замен (визуально проверить что это реально та же модель)
3. Copy как `manual_variant.md` (сохранить оригинал) или заменить (решить после sample-check)
4. Regenerate kb-generations-index + audit

**Файлы:**
- `scripts/s27_apply_image_alternatives.py` (NEW)

**Оценка:** 1-2 часа

---

## H3.17 — verify 22 EXACT rename cases

**Контекст:** В H3.10 я skip'нул 22 "EXACT" fuzzy-матчей (ratio=1.0) считая что kbPath.ts fallback их находит. Но проверка содержимого показала что **часть из них разные модели**:

- ⚠️ `bmw/ix3` → внутри **BMW i3** (electric city car), не iX3 (electric SUV)!
- ⚠️ `volkswagen/golf` → Haynes manual Mk1/Mk2 1984-1992
- ⚠️ `skoda/octavia` → Octavia A4 (1996-2010)
- OK `mazda/cx7` → CX-7 2006-2009 ✓
- OK `renault/kangoo` → Kangoo 1997-2007 ✓

**Шаги:**
1. Прочитать manual.md каждой из 22 KB моделей
2. Если модель НЕ совпадает с именем (как bmw/ix3 где i3 внутри):
   - Переименовать KB папку (mv `bmw/ix3` → `bmw/i3`)
   - Проверить что в vehicles.json есть соответствующая модель, иначе добавить
3. Если модель совпадает но другое поколение:
   - Нет проблемы — kbPath.ts fallback найдёт через pickGenerationSlug

**Файлы:**
- Возможно переименования в `llcar-dashboard/public/data/kb/`
- `scripts/s27_verify_exact_22.py` (NEW)
- `.omc/research/s27-exact22-verify.md` (report)

**Оценка:** 2-3 часа

---

## H3.18 — bundle optimization

**Проблема:** Build warning `Some chunks are larger than 500 kB`. Главные проблемы:
- `echarts-*.js` — 1.77 MB
- `three-*.js` — 716 KB
- `index-*.js` — ~185 KB (OK)

**Варианты:**
- **A:** lazy-load echarts/three только когда они нужны (Dashboard heavy components)
- **B:** code-splitting в vite.config (rolldown output.codeSplitting)
- **C:** CDN для heavy libs (@echarts из jsdelivr)

**Оценка:** 2-3 часа

---

## H3.19 — автотесты UI (smoke)

**Задача:** Playwright тесты что UI реально открывает манулы для 20 рандомных моделей.

**План:**
1. Список 20 моделей (сэмпл из kb-generations-index: 5 новых H3, 5 старых, 5 variants, 5 mercedes/lifan/li)
2. Для каждой: navigate → select brand+model+gen → verify manual.md загружается, не 404
3. Снять скриншоты, проверить что нет "загружается" в течение >5s

**Файлы:**
- `llcar-dashboard/tests/kb-smoke.spec.ts` (NEW)

**Оценка:** 1-2 часа

---

## Порядок выполнения следующей сессии

**Приоритеты (по user impact):**

1. **(30 мин)** Playwright smoke 5 манулов на проде — подтвердить что deploy работает
2. **(1 час)** H3.13 — stats 648/59/366 на Landing
3. **(2 часа)** H3.12 — 59 variants cleanup
4. **(1-2 часа)** H3.16 — 129 замен с картинками (лёгкий win для визуала)
5. **(4-8 часов)** H3.15 — 385K картинок на прод (большой объём, может блокировать)
6. **(3-4 часа)** H3.14 — search по мануалам
7. **(2-3 часа)** H3.17 — verify 22 EXACT
8. **(2-3 часа)** H3.18 — bundle optimization (nice-to-have)
9. **(1-2 часа)** H3.19 — Playwright smoke suite

**Итого:** 17-27 часов на следующие 2-3 сессии.

---

## Critical gotchas (не забыть!)

1. **`deploy-v3.sh`** теперь `tar-over-ssh` грузит **всю `dist/data/`** (не только `kb/`) — иначе `brands/*.json` останутся старыми.
2. **`rsync`** не установлен в Windows bash — скрипт использует tar fallback автоматически.
3. **BASE_URL = `/static/spa-v3/`** — все curl-проверки должны использовать полный путь `https://llcar.ru/static/spa-v3/data/...`. Путь `/v3/data/...` возвращает SPA fallback HTML 3365B.
4. **BRAND_ALIAS в 2 местах**: `kbPath.ts` и `scripts/s27_*.py`. Если добавляешь alias — обнови оба.
5. **Landing использует `brands/*.json`**, KB — `vehicles.json`. ОБА нужно синхронизировать при добавлении моделей. Запускай `scripts/s27_sync_brands_json.py` после любых изменений vehicles.json.
6. **Variants невидимы в UI** — UI фетчит только `manual.md`. До H3.12 пользователь не увидит `manual_variant.md`.
7. **Exeed мануалы со словом "Chery"** — НЕ баг. Exeed = премиум Chery. Оригинальный текст от вендора.
8. **Dedup параграфов запрещён** (см. `feedback_no_dedup.md`) — ломает качество.
9. **Pre-2001 правило**: удалять только если generation полностью до 2001. Если production extends past 2001 (например W211 1997-2004) — keep.
10. **Service Worker**: после deploy возможно нужен hard refresh (Ctrl+Shift+R).

---

## Критичные файлы

| Файл | Роль |
|---|---|
| `llcar-dashboard/src/utils/kbPath.ts` | BRAND_ALIAS + fallback к kb-index |
| `llcar-dashboard/src/data/kb-generations-index.json` | 59/366/652 структура (для fallback) |
| `llcar-dashboard/src/data/vehicles.json` | UI Knowledge Base dropdown |
| `llcar-dashboard/public/data/brands-index.json` | Landing brand list |
| `llcar-dashboard/public/data/brands/*.json` | Landing model detail (59 файлов) |
| `scripts/deploy-v3.sh` | Deploy + tar-over-ssh (bdf1e80) |
| `scripts/s27_build_kb_index.py` | Регенерация kb-index |
| `scripts/s27_build_vehicles_patch.py` | +108 моделей в vehicles.json |
| `scripts/s27_sync_brands_json.py` | Sync vehicles → brands/*.json |
| `scripts/sync-kb-images.sh` | Sync картинок → /var/kb-images/ (требует tar fallback) |
| `.omc/research/s27-h310-verify.md` | 130 моделей verify (reference) |
| `.omc/research/s27-image-alternatives.json` | 129 замен картинок |
| `/var/kb-images/` на проде | ПУСТО — требует sync (H3.15) |

---

## Workflow при добавлении новой модели в KB

**Чтобы модель появилась в UI end-to-end:**

1. Создать `llcar-dashboard/public/data/kb/<brand>/<model>/<gen>/manual.md` + meta.json
2. `python scripts/s27_build_kb_index.py` — регенерирует kb-generations-index.json
3. Добавить модель в `src/data/vehicles.json` (или через скрипт s27_build_vehicles_patch.py)
4. **НОВОЕ:** `python scripts/s27_sync_brands_json.py` — sync → brands/*.json
5. `cd llcar-dashboard && npm run build` — rebuild bundle
6. `bash scripts/deploy-v3.sh --frontend-only --skip-build` — deploy на прод
7. Playwright verify на проде

**Чеклист:**
- [ ] manual.md файл создан
- [ ] kb-generations-index.json обновлён
- [ ] vehicles.json содержит модель
- [ ] brands/<id>.json содержит модель
- [ ] brands-index.json счётчик обновлён
- [ ] Build без ошибок
- [ ] Deploy успешный
- [ ] На проде manual.md возвращает 200 (не 3365B HTML)
- [ ] В UI dropdown модель видна после Ctrl+F5

---

## Backlog (дальнее будущее, S28+)

- LLM-reshape для soft-junk мануалов (infiniti DTC templates и т.д.)
- OCR reconstruction для text-only мануалов (80 штук)
- 3D model + icon для новых брендов (lifan)
- Backend streaming /api/kb-manual/ с Range requests для >10MB манулов
- Multi-language UI (en)
- Gallery Viewer для picture-heavy manualов
