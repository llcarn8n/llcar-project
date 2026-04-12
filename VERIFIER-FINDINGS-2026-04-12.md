# Verifier Findings — 2026-04-12 (Session 13)

Сохранено сразу после завершения 3 параллельных verifier-агентов.

## Группа 1 — Audi/Mazda/Mitsubishi/Chinese (Chery/Haval/Geely)
**Verdict: PASS with 14 warnings, 0 critical.**

### Fixes Required:
1. `audi/q5/fy_2017/situations.json` id `audi_q5_fy_003` — CZHA (1.4 TFSI) не ставился на Q5 FY в РФ. Заменить на DEZA/DETA или убрать упоминание 1.4 TFSI.
2. `mitsubishi/outlander/gf_2012/situations.json` id `mitsu_outlander_gf_006` — Aisin W6AJ21 → **Aisin AW6A-EL**.
3. `mitsubishi/pajero_sport/ks_2016/situations.json` id `mitsu_pajero_ks_001` — P1451 (Ford код) → **P242F** (Mitsubishi DPF soot).
4. `mazda/3/bp_2019/situations.json` id `mazda_3_bp_001` — убрать "PEY5" (не существует) → PE-VPH.
5. `mazda/6/gj_2012/situations.json` id `mazda_6_gj_007` — убрать C0035/C0040 (wheel-speed, не подвеска).
6. `geely/coolray/sx11_2020/situations.json` ids `_003`, `_004` — убрать C0035/C0040.
7. `geely/coolray/sx11_2020/situations.json` id `_005` — убрать P0243 (wastegate), оставить P0299/P2262.
8. `mazda/cx5/kf_2017/situations.json` id `mazda_cx5_kf_009` — Cylinder Deactivation не ставился на РФ KF. Убрать ситуацию или добавить caveat.
9. `haval/jolion/jol_2021/situations.json` id `haval_jolion_003` — P2187 (Bank 2) → **P0171** (Bank 1, это 4-цил).

## Группа 2 — Ford/Lexus/Subaru/LR/Volvo
**Verdict: FAIL, 4 CRITICAL + 7 warnings.**

### Fixes Required:
1. `lexus/rx/al20_2015/situations.json` id `lexus_rx_al20_008` — **CRITICAL**: RX AL20 НЕ имеет пневмоподвески. Удалить ситуацию или переписать как AVS electronic dampers.
2. `lexus/rx/al20_2015/situations.json` id `lexus_rx_al20_006` — **CRITICAL**: RX AL20 не имеет DTV. Заменить на **ATC** (Active Torque Control) E-Four coupling, убрать per-wheel vectoring.
3. `volvo/xc60/su_2017/situations.json` id `volvo_xc60_su_001` — **CRITICAL**: T5 petrol код **B4204T27** (не B4204T23 — это D5 diesel).
4. `volvo/xc90/lc_2015/situations.json` id `volvo_xc90_lc_001` — **CRITICAL**: убрать P0420 (catalyst efficiency — не существует на дизеле). Оставить P2463, P0401.
5. `ford/kuga/mk2_2013/situations.json` id `ford_kuga_mk2_003` — Aisin 6F35 → **Aisin 6F50** (для 2.5 Duratec, 150 hp).

### Warnings (низкий приоритет):
- Subaru Forester SK TR580 vs TR690 — мелочь.
- LR RR Sport L494 supercharger — DTCs P0069/P006A тангенциальны.
- Volvo XC90 LC CEM "радары в элитных районах" — убрать фолк-знание.

## Группа 3 — Honda/Chevy/Suzuki + Toyota/Kia/Hyundai/VW/Skoda/LADA/Nissan/BMW/Merc recent
**Verdict: PASS with 3 fix-needed + много warnings.**

### Critical/Fix-Needed:
1. `toyota/corolla/e180_2013/situations.json` id `_001` — **1ZR-FE → 1ZR-FAE** (Valvematic только на FAE).
2. `nissan/pathfinder/r52_2013/situations.json` id `_007` — китайский иероглиф **降解 → износа** (GLM artifact).
3. `mercedes/a_class/w177_2018/situations.json` id `_002` — китайский **服务站 → сервисном центре** (GLM artifact).

### Warnings:
- `skoda/octavia/a8_2020` id `_07` — P0DKV0 (не валидный OBD) → P0534.
- `kia/rio/qb_2011`, `kia/rio/fb_2017`, `skoda/octavia/a8_2020` — formatting "rub"/"km" → "руб."/"км".
- Multiple files schema issue: string values в dtc_codes array ("Нет кодов...", "None", "—") → `[]`.
- `mercedes/gls/x166_2012` id `_010` — SBC (не ставилась на X166) → EBC.
- `mercedes/cla/c117_2013` id `_010` — убрать P0715 из EPB ситуации.
- `mercedes/gls/x167_2019` ids `_009`, `_010` — убрать P2096, P0500 из неподходящих ситуаций.
- `kia/mohave/hm_2019` id `_001` — убрать P0420 из DPF (catalyst, не DPF).
- `volkswagen/golf/mk7_2012` id `_005` — Aisin 6AT не стандарт для Golf MK7 RU, заменить на DSG-6 DQ250.
- `honda/cr_v/rw_2017` id `_001` — B1235 не relevant для battery drain.
- `hyundai/palisade/lx2_2019` sit_010 — "None" как string → пустой array.
- `bmw/7_series/g11_2015` id `_004` — cat="engine, cooling" → один value.
- `bmw/x4/g02_2018` — BMW ISTA hex codes (20A90C и т.п.) нестандартные OBD-II.

## Приоритет применения:
1. **Сейчас (critical)** — 4 критичных Group 2 (Lexus x2, Volvo x2) + 3 из Group 3 (Toyota engine code, Nissan/Merc foreign chars).
2. **Потом (important)** — Group 1 warnings (W6AJ21, P1451, P2187, PEY5, C0035/C0040 на подвеске).
3. **В фоне (cosmetic)** — formatting rub/km, schema ["None"]/["—"] → [], BMW hex codes.
