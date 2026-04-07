# Dashboard v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new tabs (Поездки + Диагностика) and weather integration to LLCAR dashboard.

**Architecture:** Backend endpoints in Django views.py return JSON. Frontend renders in single index.html with ECharts + Leaflet. Deploy via SCP to webadmin@185.55.57.145.

**Tech Stack:** Django/PostgreSQL, ECharts, Leaflet.js, geohash2 Python lib, CartoDB tiles.

---

## Phase 1: Tab "Поездки" (Trips Map)

### Task 1: Install geohash2 on server

**Files:**
- Modify: server `/var/www/html/django/venv/` (pip install)

- [ ] **Step 1: Install geohash2 in server venv**

```bash
ssh webadmin@185.55.57.145
cd /var/www/html/django && source venv/bin/activate
pip install geohash2
python3 -c "import geohash2; print(geohash2.decode('ucgjqtsy'))"
# Expected: (55.7..., 37.6...) — Moscow area coordinates
```

- [ ] **Step 2: Verify decode works**

Run the decode test. If coordinates look like Moscow area — success.

---

### Task 2: Backend — api_trips endpoint

**Files:**
- Modify: `dashboard_build/views.py` — add `api_trips()` function
- Modify: `dashboard_build/urls.py` — add route

- [ ] **Step 1: Add api_trips to views.py**

Add after the last endpoint in views.py:

```python
@require_GET
@never_cache
def api_trips(request):
    """GET /api/trips/ — trip routes with geo, vibration, speed, weather."""
    client = request.GET.get('client', '')
    try:
        minutes = min(int(request.GET.get('minutes', 1440)), 10080)
    except (ValueError, TypeError):
        minutes = 1440

    cf = "AND client_hash = %s" if client else ""
    params = [client] if client else []

    import geohash2

    with _vehinfo() as c:
        # Get packets with geo data
        c.execute(f"""
            SELECT p.time, p.packet_id, p.geo_hash, p.road_type,
                   p.weather_temp, p.weather_condition, p.acceleration_state
            FROM qtp_packets p
            WHERE p.time > NOW() - INTERVAL '{minutes} minutes'
              AND p.geo_hash IS NOT NULL AND p.geo_hash != ''
              {cf}
            ORDER BY p.time ASC
            LIMIT 5000
        """, params)
        packets = _dictfetchall(c)

    if not packets:
        return JsonResponse({'trips': []})

    # Get vibration data keyed by packet_id
    pids = [p['packet_id'] for p in packets]
    vib_map = {}
    if pids:
        with _vehinfo() as c:
            placeholders = ','.join(['%s'] * min(len(pids), 500))
            c.execute(f"""
                SELECT packet_id, ax_std, ay_std, az_std
                FROM accel_windows
                WHERE packet_id IN ({placeholders})
                LIMIT 1500
            """, pids[:500])
            for r in _dictfetchall(c):
                xs = round((r['ax_std'] or 0) / 255.0 * 9.81, 2)
                ys = round((r['ay_std'] or 0) / 255.0 * 9.81, 2)
                zs = round((r['az_std'] or 0) / 255.0 * 9.81, 2)
                vib_map[r['packet_id']] = round((xs**2 + ys**2 + zs**2)**0.5, 2)

    # Get speed data keyed by packet_id
    speed_map = {}
    if pids:
        with _vehinfo() as c:
            c.execute(f"""
                SELECT packet_id, p010d
                FROM ecu_7e8
                WHERE packet_id IN ({placeholders})
                LIMIT 1500
            """, pids[:500])
            for r in _dictfetchall(c):
                if r['p010d'] is not None:
                    speed_map[r['packet_id']] = r['p010d']

    # Group into trips (gap > 10 min = new trip)
    trips = []
    current_trip = []
    for i, p in enumerate(packets):
        if i > 0:
            prev_time = packets[i-1]['time']
            gap = (p['time'] - prev_time).total_seconds()
            if gap > 600:  # 10 min gap
                if len(current_trip) >= 2:
                    trips.append(current_trip)
                current_trip = []

        try:
            lat, lng = geohash2.decode(p['geo_hash'])
        except Exception:
            continue

        pid = p['packet_id']
        current_trip.append({
            'ts': p['time'].isoformat(),
            'lat': round(lat, 5),
            'lng': round(lng, 5),
            'vib': vib_map.get(pid, 0),
            'speed': speed_map.get(pid, 0),
            'temp': float(p['weather_temp']) if p['weather_temp'] else None,
            'weather': p['weather_condition'],
            'road': p['road_type'],
        })

    if len(current_trip) >= 2:
        trips.append(current_trip)

    # Build trip summaries
    result = []
    for trip in trips:
        vibs = [p['vib'] for p in trip if p['vib'] > 0]
        speeds = [p['speed'] for p in trip if p['speed'] > 0]
        result.append({
            'start': trip[0]['ts'],
            'end': trip[-1]['ts'],
            'points': len(trip),
            'route': trip,
            'avg_vib': round(sum(vibs) / len(vibs), 2) if vibs else 0,
            'max_vib': round(max(vibs), 2) if vibs else 0,
            'avg_speed': round(sum(speeds) / len(speeds), 1) if speeds else 0,
            'weather': trip[0].get('weather', 'unknown'),
        })

    return JsonResponse({'trips': result})
```

