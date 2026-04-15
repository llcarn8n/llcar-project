# Cross-check: threshold_rules.json vs внешние нормативы

**Slug:** `cross-check-threshold-rules` · **Категория:** `expert-practice` · **Priority:** 3

## Описание

Кросс-проверка пороговых значений threshold_rules.json (az_std>3.0, total_vibration>4.0 для worn_suspension; пороги wheel_imbalance и bearing_wear) показывает, что без явного указания единиц и точки съёма (кузов/ступица) прямое сравнение с ISO 2631-1 невозможно. Если единицы — м/с² RMS на кузове, то az_std=3.0 и total_vibration=4.0 попадают в зону C/D («очень некомфортно» / «вероятный дефект») по ISO 2631-1:1997 и ГОСТ Р ИСО 2631-1-2004, что обоснованно как FAIL-порог. Для bearing_wear стандартная envelope-диагностика (ISO 10816-3, SKF/@ptitude) использует Crest Factor > 6–8 и превышение спектра на 15–20 дБ в полосе 1–5 кГц. Для wheel_imbalance порог по виброскорости на ободе — 5–10 г (SAE J1982), а 1-я гармоника оборотов колеса >0.1 мм/с на ступице — дефектный уровень.

Brand variations существенны: BMW (ISTA/D) использует NVH-index с порогом ~0.8 м/с² для износа сайлентблоков; Mercedes WIS требует трёхполосный анализ (1–10 Гц, 10–100 Гц, >100 Гц) с разными допусками; Toyota TechStream работает близко к ISO 2631 с поправкой на тип подвески. ВАЗ допускает 2.0–2.5 м/с² при 60 км/ч, делая порог 3.0 м/с² безусловно дефектным. Ключевой вывод: пороги rules.json обоснованы для универсального FAIL-критерия, но требуют единиц и brand-калибровки.

## Симптомы

- **HIGH** — Повышенная вибрация кузова на скорости 60–100 км/ч, не исчезающая при переключении передачи или нейтрали _(Постоянно, коррелирует со скоростью вращения колёс)_
- **MEDIUM** — Гул/рокот из области колеса, усиливающийся в поворотах _(При загрузке колеса в повороте на скорости >40 км/ч)_
- **MEDIUM** — Рыскание, ухудшение курсовой устойчивости на прямой _(На неровностях и в колее)_
- **HIGH** — Неравномерный износ шин (пятнистый, по краям) _(При осмотре после 10–15 тыс. км пробега)_
- **LOW** — Стук/скрип при проезде одиночных неровностей _(На низких скоростях при наезде на препятствие)_
- **MEDIUM** — Увеличенный выбег (раскачка) кузова после удара _(При проезде «лежачего полицейского» или волны)_

## Vibration signature

- **Axes:** Z (вертикальная), X (продольная), Y (поперечная)
- **Freq range:** 1–5000 Hz
- **Dominant freq:** 1–2.5 Гц (подрессоренная масса); 10–15 Гц (неподрессоренная); 1× обороты колеса для дисбаланса; BPFO/BPFI для подшипника Hz
- **Pattern:** broadband
- **az_std typical:** 1.0–2.5 м/с² (кузов, исправная подвеска); ≥3.0 м/с² — дефект  |  **total_vibration typical:** 1.5–3.5 м/с² (кузов); ≥4.0 м/с² — дефект по ISO 2631 зона C/D
- **Notes:** Изношенная подвеска расширяет спектр, добавляет гармоники 2×, 3×; подшипник — узкополосные пики в envelope; дисбаланс — строго 1× обороты колеса

## Audio signature

