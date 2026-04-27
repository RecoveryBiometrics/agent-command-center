"""
hub-spoke.py — STUB. Bidirectional hub ↔ child page interlinking.

NOT YET IMPLEMENTED. See references/strategies.md § hub-spoke for the playbook.

When invoked, exits 2 with a clear message pointing to the spec. First real
need triggers implementation — that way the contract is shaped by an actual
use case, not speculation.
"""

import json
import sys

if __name__ == "__main__":
    print(json.dumps({
        "strategy": "hub-spoke",
        "status": "not_implemented",
        "spec": "~/.claude/skills/fix-interlinking/references/strategies.md § hub-spoke",
        "next_step": "Define which hub triggered the need, write the playbook, then build.",
    }), file=sys.stderr)
    sys.exit(2)
