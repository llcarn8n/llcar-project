# LLCAR Dashboard Redesign Spec

**Date:** 2026-04-04
**Status:** Approved
**Target:** https://llcar.ru (Django dashboard)

## Summary

Complete redesign of the LLCAR diagnostic dashboard. Replace current generic Plotly.js charts with a premium automotive-themed UI using ECharts + SVG gauges. Tab-based layout with health status system.

## Brand Identity

- **LLCAR = Long Life Car**
- Logo: chrome shield + car silhouette + infinity headlights + pulse line
- Aesthetic: dark, chrome/silver metallic, premium automotive
- Pulse motif from logo used as UI element (health bar, dividers, loading states)

## Tech Stack

| Component | Technology | Source |
|-----------|-----------|--------|
| Charts (2D) | Apache ECharts 5 | CDN |
| Charts (3D) | echarts-gl | CDN |
| Gauges | Custom SVG + CSS animations | Inline |
| Layout/Utilities | Tailwind CSS | CDN |
| Theme | CSS custom properties | Inline |
| Backend | Django 5.2 template | Single file `index.html` |
| No build step | All via CDN | — |

## Color Palette

| Element | Hex | Usage |
|---------|-----|-------|
| Background | `#08080c` | Page body |
| Card bg | `#111116` | Cards, panels |
| Card border | `#1e1e28` | Borders, dividers |
| Text primary | `#c0c0cc` | Values, headings |
| Text secondary | `#555566` | Labels, hints |
| Chrome active | `#d4d4e0` | Active tab, hover |
| Status normal | `#4ade80` | Green indicators |
| Status warning | `#f59e0b` | Amber indicators |
| Status alert | `#ef4444` | Red indicators |
| Pulse glow | `#ffffff` | Health bar pulse, with box-shadow |

## Page Layout

```
+---------------------------------------------+
|  HEADER: logo + tabs + client + timerange   |
+---------------------------------------------+
|  HEALTH BAR: status + pulse animation       |
+--------------+------------------------------+
|  CAR STATUS  |  KEY METRICS (2x2 grid)      |
|  (silhouette |  Speed / RPM / Temp / Vibr   |
|   + health   |  Each with SVG gauge arc     |
|   dots)      |                              |
+--------------+------------------------------+
|  TAB CONTENT (depends on selected tab)      |
|  +-------------------+-------------------+  |
|  |  Chart 1          |  Chart 2          |  |
|  |  (ECharts 3D/2D)  |  (ECharts 3D/2D)  |  |
|  +-------------------+-------------------+  |
|  Optional: mini-charts or extra metrics     |
+---------------------------------------------+
```

## Tabs

### Tab 1: Overview (default)

**Top section:** Car status card + 4 metric gauges
**Charts:**
- Left: 3D Accelerometer (echarts-gl scatter3D) — Time x X x Z, color=Y
- Right: 3D Vibration (echarts-gl scatter3D) — Time x X_std x Z_std, color=total_std
**Bottom:** Mini sparklines for RPM and speed (last 50 points)

### Tab 2: Engine

**Charts:**
- Left: RPM + Speed (dual Y axis line chart with dataZoom)
- Right: Coolant temp + Engine load + Throttle (multi-line)
**Extra metrics cards:** Fuel level, Voltage, Relative throttle, Runtime

### Tab 3: Suspension

**Charts:**
- Top: 3D Accelerometer full-width (larger view than overview)
- Bottom left: Vibration by axis X/Y/Z (stacked area chart)
- Bottom right: Min/Max range bands per axis
**Indicator:** Current road_type badge

### Tab 4: Audio

**Charts:**
- Left: Frequency spectrum bar chart (last reading) + line overlay for trend
- Right: Quality + Dominant frequency timeline (dual Y)
**Extra:** Last measurement card with all 10 freq+amp pairs

## Health Status System

### Thresholds

