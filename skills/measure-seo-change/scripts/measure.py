"""
measure.py — Deterministic GSC fetch + delta math + outcome judgment.

This script does ONE thing per invocation: take a baseline (logged when the
SEO change shipped) and a page slug, fetch the current 28-day GSC numbers,
compute deltas, apply threshold rules, return result as JSON to stdout.

Sheet I/O is NOT this script's job — the skill handles that via MCP. Keeping
this script pure makes it composable: today the skill calls it; tomorrow a
GitHub Actions cron can call it; the next day a different skill could call it
for a different sheet schema.

Usage:
  python3 measure.py \\
    --slug gohighlevel-pricing-plans-2026-complete-guide \\
    --action internal_link_retrofit \\
    --baseline-position 36.4 \\
    --baseline-impressions 470 \\
    --baseline-ctr 0.0

Output (stdout, single-line JSON):
  {"slug": "...", "outcome": "win" | "loss" | "neutral" | "inconclusive — ...",
   "deltas": {"pos_before": ..., "pos_after": ..., "pos_change": ..., ...},
   "current": {"impressions": ..., "ctr": ..., "position": ...}}

Auth (GSC only):
  Reads ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/token-gsc.json
  (already authenticated, refreshes on use)

Exit codes:
  0 — success, valid JSON on stdout
  2 — GSC fetch failed (token expired, network error)
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

POD_BASE = Path.home() / "Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline"
GSC_TOKEN = POD_BASE / "token-gsc.json"
GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

# Threshold rules — must match references/thresholds.md
THRESHOLDS = {
    "Meta rewrite": {
        "win": lambda d: d["ctr_rel_change"] >= 0.30 and abs(d["pos_drift"]) < 5,
        "loss": lambda d: d["ctr_rel_change"] <= -0.20,
        "auto_rollback": True,
    },
    "internal_link_retrofit": {
        "win": lambda d: (
            d["pos_change"] >= 5 or
            (d["pos_after"] is not None and d["pos_after"] <= 10 and d["pos_before"] > 10) or
            d["impr_rel_change"] >= 0.50
        ),
        "loss": lambda d: d["pos_change"] <= -3 and d["impr_rel_change"] <= -0.20,
        "auto_rollback": False,
    },
    "expand_content": {
        "win": lambda d: d["impr_rel_change"] >= 0.40 and d["pos_change"] >= 0,
        "loss": lambda d: d["impr_rel_change"] <= -0.20 and d["pos_change"] < 0,
        "auto_rollback": False,
    },
}


def get_gsc_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    if not GSC_TOKEN.exists():
        print(json.dumps({"error": f"GSC token not found at {GSC_TOKEN}"}), file=sys.stderr)
        sys.exit(2)
    creds = Credentials.from_authorized_user_file(str(GSC_TOKEN), GSC_SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def fetch_gsc_28d(gsc, site_url: str, page_url: str) -> dict:
    """Pull 28-day totals for one URL. Window ends 3 days ago for GSC lag."""
    end = (datetime.now() - timedelta(days=3)).date().isoformat()
    start = (datetime.now() - timedelta(days=31)).date().isoformat()
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": ["page"],
        "dimensionFilterGroups": [{"filters": [
            {"dimension": "page", "operator": "equals", "expression": page_url}
        ]}],
        "rowLimit": 1,
    }
    resp = gsc.searchanalytics().query(siteUrl=site_url, body=body).execute()
    rows = resp.get("rows", [])
    if not rows:
        return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": None}
    r = rows[0]
    return {
        "clicks": r.get("clicks", 0),
        "impressions": r.get("impressions", 0),
        "ctr": round(r.get("ctr", 0) * 100, 2),
        "position": round(r.get("position", 0), 1),
    }


def compute_deltas(baseline: dict, current: dict) -> dict:
    """Return relative + absolute changes between baseline and current."""
    pos_before = float(baseline.get("position") or 0)
    pos_after = current["position"] if current["position"] is not None else pos_before
    impr_before = float(baseline.get("impressions") or 0)
    impr_after = current["impressions"]
    ctr_before = float(baseline.get("ctr") or 0)
    ctr_after = current["ctr"]

    return {
        "pos_before": pos_before,
        "pos_after": pos_after,
        # pos_change: positive = improved (lower position number is better)
        "pos_change": round(pos_before - pos_after, 1),
        "pos_drift": round(abs(pos_before - pos_after), 1),
        "impr_before": int(impr_before),
        "impr_after": impr_after,
        "impr_rel_change": round((impr_after - impr_before) / impr_before, 3) if impr_before > 0 else 0,
        "ctr_before": ctr_before,
        "ctr_after": ctr_after,
        "ctr_rel_change": round((ctr_after - ctr_before) / ctr_before, 3) if ctr_before > 0 else 0,
    }


def judge(action: str, deltas: dict) -> str:
    """Apply threshold table → return outcome string."""
    # Action strings in the Sheet often have suffixes — match by prefix
    key = None
    for k in THRESHOLDS:
        if action.startswith(k):
            key = k
            break
    if key is None:
        return f"skipped — unknown action: {action[:60]}"
    rules = THRESHOLDS[key]
    if rules["win"](deltas):
        # Confound check: snippet rewrite with major position drift = inconclusive
        if key == "Meta rewrite" and deltas["pos_drift"] >= 5:
            return f"inconclusive — position drift {deltas['pos_drift']:+.1f}"
        return "win"
    if rules["loss"](deltas):
        return "loss"
    return "neutral"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--slug", required=True, help="Bare slug, e.g. gohighlevel-pricing-plans-2026-complete-guide")
    p.add_argument("--action", required=True, help="Action type from Sheet — full string OK, prefix match used")
    p.add_argument("--baseline-position", type=float, required=True)
    p.add_argument("--baseline-impressions", type=float, required=True)
    p.add_argument("--baseline-ctr", type=float, required=True, help="As percentage, e.g. 0.5 for 0.5%%")
    p.add_argument("--site", default="sc-domain:globalhighlevel.com")
    p.add_argument("--page-prefix", default="/blog/", help="Path prefix for slug → URL")
    p.add_argument("--domain", default="globalhighlevel.com", help="For building full URL")
    args = p.parse_args()

    page_url = f"https://{args.domain}{args.page_prefix}{args.slug}/"
    baseline = {
        "position": args.baseline_position,
        "impressions": args.baseline_impressions,
        "ctr": args.baseline_ctr,
    }

    gsc = get_gsc_service()
    try:
        current = fetch_gsc_28d(gsc, args.site, page_url)
    except Exception as e:
        print(json.dumps({"error": f"GSC fetch failed: {e}", "page_url": page_url}), file=sys.stderr)
        sys.exit(2)

    deltas = compute_deltas(baseline, current)
    outcome = judge(args.action, deltas)

    result = {
        "slug": args.slug,
        "page_url": page_url,
        "action": args.action,
        "outcome": outcome,
        "current": current,
        "deltas": deltas,
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
