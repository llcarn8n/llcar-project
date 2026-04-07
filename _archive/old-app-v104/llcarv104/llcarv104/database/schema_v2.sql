-- New database schema for normalized QTP data storage
-- Created: 2026-03-18
-- Tables: 11 total (1 main + 8 ECU + 2 sensor tables)
-- Note: Removed FK constraints - TimescaleDB doesn't support FK between hypertables

-- Drop existing tables to recreate with new schema
DROP TABLE audio_windows CASCADE;
DROP TABLE accel_windows CASCADE;
DROP TABLE ecu_7ef CASCADE;
DROP TABLE ecu_7ee CASCADE;
DROP TABLE ecu_7ed CASCADE;
DROP TABLE ecu_7ec CASCADE;
DROP TABLE ecu_7eb CASCADE;
DROP TABLE ecu_7ea CASCADE;
DROP TABLE ecu_7e9 CASCADE;
DROP TABLE ecu_7e8 CASCADE;
DROP TABLE qtp_packets CASCADE;

-- Main packet table
CREATE TABLE qtp_packets (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGSERIAL,
    client_hash TEXT,
    geo_hash CHAR(8),
    road_type TEXT,
    season TEXT,
    acceleration_state TEXT,
    weather_temp DECIMAL(4,1),
    weather_humidity SMALLINT,
    weather_wind DECIMAL(4,1),
    weather_condition TEXT,
    device_battery SMALLINT,
    device_charging BOOLEAN,
    duration_ms INTEGER,
    ecu_mask SMALLINT DEFAULT 0,  -- Bitmask of active ECUs (bit 0=7E8, bit 1=7E9, etc.)
    packet_srcid BIGINT,          -- Source packet ID from client local database
    packet_srctimest BIGINT,      -- Source packet timestamp from client (Unix ms)
    PRIMARY KEY (time, packet_id)
);

-- Create hypertable for time-series data
SELECT create_hypertable('qtp_packets', 'time', chunk_time_interval => INTERVAL '1 day');

-- ECU 7E8 table (primary ECU)
CREATE TABLE ecu_7e8 (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    -- 40 standard PIDs
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    -- 10 extended fields
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);

