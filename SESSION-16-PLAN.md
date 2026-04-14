# SESSION 16 — ПОДРОБНЫЙ ПЛАН

**Старт:** KB 62 бренда / 309 поколений / 3060 ситуаций / **50 full articles (19 брендов)** / 1820 DTC / 4 frontend компонента готовы но не интегрированы.
**Ветка:** `dashboard-v3`. Последний коммит: `6f99e03`.
**Состояние репозитория:** 15 коммитов Session 15 накоплено, готово к тестированию и деплою.

---

## Контекст Session 16

**Что готово после Session 15:**
- 50 full articles (1800-2500 chars, 6 секций) в `llcar-dashboard/public/data/kb/_articles/`
- `_articles_index.json` со статистикой
- `scripts/validate_full_articles.py` (50/50 OK)
- `scripts/validate_kb_schema.py` (обнаружил 51 реальный issue)
- 50 situations.json содержат `content_type: "full_article"` + `full_article_path`
- Компоненты `QualityBadge.tsx`, `FullArticle.tsx`, `DtcSearch.tsx`
- `SituationsList.tsx` интегрирован с QualityBadge + FullArticle
- TypeScript чистый (`tsc --noEmit` без ошибок)

**Что НЕ сделано:**
- DtcSearch НЕ интегрирован в страницы (`Diagnostics.tsx`, `KnowledgeBase.tsx`)
- Visual QA не проведён (dev-server не запускался в Session 15)
- Build не собирался после добавления новых компонентов
- Server deploy не выполнен
- Verifier на новые Round 4/5 бренды не запущен
- 51 data issue от schema validator не исправлен
- Ещё ~30 популярных моделей РФ без full articles

---

## Приоритет 1 — Visual QA и Build (КРИТИЧНО, 2-3 часа)

Прежде чем добавлять новые фичи, нужно убедиться что текущие работают визуально.

### 1.1 Запуск dev-server и проверка SituationsList

```bash
cd llcar-dashboard
npm install   # если нужно
npm run dev
# открыть http://localhost:5173
```

**Чек-лист визуального QA:**
1. ☐ Страница `/diagnostics` открывается без ошибок в консоли
2. ☐ Выбрать Hyundai → Solaris HC 2017 → открыть ситуацию с `full_article_path` (hyundai_solaris_hc_01)
3. ☐ Проверить рендер `QualityBadge`:
   - ◉ зелёный (high) для full_article
   - ◎ жёлтый (medium) для qa 300-500
   - ○ красный (low) для qa <300
4. ☐ Кликнуть на полную ситуацию — проверить рендер `FullArticle`:
   - Frontmatter header (title, brand, model, engine)
   - 6 аккордеон-секций с иконками (🔍 🔧 ⚠ 📊 🛠 🛡)
   - Иконки открытия/закрытия работают
   - `code`-теги (OEM партномера) выделены cyan моноширинным
5. ☐ Проверить обычные ситуации без full_article — старый qa рендерится корректно
6. ☐ Проверить 5 разных брендов: Hyundai, Toyota, VW, BMW, Haval

**Если баги:**
- Consol errors → проверить import путь для QualityBadge/FullArticle
- Article не загружается → проверить путь в `data/kb/${articlePath}` (BASE_URL)
- CJK warnings → перезапустить validator после изменений

### 1.2 Production build

```bash
npm run build
npm run preview  # проверить собранный бандл
```

**Чек-лист build:**
- ☐ `npm run build` успешно без errors (warnings допустимы)
- ☐ Размер bundle не вырос более чем на 15% (FullArticle inline markdown, QualityBadge, DtcSearch)
- ☐ `npm run preview` открывается корректно
- ☐ В preview рендер идентичен dev-серверу

### 1.3 Fix обнаруженных багов

Если Visual QA нашёл проблемы — исправить и протестировать повторно. Коммит: `fix(kb): S16 P1 — visual QA fixes after Session 15 integration`.

---

## Приоритет 2 — DtcSearch интеграция (3-4 часа)

### 2.1 Анализ структуры страниц

