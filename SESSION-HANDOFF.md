# SESSION HANDOFF — 2026-04-08 (Session 6)

> **Ветка:** `dashboard-v3`
> **Тесты:** `cd dashboard_build && python -m pytest tests/ -v` → **448 pass**
> **Frontend:** `cd llcar-dashboard && npm run build` → **108KB main bundle**
> **Сервер:** 185.55.57.145, SSH: `/tmp/llcar_ssh.sh`, SCP: `/tmp/llcar_scp.sh`

---

## ВЫПОЛНЕНО В SESSION 6

### Phase 1: V2 Activation
- `useV2Api: true` (default ON), V1/V2 toggle hidden in Expert mode
- Dashboard Overview uses V2 health_scores (fixes Электрика -1 bug)
- Clean build: 42→12 files on server
- Duplicate gunicorn (webadmin) killed, restarted with --reload

### Phase 2: Light Theme CSS Variables
- 280 lines !important → 50+ CSS variables in :root / body.light-mode
- theme.ts exports var() references → ALL components auto-adapt
- InstrumentCard: 13 hardcoded colors → CSS variables
- Verified dark + light via Playwright

### Phase 3: Backend
- Health Score v2: weighted severity(0.5-5) × confidence × persistence(1+0.1*level)
- Rules: 81→110 (22 JSON + 2 Python). PHEV/BEV, DTC-boost, seasonal, combined
- recalls_checker: lru_cache (6271-line JSON parsed once)
- Correlation cron: Django management command run_correlations.py

### Phase 4: Code Quality
- TypeScript strict mode: 0 errors
- Code-splitting: main bundle 2.7MB → 108KB (28KB gzip)
- Three.js/ECharts/Leaflet lazy-loaded separate chunks
- New DigitalTwinCanvas.tsx wrapper for lazy Canvas
- Deleted unused: AccelSphere.tsx, TelemetryCard.tsx

### Phase 5: CustDev UI Features (in progress)
- BaselineStatus widget (КАЛИБРОВКА) — DONE
- Vehicle onboarding questionnaire — IN PROGRESS (agent)
- Linked params with scales in diagnosis cards — IN PROGRESS (agent)
- Share report (Telegram, link, PDF) — IN PROGRESS (agent)
- Wear % indicators in health bars — IN PROGRESS (agent)

### Commits
1. `7a409a4` — V2 default, light theme, Health Score v2, 110 rules, CustDev 3 docs
2. `60ca482` — TypeScript strict, code-splitting (2.7MB→108KB), InstrumentCard light
3. (pending) — CustDev UI features

### Totals
- Tests: 448 pass (was 438)
- Rules: 110 (was 81)
- Main bundle: 108KB (was 2.7MB)

---

## СЕРВЕР

1. **SSH:** `/tmp/llcar_ssh.sh "команда"`
2. **SCP:** `/tmp/llcar_scp.sh файл webadmin@185.55.57.145:путь`
3. **Gunicorn:** webadmin with --reload (started Apr 08), www-data systemd (old, from Apr 04)
4. **Reload:** `touch /var/www/html/django/llcar/wsgi.py`
5. **DB:** `PGPASSWORD=postgres psql -U postgres -d vehinfo`

---

## CustDev FINDINGS → UI MAPPING

| CustDev Insight | P | Status |
|-----------------|---|--------|
| "Безопасно ли ехать?" — first line | P0 | DONE (can_drive badge) |
| Объяснение > данные | P0 | DONE (explanations in Russian) |
| Светофор нормы (зел/жёл/красн) | P0 | DONE (health bars + colors) |
| DTC расшифровка + стоимость | P0 | DONE (diagnoses + price_range) |
| Маршрут ремонта (чеклист) | P0 | DONE (repair_roadmap) |
| Онбординг-анкета (марка/модель) | P0 | IN PROGRESS |
| Связанные параметры шкалами | P1 | IN PROGRESS |
| Шаримый отчёт (вирусный механизм) | P1 | IN PROGRESS |
| % изношенности | P1 | IN PROGRESS |
| Connection Wizard + адаптеры | P0 | TODO |
