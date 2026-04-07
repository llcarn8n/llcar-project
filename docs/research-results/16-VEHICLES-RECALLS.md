# 16. Анализ баз: автомобили РФ + отзывные кампании

**Дата:** 2026-04-07
**Файлы:**
- `common files all models/vehicles-ru.json` (7.7 MB, 208 628 строк)
- `common files all models/recalls-database.json` (398 KB, 6 271 строка)

---

## ЧАСТЬ 1: vehicles-ru.json

### 1.1 Общая информация

| Параметр | Значение |
|----------|----------|
| Версия | 3.3.1 |
| Обновлено | 2026-03-17 |
| Марок | 58 |
| Моделей | 461 |
| Поколений | 966 |
| Модификаций (trims) | 7 436 |
| Описание | "Автомобили на дорогах России: марки, модели, поколения с ТТХ" |

### 1.2 Иерархия данных

```
brands[] (58 шт)
  ├── id, name, name_ru, country, drom_slug
  └── models[] (461 шт суммарно)
        ├── id, name, body_type, status, powertrain
        └── generations[] (966 шт суммарно)
              ├── id, name, ys (год начала), ye (год конца), body_type
              ├── dimensions {}
              ├── engines_summary[], transmissions_summary[], drivetrains_summary[]
              ├── original_name
              └── trims[] (7 436 шт суммарно)
                    ├── name (напр. "1.6L 5MT (87 HP)")
                    ├── engine {}
                    ├── transmission {}
                    ├── drivetrain
                    └── performance {}
```

### 1.3 Полный список полей

#### Generation.dimensions
| Поле | Описание |
|------|----------|
| length_mm | Длина, мм |
| width_mm | Ширина, мм |
| height_mm | Высота, мм |
| wheelbase_mm | Колесная база, мм |
| ground_clearance_mm | Клиренс, мм |
| trunk_volume_l | Объем багажника, л |
| trunk_volume_max_l | Макс. объем багажника, л |
| fuel_tank_l | Объем бака, л |
| curb_weight_kg | Снаряженная масса, кг |
| gross_weight_kg | Полная масса, кг |
| doors | Кол-во дверей |
| seats | Кол-во мест |

#### Trim.engine
| Поле | Описание | Заполненность |
|------|----------|---------------|
| type | Тип (petrol/diesel/electric и т.д.) | всегда |
| displacement_cc | Объем двигателя, куб.см | всегда для ДВС |
| cylinders | Кол-во цилиндров | почти всегда для ДВС |
| power_hp | Мощность, л.с. | всегда |
| power_kw | Мощность, кВт | часто |
| torque_nm | Крутящий момент, Нм | всегда |
| fuel_type | Тип топлива | всегда |
| aspiration | Тип наддува / впрыска | ~60% (очень разнородные значения) |
| code | Код двигателя (напр. ZMZ-409051) | 229 trims (~3%) |
| battery_kwh | Емкость батареи, кВт*ч | только для BEV/PHEV |
| cylinder_layout | Расположение цилиндров | редко |
| valves_per_cylinder | Клапанов на цилиндр | редко |
| power_rpm | Обороты макс. мощности | редко |
| torque_rpm | Обороты макс. момента | редко |
| fuel_system | Система подачи топлива | редко |
| emission_standard | Экологический класс | редко (только "Euro 5") |

#### Trim.transmission
| Поле | Описание |
|------|----------|
| type | Тип КПП |
| gears | Кол-во передач |

#### Trim.performance
| Поле | Описание | Заполненность |
|------|----------|---------------|
| power_hp | Мощность (дублирует engine) | всегда |
| top_speed_kmh | Макс. скорость, км/ч | часто |
| acceleration_0_100_s | Разгон 0-100, с | часто |
| fuel_consumption_combined_l100km | Расход смешанный, л/100км | 5 739 из 7 436 (77%) |
| fuel_consumption_city_l100km | Расход город | реже |
| fuel_consumption_highway_l100km | Расход трасса | реже |
| fuel_consumption_standard | Стандарт измерения | редко |
| co2_emissions_gkm | Выбросы CO2, г/км | 1 257 trims (17%) |
| range_km | Запас хода (для BEV) | только BEV |
| range_km_ev | Запас хода в электрорежиме (PHEV) | только PHEV |
| range_km_erev | Общий запас хода (EREV) | только EREV |

### 1.4 Типы топлива / силовых установок

**Тип силовой установки (powertrain):**
- `ice` — ДВС (бензин/дизель/газ)
- `bev` — полностью электрический
- `phev` — подключаемый гибрид
- `hev` — обычный гибрид
- `erev` — гибрид с расширенным запасом

