"""Synthesize final MD from raw GLM output + verification results.

Reads raw/iter{N}/batch-{slug}.json (always) and raw/iter{N}/verify-{slug}.json
(optional), writes topics/{category}/{slug}.md with all required sections and
inline [verified]/[unverified]/[contradicted] labels on factoids.

Usage:
    python scripts/s20_synthesize_topic.py --iter 1 --slug shock-absorbers
    python scripts/s20_synthesize_topic.py --iter 1 --all
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
SEED = RESEARCH / "_meta" / "seed-topics.json"
QUEUE = RESEARCH / "_meta" / "topics-queue.json"
FINDINGS_INDEX = RESEARCH / "_meta" / "findings-index.json"


def load_topic_meta(slug: str) -> dict | None:
    for path in (SEED, QUEUE):
        if not path.exists():
            continue
        for t in json.loads(path.read_text(encoding="utf-8")).get("topics", []):
            if t.get("slug") == slug:
                return t
    return None


def verdict_label(source_url: str, verify: dict) -> str:
    if not verify:
        return "unverified"
    src = verify.get("sources", {}).get(source_url) or verify.get("sources", {}).get(source_url.lower())
    if not src:
        return "unverified"
    status = src.get("status", "")
    if status == "ok":
        return "verified"
    if status in ("contradicted", "off-topic"):
        return "contradicted"
    return "unverified"


def synth_general(parsed: dict, verify: dict, topic: dict) -> str:
    slug = parsed.get("topic_slug", topic["slug"])
    lines: list[str] = []
    lines.append(f"# {topic['title']}")
    lines.append("")
    lines.append(f"**Slug:** `{slug}` · **Категория:** `{topic['category']}` · **Priority:** {topic.get('priority', '—')}")
    lines.append("")
    lines.append("## Описание")
    lines.append("")
    lines.append(parsed.get("description", "_не указано_"))
    lines.append("")

    lines.append("## Симптомы")
    lines.append("")
    for s in parsed.get("symptoms", []):
        sev = s.get("severity", "?")
        lines.append(f"- **{sev.upper()}** — {s.get('text', '')} _({s.get('when', '')})_")
    lines.append("")

    vib = parsed.get("vibration_signature", {}) or {}
    lines.append("## Vibration signature")
    lines.append("")
    lines.append(f"- **Axes:** {', '.join(vib.get('axes') or ['—'])}")
    fr = vib.get("frequency_range_hz") or [None, None]
    lines.append(f"- **Freq range:** {fr[0]}–{fr[1]} Hz")
    lines.append(f"- **Dominant freq:** {vib.get('dominant_freq_hz', '—')} Hz")
    lines.append(f"- **Pattern:** {vib.get('pattern', '—')}")
    lines.append(f"- **az_std typical:** {vib.get('az_std_typical', '—')}  |  **total_vibration typical:** {vib.get('total_vibration_typical', '—')}")
    if vib.get("notes"):
        lines.append(f"- **Notes:** {vib['notes']}")
    lines.append("")

    aud = parsed.get("audio_signature", {}) or {}
    lines.append("## Audio signature")
    lines.append("")
    afr = aud.get("frequency_range_hz") or [None, None]
    lines.append(f"- **Freq range:** {afr[0]}–{afr[1]} Hz")
    lines.append(f"- **Character:** {aud.get('character', '—')}")
    lines.append(f"- **Impulse/continuous:** {aud.get('impulse_or_continuous', '—')}")
    lines.append(f"- **Speed dep.:** {aud.get('speed_dependence', '—')}  |  **Load dep.:** {aud.get('load_dependence', '—')}")
    lines.append(f"- **Our 6-zone mapping:** {aud.get('our_zone_mapping', '—')}")
    if aud.get("notes"):
        lines.append(f"- **Notes:** {aud['notes']}")
    lines.append("")

    vs = parsed.get("vibrostand_method", {}) or {}
    lines.append("## Vibrostand method")
    lines.append("")
    lines.append(f"- **Applicable:** {vs.get('applicable', False)}")
    lines.append(f"- **Stand type:** {vs.get('stand_type', '—')}")
    lines.append(f"- **Key metric:** {vs.get('key_metric', '—')}")
    lines.append(f"- **Thresholds:** pass {vs.get('threshold_pass', '—')} / fail {vs.get('threshold_fail', '—')}")
    lines.append(f"- **Standard:** {vs.get('standard_ref', '—')}")
    if vs.get("notes"):
        lines.append(f"- **Notes:** {vs['notes']}")
    lines.append("")

    lines.append("## Brand specifics")
    lines.append("")
    for b in parsed.get("brand_specifics", []):
        models = ", ".join(b.get("models") or [])
        lines.append(f"- **{b.get('brand', '—')}** ({models}): {b.get('note', '')}")
    lines.append("")

    lines.append("## Expert sequence")
    lines.append("")
    for st in parsed.get("expert_sequence", []):
        lines.append(f"{st.get('step', '?')}. **{st.get('action', '')}** — _{st.get('check', '')}_  · tool: {st.get('tool', '—')}")
    lines.append("")

    lines.append("## Correlations with other defects")
    lines.append("")
    for cr in parsed.get("correlations_with_other_defects", []):
        lines.append(f"- **{cr.get('defect', '')}**: {cr.get('distinguish_by', '')}")
    lines.append("")

    lines.append("## Sources")
    lines.append("")
    for s in parsed.get("sources", []):
        url = s.get("url_or_ref", "")
        label = verdict_label(url, verify)
        lines.append(f"- `[{label}]` **[{s.get('type', '?')}]** {url} — {s.get('relevance', '')}")
    lines.append("")

    lines.append("## Unknowns (для следующей итерации)")
    lines.append("")
    for u in parsed.get("unknowns", []):
        lines.append(f"- {u}")
    lines.append("")

    lines.append("## Meta")
    lines.append("")
    m = parsed.get("meta", {}) or {}
    lines.append(f"- **confidence_self:** {m.get('confidence_self', '—')}")
    lines.append(f"- **training_cutoff_note:** {m.get('training_cutoff_note', '—')}")
    lines.append(f"- **synthesized:** {datetime.now(timezone.utc).isoformat()}")
    lines.append("")

    return "\n".join(lines)


def synth_scientific(parsed: dict, verify: dict, topic: dict) -> str:
    slug = parsed.get("topic_slug", topic["slug"])
    lines: list[str] = []
    lines.append(f"# {topic['title']}")
    lines.append("")
    lines.append(f"**Slug:** `{slug}` · **Категория:** `scientific-evidence` · **Evidence-only: peer-reviewed / standards / OEM bulletins**")
    lines.append("")
    lines.append("## Описание")
    lines.append("")
    lines.append(parsed.get("description", "_не указано_"))
    lines.append("")

    lines.append("## Claims (с уровнем доказательности)")
    lines.append("")
    for c in parsed.get("claims", []):
        lvl = c.get("evidence_level", "?")
        cites = ", ".join(c.get("citations") or []) or "—"
        lines.append(f"- **[{lvl}]** {c.get('statement', '')}")
        lines.append(f"  - Cites: {cites}")
        if c.get("caveats"):
            lines.append(f"  - Caveats: {c['caveats']}")
    lines.append("")

    lines.append("## Key formulas")
    lines.append("")
    for f in parsed.get("key_formulas", []):
        lines.append(f"- **{f.get('name', '')}**: `{f.get('expression', '')}` (variables: {f.get('variables', '—')}, src: {f.get('source_ref', '—')})")
    lines.append("")

    lines.append("## Datasets / samples")
    lines.append("")
    for d in parsed.get("datasets_and_samples", []):
        lines.append(f"- **{d.get('name', '')}** (N={d.get('N', '—')}, {d.get('availability', '?')}): {d.get('description', '')} — {d.get('source_ref', '')}")
    lines.append("")

    vr = parsed.get("vibrostand_relevance", {}) or {}
    lines.append("## Vibrostand relevance")
    lines.append("")
    lines.append(f"- **Method applies to:** {vr.get('method_applies_to', '—')}")
    lines.append(f"- **Validated metrics:** {', '.join(vr.get('validated_metrics') or ['—'])}")
    lines.append(f"- **Known limitations:** {vr.get('known_limitations', '—')}")
    lines.append("")

    lines.append("## Contradictions in literature")
    lines.append("")
    for c in parsed.get("contradictions_in_literature", []):
        lines.append(f"- **{c.get('topic', '')}** — PoV A: {c.get('pov_a', '')}; PoV B: {c.get('pov_b', '')}; resolution: {c.get('resolution_attempts', '—')}")
    lines.append("")

    lines.append("## Sources (peer-reviewed / standards only)")
    lines.append("")
    for s in parsed.get("sources", []):
        url = s.get("url_or_ref", "")
        label = verdict_label(url, verify)
        authors = s.get("authors", "")
        year = s.get("year", "")
        title = s.get("title", "")
        lvl = s.get("evidence_level", "?")
        lines.append(f"- `[{label}]` `[level {lvl}]` **[{s.get('type', '?')}]** {url}")
        if authors or year or title:
            lines.append(f"  - {authors} ({year}) — {title}")
        lines.append(f"  - Relevance: {s.get('relevance', '')}")
    lines.append("")

    lines.append("## Unknowns (gaps in peer-reviewed evidence)")
    lines.append("")
    for u in parsed.get("unknowns", []):
        lines.append(f"- {u}")
    lines.append("")

    lines.append("## Meta")
    lines.append("")
    m = parsed.get("meta", {}) or {}
    lines.append(f"- **confidence_self:** {m.get('confidence_self', '—')}")
    lines.append(f"- **training_cutoff_note:** {m.get('training_cutoff_note', '—')}")
    lines.append(f"- **synthesized:** {datetime.now(timezone.utc).isoformat()}")
    lines.append("")
    return "\n".join(lines)


def update_findings_index(slug: str, category: str, md_path: Path, parsed: dict, verify: dict) -> None:
    idx = {}
    if FINDINGS_INDEX.exists():
        idx = json.loads(FINDINGS_INDEX.read_text(encoding="utf-8"))
    idx.setdefault("topics", {})[slug] = {
        "category": category,
        "md_file": str(md_path.relative_to(ROOT)).replace("\\", "/"),
        "sources_count": len(parsed.get("sources") or []),
        "verified_count": sum(1 for s in (parsed.get("sources") or []) if verdict_label(s.get("url_or_ref", ""), verify) == "verified"),
        "unknowns_count": len(parsed.get("unknowns") or []),
        "synthesized": datetime.now(timezone.utc).isoformat(),
    }
    FINDINGS_INDEX.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")


def synthesize_one(iter_n: int, slug: str) -> Path | None:
    raw_path = RESEARCH / "raw" / f"iter{iter_n}" / f"batch-{slug}.json"
    if not raw_path.exists():
        print(f"[miss] {slug} — no raw file")
        return None
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    if not raw.get("parsed_ok"):
        print(f"[skip] {slug} — parsed_ok=False")
        return None
    parsed = raw["parsed"]
    verify_path = RESEARCH / "raw" / f"iter{iter_n}" / f"verify-{slug}.json"
    verify = json.loads(verify_path.read_text(encoding="utf-8")) if verify_path.exists() else {}
    topic = load_topic_meta(slug) or {"slug": slug, "title": slug, "category": "suspension", "priority": 2}
    category = topic["category"]
    is_sci = category == "scientific-evidence"
    md = synth_scientific(parsed, verify, topic) if is_sci else synth_general(parsed, verify, topic)
    out_dir = RESEARCH / "topics" / category
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.md"
    out_path.write_text(md, encoding="utf-8")
    update_findings_index(slug, category, out_path, parsed, verify)
    print(f"[ok] {slug} -> {out_path.relative_to(ROOT)}")
    return out_path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--iter", type=int, required=True)
    p.add_argument("--slug")
    p.add_argument("--slugs", help="comma-separated")
    p.add_argument("--all", action="store_true")
    args = p.parse_args()

    if args.all:
        iter_dir = RESEARCH / "raw" / f"iter{args.iter}"
        slugs = [f.stem.replace("batch-", "") for f in sorted(iter_dir.glob("batch-*.json"))]
    elif args.slugs:
        slugs = [s.strip() for s in args.slugs.split(",") if s.strip()]
    elif args.slug:
        slugs = [args.slug]
    else:
        p.error("need --slug, --slugs, or --all")
    ok = 0
    for s in slugs:
        if synthesize_one(args.iter, s):
            ok += 1
    print(f"\nsynth DONE: {ok}/{len(slugs)}")


if __name__ == "__main__":
    main()
