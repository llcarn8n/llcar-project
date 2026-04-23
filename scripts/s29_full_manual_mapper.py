#!/usr/bin/env python3
"""S29 §3.1 full mapper — полная картина mapping vehicles.json ↔ kb/ ↔ D:/sources.

Для каждой модели из vehicles.json ищет мануал по цепочке:
  1. kb/<brand>/<model_slug>/ (direct match в _kb_generations_index.json)
  2. kb/<brand>/<parent_model>/<slug>/ (slug как gen какого-то model)
  3. D:/manuals-export/<brand>/<fuzzy_match>/ (need ingest into kb)
  4. D:/transfer4/knowledge-base/brands/<brand>/<fuzzy>/ (alt source)
  5. not_found — реально нигде нет

Выход: .omc/research/s29-full-mapper.md + JSON для ingest-плана.
"""
from __future__ import annotations

import argparse
import difflib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VEHICLES = ROOT / "llcar-dashboard" / "src" / "data" / "vehicles.json"
KB_INDEX = ROOT / "llcar-dashboard" / "public" / "data" / "kb" / "_kb_generations_index.json"
KB_ROOT = ROOT / "llcar-dashboard" / "public" / "data" / "kb"
MANUALS_EXPORT = Path("D:/manuals-export")
TRANSFER4 = Path("D:/transfer4/knowledge-base/brands")
DEFAULT_REPORT = ROOT / ".omc" / "research" / "s29-full-mapper.md"
DEFAULT_JSON = ROOT / ".omc" / "research" / "s29-full-mapper.json"


def strip_brand(full_id: str, brand_id: str) -> str:
    prefix = f"{brand_id}_"
    if full_id.startswith(prefix):
        return full_id[len(prefix):]
    return full_id


def fuzzy_best(needle: str, haystack: list[str], threshold: float = 0.72) -> tuple[str, float] | None:
    best = None
    best_score = 0.0
    needle_low = needle.lower()
    for cand in haystack:
        cand_low = cand.lower()
        score = difflib.SequenceMatcher(None, needle_low, cand_low).ratio()
        # Boost if one contains other as substring
        if needle_low in cand_low or cand_low in needle_low:
            score = max(score, 0.85)
        if score > best_score:
            best_score = score
            best = cand
    if best and best_score >= threshold:
        return (best, best_score)
    return None


def list_dirs(path: Path) -> list[str]:
    if not path.exists():
        return []
    try:
        return sorted(d.name for d in path.iterdir() if d.is_dir() and not d.name.startswith("_"))
    except (PermissionError, OSError):
        return []


def find_in_kb_index(kb_index: dict, brand_id: str, slug: str) -> dict | None:
    """Return {"type": "model"|"gen", "path": "..."} or None."""
    brand_obj = kb_index.get("brands", {}).get(brand_id)
    if not brand_obj:
        return None
    models = brand_obj.get("models", {})
    # 1) Direct model match
    if slug in models:
        gens = models[slug]
        return {"type": "model", "kb_path": f"kb/{brand_id}/{slug}", "gens": gens}
    # 2) slug as one of the gens
    for m_id, gens in models.items():
        if slug in gens:
            return {"type": "gen_match", "kb_path": f"kb/{brand_id}/{m_id}/{slug}", "parent_model": m_id}
    # 3) fuzzy on model keys
    model_keys = list(models.keys())
    fuzz = fuzzy_best(slug, model_keys)
    if fuzz:
        m_id, score = fuzz
        return {
            "type": "fuzzy_model",
            "kb_path": f"kb/{brand_id}/{m_id}",
            "matched": m_id,
            "score": round(score, 2),
            "gens": models[m_id],
        }
    # 4) fuzzy on gen values
    for m_id, gens in models.items():
        fuzz_g = fuzzy_best(slug, gens)
        if fuzz_g:
            g, score = fuzz_g
            return {
                "type": "fuzzy_gen",
                "kb_path": f"kb/{brand_id}/{m_id}/{g}",
                "matched_gen": g,
                "parent_model": m_id,
                "score": round(score, 2),
            }
    return None


def find_in_external(root: Path, brand_id: str, slug: str) -> dict | None:
    brand_dir = root / brand_id
    if not brand_dir.exists():
        return None
    candidates = list_dirs(brand_dir)
    # Exact first
    if slug in candidates:
        return {"type": "exact", "source": str(brand_dir / slug)}
    # Variants with brand prefix
    for variant in (f"{brand_id}_{slug}", slug.replace("_", ""), f"_{slug}"):
        if variant in candidates:
            return {"type": "variant", "matched": variant, "source": str(brand_dir / variant)}
    # Fuzzy
    fuzz = fuzzy_best(slug, candidates)
    if fuzz:
        m, score = fuzz
        return {"type": "fuzzy", "matched": m, "score": round(score, 2), "source": str(brand_dir / m)}
    return None


