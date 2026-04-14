# KB Audit — Group 12: Peugeot, Porsche, Renault, Skoda

**Дата аудита:** 2026-04-15
**Источник:** `D:/transfer4/knowledge-base/brands/{brand}/`
**Deployed:** `llcar-dashboard/public/data/kb/{brand}/`

---

## PEUGEOT

### Модели

| Источник (chunks-reviews) | Deployed | Статус |
|---|---|---|
| 2008 | — | ОТСУТСТВУЕТ |
| 206 | — | ОТСУТСТВУЕТ |
| 3008 | — | ОТСУТСТВУЕТ |
| 308 | — | ОТСУТСТВУЕТ |
| 408 | 408 (p54_2022, t7_2010) | OK |
| 5008 | — | ОТСУТСТВУЕТ |
| 508 | — | ОТСУТСТВУЕТ |

**Deployed модели:** 1 (408), 2 поколения
**Источник моделей:** 7

### Файлы (deployed, на поколение)

| Тип | Наличие | Кол-во |
|---|---|---|
| situations.json | есть | 14 (p54: 4, t7: 10) |
| dtc.json | есть | 27 кодов (2 файла) |
| videos.json | есть | 2 файла (4+4 видео) |
| meta.json | есть | 2 файла |
| manual | **нет** | 0 |
| images | **нет** | 0 |
| articles | **нет** | 0 |
| parts | **нет** | 0 |

**Источник:** images=894, chunks=26 (нет manual chunks), DTC src=165

### Находки
- Deployed только 1 из 7 моделей (14%)
- Situations критически мало: 14 vs ожидаемых ~70 (10/поколение × 7 моделей)
- DTC: deployed 27 из 165 src (16%)
- Нет manual chunks в источнике — пропуск оправдан
- Нет videos для моделей кроме 408, хотя src содержит видео-chunks для 206/308/408/508/5008

### Рекомендация
**Приоритет HIGH.** Добавить 6 моделей (2008, 206, 3008, 308, 5008, 508) с минимум по 10 ситуаций каждая (+60 ситуаций). Расширить DTC с 27 до 165.

---

## PORSCHE

### Модели

| Источник (chunks-reviews) | Deployed | Статус |
|---|---|---|
| 911 | — | ОТСУТСТВУЕТ |
| boxster | — | ОТСУТСТВУЕТ |
| cayenne | cayenne (92a_2010, 9ya_2017) | OK |
| cayenne_coupe | — | ОТСУТСТВУЕТ |
| cayman | — | ОТСУТСТВУЕТ |
| macan | macan (95b_2014) | OK |
| panamera | — | ОТСУТСТВУЕТ |

**Deployed модели:** 2 (cayenne, macan), 3 поколения
**Источник моделей:** 7

### Файлы (deployed, на поколение)

| Тип | Наличие | Кол-во |
|---|---|---|
| situations.json | есть | 30 (10 на поколение) |
| dtc.json | есть | 66 кодов (3 файла) |
| videos.json | есть | 1 файл (2 видео — только cayenne_coupe?) |
| meta.json | есть | 3 файла |
| manual | **нет** | 0 |
| images | **нет** | 0 |
| articles | **нет** | 0 |
| parts | **нет** | 0 |

**Источник:** images=5352, chunks=26 (manual: 911_ru, macan_ru), DTC src=2221

### Находки
- Deployed 2 из 7 моделей (29%)
- DTC катастрофически мало: 66 из 2221 src (3%) — Porsche имеет самый богатый DTC-источник
- Manual chunks есть для 911 и Macan в src — не импортированы
- Videos: только 1 generation из 3 имеет videos.json (macan отсутствует)
- Porsche — бренд tier-1, но наполнен хуже Renault/Skoda

### Рекомендация
**Приоритет CRITICAL.** Porsche имеет 2221 DTC в источнике — это самый богатый DTC-источник в группе. Добавить 911, boxster, cayenne_coupe, cayman, panamera. Импортировать manual chunks для 911/Macan. Расширить DTC минимум до 500+.

---

## RENAULT

### Модели

| Источник (chunks-reviews) | Deployed | Статус |
|---|---|---|
| arkana | arkana (rjl_2019) | OK |
| duster | duster (hs_2015, hm_2021) | OK |
| kangoo | — | ОТСУТСТВУЕТ |
| kaptur | kaptur (hha_2016) | OK |
| koleos | koleos (hy_2007, hz_2016) | OK |
| logan | logan (l90_2004, l52_2014, l8_2014, ll_2022) | OK |
| sandero | sandero (b90_2009, b52_2014, b8_2014) | OK |

