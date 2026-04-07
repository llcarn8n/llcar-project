# LLCAR Orbital Diagnostic Center — Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Scope:** Full dashboard reconstruction — React SPA + Three.js Orbital Diagnostic Center

---

## 1. Vision

Transform the LLCAR dashboard from a collection of separate chart tabs into a unified **diagnostic instrument** centered around a 3D Digital Twin with orbital panels. Three screens + sidebar. Quality is the #1 priority.

**Current state:** 7 tabs, 3700-line vanilla JS monolith, 3D accelerometer rated 3/10 as diagnostic tool.
**Target state:** 3-screen React SPA, orbital 3D diagnostic center, anomaly scoring engine, rated 8/10.

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript + Vite |
| 3D engine | Three.js via @react-three/fiber + @react-three/drei |
| Post-processing | @react-three/postprocessing (Bloom, SSAO) |
| Charts | ECharts 5 (via echarts-for-react) |
| Maps | React-Leaflet + CartoDB Dark Matter |
| Timeline | Custom Canvas 2D component |
| State management | Zustand |
| Styling | Tailwind CSS + CSS Modules (glassmorphism) |
| Backend | Django (unchanged, API-only) |
| Database | PostgreSQL + TimescaleDB |
| Mobile app | LLCAR Android (QtpEncoder update) |
| Deploy | Vite build -> static files -> Django serves |

### 2.2 Project Structure

```
llcar-dashboard/
src/
  App.tsx
  layouts/
    MainLayout.tsx              # 3 tabs + sidebar shell
  pages/
    Dashboard.tsx               # Digital Twin + health + metrics
    Diagnostics.tsx             # Orbital Center
    Trips.tsx                   # Leaflet map
  components/
    three/                      # All 3D components (R3F)
      CarWireframe.tsx          # GLTF wireframe model
      AccelSphere.tsx           # 3D accelerometer in sphere
      Hotspot.tsx               # Pulsing diagnostic markers
      DataTether.tsx            # Panel-to-car connection lines
      PostProcessing.tsx        # Bloom, glow effects
    panels/                     # Diagnostic panels (ECharts + HTML)
      AudioSpectrum.tsx         # 4-zone NVH spectrum
      OBDTelemetry.tsx          # RPM/Speed/Temp gauges
      CoherenceMap.tsx          # 10x3 audio-vibration heatmap
      PseudoOrderPlot.tsx       # Amplitude vs RPM
      DiagnosisCard.tsx         # Auto-diagnosis text + confidence
      AnomalyTimeline.tsx       # Score history chart
    timeline/
      TimelineScrubber.tsx      # Canvas-based scrubber
    sidebar/
      ECUPanel.tsx              # Multi-ECU diagnostics
      KnowledgeBase.tsx         # Reference info
      Settings.tsx              # Client selector, time range
    shared/
      GlassPanel.tsx            # Glassmorphism container
      HealthBar.tsx             # Segmented health indicator
      StatusBadge.tsx           # OK/Warning/Critical badge
  diagnostics/                  # Business logic (pure TS)
    rules.ts                    # 7 diagnostic rules
    anomalyScore.ts             # Multi-sensor scoring
    baseline.ts                 # Regime baselines
    coherence.ts                # Audio-vibration correlation
    shapeDecoder.ts             # Correct QTP shape bitfield decoder
    regimeClassifier.ts         # Idle/city/highway classification
  hooks/
    useApiData.ts               # Fetch + cache + refetch
    useDiagnostics.ts           # Compute scores from API data
    useTimeline.ts              # Scrubber state + panel sync
    useThreeScene.ts            # R3F scene management
  stores/
    dashboardStore.ts           # Zustand: filters, time, active panel
  styles/
    glassmorphism.css           # Cyberpunk panel styles
    theme.ts                    # Color palette constants
public/
  models/
    car.glb                     # 3D wireframe car model
  llcar-logo.png
```

### 2.3 Backend Changes

**New endpoints:**
- `GET /api/anomaly/` — live anomaly score + diagnostics + CUSUM
- `GET /api/anomaly/history/` — score history for trend charts

