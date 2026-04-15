#!/usr/bin/env python3
"""S17 ETL — Universal-Plus-Targeted situations expansion."""
from __future__ import annotations
import argparse
import io
import json
import re
import sys
import shutil
from pathlib import Path
from collections import defaultdict

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

DTC_RE = re.compile(r"^(?:[PBCU][0-9A-Fa-f]{4,6}|[0-9A-Fa-f]{4,8})$")
CJK_RE = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")
GEN_CODE_RE = re.compile(r"\b([A-Z]{1,3}\d{1,3}[A-Z]?)\b")
PAREN_CODE_RE = re.compile(r"\(([^)]{2,20})\)")
YEAR_RE = re.compile(r"(19\d{2}|20\d{2})")

CAT_ENUM = {"engine", "transmission", "chassis", "electrical", "cooling",
            "brakes", "ac", "fuel", "steering", "body"}

CAT_MAP = {
    "engine": "engine", "двигатель": "engine", "мотор": "engine", "exhaust": "engine",
    "transmission": "transmission", "трансмиссия": "transmission", "коробка": "transmission",
    "drivetrain": "transmission",
    "chassis": "chassis", "шасси": "chassis", "подвеска": "chassis", "suspension": "chassis",
    "tires": "chassis",
    "electrical": "electrical", "электрика": "electrical", "электро": "electrical",
    "ev": "electrical", "battery": "electrical", "hv": "electrical",
    "lighting": "electrical", "infotainment": "electrical", "safety": "electrical",
    "cooling": "cooling", "охлаждение": "cooling",
    "brakes": "brakes", "тормоза": "brakes",
    "ac": "ac", "климат": "ac", "hvac": "ac",
    "fuel": "fuel", "топливо": "fuel", "топливная": "fuel",
    "steering": "steering", "рулевое": "steering", "рулевая": "steering",
    "body": "body", "кузов": "body", "экстерьер": "body",
    "audio": "body", "general": "engine",
}

URG_MAP = {0: 2, 1: 3, 2: 4, 3: 5, 4: 5, 5: 5}


def load_brand_map(path: Path) -> dict:
    if not path.is_file():
        return {"brands": {}, "models": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"brands": {}, "models": {}}


def resolve_brand_dst(b: str, m: dict) -> str:
    return m.get("brands", {}).get(b, b)


def resolve_model_dst(b: str, mdl: str, m: dict) -> str:
    key = f"{b}/{mdl}"
    mapped = m.get("models", {}).get(key)
    if mapped:
        return mapped.split("/", 1)[-1]
    return mdl


def extract_gen_codes(name: str) -> set[str]:
    codes = set()
    for p in PAREN_CODE_RE.findall(name):
        for tok in re.findall(r"[A-Za-z]+\d+[A-Za-z]?", p):
            codes.add(tok.lower())
    for m in GEN_CODE_RE.findall(name):
        codes.add(m.lower())
    return codes


def load_src_situations(model_dir: Path, _gen_ids) -> list[dict]:
    parent = model_dir / "situations.json"
    best = []
    if parent.is_file():
        try:
            pd = json.loads(parent.read_text(encoding="utf-8"))
            if isinstance(pd, list):
                best = pd
        except Exception:
            pass
    for sd in model_dir.iterdir() if model_dir.is_dir() else []:
        if not sd.is_dir() or sd.name in ("images", "pdfs"):
            continue
        sdf = sd / "situations.json"
        if sdf.is_file():
            try:
                sdd = json.loads(sdf.read_text(encoding="utf-8"))
                if isinstance(sdd, list) and len(sdd) > len(best):
                    best = sdd
            except Exception:
                pass
    seen = set()
    out = []
    for s in best:
        if not isinstance(s, dict):
            continue
        sid = s.get("id")
        if sid in seen:
            continue
        seen.add(sid)
        out.append(s)
    return out


