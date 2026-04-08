-- ============================================================
-- TimescaleDB Retention Policies for LLCAR
-- ============================================================
-- Target: vehinfo database on 185.55.57.145
-- Requires: TimescaleDB extension enabled.
--
-- Removes data older than the specified intervals automatically
-- via a background worker (runs every 24h by default).
--
-- Deployed: 2026-04-08
-- ============================================================

-- 1. anomaly_scores — hypertable, keep 90 days
SELECT add_retention_policy('anomaly_scores', INTERVAL '90 days',
       if_not_exists => true);

-- 2. fact_log — hypertable, keep 180 days
SELECT add_retention_policy('fact_log', INTERVAL '180 days',
       if_not_exists => true);

-- 3. dtc_events — was a regular table, converted to hypertable below.
--    Required PK change: (id) → (id, time) for TimescaleDB partitioning.

-- Step 3a: fix PK to include partitioning column
-- ALTER TABLE dtc_events DROP CONSTRAINT dtc_events_pkey;
-- ALTER TABLE dtc_events ADD PRIMARY KEY (id, "time");

-- Step 3b: convert to hypertable
SELECT create_hypertable('dtc_events', 'time',
       migrate_data => true,
       if_not_exists => true);

-- Step 3c: retention policy — keep 365 days
SELECT add_retention_policy('dtc_events', INTERVAL '365 days',
       if_not_exists => true);
