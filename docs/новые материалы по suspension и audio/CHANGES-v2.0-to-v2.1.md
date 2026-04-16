# Изменения RULES-REFERENCE v2.0 → v2.1

**Дата:** 2026-04-16
**Сессия:** S23
**Старая версия:** `docs/RULES-REFERENCE.md` (4100 строк, 133 правила, 25 теорий, 51 DOI) — **неизменна**.
**Новая версия:** `docs/новые материалы по suspension и audio/RULES-REFERENCE.md` (~5150 строк) — рабочая копия с расширением.

Два файла сосуществуют. v2.0 остаётся как stable reference; v2.1 содержит новую теоретическую базу, shadow-правила и production-правила S23. Явный мердж в `docs/` выполняется отдельной сессией с ревью (не в S23).

---

## Краткая сводка

| Показатель                        | v2.0    | v2.1    | Δ       |
|-----------------------------------|---------|---------|---------|
| Строк в файле                     | 4100    | ~5150   | +1050   |
| Приложений (раздел A)             | 25      | 35      | +10     |
| Правил раздела 1 (production)     | 28      | 31      | +3      |
| Shadow-правил (раздел 6)          | 3       | 7       | +4      |
| Complex-правил (Python)           | 8       | 11      | +3      |
| Записей B.1 (DOI)                 | 51      | 70      | +19     |
| Записей B.2 (стандарты)           | —       | +9      | +9      |
| Записей B.3 (книги)               | —       | +6      | +6      |

---

## Новые приложения (A.26–A.35)

### A.26 Spectral Kurtosis и Kurtogram
**Источник:** Antoni (2006, 2007). SK(f) = ⟨|X(t,f)|⁴⟩/⟨|X(t,f)|²⟩² − 2 — 4-й стандартизированный момент STFT. Fast Kurtogram (tree-structured filter bank) для автовыбора полосы анализа. Связь с A.12 Kurtosis (временной — частный случай). Численный пример: bearing 6206 с impulse train 35.7 Гц, модулирующий 3 кГц carrier — SK > 4, kurtogram_best_band содержит 3 кГц.

### A.27 Order Tracking (COT)
**Источник:** Fyfe & Munck (1997). O = f·60/n (безразмерный порядок). Computed Order Tracking — ресемплинг по Δθ=const. Инвариантность к RPM для run-up/coast-down. Таблица порядков L3/L4/L5/L6/V6/V8/V10/V12. Новая фича `fft_orders[0..9]` + `rpm_order_matches` в feature_extractor.

### A.28 Cyclostationary Modelling
**Источник:** Antoni et al. (2004). Циклическая автокорреляция R_x(τ,α). Дизель как циклостационарный источник: f_cycle = n/(2·60). Теоретическая рамка для 0.5-order misfire detection (Carlucci 2006 — только качественно).

### A.29 Wavelet Analysis (CWT/DWT/WPT)
**Источник:** Daubechies (1992), Mallat (2009), Peng & Chu (2004). CWT: W_x(a,b) = (1/√a)·∫x(t)·ψ*((t−b)/a)dt. Алгоритм Mallat через QMF. Таблица материнских вейвлетов: Morlet (для ударов), Daubechies db4–db10, Symlet, Meyer, Mexican Hat.

### A.30 Full Bearing Pipeline (Randall & Antoni 2011)
**Источник:** Randall & Antoni (2011). Полный алгоритм: SANC → Spectral Kurtosis → Kurtogram → WPT band-pass → Hilbert envelope → FFT. Пример подшипника ступицы 6206 (Z=9, d=9.5 мм, Dp=46 мм, α=0°, f_r=10 Гц) → BPFO=35.7, BPFI=54.3, FTF=3.97, BSF=23.2 Гц. Roadmap Stage I для правила 1.3 wheel_bearing_bpfo_harmonic.

### A.31 Engine Order Spectrum + Draper Formula
**Источник:** Draper (1938) DOI:10.2514/8.590, Brecq (SAE 2003), Di Gaeta (2018), Heywood (2018), Crocker (2007). f_fire = N_cyl·f_c/2, таблица для L3/L4/L5/L6/V6/V8/V10/V12. Балансирные валы Lanchester (2×RPM) для L4. Формула детонации f_{1,0} = 1.841·c/(π·B), **первая окружная (1,0) мода** (не радиальная). Таблица B=72/76/80/86/92/100/108 мм при c=900/1000/1100 м/с. Структурные резонансы (блок 800–1800, головка 1500–3500, поддон 400–900 Гц).

