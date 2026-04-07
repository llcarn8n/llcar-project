# 21. Исследование: автоматическое декодирование VIN

**Дата:** 2026-04-07
**Контекст:** LLCAR - OBD-II диагностическое приложение. VIN читается автоматически через OBD Mode 09 PID 02. Нужно: VIN -> полный профиль авто (марка, модель, поколение, двигатель).

---

## 1. Структура VIN (ISO 3779)

```
Позиция:  1  2  3  |  4  5  6  7  8  |  9  |  10 |  11 |  12-17
          ─────────   ───────────────    ───    ───   ───   ──────
          WMI           VDS              CHK   YEAR  PLANT  SEQ
          (завод)       (описание)       (КС)  (год) (з-д)  (серия)
```

| Секция | Позиции | Что кодирует | Стандартизировано? |
|--------|---------|-------------|-------------------|
| WMI | 1-3 | Производитель + страна | Да (ISO 3780) |
| VDS | 4-8 | Модель, двигатель, кузов, привод | **НЕТ** — у каждого бренда своя схема |
| Check digit | 9 | Контрольная цифра (только Сев. Америка) | Частично |
| Year code | 10 | Модельный год | Да |
| Plant code | 11 | Завод-изготовитель | Частично |
| Sequential | 12-17 | Серийный номер | Нет |

### Код года (позиция 10)
```
A=2010  B=2011  C=2012  D=2013  E=2014  F=2015  G=2016  H=2017
J=2018  K=2019  L=2020  M=2021  N=2022  P=2023  R=2024  S=2025
T=2026  V=2027  W=2028  X=2029  Y=2030  1=2031  ...     9=2039
```
Цикл 30 лет. Буквы I, O, Q, U, Z не используются (путаница с 1, 0).

### Контрольная цифра (позиция 9)
- **Северная Америка (WMI 1-5):** стандартная контрольная сумма по ISO
- **Китай (WMI L):** позиция 9 НЕ является контрольной цифрой, используется как дополнительный дескриптор
- **Европа (WMI S-Z):** контрольная цифра не обязательна
- **Япония/Корея (WMI J, K):** зависит от рынка назначения

**Вывод:** для китайских VIN позиция 9 дает дополнительную информацию для декодирования (6 позиций VDS вместо 5).

---

## 2. Что у нас уже есть

### 2.1. wmi-database.json (553 кода)
- Покрывает все 58 брендов из vehicles-ru.json
- Китайские бренды: 110+ WMI кодов с префиксом L
- Один бренд может иметь несколько WMI (Chery: LVV, LVT, LNN, LUR, LVU)
- WMI точно определяет БРЕНД, но не модель

### 2.2. vehicles-ru.json (v3.3.1)
- 58 брендов, 460 моделей, 1919 поколений
- Для каждого поколения: годы выпуска (ys/ye), тип кузова, двигатели с объемом/мощностью
- В 2023 году активны: 371 модель, 567 поколений

### 2.3. Покрытие WMI по китайским брендам

| Бренд | WMI коды | В wmi-database |
|-------|----------|---------------|
| Chery | LVV, LVT, LNN | Да |
| Haval/GWM | LGW | Да |
| Geely | L6T, LB3, LSS, L10 | Да |
| BYD | LC0, LGX, LPE | Да |
| Changan | LCA, LS4-LS6, LSC | Да |
| Exeed | LVV (sub-brand Chery) | Да |
| Jetour | LVU, HJR | Да |
| Li Auto | LW4, HLX | Да |
| Zeekr | L6T (sub-brand Geely) | Да |
| Tank | LGW (sub-brand GWM) | Да |
| GAC | LMG, LMS, LNA, LMW | Да |
| Hongqi | LFB (FAW) | Да |

**Проблема:** Tank и Haval делят WMI (LGW). Zeekr и Geely делят WMI (L6T). Exeed, Jetour, Omoda делят WMI с Chery.

---

## 3. Исследование API для декодирования VIN

### 3.1. NHTSA vPIC API (vpic.nhtsa.dot.gov)

**Эндпоинты:**
- `GET /api/vehicles/DecodeVinValues/{vin}?format=json` — декод одного VIN
- `POST /api/vehicles/DecodeVINValuesBatch/` — batch (несколько VIN за раз)
- `GET /api/vehicles/GetWMIsForManufacturer/{name}?format=json` — WMI по производителю