-- Create hypertable (no FK constraint)
SELECT create_hypertable('ecu_7e8', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create index for joins (without FK)
CREATE INDEX idx_ecu_7e8_packet ON ecu_7e8(packet_id, time);

-- ECU 7E9 table
CREATE TABLE ecu_7e9 (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7e9', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7e9_packet ON ecu_7e9(packet_id, time);

-- ECU 7EA table
CREATE TABLE ecu_7ea (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7ea', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7ea_packet ON ecu_7ea(packet_id, time);

-- ECU 7EB table
CREATE TABLE ecu_7eb (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7eb', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7eb_packet ON ecu_7eb(packet_id, time);

-- ECU 7EC table
CREATE TABLE ecu_7ec (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7ec', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7ec_packet ON ecu_7ec(packet_id, time);

-- ECU 7ED table
CREATE TABLE ecu_7ed (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7ed', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7ed_packet ON ecu_7ed(packet_id, time);

-- ECU 7EE table
CREATE TABLE ecu_7ee (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7ee', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7ee_packet ON ecu_7ee(packet_id, time);

-- ECU 7EF table
CREATE TABLE ecu_7ef (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    p0103 SMALLINT, p0104 SMALLINT, p0105 SMALLINT, p0106 SMALLINT,
    p0107 SMALLINT, p010a SMALLINT, p010b SMALLINT, p010c SMALLINT,
    p010d SMALLINT, p010e SMALLINT, p010f SMALLINT, p0111 SMALLINT,
    p0113 SMALLINT, p0114 SMALLINT, p0115 SMALLINT, p011f INTEGER,
    p0121 INTEGER, p0123 SMALLINT, p012e SMALLINT, p012f SMALLINT,
    p0130 INTEGER, p0131 INTEGER, p0132 SMALLINT, p0134 SMALLINT,
    p013c SMALLINT, p0141 INTEGER, p0142 SMALLINT, p0143 SMALLINT,
    p0144 SMALLINT, p0145 SMALLINT, p0146 SMALLINT, p0147 SMALLINT,
    p014c SMALLINT, p014d INTEGER, p0151 SMALLINT, p0155 SMALLINT,
    p0162 SMALLINT, p0163 INTEGER, p0187 SMALLINT, p019e SMALLINT,
    p01a6 SMALLINT,
    ext_01 INTEGER, ext_02 INTEGER, ext_03 INTEGER, ext_04 INTEGER,
    ext_05 INTEGER, ext_06 INTEGER, ext_07 INTEGER, ext_08 INTEGER,
    ext_09 INTEGER, ext_10 INTEGER,
    -- 9 FastPID slots for QTP data (samples >= 3)
    fastpid_01_qtp SMALLINT[], fastpid_02_qtp SMALLINT[], fastpid_03_qtp SMALLINT[],
    fastpid_04_qtp SMALLINT[], fastpid_05_qtp SMALLINT[], fastpid_06_qtp SMALLINT[],
    fastpid_07_qtp SMALLINT[], fastpid_08_qtp SMALLINT[], fastpid_09_qtp SMALLINT[]
);
SELECT create_hypertable('ecu_7ef', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_ecu_7ef_packet ON ecu_7ef(packet_id, time);

-- Accelerometer windows table
CREATE TABLE accel_windows (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    window_index SMALLINT,
    -- X axis QTP block (8 bytes: min8, max8, avg8, sd8, shape1-4)
    ax_min SMALLINT, ax_max SMALLINT, ax_avg SMALLINT, ax_std SMALLINT,
    ax_shape1 SMALLINT, ax_shape2 SMALLINT, ax_shape3 SMALLINT, ax_shape4 SMALLINT,
    -- Y axis QTP block (8 bytes)
    ay_min SMALLINT, ay_max SMALLINT, ay_avg SMALLINT, ay_std SMALLINT,
    ay_shape1 SMALLINT, ay_shape2 SMALLINT, ay_shape3 SMALLINT, ay_shape4 SMALLINT,
    -- Z axis QTP block (8 bytes)
    az_min SMALLINT, az_max SMALLINT, az_avg SMALLINT, az_std SMALLINT,
    az_shape1 SMALLINT, az_shape2 SMALLINT, az_shape3 SMALLINT, az_shape4 SMALLINT
);
SELECT create_hypertable('accel_windows', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_accel_packet ON accel_windows(packet_id, time);

-- Audio windows table
CREATE TABLE audio_windows (
    time TIMESTAMPTZ NOT NULL,
    packet_id BIGINT,
    client_hash TEXT,
    window_index SMALLINT,
    -- 10 frequencies (freq + amplitude pairs)
    freq_1 SMALLINT, amp_1 SMALLINT,
    freq_2 SMALLINT, amp_2 SMALLINT,
    freq_3 SMALLINT, amp_3 SMALLINT,
    freq_4 SMALLINT, amp_4 SMALLINT,
    freq_5 SMALLINT, amp_5 SMALLINT,
    freq_6 SMALLINT, amp_6 SMALLINT,
    freq_7 SMALLINT, amp_7 SMALLINT,
    freq_8 SMALLINT, amp_8 SMALLINT,
    freq_9 SMALLINT, amp_9 SMALLINT,
    freq_10 SMALLINT, amp_10 SMALLINT,
    -- 10 peaks (offset + amplitude pairs)
    peak_1_offset SMALLINT, peak_1_amp SMALLINT,
    peak_2_offset SMALLINT, peak_2_amp SMALLINT,
    peak_3_offset SMALLINT, peak_3_amp SMALLINT,
    peak_4_offset SMALLINT, peak_4_amp SMALLINT,
    peak_5_offset SMALLINT, peak_5_amp SMALLINT,
    peak_6_offset SMALLINT, peak_6_amp SMALLINT,
    peak_7_offset SMALLINT, peak_7_amp SMALLINT,
    peak_8_offset SMALLINT, peak_8_amp SMALLINT,
    peak_9_offset SMALLINT, peak_9_amp SMALLINT,
    peak_10_offset SMALLINT, peak_10_amp SMALLINT,
    -- Audio quality score (0-100) for this 1-second window
    -- 100 = perfect vehicle sounds, 0 = heavily contaminated by music/speech
    quality SMALLINT DEFAULT 50
);
SELECT create_hypertable('audio_windows', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_audio_packet ON audio_windows(packet_id, time);

-- FastPID tracking table - maintains history of QTP PID assignments
CREATE TABLE linkfastpid_history (
    id SERIAL PRIMARY KEY,
    client_hash VARCHAR(64) NOT NULL,
    ecu_table VARCHAR(10) NOT NULL,      -- 'ecu_7e8', 'ecu_7e9', etc.
    orig_pid VARCHAR(10) NOT NULL,       -- 'p0C_0', 'p0C_2', etc.
    fastpid_num INTEGER NOT NULL,        -- 1-9
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_qtp_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    replaced_at TIMESTAMPTZ,             -- NULL = active
    replaced_by_pid VARCHAR(10),         -- which PID replaced this one
    UNIQUE(client_hash, ecu_table, orig_pid, assigned_at)
);

-- Index for looking up active assignments
CREATE INDEX idx_linkfastpid_active ON linkfastpid_history(client_hash, ecu_table, orig_pid) 
    WHERE replaced_at IS NULL;

-- Index for finding available slots
CREATE INDEX idx_linkfastpid_lookup ON linkfastpid_history(client_hash, ecu_table, fastpid_num) 
    WHERE replaced_at IS NULL;
