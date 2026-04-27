"""
measure_all.py — Cron orchestrator for /measure-seo-change.

Runs weekly via GitHub Actions. Reads the SEO Changelog Sheet, finds rows past
their 28-day window with empty Outcome, calls measure.py logic for each,
writes Outcome back to the Sheet, posts a summary to Slack.

This is the AUTONOMOUS path. The skill's SKILL.md describes the same flow
for ad-hoc local invocation; this script is the unattended cron version.

Auth (env vars, all populated by GitHub Actions secrets):
  GOOGLE_SERVICE_ACCOUNT_KEY  — JSON service account key with Sheets API access
  GOOGLE_OAUTH_CREDENTIALS    — JSON OAuth token (token-gsc.json contents) for GSC
  SLACK_BOT_TOKEN             — bot token for posting to #ceo
  TRACKING_SHEET_ID           — SEO Changelog Sheet ID (overrides default)
  GSC_SITE_URL                — sc-domain:globalhighlevel.com (overrides default)
  SLACK_CHANNEL_ID            — C0AQAHSQK38 = #ceo (overrides default)

Usage:
  python3 measure_all.py --dry-run   # compute outcomes, log, do not write Sheet or Slack
  python3 measure_all.py             # full run

Exit codes:
  0 — success (any number of rows measured, including 0)
  1 — config error (missing required env var)
  2 — Sheet read failed
  3 — partial failure (some rows measured, some failed; Slack still posted)
"""

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Import deterministic helpers from sibling measure.py
sys.path.insert(0, str(Path(__file__).parent))
from measure import fetch_gsc_28d, compute_deltas, judge

# Defaults — override via env
DEFAULT_SHEET_ID = "1rK5UjtCeuzwwqIRE7GxC39_b3-10dSogUyxfe_Ycc0o"
DEFAULT_SITE = "sc-domain:globalhighlevel.com"
DEFAULT_SLACK_CHANNEL = "C0AQAHSQK38"  # #ceo
SOAK_DAYS = 28


def env(name: str, default: str = None, required: bool = False) -> str:
    val = os.getenv(name, default)
    if required and not val:
        print(f"ERROR: required env var {name} not set", file=sys.stderr)
        sys.exit(1)
    return val


