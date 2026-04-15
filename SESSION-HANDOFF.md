# SESSION HANDOFF — детальный статус для S19

**Последнее обновление:** 2026-04-15 (конец мульти-сессии S16+S17+S18)
**Ветка:** `dashboard-v3`
**Последний коммит:** `d6ddfa8 refactor(kb): один источник DTC + model-level files collapsed`

---

## 1. Что сейчас на prod (llcar.ru/v3)

Развёрнуто на `webadmin@185.55.57.145:/var/www/html/django/static/spa-v3/`. API `/api/v2/diagnose-latest/` отвечает 200.

Deploy процесс: `bash scripts/deploy-v3.sh --frontend-only` (only static) + ручной tar upload для `data/kb/`:
```bash
cd llcar-dashboard/dist && tar -czf /tmp/kb_data.tar.gz data/
/tmp/llcar_scp.sh /tmp/kb_data.tar.gz webadmin@185.55.57.145:/tmp/
/tmp/llcar_ssh.sh "cd /var/www/html/django/static/spa-v3 && tar -xzf /tmp/kb_data.tar.gz"
```

**Важно:** tar НЕ удаляет файлы, только добавляет/перезаписывает. Для удаления старого — делать `find ... -delete` через /tmp/llcar_ssh.sh ПЕРЕД extract.

---

## 2. Текущая структура данных (что где лежит)

### 2.1 Root `llcar-dashboard/public/data/`

```
data/
├── situations-universal.json   # 764 universal ситуаций (один файл)
├── brands-index.json           # список брендов для vehicle picker
├── brands/                     # {brandId}.json — структура моделей/поколений
├── brands-info/                # доп metadata
├── descriptions/               # описания
├── diagnostic-rules.json       # 110 правил диагностики
├── manuals/                    # PDF manuals (legacy, не используется)
├── recalls.json                # 298 отзывных кампаний
└── kb/                         # knowledge base (main focus S17-S18)
```

### 2.2 `data/kb/` — основная KB

```
kb/
├── _dtc_index.json             # 9.2 MB — universal OBD-II titles + sit_refs
│   ├── titles: { CODE: {title_ru, severity, system_id, can_drive} }   # 35,911
│   ├── index:  { CODE: [{sit_id, title, brand, model, generation, urg, cat}] }  # ~1,400
│   ├── total_codes, total_mappings, titles_source: "liauto_export_v1"
│
├── _articles_index.json        # 80 articles metadata
├── _articles/*.md              # 80 full articles (1500-2500 chars каждая)
│
├── _quality_report.json        # метаинфо
│
└── {brand}/                    # 58 brands + 2 meta-файла
    ├── _brand.json             # brand metadata (name, country, tier, powertrain_types)
    ├── _dtc.json               # NEW S18 — brand + model DTC
    │   ├── brand_codes: { CODE: {note_ru, common_fix_ru, severity, system_id, can_drive} }
    │   └── models: { model_name: { CODE: {...} } }
    │
    └── {model}/                # модели бренда
        ├── _model.json          # model metadata
        ├── parts-catalog.json   # запчасти (ONE per model)  ← ДОЛЖНО БЫТЬ PER-GEN в S19
        ├── reviews.md           # обзоры (ONE per model)    ← ДОЛЖНО БЫТЬ PER-GEN в S19
        ├── manual_meta.json     # ссылка на мануал (ONE per model) ← ДОЛЖНО БЫТЬ PER-GEN в S19
        ├── images.json          # индекс images (ONE per model) ← ДОЛЖНО БЫТЬ PER-GEN
        │
        └── {gen}/               # поколения
            ├── meta.json        # gen meta (сырой)
            ├── situations.json  # gen-specific ситуации (brand/model/gen-specific only)
            └── videos.json      # video links per gen
```

### 2.3 Счётчики файлов (prod)

