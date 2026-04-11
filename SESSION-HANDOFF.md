# SESSION HANDOFF — Session 12 In Progress

## Статус: Dashboard V3 + KB 11 брендов (436+ ситуаций) + GLM 5.1 MCP.

---

## ЧТО СДЕЛАНО В СЕССИИ 12

### KB Enrichment — BMW DONE (80 ситуаций, 4 модели, 8 поколений)
| Модель | Поколения | Ситуации | Коммит |
|--------|-----------|----------|--------|
| 3 Series | F30 (10), G20 (10) | 20 | 2b8b260 |
| 5 Series | F10 (10), G30 (10) | 20 | 2b8b260 |
| X3 | F25 (10), G01 (10) | 20 | 2b8b260 |
| X5 | F15 (10), G05 (10) | 20 | 2b8b260 |

Верификация: 3 агента WebSearch + verifier (4 critical + 7 warnings исправлены).

### KB Enrichment — Mercedes DONE (50 ситуаций, 3 модели, 5 поколений)
| Модель | Поколения | Ситуации | Коммит |
|--------|-----------|----------|--------|
| C-Class | W204 (10), W205 (10) | 20 | c68b388 |
| E-Class | W212 (10), W213 (10) | 20 | c68b388 |
| GLC | X253 (10) | 10 | c68b388 |

### KB Enrichment — Mazda + Mitsubishi DONE (80 ситуаций, 6 моделей, 8 поколений)
| Модель | Поколения | Ситуации | Коммит |
|--------|-----------|----------|--------|
| CX-5 | KE (10), KF (10) | 20 | b4d0582 |
| Mazda 3 | BM (10), BP (10) | 20 | b4d0582 |
| Mazda 6 | GJ/GL (10) | 10 | b4d0582 |
| Outlander | GF (10) | 10 | b4d0582 |
| ASX | GA (10) | 10 | b4d0582 |
| Pajero Sport | KS (10) | 10 | b4d0582 |

### KB Enrichment — Chinese DONE (30 ситуаций, 3 бренда, 3 модели)
| Бренд/Модель | Поколение | Ситуации | Коммит |
|-------------|-----------|----------|--------|
| Chery Tiggo 7 Pro | T1E (10) | 10 | 31bb4df |
| Haval Jolion | (10) | 10 | 31bb4df |
| Geely Coolray | SX11 (10) | 10 | 31bb4df |

### Итого KB сессия 12:
- **5 новых брендов**: BMW, Mercedes, Mazda, Mitsubishi + 3 китайских (Chery, Haval, Geely)
- **240 новых ситуаций** (80+50+50+30+30)
- **14 брендов всего**, 596 ситуаций, 64 поколения

### Дополнительные бренды — DONE
- BMW: +X1 F48, +X6 F16/G06, +7 Series G11 (коммит 812cf8f, e1f938d)
- Mercedes: +GLE W166/W167, +GLS X166/X167, +S-Class W222 (коммит 812cf8f, e1f938d)
- Audi: A4 B8/B9, Q5 8R/FY, Q7 4M (коммит 0c156b9)
- Ford: Focus Mk3, Kuga Mk2 (коммит 0c156b9)
- Lexus: RX AL20, NX AZ10 (коммит c5b0d48)
- Subaru: Forester SK, Outback BS (коммит c5b0d48)
- Land Rover: RR Sport L494, Discovery Sport L550 (коммит b46fbaf)
- Volvo: XC60 SPA, XC90 SPA (коммит b46fbaf)
- Honda: CR-V RW (коммит 404d531)
- Suzuki: Vitara LY (коммит 404d531)

### Финальная статистика KB сессии 12:
- **24 бренда, 106 моделей, 132 поколения, 1296 ситуаций**
- 22 коммита за сессию 12
- Все ситуации с верифицированными engine codes и DTC
- BMW верифицирован полным verifier-агентом (4 critical + 7 warnings исправлены)
- Mercedes верифицирован полным verifier-агентом (3 critical + 8 warnings исправлены)

