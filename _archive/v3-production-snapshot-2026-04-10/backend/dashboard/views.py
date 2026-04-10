import json
import math
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.cache import never_cache
from django.shortcuts import render
from django.db import connections
from .anomaly_engine import (
    classify_regime, Regime, BaselineStore, RegimeBaseline,
    compute_derived_features, compute_anomaly_score,
    run_diagnostics, DegradationTracker,
    z_score_with_fallback,
)


def _anomaly_db():
    """Return cursor for anomaly tables (SQLite 'default' database)."""
    return connections['default'].cursor()


_anomaly_tables_ready = False

def _ensure_anomaly_tables():
    """Create anomaly tables in SQLite if they don't exist yet."""
    global _anomaly_tables_ready
    if _anomaly_tables_ready:
        return
    with _anomaly_db() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_baselines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_hash VARCHAR(64) NOT NULL,
            regime VARCHAR(20) NOT NULL,
            feature VARCHAR(40) NOT NULL,
            count INTEGER DEFAULT 0,
            mean REAL DEFAULT 0,
            m2 REAL DEFAULT 0,
            min_val REAL DEFAULT 1e18,
            max_val REAL DEFAULT -1e18,
            updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(client_hash, regime, feature)
        )""")
        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT DEFAULT (datetime('now')),
            client_hash VARCHAR(64) NOT NULL,
            regime VARCHAR(20),
            road_type VARCHAR(20),
            overall_score INTEGER,
            suspension_score INTEGER,
            engine_score INTEGER,
            electrical_score INTEGER,
            audio_score INTEGER,
            confidence REAL,
            degradation_detected INTEGER DEFAULT 0,
            trend_per_day REAL DEFAULT 0,
            top_diagnostic VARCHAR(40),
            top_diagnostic_confidence INTEGER DEFAULT 0,
            features_json TEXT
        )""")
        c.execute("CREATE INDEX IF NOT EXISTS idx_scores_client_time ON anomaly_scores(client_hash, time)")
        c.execute("""CREATE TABLE IF NOT EXISTS diagnostic_persistence (
            client_hash VARCHAR(64) NOT NULL,
            rule_name VARCHAR(40) NOT NULL,
            consecutive_count INTEGER DEFAULT 0,
            last_triggered TEXT,
            PRIMARY KEY(client_hash, rule_name)
        )""")
    _anomaly_tables_ready = True


def _dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def qtp_std(v):
    return round(v / 255.0 * 9.81, 2) if v is not None else None


def _vehinfo():
    return connections['vehinfo'].cursor()


@require_GET
@never_cache
def dashboard(request):
    """GET / - Main dashboard page"""
    with _vehinfo() as c:
        c.execute("SELECT DISTINCT client_hash FROM qtp_packets WHERE client_hash IS NOT NULL ORDER BY client_hash LIMIT 50")
        clients = [r[0] for r in c.fetchall()]
    return render(request, 'dashboard/index.html', {'clients': clients})


def dashboard_v2(request):
    """GET /v2/ - New React SPA dashboard"""
    import os
    spa_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'spa', 'index.html')
    with open(spa_path, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())


