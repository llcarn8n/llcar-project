# KB Audit — Group 01: audi / baic / belgee / bestune

Источник: `D:/transfer4/knowledge-base/brands/{brand}/`. Продакшн: `llcar-dashboard/public/data/kb/{brand}/`. 2026-04-15.

T4 per-model: manual.md, reviews.md, parts-catalog.json, dtc.json, info.json, keywords.json, situations.json, 18-dita-manual.json, 19-system-articles.json, images/, pdfs/. llcar per-gen: meta/situations/dtc/videos.json.

## AUDI — 15 в T4 / 11 в llcar

| model | manual | parts | dita | img/pdf | llcar |
|---|---|---|---|---|---|
| 100 | am | n | Y | 431/0 | — |
| a1 | 9.7M | Y | Y | 3357/0 | — |
| a3 | n | Y | n | 0 | 8v_2012 |
| a4 | 9.7M | Y | Y | 6908/2 | b8,b9 +vid |
| a5 | n | Y | n | 0 | 8t,f5 |
| a6 | multi | Y | Y | 637/Y | c7 +vid |
| a7 | n | Y | n | 0 | 4g,4k |
| a8 | 4gen | Y | Y | 457/0 | d5_2017 |
| e_tron | n | Y | n | 0 | — (есть gt) |
| q2 | n | Y | n | 0 | — |
| q3 | n | Y | n | 0 | 8u,f3 +vid |
| q5 | **256M** | Y | Y | 3357/1 | 8r,fy +vid |
| q7 | 1 | Y | n | 1300/0 | 4m +vid |
| q8 | n | Y | n | 0 | 4m_2018 |
| tt | n | Y | n | 0 | — |

Bonus llcar без T4: q4_e_tron, rs6. Articles MD: 4.

## BAIC — 6 в T4 / 0 в llcar (dir отсутствует)

| model | manual | parts | dita |
|---|---|---|---|
| bj40, bj60, u5_plus | stub | Y | n |
| x35 | 40.9M | Y | Y |
| x55 | **66.4M** | Y | Y |
| x7 | 1 | Y | Y |

images/pdfs у всех пустые.

## BELGEE — 5 в T4 / 0 в llcar (dir отсутствует)

| model | manual | parts | dita |
|---|---|---|---|
| s50 | multi | 24K | Y |
| x50 | **49.7M** | Y | Y |
| x50_plus | multi | Y | Y |
| x70 | 1.8M | Y | Y |
| x80 | stub | Y | n |

situations.json у s50 = 1.8MB. images/pdfs пустые.

## BESTUNE — 4 в T4 / 2 в llcar (`faw_bestune/`)

| model | manual | parts | dita | llcar |
|---|---|---|---|---|
| b70 | 2.3M | Y | Y | нет |
| t90 | n | Y | n | нет |
| t77 | 1.4M | Y | Y | t77_2018 |
| t99 | 0.6M | Y | Y | t99_2020 |

Articles MD у baic/belgee/bestune: 0.

## Ключевые находки

1. **BAIC и BELGEE целиком отсутствуют в llcar** — 11 моделей. Крупнейший пробел S16.
2. **Manuals не импортированы ни у кого** (~500MB в T4 vs 0 в llcar).
3. **parts-catalog.json у всех 30 моделей T4 — в llcar 0**. Пользователь видит DTC без "чем чинить".
4. **Images**: богато только у audi (a4=6908, q5=3357, a1=3357, q7=1300). У baic/belgee/bestune dirs пустые.
5. **DITA (18/19.json)** готовы у 21 модели — не используется в llcar.
6. **Гиганты**: audi/q5=256MB manual, belgee/x50=49MB, baic/x55=66MB — нужен chunked import.
7. **Gen mapping готов** (`manual_generations.json` + `chunk_generation_map.json`) у audi a4/a6/q5, belgee всех — не используется.
8. **Audi покрыт 11/15**: нет 100, a1, e_tron, q2, tt (все с parts в T4).
9. **bestune/b70 и t90 не импортированы**, b70 имеет 2.3MB manual + dita.

## Рекомендация

- **P0**: создать `kb/baic/` и `kb/belgee/`. Старт: x35, x55, x50, s50, x70 — парсинг situations+dtc через chunk_generation_map.json.
- **P0**: достроить `faw_bestune/b70` и `faw_bestune/bestune_t90`.
- **P1**: массовый импорт parts-catalog.json (30 файлов ×30-60KB, ~1 час, огромный value).
- **P1**: manual.md per-gen, начиная с 1-10MB (audi/a4, belgee/x70, bestune/b70/t77/t99, baic/x35); chunked для q5/x50/x55.
- **P2**: articles pipeline для 26 моделей без статей; images pipeline только для audi (15K+ файлов); baic/belgee/bestune images собирать отдельно.

**Главный риск**: DTC показан без контекста ремонта. Закрывается импортом parts-catalog (P1) + ≥1 manual per-gen (P1).
