/**
 * Rule 3: Strategic intent check
 * BLOCK if removing URLs that were added <56 days ago (new market, not thin content)
 */
const EIGHT_WEEKS_MS = 56 * 24 * 60 * 60 * 1000;

function check(changeContext) {
  const { changeType, affectedUrls, trackerRows } = changeContext;

  if (!changeType.includes('market-removal')) {
    return { rule: 'Rule 3 — Strategic intent', severity: 'PASS', message: 'Not a market-removal change' };
  }

  if (!trackerRows || trackerRows.length === 0) {
    return { rule: 'Rule 3 — Strategic intent', severity: 'PASS', message: 'No tracker history to evaluate strategic age' };
  }

  const now = new Date();
  const youngRemovals = [];

  for (const url of affectedUrls) {
    // Find the earliest tracker row that "adds" this URL (contains the URL + "new" indicator)
    const addedRow = trackerRows.find(row => {
      const urls = String(row.urlsAffected || '').toLowerCase();
      const changeDesc = String(row.whatChanged || '').toLowerCase();
      const type = String(row.type || '').toLowerCase();
      const slug = url.toLowerCase().replace(/^\//, '').replace(/:/g, '');

      const mentionsUrl = urls.includes(slug) || urls.includes(url.toLowerCase());
      const isAddition =
        type.includes('new') ||
        changeDesc.includes('new pages') ||
        changeDesc.includes('expansion') ||
        changeDesc.includes('market');

      return mentionsUrl && isAddition;
    });

    if (addedRow) {
      const addedDate = new Date(addedRow.date);
      if (isNaN(addedDate)) continue;
      const age = now - addedDate;
      if (age < EIGHT_WEEKS_MS) {
        const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
        youngRemovals.push({ url, addedDate: addedRow.date, daysOld, summary: addedRow.whatChanged });
      }
    }
  }

  if (youngRemovals.length === 0) {
    return { rule: 'Rule 3 — Strategic intent', severity: 'PASS', message: 'No young (new market) pages being removed' };
  }

  const message = youngRemovals
    .map(r => `${r.url} (added ${r.daysOld}d ago as new market entry, not thin content)`)
    .join('; ');

  return {
    rule: 'Rule 3 — Strategic intent',
    severity: 'BLOCK',
    message: `Removing pages that are <8 weeks old strategic additions: ${message}. Use --confirm-new-market-removal to override.`,
    evidence: { youngRemovals },
  };
}

module.exports = { check };
