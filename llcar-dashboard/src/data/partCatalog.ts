import type { PartSpec } from '../types/rules'

// Node names in car.glb are Russian with underscores (e.g. Шина_ПЛ, Тормоз_ЗП).
// Patterns are lowercase substrings; resolver matches via
// `nodeName.toLowerCase().includes(pattern)`.
// Russian corner codes: ПЛ=FL, ПП=FR, ЗЛ=RL, ЗП=RR.

export const partCatalog: PartSpec[] = [
  // ── Шины (все 4) ──
  // В текущей GLB узлы Шина_ПЛ/ПП/ЗЛ/ЗП и Колесо_*_Резиновая_накладка шарят
  // геометрию — hover на любой подсвечивает все 4. Один агрегированный spec.
  {
    nodeNames: [
      'шина пл', 'шина пп', 'шина зл', 'шина зп',
      'колесо пл резиновая накладка', 'колесо пп резиновая накладка',
      'колесо зл резиновая накладка', 'колесо зп резиновая накладка',
    ],
    display: 'Шины (все 4)',
    category: 'suspension',
    params: [
      { label: 'Давление ПЛ', key: 'pressure_fl', unit: 'psi', precision: 1 },
      { label: 'Давление ПП', key: 'pressure_fr', unit: 'psi', precision: 1 },
      { label: 'Давление ЗЛ', key: 'pressure_rl', unit: 'psi', precision: 1 },
      { label: 'Давление ЗП', key: 'pressure_rr', unit: 'psi', precision: 1 },
      { label: 'Wheel-hop', key: 'wheel_hop_peak_freq', unit: 'Гц', precision: 1 },
      { label: 'Δ к rps', key: 'wheel_hop_peak_shifted', unit: 'Гц', precision: 1 },
      { label: 'BPFO матчи', key: 'bpfo_harmonic_matches', precision: 0 },
    ],
    relatedRules: ['tire_pressure_low_wheel_hop', 'wheel_imbalance_speed_resonance', 'aquaplaning_risk'],
  },
  // ── Диски колёсные (все 4) ──
  // Отдельные меши в GLB: Колесо_*_Отделка (rim) + Колесо_*_Обшивка (rim).
  {
    nodeNames: [
      'колесо пл отделка', 'колесо пп отделка', 'колесо зл отделка', 'колесо зп отделка',
      'колесо пл обшивка', 'колесо пп обшивка', 'колесо зл обшивка', 'колесо зп обшивка',
    ],
    display: 'Диски колёсные (все 4)',
    category: 'suspension',
    params: [
      { label: 'Wheel-hop', key: 'wheel_hop_peak_freq', unit: 'Гц', precision: 1 },
      { label: 'Δ к rps', key: 'wheel_hop_peak_shifted', unit: 'Гц', precision: 1 },
    ],
    relatedRules: ['wheel_imbalance_speed_resonance'],
  },

  // ── Тормоза ──
  // В текущей GLB узлы "Тормоз_ПЛ/ПП/ЗЛ/ЗП" шарят геометрию — hover на любой
  // подсвечивает все 4. Сначала ловим общим spec'ом (все 4 колодки + audio),
  // отдельные угловые specs ниже — fallback для будущих моделей с разделением.
  {
    nodeNames: ['тормоз пл', 'тормоз пп', 'тормоз зл', 'тормоз зп'],
    display: 'Тормоза (все 4)',
    category: 'suspension',
    params: [
      { label: 'Износ ПЛ', key: 'brake_pad_wear_fl', unit: '%', precision: 0 },
      { label: 'Износ ПП', key: 'brake_pad_wear_fr', unit: '%', precision: 0 },
      { label: 'Износ ЗЛ', key: 'brake_pad_wear_rl', unit: '%', precision: 0 },
      { label: 'Износ ЗП', key: 'brake_pad_wear_rr', unit: '%', precision: 0 },
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Свист 5-8k', key: 'percussive_energy_5k_8k', precision: 2 },
      { label: 'Пиков 5-8k', key: 'percussive_peak_count_5k_8k', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear', 'brake_vibration'],
  },
  {
    nodeNames: ['тормоз_пл'],
    display: 'Тормоз передний левый',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'Износ колодки', key: 'brake_pad_wear_fl', unit: '%', precision: 0 },
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Свист 5-8k', key: 'percussive_energy_5k_8k', precision: 2 },
      { label: 'Пиков 5-8k', key: 'percussive_peak_count_5k_8k', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear', 'brake_vibration'],
  },
  {
    nodeNames: ['тормоз_пп'],
    display: 'Тормоз передний правый',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'Износ колодки', key: 'brake_pad_wear_fr', unit: '%', precision: 0 },
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Свист 5-8k', key: 'percussive_energy_5k_8k', precision: 2 },
      { label: 'Пиков 5-8k', key: 'percussive_peak_count_5k_8k', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear', 'brake_vibration'],
  },
  {
    nodeNames: ['тормоз_зл'],
    display: 'Тормоз задний левый',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'Износ колодки', key: 'brake_pad_wear_rl', unit: '%', precision: 0 },
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Свист 5-8k', key: 'percussive_energy_5k_8k', precision: 2 },
      { label: 'Пиков 5-8k', key: 'percussive_peak_count_5k_8k', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear', 'brake_vibration'],
  },
  {
    nodeNames: ['тормоз_зп'],
    display: 'Тормоз задний правый',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'Износ колодки', key: 'brake_pad_wear_rr', unit: '%', precision: 0 },
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Свист 5-8k', key: 'percussive_energy_5k_8k', precision: 2 },
      { label: 'Пиков 5-8k', key: 'percussive_peak_count_5k_8k', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear', 'brake_vibration'],
  },

  // ── Амортизаторы ──
  {
    nodeNames: ['амортизатор_пл'],
    display: 'Амортизатор передний левый',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'AZ_STD', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
      { label: 'Пик AZ', key: 'az_peak_abs', unit: 'm/s²', precision: 2 },
      { label: 'Размах AZ', key: 'az_range', unit: 'm/s²', precision: 2 },
      { label: 'Crest factor', key: 'crest_factor_z', precision: 2 },
      { label: 'Confidence', key: 'shock_absorber_worn_conf_fl', unit: '%', precision: 0 },
    ],
    relatedRules: ['shock_absorber_worn', 'damper_energy_decay_poor', 'worn_suspension'],
  },
  {
    nodeNames: ['амортизатор_пп'],
    display: 'Амортизатор передний правый',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'AZ_STD', key: 'az_std_fr', unit: 'm/s²', precision: 2 },
      { label: 'Пик AZ', key: 'az_peak_abs', unit: 'm/s²', precision: 2 },
      { label: 'Размах AZ', key: 'az_range', unit: 'm/s²', precision: 2 },
      { label: 'Crest factor', key: 'crest_factor_z', precision: 2 },
      { label: 'Confidence', key: 'shock_absorber_worn_conf_fr', unit: '%', precision: 0 },
    ],
    relatedRules: ['shock_absorber_worn', 'damper_energy_decay_poor', 'worn_suspension'],
  },
  {
    nodeNames: ['амортизатор_зл'],
    display: 'Амортизатор задний левый',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'AZ_STD', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
      { label: 'Пик AZ', key: 'az_peak_abs', unit: 'm/s²', precision: 2 },
      { label: 'Размах AZ', key: 'az_range', unit: 'm/s²', precision: 2 },
      { label: 'Crest factor', key: 'crest_factor_z', precision: 2 },
      { label: 'Confidence', key: 'shock_absorber_worn_conf_rl', unit: '%', precision: 0 },
    ],
    relatedRules: ['shock_absorber_worn', 'damper_energy_decay_poor', 'worn_suspension'],
  },
  {
    nodeNames: ['амортизатор_зп'],
    display: 'Амортизатор задний правый',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'AZ_STD', key: 'az_std_rr', unit: 'm/s²', precision: 2 },
      { label: 'Пик AZ', key: 'az_peak_abs', unit: 'm/s²', precision: 2 },
      { label: 'Размах AZ', key: 'az_range', unit: 'm/s²', precision: 2 },
      { label: 'Crest factor', key: 'crest_factor_z', precision: 2 },
      { label: 'Confidence', key: 'shock_absorber_worn_conf_rr', unit: '%', precision: 0 },
    ],
    relatedRules: ['shock_absorber_worn', 'damper_energy_decay_poor', 'worn_suspension'],
  },
  // Общий узел GLB "Амортизатор_З_(шир)#2" / "Амортизатор_задний#2" представляет
  // СРАЗУ все 4 амортизатора (мешы не разделены по углам). На hover показываем
  // агрегированный tooltip со всеми 4 AZ_STD + Crest по углам.
  {
    nodeNames: ['амортизатор з (шир)', 'амортизатор задний'],
    display: 'Амортизаторы (все 4)',
    category: 'suspension',
    params: [
      { label: 'AZ_STD ПЛ', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ПП', key: 'az_std_fr', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ЗЛ', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ЗП', key: 'az_std_rr', unit: 'm/s²', precision: 2 },
      { label: 'Пик AZ', key: 'az_peak_abs', unit: 'm/s²', precision: 2 },
      { label: 'Размах AZ', key: 'az_range', unit: 'm/s²', precision: 2 },
      { label: 'Crest factor', key: 'crest_factor_z', precision: 2 },
    ],
    relatedRules: ['shock_absorber_worn', 'damper_energy_decay_poor', 'worn_suspension'],
  },

  // ── Пружины (все 4) ──
  // В GLB только общие узлы: "Пружина_задняя_(шир)#2" и "Пружина_задняя#2".
  // Hover подсвечивает все 4 — один агрегированный spec.
  {
    nodeNames: ['пружина задняя (шир)', 'пружина задняя', 'пружина_пл', 'пружина_пп', 'пружина_зл', 'пружина_зп'],
    display: 'Пружины (все 4)',
    category: 'suspension',
    params: [
      { label: 'Ride height', key: 'ride_height', unit: 'mm', precision: 0 },
      { label: 'AZ_STD ПЛ', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ПП', key: 'az_std_fr', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ЗЛ', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
      { label: 'AZ_STD ЗП', key: 'az_std_rr', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['worn_suspension', 'suspension_instability_trend'],
  },

  // ── Стабилизаторы ──
  {
    nodeNames: ['стабилизатор_передний', 'стабилизатор_п'],
    display: 'Стабилизатор передний',
    category: 'suspension',
    params: [
      { label: 'AY_STD', key: 'ay_std', unit: 'm/s²', precision: 2 },
      { label: 'Confidence', key: 'stabilizer_link_worn_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['stabilizer_link_worn', 'lateral_instability'],
  },
  {
    nodeNames: ['стабилизатор_задний', 'стабилизатор_з'],
    display: 'Стабилизатор задний',
    category: 'suspension',
    params: [
      { label: 'AY_STD', key: 'ay_std', unit: 'm/s²', precision: 2 },
      { label: 'Confidence', key: 'stabilizer_link_worn_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['stabilizer_link_worn', 'lateral_instability'],
  },

  // ── Рычаги и шаровые опоры ──
  {
    nodeNames: ['рычаг_верхний_пл'],
    display: 'Рычаг верхний ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['рычаг_верхний_пп'],
    display: 'Рычаг верхний ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['рычаг_нижний_пл'],
    display: 'Рычаг нижний ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['рычаг_нижний_пп'],
    display: 'Рычаг нижний ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['рычаг_зл', 'рычаг_задний_л'],
    display: 'Рычаг задний левый',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['рычаг_зп', 'рычаг_задний_п'],
    display: 'Рычаг задний правый',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'Bushing wear', key: 'bushing_wear_120_180hz', unit: '', precision: 2 },
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['bushing_wear_120_180hz', 'ball_joint_early_wear'],
  },
  {
    nodeNames: ['шаровая_пл'],
    display: 'Шаровая опора ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
      { label: 'AZ_STD', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['ball_joint_early_wear'],
  },
  {
    nodeNames: ['шаровая_пп'],
    display: 'Шаровая опора ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
      { label: 'AZ_STD', key: 'az_std_fr', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['ball_joint_early_wear'],
  },
  {
    nodeNames: ['шаровая_зл'],
    display: 'Шаровая опора ЗЛ',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
      { label: 'AZ_STD', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['ball_joint_early_wear'],
  },
  {
    nodeNames: ['шаровая_зп'],
    display: 'Шаровая опора ЗП',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'Ball joint conf', key: 'ball_joint_early_wear_conf', unit: '%', precision: 0 },
      { label: 'AZ_STD', key: 'az_std_rr', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['ball_joint_early_wear'],
  },

  // ── Подшипники ступицы ──
  {
    nodeNames: ['подшипник_ступицы_пл', 'ступичный_подшипник_пл'],
    display: 'Подшипник ступицы ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'BPFO harmonic', key: 'wheel_bearing_bpfo_harmonic', unit: '', precision: 2 },
      { label: 'Audio/speed', key: 'audio_speed_ratio', unit: '', precision: 2 },
    ],
    relatedRules: ['wheel_bearing_bpfo_harmonic', 'bearing_wear'],
  },
  {
    nodeNames: ['подшипник_ступицы_пп', 'ступичный_подшипник_пп'],
    display: 'Подшипник ступицы ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'BPFO harmonic', key: 'wheel_bearing_bpfo_harmonic', unit: '', precision: 2 },
      { label: 'Audio/speed', key: 'audio_speed_ratio', unit: '', precision: 2 },
    ],
    relatedRules: ['wheel_bearing_bpfo_harmonic', 'bearing_wear'],
  },
  {
    nodeNames: ['подшипник_ступицы_зл', 'ступичный_подшипник_зл'],
    display: 'Подшипник ступицы ЗЛ',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'BPFO harmonic', key: 'wheel_bearing_bpfo_harmonic', unit: '', precision: 2 },
      { label: 'Audio/speed', key: 'audio_speed_ratio', unit: '', precision: 2 },
    ],
    relatedRules: ['wheel_bearing_bpfo_harmonic', 'bearing_wear'],
  },
  {
    nodeNames: ['подшипник_ступицы_зп', 'ступичный_подшипник_зп'],
    display: 'Подшипник ступицы ЗП',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'BPFO harmonic', key: 'wheel_bearing_bpfo_harmonic', unit: '', precision: 2 },
      { label: 'Audio/speed', key: 'audio_speed_ratio', unit: '', precision: 2 },
    ],
    relatedRules: ['wheel_bearing_bpfo_harmonic', 'bearing_wear'],
  },

  // ── Полуоси ──
  {
    nodeNames: ['полуось_п'],
    display: 'Полуось передняя',
    category: 'engine',
    params: [
      { label: 'CV click', key: 'cv_joint_click_amp', unit: '', precision: 2 },
      { label: 'AX_STD', key: 'ax_std', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['cv_joint_click'],
  },
  {
    nodeNames: ['полуось_з'],
    display: 'Полуось задняя',
    category: 'engine',
    params: [
      { label: 'CV click', key: 'cv_joint_click_amp', unit: '', precision: 2 },
      { label: 'AX_STD', key: 'ax_std', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['cv_joint_click'],
  },

  // ── Пневмоподвеска ──
  // В GLB один общий узел "Пневмоподвеска#2" — не разделён на перед/зад.
  {
    nodeNames: ['пневмоподвеска'],
    display: 'Пневмоподвеска',
    category: 'suspension',
    params: [
      { label: 'Ride height', key: 'ride_height', unit: 'mm', precision: 0 },
      { label: 'AY_STD', key: 'ay_std', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['worn_suspension', 'adaptive_damper_hydraulic_dead'],
  },

  // ── Двигатель ──
  {
    nodeNames: ['двигатель_i4', 'двигатель'],
    display: 'Двигатель I4',
    category: 'engine',
    params: [
      { label: 'RPM', key: 'rpm', unit: 'об/мин', precision: 0 },
      { label: 'Coolant', key: 'coolant_temp', unit: '°C', precision: 0 },
      { label: 'Нагрузка', key: 'engine_load', unit: '%', precision: 0 },
      { label: 'Дроссель', key: 'throttle_pos', unit: '%', precision: 0 },
      { label: 'LTFT B1', key: 'ltft_bank1', unit: '%', precision: 1 },
      { label: 'STFT B1', key: 'stft_bank1', unit: '%', precision: 1 },
      { label: 'ΔLTFT-STFT', key: 'fuel_trim_delta', unit: '%', precision: 1 },
      { label: 'RPM-гармоники', key: 'rpm_harmonic_matches', precision: 0 },
    ],
    relatedRules: ['misfire', 'knock_detonation', 'engine_overheating', 'idle_vibration_high'],
  },
  {
    nodeNames: ['электромотор_передний', 'электромотор_п'],
    display: 'Электромотор передний',
    category: 'engine',
    params: [
      { label: 'Temp', key: 'motor_temp', unit: '°C', precision: 0 },
      { label: 'Power', key: 'motor_power_kw', unit: 'kW', precision: 1 },
    ],
    relatedRules: ['e_motor_temp_high', 'motor_overheat'],
  },
  {
    nodeNames: ['электромотор_задний', 'электромотор_з'],
    display: 'Электромотор задний',
    category: 'engine',
    params: [
      { label: 'Temp', key: 'motor_temp', unit: '°C', precision: 0 },
      { label: 'Power', key: 'motor_power_kw', unit: 'kW', precision: 1 },
    ],
    relatedRules: ['e_motor_temp_high', 'motor_overheat'],
  },
  {
    nodeNames: ['инвертор'],
    display: 'Инвертор',
    category: 'engine',
    params: [
      { label: 'Voltage 12V', key: 'voltage_12v', unit: 'В', precision: 2 },
      { label: 'Confidence', key: 'inverter_overtemp_conf', unit: '%', precision: 0 },
    ],
    relatedRules: ['inverter_overtemp'],
  },
  {
    nodeNames: ['генератор'],
    display: 'Генератор',
    category: 'electrical',
    params: [
      { label: 'Voltage 12V', key: 'voltage_12v', unit: 'В', precision: 2 },
      { label: 'RPM', key: 'rpm', unit: 'об/мин', precision: 0 },
    ],
    relatedRules: ['alternator_failure', 'charging_high', 'charging_intermittent'],
  },

  // ── Батарея ──
  {
    nodeNames: ['батарея вн', 'батарея_высоковольтная', 'батарея_hv', 'ввб'],
    display: 'Батарея высоковольтная',
    category: 'engine',
    params: [
      { label: 'HV Voltage', key: 'hv_voltage', unit: 'В', precision: 0 },
      { label: 'SOC', key: 'soc_percent', unit: '%', precision: 0 },
      { label: 'Cell delta', key: 'cell_delta', unit: 'В', precision: 3 },
    ],
    relatedRules: ['soc_critical', 'hv_battery_imbalance', 'battery_temp_high', 'charging_anomaly'],
  },
  // ── Радиатор (охлаждение) ──
  {
    nodeNames: ['радиатор'],
    display: 'Радиатор',
    category: 'engine',
    params: [
      { label: 'Coolant temp', key: 'coolant_temp', unit: '°C', precision: 0 },
      { label: 'Fan speed', key: 'cooling_fan_speed', unit: '%', precision: 0 },
    ],
    relatedRules: ['coolant_temp_high', 'cooling_system_fault', 'overheat_warning'],
  },
  {
    nodeNames: ['контур_охлаждения_батареи', 'охлаждение_батареи', 'охлаждение батареи'],
    display: 'Контур охлаждения батареи',
    category: 'engine',
    params: [
      { label: 'Coolant', key: 'coolant_temp', unit: '°C', precision: 0 },
      { label: 'SOC', key: 'soc_percent', unit: '%', precision: 0 },
    ],
    relatedRules: ['battery_temp_high'],
  },

  // ── Проводка ──
  {
    nodeNames: ['проводка_силовая'],
    display: 'Проводка силовая',
    category: 'electrical',
    params: [
      { label: 'HV Voltage', key: 'hv_voltage', unit: 'В', precision: 0 },
    ],
    relatedRules: ['charging_anomaly'],
  },
  {
    nodeNames: ['проводка_12в', 'проводка_12v'],
    display: 'Проводка 12В',
    category: 'electrical',
    params: [
      { label: 'Voltage 12V', key: 'voltage_12v', unit: 'В', precision: 2 },
    ],
    relatedRules: ['low_battery', 'battery_deep_discharge', 'voltage_drop_idle'],
  },

  // ── Динамики (все 4) ──
  // В GLB общий узел "Кузов (интерьер)#2 — Сетка динамика" + дверные primitives
  // "_6" (в Three.js multi-primitive разложении). Один агрегированный spec.
  {
    nodeNames: [
      'сетка динамика',
      'дверь передняя левая 6', 'дверь передняя правая 6',
      'дверь задняя левая 6', 'дверь задняя правая 6',
      'динамик_пл', 'динамик_пп', 'динамик_зл', 'динамик_зп',
      'speaker_fl', 'speaker_fr', 'speaker_rl', 'speaker_rr',
    ],
    display: 'Динамики (все 4)',
    category: 'audio',
    params: [
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
      { label: 'Dominant amp', key: 'dominant_amp', unit: '', precision: 2 },
    ],
    relatedRules: ['brake_squeal', 'belt_squeal', 'whistle_high_freq', 'wind_noise'],
  },

  // ── Свет ──
  {
    nodeNames: ['фара_п_л', 'фара_передняя_л'],
    display: 'Фара передняя левая',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['фара_п_п', 'фара_передняя_п'],
    display: 'Фара передняя правая',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['фара_з_л', 'фара_задняя_л'],
    display: 'Фонарь задний левый',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['фара_з_п', 'фара_задняя_п'],
    display: 'Фонарь задний правый',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['противотуманка_п_л'],
    display: 'Противотуманка передняя левая',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['противотуманка_п_п'],
    display: 'Противотуманка передняя правая',
    category: 'light',
    params: [
      { label: 'DTC', key: 'last_dtc_code' },
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
    ],
    relatedRules: ['vibration_with_dtc'],
  },

  // ── Приборка / интерьер ──
  {
    nodeNames: ['приборная_панель', 'приборная'],
    display: 'Приборная панель',
    category: 'interior',
    params: [
      { label: 'Active DTC', key: 'active_dtc_count', precision: 0 },
      { label: 'Last DTC', key: 'last_dtc_code' },
    ],
    relatedRules: ['vibration_with_dtc'],
  },
  {
    nodeNames: ['экран_приборов', 'цифровая_приборка'],
    display: 'Экран приборов',
    category: 'interior',
    params: [
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
      { label: 'Dominant amp', key: 'dominant_amp', unit: '', precision: 2 },
    ],
    relatedRules: ['idle_vibration_high'],
  },
  {
    nodeNames: ['руль'],
    display: 'Руль',
    category: 'interior',
    params: [
      { label: 'AY_STD', key: 'ay_std', unit: 'm/s²', precision: 2 },
      { label: 'AX_STD', key: 'ax_std', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['stabilizer_link_worn', 'power_steering_noise', 'lateral_instability'],
  },
  {
    nodeNames: ['подрамник_передний', 'подрамник_п'],
    display: 'Подрамник передний',
    category: 'suspension',
    params: [
      { label: 'AZ_STD', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
      { label: 'Total vib.', key: 'total_vibration', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['worn_suspension', 'bushing_wear_120_180hz'],
  },
  {
    nodeNames: ['подрамник_задний', 'подрамник_з'],
    display: 'Подрамник задний',
    category: 'suspension',
    params: [
      { label: 'AZ_STD', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
      { label: 'Total vib.', key: 'total_vibration', unit: 'm/s²', precision: 2 },
    ],
    relatedRules: ['worn_suspension', 'bushing_wear_120_180hz'],
  },
  {
    nodeNames: ['суппорт_пл'],
    display: 'Суппорт ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear'],
  },
  {
    nodeNames: ['суппорт_пп'],
    display: 'Суппорт ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'Audio 1-4 kHz', key: 'audio_1_4khz', unit: 'dB', precision: 1 },
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
    ],
    relatedRules: ['brake_squeal', 'brake_pad_wear'],
  },
  {
    nodeNames: ['карданный_вал', 'кардан'],
    display: 'Карданный вал',
    category: 'engine',
    params: [
      { label: 'Total vib.', key: 'total_vibration', unit: 'm/s²', precision: 2 },
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
    ],
    relatedRules: ['drivetrain_vibration', 'rumble_low_freq'],
  },
  {
    nodeNames: ['редуктор_задний', 'редуктор'],
    display: 'Редуктор',
    category: 'engine',
    params: [
      { label: 'Dominant freq', key: 'dominant_freq', unit: 'Hz', precision: 0 },
      { label: 'Dominant amp', key: 'dominant_amp', unit: '', precision: 2 },
    ],
    relatedRules: ['drivetrain_vibration', 'rumble_low_freq', 'bearing_wear'],
  },

  // ── Колёсные диски / обшивки (fall-through для Колесо_*_—_Обшивка/Отделка) ──
  {
    nodeNames: ['колесо_пл'],
    display: 'Колёсный диск ПЛ',
    category: 'suspension',
    corner: 'fl',
    params: [
      { label: 'AZ_STD', key: 'az_std_fl', unit: 'm/s²', precision: 2 },
      { label: 'Давление', key: 'pressure_fl', unit: 'psi', precision: 1 },
    ],
    relatedRules: ['wheel_imbalance_speed_resonance', 'tire_pressure_low_wheel_hop'],
  },
  {
    nodeNames: ['колесо_пп'],
    display: 'Колёсный диск ПП',
    category: 'suspension',
    corner: 'fr',
    params: [
      { label: 'AZ_STD', key: 'az_std_fr', unit: 'm/s²', precision: 2 },
      { label: 'Давление', key: 'pressure_fr', unit: 'psi', precision: 1 },
    ],
    relatedRules: ['wheel_imbalance_speed_resonance', 'tire_pressure_low_wheel_hop'],
  },
  {
    nodeNames: ['колесо_зл'],
    display: 'Колёсный диск ЗЛ',
    category: 'suspension',
    corner: 'rl',
    params: [
      { label: 'AZ_STD', key: 'az_std_rl', unit: 'm/s²', precision: 2 },
      { label: 'Давление', key: 'pressure_rl', unit: 'psi', precision: 1 },
    ],
    relatedRules: ['wheel_imbalance_speed_resonance', 'tire_pressure_low_wheel_hop'],
  },
  {
    nodeNames: ['колесо_зп'],
    display: 'Колёсный диск ЗП',
    category: 'suspension',
    corner: 'rr',
    params: [
      { label: 'AZ_STD', key: 'az_std_rr', unit: 'm/s²', precision: 2 },
      { label: 'Давление', key: 'pressure_rr', unit: 'psi', precision: 1 },
    ],
    relatedRules: ['wheel_imbalance_speed_resonance', 'tire_pressure_low_wheel_hop'],
  },
]

// Нормализуем имя узла: lowercase + убираем пробелы/подчёркивания/любые тире
// (включая em-dash — и en-dash –, которые Blender активно использует в именах
// типа "Колесо ПЛ — Резиновая накладка"). Без этого substring-match падает.
export function normalizeNodeName(s: string): string {
  return s.toLowerCase().replace(/[\s_\-\u2010-\u2015]+/g, '')
}

// Resolve PartSpec for a given node name (from car.glb).
// Case-insensitive substring match, нечувствительный к разделителям (пробел/_/-).
export function resolvePartByNode(nodeName: string): PartSpec | null {
  const n = normalizeNodeName(nodeName)
  for (const spec of partCatalog) {
    for (const pattern of spec.nodeNames) {
      if (n.includes(normalizeNodeName(pattern))) return spec
    }
  }
  return null
}
