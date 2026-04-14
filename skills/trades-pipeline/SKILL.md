---
name: Trades Pipeline
description: Produce long form, Peter Attia style trade-specific content for GoHighLevel affiliate marketing. Series driven, multi language, buyer intent. Ships /for/[trade]/ hub-and-spoke pages across EN, ES, IN, AR markets.
invocation: /trades
when_to_use: When the user wants to ship a trade series (plumbers, HVAC, electricians, etc.), when the scheduled cadence fires, or when a new trade gets added to the Trades Queue in the GHL Google Sheet.
user-invocable: true
---

# Trades Pipeline

You are operating the Trades Pipeline. This pipeline produces vertical and persona focused content for GoHighLevel across four markets. Every post targets a specific buyer intent stage for a specific trade. Series build topical authority. Short posts net long tail.

## The 7 locked decisions

Do not relitigate these unless Bill says so explicitly.

1. **Style.** Peter Attia "Straight Dope" long form. See `references/article-template.md` for structure. See `references/voice.md` for tone and banned phrases.
2. **Sizing.** Three tiers. Tier 1 trades get 9 part series. Tier 2 gets 4 to 5 parts. Tier 3 gets 1 flagship.
3. **Markets.** EN, ES, IN (English with India context), AR (Modern Standard Arabic). Same topic, per market native research.
4. **Source of truth.** "Trades Queue" tab in the GHL Google Sheet `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`. Pipeline reads from the Sheet every run. Bill edits the Sheet. GSC suggestions auto append weekly.
5. **URLs.** `/for/[trade]/` is the series hub. Each part lives at `/for/[trade]/[part-slug]/`. Per language: `/es/para/[trade]/`, `/in/for/[trade]/`, `/ar/لـ/[trade]/`.
6. **Winning metric.** After 8 weeks live, each trade is scored on three thresholds: avg position <= 15, CTR >= 1.5%, at least 1 affiliate click in the last 14 days. Tier 1 keeps going if 2 of 3. Tier 2 keeps going if 1 of 3. Tier 3 promotes on any hit, archives on none.
7. **Cadence.** Pulsed parallel. Ship Part 1 for all 10 Tier 1 trades first (about 3 days at 3 to 4 trades per day). Wait 2 weeks for signal. Cull the losers. Ship Part 2 for the survivors. Continue.

## Tier 1 trades (the first 10)

1. Plumbers
2. HVAC contractors
3. Electricians
4. Roofers
5. General contractors and remodelers
6. Med spas and aesthetic clinics
7. Dentists and dental practices
8. Real estate agents and teams
9. Chiropractors
10. Insurance agents (P&C and Medicare)

Tier 2 and Tier 3 trades populate over time from the Sheet and from GSC signal. Do not hard code them here.

## The 9 parts of a Tier 1 series (buyer journey)

Every Tier 1 trade produces these 9 parts in order, one per cadence slot.

| # | Part title template | Buyer intent |
|---|---|---|
| 1 | "Why [trade plural] need a CRM in 2026" | Problem aware |
| 2 | "Best CRM for [trade plural] this year" | Solution aware |
| 3 | "GoHighLevel vs [local competitor] for [trade plural]" | Comparison |
| 4 | "How to set up GoHighLevel for a [trade singular] business" | How to |
| 5 | "GoHighLevel workflows that [trade plural] actually use" | Use case |
| 6 | "GoHighLevel pricing for a [trade] business" | Pricing |
| 7 | "What changes in month 1 when a [trade] adopts GoHighLevel" | Proof |
| 8 | "Is GoHighLevel worth it for a solo [trade singular]" | Objection |
| 9 | "Common mistakes [trade plural] make in their GoHighLevel setup" | Optimization |

Tier 2 trades pick 4 to 5 parts from this list. Tier 3 trades pick Part 1 only (renamed "Complete guide to GoHighLevel for [trade plural]").

## Stages

Run these in order. Each stage has its own CONTEXT.md under `stages/`.

