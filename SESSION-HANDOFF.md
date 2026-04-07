# SESSION HANDOFF — 2026-04-06 (Session 2 END)

> Прочитай MEMORY.md + `memory/project_dashboard_v8_phase4.md` + `memory/feedback_quality_rush.md`
> **Live:** https://llcar.ru/v2/
> **Old dashboard (reference):** https://llcar.ru/

---

## КРИТИЧЕСКИЕ ФИКСЫ — ДЕЛАТЬ ПЕРВЫМ ДЕЛОМ

### 1. 3D Акселерометр — ПОЛНАЯ ЧУШЬ, ПЕРЕДЕЛАТЬ
**Файл:** `src/components/three/AccelSphere.tsx` + `src/pages/Diagnostics.tsx`
**Проблема:** 
- Подписи осей слипаются в кучу: "X бокZ вертY перед"
- Точки хаотичные, нет паттерна, непонятно что показывают
- "1500 точек" в badge но "200 точек" в легенде — противоречие (MAX_POINTS=200, API возвращает больше)
- Σ: 13.8 м/с² красным — пользователь не знает хорошо это или плохо
- Сфера вращается — неудобно читать подписи
**Данные API:** `{x_std: 5.16, y_std: 5.23, z_std: 5.92}` — это STD вибрации (не средние, gravity в avg). Нормальный STD при стоянке ~0.3-1.0, при езде ~2-5, при тряске >8
**Решение:** Заменить 3D scatter на 2D визуализацию:
- Проекции XZ и YZ как на профессиональных NVH инструментах
- Или простой bar chart: X/Y/Z столбики с зонами (зелёная <2, жёлтая 2-5, красная >5)
- Подписи понятные: "Боковая", "Продольная", "Вертикальная"
- Число Σ с пояснением: "13.8 м/с² — ПОВЫШЕННАЯ" или "0.5 м/с² — НОРМА"
**Референс:** Старый дашборд llcar.ru/ имел легенду: "X крен, Y разг, Z мыш. Плотно = ок, разброс = тряска"

### 2. NVH Спектр — НИЧЕГО НЕ ВИДНО
**Файл:** `src/components/panels/AudioSpectrum.tsx`
**Проблема:**
- График мелкий, 10 точек за 7 дней — stacked area выглядит как мусор при малых данных
- 4 зоны сливаются, легенда обрезается
- Quality gauge 30 — красный кружок без объяснения что это
- Y ось 0-12000 — числа огромные, пользователю ни о чём не говорят
**Данные API:** `audio: [{ts, freqs: [[31,2419],[78,-996],[101,-1030],[148,-1486],[179,-1560]], quality: 100}]`
- freqs = пары [частота_Hz, амплитуда] (амплитуда бывает отрицательная, Math.abs уже добавлен)
- quality = 0-100 (качество микрофона)
**Решение:**
- При малом количестве данных (<20) → bar chart по зонам вместо timeline
- Подписи зон по-русски крупнее: "Дорога <100Гц", "Двигатель 100-300Гц" и т.д.
- Quality объяснить: "Кач. микрофона: 30% — ПЛОХО"
- Уменьшить Y ось до реального диапазона данных

### 3. Мобильная версия — гамбургер ☰ не открывается
**Файл:** `src/layouts/MainLayout.tsx`
**Проблема:** На iOS Safari кнопка ☰ не реагирует на нажатие. Min-width/min-height 44px уже добавлены, но может быть проблема с z-index или overflow.
**Sidebar:** `fixed top-0 right-0 w-[85vw] z-50` — возможно перекрывается чем-то

### 4. Trips на мобилке — список поездок не виден
**Файл:** `src/pages/Trips.tsx` + `src/styles/glass.css`
**Проблема:** На мобилке grid стекается вертикально, но sidebar (список поездок) скрывается или слишком маленький. Карта занимает весь экран.

---

## ЧТО РАБОТАЕТ НОРМАЛЬНО
- **Dashboard:** Health Score 100, НОРМА, зелёные полоски, 3D модель авто, инструменты
- **Диагностика:** DiagnosisCard (Утечка выхлопа 31.9%), Подсистемы (100/100/100/100), EXPERT mode (CoherenceMap + CUSUM)
- **Поездки:** 2GIS карта, 6 поездок, маршруты, auto-center, weather icons
- **Sidebar:** ECU модули (4 шт), DTC коды (нет ошибок), voltage
- **Header:** LLCARE logo, ◈ Обзор | ⬡ Диагностика | ◇ Поездки, зелёная анимированная линия
- **i18n:** Все на русском (стоянка, холостой, м/с², правила диагностики)

---

## API — ВСЕ ДАННЫЕ ЕСТЬ