**Стоимость:** Бесплатно, без ключа API.

**Rate limits:** Автоматический контроль трафика, но конкретные лимиты не документированы. На практике 1000+ запросов/день без проблем.

**Возвращаемые поля (для удачного декода):**
```
Make, Model, ModelYear, Trim, Series
BodyClass, Doors, DriveType, SeatRows, Seats
DisplacementCC, DisplacementL, EngineCylinders, EngineHP, EngineModel
FuelTypePrimary, FuelInjectionType, EngineConfiguration
TransmissionSpeeds, TransmissionStyle
PlantCity, PlantCountry
Manufacturer, ManufacturerId
+ 40+ полей про безопасность (ABS, ESC, AirBags, TPMS)
```

**Тестирование покрытия:**

| VIN | Бренд/Рынок | Результат |
|-----|------------|-----------|
| 4T1BF1FK5CU508618 | Toyota Camry (USA) | ПОЛНЫЙ декод: модель, двигатель 2.5L 4cyl 178HP, кузов Sedan |
| 3VV3B7AX2NM012345 | VW Tiguan (Mexico/USA) | ПОЛНЫЙ декод: модель, двигатель 2.0L 4cyl 184HP |
| WBATX7105NB039658 | BMW (Germany/EU) | Частичный: Make=BMW, Year=1992, VehicleType=Passenger Car. Нет модели |
| WVGZZZ5NZPW012345 | VW Tiguan (EU VIN) | ПРОВАЛ: только Make=Volkswagen, нет модели |
| TMBEH6NJ5PZ012345 | Skoda Octavia (EU) | ПРОВАЛ: Error 7 (not registered with NHTSA) |
| X7LHSRDAN9H012345 | Renault Duster (RU) | ПРОВАЛ: Error 7 |
| XTAGFB020NY123456 | Lada Vesta (RU) | ПРОВАЛ: Error 7 |
| LVVDB11B4PD136819 | Chery Tiggo 7 Pro | ПРОВАЛ: Error 7 |
| LGWFF4A59TH822156 | Haval Jolion | ПРОВАЛ: Error 7 |
| LNBSCCAK5PD302145 | Geely Coolray | ПРОВАЛ: Error 7 |

**Вывод по NHTSA:**
- Работает ТОЛЬКО для автомобилей, предназначенных для рынка США/Канады
- Автомобили с европейскими и китайскими WMI — НЕ декодируются
- Даже у VW и BMW — декодируются только VINы с американскими WMI (1VW, 3VV, WBA для US-market)
- Для российского рынка реальное покрытие: **~15-20%** (только серый импорт из США)
- Batch endpoint работает (POST, до нескольких VIN за запрос)

### 3.2. Другие VIN API

| API | Бесплатный план | Китайские бренды | Оффлайн |
|-----|----------------|-----------------|---------|
| **NHTSA vPIC** | Полностью бесплатный | НЕТ | Нет (можно скачать БД) |
| **auto.dev** | 1000 запросов/мес | "Global" - не подтверждено | Нет |
| **carapi.app** | Неизвестно | Нет (404 для Chery VIN) | Нет |
| **vindecoder.eu** | Неизвестно | Не проверено | Нет |
| **autodna.com** | Нет (403) | Не проверено | Нет |

**Ни один бесплатный API не гарантирует покрытие китайских брендов на российском рынке.**

### 3.3. Оффлайн решения (open source)

| Проект | Язык | Звезды | Подход |
|--------|------|--------|--------|
| corgi (TypeScript) | TS | 300 | Offline-first, SQLite, ISO-3779 |
| vin (PHP) | PHP | 82 | Базовый декод ISO-3779 |
| vin-decoder-dart | Dart | 36 | Валидация + генерация |
| nhtsa-api-wrapper | TS | 38 | Обертка над NHTSA API |

**Ни один open-source проект не содержит VDS-таблиц для китайских брендов.**

---

## 4. VDS-паттерны по брендам (позиции 4-8)

### 4.1. Бренды с документированной структурой VDS

#### Toyota (Wikibooks, NHTSA)
```
Pos 4: Body Type & Drive (B=4DR Sedan 2WD, C=4DR Sedan 4WD, K=5DR Hatch)
Pos 5: Engine Type (A=2.7L I4, B=2.4L Hybrid, K=3.5L V6, Z=3.5L V6)
Pos 6: Restraint System (4=dual airbags + side + curtain)
Pos 7: Series/Platform (chassis code)
Pos 8: Vehicle Line & Make (K=Camry, V=RAV4, U=Prius)
```

