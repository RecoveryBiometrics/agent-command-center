---
name: gbp-pull
version: 1.0.0
description: "Pulls Google Business Profile data (reviews, business details, completeness audit) for any agency client via the Google Places API. Saves canonical JSON to audit/gbp/ for downstream skills (homepage build, mailer, monthly client report). Read-only — does not post to GBP."
invocation: /gbp-pull
allowed-tools:
  - Bash
  - Read
  - Write
triggers:
  - pull gbp reviews
  - pull google reviews
  - update reviews from google
  - gbp audit
  - gbp insights
  - check google business profile
  - sync reviews
  - refresh google reviews
---

# /gbp-pull — Google Business Profile Data Sync (Read-Only)

The Reviews block, the trust strip, the LocalBusiness schema's aggregateRating field, the monthly client report — they all need fresh GBP data. Without this skill, the homepage shows stale review counts (Bill caught the 109 → 163 drift on 2026-04-27) and copy gets cited from search-aggregator scrapes that contradict the canonical data Google itself returns. This skill is the canonical pull path.

Writes to GBP (post updates, reply to reviews) belong in a separate `/gbp-post` skill — do NOT add write logic here.

## The rule

**Never claim a GBP fact (rating, review count, address, hours, review quote) without citing a current `audit/gbp/{client}-{type}-{date}.json` file produced by this skill.** If the data is older than 30 days, re-pull before citing.

## Invocation (parameterized)

```
/gbp-pull --client p2p --type reviews                        # pull 5 most relevant reviews → audit/gbp/
/gbp-pull --client p2p --type reviews --refresh-site         # ALSO write to site-astro/src/data/reviews.json (live data the homepage reads)
/gbp-pull --client p2p --type details                        # NAP, hours, phone, website, status
/gbp-pull --client p2p --type audit                          # full completeness check (reviews + photos + hours + types)
/gbp-pull --client p2p --bootstrap "Power to the People, 161 Virginia Ave Asheville NC"
                                                              # one-time: find Place ID, cache to state/place-ids.json
```

Underlying script call (the `--refresh-site` is positional arg 4 = absolute path):
```
bin/pull.sh p2p reviews "$PROJECT_ROOT" "$PROJECT_ROOT/site-astro/src/data/reviews.json"
```

## Phase 0 — Load context (resolver)

Read in order:

1. **`~/.claude/skills/gbp-pull/state/place-ids.json`** — has Place ID for the requested client?
   - If missing → run `--bootstrap` mode first (Phase 1)
   - If present → skip to Phase 2
2. **`audit/{client}-onboarding-data.md`** (in client project) — canonical client name + address (used to find Place ID)
3. **`audit/gbp/` directory** in the client project — list existing pulls, decide if a re-pull is needed (default: re-pull if last pull > 30d old, or if `--force`)
4. **`~/.claude/skills/cite-before-write/SKILL.md` § Known caught mistakes** — read every "GBP" entry; honor the lessons (e.g., never silently overwrite onboarding facts with API-returned facts; surface conflicts)

If the client has no onboarding-data file → STOP, tell Bill what's missing.

## Phase 1 — Bootstrap (one-time per client)

**Issue:** New client; we don't have their Place ID yet.

**Context:** Place IDs are stable resource identifiers Google assigns to each business listing. They're discovered once per client via Places `searchText` and cached to `state/place-ids.json`.

**Mechanism:**
1. Read client name + address from `audit/{client}-onboarding-data.md`
2. Run `bin/find-place.sh CLIENT_KEY "BUSINESS_NAME, ADDRESS"`
3. Inspect output. If multiple matches return, prefer the one whose name+address is closest to the onboarding submission. If returned address differs from onboarding address (the 7 Rumbough vs 161 Virginia case for P2P), DO NOT silently accept — surface the conflict to Bill.
4. Confirm with Bill before caching, then store the Place ID in `state/place-ids.json`

**Action:** Cache one entry of shape:
```json
{
  "p2p": {
    "placeId": "ChIJ1at58W2NWYgRWdbGrYTFVJg",
    "name": "Power to the People",
    "address": "7 Rumbough Pl, Asheville, NC 28806, USA",
    "rating": 4.8,
    "reviewCount": 163,
    "mapsUri": "...",
    "_lastUpdated": "2026-04-27T..."
  }
}
```

**Verification:** State file now has the client key. Subsequent `--type` calls will resolve the Place ID without re-searching.

## Phase 2 — Pull (the working verb)

**Issue:** Need fresh GBP data of the requested type.

**Context:** Places API "Place Details" endpoint accepts a Place ID + a `X-Goog-FieldMask` header listing requested fields. Different `--type` flags map to different field masks (see `bin/pull.sh`). Reviews always returns up to 5.

