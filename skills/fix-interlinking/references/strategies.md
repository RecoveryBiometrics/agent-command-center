# Strategy playbooks — when to use each, what it does, what NOT to do

## money-juice

**When:** A designated money page has <50 inbound internal links AND is buried at position >15 in GSC despite having buyer-intent demand (>200 monthly impressions).

**Mechanism:** Insert ONE contextual link per source post into a body-text match of a trigger phrase. Vary anchor text across 5+ phrasings. Skip headings, existing `<a>` tags, non-language-matching posts.

**Trigger config:** `references/triggers/<target-slug>.json` with shape:
```json
{
  "language": "en",
  "trigger_phrases": [
    ["30-day trial", ["30-day GoHighLevel trial", "extended 30-day free trial", "..."]],
    ["promo code", ["GoHighLevel promo codes", "real GoHighLevel promo codes"]]
  ]
}
```
Triggers are ordered most-specific-first. Anchors rotate to balance distribution.

**Anti-patterns (what NOT to do):**
- DO NOT use a single bare word as a trigger ("pricing", "cost") — too generic, hits unrelated contexts. Always require qualifier ("GoHighLevel pricing", "$97/month plan").
- DO NOT link from non-language matches (English target on a Spanish post). Anchor language must match source post language.
- DO NOT link to robots-Disallowed or `noindex` URLs. Those don't accept PageRank inbound. Always link to the SEO-indexable canonical.
- DO NOT exceed 1 inbound link per source post per target. More than that triggers spam patterns.
- DO NOT pick anchors that mislead the user (e.g., "free coupon" as anchor when the target is a pricing comparison). Mismatched anchor → high bounce → ranking loss.

---

## hub-spoke (STUB — implementation pending)

**When:** A new hub page (vertical, category, language) just published. Or an existing hub has <30 child pages linking to it.

**Mechanism:**
- FROM children TO hub: insert one contextual link per child post that mentions a related concept. Anchor varies by topic the child covers.
- FROM hub TO children: rebuild the "explore the cluster" section listing all relevant children, sorted by date or popularity.

**Pre-implementation notes:**
- The verticals-pipeline already does part of this for `/for/<vertical>/` hubs. Don't duplicate — call into its primitives if they're factored cleanly.
- Children should pass a relevance test (the post actually discusses the hub topic). Spammy hub-stuffing hurts more than it helps.

---

## orphan-rescue (STUB — implementation pending)

**When:** `audit.py --diagnose` flagged ≥5 pages with 0 inbound internal links (other than nav/footer/sitemap).

**Mechanism:**
1. Group orphans by topic cluster (semantic similarity to existing hub pages).
2. For each orphan, find 3–5 sibling posts (same cluster) that don't currently link to it.
3. Insert one contextual link per sibling using the orphan's most distinctive phrase as the anchor seed.
4. Add the orphan to its cluster's hub page (if a hub exists).

**Pre-implementation notes:**
- Some orphans deserve to be orphans (low-quality auto-generated, deprecated topics). Diagnose intent before adopting — `audit.py --diagnose` should flag candidates, not auto-include them all.

---

## broken-link-cleanup (STUB — HIGH PRIORITY)

**When:** Audit flagged internal links pointing to URLs that 301 redirect or 404.

**Why HIGH priority:** Today's master/pricing consolidation (commit 2fcf7d2) 301'd 7 URLs. Some old posts may still link directly to `/coupon`, `/promo`, `/start`, etc. Those links waste a hop of PageRank. Retarget them directly to `/blog/gohighlevel-free-trial-30-days-extended/`.

**Mechanism:**
1. Build a redirect map by parsing `_redirects` and following each chain to its terminal URL.
2. Scan all posts for internal links matching any non-terminal URL in the map.
3. Replace each with the terminal URL. Keep the anchor text unchanged.

**Pre-implementation notes:**
- Be careful with anchor text mismatches after retargeting. If anchor said "see our coupon page" and the link now points to the trial master, the anchor is misleading. May need to flag for human review rather than blind-replace.

---

## anchor-diversify (STUB — implementation pending)

**When:** Audit flagged a target page where one anchor text is >70% of all inbound anchors. Common after a money-juice run if the rotation list was too short.

**Mechanism:**
1. Count anchor distribution for the target.
2. Randomly select N posts using the dominant anchor.
3. Replace anchor text on those posts with alternative phrasings (from the target's `triggers/<slug>.json` rotation list).
4. Do NOT change link target — only anchor text.

**Pre-implementation notes:**
- This is a touchier mutation than money-juice. Wrong anchor change = misleading users. Always run `--dry-run` first and human-review.

---

## related-posts-refresh (STUB — implementation pending)

**When:** Posts have stale or missing "you might also like" / "related posts" blocks; new posts published since last refresh.

**Mechanism:** For each post, compute 5 most-related posts (cluster + recency), update or insert a structured block at the bottom of `html_content`.

**Pre-implementation notes:**
- The "related posts" block format must match the site's existing template. Look at one post's HTML before deciding the block shape.
- Don't over-link — 5 related is plenty. More dilutes signal.
