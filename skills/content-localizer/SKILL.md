---
description: Classify language + topic, localize CTAs/pricing/currency, and place blog post JSONs correctly. Called by any content pipeline.
invocation: /localize
when_to_use: When a pipeline creates content that needs language classification, market localization, or correct placement on the site.
---

# Content Localizer

Ensures every blog post has the correct language tag, topic category, localized CTAs, and local pricing before deployment.

## Usage
```
/localize safebath        # Reclassify + localize all SafeBath posts
/localize ghl             # Reclassify + localize all GHL posts
/localize ghl --post slug # Localize a single post by slug
```

## Stages

1. **01-classify** — Detect language + assign real topic category
2. **02-localize** — Adapt CTAs, pricing, compliance for target market
3. **03-place** — Write JSON with correct metadata to both posts/ directories

## How pipelines use this

Any pipeline creating content should set `language` and `category` on posts using the classification logic in `references/topic-keywords.md`. The localization stage adds market-specific CTA text, pricing in local currency, and correct affiliate UTMs.

## References (Layer 3)
- `references/topic-keywords.md` — keyword lists per language for topic classification
- `references/market-config.md` — CTA text, pricing, currency, compliance per market
- `references/affiliate-links.md` — affiliate link templates per business

## Adding a new language
1. Add language to `categories.json` in the site repo
2. Add keyword list to `references/topic-keywords.md`
3. Add market config to `references/market-config.md`
4. Every pipeline automatically classifies + localizes correctly
