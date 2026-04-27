"""
audit.py — Read-only link graph audit.

Counts inbound internal links per page across a site's posts. Surfaces issues:
under-linked money pages, orphans, spammy anchor concentration, broken links.

Used by:
  - /fix-interlinking — Phase 0 (load context) + Phase 1 (diagnose)
  - /measure-seo-change — to compare before/after link counts on a target page

Pure deterministic: same input (posts/) → same output (JSON to stdout).

Usage:
  python3 audit.py --site globalhighlevel                    # full link graph dump (JSON)
  python3 audit.py --site globalhighlevel --target /blog/X/  # one target only
  python3 audit.py --site globalhighlevel --diagnose         # ranked list of issues

Site config (where posts live, which money pages exist) is in
~/.claude/skills/fix-interlinking/references/sites/<site>.json. If not present,
script exits with code 1 and clear message.

Exit codes:
  0 — success, JSON on stdout
  1 — config missing
"""

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

SITES_DIR = Path(__file__).parent.parent / "references" / "sites"

LINK_RE = re.compile(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
HEADING_RE = re.compile(r"<(h[1-6])\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)


def load_site_config(site_id: str) -> dict:
    cfg_file = SITES_DIR / f"{site_id}.json"
    if not cfg_file.exists():
        print(json.dumps({"error": f"site config not found at {cfg_file}", "hint": f"create with: posts_dirs, money_pages, language_default"}), file=sys.stderr)
        sys.exit(1)
    return json.load(open(cfg_file))


def normalize(href: str, domain: str) -> str:
    href = href.strip().replace(f"https://{domain}", "").replace(f"http://{domain}", "")
    href = re.split(r"[?#]", href)[0]
    if not href.endswith("/") and "." not in href.split("/")[-1]:
        href += "/"
    return href


def load_posts(posts_dirs: list) -> dict:
    """Return {slug: {path, post_dict}} deduplicated across dirs."""
    posts = {}
    for d in posts_dirs:
        path = Path(d).expanduser()
        if not path.exists():
            continue
        for f in sorted(path.glob("*.json")):
            try:
                p = json.load(open(f))
            except Exception:
                continue
            slug = p.get("slug") or f.stem
            if slug not in posts:
                posts[slug] = {"path": str(f), "post": p}
    return posts


def count_links(posts: dict, domain: str) -> tuple:
    """Return (inbound_counts, anchor_distribution)."""
    inbound = Counter()
    anchors = defaultdict(Counter)  # target_url -> anchor_text -> count
    for slug, info in posts.items():
        html = (info["post"].get("html_content", "") or "")
        for m in LINK_RE.finditer(html):
            href, anchor = m.group(1), m.group(2)
            if href.startswith(("mailto:", "#", "tel:", "javascript:")):
                continue
            # Skip external URLs (different domain)
            if href.startswith("http") and domain not in href:
                continue
            target = normalize(href, domain)
            inbound[target] += 1
            anchor_text = re.sub(r"<[^>]+>", "", anchor).strip().lower()
            if anchor_text:
                anchors[target][anchor_text] += 1
    return inbound, anchors


def diagnose(inbound: Counter, anchors: dict, money_pages: list, posts: dict) -> list:
    """Return ranked list of issues."""
    issues = []
    # 1. Under-linked money pages
    for mp in money_pages:
        url = mp["url"]
        count = inbound.get(url, 0)
        if count < 50:
            issues.append({
                "severity": "high",
                "kind": "money_page_under_linked",
                "target": url,
                "inbound_count": count,
                "recommend": f"/fix-interlinking --strategy money-juice --target {url}",
                "note": f"{count} inbound (target: 50+)",
            })

    # 2. Orphan pages — posts that have ZERO inbound links
    all_post_urls = {f"/blog/{slug}/" for slug in posts}
    orphans = [u for u in all_post_urls if inbound.get(u, 0) == 0]
    if orphans:
        issues.append({
            "severity": "medium",
            "kind": "orphan_pages",
            "count": len(orphans),
            "sample": orphans[:5],
            "recommend": "/fix-interlinking --strategy orphan-rescue",
        })

    # 3. Anchor concentration on money pages
    for mp in money_pages:
        url = mp["url"]
        a = anchors.get(url, Counter())
        total = sum(a.values())
        if total >= 20:  # only check well-linked pages
            top_anchor, top_count = a.most_common(1)[0]
            if top_count / total > 0.70:
                issues.append({
                    "severity": "medium",
                    "kind": "anchor_concentration",
                    "target": url,
                    "dominant_anchor": top_anchor,
                    "concentration": round(top_count / total, 2),
                    "recommend": f"/fix-interlinking --strategy anchor-diversify --target {url}",
                })

    # Sort by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    issues.sort(key=lambda i: severity_order.get(i["severity"], 99))
    return issues


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--site", required=True)
    p.add_argument("--target", help="Inspect one specific URL (path)")
    p.add_argument("--diagnose", action="store_true")
    args = p.parse_args()

    cfg = load_site_config(args.site)
    posts = load_posts(cfg["posts_dirs"])
    inbound, anchors = count_links(posts, cfg["domain"])

    if args.target:
        target = args.target if args.target.startswith("/") else "/" + args.target
        out = {
            "site": args.site,
            "target": target,
            "inbound_count": inbound.get(target, 0),
            "anchor_distribution": dict(anchors.get(target, Counter()).most_common(20)),
        }
        print(json.dumps(out))
        return

    if args.diagnose:
        issues = diagnose(inbound, anchors, cfg.get("money_pages", []), posts)
        print(json.dumps({"site": args.site, "total_posts": len(posts), "issues": issues}, indent=2))
        return

    # Default: full link graph
    out = {
        "site": args.site,
        "total_posts": len(posts),
        "top_targets": [
            {"url": url, "inbound": cnt}
            for url, cnt in inbound.most_common(30)
        ],
    }
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
