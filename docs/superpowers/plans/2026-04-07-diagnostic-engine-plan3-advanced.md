# Diagnostic Engine — Plan 3: Advanced (DB + Correlation + Escalation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подключить движок к PostgreSQL: персистентные baselines, fact log, feedback, escalation, anomaly scores, history API. Добавить Correlation Engine (batch). После этого плана система полностью production-ready.

**Architecture:** DB-слой через Django `connections['vehinfo']`. Каждый writer — отдельный модуль. Correlation Engine — standalone batch processor. Escalation integrируется в DiagnosisBuilder. Тесты через mock DB (без реального PostgreSQL).

**Tech Stack:** Python 3.12, Django (connections), PostgreSQL + TimescaleDB, scipy (для корреляций).

**Depends on Plan 2:** pipeline.py (full_diagnose), rule_engine.py, diagnosis_builder.py, api_views.py, baseline_store.py, facts.py. Все 258 тестов pass.

**DB config на сервере:**
```python
# Django settings.py — connection 'vehinfo'
# ENGINE: postgresql, NAME: vehinfo, USER: webadmin, PASSWORD: webadmin, HOST: localhost, PORT: 5432
```

**Spec:** `docs/engine-design/07-CORRELATION-ENGINE.md`, `08-DATABASE-SCHEMA.md`, `06-RULE-ENGINE.md` (escalation)

---

## File Structure

```
dashboard_build/diagnostic/
├── (Plan 1-2 — уже существует)
├── db.py                       ← НОВЫЙ: DB connection + cursor helper
├── db_writers.py               ← НОВЫЙ: write baselines, facts, scores, feedback
├── db_readers.py               ← НОВЫЙ: read baselines, persistence, history
├── escalation.py               ← НОВЫЙ: EscalationManager (persistence + cooldown + levels)
├── correlation_engine.py       ← НОВЫЙ: batch correlations (5 типов)
├── pipeline.py                 ← МОДИФИЦИРОВАТЬ: DB persistence в full_diagnose
├── diagnosis_builder.py        ← МОДИФИЦИРОВАТЬ: escalation integration
├── api_views.py                ← МОДИФИЦИРОВАТЬ: feedback → DB, history → real data
└── schema_anomaly.sql          ← МОДИФИЦИРОВАТЬ: добавить correlation_results таблицу
```

---

## Task 1: DB Schema Deploy + Connection Layer

**Files:**
- Modify: `dashboard_build/schema_anomaly.sql` — добавить correlation_results
- Create: `dashboard_build/diagnostic/db.py`
- Create: `dashboard_build/tests/test_db.py`

**Что делаем:**

1. Добавить таблицу `correlation_results` в schema_anomaly.sql (она есть в спеке 08, но отсутствует в SQL)
2. Создать `db.py` — обёртка для получения DB cursor через Django `connections['vehinfo']`
3. Задеплоить schema на сервер

**db.py должен содержать:**

