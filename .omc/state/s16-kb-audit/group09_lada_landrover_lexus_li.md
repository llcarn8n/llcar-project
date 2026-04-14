# KB Audit — Group 09: LADA / Land Rover / Lexus / Li Auto

**Дата:** 2026-04-15
**Источник:** D:/transfer4/knowledge-base/brands/{lada,land_rover,lexus,li}
**Назначение:** llcar-dashboard/public/data/kb/{lada,land_rover,lexus,li_auto}

---

## 1. LADA

### Transfer4 (источник)
| Модель | manual | dtc | parts | situations | reviews | video | images |
|--------|--------|-----|-------|-----------|---------|-------|--------|
| granta | + | + | + | 473 | + | + | + |
| vesta | + | + | + | 496 | + | + | + |
| largus | + | + | + | 444 | + | + | + |
| niva | + | + | + | 435 | + | + | — |
| xray | + | + | + | 495 | + | + | + |
| kalina | + | + | + | 441 | + | + | + |
| kalina_hatchback | — | + | + | 433 | — | + | + |
| priora | + | + | + | 436 | + | + | + |
| niva_legend | + | + | — | 433 | — | — | — |
| niva_travel | + | + | + | 440 | + | + | — |

Brand images: 3608

### llcar-dashboard (задеплоено)
| Модель | Поколение | situations | dtc |
|--------|-----------|-----------|-----|
| granta | 2190_2018 | 10 | 51 |
| vesta | gfl_2015 | 10 | 21 |
| largus | r90_2012 | 10 | 16 |
| niva | 2121_1977 | 10 | 16 |
| xray | b2_2015 | 10 | 20 |

### Упущения LADA
- **Модели не задеплоены:** kalina, kalina_hatchback, priora, niva_legend, niva_travel (5 из 10)
- **Situations:** задеплоено по 10 vs 433–496 в источнике (недобор ~98%)
- **Нет reviews/videos/images** в llcar (файлы есть только meta/dtc/situations/videos.json-заглушки)
- **Нет parts** в llcar (parts-catalog.json не задеплоен)

---

## 2. Land Rover

### Transfer4 (источник)
| Модель | manual | dtc | parts | situations | reviews | video | images |
|--------|--------|-----|-------|-----------|---------|-------|--------|
| defender | — | + | + | 447 | + | + | — |
| discovery | + | + | + | 470 | + | + | + |
| discovery_iii | + | + | + | 444 | — | + | + |
| discovery_sport | — | + | + | 444 | — | + | — |
| evoque | — | + | — | 444 | — | + | — |
| freelander | + | + | + | 463 | + | + | + |
| range_rover | + | + | + | 448 | + | + | — |
| range_rover_evoque | + | + | + | 575 | — | + | + |
| range_rover_sport | — | + | + | 449 | + | + | + |
| rr_sport | + | + | — | 444 | — | — | — |

Brand images: 2780

### llcar-dashboard (задеплоено)
| Модель | Поколение | situations | dtc |
|--------|-----------|-----------|-----|
| discovery_sport | l550_2014 | 10 | 26 |
| range_rover_sport | l494_2013 | 10 | 35 |

### Упущения Land Rover
- **Модели не задеплоены:** defender, discovery, discovery_iii, evoque, freelander, range_rover, range_rover_evoque, rr_sport (8 из 10)
- **Situations:** 10 vs 444–575 в источнике
- **Нет manual/reviews/images** в llcar

---

## 3. Lexus

### Transfer4 (источник)
Всего 21 модель/псевдоним. Ключевые:

