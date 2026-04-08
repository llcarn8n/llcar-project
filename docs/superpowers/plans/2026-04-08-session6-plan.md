# Session 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Activate V2 as default, fix critical bugs, redesign light theme, improve backend algorithms, cleanup tech debt, prepare CustDev 3.

**Architecture:** Frontend fixes in llcar-dashboard/src/, backend in dashboard_build/diagnostic/, deploy via SCP to 185.55.57.145.

**Tech Stack:** React 19 + TypeScript + Tailwind + Three.js (frontend), Django + PostgreSQL (backend)

---

### Task 1: V2 API Default + Hide Toggle

**Files:**
- Modify: `llcar-dashboard/src/stores/dashboardStore.ts:29` — `useV2Api: false` → `true`
- Modify: `llcar-dashboard/src/pages/Diagnostics.tsx:68-81` — wrap V1/V2 toggle in `expertMode &&`

- [ ] **Step 1:** Change `useV2Api: false` to `useV2Api: true` in dashboardStore.ts line 29
- [ ] **Step 2:** In Diagnostics.tsx, wrap the API V1/V2 toggle button (lines 68-81) with `{expertMode && (...)}`
- [ ] **Step 3:** Verify build: `cd llcar-dashboard && npm run build`

---

### Task 2: Dashboard Overview → V2 Health Scores

**Files:**
- Modify: `llcar-dashboard/src/pages/Dashboard.tsx`

- [ ] **Step 1:** Add import: `import { useDiagnosticV2 } from '../hooks/useDiagnosticV2'`
- [ ] **Step 2:** Add hook call: `const { report: v2Report } = useDiagnosticV2(clientHash)`
- [ ] **Step 3:** Replace health score logic:
  - `overall`: use `v2Report?.health_scores?.overall ?? anomaly?.overall ?? -1`
  - Each system bar: `v2Report?.health_scores?.[sys] ?? systems[sys]?.score ?? 0`
  - StatusPills: same pattern
  - This fixes Электрика -1 (V2 returns real scores)
- [ ] **Step 4:** Verify build passes

---

### Task 3: Light Theme Redesign via CSS Variables

**Files:**
- Modify: `llcar-dashboard/src/styles/glass.css` — replace 280 lines of light-mode overrides
- Modify: `llcar-dashboard/src/theme.ts` — add CSS variable references

- [ ] **Step 1:** Add CSS variables block at top of glass.css after body rules:

```css
:root {
  --bg-primary: #0C1220;
  --bg-panel: rgba(6, 15, 25, 0.55);
  --bg-panel-end: rgba(10, 20, 30, 0.45);
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255,255,255,0.75);
  --text-muted: rgba(255,255,255,0.45);
  --accent-cyan: #00E5FF;
  --accent-teal: #64FFDA;
  --border-glow: rgba(0, 229, 255, 0.2);
  --border-accent: rgba(0, 229, 255, 0.5);
  --glass-shadow: rgba(0, 229, 255, 0.08);
  --glass-border-top: rgba(255,255,255,0.15);
  --status-ok: #00E676;
  --status-warning: #FFAB00;
  --status-critical: #FF1744;
  --scrollbar-bg: #0C1220;
  --scrollbar-thumb: rgba(0,229,255,0.15);
  --body-dots: rgba(0,229,255,0.15);
  --body-vignette: #0C1220;
  --panel-text: white;
  --nav-text: rgba(255,255,255,0.4);
  --nav-hover-bg: rgba(0,229,255,0.06);
  --header-border: rgba(255,255,255,0.05);
}

body.light-mode {
  --bg-primary: #F8FAFC;
  --bg-panel: rgba(255, 255, 255, 0.85);
  --bg-panel-end: rgba(248, 250, 252, 0.75);
  --text-primary: #1E293B;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --accent-cyan: #0891B2;
  --accent-teal: #0D9488;
  --border-glow: rgba(8, 145, 178, 0.15);
  --border-accent: rgba(8, 145, 178, 0.35);
  --glass-shadow: rgba(0, 0, 0, 0.06);
  --glass-border-top: rgba(255,255,255,0.9);
  --status-ok: #059669;
  --status-warning: #D97706;
  --status-critical: #DC2626;
  --scrollbar-bg: #F1F5F9;
  --scrollbar-thumb: rgba(8,145,178,0.2);
  --body-dots: rgba(8,145,178,0.06);
  --body-vignette: rgba(248,250,252,0.6);
  --panel-text: #1E293B;
  --nav-text: #64748B;
  --nav-hover-bg: rgba(8,145,178,0.06);
  --header-border: rgba(0,0,0,0.06);
}
```