def has_manual(path_str: str) -> bool:
    """Check if path contains at least one manual.md (any depth up to 3)."""
    p = Path(path_str)
    if not p.exists():
        return False
    if (p / "manual.md").exists():
        return True
    for child in p.iterdir():
        if child.is_dir() and (child / "manual.md").exists():
            return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON)
    args = parser.parse_args()

    if not VEHICLES.exists():
        print(f"[err] {VEHICLES}", file=sys.stderr); return 1
    if not KB_INDEX.exists():
        print(f"[err] {KB_INDEX}", file=sys.stderr); return 1

    vehicles = json.loads(VEHICLES.read_text(encoding="utf-8"))
    kb_index = json.loads(KB_INDEX.read_text(encoding="utf-8"))

    results: list[dict] = []
    in_kb = 0
    needs_ingest = 0
    not_found = 0

    total_models = 0
    for brand_obj in vehicles:
        brand_id = brand_obj["id"]
        for model_obj in brand_obj.get("models", []):
            total_models += 1
            full_id = model_obj["id"]
            slug = strip_brand(full_id, brand_id)
            # extra strip of leading underscore (changan__cs55 bug)
            slug_clean = slug.lstrip("_")

            record = {
                "brand": brand_id,
                "model_id": full_id,
                "slug": slug,
                "slug_clean": slug_clean,
                "status": "",
                "kb": None,
                "external": None,
            }

            # Try KB (normal + cleaned)
            kb_hit = find_in_kb_index(kb_index, brand_id, slug) or find_in_kb_index(kb_index, brand_id, slug_clean)
            if kb_hit:
                record["status"] = "in_kb"
                record["kb"] = kb_hit
                in_kb += 1
                results.append(record)
                continue

            # Try external D:/manuals-export
            ext_me = find_in_external(MANUALS_EXPORT, brand_id, slug_clean)
            # Only count as ingest-worthy if source actually has manual.md
            if ext_me and has_manual(ext_me["source"]):
                record["status"] = "needs_ingest_manuals_export"
                record["external"] = ext_me
                needs_ingest += 1
                results.append(record)
                continue

            ext_t4 = find_in_external(TRANSFER4, brand_id, slug_clean)
            if ext_t4 and has_manual(ext_t4["source"]):
                record["status"] = "needs_ingest_transfer4"
                record["external"] = ext_t4
                needs_ingest += 1
                results.append(record)
                continue

            # Even if no manual.md, note if we at least saw the folder (for diagnostics)
            if ext_me:
                record["external"] = {**ext_me, "note": "no manual.md inside"}
            elif ext_t4:
                record["external"] = {**ext_t4, "note": "no manual.md inside"}

            record["status"] = "not_found"
            not_found += 1
            results.append(record)

    # Build markdown report
    lines: list[str] = []
    lines.append("# S29 H3.10 full mapper — vehicles.json ↔ kb/ ↔ D:/sources")
    lines.append("")
    lines.append(f"- Всего моделей в vehicles.json: **{total_models}**")
    lines.append(f"- **✅ in_kb** (уже в dashboard): **{in_kb}** ({100*in_kb/total_models:.1f}%)")
    lines.append(f"- **⚙ needs_ingest** (мануал найден в D:/, нужно импортировать в kb/): **{needs_ingest}**")
    lines.append(f"- **❌ not_found** (нигде нет): **{not_found}**")
    lines.append("")

    # Needs-ingest section — highest value
    if needs_ingest > 0:
        lines.append("## ⚙ Needs Ingest — мануал есть в D:/, нужно импортировать в kb/")
        lines.append("")
        lines.append("| brand | model_id | slug | источник | match |")
        lines.append("|---|---|---|---|---|")
        for r in results:
            if r["status"].startswith("needs_ingest"):
                ext = r["external"] or {}
                source_tag = "manuals-export" if r["status"].endswith("manuals_export") else "transfer4"
                src_short = Path(ext.get("source", "")).name
                match_type = ext.get("type", "")
                score = ext.get("score", "")
                lines.append(f"| {r['brand']} | `{r['model_id']}` | {r['slug']} | {source_tag}/{src_short} | {match_type} {score} |")
        lines.append("")

    # not_found — for user decisions
    if not_found > 0:
        lines.append("## ❌ Not Found — нигде нет (возможно убрать из vehicles.json)")
        lines.append("")
        lines.append("| brand | model_id | slug | внешняя папка (без manual.md) |")
        lines.append("|---|---|---|---|")
        for r in results:
            if r["status"] == "not_found":
                ext = r["external"]
                ext_note = ""
                if ext:
                    ext_note = f"{ext.get('source', '?')} ({ext.get('note', '')})"
                lines.append(f"| {r['brand']} | `{r['model_id']}` | {r['slug']} | {ext_note} |")
        lines.append("")

    # in_kb summary at end
    lines.append("## ✅ In KB (sample first 20)")
    lines.append("")
    lines.append("| brand | model_id | kb match type |")
    lines.append("|---|---|---|")
    sample = [r for r in results if r["status"] == "in_kb"][:20]
    for r in sample:
        kb = r["kb"] or {}
        lines.append(f"| {r['brand']} | `{r['model_id']}` | {kb.get('type', '?')} |")
    if in_kb > 20:
        lines.append(f"| ... | ... | (+{in_kb-20} более) |")

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text("\n".join(lines), encoding="utf-8")
    args.json_out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[ok] report: {args.report}")
    print(f"[ok] json:   {args.json_out}")
    print(f"[stats] total={total_models} in_kb={in_kb} needs_ingest={needs_ingest} not_found={not_found}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
