# KB Audit — Group 08: Jeep, Jetour, Kaiyi, Kia
Date: 2026-04-15

---

## JEEP

### Source (D:/transfer4)
| Метрика | Значение |
|---|---|
| Модели | cherokee, compass, grand_cherokee, renegade, tj_wrangler_1998, wrangler (6) |
| Situations | 2 243 |
| DTC коды | 1 875 |
| Manual .md | 20 |
| Reviews | 3 |
| Parts-catalog | 5 |
| Images | 753 |

### KB (llcar-dashboard)
| Метрика | Значение |
|---|---|
| Модели | compass, grand_cherokee, wrangler (3) |
| Поколения | mp_2017, wk2_2010, wl_2021, jl_2018 (4) |
| Situations | 35 |
| DTC в dtc.json | 0 (файлы есть, но пустые) |

### Упущения
- **Отсутствуют модели**: cherokee, renegade, tj_wrangler_1998 — 3 из 6 не импортированы
- **Situations**: 35 из 2 243 (1.6%) — критически мало
- **DTC**: 1 875 кодов в source, в KB нули
- **Нет manual, reviews, parts, images** в KB-структуре

### Рекомендация
Приоритет HIGH. Импортировать 3 пропущенные модели, наполнить situations (~2200 записей) и DTC (1875 кодов).

---

## JETOUR

### Source (D:/transfer4)
| Метрика | Значение |
|---|---|
| Модели | dashing, t1, t2, vt9, x50, x70, x70_2018, x90 (8) |
| Situations | 3 558 |
| DTC коды | 920 |
| Manual .md | 27 |
| Reviews | 5 |
| Parts-catalog | 8 |
| Images | 0 |

### KB (llcar-dashboard)
| Метрика | Значение |
|---|---|
| Модели | dashing, x70 (2) |
| Поколения | dashing_gen1_2022, x70_gen1_2018 (2) |
| Situations | 20 |
| DTC в dtc.json | 0 |

### Упущения
- **Отсутствуют модели**: t1, t2, vt9, x50, x70_2018, x90 — 6 из 8 не импортированы
- **Situations**: 20 из 3 558 (0.6%) — критически мало
- **DTC**: 920 кодов в source, в KB нули
- Нет images в source — ок

### Рекомендация
Приоритет HIGH. 6 моделей полностью отсутствуют, coverage situations <1%.

---

## KAIYI

### Source (D:/transfer4)
| Метрика | Значение |
|---|---|
| Модели | e5, showjet, x3, x7 (4) |
| Situations | 2 634 |
| DTC коды | 690 |
| Manual .md | 9 |
| Reviews | 2 |
| Parts-catalog | 6 |
| Images | 170 |
| Доп. модели (underscore) | _x3_pro, _x7_kunlun |

### KB (llcar-dashboard)
**ОТСУТСТВУЕТ** — бренд не импортирован вообще.

### Упущения
- Весь бренд (4 модели + 2 алиас-модели) отсутствует в KB
- 2 634 situations, 690 DTC кодов, 9 manual файлов — всё не загружено

### Рекомендация
Приоритет HIGH. Требуется первичный импорт всего бренда: 4 основные модели + _x3_pro, _x7_kunlun.

---

## KIA

### Source (D:/transfer4)
| Метрика | Значение |
|---|---|
| Модели | 25 (incl. дубли/алиасы: 2019_kia_niro, all, ev9_my24, optima_k5, rio_iii) |
| Уникальных реальных моделей | ~18 |
| Situations | 9 593 |
| DTC коды | 4 749 |
| Manual .md | 91 |
| Reviews | 6 |
| Parts-catalog | 21 |
| Images | 13 487 |

### KB (llcar-dashboard)
| Метрика | Значение |
|---|---|
| Модели | 15: carnival, ceed, cerato, ev6, ev9, k5, mohave, optima, rio, seltos, sorento, soul, sportage, stinger, telluride |
| Поколения | 24 |
| Situations | 237 |
| DTC в dtc.json | 0 (файлы есть) |

### Упущения
- **Отсутствуют в KB**: k8, magentis, niro, picanto, spectra, venga — 6 моделей
- **Situations**: 237 из 9 593 (2.5%) — очень мало
- **DTC**: 4 749 кодов в source, в KB нули
- telluride присутствует в KB но отсутствует в source как отдельная модель (возможно данные в sorento или _all)

### Рекомендация
Приоритет MEDIUM-HIGH. Kia — самый богатый бренд в source (9 593 ситуаций, 13 487 изображений). Наполнение situations даст наибольший прирост ценности. Добавить 6 отсутствующих моделей.

---

## Сводная таблица

| Бренд | Моделей src | Моделей KB | Situations src | Situations KB | DTC src | DTC KB | Статус |
|---|---|---|---|---|---|---|---|
| Jeep | 6 | 3 | 2 243 | 35 (1.6%) | 1 875 | 0 | PARTIAL |
| Jetour | 8 | 2 | 3 558 | 20 (0.6%) | 920 | 0 | PARTIAL |
| Kaiyi | 4 | 0 | 2 634 | 0 (0%) | 690 | 0 | ABSENT |
| Kia | ~18 | 15 | 9 593 | 237 (2.5%) | 4 749 | 0 | PARTIAL |

## Ключевые находки

1. **DTC = 0 во всех брендах** в KB — файлы dtc.json присутствуют, но пустые. Источник содержит 8 234 кодов суммарно.
2. **Kaiyi полностью отсутствует** — требует первичного импорта.
3. **Situations coverage < 3%** у всех брендов — основной дефицит.
4. **Jeep**: 3 из 6 моделей не импортированы (cherokee, renegade, tj_wrangler_1998).
5. **Jetour**: 6 из 8 моделей не импортированы (t1, t2, vt9, x50, x70_2018, x90).
6. **Kia telluride** присутствует в KB, но нет в source models — стоит проверить источник данных.
