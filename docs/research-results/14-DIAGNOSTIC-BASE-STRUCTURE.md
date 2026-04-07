# 14. Структура диагностической базы данных LLCAR

> Дата анализа: 2026-04-07
> Источник: `common files all models/` (7 файлов, ~95 KB суммарно)

---

## Оглавление

1. [STRUCTURE.md — метадокументация Knowledge Base](#1-structuremd)
2. [hierarchy_ice.json — иерархия систем ДВС](#2-hierarchy_icejson)
3. [hierarchy_bev.json — иерархия систем BEV](#3-hierarchy_bevjson)
4. [hierarchy_phev.json — иерархия систем PHEV](#4-hierarchy_phevjson)
5. [situations_base.json — базовые диагностические ситуации](#5-situations_basejson)
6. [platform-sharing.json — платформы и шаринг](#6-platform-sharingjson)
7. [wmi-database.json — WMI коды VIN](#7-wmi-databasejson)
8. [Связи между файлами](#8-связи-между-файлами)
9. [Применение в диагностическом движке](#9-применение-в-диагностическом-движке)
10. [Проблемы и рекомендации](#10-проблемы-и-рекомендации)

---

## 1. STRUCTURE.md

**Назначение:** мета-документация всей knowledge base — карта файлов, форматы, статусы, скрипты.

### Масштаб базы

| Метрика | Значение |
|---------|----------|
| Общий объём | 288 GB |
| Брендов | 58 |
| Моделей | 999 |
| Директорий | 1061 |
| Универсальных DTC | 35,911 (export/dtc-index.json) |

### Статусы моделей

| Статус | Кол-во | Описание |
|--------|--------|----------|
| FULL | 333 | manual + DITA + images |
| MANUAL | 445 | manual.md есть, images нет |
| IMAGES_ONLY | 11 | images есть, manual.md утерян |
| STUB | 210 | только metadata |

### Структура бренда (каждый бренд содержит)

```
brands/{brand}/
  manifest.json          — метаданные: models[], chunk_files[], vehicles_map
  hierarchy.json         — иерархия систем (ICE/BEV/PHEV шаблон)
  dtc-brand.json         — brand-specific DTC примечания
  situations.json        — диагностические ситуации
  sources.json           — источники данных
  specs.json             — спецификации
  chunks/                — контент (synthesized, reviews, articles, news)
  models/{model}/
    manual.md            — основной мануал (OCR)
    18-dita-manual.json  — DITA-структура (навигация по разделам)
    dtc.json             — DTC коды модели
    situations.json      — ситуации модели
    parts-catalog.json   — каталог запчастей
    info.json            — спецификации
    reviews.md           — обзоры
    images/              — изображения из мануала
```

### Ключевой формат manual.md

```markdown
### Название раздела
`chunk_id` | model_id | source | tier:N | lang:XX | p:N

Текст раздела...
![подпись](knowledge-base/brands/{brand}/models/{model}/images/file.jpg)
```

### Применение в движке
- **Карта навигации**: определяет, какие файлы загружать для каждого бренда/модели
- **vehicles_map**: связь vehicles-ru.json ID с папкой модели (например, `"bmw_3_series" -> "3_series"`)
- **DITA-структура**: позволяет искать контент по системам (engine -> topic -> chunk)
- **Поколения**: 58 моделей имеют подпапки поколений (BMW E53/E70/F15 и т.д.)

---

## 2. hierarchy_ice.json

**Назначение:** шаблон иерархии систем для автомобилей с ДВС (Internal Combustion Engine).

### Структура данных

```json
{
  "brand": "chery",              // string — бренд-placeholder
  "template": "ice",             // string — тип шаблона
  "domains": [                   // array[5] — домены
    {
      "id": "powertrain",        // string — ID домена
      "name": {
        "ru": "Силовая установка",
        "en": "Powertrain"
      },
      "systems": [               // array — системы в домене
        {
          "id": "engine",        // string — ID системы
          "name": {"ru": "...", "en": "..."},
          "desc_ru": "..."       // string — описание на русском
        }
      ]
    }
  ]
}
```

### Полная карта доменов и систем (ICE)

| Домен | ID | Системы (id) | Кол-во |
|-------|----|-------------|--------|
| Силовая установка | `powertrain` | engine, transmission, fuel_system, exhaust, cooling | 5 |
| Шасси | `chassis` | suspension, steering, brakes, wheels_tires, awd | 5 |
| Кузов | `body` | body_structure, closures, glass_mirrors, exterior_trim | 4 |
| Салон | `cabin` | seats, hvac, interior_trim, infotainment | 4 |
| Электроника | `electronics` | adas, sensors, lighting, electrical | 4 |

**Итого: 5 доменов, 22 системы.**

### Поля каждой системы

| Поле | Тип | Обязательное | Пример |
|------|-----|-------------|--------|
| `id` | string | да | `"engine"` |
| `name.ru` | string | да | `"Двигатель"` |
| `name.en` | string | да | `"Engine"` |
| `desc_ru` | string | да | `"Бензиновый двигатель 1.5T/1.6T TGDI (Chery ACTECO)"` |

### Применение в движке
- **Маршрутизация диагностики**: по symptom -> определить domain -> сузить до system
- **UI навигация**: 5 доменов -> 22 подсистем -> конкретные DTC/ситуации
- **Локализация**: готовые ru/en названия для интерфейса
- **Описания**: desc_ru содержит бренд-специфичные компоненты (Chery ACTECO, CVT)

---

## 3. hierarchy_bev.json

**Назначение:** шаблон иерархии систем для электромобилей (Battery Electric Vehicle).

### Отличия от ICE

BEV-шаблон сохраняет ту же общую структуру (5 доменов, 22 системы), но в домене `powertrain` заменяет ICE-специфичные системы на электрические:

| ICE (id) | BEV (id) | BEV name_ru | BEV name_en |
|----------|----------|-------------|-------------|
| `engine` | `electric_motor` | Электромотор | Electric Motor |
| `fuel_system` | `charging` | Зарядная система | Charging System |
| `exhaust` | `battery_pack` | Батарейный блок | Battery Pack |
| `transmission` | `transmission` | (без изменений) | (без изменений) |
| `cooling` | `cooling` | (без изменений) | (без изменений) |

### Важная находка: баг в данных

Файл содержит `"template": "ice"` вместо ожидаемого `"template": "bev"`. При этом в поле `name` у некоторых систем остались старые ICE-значения (например, `name.ru: "Двигатель"` для `electric_motor`, `name.ru: "Топливная система"` для `charging`), а правильные BEV-названия вынесены в отдельные поля `name_ru` / `name_en`.

**Это дублирование и несогласованность**. Код должен проверять наличие `name_ru`/`name_en` и приоритизировать их над `name.ru`/`name.en`.

### Домены chassis, body, cabin, electronics
Полностью идентичны ICE-шаблону (логично — эти системы не зависят от типа привода).

### Применение в движке
- **Автоматический выбор шаблона** по типу авто (ICE/BEV/PHEV)
- **Адаптация диагностики**: для BEV нет exhaust/fuel_system, но есть battery_pack/charging
- **Унифицированный UI**: одинаковая структура 5 доменов для любого типа авто

---

## 4. hierarchy_phev.json

**Назначение:** шаблон иерархии систем для гибридов (Plug-in Hybrid Electric Vehicle).

### Критическая находка: файл идентичен hierarchy_ice.json

PHEV-шаблон является **точной копией ICE-шаблона** — те же 5 доменов, те же 22 системы, тот же `"template": "ice"`. Не содержит PHEV-специфичных систем:
- Нет `battery_pack` (тяговая батарея)
- Нет `charging` (зарядная система)
- Нет `electric_motor` (электромотор)
- Нет `regenerative_braking` (рекуперация)

**Это баг или незавершённая работа.** PHEV-автомобили имеют как ДВС, так и электрическую трансмиссию. Шаблон должен быть объединением ICE + часть BEV.

### Рекомендуемая структура PHEV (powertrain домен)

Должен содержать системы из обоих шаблонов:
- `engine` (от ICE)
- `electric_motor` (от BEV)
- `transmission` (гибридная)
- `fuel_system` (от ICE)
- `battery_pack` (от BEV)
- `charging` (от BEV)
- `cooling` (от ICE, расширенная для батареи)

---

## 5. situations_base.json

**Назначение:** базовый набор диагностических ситуаций — типовые проблемы, с которыми сталкиваются владельцы.

### Структура данных

```json
[
  {
    "id": "brake_spongy",                           // string — уникальный ID
    "title": "Тормоза стали ватные / скрип",        // string — название
    "icon": "icon_emoji",                            // string — эмодзи для UI
    "urgency": 4,                                    // int 1-4 — срочность
    "priority": "P0",                                // string P0-P3 — приоритет
    "layers": ["brakes"],                            // string[] — связь с системами
    "season": "all",                                 // string — сезонность
    "searchQueries": ["Chery Tiggo проблема", ...],  // string[] — поисковые запросы
    "quickAnswer": "Проверьте уровень...",           // string — быстрый ответ
    "action_ru": "Проверить уровень жидкости...",    // string — рекомендуемое действие
    "facts_ru": [],                                  // array — факты (пока пусто)
    "subtitle": "...",                               // string — подзаголовок
    "desc": "...",                                   // string — описание
    "sources": []                                    // array — источники (пока пусто)
  }
]
```

### Полный список ситуаций (25 записей)

| # | id | title | urgency | priority | layers | season |
|---|-----|-------|---------|----------|--------|--------|
| 1 | brake_spongy | Тормоза стали ватные / скрип | 4 | P0 | brakes | all |
| 2 | engine_noise | Двигатель шумит / Check Engine | 4 | P0 | engine | all |
| 3 | suspension_issue | Подвеска стучит / просела | 3 | P1 | chassis | all |
| 4 | transmission_issue | Коробка дёргается / CVT | 3 | P1 | engine | all |
| 5 | winter_prep | Подготовка к зиме | 2 | P1 | engine, chassis | winter |
| 6 | maintenance | Плановое ТО | 2 | P1 | engine | all |
| 7 | multimedia_screen | Экран / мультимедиа глючит | 2 | P2 | infotainment | all |
| 8 | fuel_consumption | Расход топлива выше нормы | 2 | P1 | engine | all |
| 9 | rust_corrosion | Коррозия / ржавчина | 2 | P2 | body | all |
| 10 | used_car_check | Проверка б/у Chery | 1 | P2 | engine, chassis, body | all |
| 11 | ac_not_working | Кондиционер не охлаждает | 2 | P2 | hvac | summer |
| 12 | headlight_issues | Проблемы с фарами | 2 | P2 | lighting | all |
| 13 | tires_tpms | Шины и TPMS | 2 | P2 | chassis | all |
| 14 | battery_12v | 12V аккумулятор | 4 | P0 | electrical | winter |
| 15 | coolant_leak | Антифриз / утечка | 4 | P0 | engine | all |
| 16 | strange_sounds | Странные звуки | 3 | P1 | chassis, engine | all |
| 17 | oil_consumption | Расход масла | 3 | P1 | engine | all |
| 18 | steering_issue | Руль тянет / вибрация | 3 | P1 | chassis | all |
| 19 | door_window | Двери / стеклоподъёмники | 1 | P2 | body | all |
| 20 | smell_cabin | Запах в салоне | 2 | P2 | hvac | all |
| 21 | parking_sensors | Парктроники / камера | 1 | P2 | sensors | all |
| 22 | key_fob | Ключ не работает | 2 | P2 | electrical | all |
| 23 | insurance_tips | Страховка и ДТП | 1 | P2 | body | all |
| 24 | russification_cn | Русификация / настройка | 1 | P2 | infotainment | all |
| 25 | wiper_washer | Дворники / омыватель | 1 | P2 | body | all |

### Статистика по urgency

| Urgency | Кол-во | Значение |
|---------|--------|----------|
| 4 (критическое) | 4 | brake_spongy, engine_noise, battery_12v, coolant_leak |
| 3 (высокое) | 4 | suspension_issue, transmission_issue, strange_sounds, oil_consumption, steering_issue |
| 2 (среднее) | 10 | maintenance, winter_prep, fuel_consumption, и др. |
| 1 (низкое) | 5 | used_car_check, door_window, parking_sensors, insurance_tips, wiper_washer |

### Статистика по priority

| Priority | Кол-во | Описание |
|----------|--------|----------|
| P0 | 4 | Критичные — остановка авто, безопасность |
| P1 | 7 | Важные — влияют на эксплуатацию |
| P2 | 14 | Обычные — комфорт, косметика |
| P3 | 0 | (не используется в базе) |

### Связь layers -> hierarchy systems

| layer (situations) | system_id (hierarchy) | domain |
|--------------------|-----------------------|--------|
| brakes | brakes | chassis |
| engine | engine | powertrain |
| chassis | suspension/steering/wheels_tires | chassis |
| infotainment | infotainment | cabin |
| body | body_structure/closures | body |
| hvac | hvac | cabin |
| lighting | lighting | electronics |
| electrical | electrical | electronics |
| sensors | sensors | electronics |

### Проблемы в данных

1. **searchQueries захардкожены на Chery Tiggo** — шаблон создавался для одного бренда, но используется как "base" для всех. Нужна генерация поисковых запросов по бренду/модели.
2. **facts_ru всегда пустой** — массив ни разу не заполнен. Задуман для интересных фактов.
3. **sources всегда пустой** — нет ссылок на источники данных.
4. **subtitle часто обрезан** (`"..."`-суффикс) — видимо автогенерация с ограничением длины.
5. **layers не всегда совпадают с hierarchy ids**: `transmission_issue` ссылается на `engine` вместо `transmission`.

### Применение в движке
- **Symptom matcher**: пользователь описывает проблему -> NLP/search -> match по title/quickAnswer/searchQueries
- **Triage engine**: по urgency/priority определить, насколько срочно
- **Seasonal advisor**: фильтр по season (winter/summer/all)
- **Quick diagnosis**: quickAnswer дает мгновенный ответ без глубокого анализа
- **Action plan**: action_ru — конкретное действие для пользователя

---

## 6. platform-sharing.json

**Назначение:** база платформ, на которых строятся автомобили. Модели на одной платформе имеют схожие компоненты и могут делить мануалы.

### Структура данных

```json
{
  "_comment": "Platform sharing: models on the same platform can share manual data...",
  "platforms": [
    {
      "id": "vw_mqb",                     // string — ID платформы
      "name": "VW MQB",                   // string — название
      "years": "2012+",                   // string — годы выпуска
      "notes": "Modularer Querbaukasten", // string — примечания
      "models": [
        {"brand": "volkswagen", "model": "golf"},
        {"brand": "skoda", "model": "octavia"},
        {"brand": "audi", "model": "a3"}
      ]
    }
  ]
}
```

### Полный список платформ (31 платформа)

| # | ID | Название | Годы | Моделей | Бренды |
|---|-----|---------|------|---------|--------|
| 1 | vw_mqb | VW MQB | 2012+ | 11 | VW, Skoda, Audi |
| 2 | vw_mqb_a0 | VW MQB-A0 | 2017+ | 3 | VW, Skoda |
| 3 | vw_mlb | VW MLB Evo | 2015+ | 7 | Audi, VW, Porsche |
| 4 | hyundai_k3 | Hyundai-KIA K3 | 2015+ | 2 | Hyundai, Kia |
| 5 | hyundai_k2 | Hyundai-KIA K2 | 2016+ | 3 | Hyundai, Kia |
| 6 | hyundai_su2 | Hyundai-KIA SU2 | 2019+ | 2 | Hyundai, Kia |
| 7 | hyundai_n3 | Hyundai-KIA N3 | 2018+ | 4 | Hyundai, Kia, Genesis |
| 8 | hyundai_solaris | Hyundai-KIA PB/YB | 2010+ | 2 | Hyundai, Kia |
| 9 | chery_t1x | Chery T1x | 2020+ | 4 | Chery, Omoda, Jaecoo |
| 10 | chery_t1e | Chery T1E | 2020+ | 4 | Chery, Omoda, Jaecoo |
| 11 | chery_a3x | Chery A3x (T19) | 2018+ | 4 | Chery, Omoda |
| 12 | psa_c_crosser | Mitsubishi GS (PSA) | 2007-2012 | 3 | Citroen, Mitsubishi, Peugeot |
| 13 | psa_eps | PSA EMP2 | 2013+ | 6 | Peugeot, Citroen, Opel |
| 14 | renault_cmf_b | Renault-Nissan CMF-B | 2019+ | 3 | Renault, Nissan |
| 15 | renault_b0 | Renault-Nissan B0 | 2004+ | 5 | Renault, Nissan, Lada |
| 16 | toyota_tnga_c | Toyota TNGA-C | 2015+ | 5 | Toyota, Lexus |
| 17 | toyota_tnga_k | Toyota TNGA-K | 2017+ | 5 | Toyota, Lexus |
| 18 | toyota_tnga_f | Toyota TNGA-F | 2021+ | 3 | Toyota, Lexus |
| 19 | honda_g | Honda Global Small | 2013+ | 3 | Honda |
| 20 | honda_c | Honda Compact | 2015+ | 2 | Honda |
| 21 | bmw_clar | BMW CLAR | 2015+ | 4 | BMW |
| 22 | geely_cma | Geely CMA | 2018+ | 3 | Geely, Volvo |
| 23 | geely_spa | Geely SPA | 2015+ | 5 | Geely, Volvo |
| 24 | haval_l | GWM LEMON | 2020+ | 2 | Haval |
| 25 | haval_coupe | GWM F-platform | 2018+ | 2 | Haval |
| 26 | ford_cd | Ford CD4/CD6 | 2012+ | 3 | Ford |
| 27 | ford_c | Ford C2 | 2010+ | 2 | Ford |
| 28 | nissan_cmf_cd | Nissan CMF-CD | 2013+ | 4 | Nissan |
| 29 | subaru_sgp | Subaru Global Platform | 2016+ | 5 | Subaru |
| 30 | mitsubishi_gs | Mitsubishi GS | 2005+ | 3 | Mitsubishi |
| 31 | mercedes_mra | Mercedes MRA | 2014+ | 4 | Mercedes |
| 31 | genesis_n3 | Hyundai-KIA N3 (Genesis) | 2019+ | 3 | Genesis |

**Итого: 32 платформы, ~115 моделей, ~25 брендов.**

### Покрытие по производителям

| Группа | Платформ | Моделей |
|--------|----------|---------|
| VW Group (VW, Audi, Skoda, Porsche) | 3 | 21 |
| Hyundai-Kia-Genesis | 5 | 14 |
| Chery Group (Chery, Omoda, Jaecoo) | 3 | 12 |
| Toyota-Lexus | 3 | 13 |
| Renault-Nissan (+ Lada) | 3 | 12 |
| Geely-Volvo | 2 | 8 |
| PSA (Peugeot, Citroen, Opel) | 2 | 9 |
| Honda | 2 | 5 |
| Ford | 2 | 5 |
| Прочие (BMW, Subaru, Mitsubishi, Mercedes, Haval) | 7 | 23 |

### Логика шаринга (из _comment)

> "When model A has a manual and model B (same platform) does not, B gets partial credit (50% of manual_chunks score)."

Это значит: если Kia Sportage имеет мануал, а Hyundai Tucson нет — Tucson получает 50% контента от Sportage, т.к. они на одной платформе K3.

### Применение в движке
- **Fallback-диагностика**: если для модели нет мануала, использовать данные платформенного партнёра
- **Cross-reference**: "Ваша проблема типична для платформы VW MQB, встречается также на Golf, Tiguan, Octavia"
- **Parts compatibility**: запчасти часто взаимозаменяемы внутри платформы
- **Recall propagation**: отзывная на одной модели платформы может касаться и других
- **Coverage scoring**: оценка полноты данных с учетом платформенного шаринга

---

## 7. wmi-database.json

**Назначение:** база WMI (World Manufacturer Identifier) — первые 3 символа VIN, позволяющие определить производителя и страну сборки.

### Структура данных

```json
{
  "_meta": {
    "description": "WMI database — first 3 chars of VIN -> manufacturer",
    "updated": "2026-03-11",
    "sources": ["ISO 3780", "NHTSA WMI registry", "Wikibooks", "Wikipedia"],
    "total_codes": 553
  },
  "wmi": {
    "1FA": { "make": "Ford", "country": "USA" },
    "LBV": { "make": "BMW Brilliance", "country": "China", "brands": ["BMW", "Zinoro"] },
    ...
  },
  "yearCodes": {
    "A": 2010, "B": 2011, ..., "9": 2039
  },
  "translitWeights": [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2],
  "translitMap": {
    "A": 1, "B": 2, ..., "Z": 9
  }
}
```

### Поля WMI-записи

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `make` | string | да | Производитель / JV-название |
| `country` | string | да | Страна сборки |
| `brands` | string[] | нет | Суб-бренды (для JV-заводов) |

### Статистика

| Метрика | Значение |
|---------|----------|
| Всего WMI-кодов | 553 |
| Стран | ~25 |
| WMI с полем `brands` | ~60 (в основном Китай) |

### Покрытие по странам

| Страна/Регион | WMI-кодов | Ключевые производители |
|---------------|-----------|------------------------|
| USA | ~95 | Ford, GM, Chrysler, Tesla, Honda, Toyota, BMW, Rivian, Lucid |
| China | ~120 | BYD, Geely, Chery, GWM, SAIC, FAW, Dongfeng, XPeng, Li Auto, NIO, Xiaomi |
| Japan | ~50 | Toyota, Nissan, Honda, Mazda, Subaru, Mitsubishi, Suzuki |
| Germany | ~45 | BMW, Mercedes, VW, Audi, Porsche, Opel, Smart, MINI |
| South Korea | ~15 | Hyundai, Kia, Genesis, SsangYong |
| UK | ~25 | Jaguar, Land Rover, Rolls-Royce, Bentley, Aston Martin, McLaren |
| India | ~20 | Maruti Suzuki, Tata, Mahindra, JV-заводы |
| Russia | ~40 | LADA, GAZ, KAMAZ, UAZ, Avtotor, Moskvitch, Evolute, Haval |
| Thailand/Indonesia | ~25 | JV-заводы Toyota, Honda, Mitsubishi |
| France | ~15 | Renault, Peugeot, Citroen, DS |
| Прочие | ~100 | Бразилия, Аргентина, Австралия, и т.д. |

### Дополнительные справочники в файле

**yearCodes** — 10-й символ VIN = модельный год:
```
A=2010, B=2011, ..., Y=2030, 1=2031, ..., 9=2039
```

**translitMap + translitWeights** — данные для проверки контрольной цифры VIN (9-й символ):
- `translitMap`: буква VIN -> числовое значение
- `translitWeights`: позиционные веса для вычисления check digit
- Алгоритм: sum(char_value * weight) mod 11 = check digit

### Примеры использования WMI

```
VIN: LVVDB11B1PD123456
WMI: LVV -> Chery (China), brands: ["Chery", "Omoda", "Jaecoo"]
Year: P (10th char) -> 2023

VIN: WBAPH5C55BA123456
WMI: WBA -> BMW (Germany)
Year: B (10th char) -> 2011

VIN: LW4SRCKD5PA123456
WMI: LW4 -> Li Auto (China)
Year: P -> 2023
```

### Применение в движке
- **VIN Decoder**: ввод VIN -> мгновенное определение бренда, страны, года
- **Brand resolver**: определение бренда даже для JV (LBV -> BMW Brilliance -> бренд BMW)
- **VIN validation**: проверка контрольной цифры через translitMap + translitWeights
- **Country detection**: страна сборки влияет на комплектацию и расходники
- **Auto-fill**: после сканирования VIN автоматически подставить бренд/модель

---

## 8. Связи между файлами

```
VIN (17 символов)
  |
  +--[3 символа]--> wmi-database.json --> brand + country
  |                                          |
  +--[10-й символ]--> yearCodes --> год       |
  |                                          |
  v                                          v
brand определён                    platform-sharing.json
  |                                    (какие модели на одной платформе)
  v                                          |
hierarchy_{ice|bev|phev}.json                |
  (5 доменов, 22 системы)                    v
  |                                    fallback: данные от платформенного партнёра
  v
situations_base.json
  (25 ситуаций, привязаны к systems через layers)
  |
  v
brands/{brand}/situations.json      <-- brand-specific ситуации
brands/{brand}/models/{model}/       <-- model-specific данные
  manual.md, dtc.json, parts-catalog.json
```

### Цепочка диагностики

1. **Пользователь вводит VIN** -> `wmi-database.json` -> brand, country, year
2. **Определяем тип авто** (ICE/BEV/PHEV) -> выбираем `hierarchy_*.json`
3. **Пользователь описывает проблему** -> NLP-match -> `situations_base.json`
4. **Ситуация ссылается на layers** -> маппим на system_id из hierarchy
5. **Ищем бренд/модель-специфичные данные** в knowledge-base
6. **Если данных нет** -> `platform-sharing.json` -> берём от платформенного партнёра
7. **Результат**: quickAnswer + action_ru + ссылки на мануал/DTC/запчасти

---

## 9. Применение в диагностическом движке

### 9.1. VIN-сервис (wmi-database.json)

```
Вход: VIN (строка 17 символов)
Выход: {brand, country, year, isValid}
```

- Декодирование первых 3 символов -> производитель, страна
- 10-й символ -> модельный год
- Проверка 9-го символа (check digit) через translitMap/translitWeights
- Разрешение JV-брендов через поле `brands[]`

### 9.2. Иерархия систем (hierarchy_*.json)

```
Вход: vehicle_type (ice/bev/phev)
Выход: дерево доменов -> систем
```

- Определяет "анатомию" авто для навигации
- Каждая система = точка входа в мануал, DTC-коды, запчасти
- Бренд-специфичные описания (desc_ru) для контекста

### 9.3. Symptom matcher (situations_base.json)

```
Вход: текст жалобы пользователя
Выход: [{situation, urgency, priority, quickAnswer, action}]
```

- Fuzzy match по title + quickAnswer + searchQueries
- Сортировка по urgency (4 -> 1)
- Фильтр по сезону (winter/summer/all)
- Быстрый ответ без обращения к мануалу

### 9.4. Platform intelligence (platform-sharing.json)

```
Вход: {brand, model}
Выход: [{platform, related_models[]}]
```

- Поиск платформенных партнёров
- Fallback для недостающих данных (50% score)
- Cross-reference для типичных проблем платформы

### 9.5. Полный pipeline

```
scanVIN("LVVDB11B1PD123456")
  -> {brand: "chery", country: "China", year: 2023}
  -> hierarchy_ice.json (5 доменов, 22 системы)
  -> platform: chery_t1x (Tiggo 7 Pro, Omoda C5, Jaecoo J7)

userSays("двигатель шумит на холодную")
  -> match: engine_noise (urgency: 4, P0)
  -> quickAnswer: "Двигатели Chery ACTECO 1.5T/1.6T TGDI могут шуметь при холодном пуске..."
  -> action: "Считать код ошибки. При стуке на прогретом — срочно в сервис."
  -> deepDive: brands/chery/models/tiggo_7_pro/manual.md -> section "engine"
  -> dtc: brands/chery/models/tiggo_7_pro/dtc.json
  -> related: "Та же платформа T1x — Omoda C5 и Jaecoo J7 имеют аналогичные двигатели"
```

---

## 10. Проблемы и рекомендации

### Критические баги

| # | Файл | Проблема | Решение |
|---|------|----------|---------|
| 1 | hierarchy_phev.json | Идентичен ICE, не содержит электрических систем | Создать PHEV-шаблон = ICE + electric_motor + battery_pack + charging |
| 2 | hierarchy_bev.json | Поле `template` = "ice" вместо "bev" | Исправить на `"template": "bev"` |
| 3 | hierarchy_bev.json | `name.ru/en` содержат ICE-названия, BEV-названия в `name_ru/name_en` | Унифицировать: использовать только `name.ru/en` с правильными BEV-значениями |
| 4 | situations_base.json | searchQueries захардкожены на "Chery Tiggo" | Параметризировать: `"{brand} {model} проблема"` |
| 5 | situations_base.json | `transmission_issue` ссылается на layer `engine` | Исправить на `transmission` |

### Неполные данные

| # | Файл | Проблема | Решение |
|---|------|----------|---------|
| 6 | situations_base.json | facts_ru[] всегда пуст | Заполнить фактами для quickAnswer |
| 7 | situations_base.json | sources[] всегда пуст | Добавить ссылки на мануалы/TSB |
| 8 | situations_base.json | Нет BEV-ситуаций | Добавить: degradation батареи, зарядка не работает, рекуперация, range anxiety |
| 9 | platform-sharing.json | Нет BEV-платформ | Добавить: Hyundai E-GMP, VW MEB, Tesla, BYD e-Platform 3.0, Geely SEA |
| 10 | wmi-database.json | Нет маппинга WMI -> model | Требуется 4-8 символы VIN для определения модели |

### Архитектурные рекомендации

| # | Рекомендация | Приоритет |
|---|-------------|-----------|
| 1 | Добавить BEV-специфичные ситуации (10-15 штук) | Высокий |
| 2 | Параметризировать situations_base как шаблон, генерировать per-brand | Высокий |
| 3 | Починить PHEV hierarchy — объединить ICE + BEV powertrain | Высокий |
| 4 | Добавить BEV-платформы в platform-sharing | Средний |
| 5 | Расширить WMI до полного VDS (4-8 символы) для определения модели | Средний |
| 6 | Добавить severity к ситуациям: estimated_cost, time_to_fix | Низкий |
| 7 | Добавить decision_tree к ситуациям: series вопросов для уточнения | Низкий |

---

## Сводка

| Файл | Записей | Назначение в движке |
|------|---------|---------------------|
| STRUCTURE.md | -- | Карта навигации по knowledge base (288 GB, 58 брендов, 999 моделей) |
| hierarchy_ice.json | 5 доменов, 22 системы | Анатомия ДВС-автомобиля для навигации и маршрутизации диагностики |
| hierarchy_bev.json | 5 доменов, 22 системы | Анатомия электромобиля (баг: template="ice", имена не исправлены) |
| hierarchy_phev.json | 5 доменов, 22 системы | Копия ICE (баг: нет электрических систем PHEV) |
| situations_base.json | 25 ситуаций | Symptom matcher: жалоба -> urgency + quickAnswer + action |
| platform-sharing.json | 32 платформы, ~115 моделей | Fallback-данные + cross-reference между моделями на одной платформе |
| wmi-database.json | 553 WMI-кода | VIN decoder: определение бренда, страны, года, валидация check digit |