**На 2026-04-15:**
- `situations.json` (per-gen): **432 файла**, **7,458 записей**
- `_dtc_index.json`: **1 файл** (universal titles 35,911 + sit_refs 1,447)
- `{brand}/_dtc.json`: **58 файлов** (brand-level + per-model codes, **8,070 unique codes**)
- `parts-catalog.json` (per-model): **247 файлов**, **47,522 parts**
- `reviews.md` (per-model): **178 файлов**
- `manual_meta.json` (per-model): **210 файлов**
  - ⚠ **Сами мануалы (manual.md) НЕ в репо** — лежат в `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/manual.md` (гигабайты OCR). В repo только `manual_meta.json` с ссылкой `source_path_rel`. **Импорт самих мануалов будет добавлен в следующих сессиях по запросу** (нужно: upload на prod как static assets + ManualViewer с lazy-fetch)
- `images.json` (per-model): **154 файла**, **107,167 images indexed**
  - ⚠ **Сами изображения НЕ в репо** — лежат в `D:/transfer4/knowledge-base/brands/{brand}/models/{model}/images/*.{jpg,png,webp}` (2625+ файлов per model, ~5-10GB total). В repo только `images.json` с mapping `[{filename, size, source_rel}]`. **Импорт самих images будет добавлен в следующих сессиях по запросу** (upload на prod CDN + ImagesPanel компонент + lazy thumbnail)
- `videos.json` (per-gen): **198 файлов**, **1,123 video links**
- `_articles/*.md`: **80 статей**
- `brand` dirs: **80 total** (58 brands + 22 подпапок)

### 2.4 Источник данных

`D:/transfer4/knowledge-base/` — 288GB, подготовленные данные.
- `brands/{brand}/` — 58 брендов
  - `manifest.json`, `hierarchy.json`, `dtc-brand.json`, `situations.json`, `sources.json`, `specs.json`
  - `chunks/chunks-*.md` — brand-level контент
  - `images/` — orphan images
  - `models/{model}/`:
    - `manual.md` — ОСНОВНОЙ мануал (MinerU OCR)
    - `manual-{variant}.md` — варианты OCR/язык
    - `18-dita-manual.json` — DITA структура
    - `19-system-articles.json` — маппинг система→топики
    - `03-hierarchy.md`
    - `reviews.md`, `reviews-tg.md`
    - `video.md` — сырые видео ссылки
    - `dtc.json`, `dtc-model.json` — DTC коды
    - `info.json` — спецификации + generations[]
    - `parts-catalog.json`, `05-parts-catalog.md`
    - `images/` — 2625+ изображений
    - `pdfs/` — исходные PDF
    - `{generation}/` — per-gen subfolder (ТОЛЬКО когда >1 gen в модели):
      - `manual.md`, `18-dita-manual.json`, `images/`, ...

- `_common/` — universal источники:
  - `situations-universal.json` (764) — уже в `public/data/`
  - `dtc-index.json` (36102 = 35911 + minor drops) — уже в `kb/_dtc_index.json.titles`
  - `hierarchy_bev/ice/phev.json`, `recalls-database.json`, `vehicles-ru.json`, `wmi-database.json`

- `export/` — Li Auto legacy данные (35k DTC, 102 articles, 2577 parts, 9000 chunks) — большая часть не импортирована

---

## 3. Что сделано в S16+S17+S18 (19 коммитов)

### Коммиты (`git log --oneline da826d1..HEAD`)
```
d6ddfa8 refactor(kb): один источник DTC + model-level files collapsed
1ae251f fix(kb): strip cross-brand contamination (-130 records)
5be8bb2 docs: S18 COMPLETE handoff
99f5e0a feat(kb): S18 GLM verifier pass — 100 batches, -245 wrong records
1ecb386 refactor(kb): один источник DTC + strip universal ситуаций из per-gen
029625e fix(kb): dtc model notes — одна копия на модель вместо per-gen
d0035da feat(kb): S18 import 391763 brand/model DTC notes from D:/transfer4
6c5f87b fix(kb): S18 apply 8 medium-confidence verifier findings
b6d2f40 fix(kb): S18 cleanup + UI render parts/manual
e34fb1d docs: S18 P2 rich content COMPLETE — parts + reviews + manual_meta deployed
51dc66a feat(kb): S18 P2 rich content — parts + reviews + manual_meta + images.json
1d9396e docs: Session 17 COMPLETE handoff
e2da19e chore(kb): rebuild _dtc_index after S17 ETL
fae6ebc feat(kb): S17 Phase 2+3 — 14 missing brands bootstrapped + 41 expanded
698136e feat(kb): S17 Phase 1 — ETL UPT pilot Toyota (3060→4460 sit)
b6f9f9b docs(kb): deep analysis situations — ETL алгоритм
d08b090 docs(kb): S16-KB-MASTER-ROADMAP — consolidation 14 audits
6adbbc4 audit(kb): 14 агентов проверили D:/transfer4 vs llcar KB
659a43d content(kb): P5 COMPLETE — 80/80 full articles valid (target reached)
```

