# SESSION HANDOFF — Sessions 16+17+18 COMPLETE

## Prod state
- API 200, tar+untar deployed
- 432 per-gen situations.json × avg 18 sit = **7,588 clean situations**
- 764 **universal** в `public/data/situations-universal.json` (отдельный источник)
- 58 per-brand `_dtc.json` (brand + all-model codes) — **269,986 DTC codes**
- `_dtc_index.json` universal titles (35,911) + sit refs (~1,400 links)
- 362 parts-catalog.json (**47,522 parts**)
- 268 reviews.md, 316 manual_meta.json, 107,167 images indexed
- 80 articles validated
- 1,123 video links
- Validator: **391/391 OK, 0 issues**

## Ключевые решения этой сессии

### 1. Один источник DTC
- Универсальные OBD-II titles (35911) → `_dtc_index.json.titles`
- Brand + model-specific → **per-brand** `_dtc.json` (58 файлов, НЕ per-gen!)
- UI lazy-load на brand select, не dup по гентам

### 2. Universal ситуации — один раз, не копия на каждый gen
- 764 universal ситуаций в `public/data/situations-universal.json`
- Из per-gen `situations.json` удалены все **23642 duplicated universal records** (strip-universal pass)
- Per-gen файлы содержат ТОЛЬКО brand/model/gen-specific (7588 записей)

### 3. GLM verifier pass (3000 записей проверены)
- 5 sonnet agents × 20 batches × 30 sit = 3000 проверены GLM 5.1
- Verdicts: 1420 ok (47%), 361 suspect (12%), 903 wrong (30%)
- 245 wrong удалены из per-gen (остальные уже убраны при strip)
- Findings сохранены: `.omc/state/s18-verifier-findings/batch_0000..0099.json`

### 4. Rich content pipeline
- `scripts/p2_copy_parts_catalog.py` — model-level parts (cap 200/gen)
- `scripts/p2_copy_reviews.py` — reviews.md (cap 50KB)
- `scripts/p2_build_manual_meta.py` — manual_meta + images.json index (без bulk copy)

### 5. UI updates
- `DtcSearch.tsx` — показывает русские названия через `titles`
- `KnowledgeBase.tsx` — parts-catalog панель + manual_meta панель
- `SituationsList.tsx` — `initialExpandedId` для cross-tab navigation

### 6. Dir cleanup
- `s18_cleanup_gen_dirs.py` — удалены 34 дублированных gen dirs
- Переименованы 8 ugly имён (ssangyong__musso__..._0 → gen_2018)

## Коммиты (после S15 base `da826d1`)

~17 коммитов включая:
- audit(kb): 14 groups reports
- feat(kb): S17 ETL UPT pilot Toyota
- feat(kb): S17 Phase 2+3 — 14 missing + 41 expanded
- chore(kb): rebuild _dtc_index
- feat(kb): S18 P2 rich content (parts + reviews + manual_meta)
- fix(kb): S18 cleanup + UI render
- fix(kb): S18 apply 8 medium-conf findings
- feat(kb): S18 import brand/model DTC notes
- refactor(kb): один источник DTC + strip universal
- feat(kb): S18 GLM verifier — -245 wrong
- content(kb): +35911 DTC titles
- content(kb): 1123 video links
- P5 articles 50→80 via 6 batches

## Deferred / known issues

1. **361 suspect records** из GLM findings — требуют ручного review или повторного verifier pass с более строгим prompt
2. **23k записей НЕ проверены GLM** (прошли только 3000 первых; полный проход = 870 batches = ~10 ч работы)
3. **Parts OEM артикулы пустые** для template-generated (надо парсить autodoc/exist)
4. **Manuals не встроены в UI** — только manual_meta ref; полноценный ManualViewer с lazy-fetch D:/transfer4 manual.md нужен (следующая сессия)
5. **Audi A5 8T Matrix LED**, **C0000 для Alfa** — suspect, нужен спот-чек
6. **Cross-brand contamination** — verifier обнаружил в Q7/Q8/BJ40 контент от Audi A4 B9/VW 1.6. Требуется выборочный strip по brand-model фильтру в ETL

## Prevent-crash rules (R1-R7) — все применены
- R1: findings все на диске (verifier_batches, verifier_findings, s18-*.log)
- R2: max 5 sonnet agents в verifier batch (no MCP mix)
- R3: commit после каждого этапа (~17 коммитов)
- R5: progress state в `.omc/state/s17-*.log`, `.omc/state/s18-*`
- R6: каждая фаза была восстанавливаемой точкой

## Для S19 старта
```bash
cat SESSION-HANDOFF.md
git log --oneline da826d1..HEAD
ls .omc/state/s18-verifier-findings/ | wc -l
```
