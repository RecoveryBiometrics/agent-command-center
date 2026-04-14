---
name: GSC Account (CRITICAL)
description: Google Search Console is owned by williamcourterwelch@gmail.com — NOT bill@reiamplifi.com. GSC-only.
type: reference
originSessionId: 48fd5669-d3e5-4873-9eb6-625d47d0b3c8
---
# Google Search Console — williamcourterwelch@gmail.com

**Google Search Console properties are owned by `williamcourterwelch@gmail.com`.**

This is the ONLY thing this account is used for. Everything else (GA4, Gmail, Drive, Sheets, Slack, etc.) uses `bill@reiamplifi.com`.

## When this applies
- Any GSC auth flow (token-gsc.json)
- Re-authing any pipeline that reads Search Console (globalhighlevel.com, reiamplifi.com, safebath.com, etc.)
- Adding users to GSC properties — the owner account is williamcourterwelch@gmail.com

## When this does NOT apply
- GA4 → bill@reiamplifi.com
- Gmail / Google Drive / Sheets / Calendar → bill@reiamplifi.com
- Every other Google Workspace MCP call → bill@reiamplifi.com

## Symptom of getting this wrong
403 "User does not have sufficient permission for site 'sc-domain:...'" when the pipeline tries to pull GSC data. That means the token was authed under bill@reiamplifi.com instead of williamcourterwelch@gmail.com.

## Fix
Re-auth with williamcourterwelch@gmail.com:
```
cd ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline
rm -f token-gsc.json
venv/bin/python3 scripts/analytics.py
# sign in as williamcourterwelch@gmail.com
```
