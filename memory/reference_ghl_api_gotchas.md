---
name: GHL API — Learned Gotchas
description: Field-tested quirks of the GoHighLevel REST API (services.leadconnectorhq.com) learned while building client infra. Reference before hitting any GHL endpoint programmatically.
type: reference
originSessionId: 49e7c087-0184-47f6-bacd-e5a0e92ec020
---
# GHL API — Learned Gotchas

Collected 2026-04-20 → 2026-04-21 building Derek Simkins / Capstone Connectors infrastructure. All tested against `services.leadconnectorhq.com` with a PIT token + header `Version: 2021-07-28`.

## Auth

```
Authorization: Bearer <PIT_TOKEN>
Version: 2021-07-28
Accept: application/json
```

Token is `GHL_PRIVATE_TOKEN` in P2P `.env` — covers the REI Amplifi sub-account (`VL5PlkLBYG4mKk3N6PGw`). Verified working for contacts (create/update/notes/tags), media upload, invoice schedules (create/read/update via PUT).

## Invoice Schedules (`/invoices/schedule`)

### rrule MUST be nested — flat interval fields silently ignored
`schedule.intervalType` + `schedule.interval` at the top level of `schedule` get silently dropped. Must use:
```json
"schedule": {
  "rrule": {
    "intervalType": "monthly",
    "interval": 1,
    "startDate": "YYYY-MM-DD",
    "timezone": "US/Eastern",
    "startTime": "09:00:00",
    "daysBefore": 0,
    "dayOfMonth": 20
  }
}
```
Passing only `executeAt` + flat fields creates a one-time schedule with NO error. Verify the rrule came back in the response.

### `executeAt` format
Must be `YYYY-MM-DDTHH:mm:ssZ`. NO milliseconds. `2026-04-20T17:00:00Z` ✓, `2026-04-20T17:00:00.000Z` ✗.

### `discount` cannot be empty
`{}` returns 422 `"discount should not be empty"`. Must be `{"value": 0, "type": "percentage"}`.

### Required fields on POST `/invoices/schedule/`
`altId`, `altType: "location"`, `name`, `currency`, `contactDetails` (must contain `id`, `name`, `email`), `items`, `discount`, `liveMode`, `schedule`, `paymentMethods`, `businessDetails.name`.

### PATCH returns 401
`PATCH /invoices/schedule/:id` → `"This route is not yet supported by the IAM Service"`. Use `PUT` with the full updated object.

### Timezone silent override
If you pass a timezone that doesn't match the sub-account default, GHL overrides silently. Verify `rrule.timezone` in the response. Bill's sub-account defaulted to `America/Argentina/Buenos_Aires` during Argentina travel.

### autoPayment CANNOT be pre-enabled via API on drafts
`POST /invoices/schedule/:id/auto-payment` fails with `"Can not update auto payment details"` on any draft schedule. AutoPayment gets populated automatically when the customer pays the first invoice AND ticks "save card." To force the save-card flow, toggle Auto-payment ON in the GHL UI template BEFORE scheduling.

## Contacts (`/contacts`)

### Duplicate-email create returns 400 + existing ID
`POST /contacts/` with an email that already exists returns `400 "This location does not allow duplicated contacts"` with `meta.contactId` set to the existing contact's ID. Use that ID directly — don't re-attempt create.

### Tags endpoint is additive
`POST /contacts/:id/tags` with `{tags: [...]}` APPENDS to existing tags, doesn't replace. Response includes merged list + `tagsAdded` array of what was newly added.

### Notes endpoint creates one note per call
`POST /contacts/:id/notes` with `{body: "...", userId: null}` — each call creates a fresh note. For structured submissions (like onboarding form dumps), concatenate into one body and post once.

### Contact PUT: strip undefined keys before sending
Sending `undefined` values throws. Pattern from P2P `submit.js`:
```js
Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
```

## Media Upload (`/medias/upload-file`)

Multipart form data:
- `file` (the File object)
- `hosted: "false"`
- `name` (filename string)
- `locationId`

Returns `{url, fileUrl, id, fileId}`. Use `data.url || data.fileUrl` as the public URL.
Do NOT set `Content-Type` header — FormData sets it with boundary.

## Cloudflare Pages + GHL Deployment Patterns

### Pages secrets don't apply to existing deploys
`wrangler pages secret put` sets secrets for FUTURE deploys only. After setting a secret, you MUST redeploy — even a no-op redeploy — for the Function to pick it up. Otherwise function returns whatever error maps to missing env var (in P2P pattern: "Server not configured").

### Two CF accounts on Bill's login
Bill's Cloudflare login has access to 2 accounts. `wrangler` fails non-interactively with `"More than one account available"`. Always set:
```
CLOUDFLARE_ACCOUNT_ID=3a28e1ced378fb063bafc21971a44e03
```
(REI Amplifi account.)

### Pages project must exist before first deploy
`wrangler pages deploy` fails with `"Project not found"` if the project doesn't exist. Create first:
```
wrangler pages project create <name> --production-branch=main
```

### .html extension stripped on Pages URLs (308 redirect)
Cloudflare Pages auto-308-redirects `/path.html` → `/path`. Send clean URLs (e.g. `/capstone`, not `/capstone.html`).

### wrangler login is interactive — user must complete browser OAuth
No way around it in Claude Code. Have user paste `! npx wrangler login` in the prompt; the `!` prefix runs in session so OAuth callback lands in conversation context.

## Working Submit Handler Pattern (from P2P and Capstone)

Template at `/Users/kerapassante/Projects/{client}/onboarding/functions/api/submit.js`:

1. Parse multipart form data → plain object + files array
2. Look up contact via `CONTACTS[client]` map (hardcoded per project, contains `contactId`, `tag`, `companyName`)
3. Upload each file to `/medias/upload-file`
4. `PUT /contacts/{id}` with updated fields (undefined-stripped)
5. `POST /contacts/{id}/notes` with structured dump (one note per submission)
6. `POST /contacts/{id}/tags` to tag the contact

All auth via `env.GHL_PRIVATE_TOKEN` + `env.GHL_LOCATION_ID` set as Cloudflare Pages secrets.

## GHL UI URLs (for quick navigation)

- Invoice schedules: `https://app.reiamplifi.com/v2/location/{LOCATION_ID}/payments/invoices/schedules`
- Contact detail: `https://app.reiamplifi.com/v2/location/{LOCATION_ID}/contacts/detail/{CONTACT_ID}`
- Documents & Contracts: `https://app.reiamplifi.com/v2/location/{LOCATION_ID}/payments/documents-and-contracts`
