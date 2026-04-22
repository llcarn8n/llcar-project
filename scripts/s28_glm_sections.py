#!/usr/bin/env python3
"""S28 — GLM-based manual-sections.json generator.

Для каждого dashboard manual.md:
  1. Извлекает `### Title` заголовки (skip мусор: mid-procedure, <10 chars)
  2. Отправляет batches в GLM для классификации в 22 layer'а
  3. Пишет manual-sections.json рядом с manual.md (resumable: skip existing)
  4. Incremental: пишет JSON сразу после каждого мануала (не ждёт batch)
  5. Parallel: 4 concurrent мануала одновременно

Usage:
    export ZAI_API_KEY=<your key>
    python scripts/s28_glm_sections.py --apply            # all 658
    python scripts/s28_glm_sections.py --pilot bmw/x5/x5_e70,audi/a4/b8_2008
    python scripts/s28_glm_sections.py --apply --force    # redo existing
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
KB_ROOT = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
PROGRESS_LOG = ROOT / ".omc" / "research" / "s28-glm-sections-progress.jsonl"

# GLM config — via env
GLM_API_URL = os.environ.get("GLM_API_URL", "https://api.z.ai/api/coding/paas/v4/chat/completions")
GLM_API_KEY = os.environ.get("ZAI_API_KEY") or os.environ.get("GLM_API_KEY") or ""
GLM_MODEL = os.environ.get("GLM_MODEL", "glm-5.1")

LAYER_META = {
    "engine": ("Двигатель", "🔧"),
    "brakes": ("Тормозная система", "🛑"),
    "suspension": ("Подвеска", "🔩"),
    "electrical": ("Электрооборудование", "⚡"),
    "transmission": ("Трансмиссия", "⚙️"),
    "hvac": ("Климат-контроль", "❄️"),
    "body": ("Кузов", "🚗"),
    "interior": ("Интерьер", "💺"),
    "lighting": ("Освещение", "💡"),
    "sensors": ("Датчики", "📡"),
    "battery": ("АКБ / ВВБ", "🔋"),
    "drivetrain": ("Привод", "⛓"),
    "chassis": ("Шасси", "🛞"),
    "infotainment": ("Мультимедиа", "📱"),
    "adas": ("ADAS", "🛡"),
    "ev": ("EV система", "🔌"),
    "safety": ("Безопасность", "🦺"),
    "steering": ("Рулевое управление", "🎯"),
    "exhaust": ("Выхлоп", "💨"),
    "fuel": ("Топливная система", "⛽"),
    "cooling": ("Охлаждение", "🌡"),
    "general": ("Общее / Введение", "📋"),
}
LAYER_IDS = list(LAYER_META.keys())

HEADING_RE = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)

# Фильтр мусорных titles
JUNK_PATTERNS = [
    re.compile(r"^\d+\s*[-:]?\s*$", re.IGNORECASE),   # "3 -", "8"
    re.compile(r"^(notes?|also|removing|installing|see|refer|figure|caution|warning|note|continued)[:.\s]*$", re.IGNORECASE),
    re.compile(r"^(removing|installing)\s*$", re.IGNORECASE),
    re.compile(r"^[A-Za-z]:\s*$"),                      # "J:", "A:"
]


def is_junk(title: str) -> bool:
    if len(title) < 10:
        # But keep "Рис. 1.5" style — they have "Рис." prefix even if short
        if not title.lower().startswith(("рис.", "fig.")):
            return True
    if title.startswith("`"):
        return True
    for p in JUNK_PATTERNS:
        if p.match(title):
            return True
    return False


GLM_PROMPT = """Ты классифицируешь заголовки из авто-мануала по системам автомобиля.

Для КАЖДОГО заголовка верни JSON-объект {"i":<номер>,"l":"<layer_id>"}.

Допустимые layer_id (ровно один из списка):
- engine, brakes, suspension, electrical, transmission, hvac, body, interior
- lighting, sensors, battery, drivetrain, chassis, infotainment, adas, ev
- safety, steering, exhaust, fuel, cooling
- general (введение, оглавление, copyright, служебные фразы, неопределённое)

Верни ТОЛЬКО JSON-массив, без markdown, без комментариев.

Пример: [{"i":1,"l":"engine"},{"i":2,"l":"brakes"}]