def get_gsc_service_from_env():
    """Load GSC service from GOOGLE_OAUTH_CREDENTIALS env var (cron context)."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    oauth_json = env("GOOGLE_OAUTH_CREDENTIALS", required=True)
    # Write to temp file (Credentials API wants a file path)
    tf = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    tf.write(oauth_json)
    tf.close()
    try:
        creds = Credentials.from_authorized_user_file(
            tf.name, ["https://www.googleapis.com/auth/webmasters.readonly"]
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    finally:
        os.unlink(tf.name)


def get_sheets_service_from_env():
    """Load Sheets service from GOOGLE_SERVICE_ACCOUNT_KEY env var."""
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    sa_json = env("GOOGLE_SERVICE_ACCOUNT_KEY", required=True)
    info = json.loads(sa_json)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def discover_ready_rows(sheets, sheet_id: str) -> list:
    """Return list of (row_index, row_dict) tuples ready to measure."""
    resp = sheets.spreadsheets().values().get(
        spreadsheetId=sheet_id,
        range="Changelog!A2:P1000",
    ).execute()
    rows = resp.get("values", [])
    today = datetime.now(timezone.utc).date()
    cutoff = today - timedelta(days=SOAK_DAYS)

    ready = []
    earliest_unmeasured = None
    for i, r in enumerate(rows, start=2):
        r = (r + [""] * 16)[:16]
        date_str, business, slug, action = r[0], r[1], r[2], r[3]
        position_before, impressions_before, ctr_before = r[5], r[6], r[7]
        outcome = r[15]
        if not date_str or not slug or not action:
            continue
        try:
            row_date = datetime.fromisoformat(date_str).date()
        except (ValueError, TypeError):
            continue
        if outcome:
            continue  # already measured
        # Track earliest unmeasured for "next batch in N days" report
        if earliest_unmeasured is None or row_date < earliest_unmeasured:
            earliest_unmeasured = row_date
        if row_date > cutoff:
            continue  # not yet 28 days old
        ready.append((i, {
            "date": date_str, "business": business, "slug": slug, "action": action,
            "position": position_before, "impressions": impressions_before, "ctr": ctr_before,
        }))
    return ready, earliest_unmeasured


def measure_row(gsc, site: str, row: dict) -> dict:
    """Return result dict for one row: {outcome, deltas, current}."""
    page_url = f"https://{site.replace('sc-domain:', '')}/blog/{row['slug']}/"
    try:
        current = fetch_gsc_28d(gsc, site, page_url)
    except Exception as e:
        return {"error": f"GSC fetch failed: {e}", "outcome": "skipped — GSC error"}
    baseline = {
        "position": row["position"] or 0,
        "impressions": row["impressions"] or 0,
        "ctr": row["ctr"] or 0,
    }
    deltas = compute_deltas(baseline, current)
    outcome = judge(row["action"], deltas)
    return {"outcome": outcome, "deltas": deltas, "current": current}


def write_outcome(sheets, sheet_id: str, row_index: int, deltas: dict, outcome: str):
    """Write columns N (Position 28d), O (CTR % 28d), P (Outcome)."""
    pos_after = str(deltas["pos_after"]) if deltas.get("pos_after") is not None else ""
    ctr_after = str(deltas["ctr_after"]) if deltas.get("ctr_after") is not None else ""
    sheets.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=f"Changelog!N{row_index}:P{row_index}",
        valueInputOption="USER_ENTERED",
        body={"values": [[pos_after, ctr_after, outcome]]},
    ).execute()


def post_slack(channel: str, text: str):
    """POST to Slack chat.postMessage."""
    import urllib.request
    import urllib.error
    token = env("SLACK_BOT_TOKEN", required=True)
    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=json.dumps({"channel": channel, "text": text}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = json.loads(resp.read())
    if not body.get("ok"):
        raise RuntimeError(f"Slack post failed: {body}")
    return body


def format_summary(results: list, ready_count: int, earliest_unmeasured) -> str:
    """Return Slack-ready summary string. Phone-readable."""
    if ready_count == 0:
        if earliest_unmeasured is None:
            return "Weekly SEO measurement: 0 rows ready, no unmeasured rows in Sheet."
        days_until = (earliest_unmeasured - datetime.now(timezone.utc).date()).days + SOAK_DAYS
        target_date = earliest_unmeasured + timedelta(days=SOAK_DAYS)
        return (
            f"Weekly SEO measurement: 0 rows ready. "
            f"Earliest unmeasured row hits day-{SOAK_DAYS} on {target_date.isoformat()} "
            f"(in {days_until} days)."
        )
    by_outcome = {"win": [], "loss": [], "neutral": [], "skipped": [], "inconclusive": []}
    for r in results:
        bucket = r["outcome"].split(" ")[0] if isinstance(r["outcome"], str) else "skipped"
        by_outcome.setdefault(bucket, []).append(r)
    lines = [f"Weekly SEO measurement: {len(results)} rows measured."]
    for bucket in ("win", "loss", "neutral", "inconclusive", "skipped"):
        if by_outcome.get(bucket):
            slugs = ", ".join(r["slug"] for r in by_outcome[bucket][:5])
            extra = f" +{len(by_outcome[bucket]) - 5} more" if len(by_outcome[bucket]) > 5 else ""
            lines.append(f"  {bucket}: {len(by_outcome[bucket])} ({slugs}{extra})")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    sheet_id = env("TRACKING_SHEET_ID", DEFAULT_SHEET_ID)
    site = env("GSC_SITE_URL", DEFAULT_SITE)
    slack_channel = env("SLACK_CHANNEL_ID", DEFAULT_SLACK_CHANNEL)

    print(f"[measure_all] sheet={sheet_id[:12]}... site={site} channel={slack_channel} dry_run={args.dry_run}")

    # 1. Discover
    sheets = get_sheets_service_from_env()
    try:
        ready, earliest_unmeasured = discover_ready_rows(sheets, sheet_id)
    except Exception as e:
        print(f"ERROR: Sheet read failed: {e}", file=sys.stderr)
        sys.exit(2)
    print(f"[measure_all] {len(ready)} rows ready to measure")

    # 2. Measure each (zero-row case skips GSC entirely)
    results = []
    if ready:
        gsc = get_gsc_service_from_env()
        for row_idx, row_data in ready:
            r = measure_row(gsc, site, row_data)
            r["slug"] = row_data["slug"]
            r["action"] = row_data["action"]
            r["row_index"] = row_idx
            results.append(r)
            print(f"  row {row_idx} ({row_data['slug'][:50]}): {r['outcome']}")
            if not args.dry_run and "deltas" in r:
                try:
                    write_outcome(sheets, sheet_id, row_idx, r["deltas"], r["outcome"])
                except Exception as e:
                    print(f"    sheet write failed: {e}", file=sys.stderr)

    # 3. Post summary to Slack
    summary = format_summary(results, len(ready), earliest_unmeasured)
    print(f"[measure_all] summary:\n{summary}")
    if not args.dry_run:
        post_slack(slack_channel, summary)
        print("[measure_all] posted to Slack")

    print("[measure_all] done")


if __name__ == "__main__":
    main()
