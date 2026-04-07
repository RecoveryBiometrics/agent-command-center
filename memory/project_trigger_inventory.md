---
name: Trigger Inventory
description: Current state of all Claude remote triggers — 3 enabled, 4 disabled. Max plan limit is 3 enabled (undocumented).
type: project
---

## Trigger state as of 2026-04-07

**Plan limit: 3 enabled triggers** (undocumented cap on $100/mo Max plan)

### Enabled (3/3 slots)
1. `trig_01GqvHa2Kmbz9SjwjJme6hcq` — **Weekly SEO Report** — Tuesdays 9am ET
2. `trig_015qGHVkam5Z6Fgy5MgfonbY` — **Daily FB Posts — All 4** — Daily 8:07am ET
3. `trig_014XvhZtxg6nUYvCjx1QHx41` — **Pipeline Doctor — Health + Content** — Every 4 hours

### Disabled (dead weight, can't delete via API)
4. `trig_01R6cncrBz4VDFVScZ1kV4uz` — FB Posts Midday+Evening (superseded)
5. `trig_01LqzwXPLezYaFmJEwbMy7PP` — Daily FB Posts original (superseded)
6. `trig_01W3Wdcq2TTi9SFRFdxhthVA` — Content Monitor (absorbed into Pipeline Doctor)
7. `trig_011Vkd3QzUSRK7BvhXchPez1` — CEO Briefing (absorbed into /org-status skill)

**Why:** To avoid re-discovering this state in future sessions. Trigger limit is real but undocumented — see anthropics/claude-code#40124.

**How to apply:** If user needs a new trigger, one of the enabled ones must be disabled or consolidated first. Prefer consolidation over losing functionality.
