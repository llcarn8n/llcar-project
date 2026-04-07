# Plan 4: CUSUM + Rules + Recalls + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить CUSUM тренды, расширить правила (JSON + Python), интегрировать recalls, подключить React dashboard к API v2 с графиками и feedback кнопками.

**Architecture:** Backend: 3 новых Python модуля + расширение существующих. Frontend: модификация React SPA (Zustand + fetch + Tailwind). Dashboard использует `/api/v2/` endpoints.

**Tech Stack:** Python 3.12, Django, React 18, TypeScript, Zustand, Tailwind, Three.js (existing), ECharts (existing).

**Depends on Plans 1-3:** 357 тестов pass, API v2 с PostgreSQL.

---

## File Structure

### Backend
```
dashboard_build/diagnostic/
├── cusum.py                    ← НОВЫЙ: CUSUM детектор трендов
├── complex_rules.py            ← НОВЫЙ: Python правила для сложной логики
├── recalls_checker.py          ← НОВЫЙ: recalls lookup (local DB + NHTSA)
├── rules/threshold_rules.json  ← РАСШИРИТЬ: 15 → 50+ правил
├── diagnosis_builder.py        ← МОДИФИЦИРОВАТЬ: CUSUM → health_trends
├── rule_engine.py              ← МОДИФИЦИРОВАТЬ: загрузка complex rules
└── api_views.py                ← МОДИФИЦИРОВАТЬ: recalls в отчёте
```

### Frontend
```
llcar-dashboard/src/
├── hooks/
│   ├── useApiData.ts           ← МОДИФИЦИРОВАТЬ: добавить API v2 endpoints
│   └── useDiagnosticV2.ts      ← НОВЫЙ: хук для /api/v2/diagnose/
├── components/
│   ├── panels/
│   │   ├── HealthTrends.tsx    ← НОВЫЙ: графики трендов из /history/
│   │   └── FeedbackButtons.tsx ← НОВЫЙ: кнопки подтверждения/отклонения
│   └── diagnostics/
│       └── DiagnosisCardV2.tsx ← НОВЫЙ: карточка диагноза из API v2
├── pages/
│   └── Diagnostics.tsx         ← МОДИФИЦИРОВАТЬ: переключить на API v2
└── stores/
    └── dashboardStore.ts       ← МОДИФИЦИРОВАТЬ: добавить v2 state
```

---

## Task 1: CUSUM детектор трендов

**Files:**
- Create: `dashboard_build/diagnostic/cusum.py`
- Create: `dashboard_build/tests/test_cusum.py`
- Modify: `dashboard_build/diagnostic/diagnosis_builder.py` — health_trends из CUSUM

**Реализовать:**

CUSUM (Cumulative Sum) — детектор изменений в данных. Определяет: здоровье улучшается (↑), ухудшается (↓) или стабильно (→).

```python
class CUSUMDetector:
    """Detects trends in health scores using CUSUM algorithm.
    
    Uses anomaly_scores history to determine if each system is
    improving, degrading, or stable.
    """
    
    def __init__(self, k: float = 3.0, h: float = 10.0):
        """k = slack (sensitivity), h = threshold for alarm."""
        self.k = k
        self.h = h
    
    def compute_trend(self, scores: List[float]) -> str:
        """Compute trend from a series of health scores.
        
        Returns: "↑" (improving), "↓" (degrading), "→" (stable)
        
        Uses two-sided CUSUM:
        - S_pos accumulates positive shifts (degradation: score going DOWN)
        - S_neg accumulates negative shifts (improvement: score going UP)
        """
        if len(scores) < 5:
            return "→"  # not enough data
        
        mean = sum(scores) / len(scores)
        s_pos = 0.0  # detects degradation (scores dropping)
        s_neg = 0.0  # detects improvement (scores rising)
        
        for x in scores:
            s_pos = max(0, s_pos + (mean - x) - self.k)  # score below mean = degradation
            s_neg = max(0, s_neg + (x - mean) - self.k)  # score above mean = improvement
        
        if s_pos > self.h:
            return "↓"  # degrading
        if s_neg > self.h:
            return "↑"  # improving
        return "→"  # stable
    
    def compute_all_trends(self, history: List[dict]) -> Dict[str, str]:
        """Compute trends for all systems from anomaly_scores history.
        
        history: list of dicts from read_history() or anomaly_scores rows
        Returns: {suspension: "→", engine: "↓", electrical: "→", audio: "↑"}
        """
        systems = {
            "suspension": "suspension_score",
            "engine": "engine_score",
            "electrical": "electrical_score",
            "audio": "audio_score",
        }
        trends = {}
        for system, column in systems.items():
            scores = [h[column] for h in history if h.get(column) is not None]
            trends[system] = self.compute_trend(scores)
        return trends
```