**Deployed модели:** 6 из 7, 13 поколений
**Источник моделей:** 7

### Файлы (deployed, на поколение)

| Тип | Наличие | Кол-во |
|---|---|---|
| situations.json | есть | 130 (10 на поколение) |
| dtc.json | есть | 165 кодов (13 файлов) |
| videos.json | есть | 3 файла (7 видео суммарно) |
| meta.json | есть | 13 файлов |
| manual | **нет** | 0 |
| images | **нет** | 0 |
| articles | **нет** | 0 |
| parts | **нет** | 0 |

**Источник:** images=3234, chunks=74 (manual: laguna + _all), DTC src=119

### Находки
- Лучшее покрытие в группе: 6/7 моделей (86%), 13 поколений
- DTC: deployed=src=119 (все перенесено!)
- Отсутствует Kangoo — популярная модель с review-chunks в src
- Manual chunks для Laguna в src — не задеплоены (Laguna не в deployed вообще)
- Videos неравномерно: только 3 из 13 поколений имеют videos.json

### Рекомендация
**Приоритет LOW.** Добавить Kangoo (1 модель, ~20 ситуаций). Выровнять videos.json для остальных 10 поколений. Рассмотреть добавление Laguna с manual.

---

## SKODA

### Модели

| Источник (chunks-reviews) | Deployed | Статус |
|---|---|---|
| fabia | fabia (nj_2014, pj_2021) | OK |
| karoq | karoq (nu_2017) | OK |
| kodiaq | kodiaq (ns_2016, ns_2017) | OK |
| octavia | octavia (a8_2020) | OK |
| rapid | rapid (nh_2020) | OK |
| superb | superb (3v_2015, b8_2015) | OK |
| yeti | — | ОТСУТСТВУЕТ |

**Deployed модели:** 6 из 7, 9 поколений
**Источник моделей:** 7

### Файлы (deployed, на поколение)

| Тип | Наличие | Кол-во |
|---|---|---|
| situations.json | есть | 90 (10 на поколение) |
| dtc.json | есть | 165 кодов (9 файлов) |
| videos.json | есть | 9 файлов (63 видео суммарно) |
| meta.json | есть | 9 файлов |
| manual | **нет** | 0 |
| images | **нет** | 0 |
| articles | **нет** | 0 |
| parts | **нет** | 0 |

**Источник:** images=6800 (самый большой в группе), chunks=35 (manual: octavia — только .bak/.garbled), DTC src=481

### Находки
- Хорошее покрытие: 6/7 моделей (86%), лучший videos в группе (63 видео)
- DTC: deployed 165 из 481 src (34%) — недоиспортировано
- Yeti отсутствует — популярная модель с review + video chunks в src
- Manual octavia в src испорчен (garbled_bak) — пропуск оправдан
- Octavia представлена только 1 поколением (a8_2020) — самая популярная Skoda

### Рекомендация
**Приоритет MEDIUM.** Добавить Yeti (~10 ситуаций). Добавить Octavia старых поколений (A5/A7). Расширить DTC с 165 до 481.

---

## Сводная таблица

| Бренд | Src моделей | Deployed моделей | Покрытие | Situations | DTC src | DTC deployed | Images | Manual | Videos |
|---|---|---|---|---|---|---|---|---|---|
| Peugeot | 7 | 1 | 14% | 14 | 165 | 27 | нет | нет | 2 gen |
| Porsche | 7 | 2 | 29% | 30 | 2221 | 66 | нет | нет | 1 gen |
| Renault | 7 | 6 | 86% | 130 | 119 | 119 | нет | нет | 3 gen |
| Skoda | 7 | 6 | 86% | 90 | 481 | 165 | нет | нет | 9 gen |

**Общие пробелы по всем брендам:**
- Images: 0 deployed vs 894–6800 в источнике
- Articles: отсутствуют везде
- Parts: отсутствуют везде
- Manual: в src есть только для Porsche (911, Macan) и Renault (Laguna) — не задеплоены

**Приоритеты по важности:**
1. CRITICAL — Porsche DTC (2221 src, 66 deployed)
2. HIGH — Peugeot модели (6 из 7 отсутствуют)
3. MEDIUM — Skoda DTC + Octavia поколения + Yeti
4. LOW — Renault Kangoo + videos выравнивание
