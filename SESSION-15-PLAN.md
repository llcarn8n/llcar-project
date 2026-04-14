# SESSION 15 — ПОДРОБНЫЙ ПЛАН

**Старт:** KB 62 бренда / 309 поколений / 3060 ситуаций / 1820 DTC / 0 full articles.
**Ветка:** `dashboard-v3`. Последний коммит: `ea676b3`.

---

## Контекст на старт

- Все GLM-сгенерированные ситуации содержат qa 300-700 символов (среднее ~450).
- Качественное распределение: 300-499 (52%), 500-799 (39%), 100-299 (8%), 800-1499 (1%).
- **0 full articles (qa ≥1500)** — это главный пробел качества контента.
- Инфраструктура готова: `_dtc_index.json` (1820 кодов), `_quality_report.json`, `dtc.json` per gen.
- Frontend пока НЕ подключал новые 62 бренда и 1820 DTC.
- Server sync: 2365 ситуаций на 185.55.57.145 (состояние Session 13), 695 новых не синхронизированы.

---

## Приоритет 1 — Full Articles (qa 1500-2500) для топ-30 моделей РФ

### Цель
Превратить 30 топ-ситуаций из "summary" (300-500 chars) в full article (1500-2500 chars). Это ключевая ценность KB для SEO, доверия и вовлечённости.

### Формат full article

Каждая full article должна включать 6 секций, разделённых пустой строкой или заголовком:

```
## Симптомы (200-350 chars)
Что видит/слышит/ощущает владелец в деталях. Разные сценарии (холодная, горячая, в пробке, на трассе).

## Техническая причина (300-500 chars)
Физика отказа с привязкой к конкретному engine/transmission code. Какие детали изнашиваются, почему, какая нагрузка.

## Последствия игнорирования (200-350 chars)
Каскад поломок, цена ремонта, риски безопасности, потеря гарантии.

## Диагностика (300-500 chars)
Какие параметры снимать, какой сканер нужен, что смотреть в живых данных. Пошагово: визуальная → сканер → измерения → эндоскопия.

## Ремонт (300-450 chars)
Пошагово: демонтаж → замена детали → сборка → адаптация. Артикулы запчастей (оригинал + аналоги). Специнструмент.

## Профилактика (100-200 chars)
Что делать владельцу, чтобы не повторилось (интервалы обслуживания, режим эксплуатации, качество топлива/масла).
```

### Целевые 30 ситуаций (по популярности в РФ)

#### Hyundai / Kia (10 — приоритетные)
1. **Hyundai Solaris HC** (`hyundai/solaris/hc_2017/situations.json`) — top situation: задиры в цилиндрах Gamma/Kappa
2. **Hyundai Solaris RB** — top situation: износ катушек зажигания (1.4/1.6)
3. **Kia Rio QB** — top situation: задиры в цилиндрах G4FC + катализатор
4. **Kia Rio FB** — top situation: 6AT A6GF1 рывки
5. **Kia Ceed JD** — top situation: DCT DCT6 проблемы
6. **Hyundai Creta GS** — top situation: коррозия днища и арок
7. **Hyundai Creta GS 2016+** — top situation: 2.0 Nu масложор
8. **Hyundai Elantra AD** — top situation: P2187 Bank 1 lean
9. **Hyundai Santa Fe TM** — top situation: Theta II 2.4 износ подшипников
10. **Kia Sportage QL** — top situation: Gamma 2.0 MPI масложор

#### Toyota / Lexus (5)
11. **Toyota Camry V50** (`toyota/camry/v50_2011`) — top: U660E вибрация выжимного
12. **Toyota Camry XV70** — top: 2AR-FE масложор
13. **Toyota LC Prado J150** — top: 1GR-FE износ цепи ГРМ
14. **Toyota RAV4 XA40** — top: 3ZR-FAE Valvematic проблемы
15. **Lexus RX AL20** — top: 2GR-FKS + 8AT U881E

#### Volkswagen / Skoda (5)
16. **VW Polo AW** — top: 1.6 MPI CFNA (для РФ) задиры
17. **VW Tiguan NF** — top: DSG DQ381 износ сцепления
18. **Skoda Octavia A8** — top: DSG DQ381 рывки (уже частично есть)
19. **Skoda Rapid NH** — top: 1.6 MPI CWVA/CWVB масложор
20. **VW Polo MK6** — top: 1.5 TSI EA211 evo2 ГРМ

