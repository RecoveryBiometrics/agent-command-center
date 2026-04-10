---
description: Source blog topics from 3 tiers (GHL docs, GSC gaps, market verticals) for any language. Called before blog scripts run.
invocation: /topics
when_to_use: When a pipeline needs topics for non-English blog generation, or when you want to see what topics are queued for a language.
---

# Topic Sourcer

Picks the right topics from the right sources for multi-language blog generation. Three tiers of trust.

## Usage
```
/topics ghl es          # Generate 5 Spanish topics for GHL
/topics ghl ar          # Generate 5 Arabic topics  
/topics ghl in          # Generate 5 India topics
/topics ghl all         # Generate topics for all languages
/topics ghl es --tier 1 # Only Tier 1 (GHL docs) topics
```

## The 3 Tiers

### Tier 1: GHL Documentation (trust layer)
Source: `articles-cache.json` — the same 2,961 help.gohighlevel.com articles that feed English podcasts.
Process: Adapt (not translate) for target market. Each post links back to original `articleId`.
Trust: Highest — grounded in official GHL documentation.
Default allocation: 3 per cycle.

### Tier 2: GSC Gaps (real demand)
Source: Google Search Console data filtered by country/language.
Process: Find queries with high impressions but no matching page in that language.
Trust: High — grounded in real search behavior.
Default allocation: 1 per cycle (when data exists).

### Tier 3: Market Verticals (SERP research)
Source: Industry-specific topics generated from market research.
Process: "Why plumbers in Mexico need GHL" — combines industry + market + GHL feature.
Trust: Medium — grounded in SERP data and market knowledge, not GHL docs.
Default allocation: 1 per cycle.

## Stages

1. **01-collect** — Pull candidates from all 3 tiers
2. **02-prioritize** — Rank by tier, topic weight, freshness
3. **03-assign** — Output topic list to queue file

## References (Layer 3)
- `references/tier1-docs.md` — How to source from GHL help articles
- `references/tier2-gsc.md` — How to read GSC gaps by language
- `references/tier3-markets.md` — Industry verticals per market
- `references/language-config.md` — Per-language config (subreddits, payment processors, industries)

## Output
Writes to `data/{language}-topics-queue.json`:
```json
[
  {
    "topic": "How to Set Up WhatsApp Automation in GoHighLevel",
    "source": "tier1-docs",
    "articleId": "155000005065",
    "articleUrl": "https://help.gohighlevel.com/support/solutions/articles/155000005065",
    "articleBody": "...",
    "tier": 1,
    "priority": 0.95
  },
  {
    "topic": "gohighlevel precios mexico",
    "source": "tier2-gsc",
    "impressions": 120,
    "position": 35.2,
    "tier": 2,
    "priority": 0.72
  }
]
```

Blog scripts read this queue instead of maintaining their own hardcoded topic lists.

## How it connects
```
topic-sourcer → picks topics → writes queue file
blog script → reads queue → research → write → fact-check
content-localizer → classify + localize + place
```