**Mechanism:**
1. Resolve Place ID from `state/place-ids.json`
2. Run `bin/pull.sh CLIENT_KEY TYPE PROJECT_ROOT`
3. Save full response to `{PROJECT_ROOT}/audit/gbp/{client}-{type}-{YYYY-MM-DD}.json`
4. Append a record to `state/last-pull.json` (audit trail of every pull)

**Action:** Output JSON file path on stdout. Caller (the model) reads the JSON and proceeds with judgment phase.

**Verification:** File exists, valid JSON, contains the expected top-level fields for the requested type.

## Phase 3 — Pick (deterministic — was latent, simplified 2026-04-28)

**Issue:** Reviews API returns 5 reviews; the homepage displays 3. Which 3?

**Context:** Originally framed as latent judgment. After two slips on the same week (recency miscall, then a 4★+ vs 5★-only debate with Bill), the rule simplified to a deterministic filter that lives in the consuming template's code, not in skill judgment per session.

**Mechanism (deterministic, lives in `Reviews.astro`):**
```js
reviews
  .filter(r => r.rating >= 4)
  .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
  .slice(0, 3)
```

**Action:** None — the consuming component (`site-astro/src/components/Reviews.astro` for P2P) handles the filter at render time. This skill's job ends at "save the API response to `--refresh-site` path." The component's filter rule + filter values live with the component as evidence anchor.

**Verification:** Reviews display = 3 most recent reviews with rating >= 4. If a 4★+ review comes in tomorrow, next `--refresh-site` call moves it onto the homepage automatically. Zero per-session model judgment in the loop.

**When to override:** if a specific homepage section needs hand-curated reviews (e.g., a service page wants K&T-only reviews, not just "the 3 most recent"), build that filter in the consuming component. This skill stays generic.

## Phase 4 — Surface conflicts (always, never silently)

**Issue:** GBP data may contradict the client's onboarding submission.

