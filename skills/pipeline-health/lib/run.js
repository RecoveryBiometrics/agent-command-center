/**
 * Main orchestrator: loads state, runs checks, reports.
 */
const { execSync } = require('child_process');
const checks = [
  require('./check-vps-origin-sync'),
  require('./check-vps-working-tree'),
  require('./check-sitemap-health'),
  require('./check-hub-language'),
  require('./check-deploy-silence'),
];

const VPS_HOST = 'root@74.208.190.10';
const VPS_KEY = '~/.ssh/ionos_ghl';
const SITE_DIR = '/opt/globalhighlevel-site';
const LIVE_URL = 'https://globalhighlevel.com';
const LOCAL_REPO = '/Users/kerapassante/Developer/projects/marketing/podcast-pipeline';

function ssh(cmd) {
  return execSync(`ssh -i ${VPS_KEY} -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${VPS_HOST} "${cmd.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8', timeout: 30000,
  }).trim();
}

async function loadState() {
  const state = { liveUrl: LIVE_URL, localRepo: LOCAL_REPO };
  try {
    state.vpsHead = ssh(`cd ${SITE_DIR} && git rev-parse HEAD`);
    state.vpsOriginHead = ssh(`cd ${SITE_DIR} && git fetch origin main >/dev/null 2>&1; git rev-parse origin/main`);
    state.vpsAhead = parseInt(ssh(`cd ${SITE_DIR} && git rev-list --count origin/main..HEAD`), 10) || 0;
    state.vpsBehind = parseInt(ssh(`cd ${SITE_DIR} && git rev-list --count HEAD..origin/main`), 10) || 0;
    state.vpsStatus = ssh(`cd ${SITE_DIR} && git status --porcelain`);
    state.vpsLastDeploy = ssh(`grep 'deploy_site: pushed' /opt/ghl-pipeline/logs/pipeline.log 2>/dev/null | tail -1`);
    state.vpsReachable = true;
  } catch (e) {
    state.vpsReachable = false;
    state.vpsError = e.message.split('\n')[0];
  }
  try {
    state.localHead = execSync(`cd ${LOCAL_REPO} && git rev-parse origin/main`, { encoding: 'utf8' }).trim();
  } catch (e) {
    state.localHead = null;
  }
  return state;
}

async function runChecks({ alert = false } = {}) {
  console.log('\n═══ Pipeline Health ═══\n');
  const state = await loadState();

  if (!state.vpsReachable) {
    console.log(`❌ VPS unreachable: ${state.vpsError}`);
    if (alert) await postAlert(`VPS unreachable — cannot run health checks. Error: ${state.vpsError}`);
    return { exitCode: 2 };
  }

  const findings = [];
  for (const mod of checks) {
    try {
      findings.push(await mod.check(state));
    } catch (e) {
      findings.push({ name: mod.name || 'unknown', severity: 'WARN', message: `Check error: ${e.message}` });
    }
  }

  const hasBlock = findings.some(f => f.severity === 'BLOCK');
  const hasWarn = findings.some(f => f.severity === 'WARN');
  const overall = hasBlock ? 'BLOCK' : hasWarn ? 'WARN' : 'PASS';

  // Print table
  console.log('Check                       | Severity | Message');
  console.log('─'.repeat(90));
  for (const f of findings) {
    const icon = f.severity === 'BLOCK' ? '❌' : f.severity === 'WARN' ? '⚠️ ' : '✓';
    const name = f.name.padEnd(27);
    console.log(`${name} | ${icon} ${f.severity.padEnd(5)}  | ${f.message}`);
  }
  console.log('\nOverall:', overall);

  if (alert && overall !== 'PASS') {
    const failures = findings.filter(f => f.severity !== 'PASS');
    const body = failures.map(f => `${f.severity === 'BLOCK' ? '❌' : '⚠️'} ${f.name}: ${f.message}`).join('\n');
    await postAlert(`Pipeline Health ${overall}\n${body}`);
  }

  return { exitCode: overall === 'BLOCK' ? 2 : overall === 'WARN' ? 1 : 0, findings, state };
}

function loadSlackTokenFromEnv() {
  const fs = require('fs');
  const path = require('path');
  if (process.env.SLACK_BOT_TOKEN) return process.env.SLACK_BOT_TOKEN;
  const envPath = path.join(LOCAL_REPO, '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    const m = text.match(/^SLACK_BOT_TOKEN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

async function postAlert(message) {
  const token = loadSlackTokenFromEnv();
  if (!token) {
    console.log('(No SLACK_BOT_TOKEN — skipping alert)');
    return;
  }
  const OPS_LOG_CHANNEL = 'C0AQG0DP222'; // #ops-log — same as ops_log.py
  try {
    const https = require('https');
    const data = JSON.stringify({ channel: OPS_LOG_CHANNEL, text: `*Pipeline Health*\n${message}` });
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'slack.com', path: '/api/chat.postMessage', method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(data),
        },
      }, res => { res.on('data', () => {}); res.on('end', resolve); });
      req.on('error', reject);
      req.write(data); req.end();
    });
    console.log('Alert posted to #ops-log');
  } catch (e) {
    console.error('Alert post failed:', e.message);
  }
}

module.exports = { runChecks };