- [ ] **Step 2:** Replace ALL hardcoded colors in glass.css `.glass-panel`, `.hud-header`, `.metric-value`, `.nav-btn`, etc with `var(--*)` references. Delete ALL `body.light-mode` override blocks (lines 435-715).
- [ ] **Step 3:** Update MainLayout.tsx background from ternary to `var(--bg-primary)`
- [ ] **Step 4:** Verify both themes via Playwright screenshots

---

### Task 4: Health Score v2 Algorithm

**Files:**
- Modify: `dashboard_build/diagnostic/diagnosis_builder.py`
- Modify: `dashboard_build/tests/test_diagnosis_builder.py`

- [ ] **Step 1:** In `_compute_health_scores`, replace simple avg with weighted formula:
```python
SEVERITY_WEIGHTS = {'info': 0.5, 'low': 1, 'medium': 2, 'high': 3, 'critical': 5}

def _compute_health_scores(self, fired_rules, escalation_manager=None):
    system_penalties = {s: 0.0 for s in _ALL_SYSTEMS}
    for rule in fired_rules:
        sys = _RULE_TO_SYSTEM.get(rule['name'], 'engine')
        severity = rule.get('severity', 'medium')
        weight = SEVERITY_WEIGHTS.get(severity, 2)
        persistence = 1.0
        if escalation_manager:
            rec = escalation_manager.get_record(rule['name'])
            if rec:
                persistence += 0.1 * min(rec.escalation_level, 3)
        system_penalties[sys] += weight * (rule['confidence'] / 100) * persistence
    
    scores = {}
    for sys in _ALL_SYSTEMS:
        raw = 100 - system_penalties[sys] * 10
        scores[sys] = max(0, min(100, int(raw)))
    scores['overall'] = int(sum(scores[s] * _SYSTEM_WEIGHTS[s] for s in _ALL_SYSTEMS))
    return scores
```
- [ ] **Step 2:** Add tests for new weighted scoring
- [ ] **Step 3:** Run: `cd dashboard_build && python -m pytest tests/test_diagnosis_builder.py -v`

---

### Task 5: Expand Rules 81 → 100+

**Files:**
- Modify: `dashboard_build/diagnostic/rules/threshold_rules.json`
- Modify: `dashboard_build/diagnostic/rules/complex_rules.py`
- Modify: `dashboard_build/tests/test_rule_engine.py`

- [ ] **Step 1:** Add 20+ new rules to threshold_rules.json:
  - PHEV/BEV: battery_soc_low, range_extender_overwork, e_motor_temp_high, charging_anomaly, battery_temp_high, regen_brake_weak
  - DTC-boosted: p0171_lean_boost, p0300_misfire_boost, p0420_catalyst_boost, p0442_evap_leak
  - Seasonal: winter_cold_start, summer_overheat_risk
  - Combined: vibration_with_dtc, audio_speed_correlation, warmup_too_slow, idle_instability
- [ ] **Step 2:** Add 2 complex rules to complex_rules.py: `phev_battery_degradation`, `combined_drivetrain_stress`
- [ ] **Step 3:** Update _RULE_TO_SYSTEM mapping in diagnosis_builder.py for new rules
- [ ] **Step 4:** Run all tests: `python -m pytest tests/ -v`

---

### Task 6: Correlation Cron Job

**Files:**
- Create: `dashboard_build/diagnostic/management/__init__.py`
- Create: `dashboard_build/diagnostic/management/commands/__init__.py`
- Create: `dashboard_build/diagnostic/management/commands/run_correlations.py`

