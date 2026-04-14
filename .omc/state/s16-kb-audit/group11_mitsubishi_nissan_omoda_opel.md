# KB Audit — Group 11: Mitsubishi, Nissan, Omoda, Opel
_Дата: 2026-04-15 | Ветка: dashboard-v3_

---

## Методология
- **SRC**: `D:/transfer4/knowledge-base/brands/{brand}/models/`
- **DST**: `llcar-dashboard/public/data/kb/{brand}/`
- Типы файлов: manual, reviews, parts, dtc, situations, images

---

## 1. Mitsubishi

| Метрика | SRC | DST |
|---|---|---|
| Моделей | 41 | 4 |
| Ситуаций (топ-модели) | 448–493 / модель | 10 / генерация |
| Поколений в DST | — | 4 (ga_2010, cy_2007, gf_2012, ks_2016) |
| Типы файлов в DST | — | dtc + situations только |

**Покрыто в DST**: asx, lancer, outlander, pajero_sport — по 1 поколению, только dtc+situations(10).

**Отсутствует в DST** (37 моделей): delica, eclipse_cross, l200 (10 поколений!), pajero, pajero_iv, pajero_sport (8 поколений), outlander_phev, montero, galant, colt, grandis, lancer_x и др.

**Упущения**: нет manual, reviews, parts, images ни в одном DST-объекте. Situations урезаны 457→10. L200 (10 поколений) и Pajero Sport (8 поколений) полностью отсутствуют.

---

## 2. Nissan

| Метрика | SRC | DST |
|---|---|---|
| Моделей | 43 | 7 |
| Ситуаций (топ-модели) | 421–613 / модель | 10 / генерация |
| Поколений в DST | — | 9 (2 у qashqai, teana, x_trail) |
| Типы файлов в DST | — | dtc + situations только |

**Покрыто в DST**: almera, murano, pathfinder, qashqai, teana, terrano, x_trail.

**Отсутствует в DST** (36 моделей): juke, tiida, primera, march, leaf, ariya, navara, patrol, sentra, qashqai_j11, x_trail_2021, almera, cube, micra, maxima и др. Qashqai_j11 особо ценен (613 ситуаций в SRC).

**Упущения**: нет manual/reviews/parts/images в DST. Juke, tiida, primera — популярные модели полностью отсутствуют. Situations 421–613→10.

---

## 3. Omoda

| Метрика | SRC | DST |
|---|---|---|
| Моделей | 6 (_c5 не считая) | 2 |
| Ситуаций | 442–454 / модель | 10 / генерация |
| Поколений в DST | — | 2 (c5_gen1_2022, s5_gen1_2023) |
| Типы файлов в DST | — | dtc + situations только |

**Покрыто в DST**: c5, s5 — по 1 поколению.

**Отсутствует в DST** (4 модели): c7, c9, e5, omoda-9. C7 имеет manual+reviews+parts+dtc+situations в SRC.

**Упущения**: c5 в SRC имеет 6+ manual-файлов, reviews, images — в DST ничего кроме dtc+10 ситуаций. C7 и E5 полностью отсутствуют.

---

## 4. Opel

| Метрика | SRC | DST |
|---|---|---|
| Моделей | 27 | 3 |
| Ситуаций | 440–471 / модель | 10 / генерация |
| Поколений в DST | — | 3 (2015, 2014, 2017) |
| Типы файлов в DST | — | dtc + situations только |

**Покрыто в DST**: astra_k, corsa_e, insignia_b — все 3 **отсутствуют в SRC** (extra в DST).

**Отсутствует в DST** (27 моделей из SRC): astra, corsa, insignia, vectra, zafira, mokka, meriva, frontera, combo, antara, grandland, calibra, omega и все варианты.

**Упущения критические**: DST содержит только модели, которых НЕТ в SRC (astra_k vs astra/astra_j, corsa_e vs corsa/corsa_d, insignia_b vs insignia). Скорее всего это более новые поколения без источников в transfer4. Все 27 реальных SRC-моделей не перенесены.

---

## Сводная таблица

| Бренд | SRC моделей | DST моделей | % покрытия | Ситуаций SRC→DST | Файлов в DST |
|---|---|---|---|---|---|
| Mitsubishi | 41 | 4 | **10%** | ~460→10 | dtc+sit |
| Nissan | 43 | 7 | **16%** | ~460→10 | dtc+sit |
| Omoda | 6 | 2 | **33%** | ~447→10 | dtc+sit |
| Opel | 27 | 0* | **0%** | ~444→10 | dtc+sit |

_*DST Opel содержит 3 модели (astra_k, corsa_e, insignia_b), которые отсутствуют в SRC_

---

## Рекомендации (приоритет)

1. **Opel [КРИТИЧНО]** — Рассинхрон: DST имеет модели, которых нет в SRC. Уточнить источник astra_k/corsa_e/insignia_b. Перенести все 27 SRC-моделей.
2. **Mitsubishi** — Перенести l200 (10 поколений, ~450 ситуаций каждое) и pajero_sport (8 поколений) — наибольший объём.
3. **Nissan** — Добавить juke, tiida, primera, leaf, qashqai_j11 (самый богатый — 613 ситуаций).
4. **Omoda** — Добавить c7, e5, c9; обогатить c5 (6 manual-файлов в SRC не перенесены).
5. **Все бренды** — В DST отсутствуют manual, reviews, parts, images; situations урезаны до 10 вместо 420–613.
