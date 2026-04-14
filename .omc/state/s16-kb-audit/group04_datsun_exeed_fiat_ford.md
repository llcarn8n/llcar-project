# KB Audit — Group 04: Datsun / Exeed / Fiat / Ford

Source: `D:/transfer4/knowledge-base/brands/{brand}/` vs Dashboard: `llcar-dashboard/public/data/kb/{brand}/`

Dashboard schema per gen: `meta.json`, `situations.json` (~10 записей, ~13-20 KB), `dtc.json`, `videos.json`. Source schema per model: `manual*.md`, `reviews.md`, `video.md`, `situations.json` (сотни), `dtc.json`, `dtc-model.json`, `info.json`, `keywords.json`, `parts-catalog.json`, `images/`, `pdfs/`, DITA артефакты.

## Per-brand comparison

| Бренд | Source models | Dash models | Source situations (model) | Dash situations | Manual | Reviews | Parts | Images | DTC | Videos |
|-------|---------------|-------------|---------------------------|-----------------|--------|---------|-------|--------|-----|--------|
| **Datsun** | 4 (on_do, mi_do, 1000, 1000_1200_1972) | **0 (папки нет)** | 1367 + 470 brand | **0** | 8 файлов (on_do, mi_do, 1000) | on_do, mi_do, on-do | on_do, mi_do | on_do, mi_do, 1000 | 4 модели × dtc.json | on_do, mi_do |
| **Exeed** | 11 (es, et, exlantix_et, lx, rx, sterra_es/et, tx, txl, vx, yaoguang) | **3** (lx, txl, vx) | 4887 + 555 brand | 30 (10 × 3 gen) | lx, rx, tx, txl, vx (5 моделей, 5139 изображений) | 9 моделей | 11 моделей | 5 моделей (5139 images) | 11 моделей | 9 моделей |
| **Fiat** | 15+ (500, albea, bravo, coupe, croma, doblo, ducato, grande_punto, marea, palio, punto, stilo, tempra, tipo, uno, …) | **3** (500, ducato, tipo) | 5664 + 466 brand | 30 (10 × 3 gen) | 14 моделей с manual.md | 500, doblo, ducato | 9 моделей | 12 моделей | 14 моделей | 7 моделей |
| **Ford** | 19+ (c_max, ecosport, edge, escape, escort, explorer, f_150, fiesta, focus, galaxy, kuga, maverick, mondeo, mustang, mustang_mach_e, ranger, s_max, taurus, transit) | **3** (focus, kuga, mondeo) | 7553 + 589 brand | 30 (10 × 3 gen) | 17 моделей (8270 manual_chunks, 3491 images) | 12 моделей | 15 моделей | 13 моделей | 17 моделей | 14 моделей |

## Findings

1. **Datsun = ПОЛНЫЙ ПРОВАЛ.** В dashboard папки нет. Source содержит богатые данные: on_do/mi_do с manual.md, reviews.md, video.md, parts-catalog, images, DITA, system-articles. 1367 ситуаций для моделей + 470 brand-level не перенесены. Самый серьёзный upmission в группе.
2. **Exeed:** 8 из 11 моделей не портированы (es, et, exlantix_et, rx, sterra_es, sterra_et, tx, yaoguang). Особенно критично: rx и tx имеют полный manual + DITA + 5139 изображений суммарно (brand-level), которые полностью не задействованы. Yaoguang (флагман 2023) — отсутствует.
3. **Fiat:** 12 из 15+ моделей отсутствуют. Grande_punto, albea, doblo, bravo имеют manual.md + DITA — уровень качества данных соизмерим с перенесёнными. Tipo в dashboard ссылается на gen `356_2015`, но в source есть отдельный `fiat_tipo_1988_1991` + `tipo_tg` с отдельными manual — поколенческое разделение потеряно.
4. **Ford:** 16 из 19+ моделей отсутствуют. Explorer (manual 1995-2001 + 2023-2024), fiesta (5 manual-вариантов + 2008 + 2008-2011 поколения), ecosport, escape, mustang_mach_e (EV, polнtelly важен), transit — всё пропущено. 8270 manual_chunks общего объёма в source vs лишь focus/kuga/mondeo в dash.
5. **Универсальная проблема.** В dashboard ни для одного из 4 брендов не портированы: `manual.md` (полный текст РКЭ), `reviews.md` (drom отзывы), `parts-catalog.json`, `info.json`, `keywords.json`, `images/`, `pdfs/`, DITA (`18-dita-manual.json`, `19-system-articles.json`). Только situations (10 из сотен), dtc, videos, meta.
6. **Situations jumbo-shrink.** Source даёт 1367-7553 situations на бренд; dashboard ровно 10 × gen — жёстко усечённый placeholder, не связанный с объёмом источника.
7. **Schema mismatch.** Dashboard использует model→generation (например `focus/mk3_2011`), но source — плоский model-level с `manual_generations.json` и отдельными v2/ru/reocr вариантами. Mapping generation→source отсутствует.

## Рекомендация

**Приоритет P0 — Datsun:** создать `llcar-dashboard/public/data/kb/datsun/` с минимум on_do и mi_do (обе модели имеют полные данные). Это блокер — бренд виден в UI нулём.

**Приоритет P1 — Ford EV + массовые:** mustang_mach_e (BEV в brand tier, EV-стратегия), fiesta, ecosport, explorer, transit — source-данных достаточно для немедленного переноса.

**Приоритет P2 — Exeed/Fiat массовые:** Exeed tx, rx, yaoguang; Fiat grande_punto, albea, doblo — все с manual.md готовы.

**Системная задача:** построить ETL source→dashboard, переносящий manual.md (→ article chunks), reviews.md, parts-catalog, images, а также расширить situations с 10 → полного объёма gen-scoped. Текущий dashboard содержит ~0.2% ситуаций от источника по этой группе.
