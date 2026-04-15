"""Verify DOI / SAE / standard / URL sources against real web services.

For each DOI: HEAD request to https://doi.org/{doi} — if redirects to publisher = valid.
For SAE papers: HEAD/GET https://www.sae.org/publications/technical-papers/content/{id}/
For URLs: direct fetch check.
For ISBN / ГОСТ / ISO — heuristic, can't fully verify offline; mark as needing manual check.

Output: docs/research/suspension-audio/_meta/sources-verified.json
"""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "docs" / "research" / "suspension-audio"
OUT = RESEARCH / "_meta" / "sources-verified.json"

UA = "Mozilla/5.0 (S20-verify/1.0) research"
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def head_check(url: str, timeout: float = 15) -> dict:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            final = r.geturl()
            return {
                "status": "ok" if 200 <= r.getcode() < 400 else f"http_{r.getcode()}",
                "code": r.getcode(),
                "final_url": final,
                "elapsed_sec": round(time.time() - t0, 2),
            }
    except urllib.error.HTTPError as e:
        return {"status": f"http_{e.code}", "code": e.code, "final_url": "", "elapsed_sec": round(time.time() - t0, 2)}
    except Exception as e:
        return {"status": "error", "error": str(e)[:200], "elapsed_sec": round(time.time() - t0, 2)}


def extract_doi(ref: str) -> str | None:
    m = re.search(r"10\.\d{4,}\S+", ref)
    if m:
        return m.group(0).rstrip(".,);]").split()[0]
    return None


def extract_sae(ref: str) -> str | None:
    # SAE paper numbers: 2019-01-1234, 890434, 2006-01-1080 etc
    m = re.search(r"\b(20\d{2}-\d{2}-\d{4}|\d{6})\b", ref)
    if m and "sae" in ref.lower():
        return m.group(1)
    return None


def collect_all_sources() -> dict[str, list]:
    """Return {ref: [topic_slugs]}."""
    by_ref = defaultdict(list)
    for raw_file in sorted(RESEARCH.glob("raw/iter*/batch-*.json")):
        try:
            d = json.loads(raw_file.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not d.get("parsed_ok") or not d.get("parsed"):
            continue
        topic = d["parsed"].get("topic_slug", raw_file.stem)
        for s in d["parsed"].get("sources", []):
            if not isinstance(s, dict):
                continue
            ref = (s.get("url_or_ref") or "").strip()
            if ref:
                by_ref[ref].append(topic)
        for claim in d["parsed"].get("claims", []):
            if not isinstance(claim, dict):
                continue
            for cite in claim.get("citations") or []:
                if isinstance(cite, str) and cite.strip():
                    by_ref[cite.strip()].append(topic)
    return {k: sorted(set(v)) for k, v in by_ref.items()}


def main() -> None:
    all_refs = collect_all_sources()
    print(f"Total unique refs: {len(all_refs)}")
    # build verification tasks
    doi_set: dict[str, str] = {}  # doi → original_ref
    sae_set: dict[str, str] = {}
    url_set: dict[str, str] = {}
    other_set: list[str] = []
    for ref in all_refs:
        doi = extract_doi(ref)
        if doi:
            doi_set[doi] = ref
            continue
        sae = extract_sae(ref)
        if sae:
            sae_set[sae] = ref
            continue
        if ref.startswith(("http://", "https://")):
            url_set[ref] = ref
            continue
        other_set.append(ref)

    print(f"  DOI: {len(doi_set)}, SAE: {len(sae_set)}, URL: {len(url_set)}, other: {len(other_set)}")
    results = {"doi": {}, "sae": {}, "url": {}, "other_unverifiable": {}}

    # DOI via doi.org resolver
    print("\nVerifying DOIs via doi.org ...")
    for doi, orig in doi_set.items():
        r = head_check(f"https://doi.org/{doi}", timeout=20)
        r["ref"] = orig
        r["used_in"] = all_refs[orig]
        results["doi"][doi] = r
        tag = "✓" if r["status"] == "ok" else "✗"
        print(f"  {tag} {doi[:50]} → {r['status']}")

    # SAE via sae.org paper landing
    print("\nVerifying SAE papers via sae.org ...")
    for sae_id, orig in sae_set.items():
        r = head_check(f"https://www.sae.org/publications/technical-papers/content/{sae_id}/", timeout=20)
        r["ref"] = orig
        r["used_in"] = all_refs[orig]
        results["sae"][sae_id] = r
        tag = "✓" if r["status"] == "ok" else "✗"
        print(f"  {tag} SAE {sae_id} → {r['status']}")

    # URLs
    print("\nVerifying URLs ...")
    for url, orig in url_set.items():
        r = head_check(url, timeout=15)
        r["ref"] = orig
        r["used_in"] = all_refs[orig]
        results["url"][url] = r
        tag = "✓" if r["status"] == "ok" else "✗"
        print(f"  {tag} {url[:80]} → {r['status']}")

    # Others: catalog but mark unverifiable via HTTP
    for ref in other_set:
        results["other_unverifiable"][ref] = {"used_in": all_refs[ref]}

    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    # summary
    doi_ok = sum(1 for v in results["doi"].values() if v["status"] == "ok")
    sae_ok = sum(1 for v in results["sae"].values() if v["status"] == "ok")
    url_ok = sum(1 for v in results["url"].values() if v["status"] == "ok")
    print(f"\nSUMMARY:")
    print(f"  DOI: {doi_ok}/{len(results['doi'])} verified")
    print(f"  SAE: {sae_ok}/{len(results['sae'])} verified")
    print(f"  URL: {url_ok}/{len(results['url'])} verified")
    print(f"  Other (ISBN/ГОСТ/ISO): {len(results['other_unverifiable'])} need manual check")
    print(f"\nOutput: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