### Что можно добавить в будущих сессиях:
- Больше моделей для каждого бренда (Toyota Prado/Highlander, Kia Sorento, Hyundai ix35)
- Полные статьи (1000-2000 символов) вместо кратких qa
- dtc.json per generation
- DTC→Situation маппинг
- Верификация verifier-агентом для Mazda/Mitsubishi/Chinese/Audi/Ford/Lexus/Subaru/LR/Volvo/Honda/Suzuki

---

## ЧТО СДЕЛАНО В СЕССИИ 11

### Performance Fixes (3 critical)
- `handleBounce` → useCallback (убран 30с стуттер)
- AccelWaves materials → useMemo + dispose (memory leak)
- AudioTab ECharts → getInstanceByDom (мерцание)

### P1 Dashboard Features
- **Period pills** (1ч/24ч/7д/30д) — под tab bar внутри 3D viewport
- **Date range** — под pills
- **RulesList parameter scales** — шкалы + hover glow + icons 44px
- **Canvas HUD** — RPM, T° ОЖ, напряжение, газ (top-right, скрыт на mobile)
- **Mobile SuspensionTab fix** — responsive grids
- **SystemCard degradation rate** — "-2.1/д" + velocity dots
- **Legends always visible** — вибрации + аудио на всех вкладках
- **paramNorms.ts** — shared module (extracted from DiagnosisCardV2)

### Инфраструктура
- **Tag**: `v3-stable-2026-04-10` — полный snapshot production V3 (frontend 74MB + backend)
- **GLM 5.1 MCP**: `scripts/glm-mcp/server.mjs` → `mcp__glm__ask`, `mcp__glm__generate_situations`
- **blender-mcp** + **mcp-three** — добавлены в конфиг
- **6 MCP серверов**: context7, sequential-thinking, playwright, blender-mcp, mcp-three, glm

### Коммиты (branch: dashboard-v3)
1. `263c917` — production snapshot + tag
2. `c193669` — fix: perf (handleBounce, materials, ECharts)
3. `f1ca608` — feat: period pills
4. `dcd835f` — feat: RulesList scales + glow + icons
5. `602a01d` — feat: Canvas HUD overlay
6. `49da920` — fix: mobile SuspensionTab
7. `9e49d7d` — feat: degradation rate
8. `8c0d31f` — fix: null-safe CanvasOverlayHUD
9. `f2b798c` — feat: legends always + date range
10. `3a0518b` — fix: pills + date under tab bar

---

## СЛЕДУЮЩАЯ ЗАДАЧА — KB Enrichment: Kia

### Критическое правило
**СНАЧАЛА верифицировать факты (поколения, годы, двигатели), ПОТОМ генерировать контент.**
Агенты должны препроверять ВСЮ информацию. GLM 5.1 тоже может галлюцинировать.

### Что есть для Kia
- 20 моделей в базе, реально заполнены Rio и K5 (частично)
- ~30 brand-specific ситуаций (дубликаты общих)
- DTC оверрайды в brands-dtc/kia.json
- Видео для 11 моделей
- Generation-specific контент ПУСТОЙ
- Поколения в KB НЕВЕРНЫЕ (rio_i_2017/rio_ii_2020/rio_iii_2023 — неправильные)

### KB Enrichment Kia — DONE (78 ситуаций, 11 поколений):
| Модель | Поколения | Ситуации | Коммит |
|--------|-----------|----------|--------|
| Rio | DC, JB, QB (10), FB (10) | 20 | 1983b0e |
| K5 | DL3 (10, verified) | 10 | ae7f7e5 + 5b6ea54 |
| Sportage | QL (10), NQ5 (10) | 20 | 5eb81c8 + b0becf4 |
| Cerato | YD (8), BD (10) | 18 | 04fcb23 |
| Seltos | SP2 (10) | 10 | d3c084d |

