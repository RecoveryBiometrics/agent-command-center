# Stage 1: Load

Gather everything the check stage needs: business config, git diff, tracker state.

## Inputs
- **Business ID** (required) — e.g., `safebath`, `ghl`, `hatch`
- **Summary** (required) — one-line human description of the change
- **Force flag** (optional) — `--force --force-reason "<text>"` to override BLOCK

## Process

### 1. Load business config
Read `~/Projects/agent-command-center/businesses/{businessId}.yaml`. Fail loudly if missing. Extract:
- `org.path` — repo path (e.g., `~/Developer/projects/safebath/website/`)
- `org.github` — github repo slug
- `tracking_sheet_id` — Google Sheet ID for tracker
- `slack.business_channel` — Slack channel ID for alerts
- `slack.ops_log_channel` — Slack channel ID for force-override alerts
- `seo.gsc_site_url` — optional, for future rules

### 2. Detect change set (git diff)
Run `git -C {org.path} diff --name-only origin/main...HEAD` to get list of changed files since main.

If run without a branch diff (e.g., on main about to push), use `git log --name-only -1 HEAD` for the last commit.

Fail if working directory is dirty (uncommitted changes) — gate runs against committed state.

### 3. Classify change type
Based on changed files, set `changeType`:
- **quality-fix** — ONLY changes to: JSX text content, markdown, FAQ data, service descriptions. NO changes to routing/config/constants.
- **structural** — Changes to: `next.config.ts` (redirects), `src/lib/constants.ts` (counties/locations), `sitemap.ts`, files that change `generateStaticParams()` return, route folder structure under `src/app/`
- **content** — New pages, wiki data, directory listings, blog articles
- **market-entry** — Adding new counties/cities to constants
- **market-removal** — Removing counties/cities from constants OR adding redirect rules that remove URLs

Multiple types can apply. Track all. Quality-fix carve-out (Rule 6) requires ONLY quality-fix to apply.

### 4. Fetch tracker state
Use MCP `mcp__google-workspace__read_sheet_values` to read the tracker sheet.

Read main "SEO Changelog" tab (or primary tab) to get all rows. Parse:
- `Date` column → ISO date
- `URLs Affected` column → list of URLs/patterns
- `Status` column → current state
- `Check By` column → evaluation date

Build a map of URL patterns → their most recent change rows.

### 5. Extract affected URLs from current change
For each file in change set, map to affected URL patterns:
- `next.config.ts` → parse redirect rules, extract `source` patterns
- `src/lib/constants.ts` → read COUNTIES_AND_LOCATIONS, diff vs previous version
- `src/app/[location]/[service]/page.tsx` → affects all city/service combos
- `src/app/{route}/page.tsx` → affects `/{route}`
- Content files → affects the specific page they render

### 6. Detect commit SHA and branch
- `git -C {org.path} rev-parse HEAD` → sha
- `git -C {org.path} branch --show-current` → branch
- If branch is `main` AND change is structural, flag for Rule 4

## Outputs

Write `change_context.json` to memory for stage 02:

```json
{
  "businessId": "safebath",
  "summary": "Restructure: remove 680 city-service pages",
  "commitSha": "abc1234",
  "branch": "main",
  "changeType": ["structural", "market-removal"],
  "affectedFiles": ["next.config.ts", "src/lib/constants.ts", ...],
  "affectedUrls": ["/bathroom-safety-las-vegas-nv", "/:location/bathroom-grab-bar-installation", ...],
  "removedUrls": ["/bathroom-safety-las-vegas-nv", ...],
  "addedUrls": [],
  "newRedirectCount": 80,
  "fileCount": 5,
  "config": {
    "orgPath": "/Users/kerapassante/Developer/projects/safebath/website/",
    "trackingSheetId": "1vGd...",
    "slackBusinessChannel": "C0AQCHCC2JW",
    "slackOpsLogChannel": "C0AQG0DP222"
  },
  "trackerRows": [
    {
      "date": "2026-03-13",
      "urlsAffected": "NV + SC city pages",
      "status": "Pending",
      "rowIndex": 7
    },
    ...
  ],
  "forceOverride": false,
  "forceReason": null
}
```

Return this object to stage 02.