**Всего EV/PHEV/HEV/EREV моделей: 57** (из 461)

**Типы топлива (fuel_type):**
- petrol, diesel, electric, electric+petrol
- hybrid_petrol, hybrid_diesel, mild_hybrid_petrol, mild_hybrid_diesel
- phev, cng, lpg, flex_fuel

**Типы КПП (transmission.type):**
- manual, automatic, amt, cvt, dct
- single_speed / single-speed (для BEV)
- e_cvt, dht (для гибридов)

**Типы привода (drivetrain):**
- fwd, rwd, awd, 4wd, AWD

**Типы кузова (body_type):**
- sedan, hatchback, suv, suv_coupe, wagon, minivan
- pickup, coupe, liftback, convertible, cabriolet, van, shooting_brake

### 1.5 Все 58 марок

#### Россия (3)
| Марка | Моделей |
|-------|---------|
| Lada | 7 |
| UAZ | 3 |
| BelGee (Беларусь) | 4 |

#### Китай (23)
| Марка | Моделей | | Марка | Моделей |
|-------|---------|---|-------|---------|
| BYD | 10 | | Changan | 9 |
| Haval | 9 | | Geely | 8 |
| Exeed | 8 | | Zeekr | 8 |
| Jetour | 8 | | Li Auto | 8 |
| GAC | 7 | | Forthing | 7 |
| Omoda | 6 | | Kaiyi | 6 |
| Voyah | 6 | | BAIC | 5 |
| Chery | 5 | | Livan | 5 |
| Jaecoo | 4 | | Hongqi | 4 |
| Tank | 4 | | JAC | 4 |
| Bestune | 2 | | | |

#### Япония (9)
| Марка | Моделей |
|-------|---------|
| Toyota | 28 |
| Nissan | 13 |
| Honda | 10 |
| Mazda | 9 |
| Lexus | 9 |
| Infiniti | 7 |
| Mitsubishi | 6 |
| Subaru | 5 |
| Suzuki | 5 |
| Datsun | 2 |

#### Корея (5)
| Марка | Моделей |
|-------|---------|
| Kia | 13 |
| Hyundai | 9 |
| SsangYong | 6 |
| Genesis | 5 |
| Daewoo | 4 |

#### Германия (6)
| Марка | Моделей |
|-------|---------|
| Volkswagen | 21 |
| Mercedes-Benz | 20 |
| BMW | 18 |
| Audi | 14 |
| Opel | 10 |
| Porsche | 7 |

#### Другие Европа (7)
| Марка | Моделей |
|-------|---------|
| Ford | 12 |
| Chevrolet | 12 |
| Skoda | 11 |
| Renault | 10 |
| Volvo | 8 |
| Peugeot | 7 |
| Land Rover | 6 |
| Citroen | 5 |
| Jaguar | 5 |
| Cadillac | 5 |
| Jeep | 4 |
| Mini | 4 |
| Fiat | 4 |

### 1.6 Примеры 5 разных марок (сокращенно)

#### Lada Granta II (2018-н.в.)
- Седан/хэтчбек, ДВС бензин 1.6L
- 87-106 л.с., 140-148 Нм
- КПП: MT5 / AT4 / AMT5 / CVT
- Привод: FWD
- Расход: 6.2-7.2 л/100км

#### Toyota 4Runner I (1990-1995)
- SUV, бензин 3.0L / дизель 2.4L
- 90-145 л.с.
- КПП: MT5 / AT4
- Привод: AWD

#### BMW 1 Series I (2004-2007)
- Хэтчбек, бензин 1.5L / дизель 2.0L
- 163-170 л.с.
- КПП: AMT7
- Привод: RWD

#### Haval F7 (2022-2024)
- Купе-кроссовер, бензин 1.5-2.0L турбо
- 150-192 л.с.
- КПП: DCT7
- Привод: FWD / AWD

#### Hyundai Creta I (2020-2024)
- SUV, бензин 1.6-2.0L
- 123-149 л.с.
- КПП: CVT / AT6
- Привод: FWD / AWD

### 1.7 Чего НЕТ в базе

| Поле | Статус |
|------|--------|
| ECU адреса (OBD-II PIDs) | **НЕТ** |
| Нормативы параметров (эталонные обороты, давление и т.д.) | **НЕТ** |
| Типичные проблемы/болячки модели | **НЕТ** |
| VIN-паттерны | **НЕТ** |
| Коды ошибок OBD | **НЕТ** |
| Фото/изображения | **НЕТ** |
| Цены | **НЕТ** |
| Рейтинги надежности | **НЕТ** |