def load_chunk_gen_map(model_dir: Path) -> dict[str, str]:
    p = model_dir / "chunk_generation_map.json"
    if not p.is_file():
        return {}
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(d, dict):
            out = {}
            for k, v in d.items():
                if isinstance(v, dict):
                    out[k] = v.get("generation_id", "")
                elif isinstance(v, str):
                    out[k] = v
            return out
    except Exception:
        pass
    return {}


def norm_cat(raw) -> str:
    if not raw:
        return "engine"
    k = str(raw).strip().lower()
    mapped = CAT_MAP.get(k)
    if mapped in CAT_ENUM:
        return mapped
    first = k.split()[0] if k else ""
    return CAT_MAP.get(first, "engine") if CAT_MAP.get(first) in CAT_ENUM else "engine"


def norm_urg(raw) -> int:
    try:
        return URG_MAP.get(int(raw), 3)
    except (TypeError, ValueError):
        return 3


def synthesize_solutions(s: dict) -> list[str]:
    ex = s.get("solutions")
    if isinstance(ex, list) and ex:
        c = [x for x in ex if isinstance(x, str) and len(x.strip()) >= 5]
        if c:
            return c[:8]
    sols = []
    facts = s.get("facts_ru") or []
    if isinstance(facts, list):
        sols += [f for f in facts if isinstance(f, str) and len(f.strip()) >= 5][:3]
    cm = s.get("commonMistakes") or []
    if isinstance(cm, list):
        sols += [c for c in cm if isinstance(c, str) and len(c.strip()) >= 5][:2]
    if not sols:
        sols = ["Обратиться к официальному дилеру для диагностики",
                "Сверить с руководством по эксплуатации автомобиля"]
    return sols[:8]


def clean_dtc_codes(raw) -> list[str]:
    if not isinstance(raw, list):
        return []
    out = []
    seen = set()
    for c in raw:
        if not isinstance(c, str):
            continue
        c = c.strip().upper()
        if c and DTC_RE.match(c) and c not in seen:
            out.append(c)
            seen.add(c)
    return out


def transform_situation(src: dict, new_id: str | None = None) -> dict | None:
    qa = src.get("qa") or src.get("quickAnswer") or ""
    if not isinstance(qa, str) or len(qa.strip()) < 20:
        return None
    if CJK_RE.search(qa) or CJK_RE.search(src.get("title", "") or ""):
        return None
    title = src.get("title") or ""
    if not title or not isinstance(title, str):
        return None
    if len(qa) > 4800:
        qa = qa[:4800]
    if len(qa) < 50:
        qa = (qa + " " + title).strip()
    if len(qa) < 50:
        return None
    return {
        "id": new_id or src.get("id") or "",
        "title": title[:200],
        "qa": qa,
        "urg": norm_urg(src.get("urg", src.get("urgency", 2))),
        "cat": norm_cat(src.get("cat") or src.get("category")),
        "dtc_codes": clean_dtc_codes(src.get("dtc_codes") or src.get("dtc") or []),
        "solutions": synthesize_solutions(src),
        "content_type": src.get("content_type", "diagnostic"),
    }


def assign_gens(sit: dict, src_raw: dict, gens: list[dict], chunk_map: dict) -> list[str]:
    text = f"{sit['title']} {sit['qa']}".lower()
    matched: set[str] = set()
    for g in gens:
        for code in g.get("_codes", set()):
            if code and code in text:
                matched.add(g["_dir"])
                break
    if matched:
        return list(matched)
    source = src_raw.get("source") or ""
    if isinstance(source, str):
        chunk = source.split(":")[-1] if ":" in source else source
        gen_id = chunk_map.get(chunk)
        if gen_id:
            for g in gens:
                if g.get("id") == gen_id:
                    return [g["_dir"]]
    years = [int(y) for y in YEAR_RE.findall(text)]
    if years:
        for y in years:
            hits = [g for g in gens if g.get("ys") and g.get("ye") and g["ys"] <= y <= g["ye"]]
            if len(hits) == 1:
                return [hits[0]["_dir"]]
    return [g["_dir"] for g in gens]


