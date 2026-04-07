---
name: Check before asking — don't guess, don't ask unnecessarily
description: Always check the codebase for credentials/config before asking the user; only ask when truly stuck
type: feedback
---

Don't ask the user setup questions (like "do you have credentials?") when the answer is findable in the codebase. Search first, ask only if you genuinely can't find it.

**Why:** User finds it annoying when Claude asks questions it could answer by searching the repo. "Don't guess, ask if ya need" — but exhaust searching first.

**How to apply:** Before asking about credentials, config, env vars, property IDs, etc., grep the codebase and env files thoroughly. Only escalate to the user when the info truly isn't there.