```python
"""DB connection layer — wraps Django's 'vehinfo' PostgreSQL connection.

For tests: use MockDB context manager that provides an in-memory SQLite fallback.
"""
import contextlib
from typing import Any, Generator

try:
    from django.db import connections
    _HAS_DJANGO = True
except ImportError:
    _HAS_DJANGO = False


@contextlib.contextmanager
def get_cursor() -> Generator:
    """Yield a DB cursor for the vehinfo database.
    
    Uses Django connections['vehinfo'] on server.
    Raises RuntimeError if Django is not available (use MockDB for tests).
    """
    if not _HAS_DJANGO:
        raise RuntimeError("Django not available — use MockDB for testing")
    conn = connections['vehinfo']
    with conn.cursor() as cursor:
        yield cursor


class MockDB:
    """In-memory SQLite database for testing without PostgreSQL.
    
    Usage:
        mock = MockDB()
        mock.setup()  # creates tables
        with mock.cursor() as c:
            c.execute(...)
        mock.teardown()
    """
    def __init__(self):
        import sqlite3
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
    
    def setup(self):
        """Create all diagnostic tables in SQLite (simplified, no TimescaleDB)."""
        c = self.conn.cursor()
        # anomaly_baselines
        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_baselines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_hash TEXT NOT NULL,
            regime TEXT NOT NULL,
            feature TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            mean REAL DEFAULT 0,
            m2 REAL DEFAULT 0,
            min_val REAL DEFAULT 1e18,
            max_val REAL DEFAULT -1e18,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(client_hash, regime, feature)
        )""")
        # diagnostic_persistence
        c.execute("""CREATE TABLE IF NOT EXISTS diagnostic_persistence (
            client_hash TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            consecutive_count INTEGER DEFAULT 0,
            first_triggered TEXT,
            last_triggered TEXT,
            max_confidence INTEGER DEFAULT 0,
            escalation_level INTEGER DEFAULT 0,
            user_dismissed_at TEXT,
            PRIMARY KEY(client_hash, rule_name)
        )""")
        # fact_log
        c.execute("""CREATE TABLE IF NOT EXISTS fact_log (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            fact_type TEXT NOT NULL,
            severity TEXT,
            confidence REAL,
            tier TEXT,
            details TEXT
        )""")
        # user_feedback
        c.execute("""CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            client_hash TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            diagnosis_time TEXT,
            action TEXT NOT NULL,
            comment TEXT
        )""")
        # anomaly_scores
        c.execute("""CREATE TABLE IF NOT EXISTS anomaly_scores (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            regime TEXT,
            overall_score INTEGER,
            suspension_score INTEGER,
            engine_score INTEGER,
            electrical_score INTEGER,
            audio_score INTEGER,
            confidence REAL,
            top_diagnostic TEXT,
            top_diagnostic_confidence INTEGER DEFAULT 0,
            features_json TEXT
        )""")
        # correlation_results
        c.execute("""CREATE TABLE IF NOT EXISTS correlation_results (
            time TEXT NOT NULL,
            client_hash TEXT NOT NULL,
            trip_id TEXT,
            correlation_type TEXT NOT NULL,
            r_value REAL,
            slope REAL,
            p_value REAL,
            data_points INTEGER,
            regime TEXT,
            diagnosis_hint TEXT
        )""")
        # vehicle_profiles
        c.execute("""CREATE TABLE IF NOT EXISTS vehicle_profiles (
            client_hash TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            vin TEXT,
            generation TEXT,
            engine_code TEXT,
            engine_type TEXT DEFAULT 'ice',
            mileage_km INTEGER DEFAULT 0,
            platform TEXT,
            modifications TEXT DEFAULT '{}'
        )""")
        self.conn.commit()
    
    @contextlib.contextmanager
    def cursor(self):
        c = self.conn.cursor()
        try:
            yield c
            self.conn.commit()
        finally:
            pass
    
    def teardown(self):
        self.conn.close()
```

**Тесты (минимум 5):**
- MockDB.setup() creates all tables without error
- MockDB.cursor() можно INSERT и SELECT
- anomaly_baselines UNIQUE constraint works
- diagnostic_persistence PRIMARY KEY works
- get_cursor raises RuntimeError without Django

- [ ] Step 1: Добавить correlation_results в schema_anomaly.sql
- [ ] Step 2: Написать тесты
- [ ] Step 3: Реализовать db.py
- [ ] Step 4: Запустить → pass
- [ ] Step 5: Full suite → all pass
- [ ] Step 6: Задеплоить schema на сервер: `PGPASSWORD=postgres psql -U postgres -d vehinfo -f /tmp/schema_anomaly.sql`
- [ ] Step 7: Commit

---

## Task 2: DB Writers — baselines, facts, scores

**Files:**
- Create: `dashboard_build/diagnostic/db_writers.py`
- Create: `dashboard_build/tests/test_db_writers.py`

**Реализовать:**

Три writer-функции, каждая принимает cursor + данные:

```python
def save_baselines(cursor, client_hash: str, baselines: BaselineStore) -> int:
    """UPSERT all baselines for a client. Returns count of rows written."""
    # Uses BaselineStore.to_db_rows(client_hash)
    # SQL: INSERT ... ON CONFLICT(client_hash, regime, feature) DO UPDATE

def load_baselines(cursor, client_hash: str) -> BaselineStore:
    """Load all baselines for a client. Returns BaselineStore."""
    # SQL: SELECT * FROM anomaly_baselines WHERE client_hash = %s
    # Uses BaselineStore.from_db_rows(rows)

def write_fact_log(cursor, client_hash: str, facts: List[Fact], tier: str) -> int:
    """Write facts to fact_log. Returns count."""
    # SQL: INSERT INTO fact_log (time, client_hash, fact_type, severity, confidence, tier, details)

def write_anomaly_scores(cursor, client_hash: str, report: dict, features: dict, regime: str) -> None:
    """Write health scores + features to anomaly_scores."""
    # Extract health_scores from report, json.dumps(features) for features_json
    # SQL: INSERT INTO anomaly_scores (time, client_hash, regime, overall_score, ...)

def write_feedback(cursor, client_hash: str, rule_name: str, action: str, 
                   diagnosis_time: str = None, comment: str = None) -> None:
    """Write user feedback to user_feedback table."""
    # SQL: INSERT INTO user_feedback (...)
```

**Тесты (минимум 10) — все используют MockDB:**
- save_baselines writes correct number of rows
- save_baselines UPSERT overwrites existing
- load_baselines returns empty store for unknown client
- load_baselines roundtrip: save then load → same data
- load_baselines preserves count, mean, m2, min_val, max_val
- write_fact_log writes all facts
- write_fact_log stores details as JSON
- write_anomaly_scores stores all 5 system scores
- write_anomaly_scores stores features_json
- write_feedback writes to user_feedback table
- write_feedback stores all fields

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать db_writers.py
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 3: Escalation Manager

**Files:**
- Create: `dashboard_build/diagnostic/escalation.py`
- Create: `dashboard_build/tests/test_escalation.py`

**Spec:** `docs/engine-design/06-RULE-ENGINE.md` (секция Severity Escalation)

**Реализовать:**

```python
@dataclass
class PersistenceRecord:
    client_hash: str
    rule_name: str
    consecutive_count: int = 0
    first_triggered: Optional[str] = None  # ISO datetime
    last_triggered: Optional[str] = None
    max_confidence: int = 0
    escalation_level: int = 0  # 0=notice, 1=warning, 2=problem, 3=urgent
    user_dismissed_at: Optional[str] = None

class EscalationManager:
    """Manages diagnostic persistence, cooldown, and escalation levels.
    
    Uses DB cursor for read/write (or dict-based in-memory store for tests).
    """
    
    COOLDOWN_DAYS = 7
    ESCALATION_THRESHOLDS = [
        (0, 0, 0),    # level 0: notice — first trigger
        (3, 3, 40),   # level 1: warning — 3+ days, 3+ consecutive, confidence > 40
        (7, 5, 50),   # level 2: problem — 7+ days, 5+ consecutive, confidence > 50
        (14, 10, 70), # level 3: urgent — 14+ days, 10+ consecutive, confidence > 70
    ]
    
    def __init__(self):
        self._store: Dict[Tuple[str, str], PersistenceRecord] = {}
    
    def load_from_db(self, cursor, client_hash: str) -> None:
        """Load all persistence records for a client from DB."""
    
    def save_to_db(self, cursor, client_hash: str) -> None:
        """Save all modified records back to DB."""
    
    def update(self, client_hash: str, rule_name: str, confidence: int, now: str = None) -> PersistenceRecord:
        """Update persistence for a rule firing. Returns updated record."""
        # If in cooldown (user_dismissed_at + 7 days > now) → return existing without update
        # Increment consecutive_count
        # Update max_confidence if higher
        # Recalculate escalation_level based on thresholds
        # Set first_triggered if first time, update last_triggered
    
    def dismiss(self, client_hash: str, rule_name: str, now: str = None) -> None:
        """User dismissed a diagnosis. Set cooldown."""
        # Set user_dismissed_at = now
        # Reset consecutive_count to 0
    
    def is_in_cooldown(self, client_hash: str, rule_name: str, now: str = None) -> bool:
        """Check if rule is in cooldown period."""
    
    def get_record(self, client_hash: str, rule_name: str) -> Optional[PersistenceRecord]:
        """Get persistence record."""
    
    def get_escalation_info(self, client_hash: str, rule_name: str) -> dict:
        """Get escalation info for diagnosis report."""
        # Returns: {first_seen, days_active, trend, level, level_name, was_dismissed, consecutive_count}
```

**Escalation level names:** ["notice", "warning", "problem", "urgent"]