Поле `aspiration` заполнено хаотично: от "naturally_aspirated" до полных описаний типа "bmw edrive technology: hybrid synchronous motor with integrated power electronics..." — нуждается в нормализации.

### 1.8 Применение для LLCAR Health Score

#### Что можно использовать прямо сейчас:
1. **Идентификация автомобиля** — по марке/модели/году определить поколение и модификацию
2. **Эталонная мощность** — `engine.power_hp` и `engine.torque_nm` для сравнения с OBD-данными
3. **Эталонный расход** — `performance.fuel_consumption_combined_l100km` для трекинга отклонений
4. **Масса и габариты** — `dimensions.curb_weight_kg` для нормализации показаний акселерометра
5. **Объем бака** — `dimensions.fuel_tank_l` для расчета оставшегося пробега
6. **Тип силовой установки** — `powertrain` определяет какие сенсоры доступны
7. **Тип КПП** — определяет паттерны переключения передач
8. **Запас хода BEV** — `performance.range_km` для электромобилей

#### Что нужно дособирать:
1. **ECU адреса** — маппинг OBD-II PID -> ECU для каждой модели
2. **Нормативные значения** — idle RPM, нормальное давление масла, температура ОЖ
3. **Известные проблемы** — болячки по модели/поколению (можно обогатить из recalls-database)
4. **VIN-декодер** — для автоматической идентификации авто

#### Архитектура интеграции:
```
User вводит марку/модель/год
  → Поиск в vehicles-ru.json по brand.id + model.id + generation.ys/ye
  → Определение модификации по мощности/КПП/приводу
  → Загрузка эталонных параметров:
      - power_hp/torque_nm → для сравнения с OBD power
      - fuel_consumption → для Health Score расхода
      - curb_weight_kg → для нормализации вибраций
      - ground_clearance_mm → для определения типа подвески
  → Поиск отзывных кампаний в recalls-database.json
  → Отображение в дашборде:
      - Карточка "Ваш автомобиль" с ТТХ
      - Health Score с учетом эталонов
      - Блок "Известные проблемы модели"
```

---

## ЧАСТЬ 2: recalls-database.json

### 2.1 Общая информация

| Параметр | Значение |
|----------|----------|
| Версия | 1.0.0 |
| Обновлено | 2026-03-20 |
| Источник | gazbuka.ru / Росстандарт / NHTSA / OEM service campaigns |
| Всего кампаний | 298 |
| Марок в справочнике | 91 |
| Марок с кампаниями | 46 |
| Всего затронутых автомобилей | 1 838 735 |
| Диапазон дат | 2016-2026 |
| Обновление | ежедневно через scrape_recalls.py |

### 2.2 Структура данных

```json
{
  "_meta": { ... },
  "brands": {
    "brand_key": {
      "name": "Brand Name",
      "slug": "brand-slug",
      "country": "Country"
    }
  },
  "campaigns": [
    {
      "id": "BRAND-ROS-NNN",
      "brand": "brand_key",
      "models": ["Model 1", "Model 2"],
      "date": "YYYY-MM-DD",
      "count": 12345,
      "title_ru": "Заголовок на русском",
      "title_en": "English title (если есть)",
      "description_ru": "Подробное описание проблемы и мер",
      "description_en": "English description (если есть)",
      "severity": "critical|high|medium|low",
      "system": "fuel|electrical|steering|...",
      "years": "2013" или "2014-2019",
      "source": "rosstandart",
      "source_url": "https://...",
      "type": "recall|service"
    }
  ]
}
```

### 2.3 Поля кампании

| Поле | Описание |
|------|----------|
| id | Уникальный ID формата BRAND-ROS-NNN |
| brand | Ключ марки (совпадает с brands) |
| models | Массив затронутых моделей (строки, не ID) |
| date | Дата публикации кампании |
| count | Кол-во затронутых автомобилей (0 = неизвестно) |
| title_ru | Краткое описание проблемы (рус) |
| title_en | Краткое описание (англ, не всегда заполнено) |
| description_ru | Полное описание (рус) |
| description_en | Полное описание (англ, не всегда заполнено) |
| severity | Серьезность: critical / high / medium / low |
| system | Затронутая система автомобиля |
| years | Годы выпуска затронутых авто |
| source | Источник (rosstandart и др.) |
| source_url | URL источника |
| type | Тип: recall (отзыв) / service (сервисная кампания) |

**VIN-диапазоны: НЕТ.** Примечание в мета: "VIN-level check requires online query to gazbuka.ru API."