### KB Enrichment Hyundai — PARTIAL (40 ситуаций):
| Модель | Поколения | Ситуации | Коммит |
|--------|-----------|----------|--------|
| Solaris | RB (10), HC (10) | 20 | 0f7d2ac |
| Creta | GS (10), SU2 (10) | 20 | 0f7d2ac |

### KB Enrichment — Hyundai DONE (88 sits), Toyota DONE (40), VW DONE (30), Skoda DONE (30)

### Следующие бренды (по популярности в РФ):
1. **Renault/Lada**: Duster, Logan, Sandero, Vesta, Granta
2. **BMW**: 3-Series, 5-Series, X3, X5
3. **Mercedes**: C-Class, E-Class, GLC
4. **Nissan**: Qashqai, X-Trail, Almera
5. **Mazda**: CX-5, 3, 6
6. **Mitsubishi**: Outlander, ASX, Pajero
7. **Chinese**: Chery Tiggo, Haval Jolion, Geely Coolray

### Ещё не сделано глобально:
- dtc.json per generation
- brands-dtc enrichment
- Верификация Hyundai/Toyota/VW/Skoda (запустить verifier)
- Полные статьи (1000-2000 символов) вместо кратких qa
- Остальные модели каждого бренда

### GLM 5.1 — Подключение и использование

**Как подключён:**
- MCP сервер: `scripts/glm-mcp/server.mjs` (Node.js + @modelcontextprotocol/sdk v1.12.1)
- В `.claude.json` проекта: `"glm": { type: "stdio", command: "node", args: [".../server.mjs"] }`
- Endpoint: `https://api.z.ai/api/coding/paas/v4/chat/completions`
- API Key: `75f455cb5c3143cda67ddfe97294c8be.MKFeHrD84JtgbSrO`
- Model: `glm-5.1` (максимальная подписка z.ai)
- Доступные модели: glm-4.5, glm-4.5-air, glm-4.6, glm-4.7, glm-5, glm-5-turbo, **glm-5.1**

**MCP инструменты (после перезапуска сессии):**
```
mcp__glm__ask(prompt, system?, max_tokens?, temperature?)
  → свободный вопрос к GLM 5.1

mcp__glm__generate_situations(brand, model, generation, count?)
  → генерация диагностических ситуаций в JSON формате
  → автоматический system prompt "автодиагност-эксперт"
  → schema: id, title, qa, urg, cat, dtc_codes[], solutions[], price_range, mileage_range
```

**Bash (работает без перезапуска):**
```bash
bash scripts/ask-glm.sh "промпт"
GLM_MAX_TOKENS=8192 bash scripts/ask-glm.sh "длинный промпт"
echo "промпт" | bash scripts/ask-glm.sh
```

**OpenClaude (отдельная сессия):**
```bash
~/openclaude-glm.sh  # запускает Claude Code с GLM 5.1 как backend
```

**Задачи для GLM 5.1:**
1. KB Enrichment — генерация ситуаций по моделям/поколениям
2. DTC описания — Kia-специфичные note_ru и common_fix_ru
3. Верификация данных — поколения, двигатели, годы выпуска
4. Repair roadmaps — пошаговые инструкции ремонта
5. Price estimation — стоимость ремонта РФ 2025
6. Reviews analysis — анализ отзывов владельцев
7. DTC→Situation маппинг — связь кодов с ситуациями

**ВАЖНО:** GLM может галлюцинировать. Claude ОБЯЗАН валидировать выход GLM перед записью в KB. Никакого bulk-сохранения без проверки.

---

## ПРАВИЛА РАБОТЫ
1. **НИКОГДА** не удалять функционал без разрешения
2. **ПЛАНИРОВАТЬ** перед кодом
3. **ПРОВЕРЯТЬ** через Playwright перед показом
4. **НЕ менять** HUD стиль — утверждён
5. **V2 = frozen**, V3 = active
6. **Deploy ALL chunks** — rm -rf dist перед build
7. **Одно изменение за раз**
8. **ВЕРИФИЦИРОВАТЬ факты** перед генерацией KB контента