#### Lada / UAZ (3)
21. **Lada Vesta GFL** — top: 21127 1.6 ГРМ обрыв
22. **Lada Granta 2190** — top: 11186 масложор и угар
23. **UAZ Patriot 3163** — top: ZMZ-409 износ распредвалов

#### Renault / Nissan (4)
24. **Renault Duster HS** — top: H4M 1.6 масложор / обрыв цепи
25. **Renault Arkana RJL** — top: HR16DE 1.6 + CVT JF015E
26. **Nissan Qashqai J11** — top: MR20DE + JF017E CVT
27. **Nissan X-Trail T32** — top: QR25 + JF017E Xtronic

#### Premium (3)
28. **BMW 3 Series F30** — top: N20 масложор + цепь ГРМ
29. **Mercedes C-Class W205** — top: OM651 форсунки / цепь ГРМ
30. **Mercedes C-Class W204** — top: M271 EVO масложор

### Workflow

**Шаг 1: Подготовка (30 мин)**
```bash
# Найти id топ-ситуации для каждой модели
python scripts/find_top_situation.py  # нужно создать, берёт по urg=5 и count DTC
```

**Шаг 2: Генерация full article через GLM (по одной за раз)**

Использовать `mcp__glm__ask` с промптом:
```
system: "Ты - автомеханик с 20-летним стажем и техписатель. Пиши русский язык, технически точно, для владельца авто и механика."
prompt: "Напиши full diagnostic article для ситуации: [брендом/моделью/поколением] '[title]'. 
Контекст (engine/transmission): [из meta.json]
Существующий qa (для справки): [300-500 chars]
Требования: 1500-2500 chars, 6 секций (Симптомы / Техническая причина / Последствия / Диагностика / Ремонт / Профилактика), без placeholder текста, без иероглифов, все engine codes и артикулы реальные."
```

**Шаг 3: Обновление ситуации**

Для каждой ситуации:
- Удалить из `situations.json` старый qa (оставить только краткое описание 200-300 chars)
- Добавить поле `full_article` с длинным текстом из GLM
- Добавить поле `content_type: "full_article"` (расширить enum)
- Либо: создать отдельный файл `articles/<sit_id>.md`

### Оценка
- 30 статей × 10 мин на GLM-генерацию и 5 мин на ревью = **7-8 часов работы**.
- Можно параллелизовать: 5 GLM-запросов одновременно = **2-3 часа**.
- Потребуется минимум 2-3 итерации для повторных прогонов (качество).

### Файлы для создания
- `scripts/generate_full_article.py` — helper для batch-генерации
- `scripts/validate_full_articles.py` — проверка длины, отсутствия иероглифов, placeholder
- `llcar-dashboard/public/data/kb/_articles_index.json` — индекс {sit_id → file_path}

---

## Приоритет 2 — YouTube Videos Linking (топ-100 моделей)

### Цель
Добавить поле `videos` к ситуациям с прямыми ссылками на ремонт/обзоры/диагностику. Это улучшит engagement и SEO.

### Формат

```json
{
  "id": "...",
  "videos": [
    {"url": "https://youtube.com/watch?v=...", "type": "repair", "channel": "Avtodoc", "duration_min": 25, "language": "ru"},
    {"url": "https://youtube.com/watch?v=...", "type": "review", "channel": "BIGtest", "duration_min": 18, "language": "ru"},
    {"url": "https://youtube.com/watch?v=...", "type": "diagnostic", "channel": "TESTDRIVE", "duration_min": 12, "language": "ru"}
  ]
}
```

Типы: `repair` (ремонт), `review` (обзор), `diagnostic` (диагностика), `test_drive` (тест-драйв), `problem` (обсуждение проблемы).

### Источники (каналы ру-сегмента)

| Канал | Тип контента | Подходит для |
|-------|--------------|--------------|
| TESTDRIVE | Обзоры / тест-драйвы | review, test_drive |
| BIGtest | Глубокие технические обзоры | review, diagnostic |
| Autogid | Обзоры владения, проблемы | problem, review |
| Drive2 (embed) | Блоги владельцев | problem |
| AvtoTachki | Разборы и проблемы | problem |
| Garage54 (разрушение) | — НЕ использовать |
| Главная Дорога | Проверка авто | diagnostic |
| Авто+ | Обзоры, сравнения | review |
| MrVolt | EV контент | review для EV |
| КарПоинт | Ремонт, диагностика | repair, diagnostic |

