---
name: cite-before-write
version: 1.0.0
description: "Pre-write evidence gate. Fires before Claude writes/edits any customer-facing copy file (site/, mailer/, briefs/, drafts/) or drafts client-facing communication. Forces an evidence-anchor comment block citing the audit/memory/onboarding sources behind every significant copy decision. Catches positioning slips where Claude writes from instinct instead of from cited evidence."
invocation: /cite-before-write
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
triggers:
  - write the homepage
  - write the hero
  - write the title
  - write copy for
  - write the H1
  - write the FAQ
  - write the meta
  - draft the mailer
  - draft the email
  - update the homepage
  - rewrite the
  - building the site
  - service page copy
  - mailer copy
  - email to Andrew
---

# /cite-before-write — Cite Before You Ship

**Why this exists:** Bill caught Claude writing a P2P homepage hero positioned around K&T when memory `project_kt_is_specialty.md` and Andrew's onboarding submission both said K&T is specialty NOT spearhead. The slip was: Claude anchored on stale CLAUDE.md framing instead of fresher evidence. Without a forcing function, that pattern keeps happening; Bill keeps having to audit. This skill is the forcing function.

## The rule

**Every customer-facing copy decision must trace to a named source file and section.** No anchor block at the top of the file → no copy gets written. If sources conflict, surface the conflict — never silently pick.

## Latent vs. deterministic split

This skill is *latent* (judgment): "is this copy faithful to the cited sources?" — requires the model.

The matching hook in `settings.json` is *deterministic* (execution): "does this Edit/Write target a gated path AND lack an EVIDENCE ANCHORS block?" — pure file-pattern check, no intelligence needed.

When the hook blocks a write, this skill is what unblocks it.

## When this fires

Customer-facing files (gate ON):
- `site/**/*.html`, `site/**/*.astro`, `site/**/*.md`, `site/**/*.txt`
- `mailer/**/*`
- `briefs/**/*`
- `drafts/**/*`
- Direct emails/SMS drafted on Bill's behalf to clients or their customers

Internal files (gate OFF — no anchor needed):
- `audit/**` (these ARE the source files)
- `MEMORY.md`, `STATE.md`, `*.log`
- Markup-only edits where no copy strings change
- Conversation replies to Bill in chat

## Phase 0 — Load context (resolver)

Before any copy decision, read in order:

1. **Client onboarding submission** — `audit/{client}-onboarding-data.md` (P2P: `audit/andrew-onboarding-data.md`)
2. **Strategy memory** — every `~/.claude/projects/{client}/memory/project_*.md` and `feedback_*.md`
3. **Audit deliverables** — `audit/competitor-deep-dive.md`, `audit/build-priorities.md`, `audit/competitor-matrix.md`, `audit/headers-and-schema.md`, `audit/squarespace-inventory.md`
4. **Brand system** — `brand-system.md` (or `DESIGN.md` fallback)
5. **Project CLAUDE.md** — context, NOT gospel. If conflicts with memory, see Phase 3.

If a required source for the decision is missing, STOP and tell Bill what's missing.

## Phase 1 — Match content type to required sources

| Content type | Sources to cite (min 2) |
|---|---|
| `<title>`, `<h1>`, hero copy, meta description | onboarding (voice), competitor-deep-dive (positioning + keyword), memory |
| Service-card order, hub/spoke prominence | onboarding (priority ranking), memory (specialty vs flagship), build-priorities |
| FAQ questions | competitor-deep-dive §4 (FAQ targets), competitor PAA |
| FAQ answers | onboarding (voice + warranty + pricing), audit cost data, brand-system |
| Service-page positioning | memory + onboarding + build-priorities — NOT just CLAUDE.md |
| Mailer copy | brand-system (voice), onboarding (differentiator), competitor-matrix (anti-patterns) |
| Direct emails/SMS to client or customers | onboarding (voice), memory `user_voice.md` if Bill-voiced |
| Cost claims | competitor-deep-dive §6 (PAA + featured snippets), client onboarding actuals |
| Schema fields (name, hours, address) | client onboarding submission — NEVER infer |

Fewer than 2 sources or no listed source applies → flag as evidence-light, surface to Bill.

## Phase 2 — Write the evidence anchor FIRST

Before any copy goes into the file, write the anchor block at the top:

```html
<!--
EVIDENCE ANCHORS — fired by /cite-before-write
Date: YYYY-MM-DD
File: {path}
Skill version: 1.0.0

[Decision 1: e.g., "Hero H1 positioning — general electrician, not K&T"]
  Source A: audit/andrew-onboarding-data.md § Brand voice
    Justifies: voice as "friendly fast estimates, lifetime warranty"
    Quote: "Friendly fast estimates. Copious communication every step of the way. Lifetime warranty for workmanship."
  Source B: ~/.claude/projects/{client}/memory/project_kt_is_specialty.md
    Justifies: K&T is specialty NOT spearhead — homepage hero must be general "electrician asheville"

[Decision 2: e.g., "Service-card order"]
  Source A: audit/andrew-onboarding-data.md § Service Priorities
    Justifies: Residential = TOP, K&T = HIGH (tied with 5)
  Source B: audit/competitor-deep-dive.md § 9
    Justifies: K&T as featured-specialty visual treatment, not hero hook

Conflicts surfaced: none
-->
```

For non-HTML files, use that file's comment syntax.

## Phase 3 — Cross-check for conflicts

Before writing the actual copy:

1. Does this contradict any `memory/*.md`? Grep memory for topic keywords.
2. Does this contradict the onboarding submission? Andrew's actual words win on facts; his actual voice wins on tone.
3. Does this contradict prior audit findings? Especially `competitor-deep-dive.md` §9 and `build-priorities.md`.

**Conflict resolution rule:**
- Newer/more-specific evidence > older/general framing.
- Memory > project CLAUDE.md when conflicting on positioning.
- Onboarding submission > memory on facts (hours, email, services, pricing).
- Brand-system > DESIGN.md on aesthetic.

Conflict can't be resolved from sources → STOP, surface to Bill, he arbitrates.

## Phase 4 — Write the copy, anchored

With anchor written and conflicts resolved, write the copy. Each significant element must trace to its anchor entry.

## Phase 5 — Self-verify before reporting "done"

- [ ] Evidence anchor block present at top of file?
- [ ] All cited source paths actually exist (verify with Read)?
- [ ] All sources actually contain the claim cited (verify content, not just claim)?
- [ ] No conflicts ignored (if any surfaced, were they resolved with Bill)?
- [ ] Voice matches client's onboarding voice answer (re-read verbatim)?
- [ ] No service positioning that contradicts memory specialty/spearhead rules?
- [ ] Schema/facts (hours, name, email, address) match onboarding submission verbatim?

If any answer is "no" → not done.

## Phase 6 — Self-improving rules

After every session:
1. Bill caught a copy mismatch? → Add the failure pattern to Phase 3. Append to `state/caught-mistakes.json`.
2. A citation proved wrong (file/quote not actually present)? → Tighten Phase 5 verify step.
3. New content type appeared not in Phase 1? → Add it with required sources.
4. Bill updated CLAUDE.md or memory in response to a slip? → Add the resolved framing here.

Write new rules directly into this SKILL.md.

## Persistent state

```
~/.claude/skills/cite-before-write/state/
  citation-log.jsonl       — every gated file written, anchors, date
  caught-mistakes.json     — Bill's corrections, read at session start
```

## Known caught mistakes

- **2026-04-27, P2P homepage hero** — K&T positioned as primary keyword in `<title>`, H1, meta description, services-card order. Memory file `project_kt_is_specialty.md` had already written: *"K&T is specialty, NOT spearhead — residential service + panel + EV charger are the flagships; K&T anchors realtor mailer."* Andrew's onboarding put Residential = TOP. Claude anchored on older project CLAUDE.md framing ("bread and butter is K&T") instead.
  **Lesson:** Memory files supersede outdated CLAUDE.md framing. If CLAUDE.md says X and memory says Y, memory wins. CLAUDE.md was reconciled the same day; the gate is the durable fix.

- **2026-04-27, P2P service-spoke build order (chat recommendation, not yet a file)** — After fixing the homepage, Claude recommended building K&T as service-page #1. Same K&T-anchoring failure but in chat (which the hook does NOT gate). Bill caught it: *"why are you obsessed with kt?"* The audit file `build-priorities.md` had K&T as 2.1 because it was written BEFORE Andrew's onboarding data was pulled, then never re-anchored to fresh data. Claude cited that stale file as authoritative.
  **Lesson:** Audit deliverables can become stale. When a fresh data pull lands (onboarding, GBP API, call notes), RE-ANCHOR all downstream audit files that predate the pull — don't keep citing them as authoritative. In Phase 0, before citing any `audit/*.md`, check its "Last updated" date against the most recent onboarding/memory mutation; if older, treat as draft and re-anchor against the newer source. Chat-recommendation surface is also a slip vector — the hook gates files, not chat — discipline must extend to chat by manually invoking Phase 1 (match content type → required sources) before any positioning recommendation.

- **2026-04-27, hook scope hole** — When `site-astro/` was created (parallel to `site/` for the Astro port), the hook's path filter only matched `*/site/*` and missed `*/site-astro/*`. Caught proactively before it produced a slip. Hook updated to `*/site*/*` to cover all `site*` variants. Also added `node_modules`, `.astro/`, `dist/` exclusions to avoid spurious blocks on framework code.
  **Lesson:** Path filters must keep up with directory creation. When new client-facing directories are introduced, audit the hook's matcher.

- **2026-04-27, GBP review pull discrepancies** — While trying to pull real reviews via WebFetch, surfaced two inconsistencies vs. our existing data:
  (a) Address: WebSearch result lists "7 Rumbough Pl" while Andrew's onboarding submission + JSON-LD say "161 Virginia Ave". Likely a stale aggregator vs. canonical, but worth confirming with Andrew.
  (b) Review count: WebSearch says 105; CLAUDE.md + homepage trust strip say "109+". Likely just review-count drift over time.
  **Lesson:** Even read-only data pulls surface conflicts. When the gate fires for a "small" copy update (like swapping a number from 109 to 105), don't update silently — surface the discrepancy first. Aggregator data ≠ canonical; canonical is GBP API or Andrew himself.

## Anti-patterns

- Citing the file path without verifying the quote actually exists in the file
- Writing copy then back-filling the anchor (defeats the gate — anchor goes FIRST)
- Treating the anchor as cosmetic — the model must actually use those sources to make decisions
- Skipping the gate "because the change is small" — small changes are where the K&T-class slip happened

## Method-call test

Same skill, different inputs, different outputs:

```
/cite-before-write --file site/services/knob-and-tube.html --type service-page
/cite-before-write --file mailer/v1-realtor.md --type mailer
/cite-before-write --file site/index.html --type homepage --decision "service-card order"
```

Same procedure. Different inputs. Different anchor content per call.