Прочитать:
- `llcar-dashboard/src/pages/Diagnostics.tsx` — как сейчас построена
- `llcar-dashboard/src/pages/KnowledgeBase.tsx` — есть ли табы / секции
- `llcar-dashboard/src/stores/dashboardStore.ts` — как хранится vehicleProfile
- `llcar-dashboard/src/utils/kbPath.ts` — как derives kbGenPath

### 2.2 Варианты интеграции

**Вариант A (рекомендуется):** Добавить DtcSearch в `KnowledgeBase.tsx` как отдельный таб/секцию:

```tsx
// в KnowledgeBase.tsx
import { DtcSearch } from '../components/kb/DtcSearch'
import { useDashboardStore } from '../stores/dashboardStore'

function KnowledgeBase() {
  const { setVehicleProfile } = useDashboardStore()
  const [searchRef, setSearchRef] = useState(null)

  return (
    <div>
      <SectionTabs>
        <Tab name="Ситуации">
          <SituationsList ... />
        </Tab>
        <Tab name="Поиск по DTC">
          <DtcSearch
            onSelectSituation={(ref) => {
              // Переключиться на таб "Ситуации" и раскрыть нужную
              setVehicleProfile({
                brandId: ref.brand,
                model: ref.model,
                generationId: ref.generation,
              })
              // Раскрыть ситуацию с ref.sit_id — через expandedId в SituationsList
            }}
          />
        </Tab>
      </SectionTabs>
    </div>
  )
}
```

**Вариант B:** Отдельная страница `/dtc-search`:
- Новый route в `App.tsx`
- Добавить ссылку в Sidebar

### 2.3 Navigation callback

Самое сложное — при клике на ситуацию в DtcSearch нужно:
1. Установить vehicle в store (brand/model/gen)
2. Переключиться на таб "Ситуации"
3. Открыть нужную ситуацию по sit_id

Для (3) нужно добавить prop `initialExpandedId?: string` в `SituationsList` и передавать через URL hash или state.

### 2.4 Добавить ссылку в меню

В `Sidebar.tsx` добавить иконку/ссылку на DTC Search (если вариант B).

### 2.5 Тестирование

- ☐ Ввести "P03" — видеть список P0300, P0301, ...
- ☐ Выбрать P0300 — увидеть список из ~183 ситуаций
- ☐ Фильтры cat/brand работают
- ☐ Клик на ситуацию переводит на страницу /diagnostics с раскрытой ситуацией

**Коммит:** `feat(kb): S16 P2 — DtcSearch integration в KnowledgeBase`.

---

## Приоритет 3 — Data fixes (2-3 часа)

Исправить 51 issue от `scripts/validate_kb_schema.py`.

### 3.1 Mojibake в Volvo XC60

```bash
python scripts/validate_kb_schema.py --verbose 2>&1 | grep "mojibake\|CJK\|����"
```

Проблема: `volvo/xc60/su/_008` содержит текст в битой кодировке. Пересохранить файл в UTF-8 или перегенерировать ситуацию через GLM.

### 3.2 Пустой solutions в Toyota Camry XV40

`toyota/camry/xv40/_008` — `solutions: []`. Нужно добавить хотя бы 1 осмысленное решение через GLM или вручную.

### 3.3 Нестандартные DTC коды в Volvo

Коды типа `ECM-0001`, `HVB-001`, `ABS-001` в Volvo S60/XC40/XC60 — это внутренние Volvo-обозначения. Варианты:
- **A:** Расширить regex в validate_kb_schema.py чтобы принимать эти форматы (паттерн `^[A-Z]+-\d{3,4}$`)
- **B:** Преобразовать в стандартные OBD-II коды (P0606 ECM, P0A80 HV battery, C0035 ABS)

Рекомендую B — стандартные коды откроют возможность интеграции с DTC-индексом.

### 3.4 Run validator с нулём failures

```bash
python scripts/validate_kb_schema.py
# Summary: 309/309 files OK, 3060/3060 situations valid, 0 issues total.
```

**Коммит:** `fix(kb): S16 P3 — resolve 51 schema validation issues`.

---

## Приоритет 4 — Verifier на новые Round 4/5 бренды (2-3 часа, в фоне)

### 4.1 Подготовка списка брендов

