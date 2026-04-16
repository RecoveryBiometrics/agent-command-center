---
name: Verify before citing as evidence
description: Don't cite files/folders as working examples unless you've verified they're live and doing what you claim
type: feedback
originSessionId: 07274140-2f82-49ea-a9db-29b0d755fc38
---
Finding a string in the codebase is NOT the same as that thing being live, working, or relevant. Before citing any file, folder, or pattern as evidence for a recommendation, verify it's actually in production use.

**Why:** Bill caught me citing `bass-forecast-docs/` HTML as a "working example of property-level UTM tracking" when it was just static docs in the repo — not a live GA4 property, not a running business. I dressed up an unverified file as supporting evidence for a recommendation. This is the exact "never make things up" violation, just wearing the costume of a grep result.

**How to apply:**
- Grep results prove a string exists in a file. Nothing more.
- Before saying "X already does this" or "look at Y as the pattern" — confirm X/Y is actually running, deployed, or in active use (check GA4, check deployments table in CLAUDE.md, check git log recency, check business YAMLs).
- If I only have a file and no confirmation it's live, say "I see this in a file but haven't verified it's in production" — don't cite it as an example.
- Especially dangerous with `-docs`, `-old`, `archive`, or business folders that may be abandoned.
