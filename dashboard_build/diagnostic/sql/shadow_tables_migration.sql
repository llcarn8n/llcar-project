-- S23 shadow validation tables migration
-- Apply as postgres role: PGPASSWORD=postgres psql -U postgres -d vehinfo -f /tmp/shadow_tables_migration.sql
-- Idempotent: CREATE TABLE IF NOT EXISTS + GRANT сохраняют прежнее состояние при повторном прогоне.

-- -----------------------------------------------------------------------------
-- shadow_rule_log: trigger log для shadow-правил (feature_extractor + rule_engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shadow_rule_log (
    time              TIMESTAMPTZ NOT NULL,
    client_hash       TEXT        NOT NULL,
    rule_name         TEXT        NOT NULL,
    confidence        REAL,
    conditions_met    INTEGER,
    conditions_total  INTEGER,
    features_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_shadow_rule_log_rule_time
    ON shadow_rule_log (rule_name, time DESC);

CREATE INDEX IF NOT EXISTS idx_shadow_rule_log_client_time
    ON shadow_rule_log (client_hash, time DESC);

GRANT SELECT, INSERT ON shadow_rule_log TO webadmin;

-- TimescaleDB hypertable (тихо игнорируется, если extension не установлен)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('shadow_rule_log', 'time',
            if_not_exists => TRUE, migrate_data => TRUE);
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- eusama_tests: ground truth для shadow-валидации (EUSAMA WE по колёсам)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eusama_tests (
    id              SERIAL PRIMARY KEY,
    client_hash     TEXT        NOT NULL,
    time            TIMESTAMPTZ NOT NULL,
    front_left      REAL,
    front_right     REAL,
    rear_left       REAL,
    rear_right      REAL,
    pass_threshold  REAL DEFAULT 40.0,
    notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_eusama_client_time
    ON eusama_tests (client_hash, time DESC);

GRANT SELECT, INSERT ON eusama_tests TO webadmin;
GRANT USAGE, SELECT ON SEQUENCE eusama_tests_id_seq TO webadmin;

-- -----------------------------------------------------------------------------
-- user_feedback: отметки оператора / механика (ground truth в отсутствие стенда)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
    id              SERIAL PRIMARY KEY,
    time            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_hash     TEXT        NOT NULL,
    rule_name       TEXT        NOT NULL,
    diagnosis_time  TIMESTAMPTZ,
    action          TEXT,
    comment         TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_client_time
    ON user_feedback (client_hash, time DESC);

GRANT SELECT, INSERT ON user_feedback TO webadmin;
GRANT USAGE, SELECT ON SEQUENCE user_feedback_id_seq TO webadmin;

-- -----------------------------------------------------------------------------
-- Sanity check (выводится в psql после прогона)
-- -----------------------------------------------------------------------------
SELECT
    'shadow_rule_log' AS tbl, COUNT(*) AS rows FROM shadow_rule_log
UNION ALL SELECT 'eusama_tests',    COUNT(*) FROM eusama_tests
UNION ALL SELECT 'user_feedback',   COUNT(*) FROM user_feedback;
