# S27 · Этап G — удалённые мусорные manual.md

**Дата:** 2026-04-21
**Ветка:** `dashboard-v3`
**Критерий:** `unique_ratio < 0.05` (primary) — 4 user-flagged + 30 подтверждённых по тому же паттерну

**Результат:** bundle `public/data/kb/` **2.3GB → 869MB (−1.4GB, −62%)**.

---

## Что удалено

Только `manual.md`. Все соседние файлы (`meta.json`, `situations.json`, `videos.json`) оставлены — там DTC, видео-ссылки, метаданные.

## Valid­ация

Для всех 34 файлов подтверждено что `unique_ratio < 0.05`, т.е. 95%+ строк — полные дубли. Структурно: содержимое файла склеено из одного и того же материала 10-50 раз. Проверено через `grep -c` signature-строк:
- `kia/optima`: `"Подголовники активного типа"` встречается **41×**
- `gac/gs8`: `"Автоматическое складывание"` встречается **206×**
- `toyota/prado_2002`: `"Осциллограмма 1"` встречается **290×**

Поиск по такому мусору не работает, UX-ценности 0.

---

## Таблица удалённых (34)

Sorted by размер desc. Источник метрик: `.omc/research/s27-content-quality-repo.md`.

| file | size MB | uniq% | img% | words |
|---|---:|---:|---:|---:|
| haval/dargo/dargo_2022/manual.md | 81.54 | 1.2 | 0.0 | 5411071 |
| gac/gs8/gs8_2021/manual.md | 78.40 | 1.2 | 0.0 | 5342407 |
| kia/optima/jf_2015/manual.md | 75.73 | 2.6 | 0.0 | 5756026 |
| zeekr/007/007_2024/manual.md | 74.13 | 1.5 | 0.0 | 4840787 |
| jac/js4/js4_gen1_2019/manual.md | 72.57 | 1.3 | 0.0 | 4909826 |
| lexus/rx/al20_2015/manual.md | 69.66 | 3.2 | 0.0 | 4792680 |
| baic/x55/x55_2022/manual.md | 68.32 | 1.7 | 2.6 | 4923298 |
| toyota/prado/prado_2002/manual.md | 67.02 | 3.6 | 0.0 | 4993531 |
| mercedes/c_class/w204_2007/manual.md | 55.32 | 3.4 | 3.5 | 4034646 |
| skoda/octavia/a8_2020/manual.md | 50.50 | 2.7 | 0.0 | 3792370 |
| mitsubishi/pajero_sport/ks_2016/manual.md | 49.87 | 3.6 | 4.0 | 3425682 |
| fiat/ducato/x290_2014/manual.md | 49.23 | 2.5 | 0.0 | 3460797 |
| nissan/qashqai/j11_2014/manual.md | 47.99 | 3.8 | 1.7 | 3275601 |
| byd/atto_3/yuan_2021/manual.md | 45.19 | 2.0 | 0.0 | 6071482 |
| bmw/2_series/f22_2013/manual.md | 42.58 | 2.8 | 0.0 | 2826176 |
| porsche/macan/95b_2014/manual.md | 41.56 | 3.6 | 0.0 | 3407897 |
| nissan/almera/g15_2013/manual.md | 39.13 | 3.4 | 16.9 | 5415508 |
| renault/koleos/hy_2007/manual.md | 38.92 | 3.3 | 0.2 | 2750441 |
| toyota/highlander/xu70_2019/manual.md | 38.60 | 3.6 | 9.1 | 2941743 |
| volkswagen/polo/polo_2015/manual.md | 38.33 | 3.6 | 5.7 | 2698261 |
| bmw/x2/f39_2017/manual.md | 36.27 | 3.0 | 0.0 | 2405882 |
| hyundai/elantra/ad_2016/manual.md | 35.25 | 2.8 | 0.0 | 5605489 |
| changan/cs75_plus/cs75p1_2019/manual.md | 33.74 | 2.7 | 0.0 | 2186705 |
| changan/uni_k/unik1_2021/manual.md | 33.69 | 2.9 | 0.0 | 2193291 |
| skoda/kodiaq/ns_2016/manual.md | 33.55 | 3.0 | 0.0 | 2337913 |
| datsun/mi_do/gen_2014/manual.md | 32.99 | 3.2 | 0.0 | 2307492 |
| renault/arkana/rjl_2019/manual.md | 31.34 | 3.3 | 0.2 | 2228262 |
| gac/gs3/gs3_2020/manual.md | 27.93 | 3.2 | 0.0 | 1885351 |
| baic/x35/x35/manual.md | 27.81 | 2.6 | 3.6 | 1878379 |
| forthing/t5_evo/t5_2020/manual.md | 25.13 | 2.0 | 4.1 | 2023695 |
| forthing/t5/t5_2022/manual.md | 19.34 | 3.0 | 3.9 | 1476401 |
| forthing/friday/friday_rhd/manual.md | 13.10 | 3.1 | 9.2 | 1983506 |
| gac/emkoo/gen_2022/manual.md | 12.88 | 3.2 | 0.0 | 2000014 |
| zeekr/001/001_2021/manual.md | 11.20 | 3.8 | 0.0 | 520854 |

**Итого:** 34 файла, 1498.8 MB удалено. Путь каждого отмечен в `.omc/research/s27-source-blacklist.txt` чтобы ingest-скрипты их не тащили обратно.

---

## Что НЕ удалено (soft-junk, 20 файлов)

Для файлов с `unique_ratio` в диапазоне 0.05-0.20 (tag `junk:repetitive_soft`) подтверждено spot-check'ом что содержимое **реальное**, но склеено с повторяющимся header-блоком (`# BRAND model Manual / Source: X.pdf / Chunks: N / Language: …`). Может быть спасено через aggressive dedup в S28 (нормализатор с `s27_dedupe_near_paragraphs.py` уже готов).

Список оставленного soft-junk — в `.omc/research/s27-content-quality-repo.md` секция `junk:repetitive_soft`.

---

## Последствия

- UI: manualExists guard в ManualViewer уже отображает fallback «Нет руководства для этого поколения» — ничего не сломается.
- Search: манулы в `_manuals_index.json` не регистрируются per-gen без manual.md, поиск только по `situations.json` — работает.
- Ingest: blacklist не даст reingest'а; quality guard в обоих ingest-скриптах блокирует новые «копии» того же паттерна.
