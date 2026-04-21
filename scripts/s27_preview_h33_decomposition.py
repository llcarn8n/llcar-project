"""Превью декомпозиции src_dir → model/gen для всех 424 H3.3 строк.

Показывает что мой авто-скрипт сгенерирует для каждой пары brand/src_dir
чтобы можно было глазами проверить сомнительные случаи перед apply.
"""
from __future__ import annotations
import io
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


sys.path.insert(0, str(Path(__file__).parent))
try:
    from s27_known_models import KNOWN_MODELS
except Exception:
    KNOWN_MODELS = {}

ROW_RE = re.compile(
    r"^\|\s*([a-z0-9_\-]+/[a-z0-9_\-]+)\s*\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*`([a-z_]+)`\s*\|",
    re.I,
)
YEAR_END_RE = re.compile(r"^(.+?)_(19|20)\d{2}(?:_[a-z0-9_]+)?$", re.I)
ROMAN_RE = re.compile(r"^(.+?)_(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3})(?:_[a-z0-9_]+)?$", re.I)
CODE_END_RE = re.compile(r"^(.+?)_([a-z]{1,4}\d{0,2}|mk\d|v\d)$", re.I)


def decompose(src_dir: str, brand: str = "") -> tuple[str, str, str]:
    """Return (model, gen, reason). Strip brand prefix and римские перед годом."""
    working = src_dir
    if brand and working.startswith(f"{brand}_"):
        working = working[len(brand) + 1:]

    # Look up в KNOWN_MODELS для этого brand — longest prefix match
    known = KNOWN_MODELS.get(brand, [])
    matched_known = None
    for k in known:
        if working == k or working.startswith(f"{k}_"):
            if not matched_known or len(k) > len(matched_known):
                matched_known = k
    if matched_known:
        if working == matched_known:
            return matched_known, f"{matched_known}_main", f"known-exact:{matched_known}"
        return matched_known, working, f"known-prefix:{matched_known}"

    # 1. Римские + год: clio_iii_2005 → (clio, clio_iii_2005)
    m = re.match(r"^([a-z0-9]{3,}(?:_[a-z0-9]+)*?)_(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3})_(19|20)\d{2}(?:_[a-z0-9_]+)?$", working, re.I)
    if m:
        return m.group(1), working, "roman+year"
    # 2. Год в конце
    m = YEAR_END_RE.match(working)
    if m:
        return m.group(1), working, "year-suffix"
    # 3. Римские в конце
    m = ROMAN_RE.match(working)
    if m and len(m.group(1)) >= 3:
        return m.group(1), working, "roman-suffix"
    # 4. Код в конце
    m = CODE_END_RE.match(working)
    if m and len(m.group(1)) >= 3:
        return m.group(1), working, "code-suffix"
    return working, f"{working}_main", "no-suffix"


def parse_top(s: str) -> tuple[str | None, str | None]:
    s = re.sub(r"\s*\([a-z_]+\)\s*$", "", s.strip(), flags=re.I)
    if s in ("—", "-", ""):
        return None, None
    if "/" in s:
        a, b = s.split("/", 1)
        return a.strip(), b.strip()
    return None, None


def main() -> int:
    triage = Path(".omc/research/s27-unmatched-triage.md")
    rows = []
    for ln in triage.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(ln)
        if not m:
            continue
        brand_src, size, top_cand, score, alt1, alt2, decision = m.groups()
        brand, src_dir = brand_src.split("/", 1)
        rows.append({
            "brand": brand,
            "src_dir": src_dir,
            "size": float(size),
            "top_cand": top_cand.strip(),
            "decision": decision.strip(),
        })

    preview_rows = []
    for r in rows:
        brand, src_dir = r["brand"], r["src_dir"]
        if r["decision"] in ("merge_with_existing", "review_merge"):
            top_model, top_gen = parse_top(r["top_cand"])
            if top_model and top_gen:
                model, gen, reason = top_model, top_gen, f"from top_cand ({r['decision']})"
            else:
                model, gen, reason = decompose(src_dir, brand)
        else:
            model, gen, reason = decompose(src_dir, brand)
        preview_rows.append({
            "brand": brand,
            "src_dir": src_dir,
            "decision": r["decision"],
            "size_mb": r["size"],
            "target_model": model,
            "target_gen": gen,
            "reason": reason,
            "top_cand": r["top_cand"],
        })

    # группируем по decision + размеру убыванию
    preview_rows.sort(key=lambda x: (x["decision"], -x["size_mb"]))

    out = Path(".omc/research/s27-h33-preview.md")
    lines = [
        "# S27 H3.3 — превью декомпозиции 424 unmatched src_dir → model/gen",
        "",
        "**Как читать:** если видишь странный `target_model` или `target_gen`,",
        "укажи мне конкретную строку с альтернативой (например `chery/tiggo_4_pro_2022`",
        "должно быть `model=tiggo_4_pro` но я вывел `model=tiggo`).",
        "",
        "**Правила автоматической декомпозиции:**",
        "- `_YYYY` в конце → модель = всё до года (`clio_iii_2005` → `clio_iii`/`clio_iii_2005`)",
        "- `_iii/_iv/_v/_vi` (римские) → модель = до римских",
        "- `_mk3/_v2` → модель = до mk/v кода",
        "- иначе → модель = весь slug, gen = `<slug>_main`",
        "- для `merge_*` с непустым top candidate — берём `<model>/<gen>` из triage",
        "",
    ]
    by_dec = {}
    for r in preview_rows:
        by_dec.setdefault(r["decision"], []).append(r)

    for decision, items in by_dec.items():
        lines.append(f"## {decision} ({len(items)})")
        lines.append("")
        lines.append("| brand | src_dir | size MB | target model | target gen | reason |")
        lines.append("|---|---|---:|---|---|---|")
        for r in items:
            lines.append(f"| {r['brand']} | {r['src_dir']} | {r['size_mb']:.1f} | `{r['target_model']}` | `{r['target_gen']}` | {r['reason']} |")
        lines.append("")

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"total rows: {len(preview_rows)}")
    from collections import Counter
    c = Counter(r["decision"] for r in preview_rows)
    for k, v in c.most_common():
        print(f"  {k}: {v}")
    print(f"out: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
