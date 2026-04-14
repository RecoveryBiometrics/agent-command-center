---
name: Verticals Pipeline
description: Produce long form, Peter Attia style vertical-specific content for GoHighLevel affiliate marketing. Series driven, multi language, buyer intent. Ships /for/[vertical]/ hub-and-spoke pages across EN, ES, IN, AR markets. A vertical is any line of business that buys GHL — including marketing agencies, trades (plumbers, HVAC, electricians), and professional services (dentists, chiropractors, med spas).
invocation: /verticals
when_to_use: When the user wants to ship a vertical series (marketing agencies, plumbers, HVAC, dentists, etc.), when the scheduled cadence fires, or when a new vertical gets added to the Verticals Queue in the GHL Google Sheet.
user-invocable: true
---

# Verticals Pipeline

You are operating the Verticals Pipeline. This pipeline produces vertical and persona focused content for GoHighLevel across four markets. Every post targets a specific buyer intent stage for a specific vertical. Series build topical authority. A vertical is any line of business that buys GHL — marketing agencies, trades (plumbers, HVAC, electricians, roofers, GCs), and professional services (dentists, chiropractors, med spas, real estate, insurance). Short posts net long tail.

## The 7 locked decisions

Do not relitigate these unless Bill says so explicitly.

1. **Style.** Peter Attia "Straight Dope" long form. See `references/article-template.md` for structure. See `references/voice.md` for tone and banned phrases.
2. **Sizing.** Three tiers. Tier 1 verticals get 9 part series shipped in bundles of 3 (Parts 1-3, measure, Parts 4-6 if survivors, Parts 7-9 if still winning). Tier 2 gets 4 to 5 parts. Tier 3 gets 1 flagship.
3. **Markets.** EN, ES, IN (English with India context), AR (Modern Standard Arabic). Per market native research — do NOT translate one research pass across languages. Regional problems, pricing, and competitors differ.
4. **Source of truth.** "Verticals Queue" tab in the GHL Google Sheet `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`. Pipeline reads from the Sheet every run. Bill edits the Sheet. GSC suggestions auto append weekly. Ship state (queued/shipped/culled) lives only in the Sheet — no local JSON ship log.
5. **URLs.** `/for/[vertical]/` is the series hub. Each part lives at `/for/[vertical]/[part-slug]/`. Per language: `/es/para/[vertical]/`, `/in/for/[vertical]/`, `/ar/لـ/[vertical]/`.
6. **Winning metric.** After 8 weeks live, each vertical is scored on three thresholds: avg position <= 15, CTR >= 1.5%, at least 1 affiliate click in the last 14 days. Tier 1 keeps going if 2 of 3. Tier 2 keeps going if 1 of 3. Tier 3 promotes on any hit, archives on none.
7. **Cadence.** Parallel 4-language bundles of 3. Ship Parts 1-3 for one vertical in all 4 languages (12 articles) as the unit. Measure 8 weeks. Cull non-performing languages or verticals. Ship Parts 4-6 for survivors. Daily runs, 7 days a week.

## Tier 1 verticals (the first 11)

1. **Marketing agencies / agency-starters** — highest-value GHL buyer, thin competition in ES/AR/IN
2. Plumbers
3. HVAC contractors
4. Electricians
5. Roofers
6. General contractors and remodelers
7. Med spas and aesthetic clinics
8. Dentists and dental practices
9. Real estate agents and teams
10. Chiropractors
11. Insurance agents (P&C and Medicare)

Tier 2 and Tier 3 verticals populate over time from the Sheet and from GSC signal. Do not hard code them here.

## The 9 parts of a Tier 1 series (buyer journey)

Every Tier 1 vertical produces these 9 parts in order, one per cadence slot.

| # | Part title template | Buyer intent |
|---|---|---|
| 1 | "Why [vertical plural] need a CRM in 2026" | Problem aware |
| 2 | "Best CRM for [vertical plural] this year" | Solution aware |
| 3 | "GoHighLevel vs [local competitor] for [vertical plural]" | Comparison |
| 4 | "How to set up GoHighLevel for a [vertical singular] business" | How to |
| 5 | "GoHighLevel workflows that [vertical plural] actually use" | Use case |
| 6 | "GoHighLevel pricing for a [vertical] business" | Pricing |
| 7 | "What changes in month 1 when a [vertical] adopts GoHighLevel" | Proof |
| 8 | "Is GoHighLevel worth it for a solo [vertical singular]" | Objection |
| 9 | "Common mistakes [vertical plural] make in their GoHighLevel setup" | Optimization |