**Тесты (минимум 12):**
- First trigger → consecutive_count=1, level=0 (notice)
- 3 consecutive triggers → level stays 0 (need 3+ days too)
- After 3+ days simulated + 3 consecutive → level=1 (warning)
- After 14+ days + 10 consecutive + confidence>70 → level=3 (urgent)
- dismiss sets user_dismissed_at, resets consecutive_count
- Rule in cooldown → update returns existing without increment
- Cooldown expires after 7 days → update works again
- max_confidence tracks highest ever seen
- load_from_db + save_to_db roundtrip (MockDB)
- get_escalation_info returns correct dict
- is_in_cooldown True during cooldown, False after expiry
- Multiple rules tracked independently

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать EscalationManager
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 4: Correlation Engine (batch)

**Files:**
- Create: `dashboard_build/diagnostic/correlation_engine.py`
- Create: `dashboard_build/tests/test_correlation_engine.py`

**Spec:** `docs/engine-design/07-CORRELATION-ENGINE.md`

**Реализовать:**

```python
@dataclass
class CorrelationResult:
    correlation_type: str  # vibration_rpm, audio_wheel, turn_click, vibration_speed_peak, highfreq_vibration
    r_value: float
    slope: float
    p_value: float
    data_points: int
    regime: str
    diagnosis_hint: str  # engine_mount, wheel_bearing, cv_joint, wheel_balance, accessory_bearing
    significant: bool    # r > threshold AND data_points >= 50

class CorrelationEngine:
    """Batch correlation analysis for accel↔audio data.
    
    Runs AFTER a trip, not in real-time.
    Requires joined accel+audio+OBD windows.
    """
    
    MIN_DATA_POINTS = 50
    R_THRESHOLD = 0.6
    TIRE_DIAMETER = 0.63  # meters
    
    def analyze_trip(self, windows: List[dict]) -> List[CorrelationResult]:
        """Run all 5 correlations on trip data.
        
        Each window dict must have:
          az_std, ax_std, ay_std, rpm, speed, dominant_freq, dominant_amp,
          regime, timestamp
        
        Returns list of CorrelationResult (only significant ones).
        """
    
    def _vibration_rpm(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 1: az_std vs RPM → engine mount wear.
        
        Linear regression az_std vs RPM.
        Triggers when r > 0.6, slope > 0, data_points >= 50.
        """
    
    def _audio_wheel(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 2: dominant_freq / tire_freq = constant → wheel bearing.
        
        tire_freq = speed / (3.6 * pi * TIRE_DIAMETER)
        Check if dominant_freq / tire_freq is stable (std < 0.5) across speeds.
        Only windows with speed > 30 km/h.
        """
    
    def _turn_click(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 3: ay vibration + audio impulse during cornering → CV joint.
        
        Count windows where: regime=cornering AND ay_std > 2.5 AND dominant_amp > threshold.
        Triggers when 3+ matching windows found.
        """
    
    def _vibration_speed_peak(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 4: az_std peak at specific speed → wheel imbalance.
        
        Group by speed bins (10 km/h). Find bin with max az_std mean.
        Triggers when peak bin > 2x mean of adjacent bins. Only highway.
        """
    
    def _highfreq_vibration(self, windows: List[dict]) -> Optional[CorrelationResult]:
        """Correlation 5: high-freq audio (>200 Hz) + vibration → accessory bearing.
        
        Partial correlation: audio↔vibration controlling for RPM.
        Only windows with dominant_freq > 200 Hz.
        """
    
    @staticmethod
    def save_results(cursor, client_hash: str, trip_id: str, results: List[CorrelationResult]) -> int:
        """Write correlation results to DB. Returns count."""
```

