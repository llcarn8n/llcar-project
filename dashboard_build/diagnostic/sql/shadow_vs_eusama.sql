-- shadow_vs_eusama.sql — SQL-шаблоны для валидации shadow-правил
-- Используется через promote_shadow_rule.py и /api/diagnostics/shadow-metrics/.
--
-- Схема (см. db.py):
--   shadow_rule_log(time, client_hash, rule_name, confidence,
--                   conditions_met, conditions_total, features_snapshot)
--   eusama_tests(id, client_hash, time, front_left, front_right,
--                rear_left, rear_right, pass_threshold, notes)
--   user_feedback(time, client_hash, rule_name, action, comment)
--
-- Конвенции подстановки:
--   $rule_name     — имя правила (e.g. 'order_2x_imbalance_l4')
--   $window_days   — окно анализа в сутках (по умолчанию 30)
--   $min_we        — минимальный EUSAMA weight drop для "true positive" (≥40%)
--
-- =============================================================================

-- [1] ТРИГГЕР-СТАТИСТИКА ПРАВИЛА
-- Сколько раз правило сработало, у скольких уникальных клиентов,
-- средний/медианный confidence. Базовый "health check" правила.
SELECT
    rule_name,
    COUNT(*)                                 AS trigger_count,
    COUNT(DISTINCT client_hash)              AS unique_clients,
    AVG(confidence)                          AS mean_confidence,
    MIN(confidence)                          AS min_confidence,
    MAX(confidence)                          AS max_confidence,
    AVG(CAST(conditions_met AS FLOAT)
        / NULLIF(conditions_total, 0))       AS mean_condition_ratio
FROM shadow_rule_log
WHERE rule_name = $rule_name
  AND time > NOW() - INTERVAL '$window_days days'
GROUP BY rule_name;

-- =============================================================================

-- [2] КОРРЕЛЯЦИЯ SHADOW CONFIDENCE ↔ EUSAMA WEIGHT DROP
-- Для каждого клиента берём максимальный confidence shadow-правила за окно
-- и минимальный WE из EUSAMA-теста (худшее колесо). Возвращает пары для
-- последующего расчёта Pearson r (в Python) или сразу через corr() (PostgreSQL).
--
-- PostgreSQL-версия (использует corr()):
SELECT
    COUNT(*)                                     AS pairs,
    CORR(s.max_conf, e.min_we)                   AS pearson_r,
    AVG(s.max_conf)                              AS mean_shadow_conf,
    AVG(e.min_we)                                AS mean_eusama_we
FROM (
    SELECT client_hash, MAX(confidence) AS max_conf
    FROM shadow_rule_log
    WHERE rule_name = $rule_name
      AND time > NOW() - INTERVAL '$window_days days'
    GROUP BY client_hash
) s
INNER JOIN (
    SELECT client_hash,
           LEAST(front_left, front_right, rear_left, rear_right) AS min_we
    FROM eusama_tests
    WHERE time > NOW() - INTERVAL '$window_days days'
) e ON s.client_hash = e.client_hash;

-- SQLite-версия (без corr — выгрузка пар, r считается в Python):
SELECT
    s.client_hash,
    s.max_conf     AS shadow_confidence,
    e.min_we       AS eusama_we
FROM (
    SELECT client_hash, MAX(confidence) AS max_conf
    FROM shadow_rule_log
    WHERE rule_name = $rule_name
    GROUP BY client_hash
) s
INNER JOIN (
    SELECT client_hash,
           MIN(MIN(front_left, front_right), MIN(rear_left, rear_right)) AS min_we
    FROM eusama_tests
    GROUP BY client_hash
) e ON s.client_hash = e.client_hash;

-- =============================================================================

