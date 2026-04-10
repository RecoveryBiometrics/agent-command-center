# Stage 3: Assign Topics to Queue

## Inputs
- `ranked_topics` — prioritized list from Stage 2
- Config: how many topics per cycle (default 5)
- Distribution target: 3 Tier 1 + 1 Tier 2 + 1 Tier 3

## Process

### Pick topics respecting tier distribution
1. Take up to 3 Tier 1 topics (highest priority from Tier 1 candidates)
2. Take up to 1 Tier 2 topic (if any exist — GSC data may not be available yet)
3. Take up to 1 Tier 3 topic
4. If any tier has fewer candidates than its allocation, fill from the next tier down
5. Total: always 5 topics per cycle (adjustable via config)

### Fallback when tiers are empty
- If Tier 2 empty (no GSC data yet): 4 Tier 1 + 1 Tier 3
- If Tier 3 empty (no market topics generated): 4 Tier 1 + 1 Tier 2
- If both Tier 2 + 3 empty: all 5 from Tier 1

### Write queue file
Write to `data/{language}-topics-queue.json`:
```json
[
  {
    "topic": "Article title or query text",
    "source": "tier1-docs" | "tier2-gsc" | "tier3-market",
    "articleId": "155000005065",       // Tier 1 only
    "articleUrl": "https://...",       // Tier 1 only
    "articleBody": "...",              // Tier 1 only — the English source text
    "impressions": 120,               // Tier 2 only
    "position": 35.2,                 // Tier 2 only
    "industry": "real estate",        // Tier 3 only
    "tier": 1,
    "priority": 0.95
  }
]
```

## Outputs
- Queue file written to data directory
- Summary logged: "Queued 5 topics for {language}: 3 docs, 1 GSC, 1 market"
