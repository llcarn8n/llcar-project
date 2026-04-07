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

-- ============================================
-- DIAGNOSTIC ENGINE v2 TABLES
-- ============================================

-- Vehicle Profile
CREATE TABLE IF NOT EXISTS vehicle_profiles (
    client_hash VARCHAR(64) PRIMARY KEY,
    vin VARCHAR(17),
    brand VARCHAR(40) NOT NULL,
    model VARCHAR(60) NOT NULL,
    generation VARCHAR(20),
    year INTEGER,
    engine_code VARCHAR(40),
    engine_type VARCHAR(10) DEFAULT 'ice',
    mileage_km INTEGER DEFAULT 0,
    platform VARCHAR(40),
    modifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DTC Events (с freeze frame контекстом)
CREATE TABLE IF NOT EXISTS dtc_events (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    dtc_code VARCHAR(10) NOT NULL,
    ecu VARCHAR(10),
    freeze_frame JSONB,
    resolved_at TIMESTAMPTZ,
    occurrences INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_dtc_events_client_code ON dtc_events(client_hash, dtc_code, time DESC);

-- Fact Log (для ML training, 180 дней retention)
CREATE TABLE IF NOT EXISTS fact_log (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    fact_type VARCHAR(40) NOT NULL,
    severity VARCHAR(20),
    confidence REAL,
    tier VARCHAR(5),
    details JSONB
);
SELECT create_hypertable('fact_log', 'time', if_not_exists => TRUE);
SELECT add_retention_policy('fact_log', INTERVAL '180 days', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_fact_log_client ON fact_log(client_hash, time DESC);

-- User Feedback (ground truth для ML)
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_hash VARCHAR(64) NOT NULL,
    rule_name VARCHAR(40) NOT NULL,
    diagnosis_time TIMESTAMPTZ,
    action VARCHAR(20) NOT NULL,
    comment TEXT
);
CREATE INDEX IF NOT EXISTS idx_feedback_client ON user_feedback(client_hash);

-- Correlation results (batch accel↔audio analysis)
CREATE TABLE IF NOT EXISTS correlation_results (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    trip_id VARCHAR(64),
    correlation_type VARCHAR(40) NOT NULL,
    r_value REAL,
    slope REAL,
    p_value REAL,
    data_points INTEGER,
    regime VARCHAR(20),
    diagnosis_hint VARCHAR(40)
);
CREATE INDEX IF NOT EXISTS idx_correlation_client_time ON correlation_results(client_hash, time DESC);

-- DTC Patterns (мульти-DTC, статическая)
CREATE TABLE IF NOT EXISTS dtc_patterns (
    id SERIAL PRIMARY KEY,
    pattern_codes TEXT[] NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence_boost INTEGER DEFAULT 20,
    situation_id TEXT,
    description TEXT
);

-- Обновить diagnostic_persistence (добавить escalation поля)
ALTER TABLE diagnostic_persistence
    ADD COLUMN IF NOT EXISTS first_triggered TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_confidence INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS user_dismissed_at TIMESTAMPTZ;

-- Начальные мульти-DTC паттерны (из YouTube кейсов)
INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description) VALUES
    ('{"P0171","P0174"}', 'air_leak', 25, 'Оба банка бедные = общий подсос воздуха, не инжектор'),
    ('{"P0172","P0175"}', 'rich_mixture', 25, 'Оба банка богатые = общая проблема (форсунки, давление, ДМРВ)'),
    ('{"P0300","P0301","P0302"}', 'ignition_coil', 20, 'Два соседних цилиндра = общая катушка зажигания, не свечи'),
    ('{"P0300","P0301","P0303"}', 'ignition_coil', 20, 'Два цилиндра = катушка или модуль зажигания'),
    ('{"P0420","P0430"}', 'bad_fuel', 20, 'Оба катализатора = некачественное топливо, не каталитик'),
    ('{"P0171","P0101"}', 'maf_failure', 25, 'Бедная смесь + ошибка ДМРВ = неисправный ДМРВ'),
    ('{"P0016","P0011"}', 'vvt_problem', 20, 'Рассогласование + управление VVT = фазорегулятор')
ON CONFLICT DO NOTHING;