- [ ] **Step 2: Add URL route**

In `urls.py`, add:

```python
path('api/trips/', views.api_trips, name='api_trips'),
```

- [ ] **Step 3: Deploy backend to server**

```bash
scp views.py webadmin@185.55.57.145:/var/www/html/django/dashboard/views.py
scp urls.py webadmin@185.55.57.145:/var/www/html/django/dashboard/urls.py
# Restart gunicorn
ssh webadmin@185.55.57.145 "kill -HUP $(pgrep -u webadmin -f gunicorn | head -1); touch /var/www/html/django/llcar/wsgi.py"
```

- [ ] **Step 4: Verify endpoint**

```bash
ssh webadmin@185.55.57.145 'curl -s --unix-socket /var/www/html/django/app.sock "http://localhost/api/trips/?minutes=10080" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d[\"trips\"]),\"trips\"); t=d[\"trips\"][0] if d[\"trips\"] else {}; print(\"first:\",t.get(\"points\"),\"pts, vib:\",t.get(\"avg_vib\"))"'
```

---

### Task 3: Frontend — Trips tab with Leaflet map

**Files:**
- Modify: `dashboard_build/index.html` — add Leaflet CSS/JS, tab button, tab content, render function

- [ ] **Step 1: Add Leaflet CDN to `<head>`**

After the ECharts script tag (line ~9), add:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>
```

- [ ] **Step 2: Add tab button**

After the "База знаний" tab button (line ~1177), add:

```html
<button class="tab-btn" data-tab="trips" onclick="switchTab('trips')">Поездки</button>
<button class="tab-btn" data-tab="diagnostics" onclick="switchTab('diagnostics')">Диагностика</button>
```

- [ ] **Step 3: Add CSS for map**

In the `<style>` section, add:

```css
/* Trips map */
.trips-map { width: 100%; height: calc(100vh - 260px); min-height: 400px; border-radius: 10px; z-index: 1; }
.trip-stats-bar {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px;
}
.trip-stat { background: rgba(17,17,22,0.9); border: 1px solid rgba(0,212,170,0.1); border-radius: 10px; padding: 12px; text-align: center; }
.trip-stat-value { font-size: 22px; font-weight: 700; color: var(--chrome); font-variant-numeric: tabular-nums; }
.trip-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-top: 2px; }
.leaflet-popup-content-wrapper { background: rgba(17,17,22,0.95) !important; color: var(--text-primary) !important; border: 1px solid rgba(0,212,170,0.2) !important; border-radius: 8px !important; }
.leaflet-popup-tip { background: rgba(17,17,22,0.95) !important; }
.leaflet-popup-content { font-size: 12px !important; font-family: 'SF Mono', monospace !important; }
```

- [ ] **Step 4: Add tab HTML content**

Before the `<!-- ===== TAB: KNOWLEDGE BASE ===== -->` section, add:

```html
<!-- ===== TAB: TRIPS ===== -->
<div class="tab-content" id="tab-trips">
    <div class="trip-stats-bar" id="trip-stats">
        <div class="trip-stat">
            <div class="trip-stat-value" id="ts-count">--</div>
            <div class="trip-stat-label">Поездок</div>
        </div>
        <div class="trip-stat">
            <div class="trip-stat-value" id="ts-points">--</div>
            <div class="trip-stat-label">Точек GPS</div>
        </div>
        <div class="trip-stat">
            <div class="trip-stat-value" id="ts-avg-vib">--</div>
            <div class="trip-stat-label">Ср. вибрация m/s²</div>
        </div>
        <div class="trip-stat">
            <div class="trip-stat-value" id="ts-avg-speed">--</div>
            <div class="trip-stat-label">Ср. скорость км/ч</div>
        </div>
    </div>
    <div class="chart-container" style="padding:0;overflow:hidden;">
        <div id="trips-map" class="trips-map"></div>
    </div>