7 брендов добавлены в Session 14 Round 4/5 без полной верификации:
- HiPhi X (2021+) — Hyper SOA, NOA 6 лидаров
- Leap Motor C11 (2021+) — LEAP 3.0 CTC LFP
- Jidu Robocar 01 (2023+) — SEA-E, Apollo AD
- IM Motors L7 (2022+) — IM Hi4 SAIC+Alibaba
- Nio ET7 (2022+) — 400V, semi-solid battery, BaaS
- XPENG P7 (2020+) — CATL NCM 811, XPilot
- Voyah Free (2021+) — Dongfeng ESSA

### 4.2 Запуск verifier-агентов

Использовать `oh-my-claudecode:verifier` агент для каждого бренда параллельно (7 agents в фоне):

```
Проверить фактическую корректность ситуаций для бренда [X]:
- llcar-dashboard/public/data/kb/[brand]/*/situations.json
- Engine codes, платформы, DTC-коды, партномера, цены
- DTC должны быть стандартными OBD-II или brand-specific hex (как в validate_kb_schema.py)
- Cross-check с production docs, wiki, форумами owners
- Report: список необходимых исправлений с precise line numbers
```

### 4.3 Применение исправлений

После возврата всех 7 агентов:
- Консолидировать issues в один PR
- Применить правки через Edit (группировать по файлам)
- Запустить `scripts/validate_kb_schema.py` для проверки

**Коммит:** `fix(kb): S16 P4 — verifier corrections for Round 4/5 Chinese EV brands`.

---

## Приоритет 5 — Ещё 30 full articles (6-10 часов, опционально)

Если хватает времени и лимита GLM — расширить до 80 full articles.

### 5.1 Топ-30 модели не покрытые

**Hyundai/Kia (5):**
- Hyundai Grand Starus (2021+)
- Hyundai Palisade LX2
- Kia Cerato BD (2018+)
- Kia Seltos SP2 (2019+)
- Kia Soul SK3 (2018+)

**Toyota/Lexus (5):**
- Toyota RAV4 XA50 (2019+) — 2.0 M20A-FKS
- Toyota LC 300 J300 (2021+)
- Lexus LX 570/600 URJ200/VJA310
- Lexus GX 460
- Lexus NX AZ20 (2021+)

**BMW (5):**
- BMW 7 Series G11/G12
- BMW 1 Series F40
- BMW X5 G05
- BMW X7 G07
- BMW M3/M4 F80/F82

**Mercedes (3):**
- Mercedes GLC X253
- Mercedes S-Class W222
- Mercedes GLE W167

**Porsche/Audi (3):**
- Porsche Cayenne 9YA
- Audi A6 C8
- Audi Q7 4M

**VW/Skoda (3):**
- VW Passat B8
- Skoda Kodiaq NS7
- Skoda Karoq NU7

**Китайцы (5):**
- Chery Tiggo 7 Pro
- Chery Tiggo 4 Pro
- Geely Atlas NL3
- Geely Coolray SX11
- Tank 300

**Lada (1):** Lada Niva Travel

### 5.2 Стратегия batch

Делать batch'ами по 5 статей параллельно (batch 11-16). Проверенный паттерн работы GLM:
- `max_tokens=1500`, `temperature=0.1`
- System: "Выводи ТОЛЬКО готовую статью..."
- Давать черновик 6 секций с фактами → GLM переписывает cohesive
- Валидация после каждого batch + укорачивание если >2500 chars

### 5.3 Цель

- 80 full articles в `_articles/` (+30 от текущих 50)
- 25 брендов покрыто (+6 новых)
- Обновить `_articles_index.json`
- Обновить 30 situations.json с full_article_path

---

## Приоритет 6 — P2.4 YouTube Videos (6-8 часов)

### 6.1 Подготовка API

- Получить YouTube Data API v3 key (у пользователя запросить)
- Сохранить в `.env` как `VITE_YOUTUBE_API_KEY` (frontend) или `GOOGLE_API_KEY` (scripts)
- В `scripts/youtube_search.py` реализовать поиск:

```python
def search_videos(query, api_key, max_results=5):
    url = 'https://www.googleapis.com/youtube/v3/search'
    params = {
        'part': 'snippet',
        'q': query,
        'type': 'video',
        'videoDuration': 'medium',
        'relevanceLanguage': 'ru',
        'maxResults': max_results,
        'key': api_key,
    }
    ...
```

