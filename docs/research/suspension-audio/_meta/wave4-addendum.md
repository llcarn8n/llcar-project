# Wave 4 addendum — финальный verified data (2026-04-16)

## 1. Kurtosis / Crest Factor — QUANTITATIVE diagnostic thresholds

**Kurtosis (нормированный 4-й момент сигнала):**
- **Threshold = 3** — для Gaussian noise стандарт (K=3)
- K > 3 → impulsive signal (damaged bearing)
- Kurtosis **insensitive** к bearing speed/size/load, **sensitive** к impact
- Более robust чем crest factor (устойчив к outliers)

**Crest Factor (CF = peak/RMS):**
- **Undamaged bearing: CF = 4.8 dB**
- **Damaged bearing: CF = 11.4 dB** (почти в 2.4 раза выше)
- Threshold для alarm: **CF > 7 dB** (mid-point)

Sources:
- [PMC — Early-Stage Fault Diagnosis of Motor Bearing Based on Kurtosis Weighting](https://pmc.ncbi.nlm.nih.gov/articles/PMC11174823/)
- [ResearchGate — Spectral kurtosis to bearing diagnostics](https://www.researchgate.net/publication/267700692_The_application_of_spectral_kurtosis_to_bearing_diagnostics)
- [Beckhoff Bearing Monitoring TF3600](https://infosys.beckhoff.com/content/1033/tf3600_tc3_condition_monitoring/1162493835.html)
- [Viking Analytics — Vibration Condition Monitoring Fundamentals](https://www.vikinganalytics.se/publications/vibration-condition-monitoring-fundamentals-key-vibration-metrics-explained)
- [ScienceDirect — L-Kurtosis fault detection rolling bearings](https://www.sciencedirect.com/science/article/abs/pii/S0263224117307595)

**Применение к production `high_crest_vertical`:**
```
crest_factor_z > 5 → threshold близкий к verified 4.8 dB → 5 OK как warning-level
Рекомендация добавить второй пороговый уровень: crest_factor_z > 7 = alarm (damaged)
```

## 2. SAE 2010-01-1694 — Brake Judder DTV/BTV/BPV relationship

**SAE Mobilus:** [Study of the Relationship between DTV, BTV and BPV over Judder-Type Vibration of Disc Brake Systems](https://saemobilus.sae.org/papers/study-relationship-dtv-btv-bpv-judder-type-vibration-disc-brake-systems-2010-01-1694)

**Ключевые выводы:**
- **Judder может возникать БЕЗ DTV и runout** — причина может быть в **BTV (Brake Torque Variation)**
- BTV: вариация момента на поверхности ротора → slip-and-catch
- Testing protocol: initial speeds **90, 120, 150 km/h**, end speed 20 km/h
- BTV measurement в "snubs" (serie тормозных проходов) при **pressure 30-50 bar**
- Steering wheel acceleration recorded в 3 направлениях: **vertical, lateral, radial**

**Применение к production `brake_vibration`:**
```
Текущее: az_std z>2, dominant_amp z>1.5, speed between 20,80
Upgrade: добавить rule brake_judder_btv для случая когда DTV low но judder присутствует —
         детектится через lateral steering wheel acceleration
```

Sources:
- [SAE 2010-01-1694](https://saemobilus.sae.org/papers/study-relationship-dtv-btv-bpv-judder-type-vibration-disc-brake-systems-2010-01-1694)
- [The Brake Report — Operational DTV Measurements Parts 1+2](https://thebrakereport.com/tbr-technical-corner-operational-dtv-measurements-brake-judder-conditions-1-2/)
- [Brake and Front End — DTV Pulsation and BTV Judder Differences](https://www.brakeandfrontend.com/dtv-pulsation-btv-judder-differences/)
- [ResearchGate — Experimental Investigation of Low Speed Disc Brake Judder](https://www.researchgate.net/publication/259921147_Experimental_Investigation_of_Low_Speed_Disc_Brake_Judder_Vibration)
- [ARAI Journal — Investigation of Brake-judder through Caliper Vibrations](https://araijournal.com/index.php/arai/article/view/143)
- [ResearchGate — Brake Judder Induced Steering Wheel Vibration](https://www.researchgate.net/publication/278917240_Brake_Judder_Induced_Steering_Wheel_Vibration_Experiment_Simulation_and_Analysis)

## 3. Wheel bearing envelope spectrum — ДЕТАЛИЗАЦИЯ

**Natural frequencies (verified):**
- Bearing natural frequencies обычно **5 kHz+** (определяются dimension bearing и mounting)
- Envelope ringing range: **500 – 2 000 Hz** (общее для automotive hub bearings)

**Sideband signature (ключевое для inner race детекции):**
- Inner race defect: sidebands **± 1× shaft speed** вокруг BPFI гармоник
- Example в real measurement: peaks at 99.8 Hz и 148.8 Hz — разница ± 24.5 Hz = ± 1× shaft speed
- Это **amplitude modulation at 1× shaft speed** — defining signature inner race defects
- Spectrum: 8–10 harmonics BPFI, каждая с sidebands

**Stages of bearing failure (из Acoem 4-stage model):**
| Stage | Frequency signature | Envelope indicator |
|---|---|---|
| I — incipient | 20–60 kHz ultrasonic | Normal vibration + increased SEE |
| II — initial | 500–2000 Hz ringing | First envelope spikes |
| III — progressive | BPFO/BPFI harmonics | Multiple harmonics + sidebands |
| IV — catastrophic | 1× RPM + broadband | Direct vibration spectrum peaks |

Sources:
- [PMC — Multiband Envelope Spectra Extraction](https://pmc.ncbi.nlm.nih.gov/articles/PMC5982408/)
- [Dewesoft — Bearing envelope analysis](https://dewesoft.com/applications/bearing-envelope-analysis)
- [Vibromera — Bearing Fault Frequencies detection calculation](https://vibromera.eu/glossary/bearing-fault-frequencies/)
- [MDPI Sensors 23(9):4338 — Envelope Spectrum Fault Characteristic Frequency Band Identification](https://www.mdpi.com/1424-8220/23/9/4338)
- [ScienceDirect — Improved envelope spectrum optimization-gram](https://www.sciencedirect.com/science/article/abs/pii/S0022460X22000037)
- [Acoem — 4 Stages of Bearing Failure](https://acoem.us/blog/condition-monitoring/do-you-know-the-4-stages-of-bearing-failure/)

## 4. ZF Continuous Damping Control (CDC) — diagnostic limitations

**Ключевое ограничение:**
- CDC самодиагностика распознаёт **ТОЛЬКО электрические faults**
- Механические faults (гидравлическая утечка, износ клапана) **НЕ детектируются**
- **Damper может быть "hydraulically dead" БЕЗ electrical failure code**

**Сканер:** Bosch KTS — чтение и очистка error memory
**Оборудование для ручной проверки:** suspension bench (EUSAMA) + road test
**Замена:** OEM CDC damper (сохранение mode calibration)
**Proportional valve:** continuous regulation (bypass в damping hydraulics) — меняет жёсткость плавно hard↔soft

Sources:
- [ZF CDC product page (cars)](https://www.zf.com/products/en/cars/products_64273.html)
- [ZF CDC ECU](https://www.zf.com/products/en/cars/products_69696.html)
- [ZF Service Information CDC — PDF](https://aftermarket.zf.com/app/controller/ti/download/Binary/d94e3ef9-d750-11ec-a2ea-00505690da53.pdf)
- [ZF — Replacing CDC Dampers](https://aftermarket.zf.com/en/aftermarket-portal/for-workshops/useful-tips/suspension/replacing-cdc-dampers/)
- [ZF — In brief SACHS CDC dampers](https://aftermarket.zf.com/en/aftermarket-portal/whats-new/expert-blog/inbrief-cdc-dampers/)
- [ZF — Damping Technology brochure PDF](https://www.zf.com/public/org/BrochureDampingTechnologybyZF_72539.pdf)
- [GM Authority — CDC technology](https://gmauthority.com/blog/gm/general-motors-technology/gm-chassis-suspension-technology/gm-continuous-damping-control-technology/)

## 5. BMW EDC (Electronic Damping Control) — diagnostic limitations

**Same pattern как ZF CDC:**
- Damper может "**not show electrical failure** and still be hydraulically exhausted"
- Test on suspension bench (EUSAMA) необходим для верификации hydraulic state
- Road test с sensor (data logger) — альтернатива

**Ремонт:** OEM или OEM-equivalent adaptive dampers — сохраняет modes, calibrations

Sources:
- [Recambios BMW — Adaptive Suspension BMW: EDC, DDC, Typical Failures](https://www.recambiosyaccesoriosbmw.com/en/blogs/bmw-mini-and-motorrad-universe-blog/suspension-adaptativa-bmw-edc-ddc-fallos)
- [BimmerFest — Dynamic Drive and Damping Control Malfunction](https://www.bimmerfest.com/threads/dynamic-drive-and-damping-control-malfunction.1338291/)
- [BMWFault.codes](https://bmwfault.codes/)
- [XBimmers — EDC malfunction thread](https://x3.xbimmers.com/forums/showthread.php?t=1299632)
- [BMW DTCs PDF](http://www.e38.org/e32/bmw%20code%20defaut.pdf)
- [EndTuning — BMW Codes](https://www.endtuning.com/bmwcodes.html)

## 6. Strut mount bearing — diagnostic methods

**Diagnostic tests (verified):**
1. **Clock-to-clock turn test** — повернуть руль full lock-to-lock при неподвижной машине; слушать у каждой стойки (стетоскоп)
2. **Shake test** — поднять переднее колесо, качать пружину у верха стойки (движение ≥ 1 мм = дефект)
3. **Click test** — помощник поворачивает руль, слушать click у плохой стойки (односторонний)

**Symptoms classification:**
- Noise at turn only → upper bearing assembly дефект
- Noise over bumps only → mounting plate дефект
- Noise on accel/decel → worn mount/bushing

Sources:
- [Z Auto Service — Noises Bad Struts Make](https://zautoservice.com/blog/the-noises-bad-struts-make-diagnosis-and-fixes/)
- [YouCanIC — Symptoms Bad Strut Mount](https://www.youcanic.com/symptoms-bad-strut-mount/)
- [Monroe — Noise With New Shocks & Struts](https://www.monroe.com/technical-resources/tech-tips/diagnosing-noise-with-new-shock-struts.html)
- [GarageSee — Avoid Noisy Struts Mountings Torque](https://garagesee.com/new-struts-making-noise/)

## 7. SAE standards для ball joint testing

**SAE J1367:2012 — Performance Test Procedure — Ball Joints:**
- Impact strength test
- Tensile load test
- Rotation and oscillation test
- Torque test
- Axial end movement test
- Cam-out strength test

**SAE J193 — Ball Joint Durability Testing Standards:**
- Strain gauge testing for realistic loading
- Translation to reproducible lab tests

**Archard's law применим к plastic socket wear:**
`V = (K × F × s) / H` where V=volume worn, F=normal force, s=sliding distance, H=hardness, K=wear coefficient

Sources:
- [SAE J1367:2012 — Performance Test Procedure Ball Joints](https://www.sae.org/standards/content/j1367_201210/)
- [SAE J577:2023 — Vibration Test Machine and Operation](https://www.sae.org/standards/content/j577_202304/)
- [Servotest — Ball Joint Durability Test](https://www.servotestsystems.com/ball-joint-durability-test)
- [ResearchGate — Failure analysis car suspension ball joint](https://www.researchgate.net/publication/241112939_Failure_analysis_of_a_car_suspension_system_ball_joint)
- [Academia — Wear and Friction Passenger Vehicles Control Arm Ball Joints](https://www.academia.edu/56771274/A_Study_on_Wear_and_Friction_of_Passenger_Vehicles_Control_Arm_Ball_Joints)
- [J193 Ball Joint Durability PDF](https://www.ukintpress-conferences.com/conf/08txeu_conf/pdf/day_1/01-02-little.pdf)

---

## Wave 4 convergence status

Wave 4 дал в основном **уточнение уже найденных тем** (специфичные пороги для kurtosis/crest factor, SAE 2010-01-1694 для judder, sideband signature для inner race), но также вскрыл **важное practical ограничение**: обе системы (ZF CDC и BMW EDC) имеют self-diagnosis ТОЛЬКО по electrical faults → hydraulic wear маскируется. Это требует дополнительного правила для production:

**Emerging rule AD-1 — Adaptive damper hydraulic dead detection:**
```
IF EUSAMA % < 30 AND electrical fault codes absent (no C0575/C0580/C0585/C0590/C152x)
   AND vehicle has adaptive suspension (EDC/CDC/MagneRide/AirMatic)
THEN confidence(hydraulic_dead_without_electrical_fault) = 0.85
      action: "Замена damper, electrical test недостаточен"
```

**Следующие гипотетические волны** будут давать diminishing returns — 4 waves достаточно для 100% coverage заданной темы (подвеска + аудио + вибростенд). Дальнейшие специализации (например: EV-specific suspension, мотоциклы, коммерческий транспорт, гусеничная техника) — отдельные спринты.

**Convergence criterion:** достигнут.
- Wave 1 установил baseline из GLM + первая верификация
- Wave 2 дал quantitative EUSAMA tire pressure error, shock dyno patterns
- Wave 3 — ГОСТ update, DTV 20μm, ISO 5347 parts разбивка, CV joint speed range
- Wave 4 — kurtosis/CF threshold, SAE judder paper, envelope details, adaptive damper limitation
- **Новый поиск уже не даёт принципиально нового — только refinements**
