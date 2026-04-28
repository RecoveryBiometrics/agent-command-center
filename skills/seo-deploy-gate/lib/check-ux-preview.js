/**
 * Rule 4: UX preview verification
 * WARN if structural change is being pushed to main without confirmed preview verification
 */
function check(changeContext) {
  const { changeType, branch } = changeContext;

  if (!changeType.includes('structural') && !changeType.includes('market-removal')) {
    return { rule: 'Rule 4 — UX preview', severity: 'PASS', message: 'Not a structural change' };
  }

  if (branch !== 'main') {
    return { rule: 'Rule 4 — UX preview', severity: 'PASS', message: `Running on ${branch}, not main — preview flow assumed` };
  }

  return {
    rule: 'Rule 4 — UX preview',
    severity: 'WARN',
    message: 'Structural change being pushed to main. Confirm Vercel preview was verified before merging.',
    evidence: { branch, changeType },
  };
}

module.exports = { check };
