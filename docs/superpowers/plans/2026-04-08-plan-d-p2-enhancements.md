# Plan D: P2 Backend Enhancements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** 6 backend enhancements for deeper diagnostics and data quality.

**Architecture:** Additions to diagnostic/ modules. Some require data files from common files/.

**Tech Stack:** Python 3.11, PostgreSQL, TimescaleDB

---

### Task 31: VIN auto-decode server-side
- Create: `dashboard_build/diagnostic/vin_decoder.py` — WMI→brand (630 codes), char10→year, VDS→model matching.
- Modify: `api_views.py` — auto-decode VIN when provided in diagnose request.

### Task 32: Model/generation KB layers
- Modify: `knowledge_base.py` — add add_model_layer(), add_generation_layer(). Load per client's vehicle profile.

### Task 33: DTC patterns DB table
- Create PostgreSQL table `dtc_patterns`. Seed with 6 existing + 14 new patterns.
- Modify: `knowledge_base.py` — load from DB instead of hardcode.

### Task 34: Bank 1 vs Bank 2 in FuelTrimAnalyzer
- Modify: `fuel_trim_analyzer.py` — add analyze_dual_bank() method.

### Task 35: TimescaleDB retention policies
- SQL: `add_retention_policy('anomaly_scores', INTERVAL '90 days')`, same for fact_log (180 days).

### Task 36: DTC events ecu field + resolved_at
- Modify: `db_writers.py` — add ecu field, track resolved_at, increment occurrences on duplicate.
