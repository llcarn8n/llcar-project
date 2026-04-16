# Конкретные OEM-пороги pass/fail для FRF и transmissibility (закрытые данные)

**Slug:** `конкретные-oem-пороги-passfail-для-frf-и-transmissibility-закрытые-данные` · **Категория:** `suspension` · **Priority:** 2

## Описание

Конкретные числовые пороги pass/fail для FRF (Frequency Response Function) и transmissibility в подвеске являются строго проприетарными данными OEM. Производители (VAG, BMW, Toyota, Hyundai-Kia) фиксируют эти thresholds во внутренних стандартах NVH, недоступных публично. Например, BMW имеет систему ISTA-NVH с эталонными FRF-кривыми, VAG использует ODIS с интегрированными вибропрофилями, а Hyundai-Kia применяет HI-DS с заложенными допусками по transmissibility. Частично эти данные можно извлечь через reverse-engineering дилерского ПО или из leaked engineering documents.

В открытых источниках доступны лишь общие принципы: для легковых автомобилей transmissibility от ступицы к кузову на резонансе подвески (10-15 Гц) обычно не должна превышать 2.5-3.5 при критическом затухании 15-25%, а FRF-пики выше эталонных на +6 dB (фактор 2x по амплитуде) типично считаются fail-критерием. Эти значения коррелируют с ISO 2631-1 (комфорт) и SAE J670e (терминология динамики), но конкретные пороги по моделям остаются закрытыми.

## Симптомы

- **HIGH** — Отсутствие доступа к OEM-базе эталонных FRF-кривых для конкретной модели _(Диагностика на вибростенде вне дилерского центра)_
- **HIGH** — Невозможность определить pass/fail без дилерского сканера _(Сравнение измеренной transmissibility с порогом)_
- **MEDIUM** — Расхождение результатов независимого стенда и OEM-критериев _(Гарантийный спор по вибрации кузова)_
- **MEDIUM** — Отсутствие документированных допусков в TSB и service manuals _(Поиск пороговых значений в ElsaWin/EWAnet)_

## Vibration signature

- **Axes:** vertical (Z)
- **Freq range:** 0.5–80 Hz
- **Dominant freq:** 12 Hz
- **Pattern:** resonance
- **az_std typical:** None  |  **total_vibration typical:** None
- **Notes:** Transmissibility измеряется как отношение ускорения кузова к ускорению ступицы; пик на частоте резонанса подвески (10-15 Гц для передней, 12-18 Гц для задней)

## Audio signature

- **Freq range:** 20–500 Hz
- **Character:** Гул/дрон при резонансе
- **Impulse/continuous:** continuous
- **Speed dep.:** Ярко выраженная зависимость от скорости (резонанс на 60-90 км/ч)  |  **Load dep.:** Изменение резонансной частоты при загрузке
- **Our 6-zone mapping:** Зоны C-D (кузовная вибрация), зона E (подвеска)
- **Notes:** Акустический отклон от FRF-аномалий коррелирует с structural-borne noise через механизм transmissibility

## Vibrostand method

- **Applicable:** True
- **Stand type:** Многокомпонентный вибростенд с IMT/возбуждением подвески
- **Key metric:** Transmissibility (ступица→кузов) и FRF-амплитуда на резонансе
- **Thresholds:** pass <2.5 на резонансе (типичный ориентир, не OEM-специфичный) / fail >3.5 на резонансе ИЛИ отклонение +6 dB от эталона (типичный ориентир)
- **Standard:** ISO 2631-1 (общая рамка), OEM-внутренние стандарты недоступны
- **Notes:** Конкретные пороги зашиты в дилерское ПО (ISTA, ODIS, GTS, Techstream) и не публикуются

## Brand specifics

