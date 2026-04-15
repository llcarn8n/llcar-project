#!/usr/bin/env python3
"""Apply GLM verifier findings — remove records marked as 'wrong'."""
from __future__ import annotations
import io, json, sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def main():
    findings_dir = Path(".omc/state/s18-verifier-findings").resolve()
    kb = Path("llcar-dashboard/public/data/kb").resolve()

    wrong_ids: set[str] = set()
    sus_ids: set[str] = set()
    total_verdicts = 0
    parsed_files = 0
    for fp in sorted(findings_dir.glob("batch_*.json")):
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        parsed_files += 1
        for v in data:
            if not isinstance(v, dict):
                continue
            total_verdicts += 1
            sid = str(v.get("id", "")).lower()
            st = v.get("status", "")
            if not sid:
                continue
            if st == "wrong":
                wrong_ids.add(sid)
            elif st == "suspect":
                sus_ids.add(sid)

    print(f"Findings: {parsed_files} batches, {total_verdicts} verdicts")
    print(f"wrong={len(wrong_ids)}, suspect={len(sus_ids)}")

    stripped = 0
    touched_files = 0
    for sp in kb.rglob("situations.json"):
        try:
            data = json.loads(sp.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        before = len(data)
        filtered = [s for s in data if isinstance(s, dict) and str(s.get("id", "")).lower() not in wrong_ids]
        if len(filtered) < before:
            sp.write_text(json.dumps(filtered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            stripped += before - len(filtered)
            touched_files += 1

    print(f"Stripped {stripped} wrong records from {touched_files} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
