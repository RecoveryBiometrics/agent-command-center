---
name: Analytics Team
description: Analyze GA4 data for any business, surface insights, make recommendations, and dispatch instructions to other pipelines (SEO content, podcast, directory). The brain of the system.
user-invocable: false
---

# Analytics Team

You are operating the Analytics Team skill. This is the decision-making layer that analyzes Google Analytics data, generates business insights, and dispatches instructions to other pipelines.

## When to use this skill
- User asks about business performance, traffic, leads, conversions, analytics, GA4
- User asks "how's [business] doing?" or "what's working?" or "where should we focus?"
- User wants to understand content ROI, lead sources, or traffic trends
- User wants to manually dispatch instructions to another pipeline
- User asks about a specific GA4 metric or wants to compare periods

## Loading Business Config

ALWAYS load the business YAML first:
1. Read `~/Projects/agent-command-center/businesses/{business-id}.yaml`
2. Get the `ga4_property_id` from the `seo` or `analytics` section
3. Get the `niche` to frame insights for the right business type
4. Get `tracking_sheet_id` for historical context
5. Get `slack.business_channel` for where reports go
6. All config comes from the YAML — do NOT ask for values that are in there

### Property IDs (quick reference, but always verify from YAML)
- SafeBath: `14299063401`
- GlobalHighLevel: `531015433`
- If user says a business name, find its YAML and read the property ID

## MCP Tools Available (analytics-mcp)

These 7 tools are available via the `analytics-mcp` MCP server:

### Data Retrieval
| Tool | Use for |
|------|---------|
| `run_report` | Main tool. Fetches any GA4 data: sessions, users, pageviews, events, conversions, by any dimension (date, page, channel, city, device, etc.) |
| `run_realtime_report` | Live right-now data. Active users, current pages, realtime events. Good for "what's happening on the site right now?" |
| `get_custom_dimensions_and_metrics` | Lists custom dimensions/metrics configured for a property. Check this first if unsure what's tracked. |

### Account/Property Info
| Tool | Use for |
|------|---------|
| `get_account_summaries` | Lists all GA4 accounts and properties the user has access to. Good for discovery. |
| `get_property_details` | Property settings, timezone, currency, industry category. |
| `list_property_annotations` | Notes left on GA4 for specific dates (campaign launches, releases). |
| `list_google_ads_links` | Check if Google Ads is connected to the property. |

### How to call `run_report`

```
run_report(
  property_id: "14299063401",
  date_ranges: [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  dimensions: ["date"],
  metrics: ["sessions", "totalUsers", "newUsers", "engagedSessions", "bounceRate"]
)
```

Key dimensions: `date`, `sessionDefaultChannelGroup`, `landingPage`, `city`, `region`, `country`, `deviceCategory`, `pagePath`, `eventName`, `firstUserSource`, `firstUserMedium`

Key metrics: `sessions`, `totalUsers`, `newUsers`, `engagedSessions`, `bounceRate`, `averageSessionDuration`, `screenPageViews`, `eventCount`, `conversions`, `userEngagementDuration`

Date formats: `YYYY-MM-DD`, `yesterday`, `today`, `7daysAgo`, `28daysAgo`, `90daysAgo`

## Analysis Workflow

When asked about a business, run these queries in sequence:

### 1. Collect (fetch all data)
Run these queries for the property — always fetch ALL of these, don't filter by business type:

**Traffic overview (current vs prior 28 days):**
```
run_report(property_id, [
  {"start_date": "28daysAgo", "end_date": "yesterday", "name": "current"},
  {"start_date": "56daysAgo", "end_date": "29daysAgo", "name": "prior"}
], ["date"], ["sessions", "totalUsers", "newUsers", "engagedSessions", "bounceRate", "averageSessionDuration", "screenPageViews"])
```

**Traffic by channel:**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["sessionDefaultChannelGroup"], ["sessions", "totalUsers", "engagedSessions", "bounceRate", "conversions"])
```

**Top landing pages:**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["landingPage"], ["sessions", "totalUsers", "bounceRate", "averageSessionDuration"], limit=25)
```

**Events (conversions):**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["eventName"], ["eventCount"])
```

**Device breakdown:**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["deviceCategory"], ["sessions", "totalUsers", "bounceRate"])
```

