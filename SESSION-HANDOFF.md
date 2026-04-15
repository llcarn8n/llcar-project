# Передача сессии S19 — полный контекст проекта

**Дата:** 2026-04-15
**Ветка Git:** `dashboard-v3`
**Последний коммит:** `a952a7d docs: уточнить — manuals + images НЕ в repo`

---

## Часть 1. Что работает на боевом сервере

**Адрес:** `https://llcar.ru/v3/` — фронт, `https://185.55.57.145/api/v2/` — API.
**SSH-доступ:** скрипты-обёртки `/tmp/llcar_ssh.sh` и `/tmp/llcar_scp.sh` (пароль `webadmin` вшит, используют SSH-ключ `~/.ssh/id_ed25519.txt`). Пример:
```bash
/tmp/llcar_ssh.sh "команда на сервере"
/tmp/llcar_scp.sh <локальный_файл> webadmin@185.55.57.145:/путь/
```

**Путь установки на сервере:** `/var/www/html/django/static/spa-v3/`. Внутри:
- `static/` — собранные JS/CSS чанки (Vite output)
- `data/` — вся база знаний (KB), статические JSON/MD файлы

**Скрипт деплоя:** `scripts/deploy-v3.sh --frontend-only`
- Собирает фронт (`npm run build`)
- Загружает `dist/static/` диффом на сервер
- **НЕ загружает `dist/data/kb/`** (это нужно делать вручную tar-ом)

**Ручная загрузка данных KB:**
```bash
cd llcar-dashboard/dist
tar -czf /tmp/kb.tar.gz data/
/tmp/llcar_scp.sh /tmp/kb.tar.gz webadmin@185.55.57.145:/tmp/
/tmp/llcar_ssh.sh "cd /var/www/html/django/static/spa-v3 && tar -xzf /tmp/kb.tar.gz"
```

**Важная ловушка:** `tar -xzf` НЕ удаляет файлы, только перезаписывает/добавляет. Если переименовал/удалил файлы локально, нужно удалить их и на сервере вручную через `/tmp/llcar_ssh.sh "find ... -delete"`.

---

## Часть 2. Где и что хранится

### 2.1 Локальный проект

Корневая папка: `C:/Users/Петр/Downloads/Маркетинговые материалы/`

```
Маркетинговые материалы/
├── llcar-dashboard/              Фронтенд SPA (React + Vite + TypeScript)
│   ├── src/                      TypeScript исходники
│   ├── public/data/              Статика для фронта (копируется в dist при build)
│   │   ├── situations-universal.json       764 универсальные ситуации (файл один)
│   │   ├── brands-index.json               Список брендов для UI
│   │   ├── brands/{brand}.json             Структура моделей/поколений каждого бренда
│   │   ├── kb/                             Основная база знаний (см. раздел 2.2)
│   │   ├── diagnostic-rules.json           110 правил
│   │   ├── recalls.json                    298 отзывных кампаний
│   │   └── ... (manuals/, descriptions/, brands-info/)
│   ├── e2e/                      Playwright тесты (5 штук, 1 проходит)
│   ├── dist/                     Результат npm run build
│   └── package.json
│
├── scripts/                      Python-скрипты для обработки KB
├── docs/                         Документация
├── .omc/state/                   Промежуточные состояния (verifier findings, audit logs)
├── memory/ (нет — см. ~/.claude/projects/.../memory/)
├── SESSION-HANDOFF.md            Этот файл
├── S16-KB-MASTER-ROADMAP.md      Сводная карта 58 брендов
├── VERIFIER-FINDINGS-S16-P4.md   Находки верификатора S16
└── Context.docx                  Исходный Context (старый)
```

Память Claude: `~/.claude/projects/C--Users------Downloads------------------------/memory/`
- `MEMORY.md` — индекс
- `project_session15_progress.md`, `16`, `17` — логи сессий

План: `~/.claude/plans/encapsulated-wibbling-coral.md` — обновляется перед каждой крупной работой.

### 2.2 Структура базы знаний `llcar-dashboard/public/data/kb/`

**Текущая структура (её нужно переделать в gen-first в S19):**