### 3.1 S16 (фундамент)
- Schema fix — 51 issues → 0 (OBD-II mojibake cleanup)
- DtcSearch integration в KnowledgeBase.tsx с табами + cross-tab navigation
- Verifier 7 Round 4/5 brands (findings на диске в `.omc/state/s16-p4-verifier/*.json`)
- 1123 video links импортированы из D:/transfer4/brands/*/models/*/video.md
- 35911 DTC titles из `_common/dtc-index.json`
- 80 full articles finalized (+50 в S16)
- Playwright E2E (1/5 проходит — остальные нужен WebGL fix)

### 3.2 S17 (ETL expansion)
- **ETL UPT algorithm** — `scripts/etl_situations_upt.py`
  - 3-pass gen matcher: codes substring → exact → year overlap
  - Schema transform: `quickAnswer→qa, urgency→urg, category→cat`
  - Skip CJK/short qa/mojibake
- **Brand mapping** — `scripts/transfer4_brand_mapping.json`
  - `mercedes_benz→mercedes, li→li_auto, bestune→faw_bestune`
  - Model aliases: `jaguar/f-pace→f_pace, honda/cr-v→cr_v, jazz→fit, es250→es`
- **P1 expand** — 41 existing brands, 10→150 sit per gen
- **P0 bootstrap** — 14 missing brands created (--create-gens):
  - `baic, belgee, daewoo, datsun, forthing, gac, genesis, hongqi, jaecoo, kaiyi, li_auto, livan, ssangyong, tank`
- **14-group audit** — отчёты в `.omc/state/s16-kb-audit/group{01..14}_*.md`
- **Master roadmap** — `S16-KB-MASTER-ROADMAP.md`

### 3.3 S18 (rich content + refactor)
- **Rich content import:**
  - `scripts/p2_copy_parts_catalog.py` — parts-catalog.json (cap 200/gen)
  - `scripts/p2_copy_reviews.py` — reviews.md (cap 50KB)
  - `scripts/p2_build_manual_meta.py` — manual_meta.json + images.json index
- **DTC consolidation:**
  - `scripts/s18_import_brand_dtc.py` — импорт brand/model DTC
  - `scripts/s18_consolidate_dtc_to_one.py` — один `{brand}/_dtc.json`
- **Cleanup:**
  - `scripts/s18_cleanup_gen_dirs.py` — -34 дубля gen dirs + 8 renames ugly names
  - `scripts/s18_strip_universal_from_gens.py` — -23,642 universal duplicates
  - `scripts/s18_strip_brand_mismatch.py` — -130 cross-brand (Lada в BMW и т.п.)
  - `scripts/s18_collapse_model_level.py` — -1,071 per-gen duplicates (parts/reviews/manual)
- **GLM verifier pass:**
  - `scripts/s18_extract_unique_situations.py` — 870 batch файлов (26,093 uniq sit)
  - 5 sonnet agents × 20 batches = 100 batches verified (3000 sit проверены)
  - `scripts/s18_apply_verifier_strip.py` — -245 wrong records
  - Findings: `.omc/state/s18-verifier-findings/batch_{0000..0099}.json`
- **UI updates:**
  - `DtcSearch.tsx` — показывает русские DTC titles из `_dtc_index.json.titles`
  - `KnowledgeBase.tsx` — parts-catalog panel + manual_meta panel
  - `SituationsList.tsx` — `initialExpandedId` + pin-to-top sort
  - `DTCSearch.tsx` (legacy в /dtc) — мигрирован на `_dtc_index.json` + `{brand}/_dtc.json`

---

## 4. Что НЕ сделано — тасклист S19

### 4.1 СТРУКТУРНАЯ ПРОБЛЕМА (высший приоритет)

