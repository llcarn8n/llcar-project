# LLCAR Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Plotly.js dashboard at llcar.ru with a premium automotive-themed UI using ECharts, SVG gauges, tab navigation, and health status system.

**Architecture:** Django single-template app. Backend (views.py) computes health status and serves data per-tab with full QTP shape values. Frontend (index.html) uses ECharts 5 + echarts-gl for charts, custom SVG for gauges, Tailwind for layout, CSS custom properties for chrome theme. All via CDN, no build step.

**Tech Stack:** Django 5.2, ECharts 5 (CDN), echarts-gl (CDN), Tailwind CSS (CDN), SVG, CSS animations

**Spec:** `docs/superpowers/specs/2026-04-04-llcar-dashboard-redesign.md`

**Server:** 185.55.57.145 (user: webadmin, key: ~/.ssh/id_ed25519.txt, passphrase: webadmin)
**Deploy path:** `/var/www/html/django/dashboard/`
**Reload:** `touch /var/www/html/django/dashboard/views.py` (gunicorn --reload)

**Files:**
- Modify: `/var/www/html/django/dashboard/views.py` (Task 1)
- Rewrite: `/var/www/html/django/dashboard/templates/dashboard/index.html` (Tasks 2-7)

---

## Task 1: Backend — views.py (health + tab + shape data)

**Files:**
- Modify: `/var/www/html/django/dashboard/views.py`

### What changes:
1. Add `health` object to `/api/stats/` response
2. Add `tab` query parameter to `/api/data/`
3. Add shape1-4 columns for accelerometer
4. Return all 10 freq+amp pairs for audio
5. Add extra PID columns for engine tab

- [ ] **Step 1: Write new views.py locally**

Create `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\views.py` with all changes.

Key additions to `api_stats()`:

```python
# After existing stats queries, add health computation:
with _vehinfo() as c:
    # Get latest readings for health
    c.execute("""
        SELECT p0105, p010c, p0142 FROM ecu_7e8
        WHERE time > NOW() - INTERVAL '5 minutes'
        ORDER BY time DESC LIMIT 1
    """)
    latest_pid = c.fetchone()

    c.execute("""
        SELECT ax_std, ay_std, az_std FROM accel_windows
        WHERE time > NOW() - INTERVAL '5 minutes'
        ORDER BY time DESC LIMIT 1
    """)
    latest_accel = c.fetchone()

    c.execute("""
        SELECT quality FROM audio_windows
        WHERE time > NOW() - INTERVAL '5 minutes'
        ORDER BY time DESC LIMIT 1
    """)
    latest_audio = c.fetchone()

# Compute health
def _health_status(value, normal_range, warn_range):
    if value is None:
        return 'unknown'
    lo_n, hi_n = normal_range
    lo_w, hi_w = warn_range
    if lo_n <= value <= hi_n:
        return 'normal'
    if lo_w <= value <= hi_w:
        return 'warning'
    return 'alert'

coolant = latest_pid[0] if latest_pid else None
rpm = latest_pid[1] if latest_pid else None
voltage = latest_pid[2] if latest_pid else None
max_vib_std = None
if latest_accel:
    stds = [qtp_std(v) or 0 for v in latest_accel]
    max_vib_std = max(stds)
audio_q = latest_audio[0] if latest_audio else None

subsystems = {
    'engine': {
        'status': _health_status(coolant, (0, 95), (0, 105)),
        'detail': f'Темп {coolant}°C' if coolant else 'Нет данных'
    },
    'suspension': {
        'status': _health_status(max_vib_std, (0, 2.0), (0, 4.0)) if max_vib_std else 'unknown',
        'detail': f'Вибрация {max_vib_std:.1f} m/s²' if max_vib_std else 'Нет данных'
    },
    'electrical': {
        'status': _health_status(voltage, (135, 145), (125, 155)),
        'detail': f'{voltage/10:.1f}V' if voltage else 'Нет данных'
    },
    'audio': {
        'status': 'normal' if (audio_q and audio_q > 30) else 'warning' if audio_q else 'unknown',
        'detail': f'Качество {audio_q}' if audio_q else 'Нет данных'
    }
}

statuses = [s['status'] for s in subsystems.values()]
if 'alert' in statuses:
    overall = 'alert'
    alert_sub = [k for k,v in subsystems.items() if v['status'] == 'alert']
    message = f'Тревога: {subsystems[alert_sub[0]]["detail"]}'
elif 'warning' in statuses:
    overall = 'warning'
    warn_sub = [k for k,v in subsystems.items() if v['status'] == 'warning']
    message = f'Внимание: {subsystems[warn_sub[0]]["detail"]}'
else:
    overall = 'normal'
    message = 'Все системы в норме'

health = {'status': overall, 'message': message, 'subsystems': subsystems}
```

