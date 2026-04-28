/**
 * Rule 1: 8-week rule
 * BLOCK if current change reverses/conflicts with a change <56 days old.
 */

const EIGHT_WEEKS_MS = 56 * 24 * 60 * 60 * 1000;

function check(changeContext) {
  const { changeType, affectedUrls, trackerRows } = changeContext;

  // Only applies to structural / market-removal changes
  if (!changeType.includes('structural') && !changeType.includes('market-removal')) {
    return { rule: 'Rule 1 — 8-week rule', severity: 'PASS', message: 'Not a structural or market-removal change' };
  }

  if (!trackerRows || trackerRows.length === 0) {
    return { rule: 'Rule 1 — 8-week rule', severity: 'PASS', message: 'No tracker rows to compare against' };
  }

  const now = new Date();
  const conflicts = [];

  for (const url of affectedUrls) {
    // Find tracker rows that mention this URL pattern
    const matches = trackerRows.filter(row => {
      const urls = String(row.urlsAffected || '').toLowerCase();
      const slug = url.toLowerCase().replace(/^\//, '').replace(/:/g, '');
      return urls.includes(slug) || urls.includes(url.toLowerCase());
    });

    for (const row of matches) {
      const rowDate = new Date(row.date);
      if (isNaN(rowDate)) continue;
      const age = now - rowDate;
      if (age < EIGHT_WEEKS_MS) {
        const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
        conflicts.push({ url, rowIndex: row.rowIndex, date: row.date, daysOld, summary: row.whatChanged });
      }
    }
  }

  if (conflicts.length === 0) {
    return { rule: 'Rule 1 — 8-week rule', severity: 'PASS', message: 'No conflicts with changes <8 weeks old' };
  }

  const message = conflicts
    .map(c => `${c.url} changed ${c.daysOld} days ago (tracker row ${c.rowIndex})`)
    .join('; ');

  return {
    rule: 'Rule 1 — 8-week rule',
    severity: 'BLOCK',
    message: `Conflicts with recent changes: ${message}`,
    evidence: { conflicts },
  };
}

module.exports = { check };
