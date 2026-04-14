---
name: Verticals Pipeline Architecture
description: Architectural decisions for the verticals content pipeline (GHL vertical content across EN/ES/IN/AR). Tier system, URL structure, win metric, parallel 4-language cadence, tiered model routing.
type: project
originSessionId: e0fb6bdf-ac24-48b3-9afb-ed04feaa103b
---
# Verticals Pipeline Architecture (renamed from Trades 2026-04-14)

Vertical content pipeline that ships vertical-specific (marketing agencies, plumbers, HVAC, dentists, etc.) content for globalhighlevel.com affiliate marketing. Renamed from "Trades Pipeline" 2026-04-14 after Bill caught that "trades" was too narrow — a marketing agency is a vertical too, and arguably the highest-value GHL buyer.

**Why this pipeline exists:** Live GSC and GA4 (pulled 2026-04-13) showed the 640+ help-doc reproductions on the site are not converting (0.2% CTR, majority at 0 clicks over 28 days). Vertical/service content converts better (ES market-native pages hit 129 second dwell vs 0-21s for help-docs). This pipeline pivots content investment toward buyer-intent verticals.

**How to apply:** When Bill references "the verticals pipeline", "vertical content", "agency content", "trades content", or the `/verticals` skill, these are the rules. Full skill at `~/.claude/skills/verticals-pipeline/` with backup in `agent-command-center/skills/verticals-pipeline/`. If a decision below conflicts with the skill docs, trust the skill docs.

## The 7 decisions

1. **Style.** Peter Attia "Straight Dope on Cholesterol" long form model. Numbered learning objectives upfront, "concepts to grasp" block, H2 + H3 hierarchy, analogies as teaching device, Q&A embedded in sections, bold on first use of technical terms, 2-5 footnotes per part citing primary sources, "Up next in Part N+1" teaser closing.

2. **Sizing (tiered by vertical priority).**
   - Tier 1 (top 11 verticals, agency-starters #1) = 9 part series in bundles of 3 (Parts 1-3 → measure → Parts 4-6 if winners → Parts 7-9)
   - Tier 2 (next 15 verticals) = 4-5 part series, 1800-2500 words
   - Tier 3 (long-tail verticals) = 1 flagship pillar post, 2500-3500 words

3. **Markets (per-market native research MANDATORY).** EN, ES, IN (English with India context), AR (Modern Standard Arabic). Same topic across all four markets BUT each market runs its own SERP + Reddit research. Do NOT translate one research pass across languages — regional problems, pricing, and competitors differ materially (e.g., plumber bills US $100-300/hr vs Mexico $10-30/hr → ROI math is completely different).

4. **Source of truth.** "Verticals Queue" tab in the GHL Google Sheet (ID `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`). Bill edits the Sheet. Pipeline reads on each run. No local JSON ship log — ship state lives only in the Sheet.

5. **URL structure.** `/for/[vertical]/` is the series hub. Per language: `/es/para/[vertical]/`, `/in/for/[vertical]/`, `/ar/لـ/[vertical]/`.

6. **Winning metric (threshold-based, measured at 8 weeks post-launch).**
   - Avg position <= 15 across the series
   - CTR >= 1.5%
   - At least 1 affiliate click in the last 14 days
   - Tier 1 keeps going if it hits 2 of 3. Tier 2 = 1 of 3. Tier 3 promotes on any hit, archives on none.

7. **Cadence.** Parallel 4-language bundles of 3. Ship Parts 1-3 for one vertical in all 4 languages simultaneously (12 articles). Measure 8 weeks. Cull losing verticals or languages. Ship Parts 4-6 for survivors. Daily runs, 7 days a week.

## Tier 1 verticals (first 11, agency-starters at #1)

1. **Marketing agencies / agency-starters** — highest-value GHL buyer, thinnest competition in ES/AR/IN markets
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

## Tiered model routing (cost + quality)

| Stage | Model | Why |
|---|---|---|
| Research | Haiku 4.5 | Mechanical extraction |
| Write | Haiku 4.5 | Long-form generation, already proven in podcast pipeline |
| Fact-check | Sonnet 4.6 | Different model from writer = real second opinion |
| Language review (new) | Opus 4.6 | Cultural/dialect judgment on non-English |
| Interlink | Haiku 4.5 | Mechanical |

## Key architecture commitments

- **Ship state in Sheet only** — no local JSON log. Single source of truth.
- **Per-market research mandatory** — no shared-research-then-translate shortcut.
- **Language-reviewer is a new shared skill** (option B from 2026-04-14 session), called by verticals AND retrofitted into podcast pipeline to catch Arabic quality drift.
- **MVP = agency-starters Parts 1-3 × 4 languages = 12 articles** shipped as one experimental unit.

## Open items (as of 2026-04-14)

- Write `references/market-config/{es,ar,in,en}.md` (per-market competitors, subreddits, pricing, regulatory notes)
- Build `scripts/verticals-blog.py` (no code exists yet)
- Build `lib/language-reviewer.py` (new shared part)
- Create "Verticals Queue" tab in GHL Sheet with 11 rows × 4 languages schema
- GitHub Roadmap project for tracking vertical rollout
- Retrofit podcast pipeline to call language-reviewer

## Related memory

- `feedback_never_claim_about_bill_or_william.md`
- `reference_william_welch_bio.md`
- `project_analytics_team.md`
- `project_single_source_of_truth.md`
