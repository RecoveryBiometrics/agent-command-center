"""
money-juice.py — Insert ONE contextual link per source post into a money page.

Strategy: concentrate inbound internal links on a designated money page so its
PageRank signal jumps. Today this is the workhorse of /fix-interlinking.

Pure deterministic execution. JUDGMENT (which page, what triggers, what
anchors) lives in:
  - references/sites/<site>.json (which money pages exist)
  - references/triggers/<trigger-config>.json (trigger phrases + anchor rotation)

Idempotent: running twice in a row makes no second change. Posts that already
link to the target are skipped.

Safety guards:
  - Body text only — never inside <h1>-<h6>, <a>, or existing links
  - One link per source post per target (no double-linking)
  - Language match required (en target → en posts only)
  - Preserves original JSON encoding (ensure_ascii=True, no trailing newline)
  - Will NOT link from the target page to itself

Usage:
  python3 money-juice.py --site globalhighlevel --target /blog/gohighlevel-free-trial-30-days-extended/ --dry-run
  python3 money-juice.py --site globalhighlevel --target /blog/gohighlevel-pricing-plans-2026-complete-guide/ --apply

Output (single-line JSON to stdout):
  {"strategy": "money-juice", "target": "...", "edited": N, "skipped": {...},
   "anchors": {anchor_text: count, ...}, "log_file": "..."}
"""

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

SKILL_DIR = Path(__file__).parent.parent
SITES_DIR = SKILL_DIR / "references" / "sites"
TRIGGERS_DIR = SKILL_DIR / "references" / "triggers"
STATE_DIR = SKILL_DIR / "state"

LINK_RE = re.compile(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
HEADING_RE = re.compile(r"<(h[1-6])\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
ANCHOR_RE = re.compile(r"<a\b[^>]*>.*?</a>", re.IGNORECASE | re.DOTALL)


def load_site_config(site_id: str) -> dict:
    f = SITES_DIR / f"{site_id}.json"
    if not f.exists():
        print(json.dumps({"error": f"site config not found: {f}"}), file=sys.stderr)
        sys.exit(1)
    return json.load(open(f))


def find_money_page(site_cfg: dict, target_url: str) -> dict:
    for mp in site_cfg.get("money_pages", []):
        if mp["url"] == target_url:
            return mp
    print(json.dumps({"error": f"target {target_url} not in {site_cfg['site_id']}.json money_pages"}), file=sys.stderr)
    sys.exit(1)


def load_trigger_config(filename: str) -> dict:
    f = TRIGGERS_DIR / filename
    if not f.exists():
        print(json.dumps({"error": f"trigger config not found: {f}"}), file=sys.stderr)
        sys.exit(1)
    return json.load(open(f))


def find_blocked_ranges(html: str):
    blocked = []
    for m in HEADING_RE.finditer(html):
        blocked.append((m.start(), m.end()))
    for m in ANCHOR_RE.finditer(html):
        blocked.append((m.start(), m.end()))
    return blocked


def position_blocked(pos: int, blocked) -> bool:
    return any(s <= pos < e for s, e in blocked)


def insert_link(html: str, target_url: str, triggers, anchor_counter: Counter):
    blocked = find_blocked_ranges(html)
    for trigger, anchor_options in triggers:
        pattern = re.compile(rf"\b{re.escape(trigger)}\b", re.IGNORECASE)
        for m in pattern.finditer(html):
            if position_blocked(m.start(), blocked):
                continue
            idx = anchor_counter[target_url] % len(anchor_options)
            anchor = anchor_options[idx]
            anchor_counter[target_url] += 1
            replacement = f'<a href="{target_url}">{anchor}</a>'
            new_html = html[:m.start()] + replacement + html[m.end():]
            return new_html, anchor, trigger
    return None, None, None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--site", required=True)
    p.add_argument("--target", required=True, help="Money page URL (e.g. /blog/x/)")
    p.add_argument("--apply", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    if not args.apply and not args.dry_run:
        print(json.dumps({"error": "specify --apply or --dry-run"}), file=sys.stderr)
        sys.exit(1)

    site_cfg = load_site_config(args.site)
    money = find_money_page(site_cfg, args.target)
    triggers_cfg = load_trigger_config(money["trigger_config"])

    target_url = args.target
    target_lang = triggers_cfg.get("language", "en")
    skip_slugs = set(triggers_cfg.get("skip_slugs", []))
    triggers = triggers_cfg["trigger_phrases"]

    # Load posts (dedupe across dirs)
    posts = {}
    for d in site_cfg["posts_dirs"]:
        path = Path(d).expanduser()
        if not path.exists():
            continue
        for f in sorted(path.glob("*.json")):
            try:
                p_data = json.load(open(f))
            except Exception:
                continue
            slug = p_data.get("slug") or f.stem
            posts.setdefault(slug, []).append((f, p_data))

    anchor_counter = Counter()
    edits = []
    skipped = {"non_matching_lang": 0, "already_linked": 0, "no_trigger": 0, "is_target": 0}

    for slug, copies in posts.items():
        if slug in skip_slugs:
            skipped["is_target"] += 1
            continue
        f0, post0 = copies[0]
        lang = post0.get("language", "") or "en"
        # For en target, treat empty/None as en
        if target_lang == "en" and lang not in ("en", None, ""):
            skipped["non_matching_lang"] += 1
            continue
        if target_lang != "en" and lang != target_lang:
            skipped["non_matching_lang"] += 1
            continue

        html = post0.get("html_content", "") or ""
        if target_url in html:
            skipped["already_linked"] += 1
            continue

        new_html, anchor, trigger = insert_link(html, target_url, triggers, anchor_counter)
        if new_html is None:
            skipped["no_trigger"] += 1
            continue

        edits.append({"slug": slug, "anchor": anchor, "trigger": trigger})

        if args.apply:
            for path, post in copies:
                post["html_content"] = new_html
                with open(path, "w") as f:
                    json.dump(post, f, indent=2, ensure_ascii=True)

    # Write log to state
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    log_file = STATE_DIR / f"money-juice-{args.site}-{Path(target_url.rstrip('/')).name}.json"
    log = {
        "strategy": "money-juice",
        "site": args.site,
        "target": target_url,
        "mode": "apply" if args.apply else "dry-run",
        "edited": len(edits),
        "skipped": skipped,
        "anchors": dict(anchor_counter),
        "edits": edits,
    }
    if args.apply:
        with open(log_file, "w") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)

    # Summary to stdout
    print(json.dumps({
        "strategy": "money-juice",
        "target": target_url,
        "edited": len(edits),
        "skipped": skipped,
        "anchors": dict(Counter(e["anchor"] for e in edits)),
        "log_file": str(log_file) if args.apply else None,
        "dry_run": not args.apply,
    }))


if __name__ == "__main__":
    main()