| Модель | manual | dtc | parts | situations | reviews | video | images |
|--------|--------|-----|-------|-----------|---------|-------|--------|
| es | + | + | + | 442 | — | + | — |
| es250 | — | + | + | 444 | + | + | — |
| es350 | — | + | + | 442 | + | — | — |
| gx / gx460 | + | + | + | 440–442 | + | + | + |
| is / is250 / is300 | + | + | + | 439 | + | + | + |
| lc | + | + | + | 439 | — | + | — |
| ls | — | + | + | 439 | — | + | — |
| lx / lx470 / lx570 | + | + | + | 459 | + | + | + |
| nx / nx200 / nx300 | + | + | + | 440 | + | + | — |
| rx / rx300 / rx350 / rx450h | + | + | + | 442–446 | + | + | + |
| ux | + | + | + | 439 | — | + | — |

Brand images: 15

### llcar-dashboard (задеплоено)
| Модель | Поколение | situations | dtc |
|--------|-----------|-----------|-----|
| es | xv60_2012 | 10 | 16 |
| es | xv70_2018 | 10 | 20 |
| lx | j200_2007 | 10 | 29 |
| lx | j300_2021 | 10 | 22 |
| nx | az10_2014 | 10 | 17 |
| rx | al20_2015 | 10 | 31 |

### Упущения Lexus
- **Модели не задеплоены:** gx, is, lc, ls, ux + все псевдонимы (es250/es350, gx460, is250/is300, lx470/lx570, nx200/nx300, rx300/rx350/rx450h)
- **Только 4 модели** из 15+ реальных задеплоены
- **Situations:** 10 vs 439–459 в источнике
- **Brand images критично мало:** в transfer4 всего 15 изображений (vs 2780 у Land Rover)

---

## 4. Li Auto (Li)

### Transfer4 (источник)
| Модель | manual | dtc | parts | situations | reviews | video | images |
|--------|--------|-----|-------|-----------|---------|-------|--------|
| l7 | + | — | + | — | + | + | + |
| l8 | + | — | + | — | + | + | + |
| l9 | + | — | + | — | + | + | + |
| li_i6 | — | + | + | 440 | — | + | + |
| li_i8 | — | + | + | 440 | — | + | + |
| li_l6 | — | + | + | 451 | + | + | + |
| li_mega | — | + | + | 451 | + | + | + |
| li_one | — | + | + | 441 | — | + | + |

Brand images: 386 (в originals_zh/)

### llcar-dashboard (задеплоено)
**Бренд ОТСУТСТВУЕТ полностью.** Папки `li` или `li_auto` нет в llcar-dashboard/public/data/kb/.

### Упущения Li Auto
- **Бренд не задеплоен вообще** — ни одной модели
- 8 моделей с situations (440–451), dtc, parts, reviews, video, images готовы к деплою
- Для l7/l8/l9 отсутствуют dtc и situations в источнике (только manual+parts)

---

## Сводная таблица

| Бренд | Моделей в t4 | Задеплоено | Situations t4 | Situations llcar | Images t4 | Статус |
|-------|-------------|-----------|--------------|-----------------|-----------|--------|
| LADA | 10 | 5 | 433–496 | 10 (×5 ген) | 3608 | Частичный |
| Land Rover | 10 | 2 | 444–575 | 10 (×2 ген) | 2780 | Критичный недодеплой |
| Lexus | 21 | 4 | 439–459 | 10 (×6 ген) | 15 | Критичный недодеплой |
| Li Auto | 8 | 0 | 440–451 | — | 386 | Не задеплоен |

---

## Рекомендации (приоритет)

1. **Li Auto** — добавить бренд с нуля: 5 моделей с полным набором (li_l6, li_mega, li_l7→l7, li_i6, li_i8). Папка: `kb/li_auto/` или `kb/li/`.
2. **Land Rover** — задеплоить defender, discovery, freelander, range_rover (наиболее популярные + есть manual+reviews).
3. **LADA** — задеплоить kalina, priora, niva_travel; situations увеличить с 10 до 30–50 на поколение.
4. **Lexus** — задеплоить gx460, is250, rx300/rx350; пополнить brand images (в t4 только 15 файлов — нужен отдельный scrape).
5. **Все бренды** — situations в llcar (10 шт.) кратно ниже источника (440+); приоритет — массовый импорт situations из t4.