**Geographic breakdown:**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["region"], ["sessions", "totalUsers"], limit=20)
```

**New vs returning:**
```
run_report(property_id, [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  ["newVsReturning"], ["sessions", "totalUsers", "engagedSessions"])
```

### 2. Detect Trends
Compare current 28 days vs prior 28 days. Flag:
- Any metric that changed more than 15% (notable) or 30% (significant)
- Channel shifts (e.g., organic up but referral down)
- New landing pages appearing in top 25 that weren't there before
- Geographic shifts

### 3. Generate Insights (niche-aware)
Read the business `niche` from the YAML and interpret accordingly:

**For local service businesses (SafeBath, etc.):**
- Phone clicks / tel: events = leads. This is THE metric.
- Geo matters: traffic from service area states is qualified. Other states = noise.
- "Which of our pages lead to phone clicks?" = the money question
- Mobile traffic expected and good (people searching from home for local services)
- High bounce on location pages may be fine (they called). High bounce on blog = problem.
- Content pipeline ROI: are the local-news pages driving traffic and calls?

**For affiliate/content sites (GlobalHighLevel, Bass Forecast):**
- Affiliate/outbound clicks = revenue. Track by page to find money pages.
- Session duration + pages/session = engagement quality. Longer = more ad/affiliate exposure.
- Content volume ROI: which of the 1,500+ articles actually drive traffic?
- Organic growth rate = the north star. The content machine exists to grow organic.
- Topic performance: which categories get the most engagement?

**For SaaS tools (Hatch):**
- Feature usage events = product health
- Signups / OM generations = growth metric
- Referral source analysis = which marketing works

**For agency sites (REI Amplifi):**
- Inbound leads (contact form, demo requests)
- Which service pages or case studies convert?
- Authority signals: return visits, time on site

### 4. Fact Check
Before any insight becomes a recommendation, validate:

| Check | How |
|-------|-----|
| **Bot traffic?** | Spike + bounce > 90% + single-page sessions + unusual geo = likely bot. Discard. |
| **Sample size?** | Don't recommend from < 100 sessions. Flag as low-confidence. |
| **Seasonal?** | Is this period typically different? (holidays, summer, etc.) Compare 90-day trend if uncertain. |
| **Conflicting signals?** | Traffic up but conversions down? Don't recommend "more of the same." Investigate why. |
| **Data fresh?** | GA4 can lag 24-48hrs. If comparing today, note this. |

Tag each insight: `HIGH` / `MEDIUM` / `LOW` confidence.

### 5. Recommend
Generate up to 3 actionable recommendations from HIGH confidence insights. Each must have:
- **What:** specific action (e.g., "Prioritize Philadelphia and Wilmington in the content pipeline")
- **Why:** data backing it (e.g., "PA cities drive 40% of traffic but only 15% of content targets them")
- **Target pipeline:** which pipeline should act on this (seo-content, content-production, directory)
- **Expected impact:** what we expect to change
- **Effort:** low / medium / high

MEDIUM confidence insights go to the Sheet as suggestions (no dispatch).
LOW confidence insights get logged but not surfaced.

### 6. Report
Present findings to the user as:

```
## [Business Name] Analytics — [date range]

### Key Numbers
Sessions: X (+/-Y% vs prior) | Users: X | [Primary conversion]: X

### What's Working
- [insight 1]
- [insight 2]

### What Needs Attention
- [insight 3]

### Recommendations
1. [action] — [why] — dispatching to [pipeline]
2. [action] — [why] — dispatching to [pipeline]

### Suggestions (medium confidence, not auto-dispatched)
- [suggestion]
```

## Dispatching to Other Pipelines

When recommendations are ready and you want to act on them:

### SEO Content Pipeline
Write dispatch file:
```bash
# Write to agent-command-center state directory
cat > ~/Projects/agent-command-center/state/{businessId}/analytics-dispatch.json << 'EOF'
{
  "dispatched_at": "2026-04-07T12:00:00Z",
  "dispatched_by": "analytics-team",
  "instructions": [
    {
      "type": "prioritize_cities",
      "cities": ["Philadelphia, PA", "Wilmington, DE"],
      "reason": "GA4 shows 40% traffic from PA/DE but only 15% of content targets these areas"
    }
  ]
}
EOF
```

Valid instruction types for seo-content:
- `prioritize_cities` — move these cities to the front of the queue
- `prioritize_categories` — weight these content categories higher
- `avoid_cities` — deprioritize these (already saturated or low-converting)

### Podcast Pipeline (GHL)
Update topic weights — commit to the content-autopilot repo:
```bash
cd ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline
# Update data/topic-weights.json with new weights
# git add, commit, push — VPS pulls on next 25hr cycle
```

Valid weight adjustments:
- Increase weight (1.0+) for high-performing topics
- Decrease weight (< 1.0) for underperforming topics
- Weights are relative multipliers, default 1.0

### Directory Pipeline
Write dispatch file (same pattern as seo-content):
```bash
cat > ~/Projects/agent-command-center/state/{businessId}/directory-dispatch.json << 'EOF'
{
  "dispatched_at": "...",
  "dispatched_by": "analytics-team",
  "instructions": [
    {
      "type": "prioritize_regions",
      "regions": ["Chester County, PA"],
      "reason": "..."
    }
  ]
}
EOF
```

### Dispatch rules
- **Max 3 instructions per pipeline per dispatch.** Pick the highest-impact ones.
- **Only dispatch HIGH confidence recommendations.** MEDIUM goes to Sheet only.
- **Dispatches influence ordering, never bypass quality checks.** The content pipeline still runs its fact checkers, similarity checks, SEO auditors.
- **Always tell the user what you dispatched** so they can see it in Slack.

## Google Sheet Integration

When writing insights to the business's tracking sheet:
1. Read `tracking_sheet_id` from the business YAML
2. Find or create an "Analytics" tab
3. Append a row with: Date, Period, Sessions, Users, Conversions, Top Insight, Recommendations, Actions Dispatched, Confidence
4. Use the `google-workspace` MCP tools (already connected) to write to Sheets

**SEO Changelog tab** is also in this same sheet — written by the content pipeline's `sheet.js` and read by the reporting pipeline's `sheet.js`. When analyzing content velocity, check the "SEO Changelog" tab for recent article entries.

**Active TODOs tab** — analytics pipeline writes MEDIUM-confidence suggestions here via `todos.js`. Dispatched actions are logged as "Auto-handled" for visibility. Slack post includes count of items added.

## Slack Integration

Post summary to the business's Slack channel (`slack.business_channel` from YAML):
```
[Business] Analytics — [date]

Sessions: X (+Y% WoW) | [Primary metric]: X (+Y%)
Top insight: [one line]

Actions taken:
- [pipeline]: [instruction summary]

Full report: [Sheet link]
```

Use the Slack MCP tools (already connected) to post messages.

## Common Questions & How to Answer

| Question | What to do |
|----------|-----------|
| "How's [business] doing?" | Full analysis workflow (all 6 steps above) |
| "Is our content working?" | Landing page report + conversion attribution. Which content pages drive the business KPI? |
| "Where should we focus next?" | Geo analysis + content gap analysis. Where's traffic coming from vs where do we have content? |
| "Are we getting leads?" | Event report filtered to conversion events from YAML. Trend over time. |
| "What's happening right now?" | `run_realtime_report` — active users, current pages, live events |
| "Compare last month to this month" | Two date ranges in `run_report`. Highlight changes > 15%. |
| "Which pages convert best?" | Landing page × event combination. Which pages have the highest conversion rate? |
| "Tell the content pipeline to [X]" | Write a dispatch file with the instruction. Confirm to user. |
| "Did the last dispatch work?" | Compare metrics before/after the dispatch date. Did the recommended action improve the target metric? |

## Pipeline Code

`~/Projects/agent-command-center/pipelines/analytics/` — 11 files:

| File | Role |
|------|------|
| `index.js` | Orchestrator — runs all 7 steps |
| `config.js` | Loads business YAML, resolves GA4 property, prior snapshots |
| `auth.js` | Google service account auth (GA4 + Sheets) |
| `collect.js` | Fetches 9 GA4 reports, saves dated snapshot |
| `trends.js` | WoW comparison, anomaly detection, service area coverage |
| `insights.js` | Plain-English insights, niche-aware |
| `fact-check.js` | Validates insights (bot traffic, sample size, conflicting signals) |
| `recommend.js` | Prioritized actions, max 3 per pipeline |
| `dispatch.js` | Writes dispatch files for seo-content/directory, git pushes topic-weights for podcast |
| `todos.js` | Writes MEDIUM-confidence suggestions to Active TODOs Sheet tab |
| `sheet.js` | Logs to Analytics Sheet tab |
| `slack.js` | Posts summary + anomaly alerts to Slack |

## Deployments

- **SafeBath:** `safebath-website` repo → `weekly-analytics.yml` → Monday 8am ET
- **GHL:** `Claude-notebookLM-GHL-Podcast` repo → `weekly-analytics.yml` → Monday 8am ET

## How dispatch connects to other pipelines

When the analytics pipeline writes a dispatch file, the target pipeline reads it on its next run:
- **seo-content** `index.js` → calls `applyDispatch()` which reorders city queue based on `prioritize_cities` / `avoid_cities` instructions → clears file after run
- **directory** `index.js` → reads `prioritize_regions` instructions, reorders city list → clears file after run
- **podcast** → analytics commits updated `topic-weights.json` to the content-autopilot repo → VPS pulls on next 25hr cycle

## Standard Tracker Sheet (7 tabs per business)

Every business tracker has these tabs:
1. **SEO Changelog** — content pipeline writes after creating articles
2. **Analytics** — analytics pipeline writes weekly
3. **Active TODOs** — analytics + seo-reporting write suggestions
4. **Build Queue** — ideas/things to build
5. **Directory Log** — directory pipeline writes
6. **Weekly SEO Report** — seo-reporting pipeline writes
7. **Costs** — track actuals over time

**Franchise-wide sheet:** REI Amplifi Tracker — Build Queue + Costs for cross-business items.

## State Directory

`~/Projects/agent-command-center/state/{businessId}/` — snapshots and dispatch files.
