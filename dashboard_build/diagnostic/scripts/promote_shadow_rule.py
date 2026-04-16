#!/usr/bin/env python3
"""promote_shadow_rule — переводит shadow-правило в production.

Выполняет три операции:
  1. Вычисляет метрики через shadow_metrics_view.
  2. Если все три критерия промоушна выполнены (precision≥0.6, FPR<0.15,
     lead_days≥7 если указан parent_rule) — снимает shadow_mode:true.
  3. Логирует результат в stderr и выводит diff для PR-ревью.

Поддерживает два формата хранения правил:
  JSON (threshold_rules.json / shadow_rules.json) — меняет флаг shadow_mode.
  Python (complex_rules.py)                      — меняет _make_result(..., shadow_mode=True)
                                                   на shadow_mode=False (по имени правила).

CLI:
    python -m diagnostic.scripts.promote_shadow_rule \\
        --rule-name order_2x_imbalance_l4 \\
        [--parent-rule engine_mount_harmonic_order_hz] \\
        [--window-days 30] \\
        [--min-we 40.0] \\
        [--dry-run] \\
        [--force]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


def _repo_root() -> Path:
    # diagnostic/scripts/promote_shadow_rule.py → dashboard_build/
    return Path(__file__).resolve().parents[2]


JSON_RULES = [
    Path("diagnostic") / "rules" / "threshold_rules.json",
    Path("diagnostic") / "rules" / "shadow_rules.json",
]
PY_RULES = Path("diagnostic") / "rules" / "complex_rules.py"


def _load_json(path: Path) -> Optional[dict]:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _find_rule_json(
    rule_name: str,
) -> Tuple[Optional[Path], Optional[dict], Optional[int]]:
    """Находит правило в одном из JSON-файлов. Возвращает (path, data, index)."""
    root = _repo_root()
    for rel in JSON_RULES:
        path = root / rel
        data = _load_json(path)
        if data is None:
            continue
        rules = data.get("rules", [])
        for i, r in enumerate(rules):
            if r.get("name") == rule_name:
                return path, data, i
    return None, None, None


def _promote_json(
    rule_name: str, dry_run: bool
) -> Tuple[bool, str]:
    path, data, idx = _find_rule_json(rule_name)
    if data is None or idx is None:
        return False, f"rule {rule_name!r} not found in JSON rules"
    rule = data["rules"][idx]
    if not rule.get("shadow_mode", False):
        return False, f"rule {rule_name!r} is already production (shadow_mode=false)"
    rule["shadow_mode"] = False
    diff = (
        f"{path.name}:rules[{idx}].shadow_mode: true -> false "
        f"(rule={rule_name}, tier={rule.get('tier')})"
    )
    if not dry_run:
        _save_json(path, data)
    return True, diff


_NAME_RE_TMPL = r'name\s*=\s*"{}"'
_SHADOW_TRUE_RE = re.compile(r'(shadow_mode\s*=\s*)True')


def _promote_python(
    rule_name: str, dry_run: bool
) -> Tuple[bool, str]:
    """Построчный скан: ищем функцию-правило, содержащую name="<rule_name>",
    и в её теле меняем shadow_mode=True -> False.

    Границы функции: от `def rule_xxx(` (col 0 или отступ) до следующего
    `def ` на том же отступе или EOF. Работает надёжнее regex при наличии
    скобок в строковых литералах (например display="... (L4)").
    """
    path = _repo_root() / PY_RULES
    if not path.exists():
        return False, f"{PY_RULES} not found"
    source = path.read_text(encoding="utf-8")
    lines = source.splitlines(keepends=True)

    name_re = re.compile(_NAME_RE_TMPL.format(re.escape(rule_name)))

    # Находим блоки `def <name>(...):` по col-0
    def_indices = [i for i, ln in enumerate(lines) if ln.startswith("def ")]
    def_indices.append(len(lines))  # sentinel

    for k in range(len(def_indices) - 1):
        start = def_indices[k]
        end = def_indices[k + 1]
        block = "".join(lines[start:end])
        if not name_re.search(block):
            continue
        if "shadow_mode=True" not in block and "shadow_mode = True" not in block:
            return False, (
                f"rule {rule_name!r} found in {PY_RULES.name} but already "
                f"shadow_mode=False (or shadow_mode absent)"
            )
        new_block, n = _SHADOW_TRUE_RE.subn(r"\1False", block, count=1)
        if n != 1:
            return False, (
                f"regex failed to replace shadow_mode=True for {rule_name!r}"
            )
        if not dry_run:
            lines[start:end] = [new_block]
            path.write_text("".join(lines), encoding="utf-8")
        return True, (
            f"{path.name}: rule {rule_name!r} shadow_mode=True -> False"
        )

    return False, (
        f"rule {rule_name!r} not found as shadow in {PY_RULES.name}"
    )


def promote(
    rule_name: str, dry_run: bool = False
) -> Tuple[bool, str]:
    """Пробуем JSON сначала, затем Python fallback."""
    ok, msg = _promote_json(rule_name, dry_run)
    if ok:
        return True, msg
    ok2, msg2 = _promote_python(rule_name, dry_run)
    if ok2:
        return True, msg2
    return False, f"{msg}; {msg2}"


def fetch_metrics(
    rule_name: str,
    window_days: int,
    min_we: float,
    parent_rule: Optional[str],
) -> Dict[str, Any]:
    """Вызывает shadow_metrics_view напрямую (без HTTP)."""
    sys.path.insert(0, str(_repo_root()))
    from diagnostic.api_views import _compute_shadow_metrics  # type: ignore
    from diagnostic.db import get_cursor                      # type: ignore

    with get_cursor() as cursor:
        metrics = _compute_shadow_metrics(
            cursor, rule_name, window_days, min_we, parent_rule
        )
    return metrics


def meets_promotion_criteria(
    metrics: Dict[str, Any], requires_lead: bool
) -> Tuple[bool, list]:
    """Возвращает (проходит, список причин если нет)."""
    reasons = []
    precision = metrics.get("precision_vs_eusama")
    fpr = metrics.get("clean_cohort_fpr")
    lead = metrics.get("median_lead_days")

    if precision is None or precision < 0.6:
        reasons.append(
            f"precision_vs_eusama={precision} < 0.6 (target)"
        )
    if fpr is None or fpr >= 0.15:
        reasons.append(f"clean_cohort_fpr={fpr} >= 0.15 (target <0.15)")
    if requires_lead and (lead is None or lead < 7):
        reasons.append(f"median_lead_days={lead} < 7 (target ≥7)")

    return not reasons, reasons


def main(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser(description="Промоушн shadow-правила в production.")
    p.add_argument("--rule-name", required=True, help="Имя shadow-правила")
    p.add_argument("--parent-rule", default=None,
                   help="Production-правило для расчёта time lead")
    p.add_argument("--window-days", type=int, default=30)
    p.add_argument("--min-we", type=float, default=40.0)
    p.add_argument("--dry-run", action="store_true",
                   help="Не писать в файлы, только показать что бы сделал")
    p.add_argument("--force", action="store_true",
                   help="Промоутить даже если критерии не выполнены (НЕ ИСПОЛЬЗОВАТЬ в CI)")
    p.add_argument("--skip-metrics", action="store_true",
                   help="Пропустить вызов метрик (только переключение флага)")
    args = p.parse_args(argv)

    if not args.skip_metrics:
        try:
            metrics = fetch_metrics(
                args.rule_name,
                args.window_days,
                args.min_we,
                args.parent_rule,
            )
        except Exception as e:
            print(f"[ERR] Не удалось получить метрики: {e}", file=sys.stderr)
            if not args.force:
                return 2
            metrics = {}

        print("[metrics]", file=sys.stderr)
        for k, v in sorted(metrics.items()):
            print(f"  {k}: {v}", file=sys.stderr)

        ok, reasons = meets_promotion_criteria(
            metrics, requires_lead=args.parent_rule is not None
        )
        if not ok and not args.force:
            print("[FAIL] Правило не готово к промоушну:", file=sys.stderr)
            for r in reasons:
                print(f"  - {r}", file=sys.stderr)
            print("Используй --force чтобы продолжить вопреки метрикам.",
                  file=sys.stderr)
            return 1

    ok, msg = promote(args.rule_name, dry_run=args.dry_run)
    if not ok:
        print(f"[ERR] {msg}", file=sys.stderr)
        return 3

    prefix = "[DRY-RUN] " if args.dry_run else "[OK] "
    print(f"{prefix}{msg}")
    return 0


if __name__ == "__main__":                           # pragma: no cover
    sys.exit(main())
