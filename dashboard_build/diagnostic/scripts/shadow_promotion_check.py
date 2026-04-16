"""S23 доработка: cron-скрипт автопроверки критериев A.35 promotion для shadow-правил.

Запускается раз в сутки (cron @daily), проверяет `/api/diagnostics/shadow-metrics/`
для всех активных shadow-правил и пишет сводку в /var/log/llcar/shadow_promotion_check.log.

При обнаружении `promotion_ready:true` — логирует INFO с командой для ручного запуска
`promote_shadow_rule.py --dry-run`. Автоматический промоушн НЕ делает (нужно подтверждение
человека: смотрим precision на ground-truth перед живым переключением).

Cron entry (webadmin@185.55.57.145):
    0 6 * * * /var/www/html/django/venv/bin/python -m diagnostic.scripts.shadow_promotion_check \\
        >> /var/log/llcar/shadow_promotion_check.log 2>&1
"""
from __future__ import annotations

import json
import logging
import sys
import urllib.request
from typing import Optional

SHADOW_RULES: list[tuple[str, Optional[str]]] = [
    ("spectral_kurtosis_impulsive_bearing", "wheel_bearing_bpfo_harmonic"),
    ("order_tracking_mount_wear_shadow", "engine_mount_wear"),
    ("phase_lag_shift_shadow", "damper_energy_decay_poor"),
    ("damping_bandwidth_wide_shadow", "damper_energy_decay_poor"),
    ("stand_import_eusama_boge_phase_hpbm_shadow", None),
    ("order_2x_imbalance_l4", None),
    ("order_05_misfire_diesel", None),
    ("knock_impulse_kurtogram_band", "knock_impulse_percussive"),
]

API_BASE = "https://127.0.0.1/api/diagnostics/shadow-metrics/"
WINDOW_DAYS = 30
TIMEOUT_SEC = 10


def fetch_metrics(rule_name: str, parent_rule: Optional[str]) -> Optional[dict]:
    """Fetch shadow-metrics для одного правила. Возвращает None при ошибке."""
    qs = f"rule_name={rule_name}&window_days={WINDOW_DAYS}"
    if parent_rule:
        qs += f"&parent_rule={parent_rule}"
    url = f"{API_BASE}?{qs}"
    ctx = _build_ssl_ctx()
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC, context=ctx) as r:
            if r.status != 200:
                logging.warning("HTTP %d для %s", r.status, rule_name)
                return None
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        logging.error("Fetch failed для %s: %s", rule_name, e)
        return None


def _build_ssl_ctx():
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    ready_count = 0
    for rule_name, parent_rule in SHADOW_RULES:
        metrics = fetch_metrics(rule_name, parent_rule)
        if metrics is None:
            continue
        triggers = metrics.get("trigger_count", 0)
        ready = metrics.get("promotion_ready", False)
        precision = metrics.get("precision_vs_eusama")
        fpr = metrics.get("clean_cohort_fpr")
        lead = metrics.get("median_lead_days")
        if ready:
            ready_count += 1
            logging.info(
                "READY %s (trig=%d precision=%s fpr=%s lead=%s). Промоушн: "
                "python -m diagnostic.scripts.promote_shadow_rule "
                "--rule-name %s %s--dry-run",
                rule_name, triggers, precision, fpr, lead,
                rule_name,
                f"--parent-rule {parent_rule} " if parent_rule else "",
            )
        else:
            logging.info(
                "WAIT %s (trig=%d precision=%s fpr=%s lead=%s)",
                rule_name, triggers, precision, fpr, lead,
            )
    logging.info("Total ready: %d / %d", ready_count, len(SHADOW_RULES))
    return 0


if __name__ == "__main__":
    sys.exit(main())
