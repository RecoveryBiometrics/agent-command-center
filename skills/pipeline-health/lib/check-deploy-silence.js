/**
 * Check 5: VPS deploy log should have a successful push in the last 48h.
 * Silent deploys are how the Apr 10-14 incident went unnoticed for 5 days.
 */
const name = 'Deploy silence';

function check(state) {
  if (!state.vpsLastDeploy) {
    return {
      name,
      severity: 'WARN',
      message: 'No "deploy_site: pushed" line found in pipeline log — is pipeline running?',
    };
  }
  // Log format: [2026-04-14 15:02:48] [SCHEDULER]   deploy_site: pushed N post(s)...
  const match = state.vpsLastDeploy.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
  if (!match) {
    return { name, severity: 'PASS', message: 'Last deploy line found but unparseable timestamp' };
  }
  const lastDeploy = new Date(match[1].replace(' ', 'T'));
  const hoursAgo = (Date.now() - lastDeploy.getTime()) / (1000 * 60 * 60);

  if (hoursAgo > 48) {
    return {
      name,
      severity: 'WARN',
      message: `Last successful deploy was ${Math.round(hoursAgo)}h ago (${match[1]}). Expected daily cycle.`,
    };
  }
  return { name, severity: 'PASS', message: `Last deploy ${Math.round(hoursAgo)}h ago` };
}

module.exports = { name, check };