Key changes to `api_data()`:

```python
# Add tab parameter
tab = request.GET.get('tab', 'overview')

# Accelerometer: add shape columns
c.execute(f"""
    SELECT time, packet_id, window_index,
           ax_min, ax_max, ax_avg, ax_std,
           ax_shape1, ax_shape2, ax_shape3, ax_shape4,
           ay_min, ay_max, ay_avg, ay_std,
           ay_shape1, ay_shape2, ay_shape3, ay_shape4,
           az_min, az_max, az_avg, az_std,
           az_shape1, az_shape2, az_shape3, az_shape4
    FROM accel_windows
    WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
    ORDER BY time ASC LIMIT {limit * 3}
""", [client] if client else [])

# Build expanded accel points (6 points per window instead of 1)
def expand_qtp_window(row, axis_prefix):
    """Expand QTP window into 6 ordered points with min/max band"""
    avg = qtp_avg(row[f'{axis_prefix}_avg'])
    return {
        'avg': avg,
        'min': qtp_avg(row[f'{axis_prefix}_min']),
        'max': qtp_avg(row[f'{axis_prefix}_max']),
        'std': qtp_std(row[f'{axis_prefix}_std']),
        's1': qtp_avg(row[f'{axis_prefix}_shape1']),
        's2': qtp_avg(row[f'{axis_prefix}_shape2']),
        's3': qtp_avg(row[f'{axis_prefix}_shape3']),
        's4': qtp_avg(row[f'{axis_prefix}_shape4']),
    }

# Audio: return all 10 freq+amp pairs
c.execute(f"""
    SELECT time, packet_id, window_index,
           freq_1, amp_1, freq_2, amp_2, freq_3, amp_3,
           freq_4, amp_4, freq_5, amp_5, freq_6, amp_6,
           freq_7, amp_7, freq_8, amp_8, freq_9, amp_9,
           freq_10, amp_10, quality
    FROM audio_windows
    WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
    ORDER BY time ASC LIMIT {limit}
""", [client] if client else [])

# Engine tab: extra PIDs
if tab in ('engine', 'overview'):
    c.execute(f"""
        SELECT time, packet_id,
               p010c, p010d, p0105, p0104, p0111,
               p012f, p0142, p0145, p0146, p011f, p0187
        FROM ecu_7e8
        WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
        ORDER BY time ASC LIMIT {limit}
    """, [client] if client else [])
```

- [ ] **Step 2: Verify locally (syntax check)**

Run: `python -c "import py_compile; py_compile.compile('dashboard_build/views.py', doraise=True)"`
Expected: No errors

- [ ] **Step 3: Deploy views.py to server**

```bash
scp -i ~/.ssh/id_ed25519.txt views.py webadmin@185.55.57.145:/var/www/html/django/dashboard/views.py
```

- [ ] **Step 4: Verify API response**

```bash
ssh webadmin@185.55.57.145 "curl -s http://localhost:8001/api/stats/ | python3 -m json.tool | head -30"
```
Expected: JSON with `health` object containing `status`, `message`, `subsystems`

- [ ] **Step 5: Test tab parameter**

```bash
ssh webadmin@185.55.57.145 "curl -s 'http://localhost:8001/api/data/?minutes=60&limit=10&tab=engine' | python3 -m json.tool | head -20"
```
Expected: JSON with `pids` array containing fuel, voltage fields

---

## Task 2: Frontend — HTML skeleton + CSS theme + tabs

**Files:**
- Create: `C:\Users\Петр\Downloads\Маркетинговые материалы\dashboard_build\index.html`

Build the base HTML structure with chrome theme, header, tabs, and tab switching logic.

- [ ] **Step 1: Create dashboard_build directory**