**Для линейной регрессии и корреляции:** использовать numpy (уже доступен) или встроенную реализацию:
```python
def _linregress(x, y):
    """Simple linear regression without scipy dependency."""
    n = len(x)
    if n < 2:
        return 0.0, 0.0, 1.0  # r, slope, p_value
    sx, sy = sum(x), sum(y)
    sxx = sum(xi*xi for xi in x)
    sxy = sum(xi*yi for xi, yi in zip(x, y))
    syy = sum(yi*yi for yi in y)
    denom = n*sxx - sx*sx
    if abs(denom) < 1e-10:
        return 0.0, 0.0, 1.0
    slope = (n*sxy - sx*sy) / denom
    r_num = (n*sxy - sx*sy)
    r_denom_sq = (n*sxx - sx*sx) * (n*syy - sy*sy)
    if r_denom_sq <= 0:
        return 0.0, slope, 1.0
    r = r_num / (r_denom_sq ** 0.5)
    # Approximate p-value using t-distribution (large n approximation)
    import math
    if abs(r) >= 1.0:
        p = 0.0
    else:
        t = r * math.sqrt((n-2) / (1 - r*r))
        # Rough p-value approximation (good enough for n > 30)
        p = 2 * math.exp(-0.717 * abs(t) - 0.416 * t*t) if abs(t) < 6 else 0.0
    return r, slope, p
```

**Тесты (минимум 12):**
- Empty windows → no results
- Too few windows (< 50) → no results
- Synthetic vibration_rpm data (linear az_std = 0.001*rpm + noise) → significant result
- Synthetic vibration_rpm with NO correlation → no result
- Synthetic audio_wheel data (freq = constant * speed) → wheel_bearing detected
- turn_click with 3+ cornering events → cv_joint detected
- turn_click with < 3 events → no result
- vibration_speed_peak with speed bin anomaly → wheel_balance detected
- _linregress returns correct r for perfect linear data
- _linregress returns r≈0 for random data
- analyze_trip returns only significant results
- save_results writes correct rows (MockDB)

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать CorrelationEngine + _linregress
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 5: Pipeline DB Integration

**Files:**
- Modify: `dashboard_build/diagnostic/pipeline.py` — add DB persistence to full_diagnose
- Modify: `dashboard_build/diagnostic/api_views.py` — feedback writes to DB, history reads from DB
- Create: `dashboard_build/tests/test_pipeline_db.py`

**Реализовать:**

### pipeline.py changes:

Расширить `full_diagnose()`:
```python
def full_diagnose(self, raw_data: dict, db_cursor=None, client_hash: str = None) -> dict:
    """Full diagnostic cycle with optional DB persistence.
    
    If db_cursor is provided:
      - Load baselines from DB before processing
      - Save baselines to DB after processing
      - Write facts to fact_log
      - Write anomaly scores to anomaly_scores
      - Load/update escalation persistence
    """
    # ... existing pipeline ...
    
    if db_cursor is not None and client_hash is not None:
        from .db_writers import save_baselines, write_fact_log, write_anomaly_scores
        save_baselines(db_cursor, client_hash, self.baselines)
        write_fact_log(db_cursor, client_hash, facts, packet.tier)
        write_anomaly_scores(db_cursor, client_hash, report, features, regime_str)
    
    return report
```

### api_views.py changes:

```python
# diagnose_view: use DB cursor
def diagnose_view(request):
    # ... existing validation ...
    try:
        from .db import get_cursor
        with get_cursor() as cursor:
            # Load existing baselines
            from .db_writers import load_baselines
            baselines = load_baselines(cursor, client_hash)
            pipeline = DiagnosticPipeline(vehicle_profile=profile, baselines=baselines)
            
            for packet in data_packets:
                report = pipeline.full_diagnose(packet, db_cursor=cursor, client_hash=client_hash)
    except Exception:
        # Fallback: run without DB (same as before)
        pipeline = DiagnosticPipeline(vehicle_profile=profile)
        for packet in data_packets:
            report = pipeline.full_diagnose(packet)
    
    return JsonResponse(report)

# feedback_view: write to DB
def feedback_view(request):
    # ... existing validation ...
    try:
        from .db import get_cursor
        from .db_writers import write_feedback
        with get_cursor() as cursor:
            write_feedback(cursor, body["client_hash"], body["rule_name"],
                          body["action"], body.get("diagnosis_time"), body.get("comment"))
    except Exception:
        logger.warning("DB write failed for feedback, logging only")
    
    return JsonResponse({"success": True})

# history_view: read from DB
def history_view(request):
    # ... existing method check ...
    client_hash = request.GET.get("client_hash")
    period = request.GET.get("period", "7d")
    
    if not client_hash:
        return JsonResponse({"error": "client_hash required"}, status=400)
    
    try:
        from .db import get_cursor
        from .db_readers import read_history
        with get_cursor() as cursor:
            data = read_history(cursor, client_hash, period)
    except Exception:
        data = []
    
    return JsonResponse(data, safe=False)
```