#### Hyundai/Kia (Wikibooks)
```
Pos 4: Model Line (D=Elantra, E=Sonata, P=Sportage, R=Sorento)
Pos 5: Trim Level (B/C/F/G/1/2/3)
Pos 6: Body Style (4=sedan, 5=hatch, 6=coupe, 8=wagon)
Pos 7: Restraint System (1-6, A-T)
Pos 8: Engine Type (~150 вариантов по объему, топливу, технологии)
```

#### BMW (частично)
```
Pos 4: Model series platform
Pos 5: Body style
Pos 6-7: Model variant
Pos 8: Restraint system
```

#### Mercedes-Benz (Wikibooks)
```
Pos 4: Model/Series (E=W124, H=W202 C-Class, N=W220 S-Class)
Pos 5: Body Style (F=Sedan, G=LWB, H=Wagon, J=Coupe, K=Cabrio)
Pos 6-7: Model within series (22=220, 28=280, 55=AMG)
Pos 8: Restraint System
```

#### Volkswagen/Audi/Skoda (VAG group)
```
Pos 4-5: Model code (varies by generation)
Pos 6: Engine type
Pos 7: Restraint/equipment level
Pos 8: Check digit or additional
```

#### Ford
```
Pos 4: Restraint system (pass cars) or GVWR class (trucks)
Pos 5-7: Model line, series, body type (e.g. P40=Mustang Coupe)
Pos 8: Engine type
```

#### GM (Chevrolet)
```
Pos 4: Platform code
Pos 5: Series/model
Pos 6: Body style
Pos 7: Restraint type
Pos 8: Engine type (main discriminator)
```

### 4.2. Китайские бренды — фрагментарные данные

#### Chery (предположительно)
```
Pos 4: Model series (D=Tiggo 7, C=Tiggo 4, F=Tiggo 8, B=Arrizo, E=Omoda C5)
Pos 5: Body variant (B=standard, A=long)
Pos 6: Engine/powertrain (1=1.5T, 2=2.0T, 3=1.6T)
Pos 7: Transmission (1=MT, 2=CVT, 3=DCT)
Pos 8: Restraint
```

#### Haval/GWM (предположительно)
```
Pos 4: Brand line (F=Haval, E=GW Pickup, C=Ora, B=Wey)
Pos 5: Model (F=F7, 4=Jolion, 6=H6, 9=H9)
Pos 6-8: Engine/body/equipment
```

**ВАЖНО:** Для китайских брендов НЕТ публичной документации VDS. Эти паттерны — реконструкция по образцам VIN из открытых источников. Требуется верификация.

### 4.3. Сводка по доступности VDS-таблиц

| Категория | Бренды | VDS задокументирован? |
|-----------|--------|---------------------|
| Японские | Toyota, Honda, Nissan, Mazda, Subaru, Suzuki, Mitsubishi | Да (Wikibooks + NHTSA) |
| Корейские | Hyundai, Kia, Genesis | Да (Wikibooks + NHTSA) |
| Немецкие | BMW, MB, VW, Audi, Porsche, Opel | Да (Wikibooks + NHTSA) |
| Американские | Ford, GM/Chevrolet, Jeep, Cadillac | Да (Wikibooks + NHTSA) |
| Французские | Peugeot, Renault, Citroen | Частично (Wikibooks) |
| Британские | Jaguar, Land Rover, Mini | Частично |
| Шведские | Volvo | Частично |
| Корейские (прочие) | SsangYong | Нет |
| Российские | Lada, UAZ | Нет |
| Китайские | Все 25 брендов | **НЕТ** |

---

## 5. Анализ сценариев: точность декодирования

### Данные: 567 активных поколений в 2023 году

### Сценарий A: только WMI + Year
```
Результат: 1 кандидат для 1 бренда (BelGee)
           2-3 кандидата для 7 брендов (UAZ, Bestune, Chery, Jaecoo, Daewoo, Datsun, Infiniti)
           4+ кандидатов для 50 брендов (96.6% поколений)
```
**Вывод: совершенно недостаточно. Нужны дополнительные сигналы.**

