# Stage 2: Prioritize Topics

## Inputs
- `tier1_candidates` — GHL help articles
- `tier2_candidates` — GSC gap queries  
- `tier3_candidates` — Market-specific topics

## Process

### Score each candidate

**Tier 1 (GHL docs):**
- Base score: 0.9 (highest trust)
- Boost if topic has high English traffic (check topic-weights.json)
- Boost if article category matches a high-demand topic area
- Penalize if the article body is very short (< 500 chars — thin content to adapt from)

**Tier 2 (GSC gaps):**
- Base score: 0.7
- Boost by impressions (more impressions = more demand)
- Boost if position > 20 (easy to rank for — less competition)
- Penalize if query is too broad/generic

**Tier 3 (market verticals):**
- Base score: 0.5
- Boost if industry is high-value in that market (real estate in Dubai > generic)
- Boost if competitor content exists (proves demand)
- Penalize if similar topic already covered

### Sort by score descending
Combine all candidates into one ranked list.

## Outputs
Pass to Stage 3:
- `ranked_topics` — all candidates sorted by priority score, with tier metadata
