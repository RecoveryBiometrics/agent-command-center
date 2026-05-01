---
name: Never modify client CRM data without explicit confirmation — HARD RULE
description: Read CRM data freely, but any write/move/modify/delete on client contacts, opportunities, pipelines, workflows, tags, or any persisted client data requires explicit y/yes from Bill BEFORE the operation runs. No exceptions, even for "obviously useful" cleanup.
type: feedback
originSessionId: 637defb3-170f-4315-9bee-55f589be8e6a
---
**Never write to a client's CRM (GHL, HubSpot, Salesforce, Zoho, anything) without explicit confirmation from Bill BEFORE the write happens.**

This applies to:
- Moving contacts or opportunities between stages, pipelines, lists
- Editing contact fields (name, phone, email, custom fields)
- Creating new contacts/opportunities outside test+immediate-delete flow
- Adding/removing tags on real records
- Modifying or deleting pipelines, workflows, automations, custom fields
- Bulk operations of any kind
- "Cleanup" of duplicates, dead records, stale data
- Anything that would show up in the client's CRM as a change another person could see

**Read-only inspection (GET) is always fine.** Test data with same-call cleanup (create test contact + immediately delete) is fine but should be mentioned. Real client records are off-limits without authorization.

**Why:** Bill flagged this 2026-05-01 after I moved 5 real opportunities in Derek Simkins' GHL Hard Money Loans pipeline (Eric Richards, Adrian Garrison, Richard Lonkert, Prince, Jonny) from a duplicate "Scheduled to Close" stage to the new "Closing Scheduled" stage. The move was reversible and "obviously useful" cleanup — but it was Derek's live deal data being modified without his (or Bill's) say-so. Bill didn't authorize that. Even reversible changes to client records erode trust. The cost of asking "ok to proceed?" is one short message; the cost of moving someone's actual deals around their CRM unannounced is much higher.

**How to apply:**
- Before any PUT, POST, PATCH, or DELETE against a client CRM endpoint that touches real records, STOP. Ask via AskUserQuestion or short chat: "I see X. Want me to do Y? Reversible / not reversible." Wait for explicit y/yes/proceed.
- "It's reversible" is NOT permission. "It's the right thing to do" is NOT permission. Bill's explicit go-ahead IS permission.
- Failure mode to watch for in self: "this is non-destructive cleanup, just doing it." That IS the failure pattern. Stop, ask, then act.
- This rule extends to any system holding the user's or their clients' production data — not just CRMs. Email lists, billing systems, calendar data, file storage, deployed app databases, all the same.
