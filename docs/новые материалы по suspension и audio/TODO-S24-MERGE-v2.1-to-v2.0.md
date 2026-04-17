# TODO S24/S25 — МЕРДЖ v2.1 → v2.0 RULES-REFERENCE

> **СТАТУС:** запланировано на 2026-05-17 (через 30 дней после запуска shadow-валидации 2026-04-17).
> **КРИТИЧНОСТЬ:** высокая — без этого справочник остаётся раздвоенным, и накапливается риск рассинхрона между v2.0 (стабильная) и v2.1 (рабочая).

---

## Предыстория

Сейчас в репо два файла справочника:

- `docs/RULES-REFERENCE.md` — **v2.0**, 4100 строк, замороженная стабильная версия.
- `docs/новые материалы по suspension и audio/RULES-REFERENCE.md` — **v2.1**, 5152 строки, рабочая копия с расширением S23 (приложения A.26–A.35, 8 shadow-правил, исправления фактов).

Разделение было сделано сознательно: пользователь в S23 запретил перезапись оригинала до того, как новые правила пройдут валидацию.

## Что именно надо сделать

### 1. Проверить итоги shadow-валидации (начиная с 2026-05-17)

На prod-сервере `185.55.57.145` прогнать для каждого из 8 shadow-правил:

```bash
/tmp/llcar_ssh.sh "cd /var/www/html/django/dashboard && \
  python -m diagnostic.scripts.promote_shadow_rule --rule-name <X> --dry-run"
```

Правила:
- `spectral_kurtosis_impulsive_bearing` (parent: `wheel_bearing_bpfo_harmonic`)
- `order_tracking_mount_wear_shadow` (parent: `engine_mount_wear`)
- `phase_lag_shift_shadow` (parent: `damper_energy_decay_poor`)
- `damping_bandwidth_wide_shadow` (parent: `damper_energy_decay_poor`)
- `stand_import_eusama_boge_phase_hpbm_shadow` (manual entry)
- `order_2x_imbalance_l4`
- `order_05_misfire_diesel`
- `knock_impulse_kurtogram_band` (parent: `knock_impulse_percussive`)

### 2. Критерии промоушна (из A.35)

Правило проходит в production, если:
- **precision ≥ 0.6** против ground truth (EUSAMA-ТО или механик).
- **FPR < 0.15** на «чистом» автопарке.
- **median_lead_days ≥ 7** если есть parent_rule.
- **Pearson r** (где применимо) — физическая связь с ground truth.

Без прохождения всех критериев — остаётся в shadow ещё один цикл, или удаляется.

### 3. Действия на каждое прошедшее правило

1. В `dashboard_build/diagnostic/rules/shadow_rules.json` — убрать правило из shadow_rules.
2. В `dashboard_build/diagnostic/rules/threshold_rules.json` — добавить правило с `shadow_mode: false`.
3. Скопировать соответствующие секции теории из v2.1 в `docs/RULES-REFERENCE.md` (v2.0).

### 4. Действия на непрошедшие правила

1. Оставить в shadow ещё на 30 дней **ИЛИ** удалить из обоих файлов правил.
2. Теория в v2.1 остаётся как архив, но не переносится в v2.0.

### 5. Финальный мердж документации

После обработки всех правил:
1. Скопировать прошедшие A.26–A.35 разделы из v2.1 в `docs/RULES-REFERENCE.md` (v2.0).
2. Обновить B.1 в v2.0 новыми DOI ([52]–[70]), B.2 — стандартами, B.3 — книгами.
3. Применить все fact-fixes: Draper 1938, первая окружная (1,0) мода, W_E vendor consensus, U_min → Tsymberov 1996.
4. Обновить заголовок v2.0 → v2.1 (версия + дата).
5. Удалить `docs/новые материалы по suspension и audio/RULES-REFERENCE.md`.
6. Удалить `docs/новые материалы по suspension и audio/CHANGES-v2.0-to-v2.1.md`.
7. Оставить `CLOUD-BEARING-PIPELINE-SPEC.md` на месте (это отдельный артефакт для S5).
8. Удалить этот файл `TODO-S24-MERGE-v2.1-to-v2.0.md` последним коммитом.

### 6. Коммит-план

```
git checkout -b s24/merge-v2.1-to-v2.0
# ... по одному коммиту на каждое прошедшее правило ...
git commit -m "feat(rules): promote spectral_kurtosis_impulsive_bearing → production"
# ... финальный мердж документации ...
git commit -m "docs: merge v2.1 → v2.0, unified RULES-REFERENCE.md"
git push -u origin s24/merge-v2.1-to-v2.0
gh pr create --title "S24: Merge v2.1 → v2.0 RULES-REFERENCE после shadow-валидации"
```

---

## Риски при откладывании

1. **Рассинхрон:** новые правки v2.0 (исправления опечаток, новые DOI) не попадают в v2.1 и наоборот.
2. **Путаница в ссылках:** внешние PR ссылаются то на v2.0, то на v2.1, без ясности какая — актуальная.
3. **Забытая теория:** приложения A.26–A.35 живут только в v2.1; если про v2.1 забыть — теория потеряется при переиндексации.
4. **Устаревшие shadow-правила:** если не проверить через 30 дней — правила будут вечно в shadow, занимая место в конфиге без пользы.

## Превентивные меры (уже сделаны в S23)

- Cron `0 6 * * * shadow_promotion_check.py` у `webadmin` — раз в сутки пишет в `/var/log/llcar/shadow_promotion_check.log` строки вида `READY <rule>` когда правило проходит критерии. **Смотреть этот лог начиная с 2026-05-17.**
- `S23-SESSION-REPORT.md` содержит roadmap S24+ с датой 2026-05-17.
- Память проекта: `memory/project_s24_merge_todo.md` (priority) — напоминание в каждой будущей сессии.

---

## Проверочный лист перед мерджем

- [ ] Shadow-валидация прошла ≥30 дней.
- [ ] `shadow_promotion_check.log` содержит `READY` для ≥4 правил (иначе мерджить рано).
- [ ] Запущен `promote_shadow_rule.py --dry-run` для всех 8 shadow-правил, результаты зафиксированы.
- [ ] У пользователя подтверждено, что можно переписывать v2.0.
- [ ] Создана ветка `s24/merge-v2.1-to-v2.0` от main.
- [ ] Полный `pytest dashboard_build/tests/` = 731/731 до мерджа и после.
- [ ] `git diff main dashboard-v3 -- docs/RULES-REFERENCE.md` = пустой до мерджа (v2.0 не должен быть изменён ни в одной S23-ветке).