</div>
```

- [ ] **Step 5: Add renderTrips function in JavaScript**

In the main `<script>` section, before the tab rendering dispatcher, add:

```javascript
// ─── Trips map (Leaflet) ─────────────────────────────────────
var tripsMap = null;
var tripsLayer = null;

function renderTrips() {
    var el = function(id) { return document.getElementById(id); };
    var client = document.getElementById('client-select') ? document.getElementById('client-select').value : '';
    var minutes = getTimeRange();

    fetch('/api/trips/?minutes=' + minutes + (client ? '&client=' + client : ''))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var trips = data.trips || [];

            // Stats
            var totalPts = 0, totalVib = 0, totalSpeed = 0, vibCnt = 0, spdCnt = 0;
            trips.forEach(function(t) {
                totalPts += t.points;
                if (t.avg_vib > 0) { totalVib += t.avg_vib; vibCnt++; }
                if (t.avg_speed > 0) { totalSpeed += t.avg_speed; spdCnt++; }
            });
            if (el('ts-count')) el('ts-count').textContent = trips.length;
            if (el('ts-points')) el('ts-points').textContent = totalPts;
            if (el('ts-avg-vib')) el('ts-avg-vib').textContent = vibCnt ? (totalVib / vibCnt).toFixed(1) : '--';
            if (el('ts-avg-speed')) el('ts-avg-speed').textContent = spdCnt ? Math.round(totalSpeed / spdCnt) : '--';

            // Init map
            if (!tripsMap) {
                tripsMap = L.map('trips-map', { zoomControl: true, attributionControl: false }).setView([55.75, 37.62], 11);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19, subdomains: 'abcd'
                }).addTo(tripsMap);
            }

            // Clear old layers
            if (tripsLayer) { tripsMap.removeLayer(tripsLayer); }
            tripsLayer = L.layerGroup().addTo(tripsMap);

            if (!trips.length) return;

            // Draw each trip
            var allBounds = [];
            trips.forEach(function(trip, ti) {
                var route = trip.route;
                if (!route || route.length < 2) return;

                // Draw segments colored by vibration
                for (var si = 0; si < route.length - 1; si++) {
                    var p1 = route[si], p2 = route[si + 1];
                    var vib = p1.vib || 0;
                    var color = vib < 2 ? '#4ade80' : vib < 4 ? '#f59e0b' : '#ef4444';
                    var weight = Math.max(2, Math.min((p1.speed || 0) / 20, 6));

                    var seg = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
                        color: color, weight: weight, opacity: 0.8
                    }).addTo(tripsLayer);

                    var weatherIcon = {'clear':'☀️','mainly_clear':'🌤️','partly_cloudy':'⛅','overcast':'☁️','slight_rain':'🌦️','moderate_rain':'🌧️'}[p1.weather] || '❓';

                    seg.bindPopup(
                        '<div style="line-height:1.6">'
                        + '<b style="color:#00D4AA">' + new Date(p1.ts).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit',second:'2-digit'}) + '</b><br>'
                        + 'Скорость: <b>' + (p1.speed || 0) + '</b> км/ч<br>'
                        + 'Вибрация: <b>' + (p1.vib || 0) + '</b> m/s²<br>'
                        + (p1.temp != null ? 'Темп: <b>' + p1.temp + '°C</b> ' + weatherIcon + '<br>' : '')
                        + (p1.road ? 'Дорога: ' + p1.road + '<br>' : '')
                        + '</div>'
                    );

                    allBounds.push([p1.lat, p1.lng]);
                }
                allBounds.push([route[route.length-1].lat, route[route.length-1].lng]);

                // Start/end markers
                L.circleMarker([route[0].lat, route[0].lng], {
                    radius: 6, color: '#00D4AA', fillColor: '#00D4AA', fillOpacity: 1, weight: 2
                }).bindPopup('Старт: ' + new Date(trip.start).toLocaleString('ru-RU')).addTo(tripsLayer);

                L.circleMarker([route[route.length-1].lat, route[route.length-1].lng], {
                    radius: 6, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2
                }).bindPopup('Финиш: ' + new Date(trip.end).toLocaleString('ru-RU')).addTo(tripsLayer);
            });

            // Fit map to bounds
            if (allBounds.length > 1) {
                tripsMap.fitBounds(allBounds, { padding: [30, 30] });
            }
        })
        .catch(function(e) { console.error('Trips load error:', e); });
}
```

- [ ] **Step 6: Add trips to tab dispatcher**

In the `switchTab` function, after the tab visibility toggle, add:

```javascript
// In switchTab, after setting currentTab:
if (tabName === 'trips') { setTimeout(function() { renderTrips(); if (tripsMap) tripsMap.invalidateSize(); }, 200); }
```

And in `renderTab` switch, add:

```javascript
case 'trips': renderTrips(); break;
```

- [ ] **Step 7: Deploy and verify**

Deploy index.html to server and verify the Trips tab loads the map.

---

## Phase 2: Tab "Диагностика" (Diagnostics)

### Task 4: Backend — api_diagnostics endpoint

**Files:**
- Modify: `dashboard_build/views.py`
- Modify: `dashboard_build/urls.py`

- [ ] **Step 1: Add api_diagnostics to views.py**

```python
@require_GET
@never_cache
def api_diagnostics(request):
    """GET /api/diagnostics/ — multi-ECU comparison + DTC codes."""
    client = request.GET.get('client', '')
    try:
        minutes = min(int(request.GET.get('minutes', 1440)), 10080)
    except (ValueError, TypeError):
        minutes = 1440

    cf = "AND client_hash = %s" if client else ""
    params = [client] if client else []

    ecu = {}
    alerts = []

    # Helper to get latest row from ECU table
    def _latest_ecu(table, fields):
        with _vehinfo() as c:
            cols = ', '.join(fields)
            c.execute(f"""
                SELECT {cols} FROM {table}
                WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
                ORDER BY time DESC LIMIT 1
            """, params)
            row = c.fetchone()
            if row:
                return dict(zip(fields, [float(v) if v is not None else None for v in row]))
        return {}

    # 7e8: Engine
    ecu['7e8'] = _latest_ecu('ecu_7e8', ['p010c','p010d','p0105','p0104','p0111','p012f','p0142','p0146'])
    labels_7e8 = {'p010c':'RPM','p010d':'Скорость','p0105':'Темп. ОЖ','p0104':'Нагрузка','p0111':'Дроссель','p012f':'Топливо','p0142':'Напряжение','p0146':'Темп. воздуха'}
    ecu['7e8']['_labels'] = labels_7e8

    # 7ea: Electric motor
    ecu['7ea'] = _latest_ecu('ecu_7ea', ['p010c','p0121','p0131','p0130'])
    ecu['7ea']['_labels'] = {'p010c':'RPM электро','p0121':'Пробег MIL','p0131':'Пробег сброс','p0130':'Прогревы'}

    # 7eb: BMS
    ecu['7eb'] = _latest_ecu('ecu_7eb', ['p010d','p0142','p0121','p0131'])
    ecu['7eb']['_labels'] = {'p010d':'Скорость','p0142':'Напряжение ВВБ','p0121':'Пробег MIL','p0131':'Пробег сброс'}

    # 7ef: Secondary cooling
    ecu['7ef'] = _latest_ecu('ecu_7ef', ['p010c','p010d','p0105','p0142'])
    ecu['7ef']['_labels'] = {'p010c':'RPM','p010d':'Скорость','p0105':'Темп. ОЖ 2','p0142':'Напряжение 12В'}

    # Generate alerts
    v_7e8 = ecu['7e8'].get('p0142')
    v_7eb = ecu['7eb'].get('p0142')
    v_7ef = ecu['7ef'].get('p0142')

    if v_7eb and v_7ef and abs(v_7eb - v_7ef) > 500:
        alerts.append({
            'severity': 'warning',
            'title': f'Разница напряжений BMS ({round(v_7eb/1000,1)}В) и 12В ({round(v_7ef/1000,1)}В): {round(abs(v_7eb-v_7ef)/1000,1)}В',
            'explanation': 'Рассогласование напряжений между тяговой батареей и 12В системой. Возможна просадка одного из контуров.',
        })

    t_7e8 = ecu['7e8'].get('p0105')
    t_7ef = ecu['7ef'].get('p0105')
    if t_7e8 and t_7ef and abs(t_7e8 - t_7ef) > 15:
        alerts.append({
            'severity': 'warning',
            'title': f'Разница температур ОЖ: ДВС {int(t_7e8)}°C vs контур 2 {int(t_7ef)}°C',
            'explanation': 'Два контура охлаждения прогреты неравномерно. Возможно второй контур не циркулирует.',
        })

    if not alerts:
        alerts.append({
            'severity': 'ok',
            'title': 'Все системы согласованы',
            'explanation': 'Параметры всех ECU блоков в пределах нормы. Рассогласований не обнаружено.',
        })

    # DTC codes
    with _vehinfo() as c:
        c.execute("""
            SELECT count(*) as total,
                   count(*) FILTER (WHERE array_length(dtc_codes,1) > 0) as with_codes
            FROM vehicle_data_packets
        """)
        dtc_row = c.fetchone()

    dtc = {
        'status': 'clear' if dtc_row[1] == 0 else 'errors',
        'total_packets': dtc_row[0],
        'codes': [],
    }

    if dtc_row[1] > 0:
        with _vehinfo() as c:
            c.execute("""
                SELECT unnest(dtc_codes) as code, count(*) as cnt
                FROM vehicle_data_packets
                WHERE array_length(dtc_codes,1) > 0
                GROUP BY 1 ORDER BY 2 DESC LIMIT 20
            """)
            dtc['codes'] = [{'code': r[0], 'count': r[1]} for r in c.fetchall()]

    # Voltage history for comparison chart
    voltage_history = []
    with _vehinfo() as c:
        c.execute(f"""
            SELECT time, p0142 FROM ecu_7e8
            WHERE time > NOW() - INTERVAL '{minutes} minutes' AND p0142 IS NOT NULL {cf}
            ORDER BY time ASC LIMIT 500
        """, params)
        v8 = [{'ts': r[0].isoformat(), 'v': round(r[1]/1000, 2)} for r in c.fetchall()]

        c.execute(f"""
            SELECT time, p0142 FROM ecu_7eb
            WHERE time > NOW() - INTERVAL '{minutes} minutes' AND p0142 IS NOT NULL {cf}
            ORDER BY time ASC LIMIT 500
        """, params)
        vb = [{'ts': r[0].isoformat(), 'v': round(r[1]/1000, 2)} for r in c.fetchall()]

        c.execute(f"""
            SELECT time, p0142 FROM ecu_7ef
            WHERE time > NOW() - INTERVAL '{minutes} minutes' AND p0142 IS NOT NULL {cf}
            ORDER BY time ASC LIMIT 500
        """, params)
        vf = [{'ts': r[0].isoformat(), 'v': round(r[1]/1000, 2)} for r in c.fetchall()]

    return JsonResponse({
        'ecu': ecu, 'alerts': alerts, 'dtc': dtc,
        'voltage_history': {'7e8': v8, '7eb': vb, '7ef': vf},
    })
