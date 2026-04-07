# Секция 8: Database Schema

**Дата:** 2026-04-07
**Статус:** утверждено Петром

---

## Сервер: PostgreSQL + TimescaleDB (185.55.57.145)

---

## Существующие таблицы (уже работают, данные есть)

| Таблица | Записей | Что хранит |
|---------|---------|------------|
| qtp_packets | 44,663 | OBD пакеты: RPM, speed, coolant, LTFT, STFT, voltage, MAF и другие PID'ы |
| ecu_7e8 | 25,711 | Данные ДВС (Li Auto — проприетарные PID'ы) |
| ecu_7ea | 17,200 | Данные электромотора |
| ecu_7eb | 7,360 | Данные BMS (батарея, SOC, напряжение ячеек) |
| ecu_7ef | 7,441 | Данные системы охлаждения |
| accel_windows | 173,854 | Окна акселерометра: avg/std/min/max по 3 осям (X/Y/Z), длина окна ~4.5 сек |
| audio_windows | 85,576 | Окна аудио: dominant_freq, dominant_amp, audio_quality (0-100) |

Период данных: 12 дней (24 марта — 5 апреля 2026), 5 клиентов.

---

## Новые таблицы для диагностического движка

### 1. vehicle_profiles — профиль автомобиля

Обязательная таблица. Без профиля невозможна корректная диагностика (LTFT коррекции, KB resolution).

| Поле | Тип | Описание |
|------|-----|----------|
| client_hash | VARCHAR(64), PK | Уникальный идентификатор клиента |
| vin | VARCHAR(17) | VIN, читается через OBD Mode 09 |
| brand | VARCHAR(40), NOT NULL | Марка (chery, bmw, toyota) |
| model | VARCHAR(60), NOT NULL | Модель (tiggo_8_pro, x5, camry) |
| generation | VARCHAR(20) | Поколение (e53, e70, f15) — опционально |
| year | INTEGER | Год выпуска (из VIN или ввод) |
| engine_code | VARCHAR(40) | Код двигателя (ACTECO_1.5T, N55) — опционально |
| engine_type | VARCHAR(10), DEFAULT 'ice' | Тип: ice / phev / bev |
| mileage_km | INTEGER, DEFAULT 0 | Пробег, обновляется из OBD каждую поездку |
| platform | VARCHAR(40) | Платформа из platform-sharing.json (VW_MQB, GM_E2XX) |
| modifications | JSONB, DEFAULT '{}' | Модификации: {lpg: bool, euro2_removed_cat: bool, chip_tuning: bool} |
| created_at | TIMESTAMPTZ | Дата создания профиля |
| updated_at | TIMESTAMPTZ | Дата последнего обновления |

---

### 2. anomaly_baselines — персональные базовые линии (Welford)

"Норма для этой конкретной машины" per режим per метрика. Алгоритм Welford для online-вычисления среднего и дисперсии.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| regime | VARCHAR(20), NOT NULL | Режим: idle/city/highway/acceleration/braking/cornering |
| feature | VARCHAR(40), NOT NULL | Метрика: az_std, total_vibration, rpm, coolant, ltft... |
| count | INTEGER, DEFAULT 0 | Количество наблюдений (MAX_WINDOW = 500, потом замораживаем) |
| mean | DOUBLE PRECISION, DEFAULT 0 | Среднее |
| m2 | DOUBLE PRECISION, DEFAULT 0 | Сумма квадратов отклонений (для дисперсии) |
| min_val | DOUBLE PRECISION | Минимум за всё время |
| max_val | DOUBLE PRECISION | Максимум за всё время |
| updated_at | TIMESTAMPTZ | Последнее обновление |
| UNIQUE | (client_hash, regime, feature) | |

Индекс: по client_hash для быстрой загрузки всех baselines клиента.

---

### 3. anomaly_scores — оценки здоровья (TimescaleDB hypertable)

Основная таблица результатов диагностики. Одна запись = одно окно данных.

| Поле | Тип | Описание |
|------|-----|----------|
| time | TIMESTAMPTZ, NOT NULL | Временная метка (ключ hypertable) |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| regime | VARCHAR(20) | Режим в момент замера |
| road_type | VARCHAR(20) | Тип дороги |
| overall_score | INTEGER | Общая оценка здоровья 0-100 |
| suspension_score | INTEGER | Подвеска 0-100 |
| engine_score | INTEGER | Двигатель 0-100 |
| electrical_score | INTEGER | Электрика 0-100 |
| audio_score | INTEGER | Аудио-диагностика 0-100 |
| confidence | REAL | Уверенность в оценке 0.0-1.0 |
| cusum_short | REAL, DEFAULT 0 | CUSUM краткосрочный (k=3, h=10) |
| cusum_medium | REAL, DEFAULT 0 | CUSUM среднесрочный (k=5, h=15) |
| cusum_long | REAL, DEFAULT 0 | CUSUM долгосрочный (k=8, h=25) |
| degradation_detected | BOOLEAN, DEFAULT FALSE | Обнаружена деградация? |
| trend_per_day | REAL, DEFAULT 0 | Тренд оценки в баллах/день |
| top_diagnostic | VARCHAR(40) | Имя правила с наибольшей уверенностью |
| top_diagnostic_confidence | INTEGER, DEFAULT 0 | Уверенность топ-правила 0-100 |
| features_json | JSONB | ВСЕ фичи для ML training |

Индекс: (client_hash, time DESC)
Retention policy: 90 дней автоматическое удаление.

**Критично:** features_json пишется ВСЕГДА, даже когда всё в норме — negative examples для ML.

---

### 4. diagnostic_persistence — повторяемость и escalation

Отслеживает сколько раз правило сработало подряд, когда впервые, и на каком уровне эскалации.

| Поле | Тип | Описание |
|------|-----|----------|
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| rule_name | VARCHAR(40), NOT NULL | Имя правила (worn_suspension, fuel_trim_high...) |
| consecutive_count | INTEGER, DEFAULT 0 | Сколько раз подряд сработало |
| first_triggered | TIMESTAMPTZ | Когда впервые сработало |
| last_triggered | TIMESTAMPTZ | Когда последний раз сработало |
| max_confidence | INTEGER, DEFAULT 0 | Максимальная уверенность за всё время |
| escalation_level | INTEGER, DEFAULT 0 | 0=заметка, 1=предупреждение, 2=проблема, 3=срочно |
| user_dismissed_at | TIMESTAMPTZ | Когда пользователь отклонил (для cooldown 7 дней) |
| PRIMARY KEY | (client_hash, rule_name) | |

---

### 5. correlation_results — результаты кросс-корреляций accel↔audio

Заполняется batch job'ом после каждой поездки.

| Поле | Тип | Описание |
|------|-----|----------|
| time | TIMESTAMPTZ, NOT NULL | Время вычисления |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| trip_id | VARCHAR(64) | Идентификатор поездки (или временной диапазон) |
| correlation_type | VARCHAR(40) | vibration_rpm / audio_wheel / turn_click / vibration_speed_peak / highfreq_vibration |
| r_value | REAL | Коэффициент корреляции (-1.0 ... +1.0) |
| slope | REAL | Наклон регрессии |
| p_value | REAL | Статистическая значимость |
| data_points | INTEGER | Количество точек данных (минимум 50) |
| regime | VARCHAR(20) | Режим при вычислении |
| diagnosis_hint | VARCHAR(40) | engine_mount / wheel_bearing / cv_joint / wheel_balance / accessory_bearing |

Индекс: (client_hash, time DESC)

---

### 6. dtc_events — история DTC кодов с контекстом

Хранит каждое появление/исчезновение кода ошибки с freeze frame данными.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | |
| time | TIMESTAMPTZ, NOT NULL | Когда код обнаружен |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| dtc_code | VARCHAR(10), NOT NULL | Код ошибки (P0171, B0001...) |
| ecu | VARCHAR(10) | ECU источник (7E8, 7EA...) |
| freeze_frame | JSONB | Снимок параметров в момент ошибки: {rpm, speed, coolant, ltft, stft, load, map} |
| resolved_at | TIMESTAMPTZ | Когда код пропал (NULL = ещё активен) |
| occurrences | INTEGER, DEFAULT 1 | Сколько раз появлялся этот код |

Индекс: (client_hash, dtc_code, time DESC)

**Зачем freeze frame:** DTC P0171 при холостом ходе + coolant 30°C = холодный пуск (не проблема). DTC P0171 на трассе + coolant 90°C = реальная проблема. Без контекста — невозможно отличить.

---

### 7. fact_log — лог фактов для ML

Все сгенерированные факты. Training data для будущих моделей.

| Поле | Тип | Описание |
|------|-----|----------|
| time | TIMESTAMPTZ, NOT NULL | Время генерации факта |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| fact_type | VARCHAR(40), NOT NULL | Тип факта (dtc_active, ltft_severity, vibration_anomaly...) |
| severity | VARCHAR(20) | ok / warning / critical / danger |
| confidence | REAL | 0.0-1.0 |
| tier | VARCHAR(5) | T1 / T2 / T3 |
| details | JSONB | Детали факта (code, z_score, r_value, corrected_value...) |

Retention policy: 180 дней (дольше чем anomaly_scores — факты ценнее для ML).

---

### 8. user_feedback — обратная связь пользователя

Ground truth для ML. Без этой таблицы supervised learning невозможен.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | |
| time | TIMESTAMPTZ, NOT NULL | Когда пользователь дал обратную связь |
| client_hash | VARCHAR(64), NOT NULL | Клиент |
| rule_name | VARCHAR(40), NOT NULL | Какое правило оценивал |
| diagnosis_time | TIMESTAMPTZ | Когда был поставлен диагноз |
| action | VARCHAR(20), NOT NULL | confirmed / dismissed / resolved |
| comment | TEXT | Комментарий пользователя (опционально) |

- confirmed = "да, проблема есть" → positive example
- dismissed = "нет, это не так" → false positive, вес правила снижается
- resolved = "починил, проблема ушла" → confirmed diagnosis + resolved

---

### 9. dtc_patterns — мульти-DTC паттерны

Статическая таблица. Заполняется вручную из YouTube кейсов и профессиональной литературы. 20-30 записей.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | |
| pattern_codes | TEXT[] | Набор кодов: {'P0171', 'P0174'} |
| diagnosis | TEXT | Диагноз: "Подсос воздуха (оба банка)" |
| confidence_boost | INTEGER | Сколько добавить к уверенности при совпадении паттерна (+20) |
| situation_id | TEXT | Привязка к situations-universal.json |
| description | TEXT | Человеческое объяснение почему эта комбинация = этот диагноз |

---

## SQL для создания таблиц

Файл: `dashboard_build/schema_anomaly.sql` — обновить с новыми таблицами.

Порядок создания:
1. vehicle_profiles (нет зависимостей)
2. anomaly_baselines (ссылается на client_hash)
3. anomaly_scores + create_hypertable + retention policy
4. diagnostic_persistence
5. correlation_results
6. dtc_events
7. fact_log
8. user_feedback
9. dtc_patterns