### A.32 BOGE Forced Vibration / MAHA FWT
**Источник:** vendor consensus (MAHA/Hofmann/Boge). A_max в резонансе, пороги амплитуды 0–25 / 25–50 / >50 мм. Принципиальное отличие от EUSAMA: постоянная частота возбуждения (12–25 Гц), не sweep; стенд не требует разгрузки колеса через sprung mass.

### A.33 Phase Angle Method (Tsymberov 1996)
**Источник:** Tsymberov SAE 960735 (1996), Guzek 2021 (подтверждение слабой чувствительности к давлению шины). U_min = 180° − φ_max. Пороги: U_min > 60° хорошо, 40–60° износ, <40° отказ (Tsymberov 1996, НЕ Konieczny 2022!).

### A.34 Half-Power Bandwidth Method (Calvo 2005)
**Источник:** Calvo et al. (2005), Hryciów (2021), Gobbi (2008). ζ = (ω₂−ω₁)/(2·ω_n) — демпинг из ширины резонансного пика на −3 дБ. Guard ζ<0.25 (иначе метод неприменим).

### A.35 Матрица критериев промоушна shadow → production
**Источник:** Fawcett (2006), Saito & Rehmsmeier (2015). Формализация порогов: precision ≥ 0.6, FPR < 0.15, median_lead_days ≥ 7 (если parent_rule). Pearson r как дополнительная гарантия физической корректности. Реальные примеры успешного (SK 6.4) и отклонённого (Phase Lag 6.6) промоушна. Связь с `promote_shadow_rule.py` и `/api/diagnostics/shadow-metrics/`.

---

## Новые правила

### Production (раздел 1, добавлены в S4, запущены в shadow_mode для валидации)

| Имя правила | Tier | shadow_mode | parent_rule | Приложение |
|-------------|------|-------------|-------------|-----------|
| `order_2x_imbalance_l4` | T3 | true | engine_mount_wear | A.27, A.31 |
| `order_05_misfire_diesel` | T2 | true | — | A.28, A.31 |
| `knock_impulse_kurtogram_band` | T2 | true | knock_impulse_percussive | A.26, A.31 |

### Shadow (раздел 6, добавлены в S2)

| Имя | Tier | Критерий промоушна |
|-----|------|-------------------|
| `6.4 spectral_kurtosis_impulsive_bearing` | T3 | precision ≥ 0.6 vs EUSAMA; lead ≥ 7д перед 1.3 |
| `6.5 order_tracking_mount_wear_shadow` | T3 | корреляция с parent 1.2 на reusable sample L4 |
| `6.6 phase_lag_shift_shadow` | T2 | Pearson r ≥ 0.6 с EUSAMA WE, FPR < 15% |
| `6.7 damping_bandwidth_wide_shadow` | T2 | ~60% покрытия через реальные поездки |

---

## Обновления существующих правил

### Правило 1.3 `wheel_bearing_bpfo_harmonic`
**Добавлен блок Roadmap Stage I** со ссылкой на A.30 Full Bearing Pipeline (Randall-Antoni 2011). Текущая реализация помечена как Stage 0/II; полный pipeline (SANC → SK → Kurtogram → WPT → envelope → FFT) — roadmap S5. Shadow-правило 6.4 обозначено как Stage 0.

### Правило 1.15 `knock_impulse_percussive`
**Добавлено объяснение частоты** через Draper 1938 (A.31): f_(1,0) = 1.841·c/(π·B). Для B=86 мм, c=1000 м/с → f ≈ 6.8 кГц. Указано на будущее правило `knock_impulse_kurtogram_band` как замену фиксированной полосы 5–8 кГц динамической через VIN→bore.

