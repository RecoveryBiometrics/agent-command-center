# Cluster Rules

## Geographic Clusters
- Cities in the same county are neighbors (strongest link)
- Cities in adjacent counties within the same state are secondary neighbors
- Cross-state links only when counties are geographically adjacent (e.g., Chester County PA ↔ New Castle County DE)

## Adjacent County Map
- Chester County, PA ↔ Delaware County, PA, Montgomery County, PA, Lancaster County, PA, Philadelphia County, PA, New Castle County, DE
- Delaware County, PA ↔ Chester County, PA, Montgomery County, PA, Philadelphia County, PA
- Montgomery County, PA ↔ Chester County, PA, Delaware County, PA, Philadelphia County, PA, Lancaster County, PA
- Philadelphia County, PA ↔ Delaware County, PA, Montgomery County, PA, Chester County, PA
- Lancaster County, PA ↔ Chester County, PA, Montgomery County, PA
- New Castle County, DE ↔ Chester County, PA, Cecil County, MD
- Cecil County, MD ↔ New Castle County, DE, Montgomery County, MD
- Montgomery County, MD — standalone (DC metro, not adjacent to other SafeBath counties)
- Clark County, NV — standalone (Las Vegas market)
- Horry County, SC — standalone (Myrtle Beach market)

## Service Clusters
- Every city page links to the main services page
- Service pages link to the hub and to 2-3 related services

## Content Clusters
- Articles in the same category across nearby cities link to each other
- Every article links to its city's main page

## Link Limits
- Max outbound internal links per page: 15
- Max relatedLinks per article: 3
- Neighbor count per city: 6 (same county first, then adjacent county)
- Never duplicate a link that already exists on the page