### Workflow

**Шаг 1: Скрипт поиска**

Создать `scripts/youtube_search.py`:
```python
# Использовать YouTube Data API v3
# Ключ: GOOGLE_API_KEY env var (получить у Петра)
# Для каждой ситуации:
# - Запрос: "<brand> <model> <gen_year> <title_keywords>"
# - Топ-3 результата, отсортированные по релевантности и просмотрам
# - Проверить наличие ru-субтитров или ru-описания
# - Извлечь: videoId, title, channelTitle, duration, viewCount, publishedAt
```

**Шаг 2: Ручная валидация**

Для топ-30 моделей пройтись вручную, добавить ссылки с упором на качество, а не количество.

**Шаг 3: Batch для остальных 70**

Автоматическая генерация через YouTube API, затем ручной ревью топ-3 ссылок.

### Оценка
- Скрипт: **2 часа** создание + **4 часа** обработки.
- Ручной ревью топ-30: **3-4 часа**.
- Итого: **8-10 часов**.

### Файлы
- `scripts/youtube_search.py`
- `scripts/validate_video_links.py` — проверка что видео не удалены, не приватны
- Обновление `schema.json` (добавить поле `videos`)

---

## Приоритет 3 — Frontend Integration

### Цель
Подключить к UI 62 бренда / 3060 ситуаций / 1820 DTC и новые файлы инфраструктуры.

### Задачи

**3.1 Dashboard Rendering Check (Playwright)**

```bash
npm run dev --prefix llcar-dashboard
# Playwright автотест:
# - Перейти на /diagnostics
# - Открыть выбор бренда → должно быть 62 опции
# - Открыть Tesla → Model 3 → M3 2017 → должно быть 10 ситуаций
# - Открыть HiPhi / Leap Motor / Jidu / IM Motors (новые Session 14)
# - Открыть /kb?sit=hyundai_solaris_hc_01 — рендер без ошибок
```

Файл: `e2e/kb-rendering.spec.ts`

**3.2 DTC Search по `_dtc_index.json`**

Фронт должен загружать `_dtc_index.json` (1.5 MB) и предоставлять:
- Инпут "Введите код DTC" на `/diagnostics`
- Автодополнение по 1820 кодам
- При выборе — показ всех ситуаций, где код встречается
- Фильтрация по бренду, поколению, категории

Компонент: `src/components/kb/DtcSearch.tsx`

**3.3 Quality Indicator в UI**

Добавить визуальный индикатор качества ситуации:
- 🟢 Green dot если qa ≥500, dtc_codes ≥3, solutions ≥3
- 🟡 Yellow если qa 300-499
- 🔴 Red если qa <300 или нет DTC

Компонент: `src/components/kb/QualityBadge.tsx`

**3.4 Full Article Rendering**

Когда ситуация имеет `full_article` (P2.1) — рендерить Markdown с секциями:
- Использовать `react-markdown` с секциями-аккордеонами
- Навигация по заголовкам: Симптомы / Причина / Последствия / Диагностика / Ремонт / Профилактика

Компонент: `src/components/kb/FullArticle.tsx`

**3.5 Videos Section**

Когда ситуация имеет `videos` (P2.4) — embed YouTube плеер.
Компонент: `src/components/kb/VideosList.tsx`

### Оценка
- 3.1 E2E tests: **3-4 часа**
- 3.2 DTC search: **6-8 часов**
- 3.3 Quality badge: **2 часа**
- 3.4 Full article rendering: **4-5 часов**
- 3.5 Videos embed: **2-3 часа**
- **Итого: 17-22 часа**

---

## Приоритет 4 — Верификация и валидация

### 4.1 Verifier по оставшимся брендам

Округа 4-5 Session 14 добавили 7 брендов без финальной верификации:
- HiPhi X
- Leap Motor C11
- Jidu Robocar 01
- IM Motors L7
- Nio ET7 (частично проверено в Round 4 verifier)
- XPENG P7 (частично)
- Voyah Free (частично)

