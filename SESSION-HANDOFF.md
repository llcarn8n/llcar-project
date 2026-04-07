# SESSION HANDOFF — 2026-04-07 (Session 3)

> Прочитай MEMORY.md + `memory/project_product_strategy.md` + `memory/reference_can_bus_li_auto.md`
> **Live:** https://llcar.ru/v2/
> **GitHub:** https://github.com/llcarn8n/llcar-project (main + 3 ветки)

---

## ЧТО СДЕЛАНО В ЭТОЙ СЕССИИ

### 1. Баг-фиксы (задеплоены на прод)
- "МАЛОВЕРОЯТНО" вместо "МАЛОВЕР." в DiagnosisCard.tsx:50
- NVH X-axis overlap: interval + rotate при >30 точках в AudioSpectrum.tsx
- z-scores overflow: truncate + short names в Diagnostics.tsx:149
- Corner decorations: left: -2px в glass.css:74

### 2. CAN-шина Li Auto (4 агента, все завершены)
- Li Auto = закрытая система, DoIP через Ethernet, ELM327 бесполезен
- Наш проект уникален — 4 ECU (7E8/7EA/7EB/7EF) работают
- Tesla DBC как референс (2897 сигналов, формулы IMU/BMS)
- Сохранено в memory: reference_can_bus_li_auto.md

### 3. Анализ приложения LLCAR v1.04 (2 агента, завершены)
- .NET MAUI (C#), 426 файлов
- OBD2 + Акселерометр 50Гц + Аудио 16кГц + GPS
- QTP сжатие (-85-90%), 6 API endpoints
- 432 PID в CSV, 55 обнаружены, 38 активных
- DBC файл EEA2.0 CAN Matrix (532KB, 10473 строк!)

### 4. Анализ серверной БД
- accel_windows: 173,854 записей
- audio_windows: 85,576
- qtp_packets: 44,663
- ecu_7e8: 25,711
- ПРОБЛЕМЫ: acceleration_state всё "cruising", road_type только "standstill"
- anomaly_baselines и anomaly_scores — НЕ СУЩЕСТВУЮТ на сервере

### 5. Git репо создан
- GitHub: https://github.com/llcarn8n/llcar-project
- Ветки: main, product-strategy, diagnostic-engine, dashboard-ui
- Initial commit: 219 файлов, 37K строк

### 6. Глубокий CustDev + Strategy анализ (8 агентов, В ПРОЦЕССЕ)
Запущены агенты на:
- Аналитический отчёт CustDev2 (1MB)
- 6 стратегических документов
- ВСЕ 36 транскриптов интервью CustDev2 (3 группы по 7 + 10)
- 7 файлов брендинга + CustDev1 Excel (14 респондентов)
- Итого: 50 респондентов

---

## КЛЮЧЕВЫЕ РЕШЕНИЯ (из CustDev анализа первого раунда)

### Позиционирование
- "Ваш сканер показывает цифры. LLCAR объясняет, что они значат."
- Конкурент — не CarScanner, а Drive2 + YouTube + "свой мастер"
- Основная ЦА — делегаторы (51%), не энтузиасты

### Дашборд — для ВЛАДЕЛЬЦЕВ-ЭНТУЗИАСТОВ (решение Петра)
НЕ для СТО. Показывать:
- Рассуждения, графики, правила
- Состояние по конкретной модели
- Сравнение с другими машинами (агрегации)
- Болячки модели, набор проверок (формулы)
- Агрегации по шумке, вибрациям, торможению
- События пользователя
- Движок зависимостей: температура от времени движения, коррекция от пробега

### Монетизация
- Free: Health Score (число) + статус систем
- Разовый отчёт: 349₽ / $5
- Подписка/год: 1990₽ / $25
- Медиана WTP: ~500₽/мес

### Диагностический движок — ПОЛНАЯ ПЕРЕРАБОТКА (решение Петра)
- Новая архитектура с матрицей корреляций accel↔audio
- Правила из базы знаний пользователей (~1000 кейсов, структурированные посты)
- ML на наших данных (173K accel + 85K audio — достаточно)

---

## СЛЕДУЮЩИЕ ШАГИ

1. **Дождаться результатов 8 агентов** глубокого анализа
2. **Свести в единый product strategy документ** на ветке product-strategy
3. **Подключить GLM + Luma** для визуализации рекомендаций
4. **Спроектировать архитектуру дашборда** для владельцев-энтузиастов
5. **Спроектировать движок зависимостей** (температура/коррекция/пробег)
6. **Создать anomaly_baselines и anomaly_scores таблицы** на сервере
7. **Исправить acceleration_state и road_type** в приложении

---

## ФАЙЛЫ ПРОЕКТА

```
llcar-project/ (GitHub: llcarn8n/llcar-project)
  llcar-dashboard/          — React SPA (Vite + Three.js + ECharts)
  dashboard_build/          — Django backend (anomaly_engine, schema)
  _archive/old-app-v104/    — Mobile app (.NET MAUI, C#)
  Custdev1/                 — CustDev1 (скрипты + Excel 14 респондентов)
  CUSTDEV2/                 — CustDev2 (36 транскриптов + отчёты)
  output финальный анализ/  — 6 стратегических документов + копии
  Бренд, логотип.../        — MVP позиционирование + маркетинг
  docs/superpowers/         — Specs и планы
```

---

## DEPLOY

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard"
rm -rf dist && npm run build
eval $(ssh-agent -s) && ssh-add /tmp/id_ed25519
/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa/
/tmp/llcar_ssh.sh "chmod -R a+r /var/www/html/django/static/spa/ && find /var/www/html/django/static/spa/ -type d -exec chmod a+x {} \;"
```
