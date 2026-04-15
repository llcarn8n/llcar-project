"""One GLM call for one topic. Resume-safe via presence of raw JSON file.

Usage:
    python scripts/s20_glm_worker.py --topic-id 1 --iter 1
    python scripts/s20_glm_worker.py --slug shock-absorbers --iter 1
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from s20_glm_client import ask, extract_content
from s20_json_repair import parse as robust_parse

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
SEED = RESEARCH / "_meta" / "seed-topics.json"
QUEUE = RESEARCH / "_meta" / "topics-queue.json"
PROGRESS = RESEARCH / "_meta" / "progress.json"
TEMPLATE_FILE = RESEARCH / "_meta" / "glm-prompt-template.md"

SYSTEM_PROMPT_GENERAL = (
    "Ты — эксперт по автомобильной диагностике подвески и NVH-анализу с 25-летним опытом. "
    "Специализация: вибростендовая диагностика, акустический анализ дефектов подвески, "
    "корреляции между сигналами акселерометра и аудио при неисправностях ходовой.\n\n"
    "Твоя задача: максимально ПОЛНО и КОНКРЕТНО раскрыть заданную тему, опираясь на ВСЕ известные "
    "тебе источники — OEM service manuals, SAE papers, ГОСТы, ISO-нормативы, форумы диагностов "
    "(drive2, drom, autoscaners, BobIsTheOilGuy, GarageJournal), тематические книги "
    "(Гинцбург «Динамика автомобиля», Гапоян «Подвеска», Reimpell «The Automotive Chassis»).\n\n"
    "ОБЯЗАТЕЛЬНО указывай citations — конкретные URL, ISBN книг, номера SAE paper, номера ГОСТ/ISO. "
    "Если не помнишь точный URL — давай название форума + topic title.\n\n"
    "ВАЖНО: возвращай ТОЛЬКО валидный JSON (без markdown-обёртки). Русский язык для содержимого полей.\n"
    "ВАЖНО: если аспект не знаешь уверенно — выпиши в unknowns[], не выдумывай.\n"
    "ВАЖНО: перед отправкой мысленно проверь что каждая `{` имеет `}` и каждая `[` имеет `]`."
)

SYSTEM_PROMPT_SCIENTIFIC = (
    "Ты — научный консультант в области автомобильного NVH и вибрационной диагностики. "
    "Опыт: кандидатская/докторская диссертация, обзоры peer-reviewed публикаций, "
    "участие в SAE/IMechE/ASME конференциях.\n\n"
    "ЖЁСТКОЕ ОГРАНИЧЕНИЕ ИСТОЧНИКОВ: для этой темы ДОПУСКАЮТСЯ ТОЛЬКО:\n"
    "  • peer-reviewed journal articles с DOI (Elsevier, Springer, Wiley, IEEE, MDPI, SAE International Journals, "
    "    Mechanical Systems and Signal Processing, Vehicle System Dynamics, Journal of Sound and Vibration, "
    "    Tribology International, IEEE Sensors Journal, Sensors (MDPI));\n"
    "  • SAE Technical Papers с номером (например SAE 2019-01-1234);\n"
    "  • монографии / книги издательств SAE, Springer, Elsevier, Wiley (ISBN обязателен);\n"
    "  • международные стандарты ISO/IEC/EN (с точным номером и годом);\n"
    "  • национальные стандарты (ГОСТ, DIN, JIS, ASTM, BS, AS/NZS) с точным номером;\n"
    "  • OEM technical bulletins/SSM/TSB (с номером и брендом);\n"
    "  • PhD/MSc dissertations (вуз + автор + год).\n\n"
    "ЗАПРЕЩЕНО: форумы (drive2/drom/reddit), блоги, YouTube, Wikipedia, анекдотические источники, "
    "аналитические статьи СМИ. Если для темы нет peer-reviewed evidence — ЧЕСТНО напиши в unknowns[] "
    "«не нашёл peer-reviewed» вместо того чтобы выдумывать.\n\n"
    "Для каждого утверждения ОБЯЗАТЕЛЬНО указывать evidence_level:\n"
    "  • A — replicated peer-reviewed (≥2 независимых публикации);\n"
    "  • B — single peer-reviewed с N≥20 выборкой;\n"
    "  • C — OEM bulletin / standard;\n"
    "  • D — dissertation / conference proceedings.\n\n"
    "ВАЖНО: возвращай ТОЛЬКО валидный JSON. Русский язык.\n"
    "ВАЖНО: проверь баланс скобок перед отправкой."
)

USER_TEMPLATE_GENERAL = """ТЕМА: {title}

