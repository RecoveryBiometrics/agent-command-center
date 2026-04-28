/**
 * Main gate runner. Orchestrates stages 01-load, 02-check, 03-report.
 * Exit codes: 0 = pass, 1 = warn, 2 = block.
 */
const { loadBusiness } = require('./load-business');
const { detectChanges } = require('./detect-changes');
const { fetchTrackerRows } = require('./fetch-tracker');
const { logResult } = require('./log-result');

async function runGate({ businessId, summary, forceOverride = false, forceReason = null }) {
  // ===== STAGE 01: LOAD =====
  const config = loadBusiness(businessId);
  const orgPath = config.org.path;

  const changeSet = detectChanges(orgPath);

  const credentialsPath = (config.seo_gate && config.seo_gate.credentials_path) || null;
  const trackerRows = await fetchTrackerRows(config.tracking_sheet_id, 'A2:H200', credentialsPath);

  const changeContext = {
    businessId,
    summary,
    commitSha: changeSet.commitSha,
    branch: changeSet.branch,
    changeType: changeSet.changeType,
    affectedFiles: changeSet.changedFiles,
    affectedUrls: changeSet.affectedUrls,
    fileCount: changeSet.fileCount,
    newRedirectCount: changeSet.newRedirectCount,
    config: {
      orgPath,
      trackingSheetId: config.tracking_sheet_id,
      credentialsPath,
      slackBusinessChannel: config.slack.business_channel,
      slackOpsLogChannel: config.slack.ops_log_channel,
    },
    trackerRows,
    forceOverride,
    forceReason,
  };

  // ===== STAGE 02: CHECK =====
  const findings = [];

  // Rule 6 carve-out: pure quality fixes pass early
  if (changeContext.changeType.length === 1 && changeContext.changeType[0] === 'quality-fix') {
    findings.push({
      rule: 'Rule 6 — Quality fix carve-out',
      severity: 'PASS',
      message: 'Pure content fix — structural rules skipped',
    });
  } else {
    // Run all other rules
    const ruleModules = [
      './check-eight-week',
      './check-link-audit',
      './check-strategic-intent',
      './check-ux-preview',
      './check-deploy-size',
      './check-eval-window',
      './check-language-meta',
      './check-findability',
    ];

    for (const mod of ruleModules) {
      try {
        const { check } = require(mod);
        const result = await check(changeContext);
        findings.push(result);
      } catch (e) {
        findings.push({
          rule: mod,
          severity: 'WARN',
          message: `Rule execution error: ${e.message}`,
        });
      }
    }
  }

  // Determine overall severity
  const hasBlock = findings.some(f => f.severity === 'BLOCK');
  const hasWarn = findings.some(f => f.severity === 'WARN');
  let overallSeverity = 'PASS';
  if (hasBlock && !forceOverride) overallSeverity = 'BLOCK';
  else if (hasBlock && forceOverride) overallSeverity = 'FORCED';
  else if (hasWarn) overallSeverity = 'WARN';

  const results = { overallSeverity, findings, forceOverride };

  // ===== STAGE 03: REPORT =====
  printReport({ businessId, summary, changeContext, results });

  const logOk = await logResult({ config: changeContext.config, results, changeContext, businessId });

  // Rule 7: Tracker logging is required
  if (!logOk.loggedToSheet) {
    return { exitCode: 2, overallSeverity: 'BLOCK', findings: [...findings, {
      rule: 'Rule 7 — Tracker logging',
      severity: 'BLOCK',
      message: 'Could not write to tracker sheet. Undocumented changes not allowed.',
    }] };
  }

  // Map severity to exit code
  let exitCode = 0;
  if (overallSeverity === 'BLOCK') exitCode = 2;
  else if (overallSeverity === 'WARN') exitCode = 1;
  else if (overallSeverity === 'FORCED') exitCode = 0;

  return { exitCode, overallSeverity, findings };
}

function printReport({ businessId, summary, changeContext, results }) {
  const sep = '═'.repeat(55);
  const { overallSeverity, findings, forceOverride } = results;

  console.log(`\n${sep}`);
  console.log(`SEO DEPLOY GATE — ${businessId}`);
  console.log(`Summary: ${summary}`);
  console.log(`Commit: ${changeContext.commitSha} on ${changeContext.branch}`);
  console.log(`Files: ${changeContext.fileCount}, Redirects added: ${changeContext.newRedirectCount}`);
  console.log(`Change type: ${changeContext.changeType.join(', ')}`);
  console.log(sep);
  console.log(`\nSeverity: ${overallSeverity}${forceOverride ? ' (FORCE OVERRIDE)' : ''}\n`);

  const fired = findings.filter(f => f.severity !== 'PASS');
  const passed = findings.filter(f => f.severity === 'PASS');

  if (fired.length > 0) {
    console.log('Findings:');
    fired.forEach(f => {
      const icon = f.severity === 'BLOCK' ? '❌' : '⚠️ ';
      console.log(`  ${icon} ${f.rule}`);
      console.log(`     ${f.message}\n`);
    });
  }

  if (passed.length > 0) {
    console.log(`Passed: ${passed.map(f => f.rule).join(', ')}`);
  }

  const exitNum = overallSeverity === 'BLOCK' ? 2 : overallSeverity === 'WARN' ? 1 : 0;
  console.log(`\nExit code: ${exitNum} (${overallSeverity})`);

  if (overallSeverity === 'BLOCK') {
    console.log('\nTo override: re-run with --force --force-reason "<explanation>"');
  }
  console.log(sep + '\n');
}

module.exports = { runGate };