Текущее состояние смешанное: parts-catalog/reviews.md/manual_meta.json/images.json лежат на **model-level** (один на модель), хотя ДОЛЖНЫ быть **per-gen** (F30 ≠ G20 BMW 3 Series).

**Обоснование gen-first:**
- BMW 3 F30 мануал ≠ G20 мануал (разные engines/platforms)
- 2.0 TFSI EA888 Gen3 parts ≠ 1.8 TSI EA888 Gen2 parts
- Обзоры пишутся про конкретное поколение
- Изображения/видео — конкретное поколение

**Требует:**
1. Переписать `p2_copy_parts_catalog.py`, `p2_copy_reviews.py`, `p2_build_manual_meta.py`:
   - Сначала искать `{src}/models/{model}/{gen_dir}/parts-catalog.json` (если есть per-gen subfolder в D:/transfer4)
   - Использовать `{src}/models/{model}/chunk_generation_map.json` для маппинга какой мануал к какому gen
   - Fallback на model-level только если source не имеет gen разделения
2. Re-extract из D:/transfer4 с gen-first priority
3. UI cascade loader (`utils/kbCascade.ts`):
   - Fetch gen-specific первым, model-level как fallback
   - Badge на каждой записи: `_source: "gen"|"model"|"brand"|"universal"`
4. Очистить текущие model-level копии после re-extract

### 4.2 RENAME metadata (underscore usage)

Сейчас:
- `{brand}/_brand.json`, `{brand}/{model}/_model.json`
- `_dtc_index.json`, `_articles_index.json`

Хотим: underscore только для DIRS (`_universal/`, `_articles/`).
Файлы — без underscore:
- `_brand.json` → `brand.json`
- `_model.json` → `model.json`
- `meta.json` (gen-level) → `gen.json` (с обогащением: name, ys, ye, codes, body_type)
- `_articles_index.json` → переместить в `_universal/articles_index.json`
- `_dtc_index.json` → разделить на `_universal/dtc.json` (titles) + `_universal/dtc_refs.json` (index)

### 4.3 UNIVERSAL directory

Создать `kb/_universal/`:
- `_universal/situations.json` (переехать из `public/data/situations-universal.json`)
- `_universal/dtc.json` (35,911 universal titles)
- `_universal/dtc_refs.json` (sit_refs)
- `_universal/articles_index.json`

### 4.4 UI CASCADE LOADER

Новый `llcar-dashboard/src/utils/kbCascade.ts`:

```typescript
export type KbSource = 'gen' | 'model' | 'brand' | 'universal'
export interface WithSource<T> { item: T; source: KbSource }

export async function cascadeLoadSituations(
  brand: string, model: string, gen: string
): Promise<WithSource<Situation>[]>

export async function cascadeLoadDTC(
  brand: string, model: string, gen: string
): Promise<WithSource<DtcEntry>[]>

export async function cascadeLoadManual(
  brand: string, model: string, gen: string
): Promise<WithSource<ManualMeta> | null>

// и т.д. для parts, reviews, images, videos
```

Обновить компоненты:
- `SituationsList.tsx` — показывать badge `_source` (цветовая метка)
- `DtcSearch.tsx`, `DTCSearch.tsx` — унифицировать через cascade
- `KnowledgeBase.tsx` — заменить 5 useEffect на 1 cascade call

### 4.5 DEFERRED / знать для S19

Из S16 verifier:
- **361 suspect records** — помечены GLM, требуют ручного ревью (файлы: `.omc/state/s18-verifier-findings/batch_*.json` → записи с `status: "suspect"`)
- **23k sit НЕ проверены GLM** — только 3000 из 26093 прошли verifier. Оставшиеся 870-100=770 batches ещё не обработаны
- **Suspect pattern паттерны** (часто встречается):
  - P0115-P0118 неправильно приписаны к DSG/ECU/суппортам
  - C0035-C0050 на by-wire brake (должны быть C121x/C1A0x/C055x)
  - ГУР references на EPS cars (Belgee все ЭУР)
  - AWD/вариатор/TSI/TFSI on FWD Geely-platform cars
  - Matrix LED на неправильных поколениях Audi