def find_dst_gen_dirs(dst_model_dir: Path, gens: list[dict], create_gens: bool = False) -> dict[str, Path]:
    """3-pass priority: code → exact → year overlap → skip/create."""
    if not dst_model_dir.is_dir():
        if create_gens:
            return {g["_dir"]: dst_model_dir / g["_dir"] for g in gens}
        return {}
    existing_names = [d.name for d in dst_model_dir.iterdir() if d.is_dir()]
    out: dict[str, Path] = {}
    used: set[str] = set()

    # Pass 1 — codes
    for g in gens:
        name = g["_dir"]
        codes = g.get("_codes", set())
        if not codes:
            continue
        for ex in existing_names:
            if ex in used:
                continue
            for code in codes:
                if code and code in ex.lower():
                    out[name] = dst_model_dir / ex
                    used.add(ex)
                    break
            if name in out:
                break

    # Pass 2 — exact
    for g in gens:
        name = g["_dir"]
        if name in out:
            continue
        if name in existing_names and name not in used:
            out[name] = dst_model_dir / name
            used.add(name)

    # Pass 3 — year overlap
    for g in gens:
        name = g["_dir"]
        if name in out:
            continue
        ys, ye = g.get("ys"), g.get("ye")
        if not (ys and ye):
            continue
        for ex in existing_names:
            if ex in used:
                continue
            years = [int(y) for y in YEAR_RE.findall(ex)]
            if any(ys <= y <= ye for y in years):
                out[name] = dst_model_dir / ex
                used.add(ex)
                break

    # Pass 4 — fallback
    if create_gens:
        for g in gens:
            name = g["_dir"]
            if name not in out:
                out[name] = dst_model_dir / name
    return out


def load_info_gens(model_dir: Path) -> list[dict]:
    p = model_dir / "info.json"
    if not p.is_file():
        return []
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return []
    gens_raw = d.get("generations") or []
    out = []
    for g in gens_raw:
        if not isinstance(g, dict):
            continue
        name = g.get("name") or ""
        codes = extract_gen_codes(name)
        ys = g.get("ys")
        if codes:
            first = sorted(codes)[0]
            dname = f"{first}_{ys}" if ys else first
        elif ys:
            dname = f"gen_{ys}"
        else:
            dname = (g.get("id") or "unknown")[:40].replace(" ", "_").replace("/", "_")
        out.append({
            "id": g.get("id"),
            "name": name,
            "ys": g.get("ys"),
            "ye": g.get("ye"),
            "_codes": codes,
            "_dir": dname.lower(),
        })
    return out


def merge_with_existing(dst_path: Path, new_sits: list[dict], cap: int) -> tuple[list[dict], int, int]:
    existing: list[dict] = []
    existing_ids: set[str] = set()
    if dst_path.is_file():
        try:
            ex_raw = json.loads(dst_path.read_text(encoding="utf-8"))
            if isinstance(ex_raw, list):
                for s in ex_raw:
                    if isinstance(s, dict) and s.get("id"):
                        existing.append(s)
                        existing_ids.add(s["id"])
        except Exception:
            pass
    added = 0
    for s in new_sits:
        if s.get("id") and s["id"] not in existing_ids:
            existing.append(s)
            existing_ids.add(s["id"])
            added += 1
    existing.sort(key=lambda x: x.get("urg", 3), reverse=True)
    return existing[:cap], added, min(len(existing), cap)


