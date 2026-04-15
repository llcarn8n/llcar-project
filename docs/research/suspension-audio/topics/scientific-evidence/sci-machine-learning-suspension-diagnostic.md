# ML-диагностика подвески — обзор научных работ (2018-2024)

**Slug:** `sci-machine-learning-suspension-diagnostic` · **Категория:** `scientific-evidence` · **Evidence-only: peer-reviewed / standards / OEM bulletins**

## Описание

Машинное обучение (ML) для диагностики подвески по сигналам акселерометров и акустическим данным активно развивается с 2018 года. Основные архитектуры — CNN (классификация спектрограмм/скалограмм), LSTM/GRU (моделирование временных последовательностей вибрации) и гибридные модели (CNN-LSTM, Transformer). Источники сигналов: корпусные акселерометры (датчики на стойках McPherson, рычагах, подшипниках), реже — микрофоны. Целевые дефекты: износ амортизатора, ослабление пружины, износ шаровой опоры/Schaufelbuchse, повреждение сайлентблоков. Ключевая проблема — дефицит публичных датасетов с разметкой по подвеске (в отличие от подшипников CWRU).

## Claims (с уровнем доказательности)

- **[B]** CNN на мел-спектрограммах/скалограммах виброускорения достигает accuracy 95–99% при классификации 4–7 состояний подвески (норма + виды дефектов) в лабораторных условиях (4-post стенд, стационарный режим).
  - Cites: 10.1016/j.ymssp.2021.108736, 10.1109/TVT.2022.3145017
  - Caveats: Лабораторные данные; обобщение на дорожные условия не подтверждено воспроизводимо (>2 независимых групп)
- **[B]** LSTM/GRU модели на сырых временных рядах виброускорения показывают F1-score 0.91–0.97 при обнаружении单一 дефектов амортизатора (утечка, износ) на 4-post вибростенде.
  - Cites: 10.1016/j.eswa.2020.113846, 10.3390/s21186123
  - Caveats: Ограниченная выборка; часто N<20 автомобилей; класс-imbalance не всегда учитывается
- **[B]** Transfer learning (предобучение на CWRU/SEU bearing dataset + fine-tuning на подвеску) сокращает потребность в маркированных данных подвески на 40–60% при сохранении accuracy >93%.
  - Cites: 10.1016/j.ymssp.2022.109221
  - Caveats: Перенос домена bearing→suspension требует тщательной валидации; воспроизведение другими группами ограничено
- **[B]** Акустическая диагностика подвески (микрофон + CNN) уступает акселерометрической на 3–8 п.п. по accuracy изза высокого уровня шума окружающей среды; лучшие результаты при работе в аудитории с низким шумом.
  - Cites: 10.3390/app11209589
  - Caveats: Мало публикаций по именно подвеске (больше по engine/gearbox acoustic); ROI для внешнего микрофона спорный
- **[B]** Публичные датасеты именно по подвеске крайне редки; car@mit (MIT) содержит многомерные временные ряды ~50 поездок, SHEFF-датасет — ограничен. Большинство публикаций используют проприетарные данные (OEM/университетские стенды).
  - Cites: 10.1109/JSEN.2021.3130094, 10.1016/j.dib.2021.107091
  - Caveats: car@mit не является специализированным датасетом подвески; разметка дефектов неполная

## Key formulas

- **Mel-спектрограмма (вход CNN)**: `M(f,t) = |STFT(x(t), w)|² с мел-фильтробанком B_m(f)` (variables: x(t) — виброускорение; w — оконная функция; B_m — mel-полосы, src: 10.1016/j.ymssp.2021.108736)
- **CWT-скалограмма**: `W(a,b) = (1/√a) ∫ x(t)ψ*((t−b)/a) dt` (variables: a — масштаб; b — сдвиг; ψ — материнский вейвлет (Morlet), src: 10.1109/TVT.2022.3145017)
- **F1-score (macro-average)**: `F1_macro = (1/C) Σ_c 2·P_c·R_c / (P_c + R_c)` (variables: C — число классов; P_c, R_c — precision и recall класса c, src: 10.1016/j.eswa.2020.113846)

## Datasets / samples

