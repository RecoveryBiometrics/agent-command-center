---
name: Deploy Team
description: Deploy a team template (SEO Content, Directory, Podcast, OM Builder) to a business. Reads config from the business YAML, sets up execution, generates workflows.
user-invocable: true
---

# Deploy Team

You are deploying an agent team to a business. This means taking a Team Template and wiring it up to run for a specific business using the shared pipeline code.

## When to use this skill
- User says /deploy-team or wants to add a pipeline/team to a business
- User says "clone the SEO team to [business]" or "set up podcast for [business]"

## Architecture
- **Business config** lives in `~/Projects/agent-command-center/businesses/{slug}.yaml`
- **Pipeline code** lives in `~/Projects/agent-command-center/pipelines/{pipeline-name}/`
- **Business project** holds content data (articles, listings, podcasts) — NOT pipeline code
- Pipelines run with `--business {slug}` and load all config from the YAML

## Available Team Templates

1. **SEO Content Team** → pipeline: `pipelines/seo-content/`
   - 6 roles: Researcher → Fact Checker → Copywriter → Fact Checker → SEO Auditor → Engineer
   - YAML needs: brand, service_areas, content, slack sections filled in
   - YAML needs: `tracking_sheet_id` — article changes are logged to Google Sheet "SEO Changelog" tab

2. **Directory Team** → pipeline: `pipelines/directory/` (when shared)
   - 4 roles: Discoverer → Verifier → Quality Auditor → Places Enricher
   - YAML needs: directory section filled in

3. **SEO Reporting Team** → pipeline: `pipelines/seo-reporting/` (when shared)
   - 4 roles: GSC Fetcher → Indexing Inspector → SEO Analyst → Keyword Miner
   - YAML needs: seo section filled in
   - YAML needs: `tracking_sheet_id` — reads "SEO Changelog" tab to connect ranking changes to content updates (falls back to SEO-CHANGELOG.md)

4. **Content Production Team** → currently at `~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/`
   - 10+ roles: Full podcast + multi-language blog pipeline
   - Includes: English blog (`5-blog.py`), India blog (`6-india-blog.py`), Spanish blog (`7-spanish-blog.py`)
   - SEO optimizer (`8-seo-optimizer.py`), analytics (`analytics.py`), GSC topics (`gsc-topics.py`)
   - YAML needs: podcast, blog, india_blog (if applicable) sections filled in
   - Currently runs on IONOS VPS via systemd (not GitHub Actions)
   - Blog language variants are separate scripts — each writes natively, not translations

5. **Analytics Team** → pipeline: `pipelines/analytics/`
   - 7 roles: GA4 Collector → Trend Detector → Insight Generator → Fact Checker → Recommender → Executor → Reporter
   - YAML needs: `analytics` section with `ga4_property_id`, `conversion_events`, `dispatch_targets`
   - YAML needs: `tracking_sheet_id` — writes to Analytics + Active TODOs tabs
   - Service account needs Viewer access on the GA4 property
   - Analytics Data API + Sheets API must be enabled on the GCloud project

6. **OM Builder Team** → currently at `~/Projects/hatch-investments/om-builder/`
   - 3 roles: County Scraper → OM Generator → PDF Builder
   - Deployed on Render (free tier)
   - See /om-builder skill for full details

## Standard Tracker Sheet (every business)

When deploying any team, ensure the business has a tracker sheet with all 8 tabs:
1. **SEO Changelog** — content pipeline writes
2. **Analytics** — analytics pipeline writes
3. **Active TODOs** — analytics + seo-reporting write
4. **Build Queue** — ideas/things to build
5. **Directory Log** — directory pipeline writes
6. **Weekly SEO Report** — seo-reporting pipeline writes
7. **Costs** — track actuals
8. **Dispatch** — analytics writes instructions, other pipelines read and consume

Create with `google-workspace` MCP → `create_spreadsheet`, share with `safebath-seo@gen-lang-client-0592529269.iam.gserviceaccount.com` as Editor, add `tracking_sheet_id` to the YAML.

## Deployment Steps

### Step 1: Read the business YAML
```
Read ~/Projects/agent-command-center/businesses/{slug}.yaml
```
Check what's already configured. If sections are missing for the requested team, ask the user to fill them in (or fill them in together).

### Step 2: Add team to YAML
Add the team entry to the business YAML's `teams:` section:
```yaml
teams:
  - template: seo-content-team
    instance_id: {slug}-seo
    runs_on: GitHub Actions
    schedule: "Daily, 6:00 AM ET"
    status: scheduled
```