```
GET /api/data/?client=362f5a4a5f95127723509e28c392850f&minutes=10080&tab=overview&limit=500
→ accel: 30 samples, audio: 10 samples, pids: 10 samples

GET /api/anomaly/?client=362f5a4a5f95127723509e28c392850f&minutes=10080
→ overall: 99, suspension: 98, engine: 100, electrical: 100, audio: 100
→ diagnostics: 7 rules (exhaust_leak 31.9% единственный флаг)
→ regime: idle, road_type: standstill

GET /api/anomaly/history/?client=362f5a4a5f95127723509e28c392850f&days=7
→ history: 1-2 points (только начали накапливаться)

GET /api/diagnostics/?client=362f5a4a5f95127723509e28c392850f&minutes=10080
→ ecu: {7e8: ДВС, 7ea: Электромотор, 7eb: BMS, 7ef: Охлаждение}, dtc: no_codes

GET /api/trips/?client=362f5a4a5f95127723509e28c392850f&minutes=10080
→ 6 trips с route points (lat/lng/vib/speed)
```

---

## ВСЕ ФАЙЛЫ ПРОЕКТА

```
llcar-dashboard/
  vite.config.ts          — base: '/static/spa/'
  src/
    App.tsx               — Router: Dashboard | Diagnostics | Trips
    theme.ts              — Цветовая палитра
    styles/glass.css      — Glassmorphism, nav, mobile responsive, dark-tiles filter
    stores/dashboardStore.ts — Zustand: activeTab, timeRange, clientHash, expertMode, sidebarOpen
    hooks/useApiData.ts   — Универсальный fetch hook с polling
    layouts/MainLayout.tsx — Header (LLCARE, nav, connection status, hamburger), sidebar, breathing orbs
    pages/
      Dashboard.tsx       — Health Score + 3D Twin + Instruments + Status bar
      Diagnostics.tsx     — AccelSphere + AudioSpectrum + DiagnosisCard + Subsystems + Timeline + Expert
      Trips.tsx           — Leaflet + 2GIS tiles + MapController fitBounds + trip list
    components/
      three/
        CarWireframe.tsx  — GLTF модель Li7 с wireframe material
        AccelSphere.tsx   — 3D scatter (НУЖНО ПЕРЕДЕЛАТЬ)
        SceneSetup.tsx    — Lights, particles, grid, bloom, N8AO, fog
        FloatingMetrics.tsx — Legacy 3D HUD (не используется)
        Hotspot.tsx       — Pulsing diagnostic markers
      panels/
        InstrumentCard.tsx — RPM, Speed, Coolant, Vibration gauges
        AudioSpectrum.tsx  — 4-zone NVH chart (НУЖНО ПЕРЕДЕЛАТЬ)
        DiagnosisCard.tsx  — Confidence bars + degradation + CUSUM dots
        AnomalyTimeline.tsx — ECharts history с regime фоном
        CoherenceMap.tsx   — 10x3 heatmap audio×vibration
        CUSUMChart.tsx     — 3 SVG arc gauges + trend + status banner
        TelemetryCard.tsx  — Generic metric card
      sidebar/
        SidebarContent.tsx — ECU overview, DTC codes, alerts, voltage sparklines
      shared/
        GlassPanel.tsx    — Glassmorphism container (inline backdrop-filter fix)
        HealthBar.tsx     — Segmented bar with offline support
        StatusBadge.tsx   — OK/WARNING/CRITICAL/OFFLINE badges
        StatusPills.tsx   — Compact system status pills
        WeatherWidget.tsx — Weather icon + temp
  public/
    models/car.glb       — 3D модель (3.2MB)
    llcar-logo.png       — Логотип
```

---

## БЭКЕНД (на сервере 185.55.57.145)

```
/var/www/html/django/dashboard/
  views.py      — api_data, api_anomaly (PATCHED: minutes param), api_trips, api_diagnostics, dashboard_v2
  anomaly_engine.py — Regime classifier, baselines, scoring, 7 diagnostic rules (ВСЕ НА РУССКОМ), CUSUM
  shape_decoder.py  — QTP bitfield decoder
  urls.py       — /v2/, /api/data/, /api/anomaly/, /api/anomaly/history/, /api/trips/, /api/diagnostics/
```

**ВАЖНО:** anomaly API был пропатчен через sed на сервере:
- `minutes` параметр (default 10080 вместо 10)
- Все display names на русском

---

## DEPLOY

```bash
# SSH setup (если не настроен)
eval $(ssh-agent -s) && echo "webadmin" | ssh-add /tmp/id_ed25519

# Build + Deploy
cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard"
rm -rf dist && npm run build
/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa/
/tmp/llcar_ssh.sh "chmod -R a+r /var/www/html/django/static/spa/ && find /var/www/html/django/static/spa/ -type d -exec chmod a+x {} \;"

# Reload backend (если менял views.py/anomaly_engine.py)
/tmp/llcar_ssh.sh "touch /var/www/html/django/llcar/wsgi.py"
```

---

## ПОДХОД К РАБОТЕ (КРИТИЧЕСКИ ВАЖНО)

1. **НЕ ГНАТЬ ФИЧИ.** Сделал → проверил с реальными данными → довёл до ума → следующий
2. **Сравнивать с llcar.ru/** — старый дашборд показывает данные ПОНЯТНО
3. **Понимать формат данных** перед визуализацией (x_std ≠ acceleration, gravity ≠ vibration)
4. **Мобильная версия** — проверять на 390px КАЖДЫЙ деплой
5. **Все надписи на русском** — никакого английского в UI