| Parameter | Normal | Warning | Alert |
|-----------|--------|---------|-------|
| Coolant temp | < 95 C | 95-105 C | > 105 C |
| Vibration (max std) | < 2.0 m/s2 | 2.0-4.0 | > 4.0 |
| RPM | < 5000 | 5000-7000 | > 7000 |
| Voltage | 13.5-14.5V | 12.5-13.5 or 14.5-15.0 | < 12.5 or > 15.0 |

**Overall status** = worst of all parameters.

### Health Bar

- Animated SVG pulse line (matches logo heartbeat motif)
- Pulse speed: slow (normal), medium (warning), fast (alert)
- Text: "Все системы в норме" / "Требуется внимание: [detail]" / "Тревога: [detail]"
- Colored dots per subsystem: engine, suspension, electrical, audio

### Computed on backend

`/api/stats/` returns:
```json
{
  "health": {
    "status": "normal|warning|alert",
    "message": "Все системы в норме",
    "subsystems": {
      "engine": {"status": "normal", "detail": "Темп 89 C"},
      "suspension": {"status": "warning", "detail": "Вибрация 3.2 m/s2"},
      "electrical": {"status": "normal", "detail": "14.1V"},
      "audio": {"status": "normal", "detail": "Качество 72"}
    }
  }
}
```

## Data: Using Full QTP Values

### Problem
Current dashboard only plots `avg` values — creates choppy graphs with gaps between windows.

### Solution
Use all 8 QTP values per window to create smooth curves with range visualization.

### Accelerometer (accel_windows)

Each window has per axis: `min, max, avg, std, shape1, shape2, shape3, shape4`

**Currently used:** avg only (1 point per window)
**New:** Expand each window into 6 ordered points: `shape1 → shape2 → avg → shape3 → shape4` with time interpolation within the window.

**Visualization:**
- **Line** = shape points interpolated (smooth curve)
- **Band (area)** = min..max corridor showing oscillation range
- **Band color** intensity based on std (higher std = more opaque/redder band)

### ECU PID FastPID (fastpid_NN_qtp SMALLINT[8])

Same 8-value structure. Expand for RPM, speed, etc. to get smooth curves instead of step functions.

### API Changes

**`/api/data/` additions:**

1. Add `tab` parameter: `overview|engine|suspension|audio`
   - Each tab fetches only its relevant data (reduces payload)

2. Accelerometer: add shape columns to SQL query
   ```sql
   SELECT time, packet_id, window_index,
     ax_min, ax_max, ax_avg, ax_std,
     ax_shape1, ax_shape2, ax_shape3, ax_shape4,
     ay_min, ay_max, ay_avg, ay_std,
     ay_shape1, ay_shape2, ay_shape3, ay_shape4,
     az_min, az_max, az_avg, az_std,
     az_shape1, az_shape2, az_shape3, az_shape4
   FROM accel_windows ...
   ```

3. Audio: return all 10 freq+amp pairs (currently only 5)

4. Engine tab: add fuel (p012f), voltage (p0142), rel_throttle (p0145)

**`/api/stats/` addition:** `health` object (see above)

## UX Behavior

### Auto-refresh
- Every 15 seconds, fetch only active tab data
- On tab switch: immediate fetch
- Pulse animation heartbeat on data update

### Tab switching
- JS visibility toggle (no page reload)
- Last active tab saved in localStorage
- URL does not change

### DataZoom (rangeslider)
- ECharts built-in `dataZoom` component
- Styled to match chrome theme
- Shared across all charts on active tab — move one, all update

### Responsive
- Desktop (>1024px): 2-column chart grid
- Tablet (768-1024px): 2-column, smaller gauges
- Mobile (<768px): 1-column, stacked gauges
- Minimum width: 360px

## Files to Modify

| File | Changes |
|------|---------|
| `/var/www/html/django/dashboard/templates/dashboard/index.html` | Complete rewrite — new HTML/CSS/JS |
| `/var/www/html/django/dashboard/views.py` | Add health computation, tab parameter, shape columns, full audio |

## Out of Scope

- GPS/Map (geohash not decodable back to coordinates)
- DTC codes display (no DTC data in current tables)
- User authentication / multi-user
- Mobile app integration
- Historical comparison / reports