### db_readers.py:
```python
def read_history(cursor, client_hash: str, period: str = "7d") -> list:
    """Read anomaly_scores history for a client.
    
    period: '7d', '30d', '90d'
    Returns list of dicts with scores + timestamps.
    """
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
    cursor.execute("""
        SELECT time, overall_score, suspension_score, engine_score, 
               electrical_score, audio_score, confidence, top_diagnostic,
               top_diagnostic_confidence
        FROM anomaly_scores
        WHERE client_hash = %s AND time > NOW() - INTERVAL '%s days'
        ORDER BY time DESC
        LIMIT 1000
    """, [client_hash, days])
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
```

**Тесты (минимум 8) — используют MockDB:**
- full_diagnose with db_cursor saves baselines
- full_diagnose with db_cursor writes fact_log
- full_diagnose with db_cursor writes anomaly_scores
- full_diagnose without db_cursor works as before (backward compatible)
- read_history returns empty for unknown client
- read_history returns data after write_anomaly_scores
- Existing 258 tests still pass (backward compatibility!)
- api_views fallback works when DB unavailable

**CRITICAL:** Не сломать существующие 258 тестов. Все новые DB параметры optional с defaults.

- [ ] Step 1: Создать db_readers.py
- [ ] Step 2: Написать тесты
- [ ] Step 3: Модифицировать pipeline.py (optional db_cursor)
- [ ] Step 4: Модифицировать api_views.py (DB integration)
- [ ] Step 5: Запустить → pass
- [ ] Step 6: Full suite → all pass (258 existing + new)
- [ ] Step 7: Commit

---

## Task 6: Escalation Integration в DiagnosisBuilder

**Files:**
- Modify: `dashboard_build/diagnostic/diagnosis_builder.py` — add escalation data to report
- Create: `dashboard_build/tests/test_escalation_integration.py`

**Реализовать:**

Расширить `build_report()`:
```python
def build_report(self, pipeline_result, rule_results, fuel_trim_result=None,
                 baseline_store=None, escalation_manager=None) -> dict:
    # ... existing 7 blocks ...
    
    # Block 6: escalations (replace placeholder)
    escalations = self._compute_escalations(rule_results, escalation_manager)
    
    report["escalations"] = escalations
    return report

def _compute_escalations(self, rule_results, escalation_manager):
    """Build escalation info for fired rules."""
    if escalation_manager is None:
        return []
    
    escalations = []
    for rr in rule_results:
        if rr["confidence"] < rr.get("min_confidence", 40):
            continue
        info = escalation_manager.get_escalation_info(
            self._profile.client_hash, rr["rule_name"]
        )
        if info and info["consecutive_count"] > 0:
            escalations.append({
                "rule_name": rr["rule_name"],
                "display": rr["display"],
                **info,
            })
    
    return sorted(escalations, key=lambda x: x.get("level", 0), reverse=True)
```

**Тесты (минимум 6):**
- build_report without escalation_manager → escalations = []
- build_report with escalation_manager → escalations populated
- Escalation sorted by level (urgent first)
- Rules below min_confidence excluded from escalations
- Escalation info contains all required fields (first_seen, days_active, level, level_name)
- Existing diagnosis_builder tests still pass

- [ ] Step 1: Написать тесты
- [ ] Step 2: Модифицировать diagnosis_builder.py
- [ ] Step 3: Запустить → pass
- [ ] Step 4: Full suite → all pass
- [ ] Step 5: Commit

---

## Task 7: Server Deploy + Smoke Test

**Files:**
- No new files — deploy existing code to server

**Шаги:**

- [ ] Step 1: Deploy schema to PostgreSQL
```bash
/tmp/llcar_scp.sh dashboard_build/schema_anomaly.sql webadmin@185.55.57.145:/tmp/
/tmp/llcar_ssh.sh "PGPASSWORD=postgres psql -U postgres -d vehinfo -f /tmp/schema_anomaly.sql"
```

