#!/bin/bash
# cite-before-write — PreToolUse hook
# Blocks Edit/Write to customer-facing copy files unless an EVIDENCE ANCHORS block is present.
# Invoked from .claude/settings.json hooks.PreToolUse on Edit|Write matchers.

set -e

# Read tool input from stdin
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# No file path? Not relevant.
[ -z "$file_path" ] && exit 0

# Path filter — gate any directory that contains customer-facing copy
# (site/, site-astro/, site-v2/, etc., plus mailer/, briefs/, drafts/)
case "$file_path" in
  */site/*|*/site-*/*|*/mailer/*|*/briefs/*|*/drafts/*) ;;
  *) exit 0 ;;  # path not gated, allow
esac

# Skip non-copy file types within gated dirs (CSS, JS, JSON, package.json, build configs aren't shipped copy)
case "$file_path" in
  *.html|*.htm|*.astro|*.md|*.markdown|*.txt|*.mdx) ;;
  *) exit 0 ;;
esac

# Skip Astro project meta-files even with extensions matching above
case "$file_path" in
  */node_modules/*|*/.astro/*|*/dist/*) exit 0 ;;
esac

# Determine whether the resulting file will contain an EVIDENCE ANCHORS block
has_anchor=0

if [ "$tool_name" = "Write" ]; then
  # Write replaces full file content
  content=$(echo "$input" | jq -r '.tool_input.content // empty')
  if printf '%s' "$content" | grep -q "EVIDENCE ANCHORS"; then
    has_anchor=1
  fi
elif [ "$tool_name" = "Edit" ]; then
  # Edit replaces a substring. Anchor is OK if:
  #   (a) existing file already has anchor, OR
  #   (b) new_string adds the anchor
  if [ -f "$file_path" ] && grep -q "EVIDENCE ANCHORS" "$file_path"; then
    has_anchor=1
  else
    new_string=$(echo "$input" | jq -r '.tool_input.new_string // empty')
    if printf '%s' "$new_string" | grep -q "EVIDENCE ANCHORS"; then
      has_anchor=1
    fi
  fi
fi

if [ "$has_anchor" = "1" ]; then
  exit 0  # allow
fi

# Block — exit code 2 surfaces stderr to the model (per Claude Code hook protocol)
cat >&2 <<EOF
Missing EVIDENCE ANCHORS block in customer-facing file: $file_path

This file is gated by /cite-before-write. Before writing or editing customer-facing
copy (site/, mailer/, briefs/, drafts/), invoke /cite-before-write FIRST.

The skill loads onboarding/memory/audit sources, requires you to write an evidence
anchor block citing those sources, and surfaces conflicts. Without the anchor,
copy decisions are evidence-light — the failure mode that produced the K&T-led
homepage hero on 2026-04-27.

See ~/.claude/skills/cite-before-write/SKILL.md for the full procedure.
EOF
exit 2
