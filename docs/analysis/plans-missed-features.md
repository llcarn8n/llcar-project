# Missed Features Analysis: Plans vs Implementation

**Date:** 2026-04-08
**Scope:** All specs and plans from 2026-04-04 through 2026-04-07
**Method:** Cross-referenced 9 spec/plan files against actual codebase in `llcar-dashboard/src/` and `dashboard_build/`

---

## 1. BACKEND — Not Implemented

### 1.1 Correlation Engine Cron Job
- **Source:** Master Roadmap #23
- **Description:** Django management command `run_correlations` to run CorrelationEngine after each trip. Code exists in `dashboard_build/diagnostic/correlation_runner.py` and `correlation_engine.py` but NO cron job is configured on the server.
- **Complexity:** LOW (code exists, need cron setup + management command wrapper)
- **Priority:** HIGH — correlations are computed but never scheduled automatically
- **Still Relevant:** YES — required for automatic diagnosis improvement

### 1.2 Multi-Packet Diagnostics
- **Source:** Master Roadmap #25
- **Description:** `diagnose_latest_view` currently reads ONE last packet. Should aggregate 10-50 packets for better accuracy.
- **Complexity:** MEDIUM (modify `api_views.py` loop + aggregate logic)
- **Priority:** HIGH — single-packet diagnosis is noisy and unreliable
- **Still Relevant:** YES — fundamental accuracy improvement

### 1.3 Health Score v2 Algorithm
- **Source:** Master Roadmap #26
- **Description:** Current health score = `100 - avg(confidence)`. Needs weighted average accounting for severity, persistence, and baseline confidence.
- **Complexity:** MEDIUM (modify `diagnosis_builder.py._compute_health_scores`)
- **Priority:** HIGH — health score is the core user-facing metric
- **Still Relevant:** YES

### 1.4 Freeze Frame at DTC
- **Source:** Master Roadmap #27
- **Description:** When DTC code appears, show the conditions (RPM, speed, coolant) at the moment of the error. Data is saved by `write_dtc_events` but never displayed.
- **Complexity:** LOW (data exists, need API + UI display)
- **Priority:** MEDIUM — useful for diagnosis but no DTCs currently active
- **Still Relevant:** YES — will become important as more cars connect

### 1.5 Derived Diagnostic Features (Phase 3.5 from Orbital Spec)
- **Source:** Orbital Diagnostic Center Design, Section 6.5 Phase 3.5
- **Description:** Seven planned features, NONE implemented:
  1. **Cold/Warm Analysis** — compare first 5 min vs steady state per trip
  2. **Speed Sweep Curve** — anomaly_score(speed) diagnostic fingerprint
  3. **RPM Sweep Curve** — anomaly_score(RPM) diagnostic fingerprint
  4. **Phone Orientation Compensation** — gravity vector from avg values, rotation matrix
  5. **Isolation Forest** — scikit-learn anomaly detector trained on baseline data
  6. **Crest Factor / Shape Ratio** — tests exist in `test_derived.py` but `compute_derived_features` in anomaly_engine.py only. Not integrated into V2 pipeline.
  7. **Virtual Frequency Matching** — engine/wheel harmonic matching. Code in anomaly_engine.py but not in V2.
- **Complexity:** HIGH (each is a separate feature; orientation compensation is especially complex)
- **Priority:** MEDIUM-HIGH — cold/warm and sweep curves are high diagnostic value; Isolation Forest needs 50+ clients
- **Still Relevant:** YES for cold/warm and sweep curves. Isolation Forest needs more data. Phone orientation is high impact but complex.

### 1.6 Shape Coefficient Update (Hjorth Parameters)
- **Source:** Orbital Spec Section 6.6 Phase 2
- **Description:** Update QtpEncoder.cs in Android app to send Hjorth parameters (Mobility, Complexity, Crest factor, Zero crossing rate) instead of current shape coefficients.
- **Complexity:** HIGH (requires Android app modification + server decoder update + new rules)
- **Priority:** LOW (current shape decoder works; Hjorth requires app update)
- **Still Relevant:** YES — significant diagnostic improvement but blocked on app update

### 1.7 Rule Weight Calibration
- **Source:** Master Roadmap #29
- **Description:** Calibrate rule weights based on user feedback (confirmed/dismissed ratios).
- **Complexity:** MEDIUM
- **Priority:** LOW — needs 50+ clients with feedback data first
- **Still Relevant:** BLOCKED — insufficient data