### Приложение A.8 BPFO/BPFI
**Добавлен развёрнутый численный пример подшипника 6206** (Z=9, d=9.5 мм, Dp=46 мм, α=0°) при f_r=10 Гц: BPFO=35.71, BPFI=54.29, BSF=23.18, FTF=3.97 Гц. Проверка BPFO+BPFI = Z·f_r. Диагностические гармоники H1–H5 BPFO и окна поиска в 10 FFT-пиках.

---

## Новые фичи в `feature_extractor.py` (S2)

| Фича | Описание | Связь с правилом |
|------|----------|------------------|
| `spectral_kurtosis_audio` | max SK(f) по audio-STFT 500 мс | 6.4 |
| `kurtogram_best_band_low` | нижняя граница оптимальной полосы | будущее 1.29 |
| `kurtogram_best_band_high` | верхняя граница | будущее 1.29 |
| `kurtogram_best_sk` | значение SK в оптимальной полосе | 1.29 |
| `fft_orders[0..9]` | массив FFT-пиков в порядках при rpm>800 | 6.5, order_* |
| `rpm_order_matches` | счётчик совпадений с {0.5,1.0,2.0,3.0,4.0} ±0.05 | 6.5 |
| `ax_az_phase_proxy` | кросс-корреляция az и ax (Phase Angle proxy) | 6.6 |
| `hpbm_bandwidth_ratio` | ширина резонансного пика wheel hop | 6.7 |
| `hpbm_applicable` | guard-флаг | 6.7 |

---

## VehicleProfile расширения (S2)

- `bore_mm: Optional[int]` — добавлено (из VIN decoder).
- `cylinder_count: Optional[int]` — добавлено / подтверждено.
- `turbo_blade_count: Optional[int]` — optional, редко известен.
- Computed property `knock_expected_freq_from_bore = 1.841 · 1000 / (π · bore_mm/1000)`.

---

## Новые DOI в B.1 [52]–[70]

```
[52] Konieczny L., Filipczyk J. (2022).            DOI:10.29354/diag/156917
[53] Klapka M. et al. (2017). Twilight of EUSAMA.  DOI:10.1007/s11012-016-0566-0
[54] Calvo J.A. et al. (2005).                     DOI:10.1504/IJVD.2005.007623
[55] Tsymberov A. (1996). SAE 960735.              DOI:10.4271/960735
[56] Fyfe K.R., Munck E.D.S. (1997).               DOI:10.1006/mssp.1996.0056
[57] Antoni J. (2006). Spectral Kurtosis.          DOI:10.1016/j.ymssp.2004.09.001
[58] Antoni J. (2007). Fast Kurtogram.             DOI:10.1016/j.ymssp.2005.12.002
[59] Randall R.B., Antoni J. (2011).               DOI:10.1016/j.ymssp.2010.07.017
[60] Carlucci A.P. et al. (2006).                  DOI:10.1016/j.jsv.2005.12.054
[61] Peng Z.K., Chu F.L. (2004).                   DOI:10.1016/S0888-3270(03)00075-X
[62] Hryciów Z. et al. (2021).                     DOI:10.17531/ein.2021.2.14
[63] Draper C.S. (1938). NACA Report No. 493.      DOI:10.2514/8.590
[64] Antoni J. et al. (2004). Spectral correlation. DOI:10.1016/S0888-3270(03)00088-8
[65] Gobbi M. et al. (2008).                       DOI:10.1007/s11012-008-9119-5
[66] Brecq G. et al. (2003). SAE 2003-01-1915.     (SAE Technical Paper)
[67] Di Gaeta A. et al. (2018). Knock onset.       (Applied Energy)
[68] Lucic I. et al. (2023). HPBM extension.       (см. B.1 в файле)
[69] Fawcett T. (2006). ROC analysis intro.        DOI:10.1016/j.patrec.2005.10.010
[70] Saito & Rehmsmeier (2015). PR plot vs ROC.    DOI:10.1371/journal.pone.0118432
```

---

## Новые стандарты в B.2

