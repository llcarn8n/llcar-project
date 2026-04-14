# KB Audit — Group 06: Haval / Honda / Hongqi / Hyundai

**Дата:** 2026-04-15
**Source:** `D:/transfer4/knowledge-base/brands/`
**Target:** `llcar-dashboard/public/data/kb/`

---

## 1. HAVAL

**Source (transfer4):** 10 моделей — `dargo, f7, f7x, h2, h4, h5, h6, h9, jolion, m6` + `_all`
Бренд-уровень: `chunks/, dtc-brand.json, hierarchy.json, images/, manifest.json, situations.json, sources.json, specs.json, pdf_quality/`.
Модели имеют: `manual.md` + мультивариантные (`manual-*.md`, `manual_generations.json`), `dtc.json` + `dtc-model.json`, `situations.json`, `parts-catalog.json`, `reviews.md`, `video.md`, `images/`, `pdfs/`, `18-dita-manual.json`, `19-system-articles.json`, `keywords.json`, `info.json`.

**Dashboard:** 4 модели — `jolion/jol_2021`, `f7/f7_2019`, `h9/h9_2015`, `dargo/dargo_2022`. Структура: `meta.json + situations.json(10) + dtc.json + videos.json`. **Итого 40 ситуаций.** `_brand.json` декларирует `models_count: 1` (несоответствие — реально 4).

| Aspect | Source | Dashboard | Gap |
|---|---|---|---|
| Модели | 10 | 4 | **–6** (h2, h4, h5, h6, m6, f7x) |
| Manuals | мульти-гены | отсутствуют | **нет manual.md на модель** |
| Parts | parts-catalog.json | — | **упущено** |
| Reviews | reviews.md | — | **упущено** |
| Images | images/ + pdfs/ | — | **упущено** |
| DITA/articles | `18-*`, `19-*` | — | не портировано |
| Situations | есть + бренд | 10/модель | усечено |

---

## 2. HONDA

**Source:** ~30 каталогов моделей (с алиасами `cr_v`/`crv`/`cr-v`, `accord` + `accord_2003/2013/98`, `fit`/`jazz`/`fit_jazz`, `crosstour`, `pilot`, `odyssey`, `freed`, `city`, `stepwgn`, `stream`, `hr_v`/`hrv_1999`, `prelude`, `edix`, `airwave`). Полный набор артефактов: manual + manual-*.md, dtc, situations, parts, reviews, video, images, pdfs, DITA, postprocess_fit.json.

**Dashboard:** 2 модели — `civic/fc_2016`, `cr_v/rw_2017`. **Итого 20 ситуаций.** `_brand.json: models_count: 1` (реально 2).

| Aspect | Source | Dashboard | Gap |
|---|---|---|---|
| Модели | ~30 (с дублями) | 2 | **–28 (после дедупа ~15)** |
| Accord | 4 гены | — | **отсутствует полностью** |
| Fit/Jazz/Pilot/Odyssey/HR-V/Stepwgn/Freed/City | есть | — | **все отсутствуют** |
| Manuals | мульти-гены | нет | упущено |
| Parts/Reviews/Images/PDFs | есть | — | упущено |

---

## 3. HONGQI

**Source:** 7 каталогов (дубли) — канонические: `e_hs9` (EHS9), `h5`, `h9`, `hs5`, плюс `hongqi_ehs9`, `hongqi_hq9`, `e-hs9`. У `e_hs9/h5/h9/hs5` есть manual + images + DITA + parts; `hongqi_hq9, hongqi_ehs9` — только metadata + pdfs.

**Dashboard:** **отсутствует полностью** — папки `public/data/kb/hongqi/` нет.

| Aspect | Source | Dashboard | Gap |
|---|---|---|---|
| Бренд-директория | есть | **НЕТ** | **критично** |
| Модели | 4–5 уник. | 0 | **–4/–5** |
| Situations/DTC/Manual | есть | — | **0 покрытие** |

**Рекомендация:** priority P0 — создать `hongqi/` с минимум `h9, h5, hs5, ehs9` (4 модели).

---

## 4. HYUNDAI

**Source:** 25 каталогов моделей — включая `accent, creta, elantra, galloper, getz, i30, i40, i40_2, ioniq, ioniq_5, ix35, kona, matrix, palisade, porter, santa_fe, solaris, solaris_2, sonata, starex, staria, staria_premium, tucson, tucson-2007, venue`. Полный набор артефактов + мульти-поколения.

**Dashboard:** 13 базовых моделей / 26 поколений (включая Genesis G70/G80/G90/GV70/GV80, solaris, creta×3, tucson×3, santa_fe×4, elantra×2, sonata, accent, ix35, palisade, ioniq5/6, staria). **Итого 258 ситуаций** (25×10 + 1×8, elantra/cn7_2020 неполный). `_brand.json: models_count: 25`.

| Aspect | Source | Dashboard | Gap |
|---|---|---|---|
| Модели (базовые) | 25 | 13 | **–12** (galloper, getz, i30, i40, kona, matrix, porter, starex, venue, staria_premium и пр.) |
| Поколения | мульти на модель | 26 gen | хорошо покрыто на топовых |
| Manual.md на gen | есть | **нет** | упущено |
| Parts/Reviews/Images | есть | — | упущено |
| elantra/cn7_2020 | 10 | **8** | **–2 ситуации** |
| Genesis | в Hyundai | отдельные папки | OK (design choice) |

---

## Ключевые находки

1. **Hongqi = 0%** покрытия — блокер P0.
2. **Honda = 7%** (2/~15 уник.) — критично мало для JP-бренда.
3. **Haval = 40%** (4/10 моделей) — отсутствуют h2/h4/h5/h6/m6/f7x.
4. **Hyundai = 52%** (13/25) — лучший, но нет budget/commercial (Porter, Starex, Galloper, Getz, Matrix, Kona, Venue, i30, i40).
5. **Manual/parts/reviews/images** — не портированы ни в одном бренде. Только situations+dtc+videos+meta на поколение.
6. **`_brand.json` метадата невалидна:** Haval/Honda показывают `models_count: 1`, все `data_stats: 0`.
7. **elantra/cn7_2020** имеет 8 ситуаций вместо 10 — добить до нормы.

## Рекомендация (приоритеты)

**P0:** создать `hongqi/` (h9, h5, hs5, ehs9 = 4×10 ситуаций).
**P0:** починить `_brand.json` для haval/honda (реальный `models_count`, `situations` stats).
**P1:** Honda — accord, pilot, fit/jazz, hr-v, odyssey (+5 моделей ×10 = +50 ситуаций).
**P1:** Haval — h6, h5, h2 (актуальные в РФ), f7x (+4 × 10 = +40).
**P2:** Hyundai — kona, i30, venue, staria_premium, getz (+5 × 10 = +50), добить elantra/cn7_2020.
**P3:** портировать manual.md + parts-catalog.json + reviews.md на уровень поколения (structured enrichment). Сейчас контент тонкий — только situations+dtc+videos.
