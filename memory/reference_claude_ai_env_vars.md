---
name: claude.ai environments + Google service account wiring
description: How to pass the Google service account key to remote Claude Code triggers for live GSC/GA4 pulls.
type: reference
originSessionId: 67b5bfa1-1a7a-417e-9f26-c43d89efe7c4
---
## The pattern

Remote Claude Code triggers (Routines) on claude.ai can use env vars via **custom environments**. The `claude-code-default` env has none — create a named environment to inject secrets.

## Current setup (2026-04-15)

- **Environment name:** `reiamplifi-google`
- **Environment ID:** `env_01TDtHFibihP4mCg7C5cZnxC`
- **Env var:** `GOOGLE_SERVICE_ACCOUNT_KEY_B64` = base64-encoded service account JSON
- **Service account:** `seo-agent@safebath-seo-agent.iam.gserviceaccount.com`
- **GCP project:** `safebath-seo-agent` (project number `888724847234`), under williamcourterwelch@gmail.com (no org)
- **APIs enabled:** Search Console API, **Google Analytics Data API** (enabled via gcloud 2026-04-15)

## How triggers use it

Prompt includes:
```bash
mkdir -p /tmp/creds
echo "$GOOGLE_SERVICE_ACCOUNT_KEY_B64" | base64 -d > /tmp/creds/sa.json
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/creds/sa.json
pip install --quiet google-auth google-api-python-client
```

Then Python scripts auth via `google.oauth2.service_account.Credentials` with scopes:
- GSC: `https://www.googleapis.com/auth/webmasters.readonly`
- GA4: `https://www.googleapis.com/auth/analytics.readonly`

## SA access grants (keep current)

- SafeBath GSC: siteRestrictedUser (works, but query data filtered — upgrade to siteFullUser for full access)
- SafeBath GA4: Viewer on property (works)
- GHL GSC: **403 — needs to be added** as user on sc-domain:globalhighlevel.com
- GHL GA4: **403 — needs Viewer on property 531015433**

## Why: one key, many grants

Service accounts are robot identities, not user accounts. One SA can be granted access to resources owned by multiple Google users (e.g., williamcourterwelch's GSC + bill@reiamplifi's GA4). Grants are per-property, not per-user-account.

## Triggers using this env

- `trig_017gYGfVmviqWCdR8vpD1jTt` — CEO Daily Narrative (7am ET daily)
- `trig_01GqvHa2Kmbz9SjwjJme6hcq` — Weekly SEO Report (Tue 9am ET)

## Security caveat (Anthropic docs)

> "A dedicated secrets store is not yet available. Environment variables and setup scripts are stored in the environment configuration, visible to anyone who can edit that environment."

For a solo account this is fine. When adding teammates, rotate the key.

## Creating new key / rotating

```
gcloud iam service-accounts keys create ~/.secrets/seo-agent-<date>.json \
  --iam-account=seo-agent@safebath-seo-agent.iam.gserviceaccount.com
base64 -i ~/.secrets/seo-agent-<date>.json | tr -d '\n' | pbcopy
# Paste into GOOGLE_SERVICE_ACCOUNT_KEY_B64 in claude.ai env
# Delete old key from Google Cloud Console → IAM → Service Accounts → Keys
```