### 1.8 Population Norms
- **Source:** Master Roadmap #30
- **Description:** Compare baselines against population average for same brand/model.
- **Complexity:** MEDIUM
- **Priority:** LOW — needs 50+ clients with same model
- **Still Relevant:** BLOCKED — insufficient data

### 1.9 PDF Report for Service Centers
- **Source:** Master Roadmap #31
- **Description:** Generate PDF with VIN, mileage, Health Score, diagnoses, recommendations. User can print or send to mechanic.
- **Complexity:** MEDIUM (ReportLab or WeasyPrint)
- **Priority:** MEDIUM — high user value (CustDev confirmed), useful for business model
- **Still Relevant:** YES

---

## 2. FRONTEND — Not Implemented

### 2.1 OBDTelemetry Panel (Orbital Spec)
- **Source:** Orbital Diagnostic Center Design, Section 5.3
- **Description:** Dedicated panel with 3 rows: RPM arc gauge, Speed segmented bar, Coolant sparkline + delta. Battery arc gauge in corner. Level 2 expansion with full-size gauges and historical charts.
- **What Exists Instead:** `InstrumentCard.tsx` with simpler RPM/Speed/Coolant/Vibration cards on Dashboard page. No arc gauges, no segmented bars, no Level 2 expansion.
- **Complexity:** MEDIUM
- **Priority:** LOW — current InstrumentCard works; this is a visual upgrade
- **Still Relevant:** NICE-TO-HAVE

### 2.2 PseudoOrderPlot (Expert Mode)
- **Source:** Orbital Spec Section 5, Phase 5
- **Description:** Amplitude vs RPM scatter plot — diagnostic fingerprint that reveals engine-order vibrations. Critical for bearing/mount diagnosis.
- **What Exists:** NOTHING — no file, no reference in codebase
- **Complexity:** MEDIUM (ECharts scatter, needs RPM+vibration join)
- **Priority:** MEDIUM — high diagnostic value in expert mode
- **Still Relevant:** YES — unique diagnostic insight not available elsewhere

### 2.3 DataTethers (3D Connection Lines)
- **Source:** Orbital Spec Section 4.4
- **Description:** Animated bezier curves connecting 3D hotspots to HTML panels, with flowing particles indicating data flow.
- **What Exists:** NOTHING
- **Complexity:** HIGH (3D-to-2D projection, animation, performance)
- **Priority:** LOW — purely visual, does not add diagnostic value
- **Still Relevant:** NICE-TO-HAVE — impressive but complex

### 2.4 Dot-Matrix Background Pattern
- **Source:** GLM Reference Analysis (CyberDefend)
- **Description:** Radial-gradient dot pattern on page background for sci-fi depth effect.
- **What Exists:** Plain dark background `#050A0F`
- **Complexity:** TRIVIAL (one CSS rule)
- **Priority:** HIGH — instant visual upgrade, zero risk
- **Still Relevant:** YES

### 2.5 L-Shaped Corner Brackets on Panels
- **Source:** GLM Reference Analysis (CyberDefend)
- **Description:** SVG corner brackets on GlassPanel for military/HUD aesthetic. Code was generated by GLM but never integrated.
- **What Exists:** GlassPanel has clip-path corner but no bracket overlays
- **Complexity:** LOW (SVG overlay component)
- **Priority:** MEDIUM — enhances the approved HUD style
- **Still Relevant:** YES

### 2.6 Animated Data Stream Connections
- **Source:** GLM Reference Analysis (CyberDefend)
- **Description:** SVG particles flowing on bezier paths between panels, representing live data flow.
- **What Exists:** NOTHING
- **Complexity:** HIGH
- **Priority:** LOW — visual candy, performance risk
- **Still Relevant:** NICE-TO-HAVE

### 2.7 LED Node Status Indicators
- **Source:** GLM Reference Analysis (CyberDefend)
- **Description:** Pulsing LED dots per subsystem with thermal color scheme (cyan=normal, amber=stress, red=critical).
- **What Exists:** StatusBadge and StatusPills have dots but not the full LED pulsing effect
- **Complexity:** LOW
- **Priority:** MEDIUM — builds on existing StatusPills
- **Still Relevant:** YES