Запустить verifier-агента:
```bash
# В фоне
Agent verifier: проверить 4 новых бренда Round 5 + финальная проверка Nio/XPENG/Voyah после фиксов
```

### 4.2 Автовалидатор JSON Schema

Создать `scripts/validate_kb_schema.py`:
- Использовать JSON Schema Draft 7
- Валидировать все 309 situations.json
- Проверки: enum для cat, urg 1-5, content_type, формат DTC (regex: `^[PBCU][0-9A-F]{4,6}$`)
- Выход в CI/CD pipeline

### 4.3 Перекрёстная проверка дубликатов

Многие ситуации у разных моделей описывают одни и те же проблемы (например, расход масла на разных моделях с одинаковым мотором). Создать:

`scripts/detect_duplicates.py`:
- Семантическое сравнение qa (векторная близость)
- Идентификация: "kia_rio_jb_007" и "hyundai_solaris_hc_007" описывают то же → консолидировать
- Отчёт в `_duplicates_report.json`

### Оценка
- 4.1: **1 час** (запустить в фоне)
- 4.2: **3-4 часа** (написать schema + запустить)
- 4.3: **4-5 часов** (семантика, требует embedding)
- **Итого: 8-10 часов**

---

## Приоритет 5 — Server Deploy

### Цель
Синхронизировать 695 новых ситуаций с сервером 185.55.57.145 (PostgreSQL/TimescaleDB + Django).

### Подзадачи

**5.1 Рассмотреть архитектуру**

Backend на сервере читает ситуации из: (a) файловой системы JSON, или (b) PostgreSQL? Проверить:
```bash
ssh llcar@185.55.57.145 "ls -la /srv/llcar/kb/ 2>/dev/null; psql -U llcar -d llcar -c \"\\dt\""
```

**5.2 Вариант A: rsync KB files**

Если backend читает файлы:
```bash
rsync -avz --delete --exclude='.omc' --exclude='.git' \
  llcar-dashboard/public/data/kb/ \
  llcar@185.55.57.145:/srv/llcar/kb/

# Перезапустить backend
ssh llcar@185.55.57.145 "sudo systemctl restart llcar-backend gunicorn"
```

**5.3 Вариант B: DB migration**

Если данные в БД:
```bash
# Создать миграцию Django
python manage.py makemigrations kb_data
python manage.py migrate --dry-run kb_data
python manage.py migrate kb_data

# Импорт ситуаций из файлов
python manage.py import_situations --source=/srv/llcar/kb/ --dry-run
python manage.py import_situations --source=/srv/llcar/kb/
```

**5.4 Обновить фронтенд на production**

```bash
cd llcar-dashboard
npm run build
rsync -avz dist/ llcar@185.55.57.145:/srv/llcar/www/dashboard/
```

**5.5 Smoke test**

```bash
curl https://llcar.ru/api/kb/brands  # должно быть 62
curl https://llcar.ru/api/kb/dtc/P0300  # должно быть 183 ситуации
```

### Оценка
- **3-5 часов** (если файлы) или **6-10 часов** (если БД с миграцией).

---

## Приоритет 6 — Расширение KB (опционально)

Если время останется, добавить ещё поколения и бренды.

### 6.1 Недостающие gens в существующих брендах

- **Nio**: ES8 (SUV), ES6, EC6, ET5
- **BYD**: Song Plus, Yuan Plus (отдельно от Atto 3), Qin Plus, Dolphin EV
- **Zeekr**: 001FR (performance variant)
- **Tesla**: Cybertruck (2024+), Roadster 2nd gen
- **BMW**: X5 M F95, X6 M F96, M5 F90, M3 G80, M4 G82, 2 Series Active Tourer U06
- **Mercedes**: EQS SUV X296, EQG W465 (электро G-Class 2024+)
- **Audi**: Q6 e-tron (2024+), A6 e-tron (2024+)
- **Porsche**: Taycan (Cross Turismo, Turbo S), Panamera 971, 911 992

### 6.2 Новые бренды (РФ-релевантные)

- **Denza** (Mercedes + BYD JV) — D9, N7, N8
- **Exeed RX** (Chery premium) — расширить то что есть
- **Hongqi** — H9, E-HS9 (китайский премиум)
- **Arcfox** — αT, αS (BAIC EV)
- **Neta** — U, S (Hozon Auto)
- **WEY** — VV6, VV7, Coffee 01 (Great Wall premium)
- **Tank** — 300, 500 (Great Wall offroad)
- **Moskvich** — 3, 3e, 6, 8 (JAC-based сейчас)