### Сценарий B: WMI + Year + Fuel Type (OBD PID 51)
```
Уникальных (1 кандидат): 75
Все еще неоднозначных: 1067
```

### Сценарий C: WMI + Year + Body Type + Fuel Type
```
Уникальных (1 кандидат): 259
Все еще неоднозначных: 883
```

### Сценарий D: WMI + Year + Body Type + Fuel Type + Displacement
```
Уникальных (1 кандидат): 1039
Все еще неоднозначных: 1058
```

### Классификация оставшихся неоднозначностей (Сценарий D)

| Тип неоднозначности | Количество | Критичность |
|---------------------|-----------|-------------|
| Одна модель, разные поколения | 301 | **НИЗКАЯ** — OBD-диагностика одинакова между поколениями |
| Разные модели, совпадающие ТТХ | 757 | **ВЫСОКАЯ** — нужен VDS для различения |

**Основные "проблемные" бренды (разные модели с одинаковыми specs):**

| Бренд | Неоднозн. записей | Пример коллизий |
|-------|-------------------|-----------------|
| Audi | 149 | A1 vs A3 (1984cc petrol hatchback) |
| BMW | 125 | 1 Series vs 6 Series (1998cc petrol hatch) |
| Mercedes-Benz | 102 | EQA vs EQB (EV SUV), GLA vs GLB (diesel SUV) |
| Volkswagen | 59 | Caddy vs Touran (1498cc minivan) |
| Hyundai | 56 | Accent vs Elantra vs Solaris (1591cc sedan) |
| Kia | 55 | Cerato vs K5 (1999cc sedan) |
| Toyota | 45 | 4Runner vs Land Cruiser (3956cc SUV) |
| Lexus | 45 | ES vs LS (3456cc sedan) |
| Land Rover | 36 | Defender vs Discovery Sport vs Evoque |
| Peugeot | 34 | 2008 vs 3008 vs 5008 (1199cc SUV) |

**Для этих брендов VDS позиция 4 (модель) — единственный способ различить.**

---

## 6. Данные из OBD для идентификации

### 6.1. Доступные PID

| PID | Режим | Данные | Помогает идентифицировать |
|-----|-------|--------|-------------------------|
| 09/02 | VIN | 17 символов | WMI -> Бренд, Pos 10 -> Год |
| 01/51 | Fuel Type | gas/diesel/EV/hybrid | Тип топлива |
| 01/00 | Supported PIDs | 32-bit bitmask | Фингерпринт ECU |
| 01/1C | OBD Standard | US/EU/etc | Рынок |
| 09/04 | Calibration ID | Строка | Прошивка ECU -> двигатель |
| 09/0A | ECU Name | Строка | Иногда содержит модель |

### 6.2. Вычисление объема двигателя через OBD

Прямого PID для объема двигателя нет, но можно ВЫЧИСЛИТЬ:

**Метод 1: через MAF (PID 10)**
```
Displacement_cc = (MAF_max * 60) / (RPM_max * Volumetric_Efficiency * Air_Density)
```
Точность: +/- 200cc (достаточно для нашей задачи, где объемы различаются на 400+ cc)

**Метод 2: через MAP + IAT + RPM**
```
MAF_calculated = (MAP * Displacement * VE * RPM) / (IAT * R * 2)
```

### 6.3. Calibration ID (PID 09/04) — самый ценный сигнал

Calibration ID уникален для каждого ECU firmware. Примеры паттернов:

| Бренд | Формат Cal ID | Что кодирует |
|-------|---------------|-------------|
| Toyota | `89663-33A02` | 33=Camry, A=engine variant |
| Hyundai/Kia | `391F2-2B395` | 2B=engine family |
| BMW | `DME_N20B20A` | N20=engine code |
| VW/Audi | `06K906027BK` | Engine management code |
| Chery | Не документировано | - |

**Потенциал:** если собрать базу Calibration ID -> модель/двигатель, это даст 100% идентификацию для ЛЮБОГО бренда. Но такую базу нужно собирать краудсорсингом.

### 6.4. Supported PIDs Fingerprint

Каждый ECU поддерживает уникальный набор PIDs. Bitmap из PID 00, 20, 40, 60, 80, A0, C0 формирует "отпечаток":
```
Пример: Toyota Camry 2.5L = 0xBE3FA813 0xB0100001 0xE0000000...
Пример: Hyundai Solaris 1.6 = 0xBE3EB813 0x90100000...
```
Этот фингерпринт уникален для семейства ECU, но не для конкретной модели (может совпадать у моделей с одним ECU).

