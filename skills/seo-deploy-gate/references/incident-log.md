# SEO Deploy Gate — Incident Log

Every BLOCK or WARN appends here. Read before any structural SEO change.

---

## 2026-04-10 — SafeBath Restructure (REVERTED 2026-04-13)

**Commit:** `5fac623` → `f0d3d00` (merge) → `1f2a23a` (changelog log)
**Reverted in:** `4c1e68c` → `b738f40` (merge)

**Failure:** Deployed restructure in a single commit that:
- Removed 680+ city-service combo pages (301 redirect to `/grab-bar-installation` or `/bathroom-safety-services`)
- Removed 4 distant markets (NV, SC, MD-Montgomery, Lancaster → homepage)
- Fixed 3 quality bugs (broken `$Bathroom` template variable, doubled "Professional Professional", keyword-stuffed paragraph)

**Rules violated (in hindsight):**

| Rule | Violation |
|------|-----------|
| 1 — 8-week rule | NV/SC pages added 2026-03-13, removed 2026-04-10 (4 weeks, not 8) |
| 2 — Link audit | 18+ internal links across `src/app/[location]/page.tsx`, `DowningtownGrabBarContent.tsx`, `grab-bar-installation/page.tsx`, `local-news/[slug]/page.tsx` silently redirected to wrong pages |
| 3 — Strategic intent | NV/SC misclassified as "thin content" when they were "new market entry"; had dedicated phone numbers configured; strategic expansion per tracker row 7 |
| 4 — UX preview | Pushed to dev then immediately merged to main without verifying preview |
| 5 — Deploy size | Single commit added 80+ redirect rules — huge blast radius, couldn't partial-revert |

**Root cause:** No automated gate existed. Rules were documented in memory files and CLAUDE.md but not enforced at deploy boundary. Agent conflated "not ranking yet" with "thin content," and user approved under time pressure.

**Cost:**
- 3 days elapsed (deploy Apr 10 → revert Apr 13)
- User trust in agent judgment eroded
- GSC noise from rapid 301 churn (deploy → partial index → revert)
- Tracker rows 86-89 marked "Reverted" with explanation
- March 11 row 2 and March 13 row 7 re-opened to continue their 8-week windows

**Recovery:**
- `git revert` of both commits
- Quality fixes manually re-applied in revert commit (they were unambiguous wins)
- Live site verified with 14 curl checks post-deploy
- Tracker updated with revert entries

**What this skill does to prevent it next time:**
- Rule 1 would have BLOCKED: NV/SC were 4 weeks old
- Rule 2 would have BLOCKED: 18 broken internal links detectable via ripgrep
- Rule 3 would have BLOCKED: tracker row 7 adding them was <8 weeks old
- Rule 4 would have WARNED: structural change pushed to main without preview verification
- Rule 5 would have WARNED: 80+ redirect rules in one commit
- Rule 6 would have carved out the quality fixes as a separate PASS

**Lessons encoded:**
- "New market" and "thin content" are different categories — check age before killing
- Never bulk-deploy structural changes; split into preview → small deploys
- Internal links are a UX concern even when SEO is technically fine (301s dump users)
- The 8-week rule isn't arbitrary — Google's HCU/spam classifiers genuinely need that window

---

## Template for future entries

```
## YYYY-MM-DD — [Business] [Change summary]

**Commit:** `{sha}`
**Status:** BLOCKED / WARNED / REVERTED

**Failure:** One-paragraph description

**Rules violated:**
| Rule | Violation |
|------|-----------|
| N — Name | What specifically |

**Root cause:** What was missing

**Cost:** Time / trust / traffic impact

**Recovery:** What we did

**Lessons encoded:** What to check next time
```
