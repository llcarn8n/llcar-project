# Verifier Findings — Session 16 P4

Проверено: 7 брендов × 10 ситуаций = 70 ситуаций

## hiphi_x (10 findings)

- **hiphi_x_002.qa.lidar_count** [HIGH]
  current: 6 лидаров для NOA: передний Hesai Pandora, 2 угловых передних, 2 боковых на крыл
  corrected: HiPhi X 2021 серийно НЕ оснащался 6 лидарами. Базовые комплектации использовали 
  reason: Серийный HiPhi X 2021 имел сенсорный пакет HiPhi Pilot (камеры + радары), а не lidar-based NOA. Указанная конфигурация и поставщик не соотве
- **hiphi_x_003.qa.dc_charging** [HIGH]
  current: деградация при частых DC 80 кВт
  corrected: HiPhi X поддерживает DC fast charging до 250 кВт (10-80% за ~22 минут). 80 кВт —
  reason: Указание '80 кВт' технически некорректно для HiPhi X — это премиум EV с поддержкой 250kW HPC.
- **hiphi_x_004.qa.motor_power** [HIGH]
  current: Задний мотор HiPhi X (300 кВт) работает в паре с передним (220 кВт)
  corrected: HiPhi X AWD: передний мотор ~220 кВт, задний мотор ~245 кВт (суммарно 480 кВт / 
  reason: Спецификация задней оси завышена. Реальная мощность задней ASM ~245 кВт.
- **hiphi_x_006.dtc_codes** [HIGH]
  current: ["P0A09","P0A10","P0A06","U0100"]
  corrected: P0A09 (DC/DC Converter Status Circuit) и P0A10 (DC/DC Converter Status Circuit P
  reason: P0A06 относится к HV interlock, а не к описанной проблеме недозаряда 12V от DC-DC.
  SUMMARY: high=4 medium=5 low=1

## im_l7 (9 findings)

- **im_motors_l7_001.qa.battery_chemistry+capacity** [HIGH]
  current: CATL NCM semi-solid 90-120 кВт·ч
  corrected: CATL NMC liquid 90 или 93 кВт·ч (semi-solid 130 кВт·ч — только Lightyear edition
  reason: Semi-solid батарея на L7 анонсирована лишь в ноябре 2022 и пошла в Lightyear edition 2023; для 2022 MY указывать semi-solid некорректно
- **im_motors_l7_003.qa.adas_sensors** [HIGH]
  current: лидар, 11 камер, 5 радаров, 12 УЗ датчиков
  corrected: 12 камер (HD), 5 mmWave-радаров, 12 УЗ; LiDAR — опция LR-edition 2023+, в base 2
  reason: У L7 2022 ровно 12 камер (3 фронт + боковые + задняя + surround). LiDAR появился позже
- **im_motors_l7_003.qa.platform_name** [HIGH]
  current: IM Hi4
  corrected: IMAD / IM AD Pilot (Hi4 — это технология Great Wall Hi4 AWD, не имеет отношения 
  reason: Hi4 — торговая марка Great Wall Motor (DHT-PHEV/AWD). У IM используется IMAD (IM Autonomous Driving) на Nvidia Orin
- **im_motors_l7_004.qa.dc_max_power** [HIGH]
  current: DC CCS2 (до 90 кВт)
  corrected: DC до 180 кВт (стандарт GB/T, не CCS2; в Китае DC = GB/T 20234.3); 11 кВт AC (GB
  reason: Китайский рынок 2022 — разъём GB/T, не CCS2. Пик DC мощности L7 — около 180 кВт (400V архитектура), 90 кВт занижено
- **im_motors_l7_005.qa.front_motor_power+0-100** [HIGH]
  current: Sport-режиме передний 340 кВт ... 0-100 3.7 → 6+ сек
  corrected: передний мотор 175 кВт (не 340); общая AWD 425 кВт; 0-100 = 3.87 с (AWD Performa
  reason: Front PMSM = 175 кВт, rear = 250 кВт, итого 425 кВт. 340 кВт спутано с лошадиными силами заднего (340 hp ≈ 250 кВт)
- **im_motors_l7_008.dtc_codes (C0035/C0040/C0045/C0050)** [HIGH]
  current: C0035, C0040, C0045, C0050
  corrected: C0035=Front LH wheel speed sensor; C0040=Front RH wheel speed; C0045=Rear LH; C0
  reason: Указанные коды относятся к ABS wheel speed sensors, а не к pedal travel sensor / iBooster failure. Для by-wire brake — C121F, C1A50, C055D и
- **im_motors_l7_010.qa.screen_size+os** [HIGH]
  current: Центральный 39" экран ... Android Automotive ... T-Box (Alibaba телематика)
  corrected: Дисплей L7 = 39 дюймов изогнутый (3 экрана: 12.3+10.5+12.3, общий = ~39") — форм
  reason: L7 использует IMOS (Banma AliOS), не Android Automotive (AAOS — Volvo/Polestar/GM). Это важное отличие для диагностики
  SUMMARY: high=7 medium=2 low=0

## jidu_robocar_01 (7 findings)

- **jidu_robo_01_001.platform** [HIGH]
  current: SEA-E
  corrected: SEA (Geely Sustainable Experience Architecture)
  reason: Jidu ROBO-01 uses Geely SEA platform. 'SEA-E' is not a documented sub-variant. Task spec mentions SEA-M but that is also undocumented for RO
- **jidu_robo_01_002.camera_count** [HIGH]
  current: 31 камера
  corrected: 12 камер (HD perception cameras)
  reason: ROBO-01 sensor suite: 2 LiDAR + 12 cameras + 5 mmWave radars + 12 ultrasonic + dual Nvidia Orin-X. The figure '31 cameras' is not supported 
- **jidu_robo_01_003.platform_coolant_spec** [HIGH]
  current: SEA-E spec
  corrected: SEA spec / Geely OEM coolant
  reason: Same SEA-E mislabel as #001.
- **jidu_robo_01_005.platform** [HIGH]
  current: SEA-E
  corrected: SEA
  reason: Same SEA-E mislabel as #001.
  SUMMARY: high=4 medium=2 low=1

## leap_c11 (9 findings)

- **leap_motor_c11_001.battery_pack_technology** [HIGH]
  current: Дисбаланс в батарее CTC 78.5 или 90 кВт·ч
  corrected: C11 2021 НЕ использует CTC (Cell-to-Chassis). CTC впервые применена на Leapmotor
  reason: CTC технология анонсирована Leapmotor в апреле 2022 для C01. C11 2021 имеет prismatic LFP cells (78.5 kWh) или NMC (90 kWh long range) в обы
- **leap_motor_c11_002.awd_total_power** [HIGH]
  current: Полноприводные C11 с 2 моторами (400-450 кВт суммарно)
  corrected: AWD C11 Performance: 400 кВт суммарно (front 130 kW + rear 200 kW = 330 kW peak 
  reason: Топовая Performance AWD C11 имеет 400 кВт пиковую (двигатели 200+200 или 130+200). 450 kW не существует в этой линейке.
- **leap_motor_c11_006.air_suspension_availability** [HIGH]
  current: Подвеска C11, особенно в версиях с пневмоподвеской (топовые комплектации)
  corrected: C11 2021 НЕ имеет пневмоподвески ни в одной комплектации. Подвеска — McPherson с
  reason: Ни одна версия C11 2021 (Pro/Premium/Performance) не оснащена air suspension. Это фактическая ошибка.
- **leap_motor_c11_008.ereev_existence_2021** [HIGH]
  current: C11 EREV с 1.5L двигателем-генератором ~95 л.с. для зарядки батареи 18.1 кВт·ч
  corrected: C11 EREV (Range Extender) НЕ существовал в 2021 году. EREV версия C11 запущена в
  reason: Critical error: C11 EREV не выпускался в 2021. Для file 'c11_2021/situations.json' эта ситуация некорректна. Если оставлять — батарея 43.7 к
- **leap_motor_c11_010.software_platform_version** [HIGH]
  current: ПО C11 на LEAP 3.0 регулярно обновляется
  corrected: C11 2021 запущен на платформе LEAP 1.0 (LEAP architecture первого поколения). LE
  reason: Терминологическая путаница: LEAP — это аппаратная платформа автомобиля. C11 2021 на LEAP 1.0/2.0, не 3.0. LEAP 3.0 вышла в 2023 году.
  SUMMARY: high=5 medium=4 low=0

## nio_et7 (2 findings)

- **nio_et7_002.title** [HIGH]
  current: Перегрев инвертора заднего PMSM 300 кВт
  corrected: Перегрев инвертора заднего PMSM 240 кВт
  reason: Заявленная мощность заднего PMSM 300 кВт некорректна. По официальным данным Nio суммарная мощность 480 кВт = 180 кВт передний ASM + 240 кВт 
- **nio_et7_002.qa** [HIGH]
  current: Перегрев инвертора заднего PMSM (255 кВт)
  corrected: Перегрев инвертора заднего PMSM (240 кВт)
  reason: Внутри одного описания указано 300 кВт (title) и 255 кВт (qa) — обе цифры не соответствуют реальным 240 кВт заднего PMSM Nio ET7.
  SUMMARY: high=2 medium=0 low=0

## voyah_free (9 findings)

- **voyah_free_001.battery_capacity** [HIGH]
  current: BEV 88 кВт·ч, EREV 33 кВт·ч
  corrected: BEV: 88 кВт·ч (Standard) или 106 кВт·ч (Long Range), CATL NCM. EREV: ~33 кВт·ч (
  reason: В qa указана только 88 кВт·ч для BEV — точно, но без упоминания 106 кВт·ч Long Range версии. EREV 33 кВт·ч корректно для ранней версии. Пост
- **voyah_free_001.dtc_codes** [HIGH]
  current: P0A80, P0AFA, P0AFC, U0100, P0A04
  corrected: P0A80, P0AFA, P0AFC, U0100, P0A04 (приемлемо — generic SAE J2012 HV/BMS коды)
  reason: Generic коды деградации HV батареи и связи BMS — корректны для любой EV.
- **voyah_free_007.motor_power** [HIGH]
  current: AWD 2 мотора 360 кВт суммарно, передний 160 кВт
  corrected: Voyah Free AWD: front motor ~160 кВт + rear motor ~200 кВт = 360 кВт суммарно — 
  reason: Конфигурация 160+200=360 кВт — корректна для базовой AWD версии. Указано верно.
  SUMMARY: high=3 medium=6 low=0

## xpeng_p7 (19 findings)

- **xpeng_p7_001.qa.coolant_type** [HIGH]
  current: G48 антифриз
  corrected: G12++/G13 (OAT/lobrid) для EV; XPeng использует фирменный low-conductivity coola
  reason: HV-системы требуют антифриза с низкой электропроводностью (deionized + OAT)
- **xpeng_p7_002.dtc_codes** [HIGH]
  current: P0562, P0563, U0100, U0140, B10A0
  corrected: OK — P0562 (System Voltage Low), P0563 (System Voltage High), U0100/U0140 (lost 
  reason: Корректный набор для проблем 12V
- **xpeng_p7_003.qa.adas_sensors** [HIGH]
  current: XPilot 3.0/3.5 — 14 УЗ, 8 камер, 2 передних радара Bosch (160м)
  corrected: Xpilot 3.0 (P7 2020): 12 камер + 5 mm-wave радаров (1 передний дальнего действия
  reason: Радаров 5 (не 2), камер 12 (не 8); 3.5 не существовала на момент выпуска P7 2020
- **xpeng_p7_004.qa.charge_port** [HIGH]
  current: Порт CCS2
  corrected: GB/T (Guobiao 20234) — китайский стандарт. P7 2020 продавался ТОЛЬКО на китайско
  reason: P7 2020 — только Китай, только GB/T. CCS2 — это экспорт с 2021
- **xpeng_p7_005.qa.motor_power** [HIGH]
  current: RWD 196 кВт; AWD передний 218 + задний 196 = 430 кВт/586 л.с.
  corrected: AWD: передний 120 кВт + задний 196 кВт = 316 кВт (430 л.с.). 218 кВт front — НЕВ
  reason: Передний мотор P7 — 120 кВт (асинхронный), не 218; суммарно 316 кВт, не 430
- **xpeng_p7_005.qa.inverter_supplier** [HIGH]
  current: Инвертор на SiC от XPeng/Semicop
  corrected: P7 2020 использует IGBT (Si), НЕ SiC. SiC появился в XPeng G9/P7i 2022+. Поставщ
  reason: P7 2020 — IGBT поколение; SiC — это G9/P7i эра
- **xpeng_p7_006.qa.air_suspension** [HIGH]
  current: Адаптивная пневмоподвеска Johnson Controls с 4 уровнями клиренса
  corrected: P7 2020 НЕ имеет пневмоподвески. Базовая — обычные пружины + опциональные адапти
  reason: Пневмоподвески у P7 нет вообще; вся ситуация на ложной предпосылке
- **xpeng_p7_006.dtc_codes** [HIGH]
  current: C1845, C1846, C1847, C1842
  corrected: Если убрать пневмоподвеску — DTCs нерелевантны. Для CDC адаптивных амортизаторов
  reason: Без пневмоподвески DTC утечек неактуальны
- **xpeng_p7_007.dtc_codes** [HIGH]
  current: P0A80, P0AFA, P0B00, P0AFC
  corrected: OK — все коды релевантны для HV battery imbalance. P0A80 (Replace HV Battery), P
  reason: Корректный набор
- **xpeng_p7_008.qa.vacuum_pump** [HIGH]
  current: iBooster Bosch + электрический вакуумный насос
  corrected: iBooster — ЭЛЕКТРОМЕХАНИЧЕСКИЙ усилитель, вакуумный насос НЕ требуется. Это его 
  reason: iBooster = электромеханика без вакуума; описанная проблема физически невозможна на этой системе
- **xpeng_p7_008.dtc_codes** [HIGH]
  current: C1256, C1257, C1258, C1255
  corrected: Generic chassis codes — без вакуумного насоса нерелевантны. Для iBooster актуаль
  reason: DTC привязаны к несуществующему компоненту
- **xpeng_p7_009.qa.refrigerant** [HIGH]
  current: R134a, заправка 500-650 г
  corrected: P7 2020 использует R1234yf (новый стандарт для EV, обязательный в EU/CN с 2017).
  reason: R134a постепенно выводится; новые EV — R1234yf (или R744 CO2 в некоторых моделях)
- **xpeng_p7_010.qa** [HIGH]
  current: Выдвижные дверные ручки с электроприводом, проблемы коррозии в РФ
  corrected: Корректно по факту. Замечание: P7 2020 в РФ официально не продавался (только сер
  reason: Технически верно; контекст РФ применим только к 2022+ серому импорту
- **xpeng_p7_010.dtc_codes** [HIGH]
  current: B10A5, B10A6, B10A7, B10A8
  corrected: OK — generic body module codes приемлемы для proprietary OEM door handle modules
  reason: B1xxx подходит для BCM-controlled accessories
  SUMMARY: high=14 medium=5 low=0


# ИТОГО
- high: 39 (применять автоматически)
- medium: 24 (требует re-check)
- low: 2 (только логировать)
- total: 65