**New DB tables:**
- `anomaly_baselines` — per-client, per-regime, per-feature statistics (Welford's)
- `anomaly_scores` — TimescaleDB hypertable for score history
- `diagnostic_persistence` — consecutive trigger counts for confidence

**Fixes:**
- `decode_shape()` — correct QTP bitfield decoder (level/duration/trend)
- Add `api_anomaly` and `api_anomaly_history` views

---

## 3. Screen Structure

```
[LLCAR logo]  [Dashboard]  [Diagnostics]  [Trips]     [client selector]  [time range]  [sidebar toggle]
```

### 3.1 Dashboard (Screen 1)

**Purpose:** At-a-glance vehicle health. Digital Twin as centerpiece.

**Layout:**
```
+------------------------------------------------------+
| [Alert bar — if any anomaly detected]                |
+------+-----------------------------------------------+
|      |  [Health Score 65/100]  [Status: WARNING]     |
|      +------------------+----------------------------+
|      |                  |  [Speed] [RPM] [Temp] [Vib]|
|      |   Digital Twin   |  (compact stat cards)      |
|      |   (Three.js)     +----------------------------+
|      |   with hotspots  |  [Mini 3D Accelerometer]   |
|      |                  |  (compact AccelSphere)     |
|      +------------------+----------------------------+
|      |  [Anomaly Timeline — last 24h, mini version]  |
+------+-----------------------------------------------+
```

**Components:**
- Digital Twin (CarWireframe + 3 Hotspots: engine/suspension/audio)
- Health score (big number + ring gauge)
- 4 stat cards (speed, RPM, coolant, vibration) with sparklines
- Compact 3D accelerometer (AccelSphere, non-interactive, auto-rotate)
- Mini anomaly timeline (last 24h, color segments only)
- Click on any element -> navigate to Diagnostics tab

### 3.2 Diagnostics — Orbital Center (Screen 2)

**Purpose:** Full diagnostic instrument. Progressive disclosure 3 levels.

**Level 1 (default view):**
```
+------------------------------------------------------+
|              [Auto-Diagnosis Card]                   |
|  "Подвеска: повышенная вибрация (confidence 72%)"    |
+------+-------------------+---------------------------+
| OBD  |                   |  Audio NVH                |
| Tel. |   Digital Twin    |  Spectrum                 |
| Stack|   (center, large) |  (4 zones)                |
|      |   + Hotspots      |                           |
|      |   + Tethers       |                           |
+------+-------------------+---------------------------+
| [3D Accelerometer Sphere]| [Anomaly Score Timeline]  |
| (interactive, rotatable) | (24h with regime colors)  |
+------------------------------------------------------+
|  [=== Timeline Scrubber (full width) ===]            |
+------------------------------------------------------+
```

**Level 2 (click panel to expand):**
- Any panel expands to show details
- 3D Accelerometer: adds axis projections (XY, XZ, YZ planes)
- Audio: adds individual frequency bars, quality gauge
- OBD: adds sparkline history, trend arrows
- Diagnosis: shows all rules with confidence bars

**Level 3 (expert mode toggle):**
- Coherence heatmap (10x3 matrix)
- Pseudo-order plot (amplitude vs RPM)
- CUSUM change-point chart (3 scales)
- Raw feature z-scores table
- Shape coefficient decoder view (when Hjorth available)

**Interactions:**
- Timeline scrubber: drag to select time range, all panels update
- Hotspot click: filters panels to show only that subsystem's data
- Panel click: expand to Level 2 detail
- Expert toggle: shows Level 3 panels
- All panels synchronized via Zustand store (time range, selected subsystem)

### 3.3 Trips (Screen 3)

**Purpose:** Map visualization of trips with vibration/audio overlay.

**Layout:**
```
+------------------------------------------------------+
| [Trip list sidebar]  |  [Leaflet Map, full width]    |
| - Trip 1: 13:20     |  Polylines colored by          |
| - Trip 2: 14:05     |  vibration intensity           |
| - Trip 3: 15:30     |  (green -> red)                |
|                      |                                |
| [Trip stats]         |  [Start/End markers]           |
| Avg speed: 42       |  [Popup: time/speed/vib/audio] |
| Avg vibration: 2.1  |                                |
| Distance: 12.4 km   |                                |
+------------------------------------------------------+
```

### 3.4 Sidebar (drawer)

**Sections:**
- **ECU & DTC** — multi-ECU diagnostics (7e8/7ea/7eb/7ef), DTC codes, voltage charts
- **Weather** — current weather, temperature effect on diagnostics
- **Knowledge Base** — reference info, diagnostic explanations
- **Settings** — client selector, time range, data export, theme

---

## 4. 3D Components Specification

### 4.1 CarWireframe

- **Model:** `Li7_uni.glb` (3.1 MB, Li Auto Li7) — already in project at `llcarv104/llcarv104/Li7_uni.glb`
- **Optimization:** Draco compress to <500KB for web, reduce to ~50K vertices if needed
- **Material:** Replace original materials with custom ShaderMaterial — Fresnel edge glow wireframe
- **Color:** Teal wireframe (#00E5FF, opacity 0.3) with glass body panels
- **Interaction:** Slow auto-rotate (2 deg/sec), mouse drag to rotate, scroll to zoom
- **Floor:** Subtle reflective plane with cyan underglow
- **Fallback:** `vehicle.gltf` (3.9 KB) as low-poly fallback for mobile

### 4.2 AccelSphere

- **Geometry:** Wireframe sphere (parametric surface, 32x32 resolution)
- **Material:** Cyan wireframe (#00E5FF, opacity 0.15) with Fresnel edge highlight
- **Data:** scatter3D-equivalent — THREE.Points with custom ShaderMaterial
- **Trail:** Last 300 points as particle trail, temporal decay (opacity = e^(-lambda*t))
- **Color mapping:** Green (#00ff41) -> Yellow (#ffff00) -> Red (#ff0040) by vibration magnitude
- **Center point:** Green sphere at origin (0,0,0) with pulsing glow
- **Ellipsoid:** Normal zone envelope (1.5*std radius), semi-transparent
- **Axes:** Three colored lines (X red, Y green, Z blue) with labels
- **Post-processing:** Bloom on particles (UnrealBloomPass, intensity 0.1)
- **Performance:** LOD — last 100 points full size, older points downsampled

### 4.3 Hotspot

- **Geometry:** Sphere (radius 0.15) + outer ring (torus)
- **Shader:** Custom — pulsing scale (sin(time * severity * 3)), Fresnel glow
- **Colors:** Severity-driven interpolation: cyan (#00E5FF, ok) -> amber (#FFAB00, warn) -> red (#FF1744, critical)
- **Pulse rate:** Linked to anomaly score — faster = worse
- **Label:** HTML overlay (drei Html component), shows name + value
- **Interaction:** Hover -> scale 1.2x, click -> filter all panels to this subsystem
- **Positions:** Engine (front-top), Suspension (mid-bottom), Audio (center)

### 4.4 DataTether

- **Geometry:** CatmullRomCurve3 (bezier, not straight lines)
- **Material:** Dashed line, color matches hotspot, opacity 0.6
- **Animation:** Small particle flowing along tether (data flow indicator)
- **Projection:** 3D world-space to 2D screen-space for HTML panel connection
- **Visibility:** Only show when panel is visible and hotspot is active

---

## 5. Panel Components Specification

### 5.1 GlassPanel (shared container)

```css
.glass-panel {
  background: linear-gradient(135deg, rgba(10,30,45,0.9), rgba(5,15,25,0.95));
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(0,229,255,0.25);
  border-left: 2px solid rgba(0,229,255,0.6);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,229,255,0.15);
  clip-path: polygon(0 0, calc(100%-12px) 0, 100% 12px, 100% 100%, 0 100%);
}
```

### 5.2 AudioSpectrum

- **Type:** ECharts stacked area + bar hybrid
- **4 zones:** Road (<100Hz), Engine (100-300Hz), Accessories (300-1kHz), Noise (>1kHz)
- **Data mapping:** 10 freq/amp pairs grouped by zone, moving average smoothing
- **Quality gauge:** ECharts gauge series (ring progress, amber color)
- **Glow effect:** Triple-layer rendering (core + mid-glow + outer aura via shadowBlur)
- **Level 2 expansion:** Individual frequency bars, peak markers, RPM overlay line

### 5.3 OBDTelemetry

- **Layout:** 3 rows — RPM (arc gauge), Speed (segmented bar), Coolant (sparkline + delta)
- **Type:** ECharts gauge + bar + line
- **Battery:** Small arc gauge in corner (12.4V)
- **Sparklines:** Last 50 samples per metric, smooth interpolation
- **Level 2 expansion:** Full-size gauges, historical charts, trend arrows

### 5.4 CoherenceMap (Level 3)

- **Type:** ECharts heatmap, 10 columns (frequencies) x 3 rows (accel axes)
- **Color scale:** Solarized Tech — dark (#073642) -> blue (#268bd2) -> cyan (#2aa198) -> green (#859900) -> red (#dc322f)
- **Interaction:** Click cell -> highlight correlated data in other panels
- **Thresholding:** Only render cells with value > 0.5 (reduce noise)
- **Status lights:** 3 indicators (X/Y/Z) with green/yellow/red per axis

### 5.5 DiagnosisCard

- **Content:** Top diagnostic rule name + confidence bar + explanation text
- **Confidence bar:** Segmented 0-100%, colored by status (green/amber/red)
- **Rules list:** All 7 rules sorted by confidence, expandable
- **Auto-text:** Human-readable diagnosis: "Проверить амортизаторы — повышенная вертикальная вибрация на ровной дороге (confidence 72%)"
- **Persistence indicator:** "Обнаружено 5 раз подряд" — builds trust

### 5.6 TimelineScrubber

- **Rendering:** HTML5 Canvas 2D (60fps, handles 10k+ segments)
- **Data:** Colored segments from anomaly_scores history (green/yellow/red)
- **Playhead:** White vertical line with grab handle
- **Interactions:**
  - Click/drag playhead to seek
  - Shift+drag to brush-select range
  - Scroll/pinch to zoom time axis
  - Snap-to-event at segment boundaries
- **Icons:** Alert markers, maintenance events, regime change indicators
- **Chrome:** HTML overlay for toolbar (Alerts/OK/Zones toggles)

---

## 6. Diagnostic Engine Specification

### 6.1 Regime Classification

Automatic classification into: idle, city, highway, acceleration, braking, cornering.

**Decision tree:** speed + RPM + accel thresholds (see anomaly_engine.py)

### 6.2 Baseline Establishment

- **Algorithm:** Welford's online (O(1) per update, numerically stable)
- **Storage:** PostgreSQL `anomaly_baselines` table (client_hash, regime, feature)
- **Minimum:** 30 samples per regime for z-scores
- **Cold start:** Population priors with Bayesian blending (alpha = count/30)
- **Features tracked:** 18 (9 accel + 4 OBD + 3 audio + 2 derived)

### 6.3 Anomaly Scoring

- **Formula:** Weighted average z-score per subsystem, mapped to 0-100
- **Subsystems:** Suspension, Engine, Electrical, Audio
- **Road correction:** Gravel x0.3, asphalt x1.0, standstill x0.1
- **Thresholds:** z < 1.5 = ok, 1.5-3.0 = warning, > 3.0 = critical
- **Mapping:** score = 100 - z*25 (z=0 -> 100, z=4 -> 0)

### 6.4 Diagnostic Rules

7 rules with weighted conditions and confidence scoring:

1. **Worn suspension** — z_std > 3, total_vib > 4, z_range > 8, z deviation from baseline
2. **Engine overheating** — coolant > 100C, deviation from baseline
3. **Alternator failure** — voltage < 13V, deviation from baseline
4. **Wheel imbalance** — speed-dependent vibration, x_std elevated at >60 km/h
5. **Exhaust leak** — audio broadband increase without vibration change
6. **Bearing wear** — high-freq audio peak, amplitude increasing, lateral vibration
7. **Engine mount wear** — RPM-dependent z_std, audio at firing frequency

**Confidence:** match_ratio (40%) + deviation_magnitude (40%) + persistence (20%)

### 6.5 Change-Point Detection (CUSUM)

Three scales:
- **Short (k=3, h=10):** Acute failure, 30 min detection
- **Medium (k=5, h=15):** Day-to-day degradation
- **Long (k=8, h=25):** Gradual wear over weeks

**Trend:** Linear regression on last 50 scores, expressed as points/day.

### 6.6 Shape Coefficient Update (Future)

**Phase 1 (now):** Fix decoder — correct QTP bitfield parsing (level/duration/trend)
**Phase 2 (later):** Update QtpEncoder.cs to send Hjorth parameters:
- Byte 1: Mobility (frequency estimate, 0-25 Hz)
- Byte 2: Complexity (bandwidth, 0-5)
- Byte 3: Crest factor (impulse detection, 1-10)
- Byte 4: Zero crossing rate (2nd frequency estimate)

---

## 7. Visual Design System

### 7.1 Color Palette

```typescript
const theme = {
  bg: {
    void: '#050A0F',
    panel: 'rgba(10,30,45,0.9)',
    deep: '#0A1014',
  },
  accent: {
    cyan: '#00E5FF',
    teal: '#64FFDA',
    hologram: '#00B8D4',
  },
  status: {
    ok: '#00E676',
    warning: '#FFAB00',
    critical: '#FF1744',
  },
  data: {
    line1: '#00E5FF',
    line2: '#7C4DFF',
    line3: '#FF4081',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.6)',
    muted: 'rgba(255,255,255,0.3)',
  },
  border: {
    glow: 'rgba(0,229,255,0.4)',
    subtle: 'rgba(0,229,255,0.15)',
  },
};
```

### 7.2 Typography

- **Headers:** Rajdhani or Orbitron (geometric, futuristic)
- **Numbers:** JetBrains Mono (tabular figures)
- **Body:** Inter (clean, high x-height)
- **Scale:** 48px display / 24px H1 / 18px H2 / 14px body / 11px caption / 9px micro

### 7.3 Glassmorphism Panels

- Frosted glass with backdrop-filter blur(16px)
- 1px cyan border with gradient fade (top 60% -> bottom 10%)
- Chamfered corners via clip-path polygon
- Triple-layer box-shadow (ambient + glow + inset)
- Tech-grain SVG noise overlay at 3% opacity

---

## 8. Data Flow

```
Android Phone (LLCAR app)
    |
    | QTP Protocol (UDP)
    v
Django Server (185.55.57.145)
    |
    +-- Ingest: accel_windows, audio_windows, ecu_*, qtp_packets
    |   +-- Trigger: update_baselines_on_ingest()
    |
    +-- API endpoints:
        +-- GET /api/data/?tab=...&minutes=...     (existing, unchanged)
        +-- GET /api/anomaly/?client=...&mode=live  (NEW)
        +-- GET /api/anomaly/history/?days=7        (NEW)
        +-- GET /api/trips/                         (existing)
        +-- GET /api/diagnostics/                   (existing)
    |
    v
React SPA (Vite build, served as static)
    |
    +-- Zustand store: { timeRange, selectedSystem, activePanel }
    +-- useApiData: fetch + SWR-like cache + 30s refetch
    +-- useDiagnostics: compute client-side overlays
    |
    +-- Three.js scene (R3F)
    |   +-- CarWireframe -> Hotspots -> DataTethers
    |   +-- AccelSphere (particle system)
    |   +-- PostProcessing (Bloom)
    |
    +-- ECharts panels (HTML overlay on 3D scene)
    |   +-- AudioSpectrum, OBDTelemetry, CoherenceMap, etc.
    |
    +-- Canvas TimelineScrubber
        +-- Broadcasts timestamp to all panels via store
```

---

## 9. Performance Budget

| Metric | Target |
|---|---|
| Initial load (gzipped) | < 800KB JS + 500KB GLTF model |
| 3D scene FPS | 30fps minimum on integrated GPU |
| API response (cached) | < 50ms |
| API response (live compute) | < 300ms |
| Panel update on scrub | < 100ms (debounced) |
| Memory usage | < 200MB |

**Optimization strategies:**
- Three.js: LOD on AccelSphere, instanced rendering for hotspots, selective bloom
- ECharts: lazy init (only render visible panels), throttled updates
- Timeline: Canvas 2D (not DOM), requestAnimationFrame at 30fps
- Data: API pagination, downsampling server-side (time_bucket)
- Model: Draco-compressed GLTF, <500KB

---

## 10. Scope & Phases

### Phase 1: Foundation (Sessions 1-3)
- Vite + React + TypeScript project setup
- MainLayout with 3 tabs + sidebar shell
- GlassPanel component + theme + glassmorphism CSS
- Basic data fetching (useApiData hook)
- Deploy pipeline (Vite build -> Django static)

### Phase 2: Dashboard Screen (Sessions 4-6)
- Three.js scene setup (R3F)
- CarWireframe (GLTF load + Fresnel shader)
- Hotspots with pulse animation
- Health score card + stat cards
- Compact AccelSphere widget
- Mini anomaly timeline

### Phase 3: Diagnostic Engine Backend (Sessions 7-9)
- anomaly_engine.py on server (regime, baselines, scoring, rules, CUSUM)
- New DB tables (baselines, scores, persistence)
- API endpoints (/api/anomaly/, /api/anomaly/history/)
- Fix shape decoder (correct QTP bitfield parsing)
- Integration tests with real data

### Phase 3.5: Derived Diagnostic Features (Sessions 9-10)
- Crest Factor per axis: `max(|min|,|max|) / sqrt(avg²+std²)` — impulse vs sinusoidal detection
- Shape Ratio per axis: `std / (max-min)` — signal type classification
- Virtual Frequency: audio peak matching to RPM harmonics and speed harmonics
- Phone orientation compensation: gravity vector from avg values, rotation matrix
- Cold/warm analysis: compare first 5 min vs steady state per trip
- Speed sweep curve: anomaly_score(speed) diagnostic fingerprint
- RPM sweep curve: anomaly_score(RPM) diagnostic fingerprint
- Add all derived features to anomaly scoring pipeline
- Add Isolation Forest anomaly detector (scikit-learn, trained on baseline data)

### Phase 4: Orbital Diagnostic Center (Sessions 10-14)
- Full Diagnostics page layout (orbital grid)
- AccelSphere (interactive, full-size, with projections)
- AudioSpectrum panel (ECharts)
- OBDTelemetry panel (ECharts gauges)
- DiagnosisCard (auto-diagnosis text)
- DataTethers (panel-to-car connections)
- TimelineScrubber (Canvas)
- Panel synchronization via Zustand
- Progressive disclosure (Level 1/2/3 toggle)

### Phase 5: Expert Features (Sessions 15-17)
- CoherenceMap (10x3 heatmap)
- PseudoOrderPlot (amplitude vs RPM)
- CUSUM chart (3 scales)
- Trend analysis view
- Anomaly score history chart

### Phase 6: Trips + Sidebar + Polish (Sessions 18-20)
- Trips page (React-Leaflet migration)
- Sidebar panels (ECU, Weather, Knowledge Base)
- Post-processing polish (bloom tuning, performance)
- Mobile responsiveness
- Final QA pass

### Phase 7: Hjorth Update (Future)
- Update QtpEncoder.cs in Android app
- Update decoder on server
- Add Hjorth-based diagnostic rules
- Frequency estimation visualizations

---

## 11. References

### Generated Concepts (Luma)
- `orbital-dashboard-concept.jpg` — Full orbital layout concept
- `compact-widget-concept.jpg` — Compact overview widget
- `module-3d-accelerometer.jpg` — AccelSphere module
- `module-audio-spectrum.jpg` — Audio NVH panel
- `module-obd-telemetry.jpg` — OBD telemetry stack
- `module-correlation-heatmap.jpg` — Coherence matrix
- `module-timeline-scrubber.jpg` — Timeline scrubber
- `module-digital-twin.jpg` — Digital Twin with hotspots

### User Reference
- `luma_reference.jpg` — Original inspiration (orbital HUD with car)

### Research Sources
- NVH Testing (Dewesoft)
- Bearing Fault Detection (vibration + acoustic fusion)
- Hjorth Parameters for condition monitoring
- QTP Protocol source code (QtpEncoder.cs, AccelerometerCaptureService.cs)
- Phone-based vehicle health monitoring papers