### Оценка
- Каждый бренд ~30-60 минут через GLM.
- 15 новых брендов × 45 мин = **10-12 часов** + коммиты.

---

## Порядок выполнения Session 15

**День 1 (6-8 часов):**
1. P4.1 verifier запустить в background (5 мин)
2. P2.1 Full articles — **5 топ-статей** (Hyundai Solaris, Kia Rio, Toyota Camry V50, VW Tiguan, Mercedes C W205): ~2 часа через GLM параллельно
3. P3.2 DTC Search фронт компонент: 3 часа
4. P3.3 Quality Badge: 1 час
5. Коммит всё

**День 2 (6-8 часов):**
6. P2.1 Full articles — **остальные 25 статей** через GLM batch: 3-4 часа
7. P2.4 YouTube videos API script: 2 часа
8. P4.2 schema validator: 2 часа
9. Коммит всё

**День 3 (4-6 часов):**
10. P2.4 YouTube — ручной ревью топ-30: 3 часа
11. P3.4 Full article rendering UI: 2 часа
12. P5 Server deploy: 3-5 часов
13. P3.1 E2E tests: 2 часа
14. Financial commit + handoff

---

## Метрики успеха Session 15

| Метрика | Старт | Цель |
|---------|-------|------|
| Full articles (qa≥1500) | 0 | **30** |
| Ситуации с videos | 0 | **100** |
| Frontend рендерит все 62 бренда | нет | да |
| DTC Search работает | нет | да |
| Server sync | S13 (2365 sit) | S14 (3060 sit) |
| Schema validation в CI | нет | да |

---

## Риски и митигации

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| GLM сгенерирует некорректный технический контент для full articles | Высокая | Verifier проход после каждых 5 статей; ручной спот-чек топ-5 |
| YouTube API квоты (10000 units/day) | Средняя | Использовать ключ или fallback к ручному поиску |
| Сервер БД может иметь другую схему | Средняя | Начать с SSH инспекции до миграций |
| Frontend компоненты могут конфликтовать с существующим дизайном | Низкая | Использовать существующие HUD стили (V3 dashboard-v3) |

---

## Команды для быстрого старта Session 15

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы"

# 1. Проверить состояние
git status
git log --oneline | head -5
python scripts/kb_quality_report.py

# 2. Старт dev сервера
cd llcar-dashboard
npm run dev
# открыть http://localhost:5173

# 3. Запустить verifier в фоне (см. P4.1)

# 4. Первая GLM full article
# использовать mcp__glm__ask с промптом из P2.1
```

---

## Файлы, которые точно будут созданы в S15

1. `scripts/find_top_situation.py` — найти топ-ситуацию для full article
2. `scripts/generate_full_article.py` — GLM helper
3. `scripts/validate_full_articles.py`
4. `scripts/youtube_search.py` — YouTube Data API
5. `scripts/validate_video_links.py`
6. `scripts/validate_kb_schema.py` — JSON Schema validator
7. `scripts/detect_duplicates.py` — семантическая детекция дубликатов
8. `llcar-dashboard/src/components/kb/DtcSearch.tsx`
9. `llcar-dashboard/src/components/kb/QualityBadge.tsx`
10. `llcar-dashboard/src/components/kb/FullArticle.tsx`
11. `llcar-dashboard/src/components/kb/VideosList.tsx`
12. `llcar-dashboard/e2e/kb-rendering.spec.ts`
13. `llcar-dashboard/public/data/kb/_articles_index.json`
14. `llcar-dashboard/public/data/kb/_duplicates_report.json`
15. Обновления 30 situations.json для full_article поля

---

## Итог

**Session 15 превращает 3060 «сухих summary» в 30 глубоких full articles, подключает видео, добавляет мощный DTC Search, валидирует качество и синхронизирует с сервером. После S15 KB становится production-ready для публичного запуска.**

**Ожидаемый итог: 62 бренда / 309 gens / 3060 ситуаций + 30 full articles / 100+ видео / rsync на сервер + работающий frontend с DTC поиском и quality badges.**