Tier 2 verticals pick 4 to 5 parts from this list. Tier 3 verticals pick Part 1 only (renamed "Complete guide to GoHighLevel for [vertical plural]").

## Stages

Run these in order. Each stage has its own CONTEXT.md under `stages/`.

1. **01-source.** Pull the next vertical and part from the Verticals Queue Sheet. Skip anything already shipped. Respect the parallel 4-language bundle cadence.
2. **02-research.** For each of 4 markets, run researcher agent: per market DuckDuckGo SERP plus per market Reddit. Per-market research is mandatory — do NOT translate one research pass to other languages. See `references/market-config/[lang].md` for per market settings. Model: Haiku 4.5.
3. **03-write.** Claude writes the part following `references/article-template.md` and `references/voice.md`. One native write per market using that market's research. Model: Haiku 4.5.
4. **04-check.** Fact checker scrubs every post. Enforces banned phrases from `voice.md`, strips fabricated claims per the "Never claim about Bill or William" memory rule, validates pricing against YAML. Model: Sonnet 4.6 (different model from writer to avoid confirmation bias).
5. **05-language-review.** Non-English posts get a language-reviewer pass: grammar/fluency, back-translation parity vs. source, dialect compliance (MSA for Arabic), claim parity. Model: Opus 4.6 (judgment-heavy).
6. **06-interlink.** Wires internal links per `references/interlinking-rules.md`. Model: Haiku 4.5.
7. **07-deploy.** Saves JSON to `globalhighlevel-site/posts/[language]/`. Updates Verticals Queue Sheet row with status=shipped, shipped_date, URL. Git commits and pushes. Netlify deploys. No local JSON ship log — the Sheet is the only source of truth.
8. **08-offpage.** Calls Google Indexing API for fresh crawl. Appends to sitemap. Queues a LinkedIn cross post draft and a Reddit comment draft for Bill to review manually.

## Usage

```
/verticals                           # Run the next scheduled slot
/verticals --vertical agencies       # Force next pending part for one vertical
/verticals --part 3                  # Override part number (rarely used)
/verticals --lang es                 # Ship only one language (debug/test)
/verticals --dry                     # Show what would ship, do not write
/verticals status                    # Read-only. Show Sheet state and cull candidates
```

## Where things live

| Thing | Location |
|---|---|
| Live execution state | Verticals Queue tab in GHL Google Sheet |
| Ship state (queued/shipped/culled) | Verticals Queue Sheet (NOT a local JSON file) |
| Generated posts | `globalhighlevel-site/posts/[lang]/*.json` |
| Generated hub pages | `globalhighlevel-site/public/[lang-prefix]/[vertical]/index.html` |
| Pipeline code | `ghl-podcast-pipeline/scripts/verticals-blog.py` |
| Shared agents | `ghl-podcast-pipeline/scripts/lib/agents.py` |
| Shared language reviewer | `ghl-podcast-pipeline/scripts/lib/language-reviewer.py` |
| This skill backup | `agent-command-center/skills/verticals-pipeline/SKILL.md` |

## Model routing (tiered for cost + quality)

| Stage | Model | Why |
|---|---|---|
| Research | Haiku 4.5 | Mechanical SERP/Reddit extraction |
| Write | Haiku 4.5 | Long-form generation, already proven in podcast pipeline |
| Fact-check | Sonnet 4.6 | Different model from writer for real second opinion |
| Language review | Opus 4.6 | Cultural/dialect judgment, non-English quality gate |
| Interlink | Haiku 4.5 | Mechanical link insertion |
| Retry on failure | Sonnet 4.6 | Existing pattern from podcast pipeline |

## Hard rules

- Every piece of content must pass the fact checker. No exceptions.
- Every non-English post must pass the language reviewer. No exceptions.
- No em-dashes. Anywhere. Ever.
- No fabricated claims about Bill or William Welch. See memory `feedback_never_claim_about_bill_or_william.md`.
- William Welch bio uses canonical text only. See memory `reference_william_welch_bio.md`.
- No first person client counts, outcomes, or anecdotes.
- Pricing numbers must match the current GHL pricing in `businesses/globalhighlevel.yaml`.
- Per-market research is mandatory. Do NOT translate one research pass to other languages.
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