- [ ] **Step 1:** Create Django management command structure
- [ ] **Step 2:** Implement run_correlations command using existing correlation_runner.py
- [ ] **Step 3:** Deploy to server, set up cron: `*/30 * * * * cd /var/www/html/django && venv/bin/python manage.py run_correlations --client_hash=362f5a4a5f95127723509e28c392850f`

---

### Task 7: Recalls Caching

**Files:**
- Modify: `dashboard_build/diagnostic/recalls_checker.py`

- [ ] **Step 1:** Add module-level cache:
```python
import functools

@functools.lru_cache(maxsize=1)
def _load_db(path: str) -> list:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)
```
- [ ] **Step 2:** Replace per-request file load with `_load_db(path)` call
- [ ] **Step 3:** Run: `python -m pytest tests/test_recalls_checker.py -v`

---

### Task 8: Baseline Quality Widget

**Files:**
- Create: `llcar-dashboard/src/components/panels/BaselineStatus.tsx`
- Modify: `llcar-dashboard/src/pages/Diagnostics.tsx`

- [ ] **Step 1:** Create BaselineStatus component showing progress bar + "Нужно ещё N поездок"
- [ ] **Step 2:** Wire into Diagnostics.tsx V2 section using `v2Report.baseline_status`
- [ ] **Step 3:** Verify build

---

### Task 9: Tech Debt Cleanup

**Files:**
- Delete: `llcar-dashboard/src/components/shared/WeatherWidget.tsx` (used in Dashboard — keep)
- Delete: `llcar-dashboard/src/components/three/AccelSphere.tsx` (unused, SmartSphere used instead)
- Delete: `llcar-dashboard/src/components/panels/TelemetryCard.tsx` (unused)
- Modify: `llcar-dashboard/tsconfig.json` — add `"strict": true`

- [ ] **Step 1:** Check WeatherWidget import — actually used in Dashboard.tsx (keep it)
- [ ] **Step 2:** Delete AccelSphere.tsx and TelemetryCard.tsx, remove any imports
- [ ] **Step 3:** Enable strict mode, fix type errors
- [ ] **Step 4:** Kill duplicate gunicorn on server: SSH `kill <webadmin PID>`
- [ ] **Step 5:** Verify single gunicorn process running

---

### Task 10: Clean Build + Deploy

**Files:**
- All frontend changes built and deployed

- [ ] **Step 1:** `cd llcar-dashboard && rm -rf dist && npm run build`
- [ ] **Step 2:** SSH: `rm -rf /var/www/html/django/static/spa-v3/static/*`
- [ ] **Step 3:** SCP: upload all files from dist/ to server spa-v3/
- [ ] **Step 4:** Touch wsgi.py: `touch /var/www/html/django/llcar/wsgi.py`
- [ ] **Step 5:** Playwright: verify https://llcar.ru/v3/ works, V2 default, light theme, scores correct

---

### Task 11: CustDev 3 Preparation

**Files:**
- Create: `docs/custdev3/interview-script.md`
- Create: `docs/custdev3/hypotheses.md`

- [ ] **Step 1:** Write interview script (10-15 questions by JTBD)
- [ ] **Step 2:** Write hypotheses list for validation
- [ ] **Step 3:** Prepare demo flow documentation
- [ ] **Step 4:** Commit all CustDev 3 docs

---

## Execution: Subagent-Driven

**Parallel Group A (independent):**
- Task 4: Health Score v2 (backend only)
- Task 5: Expand rules (backend only)
- Task 6: Correlation Cron Job (backend only)
- Task 7: Recalls caching (backend only)
- Task 11: CustDev 3 docs (no code deps)

**Parallel Group B (frontend, after A merges):**
- Task 1: V2 default
- Task 2: Dashboard → V2
- Task 3: Light theme redesign
- Task 8: Baseline widget
- Task 9: Tech debt cleanup

**Sequential (after all):**
- Task 10: Clean build + deploy + verify
