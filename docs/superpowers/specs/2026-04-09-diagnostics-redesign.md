# Diagnostics Page Full Redesign — Design Spec

**Дата:** 2026-04-09
**Источник:** GLM-5V анализ + code review + обратная связь пользователя
**Проблема:** "Вкладка Диагностика выглядит убого — всё разбросано, правила сжатые, ничего непонятно"

---

## 1. Текущие проблемы (GLM + пользователь)

### Layout
- **"Kitchen Sink"** — все панели одного веса, нет визуальной иерархии
- 3D-граф (SmartSphere) конкурирует с текстом правил и чатом
- Timeline визуально тяжёлый но информационно пустой
- Нет Z-pattern читаемости (герой → детали → действия)

### Правила
- Выглядят как `<ul>` список — не вызывают доверие
- Сырые условия типа `az_std > 3` непонятны пользователю
- Нет группировки по системам
- Нет визуальных индикаторов верификации

### Графики
- NVH спектр "как Winamp из 2003" — нет привязки к авто
- 3D вибрация — perspective distortion мешает сравнению
- Нет исторического сравнения

### Отсутствует
- Изометрия/схема автомобиля с heatmap
- "Текущее vs прошлое" (baseline comparison)
- Оценка стоимости риска
- LIVE индикатор реального времени

---

## 2. Новый Layout (Z-Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│ ROW 0: Trust Bar — "103 правила • 8 систем • LIVE"          │
├───────────────────────────────┬──────────────────────────────┤
│ ROW 1: HERO (col-span-8)     │ CONTEXT (col-span-4)         │
│                               │                              │
│  DiagnosisCardV2              │  System Checklist             │
│  (Health Score, diagnoses,    │  (4 системы, светофор)        │
│   can-drive, roadmap)         │                              │
│                               │  Health Bars (per system)     │
│  [Запустить диагностику]      │                              │
│                               │  Quick Stats                 │
├───────────────────────────────┴──────────────────────────────┤
│ ROW 2: VISUAL INSTRUMENTS (col-span-12)                      │
│ ┌──────────┬──────────────┬──────────────┐                   │
│ │SmartSphere│ AudioSpectrum│ AnomalyLine  │                  │
│ │ 3D Vibr. │ NVH Спектр   │ Timeline     │                  │
│ └──────────┴──────────────┴──────────────┘                   │
├──────────────────────────────────────────────────────────────┤
│ ROW 3: TRUST ENGINE (col-span-12)                            │
│                                                              │
│  ┌─ Stats Header ─────────────────────────────────────────┐  │
│  │ 103 правила │ 8 систем │ 24 статьи │ T1/T2/T3 legend  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ System Groups (collapsible cards) ────────────────────┐  │
│  │ 🛞 Подвеска (18 правил)  ⚙ Двигатель (4)              │  │
│  │ ⚡ Электрика (13)        ⛽ Топливо (10)               │  │
│  │ ❄ Охлаждение (16)       🔊 Шумы (1)                   │  │
│  │ 🔄 Трансмиссия (...)     📋 Общее (41)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  Each rule: title + human-readable condition + tier badge     │
│  + DTC codes + confidence indicator                          │
│                                                              │
├──────────────────────────────┬───────────────────────────────┤
│ ROW 4: TOOLS (col-span-6)    │ SUPPORT (col-span-6)          │
│  OBD Setup (5 шагов)         │  Chat с диагностом            │
│  DiagnosticSearch             │  (stub → LLM будущее)         │
│  Expert mode panels           │                               │
└──────────────────────────────┴───────────────────────────────┘
```

---

## 3. Компонент: RulesList v2 (Trust Engine)

### 3.1 Trust Header
Крупные цифры в HUD-стиле:
- **103** правила проверки (Share Tech Mono, 28px, cyan glow)
- **8** систем автомобиля (с иконками)
- **24** диагностические статьи
- T1/T2/T3 legend с пульсирующими точками

### 3.2 System Groups
Правила группируются по 8 системам. Каждая группа = collapsible GlassPanel:
- Header: иконка + название + кол-во правил + tier distribution bar
- При раскрытии: карточки правил

### 3.3 Rule Card
Каждое правило:
- Tier dot (пульсирующий для T1) + Tier badge
- Название на русском
- **Человеческие условия:** `az_std > 3` → "Стд. откл. вибрации Z > 3 м/с²"
- DTC-коды как clickable badges
- При раскрытии: детальное описание

### 3.4 CONDITION_LABELS map (35+ параметров):
```
az_std → "Стд. откл. вибрации Z"     (м/с²)
coolant_temp → "Т° охл. жидкости"     (°C)
voltage → "Напряжение борт. сети"     (В)
LTFT_B1 → "Долгоср. корр. топлива Б1" (%)
rpm → "Обороты двигателя"             (об/мин)
total_vibration → "Общая вибрация"    (м/с²)
dominant_freq → "Доминантная частота" (Гц)
```

---

## 4. Визуальные улучшения

### 4.1 Объёмность
- Rim light: 1px highlight top/left, shadow bottom/right на каждой панели
- Bloom/glow за 3D-графиком
- Floating shadow под SmartSphere (`box-shadow: 0 20px 50px rgba(0,0,0,0.5)`)

### 4.2 Цветовая согласованность
- Unified warning = #eab308 (не оранжевый)
- Unified danger = #ef4444
- Tier T1 пульсирует как heartbeat

### 4.3 Timeline
- Скруглённые углы (сейчас прямые)
- Shimmer-анимация для "живого" ощущения

---

## 5. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/pages/Diagnostics.tsx` | Полная перекомпоновка layout (Z-pattern) |
| `src/components/diagnostics/RulesList.tsx` | Полная переделка → Trust Engine |
| `src/styles/glass.css` | Добавить rim-light, bloom, timeline roundness |
| `src/components/panels/AnomalyTimeline.tsx` | Скруглить, shimmer |

---

## 6. НЕ делаем сейчас (следующие сессии)
- Изометрия автомобиля с heatmap (нужна 3D модель)
- Waterfall спектрограмма (сложный ECharts компонент)
- Parallax depth layers
- Particle system data→insight→action
- NVH привязка к конкретным системам авто