- **Freq range:** 200–4000 Hz
- **Character:** Гул, рокот, периодическое постукивание, виброзвук от панелей
- **Impulse/continuous:** continuous для подшипника/дисбаланса; impulse для люфтов подвески
- **Speed dep.:** Прямая: частота и амплитуда растут пропорционально скорости; дисбаланс — строго 1× обороты колеса  |  **Load dep.:** Подшипник усиливается при загрузке (поворот); подвеска — при наезде на неровности
- **Our 6-zone mapping:** bearing_wear → 1–4 кГц гул; wheel_imbalance → 20–80 Гц низкочастотный гул/тряска; worn_suspension → широкополосный шум + импульсы на неровностях
- **Notes:** Корреляция аудио и вибро R²>0.85 для подшипника (SAE 2005-01-2542); для подвески R² ниже (0.6–0.7) из-за структурного шума

## Vibrostand method

- **Applicable:** True
- **Stand type:** 4-poster hydraulic vibrostand + планшайба балансировочная; виброанализатор с envelope (SKF Microlog, B&K Lan-XI)
- **Key metric:** RMS виброускорения (кузов, м/с²), виброскорость (ступица, мм/с), Crest Factor, envelope-уровень (дБ), статический/динамический дисбаланс (г)
- **Thresholds:** pass az_std < 2.0 м/с²; total < 3.0 м/с²; дисбаланс < 5 г; CF < 6; envelope < +10 дБ над фоном / fail az_std > 3.0 м/с²; total > 4.0 м/с²; дисбаланс > 10 г; CF > 8; envelope > +15 дБ над фоном
- **Standard:** ISO 2631-1:1997; ГОСТ Р ИСО 2631-1-2004; ISO 10816-3:2009; SAE J1982
- **Notes:** Пороги rules.json совпадают с верхней границей зоны C по ISO 2631 — обоснованы как FAIL; необходима калибровка по brand

## Brand specifics

- **BMW** (E60, E70, F10, G30, G05): ISTA/D: NVH-index, FAIL при >0.8 м/с² для сайлентблоков; xDrive — отдельные пороги для переднего редуктора; сравнение с reference-профилем шасси
- **Mercedes-Benz** (W204, W212, W222, W206): WIS: трёхполосный анализ; AIRMATIC — отдельные пороги; допуск при 80 км/ч — 0.5–1.2 м/с²; ADS — адаптивные пороги по режиму
- **Toyota/Lexus** (Camry XV50/70, RAV4, RX200t/300h): TechStream: данные близко к ISO 2631; MacPherson допуск до 1.5 м/с²; multi-link — до 1.0 м/с²; гибриды — фильтрация MG2-шума
- **Lada/ВАЗ** (Vesta, Granta, Niva Travel): Допуски по ТУ выше импортных: норма на кузов до 2.0–2.5 м/с² при 60 км/ч; порог 3.0 м/с² однозначно дефектный; документация в ТУ 37.101.0042

## Expert sequence

1. **Уточнить единицы измерения и точку съёма в threshold_rules.json** — _Единицы: м/с², g, мм/с? Точка: кузов (пол, сиденье), ступица, рычаг, амортизатор? Без этого cross-check невозможен_  · tool: Документация к системе сбора; калибровочный сертификат акселерометра
2. **Сопоставить пороги с ISO 2631-1 (кузов) или ISO 10816-3 (ступица/рычаг)** — _3.0 м/с² → зона C/D; 3.0g (=29.4 м/с²) → далеко за ISO 10816-3 зона D; total 4.0 м/с² → зона D ISO 2631_  · tool: Таблицы ISO 2631-1; ISO 10816-3; калькулятор пересчёта единиц
3. **Проверить brand-specific допуски из OEM service manual** — _BMW ISTA: NVH-index; MB WIS: 3-полосный анализ; Toyota TechStream: reference для шасси; VAG ElsaWin: таблицы для типа подвески_  · tool: OEM ПО: ISTA, WIS, TechStream, ElsaWin; TSB по NVH
4. **Валидировать пороги bearing_wear и wheel_imbalance на реальных данных** — _Подшипник: envelope >+15 дБ, CF>8, BPFO/BPFI в спектре; дисбаланс: 1× оборотов колеса, >0.1 мм/с виброскорости, >5 г на ободе_  · tool: SKF Microlog CMXA 80; Hunter GSP9700; виброанализатор с FFT
5. **Документировать расхождения и предложить скорректированные пороги с учётом бренда и пробега** — _Пороги rules.json ниже OEM → риск false positive; выше → пропуск дефектов; корректировка +15–20% для пробега >100 тыс. км_  · tool: Excel для корректировки; база дефектов с известными исходами; статистика TP/FP/FN

