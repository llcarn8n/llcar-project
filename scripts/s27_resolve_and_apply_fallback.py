#!/usr/bin/env python3
"""S27 H3.3 fallback (227 строк) — извлечь год из содержимого + apply с 2001+.

Для каждой строки в preview где target_gen оканчивается на `_main`:
 - читаем source manual.md из D:\\manuals-export/<brand>/<src_dir>/manual.md
 - извлекаем год через расширенный набор паттернов (скобки, диапазоны, "с 19XX г.", MY, и т.д.)
 - если year >= 2001 → target_gen = `<target_model>_<year>`, копируем в kb
 - если year < 2001 → SKIP (pre-2001)
 - если год не нашёлся → остаётся на ручную обработку (лог в .jsonl)

Стримим лог, идемпотентно (если dst уже есть — manual_variant.md).
"""
from __future__ import annotations
import io
import json
import re
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


TECH_FIELD_RE = re.compile(r"(?:chunks?|tier|layer|p|len|doc_type|lang)\s*:\s*\d+", re.I)
PATTERNS = [
    re.compile(r"\((\d{4})(?:\s*[-–]\s*\d{4})?\)"),
    re.compile(r"\b(19[89]\d|20[0-2]\d)\s*[-–]\s*(?:19[89]\d|20[0-2]\d)\b"),
    re.compile(r"\bс\s+(19[89]\d|20[0-2]\d)\s*(?:г\.?|год)", re.I),
    re.compile(r"выпуск(?:а|ов)?\s*с\s*(19[89]\d|20[0-2]\d)", re.I),
    re.compile(r"\b(?:from|since|model\s*year|MY)\s*(19[89]\d|20[0-2]\d)\b", re.I),
    re.compile(r"\b(\d{2})\s*MY\b", re.I),
    re.compile(r"\b(20[012]\d)(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b"),
    re.compile(r"_(19[89]\d|20[0-2]\d)[_.\-]"),
    re.compile(r"[Ss]ource:\s*.{0,100}?(19[89]\d|20[0-2]\d)"),
]

ROW_RE = re.compile(
    r"^\|\s*([a-z0-9_\-]+)\s*\|\s*([a-z0-9_\-]+)\s*\|\s*([\d.]+)\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([a-z0-9_\-:+ ()]+)\s*\|",
    re.I,
)
SECTION_RE = re.compile(r"^##\s+([a-z_]+)\s*\(\d+\)\s*$", re.I)


def strip_tech(text: str) -> str:
    return TECH_FIELD_RE.sub("", text)


def extract_year(text: str, source_hint: str) -> int | None:
    clean = strip_tech(text[:500000])
    combined = (source_hint or "") + "\n" + clean
    for rx in PATTERNS:
        m = rx.search(combined)
        if m:
            try:
                y = int(m.group(1))
                if y < 100:
                    y = 2000 + y
                if 1980 <= y <= 2027:
                    return y
            except (ValueError, IndexError):
                continue
    return None


def read_source(brand: str, src_dir: str, src_root: Path) -> tuple[str, str]:
    base = src_root / brand / src_dir
    if not base.exists():
        return "", ""
    text = ""
    pdf_names: list[str] = []
    md_path = base / "manual.md"
    if md_path.exists():
        try:
            text = md_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            pass
    try:
        for child in base.iterdir():
            if child.is_file() and child.suffix.lower() == ".pdf":
                pdf_names.append(child.name)
    except Exception:
        pass
    return text, "\n".join(pdf_names)


def parse_preview(path: Path) -> list[dict]:
    rows = []
    decision = "unknown"
    for ln in path.read_text(encoding="utf-8").splitlines():
        sm = SECTION_RE.match(ln)
        if sm:
            decision = sm.group(1).strip()
            continue
        m = ROW_RE.match(ln)
        if not m:
            continue
        brand, src_dir, size_mb, model, gen, reason = m.groups()
        rows.append({
            "brand": brand.strip(),
            "src_dir": src_dir.strip(),
            "size_mb": float(size_mb),
            "target_model": model.strip(),
            "target_gen": gen.strip(),
            "reason": reason.strip(),
            "decision": decision,
        })
    return rows


BRAND_ALIAS = {"mercedes_benz": "mercedes", "li": "li_auto", "bestune": "faw_bestune"}


