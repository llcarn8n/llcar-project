# KB Audit — Group 02: BMW / BYD / Cadillac / Changan

Audit date: 2026-04-15. Source: `D:/transfer4/knowledge-base/brands/` vs sink: `llcar-dashboard/public/data/kb/`.
Legend: y = present, `-` = absent, sizes in bytes. Situation counts = entries in llcar `situations.json`.

## BMW — 22 models в transfer4 → 21 в llcar (1 generation per model = urgent gap)

| transfer4 model | manual.md | 18-dita.json | images | pdfs | parts | dtc | situ | reviews | llcar gens | situ llcar |
|---|---|---|---|---|---|---|---|---|---|---|
| 1_series | - | 783K | 0 | 1 | y | y | y | y | f20_2011 | 10 |
| 2_series | 120M | 56M | 0 | 1 | y | y | y | y | f22_2013, g42_2021 | 20 |
| 3_series | - | 143M | 427 | 5 | y | y | y | y | f30_2012, g20_2019 | 20 |
| 4_series | - | 960K | 0 | 0 | y | y | y | - | f32_2013, g22_2020 | 20 |
| 5_e28 | 2.3M | 1.1M | 0 | 0 | y | y | y | - | НЕТ | 0 |
| 5_series | - | 1.1M | 466 | 6 | y | y | y | - | f10_2010, g30_2017 | 20 |
| 6_series | - | 1.1M | 446 | 0 | y | y | y | - | f13_2010, g32_2017 | 20 |
| 7_series | - | - | 466 | 2 | y | y | y | - | g11_2015 | 10 |
| 8_series | - | 1.3M | 0 | 0 | y | y | y | - | g14_2018 | 10 |
| i3 | 1M | 509K | 455 | 1 | y | y | y | y | НЕТ | 0 |
| i4 | 1.4M | 740K | 0 | 0 | y | y | y | - | g26_2021 | 10 |
| ix | - | 910K | 0 | 0 | y | y | y | - | i20_2021 | 10 |
| ix3_2 | - | - | 0 | 0 | y | y | y | - | g08_2020 | 10 |
| x1 | - | 1.1M | 534 | 1 | y | y | y | y | f48_2015 | 10 |
| x2 | 96M | 45M | 0 | 1 | y | y | y | y | f39_2017 | 10 |
| x3 | 44M | 42M | 3390 | 1 | y | y | y | y | f25_2010, g01_2017, g45_2024 | 29 |
| x4 | - | - | 0 | 0 | y | y | y | y | g02_2018 | 10 |
| x5 | 35M | 41M | 3770 | 2 | y | y | y | y | f15_2013, g05_2018 | 20 |
| x6 | - | 1.2M | 583 | 0 | y | y | y | y | f16_2014, g06_2019 | 20 |
| x7 | - | 1.1M | 0 | 0 | y | y | y | y | g07_2018 | 10 |
| — | | | | | | | | | i5_g60_2023 (нет в transfer4) | 10 |
| — | | | | | | | | | i7_g70_2022 | 10 |
| — | | | | | | | | | z4_g29_2018 | 10 |

BMW totals: 30 llcar generation files, 299 situations, 30 DTC files. `_brand.json` декларирует `models_count: 4` — ОШИБКА (реально 22).

## BYD — 31 моделей/вариантов в transfer4 → 5 в llcar (ОГРОМНЫЙ пробел)

| transfer4 model | manual | dita | images | pdfs | llcar? | llcar situ |
|---|---|---|---|---|---|---|
| atto_3 | 108M | 51M | 0 | 2 | atto_3/yuan_2021 | 10 |
| dolphin | 2.3M | 1.2M | 1782 | 0 | dolphin/dolphin_2021 | 10 |
| han | 2.3M | 1.2M | 258 | 3 | han/han_2020 | 10 |
| seal | 1.6M | 791K | 382 | 2 | seal/seal_2022 | 10 |
| tang | 1.9M | 989K | 5569 | 2 | tang/tang_2018 | 10 |
| song | - | 51M | 462 | 3 | НЕТ | 0 |
| song_plus | 398M | 195M | 257 | 0 | НЕТ | 0 |
| qin | - | 23M | 838 | 1 | НЕТ | 0 |
| sea_lion | - | 59M | 1212 | 2 | НЕТ | 0 |
| yuan_plus | 9.9M | 55M | 443 | 2 | НЕТ | 0 |
| yuan_up | 194M | 873K | 360 | 0 | НЕТ | 0 |
| tang_ev | 4.8M | 2.4M | 5569 | 0 | НЕТ | 0 |
| t03 | 60M | 29M | 323 | 2 | НЕТ | 0 |
| han_ev, dolphin_2, seal_u, song_l, song_plus_pfi, byd_sealion_05/06 + 8 "версий мануалов" | … | … | … | … | НЕТ | 0 |

BYD totals: 5 llcar generations, 50 situations, 5 DTC. Нет `_brand.json` для BYD! (каталог `byd/byd/` в llcar пуст.) PDF quality dir существует, но модели дожаты до 5 из ~15 реальных.

## Cadillac — 8 моделей в transfer4 → 2 в llcar