```
kb/
├── _dtc_index.json                 Универсальные DTC коды (9.2 MB)
│   ├── titles: {CODE: {title_ru, severity, system_id, can_drive}}  — 35 911 кодов
│   ├── index:  {CODE: [{sit_id, title, brand, model, generation, urg, cat}]}  — 1 447 связей
│   └── titles_source: "liauto_export_v1" (источник — Li Auto export)
│
├── _articles_index.json            Индекс 80 полных статей
├── _articles/*.md                  80 статей (markdown, 1500-2500 символов)
│
└── {brand}/                        58 брендов (audi, bmw, byd, kia, toyota, ...)
    ├── _brand.json                 Метаданные бренда (название, страна, tier)
    ├── _dtc.json                   DTC коды бренда (после S18):
    │   ├── brand_codes: {CODE: {note_ru, common_fix_ru, severity, ...}}
    │   └── models: {модель: {CODE: {...}}}
    │
    └── {model}/                    Модели бренда
        ├── _model.json             Метаданные модели
        ├── parts-catalog.json      Каталог запчастей (247 файлов, 47 522 записей)
        ├── reviews.md              Отзывы (178 файлов)
        ├── manual_meta.json        Ссылка на мануал (210 файлов)
        ├── images.json             Индекс изображений (154 файла, 107 167 картинок)
        │
        └── {gen}/                  Поколения модели
            ├── meta.json           Метаданные поколения
            ├── situations.json     Ситуации конкретного поколения (432 файла, 7 458 записей)
            └── videos.json         Видео-ссылки (198 файлов, 1 123 ссылки)
```

**Известная проблема структуры (решается в S19):**
Файлы `parts-catalog.json`, `reviews.md`, `manual_meta.json`, `images.json` лежат на уровне МОДЕЛИ, то есть одна копия на все поколения. Это неправильно, потому что:
- Мануал BMW 3 F30 ≠ мануал BMW 3 G20 (разные моторы, платформы, электрика)
- Запчасти EA888 Gen3 ≠ EA888 Gen2 (разные OEM артикулы)
- Отзывы пишутся про конкретное поколение
- Изображения разных поколений разные
- Видео разные

**Целевая структура (S19):** всё выше — на уровень ПОКОЛЕНИЯ. Уровень модели — только fallback, если в источнике (`D:/transfer4`) нет разделения.

### 2.3 Внешний источник данных `D:/transfer4/knowledge-base/`

Это отдельный диск с подготовленной базой. 288 GB. **В репозиторий не попадает.**

```
D:/transfer4/knowledge-base/
├── _common/                        Универсальные данные
│   ├── situations-universal.json   764 ситуации (уже перенесены в llcar)
│   ├── dtc-index.json              36 102 DTC кода (уже в llcar как titles)
│   ├── hierarchy_bev/ice/phev.json
│   ├── recalls-database.json
│   ├── vehicles-ru.json
│   └── wmi-database.json
│
├── brands/                         58 брендов
│   └── {brand}/
│       ├── manifest.json, hierarchy.json, dtc-brand.json, situations.json
│       ├── chunks/chunks-*.md      Brand-level текстовый контент
│       ├── images/                 Orphan картинки (не привязаны к модели)
│       └── models/
│           └── {model}/
│               ├── manual.md                ОСНОВНОЙ мануал (OCR из PDF)
│               ├── manual-{variant}.md      Другие OCR/язык
│               ├── 18-dita-manual.json      Структура DITA
│               ├── 19-system-articles.json  Маппинг система→топики
│               ├── reviews.md                Отзывы (drom, web)
│               ├── reviews-tg.md             Из Telegram
│               ├── video.md                  Сырые видео-ссылки (уже перенесены)
│               ├── dtc.json, dtc-model.json  DTC коды модели
│               ├── info.json                 Спецификации + generations[]
│               ├── parts-catalog.json        Запчасти (уже импортированы, но на model-level)
│               ├── images/                   Изображения (не импортированы)
│               ├── pdfs/                     Исходные PDF
│               ├── chunk_generation_map.json Маппинг файл→поколение
│               └── {generation}/             Подпапка поколения (только если >1 поколения):
│                   ├── manual.md             Мануал конкретного поколения
│                   ├── 18-dita-manual.json
│                   ├── images/
│                   └── ...
│
└── export/                         Данные Li Auto (legacy, 275 MB, не импортированы)
    ├── dtc-index.json              35 911 DTC (совпадает с _common, уже используется)
    ├── 08-articles-full.json       102 статьи (не импортированы)
    ├── 05-parts-catalog.md         2 577 запчастей (не импортированы)
    ├── 07-glossary.md, 02-daily-tips.md, 06-articles.md
    └── 13-chunk-translations.json  Переводы RU/EN/ZH
```