```bash
mkdir -p "C:/Users/Петр/Downloads/Маркетинговые материалы/dashboard_build"
```

- [ ] **Step 2: Write HTML skeleton**

Write `dashboard_build/index.html` with:
- `<!DOCTYPE html>` + meta tags + lang="ru"
- CDN links: Tailwind, ECharts 5, echarts-gl
- CSS custom properties for chrome theme (all colors from spec)
- Header: LLCAR logo (text version), tab buttons, client selector, time range selector
- Tab container divs (4 tabs, only active visible)
- JS: tab switching with localStorage persistence

Key CSS (`:root` variables):
```css
:root {
    --bg-body: #08080c;
    --bg-card: #111116;
    --bg-card-hover: #16161c;
    --border: #1e1e28;
    --border-active: #3a3a55;
    --text-primary: #c0c0cc;
    --text-secondary: #555566;
    --chrome: #d4d4e0;
    --status-normal: #4ade80;
    --status-warning: #f59e0b;
    --status-alert: #ef4444;
    --glow-normal: 0 0 12px rgba(74,222,128,0.3);
    --glow-warning: 0 0 12px rgba(245,158,11,0.3);
    --glow-alert: 0 0 12px rgba(239,68,68,0.3);
}
```

Key HTML structure:
```html
<header><!-- logo + tabs + controls --></header>
<div id="health-bar"><!-- pulse + status --></div>
<div id="metrics-row"><!-- car card + 4 gauges --></div>
<div id="tab-overview" class="tab-content active"><!-- charts --></div>
<div id="tab-engine" class="tab-content"><!-- charts --></div>
<div id="tab-suspension" class="tab-content"><!-- charts --></div>
<div id="tab-audio" class="tab-content"><!-- charts --></div>
```

Key JS (tab switching):
```javascript
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).style.display = 'block';
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    localStorage.setItem('llcar-tab', tabName);
    loadData(tabName);
}
```

- [ ] **Step 3: Verify HTML renders locally**

Open `dashboard_build/index.html` in browser. Check: dark background, header visible, tabs switch, no JS errors in console.

---

## Task 3: Frontend — Health bar + SVG pulse animation

**Files:**
- Modify: `dashboard_build/index.html` (health-bar section)

- [ ] **Step 1: Add health bar HTML + SVG pulse**