SLUG: {slug}
КАТЕГОРИЯ: {category}
КОНТЕКСТ: {hint}
{origin_block}
КОМПАКТНО: не более 2 абзацев description, ≤6 symptoms, ≤5 шагов expert_sequence, ≤4 source.
Главное — завершить JSON со ВСЕМИ ключами, включая unknowns[] и meta{{}}.

Верни JSON со всеми полями (пустой массив/null если неприменимо, но ключ НЕ пропускай):

{{
  "topic_slug": "{slug}",
  "description": "2-4 абзаца",
  "symptoms": [{{"text":"","when":"","severity":"low|medium|high"}}],
  "vibration_signature": {{"axes":[],"frequency_range_hz":[null,null],"amplitude_g":[null,null],"az_std_typical":null,"total_vibration_typical":null,"dominant_freq_hz":null,"pattern":"impulse|harmonic|broadband|resonance","notes":""}},
  "audio_signature": {{"frequency_range_hz":[null,null],"character":"","impulse_or_continuous":"","speed_dependence":"","load_dependence":"","our_zone_mapping":"","notes":""}},
  "vibrostand_method": {{"applicable":false,"stand_type":"","key_metric":"","threshold_pass":null,"threshold_fail":null,"standard_ref":"","notes":""}},
  "brand_specifics": [{{"brand":"","models":[],"note":""}}],
  "expert_sequence": [{{"step":1,"action":"","check":"","tool":""}}],
  "correlations_with_other_defects": [{{"defect":"","distinguish_by":""}}],
  "sources": [{{"type":"","url_or_ref":"","relevance":""}}],
  "unknowns": [""],
  "meta": {{"confidence_self":"","training_cutoff_note":""}}
}}

Только JSON, без пояснений."""

USER_TEMPLATE_SCIENTIFIC = """НАУЧНАЯ ТЕМА: {title}

SLUG: {slug}
КАТЕГОРИЯ: {category} (требуется только peer-reviewed / стандарты / OEM bulletins)
КОНТЕКСТ: {hint}
{origin_block}
КОМПАКТНО: ≤2 абзаца description, ≤5 claims, ≤6 sources.
Все claims и sources с полем evidence_level (A/B/C/D — см. system prompt).
Главное — завершить JSON со ВСЕМИ ключами.

Верни JSON со всеми полями (пустой массив/null если неприменимо, ключ НЕ пропускай):

{{
  "topic_slug": "{slug}",
  "description": "2 абзаца: суть темы, научная значимость",
  "claims": [
    {{
      "statement": "Конкретное утверждение с числами/формулами",
      "evidence_level": "A|B|C|D",
      "citations": ["DOI/ISBN/SAE-номер/ISO-номер", "..."],
      "caveats": "ограничения применимости"
    }}
  ],
  "key_formulas": [
    {{"name":"","expression":"","variables":"","source_ref":""}}
  ],
  "datasets_and_samples": [
    {{"name":"","N":null,"description":"","availability":"public|restricted|proprietary","source_ref":""}}
  ],
  "vibrostand_relevance": {{
    "method_applies_to": "EUSAMA|BOGE|4-post|shaker|general",
    "validated_metrics": ["список метрик с evidence_level"],
    "known_limitations": "что критикуется в литературе"
  }},
  "contradictions_in_literature": [
    {{"topic":"","pov_a":"","pov_b":"","resolution_attempts":""}}
  ],
  "sources": [
    {{"type":"journal|sae|standard|book|dissertation|oem_bulletin","url_or_ref":"DOI/ISBN/ссылка","authors":"","year":null,"title":"","evidence_level":"A|B|C|D","relevance":""}}
  ],
  "unknowns": [
    "Где нужны дополнительные peer-reviewed данные"
  ],
  "meta": {{"confidence_self":"low|medium|high","training_cutoff_note":""}}
}}

