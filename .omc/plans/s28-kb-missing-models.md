# S28 — Аудит и восстановление 225 missing KB моделей

**Дата создания:** 2026-04-21 (в конце S27)
**Приоритет:** SHOULD (после S27 closure)
**Оценка:** 2-3 часа на аудит + от 4 часов на ingest, зависит от объёма восстановления

---

## Контекст

В vehicles.json (`src/data/vehicles.json`) перечислено **591 модель по 59 брендам**.
`scripts/audit_missing_kb_models.py` (создан в S27 H3) делит их на:

- **368 OK** — модель есть в `kb-generations-index.json` напрямую, UI видит мануал
- **23 HIDDEN** — мануал на диске но UI не доставал до S27 fix (решено cross-model fallback в `kbPath.ts`)
- **225 MISSING** — **нет мануала на диске вообще** (`<not on disk>` или `<no brand dir>`)

Пользователь видит на проде «Мануал загружается — скоро будет доступен» — placeholder
для этих 225.

## Примеры 225 missing моделей

```
uaz/СГР Буханка
baic/X35, X55
byd/SEAL U, SONG PLUS PFI
bestune/B70, T77, T90, T99  (весь бренд отсутствует — <no brand dir>)
changan/CS35, CS95, UNI-K, UNI-T, UNI-V, Alsvin, CS75 Plus
chery/Tiggo 2
exeed/LX, RX, Sterra ES/ET, VX, Yaoguang
forthing/* (5 моделей)
gac/Emkoo, GS3, GS8, GN8  (у нас только GS3 точечно, остальные нет)
geely/EX5, Emgrand EV, Okavango
haval/Dargo, H2, H4, M6
hongqi/E-HS9
...и ещё 185
```

Полный список — запусти `python llcar-dashboard/scripts/audit_missing_kb_models.py`.

## Цель S28

1. **Проверить источники** — для каждой из 225 моделей:
   - Есть ли файлы на `D:\transfer4\<brand>\<model>` (основной источник)?
   - Есть ли файлы на `D:\manuals-export\<brand>\<model>` (staging)?
   - Есть ли вообще в интернете доступный manual (Haynes/OEM/Chery-форум)?

2. **Классифицировать 225 по категориям:**
   - **A. Готово к ingest** — есть PDF/HTML на D:\transfer4 → запустить `s27_ingest_*.py`
   - **B. Нужна закачка** — мануал существует но не скачан → план краулера
   - **C. Нет мануала** — для 2024-2025 новых моделей мануалы ещё не выложены
     производителем → поставить честный "мануал появится в 2026" placeholder
   - **D. Exotic/dead** — советские ВАЗ/ЗАЗ/Москвич или убитые ребренды → удалить из
     vehicles.json или пометить как архивный

3. **Быстрые quick-wins для A:**
   - exeed/* — это всё Chery-суббренд, мануал Chery Tiggo 7 Pro подходит exeed/TXL.
     `BRAND_ALIAS` + fallback в kbPath.ts (как сделано для Tiggo 7 в S27).
   - li_auto/* — кросс-ссылка на l7 (L8/L9 имеют общую техчасть).
   - changan/CS* — часто общая платформа, можно делегировать CS35 → CS55 Plus.

4. **Для B:** нацелить GLM+Luma агентов на скачивание 30-50 мануалов за одну волну
   (см. feedback_kb_conveyor.md).

5. **Для C (новинки 2024-2025):**
   - Показывать "карточку бренда" с placeholder: спеки из vehicles.json + ссылка
     "Появится в 2026".
   - Не оставлять бросающуюся "Скоро будет доступен" на каждом 404.

6. **Для D (архивные):** решение отдельно — удалить или оставить как легаси.

## Рабочий план S28

### Фаза 1 — Аудит (30-60 мин)
```bash
cd llcar-dashboard
python scripts/audit_missing_kb_models.py > .omc/research/s28-missing.txt 2>&1
```
Добавить в скрипт:
- Проверку `D:\transfer4\<brand>` для каждой missing модели
- Классификатор A/B/C/D (по наличию source файлов + датам годов поколений)
- CSV-отчёт: `brand,model,ys,ye,has_transfer4,has_manuals_export,classified_as,recommended_action`

### Фаза 2 — Quick Wins (1-1.5 ч)
- Применить brand alias фиксы для exeed/li_auto/changan/chery
- Проверить результат через Playwright smoke (5 случайных моделей)
- Расширить `deriveKBGenPath` cross-model если нужно (платформенные общие мануалы)

### Фаза 3 — Ingest Wave (зависит от объёма)
- Для категории A — запустить `scripts/s27_ingest_volume_*.py` точечно
- Следить: unique_ratio > 0.25 (quality guard, см. feedback_no_dedup.md)
- После каждой волны regenerate `kb-generations-index.json`:
  `python scripts/s27_build_kb_index.py`

### Фаза 4 — UI honesty для категории C (30 мин)
- Обновить `ManualViewer.tsx` placeholder: вместо общего "Скоро будет" —
  специфичный "Модель 2024 года — мануал появится в 2026 (OEM не выложили)"
  для моделей где `max(generation.ye) >= 2024` и нет мануала.

### Фаза 5 — Verification (30 мин)
- Playwright smoke для 10-15 случайных моделей из всех брендов
- Обновить статистику на Landing через `kbStats` (автоматически подхватится)

## Блокеры / риски

- **D:\transfer4 объём** — 288GB, grep по 225 моделям может быть медленным.
  Решение: сделать индекс (CSV) заранее, скрипт по нему искать.
- **Brand aliases могут сломать 23 HIDDEN**, которые уже работают после S27 fix.
  Решение: любые новые aliases в `BRAND_ALIAS` — запустить `audit_missing_kb_models.py`
  до и после, проверить что HIDDEN не стал MISSING.
- **UI flicker** при массовом re-build `kb-generations-index.json` — делать всё в
  одном коммите, деплой с `--skip-build` + rebuild.

## Артефакты S27 которые пригодятся

- `llcar-dashboard/scripts/audit_missing_kb_models.py` — база для расширенного аудита
- `llcar-dashboard/src/utils/kbPath.ts` — cross-model fallback (добавлять сюда новые случаи)
- `llcar-dashboard/src/utils/kbStats.ts` — автоматическая статистика на UI
- `scripts/s27_build_kb_index.py` — регенерация индекса после ingest

## Метрика успеха

- До S28: 368 OK / 23 HIDDEN / **225 MISSING** = 62% coverage
- Цель S28: 450+ OK / 0 HIDDEN / ≤ 140 MISSING = **76%+ coverage**
- (225 → 140 MISSING = закрыть 85 моделей из A/B категорий)

## Связь с текущей сессией (S27)

После S27 commits `7d6f2ef` (stability) и `da8e39e` (KB stats + logo + Tiggo7 fix) —
всё живое на llcar.ru/v3/. Deploy skipbuild работает. Playwright smoke есть.
Нужно: запустить S28 когда будет 2-3 часа на аудит + ingest.
