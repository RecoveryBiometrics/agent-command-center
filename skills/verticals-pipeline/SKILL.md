---
name: Verticals Pipeline
description: Produce long form, Peter Attia style vertical-specific content for GoHighLevel affiliate marketing. Series driven, multi language, buyer intent. Ships /for/[vertical]/ hub-and-spoke pages across EN, ES, IN, AR markets. A vertical is any line of business that buys GHL — including marketing agencies, trades (plumbers, HVAC, electricians), and professional services (dentists, chiropractors, med spas).
invocation: /verticals
when_to_use: When the user wants to ship a vertical series (marketing agencies, plumbers, HVAC, dentists, etc.), when the scheduled cadence fires, or when a new vertical gets added to the Verticals Queue in the GHL Google Sheet.
user-invocable: true
---

# Verticals Pipeline

Ships vertical-specific long-form GHL content as hub-and-spoke topical clusters. Tier 1 = 9-part series; Tier 2 = 4-5 parts; Tier 3 = 1 flagship. Peter Attia "Straight Dope" style. Per-market native research mandatory.

## Status (2026-04-15)

**Built and ready for first dispatch: agency-starters Part 1 × ES.** Remaining 8 parts and EN/IN/AR language variants come after Part 1 measures at week 2 and week 8.

## The 7 locked decisions

Do not relitigate unless Bill says so explicitly.

1. **Style.** Peter Attia "Straight Dope" long form. See `references/article-template.md` and `references/voice.md`.
2. **Sizing.** Tier 1 = 9 parts (bundles of 3). Tier 2 = 4-5 parts. Tier 3 = 1 flagship.
3. **Markets.** EN, ES, IN (English with India context), AR (Modern Standard Arabic). Per-market native research.
4. **Source of truth.** "Verticals Queue" + "Cluster Map" tabs in GHL Sheet `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`.
5. **URLs.** `/es/para/[vertical]/` (hub) + `/es/para/[vertical]/[part-slug]/` (pillars). For other langs: `/for/[vertical]/`, `/in/for/[vertical]/`, `/ar/لـ/[vertical]/`. Legacy `/blog/{slug}/` posts untouched.
6. **Winning metric.** After 8 weeks: avg position ≤15, CTR ≥1.5%, ≥1 affiliate click in last 14 days. Tier 1 keeps going if 2 of 3.
7. **Cadence.** ES-first, not EN-first (ES has thinnest competition + highest current dwell on globalhighlevel.com).

## What's built (GHL-only, hardcoded — this is correct)

Per `feedback_build_per_business_no_premature_abstraction.md`, this pipeline is hardcoded to globalhighlevel.com. It will NOT be generalized until a second business needs the same shape (N=3 rule).

### New code in `ghl-podcast-pipeline/scripts/`
- **`7-spanish-blog.py`** — extended with `--mode=attia-longform`, `--vertical`, `--part`, `--series-hub`, `--hub-title` flags. Added RULE #0 anti-fabrication block. When `attia-longform` runs, produces 2500-3500 word Attia pillar, saves with `url_path` set.
- **`language_reviewer.py`** — Opus 4.6 quality gate for non-English content. ES rules built (Latin dialect, banned phrases, fabrication scan, claim parity). Future: IN, AR.
- **`verticals_hub.py`** — Generates the series hub page (8 required elements). Saves as post JSON with `url_path=/es/para/[vertical]/` and `is_series_hub=True`.
- **`verticals_dispatch.py`** — Thin dispatcher. Hub → attia writer → Opus review → report. Hardcoded for agency-starters Part 1 ES. Sheet integration deferred until Part 2 forces the question.
- **`verticals_retrofit.py`** — One-time retrofit. Injects inbound link from each of 10 ES cluster spokes into the new hub. Idempotent.

### Updated code in `globalhighlevel-site/`
- **`build.py`** — added `post_url()` + `post_output_rel()` helpers. 6 touchpoints updated (canonical, render output, sitemap, internal linker href, related cards, slug-keyed link index). Posts without `url_path` render at `/blog/{slug}/` exactly as before.

### New tabs in GHL Google Sheet
- **Verticals Queue** (10 cols: vertical, tier, part, language, status, shipped_date, url, position, ctr, affiliate_clicks_14d). Seeded with agency-starters Parts 1-3 × ES.
- **Cluster Map** (7 cols: hub_url, spoke_url, language, relationship_type, retrofit_status, inbound_count, last_audited). Seeded with 10 ES agency spoke URLs.

## Shipping Part 1 (actual commands)