**Интеграция в diagnosis_builder.py:**
```python
def _compute_health_trends(self, history: List[dict] = None) -> Dict[str, str]:
    """Compute health trends using CUSUM on historical scores."""
    if not history or len(history) < 5:
        return {s: "→" for s in ("suspension", "engine", "electrical", "audio")}
    
    from .cusum import CUSUMDetector
    detector = CUSUMDetector()
    return detector.compute_all_trends(history)
```

`build_report()` получает optional `history` параметр (list of anomaly_scores dicts).

**Тесты (минимум 10):**
- Constant scores → stable (→)
- Decreasing scores → degrading (↓)
- Increasing scores → improving (↑)
- Too few scores (< 5) → stable
- Mixed scores → stable
- Sharp drop at end → degrading
- compute_all_trends with full history dict
- Integration: build_report with history → real trends
- Empty history → all stable

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать cusum.py
- [ ] Step 3: Модифицировать diagnosis_builder.py
- [ ] Step 4: Запустить → pass
- [ ] Step 5: Full suite → all pass
- [ ] Step 6: Commit

---

## Task 2: Расширить JSON правила (15 → 50+)

**Files:**
- Modify: `dashboard_build/diagnostic/rules/threshold_rules.json`
- Modify: `dashboard_build/tests/test_rule_engine.py` — update count test

**Добавить правила по категориям:**

**Двигатель (T1):**
- rough_idle: rpm oscillation > threshold при speed < 3
- cold_start_enrichment: ltft < -15 при coolant < 40 (нормально — не показывать)
- high_rpm_idle: rpm > 1200 при speed < 3, coolant > 80
- low_rpm_idle: rpm < 500 при speed < 3, coolant > 80
- intake_vacuum_low: map_pressure < 20 при rpm > 800 (подсос)
- intake_vacuum_high: map_pressure > 90 при rpm idle (клапан EGR)

**Топливная система (T1):**
- fuel_lean_bank2: ltft_bank2 > 10 (если есть банк 2)
- fuel_rich_bank2: ltft_bank2 < -10
- fuel_bank_mismatch: abs(ltft_bank1 - ltft_bank2) > 5 (разница банков)
- o2_sensor_lazy: stft oscillation low (при наличии данных)

**Электрика (T1):**
- charging_high: voltage > 15.5 при rpm > 1000 (перезаряд)
- voltage_drop_crank: voltage < 10 при rpm < 300 (стартер)

**Подвеска (T2):**
- harsh_road: total_vibration > 6.0 на highway (плохая дорога, не подвеска)
- front_axle_vibration: ax_std z> 2.5, speed > 40
- lateral_instability: ay_std z> 2.5, speed > 60

**Аудио (T3):**
- belt_squeal: dominant_freq 1000-4000, dominant_amp z> 2.0, rpm > 1000
- turbo_whistle: dominant_freq > 1500, dominant_amp z> 2.0, speed > 40
- brake_squeal: dominant_freq > 2000, dominant_amp z> 2.0, speed < 5

**Комбинированные (T2+T3):**
- power_steering_noise: dominant_amp z> 2.0, ay_std > 1.5, speed < 20

**Всего: 15 existing + ~20 новых = 35+ правил.**

- [ ] Step 1: Добавить правила в JSON
- [ ] Step 2: Обновить тест count (>= 35)
- [ ] Step 3: Full suite → all pass
- [ ] Step 4: Commit

---

## Task 3: Complex Python Rules

**Files:**
- Create: `dashboard_build/diagnostic/rules/complex_rules.py`
- Modify: `dashboard_build/diagnostic/rule_engine.py` — загрузка Python правил
- Create: `dashboard_build/tests/test_complex_rules.py`

**Реализовать 5 Python правил:**