- **ISO 20816-3:2022** — замена ISO 10816-3 (mechanical vibration of machines with power > 15 kW).
- **ISO 21940-11:2016** — замена ISO 1940-1 (mechanical balance quality grades).
- **ISO 13373-3:2015** — vibration condition monitoring (rotating machinery guidelines).
- **ISO 15242-1:2015** — rolling bearings, measuring methods for vibration.
- **ISO 18431-1:2005** — signal processing for vibration testing.
- **VDI 3832:2013** — vibration monitoring of bearings.
- **Directive 2014/45/EU** — EU roadworthiness testing (EUSAMA-совместимые ограничения).
- **SAE J670:2008** — vehicle dynamics terminology.
- **EUSAMA TS 02/76** — первоисточник EUSAMA stand (Technical Standard).

---

## Новые книги в B.3

- **Daubechies I. (1992).** *Ten Lectures on Wavelets.* SIAM. ISBN 978-0-89871-274-2.
- **Mallat S. (2009).** *A Wavelet Tour of Signal Processing.* 3rd ed. Academic Press. ISBN 978-0-12-374370-1.
- **Heywood J.B. (2018).** *Internal Combustion Engine Fundamentals.* 2nd ed. McGraw-Hill. ISBN 978-1260116106.
- **Crocker M.J. (ed., 2007).** *Handbook of Noise and Vibration Control.* Wiley. ISBN 978-0-471-39599-7.
- **Harris T.A., Kotzalas M.N. (2007).** *Rolling Bearing Analysis.* 5th ed. CRC Press.
- **Dixon J.C. (2007).** *The Shock Absorber Handbook.* 2nd ed. SAE / Wiley. ISBN 978-0-470-51020-9.

---

## Исправления фактов (v2.0 → v2.1)

| Было в v2.0 | Стало в v2.1 | Источник |
|-------------|--------------|----------|
| Draper 1933 | **Draper 1938** (NACA Report No. 493) | DOI:10.2514/8.590 подтверждает 1938 |
| «первая радиальная мода» для knock | **первая окружная (1,0) мода** | Brecq (2003), Eisen (1974); (0,1) радиальная даёт 2× выше |
| W_E 61/41/21 ссылаются на TS-02/76 | **MAHA/Hofmann/Boge consensus + EUSAMA principle** | TS-02/76 задаёт метод, не пороги |
| U_min пороги → Konieczny 2022 | **Tsymberov SAE 960735 (1996)** | Konieczny 2022 только повторяет Tsymberov |
| Carlucci 2006 0.5-order с числами | **качественное описание** (без амплитуд) | Без полного PDF числа не использовать |

---

## Что НЕ вошло (scope S4+ / optional S5)

- **Stand-import правила** (manual entry EUSAMA/BOGE/Phase/HPBM через UI) — требуют UI hook.
- **Turbo blade pass frequency** при известном z_blade из VIN — optional, редкий сигнал.
- **Cloud reprocessing endpoint** для full bearing pipeline (SANC→SK→Kurt→WPT→Env) — S5 R&D, требует выделенной обработки.
- **Мердж v2.1 → v2.0** — умышленно отложен; пользователь явно запретил перезапись v2.0 в S23.

---

## Git-происхождение изменений

- **Ветка:** `dashboard-v3`
- **Commits S23:** см. `git log dashboard-v3 --since='2026-04-01' -- "docs/новые материалы по suspension и audio/RULES-REFERENCE.md"`
- **Pull Request:** не создан; merge в `main` — решение пользователя по завершении S24 (30-дневная shadow-валидация).

---

## Связанные артефакты S23

- `dashboard_build/diagnostic/feature_extractor.py` — 6 новых фич.
- `dashboard_build/diagnostic/threshold_rules.json` — shadow-правила 6.4–6.7.
- `dashboard_build/diagnostic/rules/complex_rules.py` — 3 order-based правила.
- `dashboard_build/diagnostic/vehicle_profile.py` — bore_mm + knock_expected_freq_from_bore.
- `dashboard_build/diagnostic/api_views.py` — endpoint `/api/diagnostics/shadow-metrics/`.
- `dashboard_build/diagnostic/scripts/promote_shadow_rule.py` — CLI промоушна.
- `dashboard_build/diagnostic/sql/shadow_vs_eusama.sql` — 6 SQL-шаблонов валидации.
- `dashboard_build/tests/test_shadow_metrics.py` — 21 тест.
- Новое: `docs/новые материалы по suspension и audio/S23-SESSION-REPORT.md` (финальный отчёт).
