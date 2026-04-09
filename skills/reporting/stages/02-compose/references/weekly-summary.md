# Weekly Summary Template

Format the weekly report using this structure. Skip any section that has no data.

```
*{business_name} — Weekly Report*
_{period: e.g. "Apr 1 – Apr 7, 2026"}_

*Search Performance*
> Clicks: *{clicks}* ({delta} vs prior) | Impressions: *{impressions}* ({delta}) | CTR: *{ctr}%* | Avg Position: *{position}*

*What's Going Up* (pages that gained 3+ positions)
  • `{slug}` — pos {old} → {new} ({delta}), {impressions} imp
  • ...
  (top 5, sorted by position gain)

*What's Going Down* (pages that dropped 3+ positions)
  • `{slug}` — pos {old} → {new} ({delta}), {impressions} imp
  • ...
  (top 5, sorted by biggest drop)

*Opportunities* (position 8-20, high impressions, worth optimizing)
  • `{slug}` — pos {position}, {impressions} imp, {ctr}% CTR
  • ...
  (top 5, sorted by impressions)

*Content Gaps* (queries with 50+ impressions, no matching page)
  • "{query}" — {impressions} imp, pos {position}
  • ...
  (top 5, sorted by impressions)

*Traffic* (last 7 days)
> Users: *{users}* | Sessions: *{sessions}* | Pageviews: *{pageviews}* | Bounce: *{bounce_rate}%*
Top sources: {source1} ({sessions}), {source2} ({sessions}), ...

*Engagement*
  • CTA clicks: {total_cta} this week
  • {business-specific: phone clicks, affiliate clicks, etc.}

*Conversions* _(only if data exists)_
  • {event_name}: {count} ({delta} vs prior)
  • ...

*Content This Week*
  • {content_type}: {count} new ({total} total)
  • ... (episodes, blogs, articles, directory listings — whatever applies)

*SEO Activity*
  • Pages optimized: {count} ({rewrites} rewrites, {expansions} expansions)
```

## Formatting rules
- Use real numbers only. Never fabricate.
- Show deltas as `(+23)` or `(-5)` or `(no prior data)`.
- Slugs in backticks: `` `grab-bars-philadelphia` ``
- Queries in quotes: `"grab bar installation near me"`
- Keep total message under 3900 characters (Slack limit with buffer).
- If over limit: cut to top 3 per section instead of top 5.