```python
def rule_fuel_bank_cross(features, packet, baselines, regime):
    """Cross-analysis of LTFT Bank 1 vs Bank 2.
    
    Both positive → general lean (air leak after throttle)
    Both negative → general rich (fuel pressure, MAF)
    Mismatch → localized issue (injector, intake runner)
    """

def rule_vibration_regime_mismatch(features, packet, baselines, regime):
    """High vibration only in specific regime suggests specific cause.
    
    Only highway → wheel balance
    Only idle → engine mount
    All regimes → general suspension
    """

def rule_audio_rpm_harmonic(features, packet, baselines, regime):
    """Check if dominant audio frequency matches engine harmonic.
    
    freq ≈ RPM/60 * N (N=1..8) → engine-related noise
    """

def rule_progressive_degradation(features, packet, baselines, regime):
    """Check baselines for progressive degradation trend.
    
    If current z-score for az_std is > 2.0 AND baseline mean is increasing 
    over time → progressive suspension wear.
    """

def rule_cold_start_anomaly(features, packet, baselines, regime):
    """Detect anomalies specific to cold start.
    
    High vibration + cold engine (coolant < 60) is often normal.
    But if persists after warmup → real issue.
    """
```

Каждое Python правило возвращает:
```python
{
    "name": "fuel_bank_cross",
    "display": "Кросс-анализ банков",
    "confidence": 0-100,
    "status": "likely/possible/unlikely/clear",
    "tier": "T1",
    "details": {...}
}
```

**RuleEngine изменения:** Добавить `load_python_rules()` и вызвать в `run_all()`.

**Тесты (минимум 8):**
- fuel_bank_cross: both positive → lean detected
- fuel_bank_cross: mismatch → localized
- vibration_regime_mismatch: highway only → wheel balance
- audio_rpm_harmonic: matching frequency → engine noise
- Python rules appear in run_all results
- Python rules coexist with JSON rules

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать complex_rules.py
- [ ] Step 3: Модифицировать rule_engine.py
- [ ] Step 4: Запустить → pass
- [ ] Step 5: Full suite → all pass
- [ ] Step 6: Commit

---

## Task 4: Recalls Checker (серверный)

**Files:**
- Create: `dashboard_build/diagnostic/recalls_checker.py`
- Create: `dashboard_build/tests/test_recalls_checker.py`
- Modify: `dashboard_build/diagnostic/diagnosis_builder.py` — recalls блок

**Реализовать серверный checker (упрощённый vs клиентский 9-tier):**

2 источника:
1. **Локальная БД** — recalls-database.json (298 кампаний), поиск по brand + model + year
2. **NHTSA API** — `https://api.nhtsa.gov/recalls/recallsByVehicle?make=X&modelYear=Y` (JSON, без прокси)

```python
class RecallsChecker:
    def __init__(self, local_db_path: str = None):
        self._local_db = self._load_local_db(local_db_path)
    
    def check(self, brand: str, model: str, year: int, vin: str = None) -> List[dict]:
        """Check for recalls from all available sources."""
        results = []
        results.extend(self._check_local(brand, model, year))
        # NHTSA only for non-Chinese brands (Chinese brands not in NHTSA)
        if brand.lower() not in CHINESE_BRANDS:
            results.extend(self._check_nhtsa(brand, model, year))
        return results
    
    def _check_local(self, brand, model, year) -> List[dict]:
        """Search local recalls DB by brand+model+year."""
    
    def _check_nhtsa(self, brand, model, year) -> List[dict]:
        """Query NHTSA API for recalls."""
```

**Интеграция:** `build_report()` получает optional `recalls_data` (list), заменяет placeholder `recalls: []`.

**Тесты (минимум 6):**
- Local DB lookup matches brand+model+year
- Local DB no match → empty list
- NHTSA format parsing
- Recalls appear in build_report
- build_report without recalls → empty list (backward compat)

- [ ] Step 1: Написать тесты
- [ ] Step 2: Реализовать recalls_checker.py
- [ ] Step 3: Модифицировать diagnosis_builder.py
- [ ] Step 4: Запустить → pass
- [ ] Step 5: Full suite → all pass
- [ ] Step 6: Commit

---

## Task 5: Dashboard — хук useDiagnosticV2 + подключение API v2

**Files:**
- Create: `llcar-dashboard/src/hooks/useDiagnosticV2.ts`
- Modify: `llcar-dashboard/src/pages/Diagnostics.tsx`
- Modify: `llcar-dashboard/src/stores/dashboardStore.ts`

**useDiagnosticV2.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';