- **BMW** (F-series, G-series): ISTA-NVH содержит эталонные FRF; пороги доступны только через ISTA-P/ISTA Next с дилерской авторизацией
- **VAG (VW/Audi/Skoda)** (MQB, MLB, PQ35): ODIS интегрирован с вибропрофилями; ElsaWin/EWAnet не содержит числовых порогов, только описательные TSB
- **Toyota/Lexus** (TNGA, K-platform): Techstream + вибростендовые карты; пороги transmissibility доступны через TIS только дилерам
- **Hyundai-Kia** (K2, K5, N-platform): HI-DS содержит NVH-эталоны; корейские OEM наиболее закрыты в части NVH-данных

## Expert sequence

1. **Запросить у OEM через дилерский портал NVH-эталоны для конкретного VIN** — _Наличие доступа к ISTA/ODIS/GTS с NVH-модулем_  · tool: Дилерский сканер + онлайн-доступ к инженерной базе
2. **Измерить FRF и transmissibility на вибростенде** — _Сравнить с обобщёнными ориентирами (transmissibility <2.5 на резонансе)_  · tool: Вибростенд + мультисканер NVH (Vibrasens, CSS, Unipoint)
3. **Проконтролировать TSB и сервисные бюллетени на предмет числовых допусков** — _Наличие количественных критериев в TSB (редко)_  · tool: Alldata, Mitchell, ElsaWin, TIS
4. **При отсутствии OEM-порогов — собрать базу измерений от заведомо исправных автомобилей той же модели** — _Статистическая значимость выборки (≥5-10 автомобилей)_  · tool: Собственная база FRF-кривых + Excel/MATLAB
5. **Использовать comparative analysis с эталонным автомобилем** — _Отклонение FRF-амплитуды более +6 dB от эталона — вероятный дефект_  · tool: Двухканальный анализатор NVH + образцовый автомобиль

## Correlations with other defects

- **Износ амортизатора (потеря демпфирования)**: Увеличение transmissibility на резонансе (>3.0) при сохранении резонансной частоты
- **Износ сайлентблоков (повышенная жёсткость)**: Сдвиг резонансной частоты вверх + увеличение transmissibility на высоких частотах (>30 Гц)
- **Дефект опоры амортизатора**: Локальное увеличение FRF на частоте 40-80 Гц (резонанс опоры)

## Sources

- `[unverified]` **[Standard]** ISO 2631-1:1997 Mechanical vibration and shock — Evaluation of human exposure to whole-body vibration — Общая рамка для допустимых уровней вибрации, но не содержит OEM-порогов для подвески
- `[unverified]` **[SAE Paper]** SAE 2005-01-1504 'Application of Transfer Path Analysis to Automotive Suspension Systems' — Описывает методологию FRF/TPA для подвески без конкретных OEM-порогов
- `[unverified]` **[Forum]** drive2.ru — тема 'Вибростендовая диагностика подвески', multiple threads — Практический опыт диагностов по интерпретации FRF без доступа к OEM-базам
- `[unverified]` **[Book]** Reimpell, Stoll, Betzler 'The Automotive Chassis: Engineering Principles' ISBN 978-0768006755 — Глава 7 — NVH подвески, общие принципы transmissibility без OEM-порогов

## Unknowns (для следующей итерации)

- Конкретные числовые пороги transmissibility для VAG MQB (публично недоступны, встроены в ODIS)
- Пороги FRF-амплитуды для BMW G-серии (требуют ISTA-NVH дилерского уровня)
- Допуски по transmissibility для Hyundai-Kia N-platform (HI-DS proprietary)
- Методика извлечения эталонных FRF из дилерского ПО (reverse engineering деталей неизвестен)
- Существование leaked engineering specifications с OEM-порогами (вероятно существуют, но не索引ированы публично)

## Meta

- **confidence_self:** medium — общие принципы FRF/transmissibility хорошо известны, но конкретные OEM-пороги действительно проприетарны и недоступны для верификации
- **training_cutoff_note:** Нет доступа к дилерским системам (ISTA, ODIS, GTS) для подтверждения текущих порогов; информация основана на открытых источниках и практическом опыте до 2024
- **synthesized:** 2026-04-15T20:41:20.318374+00:00
