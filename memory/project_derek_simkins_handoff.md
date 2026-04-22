---
name: RESUME DEREK SIMKINS / CAPSTONE CONNECTORS WORK
description: Session handoff for Derek Simkins fractional CTO engagement. Paid 2026-04-20. Onboarding form + tracker live. Friday 3pm ET check-in cadence. Say "resume the Derek work" to pick up.
type: project
originSessionId: 49e7c087-0184-47f6-bacd-e5a0e92ec020
---
# Derek Simkins / Capstone Connectors — Fractional CTO Engagement

**Status as of 2026-04-21:** First invoice PAID. Onboarding form deployed and sent. Tracker sheet seeded with 9 tabs. Awaiting Derek's form submission + Google Drive uploads by Friday 2026-04-24. First working check-in Friday 3pm ET.

## Client

- **Name:** Derek Simkins
- **Email:** derek@capstoneconnectors.com
- **Cell (SMS):** (828) 767-0133
- **Operating entities:**
  - **Capstone Connectors** — parent / public brand, current primary
  - **Mind Squad Consulting** — ops: cash conversions, bridge lending, ScaleKit affiliate. Derek wants as primary going fwd
  - **Hidden Roses** — RE holdings, sidelined per Derek
  - **AVL Homes** — broker affiliate for hard money, Derek operates under this ($3-4K/deal)
  - **Wife's credit-stack entity** (new 2026-04) — $100-200K stack, conservative/collateralized
  - **Derek's 2nd credit-stack entity** (new 2026-04) — parallel to Mind Squad
- **Service area:** Asheville / Western NC

## Deal

- **Role:** Fractional CTO (Bill)
- **Fee:** $1,500/mo — NO setup fee
- **First invoice paid:** 2026-04-20
- **Billing:** Monthly on the 20th, card only, auto-bill once Derek saves card on first paid invoice
- **Initial term:** 12 months (through 2027-04-20)
- **After:** Month-to-month, 30-day notice
- **Buyout:** 6× monthly ($9,000) for perpetual license + infra transfer
- **Retention lever:** License-not-sold (§4 of contract). Code / bots / GHL builds licensed during active engagement. Cancel = access revoked.

## HARD RULE Flag

$1,500/mo violates `feedback_no_done_for_you_work.md` HARD RULE ($7,500+/mo × 12 minimum). Bill overrode as CEO 2026-04-20. Not a precedent for future done-for-you deals.

## GHL — TWO Sub-Accounts In Play (IMPORTANT)

