# KB Audit — Group 03: Chery / Chevrolet / Citroen / Daewoo

Дата: 2026-04-15  
Сравнение: `D:/transfer4/knowledge-base/brands/` (источник, transfer4) vs `llcar-dashboard/public/data/kb/` (прод KB).

## Сводная таблица

| Бренд | transfer4 models | llcar models | Покрытие models | situations (src→dst) | manual.md | reviews.md | parts-catalog.json | dtc.json | images | pdfs |
|---|---|---|---|---|---|---|---|---|---|---|
| **chery** | 23 | 4 (tiggo2_pro, tiggo4_pro, tiggo_7_pro, tiggo_8_pro) | 17% | 1.7-2.0 MB → 15-20 KB (~100×) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть / есть | 5748 (brand) | есть (src), 0 (dst) |
| **chevrolet** | 24 | 1 (cruze) | 4% | 1.8 MB → 13 KB (~130×) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть / есть | 476 (brand) | 4 PDF cruze / 0 (dst) |
| **citroen** | 13 | 1 (c5, 2 gen) | 8% | 1.7-1.8 MB → 7-8 KB (~230×) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть (src) / нет (dst) | есть / есть | 3576 (brand) | 1 PDF c5 / 0 (dst) |
| **daewoo** | 11 | **0 (директории нет)** | **0%** | 1.7 MB → ∅ | есть (src) | есть (src) | есть (src) | есть | 8114 (brand) | есть (src) |

## Структура файлов в transfer4 (на модель)

`info.json`, `manifest.json`, `situations.json` (~1.7 MB ≈ 200-300 ситуаций полного формата), `manual.md` (+ per-generation `manual-<hash>.md`, `manual-<gen>.md`), `reviews.md`, `parts-catalog.json`, `dtc.json` + `dtc-model.json`, `keywords.json`, `video.md`, `03-hierarchy.md`, `18-dita-manual.json`, `19-system-articles.json`, `manual_generations.json`, `pdfs/*.pdf`, `images/*.webp`.

## Структура в llcar KB (на модель+поколение)

Только 3 файла: `meta.json`, `situations.json` (7-20 KB, ~10-15 ситуаций), `dtc.json`. Опционально `videos.json` (c5). Нет `manual.md`, `reviews.md`, `parts-catalog.json`, `images/`, `pdfs/`.

## Ключевые находки

### 1. DAEWOO ПОЛНОСТЬЮ ОТСУТСТВУЕТ в llcar KB
Директории `llcar-dashboard/public/data/kb/daewoo/` нет. В transfer4: 11 моделей (nexia, matiz, lanos, gentra, lacetti, kalos, espero + старые годы), 8114 изображений, полные мануалы (3-5 генераций/модель), PDF, ~18 МБ situations. **Критический пробел для СНГ-рынка.**

### 2. Покрытие моделей 4-17%
- **chery**: в llcar 4 из 23 — нет arrizo_7, arrizo_8, bonus, qq, tiggo_2, tiggo_4 (base), tiggo_7 (base), tiggo_7_pro_max, tiggo_7_pro_max_restyled, tiggo_8, tiggo_8_pro_max, tiggo_9.
- **chevrolet**: в llcar 1 из 24 — нет aveo, lacetti (СНГ-массовые!), niva, niva_travel, cobalt, captiva, tracker, trailblazer, orlando, malibu, equinox, epica, spark, lanos, rezzo, camaro, tahoe, suburban, traverse.
- **citroen**: в llcar 1 из 13 — нет c3, c4, c4_picasso, berlingo (массовый!), c_crosser, c5_aircross, xsara, xsara_picasso, zx.

### 3. situations.json урезаны в ~100-230×
Transfer4: 1.7-2.0 МБ (полноразмерные ситуации с манифестами, шагами, видео-ссылками). llcar: 7-20 КБ — явно сокращённая выборка (10-15 ситуаций вместо ~200-300). Для citroen урезание максимальное (230×).

### 4. Нет мануалов/обзоров/parts/images/pdfs в llcar
Ни в одной из 6 моделей llcar нет `manual.md`, `reviews.md`, `parts-catalog.json`, `images/`, `pdfs/`. В transfer4 — мануалы многогенерационные (до 5 вариантов/модель с per-hash, per-year, per-generation), reviews с тагами (`reviews-tg.md`), parts-catalog.json, per-модельные images (732-12324 файлов) и PDF (1-4 файла/модель).

### 5. Бренд-уровень: потеря метаданных
В transfer4 на уровне бренда — `hierarchy.json`, `specs.json`, `sources.json`, `manifest.json` с полным списком моделей и powertrain. В llcar только `_brand.json` с `models_count: 1` и нулевой статистикой (`chunks:0, situations:0, parts:0`). Метаданные не синхронизируются.

## Рекомендация (приоритизированная)

1. **P0 (блокер):** создать `llcar-dashboard/public/data/kb/daewoo/` и импортировать 4 приоритетные модели (nexia, matiz, lanos, gentra) — массовый СНГ-рынок.
2. **P0:** для chevrolet добавить `aveo`, `lacetti`, `niva`, `niva_travel`, `cobalt`, `captiva` — топ СНГ-моделей.
3. **P0:** для citroen добавить `berlingo`, `c4`, `c3` — массовые модели.
4. **P0:** для chery достроить `tiggo_2`, `tiggo_4`, `tiggo_7`, `arrizo_8`, `tiggo_9` — активный рынок.
5. **P1:** поднять situations.json до полноты (текущее 1-2% от источника). Текущие 7-20 КБ файлов явно результат частичного импорта — пересобрать pipeline из transfer4 с сохранением всех ситуаций + манифест шагов.
6. **P1:** добавить пайплайн импорта `manual.md`, `reviews.md`, `parts-catalog.json` (на уровень поколения или модели) — сейчас отсутствуют полностью, блокируют LLM-чат диагноста (KB Enrichment).
7. **P2:** импорт images/pdfs (хотя бы индекс ссылок), синхронизация `_brand.json.data_stats` (сейчас везде нули).

**Вывод:** группа 03 на llcar покрыта ~6% по моделям и ~1% по объёму контента. Daewoo критический gap. Нужен bulk-import из transfer4.
