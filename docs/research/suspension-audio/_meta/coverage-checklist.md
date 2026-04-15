# Coverage Checklist (S20 Suspension + Audio Expertise)

Финальная экспертиза считается полной когда **не менее 90% утверждений ниже помечены как `закрыто`**.
Формат: `- [ ]` / `- [x]` где `x` = подтверждено в конкретном MD-файле (с указанием файла).

## Suspension — detection & failure modes

- [ ] Амортизатор: диапазон частот вибрации на стенде при износе указан с нижней/верхней границей → `topics/suspension/shock-absorbers.md`
- [ ] Амортизатор: EUSAMA % порог pass/fail указан по ГОСТ Р 51709 → `topics/suspension/shock-absorbers.md` или `topics/vibrostand/pass-criteria-norms-russia-eu.md`
- [ ] Опорный подшипник стойки: звуковая сигнатура (частота+характер) при повороте руля → `topics/suspension/struts-mcpherson.md`
- [ ] Шаровая опора: 2+ метода проверки + нормативы люфта → `topics/suspension/ball-joints.md`
- [ ] Рулевой наконечник: как отличить от шаровой по звуку и вибрации → `topics/suspension/tie-rods-ends.md` + `topics/expert-practice/common-diagnostician-mistakes.md`
- [ ] Стойка стабилизатора: типичная частота стука 100-300 Hz подтверждена ≥2 источниками → `topics/suspension/stabilizer-bars-links.md`
- [ ] Сайлентблок: визуальные признаки износа + spectrum pattern при качании → `topics/suspension/rubber-bushings.md`
- [ ] Пружина: признаки просадки (мм) + характерный звук при пробое → `topics/suspension/coil-springs.md`
- [ ] Многорычажка: 3+ типичных дефекта на BMW/Audi указаны → `topics/suspension/multilink-rear.md`
- [ ] Пневмоподвеска: признаки утечки + fault codes 3+ брендов → `topics/suspension/air-suspension.md`
- [ ] MagneRide/AMR: принцип работы + признаки отказа + fault codes → `topics/suspension/adaptive-damping-mrc-amr.md`

## Audio correlations

- [ ] Таблица "дефект → частотный диапазон → характер" покрывает 8+ дефектов → `topics/audio-correlations/frequency-ranges-per-defect.md`
- [ ] Разница между impulse/harmonic/broadband на spectrogram показана с примерами → `topics/audio-correlations/harmonic-vs-broadband.md`
- [ ] Методика speed-sweep и идентификация wheel-order (1x/2x/3x) указана → `topics/audio-correlations/speed-dependence.md`
- [ ] Load dependence: тест загруженная/пустая как инструмент диагноста → `topics/audio-correlations/load-dependence.md`
- [ ] Mapping на 6 аудио-зон AudioTab.tsx (`<100/100-300/300-1k/1-3k/3-8k/>8k`) выполнен для каждой темы suspension → `topics/audio-correlations/*.md` + `topics/expert-practice/cross-check-correlation-engine.md`
- [ ] Road noise vs suspension noise: метод отделения → `topics/audio-correlations/road-surface-artifacts.md`
- [ ] Ограничения смартфон-микрофона (dynamic range, SNR, частотный roll-off) → `topics/audio-correlations/mic-placement-cabin-vs-arch.md`

## Vibrostand methods

- [ ] EUSAMA vs Boge: разница методов + когда применяется каждый → `topics/vibrostand/resonance-method.md`
- [ ] ГОСТ Р 51709-2001 — точные численные нормативы для вибростенда (% адгезии, амплитуда) → `topics/vibrostand/pass-criteria-norms-russia-eu.md`
- [ ] Разница норм РФ / ЕС / US → `topics/vibrostand/pass-criteria-norms-russia-eu.md`
- [ ] ISO 5347 / 16063 — стандарты калибровки акселерометра → `topics/vibrostand/accelerometer-mounting-standards.md`
- [ ] 4-post hydraulic rig: примеры OEM применения + точки измерения → `topics/vibrostand/4-post-hydraulic.md`
- [ ] Eigenfrequency подвески: типичные значения 1-3 Hz (подрессоренная масса), 8-15 Hz (неподрессоренная) → `topics/vibrostand/shaker-eigenfrequency.md`

## Brand-specific

- [ ] BMW F10/G11: 3+ типовых проблема подвески + OEM part numbers или артикулы расходки → `topics/brands/bmw-mb-audi.md`
- [ ] Mercedes Airmatic W220/W221/W222: типовые отказы → `topics/brands/bmw-mb-audi.md`
- [ ] Toyota Camry XV70: стуки передних стоек — источник и типичный дефект → `topics/brands/toyota-honda-mazda.md`
- [ ] Hyundai/Kia Solaris/Rio: стойки стабилизатора как самая частая расходка → `topics/brands/hyundai-kia-genesis.md`
- [ ] Lada Vesta/Granta: типовые дефекты и артикулы OEM vs КАЯБА/SS20 → `topics/brands/russian-lada-uaz-moskvich.md`
- [ ] Chery Tiggo / Geely Coolray: сайлентблоки, ресурс, расходка → `topics/brands/chinese-byd-geely-chery-changan.md`

## Expert practice

- [ ] Стандартная 6-шаговая последовательность диагностики подвески → `topics/expert-practice/diagnostic-sequence-standard.md`
- [ ] CUSTDEV: ≥3 цитаты реальных диагностов с разбором практики → `topics/expert-practice/custdev-insights.md`
- [ ] 5 корреляций `correlation_engine.py` разобраны: подтверждены / нуждаются в корректировке / новые → `topics/expert-practice/cross-check-correlation-engine.md`
- [ ] 3 suspension rules из `threshold_rules.json` разобраны против source норм → `topics/expert-practice/cross-check-threshold-rules.md`
- [ ] Typical mistakes: 5+ пар "путают X с Y" с признаками различения → `topics/expert-practice/common-diagnostician-mistakes.md`
- [ ] Polevye priemy без оборудования: ≥5 приёмов с описанием техники → `topics/expert-practice/field-tricks-no-equipment.md`
- [ ] ≥5 новых кандидатов правил для threshold_rules.json emerge из findings → `topics/expert-practice/new-rules-emerging.md`
- [ ] Edge cases: ≥5 сценариев (зима/перегрев/коррозия/модификации) разобраны → `topics/expert-practice/edge-cases.md`

## Meta / quality

- [ ] Каждый MD-файл имеет все 10 обязательных секций template-а (description/symptoms/vibration_signature/audio_signature/vibrostand_method/brand_specifics/expert_sequence/sources/unknowns/meta)
- [ ] Каждый factoid помечен `[verified]` или `[unverified]` или `[contradicted]`
- [ ] `findings-index.json` содержит запись по каждому MD-файлу с его статистикой
- [ ] `iterations.log` содержит timestamp/counts для каждой итерации
- [ ] Доля `verified` findings не менее 60% от общего числа
- [ ] `source-cache.json` содержит ≥ N_sources уникальных URL checks
- [ ] `open-questions.md` существует и перечисляет что осталось unverified/unknown после стопа