| transfer4 | manual | dita | images | pdfs | parts | dtc | situ | llcar | situ llcar |
|---|---|---|---|---|---|---|---|---|---|
| ct5 | - | - | 0 | 0 | y | y | y | НЕТ | 0 |
| ct6 | - | - | 0 | 0 | - | y | y | НЕТ | 0 |
| cts | - | - | 0 | 0 | - | y | y | НЕТ | 0 |
| escalade | 166M | 39M | 6431 | 0 | y | y | y | НЕТ | 0 |
| rx | - | - | 0 | 0 | - | y | y | НЕТ | 0 |
| srx | - | - | 0 | 0 | y | y | y | НЕТ | 0 |
| xt4 | - | - | 0 | 0 | y | y | y | НЕТ | 0 |
| xt5 | - | - | 0 | 0 | y | y | y | xt5/2016 | 10 |
| — | | | | | | | | xt6/2019 (нет в transfer4) | 10 |

Cadillac totals: 2 llcar generations (xt5, xt6), 20 situations. `_brand.json`: `models_count: 2` — соответствует llcar, но не transfer4. `xt6` отсутствует в transfer4 (данные синтезированы). `escalade` с богатейшим мануалом (166M + 6431 изображение) НЕ ИСПОЛЬЗОВАН — крупная потеря.

## Changan — 25 моделей/вариантов в transfer4 → 4 в llcar

| transfer4 | manual | dita | images | pdfs | llcar | situ llcar |
|---|---|---|---|---|---|---|
| cs35_plus | 1.5M | 738K | 343 | 0 | cs35_plus/cs35p1_2018 | 10 |
| cs75_plus | - | - | 0 | 0 | cs75_plus/cs75p1_2019 | 10 |
| uni_k | 69M | 33M | 0 | 3 | uni_k/unik1_2021 | 10 |
| uni_t | 362M | 177M | 382 | 1 | uni_t/unit1_2020 | 10 |
| cs75 | 70M | 33M | 407 | 1 | НЕТ | 0 |
| cs95 | 80M | 38M | 418 | 1 | НЕТ | 0 |
| cs55 / cs55_plus | 3M | 1.5M | 2835 | 0 | НЕТ | 0 |
| eado | - | 67M | 354 | 1 | НЕТ | 0 |
| uni_v | - | - | 0 | 0 | НЕТ | 0 |
| qiyuan_a05/q05/q07 | - | 19-29M | 387-992 | 0-1 | НЕТ | 0 |
| cs35, alsvin, han, changan_q07, + 6 "версий" | … | … | … | … | НЕТ | 0 |

Changan totals: 4 llcar generations, 40 situations. `_brand.json`: `situations: 40` — совпадает.

## Ключевые находки

1. **Покрытие моделей катастрофически низкое везде кроме BMW**: BYD 5/~15 (33%), Cadillac 2/8 (25%), Changan 4/~14 (29%). BMW лучше: 20/22 (~91%), но без `i3` и `5_e28`.
2. **Богатейшие мануалы проигнорированы**: BYD `song_plus` (398M+195M dita), `yuan_up` (194M), BYD `song_l` (190M), Changan `uni_t` (362M), Cadillac `escalade` (166M+6431 img). Это сотни потенциальных ситуаций и статей.
3. **Images/PDFs вообще не перенесены в llcar** — ни одного `images/` каталога или `pdfs/` в `llcar-dashboard/public/data/kb/{bmw,byd,cadillac,changan}/`. `data_stats.image_files: 0` у всех. BMW transfer4 имеет 10600+ изображений.
4. **Нет `parts-catalog.json`, `reviews.md`, `18-dita-manual.json`, `manual.md`, `dtc.json` в llcar** — llcar хранит только `meta.json` + `situations.json` + укороченный `dtc.json` + `videos.json`. DITA-манулы (783K–195M) полностью опущены.
5. **BMW `_brand.json` содержит ошибку**: `models_count: 4` при фактических 30 каталогах. Аналогично BYD — нет `_brand.json` вообще; Cadillac/Changan имеют корректные счётчики, но заниженные.
6. **Синтезированный контент без источника**: BMW `i5_g60_2023`, `z4_g29_2018`, `i7_g70_2022`; Cadillac `xt6/2019` — в transfer4 нет `ix_ix20_2021` или `xt6`, ситуации сгенерированы без первичного мануала.
7. **Все ситуации = 10 на поколение** (кроме `bmw/x3/g45_2024` = 9) — признак автогенерации, не анализа источника.

## Рекомендация

**P0 — Impact-ordered restore**:
1. BYD: добавить минимум `song_plus`, `qin`, `yuan_plus`, `sea_lion`, `song` (5 моделей, все с >50M dita). Приоритет — `song_plus` и `yuan_plus`.
2. Cadillac: вынуть `escalade` (166M manual + 6431 images) и `ct5`/`srx`/`xt4` в llcar.
3. Changan: подключить `cs75`, `cs95`, `cs55_plus`, `eado`, `qiyuan_q05` (все с мануалами 19–80M).
4. BMW: добавить `i3` (полный pack) и починить `_brand.json.models_count` → 30, пересчитать data_stats.

**P1 — Enrichment pipeline**: прогнать `18-dita-manual.json` через GLM для генерации +20 ситуаций/поколение (сейчас по 10 — явно недостаточно), подхватить `parts-catalog.json` и `reviews.md`.

**P2 — Assets**: скопировать `images/` и `pdfs/` в `public/data/kb/<brand>/<model>/<gen>/assets/` + обновить `meta.json.images[]`. Без этого MCM-видимость контента в приложении равна нулю.

Без P0+P2 текущий llcar KB для этих 4 брендов представляет <15% доступного контента transfer4.
