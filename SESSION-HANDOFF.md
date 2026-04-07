# SESSION HANDOFF — 2026-04-07 (Session 3 END)

> Прочитай MEMORY.md + `memory/project_diagnostic_engine_v2.md`
> **GitHub:** https://github.com/llcarn8n/llcar-project
> **Live:** https://llcar.ru/v2/
> **Текущая ветка:** diagnostic-engine

---

## СЛЕДУЮЩИЙ ШАГ: Переработка диагностического движка

Запустить через superpowers (brainstorming → writing-plans → executing-plans):

### Задача 1: Анализ 764 ситуаций → выработка правил
- Файл: `common files all models/situations-universal.json` (3.5MB)
- Извлечь из каждой ситуации: симптомы, причины, решения, urgency, canDrive
- Преобразовать в машиночитаемые правила для движка
- Связать с 36K DTC кодами (сейчас связано только 6/764)

### Задача 2: Правила из YouTube (22 кейса)
- Файл: `docs/research-results/08-youtube-synthesis.md`
- LTFT/STFT таблица интерпретации (10 уровней)
- 8 бесплатных диагностических тестов
- Поправки: Евро-2, ГБО, зима, платформа

### Задача 3: Корреляции accel↔audio
- 173K accel_windows + 85K audio_windows в БД
- Строить: вибрация×скорость, звук×обороты, кросс-корреляции
- Уникальное преимущество — нет у конкурентов

### Задача 4: Создать таблицы на сервере
- anomaly_baselines (Welford)
- anomaly_scores (TimescaleDB)

### Задача 5: Починить классификаторы
- acceleration_state (всё "cruising")
- road_type (всё "standstill")

---

## ЧТО СДЕЛАНО В СЕССИИ 3

### Баг-фиксы (задеплоены):
- "МАЛОВЕРОЯТНО", NVH overlap, z-scores overflow, corner decorations

### CAN-шина Li Auto (4 агента):
- Закрытая система DoIP, наш проект уникален (4 ECU)

### Анализ приложения v1.04:
- .NET MAUI, 426 файлов, OBD+Акселерометр+Аудио+GPS

### CustDev + Strategy анализ (16 файлов на диске):
- 50 респондентов, 2256 YouTube комментариев, 27K+ точек данных
- Маркетолог + Продажник + Продуктолог + CEO модератор
- Финальные решения: 13-FINAL-DECISIONS.md

### Диагностическая база (3 файла):
- 36K DTC, 764 ситуации, 7436 модификаций, 298 отзывных

### Git:
- product-strategy: 13 файлов анализа + 3 диагн.
- diagnostic-engine: 3 файла диагностической базы

---

## DEPLOY

```bash
cd "C:/Users/Петр/Downloads/Маркетинговые материалы/llcar-dashboard"
rm -rf dist && npm run build
eval $(ssh-agent -s) && ssh-add /tmp/id_ed25519
/tmp/llcar_scp.sh -r dist/* webadmin@185.55.57.145:/var/www/html/django/static/spa/
/tmp/llcar_ssh.sh "chmod -R a+r /var/www/html/django/static/spa/ && find /var/www/html/django/static/spa/ -type d -exec chmod a+x {} \;"
```
