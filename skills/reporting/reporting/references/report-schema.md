# Report Data Schema

Canonical shape of collected data passed between stages. All fields are nullable — stages render only what exists.

```yaml
report:
  business_id: string              # "safebath", "globalhighlevel"
  business_name: string            # "Safe Bath Grab Bars"
  report_type: enum                # weekly | error | ceo
  generated_at: datetime
  period:
    start: date
    end: date

  pipeline_health:
    status: enum                   # ok | warning | error
    last_cycle: datetime
    failures: []                   # [{pipeline, error, timestamp}]
    summary: string                # one-liner from ops-status.json

  search_performance:              # from GSC data
    clicks: int
    impressions: int
    ctr: float
    avg_position: float
    prior_clicks: int | null       # for delta calculation
    prior_impressions: int | null
    prior_ctr: float | null
    prior_position: float | null
    top_pages: []                  # [{url, clicks, impressions, position}]
    top_queries: []                # [{query, clicks, impressions, position}]

  wins: []                         # [{url, position, prior_position, delta, impressions}]
  drops: []                        # [{url, position, prior_position, delta, impressions}]
  opportunities: []                # [{url, position, impressions, ctr}]
  gaps: []                         # [{query, impressions, position}]

  traffic:                         # from GA4
    sessions: int | null
    users: int | null
    pageviews: int | null
    bounce_rate: float | null
    avg_session_duration: float | null
    by_channel: []                 # [{channel, sessions, users}]

  conversions:                     # NULLABLE — empty until GA4 events are added
    events: []                     # [{name, count, prior_count}]
    total: int | null
    primary_metric: string | null  # e.g., "phone_clicks" or "affiliate_clicks"

  content_velocity:                # business-specific
    episodes_published: int | null # GHL only
    blogs_en: int | null
    blogs_india: int | null        # GHL only
    blogs_spanish: int | null      # GHL only
    articles_published: int | null # SafeBath only
    directory_listings: int | null # SafeBath only
    seo_pages_optimized: int | null
    seo_rewrites: int | null
    seo_expansions: int | null

  ops_log_entries: []              # [{timestamp, source, level, message}]
```

## Extending for new data
Add new fields as nullable. Stage 02 conditionally renders any section that has data. No template changes needed — just add the field here and stage 02 will pick it up if the template references it.