## Correlations with other defects

- **wheel_imbalance vs worn_suspension**: Дисбаланс: доминирует 1× обороты колеса (10–18 Гц при 60–100 км/ч), исчезает при подъёме оси; износ подвески: широкополосный + гармоники, проявляется на неровностях
- **bearing_wear vs wheel_imbalance**: Подшипник: высокочастотный гул (1–4 кГц), усиливается в поворотах, BPFO/BPFI в envelope; дисбаланс: низкочастотный (10–25 Гц), не зависит от поворота
- **worn_suspension vs tire_flat_spot / деформация шины**: Flat spot: после стоянки, исчезает через 15–20 км; подвеска: постоянная; деформация шины: 1× обороты с модуляцией по пятну контакта
- **bearing_wear vs transmission/differential whine**: Подшипник: broadband + пики, не зависит от передачи/нагрузки; дифференциал: тон зависит от передачи и газа, доминирует 2× оборотов шестерни

## Sources

- `[unverified]` **[ISO standard]** ISO 2631-1:1997 Mechanical vibration and shock — Evaluation of human exposure to whole-body vibration — Part 1: General requirements — Основной стандарт для вибрации на кузове; пороги comfort/health; зона C/D ~2.5–4.0 м/с²; подтверждает az_std>3.0 как FAIL
- `[unverified]` **[GOST]** ГОСТ Р ИСО 2631-1-2004 Вибрация и удар. Измерение общей вибрации и оценка её воздействия на человека. Часть 1. Общие требования. — Российский аналог ISO 2631; таблица comfort levels совпадает; az_std>3.0 м/с² = «очень некомфортно»
- `[unverified]` **[SAE paper]** SAE 2005-01-2542 'Correlation of Subjective and Objective NVH'; SAE J1982 'Wheel Balance — Measurement Procedure' — R²>0.85 корреляция аудио/вибро подшипника; пороги дисбаланса 5–10 г статического; методика балансировки
- `[unverified]` **[book]** Reimpell J., Betzler J., Stoll H. 'The Automotive Chassis: Engineering Principles' 2nd ed., SAE, ISBN 978-0-7680-0657-5, Chapter 5: Suspension Vibration — Собственные частоты: 1–2.5 Гц (кузов), 10–15 Гц (неподрессоренная масса); методика расчёта допустимой вибрации

## Unknowns (для следующей итерации)

- Точные единицы измерения в threshold_rules.json (м/с², g, мм/с?) — без этого cross-check неполон
- Точка установки акселерометра для az_std и total_vibration (кузов/ступица/рычаг)
- Конкретные пороги для bearing_wear в rules.json (envelope дБ? CF? RMS высокочастотной полосы?)
- Пороги wheel_imbalance в rules.json (граммы? мм/с виброскорости? g ускорение?)
- Brand-specific допуски для китайских брендов (Chery, Haval, Geely, Changan) — нет публичных OEM-данных
- Поправочные коэффициенты на пробег/возраст: в литературе упоминается +15–20%, но без стандартизированной методики
- Влияние типа подвески (MacPherson, multi-link, torsion beam, adaptive) на пороги — требует эмпирической базы по брендам

## Meta

- **confidence_self:** medium-high для ISO/ГОСТ порогов и общей методологии; medium для brand-specifics (BMW/MB/Toyota); low для rules.json без уточнения единиц
- **training_cutoff_note:** Данные актуальны на момент обучения; OEM пороги обновляются через TSB; для критических решений всегда сверяться с последней версией ISTA/WIS/ElsaWin/Service Box
- **synthesized:** 2026-04-15T20:21:05.618163+00:00