1. **REI Amplifi sub (Bill's agency):** `VL5PlkLBYG4mKk3N6PGw`
   - Bill's CLIENTS live here as contacts. Derek = `KEWiznuay9552eO3FPot`.
   - Invoice schedule, onboarding form notes, tracker references all target THIS sub.

2. **Capstone Connectors sub (Derek's own CRM):** `F5lbLe53Cx2qOeBdAglN`
   - Bill is agency admin (full access via `app.reiamplifi.com`).
   - Derek's business CRM for HIS clients/borrowers.
   - Contact `ELgHMEWtHJiKaILNLwoH` exists inside it (purpose TBD).
   - Future Slack bot + Depositum integration + client-facing pipelines build INTO this sub.

## Key GHL IDs & Creds

- **PIT token env var:** `GHL_PRIVATE_TOKEN` — stored in `/Users/kerapassante/Projects/power-to-the-people/.env`. ALSO set as Cloudflare Pages secret on `capstone-onboarding` project.
- **Invoice Schedule ID:** `69e6690d6589b7a475ad01f7` (status may have flipped from draft → active after Derek's 2026-04-20 payment — verify via GET before acting)
- **Invoice Template ID:** `69e6690d6589b7cfa7ad01ef`
- **Contract Note ID on Derek's contact:** `sjaNPiMtZZfO0L849Jjh`
- **Tags on Derek's contact:** `fractional-cto`, `capstone-connectors`, `active-client`, `rei-amplifi-service` + `capstone-onboarding-submitted` after form

## Contract

- **Google Doc:** https://docs.google.com/document/d/18J3uvS4YixwBD_6CdnL0YfBEYO-CM34iuPPTNaXT4-I/edit
- Derek has commenter access; deal confirmed via invoice payment, not countersign
- §4 License-not-sold + §5 Buyout clause are the retention levers

## Tracker Sheet (ops, NOT client-facing)

- **URL:** https://docs.google.com/spreadsheets/d/1B_PrtFYjHQgs8TQpETRIku0YMGGAKcUVAH30AICOHiI/edit
- **9 tabs:** README, Onboarding Responses, Access Inventory, Entity Map, Scope In-Out, Docs Inventory, Client Workflows, Active TODOs, Build Queue
- All seed data populated 2026-04-21. Live URL in README tab (B22).

## Onboarding Form (LIVE)

- **Live URL:** https://capstone-onboarding.pages.dev/capstone
- **Source:** `/Users/kerapassante/Projects/capstone-connectors/onboarding/`
- **Cloudflare Pages project:** `capstone-onboarding` (account `3a28e1ced378fb063bafc21971a44e03` — REI Amplifi)
- **Secrets set on production:** `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID=VL5PlkLBYG4mKk3N6PGw`
- **Submit handler:** `/functions/api/submit.js` — hardcoded CONTACTS map to `KEWiznuay9552eO3FPot`
- **Structure:** 6 sections, ~30 fields, 7-8 min (Identity / Brand Direction / Entities & Invoicing / Access / Documents / Cadence & Workflow)
- **On submit does:** upload files to GHL media lib → PUT contact update → POST structured note → POST tag `capstone-onboarding-submitted`

## Scope

**IN:**
- SEO (Capstone Connectors website)
- Slack / ScaleKit automation bot (cash conversions, bridge loans, notary scheduling, card pre-auth, signed-check collection)
- GHL build-out: invoicing, pipelines, Depositum integration (replaces Fan Basis + invoice generator + Adobe)
- Website cleanup (remove unauthorized partner logos)
- Google Business Profile for Asheville hard money (AVL Homes affiliate)
- Ongoing tech advisory

**OUT (Derek retains):**
- Signing, notarization, fund movement, legal review, lending license / compliance
- Podio fix-and-flip (broker handles)
- VIP hard-money automation (broker building separately)
- Facebook personal account posting (VA territory, not bot-automatable)
- Adobe Sign (replaced by GHL)
- Fan Basis (replaced by Depositum)
- Podcast / paid ads outside Google
- Custom software dev beyond retainer

## Friday 2026-04-24 3pm ET — Deliverables for First Check-In

**Derek owes (per 2026-04-20 call):**
1. Upload Slack transcripts of worked-through clients to Google Drive
2. Organize GDrive folders (subfolder: `transcripts` per his choice)
3. Add `bill@reiamplifi.com` as Content Manager on the whole GDrive folder
4. Complete onboarding form at https://capstone-onboarding.pages.dev/capstone
5. Sign up for Depositum (if not done)
6. Cancel Adobe
7. Strip fake placeholder partner logos from Capstone website
8. Find / confirm bridge-loan attorney

**Bill owes:**
1. Research hard-money loan websites (competitor analysis for Capstone site)
2. Send onboarding form URL — DONE 2026-04-21
3. Begin mapping Slack bot workflows once GDrive uploads land

## Post-Form Follow-up (when Derek submits)

Pull the submission note, then:
1. Populate tracker sheet's "Onboarding Responses" tab
2. Update Access Inventory tab with what he checked off
3. Flag blockers for Friday's call

Command to retrieve notes:
```
GET https://services.leadconnectorhq.com/contacts/KEWiznuay9552eO3FPot/notes
Headers: Authorization: Bearer $GHL_PRIVATE_TOKEN, Version: 2021-07-28
```

## Build Queue Priorities (from Build Queue tab, seeded 2026-04-21)

1. **P0 Done** — Tracker sheet + onboarding form
2. **P1 Blocked** — Slack automation bot (cash conversions workflow first). Blocked on Derek's GDrive transcripts upload. Target 2026-05-05.
3. **P1 Blocked** — Capstone website rebuild. Blocked on access + competitor research. Target 2026-05-15.
4. **P2 Blocked** — GHL build-out in Derek's sub (Depositum integration, pipelines). Blocked on Depositum signup + entity routing confirmation.
5. **P2 Blocked** — Website cleanup (strip fake partner logos). Blocked on website access.
6. **P3 Blocked** — GBP for Asheville hard money. Blocked on ownership decision.
7. **P2 Blocked** — Bridge-loan reminders automation. Blocked on attorney review of bridge-loan doc.

## Resume Path

**Say "resume the Derek work"** — entire state reloads.

Before acting, verify:
1. Invoice schedule `69e6690d6589b7a475ad01f7` status (should be `active` or `scheduled` post-2026-04-20 payment) via `GET /invoices/schedule/{id}?altId=VL5PlkLBYG4mKk3N6PGw&altType=location`
2. Onboarding form still up at https://capstone-onboarding.pages.dev/capstone (HTTP 200)
3. Derek's contact notes — check for new onboarding submission note

## GHL API Gotchas Learned This Session

Extracted into `reference_ghl_api_gotchas.md` for reuse on future GHL work (any client).
