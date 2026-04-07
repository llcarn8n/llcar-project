# React SPA Foundation + Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Create a React SPA that replaces the current 3700-line vanilla JS dashboard. Three screens (Dashboard, Diagnostics, Trips) + sidebar. Dashboard screen features a Three.js Digital Twin with health scoring.

**Architecture:** Vite + React 18 + TypeScript. Three.js via @react-three/fiber. ECharts for 2D charts. Zustand for state. Tailwind for styling. Django serves the built static files.

**Tech Stack:** Vite 5, React 18, TypeScript 5, @react-three/fiber, @react-three/drei, @react-three/postprocessing, echarts + echarts-for-react, zustand, tailwind CSS, react-router-dom

---

## File Map

| File | Responsibility |
|---|---|
| `llcar-dashboard/package.json` | Dependencies |
| `llcar-dashboard/vite.config.ts` | Build config |
| `llcar-dashboard/tsconfig.json` | TypeScript config |
| `llcar-dashboard/tailwind.config.ts` | Tailwind theme |
| `llcar-dashboard/index.html` | Entry HTML |
| `llcar-dashboard/src/main.tsx` | React entry |
| `llcar-dashboard/src/App.tsx` | Router + layout |
| `llcar-dashboard/src/theme.ts` | Color palette constants |
| `llcar-dashboard/src/styles/glass.css` | Glassmorphism CSS |
| `llcar-dashboard/src/stores/dashboardStore.ts` | Zustand store |
| `llcar-dashboard/src/hooks/useApiData.ts` | Data fetching |
| `llcar-dashboard/src/layouts/MainLayout.tsx` | 3 tabs + sidebar shell |
| `llcar-dashboard/src/components/shared/GlassPanel.tsx` | Glassmorphism container |
| `llcar-dashboard/src/components/shared/HealthBar.tsx` | Health score gauge |
| `llcar-dashboard/src/components/shared/StatusBadge.tsx` | OK/Warning/Critical badge |
| `llcar-dashboard/src/components/three/CarWireframe.tsx` | GLTF model + Fresnel |
| `llcar-dashboard/src/components/three/Hotspot.tsx` | Pulsing diagnostic markers |
| `llcar-dashboard/src/components/three/SceneSetup.tsx` | Lights + controls + postproc |
| `llcar-dashboard/src/pages/Dashboard.tsx` | Main dashboard page |
| `llcar-dashboard/src/pages/Diagnostics.tsx` | Placeholder |
| `llcar-dashboard/src/pages/Trips.tsx` | Placeholder |
| `llcar-dashboard/public/models/car.glb` | 3D model (copy from llcarv104) |
| `llcar-dashboard/public/llcar-logo.png` | Logo |

---

## Tasks

### Task 1: Project Scaffolding
Create Vite + React + TS project with all dependencies.

### Task 2: Theme + Glassmorphism CSS + Shared Components
Color palette, GlassPanel, HealthBar, StatusBadge.

### Task 3: MainLayout + Router + Store
3 tabs + sidebar shell, react-router, Zustand store.

### Task 4: Data Hooks
useApiData for /api/data/, /api/anomaly/, /api/health/.

### Task 5: Three.js Scene + CarWireframe
R3F canvas, load Li7_uni.glb, Fresnel wireframe shader, auto-rotate.

### Task 6: Hotspots + Health Integration
3 pulsing hotspots (engine/suspension/audio) driven by anomaly API data.

### Task 7: Dashboard Page Assembly
Health score card, stat cards (speed/RPM/temp/vib), mini 3D scene, alerts.

### Task 8: Build + Deploy Pipeline
Vite build → copy to Django static → test on server.