1. **01-source.** Pull the next trade and part from the Trades Queue Sheet. Skip anything already shipped. Respect the pulsed parallel cadence.
2. **02-research.** For each of 4 markets, run researcher agent: per market DuckDuckGo SERP plus per market Reddit. See `references/market-config/[lang].md` for per market settings.
3. **03-write.** Claude writes the part following `references/article-template.md` and `references/voice.md`. One write per market.
4. **04-check.** Fact checker scrubs every post. Enforces banned phrases from `voice.md`, strips fabricated claims per the "Never claim about Bill or William" memory rule, validates pricing against YAML.
5. **05-interlink.** Wires internal links per `references/interlinking-rules.md`.
6. **06-deploy.** Saves JSON to `globalhighlevel-site/posts/`. Appends to `data/trades-shipped.json`. Updates Trades Queue Sheet row. Git commits and pushes. Netlify deploys.
7. **07-offpage.** Calls Google Indexing API for fresh crawl. Appends to sitemap. Queues a LinkedIn cross post draft and a Reddit comment draft for Bill to review manually.

## Usage

```
/trades                         # Run the next scheduled slot
/trades --trade plumbers        # Force next pending part for one trade
/trades --part 3                # Override part number (rarely used)
/trades --dry                   # Show what would ship, do not write
/trades status                  # Read-only. Show Sheet state and cull candidates
```

## Where things live

| Thing | Location |
|---|---|
| Live execution state | Trades Queue tab in GHL Google Sheet |
| Ship log | `ghl-podcast-pipeline/data/trades-shipped.json` |
| Generated posts | `globalhighlevel-site/posts/*.json` (per language) |
| Generated hub pages | `globalhighlevel-site/public/for/[trade]/index.html` |
| Pipeline code | `ghl-podcast-pipeline/scripts/trades-blog.py` |
| Shared agents | `ghl-podcast-pipeline/scripts/lib/agents.py` |
| Shared multilingualizer | `ghl-podcast-pipeline/scripts/lib/multilingualize.py` |
| This skill backup | `agent-command-center/skills/trades-pipeline/SKILL.md` |

## Hard rules

- Every piece of content must pass the fact checker. No exceptions.
- No em-dashes. Anywhere. Ever.
- No fabricated claims about Bill or William Welch. See memory `feedback_never_claim_about_bill_or_william.md`.
- William Welch bio uses canonical text only. See memory `reference_william_welch_bio.md`.
- No first person client counts, outcomes, or anecdotes.
- Pricing numbers must match the current GHL pricing in `businesses/globalhighlevel.yaml`.
- Every part links to its series hub, its previous part, and its next part.
- Failed fact check means the post does not ship. It gets flagged for rewrite.
- No licensing the placement intelligence, gap data, methodology, or platform code to competitors. See memory `feedback_no_licensing_the_moat.md`.

## The three-tier CTA pattern (required on every post)

Every trade post, series hub, and landing page MUST implement the three-tier customer routing model. This is how REI Amplifi earns revenue on every visitor tier without taking on delivery work below the $7,500/mo floor. See memory `feedback_no_done_for_you_work.md` for the rule.

| Position | Tier | Target | CTA text pattern |
|---|---|---|---|
| Primary (top + bottom) | Self-service | GHL affiliate link with UTM | "Start your free 30-day GoHighLevel trial" |
| Secondary (mid-post) | Help-needed | Extendly affiliate link | "Want it set up for you? Extendly handles GHL onboarding and white-label support" |
| Tertiary (gated) | Enterprise | Contact form (qualified only, not always visible) | "$5M+ business, ready to embed GHL deep? Enterprise engagement inquiry" |

**CTAs that must NOT appear:**

- "Book a call with Bill"
- "Let us set this up for you"
- "1-on-1 coaching"
- "Work with us" (too vague)
- Anything that implies Bill delivers service work below the enterprise floor

Fact checker verifies every generated post has the correct three-tier CTA pattern before publish.