```

- [ ] **Step 2: Add URL**

```python
path('api/diagnostics/', views.api_diagnostics, name='api_diagnostics'),
```

- [ ] **Step 3: Deploy backend and verify**

---

### Task 5: Frontend — Diagnostics tab

**Files:**
- Modify: `dashboard_build/index.html`

- [ ] **Step 1: Add tab HTML**

After the trips tab HTML, before KB tab:

```html
<!-- ===== TAB: DIAGNOSTICS ===== -->
<div class="tab-content" id="tab-diagnostics">
    <!-- Alerts -->
    <div id="diag-alerts" style="margin-bottom:14px;"></div>
    <!-- DTC -->
    <div id="diag-dtc" style="background:rgba(17,17,22,0.9);border:1px solid rgba(0,212,170,0.12);border-radius:12px;padding:16px 20px;margin-bottom:14px;"></div>
    <!-- ECU grid -->
    <div id="diag-ecu" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;"></div>
    <!-- Voltage comparison chart -->
    <div class="chart-container">
        <div class="chart-title">Напряжения по ECU блокам (по времени)</div>
        <div class="chart-box" id="chart-voltage-compare"></div>
    </div>
</div>
```

- [ ] **Step 2: Add renderDiagnostics function**

```javascript
function renderDiagnostics() {
    var client = document.getElementById('client-select') ? document.getElementById('client-select').value : '';
    var minutes = getTimeRange();

    fetch('/api/diagnostics/?minutes=' + minutes + (client ? '&client=' + client : ''))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            // Alerts
            var alertsEl = document.getElementById('diag-alerts');
            if (alertsEl) {
                alertsEl.innerHTML = (data.alerts || []).map(function(a) {
                    var colors = { ok: 'var(--status-normal)', warning: 'var(--status-warning)', critical: 'var(--status-alert)' };
                    var icons = { ok: '✅', warning: '⚠️', critical: '🔴' };
                    var bgColors = { ok: 'rgba(74,222,128,0.06)', warning: 'rgba(245,158,11,0.06)', critical: 'rgba(239,68,68,0.06)' };
                    return '<div style="background:' + (bgColors[a.severity]||bgColors.ok) + ';border:1px solid ' + (colors[a.severity]||colors.ok) + '30;border-radius:10px;padding:14px 18px;margin-bottom:8px;">'
                        + '<div style="font-size:14px;font-weight:600;color:' + (colors[a.severity]||colors.ok) + ';">' + (icons[a.severity]||'') + ' ' + a.title + '</div>'
                        + '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">' + a.explanation + '</div>'
                        + '</div>';
                }).join('');
            }

            // DTC
            var dtcEl = document.getElementById('diag-dtc');
            if (dtcEl) {
                var dtc = data.dtc || {};
                if (dtc.status === 'clear') {
                    dtcEl.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">'
                        + '<span style="font-size:24px;">✅</span>'
                        + '<div><div style="font-size:14px;font-weight:600;color:var(--status-normal);">Ошибок не обнаружено</div>'
                        + '<div style="font-size:11px;color:var(--text-secondary);">Проверено ' + (dtc.total_packets||0) + ' пакетов данных</div></div></div>';
                } else {
                    dtcEl.innerHTML = dtc.codes.map(function(c) {
                        return '<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;margin-bottom:6px;">'
                            + '<span style="color:#ef4444;font-weight:700;font-family:SF Mono,monospace;">DTC ' + c.code + '</span>'
                            + ' — обнаружен ' + c.count + ' раз</div>';
                    }).join('');
                }
            }

            // ECU params grid
            var ecuEl = document.getElementById('diag-ecu');
            if (ecuEl) {
                var blocks = [
                    { id: '7e8', name: 'ДВС (7E8)', color: '#f59e0b' },
                    { id: '7ea', name: 'Электромотор (7EA)', color: '#4ade80' },
                    { id: '7eb', name: 'BMS / Батарея (7EB)', color: '#60a5fa' },
                    { id: '7ef', name: 'Охлаждение (7EF)', color: '#22d3ee' },
                ];
                ecuEl.innerHTML = blocks.map(function(b) {
                    var ecu = data.ecu[b.id] || {};
                    var labels = ecu._labels || {};
                    var html = '<div class="susp-stat-card" style="border-color:' + b.color + '20;">'
                        + '<div style="font-size:11px;font-weight:700;color:' + b.color + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">' + b.name + '</div>';
                    Object.keys(labels).forEach(function(pid) {
                        var val = ecu[pid];
                        var label = labels[pid];
                        var display = val != null ? (pid.includes('0142') ? (val/1000).toFixed(1) + 'В' : pid.includes('0105') || pid.includes('0146') ? Math.round(val) + '°C' : Math.round(val)) : '--';
                        html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:11px;">'
                            + '<span style="color:var(--text-secondary);">' + label + '</span>'
                            + '<span style="color:var(--chrome);font-family:SF Mono,monospace;font-weight:600;">' + display + '</span></div>';
                    });
                    html += '</div>';
                    return html;
                }).join('');
            }

            // Voltage comparison chart
            var vc = initChart('chart-voltage-compare');
            if (vc) {
                var vh = data.voltage_history || {};
                vc.setOption({
                    backgroundColor: 'transparent',
                    tooltip: { trigger: 'axis', backgroundColor: '#111116', borderColor: 'rgba(0,212,170,0.15)',
                               textStyle: { color: '#c0c0cc', fontSize: 11 } },
                    legend: { data: ['ДВС (7E8)', 'BMS (7EB)', 'Охл. (7EF)'], textStyle: { color: '#888', fontSize: 10 }, top: 0 },
                    grid: { left: 55, right: 20, top: 35, bottom: 65 },
                    xAxis: { type: 'time', ...AXIS_STYLE,
                        axisLabel: { color: '#aaa', fontSize: 11, formatter: function(v) {
                            return new Date(v).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
                        }}
                    },
                    yAxis: { type: 'value', name: 'Вольт', nameTextStyle: { color: '#888' }, ...AXIS_STYLE },
                    dataZoom: [{ ...DATAZOOM_STYLE, xAxisIndex: [0], bottom: 8 }, { type: 'inside' }],
                    series: [
                        { name: 'ДВС (7E8)', type: 'line', symbol: 'none', smooth: true,
                          data: (vh['7e8']||[]).map(function(d){return [d.ts, d.v];}),
                          lineStyle: { width: 2, color: '#f59e0b', shadowColor: 'rgba(245,158,11,0.3)', shadowBlur: 6 } },
                        { name: 'BMS (7EB)', type: 'line', symbol: 'none', smooth: true,
                          data: (vh['7eb']||[]).map(function(d){return [d.ts, d.v];}),
                          lineStyle: { width: 2, color: '#60a5fa', shadowColor: 'rgba(96,165,250,0.3)', shadowBlur: 6 } },
                        { name: 'Охл. (7EF)', type: 'line', symbol: 'none', smooth: true,
                          data: (vh['7ef']||[]).map(function(d){return [d.ts, d.v];}),
                          lineStyle: { width: 2, color: '#22d3ee', shadowColor: 'rgba(34,211,238,0.3)', shadowBlur: 6 } },
                    ]
                });
            }
        })
        .catch(function(e) { console.error('Diagnostics error:', e); });
}
```

- [ ] **Step 3: Add to tab dispatcher**

```javascript
case 'diagnostics': renderDiagnostics(); break;
// In switchTab: if (tabName === 'diagnostics') renderDiagnostics();
```

- [ ] **Step 4: Deploy and verify**

---

## Phase 3: Weather Integration

### Task 6: Backend — add weather data to api_data response

**Files:**
- Modify: `dashboard_build/views.py` — extend api_data to return weather

- [ ] **Step 1: Add weather to api_data response**

In the `api_data` function, after building `pkts`, add weather data:

```python
# After pkts list is built, add weather_zones for timeline overlay
weather_zones = []
with _vehinfo() as c:
    c.execute(f"""
        SELECT time, weather_condition, weather_temp
        FROM qtp_packets
        WHERE time > NOW() - INTERVAL '{minutes} minutes'
          AND weather_condition IS NOT NULL {cf}
        ORDER BY time ASC LIMIT 500
    """, params)
    weather_raw = _dictfetchall(c)