interface DiagnosticReport {
  can_drive: 'safe' | 'caution' | 'stop';
  health_scores: { overall: number; suspension: number; engine: number; electrical: number; audio: number };
  health_trends: Record<string, string>;
  diagnoses: Diagnosis[];
  fuel_loss: { monthly_rub: number; yearly_rub: number } | null;
  escalations: Escalation[];
  recalls: any[];
  next_steps: string[];
  confidence: number;
  baseline_status: { ready: boolean; total_samples: number; samples_needed: number };
}

export function useDiagnosticV2(clientHash: string) {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = useCallback(async (data: any[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/diagnose/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_hash: clientHash, data }),
      });
      const report = await res.json();
      setReport(report);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientHash]);

  const sendFeedback = useCallback(async (ruleName: string, action: 'confirmed' | 'dismissed') => {
    await fetch('/api/v2/feedback/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_hash: clientHash, rule_name: ruleName, action }),
    });
  }, [clientHash]);

  return { report, loading, error, diagnose, sendFeedback };
}
```

**Diagnostics.tsx изменения:**
- Добавить переключатель "V1 / V2 API"
- Если V2: использовать useDiagnosticV2 вместо useApiData
- Показать can_drive светофор, health_scores, diagnoses

**dashboardStore.ts:** Добавить `apiVersion: 'v1' | 'v2'`

- [ ] Step 1: Создать useDiagnosticV2.ts
- [ ] Step 2: Модифицировать dashboardStore.ts
- [ ] Step 3: Модифицировать Diagnostics.tsx
- [ ] Step 4: npm run build → success
- [ ] Step 5: Commit

---

## Task 6: Dashboard — графики трендов (HealthTrends)

**Files:**
- Create: `llcar-dashboard/src/components/panels/HealthTrends.tsx`
- Modify: `llcar-dashboard/src/pages/Diagnostics.tsx` — добавить панель

**HealthTrends.tsx:**
```typescript
// Fetches /api/v2/history/?client_hash=X&period=7d
// Renders line chart with 4 system scores over time
// Uses existing glass panel styling
// Mini sparklines for each system + trend arrows
```

Использовать существующий стиль GlassPanel + ECharts (уже в проекте).

- [ ] Step 1: Создать HealthTrends.tsx
- [ ] Step 2: Добавить в Diagnostics.tsx
- [ ] Step 3: npm run build → success
- [ ] Step 4: Commit

---

## Task 7: Dashboard — кнопки feedback (FeedbackButtons)

**Files:**
- Create: `llcar-dashboard/src/components/panels/FeedbackButtons.tsx`
- Create: `llcar-dashboard/src/components/diagnostics/DiagnosisCardV2.tsx`
- Modify: `llcar-dashboard/src/pages/Diagnostics.tsx`

**DiagnosisCardV2.tsx:**
- Показывает диагноз из API v2: название, confidence, статус, объяснение
- Маршрутная карта ремонта (repair_roadmap)
- Кнопки "Подтверждаю ✓" / "Не так ✗" → POST /api/v2/feedback/
- Анимация при нажатии, disable после отправки

**FeedbackButtons.tsx:**
```typescript
interface FeedbackButtonsProps {
  ruleName: string;
  clientHash: string;
  onFeedback: (action: 'confirmed' | 'dismissed') => void;
}
// Two buttons: ✓ Подтверждаю / ✗ Не так
// POST to /api/v2/feedback/
// Disable after sending, show "Спасибо!"
```

- [ ] Step 1: Создать FeedbackButtons.tsx
- [ ] Step 2: Создать DiagnosisCardV2.tsx
- [ ] Step 3: Добавить в Diagnostics.tsx
- [ ] Step 4: npm run build → success
- [ ] Step 5: Deploy SPA to server
- [ ] Step 6: Commit

---

## Summary

| Task | Что | Тип | Зависит от |
|------|-----|-----|-----------|
| 1 | CUSUM тренды | Backend | — |
| 2 | 50+ JSON правил | Backend | — |
| 3 | Python правила | Backend | — |
| 4 | Recalls checker | Backend | — |
| 5 | Dashboard API v2 hook | Frontend | — |
| 6 | Графики трендов | Frontend | Task 5 |
| 7 | Кнопки feedback + DiagnosisCard | Frontend | Task 5 |

**Параллелизуемые:** Tasks 1-5 все независимы. Tasks 6-7 зависят от Task 5.

**Deploy:** После Tasks 1-4 → deploy backend. После Tasks 5-7 → npm build + deploy SPA.
