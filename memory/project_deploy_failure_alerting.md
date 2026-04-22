---
name: Deploy failure alerting routes to #ops-log
description: Vercel deploy failures surface in Slack #ops-log via two redundant paths — native Vercel Slack app + GitHub Actions workflow backstop
type: project
originSessionId: 81259a9d-8888-4527-bf16-fcd8586109ed
---
Deploy failure alerts route to Slack channel `#ops-log` (ID `C0AQG0DP222`, shared across businesses) via two layers:

1. **Vercel native Slack app** — installed on `recoverybiometrics-projects` team 2026-04-21. Subscribed per-project to Deployment Errored, Production target only.
2. **`.github/workflows/deploy-failure-alert.yml`** — code-versioned backstop in each deploying repo. Listens to GitHub's `deployment_status` event, posts to #ops-log on state `failure` or `error` using `SLACK_BOT_TOKEN` secret.

**Why:** three weeks of Weekly SEO Report Vercel blocks (Apr 7/14/21) went unnoticed because failure notifications only emailed `bill@recoverybiometrics.com` and weren't triaged. Two redundant paths so a single uninstall/bad-config doesn't recreate the blind spot.

**How to apply:**
- When adding a new Vercel project (new client, new repo), do BOTH: (a) run `/vercel subscribe` in #ops-log, pick the project, check Deployment Errored + Production, (b) copy `deploy-failure-alert.yml` into the new repo's `.github/workflows/`.
- The alert workflow pattern should eventually live in the `deploy-team` skill so new business deploys get it automatically — not yet done as of 2026-04-21.
- `seo_agent_email: seo-agent@reiamplifi.com` in business YAML is a dead field (never provisioned as a real mailbox). Don't reuse that email in any new workflow; use `41898282+github-actions[bot]@users.noreply.github.com` for bot commits.
