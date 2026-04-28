"""
run_skill.py — Thin Garry-pattern wrapper for /pipeline-health.

Spawns a Claude session via claude-agent-sdk, points it at SKILL.md as
system prompt, lets Claude execute every stage including Stage 4
(auto-remediate via /pipeline-doctor on BLOCK).

This is the cron entry point. ~60 lines. Judgment lives in SKILL.md
that this script tells Claude to follow.

Env vars (populated by GitHub Actions secrets / repo config):
  ANTHROPIC_API_KEY  — for the agent SDK
  VPS_SSH_KEY        — private key contents for ssh root@74.208.190.10
  SLACK_BOT_TOKEN    — for Slack post on BLOCK / completion
  SLACK_OPS_LOG      — channel ID for routine reports (#ops-log)
  SLACK_CEO          — channel ID for escalations (#ceo)
  SKILL_DIR          — directory containing SKILL.md (default: cwd)
  PIPELINE_DOCTOR_DIR — sibling skill dir, used by Stage 4 auto-remediate

Exit codes:
  0 — verdict OK or WARN
  1 — verdict BLOCK that pipeline-doctor could not fix (escalated)
  2 — agent error
"""

import anyio
import os
import sys
from pathlib import Path

from claude_agent_sdk import query, ClaudeAgentOptions


SKILL_DIR = Path(os.getenv("SKILL_DIR", ".")).resolve()
SKILL_MD = SKILL_DIR / "SKILL.md"
DOCTOR_DIR = Path(os.getenv("PIPELINE_DOCTOR_DIR", SKILL_DIR.parent / "pipeline-doctor")).resolve()


async def main() -> int:
    if not SKILL_MD.exists():
        print(f"ERROR: SKILL.md not found at {SKILL_MD}", file=sys.stderr)
        return 2

    skill_text = SKILL_MD.read_text()

    # Make the SSH key available to bash inside the agent session
    ssh_key = os.getenv("VPS_SSH_KEY", "")
    if ssh_key:
        key_path = Path("/tmp/vps_ssh_key")
        key_path.write_text(ssh_key)
        key_path.chmod(0o600)

    ops_log = os.getenv("SLACK_OPS_LOG", "C0AQG0DP222")
    ceo = os.getenv("SLACK_CEO", "C0AQAHSQK38")

    options = ClaudeAgentOptions(
        model="claude-opus-4-7",
        system_prompt=skill_text,
        cwd=str(SKILL_DIR),
        allowed_tools=["Bash", "Read", "Write", "Edit"],
        permission_mode="acceptEdits",
    )

    user_msg = (
        "Run /pipeline-health for globalhighlevel.com. Execute all stages from SKILL.md.\n\n"
        f"VPS: ssh -i /tmp/vps_ssh_key -o StrictHostKeyChecking=no root@74.208.190.10\n"
        f"Live site: https://globalhighlevel.com\n"
        f"Slack #ops-log: {ops_log}\n"
        f"Slack #ceo (escalation only): {ceo}\n"
        f"pipeline-doctor SKILL.md: {DOCTOR_DIR}/SKILL.md\n\n"
        "On BLOCK verdict, follow Stage 4: read the pipeline-doctor SKILL.md and "
        "execute its phases against the failing check. If pipeline-doctor cannot fix it, "
        "post to #ceo with what was tried and exit 1. On clean run, post a one-line "
        "summary to #ops-log and exit 0."
    )

    saw_error = False
    final_text = ""
    async for msg in query(prompt=user_msg, options=options):
        if hasattr(msg, "content"):
            for block in msg.content:
                if hasattr(block, "text"):
                    final_text = block.text

    if saw_error:
        return 2
    # Heuristic: if the agent's final message contains "BLOCK" and not "fixed",
    # treat as escalation. Otherwise success. Keep simple — agent posts to Slack itself.
    lower = final_text.lower()
    if "block" in lower and "fixed" not in lower and "resolved" not in lower:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(anyio.run(main))