Из S18 rich content:
- OEM артикулы **пустые** в 90% parts-catalog (source `template`-generated). Требуется парсинг autodoc/exist.ru/rockauto для заполнения
- Li Auto `export/` — 35k DTC + 102 articles НЕ импортированы (отдельный sprint)
- **Manuals не встроены в UI** — только manual_meta ref. Нужен ManualViewer с lazy-fetch `D:/transfer4/brands/*/models/*/manual.md` OR upload manuals на prod как static files

Из S18 cleanup:
- **5 ugly dir names** осталось после rename (collisions):
  - `forthing/friday/forthing__friday__friday_2023_present_0`
  - `forthing/_friday/` (dup parent dir!)
  - Нужна ручная проверка

Из S16 P7 Playwright:
- 1/5 tests passes (brands-index)
- 4/5 canvas tests fail из-за headless WebGL — нужен `--use-gl=swiftshader` working или виртуальный X

Из audit reports:
- **Datsun** coverage — 4 models ещё не полностью заполнены (только 10 sit каждая через ETL)
- **Opel** sync error — 3 dashboard models (astra_k/corsa_e/insignia_b) НЕТ в D:/transfer4 source. Либо удалить, либо найти альтернативный source
- **Jaecoo** — J7/J8 топовые продажи RF 2024-2025, нужно увеличить coverage из source
- **Kia telluride** — есть в dashboard НЕТ в source (synthetic content) — проверить валидность

### 4.6 UI FEATURES НЕ СДЕЛАНЫ

- ManualViewer — сейчас только показывает `manual_meta.json` статистику, НЕ рендерит сам мануал
- Parts: артикулы пустые в 90% — если заполнятся, в UI появится реальный каталог с ценами
- Images: `images.json` создан (107k индексировано), UI **не рендерит** картинки. Нужен ImagesPanel компонент + lazy-load thumbs из D:/transfer4 (или тар на prod static)
- DtcSearch — показывает titles, но не показывает brand/model-level `common_fix_ru` из `{brand}/_dtc.json` при выборе конкретной машины. Cascade подключить.

---

## 5. Критичные файлы и пути

### 5.1 Scripts (все в `scripts/`)