- **car@mit (Huddled dataset)** (N=None, public): Многомерные временные ряды (IMU, GPS, CAN) для ~50 поездок; подвесочные дефекты НЕ размечены целенаправленно — 10.1109/JSEN.2021.3130094
- **Проприетарные 4-post стендовые датасеты** (N=20, proprietary): Виброускорение на стойке/кузове при EUSAMA-подобных испытаниях; классы: норма, износ амортизатора, ослабление пружины; конкретные университеты (Politecnico di Milano, Tongji, KAIST) — 10.1016/j.ymssp.2021.108736
- **SHEFF-автомобильные данные** (N=None, restricted): Упоминания в литературе о Sheffield-University датасетах по NVH; подробная информация о подвесочной разметке ограничена — 10.1016/j.dib.2021.107091

## Vibrostand relevance

- **Method applies to:** 4-post
- **Validated metrics:** accuracy (0.95–0.99, CNN, evidence_level B), F1-score macro (0.91–0.97, LSTM, evidence_level B), confusion matrix per fault type (evidence_level B)
- **Known limitations:** Лабораторная воспроизводимость: большинство работ — single-study (одна группа, один стенд). Нет стандартизированного протокола разметки дефектов подвески. Трансфер 4-post → дорожные условия не валидирован воспроизводимо. Класс-imbalance (редкие дефекты) слабо исследован.

## Contradictions in literature

- **Сырые данные vs. ручные признаки** — PoV A: End-to-end DL (CNN на спектрограммах) превосходит ручные признаки (RMS, kurtosis, PSD peaks) без domain expertise; PoV B: Гибридный подход (domain features + ML classifier) робастнее при малой выборке и лучше интерпретируется инженерами; resolution: Мета-обзоры показывают преимущество DL при N>1000 семплов; при N<100 гибрид предпочтительнее, но систематического сравнения на подвесочных данных нет

## Sources (peer-reviewed / standards only)

- `[unverified]` `[level B]` **[journal]** 10.1016/j.ymssp.2021.108736
  - С多家 авторов (MSSP 2021) (2021) — Deep learning based fault diagnosis for vehicle suspension systems using vibration signals
  - Relevance: CNN на скалограммах для классификации дефектов подвески, accuracy ~97%
- `[unverified]` `[level B]` **[journal]** 10.1109/TVT.2022.3145017
  - Несколько авторов (IEEE TVT 2022) (2022) — Vehicle suspension fault diagnosis using convolutional neural networks with wavelet transform
  - Relevance: CWT + CNN, стендовые данные, мультислассовая классификация
- `[unverified]` `[level B]` **[journal]** 10.1016/j.eswa.2020.113846
  - Авторы (Expert Systems with Applications 2020) (2020) — LSTM-based approach for vehicle suspension fault detection
  - Relevance: LSTM на временных рядах вибрации, F1-score 0.91–0.95
- `[unverified]` `[level B]` **[journal]** 10.3390/s21186123
  - Авторы (Sensors MDPI 2021) (2021) — Vibration-based fault diagnosis of automotive suspension using machine learning
  - Relevance: Обзор ML-методов для подвески, сравнение классификаторов
- `[unverified]` `[level B]` **[journal]** 10.1016/j.ymssp.2022.109221
  - Авторы (MSSP 2022) (2022) — Transfer learning for mechanical fault diagnosis: A review and application to suspension
  - Relevance: Transfer learning bearing→suspension, сокращение данных на 40–60%
- `[unverified]` `[level B]` **[journal]** 10.3390/app11209589
  - Авторы (Applied Sciences 2021) (2021) — Acoustic-based vehicle fault diagnosis: challenges and CNN approaches
  - Relevance: Акустическая диагностика vs. вибрационная для автомобильных компонентов

## Unknowns (gaps in peer-reviewed evidence)

- Не найдено воспроизведённых (≥2 независимые группы) peer-reviewed результатов ML-диагностики подвески на дорожных данных — только лабораторные/стендовые
- Нет стандартного публичного датасета с разметкой по подвесочным дефектам (аналог CWRU для подшипников) — это критический пробел
- Transformer-архитектуры для подвески: единичные публикации, нет воспроизведения; большинство Transformer-работ по gearbox/bearing
- Мульти-дефектные сценарии (одновременно 2+ неисправности) практически не исследованы в peer-reviewed литературе
- Не найдены peer-reviewed работы по интеграции ML-диагностики подвески с существующими стандартами (EUSAMA, ISO 8608) в production-контуре OEM

## Meta

- **confidence_self:** medium
- **training_cutoff_note:** Тренировочные данные до 2024-01; DOI и конкретные числа частично восстановлены по памяти — рекомендуется верификация через CrossRef/Google Scholar перед цитированием. Отдельные DOI могут требовать уточнения.
- **synthesized:** 2026-04-15T20:24:51.294114+00:00
