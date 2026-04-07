---
name: Do the work — don't punt to the user
description: Never tell the user to do something manually when you have tools to do it yourself. Check all available tools first.
type: feedback
---

Don't tell the user to do things manually when you have the tools to do it yourself. This includes:

- **GitHub secrets:** Use `gh secret set` to set repo secrets. If you need a service account key, create one with `gcloud iam service-accounts keys create` and pipe it in.
- **Google Sheets:** Use `google-workspace` MCP tools to create spreadsheets, share them, write to them.
- **Google Cloud APIs:** Use `gcloud services enable` to enable APIs. Use `gcloud` for any GCP operations.
- **File sharing:** Use `manage_drive_access` MCP tool to share files with service accounts or users.
- **Slack:** Use Slack MCP tools or the bot token directly.

**Why:** User caught me saying "you need to do X manually" for 3 things I could have done myself (service account key, sheet sharing, sheet creation). This wastes the user's time and breaks trust.

**How to apply:** Before telling the user to do something, check: Can `gh`, `gcloud`, or an MCP tool do this? If yes, do it. Only ask the user for things that genuinely require their browser/credentials that you don't have access to (like clicking through a Google consent screen or enabling an org policy).
