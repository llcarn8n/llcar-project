# KB Audit: Toyota / UAZ / Volkswagen / Volvo / Voyah / Zeekr

**Дата:** 2026-04-15  
**Источник:** `D:/transfer4/knowledge-base/brands/`  
**Деплой:** `llcar-dashboard/public/data/kb/`

---

## Сводная таблица

| Бренд       | Src моделей | Deploy моделей | Deploy поколений | Sit/ген (deploy) | Sit в src (пример) | Images deploy | Упущено моделей |
|-------------|-------------|----------------|------------------|-------------------|--------------------|---------------|-----------------|
| Toyota      | 59          | 9              | 15               | 10 (stub)         | 645–697            | НЕТ           | 45              |
| UAZ         | 6           | 1              | 1                | 10 (stub)         | 704                | НЕТ           | 4               |
| Volkswagen  | 47          | 5              | 8                | 10 (stub)         | 622–700            | НЕТ           | 37              |
| Volvo       | 17          | 4              | 5                | 10 (stub)         | 656–672            | НЕТ           | 8               |
| Voyah       | 10          | 1              | 1                | 10 (stub)         | 678                | НЕТ           | 8               |
| Zeekr       | 9           | 4              | 4                | 10 (stub)         | 633–649            | НЕТ           | 4               |

---

## Структура файлов в деплое (на поколение)

Все развёрнутые поколения содержат: `dtc.json` (3 записи), `meta.json`, `situations.json` (10 записей), `videos.json`.  
**Отсутствуют:** `manual`, `parts`, `reviews`, `images` — ни в одном бренде.

---

## По брендам

### Toyota
- **Deploy:** 9 моделей, 15 поколений (alphard×2, bz4x, camry×3, corolla×2, highlander, land_cruiser×2, prado, rav4×2, sienta)
- **Источник:** 59 моделей с реальным контентом (`situations.json`/`dtc.json`)
- **Упущено (45 моделей с контентом):** 4runner, auris, avalon, avensis, c_hr, caldina, celica, corolla_ax, corolla_fielder, crown, fortuner, harrier, hiace, hilux, hilux_surf, land_cruiser_prado, mark_2, mark_x, noah, prado_1996/2002/2009, premio, prius, rush, sequoia, sienna, supra, tundra, venza, vitz, wish, yaris + camry sub-variants
- **Images в src:** массивные (camry 12K, yaris 11K, corolla 7K, land_cruiser 6K, rav4 5K) — не задеплоены
- **Manual/parts/reviews в src:** есть у всех 9 задеплоенных моделей (кроме prado — нет manual/reviews, alphard — нет reviews)

### UAZ
- **Deploy:** 1 модель (patriot/patriot_2005)
- **Источник:** 6 моделей
- **Упущено (4):** bukhanka, hunter, profi, sgr_bukhanka — все имеют situations+dtc+manual+parts
- **Images в src:** только у 2008 (4768) и profi (30) — не задеплоены

### Volkswagen
- **Deploy:** 5 моделей, 8 поколений (golf mk7, passat b8×2, polo aw+mk6, tiguan ad1+nf, touareg cr)
- **Источник:** 47 моделей с контентом
- **Упущено (37 моделей):** id4, id5, id6, jetta, jetta_2, caddy, caravelle×2, crafter, golf3/6, multivan×2, passat_2/b6/cc, polo_1994/2/2015/sedan, scirocco, sharan×2, t_roc_2, taos×2, teramont×2, tiguan_2, touareg_2, touran, transporter×2, bora, beetle
- **Images в src:** golf(902), polo(3741+4666), tiguan(2079×2), polo_sedan(1686) — не задеплоены

### Volvo
- **Deploy:** 4 модели, 5 поколений (s60×2, xc40, xc60, xc90)
- **Источник:** 17 моделей (из них 8 с sit/dtc не задеплоены)
- **Упущено (8):** 850, s40, s80, s90, v40, v60, v90, xc70 — все имеют situations+dtc
- **Images в src:** xc90(1260) — не задеплоены; остальные модели images нет
- **Manual в src:** есть у s60, xc60, xc90; у xc40 — нет manual.md

### Voyah
- **Deploy:** 1 модель (free/free_2021)
- **Источник:** 10 моделей с контентом
- **Упущено (8):** courage, dream, dreamer×2, free_2, passion, taishan, 6d3mmp (alias free)
- **Images в src:** dream(635), free(576), free_2(576), passion(244) — не задеплоены

### Zeekr
- **Deploy:** 4 модели, 4 поколения (001, 007, 009, x)
- **Источник:** 9 моделей (4 с контентом не задеплоены)
- **Упущено (4):** 7gt, 7x, 9x, mix — все имеют situations+dtc+parts
- **Images в src:** 001(727), 007(634), 9x(1018), 009(58) — не задеплоены

---

## Ключевые находки

1. **Situations — stub 10/10:** Все задеплоенные поколения содержат ровно 10 ситуаций и 3 DTC. В src те же модели имеют 620–700+ ситуаций. Коэффициент охвата: ~1.4%.

2. **Images не задеплоены:** У всех 6 брендов в src присутствуют тысячи изображений из мануалов — ни одно не попало в деплой.

3. **Manual/parts/reviews отсутствуют в деплое:** В deployed-структуре нет файлов мануалов, каталогов запчастей и обзоров — только dtc.json + situations.json + meta.json + videos.json.

4. **Охват моделей крайне низкий:** Toyota 15% (9/59), UAZ 17% (1/6), VW 11% (5/47), Volvo 24% (4/17), Voyah 10% (1/10), Zeekr 44% (4/9).

---

## Рекомендации

| Приоритет | Действие |
|-----------|----------|
| P0 | Расширить situations с 10 до полного набора из src (620–700 на модель) для всех задеплоенных поколений |
| P1 | Добавить недостающие модели: Zeekr (7gt, 7x, 9x, mix), Voyah (dream, dreamer, passion, taishan), UAZ (bukhanka, hunter, profi) — высокий спрос |
| P1 | VW: добавить id4/id5/id6, jetta, tiguan_2, touareg_2, polo_sedan — популярные в РФ |
| P2 | Toyota: добавить prius, hilux, crown, vitz, mark_2, fortuner — широкая аудитория |
| P2 | Volvo: добавить xc70, s90, v60, v90 — недорого по трудозатратам (контент готов) |
| P3 | Проработать деплой images из src (по приоритету: camry, corolla, polo, tiguan) |
| P3 | Добавить manual/parts как отдельные эндпоинты или файлы в generation-folder |
