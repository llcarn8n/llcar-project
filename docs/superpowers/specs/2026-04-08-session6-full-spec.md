# Session 6 Full Spec — 2026-04-08

## Scope

All 6 phases, 28 tasks. Full implementation in this session.

---

## Phase 1: Critical UX Fixes (V2 activation)

### 1.1 V2 API = default ON
- `dashboardStore.ts`: change `useV2Api: false` → `useV2Api: true`

### 1.2 Move V1/V2 toggle to Expert-only
- `Diagnostics.tsx`: wrap API toggle in `{expertMode && ...}`
- V2 always active for normal users, V1 accessible only in Expert mode for debugging

### 1.3 Dashboard (Overview) tab → V2 health scores
- `Dashboard.tsx`: add `useDiagnosticV2` hook call
- Replace `anomaly?.overall` with `v2Report?.health_scores.overall`
- Replace `systems[sys]?.score` with `v2Report?.health_scores[sys]`
- Fix Электрика -1 bug (V2 returns real scores, not anomaly_engine)
- Keep 3D car, instruments, status bar as-is (V1 data for OBD telemetry is fine)

### 1.4 Clean build + deploy
- `rm -rf dist && npm run build` (clean old 13-build artifacts)
- SSH: `rm -rf /var/www/html/django/static/spa-v3/static/*`
- SCP: upload fresh dist/* to server
- Verify via Playwright

### 1.5 Kill duplicate gunicorn
- SSH: `kill <webadmin gunicorn PID>` (keep www-data systemd process)
- Touch wsgi.py to reload

---

## Phase 2: Light Theme Redesign

### 2.1 CSS Variables system
- Add `:root` / `body.light-mode` variable blocks to glass.css top
- Variables: `--bg-primary`, `--bg-panel`, `--bg-deep`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-cyan`, `--accent-teal`, `--border-glow`, `--glass-bg`, `--glass-border`, `--status-ok`, `--status-warning`, `--status-critical`
- Dark mode = current hardcoded values
- Light mode = designed light palette

### 2.2 Refactor glass.css
- Replace all 280 lines of `body.light-mode` overrides with `var()` usage
- Remove ALL `!important` declarations
- Remove `[style*="color:"]` attribute selector hacks
- Each `.glass-panel`, `.hud-header`, `.metric-value` etc uses `var(--*)` instead of hardcoded colors

### 2.3 Refactor theme.ts
- Export CSS variable references instead of hardcoded hex
- Or: keep hex for JS-side usage but ensure they match CSS vars

### 2.4 Light theme design
- Background: warm white (#F8FAFC) with subtle teal dot grid (opacity 0.04)
- Glass panels: white bg (0.92 opacity), subtle shadow, teal left border
- Text: slate-800 primary, slate-500 secondary, slate-400 muted
- Accent: teal-600 (#0D9488) instead of cyan (#00E5FF)
- Status: emerald-600 ok, amber-600 warning, red-600 critical
- Glow effects: reduced to subtle shadows in light mode
- 3D scene: light grid, white fog, reduced glow
- Scrollbar: teal-tinted track

### 2.5 Verify with Playwright
- Screenshot dark mode full page
- Screenshot light mode full page
- Compare and fix issues

---

## Phase 3: Backend Improvements

### 3.1 Health Score v2 algorithm
- `diagnosis_builder.py`: replace `_compute_health_scores`
- New formula: `100 - sum(severity_weight[rule.severity] * rule.confidence * persistence_factor) / max_possible`
- Severity weights: info=0.5, low=1, medium=2, high=3, critical=5
- Persistence factor: 1.0 + 0.1 * min(escalation_level, 3)
- Cap at 0-100 range
- Tests: update test_diagnosis_builder.py

### 3.2 Baseline quality widget
- Frontend: new `BaselineStatus.tsx` component
- Shows: progress bar (samples / 200), "Нужно ещё N поездок" if not ready
- Place in Diagnostics V2 section near DiagnosisCardV2
- Data already in API: `report.baseline_status.{ready, total_samples, samples_needed}`

### 3.3 Expand rules 81 → 100+
- `threshold_rules.json`: add 20+ rules:
  - Li Auto PHEV: battery_soc_low, range_extender_overwork, e_motor_temp_high, charging_anomaly
  - DTC-boosted: P0171→lean_boost, P0300→misfire_boost, P0420→cat_efficiency
  - Seasonal: winter_cold_start, summer_overheat_risk
  - Combined: vibration_with_dtc, audio_with_speed_correlation
- `complex_rules.py`: add 2-3 new Python rules
- Tests: add for new rules

### 3.4 Correlation Cron Job
- New file: `dashboard_build/diagnostic/management/commands/run_correlations.py`
- Django management command: `python manage.py run_correlations --client_hash=X`
- Reads last 30min of accel_windows + audio_windows + ecu_7e8
- Joins by time (±3sec tolerance)
- Runs CorrelationEngine.analyze_trip()
- Saves results via save_results()
- Deploy to server, add to crontab: `*/30 * * * *`

### 3.5 Recalls caching
- `recalls_checker.py`: load JSON once at module level (not per-request)
- Use `functools.lru_cache` or module-level singleton
- Reduces I/O from 6271-line JSON parse per request to once at startup

---

## Phase 4: UX Polish

### 4.1 Dashboard (Overview) redesign
- After Phase 1.3 (V2 scores wired), polish the layout
- Health score ring uses V2 overall score
- System bars use V2 per-system scores + trend arrows
- StatusPills show V2 status (not V1 anomaly)
- Remove V1-only feature z-scores from Overview (keep in Diagnostics Expert)

### 4.2 Trips page implementation
- Currently placeholder. Implement basic trip list:
- Fetch `/api/trips/` (existing endpoint)
- Show list of trips with date, duration, distance
- Click trip → show health scores for that trip
- Map view (Leaflet already imported)

### 4.3 Mobile responsive audit
- Playwright: test at 375px, 768px, 1024px, 1440px widths
- Fix any overflow, truncation, or layout breaks
- Ensure sidebar works on mobile
- Ensure all V2 panels stack properly on mobile

### 4.4 Unused components cleanup
- Delete: `WeatherWidget.tsx` (never used)
- Delete: `TelemetryCard.tsx` (never used)
- Delete: `AccelSphere.tsx` (SmartSphere used instead)
- Remove imports if any

### 4.5 Code-splitting for Three.js
- Lazy-load `SmartSphere`, `SceneSetup`, `CarWireframe` via React.lazy()
- Already done for CoherenceMap and CUSUMChart — extend pattern
- Target: main chunk < 500KB

### 4.6 TypeScript strict mode
- `tsconfig.json`: `"strict": true`
- Fix resulting type errors (likely ~20-50 fixes)

---

## Phase 5: Technical Debt

### 5.1 Remove anomaly_engine.py dependency
- After Phase 1.3 (Dashboard uses V2), the V1 anomaly engine is only used by:
  - `/api/anomaly/` endpoint
  - `/api/anomaly/history/` endpoint
  - `Diagnostics.tsx` V1 mode (Expert-only after Phase 1.2)
- Keep endpoints alive but mark as deprecated
- Do NOT delete anomaly_engine.py yet (V1 fallback)

### 5.2 Single gunicorn process
- Kill webadmin gunicorn (Phase 1.5)
- Verify www-data systemd service works with latest code
- Touch wsgi.py to reload

### 5.3 Fix nginx config conflict
- Two server blocks for llcar.ru on port 443
- `django` block missing `ssl` keyword: `listen 443;` → needs `listen 443 ssl;`
- Cannot fix without sudo — document for future admin access
- Workaround: works currently because Nginx picks django block by server_name match

### 5.4 PostgreSQL: default DB migration
- Django auth still on SQLite (default DB)
- Document: not critical, auth not used (no admin users)
- Future: migrate when adding user management

---

## Phase 6: CustDev 3 Preparation

### 6.1 Collect validation questions
- From CustDev 1+2 findings, prepare hypothesis list for CustDev 3:
  1. Health Score понятен? (цвет + число = достаточно?)
  2. "Можно ли ехать?" — первая строка = правильно?
  3. Маршрут ремонта (checklist: бесплатно → дорого) — полезен?
  4. Feedback кнопки (Подтверждаю/Не так) — будут использовать?
  5. Робот-помощник — нравится или раздражает?
  6. Тренды здоровья (↑/↓) — понятны?
  7. Сравнение поездок — нужно?
  8. Цена: 249₽/мес vs 1990₽/год — что предпочитают?

### 6.2 Create CustDev 3 script
- Markdown document with interview script
- 10-15 questions, structured by JTBD
- Screener criteria: has car 5+ years, has smartphone, drives regularly
- Target: 10-15 respondents

### 6.3 Prepare demo flow
- V3 dashboard working with real data
- Light + dark theme both polished
- Key screens to show: Diagnostics V2, Health Score, Trends, Recommendations
- Record Luma video of demo flow for remote interviews

---

## Execution Order

1. Phase 1 (Critical fixes) — FIRST, unblocks everything
2. Phase 2 (Light theme) — visual quality
3. Phase 3 (Backend) — parallel agents where possible
4. Phase 4 (UX polish) — depends on Phase 1
5. Phase 5 (Tech debt) — cleanup
6. Phase 6 (CustDev 3) — documentation, no code dependency

## Success Criteria

- V3 dashboard loads with V2 API by default
- All health scores correct (no -1)
- Light theme visually polished (Playwright verified)
- 100+ diagnostic rules
- Health Score v2 weighted algorithm
- Correlation cron job on server
- Clean dist (single build)
- Single gunicorn process
- CustDev 3 interview script ready
- All tests pass (438+ → ~470+)
