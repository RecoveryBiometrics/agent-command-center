---
name: Pipeline Doctor
description: Analyze the latest pipeline run, diagnose what went wrong, fix it, and push. Works on GitHub Actions pipelines and IONOS VPS (systemd) pipelines.
user-invocable: true
---

# Pipeline Doctor

You are the Pipeline Doctor. Your job is to pull the latest pipeline run, analyze every step, diagnose failures, implement fixes, and push them — all in one shot.

## When to use this skill
- User says `/pipeline-doctor` or asks to check/fix/debug the daily pipeline
- User says "check the last run" or "what went wrong" or "fix the pipeline"
- User asks about email delivery, content failures, or agent errors

## Step-by-step process

### 1. IDENTIFY THE PROJECT AND PLATFORM
Determine which platform the pipeline runs on:

**GitHub Actions projects:**
- SafeBath website: `~/Developer/projects/safebath/website/` (daily content + directory)
- SafeBath SEO: `~/Developer/projects/safebath/seo/` (weekly SEO report)
- Check `.github/workflows/` for workflow files
- Get repo from `git remote -v`

**IONOS VPS projects (systemd):**
- GlobalHighLevel podcast: `~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/`
- VPS: 74.208.190.10, SSH key `~/.ssh/ionos_ghl`, user `williamcourterwelch`
- Service: `ghl-podcast` (systemd user unit)
- Working dir on VPS: `/home/williamcourterwelch/Claude_notebookLM_GHL_Podcast/ghl-podcast-pipeline`

**Render projects:**
- Hatch OM Builder: `~/Projects/hatch-investments/om-builder/`
- Health check: `curl -s https://om-builder.onrender.com/health`

### 2. PULL THE LATEST RUN

**GitHub Actions:**
```bash
gh run list --repo OWNER/REPO --limit 3
gh run view RUN_ID --repo OWNER/REPO --log
```

**VPS (systemd):**
```bash
# Check service status
ssh -i ~/.ssh/ionos_ghl williamcourterwelch@74.208.190.10 "systemctl --user status ghl-podcast"

# Check recent logs
ssh -i ~/.ssh/ionos_ghl williamcourterwelch@74.208.190.10 "tail -100 ~/Claude_notebookLM_GHL_Podcast/ghl-podcast-pipeline/logs/scheduler.log"
```

Or if logs are synced locally:
- Scheduler state: `logs/scheduler-state.json`
- Full log: `logs/scheduler.log`
- Published episodes: `data/published.json`

**Render:**
```bash
curl -s https://om-builder.onrender.com/health
```

### 3. ANALYZE EVERY STEP
For each step in the pipeline, check:
- Did it succeed or fail?
- If it failed, what was the error?
- If it succeeded, did it actually produce output? (e.g., "0 articles" is a failure even if exit code 0)
- Did the email send?
- Did any agent hit rate limits, auth errors, or API failures?

**VPS-specific checks:**
- Did NotebookLM auth expire? (check for auth/session errors in log)
- Did the scheduler complete the full cycle? (check scheduler-state.json for cycle timestamps)
- Were India/Spanish blogs generated? (check data/india-topics.json, data/spanish-topics.json counts)
- Did the SEO optimizer run this week? (VPS/podcast only: check data/seo-changelog.json)
- Did the SEO content pipeline log to Google Sheet? (GitHub Actions: check "SEO Changelog" tab in tracking sheet)
- Did the site build and deploy? (check for git push errors in log)

### 4. CATEGORIZE ISSUES
Put each issue into one of these buckets:

**CRITICAL (pipeline is broken):**
- Auth/API key failures
- NotebookLM session expired
- Missing dependencies
- Crashed steps
- systemd service not running

**DEGRADED (pipeline runs but produces nothing):**
- SEO audit too strict (blocking all content)
- Scrapers returning empty results
- Dedup too aggressive
- Email failing silently
- Topic lists exhausted (india-topics.json or spanish-topics.json empty)

**QUALITY (pipeline works but output is bad):**
- Data duplication across cities
- Email too long/unreadable
- Thin content passing quality checks
- Fake/unverified data slipping through
- Blog posts with American idioms in India/Spanish versions

