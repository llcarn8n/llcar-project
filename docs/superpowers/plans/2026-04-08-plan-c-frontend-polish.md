# Plan C: Frontend Polish — UI Improvements from CustDev + GLM Analysis

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** 12 frontend improvements from CustDev findings, GLM reference analysis, and missed features.

**Architecture:** React components in llcar-dashboard/src/. CSS variables for theming. All changes frontend-only.

**Tech Stack:** React 19, TypeScript strict, Tailwind, Three.js, ECharts

---

### Task 19: RobotTooltip wiring into DiagnosisCardV2
- File exists: `src/components/shared/RobotTooltip.tsx` — never imported. Wire into DiagnosisCardV2 diagnosis names.

### Task 20: Data Source indicator in loaded state
- Modify: `DiagnosisCardV2.tsx` — show OBD/Accel/Audio dots when report IS loaded, not just empty state.

### Task 21: LED pulsing on StatusPills
- Modify: `StatusPills.tsx` — add box-shadow pulse animation: green=ok, amber=warning, red=critical, none=offline.

### Task 22: Trend arrows on InstrumentCard metrics
- Modify: `InstrumentCard.tsx` — add trend arrow (↑/↓/→) next to RPM/Speed/Coolant values based on comparison with previous reading.

### Task 23: Weather zones markArea on charts
- Modify: `AudioSpectrum.tsx` — add ECharts markArea zones colored by weather (blue=rain, gray=overcast, none=clear). Data already in API.

### Task 24: PseudoOrderPlot (Expert mode)
- Create: `src/components/panels/PseudoOrderPlot.tsx` — ECharts scatter: X=RPM, Y=vibration amplitude. Reveals engine-order harmonics.
- Modify: `Diagnostics.tsx` — add to Expert section.

### Task 25: Knowledge Base sidebar section
- Modify: `SidebarContent.tsx` — add KB section with diagnostic explanations, reference info for current vehicle.

### Task 26: Mobile responsive audit
- Test at 375px, 768px, 1024px via Playwright.
- Fix overflow, truncation, stacking issues across all pages.

### Task 27: Vehicles database validation
- Launch web search agent to verify years for ALL 58 brands, especially Chinese (Changan, Geely, Haval, Chery, etc.)
- Fix incorrect years (CS35 2014→2012, etc.)

### Task 28: Connection Wizard flow fix
- Modify: `App.tsx` — show ConnectionWizard when clicking "Начать диагностику" in VehicleSetup, not as blocking onboarding step.

### Task 29: Metric cards with trend delta
- Modify: `Dashboard.tsx` health score section — show delta vs previous reading (+3 / -5) with color.

### Task 30: GLM patterns integration
- Add corner bracket SVG overlays to GlassPanel (from GLM CyberDefend analysis)
- LED node indicators enhancement on StatusPills
