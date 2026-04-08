#!/usr/bin/env python3
"""Validate production years in vehicles-ru.json."""

import json
import os
import sys
from datetime import datetime

CURRENT_YEAR = datetime.now().year


def validate_vehicles(vehicles_path: str) -> dict:
    """Validate all vehicle entries and return issues found.

    Expects the vehicles-ru.json format:
      { "brands": [ { "name": ..., "models": [ { "name": ..., "generations": [ { "ys": int, "ye": int|null, ... } ] } ] } ] }

    Returns dict with 'total' count and 'issues' dict keyed by issue type.
    """
    with open(vehicles_path, encoding="utf-8") as f:
        data = json.load(f)

    # Handle both list and dict formats; primary format has top-level "brands" key
    if isinstance(data, list):
        brands = data
    elif isinstance(data, dict):
        brands = data.get("brands", [])
    else:
        brands = []

    issues = {
        "future_start": [],  # ys > current year
        "inverted_range": [],  # ye < ys
        "null_years": [],  # missing ys (ye=None is ok — means still produced)
        "impossible_year": [],  # year < 1900 or > current+2
        "suspiciously_long": [],  # production span > 30 years
        "zero_span": [],  # ys == ye (only 1 calendar year — may be fine but worth flagging)
    }

    total = 0

    def check_entry(brand_name: str, model_name: str, gen_name: str, entry: dict):
        nonlocal total
        total += 1

        label = f"{brand_name} {model_name}"
        if gen_name:
            label += f" ({gen_name})"

        # Support both short (ys/ye) and long field names
        start = (
            entry.get("ys")
            or entry.get("production_start")
            or entry.get("year_start")
            or entry.get("start_year")
        )
        end = (
            entry.get("ye")
            or entry.get("production_end")
            or entry.get("year_end")
            or entry.get("end_year")
        )

        if start is None:
            issues["null_years"].append(label)
            return

        if start > CURRENT_YEAR + 1:
            issues["future_start"].append(f"{label}: start={start}")
        if start < 1900:
            issues["impossible_year"].append(f"{label}: start={start}")

        if end is not None:
            if end < 1900:
                issues["impossible_year"].append(f"{label}: end={end}")
            if end > CURRENT_YEAR + 2:
                issues["impossible_year"].append(f"{label}: end={end}")
            if end < start:
                issues["inverted_range"].append(f"{label}: {start}-{end}")
            elif end - start > 30:
                issues["suspiciously_long"].append(
                    f"{label}: {start}-{end} ({end - start}yr)"
                )
            elif start == end:
                issues["zero_span"].append(f"{label}: {start}-{end}")

    # Parse the brand→model→generation structure
    if isinstance(brands, list):
        for item in brands:
            brand = item.get("name", item.get("brand", ""))
            models = item.get("models", [])
            if isinstance(models, list):
                for model in models:
                    model_name = model.get("name", model.get("model", ""))
                    gens = model.get("generations", [])
                    if isinstance(gens, list) and gens:
                        for gen in gens:
                            gen_name = gen.get("name", gen.get("generation", ""))
                            check_entry(brand, model_name, gen_name, gen)
                    else:
                        # No generations — check the model itself
                        check_entry(brand, model_name, "", model)
    elif isinstance(brands, dict):
        for brand, models in brands.items():
            if isinstance(models, dict):
                for model_name, details in models.items():
                    check_entry(brand, model_name, "", details)

    return {"total": total, "issues": issues}


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "..", "..", "..")
    vehicles_path = os.path.join(
        project_root, "common files all models", "vehicles-ru.json"
    )

    if not os.path.exists(vehicles_path):
        print(f"ERROR: {vehicles_path} not found", file=sys.stderr)
        sys.exit(1)

    result = validate_vehicles(vehicles_path)

    print(f"Checked {result['total']} entries")
    print()
    for issue_type, entries in result["issues"].items():
        if entries:
            print(f"=== {issue_type} ({len(entries)}) ===")
            for e in entries[:20]:  # limit output
                print(f"  {e}")
            if len(entries) > 20:
                print(f"  ... and {len(entries) - 20} more")
            print()

    total_issues = sum(len(v) for v in result["issues"].values())
    print(f"Total issues: {total_issues}")
    return total_issues


if __name__ == "__main__":
    sys.exit(0 if main() == 0 else 1)