def main() -> int:
    src_root = Path("D:/manuals-export")
    kb_root = Path("llcar-dashboard/public/data/kb")
    preview = Path(".omc/research/s27-h33-preview.md")
    rows = parse_preview(preview)
    fallback = [r for r in rows if r["target_gen"].endswith("_main") and r["decision"] != "new_brand"]
    # new_brand тоже через alias — возьмём _main ones where NOT already применены через h34
    new_brand_main = [r for r in rows if r["target_gen"].endswith("_main") and r["decision"] == "new_brand"]
    # add them back with alias
    fallback.extend(new_brand_main)

    print(f"[info] rows with _main gen: {len(fallback)}")

    stats = {"resolved_applied": 0, "pre2001_skipped": 0, "no_year_skipped": 0,
             "missing_src": 0, "errors": 0, "oversize_skipped": 0, "variant": 0,
             "total": len(fallback)}

    log = Path(".omc/research/s27-h33-fallback-apply-log.jsonl")
    log.parent.mkdir(parents=True, exist_ok=True)
    unresolved: list[dict] = []

    with log.open("w", encoding="utf-8") as f:
        for i, r in enumerate(fallback, 1):
            brand, src_dir = r["brand"], r["src_dir"]
            dst_brand = BRAND_ALIAS.get(brand, brand)
            model = r["target_model"]

            if r["size_mb"] > 10.0:
                stats["oversize_skipped"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": "oversize", "size_mb": r["size_mb"]}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()
                continue

            text, src_hint = read_source(brand, src_dir, src_root)
            if not text:
                stats["missing_src"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": "missing_src"}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()
                continue

            year = extract_year(text, src_hint)

            if year is None:
                stats["no_year_skipped"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": "no_year",
                      "target_model": model, "decision": r["decision"]}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()
                unresolved.append(op)
                continue

            if year < 2001:
                stats["pre2001_skipped"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": "pre2001", "year": year}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()
                continue

            # year >= 2001 → применяем
            new_gen = f"{model}_{year}"
            dst_dir = kb_root / dst_brand / model / new_gen
            src_md = src_root / brand / src_dir / "manual.md"

            try:
                dst_md = dst_dir / "manual.md"
                action = "copy"
                if dst_md.exists():
                    n = 1
                    while True:
                        cand = dst_dir / (f"manual_variant.md" if n == 1 else f"manual_variant{n}.md")
                        if not cand.exists():
                            dst_md = cand
                            action = f"copy_variant({cand.name})"
                            stats["variant"] += 1
                            break
                        n += 1

                dst_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(src_md), str(dst_md))

                meta = dst_dir / "meta.json"
                m = {}
                if meta.exists():
                    try:
                        m = json.loads(meta.read_text(encoding="utf-8"))
                    except Exception:
                        pass
                m.setdefault("brand", dst_brand)
                m.setdefault("model", model)
                m.setdefault("generation", new_gen)
                m["source"] = "kb"
                m["ingested_from"] = f"{brand}/{src_dir}"
                m["ingested_at"] = "2026-04-21"
                m["h33_fallback"] = True
                m["extracted_year"] = year
                if brand in BRAND_ALIAS:
                    m["brand_alias"] = {"src": brand, "dst": dst_brand}
                meta.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

                stats["resolved_applied"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": action,
                      "target": f"{dst_brand}/{model}/{new_gen}", "year": year}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()

                if i % 50 == 0 or i == len(fallback):
                    print(f"[{i}/{len(fallback)}] {brand}/{src_dir} → {dst_brand}/{model}/{new_gen} (year={year})",
                          file=sys.stderr, flush=True)
            except Exception as e:
                stats["errors"] += 1
                op = {"i": i, "path": f"{brand}/{src_dir}", "action": "error", "error": str(e)}
                f.write(json.dumps(op, ensure_ascii=False) + "\n")
                f.flush()
                print(f"[{i}] ERR: {e}", file=sys.stderr)

    # dump unresolved as MD for manual review
    unres_md = Path(".omc/research/s27-h33-fallback-unresolved.md")
    lines = [
        f"# S27 H3.3 — {len(unresolved)} файлов без года (требуют ручной обработки)",
        "",
        "| brand | src_dir | target_model | decision |",
        "|---|---|---|---|",
    ]
    for u in unresolved:
        b, s = u["path"].split("/", 1)
        lines.append(f"| {b} | {s} | {u['target_model']} | {u['decision']} |")
    unres_md.write_text("\n".join(lines), encoding="utf-8")

    print(f"\n[summary] {stats}")
    print(f"[log] {log}")
    print(f"[unresolved] {unres_md}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
