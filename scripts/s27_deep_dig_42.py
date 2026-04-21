#!/usr/bin/env python3
"""S27 H3.1-fix Deep-dig 42 manual_triage victims — глубокий анализ.

Для каждого `<brand>/<model>/<model>/manual.md` из 42 сомнительных случаев:
 1. Читает полный текст (до 100KB)
 2. Читает D:\\manuals-export/<brand>/<model>/ — все PDF filenames, meta.json
 3. Ищет ВСЕ годы / кодовые имена кузовов (F30, G20, W222, W223, XV50, XV70, CM, DM, TM, MX5, QB, FB, JB, DC, SL, QL, NQ5, DL3, UM, GF, etc.)
 4. Сопоставляет с существующими gen-slug'ами в модели (уже в KB)
 5. Принимает решение: merge_into:<gen> | create:<model>_<year>
 6. Пишет детальный findings отчёт для verification.
"""
from __future__ import annotations
import argparse
import io
import json
import re
import sys
from pathlib import Path
from collections import Counter

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)

# Все возможные годы
YEAR_RE = re.compile(r"\b(19[89]\d|20[0-2]\d)\b")
# Кодовые имена кузовов / платформ (по маркам)
CHASSIS_CODES: dict[str, list[tuple[str, str, tuple[int, int]]]] = {
    # model_key → [(gen_slug, code_pattern, (year_start, year_end))]
    "bmw/3_series": [
        ("f30_2012", r"\bF3[0-5]\b", (2012, 2019)),
        ("g20_2019", r"\bG2[0-9]\b", (2019, 2028)),
        ("e90", r"\bE9[0-3]\b", (2005, 2012)),
    ],
    "bmw/4_series": [
        ("f32_2013", r"\bF3[2-6]\b", (2013, 2020)),
        ("g22_2020", r"\bG2[2-6]\b", (2020, 2028)),
    ],
    "bmw/6_series": [
        ("f13_2010", r"\bF1[2-3]\b", (2010, 2018)),
        ("g32_2017", r"\bG3[0-2]\b", (2017, 2028)),
        ("e63", r"\bE6[3-4]\b", (2003, 2010)),
    ],
    "bmw/x6": [
        ("f16_2014", r"\bF1[6-7]\b", (2014, 2019)),
        ("g06_2019", r"\bG0[5-7]\b", (2019, 2028)),
        ("e71", r"\bE7[1-2]\b", (2008, 2014)),
    ],
    "mercedes/s_class": [
        ("w222_2013", r"\bW22[2]\b", (2013, 2020)),
        ("w223_2020", r"\bW22[3]\b", (2020, 2028)),
        ("w221", r"\bW22[1]\b", (2005, 2013)),
    ],
    "mercedes/gle": [
        ("w166_2011", r"\bW16[6]\b", (2011, 2019)),
        ("w167_2019", r"\bW16[7]\b", (2019, 2028)),
    ],
    "mercedes/gls": [
        ("x166_2012", r"\bX16[6]\b", (2012, 2019)),
        ("x167_2019", r"\bX16[7]\b", (2019, 2028)),
    ],
    "hyundai/santa_fe": [
        ("cm_2005", r"\bCM\b", (2005, 2012)),
        ("dm_2012", r"\bDM\b", (2012, 2018)),
        ("tm_2018", r"\bTM\b", (2018, 2023)),
        ("mx5_2023", r"\bMX5\b", (2023, 2028)),
    ],
    "hyundai/staria": [
        ("us4_2021", r"\bUS4\b", (2021, 2028)),
    ],
    "kia/rio": [
        ("dc_2000", r"\bDC\b", (2000, 2005)),
        ("jb_2005", r"\bJB\b", (2005, 2011)),
        ("qb_2011", r"\bQB\b", (2011, 2017)),
        ("fb_2017", r"\bFB\b", (2017, 2023)),
    ],
    "kia/sportage": [
        ("sl_2010", r"\bSL\b", (2010, 2015)),
        ("ql_2016", r"\bQL\b", (2016, 2021)),
        ("nq5_2022", r"\bNQ5\b", (2021, 2028)),
    ],
    "kia/sorento": [
        ("um_2015", r"\bUM\b", (2015, 2020)),
    ],
    "kia/k5": [
        ("dl3_2020", r"\bDL3\b", (2020, 2028)),
    ],
    "kia/ceed": [],
    "kia/ev9": [
        ("mv_2023", r"\bMV\b", (2023, 2028)),
    ],
    "toyota/camry": [
        ("xv40_2006", r"\bXV4[0-9]\b", (2006, 2011)),
        ("v50_2011", r"\bV5[0-9]\b|\bXV5[0-9]\b", (2011, 2018)),
        ("xv70_2018", r"\bXV7[0-9]\b", (2018, 2028)),
    ],
    "lexus/es": [
        ("xv60_2012", r"\bXV6[0-9]\b", (2012, 2018)),
        ("xv70_2018", r"\bXV7[0-9]\b", (2018, 2028)),
    ],
    "mitsubishi/outlander": [
        ("gf_2012", r"\bGF\b", (2012, 2021)),
        ("outlander_phev", r"\bPHEV\b", (2013, 2022)),
    ],
    "land_rover/range_rover_sport": [
        ("l494_2013", r"\bL494\b", (2013, 2022)),
        ("l461_2022", r"\bL461\b", (2022, 2028)),
    ],
    "ford/focus": [
        ("mk3_2011", r"\b[Mm][Kk]3\b|\bMk3\b|\bIII\b", (2011, 2018)),
    ],
    "ford/mondeo": [
        ("mk5_2014", r"\b[Mm][Kk]5\b|\bMk5\b|\bV\s*gen\b", (2014, 2022)),
    ],
    "volkswagen/golf": [
        ("mk7_2012", r"\b[Mm][Kk]7\b|\bMk7\b|\bVII\b", (2012, 2020)),
        ("golf_2", r"\bMk2\b|\bII\b", (1983, 1992)),
    ],
    "geely/coolray": [
        ("sx11_2020", r"\bSX11\b", (2020, 2028)),
        ("coolray_2019", r"\b", (2018, 2024)),
    ],
    "geely/atlas": [
        ("nl3_2018", r"\bNL3\b", (2018, 2022)),
        ("atlas_pro", r"\bAtlas\s*Pro\b", (2021, 2025)),
    ],
    "geely/monjaro": [
        ("kx11_2022", r"\bKX11\b", (2022, 2028)),
        ("monjaro_2023_kx11", r"\bKX11\b", (2022, 2028)),
    ],
    "genesis/g80": [
        ("g80_2018", r"\bDH\b|\bRG3\b", (2018, 2020)),
        ("g80_2023", r"\bRG3\b", (2020, 2028)),
    ],
    "hongqi/hs5": [],
    "voyah/free": [
        ("free_2021", r"\b", (2021, 2023)),
        ("free_2", r"\b2024\b|\b2025\b", (2024, 2028)),
    ],
    "lada/granta": [
        ("2190_2018", r"\b219[0-9]\b", (2011, 2028)),
    ],
    "lada/vesta": [
        ("gfl_2015", r"\bGFL\b|\bGF\b", (2015, 2028)),
    ],
    "renault/duster": [
        ("duster_2010", r"\b", (2010, 2015)),
        ("hs_2015", r"\bHS\b", (2015, 2021)),
        ("hm_2021", r"\bHM\b", (2021, 2028)),
    ],
    "ssangyong/actyon": [
        ("gen_2006", r"\b2006\b", (2006, 2012)),
        ("gen_2012", r"\b2012\b", (2012, 2024)),
        ("gen_2024", r"\b2024\b", (2024, 2028)),
    ],
    "ssangyong/korando": [
        ("gen_2013", r"\b", (2013, 2019)),
        ("gen_2019", r"\b", (2019, 2028)),
    ],
    "ssangyong/musso": [
        ("gen_2005", r"\b", (2005, 2020)),
        ("gen_2021", r"\b", (2021, 2028)),
    ],
    "ssangyong/rexton": [
        ("gen_2017", r"\b", (2017, 2028)),
    ],
    "chery/tiggo_7_pro": [
        ("t7p_2020", r"\b", (2020, 2023)),
        ("tiggo_7_pro_max_restyled", r"\bMax\b|\bRestyled\b|\bрестайлинг\b", (2023, 2028)),
    ],
    "belgee/x50": [
        ("x50_2023", r"\b", (2023, 2024)),
        ("x50_plus", r"\bPlus\b", (2024, 2028)),
    ],
    "baic/bj40": [
        ("bj40_2019", r"\b", (2019, 2023)),
        ("bj40_2023", r"\b", (2023, 2028)),
    ],
    "byd/dolphin": [
        ("dolphin_2021", r"\b", (2021, 2023)),
        ("dolphin_2", r"\bmini\b|\bсерф\b", (2023, 2028)),
    ],
    "zeekr/009": [
        ("009_2022", r"\b", (2022, 2028)),
    ],
}


