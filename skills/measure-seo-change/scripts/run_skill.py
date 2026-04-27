"""
run_skill.py — Thin Garry-pattern wrapper.

Spawns a Claude session via claude-agent-sdk, points it at SKILL.md as system
prompt, lets Claude execute every phase (including Phase 4 self-improvement)
by reading the markdown and calling the deterministic helpers in bin/.

This is the WHOLE cron entry point. ~50 lines. The judgment lives in the
SKILL.md that this script tells Claude to follow.

Usage (in CI):
  python3 run_skill.py

Env vars (all populated by GitHub Actions secrets / repo config):
  ANTHROPIC_API_KEY           — for the agent SDK
  GOOGLE_SERVICE_ACCOUNT_KEY  — for Sheet R/W (consumed by bin/* helpers)
  GOOGLE_OAUTH_CREDENTIALS    — for GSC fetch (consumed by bin/measure-fetch-gsc)
  SLACK_BOT_TOKEN             — for Slack post (consumed by bin/post-slack)
  TRACKING_SHEET_ID           — passed to Claude in the prompt
  GSC_SITE_URL                — passed to Claude in the prompt
  SLACK_CHANNEL_ID            — passed to Claude in the prompt
  SKILL_DIR                   — directory containing SKILL.md + bin/ + state/
                                 (defaults to current directory)

Exit codes:
  0 — agent reported successful completion
  1 — agent errored OR could not load SKILL.md
"""

import anyio
import os
import sys
from pathlib import Path

from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
    ResultMessage,
)


SKILL_DIR = Path(os.getenv("SKILL_DIR", ".")).resolve()
SKILL_MD = SKILL_DIR / "SKILL.md"


async def main() -> int:
    if not SKILL_MD.exists():
        print(f"ERROR: SKILL.md not found at {SKILL_MD}", file=sys.stderr)
        return 1

    skill_text = SKILL_MD.read_text()

    sheet_id = os.getenv("TRACKING_SHEET_ID", "")
    site = os.getenv("GSC_SITE_URL", "sc-domain:globalhighlevel.com")
    slack = os.getenv("SLACK_CHANNEL_ID", "")

    options = ClaudeAgentOptions(
        model="claude-opus-4-7",
        system_prompt=skill_text,
        cwd=str(SKILL_DIR),
        allowed_tools=["Bash", "Read", "Write", "Edit"],
        permission_mode="acceptEdits",
    )

    user_msg = (
        "Run the /measure-seo-change skill against the SEO Changelog Sheet for "
        f"site={site}. "
        f"TRACKING_SHEET_ID={sheet_id}. "
        f"SLACK_CHANNEL_ID={slack}. "
        "Helpers are in ./bin/. State is in ./state/. "
        "Execute all phases including Phase 4 self-improvement. "
        "When done, summarize the run in your final message: count of rows measured, "
        "outcomes by bucket, and any rule appends to /fix-* skills."
    )

    saw_error = False
    async for message in query(prompt=user_msg, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text, flush=True)
                elif isinstance(block, ToolUseBlock):
                    print(f"\n[tool: {block.name}]", flush=True)
        elif isinstance(message, ResultMessage):
            if message.is_error:
                saw_error = True
                print(f"\n[ERROR] agent reported is_error=True", file=sys.stderr)
            print(
                f"\n[done] turns={message.num_turns} cost=${message.total_cost_usd:.4f} "
                f"duration={message.duration_ms}ms",
                flush=True,
            )

    return 1 if saw_error else 0


if __name__ == "__main__":
    sys.exit(anyio.run(main))
