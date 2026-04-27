"""
broken-link-cleanup.py — STUB. Retarget internal links pointing to 301/404 URLs.

NOT YET IMPLEMENTED. See references/strategies.md § broken-link-cleanup.

HIGH PRIORITY: today's master/pricing consolidation 301'd 7 URLs. Older posts
may still link to /coupon, /promo, /start. Those waste a PageRank hop.
"""

import json
import sys

if __name__ == "__main__":
    print(json.dumps({
        "strategy": "broken-link-cleanup",
        "status": "not_implemented",
        "spec": "~/.claude/skills/fix-interlinking/references/strategies.md § broken-link-cleanup",
        "priority": "high",
    }), file=sys.stderr)
    sys.exit(2)