**Важно:**
- **Мануалы (`manual.md`)** — НЕ в репозитории. Только `manual_meta.json` со ссылкой на путь в `D:/transfer4`. Импорт будет добавлен в следующих сессиях по запросу (нужно загрузить на prod-сервер как статику + написать компонент ManualViewer).
- **Изображения (`images/*.{jpg,png,webp}`)** — НЕ в репозитории. Только `images.json` со списком. Импорт тоже по запросу.
- **PDF, DITA, chunks-*.md** — НЕ используются сейчас, остаются в `D:/transfer4`.

---

## Часть 3. Что сделано (сессии S16, S17, S18)

### S16 — Фундамент базы знаний

1. **Исправлена схема:** было 51 нарушение (битые DTC коды, mojibake cyrillic), стало 0.
2. **Поиск по DTC** — добавлен компонент `DtcSearch` в страницу `/kb` с двумя вкладками («Ситуации» и «Поиск по DTC»). Клик по коду ведёт в ситуацию.
3. **Верификатор 7 брендов** (HiPhi, Nio, Leap, Jidu, IM, XPENG, Voyah) — 7 агентов проверили факты, нашли ошибки, сохранили в `.omc/state/s16-p4-verifier/*.json`.
4. **Импортировано 1 123 видео-ссылки** из `D:/transfer4/brands/*/models/*/video.md` (RuTube, YouTube, VK и т.д.).
5. **Добавлены 35 911 названий DTC кодов** с русскими переводами из Li Auto export.
6. **80 полных статей** — завершён P5, все проходят валидацию.
7. **Playwright E2E** — настроен, 5 тестов написано, 1 проходит (проблема с WebGL в headless Chromium для canvas-тестов).

### S17 — Расширение базы ситуаций

Исходная проблема: в dashboard было 3 060 ситуаций, в `D:/transfer4` — 400-700 на модель (всего ~180 000). Покрытие было 1-3%.

**Что сделано:**
1. **Написан ETL алгоритм UPT** (Universal-Plus-Targeted) — `scripts/etl_situations_upt.py`:
   - Читает `{model}/situations.json` или `{model}/{gen}/situations.json` (что богаче)
   - Определяет к какому поколению относится ситуация: по коду в тексте (F30, XV70) → по файлу из `chunk_generation_map.json` → по году в диапазоне `[ys..ye]` → иначе универсальная (копируется во все поколения модели)
   - Трансформирует схему: `quickAnswer→qa`, `urgency(0-3)→urg(1-5)`, `category→cat`
   - Пропускает CJK/мусор/слишком короткие записи
2. **Создана карта соответствия имён** `scripts/transfer4_brand_mapping.json`:
   ```
   mercedes_benz → mercedes
   li → li_auto
   bestune → faw_bestune
   jaguar/f-pace → jaguar/f_pace
   honda/cr-v → honda/cr_v
   honda/jazz → honda/fit
   lexus/es250 → lexus/es
   ```
3. **Расширены 41 существующих бренд** — с 10 до 150 ситуаций на поколение.
4. **Созданы 14 отсутствующих брендов** (P0 bootstrap):
   `baic, belgee, daewoo, datsun, forthing, gac, genesis, hongqi, jaecoo, kaiyi, li_auto, livan, ssangyong, tank`
5. **14-агентский аудит** — проверка D:/transfer4 vs llcar KB, сохранены отчёты в `.omc/state/s16-kb-audit/group{01..14}_*.md`.
6. **Master roadmap** — сводная таблица 58 брендов с процентами покрытия в `S16-KB-MASTER-ROADMAP.md`.

