/**
 * Rule 5: Atomic deploy size
 * WARN on large deploys (>100 files or >50 redirects)
 * BLOCK if both thresholds exceeded (unless --confirm-large-deploy)
 */
function check(changeContext) {
  const { fileCount, newRedirectCount, forceOverride } = changeContext;

  const bigFiles = fileCount > 100;
  const bigRedirects = newRedirectCount > 50;

  if (!bigFiles && !bigRedirects) {
    return { rule: 'Rule 5 — Deploy size', severity: 'PASS', message: `${fileCount} files, ${newRedirectCount} redirects (OK)` };
  }

  if (bigFiles && bigRedirects) {
    return {
      rule: 'Rule 5 — Deploy size',
      severity: forceOverride ? 'WARN' : 'BLOCK',
      message: `Large deploy: ${fileCount} files AND ${newRedirectCount} redirects. Consider splitting into smaller deploys.`,
      evidence: { fileCount, newRedirectCount },
    };
  }

  return {
    rule: 'Rule 5 — Deploy size',
    severity: 'WARN',
    message: bigFiles
      ? `${fileCount} files changed (>100). Blast radius is wide.`
      : `${newRedirectCount} redirect rules added (>50). Hard to revert atomically.`,
    evidence: { fileCount, newRedirectCount },
  };
}

module.exports = { check };
