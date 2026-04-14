# KB Audit — Group 07: Infiniti, JAC, Jaecoo, Jaguar

Src: `D:/transfer4/knowledge-base/brands/{b}/`
Pub: `llcar-dashboard/public/data/kb/{b}/`
Date: 2026-04-15

## Покрытие (модели src → опубликовано)

| Бренд | Src моделей | Опубликовано | Ген-папки |
|---|---|---|---|
| infiniti | 11 (ex, fx, fx35, q5, q50, q60, qx50, qx60, qx70, qx80, x3) | 4 | q50/v37_2013, qx50/j55_2017, qx60/l50_2013, qx70/s51_2013 |
| jac | 6 (j7, s3, s5, t8, js4, js6) | 2 | js4/js4_gen1_2019, js6/js6_gen1_2021 |
| jaecoo | 4 (j6, j7, j8, _j7_phev) | **0 — каталога нет** | — |
| jaguar | 7 (e_pace, f-pace, f_pace, xe, xf, xj, xj6) | 1 | f_pace/x761_2015 |
| **Итого** | **28** | **7 (25%)** | |

## Состав файлов

**Src (полный):** `manual.md` (часто 2-8 вариантов + `manual_generations.json`), `reviews.md`, `parts-catalog.json`, `dtc.json`/`dtc-model.json`, `situations.json` (17-22K строк), `info.json`, `keywords.json`, `video.md`, `images/`, `pdfs/`, `18-dita-manual.json`, `19-system-articles.json`.

**Pub (минимум):** `_brand.json`, `_model.json`, ген-папка = `{dtc.json, meta.json, situations.json, videos.json}`. Все 7 поколений — идентичная урезанная структура.

## Ключевые находки

1. **Jaecoo = ZERO coverage.** Директория бренда полностью отсутствует в dashboard, при этом J7/J8 — один из самых продаваемых китайских SUV в РФ 2024-2026. В src есть полный контент: manual + reviews + parts для J7/J8.
2. **manual.md не публикуется нигде** (0/7). В src богатые мануалы — до 8 вариантов на модель (infiniti/fx, jaguar/xf).
3. **reviews.md не публикуется** (0/7). В src есть у 18+ моделей группы.
4. **parts-catalog.json не публикуется** (0/7). В src есть почти у всех.
5. **Situations отфильтрованы на ~99%:** src 17-22K строк → pub 161-197 строк (factor ~100x). Неясно: намеренный фильтр по релевантности или баг пайплайна.
6. **images/ и pdfs/ не переносятся.** В src 13 PDF (infiniti: q50/q60/qx50…), images/ для infiniti/fx/fx35/jac/js4/s3/s5/jaguar/xf — всё игнорируется.
7. **Упущены "жирные" модели с готовым контентом:** infiniti/qx80 (manual+reviews+parts+pdfs), jaguar/xf (5 manual-вариантов + reviews + parts + images), jaguar/xj (3 варианта manual + pdfs), jaguar/e_pace (manual+parts), jac/s5 (5 manuals + images + pdfs), jac/t8 (manual+reviews), jaecoo/j7+j8.
8. **Дубль в src:** `jaguar/f-pace` (дефис) vs `jaguar/f_pace` (подчёркивание) — в KB попал только `f_pace`. Нужна консолидация на стороне источника.
9. **Infiniti fx** (22819 строк situations — крупнейший в группе) не опубликован; опубликованы более бедные q50/qx50/qx60/qx70.

## Рекомендация

**P0 (блокер UX, делать сейчас):**
- Создать `kb/jaecoo/{j7,j8}/` — модели активно продаются в РФ, src имеет полный контент.
- Опубликовать infiniti/{fx, qx80} (есть full set в src).
- Опубликовать jaguar/{xf, xj, e_pace} (есть full set).
- Опубликовать jac/{s5, t8} (активные продажи в РФ).

**P1 (контентный долг):**
- Расширить схему KB-поколения полями `manual`, `reviews`, `parts` (либо отдельными JSON, либо секциями в `meta.json`). Портировать src → pub для всех 7 уже опубликованных поколений + новых.
- Аудит 99%-truncation situations: подтвердить политику или чинить пайплайн.
- Резолв дубля `f-pace`/`f_pace` в src.

**P2:**
- Перенос `images/` и `pdfs/` под `public/data/kb/{b}/_assets/` + ссылки из manifest.
- Консолидация multi-variant `manual-*.md` в один per-generation.

**Summary:** 4 бренда, 28 src-моделей → 7 опубликованных поколений (25%), каждое — лишь 4 JSON файла из ~15 доступных в src. Jaecoo — полное белое пятно. Rich content (manuals/reviews/parts/images/pdfs) не доходит до dashboard вообще.