def strip_tech(text: str) -> str:
    return TECH_FIELD_RE.sub("", text)


def find_year_mentions(text: str) -> Counter:
    clean = strip_tech(text[:50000])
    c = Counter()
    for m in YEAR_RE.finditer(clean):
        y = int(m.group(1))
        if 1985 <= y <= 2027:
            c[y] += 1
    return c


def find_chassis_codes(text: str, model_key: str) -> Counter:
    if model_key not in CHASSIS_CODES:
        return Counter()
    c = Counter()
    for gen_slug, pattern, _range in CHASSIS_CODES[model_key]:
        if not pattern.strip() or pattern == r"\b":
            continue
        matches = re.findall(pattern, text[:50000])
        if matches:
            c[gen_slug] = len(matches)
    return c


def read_source_details(brand: str, src_dir: str, src_root: Path) -> dict:
    """Быстрая версия: читает только 1-й уровень директории (без rglob)."""
    base = src_root / brand / src_dir
    info = {"exists": False, "pdf_names": [], "size_mb": 0.0}
    if not base.exists():
        return info
    info["exists"] = True
    total = 0
    try:
        for child in base.iterdir():
            if child.is_file():
                try:
                    total += child.stat().st_size
                except Exception:
                    pass
                if child.suffix.lower() == ".pdf":
                    info["pdf_names"].append(child.name)
    except Exception:
        pass
    info["size_mb"] = total / 1e6
    return info


