/**
 * Rule 8: Active evaluation window
 * WARN if more than 2 recent changes touching overlapping URLs are still pending
 */
const EIGHT_WEEKS_MS = 56 * 24 * 60 * 60 * 1000;

function check(changeContext) {
  const { affectedUrls, trackerRows } = changeContext;

  if (!trackerRows || trackerRows.length === 0) {
    return { rule: 'Rule 8 — Active eval window', severity: 'PASS', message: 'No tracker history' };
  }

  const now = new Date();

  // Find active rows (pending or monitoring) that are <8 weeks old and overlap
  const activeOverlapping = trackerRows.filter(row => {
    const status = String(row.status || '').toLowerCase();
    const isActive = status.includes('pending') || status.includes('monitoring');
    if (!isActive) return false;

    const rowDate = new Date(row.date);
    if (isNaN(rowDate)) return false;
    if (now - rowDate > EIGHT_WEEKS_MS) return false;

    const urls = String(row.urlsAffected || '').toLowerCase();
    return affectedUrls.some(u => {
      const slug = u.toLowerCase().replace(/^\//, '').replace(/:/g, '');
      return urls.includes(slug) || urls.includes(u.toLowerCase());
    });
  });

  if (activeOverlapping.length <= 2) {
    return { rule: 'Rule 8 — Active eval window', severity: 'PASS', message: `${activeOverlapping.length} active overlapping change(s)` };
  }

  return {
    rule: 'Rule 8 — Active eval window',
    severity: 'WARN',
    message: `${activeOverlapping.length} active changes already in flight for overlapping URLs. Signal will be muddy.`,
    evidence: { count: activeOverlapping.length, rows: activeOverlapping.map(r => r.rowIndex) },
  };
}

module.exports = { check };