### 5. FIX EACH ISSUE
- Read the relevant source file
- Implement the fix
- If the fix requires an API to be enabled, use gcloud or the relevant CLI
- If the fix requires an env var, check and set it

**VPS fixes require syncing:**
- Fix locally, test, then `scp` to VPS
- Or SSH in and fix directly, then pull changes back
- Restart service: `ssh ... "systemctl --user restart ghl-podcast"`

### 6. REPORT TO USER
Present findings as a table:

| Issue | Category | Fix | Status |
|---|---|---|---|
| SEO audit blocking short titles | DEGRADED | Auto-expand titles with city name prefix | FIXED |
| GSC API not enabled | CRITICAL | Enabled searchconsole.googleapis.com | FIXED |
| NotebookLM auth expired | CRITICAL | User needs to re-authenticate on VPS | NEEDS ACTION |

### 7. PUSH
Commit all fixes in one commit with a clear message explaining what was wrong and what was fixed.

For VPS: sync files to VPS and restart the service.

## Rules
- NEVER guess at what went wrong — always read the actual logs
- NEVER introduce new bugs while fixing old ones
- NEVER change pipeline behavior without explaining why
- If you can't fix something, say so clearly and explain what the user needs to do
- Always verify your fix logic against the actual error before pushing

## Common issues and fixes

### GitHub Actions issues

**"Excerpt too short" / "Title too short" blocking all articles**
The SEO auditor is too strict. Fix: auto-expand by prepending city name to titles, pulling first sentence from body for excerpts.

**"Invalid login" / SMTP failures**
Check if emails switched to Gmail API OAuth (`GOOGLE_OAUTH_CREDENTIALS` secret). If using SMTP, verify app password isn't expired.

**"The token does not have access to this location" from GHL**
GHL PIT tokens don't work from cloud IPs (Vercel, GitHub Actions). Use GHL inbound webhooks instead of API calls.

**"API has not been used in project"**
Enable the API: `gcloud services enable API_NAME --project=PROJECT_ID`

**Business appearing in every city**
Cross-city dedup not working. Check `engineer.js` globalSeenBusinesses limit. Regional businesses should appear in max 3 cities.

**Zero articles for multiple days**
Content pipeline is finding events but SEO audit is rejecting them. Check audit thresholds. Also check if event sources changed their HTML structure (scraper broke).

**Email sent but not received**
Check Gmail API token: `GOOGLE_OAUTH_CREDENTIALS` in GitHub secrets. Test locally with `node scripts/daily-email.js`. Check spam folder.

### VPS / Podcast pipeline issues

**NotebookLM auth expired**
Session at `~/.notebooklm/storage_state.json` expires ~every 2 weeks. User must re-authenticate interactively on the VPS. Cannot be fixed remotely.

**systemd service stopped**
Check: `systemctl --user status ghl-podcast`. Restart: `systemctl --user restart ghl-podcast`. Check journal: `journalctl --user -u ghl-podcast --since "1 hour ago"`.

**No India/Spanish blogs generated**
Check if topic lists are exhausted: `data/india-topics.json`, `data/spanish-topics.json`. If empty, GSC topics script should auto-replenish — check `gsc-topics.py` for errors.

**SEO optimizer not running (VPS/podcast pipeline)**
Check 7-day gate in `data/seo-changelog.json`. Last entry timestamp must be 7+ days ago before it runs again. 28-day cooldown per page. Note: this is the podcast SEO optimizer only. For the SEO content pipeline (GitHub Actions), check the Google Sheet "SEO Changelog" tab instead.

**Site build failed / didn't deploy**
Check for git push errors in scheduler.log. Common: merge conflicts if someone edited the site manually. Fix: pull on VPS, resolve, push.

**Transistor upload failed**
Check API key validity. Check if episode limit hit. Check `data/published.json` for recent upload errors.

**Affiliate links missing**
All GHL links must include `fp_ref=amplifi-technologies12`. Check blog output for bare GHL URLs.