- [ ] Step 2: Verify tables created
```bash
/tmp/llcar_ssh.sh "PGPASSWORD=postgres psql -U postgres -d vehinfo -c '\\dt'"
# Should show: vehicle_profiles, anomaly_baselines, anomaly_scores, diagnostic_persistence,
#              correlation_results, dtc_events, fact_log, user_feedback, dtc_patterns
```

- [ ] Step 3: Deploy diagnostic module
```bash
/tmp/llcar_scp.sh -r dashboard_build/diagnostic webadmin@185.55.57.145:/var/www/html/django/dashboard/
```

- [ ] Step 4: Touch wsgi.py to trigger gunicorn reload
```bash
/tmp/llcar_ssh.sh "touch /var/www/html/django/llcar/wsgi.py"
```

- [ ] Step 5: Smoke test — diagnose endpoint
```bash
/tmp/llcar_ssh.sh "curl -s -X POST https://llcar.ru/api/v2/diagnose/ -k \
  -H 'Content-Type: application/json' \
  -d '{\"client_hash\":\"smoke_test\",\"data\":[{\"rpm\":800,\"speed\":0,\"coolant_temp\":90,\"voltage\":14.2,\"ltft_bank1\":2.0,\"stft_bank1\":1.0}]}' \
  | python3 -m json.tool | head -20"
```

- [ ] Step 6: Smoke test — verify DB writes
```bash
/tmp/llcar_ssh.sh "PGPASSWORD=postgres psql -U postgres -d vehinfo -c \"SELECT COUNT(*) FROM anomaly_baselines WHERE client_hash='smoke_test'\""
/tmp/llcar_ssh.sh "PGPASSWORD=postgres psql -U postgres -d vehinfo -c \"SELECT COUNT(*) FROM anomaly_scores WHERE client_hash='smoke_test'\""
```

- [ ] Step 7: Smoke test — feedback endpoint
```bash
/tmp/llcar_ssh.sh "curl -s -X POST https://llcar.ru/api/v2/feedback/ -k \
  -H 'Content-Type: application/json' \
  -d '{\"client_hash\":\"smoke_test\",\"rule_name\":\"test_rule\",\"action\":\"confirmed\"}'"
```

- [ ] Step 8: Smoke test — history endpoint
```bash
/tmp/llcar_ssh.sh "curl -s 'https://llcar.ru/api/v2/history/?client_hash=smoke_test&period=7d' -k"
```

- [ ] Step 9: Cleanup smoke test data
```bash
/tmp/llcar_ssh.sh "PGPASSWORD=postgres psql -U postgres -d vehinfo -c \"DELETE FROM anomaly_baselines WHERE client_hash='smoke_test'; DELETE FROM anomaly_scores WHERE client_hash='smoke_test'; DELETE FROM user_feedback WHERE client_hash='smoke_test';\""
```

- [ ] Step 10: Commit deploy state

---

## Summary

| Task | Что создаём | Зависит от |
|------|------------|-----------|
| 1 | DB Schema + Connection Layer | — |
| 2 | DB Writers (baselines, facts, scores, feedback) | Task 1 |
| 3 | Escalation Manager | Task 1 |
| 4 | Correlation Engine (batch, 5 correlations) | Task 1 |
| 5 | Pipeline DB Integration + API updates | Tasks 1-3 |
| 6 | Escalation в DiagnosisBuilder | Tasks 3, 5 |
| 7 | Server Deploy + Smoke Test | Tasks 1-6 |

**Параллелизуемые:** Tasks 2, 3, 4 (все зависят только от Task 1).
**Последовательные:** Task 5 → Task 6 → Task 7.

**После Plan 3:**
- POST /api/v2/diagnose/ → полный отчёт + данные в PostgreSQL
- POST /api/v2/feedback/ → сохранение в user_feedback
- GET /api/v2/history/ → реальная история из anomaly_scores
- Baselines сохраняются между сессиями
- Escalation: cooldown 7 дней, нарастание severity
- Correlation Engine готов к batch-запуску

**Что остаётся вне Plan 3:**
- Recalls интеграция (существующая система в D:\transfer4, отдельный мини-план)
- CUSUM тренды (заполнение health_trends из → в ↑/↓)
- ML калибровка весов v2 (нужны данные от 50+ клиентов)
- Dashboard React обновление (подключить к API v2)
