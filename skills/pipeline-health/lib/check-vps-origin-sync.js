/**
 * Check 1: VPS git HEAD vs origin/main HEAD.
 * BLOCK if VPS has unpushed commits (stranded content) or is significantly behind.
 */
const name = 'VPS ↔ origin sync';

function check(state) {
  if (state.vpsHead === state.vpsOriginHead) {
    return { name, severity: 'PASS', message: `Both at ${state.vpsHead.slice(0, 7)}` };
  }
  if (state.vpsAhead > 0) {
    return {
      name,
      severity: 'BLOCK',
      message: `VPS has ${state.vpsAhead} unpushed commit(s) — content stranded. Behind: ${state.vpsBehind}.`,
    };
  }
  if (state.vpsBehind > 5) {
    return {
      name,
      severity: 'WARN',
      message: `VPS is ${state.vpsBehind} commits behind origin. Will rebase on next deploy.`,
    };
  }
  return {
    name,
    severity: 'PASS',
    message: `VPS ${state.vpsBehind} behind origin (normal — will rebase on next push).`,
  };
}

module.exports = { name, check };
