---
name: Hard money and private money are DIFFERENT — never conflate them
description: In real estate lending, "hard money" and "private money" are distinct products with different capital sources, structures, and pipelines. Treat as separate products even when industry copy uses them loosely.
type: feedback
originSessionId: 637defb3-170f-4315-9bee-55f589be8e6a
---
**Hard money** and **private money** are different products in real estate lending. Never use them interchangeably in copy, pipeline naming, routing decisions, or recommendations. Bill flagged this 2026-05-01 when reviewing Derek Simkins' GHL pipelines.

**Why:** Conflating them causes real routing mistakes. Example incident — when looking at Derek's GHL setup, his "Private Money Lending" pipeline had stages like "Funds Received from Investors" / "Funds Returned to Investors" (clearly an investor-backed product where Derek brokers individual investor capital). His "Hard Money Loans" pipeline (single stage "Scheduled to Close") is a different product entirely — Derek's own capital deployed on standardized hard-money terms. Conflating them would have routed dereksimkins.com hard-money leads into the wrong pipeline.

**The distinction (rough):**
- **Hard money** = standardized, asset-based, business-purpose lending. Lender deploys their own capital pool with documented underwriting (LTV/LTC, points, term, defined rate range). Borrower is a real estate investor. Higher rates, faster close, institutional-shaped product.
- **Private money** = capital sourced from individual investors who match into specific deals. Often relationship-based, more negotiable terms, lender acts as broker between investor capital and borrower deal. Investor stays in the chain (gets funds back when loan pays off).

The same lender can do both — they're separate product lines with separate pipelines, separate documentation, separate stakeholders. Derek does both.

**How to apply:**
- When routing leads from a hard-money funnel (e.g., dereksimkins.com), they go into a HARD MONEY pipeline only. Even if the existing pipeline is poorly built, fix it (add stages) — don't redirect to a private money pipeline because the names "feel similar."
- When drafting copy that mentions one, don't substitute the other. "Hard money lender Asheville" and "private money lender Asheville" are different searches with different SERPs and different borrower intents.
- When Derek (or any RE lender) talks about their book, ask which product line each pipeline serves — don't assume from the name.
- Save this as a confidence check: if I find myself thinking "these are basically the same," that's the failure mode — they aren't.
