-- LLCAR Anomaly Detection Schema
-- Run: psql -U postgres -d vehinfo -f schema_anomaly.sql

CREATE TABLE IF NOT EXISTS anomaly_baselines (
    id SERIAL PRIMARY KEY,
    client_hash VARCHAR(64) NOT NULL,
    regime VARCHAR(20) NOT NULL,
    feature VARCHAR(40) NOT NULL,
    count INTEGER DEFAULT 0,
    mean DOUBLE PRECISION DEFAULT 0,
    m2 DOUBLE PRECISION DEFAULT 0,
    min_val DOUBLE PRECISION DEFAULT 1e18,
    max_val DOUBLE PRECISION DEFAULT -1e18,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_hash, regime, feature)
);
CREATE INDEX IF NOT EXISTS idx_baselines_client ON anomaly_baselines(client_hash);

CREATE TABLE IF NOT EXISTS anomaly_scores (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    regime VARCHAR(20),
    road_type VARCHAR(20),
    overall_score INTEGER,
    suspension_score INTEGER,
    engine_score INTEGER,
    electrical_score INTEGER,
    audio_score INTEGER,
    confidence REAL,
    cusum_short REAL DEFAULT 0,
    cusum_medium REAL DEFAULT 0,
    cusum_long REAL DEFAULT 0,
    degradation_detected BOOLEAN DEFAULT FALSE,
    trend_per_day REAL DEFAULT 0,
    top_diagnostic VARCHAR(40),
    top_diagnostic_confidence INTEGER DEFAULT 0,
    features_json JSONB
);
SELECT create_hypertable('anomaly_scores', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_scores_client_time ON anomaly_scores(client_hash, time DESC);

CREATE TABLE IF NOT EXISTS diagnostic_persistence (
    client_hash VARCHAR(64) NOT NULL,
    rule_name VARCHAR(40) NOT NULL,
    consecutive_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    PRIMARY KEY(client_hash, rule_name)
);

SELECT add_retention_policy('anomaly_scores', INTERVAL '90 days', if_not_exists => TRUE);
