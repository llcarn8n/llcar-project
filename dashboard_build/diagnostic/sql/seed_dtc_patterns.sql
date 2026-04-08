-- Seed dtc_patterns table with 20 multi-DTC diagnostic patterns
-- Run: PGPASSWORD=postgres psql -U postgres -d vehinfo -f seed_dtc_patterns.sql

CREATE TABLE IF NOT EXISTS dtc_patterns (
    id SERIAL PRIMARY KEY,
    pattern_codes TEXT[] NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence_boost INTEGER DEFAULT 20,
    situation_id TEXT,
    description_ru TEXT
);

-- Clear existing
TRUNCATE dtc_patterns;

INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description_ru) VALUES
-- Engine / Fuel
('{"P0171","P0174"}', 'air_leak_both_banks', 25, 'Оба банка бедные → подсос воздуха (не форсунка)'),
('{"P0172","P0175"}', 'rich_both_banks', 25, 'Оба банка богатые → утечка инжекторов или MAF'),
('{"P0171","P0101"}', 'maf_failure', 20, 'Бедная смесь + ошибка MAF → неисправность расходомера'),
('{"P0171","P0507"}', 'idle_air_leak', 20, 'Бедная + высокий ХХ → подсос на холостом ходу'),
-- Misfire
('{"P0300","P0301","P0302"}', 'coil_pack_12', 25, 'Пропуски в цил. 1+2 → общая катушка (не свечи)'),
('{"P0300","P0303","P0304"}', 'coil_pack_34', 25, 'Пропуски в цил. 3+4 → общая катушка'),
('{"P0300","P0301","P0302","P0303","P0304"}', 'multiple_misfire', 30, 'Пропуски во всех → топливо/давление/зажигание'),
-- Catalyst
('{"P0420","P0430"}', 'bad_fuel_or_cats', 20, 'Оба катализатора → плохое топливо (не сами каты)'),
('{"P0420","P0171"}', 'lean_damaged_cat', 20, 'Бедная + кат → длительная бедная смесь повредила катализатор'),
-- VVT / Timing
('{"P0016","P0011"}', 'vvt_problem', 20, 'Фазы + VVT → проблема с фазорегулятором'),
('{"P0016","P0017"}', 'timing_chain', 25, 'Оба датчика фаз → растяжение цепи ГРМ'),
-- EVAP
('{"P0440","P0442","P0455"}', 'evap_system', 20, 'Комплексная утечка EVAP → крышка бака или клапан адсорбера'),
('{"P0440","P0446"}', 'evap_vent', 15, 'EVAP + вентиляция → клапан вентиляции адсорбера'),
-- Sensors
('{"P0130","P0131","P0133"}', 'o2_sensor_b1s1', 20, 'Комплекс ошибок лямбда B1S1 → замена датчика'),
('{"P0340","P0341"}', 'camshaft_sensor', 20, 'Датчик распредвала → неисправность или проводка'),
('{"P0335","P0336"}', 'crankshaft_sensor', 20, 'Датчик коленвала → неисправность или проводка'),
-- Electrical
('{"P0562","P0563"}', 'voltage_regulation', 20, 'Низкое + высокое напряжение → генератор/регулятор'),
-- Transmission
('{"P0700","P0730"}', 'trans_gear_ratio', 15, 'Общая ошибка АКПП + передаточное число → соленоиды'),
-- Combined
('{"P0101","P0113"}', 'intake_system', 15, 'MAF + температура впуска → проблема впускного тракта'),
('{"P2096","P2097"}', 'post_cat_fuel_trim', 20, 'Коррекция после ката бедная+богатая → неисправность ката или лямбды');