-- [3] PRECISION vs GROUND TRUTH (EUSAMA W_E < $min_we)
-- Считаем precision = TP / (TP + FP), где
--   TP: правило сработало И EUSAMA провалился (min_we < 40%)
--   FP: правило сработало, НО EUSAMA прошёл (min_we >= 40%)
-- Целевой порог промоушна: precision ≥ 0.6.
WITH fired AS (
    SELECT DISTINCT client_hash
    FROM shadow_rule_log
    WHERE rule_name = $rule_name
      AND time > NOW() - INTERVAL '$window_days days'
),
eusama_status AS (
    SELECT client_hash,
           CASE WHEN LEAST(front_left, front_right, rear_left, rear_right)
                     < COALESCE($min_we, 40.0)
                THEN 1 ELSE 0 END AS is_positive
    FROM eusama_tests
    WHERE time > NOW() - INTERVAL '$window_days days'
)
SELECT
    SUM(e.is_positive)                                            AS true_positives,
    SUM(1 - e.is_positive)                                        AS false_positives,
    CAST(SUM(e.is_positive) AS FLOAT) / NULLIF(COUNT(*), 0)       AS precision
FROM fired f
INNER JOIN eusama_status e ON f.client_hash = e.client_hash;

-- =============================================================================

-- [4] FALSE POSITIVE RATE НА «ЧИСТОМ» АВТОПАРКЕ
-- «Чистый» = клиенты, у которых ВСЕ EUSAMA-тесты за окно прошли порог.
-- FPR = (сработавшие среди чистых) / (всего чистых).
-- Цель для промоушна: FPR < 0.15.
WITH clean_clients AS (
    SELECT client_hash
    FROM eusama_tests
    WHERE time > NOW() - INTERVAL '$window_days days'
    GROUP BY client_hash
    HAVING MIN(LEAST(front_left, front_right, rear_left, rear_right))
           >= COALESCE($min_we, 40.0)
),
fired_clean AS (
    SELECT DISTINCT s.client_hash
    FROM shadow_rule_log s
    INNER JOIN clean_clients c ON s.client_hash = c.client_hash
    WHERE s.rule_name = $rule_name
      AND s.time > NOW() - INTERVAL '$window_days days'
)
SELECT
    (SELECT COUNT(*) FROM clean_clients)                         AS clean_total,
    (SELECT COUNT(*) FROM fired_clean)                           AS clean_false_positives,
    CAST((SELECT COUNT(*) FROM fired_clean) AS FLOAT)
        / NULLIF((SELECT COUNT(*) FROM clean_clients), 0)        AS fpr;

-- =============================================================================

-- [5] ВРЕМЕННОЕ ОПЕРЕЖЕНИЕ SHADOW НАД PRODUCTION
-- Для каждого клиента: первый триггер shadow-правила минус первый триггер
-- "родительского" production-правила. Медиана >= 7 дней — правило даёт
-- настоящее упреждение.
-- $parent_rule — имя существующего production-правила (например
-- 'wheel_bearing_bpfo_harmonic' для shadow 'spectral_kurtosis_impulsive_bearing').
WITH shadow_first AS (
    SELECT client_hash, MIN(time) AS first_shadow_time
    FROM shadow_rule_log
    WHERE rule_name = $rule_name
    GROUP BY client_hash
),
production_first AS (
    SELECT client_hash, MIN(time) AS first_prod_time
    FROM diagnosis_results      -- таблица production-результатов (см. db.py)
    WHERE rule_name = $parent_rule
    GROUP BY client_hash
)
SELECT
    COUNT(*)                                                          AS pairs,
    AVG(EXTRACT(EPOCH FROM (p.first_prod_time - s.first_shadow_time))
        / 86400.0)                                                    AS mean_lead_days,
    PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (p.first_prod_time - s.first_shadow_time))
                 / 86400.0
    )                                                                 AS median_lead_days
FROM shadow_first s
INNER JOIN production_first p ON s.client_hash = p.client_hash
WHERE p.first_prod_time > s.first_shadow_time;

-- =============================================================================

-- [6] USER-FEEDBACK CROSS-CHECK
-- Если доступны оценки механика через user_feedback (action='confirmed'/'dismissed'),
-- считаем confirm-rate. Альтернатива EUSAMA ground truth для правил, где
-- стенда нет (knock, engine mount).
SELECT
    uf.action,
    COUNT(*) AS cnt
FROM user_feedback uf
WHERE uf.rule_name = $rule_name
  AND uf.time > NOW() - INTERVAL '$window_days days'
GROUP BY uf.action;