@require_GET
def api_data(request):
    """GET /api/data/ - historical data for dashboard charts"""
    client = request.GET.get('client', '')
    try:
        minutes = min(int(request.GET.get('minutes', 1440)), 10080)
    except (ValueError, TypeError):
        minutes = 1440
    try:
        limit = min(int(request.GET.get('limit', 2000)), 5000)
    except (ValueError, TypeError):
        limit = 2000
    tab = request.GET.get('tab', 'overview')

    cf = "AND client_hash = %s" if client else ""
    params = [client] if client else []

    # Packets (always returned for all tabs)
    with _vehinfo() as c:
        c.execute(f"""
            SELECT time, packet_id, client_hash, device_battery, device_charging,
                   acceleration_state, road_type
            FROM qtp_packets
            WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
            ORDER BY time ASC LIMIT {limit}
        """, params)
        packets = _dictfetchall(c)

    if not packets:
        return JsonResponse({'packets': [], 'accel': [], 'pids': [], 'audio': []})

    pkts = [{
        'ts': p['time'].isoformat(),
        'pid': p['packet_id'],
        'battery': p['device_battery'],
        'charging': p['device_charging'],
        'accel_state': p['acceleration_state'],
        'road': p['road_type'],
    } for p in packets]

    def qtp_avg(v):
        return round((v - 128) / 128.0 * 9.81, 2) if v is not None else None

    # --- Accelerometer ---
    accel = []
    if tab in ('overview', 'suspension'):
        shape_cols = ""
        if tab == 'suspension':
            shape_cols = (", ax_shape1, ax_shape2, ax_shape3, ax_shape4"
                          ", ay_shape1, ay_shape2, ay_shape3, ay_shape4"
                          ", az_shape1, az_shape2, az_shape3, az_shape4")

        with _vehinfo() as c:
            c.execute(f"""
                SELECT time, packet_id, window_index,
                       ax_min, ax_max, ax_avg, ax_std,
                       ay_min, ay_max, ay_avg, ay_std,
                       az_min, az_max, az_avg, az_std
                       {shape_cols}
                FROM accel_windows
                WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
                ORDER BY time ASC LIMIT {limit * 3}
            """, params)
            accel_raw = _dictfetchall(c)

        for r in accel_raw:
            row = {
                'ts': r['time'].isoformat(),
                'pid': r['packet_id'],
                'w': r['window_index'],
                'x': qtp_avg(r['ax_avg']), 'y': qtp_avg(r['ay_avg']), 'z': qtp_avg(r['az_avg']),
                'x_std': qtp_std(r['ax_std']), 'y_std': qtp_std(r['ay_std']), 'z_std': qtp_std(r['az_std']),
                'x_min': qtp_avg(r['ax_min']), 'x_max': qtp_avg(r['ax_max']),
                'y_min': qtp_avg(r['ay_min']), 'y_max': qtp_avg(r['ay_max']),
                'z_min': qtp_avg(r['az_min']), 'z_max': qtp_avg(r['az_max']),
            }
            if tab == 'suspension':
                row.update({
                    'x_s1': qtp_avg(r.get('ax_shape1')), 'x_s2': qtp_avg(r.get('ax_shape2')),
                    'x_s3': qtp_avg(r.get('ax_shape3')), 'x_s4': qtp_avg(r.get('ax_shape4')),
                    'y_s1': qtp_avg(r.get('ay_shape1')), 'y_s2': qtp_avg(r.get('ay_shape2')),
                    'y_s3': qtp_avg(r.get('ay_shape3')), 'y_s4': qtp_avg(r.get('ay_shape4')),
                    'z_s1': qtp_avg(r.get('az_shape1')), 'z_s2': qtp_avg(r.get('az_shape2')),
                    'z_s3': qtp_avg(r.get('az_shape3')), 'z_s4': qtp_avg(r.get('az_shape4')),
                })
            accel.append(row)

    # --- PIDs ---
    pids = []
    if tab in ('overview', 'engine'):
        with _vehinfo() as c:
            c.execute(f"""
                SELECT time, packet_id, p010c, p010d, p0105, p0104, p0111,
                       p012f, p0142, p0145, p0146, p011f
                FROM ecu_7e8
                WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
                ORDER BY time ASC LIMIT {limit}
            """, params)
            pids_raw = _dictfetchall(c)

        pids = [{
            'ts': r['time'].isoformat(),
            'pid': r['packet_id'],
            'rpm': r['p010c'], 'speed': r['p010d'], 'coolant': r['p0105'],
            'load': r['p0104'], 'throttle': r['p0111'], 'fuel': r['p012f'],
            'voltage': r['p0142'], 'rel_throttle': r['p0145'],
            'ambient_temp': r['p0146'], 'runtime': r['p011f'],
        } for r in pids_raw]

    # --- Audio ---
    audio = []
    if tab in ('overview', 'audio'):
        freq_range = range(1, 11) if tab == 'audio' else range(1, 6)
        freq_cols = ", ".join(
            f"freq_{i}, amp_{i}" for i in freq_range
        )

        with _vehinfo() as c:
            c.execute(f"""
                SELECT time, packet_id, window_index,
                       {freq_cols}, quality
                FROM audio_windows
                WHERE time > NOW() - INTERVAL '{minutes} minutes' {cf}
                ORDER BY time ASC LIMIT {limit}
            """, params)
            audio_raw = _dictfetchall(c)

        for r in audio_raw:
            freqs = []
            for i in freq_range:
                f, a = r.get(f'freq_{i}'), r.get(f'amp_{i}')
                if f is not None and f > 0:
                    freqs.append([f, a])
            audio.append({
                'ts': r['time'].isoformat(),
                'pid': r['packet_id'],
                'freqs': freqs,
                'quality': r['quality'],
            })

    # --- Weather zones for chart overlays ---
    weather_zones = []
    latest_weather = None
    with _vehinfo() as c:
        c.execute(f"""
            SELECT time, weather_condition, weather_temp
            FROM qtp_packets
            WHERE time > NOW() - INTERVAL '{minutes} minutes'
              AND weather_condition IS NOT NULL {cf}
            ORDER BY time ASC LIMIT 500
        """, params)
        weather_raw = _dictfetchall(c)

    if weather_raw:
        prev_cond = None
        zone_start = None
        for w in weather_raw:
            cond = w['weather_condition']
            if cond != prev_cond:
                if prev_cond and zone_start:
                    weather_zones.append({'start': zone_start, 'end': w['time'].isoformat(), 'condition': prev_cond})
                zone_start = w['time'].isoformat()
                prev_cond = cond
        if prev_cond and zone_start:
            weather_zones.append({'start': zone_start, 'end': weather_raw[-1]['time'].isoformat(), 'condition': prev_cond})
        lw = weather_raw[-1]
        latest_weather = {'temp': float(lw['weather_temp']) if lw['weather_temp'] else None, 'condition': lw['weather_condition']}

    return JsonResponse({
        'packets': pkts, 'accel': accel, 'pids': pids, 'audio': audio,
        'weather_zones': weather_zones, 'latest_weather': latest_weather,
    })


@require_GET
def api_stats(request):
    """GET /api/stats/"""
    client = request.GET.get('client', '')
    cf = "WHERE client_hash = %s" if client else ""
    cparams = [client] if client else []

    with _vehinfo() as c:
        c.execute(f"SELECT count(*) FROM qtp_packets {cf}", cparams)
        total_packets = c.fetchone()[0]
        c.execute("SELECT count(*) FROM accel_windows")
        total_accel = c.fetchone()[0]
        c.execute("SELECT count(*) FROM ecu_7e8")
        total_pids = c.fetchone()[0]
        c.execute("SELECT count(*) FROM audio_windows")
        total_audio = c.fetchone()[0]
        c.execute("SELECT count(DISTINCT client_hash) FROM qtp_packets")
        total_clients = c.fetchone()[0]
        c.execute(f"SELECT max(time) FROM qtp_packets {cf}", cparams)
        last_packet = c.fetchone()[0]

    # --- Health computation from last 5 minutes ---
    health = _compute_health(client)

    return JsonResponse({
        'total_packets': total_packets,
        'total_accel': total_accel,
        'total_pids': total_pids,
        'total_audio': total_audio,
        'total_clients': total_clients,
        'last_packet': last_packet.isoformat() if last_packet else None,
        'health': health,
    })


