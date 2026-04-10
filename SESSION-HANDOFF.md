# SESSION HANDOFF — Session 10 Complete (39 коммитов)

## Статус: ВСЁ РАБОТАЕТ. Единая 3D сцена на всех вкладках.

---

## АРХИТЕКТУРА ТЕКУЩЕЙ СИСТЕМЫ

### Frontend (llcar-dashboard)
- **Стек**: React 19 + TypeScript + Vite 8 + Three.js 0.183 + @react-three/fiber 9.5
- **Деплой**: `/var/www/html/django/static/spa-v3/` на 185.55.57.145
- **Build**: `cd llcar-dashboard && rm -rf dist && npm run build`
- **Deploy**: `scripts/deploy-v3.sh --skip-build --frontend-only`
- **Роутинг**: `/` = Diagnostics (главная), `/kb`, `/dtc`, `/resources`, `/pricing`
- **Вкладка Авто удалена** — VehicleInfo теперь в табе Обзор

### Backend (Django)
- **Сервер**: 185.55.57.145, SSH: `/tmp/llcar_ssh.sh`
- **DB**: PostgreSQL/TimescaleDB
- **API**: `/api/v2/diagnose-latest/`, `/api/data/`, `/api/anomaly/`
- **Gunicorn**: reload через `touch wsgi.py`

### 3D сцена (DiagnosticTwinCanvas.tsx)
- **Модель**: `public/models/car.glb` (Li7/Kia Rio, 109 materials, 8 категорий)
- **Камера**: `[5, 2.5, 5]`, fov 38, autoRotate=false, ручное вращение включено
- **CarWireframe**: clone scene → classifyByNode (подчёркивания!) → getHoloMaterial(cat, 'default')
- **Все части ВСЕГДА видны**: без dimming, без скрытия interior/tire
- **AccelWaves**: дорога-конвейер, 6 препятствий, per-wheel bounce, ВСЕГДА видны
- **AudioZones3D**: 6 NVH зон, сферические волны 1/r, ВСЕГДА видны
- **Hotspots**: Двигатель спереди, Подвеска внизу, Электрика справа-спереди, Аудио слева
- **Bloom + Vignette**: отключены на мобильных (<768px)

### Материалы GLB (materialClassifier.ts)
- **8 категорий**: glass, body, chrome, tire, interior, engine, light, other
- **classifyByNode()**: русские имена с подчёркиваниями (Шина_ПЛ, Тормоз_ЗП)
- **Дверная_карта → body** (не interior, чтобы двери были одного цвета)
- **Все материалы default state** — active/dimmed убраны

### Wheel refs (per-wheel bounce)
- **4 угла**: ПЛ, ПП, ЗЛ, ЗП
- **Меши**: Шина_XX, Тормоз_XX, Колесо_XX_—_Обшивка/Отделка/Резиновая_накладка
- **Bounce**: body lerp 0.15 (slow), wheel lerp 0.55 (fast)
- **Вращение колёс НЕ работает** — geometry в мировых координатах, нужен Blender pivot fix

### Audio zones (6 NVH источников)
| Зона | Позиция | Цвет | Частоты | waveSpeed | maxRadius |
|------|---------|------|---------|-----------|-----------|
| Дорога | [0.8,-0.5,1.8] | #60a5fa blue | 0-80Hz | 0.3 | 1.4 |
| Двигатель | [0,0.2,2.0] | #4ade80 green | 80-150Hz | 0.5 | 1.6 |
| Трансмиссия | [-0.8,-0.4,0] | #22d3ee cyan | 150-300Hz | 0.4 | 1.2 |
| Навесное | [-1.3,0.3,1.4] | #f59e0b amber | 300-600Hz | 0.6 | 1.0 |
| Подшипники | [1.4,-0.2,-0.8] | #f97316 orange | 600-2kHz | 0.7 | 0.9 |
| ВЧ шум | [0.8,1.0,-1.5] | #ef4444 red | >2kHz | 0.9 | 0.7 |

### Obstacle типы и цвета
| Тип | Цвет | Описание |
|-----|------|----------|
| pothole_l/r | #00e5ff cyan | Яма слева/справа |
| bump | #4ade80 green | Лежачий полицейский |
| brake | #ff4444 red | Торможение (pitch 0.05, дорога до 3%) |
| rut | #f59e0b amber | Колея |
| joint | #a78bfa purple | Стык дороги |

### Layout (Diagnostics.tsx)
- **Tab bar**: внутри 3D viewport, glass overlay, порядок: Подвеска → Двигатель → Электрика → Аудио → Обзор
- **Default tab**: Подвеска
- **Подвеска**: SuspensionTab (full) → SmartSphere (full) → RulesList(Подвеска)
- **Двигатель**: DiagnosisCardV2 (full) → RulesList(Двигатель)
- **Электрика**: DiagnosisCardV2 (full) → RulesList(Электрика)
- **Аудио**: AudioTab (full) → AudioSpectrum (full) → RulesList(Шумы)
- **Обзор**: VehicleInfo → DiagnosisCardV2 → Baseline+Timeline → Инсайты → Поиск+Правила → Чат
- **Левый overlay**: 150px, здоровье + системы (скрыт на мобильных)
- **Правый overlay**: 200px, диагнозы (скрыт на мобильных)
- **Легенда внизу**: Вибрации (solid dots) | Аудио зоны (ring dots)

