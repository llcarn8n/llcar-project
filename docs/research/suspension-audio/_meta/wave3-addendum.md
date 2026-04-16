# Wave 3 addendum — новые verified факты (2026-04-16)

## 1. ISO 5347 — детализация по частям

Стандарт калибровки акселерометров. ISO 5347 — это СЕРИЯ, не один документ.

| Part | Название | Freq range | Dyn range |
|---|---|---|---|
| Part 3 | Secondary vibration calibration | **20 Hz – 5 000 Hz** | **10–1 000 m/s²** |
| Part 6 | Primary vibration calibration at low frequencies | **0.5 Hz – 20 Hz** | **1–200 m/s²** |
| Part 22 | Accelerometer resonance testing (piezoelectric/piezoresistive/variable capacitance) | **50 Hz – 200 kHz** | — |

**Практическое значение:** для диагностики подвески (0.5–15 Hz body bounce + wheel hop) нужен Part 6; для сайлентблоков и подшипников (>20 Hz) — Part 3; для ударной / резонансной характеризации (BPFO гармоники >1 kHz) — Part 22.

Источники:
- [ISO 5347-3:1993](https://www.iso.org/standard/11349.html)
- [ISO 5347-22:1997](https://www.iso.org/standard/23783.html)
- [ISO 5347-14:1993 (steel block resonance)](https://www.iso.org/standard/11360.html)

## 2. ГОСТ Р 51709-2001 — ВАЖНО: УСТАРЕЛ

**Статус:** действовал 2001–2018. **Заменён на ГОСТ 33997-2016 с 1 февраля 2018 года.** Верхние ссылки в production-rules-crosscheck.md надо обновить: ссылаться на ГОСТ 33997-2016, не на ГОСТ Р 51709-2001.

**Что содержал ГОСТ Р 51709-2001 (актуально для истории и понимания):**
- Коэффициент сцепления валов роликового стенда с колёсами должен быть ≥ **0.65** для категорий M₁, O₁ (легковые + прицепы до 750 кг)
- ≥ **0.6** для M₂, M₃, N₁, N₂, N₃, O₂, O₃, O₄ (автобусы, грузовые, прицепы)
- Коэффициент сцепления = отношение результирующих продольной и поперечной сил реакции дороги к нормальной реакции

Источники:
- [Legalacts — ГОСТ Р 51709-2001 полный текст](https://legalacts.ru/doc/gost-r-51709-2001-gosudarstvennyi-standart-rossiiskoi-federatsii/)
- [cntd.ru — ГОСТ Р 51709-2001](http://docs.cntd.ru/document/gost-r-51709-2001)
- [stroyinf.ru — PDF ГОСТ Р 51709-2001](https://files.stroyinf.ru/Data/22/2246.pdf)

**Требование для S21:** обновить `dashboard_build/diagnostic/rules/threshold_rules.json` и документацию — везде `ГОСТ Р 51709-2001` заменить на `ГОСТ 33997-2016` (с уточнением дат действия).

## 3. MEMS акселерометры для смартфонов — конкретные чипы

**Bosch Sensortec BMI160:**
- 16-bit IMU, small low-power, low-noise
- Data sheet: [bosch-sensortec.com BST-BMI160-DS000](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmi160-ds000.pdf)
- SensorAPI: [GitHub boschsensortec/BMI160_SensorAPI](https://github.com/boschsensortec/BMI160_SensorAPI)

**Bosch BMI260 (улучшенный BMI160):**
- Low zero-g offset + sensitivity error
- Low temperature drifts
- Robust over PCB strain
- **Combines accelerometer with Bosch automotive-proven gyroscope** — прямое указание на automotive качество
- [BMI260 flyer](https://www.bosch-sensortec.com/media/boschsensortec/downloads/product_flyer/bst-bmi260-fl000.pdf)

**TDK InvenSense ICM-20689:**
- 3-axis gyro + 3-axis accel, MPU6000-compatible performance
- [Newark — ICM-20689](https://www.newark.com/invensense/icm-20689/mems-mod-3-axis-gyroscope-accelerometer/dp/69AC5937)

**Smartphone MEMS ограничения (academic validation):**
- "Smartphone MEMS accelerometers have relatively low sensitivity and high output noise density" — [Bosch Electronics Weekly 2018](https://www.electronicsweekly.com/news/products/sensors-products/bosch-improves-accelerometer-gyro-chips-phones-2018-10/)
- U Toronto MSc thesis с подробной спецификацией: [MEMS Accelerometer Specifications](https://www.eecg.utoronto.ca/~johns/nobots/theses/pdf/2017_keiming_kwong_masc.pdf)
- MDPI Sensors 19(14):3143 — использование smartphone MEMS для извлечения собственных частот мостов (**применимая методика для подвески**): [MDPI Bridge Fundamental Frequencies](https://www.mdpi.com/1424-8220/19/14/3143)

## 4. CV joint (ШРУС) — diagnostic specifics

**Verified signature (from Wave 3 sources):**
- Vibration peak при **50–70 mph (≈80–110 km/h)** из-за резонанса узлов кузова с wheel-order harmonics
- **Throttle-зависимость** — hallmark: усиление при acceleration, может исчезать при cruise с фиксированной скоростью
- Причина механизма: изношенный ШРУС создаёт **wobble** за счёт избыточного зазора → **imbalance rotating assembly**

**Cross-check с production rule `cv_joint_click` (в REPORT.md раздел 8):**
```
cv_joint_click: ay_std > 2.5, dominant_amp z>2, speed between 10,40
```
⚠ **Speed window 10-40 km/h — может быть узковат.** Wave 3 sources указывают что vibration пик на 50-70 mph (80-110 km/h) для развитого износа. Рекомендовано расширить:
- Low-speed click (10-40 km/h) — early wear (щелчки при повороте с нагрузкой)
- **Highway-speed vibration (80-110 km/h) + throttle dependence** — developed wear (imbalance)

Источники:
- [GSP Latin America — Diagnosing CV Axle Vibrations Under Acceleration vs. Cruising](https://www.gsplatinamerica.com/post/cv-axle-vibrations-acceleration-vs-cruising)
- [Nashville Performance — CV joint symptoms diagnose](https://nashvilleperformance.com/cv-joint-symptoms-how-to-diagnose-failures-in-your-cars-axle-joint/)
- [Rick's Free Auto Repair — CV joint vibration diagnosis](https://ricksfreeautorepairadvice.com/diagnose-a-cv-joint-noise-or-vibration/)
- [Delphi aa1car — Diagnosing Steering & Suspension Vibration](https://www.aa1car.com/library/vibrations.htm)

## 5. Brake DTV (disc thickness variation) — quantitative!

**КРИТИЧНО для нового правила:**
- **20 микрон** DTV достаточно для pedal pulsation (причина: pad oscillation → hydraulic pulse)
- Vibration peak at **~900 rpm колеса ≈ 120 km/h**
- SAE paper на эту тему: **[SAE 2019-01-2110 — DTV Operational Measurement](https://www.sae.org/publications/technical-papers/content/2019-01-2110/)** (verified)
- DBA, PowerStop, Delphi, Bendix все подтверждают

**Relation to existing rule `brake_vibration`:**
```
brake_vibration: az_std z>2, dominant_amp z>1.5, speed between 20,80
```
⚠ Speed window 20-80 — ловит средне-скоростную DTV, но упускает развитую stage 1 at ~120 km/h. Можно добавить второе правило `brake_vibration_dtv_high`:
```
IF az_std z>2 AND dominant_freq ≈ wheel_rpm × 1 (base) OR × N (N=harmonics)
   AND speed between [100,130]
THEN confidence(brake_dtv_developed) = 0.85
```

Источники:
- [PowerStop — Pulsing Vibrating Brake Pedal DTV](https://www.powerstop.com/resources/pulsing-vibrating-brake-pedal-dtv/)
- [DBA Brakes — DTV technical resource](https://dbabrakes.com/blogs/technical-resources/dtv-disc-thickness-variation)
- [The Brake Report — DTV Measurement Technical Corner Part 3](https://thebrakereport.com/tbr-technical-corner-disc-thickness-variation-measurement-under-operational-cold-and-hot-brake-judder-conditions-part-3-of-4/)
- [Vitrek — Measuring Brake Rotor Thickness Variation with Capacitive Sensing](https://vitrek.com/brake-rotor-thickness-variation/)
- [Phoenix Systems — How to Diagnose Excessive DTV](https://phoenixsystems.co/blogs/brake-system-tips/how-to-diagnose-excessive-disc-thickness-variation-dtv)
- [Bendix — DTV Issue 14](https://www.bendix.com.au/news-events/disc-thickness-variation-dtv-issue-14)
- [Delphi — How to diagnose warped brake discs](https://www.delphiautoparts.com/en-gb/mom/how-to/article/how-to-diagnose-warped-brake-discs)
- [Brake Academy — Operational DTV Measurements](https://www.brakeacademy.org/post/operational-dtv-measurements)
- [ResearchGate — Relationship between DTV BTV BPV over Judder-Type Vibration Disc Brake Systems](https://www.researchgate.net/publication/287071050_Study_of_the_Relationship_between_DTV_BTV_and_BPV_over_Judder-Type_Vibration_of_Disc_Brake_Systems)

## 6. Wave 3 insights — что конкретно обновить в REPORT.md

1. **Раздел 1 (Executive summary) — добавить:**
   - ГОСТ 33997-2016 (актуальный) / ГОСТ Р 51709-2001 (устарел с 2018)
   - DTV threshold **20 микрон** для pedal pulsation
   - ISO 5347-3/6/22 разбивка по freq ranges для калибровки акселерометра

2. **Раздел 8/8b (Production rules cross-check) — уточнить:**
   - `cv_joint_click` — расширить speed до 80-110 km/h для developed wear
   - Добавить rule `brake_vibration_dtv_high` при 100-130 km/h

3. **Раздел 11 (Bibliography) — добавить:**
   - SAE 2019-01-2110 (DTV Operational Measurement)
   - ISO 5347-3, -6, -22
   - ГОСТ 33997-2016
   - Bosch Sensortec datasheets (BMI160, BMI260)
   - TDK InvenSense ICM-20689

Итог Wave 3: все добавки соответствуют производственным данным, все источники через живые URL.