def process_model(src_brand, src_model, src_brand_dir, dst_brand_dir, brand_map,
                  max_per_gen, dry_run, log_lines, create_gens=False):
    stats = {"model": src_model, "src_count": 0, "gens": 0, "written_total": 0,
             "added_total": 0, "skipped": 0, "error": None}
    src_model_dir = src_brand_dir / "models" / src_model
    if not src_model_dir.is_dir():
        stats["error"] = "src missing"
        return stats
    dst_model_name = resolve_model_dst(src_brand, src_model, brand_map)
    dst_model_dir = dst_brand_dir / dst_model_name

    gens = load_info_gens(src_model_dir)
    if not gens:
        stats["error"] = "no gens"
        return stats
    stats["gens"] = len(gens)

    src_sits = load_src_situations(src_model_dir, [])
    stats["src_count"] = len(src_sits)
    if not src_sits:
        return stats

    chunk_map = load_chunk_gen_map(src_model_dir)
    per_gen: dict[str, list[dict]] = defaultdict(list)
    for idx, raw in enumerate(src_sits):
        new_id = f"{dst_model_name}_{raw.get('id', f'idx{idx}')[:40]}"
        new_id = re.sub(r"[^a-zA-Z0-9_]", "_", new_id).lower()[:60]
        t = transform_situation(raw, new_id=new_id)
        if not t:
            stats["skipped"] += 1
            continue
        for gd in assign_gens(t, raw, gens, chunk_map):
            per_gen[gd].append(t)

    gen_dir_map = find_dst_gen_dirs(dst_model_dir, gens, create_gens=create_gens)
    for gd, sits in per_gen.items():
        dst_gen_dir = gen_dir_map.get(gd)
        if dst_gen_dir is None:
            log_lines.append(f"    {gd}: SKIPPED (no dashboard dir)")
            continue
        seen = set()
        unique = []
        for s in sits:
            if s["id"] not in seen:
                unique.append(s)
                seen.add(s["id"])
        dst_path = dst_gen_dir / "situations.json"
        merged, added, total = merge_with_existing(dst_path, unique, max_per_gen)
        if not dry_run:
            dst_gen_dir.mkdir(parents=True, exist_ok=True)
            if dst_path.is_file():
                try:
                    shutil.copy2(dst_path, dst_path.with_suffix(".json.bak"))
                except Exception:
                    pass
            dst_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        log_lines.append(f"    {gd}: +{added} → total {total} ({'dry' if dry_run else 'written'})")
        stats["written_total"] += total
        stats["added_total"] += added
    return stats


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="D:/transfer4/knowledge-base/brands")
    parser.add_argument("--dst", default="llcar-dashboard/public/data/kb")
    parser.add_argument("--brand", required=True)
    parser.add_argument("--model")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-per-gen", type=int, default=150)
    parser.add_argument("--brand-map", default="scripts/transfer4_brand_mapping.json")
    parser.add_argument("--create-gens", action="store_true")
    parser.add_argument("--report")
    args = parser.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    bm = load_brand_map(Path(args.brand_map))
    src_brand = args.brand
    dst_brand = resolve_brand_dst(src_brand, bm)
    src_bd = src / src_brand
    dst_bd = dst / dst_brand
    if not src_bd.is_dir():
        print(f"ERROR: src brand {src_bd}", file=sys.stderr)
        return 1
    md = src_bd / "models"
    if not md.is_dir():
        print(f"ERROR: no models/ under {src_bd}", file=sys.stderr)
        return 1

    models = [args.model] if args.model else sorted(p.name for p in md.iterdir() if p.is_dir())
    log = [f"# ETL UPT brand={src_brand} → {dst_brand} dry={args.dry_run} create_gens={args.create_gens}"]
    T = {"models": 0, "src": 0, "written": 0, "added": 0, "skipped": 0}
    for m in models:
        log.append(f"\n## {m}")
        s = process_model(src_brand, m, src_bd, dst_bd, bm,
                          args.max_per_gen, args.dry_run, log, create_gens=args.create_gens)
        log.append(f"  stats: src={s['src_count']} gens={s['gens']} written={s['written_total']} "
                   f"added={s['added_total']} skipped={s['skipped']} err={s['error'] or '-'}")
        T["models"] += 1
        T["src"] += s["src_count"]
        T["written"] += s["written_total"]
        T["added"] += s["added_total"]
        T["skipped"] += s["skipped"]

    log.append(f"\n## TOTALS: models={T['models']} src={T['src']} written={T['written']} "
               f"added={T['added']} skipped={T['skipped']}")
    txt = "\n".join(log)
    print(txt)
    if args.report:
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(txt, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
