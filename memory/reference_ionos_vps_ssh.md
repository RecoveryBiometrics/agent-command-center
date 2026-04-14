---
name: IONOS VPS SSH access (stale)
description: SSH credentials in podcast-pipeline SKILL.md don't work as of 2026-04-13. Verify before using.
type: reference
originSessionId: a406e05f-429c-4b08-b1d1-b96571eb04aa
---
`~/.claude/skills/podcast-pipeline/SKILL.md` documents:
- VPS: 74.208.190.10
- User: williamcourterwelch
- Key: ~/.ssh/ionos_ghl

**As of 2026-04-13: SSH with these credentials returns "Permission denied (publickey,password)".** Either the key was rotated, the user/IP changed, or the pub key was never added to authorized_keys.

**How to apply:** Before proposing any VPS-side work (n8n install, deploy script, log inspection), ask user to verify SSH access from their terminal first. Don't burn cycles trying multiple SSH variations — fail fast and ask.

**Permanent fix pending:** Add `~/.ssh/config` Host entry for `ionos-ghl` so connection details live in one updateable place, not in skill docs.
