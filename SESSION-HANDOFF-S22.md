# S22 HANDOFF — Технический справочник правил LLCAR

## Задача
Написать `docs/RULES-REFERENCE.md` — технический документ для инженера-диагноста.

По каждому правилу:
- Что детектирует (суть)
- Физика явления
- Формулы с единицами
- Пороги и откуда они (DOI источники)
- Какие данные нужны (tier, min_speed, время baseline)
- Как реализовано в коде (файл:строка)
- Теоретический контекст (Ляпунов, Zener, Half-car, ISO 2631)

## Порядок
1. Подвеска и аудио (самые актуальные) — ~25 правил
2. Остальные по остаточному принципу

## Формат карточки правила (утвердить с пользователем после первых 5-6)

## Текущее состояние правил
- **115 production** + **3 shadow** = **118 правил** (threshold_rules.json + shadow_rules.json)
- **8 Python complex rules** (complex_rules.py)
- **7 корреляций** (correlation_engine.py)

## Источники для синтеза

### S20 Research (docs/research/suspension-audio/)
- `final/REPORT.md` — 1491 строк, 14 частей, 306 verified источников
- `final/production-rules-crosscheck.md` — verdict по 42 existing rules
- `final/custdev-snippets.json` — 201 цитата диагностов
- `raw/iter1/` — 50+ topic batch JSON (shock absorbers, ball joints, bushings, bearings, frequencies, brands, EUSAMA, ML, road PSD и т.д.)

### S21 Research (C:\Users\Петр\Downloads\suspension-audio\)
- `research-zener-halfcar.md` — Zener model демпфера + Half-car 4DoF (14 DOI)
- `research-vmd-vit.md` — VMD алгоритм + Vision Transformer (25 DOI)
- `research-iso2631-lyapunov.md` — ISO 2631 пороги + Ляпунов EDR + λ_max (24 DOI)
- `research-ml-rul.md` — ML classification + RUL prediction (18 DOI)
- PDF "Диагностика на вибростендах" — 23 стр, 149 ссылок
- `pdf_text.txt` — извлечённый текст PDF

### Production код
- `dashboard_build/diagnostic/rules/threshold_rules.json` — 115 правил
- `dashboard_build/diagnostic/rules/shadow_rules.json` — 3 shadow правила
- `dashboard_build/diagnostic/rules/complex_rules.py` — 8 Python правил
- `dashboard_build/diagnostic/feature_extractor.py` — 23+ фичи
- `dashboard_build/diagnostic/correlation_engine.py` — 7 корреляций
- `dashboard_build/diagnostic/normalizer.py` — NormalizedPacket
- `dashboard_build/diagnostic/rule_engine.py` — confidence scoring

## S21 что было сделано (для контекста)
- 10 коммитов на ветке s21-suspension-rules-production → merged в dashboard-v3
- 118 правил (было 103): +15 из S21 plan + 6 из research
- Shadow mode инфраструктура
- SQL расширен: 10 harmonic FFT + 10 percussive peaks + 12 shape коэфф.
- tire_diameter параметризован через VehicleProfile
- 2 новые корреляции: audio_accel_source + road_roughness_psd
- Site fix: @never_cache + gzip через Django proxy

## Feedback пользователя
- Документ должен быть строго по делу: правило → всё что с ним связано
- Без вводных "вспомнить что делали" — сразу к сути
- Подвеска и аудио ПЕРВЫМИ, остальное по остаточному
- Формат: раунд 1 (5-6 правил) → ревью → раунд 2 → ... → финал
