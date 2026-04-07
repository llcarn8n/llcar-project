# Dashboard v6 — Global Redesign: Trips + Diagnostics + Weather

## Overview

Two new tabs + weather integration into existing charts. Uses all previously unused data sources.

## Tab: Поездки (Trips)

### Backend: `GET /api/trips/?minutes=1440`

Groups `qtp_packets` into trips (gap >10 min between packets = new trip). For each trip returns:
- start_time, end_time, duration_min
- route: array of {lat, lng, vib, speed, temp, weather, ts} decoded from geo_hash + joined accel/ecu data
- summary: avg_vib, avg_speed, max_vib, weather_condition, distance_estimate

Geo_hash decoding: 8-char geohash → lat/lng center point (~20m accuracy). Use Python `geohash2` library.

Join logic: for each qtp_packet with geo_hash, find closest accel_windows (by packet_id) for vibration and ecu_7e8 for speed.

### Frontend

- Full-width dark map: Leaflet.js + CartoDB Dark Matter tiles (free, no API key)
- Routes drawn as polylines, color = vibration (green <2 → yellow <4 → red >4 m/s² RMS)
- Line width = speed (thin = stopped, thick = moving)
- Click on segment → popup: time, speed, vibration, air temp, weather icon
- Date filter: reuse existing time-range buttons from header
- Stats bar above map: trip count, total time, avg vibration, weather summary

### Data volume
- 21,887 geo points, 1,534 unique locations
- Main location: ucgjqtsy (16K points — parking/home)
- ~10-20 trips expected in 12 days of data

---

## Tab: Диагностика (Diagnostics)

### Backend: `GET /api/diagnostics/?minutes=1440`

Reads latest data from 4 ECU tables + DTC codes. Returns:
- alerts[]: auto-generated anomaly descriptions from cross-ECU comparison
- ecu: { "7e8": {rpm, speed, coolant, load, throttle, fuel, voltage, ambient}, "7ea": {rpm, dist_mil, warmups}, "7eb": {speed, voltage, dist_mil, dist_clr}, "7ef": {rpm, speed, coolant, voltage} }
- dtc: { status: "clear", total_packets: 12352, codes: [] }
- history: time-series for voltage comparison chart

Alert generation logic:
- Voltage spread: if abs(7eb.voltage - 7ef.voltage) > 500mV → warning
- Coolant spread: if abs(7e8.coolant - 7ef.coolant) > 15°C → warning (different cooling circuits)
- If all within tolerance → "all systems nominal"

### Frontend — 3 blocks

**Block 1: Anomaly alerts** (top)
Colored cards (green/yellow/red) with text explanations. Same style as suspension status card.
- Cross-ECU voltage comparison alerts
- Cooling circuit temperature alerts  
- "All systems nominal" if nothing found

**Block 2: DTC codes**
- Current state: "No errors detected (12,352 packets checked)"
- When codes appear: red cards with code, description (from existing KB 244 codes), timestamp
- Link to KB tab for repair info

**Block 3: ECU parameters** (4-column grid)
| ДВС (7e8) | Электромотор (7ea) | BMS (7eb) | Охлаждение (7ef) |
|-----------|-------------------|-----------|-----------------|
| RPM | RPM (electric) | Voltage | Voltage |
| Load % | Dist since MIL | Dist since clear | Coolant temp |
| Coolant | Warmups | | RPM |
| Throttle | | | Speed |
| Fuel level | | | |
| Voltage | | | |

Each parameter: click → expand mini-chart (progressive disclosure, existing pattern).

**Bottom: Voltage comparison chart**
All ECU voltages on one timeline: 7e8 (orange), 7eb (blue), 7ee (cyan), 7ef (green). Shows divergence over time.

---

## Weather Integration (into existing tabs)

### Weather strip on timeline charts
Add `markArea` background zones on vibration, audio, engine charts:
- Clear/mainly_clear: rgba(250,204,21,0.04) yellow tint
- Partly_cloudy/overcast: rgba(148,163,184,0.04) gray tint
- Rain: rgba(96,165,250,0.06) blue tint

Data source: join qtp_packets.weather_condition by time range.

### Weather card on Overview tab
New gauge card in metrics row:
- Current air temperature (weather_temp)
- Weather icon (☀️⛅🌧️)
- Condition text in Russian

---

## Technical notes

### New dependencies (frontend)
- Leaflet.js (~40KB): CDN `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- CartoDB Dark Matter tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

### New dependencies (backend)
- `geohash2` Python package (pip install in venv)

### File changes
- `views.py`: add api_trips(), api_diagnostics() endpoints
- `urls.py`: add routes
- `index.html`: add 2 tab buttons, 2 tab content sections, weather integration

### ECU table mapping
- 7e8: Engine (ДВС) — primary
- 7e9: empty (0 rows)
- 7ea: Electric motor / hybrid system
- 7eb: BMS / traction battery
- 7ec: Transmission (minimal data)
- 7ed: Unknown (minimal)
- 7ee: Chassis / ABS
- 7ef: Secondary cooling circuit / 12V system