prev_cond = None
zone_start = None
for w in weather_raw:
    cond = w['weather_condition']
    if cond != prev_cond:
        if prev_cond and zone_start:
            weather_zones.append({'start': zone_start, 'end': w['time'].isoformat(), 'condition': prev_cond})
        zone_start = w['time'].isoformat()
        prev_cond = cond
if prev_cond and zone_start and weather_raw:
    weather_zones.append({'start': zone_start, 'end': weather_raw[-1]['time'].isoformat(), 'condition': prev_cond})

# Add latest weather to response
latest_weather = None
if weather_raw:
    lw = weather_raw[-1]
    latest_weather = {'temp': float(lw['weather_temp']) if lw['weather_temp'] else None, 'condition': lw['weather_condition']}
```

Then update the return JsonResponse to include:

```python
return JsonResponse({
    'packets': pkts, 'accel': accel, 'pids': pids, 'audio': audio,
    'weather_zones': weather_zones, 'latest_weather': latest_weather,
})
```

- [ ] **Step 2: Deploy backend**

---

### Task 7: Frontend — weather card + chart overlays

**Files:**
- Modify: `dashboard_build/index.html`

- [ ] **Step 1: Add weather card to metrics row**

In the metrics row HTML (after the Vibration gauge card), add:

```html
<div class="card gauge-card" id="weather-card" style="display:none;">
    <div class="gauge-value" id="weather-temp">--</div>
    <div class="gauge-label" id="weather-icon">☀️</div>
    <div class="gauge-status" id="weather-cond" style="color:var(--text-secondary);">--</div>
