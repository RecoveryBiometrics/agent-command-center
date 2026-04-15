---
name: Build per-business, no premature abstraction
description: Build solutions for the actual business in front of you. Do not generalize for hypothetical other businesses until the same shape repeats at N=3.
type: feedback
originSessionId: ed1a4994-e1c6-4bae-b8aa-0723dbef015d
---
Build for the actual problem in front of the business being worked on. Do not generalize or abstract for other businesses until the same pattern repeats a third time.

**Why:** Bill caught me walking us toward a "multi-business, Sheet-driven, cluster-type-agnostic" abstraction on the interlinking skill extension — generalizing from N=1 (SafeBath geographic clusters) to solve for N=unknown (GHL topic clusters + future businesses). That's textbook premature abstraction. The abstraction designed before the pain is always wrong because we're guessing which axes actually vary. Musk's rule: "the most common error of a smart engineer is to optimize a thing that should not exist." Sequence: make it work for one case → make it work for a second case → only then extract the pattern.

**How to apply:**
- When a new capability is needed for a business, build it hardcoded to that business. Do not parameterize for other businesses unless another business is actively asking for it THIS WEEK.
- Do not extend existing cross-business skills (like `interlinking`) to handle a new use case unless the use case is an obvious identical fit. If it requires adding new cluster types, new config paths, new abstractions — that's a signal to copy, not extend.
- At N=3 identical copies across businesses, extract the pattern. Not before.
- Rewriting at N=3 is a feature, not a bug. The rewrite will be better than anything designed at N=1 because it's evidence-based.
- SafeBath's working pipeline stays untouched when building for GHL. GHL's pipeline stays untouched when building for Hatch. Etc.
- This overrides the instinct to "make it reusable from day 1." Reusability is earned by repetition, not designed upfront.

**Related:**
- `project_single_source_of_truth.md` — the architecture DOES share YAML + skills across businesses, but skills are thin routers and the business-specific logic stays per-business.
- `feedback_compose_existing.md` — still applies: use existing agents (researcher, fact-checker, writer). Don't bypass them. That's reuse of proven components, not premature abstraction.