Заголовки:
"""


def extract_headings(manual_path: Path) -> list[dict]:
    text = manual_path.read_text(encoding="utf-8", errors="replace")
    out = []
    for i, m in enumerate(HEADING_RE.finditer(text)):
        title = m.group(2).strip()
        if is_junk(title):
            continue
        out.append({
            "idx": i,
            "level": len(m.group(1)),
            "title": title[:140],
            "offset": m.start(),
        })
    return out


def parse_glm_response(text: str) -> dict[int, str]:
    try:
        t = text.strip()
        if t.startswith("```"):
            t = re.sub(r"^```(?:json)?\n?", "", t)
            t = re.sub(r"\n?```\s*$", "", t)
        data = json.loads(t)
        return {int(item["i"]): str(item["l"]) for item in data if "i" in item and "l" in item}
    except Exception:
        return {}


def glm_classify(titles_batch: list[dict], max_retries: int = 3) -> dict[int, str]:
    if not GLM_API_KEY:
        raise RuntimeError("ZAI_API_KEY не установлен в env")

    lines = "\n".join(f'{t["idx"]}: {t["title"]}' for t in titles_batch)
    prompt = GLM_PROMPT + lines
    body = json.dumps({
        "model": GLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 16384,
        "temperature": 0.1,
    }).encode("utf-8")

    last_err = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                GLM_API_URL, data=body,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {GLM_API_KEY}"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                msg = data.get("choices", [{}])[0].get("message", {})
                content = msg.get("content") or msg.get("reasoning_content") or ""
                parsed = parse_glm_response(content)
                if parsed:
                    return parsed
                last_err = f"empty parse (got: {content[:100]})"
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last_err = str(e)
            time.sleep(5 * (2 ** attempt))
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(5 * (2 ** attempt))

    print(f"    GLM failed after {max_retries} retries: {last_err}", flush=True)
    return {}


def build_sections(headings: list[dict], classification: dict[int, str]) -> list[dict]:
    from collections import defaultdict
    grouped = defaultdict(list)
    for h in headings:
        layer = classification.get(h["idx"], "general")
        if layer not in LAYER_META:
            layer = "general"
        grouped[layer].append({
            "idx": h["idx"],
            "level": h["level"],
            "title": h["title"],
            "offset": h["offset"],
        })
    sections = []
    for layer in LAYER_IDS:
        if layer in grouped:
            title, icon = LAYER_META[layer]
            sections.append({
                "layer": layer,
                "title": title,
                "icon": icon,
                "topics": grouped[layer],
            })
    return sections


def process_manual(rel: str, batch_size: int, force: bool) -> dict:
    manual = KB_ROOT / rel / "manual.md"
    out_path = KB_ROOT / rel / "manual-sections.json"
    result = {"rel": rel, "status": None, "t_start": time.time()}

    if not manual.exists():
        result["status"] = "missing_manual"
        return result
    if out_path.exists() and not force:
        result["status"] = "skipped_existing"
        return result

    try:
        headings = extract_headings(manual)
        if len(headings) < 5:
            result["status"] = "too_few_headings"
            result["n_headings"] = len(headings)
            return result

        result["n_headings"] = len(headings)
        classification: dict[int, str] = {}
        n_batches = (len(headings) + batch_size - 1) // batch_size
        for i in range(0, len(headings), batch_size):
            batch = headings[i:i + batch_size]
            part = glm_classify(batch)
            classification.update(part)

        sections = build_sections(headings, classification)
        data = {
            "version": "1.0",
            "manual_path": f"kb/{rel}/manual.md",
            "total_headings": len(headings),
            "batches": n_batches,
            "classified_count": len(classification),
            "sections": sections,
        }
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        result["status"] = "done"
        result["n_sections"] = len(sections)
        result["classified_pct"] = round(100 * len(classification) / len(headings), 1)
    except Exception as e:
        result["status"] = f"error: {type(e).__name__}: {e}"
    result["t_end"] = time.time()
    result["dt"] = round(result["t_end"] - result["t_start"], 1)
    return result


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--pilot", type=str, default="", help="comma-separated rels (bmw/x5/x5_e70,...)")
    p.add_argument("--apply", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--batch-size", type=int, default=100)
    p.add_argument("--parallel", type=int, default=4)
    args = p.parse_args()

    if not GLM_API_KEY:
        print("ERROR: ZAI_API_KEY env var not set", file=sys.stderr)
        return 1

    if args.pilot:
        rels = [r.strip() for r in args.pilot.split(",") if r.strip()]
    else:
        rels = [str(p.relative_to(KB_ROOT).parent.as_posix()) for p in KB_ROOT.rglob("manual.md")]

    print(f"Processing {len(rels)} manuals (batch={args.batch_size}, parallel={args.parallel}, force={args.force})", flush=True)
    PROGRESS_LOG.parent.mkdir(parents=True, exist_ok=True)
    lock = Lock()
    stats = {"done": 0, "skipped_existing": 0, "too_few_headings": 0, "missing_manual": 0, "error": 0}
    t0 = time.time()

    with PROGRESS_LOG.open("a", encoding="utf-8") as log:
        with ThreadPoolExecutor(max_workers=args.parallel) as ex:
            futures = {ex.submit(process_manual, rel, args.batch_size, args.force): rel for rel in rels}
            for i, fut in enumerate(as_completed(futures), 1):
                try:
                    r = fut.result()
                except Exception as e:
                    r = {"rel": futures[fut], "status": f"fatal: {e}"}
                with lock:
                    log.write(json.dumps(r, ensure_ascii=False) + "\n")
                    log.flush()

                st = r.get("status", "error")
                bucket = "error" if st.startswith("error:") or st == "fatal" else st
                stats[bucket] = stats.get(bucket, 0) + 1

                print(
                    f"[{i}/{len(rels)}] {r['rel']:55s} {st:20s} "
                    f"({r.get('n_headings', 0):4d}h/{r.get('n_sections', 0):2d}s) "
                    f"{r.get('dt', 0):.0f}s "
                    f"[total {time.time() - t0:.0f}s]",
                    flush=True,
                )

    print(f"\nDone in {time.time() - t0:.0f}s. Stats: {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