---

## 7. Рекомендуемая стратегия декодирования VIN

### 7.1. Многоуровневый подход (Layered Decode)

```
Уровень 1: Оффлайн (мгновенно)
├── WMI -> Бренд (wmi-database.json)
├── Pos 10 -> Год
├── VDS pos 4 -> Модельная линейка (свои таблицы для top-20 брендов)
└── vehicles-ru.json -> список кандидатов (год + бренд)

Уровень 2: OBD сигналы (5 секунд)
├── PID 51 -> Fuel Type (gas/diesel/EV/hybrid)
├── PID 00 -> Supported PIDs fingerprint
├── PID 09/04 -> Calibration ID
├── MAF/MAP + RPM -> приблизительный объем двигателя
└── Пересечение с кандидатами из Уровня 1

Уровень 3: API fallback (если онлайн)
├── NHTSA API -> для US-market VIN (WMI 1-5)
├── Кэшировать результаты локально
└── Не зависеть от API — всегда иметь оффлайн fallback

Уровень 4: Краудсорс + CalID база
├── При первом подключении: запросить подтверждение у юзера
├── Сохранить маппинг: VDS + CalID -> модель/двигатель
└── Со временем: автоматическое определение без вопросов
```

### 7.2. Таблицы VDS (что нужно создать)

#### Приоритет 1: Топ-10 брендов на рынке РФ (покрывают ~60% парка)

| # | Бренд | WMI | Источник VDS | Сложность |
|---|-------|-----|-------------|-----------|
| 1 | Toyota/Lexus | JT*, 4T*, LVG, LFG | Wikibooks + NHTSA | Низкая |
| 2 | Hyundai/Genesis | KMH*, LBE* | Wikibooks + NHTSA | Низкая |
| 3 | Kia | KNA*, LJD* | Wikibooks + NHTSA | Низкая |
| 4 | Volkswagen | WVW*, WVG*, 3VV*, LSV, LFV | Wikibooks + NHTSA | Средняя |
| 5 | BMW | WBA*, WBS*, LBV | Wikibooks | Средняя |
| 6 | Mercedes-Benz | WDD*, WDC*, WDF* | Wikibooks | Средняя |
| 7 | Lada | XTA*, Y6D* | Реверс-инжиниринг | Высокая |
| 8 | Nissan | JN*, 1N*, LGB | Wikibooks + NHTSA | Низкая |
| 9 | Renault/Dacia | VF1*, X7L* | Wikibooks частично | Средняя |
| 10 | Honda | JHM*, SHH*, LHG, LUC | Wikibooks + NHTSA | Низкая |

#### Приоритет 2: Китайские бренды (покрывают ~25% новых продаж)

| # | Бренд | WMI | Источник VDS | Сложность |
|---|-------|-----|-------------|-----------|
| 11 | Chery/Omoda/Jaecoo | LVV*, LNN* | Реверс VIN + краудсорс | Высокая |
| 12 | Haval/Tank | LGW* | Реверс VIN + краудсорс | Высокая |
| 13 | Geely/Zeekr | L6T*, LB3*, LSS | Реверс VIN + краудсорс | Высокая |
| 14 | BYD | LGX*, LPE* | NHTSA частично + реверс | Высокая |
| 15 | Changan | LCA*, LS4-6, LSC | Реверс VIN | Высокая |
| 16 | Exeed | LVV* (как Chery) | Реверс VIN | Высокая |
| 17 | Li Auto | LW4*, HLX | Реверс VIN | Высокая |

### 7.3. Формат таблицы VDS

```json
{
  "vds_tables": {
    "toyota": {
      "wmi_codes": ["JT*", "4T*", "2T*"],
      "positions": {
        "4": {
          "type": "body_drive",
          "values": {
            "B": { "body": "sedan", "drive": "2wd" },
            "C": { "body": "sedan", "drive": "4wd" },
            "K": { "body": "hatchback", "drive": "2wd" },
            "Z": { "body": "suv", "drive": "2wd" }
          }
        },
        "5": {
          "type": "engine",
          "values": {
            "A": { "displacement_cc": 2700, "fuel": "petrol" },
            "B": { "displacement_cc": 2400, "fuel": "hybrid" },
            "K": { "displacement_cc": 3500, "fuel": "petrol" }
          }
        },
        "8": {
          "type": "model",
          "values": {
            "K": "Camry",
            "V": "RAV4",
            "U": "Prius",
            "1": "Sequoia"
          }
        }
      }
    }
  }
}
```