```html
<div id="health-bar" class="health-bar">
    <div class="health-pulse">
        <svg viewBox="0 0 200 40" class="pulse-svg">
            <path class="pulse-line" d="M0,20 L60,20 L70,20 L75,5 L80,35 L85,15 L90,25 L95,20 L200,20"
                  fill="none" stroke="var(--status-normal)" stroke-width="1.5"/>
            <path class="pulse-line pulse-glow" d="M0,20 L60,20 L70,20 L75,5 L80,35 L85,15 L90,25 L95,20 L200,20"
                  fill="none" stroke="var(--status-normal)" stroke-width="3" opacity="0.3"/>
        </svg>
    </div>
    <div class="health-status">
        <span id="health-text" class="health-message">Загрузка...</span>
        <div class="health-dots" id="health-dots">
            <span class="dot" data-sub="engine" title="Двигатель"></span>
            <span class="dot" data-sub="suspension" title="Подвеска"></span>
            <span class="dot" data-sub="electrical" title="Электрика"></span>
            <span class="dot" data-sub="audio" title="Аудио"></span>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Add pulse CSS animation**

```css
.pulse-svg { width: 120px; height: 30px; }
.pulse-line {
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
    animation: pulse-draw 2s ease-in-out infinite;
}
.health-bar[data-status="warning"] .pulse-line { animation-duration: 1.2s; }
.health-bar[data-status="alert"] .pulse-line { animation-duration: 0.6s; }
@keyframes pulse-draw {
    0% { stroke-dashoffset: 200; }
    50% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -200; }
}
.dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--text-secondary);
    transition: background 0.3s, box-shadow 0.3s;
}
.dot[data-status="normal"] { background: var(--status-normal); box-shadow: var(--glow-normal); }
.dot[data-status="warning"] { background: var(--status-warning); box-shadow: var(--glow-warning); }
.dot[data-status="alert"] { background: var(--status-alert); box-shadow: var(--glow-alert); }
```

- [ ] **Step 3: Add JS to update health from API**

```javascript
function updateHealth(health) {
    const bar = document.getElementById('health-bar');
    bar.dataset.status = health.status;

    const color = health.status === 'alert' ? 'var(--status-alert)'
                : health.status === 'warning' ? 'var(--status-warning)'
                : 'var(--status-normal)';

    bar.querySelectorAll('.pulse-line').forEach(p => p.style.stroke = color);
    document.getElementById('health-text').textContent = health.message;
    document.getElementById('health-text').style.color = color;

    for (const [key, sub] of Object.entries(health.subsystems)) {
        const dot = document.querySelector(`.dot[data-sub="${key}"]`);
        if (dot) { dot.dataset.status = sub.status; dot.title = sub.detail; }
    }
}
```

- [ ] **Step 4: Verify pulse animation**

Open locally, check: SVG pulse animates, dots visible, no console errors.

---

## Task 4: Frontend — SVG gauge metrics + car status card

**Files:**
- Modify: `dashboard_build/index.html` (metrics-row section)

- [ ] **Step 1: Add car status card + 4 SVG gauge arcs**

Car status card: silhouette SVG + overall status text + subsystem dots.

SVG gauge: reusable function that draws a 180-degree arc with value fill.

```javascript
function createGauge(containerId, value, max, label, unit, color) {
    const pct = Math.min(value / max, 1);
    const angle = pct * 180;
    const rad = (angle - 90) * Math.PI / 180;
    const x = 50 + 40 * Math.cos(rad);
    const y = 50 + 40 * Math.sin(rad);
    const largeArc = angle > 90 ? 1 : 0;

    return `
    <svg viewBox="0 0 100 60" class="gauge-svg">
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="var(--border)" stroke-width="4" stroke-linecap="round"/>
        <path d="M10,55 A40,40 0 ${largeArc},1 ${x},${y}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"
              style="filter: drop-shadow(0 0 4px ${color}40)"/>
        <text x="50" y="45" text-anchor="middle" fill="var(--text-primary)" font-size="14" font-weight="bold">${value}</text>
        <text x="50" y="55" text-anchor="middle" fill="var(--text-secondary)" font-size="6">${unit}</text>
    </svg>
    <div class="gauge-label">${label}</div>`;
}
```

4 gauges layout:
| Gauge | Max | Color logic |
|-------|-----|-------------|
| Speed | 220 | chrome always |
| RPM | 8000 | chrome < 5000, amber 5000-7000, red > 7000 |
| Coolant | 130 | green < 95, amber 95-105, red > 105 |
| Vibration | 6.0 | green < 2, amber 2-4, red > 4 |

- [ ] **Step 2: Add gauge update JS**

```javascript
function updateMetrics(data) {
    const last = data.pids[data.pids.length - 1] || {};
    const lastAccel = data.accel[data.accel.length - 1] || {};
    const maxStd = Math.max(lastAccel.x_std||0, lastAccel.y_std||0, lastAccel.z_std||0);

    document.getElementById('gauge-speed').innerHTML = createGauge('gauge-speed',
        last.speed || 0, 220, 'Скорость', 'км/ч', 'var(--chrome)');
    document.getElementById('gauge-rpm').innerHTML = createGauge('gauge-rpm',
        last.rpm || 0, 8000, 'Обороты', 'об/мин',
        (last.rpm||0) > 7000 ? 'var(--status-alert)' : (last.rpm||0) > 5000 ? 'var(--status-warning)' : 'var(--chrome)');
    document.getElementById('gauge-temp').innerHTML = createGauge('gauge-temp',
        last.coolant || 0, 130, 'Температура', '°C',
        (last.coolant||0) > 105 ? 'var(--status-alert)' : (last.coolant||0) > 95 ? 'var(--status-warning)' : 'var(--status-normal)');
    document.getElementById('gauge-vib').innerHTML = createGauge('gauge-vib',
        maxStd.toFixed(1), 6, 'Вибрация', 'm/s²',
        maxStd > 4 ? 'var(--status-alert)' : maxStd > 2 ? 'var(--status-warning)' : 'var(--status-normal)');
}
```

- [ ] **Step 3: Verify gauges render**

Open locally with mock data. Check: 4 arcs visible, colors correct, values displayed.

---

## Task 5: Frontend — Overview tab (3D charts + sparklines)

**Files:**
- Modify: `dashboard_build/index.html` (tab-overview section)

- [ ] **Step 1: Add ECharts 3D accelerometer**

```javascript
function renderAccel3D(accel) {
    const chart = echarts.init(document.getElementById('chart-accel-3d'), null, {renderer:'canvas'});
    const data = accel.map(a => [new Date(a.ts).getTime(), a.x, a.z, a.y]);

    chart.setOption({
        backgroundColor: 'transparent',
        grid3D: { boxWidth: 100, boxHeight: 60, boxDepth: 100,
                  viewControl: { distance: 200, alpha: 25, beta: 40 },
                  axisLine: { lineStyle: { color: '#2a2a35' } },
                  axisPointer: { lineStyle: { color: '#555' } },
                  environment: 'transparent' },
        xAxis3D: { type: 'time', name: 'Время', nameTextStyle: { color: '#666' },
                   axisLabel: { color: '#555', formatter: '{HH}:{mm}' } },
        yAxis3D: { type: 'value', name: 'X бок', nameTextStyle: { color: '#f87171' },
                   axisLabel: { color: '#555' } },
        zAxis3D: { type: 'value', name: 'Z верт', nameTextStyle: { color: '#60a5fa' },
                   axisLabel: { color: '#555' } },
        visualMap: { show: true, dimension: 3, min: -10, max: 0, text: ['0','−10'],
                     inRange: { color: ['#ef4444','#facc15','#4ade80'] },
                     textStyle: { color: '#666' }, right: 10, bottom: 10 },
        series: [{
            type: 'scatter3D', data: data,
            symbolSize: 3, itemStyle: { opacity: 0.8 },
            emphasis: { itemStyle: { color: '#fff' } }
        }]
    });
    return chart;
}
```

- [ ] **Step 2: Add ECharts 3D vibration**

Same pattern as accelerometer but using std values and yellow/red colorscale.

```javascript
function renderVib3D(accel) {
    const chart = echarts.init(document.getElementById('chart-vib-3d'), null, {renderer:'canvas'});
    const data = accel.map(a => {
        const total = Math.sqrt((a.x_std||0)**2 + (a.y_std||0)**2 + (a.z_std||0)**2);
        return [new Date(a.ts).getTime(), a.x_std||0, a.z_std||0, total];
    });

    chart.setOption({
        backgroundColor: 'transparent',
        grid3D: { boxWidth: 100, boxHeight: 60, boxDepth: 100,
                  viewControl: { distance: 200, alpha: 25, beta: 40 },
                  axisLine: { lineStyle: { color: '#2a2a35' } },
                  environment: 'transparent' },
        xAxis3D: { type: 'time', name: 'Время',
                   axisLabel: { color: '#555', formatter: '{HH}:{mm}' } },
        yAxis3D: { type: 'value', name: 'X вибр',
                   axisLabel: { color: '#555' } },
        zAxis3D: { type: 'value', name: 'Z вибр',
                   axisLabel: { color: '#555' } },
        visualMap: { show: true, dimension: 3, min: 0, max: 6,
                     inRange: { color: ['#4ade80','#facc15','#f97316','#ef4444'] },
                     textStyle: { color: '#666' }, right: 10, bottom: 10 },
        series: [{
            type: 'scatter3D', data: data,
            symbolSize: 4, itemStyle: { opacity: 0.7 }
        }]
    });
    return chart;
}
```

- [ ] **Step 3: Add mini sparklines for RPM/speed**

```javascript
function renderSparklines(pids) {
    const spark = echarts.init(document.getElementById('sparklines'), null, {height: 60});
    spark.setOption({
        backgroundColor: 'transparent',
        grid: { top: 5, bottom: 5, left: 40, right: 40 },
        xAxis: { type: 'time', show: false },
        yAxis: [
            { type: 'value', show: false },
            { type: 'value', show: false }
        ],
        series: [
            { type: 'line', data: pids.map(p => [p.ts, p.rpm]),
              lineStyle: { color: '#c0c0cc', width: 1 }, symbol: 'none', yAxisIndex: 0 },
            { type: 'line', data: pids.map(p => [p.ts, p.speed]),
              lineStyle: { color: '#60a5fa', width: 1 }, symbol: 'none', yAxisIndex: 1 }
        ]
    });
    return spark;
}
```

- [ ] **Step 4: Verify 3D charts render**

Open locally. Check: two 3D scatter plots visible, rotatable, colorscale working.

---

## Task 6: Frontend — Engine tab (2D charts + extra metrics)

**Files:**
- Modify: `dashboard_build/index.html` (tab-engine section)

- [ ] **Step 1: Add RPM + Speed dual-Y chart with dataZoom**

```javascript
function renderEngineRpmSpeed(pids) {
    const chart = echarts.init(document.getElementById('chart-rpm-speed'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['RPM', 'Скорость'], textStyle: { color: '#666' }, top: 0 },
        grid: { top: 40, bottom: 60, left: 55, right: 55 },
        dataZoom: [
            { type: 'slider', height: 20, bottom: 5,
              borderColor: 'var(--border)', backgroundColor: '#0a0a0f',
              fillerColor: 'rgba(212,212,224,0.08)',
              handleStyle: { color: '#555' },
              textStyle: { color: '#555' } },
            { type: 'inside' }
        ],
        xAxis: { type: 'time', axisLine: { lineStyle: { color: '#2a2a35' } },
                 axisLabel: { color: '#555', formatter: '{HH}:{mm}' } },
        yAxis: [
            { type: 'value', name: 'RPM', nameTextStyle: { color: '#c0c0cc' },
              axisLine: { lineStyle: { color: '#2a2a35' } }, axisLabel: { color: '#555' },
              splitLine: { lineStyle: { color: '#1a1a24' } } },
            { type: 'value', name: 'км/ч', nameTextStyle: { color: '#60a5fa' },
              axisLine: { lineStyle: { color: '#2a2a35' } }, axisLabel: { color: '#555' },
              splitLine: { show: false } }
        ],
        series: [
            { name: 'RPM', type: 'line', data: pids.map(p => [p.ts, p.rpm]),
              lineStyle: { color: '#c0c0cc', width: 1.5 }, symbol: 'none', yAxisIndex: 0,
              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: 'rgba(192,192,204,0.1)' },
                             { offset: 1, color: 'rgba(192,192,204,0)' }] } } },
            { name: 'Скорость', type: 'line', data: pids.map(p => [p.ts, p.speed]),
              lineStyle: { color: '#60a5fa', width: 1.5 }, symbol: 'none', yAxisIndex: 1 }
        ]
    });
    return chart;
}
```

- [ ] **Step 2: Add Temperature + Load + Throttle chart**

Same pattern, 3 series on dual Y (temp on left, load+throttle % on right).

- [ ] **Step 3: Add extra metric cards (fuel, voltage, runtime)**

HTML cards showing latest values for fuel %, voltage V, runtime minutes. Updated from `pids` data in `updateMetrics()`.

- [ ] **Step 4: Link dataZoom between charts**

```javascript
// Shared dataZoom: when one chart zooms, update the other
chartRpmSpeed.on('datazoom', function(params) {
    const opt = chartRpmSpeed.getOption();
    chartEngineTemp.setOption({ dataZoom: opt.dataZoom });
});
chartEngineTemp.on('datazoom', function(params) {
    const opt = chartEngineTemp.getOption();
    chartRpmSpeed.setOption({ dataZoom: opt.dataZoom });
});
```

- [ ] **Step 5: Verify engine tab renders**

Switch to engine tab. Check: two charts with dataZoom, synced zoom, extra cards.

---

## Task 7: Frontend — Suspension + Audio tabs

**Files:**
- Modify: `dashboard_build/index.html` (tab-suspension and tab-audio sections)

- [ ] **Step 1: Suspension — full-width 3D accel + vibration area chart**

3D accelerometer: same as overview but larger container (full width).

Vibration by axis: ECharts stacked area chart (X/Y/Z std over time).

```javascript
function renderVibrationAxes(accel) {
    const chart = echarts.init(document.getElementById('chart-vib-axes'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['X', 'Y', 'Z'], textStyle: { color: '#666' } },
        grid: { top: 35, bottom: 60, left: 50, right: 20 },
        dataZoom: [{ type: 'slider', height: 20, bottom: 5,
                     borderColor: 'var(--border)', backgroundColor: '#0a0a0f' },
                   { type: 'inside' }],
        xAxis: { type: 'time', axisLabel: { color: '#555' } },
        yAxis: { type: 'value', name: 'm/s²', axisLabel: { color: '#555' },
                 splitLine: { lineStyle: { color: '#1a1a24' } } },
        series: [
            { name: 'X', type: 'line', stack: 'vib', areaStyle: { opacity: 0.3 },
              data: accel.map(a => [a.ts, a.x_std||0]),
              lineStyle: { color: '#f87171', width: 1 }, itemStyle: { color: '#f87171' }, symbol: 'none' },
            { name: 'Y', type: 'line', stack: 'vib', areaStyle: { opacity: 0.3 },
              data: accel.map(a => [a.ts, a.y_std||0]),
              lineStyle: { color: '#4ade80', width: 1 }, itemStyle: { color: '#4ade80' }, symbol: 'none' },
            { name: 'Z', type: 'line', stack: 'vib', areaStyle: { opacity: 0.3 },
              data: accel.map(a => [a.ts, a.z_std||0]),
              lineStyle: { color: '#60a5fa', width: 1 }, itemStyle: { color: '#60a5fa' }, symbol: 'none' }
        ]
    });
    return chart;
}
```

Road type badge: simple div showing `data.packets[last].road` with color coding.

- [ ] **Step 2: Audio — spectrum bar + quality timeline**

Spectrum: ECharts bar chart from last audio reading, all 10 freq+amp pairs.

```javascript
function renderAudioSpectrum(audioLast) {
    const chart = echarts.init(document.getElementById('chart-audio-spectrum'));
    const freqs = audioLast.freqs; // [[freq, amp], ...]
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { top: 10, bottom: 30, left: 40, right: 10 },
        xAxis: { type: 'category', data: freqs.map(f => f[0] + ' Гц'),
                 axisLabel: { color: '#555', rotate: 45 } },
        yAxis: { type: 'value', name: 'Амплитуда', axisLabel: { color: '#555' },
                 splitLine: { lineStyle: { color: '#1a1a24' } } },
        series: [{
            type: 'bar', data: freqs.map(f => f[1]),
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#4c1d95' }] },
                borderRadius: [3, 3, 0, 0]
            }
        }]
    });
    return chart;
}
```

Quality + dominant frequency: dual-Y line chart with dataZoom.

- [ ] **Step 3: Verify both tabs**

Switch to Suspension tab: 3D chart + area chart + road badge.
Switch to Audio tab: bar spectrum + timeline + last measurement card.

---

## Task 8: Frontend — Data loading + auto-refresh + responsive

**Files:**
- Modify: `dashboard_build/index.html` (JS section)

- [ ] **Step 1: Add unified data loader**

```javascript
let charts = {};
let refreshTimer = null;