**Итог S17:** 3 060 → 36 575 ситуаций (было 12× больше), но с дубликатами universal-ситуаций.

### S18 — Очистка + rich content + реструктуризация

1. **Rich content** — импортированы запчасти (47 522 parts в 247 файлах), отзывы (268 reviews.md), метаданные мануалов (314 manual_meta), индексы изображений (232 images.json, 107 167 картинок).
2. **Консолидация DTC**:
   - Было: `{brand}/_brand_dtc.json` (58) + `{brand}/{model}/{gen}/dtc_brand_notes.json` (333, с дубликатами) + legacy `data/dtc-search.json` + `data/brands-dtc/{brand}.json`.
   - Стало: один файл `{brand}/_dtc.json` с полями `brand_codes` и `models`. Все остальные источники удалены.
3. **Удаление дубликатов**:
   - **23 642 universal-ситуаций** удалены из per-gen файлов (они уже лежат в `public/data/situations-universal.json`, незачем копировать).
   - **130 cross-brand** записей удалены (Lada упомянута в BMW и т.п.).
   - **1 071 дубликат** parts-catalog/reviews/manual_meta (одинаковые файлы в разных поколениях) — переместили на уровень модели.
   - **34 дубликата** целых папок поколений (одинаковые situations.json).
4. **GLM верификатор** — 5 агентов sonnet × 20 батчей × 30 ситуаций = 3 000 проверено GLM 5.1. Итог: 1 420 OK, 361 suspect, 903 wrong. **245 wrong удалены**, 658 из 903 уже были удалены раньше (это были те самые universal-дубликаты).
5. **8 medium-confidence правок** применены из S16 verifier (HiPhi supplier, Jidu motor power, Leap DC peak, XPENG DC-DC, и т.д.).
6. **Очистка корявых имён** — `ssangyong__musso__musso_2018_present_0` → `gen_2018`, ещё 8 переименований, 34 удаления.
7. **UI компоненты:**
   - В `KnowledgeBase.tsx` добавлены панели «Запчасти» (показывает каталог) и «Мануал» (показывает статистику + badge DITA/PDF).
   - `DtcSearch.tsx` — показывает русские названия DTC кодов.
   - Legacy `DTCSearch.tsx` на `/dtc` — мигрирован на новый `_dtc_index.json`.

**Итог S18:** 7 458 чистых ситуаций (только brand/model/gen-specific), 0 нарушений схемы, структура консолидирована.

---

## Часть 4. Цифры сейчас

| Показатель | Значение | Примечание |
|---|---|---|
| Ситуации (per-gen) | 7 458 | В 432 файлах situations.json, только brand/model/gen-specific |
| Универсальные ситуации | 764 | Один файл `public/data/situations-universal.json` |
| DTC коды (brand+model) | 8 070 уникальных | В 58 файлах `{brand}/_dtc.json` |
| DTC universal titles | 35 911 | Русские названия OBD-II кодов, в `_dtc_index.json.titles` |
| Parts (запчасти) | 47 522 | В 247 файлах parts-catalog.json (на уровне модели) |
| Reviews (отзывы) | 178 файлов | В файлах reviews.md (на уровне модели) |
| Manuals indexed | 210 | **Сами мануалы НЕ в репо**, в `D:/transfer4`. Добавление по запросу в будущих сессиях. |
| Images indexed | 107 167 | **Сами изображения НЕ в репо**, в `D:/transfer4`. Добавление по запросу в будущих сессиях. |
| Full articles | 80 | Markdown статьи 1500-2500 символов |
| Video ссылки | 1 123 | RuTube/YouTube/VK ссылки |
| Бренды (папки) | 80 | 58 брендов + подпапки variants |
| Ошибки валидатора схемы | **0** | Всё чисто |
| Размер KB локально | 232 MB | На диске |
| Размер KB на prod | 232 MB | Синхронизировано |

---

## Часть 5. Что НЕ сделано — задачи для S19

### 5.1 ГЛАВНАЯ задача: gen-first структура

**Суть:** переделать так, чтобы `parts-catalog.json`, `reviews.md`, `manual_meta.json`, `images.json`, `videos.json` лежали на уровне ПОКОЛЕНИЯ, а не модели.