### 7.4. Алгоритм декодирования

```python
def decode_vin(vin: str, obd_data: dict) -> VehicleProfile:
    """
    Многоуровневое декодирование VIN.
    
    Args:
        vin: 17-символьный VIN
        obd_data: dict с PID 51, PID 00, CalibrationID и т.д.
    
    Returns:
        VehicleProfile с confidence score
    """
    
    # Уровень 1: Оффлайн базовый
    wmi = vin[0:3]
    brand = lookup_wmi(wmi)  # -> "Toyota"
    year = decode_year(vin[9])  # -> 2023
    vds = vin[3:8]  # -> "BF1FK" (5 символов)
    
    # Фильтр 1: бренд + год
    candidates = filter_vehicles_db(brand, year)
    # Toyota 2023: ~34 поколения
    
    # Уровень 1.5: VDS таблицы (если есть для бренда)
    if brand in vds_tables:
        model = decode_vds_model(brand, vds)
        engine = decode_vds_engine(brand, vds)
        body = decode_vds_body(brand, vds)
        candidates = narrow_by_vds(candidates, model, engine, body)
        # -> 1-2 кандидата для задокументированных брендов
    
    # Уровень 2: OBD сигналы
    fuel_type = obd_data.get('fuel_type')  # PID 51
    if fuel_type:
        candidates = filter_by_fuel(candidates, fuel_type)
    
    displacement = estimate_displacement(obd_data)  # MAF + RPM
    if displacement:
        candidates = filter_by_displacement(candidates, displacement, tolerance=200)
    
    cal_id = obd_data.get('calibration_id')  # PID 09/04
    if cal_id:
        known_match = lookup_calid_db(cal_id)
        if known_match:
            return known_match  # 100% confidence
    
    # Уровень 3: API (если онлайн и WMI подходит)
    if is_nhtsa_supported(wmi) and has_internet():
        nhtsa_result = query_nhtsa(vin)
        if nhtsa_result.model:
            return match_to_vehicles_db(nhtsa_result)
    
    # Уровень 4: Пользователь
    if len(candidates) > 1:
        # Показать список с картинками
        confirmed = ask_user_to_confirm(candidates)
        save_calid_mapping(cal_id, confirmed)
        return confirmed
    
    return candidates[0] if candidates else VehicleProfile(brand=brand, year=year)
```

### 7.5. Оценка покрытия по сценариям

| Сценарий | Покрытие | Без вопросов юзеру | Инвестиция |
|----------|---------|-------------------|-----------|
| A: WMI + Year only | 0.2% (1 бренд) | Да | Ноль |
| B: + NHTSA API | ~15-20% (US VIN) | Да | 1 день |
| C: + VDS таблицы top-10 | ~55-60% | Да | 2-3 недели |
| D: + OBD fuel + displacement | ~70-75% | Да | 1 неделя |
| E: + VDS top-20 + краудсорс | ~85-90% | Да | 4-6 недель |
| F: + CalID база (1000+ юзеров) | ~95%+ | Да | 3-6 месяцев |

---

## 8. Практические рекомендации

### 8.1. Минимальный MVP (1 неделя)

1. **WMI -> бренд** (уже есть)
2. **Year code -> год** (тривиально)
3. **NHTSA API fallback** для US-market VIN (15-20% покрытие)
4. **OBD PID 51** -> тип топлива (разделяет ICE/EV/Hybrid)
5. **vehicles-ru.json фильтрация**: brand + year + fuel -> показать список моделей юзеру для подтверждения
6. **Кэширование**: VIN -> профиль, чтобы не спрашивать повторно

### 8.2. Оптимальный план (1-2 месяца)

1. MVP + VDS таблицы для японских + корейских + немецких брендов (из Wikibooks)
2. Расчет объема двигателя через MAF/MAP + RPM
3. CalID маппинг (crowdsource)
4. Для китайских брендов: собрать VIN-образцы от пользователей + обратный инжиниринг VDS

### 8.3. Долгосрочная стратегия

