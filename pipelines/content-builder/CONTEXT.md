# Content Builder Pipeline

Reads Active TODOs from the business tracking Sheet, builds content for
SEO gaps and opportunities, and deploys it. Runs weekly on Wednesdays
(after Tuesday's SEO report writes fresh TODOs).

## Stages
1. **Classify** — read TODOs from Sheet, parse type (gap/opportunity), extract keyword + metrics
2. **Research** — research the keyword topic via Claude Haiku
3. **Write** — generate article JSON or service page content
4. **Check** — fact check + SEO audit (same rules as daily content pipeline)
5. **Link** — get internal link recommendations from interlinking pipeline
6. **Deploy** — write files, commit, push (articles auto-deploy, service pages create PR)

## Usage
```
node index.js --business safebath              # full run
node index.js --business safebath --dry        # classify + research, don't deploy
node index.js --business safebath --max 2      # process max 2 TODOs
```

## Config
Business YAML `content_builder:` section controls max TODOs per run,
minimum impressions threshold, auto-deploy vs PR mode.

## How TODOs get here
1. SEO Reporting pipeline runs weekly (Tuesdays)
2. It writes TODOs to the "Active TODOs" tab in the business tracking Sheet
3. TODO formats (from seo-reporting/todos.js):
   - Area: "SEO — Gap" → Task: "No page for \"keyword\" — Z impressions, position X.X"
   - Area: "SEO — Opportunity" → Task: "Optimize /slug — position X.X, Y impressions"
   - Area: "SEO — Investigate" → Task: "/slug dropped X.X positions" (skipped — human)