### 2.8 Bento-Grid Asymmetric Layout
- **Source:** GLM Reference Analysis (EffiTrack)
- **Description:** Asymmetric grid layout (like Apple's bento box) instead of uniform columns.
- **What Exists:** Standard 12-column Tailwind grid
- **Complexity:** MEDIUM (layout restructure)
- **Priority:** LOW — current grid works fine
- **Still Relevant:** OPTIONAL

### 2.9 Metric Cards: Icon + Label + Large Value + Trend Arrow
- **Source:** GLM Reference Analysis (EffiTrack)
- **Description:** Compact metric cards with trend indicators (up/down arrows with delta).
- **What Exists:** InstrumentCard has value + label but no trend arrows or deltas
- **Complexity:** LOW
- **Priority:** MEDIUM — trend arrows add information density
- **Still Relevant:** YES

### 2.10 Gradient Fill SVG Charts with Glow
- **Source:** GLM Reference Analysis (EffiTrack)
- **Description:** Charts with gradient area fills and glow effects (triple-layer rendering).
- **What Exists:** AudioSpectrum has glow effects; other charts are standard ECharts
- **Complexity:** LOW (ECharts areaStyle configuration)
- **Priority:** LOW — some charts already have this
- **Still Relevant:** PARTIALLY DONE

### 2.11 Robot Tooltips
- **Source:** Master Roadmap #38
- **Description:** Hover on diagnosis shows tooltip with robot mascot and plain-language explanation.
- **What Exists:** `RobotTooltip.tsx` file exists (created) but not wired into any component. Never appears in the actual UI.
- **Complexity:** LOW (component exists, just needs integration)
- **Priority:** MEDIUM — CustDev showed users want plain-language explanations
- **Still Relevant:** YES

### 2.12 Data Source Indicator
- **Source:** Master Roadmap #41
- **Description:** Show which data sources are active (OBD / Accelerometer / Audio) as colored dots.
- **What Exists:** Only in empty state. Not shown when data IS available.
- **Complexity:** TRIVIAL
- **Priority:** MEDIUM — helps user understand diagnostic confidence
- **Still Relevant:** YES

### 2.13 Export to PDF (Client-Side)
- **Source:** Master Roadmap #43
- **Description:** "Download Report" button generating PDF with html2canvas + jsPDF.
- **What Exists:** `exportReport.ts` exists but only exports JSON/text, not PDF.
- **Complexity:** MEDIUM
- **Priority:** MEDIUM — high user value for sharing with mechanics
- **Still Relevant:** YES

### 2.14 Mobile Responsive Polish
- **Source:** Master Roadmap #39, v4 spec
- **Description:** Full mobile adaptation with Tailwind breakpoints.
- **What Exists:** Basic responsiveness via Tailwind grid but NOT tested/polished. Sidebar confirmed fixed in earlier sessions. 3D scene not optimized for mobile GPU.
- **Complexity:** MEDIUM
- **Priority:** HIGH — users will access from phones
- **Still Relevant:** YES

### 2.15 Weather Zones on Timeline Charts
- **Source:** v6 spec Phase 3
- **Description:** `markArea` background zones on vibration/audio/engine charts showing weather conditions (clear/rain/overcast) as subtle colored overlays.
- **What Exists:** WeatherWidget shows current weather. Backend returns `weather_zones` in API response. But NO charts actually render the zones as markArea overlays.
- **Complexity:** LOW (ECharts markArea config, data already in API)
- **Priority:** MEDIUM — provides context for vibration readings
- **Still Relevant:** YES

### 2.16 Knowledge Base Sidebar Section
- **Source:** Orbital Spec Section 3.4
- **Description:** Sidebar section with diagnostic explanations, reference info, and repair guidance.
- **What Exists:** SidebarContent has ECU, DTC, Alerts, Voltage — but NO Knowledge Base section.
- **Complexity:** MEDIUM (need KB content + UI)
- **Priority:** MEDIUM — helps users understand diagnoses
- **Still Relevant:** YES

### 2.17 Settings Panel in Sidebar
- **Source:** Orbital Spec Section 3.4
- **Description:** Client selector, time range picker, data export, theme toggle in sidebar.
- **What Exists:** Client selector and time range are in the top nav. No data export. Theme toggle exists (`ThemeProvider.tsx`) but is simple dark/light. No settings panel in sidebar.
- **Complexity:** LOW
- **Priority:** LOW — existing top nav works
- **Still Relevant:** OPTIONAL

---

## 3. GLM Reference Analysis Insights — Unused

### 3.1 CyberDefend Patterns Not Applied
| Pattern | Status | Effort | Impact |
|---------|--------|--------|--------|
| Dot-matrix background | NOT DONE | 5 min | HIGH visual upgrade |
| L-shaped corner brackets | NOT DONE | 30 min | MEDIUM |
| Animated data streams | NOT DONE | 4+ hours | LOW (visual candy) |
| LED node indicators | PARTIAL (StatusPills) | 1 hour | MEDIUM |
| Holographic sheen on hover | DONE on Digital Twin | -- | -- |
| Thermal color scheme | DONE | -- | -- |

### 3.2 EffiTrack Patterns Not Applied
| Pattern | Status | Effort | Impact |
|---------|--------|--------|--------|
| Bento-grid layout | NOT DONE | 2-3 hours | LOW |
| Left-border accent cards | PARTIAL (alerts have it) | 15 min | LOW |
| Gradient fill SVG charts | PARTIAL (AudioSpectrum) | 30 min | LOW |
| Compact status badge pills | DONE (StatusPills) | -- | -- |
| Metric cards with trend arrows | NOT DONE | 1 hour | MEDIUM |
| Segmented filter controls | NOT DONE | 1 hour | LOW |

### 3.3 GLM-Generated Components Never Used
The GLM analysis produced ready-to-copy React+Tailwind code for:
- `CornerBracket` — SVG corner decorations
- `NeuralBridge` — animated connection lines between panels
- `TelemetryValue` — compact metric display with trend
- `SystemStatusGrid` — grid of subsystem status indicators
- `MetricCard` — EffiTrack-style metric card
- `MiniBarChart` — compact inline bar chart
- `ArcGauge` — arc-style gauge

**None of these were integrated.** They remain in the GLM analysis output files.

---

## 4. TECH DEBT from Roadmap — Not Addressed

| Item | Description | Priority |
|------|-------------|----------|
| anomaly_engine.py duplication | 562-line old engine duplicates `diagnostic/` module | HIGH — delete or unify |
| Dual gunicorn processes | www-data (systemd) + webadmin (manual) running | MEDIUM — single process |
| TypeScript strict mode | Dashboard not in strict, has `any` types | LOW |
| Vite chunk size warnings | Three.js bundle > 500KB, needs code-splitting | MEDIUM |
| recalls-database.json | 6271 lines loaded every request, needs caching | MEDIUM |

---

## 5. TOP 15 ACTIONABLE ITEMS (Prioritized)

Quick wins that improve the product NOW, sorted by impact/effort ratio:

| # | Feature | Type | Effort | Impact | Source |
|---|---------|------|--------|--------|--------|
| 1 | Dot-matrix background CSS | UI | 5 min | Visual depth | GLM CyberDefend |
| 2 | Data Source indicator (loaded state) | UI | 15 min | User trust | Roadmap #41 |
| 3 | Weather zones as markArea on charts | UI | 30 min | Context | v6 spec |
| 4 | Robot tooltips wiring | UI | 30 min | Accessibility | Roadmap #38 |
| 5 | Corner brackets on GlassPanel | UI | 30 min | HUD aesthetic | GLM CyberDefend |
| 6 | Trend arrows on metric cards | UI | 1 hr | Information | GLM EffiTrack |
| 7 | LED pulsing on StatusPills | UI | 1 hr | Visual feedback | GLM CyberDefend |
| 8 | Multi-packet diagnostics | Backend | 2-3 hr | Accuracy | Roadmap #25 |
| 9 | Correlation cron job | Backend | 1-2 hr | Auto-diagnosis | Roadmap #23 |
| 10 | Health Score v2 algorithm | Backend | 2-3 hr | Core metric | Roadmap #26 |
| 11 | PseudoOrderPlot (expert mode) | UI | 3-4 hr | Diagnostic value | Orbital Spec |
| 12 | Mobile responsive polish | UI | 4-6 hr | User reach | Roadmap #39 |
| 13 | Cold/warm trip analysis | Backend | 3-4 hr | Diagnostic value | Phase 3.5 |
| 14 | PDF export (client-side) | Full-stack | 4-6 hr | User value | Roadmap #43 |
| 15 | Knowledge Base sidebar | UI | 4-6 hr | User education | Orbital Spec |

---

## Summary

**Total planned features across all specs:** ~65+
**Implemented:** ~35 (54%)
**Not implemented:** ~30 (46%)

**Breakdown of missed features:**
- Backend features not built: 9
- Frontend components not integrated: 17
- GLM design patterns not applied: 8
- Tech debt items: 5

**Most impactful gap:** Multi-packet diagnostics (#8) + Health Score v2 (#10) — these affect the core diagnostic accuracy that users see.

**Easiest wins:** Items 1-7 are all UI-only changes taking under 1 hour each, requiring no backend work.