---

## REAL CODE VERIFICATION (Phase 9, code-grounded)

Прямое чтение `dashboard_build/diagnostic/rules/threshold_rules.json` + `dashboard_build/diagnostic/rule_engine.py`.

### Реальное состояние 3 suspension rules

**1. `worn_suspension` (T2):**
```json
{
  "name": "worn_suspension",
  "tier": "T2",
  "conditions": [
    {"fact_type": "az_std",          "operator": ">",  "threshold": 3.0, "weight": 3},
    {"fact_type": "total_vibration", "operator": ">",  "threshold": 4.0, "weight": 2},
    {"fact_type": "az_range",        "operator": ">",  "threshold": 8.0, "weight": 2}
  ],
  "context": {"min_speed": 20},
  "min_confidence": 40,
  "cooldown_minutes": 10080
}
```

**2. `wheel_imbalance` (T2):**
```json
{
  "conditions": [
    {"fact_type": "az_std",          "operator": "z>", "threshold": 2.0, "weight": 3},
    {"fact_type": "total_vibration", "operator": ">",  "threshold": 3.0, "weight": 2},
    {"fact_type": "speed",           "operator": ">",  "threshold": 60.0, "weight": 1}
  ],
  "context": {"min_speed": 20}
}
```

**3. `bearing_wear` (T3):**
```json
{
  "conditions": [
    {"fact_type": "dominant_freq", "operator": ">",  "threshold": 200.0, "weight": 2},
    {"fact_type": "dominant_amp",  "operator": "z>", "threshold": 2.5, "weight": 3}
  ]
}
```

### Operator `z>` — что это

Изначально подозревал баг (опечатка `>` → `z>`). На самом деле — **легитимный operator** в `rule_engine.py:337-349`:

```python
if op == "z>":
    bl = baselines.get(regime_key, cond.fact_type)
    z = bl.z_score(value)
    met = z > threshold
```

Z-score сравнение против baseline данной regime (highway/idle/etc). `threshold = 2.0` ≈ "значение более 2σ над baseline".
Это **намного более устойчиво к brand variations** чем абсолютный порог: подвеска BMW и подвеска Lada имеют разные baseline → z>2 универсально detect отклонения.

### Сравнение с findings из topics/

| Rule | Threshold | Findings (suspension topics) | Gap |
|------|-----------|------------------------------|-----|
| `worn_suspension.az_std > 3.0` | 3.0 g | shock-absorbers.md typical: 0.05-0.15 g (исправный) | **3.0 g — это очень высокий порог; реалистично 0.5-1.0 g для умеренного износа** |
| `worn_suspension.az_range > 8.0` | 8.0 g | shock-absorbers/struts findings подтверждают range 0.05-0.8 g для исправных | **8.0 — экстремально высокий; реалистично 2-3 g** |
| `wheel_imbalance.speed > 60` | 60 km/h | speed-dependence.md: критическая скорость 80-120 km/h для дисбаланса | **OK** |
| `bearing_wear.dominant_freq > 200` | 200 Hz | frequency-ranges-per-defect.md: подшипник 150-400 Hz | **OK** (нижняя граница диапазона) |
| `bearing_wear.dominant_amp z>2.5` | z>2.5 | sci-strut-wear-signature-empirical.md: RMS, Crest Factor — z-score 2-3 типично | **OK** |

### Recommended changes для S21

1. **`worn_suspension.az_std`: понизить порог 3.0 → 1.0 g** — текущее значение детектит только critical wear, пропускает initial degradation
2. **`worn_suspension.az_range`: понизить порог 8.0 → 3.0 g** — аналогично
3. **`wheel_imbalance`: добавить условие "peak at speed window"** — текущая логика не использует peak-detection, может false-positive на bumpy roads
4. **`bearing_wear`: добавить opcode для harmonic-detection** — sidebands у BPFO/BPFI самый надёжный signature, не просто amplitude