async function loadData(tab) {
    tab = tab || localStorage.getItem('llcar-tab') || 'overview';
    const client = document.getElementById('client-select').value;
    const mins = document.getElementById('time-range').value;
    const url = `/api/data/?minutes=${mins}&limit=3000&tab=${tab}` + (client ? `&client=${client}` : '');

    try {
        const [data, stats] = await Promise.all([
            fetch(url).then(r => r.json()),
            fetch('/api/stats/').then(r => r.json())
        ]);

        // Update health
        if (stats.health) updateHealth(stats.health);

        // Update metrics
        updateMetrics(data);

        // Render active tab charts
        if (tab === 'overview') {
            charts.accel3d = renderAccel3D(data.accel);
            charts.vib3d = renderVib3D(data.accel);
            if (data.pids.length) charts.spark = renderSparklines(data.pids);
        } else if (tab === 'engine') {
            charts.rpmSpeed = renderEngineRpmSpeed(data.pids);
            charts.engineTemp = renderEngineTemp(data.pids);
        } else if (tab === 'suspension') {
            charts.accel3dFull = renderAccel3D(data.accel); // reuse, bigger container
            charts.vibAxes = renderVibrationAxes(data.accel);
        } else if (tab === 'audio') {
            if (data.audio.length) {
                charts.audioSpectrum = renderAudioSpectrum(data.audio[data.audio.length - 1]);
                charts.audioTimeline = renderAudioTimeline(data.audio);
            }
        }

        // Status bar
        document.getElementById('status-text').textContent =
            `${data.accel.length} акс, ${data.pids.length} PID, ${data.audio.length} аудио`;
    } catch (e) {
        document.getElementById('status-text').textContent = 'Ошибка: ' + e.message;
    }
}