**Зачем:** разные поколения одной модели — практически разные машины (разные моторы, платформы, электрика). Данные должны быть привязаны именно к поколению.

**Что нужно:**
1. Переписать три скрипта: `p2_copy_parts_catalog.py`, `p2_copy_reviews.py`, `p2_build_manual_meta.py`.
   - Новая логика: сначала проверить есть ли в `D:/transfer4/.../models/{model}/{gen_name}/` свой файл. Если есть — копировать на уровень поколения в llcar.
   - Если нет — копировать на уровень модели (это fallback для случаев, когда источник не разделён по поколениям).
   - Использовать `chunk_generation_map.json` для маппинга какие файлы к какому поколению относятся.
2. Написать `scripts/s19_gen_first_migration.py` — оркестратор:
   - Удаляет текущие model-level parts/reviews/manual_meta/images
   - Запускает переписанные p2_*
   - Сверяет результат
3. Написать `llcar-dashboard/src/utils/kbCascade.ts` — загрузчик с каскадом:
   ```typescript
   cascadeLoadSituations(brand, model, gen)
   // Загружает 4 слоя параллельно:
   // 1) kb/{brand}/{model}/{gen}/situations.json  — gen-specific
   // 2) kb/{brand}/{model}/situations.json        — model-level
   // 3) kb/{brand}/situations.json                — brand-level
   // 4) kb/_universal/situations.json             — universal
   // Дедуплицирует по id, приоритет у gen.
   // Каждая ситуация получает badge _source: 'gen'|'model'|'brand'|'universal'
   ```
4. Обновить компоненты:
   - `SituationsList.tsx` — показывать badge источника
   - `DtcSearch.tsx`, `DTCSearch.tsx` — унифицировать через cascade
   - `KnowledgeBase.tsx` — заменить 5 useEffect на один cascade-запрос

### 5.2 Переименование метаданных

Убрать подчёркивание из имён файлов (оно должно быть только у директорий типа `_universal/`, `_articles/`):
- `{brand}/_brand.json` → `{brand}/brand.json`
- `{brand}/{model}/_model.json` → `{brand}/{model}/model.json`
- `{gen}/meta.json` → `{gen}/gen.json` (с обогащением: имя, годы, коды, кузов)
- `_articles_index.json` → `_universal/articles_index.json`
- `_dtc_index.json` → разделить на `_universal/dtc.json` (titles) + `_universal/dtc_refs.json` (index)

### 5.3 Директория `_universal/`

Создать `kb/_universal/` со всем универсальным:
- `_universal/situations.json` — 764 (переехать из `public/data/situations-universal.json`)
- `_universal/dtc.json` — 35 911 названий
- `_universal/dtc_refs.json` — ссылки на ситуации
- `_universal/articles_index.json` — индекс статей

### 5.4 Незавершённые работы

**Верификатор GLM:** проверено 3 000 из 26 093 уникальных ситуаций. Осталось 770 батчей (≈23 000 ситуаций). Запустить ещё 20-40 агентов Sonnet.

**Suspect-записи:** 361 помечены как «подозрительные», требуют ручного review. Хранятся в `.omc/state/s18-verifier-findings/batch_*.json` в полях `status: "suspect"`.

**Частые паттерны ошибок** (из verifier, нужна проверка):
- Коды P0115-P0118 приписаны к DSG/ECU/суппортам (неправильно)
- Коды C0035-C0050 приписаны к by-wire brake (должно быть C121x/C1A0x/C055x)
- ГУР упоминается на машинах с ЭУР (все Belgee с ЭУР)
- Audi A5 8T Matrix LED — опция появилась позже, неправильно для 2007-2011
- C0000 для Alfa Romeo — невалидный DTC

**Datsun:** 4 модели созданы, но только с 10 ситуациями каждая.
**Opel:** в dashboard есть модели (astra_k, corsa_e, insignia_b), которых НЕТ в `D:/transfer4`. Нужно либо удалить, либо найти альтернативный источник.
**Jaecoo J7/J8:** топовые продажи в РФ 2024-2025, покрытие можно расширить.
**Kia Telluride:** есть в dashboard, НЕТ в источнике — синтетический контент, проверить.