```bash
cd ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline

# 1. Dry-run to confirm plan
venv/bin/python3 scripts/verticals_dispatch.py --dry

# 2. Real run — generates hub + pillar + runs Opus review (~3-5 min, ~$1-3 API)
venv/bin/python3 scripts/verticals_dispatch.py

# 3. Manually review the two new JSONs in posts/ for:
#    - No invented people/companies/$ figures (RULE #0)
#    - Attia 12 elements present (pre-intro, learning objectives, concepts, Q&A, footnotes, etc.)
#    - Three-tier CTA (trial + Extendly + tertiary)
#    - Word count 2500+
#    - Hub lists Parts 2-9 as "próximamente"

# 4. Retrofit cluster inbound links
venv/bin/python3 scripts/verticals_retrofit.py --dry   # inspect
venv/bin/python3 scripts/verticals_retrofit.py         # apply

# 5. Build + deploy
cd ../globalhighlevel-site
python3 build.py
git add posts/ public/
git commit -m "Ship verticals ES Part 1 — agencias-de-marketing hub + pillar + cluster retrofit"
git push  # Cloudflare auto-deploys on push

# 6. Force Google discovery (do NOT rely on sitemap re-fetch — it's 3-7 days)
/indexing-api --urls <hub_url> <pillar_url>
# Delegates to indexing-api skill. Same-day crawl instead of days.

# 7. Update Sheet Verticals Queue row: status=shipped, shipped_date, url
#    Update Cluster Map retrofit_status=retrofitted for the 10 spokes
```

## Model routing

| Stage | Model | Why |
|---|---|---|
| Research | Haiku 4.5 | Mechanical SERP/Reddit extraction |
| Write (Attia) | Haiku 4.5 | Long-form generation, proven in podcast pipeline |
| Fact-check | Haiku 4.5 | Regional accuracy + natural Spanish |
| Language review | Opus 4.6 | Dialect/fluency/fabrication judgment |
| Hub generation | Haiku 4.5 | Structured, follows template |

## Hard rules

- Every non-English pillar must pass the Opus language reviewer. No exceptions.
- No em-dashes anywhere.
- No fabricated people, clients, case studies, specific dollar figures, or ROI claims. See `feedback_never_claim_about_bill_or_william.md` and RULE #0 in `SPANISH_FACT_RULES`.
- William Welch bio uses canonical text only. See `reference_william_welch_bio.md`.
- Pricing must match `businesses/globalhighlevel.yaml`.
- Per-market research is mandatory (don't translate-once).
- Every pillar links to its series hub. Every hub lists Parts 2-9 as "próximamente" until shipped.
- Failed fact-check OR failed Opus review = no ship.

## Three-tier CTA (required on every pillar and hub)

| Position | Tier | Target | CTA pattern |
|---|---|---|---|
| Primary (top + bottom) | Self-service | GHL affiliate trial | "Prueba GoHighLevel GRATIS por 30 días" |
| Secondary (mid-post) | Help-needed | Extendly affiliate | "¿Prefieres implementación hecha por expertos? Extendly..." |
| Tertiary (gated footer) | Enterprise | Contact form, $7,500+/mo | (only when qualified) |

**Never:** "book a call with Bill", "1-on-1 coaching", generic "work with us."

## De-siloing rule

Every new hub URL must have ≥3 inbound internal links from existing published pages BEFORE deploy. For Part 1 agency ES, `verticals_retrofit.py` is the one-time enforcement. When Part 2 ships, promote this to a `seo-deploy-gate` rule #9 so future orphans become impossible.

## Scaling plan (not premature — just the path)

- **Now:** Part 1 ES ships. Measure week 2 leading indicator (indexed, impressions >0).
- **Week 2-4:** If indexed cleanly, ship Part 1 in EN + IN + AR using the same hardcoded dispatcher pattern, copy-paste per language. Explicit three copies before any abstraction.
- **Week 4-8:** Parts 2-3 ES.
- **Week 8:** winning-metric check (position/CTR/affiliate). Cull if 2 of 3 fails.
- **Second vertical (plumbers):** first copy of dispatcher.
- **Third vertical (electricians):** signal to extract a shared skeleton. Not before.

## Where things live

| Thing | Location |
|---|---|
| Verticals Queue tab | GHL Sheet `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E` |
| Cluster Map tab | Same Sheet |
| Generated posts | `globalhighlevel-site/posts/*.json` |
| Hub pages | `globalhighlevel-site/posts/hub-[vertical].json` (url_path routes them) |
| Pipeline code | `ghl-podcast-pipeline/scripts/verticals_*.py` + `language_reviewer.py` |
| Templates | `~/.claude/skills/verticals-pipeline/references/` |
| This skill | `~/.claude/skills/verticals-pipeline/SKILL.md` |
| Backup | `agent-command-center/skills/verticals-pipeline/SKILL.md` |

## Related memory

- `project_verticals_pipeline.md` — architectural decisions
- `feedback_build_per_business_no_premature_abstraction.md` — why hardcoded is correct
- `feedback_never_claim_about_bill_or_william.md` — fabrication rule
- `reference_william_welch_bio.md` — canonical author bio
- `feedback_no_done_for_you_work.md` — three-tier CTA rule
- `project_globalhighlevel_trial_start_split.md` — /trial vs /start split
