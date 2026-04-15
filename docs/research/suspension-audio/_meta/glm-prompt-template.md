# GLM Prompt Template (S20 Autoresearch)

Этот шаблон — единый system+user prompt, который отправляется в `mcp__glm__ask` для каждой темы в итерации. Цель: получить parseable JSON с findings по теме + citations + unknowns.

## System prompt

```
Ты — эксперт по автомобильной диагностике подвески и NVH-анализу с 25-летним опытом.
Специализация: вибростендовая диагностика, акустический анализ дефектов подвески,
корреляции между сигналами акселерометра и аудио при неисправностях ходовой.

Твоя задача: максимально ПОЛНО и КОНКРЕТНО раскрыть заданную тему,
опираясь на ВСЕ известные тебе источники — OEM service manuals, SAE papers, ГОСТы,
ISO-нормативы, форумы диагностов (drive2, drom, autoscaners, BobIsTheOilGuy,
GarageJournal), тематические книги (Гинцбург «Динамика автомобиля», Гапоян «Подвеска»,
Reimpell «The Automotive Chassis»).

ОБЯЗАТЕЛЬНО указывай citations — конкретные URL, ISBN книг, номера SAE paper,
номера ГОСТ/ISO. Если не помнишь точный URL — давай название форума + topic title.

ВАЖНО: возвращай ТОЛЬКО валидный JSON (без markdown, без ```json```, без
пояснительного текста до/после). Используй русский язык для содержимого полей.

ВАЖНО: если какой-то аспект темы ты НЕ знаешь уверенно — выпиши его в unknowns[],
не выдумывай. Мы это проверим отдельно на следующей итерации.
```

## User prompt template

```
ТЕМА: {{topic.title}}

SLUG: {{topic.slug}}
КАТЕГОРИЯ: {{topic.category}}
КОНТЕКСТ: {{topic.prompt_hint}}

Верни JSON со ВСЕМИ следующими полями (если поле неприменимо к теме — верни пустой массив/null, но НЕ пропускай ключ):

{
  "topic_slug": "{{topic.slug}}",
  "description": "2-4 абзаца: что это, как устроено, почему ломается, как проявляется",
  "symptoms": [
    { "text": "Что водитель замечает", "when": "на какой скорости/условиях", "severity": "low|medium|high" }
  ],
  "vibration_signature": {
    "axes": ["x|y|z|xyz"],
    "frequency_range_hz": [null, null],
    "amplitude_g": [null, null],
    "az_std_typical": null,
    "total_vibration_typical": null,
    "dominant_freq_hz": null,
    "pattern": "impulse|harmonic|broadband|resonance",
    "notes": "особенности сигнатуры"
  },
  "audio_signature": {
    "frequency_range_hz": [null, null],
    "character": "knock|rattle|squeak|hum|whine|rumble|click|clunk",
    "impulse_or_continuous": "impulse|continuous|mixed",
    "speed_dependence": "none|linear|quadratic|resonant",
    "load_dependence": "none|weak|strong",
    "our_zone_mapping": "какая из 6 зон AudioTab.tsx: <100Hz/100-300/300-1k/1-3k/3-8k/>8k",
    "notes": "особенности звука"
  },
  "vibrostand_method": {
    "applicable": true,
    "stand_type": "eusama|boge|4-post|shaker|manual",
    "key_metric": "EUSAMA %|Boge amplitude|resonance freq|damping ratio",
    "threshold_pass": null,
    "threshold_fail": null,
    "standard_ref": "ГОСТ/ISO/SAE reference",
    "notes": ""
  },
  "brand_specifics": [
    { "brand": "BMW", "models": ["5 F10", "7 G11"], "note": "частые проблемы этой марки" }
  ],
  "expert_sequence": [
    { "step": 1, "action": "визуальный осмотр", "check": "что проверить", "tool": "нужный инструмент" }
  ],
  "correlations_with_other_defects": [
    { "defect": "wheel_bearing", "distinguish_by": "как отличить" }
  ],
  "sources": [
    { "type": "forum|manual|sae|gost|iso|book|video", "url_or_ref": "https://...", "relevance": "что именно в этом источнике" }
  ],
  "unknowns": [
    "Конкретная тема которую ты НЕ знаешь или не уверен — это пойдёт в следующую итерацию"
  ],
  "meta": {
    "confidence_self": "low|medium|high",
    "training_cutoff_note": "если данные могут устареть (новые модели, обновления нормативов) — упомяни"
  }
}

Никакого текста до или после JSON. Только JSON.
```

## Runtime config (подтверждено smoke-тестом 2026-04-15)

- `max_tokens: 10000` (6000 не хватало, ответ обрывался до `unknowns[]`/`meta{}`)
- `temperature: 0.3` (factual)
- **В user-prompt обязательно добавлять лимиты:** "КОМПАКТНО: максимум 2 абзаца описания, ≤6 симптомов, ≤5 шагов expert_sequence, ≤4 source. Главное — завершить JSON со ВСЕМИ ключами, включая unknowns[] и meta{}."

## Parser notes (для Claude)

- JSON парсится `json.loads(...)`; если не парсится — промпт провалился, ставим `status: failed`, retry × 2.
- `sources[].url_or_ref` может быть НЕ URL (название книги, ISBN, номер GOST). Нормально.
- **CRITICAL:** GLM регулярно генерирует плауасибельные-но-несуществующие URL форумов (drive2.ru/b/XXX, drom.ru/info/misc/XXX). Verifier обязан реально проверить каждый URL через WebFetch; если 404/timeout/off-topic — `status: unverified` для всей связки с этим source.
- GLM иногда путает ключи (встречал `"wen"` вместо `"when"` в symptoms). Парсер должен быть tolerant к опечаткам в ключах или normalize ключи.
- `unknowns[]` — входит в следующую итерацию как новые темы (после dedup).
- `confidence_self: low` + отсутствие sources — сильный сигнал что тема в значительной части hallucination, при синтезе помечать агрессивно `[unverified]`.

## Iteration 2+ specifics

Если тема родилась как `unknown` из предыдущей итерации:
- В user prompt добавить блок:
  ```
  ПРЕДЫСТОРИЯ: эта тема выделилась как unknown из исследования темы "{{origin_topic_slug}}"
  на итерации {{iter_origin}}. Контекст: "{{unknown_text_from_origin}}"
  ```
- Это помогает GLM понять контекст и не начинать с нуля.