def build_kb_index(kb: Path) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for brand_dir in sorted(kb.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith((".", "_")):
            continue
        for model_dir in sorted(brand_dir.iterdir()):
            if not model_dir.is_dir() or model_dir.name.startswith((".", "_")):
                continue
            gens = []
            for g in sorted(model_dir.iterdir()):
                if g.is_dir() and not g.name.startswith((".", "_")) and g.name != model_dir.name:
                    if (g / "manual.md").exists() or (g / "meta.json").exists() or (g / "situations.json").exists():
                        gens.append(g.name)
            if gens:
                idx[f"{brand_dir.name}/{model_dir.name}"] = gens
    return idx


def decide_from_evidence(year_counter: Counter, chassis_counter: Counter, existing_gens: list[str], model_key: str) -> tuple[str, str]:
    """Принять решение. Return (decision, confidence)."""
    # Top year mention (частотно)
    top_year = None
    if year_counter:
        top_year = year_counter.most_common(1)[0][0]

    # Top chassis code
    top_chassis = None
    if chassis_counter:
        top_chassis = chassis_counter.most_common(1)[0][0]
        if top_chassis in existing_gens:
            return f"merge_into:{top_chassis}", "high (chassis code match)"

    # Year → найти gen где year попадает в range
    if top_year and model_key in CHASSIS_CODES:
        for gen_slug, _patt, (y0, y1) in CHASSIS_CODES[model_key]:
            if gen_slug in existing_gens and y0 <= top_year < y1:
                return f"merge_into:{gen_slug}", f"medium (year {top_year} in {gen_slug} range {y0}-{y1})"

    # fallback — если year и нет ranges в CHASSIS_CODES
    if top_year:
        # создаём новый
        return f"create:<model>_{top_year}", f"low (fallback top year {top_year})"

    return "manual_review", "low (нет годов и кузовных кодов)"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kb-root", default="llcar-dashboard/public/data/kb")
    ap.add_argument("--src-root", default="D:\\manuals-export")
    ap.add_argument("--report", default=".omc/research/s27-42-deep-findings.md")
    ap.add_argument("--jsonl", default=".omc/research/s27-42-deep-findings.jsonl")
    ap.add_argument("--resume", action="store_true", help="продолжить с последнего обработанного в JSONL")
    args = ap.parse_args()

    kb = Path(args.kb_root)
    src_root = Path(args.src_root)
    kb_idx = build_kb_index(kb)

    victims: list[Path] = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) == 4 and parts[1] == parts[2]:
            victims.append(m)

    # resume: читаем существующий jsonl, skip already-done
    done_paths: set[str] = set()
    jsonl_path = Path(args.jsonl)
    jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    if args.resume and jsonl_path.exists():
        for ln in jsonl_path.read_text(encoding="utf-8").splitlines():
            if not ln.strip():
                continue
            try:
                done_paths.add(json.loads(ln)["path"])
            except Exception:
                continue
        print(f"[resume] уже обработано: {len(done_paths)}", file=sys.stderr)
    else:
        # fresh start
        jsonl_path.write_text("", encoding="utf-8")

    rows: list[dict] = []
    # читаем уже существующие для финального отчёта
    if jsonl_path.exists():
        for ln in jsonl_path.read_text(encoding="utf-8").splitlines():
            if ln.strip():
                try:
                    rows.append(json.loads(ln))
                except Exception:
                    continue

    print(f"[info] victims: {len(victims)}, to_process: {len(victims) - len(done_paths)}", file=sys.stderr)

    with jsonl_path.open("a", encoding="utf-8") as jf:
        for idx, m in enumerate(victims, 1):
            brand, model, gen, _ = m.relative_to(kb).parts
            rel = f"{brand}/{model}/{gen}"
            if rel in done_paths:
                continue
            model_key = f"{brand}/{model}"
            existing = kb_idx.get(model_key, [])

            try:
                text = m.read_text(encoding="utf-8", errors="replace")
            except Exception:
                print(f"[{idx}/{len(victims)}] ERR read {rel}", file=sys.stderr, flush=True)
                continue

            year_c = find_year_mentions(text)
            chassis_c = find_chassis_codes(text, model_key)
            src = read_source_details(brand, gen, src_root)
            src_year_c = find_year_mentions("\n".join(src.get("pdf_names", [])))
            combined_year = year_c + src_year_c

            decision, confidence = decide_from_evidence(combined_year, chassis_c, existing, model_key)

            title = ""
            for ln in text.splitlines()[:5]:
                if ln.strip():
                    title = ln.strip()[:120]
                    break

            row = {
                "path": rel,
                "model_key": model_key,
                "existing": existing,
                "title": title,
                "top_years": combined_year.most_common(5),
                "chassis": dict(chassis_c),
                "src_exists": src.get("exists", False),
                "src_pdfs": src.get("pdf_names", [])[:3],
                "src_size_mb": round(src.get("size_mb", 0), 1),
                "decision": decision,
                "confidence": confidence,
            }
            jf.write(json.dumps(row, ensure_ascii=False) + "\n")
            jf.flush()
            rows.append(row)
            print(f"[{idx}/{len(victims)}] {rel} → {decision}", file=sys.stderr, flush=True)

    # финальный MD-отчёт
    lines = [
        "# S27 H3.1-fix Deep-dig — findings для 152 model==gen мануалов",
        "",
        f"Всего: **{len(rows)}**",
        "",
    ]
    by_dec = Counter(r["decision"].split(":")[0] for r in rows)
    for k, v in by_dec.most_common():
        lines.append(f"- `{k}`: **{v}**")
    lines.append("")
    lines.append("## Детальные findings")
    lines.append("")

    for r in sorted(rows, key=lambda x: (x["decision"], x["path"])):
        lines.append(f"### `{r['path']}`")
        lines.append("")
        lines.append(f"- **title:** `{r['title']}`")
        lines.append(f"- **existing gens:** {', '.join(r['existing']) if r['existing'] else '—'}")
        lines.append(f"- **top years in content:** {r['top_years']}")
        lines.append(f"- **chassis codes matched:** {r['chassis']}")
        lines.append(f"- **D:\\ source:** exists={r['src_exists']}, size={r['src_size_mb']}MB, pdfs={r['src_pdfs']}")
        lines.append(f"- **DECISION:** `{r['decision']}` (confidence: {r['confidence']})")
        lines.append("")

    Path(args.report).write_text("\n".join(lines), encoding="utf-8")
    print(f"[done] report → {args.report}")
    print(f"[done] jsonl → {jsonl_path}")
    print(f"[summary] {dict(by_dec)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