### 2.4 Статистика по маркам (топ-20)

| Марка | Кампаний | | Марка | Кампаний |
|-------|----------|---|-------|----------|
| Mercedes-Benz | 64 | | Skoda | 10 |
| Audi | 25 | | Citroen | 8 |
| Volkswagen | 17 | | Ford | 8 |
| BMW | 15 | | Lada | 8 |
| Jeep | 15 | | Nissan | 6 |
| Volvo | 13 | | Bentley | 6 |
| Porsche | 12 | | Mazda | 5 |
| Toyota | 11 | | Peugeot | 5 |
| | | | Subaru | 4 |
| | | | Hyundai | 4 |

### 2.5 По серьезности

| Severity | Кампаний | Доля |
|----------|----------|------|
| critical | 114 | 38% |
| high | 70 | 23% |
| medium | 60 | 20% |
| low | 54 | 18% |

### 2.6 По системам автомобиля

| Система | Кампаний | Описание |
|---------|----------|----------|
| electrical | 53 | Электрика, проводка |
| fuel | 40 | Топливная система |
| steering | 34 | Рулевое управление |
| safety | 29 | Общая безопасность |
| body | 29 | Кузов |
| brakes | 22 | Тормозная система |
| airbag | 19 | Подушки безопасности |
| software | 18 | Программное обеспечение |
| suspension | 15 | Подвеска |
| interior | 13 | Салон |
| engine | 12 | Двигатель |
| transmission | 7 | Трансмиссия |
| lighting | 4 | Освещение |
| cooling | 2 | Система охлаждения |
| battery | 1 | Батарея (HV) |

### 2.7 По типу

| Тип | Кампаний |
|-----|----------|
| recall (отзыв Росстандарт) | 292 |
| service (сервисная OEM) | 6 |

### 2.8 Все 46 марок с кампаниями

audi, bentley, bmw, byd, cadillac, chery, chevrolet, chrysler, citroen, datsun, dodge, exeed, faw, fiat, ford, gac, geely, haval, honda, hyundai, infiniti, isuzu, jaguar, jeep, kia, lada, lamborghini, lexus, mazda, mercedes, mitsubishi, nissan, omoda, opel, peugeot, porsche, renault, seat, skoda, subaru, suzuki, tank, toyota, uaz, volkswagen, volvo

### 2.9 Примеры кампаний

**CRITICAL — Toyota (82 405 авто):**
> Проблема нагревателя омывателя лобового стекла. Lexus LX570, Toyota LC200, 2013+. Трещина нагревателя форсунки — КЗ.

**SOFTWARE — BMW 7 серии:**
> Проблема с программным обеспечением. Обновление ПО блока управления.

**LADA (все 8 кампаний):**
1. XRAY — рулевое управление (critical, 9 311 авто)
2. XRAY + Vesta — топливная система (high, 90 124 авто)
3. Vesta — кузов, крепление задней полки (low)
4. XRAY — салон, крепление обшивки (low)
5. Vesta + XRAY + Largus — тормоза (critical)
6. XRAY — рулевое управление, гидроусилитель (critical)
7. Largus — тормозная система (critical)
8. Kalina + Granta — утечка топлива (high)

**Kia Sportage (79 884 авто):**
> Дефект multi-guard гидравлического блока ABS ECU (2010-2015). Может привести к потере тормозного усилия.

---

## ЧАСТЬ 3: Интеграция в дашборд LLCAR

### 3.1 Блок "Болячки модели" — дизайн

```
┌─────────────────────────────────────────────────────┐
│  ⚠ Известные проблемы: Lada Vesta 2018-2024        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 CRITICAL  Тормозная система                     │
│     Возможна потеря эффективности торможения         │
│     Модели: Vesta, XRAY, Largus                     │
│     Дата: 2021 │ Источник: Росстандарт              │
│                                                     │
│  🟠 HIGH  Топливная система                         │
│     Разрушение топливной трубки (90 124 авто)        │
│     Модели: XRAY, Vesta                             │
│     Дата: 2020 │ Источник: Росстандарт              │
│                                                     │
│  🟡 LOW  Кузов                                      │
│     Крепление задней полки багажника                 │
│     Дата: 2019                                      │
│                                                     │
│  ℹ Проверить VIN → gazbuka.ru/vin-check             │
└─────────────────────────────────────────────────────┘
```

### 3.2 Алгоритм матчинга