### Step 3: Set up execution
**For GitHub Actions:**
Create a workflow YAML in the business project that checks out the shared pipeline:
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/checkout@v4
    with:
      repository: RecoveryBiometrics/agent-command-center
      path: .shared-pipeline
      sparse-checkout: |
        pipelines/{pipeline-name}
        businesses
  - run: npm install
    working-directory: .shared-pipeline/pipelines/{pipeline-name}
  - run: node index.js --business {slug}
    working-directory: .shared-pipeline/pipelines/{pipeline-name}
    env:
      BUSINESS_PROJECT_PATH: ${{ github.workspace }}
```

**For VPS:** Set up systemd service that runs the shared pipeline with `--business {slug}`.

**For local:** Run directly: `node ~/Projects/agent-command-center/pipelines/{pipeline}/index.js --business {slug}`

### Step 4: Set up Slack
- **Internal linking is REQUIRED** for any team with a blog/site build step
- **Weekly Slack report is REQUIRED** for every project
- **Slack webhook/bot setup:**
  1. Use the existing org-wide Slack app (api.slack.com/apps)
  2. Add webhook for the project's channel
  3. For VPS: add `SLACK_BOT_TOKEN` to `.env`
  4. For GitHub Actions: add as repo secret
  5. Never create a new Slack app per project

### Step 4b: Set up blog language variants (podcast team only)
If the business needs multi-language blogs:
- **India blog:** Add `india_blog` section to YAML with pricing in INR, payment methods (Razorpay/PayU/UPI), target cities, compliance (DPDP Act)
- **Spanish blog:** Add `spanish_blog` section to YAML with LatAm payment methods (MercadoPago), target markets, cultural context
- Each language variant is a separate Python script that writes natively — NOT a translation layer
- Scripts auto-generate new topics when pending list < 10 (from GSC data)

### Step 4c: Deploy failure alerts (Vercel-hosted businesses only)

Required for any business deploying via Vercel (safebath, power-to-the-people, GHL, etc.). Two redundant paths so we don't repeat the April 2026 `seo-agent@reiamplifi.com` incident where Vercel blocks silently emailed into Bill's inbox for three weeks.

Both paths post to Slack `#ops-log` (channel ID `C0AQG0DP222`, shared across businesses).

1. **Copy the alert workflow into the new repo.** Canonical copy lives in `RecoveryBiometrics/safebath-website/.github/workflows/deploy-failure-alert.yml`. It listens to GitHub's `deployment_status` event and posts on state `failure` or `error`. Verify the new repo has `SLACK_BOT_TOKEN` in secrets (repo → Settings → Secrets and variables → Actions). No code changes needed to the workflow — channel ID is hardcoded to `#ops-log`.

2. **Subscribe Vercel's native Slack app.** In Slack `#ops-log`, run `/vercel subscribe` and pick:
   - Team: `recoverybiometrics-projects`
   - Project: the new business's Vercel project
   - Events: **Deployment Errored** only (skip Ready/Promoted noise)
   - Targets: **Production** only (skip Preview noise)

   This step is an OAuth-style dialog Bill clicks through in Slack — you can't do it via API. After copying the workflow file in step 1, tell Bill: "Run `/vercel subscribe` in #ops-log for the new project — Deployment Errored, Production only."

See `project_deploy_failure_alerting.md` memory for background.

### Step 5: Set up secrets
Ensure the business project has the required API keys:
- GitHub Actions: add as repository secrets (check YAML `secrets:` section for names)
- VPS: add to `.env` file
- The YAML lists secret NAMES, never values

### Step 6: Test
Run the pipeline manually: `node index.js --business {slug}`
Compare output to expectations. Verify content writes to the right directory.

### Step 7: Push and go live
```bash
# Push YAML update (dashboard auto-updates)
cd ~/Projects/agent-command-center
git add businesses/{slug}.yaml
git commit -m "Deploy {team-name} to {business-name}"
git push

# Push workflow to business repo
cd ~/[business-project]
git add .github/workflows/
git commit -m "Add {team-name} workflow (shared pipeline)"
git push
```

## Key Rules
- NEVER copy pipeline code into the business project — use the shared pipeline
- NEVER hand-edit workforce.ts — it auto-generates from YAMLs
- ALWAYS read the business YAML first — it has all the config you need
- ALWAYS test locally before enabling the schedule