// Auto-refresh every 15s
function startRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => loadData(), 15000);
}
```

- [ ] **Step 2: Add responsive resize handling**

```javascript
window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => { if (c && c.resize) c.resize(); });
});
```

Tailwind responsive classes:
- Charts grid: `grid grid-cols-1 lg:grid-cols-2`
- Metrics: `grid grid-cols-2 md:grid-cols-4`
- Gauges on mobile: `grid grid-cols-2` (2x2 instead of 1x4)

- [ ] **Step 3: Add ECharts dispose on tab switch**

```javascript
function disposeTabCharts() {
    Object.values(charts).forEach(c => { if (c && c.dispose) c.dispose(); });
    charts = {};
}
```

Call `disposeTabCharts()` before `loadData(newTab)` in `switchTab()`.

- [ ] **Step 4: Init on page load**

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const savedTab = localStorage.getItem('llcar-tab') || 'overview';
    switchTab(savedTab);
    startRefresh();
});
```

---

## Task 9: Assemble, deploy, verify

**Files:**
- Final: `dashboard_build/index.html` (assembled from Tasks 2-8)
- Deploy: `dashboard_build/views.py` + `dashboard_build/index.html` to server

- [ ] **Step 1: Final local review**

Open `dashboard_build/index.html` in browser. Verify:
- Chrome theme renders (dark background, silver text)
- Tabs switch
- Pulse animation plays
- Gauges draw arcs
- No JS console errors