### 6.2 Генерация videos для топ-100

Для каждой generation path:
- Запрос: `"<brand> <model> <gen_year> <top_problem>"`
- Топ-5 видео по relevance
- Фильтр: длительность 5-30 мин, ru-язык
- Извлечь: videoId, title, channel, duration, viewCount

Output: `llcar-dashboard/public/data/kb/<brand>/<model>/<gen>/videos.json`

### 6.3 VideosList компонент

Создать `llcar-dashboard/src/components/kb/VideosList.tsx`:
- Загрузить `videos.json` для текущей generation
- Рендер карточек с iframe YouTube embed или thumbnail + link
- Фильтр по типу (repair/review/diagnostic)

### 6.4 Интеграция в KnowledgeBase

Добавить таб "Видео" рядом с "Ситуации" и "Поиск по DTC".

**Коммит:** `feat(kb): S16 P6 — YouTube videos integration (scripts + VideosList)`.

---

## Приоритет 7 — P3.1 E2E tests Playwright (3-4 часа)

### 7.1 Setup

```bash
cd llcar-dashboard
npm install -D @playwright/test
npx playwright install chromium
```

### 7.2 Tests

`e2e/kb-rendering.spec.ts`:
```typescript
test('DtcSearch returns situations for P0300', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Поиск по DTC' }).click()
  await page.getByPlaceholder('Введите код DTC').fill('P0300')
  await page.keyboard.press('Enter')
  await expect(page.getByText('183 ситуации')).toBeVisible()
})

test('FullArticle renders 6 sections', async ({ page }) => {
  await page.goto('/diagnostics')
  // выбрать Hyundai Solaris HC
  // открыть hyundai_solaris_hc_01
  await expect(page.getByText('Симптомы')).toBeVisible()
  await expect(page.getByText('Техническая причина')).toBeVisible()
  // ... все 6 секций
})

test('62 brands load', async ({ page }) => {
  await page.goto('/diagnostics')
  const options = await page.locator('select[name="brand"] option').count()
  expect(options).toBeGreaterThanOrEqual(62)
})
```

### 7.3 CI

Добавить в `.github/workflows/ci.yml` step:
```yaml
- name: Run Playwright
  run: npx playwright test
```

**Коммит:** `test(kb): S16 P7 — Playwright E2E tests (62 brands, DtcSearch, FullArticle)`.

---

## Приоритет 8 — Server deploy (3-5 часов)

### 8.1 Инспекция сервера

```bash
ssh llcar@185.55.57.145
# проверить:
# - ls /srv/llcar/kb/ — если есть, KB читается из файлов
# - psql -U llcar -d llcar -c "\dt" — если kb_situations таблица, читается из БД
# - cat /etc/nginx/sites-enabled/llcar.conf
# - systemctl status llcar-backend gunicorn nginx
```

### 8.2 Вариант A: rsync файлов

Если backend читает `/srv/llcar/kb/`:

```bash
rsync -avz --delete \
  --exclude='.omc' --exclude='.git' --exclude='node_modules' \
  llcar-dashboard/public/data/kb/ \
  llcar@185.55.57.145:/srv/llcar/kb/

# Перезапуск backend
ssh llcar@185.55.57.145 "sudo systemctl restart llcar-backend gunicorn"
```

### 8.3 Вариант B: Django migrate

Если в БД:

```bash
ssh llcar@185.55.57.145
cd /srv/llcar
python manage.py import_situations --source=/srv/llcar/kb/ --dry-run
python manage.py import_situations --source=/srv/llcar/kb/
```

### 8.4 Frontend build deploy

```bash
cd llcar-dashboard
npm run build
rsync -avz dist/ llcar@185.55.57.145:/srv/llcar/www/dashboard/
```

### 8.5 Smoke test

```bash
curl https://llcar.ru/api/kb/brands | jq '. | length'  # 62
curl https://llcar.ru/api/kb/dtc/P0300 | jq '.situations | length'  # 183
curl -I https://llcar.ru/ | head -2  # 200 OK
```

