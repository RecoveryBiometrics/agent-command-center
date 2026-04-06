/**
 * Review agent — validates interpretations from interpret.js.
 *
 * Catches:
 * 1. False correlations (change matched a page but timing doesn't add up)
 * 2. Multiple competing explanations (two changes hit the same page)
 * 3. Bulk movements suggesting an algorithm update, not our changes
 * 4. Unattributed pages that deserve investigation
 * 5. Opportunities where our changes may be helping but haven't finished cooking
 */

/**
 * Run all review checks against the interpretation results.
 */
function review(interpretation, analysis) {
  const warnings = [];
  const insights = [];
  const { attributions, unattributed, boostedOpportunities } = interpretation;

  // --- CHECK 1: Bulk movement detector ---
  // If 5+ unrelated pages all moved the same direction by similar amounts,
  // it's probably a Google algorithm update, not our changes.
  const allMoved = [...(analysis.wins || []), ...(analysis.drops || [])];
  const upsCount = (analysis.wins || []).length;
  const downsCount = (analysis.drops || []).length;

  if (upsCount >= 5 || downsCount >= 5) {
    const direction = upsCount >= 5 ? 'up' : 'down';
    const count = direction === 'up' ? upsCount : downsCount;
    warnings.push({
      type: 'possible_algorithm_update',
      severity: 'high',
      message: `${count} pages moved ${direction} this period. When many pages shift together, it often signals a Google algorithm update rather than our changes taking effect. Cross-check with Search Engine Roundtable or Google Search Status Dashboard before attributing to specific changes.`,
    });
  }

  // --- CHECK 2: Competing explanations ---
  // Flag attributions where 2+ changes could explain the movement.
  for (const attr of attributions) {
    if (attr.allMatchingChanges.length >= 2) {
      const changeNames = attr.allMatchingChanges.map(c => c.change).join(', ');
      warnings.push({
        type: 'competing_explanations',
        severity: 'medium',
        message: `${attr.url} matched ${attr.allMatchingChanges.length} changes: ${changeNames}. Can't isolate which change caused the movement — they all hit this page around the same time.`,
        page: attr.url,
      });
    }
  }

  // --- CHECK 3: Too-early attributions ---
  // Flag high-confidence attributions on changes less than 4 weeks old.
  for (const attr of attributions) {
    if (attr.likelyCause.weeksAgo < 4 && attr.likelyCause.confidence !== 'low') {
      warnings.push({
        type: 'premature_attribution',
        severity: 'medium',
        message: `${attr.url} attributed to "${attr.likelyCause.change}" but that change is only ${attr.likelyCause.weeksAgo} weeks old. Content and meta changes typically need 6–12 weeks. This movement might be coincidental.`,
        page: attr.url,
      });
    }
  }

  // --- CHECK 4: Drops on recently changed pages ---
  // If we changed a page and it dropped, that's important to flag clearly.
  const dropsOnOurPages = attributions.filter(a => a.direction === 'down');
  for (const drop of dropsOnOurPages) {
    if (drop.likelyCause.weeksAgo >= 2 && drop.likelyCause.weeksAgo <= 8) {
      warnings.push({
        type: 'drop_after_change',
        severity: 'high',
        message: `${drop.url} DROPPED ${Math.abs(drop.delta).toFixed(1)} positions ${drop.likelyCause.weeksAgo} weeks after "${drop.likelyCause.change}". This could mean the change hurt rankings. However, drops in weeks 2–6 can be temporary as Google re-evaluates. Do NOT reverse yet — wait for the 8-week mark.`,
        page: drop.url,
      });
    }
  }

  // --- CHECK 5: Unattributed movements ---
  // Pages that moved significantly but don't match any changelog entry.
  if (unattributed.length > 0) {
    const notableUnattributed = unattributed.filter(u => Math.abs(u.delta) >= 5);
    if (notableUnattributed.length > 0) {
      const pages = notableUnattributed.map(u => `${u.url} (${u.direction} ${Math.abs(u.delta).toFixed(1)})`).join(', ');
      warnings.push({
        type: 'unattributed_movement',
        severity: 'medium',
        message: `${notableUnattributed.length} page(s) moved 5+ positions with no matching changelog entry: ${pages}. Possible causes: Google algorithm change, competitor activity, external backlinks, or a change that wasn't logged.`,
      });
    }
  }

  // --- CHECK 6: Opportunities accelerated by our changes ---
  if (boostedOpportunities.length > 0) {
    for (const opp of boostedOpportunities) {
      insights.push({
        type: 'opportunity_from_change',
        message: `${opp.url} is at position ${opp.position.toFixed(1)} — close to page 1. This page was affected by "${opp.change}" (${opp.weeksAgo} weeks ago). A small push — better title/meta or 1–2 internal links — could move it onto page 1.`,
        page: opp.url,
        actionable: true,
      });
    }
  }

  // --- CHECK 7: Stale changes ---
  // Flag changes that are 12+ weeks old with no visible impact on any tracked page.
  const { parseChangelog } = require('./interpret');
  const changes = parseChangelog();
  for (const change of changes) {
    const weeks = Math.floor((Date.now() - new Date(change.deployed).getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeks >= 12) {
      const hasAttribution = attributions.some(a =>
        a.allMatchingChanges.some(c => c.change === change.label)
      );
      if (!hasAttribution) {
        insights.push({
          type: 'stale_change',
          message: `"${change.label}" was deployed ${weeks} weeks ago but no tracked pages show movement attributable to it. The change may have had no effect, or the affected pages aren't getting enough impressions to appear in the data. Consider marking this change as assessed in SEO-CHANGELOG.md.`,
          actionable: false,
        });
      }
    }
  }

  // --- OVERALL CONFIDENCE RATING ---
  const highConfCount = attributions.filter(a => a.likelyCause.confidence === 'high').length;
  const totalAttributed = attributions.length;
  const highSeverityWarnings = warnings.filter(w => w.severity === 'high').length;

  let overallConfidence;
  if (highSeverityWarnings >= 2) {
    overallConfidence = 'LOW — multiple high-severity warnings. Read this report carefully before acting.';
  } else if (highConfCount >= 3 && highSeverityWarnings === 0) {
    overallConfidence = 'HIGH — strong attributions with clean data. Changes appear to be working as expected.';
  } else if (totalAttributed === 0 && unattributed.length > 3) {
    overallConfidence = 'LOW — many pages moved but none match our changes. Likely external factors.';
  } else {
    overallConfidence = 'MEDIUM — some attributions look solid, but review the warnings below.';
  }

  return {
    overallConfidence,
    warnings,
    insights,
    stats: {
      totalAttributed,
      totalUnattributed: unattributed.length,
      highConfidence: highConfCount,
      warningCount: warnings.length,
      insightCount: insights.length,
    },
  };
}

module.exports = { review };