**Context:** Conflict-surface rule from `/cite-before-write` Phase 3 fires here. Common categories of conflict:
- **Address:** GBP-canonical vs onboarding-submitted (P2P case: 7 Rumbough Pl vs 161 Virginia Ave — surface, do not auto-overwrite)
- **Hours:** GBP-canonical vs onboarding (use onboarding for the *site* schema; GBP itself can be updated by the client separately)
- **Phone:** GBP vs onboarding (escalate; should match)
- **Review count drift:** copy claims X, GBP says Y (use GBP — it's the canonical source for live numbers)

**Mechanism:** For each field where GBP and onboarding differ, emit a Bill-readable note in the skill's output: `CONFLICT: {field} — GBP={value} vs onboarding={value}. Default action: {what we did}. Bill arbitrates.`

**Action:** Always print conflicts. Never silently update copy on the basis of GBP data alone (except canonically-numerical fields like aggregateRating where GBP is unambiguously authoritative).

## Phase 5 — Self-verify before reporting "done"

- [ ] Output JSON file path printed on stdout?
- [ ] File contains the expected top-level fields for the requested `--type`?
- [ ] If `--pick` requested, each pick traces to a specific homepage claim?
- [ ] All conflicts vs onboarding data surfaced (not silently resolved)?
- [ ] `state/last-pull.json` updated with this run's record?
- [ ] If a copy file in `site*/` will be touched next, the EVIDENCE ANCHORS block must cite the new `audit/gbp/{client}-{type}-{date}.json`?

If any answer is "no" → not done.

## Phase 6 — Self-improving rules

After every session that uses this skill:
1. Did the API call fail in a new way (rate limit, scope, project misconfig)? → Log to `state/caught-mistakes.json`. Add a Phase 0 check.
2. Did Bill correct a `--pick` selection? → Log which review was rejected and why. Update Phase 3 scoring rules.
3. Did a new `--type` mode emerge (e.g., photos, Q&A)? → Add to `bin/pull.sh` and document in invocation.
4. Did the GBP-vs-onboarding conflict surface a NEW field type? → Add to Phase 4 conflict matrix.

Write new rules directly into this SKILL.md.

## Persistent state

```
~/.claude/skills/gbp-pull/state/
  place-ids.json          — client key → Place ID + cached canonical fields
  last-pull.json          — append-only log of every pull (last 100 entries)
  caught-mistakes.json    — failures, lessons, Bill's corrections
```

## Auth + project setup (operational, not skill content)

Bootstrap (one-time, manual):
```
gcloud auth login bill@reiamplifi.com   # or whichever account has the Places-enabled project
gcloud services enable places.googleapis.com --project={PROJECT_WITH_BILLING}
```

Default config used by `bin/`:
- `GBP_ACCOUNT=bill@reiamplifi.com` — agency account, owner of `rei-amplifi-tools` project
- `GBP_PROJECT=rei-amplifi-tools` — agency GCP project, billing linked (017BB6 "use this now"), Places API enabled

Migration note: pre-2026-04-28 default was `safebath-seo-agent` under `williamcourterwelch@gmail.com` because cross-account billing-link was blocked by quota (default 5 projects per billing account; was full). Migration completed 2026-04-28 by unlinking dormant `gen-lang-client-0265874861` to free a slot. Cost on either project = $0 (Places API free tier covers all expected agency usage).

To override: `GBP_ACCOUNT=... GBP_PROJECT=... /gbp-pull --client {x} --type reviews`

## Known caught mistakes (so far)

- **2026-04-27, P2P review-count drift** — Site copy claimed "109+ Google reviews" (sourced from project CLAUDE.md). Live GBP via Places API = 163. The CLAUDE.md figure was a snapshot from when the project started; not a live source. Lesson: never cite review counts from CLAUDE.md or audit notes — always pull fresh via this skill before any copy update.
- **2026-04-27, P2P address conflict** — Places API canonical address: `7 Rumbough Pl, Asheville, NC 28806`. Andrew's onboarding submission: `161 Virginia Ave Asheville NC 28806`. Did NOT silently update — surfaced to Bill. Until resolved, schema/footer/contact use Andrew's onboarding-submitted address (his answer wins on facts; he can update GBP separately if 7 Rumbough is stale).
- **2026-04-27 → 2026-04-28, billing project migration** — Initially pivoted to `safebath-seo-agent` (under williamcourterwelch@gmail.com) because `rei-amplifi-tools` (agency) had no billing linked, and the link command failed because all 3 of bill's billing accounts were at the default 5-project quota cap. **Migration completed 2026-04-28**: unlinked dormant `gen-lang-client-0265874861` (Gemini API auto-create, never used) from billing account `017BB6` to free a slot, then linked `rei-amplifi-tools` to `017BB6`, enabled Places API there, swapped defaults. **Lesson:** when GCP billing project quota fights you, look for auto-generated dormant projects (`studio-*`, `gen-lang-client-*`) — they're typical Firebase Studio / Gemini API bootstraps and almost always safe to unlink. Also: changing `GBP_PROJECT` is a 1-line skill-default change; the verb itself is project-agnostic by design (env-var override).

- **2026-04-28, Phase 3 review-pick recency miscall** — Selected Rick Crelia's review (rated 5★, 2 years ago, "5-year customer + 200A panel + Generac generator") for the homepage as a "breadth + long-relationship" signal. Bill caught: the timestamp ("2 years ago") plus the quote's literal "5-year customer" phrasing dated the entire reviews block. Reader heuristic: if any visible card timestamp is > 12 months, the whole reviews section reads as stale, regardless of how strong the individual quote is. **Lesson:** in Phase 3 (review picks for hero/homepage), recency under 6 months should be a HARD filter, not a soft factor — UNLESS no recent reviews exist at all. Breadth/specialty signals can come from later sections (About, service pages) without dating the homepage. Updated Phase 3 scoring: `recency<6mo` is a gate; pick the most-validating subset of recent-only candidates.

- **2026-04-28, broken `g.page` short URL** — `http://g.page/p2pavl` (Andrew's old GBP short link, found in his JSON-LD on the legacy Squarespace site) 302-redirects to `google.com/search?q=p2pavl` (a generic search results page, not his listing). Used it in 3 places: Reviews link, Footer "Google" link, BaseLayout `sameAs` schema. All 3 swapped to the canonical `https://maps.google.com/?cid={CID}` URL returned by Places API in the `googleMapsUri` field. **Lesson:** Andrew's self-set-up `g.page/*` shortcuts are unreliable. Always use the canonical `googleMapsUri` from Places API (in `state/place-ids.json`, field `mapsUri`) as the canonical "go to Google reviews" link.

## Method-call test

Same skill, different inputs, different outputs:

```
/gbp-pull --client p2p --type reviews          → audit/gbp/p2p-reviews-2026-04-27.json
/gbp-pull --client p2p --type details          → audit/gbp/p2p-details-2026-04-27.json
/gbp-pull --client p2p --type audit            → audit/gbp/p2p-audit-2026-04-27.json
/gbp-pull --client hatch --type reviews        → audit/gbp/hatch-reviews-2026-04-27.json (after bootstrap)
```

Same procedure (resolve Place ID, fetch via Places API, save canonical JSON, surface conflicts, optionally pick subset). Different inputs (client, type). Different output files. Per Tan: parameterized verb, not a script.