```javascript
function findRecalls(brand, model, year) {
  return recalls.campaigns.filter(c => {
    // 1. Совпадение марки
    if (c.brand !== brand) return false;
    
    // 2. Совпадение модели (fuzzy match по models[])
    const modelMatch = c.models.some(m => 
      m.toLowerCase().includes(model.toLowerCase())
    );
    if (!modelMatch) return false;
    
    // 3. Совпадение года (если указан)
    if (c.years) {
      const [yStart, yEnd] = c.years.split('-').map(Number);
      if (year < yStart || year > (yEnd || yStart)) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Сортировка: critical > high > medium > low
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}
```

### 3.3 Алгоритм Health Score с учетом vehicles-ru

```javascript
function calculateHealthScore(obd_data, vehicle_spec) {
  const scores = {};
  
  // 1. Мощность: сравнение реальной с эталонной
  if (obd_data.calculated_power_hp && vehicle_spec.engine.power_hp) {
    const ratio = obd_data.calculated_power_hp / vehicle_spec.engine.power_hp;
    scores.power = ratio >= 0.85 ? 100 : ratio * 100 / 0.85;
  }
  
  // 2. Расход: сравнение с эталонным
  if (obd_data.avg_fuel_l100km && vehicle_spec.performance.fuel_consumption_combined_l100km) {
    const ratio = vehicle_spec.performance.fuel_consumption_combined_l100km / obd_data.avg_fuel_l100km;
    scores.fuel = Math.min(100, ratio * 100);
  }
  
  // 3. Вибрации: нормализация по массе
  if (obd_data.vibration_rms && vehicle_spec.dimensions.curb_weight_kg) {
    // Тяжелые авто естественно менее вибрируют
    const weight_factor = vehicle_spec.dimensions.curb_weight_kg / 1500;
    scores.vibration = calculateVibrationScore(obd_data.vibration_rms, weight_factor);
  }
  
  // 4. Штраф за отзывные кампании
  const recalls = findRecalls(brand, model, year);
  const critical_recalls = recalls.filter(r => r.severity === 'critical');
  if (critical_recalls.length > 0) {
    scores.recall_penalty = -5 * critical_recalls.length;
  }
  
  return weightedAverage(scores);
}
```

### 3.4 Стратегия обогащения данных

**Приоритет 1 (автоматизируемо):**
- Нормализация поля `aspiration` — привести к enum: NA, turbo, twin-turbo, supercharged, electric
- Нормализация `drivetrain` — привести AWD/4wd/awd к единому формату
- Добавить fuel_consumption_city/highway где есть только combined

**Приоритет 2 (требует сбора):**
- ECU-адреса и OBD-II PID маппинг по модели (из OBD databases)
- Нормативные значения idle RPM, рабочая температура ОЖ, давление масла
- Типичные болячки из форумов (drom.ru, drive2.ru)

**Приоритет 3 (API-интеграции):**
- gazbuka.ru API для VIN-проверки отзывных
- ГИБДД API для истории ДТП/штрафов
- Drom.ru API для рыночной стоимости

---

## ЧАСТЬ 4: Ключевые выводы

### Сильные стороны баз

1. **Широкий охват** — 58 марок, 461 модель покрывают >95% авто на дорогах РФ
2. **Детальные ТТХ** — мощность, момент, расход, габариты, масса для 7 436 модификаций
3. **Актуальность** — обновлено март 2026, включает новейшие китайские марки
4. **Отзывные кампании** — 298 кампаний Росстандарт с severity и описаниями
5. **Электромобили** — 57 моделей BEV/PHEV/HEV/EREV с battery_kwh и range_km

### Слабые стороны / что нужно дособрать

1. **Нет ECU-данных** — критично для OBD-интеграции
2. **Нет нормативных значений** — idle RPM, давление масла, температура ОЖ
3. **Нет болячек по модели** — только отзывные кампании, но не "народные" проблемы
4. **Хаотичное поле aspiration** — 50+ вариантов написания, нужна нормализация
5. **Не все марки в recalls** — 46 из 58 марок из vehicles-ru
6. **Нет VIN-диапазонов** в recalls — нужен онлайн-запрос к gazbuka.ru
7. **Расход город/трасса** — заполнен реже чем combined

### Рекомендация для LLCAR

**Немедленно можно реализовать:**
- Экран "Профиль автомобиля" — выбор марки/модели/года/модификации
- Health Score с нормализацией по эталонным power_hp и fuel_consumption
- Блок "Отзывные кампании" с фильтрацией по модели
- Предупреждения о критических отзывных

**Нужно дособрать для полноценной работы:**
- Маппинг OBD PID -> нормативные значения по модели
- Типичные проблемы из drive2.ru/drom.ru
- VIN-декодер для автоматической идентификации
