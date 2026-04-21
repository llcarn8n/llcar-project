#!/usr/bin/env python3
"""S27 H3.1-fix — re-dig 34 оставшихся через Manual-title паттерн.

Первая строка victim.manual.md часто имеет вид:
    # Manual: bmw/3_series_f34 (1097 chunks)
где `f34` — кодовое имя поколения (Gran Turismo вариант).

Для каждого из 32 model==gen в репо:
 1. Извлечь suffix из `# Manual: <brand>/<model>_<SUFFIX>`
 2. Если suffix совпадает с одним из existing gens ИЛИ с частью gen slug (f34 vs f30_2012 → не совпадает, надо создать новое)
 3. Дать новое решение create:<model>_<suffix>_<year?> или merge_into:<matching_gen>
"""
from __future__ import annotations
import io
import json
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


TITLE_RE = re.compile(r"^#\s*Manual:\s*[a-z0-9_]+/[a-z0-9_]+_([a-z0-9]+)", re.I | re.M)
# также паттерн "bmw/x1_e84_restyled_..."
TITLE_MULTI_RE = re.compile(r"^#\s*Manual:\s*[a-z0-9_]+/[a-z0-9_]+_([a-z0-9_]+?)(?:\s|\(|_restyled|$)", re.I | re.M)


def main() -> int:
    kb = Path("llcar-dashboard/public/data/kb")
    rows = []
    for m in kb.rglob("manual.md"):
        parts = m.relative_to(kb).parts
        if len(parts) != 4 or parts[1] != parts[2]:
            continue
        brand, model, gen, _ = parts
        text = m.read_text(encoding="utf-8", errors="replace")[:500]
        match = TITLE_RE.search(text)
        suffix = match.group(1) if match else None

        mdir = kb / brand / model
        existing = []
        for g in sorted(mdir.iterdir()):
            if g.is_dir() and g.name != gen and not g.name.startswith((".", "_")):
                if (g / "manual.md").exists():
                    existing.append(g.name)

        # ищем совпадение suffix c existing gen slug
        match_gen = None
        if suffix:
            for eg in existing:
                # exact prefix match
                if eg == suffix:
                    match_gen = eg
                    break
                if eg.startswith(f"{suffix}_"):
                    match_gen = eg
                    break
                # e71 matches x6_e71_old etc.
                if f"_{suffix}_" in f"_{eg}_" or eg.endswith(f"_{suffix}"):
                    match_gen = eg
                    break

        decision = "still_review"
        target = None
        if suffix and match_gen:
            decision = f"merge_into:{match_gen}"
            target = match_gen
        elif suffix:
            decision = f"create:{model}_{suffix}"
            target = f"{model}_{suffix}"

        rows.append({
            "path": f"{brand}/{model}/{gen}",
            "existing": existing,
            "title_suffix": suffix,
            "decision": decision,
            "target": target,
        })

    # save jsonl
    out = Path(".omc/research/s27-title-codes-dig.jsonl")
    with out.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # print summary
    from collections import Counter
    c = Counter(r["decision"].split(":")[0] for r in rows)
    print(f"total: {len(rows)}")
    for k, v in c.most_common():
        print(f"  {k}: {v}")
    print()
    for r in sorted(rows, key=lambda x: (x["decision"], x["path"])):
        sfx = r["title_suffix"] or "-"
        print(f"  {r['path']:<45} suffix={sfx:<15} existing={r['existing']} → {r['decision']}")
    print(f"\njsonl → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