**OEM артикулы запчастей:** 90% пустые (source `template`). Нужен парсинг autodoc.ru / exist.ru / rockauto для заполнения. Это отдельный большой спринт.

**Li Auto export:** 102 статьи + 2 577 запчастей + glossary не импортированы. Отдельный спринт.

**ManualViewer:** компонент для чтения мануалов. Нужно:
1. Загрузить сами мануалы (`manual.md` из `D:/transfer4`) на prod как static files.
2. Написать компонент ManualViewer с lazy-fetch и рендерингом markdown с 6 секциями.

**ImagesPanel:** такой же для изображений. Загрузить на prod CDN, написать компонент с lazy-thumbnails.

**Playwright E2E:** 1 тест из 5 проходит (brands-index). Остальные 4 (canvas, DtcSearch tab switch) падают из-за WebGL в headless Chromium. Нужно либо использовать `--use-gl=swiftshader` правильно, либо виртуальный X-server, либо Docker с нормальным GL.

**Корявые имена папок (остатки):** 5 штук после rename из-за коллизий имён. Нужна ручная проверка:
- `forthing/friday/forthing__friday__friday_2023_present_0`
- `forthing/_friday/` (двойная родительская папка!)

---

## Часть 6. Скрипты — что где лежит

Все в папке `scripts/`:

### Валидаторы (всегда должны проходить)
- `validate_kb_schema.py` — схема ситуаций, **0 issues**
- `validate_full_articles.py` — длина статей + 6 секций

### Сборка индексов
- `build_dtc_index.py` — пересобирает `_dtc_index.json.index` из situations.json
- `build_articles_index.py` — индексатор статей
- `merge_liauto_dtc_codes.py` — merge 35 911 universal titles

### ETL (главные)
- `etl_situations_upt.py` — **главный ETL S17**, UPT алгоритм
- `transfer4_brand_mapping.json` — карта имён

### Rich content (ПЕРЕПИСАТЬ в S19 под gen-first)
- `p2_copy_parts_catalog.py`
- `p2_copy_reviews.py`
- `p2_build_manual_meta.py`

### S18 очистки
- `s18_import_brand_dtc.py` — импорт brand/model DTC
- `s18_consolidate_dtc_to_one.py` — склейка в `{brand}/_dtc.json`
- `s18_strip_universal_from_gens.py` — удаляет universal-дубли
- `s18_strip_brand_mismatch.py` — cross-brand очистка
- `s18_cleanup_gen_dirs.py` — rename+dedup папок
- `s18_collapse_model_level.py` — **будет удалён** в S19 (в S19 нужна обратная логика)
- `s18_extract_unique_situations.py` — батчи для verifier
- `s18_apply_verifier_strip.py` — применение находок GLM

### Прочее
- `import_videos_from_transfer4.py` — импорт видео
- `deploy-v3.sh` — деплой (не захватывает data/kb, см. часть 1)
- `fix_kb_schema.py` — разовая починка схемы S16

---

## Часть 7. UI компоненты — что где

Все в `llcar-dashboard/src/`:

### Страницы
- `pages/KnowledgeBase.tsx` — основная страница `/kb`, **требует рефакторинга в S19** (5 useEffect → 1 cascade)
- `pages/ErrorCodes.tsx` — страница `/dtc` (legacy DTCSearch)
- `pages/Diagnostics.tsx` — главный дашборд с 3D

### Компоненты KB
- `components/kb/SituationsList.tsx` — список ситуаций, **добавить badge source в S19**
- `components/kb/DtcSearch.tsx` — новый DTC поиск (S16)
- `components/kb/FullArticle.tsx` — рендер статей
- `components/kb/QualityBadge.tsx` — значок качества
- `components/kb/ManualViewer.tsx` — заглушка, нужен real импл

### Компоненты DTC (legacy)
- `components/dtc/DTCSearch.tsx` — старый поиск на `/dtc`, уже мигрирован

### Стор (не трогать)
- `stores/dashboardStore.ts` — состояние: `vehicleProfile` (brand, brandId, model, year, engine, generationId)

### Утилиты
- `utils/kbPath.ts` — `deriveKBGenPath(brandId, genName) → 'brand/model/gen'`
- `utils/fetchCache.ts` — кэш для fetch
- `utils/icons.ts` — SVG иконки