### Мобильная версия (<768px)
- Оба overlay скрыты (display: none)
- Grid: single column (flex-direction: column)
- Viewport: 320px height
- Glass panels: 10px padding
- Tab bar: 0.45rem, scrollable

### Store (dashboardStore.ts)
- clientHash: 'b5f2f64851802f4859a3ffe3eda4b2d5' (auto-select)
- timeRange: 10080 (7 дней)
- useV2Api: true
- isDarkMode: true

### Инструменты установленные
- **OpenClaude v0.1.8**: `~/openclaude-glm.sh`
  - Endpoint: `https://api.z.ai/api/coding/paas/v4`
  - API Key: `75f455cb5c3143cda67ddfe97294c8be.MKFeHrD84JtgbSrO`
  - Model: glm-5, OPENAI_MAX_TOKENS=32768
  - Через подписку z.ai (бесплатно)
- **OMC v4.11.4**: глобально в ~/.claude/CLAUDE.md
  - HUD: ~/.claude/hud/omc-hud.mjs → settings.json statusLine
  - Config: ~/.claude/.omc-config.json (ultrawork default)
- **Playwright MCP**: для визуальной проверки
- **GLM Vision MCP**: для дизайн-анализа скриншотов
- **Blender MCP**: для работы с 3D моделями

---

## ЧТО ОСТАЛОСЬ СДЕЛАТЬ

### Приоритет 1 — Dashboard V3 (визуал + данные)

**1. Данные в 3D сцену**
- GLM анализ уже сделан (код от GLM Vision готов)
- Верхняя зона: мини-индикаторы (Т° ОЖ, напряжение, педаль газа)
- Нижняя зона: спарклайны RPM/Temp за 60 сек + event ticker
- Левая боковина: CAN-Bus топология (ECU → ABS → Body)
- Правая боковина: прогноз обслуживания (тормозные колодки, АКБ)
- Реализовать как HTML overlay поверх Canvas

**2. Дизайн соответствие V2**
- Пользователь хочет чтобы V3 визуально соответствовал https://llcar.ru/v2/
- Цвета: cyan #00e5ff, teal #64ffda, bg #0c1220
- Эффекты: glow, scanlines, glass morphism
- Скриншот V2 сделан (v2-reference.png)

**3. Деградации + выбор периода**
- В левой панели SystemCard compact: показать тренд деградации
- SystemCard уже обновлён (sparkline + trend arrow) но на сервере не видно изменения
- Добавить pills выбора периода: 1ч / 24ч / 7д / 30д
- Привязать к timeRange из dashboardStore

**4. Правила проверки красочнее**
- RulesList уже имеет gradient фоны по tier
- Добавить: визуальные шкалы параметров (как EvidenceScales в DiagnosisCardV2)
- Hover glow по цвету tier
- Иконки систем ещё крупнее

**5. Мобильная доработка**
- Вертикальная тряска (SuspensionTab) выходит за пределы
- Проверить все вкладки на 390x844

**6. Вращение колёс**
- Текущий GLB: geometry в мировых координатах (origin = 0,0,0)
- runtime rotation невозможна без reparenting
- Нужно: открыть car.glb в Blender, выставить origin каждого колеса в его центр, re-export
- После этого: rotation.x на parent group будет работать

### Приоритет 2 — Knowledge Base

**7. Solutions для 764 ситуаций**
- Таблица situations в PostgreSQL
- Нужно заполнить поле solutions[] для каждой

**8. Brand situations на сервер**
- JSON файлы в data/situations/brands/

**9. Repair roadmaps из DITA мануалов**
- Мануалы в D:\transfer4 (288GB, 58 брендов)
- Парсить DITA → MD → привязать к ситуациям

### Приоритет 3 — Продукт

**10. MAUI мобильное приложение + API V2**
- Архив старой версии: _archive/old-app-v104/
- Нужна новая версия с акселерометром + аудио → streaming на сервер

**11. CustDev 3** — 35 интервью (план есть)

**12. Монетизация** — тарифы, paywall

**13. LLM Chat Widget**
- Заглушка уже есть (ChatPanel)
- Подключить к KB (D:\transfer4): 764 ситуации, 36K DTC
- Backend: Django + LLM API

---

## ПРАВИЛА РАБОТЫ (записаны в memory)
1. **НИКОГДА** не удалять функционал без явного разрешения пользователя
2. **ПЛАНИРОВАТЬ** перед кодом — plan mode обязателен для крупных изменений
3. **Проверять самому** через Playwright перед тем как показывать пользователю
4. **НЕ менять** HUD стиль — он утверждён
5. **V2 = frozen**, V3 = active — НЕ синхронизировать
6. **Deploy ALL chunks** — rm -rf dist перед build
7. **Одно изменение за раз** — не менять то что нравится
