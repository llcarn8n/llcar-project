# S16 KB Audit — Group 05: forthing / gac / geely / genesis

**Источник:** `D:/transfer4/knowledge-base/brands/`
**Таргет:** `llcar-dashboard/public/data/kb/`
**Дата:** 2026-04-15

## Сводная таблица

| Бренд    | Моделей (src) | Моделей (dash) | Situations (src) | Situations (dash) | Images src | Покрытие |
|----------|---------------|----------------|------------------|-------------------|------------|----------|
| forthing | 12            | 0              | 462              | 0                 | есть       | 0%       |
| gac      | 13            | 0              | 471              | 0                 | есть       | 0%       |
| geely    | 20            | 4              | 556              | 40                | есть       | 7%       |
| genesis  | 6             | 0              | 447              | 0                 | есть       | 0%       |

## Per-brand

### forthing (ОТСУТСТВУЕТ В DASHBOARD)
**Src models:** 580, _friday, ax7, forthing__friday, friday, friday_rhd, h30_cross, m4, t5, t5_evo, t5_hev, t5_sx3, u_tour
**Src состав:** manual.md + варианты по поколениям, dtc.json, situations.json, parts-catalog.json, 18-dita-manual.json, 19-system-articles.json, images/*.webp, pdfs/, reviews (частично), video.md
**Dashboard:** папки нет вообще. Потеряно: 462 ситуации, 12 моделей, полные мануалы (t5, t5_evo, t5_hev, m4, u_tour), изображения.
**Приоритет:** HIGH — Forthing активно продаётся в РФ (T5, M4, Friday), спрос есть.

### gac (ОТСУТСТВУЕТ В DASHBOARD)
**Src models:** _all, aion_lx, aion_s, aion_y, emkoo, empow, gac_s7, gn8, gs3, gs4, gs5, gs8, m8, s9
**Src состав:** manual-*.md (несколько генераций), reviews.md для gs8/empow/emgrand-like, parts-catalog.json, dtc.json, situations.json (471), images, pdfs, 18-dita-manual.json, 19-system-articles.json.
**Dashboard:** папки нет. Потеряно: 471 ситуация, 13 моделей, включая EV-линейку Aion (S/Y/LX).
**Приоритет:** HIGH — Aion и GS8 растут в РФ-импорте; GAC — крупный OEM.

### geely (ЧАСТИЧНО: 4/20 моделей, 10/ген ситуаций)
**Src models:** _all, _cityray, atlas, atlas_pro, cityray, coolray, coolray_2019, emgrand, emgrand_ev, ex5, galaxy, geely_galaxy_l7, geely_galaxy_m9, mk, monjaro, monjaro_2023_kx11, okavango, preface, tugella, x5
**Dashboard models:** atlas/nl3_2018, coolray/sx11_2020, monjaro/kx11_2022, tugella/fy11_2020 — только 4.
**Dashboard файлы на поколение:** meta.json, situations.json (10), dtc.json, videos.json. Нет: manual (никакого!), parts-catalog, reviews, images, articles.
**Ситуаций:** 40 в dashboard vs 556 в src (разница ×14).
**_brand.json:** models_count:1 (ошибка, должно быть 4+), chunks:0, articles:0, image_refs:0 — все счётчики обнулены.
**Упущено:** atlas_pro, emgrand (+ev), ex5, galaxy (включая L7/M9), okavango, preface, x5, cityray, mk; мануалы, parts-catalog, images, reviews, articles для ВСЕХ 4 присутствующих моделей.
**Приоритет:** CRITICAL — Geely топ-3 китайский бренд в РФ, покрытие смехотворное.

### genesis (ОТСУТСТВУЕТ В DASHBOARD)
**Src models:** _all, g70, g80, g90, gv60, gv70, gv80
**Src состав:** manual-*.md по генерациям (g80 II, g90 I/III, gv80 II), reviews.md для всех, situations.json (447), dtc, parts-catalog, 18-dita/19-articles, images (g90+), manual_generations.json.
**Dashboard:** папки нет. Потеряно: 447 ситуаций, 6 моделей, премиум-сегмент с активными владельцами.
**Приоритет:** MEDIUM-HIGH — Genesis — ключевой премиум Hyundai Group, CustDev показывает спрос.

## Ключевые находки

1. **3 из 4 брендов (forthing/gac/genesis) отсутствуют в dashboard целиком** — это дыра ~1380 ситуаций и 31 модель.
2. **Geely деградирован до 4 моделей и 10 ситуаций/ген** — выглядит как демо-сид, не production KB. _brand.json стоит `models_count:1` — битый счётчик.
3. **Ни один из 4 dashboard geely/ген-папок не содержит manual/parts/reviews/images** — только situations+dtc+videos+meta. Это обрезанный формат.
4. **Src богат:** у каждой модели в transfer4 есть manual-*.md (часто несколько per generation), 18-dita-manual.json, 19-system-articles.json, parts-catalog.json, images/. Это всё не переносится.
5. **Формат рассинхрон:** src = `brand/situations.json` (flat list) + `models/<m>/situations.json`; dashboard = `brand/<model>/<gen>/situations.json`. Нужен mapper.

## Рекомендация

**Pipeline S16 KB:**
1. Импортировать все 3 отсутствующих бренда (forthing, gac, genesis) с минимальным набором: meta.json, situations.json, dtc.json + _brand.json.
2. Расширить geely до 20 моделей; починить `_brand.json` (models_count, chunks, image_refs).
3. Добавить в dashboard-формат поля: manual (chunked md), parts-catalog, reviews, images (ссылки), articles — либо вынести в `_articles/` как уже делается для других брендов.
4. Переносить по 50+ ситуаций на поколение (вместо 10), маппить из src `models/<m>/situations.json` → конкретное поколение.
5. Порядок по ROI: **geely (fix) → gac (new) → forthing (new) → genesis (new)**.