- [ ] **Step 2: Deploy both files to server**

```bash
export SSH_ASKPASS_REQUIRE=force && export SSH_ASKPASS="$(mktemp)"
echo '#!/bin/sh' > "$SSH_ASKPASS" && echo 'echo webadmin' >> "$SSH_ASKPASS" && chmod +x "$SSH_ASKPASS"

scp -i "$HOME/.ssh/id_ed25519.txt" -o StrictHostKeyChecking=no \
  dashboard_build/views.py webadmin@185.55.57.145:/var/www/html/django/dashboard/views.py

scp -i "$HOME/.ssh/id_ed25519.txt" -o StrictHostKeyChecking=no \
  dashboard_build/index.html webadmin@185.55.57.145:/var/www/html/django/dashboard/templates/dashboard/index.html

rm -f "$SSH_ASKPASS"
```

- [ ] **Step 3: Trigger gunicorn reload**

```bash
ssh webadmin@185.55.57.145 "touch /var/www/html/django/dashboard/views.py"
```

- [ ] **Step 4: Verify via Playwright screenshot**

```javascript
// Use Playwright MCP to navigate and screenshot
mcp__playwright__browser_navigate({ url: 'https://llcar.ru' })
mcp__playwright__browser_take_screenshot()
```

Check: dashboard loads, health bar visible, charts render, tabs work.

- [ ] **Step 5: Test each tab via Playwright**

Navigate to llcar.ru, click each tab, screenshot each one. Verify no JS errors via `browser_console_messages`.

- [ ] **Step 6: Verify API responses**

```bash
ssh webadmin@185.55.57.145 "curl -s https://llcar.ru/api/stats/ | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get(\"health\",{}).get(\"status\",\"MISSING\"))'"
```
Expected: `normal` or `warning` or `alert`

---

## Summary

| Task | What | Est. |
|------|------|------|
| 1 | Backend: views.py (health + tab + shapes) | 15 min |
| 2 | Frontend: skeleton + CSS + tabs | 15 min |
| 3 | Frontend: health bar + pulse SVG | 10 min |
| 4 | Frontend: SVG gauges + metrics | 10 min |
| 5 | Frontend: Overview tab (3D charts) | 15 min |
| 6 | Frontend: Engine tab (2D charts) | 15 min |
| 7 | Frontend: Suspension + Audio tabs | 15 min |
| 8 | Frontend: data loading + refresh + responsive | 10 min |
| 9 | Assemble + deploy + verify | 10 min |
| **Total** | | **~2 hours** |
