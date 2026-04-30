#!/bin/bash
# UserPromptSubmit hook: detect gstack skill invocations and pin a reminder.
# Reasoning: Claude (the model) substituted bash equivalents for gstack skills
# on 2026-04-30 during the avlp2p MVP build. This hook enforces the rule at
# the harness level — memory + CLAUDE.md alone are advisory.

P=$(jq -r '.prompt // empty' 2>/dev/null)

if echo "$P" | grep -qiE '/(design-review|qa|seo-deploy-gate|benchmark|cso|health|document-release|ship|land-and-deploy|canary|investigate|review|ultrareview|autoplan)\b|gstack|what would gar' 2>/dev/null; then
  cat <<'JSON_EOF'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"GSTACK SKILL INVOCATION DETECTED. You MUST invoke the named skill via the Skill tool. Do NOT substitute bash equivalents, manual checks, or the spirit of it. If the skill ceremony seems heavy, ASK via AskUserQuestion before bypassing — never decide unilaterally. See ~/.claude/CLAUDE.md § Skill invocation HARD RULE."}}
JSON_EOF
fi
