const fs = require('fs');
const path = require('path');
const config = require('./config');
const { fetchChangelogFromSheet } = require('./sheet');

const CHANGELOG_PATH = config.changelogPath;
const SITE = config.siteBase;

/**
 * Parse changelog entries with their URL patterns.
 */
function parseChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) return [];

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const entries = [];
  const entryPattern = /^### (\d{4}-\d{2}-\d{2}) — (.+)$/gm;

  let match;
  while ((match = entryPattern.exec(content)) !== null) {
    const deployed = match[1];
    const label = match[2].trim();
    const entryStart = match.index;

    const nextEntry = content.indexOf('\n### ', entryStart + 1);
    const entryBlock = nextEntry !== -1
      ? content.slice(entryStart, nextEntry)
      : content.slice(entryStart);

    // Extract URL patterns
    const urlMatch = entryBlock.match(/\*\*URLs affected:\*\*\s*(.+)/);
    const urlPatterns = urlMatch
      ? urlMatch[1].split(',').map(p => p.trim().replace(/`/g, ''))
      : [];

    // Extract type
    const typeMatch = entryBlock.match(/\*\*Type:\*\*\s*(.+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'unknown';

    // Extract expected impact
    const impactMatch = entryBlock.match(/\*\*Expected impact:\*\*\s*(.+)/);
    const expectedImpact = impactMatch ? impactMatch[1].trim() : '';

    // Extract status
    const statusMatch = entryBlock.match(/\*\*Status:\*\*\s*(.+)/);
    const status = statusMatch ? statusMatch[1].trim() : '';

    entries.push({ deployed, label, type, urlPatterns, expectedImpact, status });
  }

  return entries;
}

/**
 * Check if a URL matches a glob-like pattern from the changelog.
 * Supports: * (wildcard segment), exact match, and prefix match.
 */
function urlMatchesPattern(url, pattern) {
  // Strip domain to get path
  const pagePath = url.replace(SITE, '') || '/';

  // Wildcard = all pages
  if (pattern === '*') return true;

  // Convert glob pattern to regex
  // /bathroom-safety-*/bathroom-grab-bar-installation → /bathroom-safety-[^/]+/bathroom-grab-bar-installation
  // /bathroom-safety-rockville-* → /bathroom-safety-rockville-[^/]+(/.+)?
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex chars (but not *)
    .replace(/\*/g, '[^/]*');               // * matches within a path segment

  // Allow trailing content (e.g., /bathroom-safety-rockville-* matches /bathroom-safety-rockville-md/bathroom-grab-bar-installation)
  const regex = new RegExp('^' + regexStr + '(/.*)?$');
  return regex.test(pagePath);
}

/**
 * Calculate weeks since a date.
 */
function weeksSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Assign a confidence level to an attribution.
 */
function getConfidence(change, positionDelta, weeks) {
  // Too early — change hasn't had time to affect rankings
  if (weeks < 2) return { level: 'low', reason: 'Change deployed less than 2 weeks ago — too early for ranking movement' };

  // Sweet spot — 4–12 weeks is when SEO changes typically show
  if (weeks >= 4 && weeks <= 12) {
    if (Math.abs(positionDelta) >= 5) return { level: 'high', reason: `Strong movement ${weeks} weeks after deployment — timing aligns with typical SEO response` };
    return { level: 'medium', reason: `Moderate movement ${weeks} weeks after deployment` };
  }

  // 2–4 weeks — possible for technical changes (schema, internal links)
  if (weeks >= 2 && weeks < 4) {
    const fastTypes = ['internal linking', 'structured data', 'schema'];
    const isFastType = fastTypes.some(t => change.type.toLowerCase().includes(t));
    if (isFastType) return { level: 'medium', reason: `Technical change (${change.type}) can index faster — ${weeks} weeks is plausible` };
    return { level: 'low', reason: `Only ${weeks} weeks since deployment — content/meta changes typically take 6–12 weeks` };
  }

  // Over 12 weeks — change is old, movement may be unrelated
  if (weeks > 12) return { level: 'low', reason: `Change is ${weeks} weeks old — movement may be from a newer factor` };

  return { level: 'medium', reason: `${weeks} weeks since deployment` };
}

/**
 * Main interpretation: connect page movements to changelog entries.
 */
async function interpret(analysis, data) {
  const sheetChanges = await fetchChangelogFromSheet();
  const changes = sheetChanges !== null
    ? (console.log(`  Read ${sheetChanges.length} changelog entries from Google Sheet`), sheetChanges)
    : (console.log('  Falling back to markdown changelog'), parseChangelog());
  const attributions = [];
  const unattributed = [];

  // Process wins and drops
  const movedPages = [
    ...analysis.wins.map(w => ({ ...w, direction: 'up' })),
    ...analysis.drops.map(d => ({ ...d, direction: 'down' })),
  ];

  for (const page of movedPages) {
    const url = page.url;
    const matchingChanges = [];

    for (const change of changes) {
      const weeks = weeksSince(change.deployed);
      const matches = change.urlPatterns.some(pattern => urlMatchesPattern(url, pattern));

      if (matches) {
        const confidence = getConfidence(change, page.positionDelta, weeks);
        matchingChanges.push({
          change: change.label,
          deployed: change.deployed,
          weeksAgo: weeks,
          type: change.type,
          expectedImpact: change.expectedImpact,
          confidence: confidence.level,
          reason: confidence.reason,
        });
      }
    }

    if (matchingChanges.length > 0) {
      // Sort by confidence (high first), then by recency
      matchingChanges.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.confidence] - order[b.confidence]) || (a.weeksAgo - b.weeksAgo);
      });

      attributions.push({
        url: url.replace(SITE, '') || '/',
        direction: page.direction,
        positionNow: page.position,
        positionWas: page.priorPosition,
        delta: page.positionDelta,
        clicks: page.clicks,
        impressions: page.impressions,
        likelyCause: matchingChanges[0],
        allMatchingChanges: matchingChanges,
      });
    } else {
      unattributed.push({
        url: url.replace(SITE, '') || '/',
        direction: page.direction,
        positionNow: page.position,
        positionWas: page.priorPosition,
        delta: page.positionDelta,
        clicks: page.clicks,
        impressions: page.impressions,
      });
    }
  }

  // Check opportunities against changes too — are any close-to-page-1 pages ones we recently changed?
  const boostedOpportunities = [];
  for (const opp of analysis.opportunities) {
    const url = opp.keys[0];
    for (const change of changes) {
      const weeks = weeksSince(change.deployed);
      if (weeks >= 2 && weeks <= 12 && change.urlPatterns.some(p => urlMatchesPattern(url, p))) {
        boostedOpportunities.push({
          url: url.replace(SITE, '') || '/',
          position: opp.position,
          impressions: opp.impressions,
          change: change.label,
          deployed: change.deployed,
          weeksAgo: weeks,
        });
        break;
      }
    }
  }

  return { attributions, unattributed, boostedOpportunities };
}

module.exports = { interpret, parseChangelog, urlMatchesPattern };