**Коммит:** `deploy: S16 P8 — sync KB + dashboard build к 185.55.57.145`.

---

## Приоритет 9 — Memory cleanup и handoff (30 мин)

### 9.1 Обновить memory

- `project_session16_progress.md` — новый файл с итогом
- `MEMORY.md` — добавить ссылку
- Если статей стало 80 — обновить также `_articles_index.json` с полным списком

### 9.2 Обновить SESSION-HANDOFF.md

Перезаписать как "Session 16 COMPLETE".

### 9.3 Финальный коммит

```bash
git commit -m "docs: Session 16 COMPLETE handoff"
```

---

## Порядок выполнения (3-дневный план)

### День 1 (8 часов) — Критичные интеграции
1. **P1** Visual QA + build (2 ч)
2. **P2** DtcSearch integration (4 ч)
3. **P3** Schema issues fix (2 ч)
4. Коммит всё

### День 2 (8 часов) — Расширение и тесты
5. **P4** Verifier в фоне (запустить, проверять каждые 2 ч)
6. **P5** +30 full articles batch 11-16 (6 ч)
7. **P7** E2E tests (2 ч)
8. Коммит

### День 3 (6 часов) — Продакшн
9. **P8** Server deploy (3 ч)
10. **P6** YouTube (3 ч — может перенестись в S17)
11. **P9** Memory + handoff (30 мин)

---

## Метрики успеха Session 16

| Метрика | Старт | Цель |
|---------|-------|------|
| Full articles | 50 | **80** (stretch) |
| Frontend integration | компоненты созданы | **DtcSearch + видео подключены** |
| E2E tests | 0 | **3-5 Playwright tests** |
| Schema validation | 51 issue | **0 issues** |
| Server sync | не сделан | **KB + build на prod** |
| Verifier новых брендов | 0/7 | **7/7** |

---

## Риски и митигации

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Build ломается после интеграции новых компонентов | Средняя | TypeScript clean проверен в S15, но нужен runtime-test |
| DtcSearch callback сложный (нужно expand ситуации) | Средняя | Упростить: просто сохранить vehicleProfile, пользователь сам откроет |
| YouTube API квоты (10000 units/day) | Высокая | Делать по 100 запросов за batch, кэшировать результаты |
| Server backend структура неизвестна | Высокая | SSH-инспекция до любых действий |
| Volvo коды потребуют ручной правки | Средняя | Lazy вариант — расширить allowlist в validate_kb_schema.py |

---

## Команды для быстрого старта Session 16

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы"

# 1. Состояние
git status
git log --oneline | head -20
python scripts/validate_full_articles.py  # 50/50
python scripts/validate_kb_schema.py 2>&1 | tail -3  # 51 issues

# 2. Dev server
cd llcar-dashboard
npm run dev
# Открыть http://localhost:5173/diagnostics

# 3. Build test
npm run build
npm run preview

# 4. E2E setup (позже)
npm install -D @playwright/test
```

---

## Файлы, которые будут созданы в S16

1. `llcar-dashboard/e2e/kb-rendering.spec.ts` — E2E tests
2. `scripts/youtube_search.py` — YouTube API
3. `scripts/validate_video_links.py` — проверка что видео не удалены
4. `llcar-dashboard/src/components/kb/VideosList.tsx` — рендер видео
5. `llcar-dashboard/public/data/kb/<brand>/<model>/<gen>/videos.json` — 100 файлов
6. 30 новых файлов в `_articles/` (batch 11-16)
7. `memory/project_session16_progress.md`
8. Обновлённый `SESSION-HANDOFF.md`

---

## Итог Session 16 (ожидаемый)

**KB становится production-ready:**
- 80 full articles на 25 брендов
- DtcSearch + VideosList + FullArticle интегрированы в KnowledgeBase
- E2E tests + schema validator в CI
- Deploy на llcar.ru работает
- Verifier подтвердил качество Round 4/5 брендов
- YouTube API снабжает 100 моделей видео-контентом

После S16 можно открывать KB для публичного beta-теста.

---

*Создано 2026-04-14 после Session 15 COMPLETE (50/50 full articles + frontend компоненты готовы к интеграции).*
