"""Management command: run batch correlation analysis.

Usage:
    python manage.py run_correlations --client_hash abc123
    python manage.py run_correlations --client_hash abc123 --minutes 60

Designed for cron:
    */30 * * * * cd /opt/llcar && python manage.py run_correlations --client_hash abc123
"""
from __future__ import annotations

import sys
import traceback

from django.core.management.base import BaseCommand, CommandError

from dashboard.diagnostic.correlation_runner import run_correlations
from dashboard.diagnostic.db import get_cursor


class Command(BaseCommand):
    help = "Run batch correlation analysis (accel + audio + OBD) for a client."

    def add_arguments(self, parser):
        parser.add_argument(
            "--client_hash",
            type=str,
            required=True,
            help="Client hash identifier (required).",
        )
        parser.add_argument(
            "--minutes",
            type=int,
            default=30,
            help="Look-back window in minutes (default: 30).",
        )

    def handle(self, *args, **options):
        client_hash = options["client_hash"]
        minutes = options["minutes"]

        self.stdout.write(
            f"Running correlations for client={client_hash}, window={minutes}min..."
        )

        try:
            with get_cursor() as cursor:
                result = run_correlations(cursor, client_hash, minutes)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Correlation run failed: {exc}"))
            self.stderr.write(traceback.format_exc())
            raise CommandError(f"Correlation analysis failed: {exc}") from exc

        windows_joined = result.get("windows_joined", 0)
        correlations_found = result.get("correlations_found", 0)
        results_list = result.get("results", [])

        self.stdout.write(
            f"Joined {windows_joined} windows, found {correlations_found} significant correlation(s)."
        )

        if results_list:
            self.stdout.write(self.style.SUCCESS("Significant correlations:"))
            for r in results_list:
                self.stdout.write(
                    f"  - {r['type']:25s}  r={r['r']:.3f}  "
                    f"points={r['points']:>5d}  hint={r['hint']}"
                )
        else:
            self.stdout.write(self.style.WARNING("No significant correlations detected."))

        self.stdout.write(self.style.SUCCESS("Done."))
