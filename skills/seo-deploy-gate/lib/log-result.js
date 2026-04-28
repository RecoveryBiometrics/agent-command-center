/**
 * Log gate run to tracker sheet and post to Slack.
 * Rule 7 depends on this succeeding.
 */
const fs = require('fs');
const path = require('path');
const { getGoogleAuth } = require('./auth');

async function logResult({ config, results, changeContext, businessId }) {
  const { overallSeverity, findings, forceOverride } = results;

  // 1. Log to tracker sheet
  const sheetSuccess = await logToSheet({
    spreadsheetId: config.trackingSheetId,
    credentialsPath: config.credentialsPath,
    businessId,
    severity: forceOverride ? 'FORCED' : overallSeverity,
    changeContext,
    findings,
  });

  if (!sheetSuccess) {
    console.error('[seo-deploy-gate] Tracker logging FAILED — Rule 7 violation, blocking deploy');
    return { loggedToSheet: false };
  }

  // 2. Append to incident log if WARN/BLOCK/FORCED
  if (overallSeverity !== 'PASS' || forceOverride) {
    appendIncidentLog({ businessId, severity: forceOverride ? 'FORCED' : overallSeverity, findings, changeContext });
  }

  // 3. Post to Slack for WARN/BLOCK/FORCED
  if (overallSeverity !== 'PASS' || forceOverride) {
    await postSlack({ config, severity: forceOverride ? 'FORCED' : overallSeverity, findings, changeContext, businessId });
  }

  return { loggedToSheet: true };
}

async function logToSheet({ spreadsheetId, credentialsPath, businessId, severity, changeContext, findings }) {
  const googleapis = safeRequire('googleapis');
  if (!googleapis) {
    console.error('[seo-deploy-gate] googleapis not available — skipping sheet log');
    return false;
  }

  try {
    const auth = getGoogleAuth({
      googleapis,
      credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = googleapis.google.sheets({ version: 'v4', auth });

    const today = new Date().toISOString().slice(0, 10);
    const rulesFired = findings.filter(f => f.severity !== 'PASS').map(f => f.rule).join('; ');
    const topUrls = (changeContext.affectedUrls || []).slice(0, 5).join(', ');

    // Try "SEO Safeguard" tab first. If missing, create it.
    const tabName = 'SEO Safeguard';
    await ensureTabExists({ sheets, spreadsheetId, tabName });

    const row = [
      today,
      businessId,
      severity,
      changeContext.summary || '',
      changeContext.branch || '',
      changeContext.commitSha || '',
      rulesFired,
      String(changeContext.fileCount || 0),
      String(changeContext.newRedirectCount || 0),
      topUrls,
      changeContext.forceReason || '',
      JSON.stringify(findings.map(f => ({ rule: f.rule, severity: f.severity, message: f.message }))),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${tabName}'!A:L`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return true;
  } catch (e) {
    console.error('[seo-deploy-gate] Sheet log error:', e.message);
    return false;
  }
}

async function ensureTabExists({ sheets, spreadsheetId, tabName }) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = meta.data.sheets.some(s => s.properties.title === tabName);
    if (exists) return;

    // Create the tab with headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A1:L1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Date', 'Business', 'Severity', 'Summary', 'Branch', 'Commit',
          'Rules Fired', 'Files Changed', 'Redirects Added',
          'URLs Affected', 'Force Reason', 'Findings Detail',
        ]],
      },
    });
  } catch (e) {
    // If we can't create the tab, we'll fall back to appending to wherever — but log the error
    console.error('[seo-deploy-gate] Could not ensure tab exists:', e.message);
  }
}

function appendIncidentLog({ businessId, severity, findings, changeContext }) {
  const logPath = path.join(__dirname, '..', 'references', 'incident-log.md');
  if (!fs.existsSync(logPath)) return;

  const today = new Date().toISOString().slice(0, 10);
  const rulesBullets = findings
    .filter(f => f.severity !== 'PASS')
    .map(f => `- ${f.rule}: ${f.message}`)
    .join('\n');

  const entry = `

---

## ${today} — ${businessId} ${changeContext.summary || ''}

**Commit:** \`${changeContext.commitSha || 'unknown'}\`
**Status:** ${severity}

**Rules fired:**
${rulesBullets}

**Files changed:** ${changeContext.fileCount || 0}
**Redirects added:** ${changeContext.newRedirectCount || 0}
${changeContext.forceReason ? `\n**Force reason:** ${changeContext.forceReason}` : ''}
`;

  fs.appendFileSync(logPath, entry);
}

async function postSlack({ config, severity, findings, changeContext, businessId }) {
  // This function is a no-op placeholder in the node-only version.
  // When invoked from a Claude Code session, the session agent handles Slack posting via MCP.
  // When run from automated pipelines with GOOGLE_SERVICE_ACCOUNT_KEY, Slack posting requires
  // a Slack bot token (SLACK_BOT_TOKEN) — add later if needed.
  if (!process.env.SLACK_BOT_TOKEN) {
    console.log(`[seo-deploy-gate] Would post to Slack ${config.slackBusinessChannel} (no SLACK_BOT_TOKEN set)`);
    return;
  }

  // TODO: Implement Slack Web API call when bot token is available
  console.log(`[seo-deploy-gate] Slack posting stub — severity=${severity}, business=${businessId}`);
}

function safeRequire(mod) {
  try { return require(mod); } catch { return null; }
}

module.exports = { logResult };