| Скрипт | Назначение |
|--------|------------|
| `validate_kb_schema.py` | Валидатор (**must be 0 issues**) |
| `validate_full_articles.py` | Валидатор статей (80/80 OK) |
| `build_dtc_index.py` | Пересобирает `_dtc_index.json.index` из situations.json |
| `build_dtc_per_gen.py` | **(удалён в S18)** — раньше генерил per-gen dtc.json |
| `build_articles_index.py` | Индексатор статей |
| `etl_situations_upt.py` | Главный ETL (S17) |
| `transfer4_brand_mapping.json` | Brand/model naming aliases |
| `p2_copy_parts_catalog.py` | **ПЕРЕПИСАТЬ для gen-first** |
| `p2_copy_reviews.py` | **ПЕРЕПИСАТЬ для gen-first** |
| `p2_build_manual_meta.py` | **ПЕРЕПИСАТЬ для gen-first** |
| `s18_import_brand_dtc.py` | DTC brand/model import |
| `s18_consolidate_dtc_to_one.py` | `{brand}/_dtc.json` consolidator |
| `s18_strip_universal_from_gens.py` | Удаляет universal duplicates |
| `s18_strip_brand_mismatch.py` | Удаляет cross-brand contamination |
| `s18_cleanup_gen_dirs.py` | Rename ugly dirs + dedup gens |
| `s18_collapse_model_level.py` | **(нужно revert-логика для S19)** — переместил gen→model |
| `s18_extract_unique_situations.py` | Batch для verifier |
| `s18_apply_verifier_strip.py` | Применяет GLM findings |
| `import_videos_from_transfer4.py` | Videos import |
| `merge_liauto_dtc_codes.py` | 35911 titles merge |
| `deploy-v3.sh` | **НЕ копирует data/kb/** — нужно tar ручной |

### 5.2 UI компоненты (все в `llcar-dashboard/src/`)

**Нужно переписать для cascade:**
- `pages/KnowledgeBase.tsx` — 5 useEffect → 1 cascade
- `components/kb/SituationsList.tsx` — add `_source` badge
- `components/kb/DtcSearch.tsx` — унифицировать через cascade
- `components/dtc/DTCSearch.tsx` — legacy на /dtc странице (сейчас тоже `_dtc_index.json`)

**Read-only (не трогать):**
- `stores/dashboardStore.ts` — vehicle profile state (brand, brandId, model, generationId)
- `utils/kbPath.ts` — `deriveKBGenPath(brandId, genName) → 'brand/model/gen'`
- `utils/fetchCache.ts` — кэш-обёртка для fetch
- `components/kb/FullArticle.tsx` — рендер markdown статей (работает)
- `components/kb/QualityBadge.tsx` — rendering

### 5.3 State / memory

- `.omc/state/s16-kb-audit/group{01..14}_*.md` — 14 audit reports
- `.omc/state/s16-kb-audit/situations_deep_analysis.md` — UPT алгоритм deep analysis
- `.omc/state/s16-p4-verifier/*.json` — S16 verifier findings (7 brands)
- `.omc/state/s18-verifier-batches/batch_{0000..0869}.json` — 870 batches для verifier
- `.omc/state/s18-verifier-findings/batch_{0000..0099}.json` — 100 batches обработаны (770 ещё)
- `.omc/state/s17-etl-{brand}.log` — ETL logs per brand
- `.omc/state/s17-etl-toyota.log` — pilot log
- `.omc/state/s17-etl-toyota-pilot.log` — pilot log (early)
- `memory/project_session15_progress.md`, `16`, `17` — progress logs
- `memory/MEMORY.md` — index
- `S16-KB-MASTER-ROADMAP.md` — 58 brands coverage table + priorities
- `VERIFIER-FINDINGS-S16-P4.md` — S16 human-readable findings

### 5.4 Brand naming mismatches (уже в map, но проверить)

| D:/transfer4 | llcar-dashboard |
|---|---|
| `mercedes_benz` | `mercedes` |
| `li` | `li_auto` |
| `bestune` | `faw_bestune` |
| `jaguar/f-pace` | `jaguar/f_pace` |
| `honda/cr-v` | `honda/cr_v` |
| `honda/jazz` | `honda/fit` |
| `lexus/es250` | `lexus/es` |

---

## 6. Prevent-crash rules (R1-R7)

**Применены во всех сессиях — не упала ни разу после S15 crash:**
- **R1:** findings/outputs агентов — сразу на диск, не в память
- **R2:** макс 3 agents в батче параллельно, не мешать MCP + agents
- **R3:** commit после каждого P-блока (не копить staged)
- **R4:** 70% контекста → STOP + SAVE + handoff
- **R5:** memory save после каждой Wave (не в конце)
- **R6:** каждая Wave — закрытая точка handoff
- **R7:** старт новой сессии читает `.omc/state/s*-progress.md` + git log + SESSION-HANDOFF.md

---

## 7. S19 задачи (детальный план)

**Полный план:** `~/.claude/plans/encapsulated-wibbling-coral.md`

### Phase 1 — Re-extract gen-first из D:/transfer4 (2-3ч)
1. Rewrite `p2_copy_parts_catalog.py`:
   - Check `{src}/models/{model}/{gen_dir}/parts-catalog.json` (per-gen source)
   - Fallback на `{src}/models/{model}/parts-catalog.json` (model-level)
   - Write на соответствующий level в llcar
2. Same для `p2_copy_reviews.py` и `p2_build_manual_meta.py`
3. `scripts/s19_gen_first_migration.py` — orchestrator:
   - Удалить все текущие model-level parts/reviews/manual_meta/images
   - Запустить переписанные p2_*
   - Проверить gen-level files созданы где есть source

### Phase 2 — Reorganize metadata (1ч)
4. `scripts/s19_rename_metadata.py`:
   - `{brand}/_brand.json` → `{brand}/brand.json`
   - `{brand}/{model}/_model.json` → `{brand}/{model}/model.json`
   - `{gen}/meta.json` → `{gen}/gen.json` (обогатить)
5. Создать `kb/_universal/`:
   - Переместить universal situations, dtc titles, articles index
6. Разделить `_dtc_index.json`:
   - titles → `_universal/dtc.json`
   - index → `_universal/dtc_refs.json`
7. Разделить `{brand}/_dtc.json`:
   - brand_codes → `{brand}/dtc.json`
   - models → `{brand}/{model}/dtc.json` (model-level) или per-gen если source дифференцирован

### Phase 3 — UI cascade (2ч)
8. Создать `utils/kbCascade.ts` с `cascadeLoad*` функциями
9. Создать `types/kb.ts` с `WithSource<T>` type
10. Обновить компоненты:
    - SituationsList — badge source
    - DtcSearch / DTCSearch — cascade, унификация
    - KnowledgeBase — 1 cascade вместо 5 useEffects
11. Validate: tsc silent, npm run build OK, E2E brands-index test passes

### Phase 4 — Cleanup + deploy (1ч)
12. Удалить legacy:
    - `/data/situations-universal.json`
    - `/data/brands-dtc/` (уже удалено в S18)
    - `/data/dtc-search.json` (уже удалено)
    - Старые `_articles_index.json`, `_dtc_index.json`, `_brand.json`, `_model.json`
13. `scripts/validate_kb_structure.py` — новый validator проверяет что файлы на правильных уровнях
14. Build + tar + upload prod + cleanup stale files on prod
15. Smoke test via Playwright MCP

### Phase 5 — Docs + handoff (30 мин)
16. `docs/kb-structure.md` — документация новой структуры
17. `memory/project_session19_progress.md`
18. Update MEMORY.md
19. Final commit `docs: Session 19 COMPLETE — gen-first structure`

### Phase 6 (optional, deferred если времени нет) — Verifier continuation
20. Запустить оставшиеся 770 verifier batches (23k sit) через 20+ агентов
21. Apply findings → -N wrong records

### Phase 7 (deferred) — ManualViewer
22. Upload D:/transfer4 manuals на prod CDN или backend
23. ManualViewer компонент с lazy fetch + отображение markdown

### Phase 8 (deferred, sprint) — Li Auto export
24. Импорт 102 articles из `D:/transfer4/export/08-articles-full.json`
25. Merge 35k DTC из `D:/transfer4/export/dtc-index.json` (но это тот же источник что 35911 titles — проверить duplication)

### Phase 9 (deferred, parallel) — OEM артикулы
26. Парсинг autodoc.ru / exist.ru / rockauto для заполнения part_number в parts-catalog

---

## 8. Quick validation commands

```bash
# Валидатор
python scripts/validate_kb_schema.py
python scripts/validate_full_articles.py

# TypeScript
cd llcar-dashboard && npx tsc -b

# Build
npm run build

# E2E (1/5 passes сейчас)
npm run test:e2e

# Deploy
bash scripts/deploy-v3.sh --frontend-only
# + manual tar upload для data/kb/

# API health
curl -k https://185.55.57.145/api/v2/diagnose-latest/?client_hash=test
```

---

## 9. Критические числа/факты

| Параметр | Значение |
|---|---|
| Total situations (per-gen) | 7,458 |
| Universal situations | 764 (отдельный файл) |
| Unique DTC codes (brand/model) | 8,070 |
| Universal DTC titles | 35,911 |
| Parts total | 47,522 |
| Reviews files | 178 |
| Manual refs | 210 |
| Images indexed | 107,167 ⚠ данные в D:/transfer4, будут добавлены по запросу в следующих сессиях |
| Manuals indexed | 210 ⚠ данные в D:/transfer4, будут добавлены по запросу в следующих сессиях |
| Full articles | 80 |
| Video links | 1,123 |
| Brand dirs | 80 |
| Schema issues | **0** |
| KB size local | ~232 MB |
| KB size on prod | ~232 MB |

---

## 10. При старте S19

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы"
cat SESSION-HANDOFF.md                           # этот файл
cat ~/.claude/plans/encapsulated-wibbling-coral.md  # полный план
git log --oneline da826d1..HEAD                   # что уже сделано
python scripts/validate_kb_schema.py             # должно быть 0 issues
ls -la .omc/state/s18-verifier-findings/ | wc -l  # 100 findings batches
```

**Первый шаг S19:** Phase 1 — переписать p2_copy_* для gen-first приоритета из D:/transfer4.