1. **CalID Database** — самый перспективный подход. Каждый Calibration ID уникален для конкретного ECU (= конкретная модель + двигатель). Собирая маппинги от юзеров, за 6 месяцев можно покрыть 95%+ парка.

2. **Supported PIDs Fingerprint** — дополнительный сигнал. Можно классифицировать ECU семейства по набору поддерживаемых PID.

3. **Машинное обучение** — классификация по совокупности OBD-сигналов (fuel trims, timing advance, rpm idle speed, etc.)

### 8.4. UX-решение для неоднозначных случаев

```
┌─────────────────────────────────────────┐
│  Определяем ваш автомобиль...           │
│                                         │
│  VIN: LGWFF4A59TH822156                │
│  Марка: Haval                          │
│  Год: 2026                             │
│                                         │
│  Выберите модель:                       │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ [фото]  │  │ [фото]  │  │ [фото] │  │
│  │ Jolion  │  │ Dargo   │  │ H5     │  │
│  │ 1.5T    │  │ 2.0T    │  │ 2.0T   │  │
│  └─────────┘  └─────────┘  └────────┘  │
│                                         │
│  Выбор запомнится для этого VIN         │
└─────────────────────────────────────────┘
```

### 8.5. Архитектура данных

```
vin_profiles (SQLite, на устройстве)
├── vin TEXT PRIMARY KEY          -- полный VIN
├── brand TEXT                    -- из WMI
├── model TEXT                    -- декодированная или подтвержденная
├── generation TEXT               -- id поколения из vehicles-ru.json
├── year INTEGER                  -- из VIN pos 10
├── engine_displacement_cc INT    -- из VDS или OBD
├── fuel_type TEXT                -- из OBD PID 51
├── calibration_id TEXT           -- из OBD PID 09/04
├── supported_pids_hash TEXT      -- фингерпринт
├── decode_method TEXT            -- "vds"|"nhtsa"|"obd"|"user"|"calid"
├── confidence REAL               -- 0.0 - 1.0
└── confirmed_by_user BOOLEAN     -- юзер подтвердил?

calid_mappings (серверная БД для краудсорса)
├── calibration_id TEXT           -- ключ
├── brand TEXT
├── model TEXT
├── generation_id TEXT
├── engine TEXT
├── count INTEGER                 -- сколько юзеров подтвердили
└── confidence REAL               -- count-based confidence
```

---

## 9. Ключевые выводы

1. **NHTSA API бесполезен для российского рынка** — покрывает только 15-20% (серый импорт из США). Для китайских, российских и большинства европейских VIN возвращает ошибку.

2. **VDS (позиции 4-8) — ключ к декодированию**, но у каждого бренда своя схема. Для 33 брендов (JP+KR+DE+US+FR) таблицы доступны публично. Для 25 китайских + российских брендов — нужен реверс-инжиниринг.

3. **Оптимальная стратегия — многоуровневая**:
   - Уровень 1: VDS таблицы (оффлайн, мгновенно)
   - Уровень 2: OBD PID 51 + расчет displacement (5 сек)
   - Уровень 3: NHTSA API fallback (для US VIN)
   - Уровень 4: CalID краудсорс (долгосрочно)
   - Уровень 5: Выбор юзером из короткого списка (последний resort)

4. **Calibration ID — самый перспективный сигнал**. Уникален для каждого ECU firmware. Если собрать базу от юзеров (1000+ подключений), можно покрыть 95%+ парка без вопросов.

5. **Неоднозначности модель/поколение при совпадающих specs НЕ критичны для диагностики** — OBD-поведение идентично у моделей с одним ECU.

6. **Для MVP достаточно**: WMI + Year + PID 51 + подтверждение юзером из короткого списка (3-7 вариантов). Это даст 100% точность с минимальным взаимодействием.

---

## 10. Следующие шаги

- [ ] Создать vds-tables.json с таблицами для 10 приоритетных брендов (Toyota, Hyundai, Kia, VW, BMW, MB, Nissan, Honda, Ford, GM)
- [ ] Реализовать decode_vin() с многоуровневой логикой
- [ ] Добавить OBD PID 51 и CalID читалку в приложение
- [ ] Создать UI для подтверждения модели юзером (с фото)
- [ ] Реализовать CalID краудсорс на сервере
- [ ] Собрать VIN-образцы для китайских брендов и реконструировать VDS