---

## Часть 8. Известные проблемы и обходы

1. **Windows UTF-8 в Python:** скрипты используют `sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")` на Windows, иначе падает на cp1251. Все S17+ скрипты это учитывают.

2. **Vite base URL:** `'/static/spa-v3/'`. Все запросы с фронта идут через `${import.meta.env.BASE_URL}data/...`. Playwright config должен использовать baseURL `http://localhost:5173/static/spa-v3`.

3. **Роутинг:** внутри приложения пути `/`, `/kb`, `/dtc`. На проде они видятся как `/v3/`, `/v3/kb`, `/v3/dtc` из-за nginx-префикса.

4. **Playwright и WebGL:** headless Chromium не рендерит Three.js canvas без спец флагов. Нужен `--use-gl=swiftshader` или виртуальный X.

5. **tar не удаляет:** при `tar -xzf` на сервере старые файлы (переименованные локально) остаются. Нужно вручную удалить перед extract.

6. **deploy-v3.sh не трогает data/kb:** только static/. KB грузится tar-ом вручную.

7. **NPM dependency conflict:** при `npm install -D @playwright/test` нужен флаг `--legacy-peer-deps` из-за React 19.

8. **GLM MCP ограничения:** `mcp__glm__ask` иногда возвращает thinking traces вместо готового JSON при `max_tokens < 2000` и длинном промпте. Решение: `max_tokens=2500+` и явный `system="Отвечай только JSON, никаких преамбул"`.

9. **Git reset --hard удаляет staged новые файлы:** если у тебя есть новый файл в `git add`, но не закоммиченный, `reset --hard HEAD` его удалит. Проверено на `scripts/etl_situations_upt.py` в S17 — пришлось переписывать.

10. **Subagent context:** агенты не видят истории разговора, нужно давать полный контекст в промпте. Файлы для обмена — через диск (R1 rule).

---

## Часть 9. Правила предотвращения краха сессии (R1-R7)

Применяются во всех сессиях после S15 (которая упала):

- **R1:** выводы/находки агентов записываются сразу на диск, не в память ассистента.
- **R2:** максимум 3 агента в параллельном батче; не смешивать MCP (Playwright, GLM-vision) с subagents.
- **R3:** коммит после каждого логического блока, не копить staged.
- **R4:** при 70% контекста — STOP, сохранить состояние, сделать handoff.
- **R5:** сохранение в память после каждой Wave, не в конце сессии.
- **R6:** каждая Wave — закрытая точка, после которой можно начать новую сессию без потерь.
- **R7:** старт новой сессии читает `SESSION-HANDOFF.md` + `git log` + `.omc/state/`, не полагается на контекст предыдущей.

---

## Часть 10. Как начать S19

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы"
cat SESSION-HANDOFF.md                           # этот файл — полный контекст
cat ~/.claude/plans/encapsulated-wibbling-coral.md  # полный план gen-first
git log --oneline da826d1..HEAD                   # 20+ коммитов S16-S18
python scripts/validate_kb_schema.py              # должно быть 0 issues
ls -la .omc/state/s18-verifier-findings/ | wc -l  # 102 (100 findings + batch lock)
ls -la .omc/state/s18-verifier-batches/ | wc -l   # 870 батчей, 100 обработаны
```

**Первая задача S19:** переписать `p2_copy_parts_catalog.py`, `p2_copy_reviews.py`, `p2_build_manual_meta.py` — читать сначала из `{src}/models/{model}/{gen_name}/` (если есть), fallback на `{src}/models/{model}/`. Писать на соответствующий уровень (gen или model) в llcar.

---

## Ответ на «можно начинать новую сессию?»

**Да, можно.** Всё важное сохранено на диск:
- Код и данные — закоммичены (последний коммит `a952a7d`)
- Promежуточные состояния — в `.omc/state/` (14 audit reports, 100 verifier findings, 770 готовых batches)
- Память — в `~/.claude/projects/.../memory/`
- План S19 — в `~/.claude/plans/encapsulated-wibbling-coral.md`
- Этот handoff — исчерпывающий контекст

Потерь не будет.