@require_GET
@never_cache
def api_health(request):
    """GET /api/health/ — Full health score with actual vs expected + AI explanations."""
    client = request.GET.get('client', '')
    cf = "AND client_hash = %s" if client else ""
    cparams = [client] if client else []

    alerts = []
    params_engine = []
    params_suspension = []
    params_electrical = []
    params_audio = []
    scores = {}

    # --- Engine params from latest PID data (24h window) ---
    with _vehinfo() as c:
        c.execute(f"""
            SELECT p010c, p010d, p0105, p0104, p0111, p012f, p0142, p0146
            FROM ecu_7e8
            WHERE time > NOW() - INTERVAL '1440 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        pid = c.fetchone()

    if pid:
        rpm, speed, coolant, load, throttle, fuel, voltage_raw, ambient = pid

        def _p(name, val, unit, exp_min, exp_max, abs_min, abs_max):
            if val is None:
                return {'name': name, 'value': None, 'unit': unit, 'expected': [exp_min, exp_max], 'range': [abs_min, abs_max], 'status': 'unknown', 'trend': '→'}
            st = 'ok'
            if val < exp_min * 0.5 or val > exp_max * 1.5:
                st = 'critical'
            elif val < exp_min or val > exp_max:
                st = 'warning'
            return {'name': name, 'value': round(val, 1) if isinstance(val, float) else val, 'unit': unit,
                    'expected': [exp_min, exp_max], 'range': [abs_min, abs_max], 'status': st, 'trend': '→'}

        params_engine = [
            _p('Обороты', rpm, 'об/мин', 700, 900, 0, 8000),
            _p('Скорость', speed, 'км/ч', 0, 120, 0, 220),
            _p('Температура ОЖ', coolant, '°C', 80, 95, -40, 150),
            _p('Нагрузка', load, '%', 10, 30, 0, 100),
            _p('Дроссель', throttle, '%', 10, 25, 0, 100),
        ]

        voltage_v = round(voltage_raw / 1000.0, 1) if voltage_raw else None
        params_electrical = [
            _p('Напряжение', voltage_v, 'В', 13.5, 14.5, 10, 16),
            _p('Топливо', fuel, '%', 20, 100, 0, 100),
        ]

        # Generate alerts
        if coolant is not None and coolant > 95:
            alerts.append({
                'system': 'engine', 'severity': 'warning' if coolant <= 105 else 'critical',
                'title': f'Температура ОЖ {coolant}°C',
                'explanation': f'Температура охлаждающей жидкости {"повышена" if coolant <= 105 else "критически высокая"}. Норма: 80-95°C.',
                'action': 'Проверить систему охлаждения, уровень антифриза, работу вентилятора',
            })
        if voltage_raw and (voltage_raw < 12500 or voltage_raw > 15000):
            alerts.append({
                'system': 'electrical', 'severity': 'warning' if 12000 < voltage_raw < 15500 else 'critical',
                'title': f'Напряжение {voltage_v}В',
                'explanation': f'Напряжение бортовой сети {"понижено" if voltage_raw < 13000 else "повышено"}. Норма: 13.5-14.5В.',
                'action': 'Проверить генератор и аккумулятор',
            })

        # Score engine
        eng_ok = sum(1 for p in params_engine if p['status'] == 'ok')
        scores['engine'] = int(eng_ok / max(len(params_engine), 1) * 100)
        scores['electrical'] = int(sum(1 for p in params_electrical if p['status'] in ('ok', 'unknown')) / max(len(params_electrical), 1) * 100)
    else:
        scores['engine'] = 0
        scores['electrical'] = 0

    # --- Suspension params ---
    with _vehinfo() as c:
        c.execute(f"""
            SELECT ax_std, ay_std, az_std
            FROM accel_windows
            WHERE time > NOW() - INTERVAL '1440 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        accel_row = c.fetchone()

    if accel_row:
        import math
        stds = [qtp_std(v) for v in accel_row if v is not None]
        vib = math.sqrt(sum(s*s for s in stds if s)) if stds else 0

        params_suspension = [
            {'name': 'Вибрация X', 'value': stds[0] if len(stds) > 0 else None, 'unit': 'm/s²',
             'expected': [0, 2.0], 'range': [0, 15], 'status': 'ok' if (stds[0] or 0) < 2 else 'warning' if (stds[0] or 0) < 4 else 'critical', 'trend': '→'},
            {'name': 'Вибрация Y', 'value': stds[1] if len(stds) > 1 else None, 'unit': 'm/s²',
             'expected': [0, 2.0], 'range': [0, 15], 'status': 'ok' if (stds[1] or 0) < 2 else 'warning' if (stds[1] or 0) < 4 else 'critical', 'trend': '→'},
            {'name': 'Вибрация Z', 'value': stds[2] if len(stds) > 2 else None, 'unit': 'm/s²',
             'expected': [0, 2.0], 'range': [0, 15], 'status': 'ok' if (stds[2] or 0) < 2 else 'warning' if (stds[2] or 0) < 4 else 'critical', 'trend': '→'},
            {'name': 'Общая вибрация', 'value': round(vib, 1), 'unit': 'm/s²',
             'expected': [0, 3.0], 'range': [0, 20], 'status': 'ok' if vib < 2 else 'warning' if vib < 4 else 'critical', 'trend': '→'},
        ]
        if vib > 4:
            alerts.append({
                'system': 'suspension', 'severity': 'critical',
                'title': f'Вибрация {round(vib,1)} m/s²',
                'explanation': 'Общая вибрация значительно выше нормы (< 3.0 m/s²). Возможно: износ подвески, разбалансировка колёс, неровная дорога.',
                'action': 'Проверить амортизаторы, сайлентблоки, балансировку',
            })
        elif vib > 2:
            alerts.append({
                'system': 'suspension', 'severity': 'warning',
                'title': f'Вибрация повышена ({round(vib,1)} m/s²)',
                'explanation': 'Вибрация выше оптимального уровня. Норма: < 2.0 m/s².',
                'action': 'Контроль при следующем ТО',
            })
        susp_ok = sum(1 for p in params_suspension if p['status'] == 'ok')
        scores['suspension'] = int(susp_ok / max(len(params_suspension), 1) * 100)
    else:
        scores['suspension'] = 0

    # --- Audio params ---
    with _vehinfo() as c:
        c.execute(f"""
            SELECT quality
            FROM audio_windows
            WHERE time > NOW() - INTERVAL '1440 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        audio_row = c.fetchone()

    if audio_row and audio_row[0] is not None:
        q = audio_row[0]
        params_audio = [
            {'name': 'Качество звука', 'value': q, 'unit': '', 'expected': [50, 100], 'range': [0, 100],
             'status': 'ok' if q > 50 else 'warning' if q > 20 else 'critical', 'trend': '→'},
        ]
        scores['audio'] = min(q, 100)
    else:
        scores['audio'] = 0

    # Overall score
    valid_scores = [v for v in scores.values() if v > 0]
    overall_score = int(sum(valid_scores) / len(valid_scores)) if valid_scores else 0

    if any(a['severity'] == 'critical' for a in alerts):
        overall_status = 'critical'
    elif any(a['severity'] == 'warning' for a in alerts):
        overall_status = 'warning'
    elif overall_score > 0:
        overall_status = 'ok'
    else:
        overall_status = 'unknown'

    # Sort alerts: critical first
    alerts.sort(key=lambda a: 0 if a['severity'] == 'critical' else 1 if a['severity'] == 'warning' else 2)

    return JsonResponse({
        'score': overall_score,
        'status': overall_status,
        'alerts': alerts,
        'systems': {
            'engine': {'score': scores.get('engine', 0), 'params': params_engine},
            'suspension': {'score': scores.get('suspension', 0), 'params': params_suspension},
            'electrical': {'score': scores.get('electrical', 0), 'params': params_electrical},
            'audio': {'score': scores.get('audio', 0), 'params': params_audio},
        }
    })


@require_GET
@never_cache
def api_maintenance(request):
    """GET /api/maintenance/ — Predictive maintenance + comparison baselines."""
    client = request.GET.get('client', '')
    cf = "AND client_hash = %s" if client else ""
    cparams = [client] if client else []

    # Get runtime hours and total data span
    with _vehinfo() as c:
        c.execute(f"""
            SELECT MIN(time), MAX(time), COUNT(*)
            FROM qtp_packets
            WHERE time IS NOT NULL {cf}
        """, cparams)
        row = c.fetchone()

    first_seen = row[0] if row else None
    last_seen = row[1] if row else None
    total_packets = row[2] if row else 0

    # Get average params for comparison baseline (last 7 days)
    with _vehinfo() as c:
        c.execute(f"""
            SELECT AVG(p010c) as avg_rpm, AVG(p010d) as avg_speed,
                   AVG(p0105) as avg_coolant, AVG(p0104) as avg_load,
                   AVG(p0111) as avg_throttle, AVG(p0142) as avg_voltage,
                   MAX(p011f) as max_runtime
            FROM ecu_7e8
            WHERE time > NOW() - INTERVAL '7 days' {cf}
        """, cparams)
        baseline = c.fetchone()

    avg_rpm = round(float(baseline[0])) if baseline and baseline[0] else None
    avg_speed = round(float(baseline[1])) if baseline and baseline[1] else None
    avg_coolant = round(float(baseline[2])) if baseline and baseline[2] else None
    avg_load = round(float(baseline[3])) if baseline and baseline[3] else None
    avg_throttle = round(float(baseline[4])) if baseline and baseline[4] else None
    avg_voltage = round(float(baseline[5]) / 1000.0, 1) if baseline and baseline[5] else None
    runtime_sec = float(baseline[6]) if baseline and baseline[6] else 0
    runtime_hours = round(runtime_sec / 3600.0, 1)

    # Vibration baseline
    import math
    with _vehinfo() as c:
        c.execute(f"""
            SELECT AVG(ax_std), AVG(ay_std), AVG(az_std)
            FROM accel_windows
            WHERE time > NOW() - INTERVAL '7 days' {cf}
        """, cparams)
        vib_row = c.fetchone()

    avg_vib = None
    if vib_row and all(v is not None for v in vib_row):
        stds = [qtp_std(int(v)) for v in vib_row]
        avg_vib = round(math.sqrt(sum(s*s for s in stds if s)), 1)

    # Heatmap data: speed vs vibration buckets over time
    heatmap = []
    with _vehinfo() as c:
        c.execute(f"""
            SELECT date_trunc('hour', a.time) as hour,
                   AVG(e.p010d) as avg_spd,
                   AVG(a.ax_std + a.ay_std + a.az_std) as avg_vib_raw
            FROM accel_windows a
            JOIN ecu_7e8 e ON a.packet_id = e.packet_id
            WHERE a.time > NOW() - INTERVAL '7 days' {cf}
            GROUP BY hour
            ORDER BY hour
        """, cparams)
        hm_rows = _dictfetchall(c)

    for r in hm_rows:
        if r['avg_spd'] is not None and r['avg_vib_raw'] is not None:
            heatmap.append({
                'hour': r['hour'].isoformat(),
                'speed': round(float(r['avg_spd'])),
                'vibration': round(float(qtp_std(int(float(r['avg_vib_raw']))) or 0), 1),
            })

    # Maintenance estimates based on runtime
    oil_interval_hours = 250  # every 250 engine hours
    oil_remaining_pct = max(0, 100 - int(runtime_hours / oil_interval_hours * 100))
    brake_remaining_pct = max(0, 100 - int(total_packets / 50000 * 100))  # rough estimate
    filter_remaining_pct = max(0, 100 - int(runtime_hours / 500 * 100))

    return JsonResponse({
        'first_seen': first_seen.isoformat() if first_seen else None,
        'last_seen': last_seen.isoformat() if last_seen else None,
        'runtime_hours': runtime_hours,
        'total_packets': total_packets,
        'baseline': {
            'rpm': avg_rpm, 'speed': avg_speed, 'coolant': avg_coolant,
            'load': avg_load, 'throttle': avg_throttle, 'voltage': avg_voltage,
            'vibration': avg_vib,
        },
        'wear': {
            'oil': {'label': 'Масло', 'remaining_pct': oil_remaining_pct, 'interval': f'{oil_interval_hours}ч'},
            'brakes': {'label': 'Тормозные колодки', 'remaining_pct': brake_remaining_pct, 'interval': '50000 пакетов'},
            'filter': {'label': 'Воздушный фильтр', 'remaining_pct': filter_remaining_pct, 'interval': f'500ч'},
        },
        'heatmap': heatmap,
    })


def _compute_health(client=''):
    """Compute vehicle health from latest 5-minute readings."""
    cf = "AND client_hash = %s" if client else ""
    cparams = [client] if client else []

    engine_status = 'unknown'
    engine_detail = 'Нет данных'
    suspension_status = 'unknown'
    suspension_detail = 'Нет данных'
    electrical_status = 'unknown'
    electrical_detail = 'Нет данных'
    audio_status = 'unknown'
    audio_detail = 'Нет данных'

    # Engine: coolant temp (p0105)
    with _vehinfo() as c:
        c.execute(f"""
            SELECT p0105, p0142
            FROM ecu_7e8
            WHERE time > NOW() - INTERVAL '5 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        row = c.fetchone()

    if row:
        coolant = row[0]
        voltage_raw = row[1]

        # Engine / coolant
        if coolant is not None:
            if coolant > 105:
                engine_status = 'alert'
                engine_detail = f'Темп {coolant}°C — перегрев!'
            elif coolant >= 95:
                engine_status = 'warning'
                engine_detail = f'Темп {coolant}°C — повышена'
            else:
                engine_status = 'normal'
                engine_detail = f'Темп {coolant}°C'

        # Electrical / voltage (stored as millivolts: 13000 = 13.0V)
        if voltage_raw is not None:
            voltage_v = round(voltage_raw / 1000.0, 1)
            if voltage_raw < 12500 or voltage_raw > 15000:
                electrical_status = 'alert'
                electrical_detail = f'{voltage_v}V — вне нормы!'
            elif voltage_raw < 13500 or voltage_raw > 14500:
                electrical_status = 'warning'
                electrical_detail = f'{voltage_v}V — отклонение'
            else:
                electrical_status = 'normal'
                electrical_detail = f'{voltage_v}V'

    # Suspension: vibration (max of x/y/z std)
    with _vehinfo() as c:
        c.execute(f"""
            SELECT ax_std, ay_std, az_std
            FROM accel_windows
            WHERE time > NOW() - INTERVAL '5 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        accel_row = c.fetchone()

    if accel_row:
        stds = [qtp_std(v) for v in accel_row if v is not None]
        if stds:
            max_std = max(s for s in stds if s is not None) if any(s is not None for s in stds) else None
            if max_std is not None:
                if max_std > 4.0:
                    suspension_status = 'alert'
                    suspension_detail = f'Вибрация {max_std} m/s² — критично!'
                elif max_std >= 2.0:
                    suspension_status = 'warning'
                    suspension_detail = f'Вибрация {max_std} m/s²'
                else:
                    suspension_status = 'normal'
                    suspension_detail = f'Вибрация {max_std} m/s²'

    # Audio quality
    with _vehinfo() as c:
        c.execute(f"""
            SELECT quality
            FROM audio_windows
            WHERE time > NOW() - INTERVAL '5 minutes' {cf}
            ORDER BY time DESC LIMIT 1
        """, cparams)
        audio_row = c.fetchone()

    if audio_row and audio_row[0] is not None:
        quality = audio_row[0]
        if quality > 30:
            audio_status = 'normal'
            audio_detail = f'Качество {quality}'
        else:
            audio_status = 'warning'
            audio_detail = f'Качество {quality} — низкое'

    # Overall status = worst of all subsystems
    statuses = [engine_status, suspension_status, electrical_status, audio_status]
    if 'alert' in statuses:
        overall_status = 'alert'
        overall_message = 'Обнаружены критические отклонения'
    elif 'warning' in statuses:
        overall_status = 'warning'
        overall_message = 'Есть отклонения от нормы'
    elif all(s == 'unknown' for s in statuses):
        overall_status = 'unknown'
        overall_message = 'Нет данных за последние 5 минут'
    else:
        overall_status = 'normal'
        overall_message = 'Все системы в норме'

    return {
        'status': overall_status,
        'message': overall_message,
        'subsystems': {
            'engine': {'status': engine_status, 'detail': engine_detail},
            'suspension': {'status': suspension_status, 'detail': suspension_detail},
            'electrical': {'status': electrical_status, 'detail': electrical_detail},
            'audio': {'status': audio_status, 'detail': audio_detail},
        },
    }


@require_GET
@never_cache
def api_trips(request):
    """GET /api/trips/ — trip routes with geo, vibration, speed, weather."""
    import geohash2

    client = request.GET.get('client', '')
    try:
        minutes = min(int(request.GET.get('minutes', 1440)), 10080)
    except (ValueError, TypeError):
        minutes = 1440

    cf = "AND client_hash = %s" if client else ""
    params = [client] if client else []

    with _vehinfo() as c:
        c.execute(f"""
            SELECT time, packet_id, geo_hash, road_type,
                   weather_temp, weather_condition
            FROM qtp_packets
            WHERE time > NOW() - INTERVAL '{minutes} minutes'
              AND geo_hash IS NOT NULL AND geo_hash != ''
              {cf}
            ORDER BY time ASC LIMIT 5000
        """, params)
        packets = _dictfetchall(c)

    if not packets:
        return JsonResponse({'trips': []})

    pids = [p['packet_id'] for p in packets[:500]]
    placeholders = ','.join(['%s'] * len(pids))

    # Vibration by packet_id
    vib_map = {}
    with _vehinfo() as c:
        c.execute(f"SELECT packet_id, ax_std, ay_std, az_std FROM accel_windows WHERE packet_id IN ({placeholders}) LIMIT 1500", pids)
        for r in _dictfetchall(c):
            xs = round((r['ax_std'] or 0) / 255.0 * 9.81, 2)
            ys = round((r['ay_std'] or 0) / 255.0 * 9.81, 2)
            zs = round((r['az_std'] or 0) / 255.0 * 9.81, 2)
            vib_map[r['packet_id']] = round((xs**2 + ys**2 + zs**2)**0.5, 2)

    # Speed by packet_id
    speed_map = {}
    with _vehinfo() as c:
        c.execute(f"SELECT packet_id, p010d FROM ecu_7e8 WHERE packet_id IN ({placeholders}) LIMIT 1500", pids)
        for r in _dictfetchall(c):
            if r['p010d'] is not None:
                speed_map[r['packet_id']] = r['p010d']

    # Group into trips (gap > 10 min)
    trips = []
    current_trip = []
    for i, p in enumerate(packets):
        if i > 0:
            gap = (p['time'] - packets[i-1]['time']).total_seconds()
            if gap > 600:
                if len(current_trip) >= 2:
                    trips.append(current_trip)
                current_trip = []
        try:
            lat, lng = geohash2.decode(p['geo_hash'])
            lat, lng = float(lat), float(lng)
        except Exception:
            continue
        pid = p['packet_id']
        current_trip.append({
            'ts': p['time'].isoformat(),
            'lat': round(lat, 5), 'lng': round(lng, 5),
            'vib': vib_map.get(pid, 0),
            'speed': speed_map.get(pid, 0),
            'temp': float(p['weather_temp']) if p['weather_temp'] else None,
            'weather': p['weather_condition'],
            'road': p['road_type'],
        })
    if len(current_trip) >= 2:
        trips.append(current_trip)

    result = []
    for trip in trips:
        vibs = [p['vib'] for p in trip if p['vib'] > 0]
        speeds = [p['speed'] for p in trip if p['speed'] > 0]
        result.append({
            'start': trip[0]['ts'], 'end': trip[-1]['ts'], 'points': len(trip),
            'route': trip,
            'avg_vib': round(sum(vibs) / len(vibs), 2) if vibs else 0,
            'max_vib': round(max(vibs), 2) if vibs else 0,
            'avg_speed': round(sum(speeds) / len(speeds), 1) if speeds else 0,
            'weather': trip[0].get('weather', 'unknown'),
        })

    return JsonResponse({'trips': result})


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

    def _safe_float(v):
        if v is None:
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None

    def _latest_ecu(table, fields):
        # Get latest non-null value for each field separately
        result = {}
        for f in fields:
            with _vehinfo() as c:
                c.execute(f"SELECT {f} FROM {table} WHERE time > NOW() - INTERVAL '{minutes} minutes' AND {f} IS NOT NULL {cf} ORDER BY time DESC LIMIT 1", params)
                row = c.fetchone()
                result[f] = _safe_float(row[0]) if row else None
        return result

    ecu = {}
    ecu['7e8'] = _latest_ecu('ecu_7e8', ['p010c','p010d','p0105','p0104','p0111','p012f','p0142','p0146'])
    ecu['7e8']['_labels'] = {'p010c':'RPM','p010d':'Скорость','p0105':'Темп. ОЖ','p0104':'Нагрузка','p0111':'Дроссель','p012f':'Топливо','p0142':'Напряжение','p0146':'Темп. воздуха'}

    ecu['7ea'] = _latest_ecu('ecu_7ea', ['p010c','p0121','p0131','p0130'])
    ecu['7ea']['_labels'] = {'p010c':'RPM электро','p0121':'Пробег MIL','p0131':'Пробег сброс','p0130':'Прогревы'}

    ecu['7eb'] = _latest_ecu('ecu_7eb', ['p010d','p0142','p0121','p0131'])
    ecu['7eb']['_labels'] = {'p010d':'Скорость','p0142':'Напряжение ВВБ','p0121':'Пробег MIL','p0131':'Пробег сброс'}

    ecu['7ef'] = _latest_ecu('ecu_7ef', ['p010c','p010d','p0105','p0142'])
    ecu['7ef']['_labels'] = {'p010c':'RPM','p010d':'Скорость','p0105':'Темп. ОЖ 2','p0142':'Напряжение 12В'}

    # Alerts
    alerts = []
    v_7eb = ecu['7eb'].get('p0142')
    v_7ef = ecu['7ef'].get('p0142')
    if v_7eb and v_7ef and abs(v_7eb - v_7ef) > 500:
        alerts.append({'severity': 'warning',
            'title': f'Разница напряжений BMS ({round(v_7eb/1000,1)}В) и 12В ({round(v_7ef/1000,1)}В)',
            'explanation': 'Рассогласование напряжений между тяговой батареей и 12В системой.'})

    t_7e8 = ecu['7e8'].get('p0105')
    t_7ef = ecu['7ef'].get('p0105')
    if t_7e8 and t_7ef and abs(t_7e8 - t_7ef) > 15:
        alerts.append({'severity': 'warning',
            'title': f'Разница температур ОЖ: ДВС {int(t_7e8)}°C vs контур 2 {int(t_7ef)}°C',
            'explanation': 'Два контура охлаждения прогреты неравномерно.'})

    if not alerts:
        alerts.append({'severity': 'ok', 'title': 'Все системы согласованы',
            'explanation': 'Параметры всех ECU блоков в пределах нормы.'})

    # DTC
    with _vehinfo() as c:
        c.execute("SELECT count(*), count(*) FILTER (WHERE array_length(dtc_codes,1) > 0) FROM vehicle_data_packets")
        dtc_row = c.fetchone()
    dtc = {'status': 'clear' if dtc_row[1] == 0 else 'errors', 'total_packets': dtc_row[0], 'codes': []}
    if dtc_row[1] > 0:
        with _vehinfo() as c:
            c.execute("SELECT unnest(dtc_codes) as code, count(*) FROM vehicle_data_packets WHERE array_length(dtc_codes,1) > 0 GROUP BY 1 ORDER BY 2 DESC LIMIT 20")
            dtc['codes'] = [{'code': r[0], 'count': r[1]} for r in c.fetchall()]

    # Voltage history
    def _voltage_series(table):
        with _vehinfo() as c:
            c.execute(f"SELECT time, p0142 FROM {table} WHERE time > NOW() - INTERVAL '{minutes} minutes' AND p0142 IS NOT NULL {cf} ORDER BY time ASC LIMIT 500", params)
            return [{'ts': r[0].isoformat(), 'v': round(r[1]/1000, 2)} for r in c.fetchall()]

    return JsonResponse({
        'ecu': ecu, 'alerts': alerts, 'dtc': dtc,
        'voltage_history': {'7e8': _voltage_series('ecu_7e8'), '7eb': _voltage_series('ecu_7eb'), '7ef': _voltage_series('ecu_7ef')},
    })


# ── Anomaly Detection Helpers ─────────────────────────────────────────

def _load_baselines(client_hash):
    """Load baselines from anomaly_baselines table (SQLite) into a BaselineStore."""
    _ensure_anomaly_tables()
    store = BaselineStore()
    with _anomaly_db() as c:
        c.execute(
            "SELECT regime, feature, count, mean, m2, min_val, max_val "
            "FROM anomaly_baselines WHERE client_hash = %s",
            [client_hash],
        )
        cols = [d[0] for d in c.description]
        for row in c.fetchall():
            r = dict(zip(cols, row))
            bl = store.get(r['regime'], r['feature'])
            bl.count = r['count']
            bl.mean = r['mean']
            bl.m2 = r['m2']
            bl.min_val = r['min_val']
            bl.max_val = r['max_val']
    return store


def _save_baselines(client_hash, store):
    """UPSERT all baselines from BaselineStore into anomaly_baselines (SQLite)."""
    _ensure_anomaly_tables()
    with _anomaly_db() as c:
        for (regime, feature), bl in store.baselines.items():
            c.execute(
                """INSERT INTO anomaly_baselines
                       (client_hash, regime, feature, count, mean, m2, min_val, max_val, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, datetime('now'))
                   ON CONFLICT (client_hash, regime, feature)
                   DO UPDATE SET count = EXCLUDED.count,
                                 mean = EXCLUDED.mean,
                                 m2 = EXCLUDED.m2,
                                 min_val = EXCLUDED.min_val,
                                 max_val = EXCLUDED.max_val,
                                 updated_at = datetime('now')""",
                [client_hash, regime, feature,
                 bl.count, bl.mean, bl.m2, bl.min_val, bl.max_val],
            )


def _extract_features(client_hash, minutes=10):
    """Extract aggregated features from the last *minutes* of sensor data.

    Queries accel_windows, ecu_7e8, audio_windows, and qtp_packets.
    Returns a dict suitable for anomaly_engine functions.
    """
    features = {}
    params = [client_hash]

    # ── Accelerometer averages over recent windows ──
    with _vehinfo() as c:
        c.execute(
            f"""SELECT AVG(ax_avg) as ax_avg, AVG(ay_avg) as ay_avg, AVG(az_avg) as az_avg,
                       AVG(ax_std) as ax_std, AVG(ay_std) as ay_std, AVG(az_std) as az_std,
                       AVG(ax_min) as ax_min, AVG(ax_max) as ax_max,
                       AVG(ay_min) as ay_min, AVG(ay_max) as ay_max,
                       AVG(az_min) as az_min, AVG(az_max) as az_max
                FROM accel_windows
                WHERE time > NOW() - INTERVAL '{minutes} minutes'
                  AND client_hash = %s""",
            params,
        )
        row = c.fetchone()

    if row and row[0] is not None:
        cols = ['ax_avg', 'ay_avg', 'az_avg',
                'ax_std', 'ay_std', 'az_std',
                'ax_min', 'ax_max', 'ay_min', 'ay_max',
                'az_min', 'az_max']
        desc = [d[0] for d in c.description]
        for i, col in enumerate(cols):
            raw = row[i]
            if raw is None:
                features[col] = None
                continue
            if 'std' in col:
                features[col] = qtp_std(int(float(raw)))
            else:
                features[col] = round((float(raw) - 128) / 128.0 * 9.81, 2)

    # ── ECU / OBD data ──
    with _vehinfo() as c:
        c.execute(
            f"""SELECT p010c, p010d, p0105, p0142
                FROM ecu_7e8
                WHERE time > NOW() - INTERVAL '{minutes} minutes'
                  AND client_hash = %s
                ORDER BY time DESC LIMIT 1""",
            params,
        )
        ecu_row = c.fetchone()

    if ecu_row:
        # p010c = RPM (raw needs /4), p010d = speed (km/h, no conversion)
        # p0105 = coolant (raw needs -40), p0142 = voltage (mV, /1000)
        raw_rpm = float(ecu_row[0]) if ecu_row[0] is not None else None
        features['rpm'] = raw_rpm / 4.0 if raw_rpm is not None and raw_rpm > 200 else None
        features['speed'] = float(ecu_row[1]) if ecu_row[1] is not None else None
        raw_coolant = float(ecu_row[2]) if ecu_row[2] is not None else None
        features['coolant'] = raw_coolant - 40.0 if raw_coolant is not None else None
        features['voltage'] = round(ecu_row[3] / 1000.0, 2) if ecu_row[3] is not None else None

    # ── Audio — find dominant (max amplitude) freq/amp pair ──
    with _vehinfo() as c:
        c.execute(
            f"""SELECT freq_1, amp_1, freq_2, amp_2, freq_3, amp_3,
                       freq_4, amp_4, freq_5, amp_5,
                       freq_6, amp_6, freq_7, amp_7, freq_8, amp_8,
                       freq_9, amp_9, freq_10, amp_10, quality
                FROM audio_windows
                WHERE time > NOW() - INTERVAL '{minutes} minutes'
                  AND client_hash = %s
                ORDER BY time DESC LIMIT 1""",
            params,
        )
        audio_row = c.fetchone()

    if audio_row:
        best_freq, best_amp = None, -1
        for i in range(10):
            freq = audio_row[i * 2]
            amp = audio_row[i * 2 + 1]
            if freq is not None and amp is not None and amp > best_amp:
                best_freq = freq
                best_amp = amp
        features['dominant_freq'] = float(best_freq) if best_freq is not None else None
        features['dominant_amp'] = float(best_amp) if best_amp > 0 else None
        features['audio_quality'] = float(audio_row[20]) if audio_row[20] is not None else None

    # ── Road type ──
    with _vehinfo() as c:
        c.execute(
            f"""SELECT road_type
                FROM qtp_packets
                WHERE time > NOW() - INTERVAL '{minutes} minutes'
                  AND client_hash = %s
                  AND road_type IS NOT NULL
                ORDER BY time DESC LIMIT 1""",
            params,
        )
        road_row = c.fetchone()

    features['_road_type'] = road_row[0] if road_row else 'asphalt'
    return features


# ── Anomaly API Views ─────────────────────────────────────────────────

@require_GET
@never_cache
def api_anomaly(request):
    """GET /api/anomaly/?client=HASH

    Run the full anomaly detection pipeline:
      1. Extract features from latest sensor data (last 10 min)
      2. Load per-client baselines from DB
      3. Classify driving regime
      4. Compute derived features
      5. Update baselines + persist to DB
      6. Compute anomaly score
      7. Run diagnostic rules with persistence
      8. Run CUSUM degradation detection on historical scores
      9. Store score to anomaly_scores
     10. Return JSON response
    """
    client = request.GET.get('client', '')
    if not client:
        return JsonResponse({'error': 'client parameter required'}, status=400)

    # 1. Extract features
    # Accept minutes param (default 10080 = 7 days for historical analysis)
    try:
        minutes = min(int(request.GET.get("minutes", 10080)), 10080)
    except (ValueError, TypeError):
        minutes = 10080
    features = _extract_features(client, minutes=minutes)

    # Early exit if no sensor data at all
    if not any(k for k in features if not k.startswith('_') and features.get(k) is not None):
        return JsonResponse({
            'overall': 0, 'systems': {}, 'diagnostics': [],
            'degradation': {'degradation_detected': False, 'trend_per_day': 0},
            'confidence': 0, 'regime': 'unknown', 'road_type': 'asphalt',
            'message': 'No sensor data in the selected time range',
        })

    road_type = features.pop('_road_type', 'asphalt')

    # 2. Load baselines
    store = _load_baselines(client)

    # 3. Classify regime
    regime = classify_regime(
        speed=features.get('speed'),
        rpm=features.get('rpm'),
        ax_avg=features.get('ax_avg', 0),
        ay_avg=features.get('ay_avg', 0),
        az_std=features.get('az_std', 0),
        road_type=road_type,
    )

    # 4. Compute derived features
    derived = compute_derived_features(features)
    features.update(derived)

    # 5. Update baselines + save
    numeric_features = {
        k: v for k, v in features.items()
        if v is None or isinstance(v, (int, float))
    }
    store.update(regime.value, numeric_features)
    _save_baselines(client, store)

    # 6. Compute anomaly score
    score_result = compute_anomaly_score(features, store, regime.value, road_type)

    # 7. Diagnostic rules with persistence
    _ensure_anomaly_tables()
    persistence_counts = {}
    with _anomaly_db() as c:
        c.execute(
            "SELECT rule_name, consecutive_count FROM diagnostic_persistence "
            "WHERE client_hash = %s",
            [client],
        )
        for row in c.fetchall():
            persistence_counts[row[0]] = row[1]

    diagnostics = run_diagnostics(features, store, regime.value, persistence_counts)

    # Update persistence counters
    for diag in diagnostics:
        triggered = diag['confidence'] >= 40  # 'possible' or above
        rule_name = diag['name']
        if triggered:
            new_count = persistence_counts.get(rule_name, 0) + 1
        else:
            new_count = 0
        with _anomaly_db() as c:
            c.execute(
                """INSERT INTO diagnostic_persistence
                       (client_hash, rule_name, consecutive_count, last_triggered)
                   VALUES (%s, %s, %s, datetime('now'))
                   ON CONFLICT (client_hash, rule_name)
                   DO UPDATE SET consecutive_count = EXCLUDED.consecutive_count,
                                 last_triggered = CASE WHEN EXCLUDED.consecutive_count > 0
                                                       THEN datetime('now')
                                                       ELSE diagnostic_persistence.last_triggered END""",
                [client, rule_name, new_count],
            )

    # 8. CUSUM degradation detection on historical scores
    degradation = {'degradation_detected': False, 'trend_per_day': 0}
    with _anomaly_db() as c:
        c.execute(
            """SELECT overall_score FROM anomaly_scores
               WHERE client_hash = %s
               ORDER BY time DESC LIMIT 200""",
            [client],
        )
        hist_rows = c.fetchall()

    if hist_rows:
        tracker = DegradationTracker(target=85.0)
        # Process oldest-first
        for (s,) in reversed(hist_rows):
            if s is not None:
                deg_result = tracker.update(float(s))
        # Process current score
        deg_result = tracker.update(float(score_result['overall']))
        degradation = {
            'degradation_detected': deg_result['degradation_detected'],
            'trend_per_day': deg_result['trend_per_day'],
            'short_term': deg_result['short_term'],
            'medium_term': deg_result['medium_term'],
            'long_term': deg_result['long_term'],
        }

    # 9. Store score
    top_diag = diagnostics[0] if diagnostics else None
    with _anomaly_db() as c:
        c.execute(
            """INSERT INTO anomaly_scores
                   (time, client_hash, regime, road_type,
                    overall_score, suspension_score, engine_score,
                    electrical_score, audio_score,
                    confidence, degradation_detected, trend_per_day,
                    top_diagnostic, top_diagnostic_confidence, features_json)
               VALUES (datetime('now'), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            [
                client, regime.value, road_type,
                score_result['overall'],
                score_result['systems'].get('suspension', {}).get('score', 0),
                score_result['systems'].get('engine', {}).get('score', 0),
                score_result['systems'].get('electrical', {}).get('score', 0),
                score_result['systems'].get('audio', {}).get('score', 0),
                score_result['confidence'],
                degradation['degradation_detected'],
                degradation['trend_per_day'],
                top_diag['name'] if top_diag else None,
                int(top_diag['confidence']) if top_diag else 0,
                json.dumps(features, default=str),
            ],
        )

    # 10. Return response
    return JsonResponse({
        'overall': score_result['overall'],
        'systems': score_result['systems'],
        'confidence': score_result['confidence'],
        'regime': regime.value,
        'road_type': road_type,
        'diagnostics': diagnostics,
        'degradation': degradation,
    })


@require_GET
@never_cache
def api_anomaly_history(request):
    """GET /api/anomaly/history/?client=HASH&days=7

    Return downsampled anomaly score history using time_bucket.
    """
    client = request.GET.get('client', '')
    if not client:
        return JsonResponse({'error': 'client parameter required'}, status=400)

    try:
        days = min(int(request.GET.get('days', 7)), 90)
    except (ValueError, TypeError):
        days = 7

    # Use 1-hour buckets for <= 7 days, 4-hour buckets for longer
    _ensure_anomaly_tables()
    if days <= 7:
        bucket_fmt = '%Y-%m-%d %H:00:00'
        bucket_label = '1 hour'
    else:
        bucket_fmt = '%Y-%m-%d'
        bucket_label = '1 day'

    from datetime import datetime, timedelta
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')

    with _anomaly_db() as c:
        c.execute(
            """SELECT strftime(%s, time) AS bucket,
                      CAST(AVG(overall_score) AS INTEGER) AS overall,
                      CAST(AVG(suspension_score) AS INTEGER) AS suspension,
                      CAST(AVG(engine_score) AS INTEGER) AS engine,
                      CAST(AVG(electrical_score) AS INTEGER) AS electrical,
                      CAST(AVG(audio_score) AS INTEGER) AS audio,
                      AVG(confidence) AS confidence,
                      MAX(degradation_detected) AS degradation,
                      AVG(trend_per_day) AS trend,
                      regime,
                      top_diagnostic AS top_diag,
                      MAX(top_diagnostic_confidence) AS top_diag_conf
               FROM anomaly_scores
               WHERE client_hash = %s
                 AND time > %s
               GROUP BY bucket
               ORDER BY bucket ASC""",
            [bucket_fmt, client, cutoff],
        )
        cols = [d[0] for d in c.description]
        rows = [dict(zip(cols, row)) for row in c.fetchall()]

    history = []
    for r in rows:
        history.append({
            'time': r['bucket'],
            'overall': r['overall'],
            'suspension': r['suspension'],
            'engine': r['engine'],
            'electrical': r['electrical'],
            'audio': r['audio'],
            'confidence': round(r['confidence'], 2) if r['confidence'] else 0,
            'degradation': bool(r['degradation']),
            'trend': round(r['trend'], 4) if r['trend'] else 0,
            'regime': r['regime'],
            'top_diagnostic': r['top_diag'],
            'top_diagnostic_confidence': r['top_diag_conf'] or 0,
        })

    return JsonResponse({'history': history, 'days': days, 'bucket': bucket_label})


def dashboard_v3(request):
    """GET /v3/ - V3 React SPA dashboard (experimental)"""
    import os
    spa_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'spa-v3', 'index.html')
    with open(spa_path, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())


def landing(request):
    import os
    from django.http import HttpResponse
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'landing', 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())