</div>
```

- [ ] **Step 2: Add weather update to renderOverview**

In renderOverview, after sparklines, add:

```javascript
// Weather card
var lw = data.latest_weather;
if (lw) {
    var wCard = document.getElementById('weather-card');
    if (wCard) wCard.style.display = '';
    var wTemp = document.getElementById('weather-temp');
    if (wTemp) wTemp.textContent = lw.temp != null ? Math.round(lw.temp) + '°' : '--';
    var wIconMap = {clear:'☀️',mainly_clear:'🌤️',partly_cloudy:'⛅',overcast:'☁️',slight_rain:'🌦️',moderate_rain:'🌧️',unknown:'❓'};
    var wIcon = document.getElementById('weather-icon');
    if (wIcon) wIcon.textContent = wIconMap[lw.condition] || '❓';
    var wCond = document.getElementById('weather-cond');
    var wCondMap = {clear:'Ясно',mainly_clear:'Ясно',partly_cloudy:'Облачно',overcast:'Пасмурно',slight_rain:'Дождь',moderate_rain:'Дождь',unknown:'Н/Д'};
    if (wCond) wCond.textContent = wCondMap[lw.condition] || lw.condition;
}
```

- [ ] **Step 3: Add helper to build weather markArea from zones**

```javascript
function buildWeatherMarkArea(zones) {
    if (!zones || !zones.length) return null;
    var colorMap = {
        'clear': 'rgba(250,204,21,0.04)', 'mainly_clear': 'rgba(250,204,21,0.04)',
        'partly_cloudy': 'rgba(148,163,184,0.04)', 'overcast': 'rgba(148,163,184,0.04)',
        'slight_rain': 'rgba(96,165,250,0.06)', 'moderate_rain': 'rgba(96,165,250,0.08)',
    };
    return {
        silent: true,
        data: zones.map(function(z) {
            return [
                { xAxis: z.start, itemStyle: { color: colorMap[z.condition] || 'transparent' } },
                { xAxis: z.end }
            ];
        })
    };
}
```

- [ ] **Step 4: Apply weather markArea to existing charts**

Pass `data.weather_zones` through to render functions and add `markArea` to the vibration axes chart, audio main chart, and engine chart series. Add a hidden series with markArea to each:

```javascript
// Example: in vibration chart options, add to series array:
{ name: 'Погода', type: 'line', data: [], markArea: buildWeatherMarkArea(data.weather_zones) }
```

- [ ] **Step 5: Deploy and verify all 3 phases**

Final deploy of index.html + views.py + urls.py. Verify all tabs work.

---

## Deployment Checklist

- [ ] All backend files deployed via SCP
- [ ] geohash2 installed on server
- [ ] gunicorn restarted
- [ ] Tab "Поездки" shows map with routes
- [ ] Tab "Диагностика" shows alerts + ECU params + voltage chart
- [ ] Weather card visible on Overview
- [ ] Weather strips visible on timeline charts
