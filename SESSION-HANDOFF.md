# SESSION HANDOFF — Session 16 COMPLETE (partial)

## Статус: KB **62 бренда / 309 поколений / 3060 ситуаций / 0 schema issues / 50 full articles / 1820 DTC кодов**.

Prod `llcar.ru/v3/` + `llcar.ru/v3/kb` — **live**, API 200 после 2 deploy.

## Session 16 — краткий итог

**Полностью сделано:**
1. **P0 (унаследовано из пред. попытки):** 3D сцена на llcar.ru/v3 восстановлена. Коммиты 48969d5, f6883f1, b9f8a78, f023f09.
2. **P3 Schema Fix** — **51 issues → 0**. Все 309 situations.json валидны. 34 mojibake DTC удалены, 13 manufacturer codes → OBD-II, Toyota Camry XV40 _008 запатчен. Commit `f1c4bad`.
3. **P2 DtcSearch Integration** — табы "Ситуации" | "Поиск по DTC" в `KnowledgeBase.tsx`, кросс-таб навигация (клик на DTC-ситуацию → setVehicleProfile + автораскрытие). Commit `0b7106d`.
4. **P8 Deploy** (×2) — `deploy-v3.sh --frontend-only`, API 200 каждый раз.
5. **P4 Verifier** — 7 Round 4/5 brands (HiPhi X, Nio ET7, Leap C11, Jidu, IM L7, XPENG P7, Voyah Free) проверены через 7 subagent в 3 батчах (3+3+1). ~56 findings сохранены на диск в `.omc/state/s16-p4-verifier/{brand}.json` (не в памяти — rule R1). Сводный отчёт `VERIFIER-FINDINGS-S16-P4.md`.
6. **P5 Articles partial** — новый `scripts/build_articles_index.py`, 20 существующих на диске MD-файлов добавлены в индекс, validator 50/50 OK. Commit `9c99464`.

**Не сделано (deferred в S17):**
1. ⚠ **Применение P4 high-confidence findings в situations.json** (~25 правок по 7 файлам) — findings на диске, но требует focused micro-session per-file.
2. ❌ **30 новых full articles** — target 80, сейчас 50.
3. ❌ **P6 YouTube script + top-100 videos** — требует Google API key.
4. ❌ **P7 Playwright E2E (5 smoke tests)**.
5. ❌ **Visual QA через Playwright MCP + GLM vision** — быстрый deploy-check подтвердил API 200, но визуальный snapshot не сделан.

## Prevent-crash rules (R1-R7) — КРИТИЧНО для следующих сессий

Полный план: `~/.claude/plans/encapsulated-wibbling-coral.md`.

- **R1**: verifier-агенты ВСЕГДА пишут JSON findings на диск (`.omc/state/...`), не полагаются на память assistant'а.
- **R2**: максимум 3 subagents в одном батче, не мешать с MCP (Playwright, GLM-vision) в main thread.
- **R3**: commit после каждого P-блока, не копить staged state >10 мин.
- **R4**: на 70% контекста → STOP + SAVE + handoff, не "ещё одну операцию".
- **R5**: memory save после каждой Wave, не в конце.
- **R6**: каждая Wave = независимая точка handoff, закрытая точка.
- **R7**: старт новой Wave → читать `.omc/state/s16-progress.md` + `git log`, не полагаться на контекст.

## Коммиты S16 на `dashboard-v3`

```
9c99464 content(kb): P5 partial — index 20 existing articles (30→50 indexed)
<sha>   chore(kb): P4 verifier findings — 7 Round 4/5 brands fact-checked
0b7106d feat(kb): P2 DtcSearch tab integration with cross-tab navigation
f1c4bad fix(kb): P3 schema fix — OBD-II conversion + mojibake cleanup
f023f09 (S16 P0 tail) fix(kb): import JSX type from react для tsc -b build
b9f8a78 fix(v3): убрать overlay labels + вынести legends из-под 3D viewport
f6883f1 revert(v3): убрать Fresnel rim — оставить opacity fix как финал
48969d5 fix(v3): S16 P0 — restore 3D scene visibility (opacity + Fresnel rim)
```

## Next Session (S17) Priorities

**Самое важное — применение P4 high-confidence findings.** Во всех 7 файлах есть факт. ошибки, которые нужно исправить per-file:

1. **HiPhi X `x_2021/situations.json`**:
   - sit_002: удалить упоминание "6 лидаров для NOA + Hesai Pandora" (серия 2021 была камеры + 5 mmWave).
   - sit_003: "деградация при частых DC 80 кВт" → "до 250 кВт HPC поддерживается".
   - sit_004: задний мотор 300 кВт → 245 кВт (суммарно 480 кВт).
   - sit_006: DTC `P0A06` не относится к DC-DC недозаряду — заменить на `P0A1A`/`P0A94`.
2. **Nio ET7 `et7_2022/situations.json`** sit_002: передний PMSM — 240 кВт (не 255/300).
3. **Leap C11 `c11_2021/situations.json`**:
   - sit_001: убрать CTC (не применялось в 2021), 90kWh = NMC (не LFP).
   - sit_002: AWD = 400 кВт пик.
   - sit_006: нет пневмоподвески (только CDC).
   - sit_008: **EREV не существовал в 2021** — удалить или перенести в c11_2023/.
   - sit_010: LEAP 3.0 → LEAP 1.0/2.0.
4. **Jidu robo_01_2023** sit_002/008: "31 камера" → "12 камер + 2 LiDAR + 5 mmWave + 12 ultrasonic".
5. **IM L7 `l7_2022/situations.json`**:
   - sit_001: "semi-solid" → NMC liquid 90/93 kWh.
   - sit_003: "11 камер" → 12; "IM Hi4" → IMAD (Hi4 это Great Wall).
   - sit_004: DC "до 90 кВт" → GB/T до ~180 кВт.
   - sit_005: "передний 340 кВт" → 175 кВт.
   - sit_008: DTC C0035/C0040/C0045/C0050 не по теме by-wire brake.
   - sit_010: "Android Automotive" → IMOS (AliOS).
6. **XPENG P7 `p7_2020/situations.json`**:
   - sit_005: AWD 430 кВт → 316 кВт (120+196); SiC инвертор → IGBT.
   - sit_006: пневмоподвески НЕТ (CDC).
   - sit_008: iBooster вакуумный насос — нет.
   - sit_009: R134a → R1234yf.
7. **Voyah Free `free_2021/situations.json`**:
   - sit_003: OBC 11 кВт → 6.6 кВт.
   - sit_005: DK15 generator ~80 кВт.
   - sit_010: нет LiDAR в 2021 MY.

**Остальное:**
- 30 новых статей (batch 11-16, RAV4, LC300, 7-series, Cayenne, Kodiaq, Tiggo + другие) через GLM (паттерн S15).
- YouTube API key + `scripts/youtube_search.py`.
- Playwright E2E (5 smoke tests).
- Visual QA после финальных deploy.

## State Files для S17 старта

- `.omc/state/s16-progress.md` — что сделано/осталось (компактно).
- `.omc/state/s16-p4-verifier/*.json` — 7 файлов с findings (~56 total).
- `VERIFIER-FINDINGS-S16-P4.md` — human-readable сводка.
- `~/.claude/plans/encapsulated-wibbling-coral.md` — полный план.
- `memory/project_session16_progress.md` — подробный лог сессии.

**При старте S17:**
```bash
cat .omc/state/s16-progress.md
git log --oneline b9f8a78..HEAD
cat VERIFIER-FINDINGS-S16-P4.md | head -100
```
