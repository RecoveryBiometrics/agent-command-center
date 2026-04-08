---
description: Generate social media posts from ops activity. ICM-structured with staged context loading.
invocation: /social
when_to_use: When the user wants to generate social content, or when a trigger needs social posts from ops data.
---

# Social Content Pipeline

Generate social media posts based on operations activity.

## Usage
```
/social              # generate 4 FB posts from today's ops
/social linkedin     # (future) generate LinkedIn posts
```

## Stages

Run these in order. Each stage has its own CONTEXT.md with inputs/process/outputs.

1. **01-collect** — Read #ops-log, extract real numbers and activity
2. **02-write** — Write posts following `references/voice.md` + platform templates
3. **03-post** — Send to #social channel, log to #ops-log

## References (Layer 3 — stable, shared across platforms)
- `references/voice.md` — Bill's voice rules (used by stage 02)
- `references/channel-map.md` — which channels to read/write (used by stages 01 + 03)

## Platform templates (Layer 3 — per platform)
- `stages/02-write/references/fb-templates.md` — Facebook: 4 posts, 4 angles
- `stages/02-write/references/linkedin-templates.md` — (future)

## Adding a new platform
1. Create `stages/02-write/references/{platform}-templates.md` with post angles + examples
2. Voice rules stay the same — they're in `references/voice.md`
3. Channel map gets a new entry in `references/channel-map.md`

## Goal
Inbound leads. These posts got 2 DMs in one week. Keep that energy.