Только JSON, без пояснений."""


def load_topic(topic_id: int | None, slug: str | None) -> dict:
    topics = json.loads(SEED.read_text(encoding="utf-8"))["topics"]
    if QUEUE.exists():
        queued = json.loads(QUEUE.read_text(encoding="utf-8")).get("topics", [])
        topics = topics + [t for t in queued if t.get("slug") not in {s["slug"] for s in topics}]
    for t in topics:
        if (topic_id is not None and t.get("id") == topic_id) or (slug and t.get("slug") == slug):
            return t
    raise SystemExit(f"Topic not found: id={topic_id} slug={slug}")


def update_progress(slug: str, status: str, note: str = "") -> None:
    data = {}
    if PROGRESS.exists():
        data = json.loads(PROGRESS.read_text(encoding="utf-8"))
    data.setdefault("topics", {})[slug] = {
        "status": status,
        "updated": datetime.now(timezone.utc).isoformat(),
        "note": note,
    }
    PROGRESS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def run(topic: dict, iter_n: int, force: bool = False) -> Path:
    iter_dir = RESEARCH / "raw" / f"iter{iter_n}"
    iter_dir.mkdir(parents=True, exist_ok=True)
    out_path = iter_dir / f"batch-{topic['slug']}.json"
    if out_path.exists() and not force:
        existing = json.loads(out_path.read_text(encoding="utf-8"))
        if existing.get("parsed_ok"):
            print(f"[skip] {topic['slug']} — already raw_saved")
            return out_path

    origin = ""
    if topic.get("iter_origin"):
        origin = (
            f"\nПРЕДЫСТОРИЯ: unknown из итерации {topic['iter_origin']}, "
            f"контекст: «{topic.get('unknown_text', '')}»\n"
        )
    is_scientific = topic["category"] == "scientific-evidence"
    template = USER_TEMPLATE_SCIENTIFIC if is_scientific else USER_TEMPLATE_GENERAL
    system = SYSTEM_PROMPT_SCIENTIFIC if is_scientific else SYSTEM_PROMPT_GENERAL
    user_prompt = template.format(
        title=topic["title"],
        slug=topic["slug"],
        category=topic["category"],
        hint=topic.get("prompt_hint", ""),
        origin_block=origin,
    )
    update_progress(topic["slug"], "fetching")
    start = time.time()
    try:
        resp = ask(user_prompt, system=system, max_tokens=10000, timeout=180)
    except Exception as e:
        update_progress(topic["slug"], "failed", str(e)[:200])
        raise
    content = extract_content(resp)
    parsed = robust_parse(content)
    record = {
        "topic_slug": topic["slug"],
        "topic_id": topic.get("id"),
        "iter": iter_n,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_sec": round(time.time() - start, 2),
        "usage": resp.get("usage"),
        "raw_content": content,
        "parsed_ok": parsed is not None,
        "parsed": parsed,
    }
    out_path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    status = "raw_saved" if parsed else "failed"
    update_progress(topic["slug"], status, f"parsed_ok={parsed is not None}")
    print(f"[{status}] {topic['slug']} — {record['elapsed_sec']}s, parsed={parsed is not None}")
    return out_path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--topic-id", type=int)
    p.add_argument("--slug")
    p.add_argument("--iter", type=int, default=1)
    p.add_argument("--force", action="store_true")
    args = p.parse_args()
    if args.topic_id is None and not args.slug:
        p.error("need --topic-id or --slug")
    topic = load_topic(args.topic_id, args.slug)
    run(topic, args.iter, args.force)


if __name__ == "__main__":
    main()
