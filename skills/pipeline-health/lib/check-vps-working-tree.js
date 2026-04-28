/**
 * Check 2: VPS working tree clean.
 * Hand-edits or stray files block --autostash rebase edge cases and signal drift.
 */
const name = 'VPS working tree';

const KNOWN_HARMLESS = new Set([
  'classify-posts.py', 'design-homepage.py', 'design-log.txt', 'robots.txt',
]);

function check(state) {
  const lines = (state.vpsStatus || '').split('\n').map(l => l.trim()).filter(Boolean);

  // Untracked posts/*.json are normal: pipeline generates content between
  // cycles and deploy_site commits them. Only flag if they're stale (handled
  // separately by the deploy-silence check) or if TRACKED files are modified.
  const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M '));
  const concerning = lines.filter(l => {
    const file = l.slice(3);
    if (KNOWN_HARMLESS.has(file)) return false;
    if (l.startsWith('??') && /^posts\/.+\.json$/.test(file)) return false; // pipeline WIP
    if (l.startsWith('??') && /^globalhighlevel-site\/posts\/.+\.json$/.test(file)) return false;
    return true;
  });

  if (modified.length > 0) {
    return {
      name,
      severity: 'WARN',
      message: `${modified.length} modified tracked file(s): ${modified.map(l => l.slice(3)).slice(0, 3).join(', ')}`,
    };
  }

  if (concerning.length === 0) {
    const wip = lines.filter(l => l.startsWith('??') && /posts\/.+\.json$/.test(l.slice(3))).length;
    return {
      name,
      severity: 'PASS',
      message: wip > 0 ? `Clean (${wip} post(s) pending next deploy)` : 'Clean',
    };
  }

  return {
    name,
    severity: 'WARN',
    message: `${concerning.length} unexpected working-tree entries`,
  };
}

module.exports = { name, check };
