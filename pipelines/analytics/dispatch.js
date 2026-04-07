/**
 * Executor — Routes recommendations to target pipelines via Google Sheets.
 *
 * Writes dispatch instructions to the "Dispatch" tab on the business's tracker sheet.
 * Target pipelines read from this tab on their next run and mark rows as "consumed".
 * This works across CI runs (no shared filesystem needed).
 *
 * Podcast dispatch still uses git push to topic-weights.json (VPS pulls from git).
 */
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');
const config = require('./config');

async function dispatch(recommendations) {
  const dispatched = [];

  // Group recommendations by target pipeline
  const byTarget = {};
  for (const rec of recommendations) {
    if (!byTarget[rec.target]) byTarget[rec.target] = [];
    byTarget[rec.target].push(rec);
  }

  const now = new Date().toISOString();
  const date = now.split('T')[0];

  // Write seo-content and directory dispatches to Sheet
  const sheetTargets = ['seo-content', 'directory'];
  const sheetRows = [];

  for (const target of sheetTargets) {
    if (!byTarget[target]) continue;
    for (const rec of byTarget[target]) {
      sheetRows.push([
        date,
        target,
        rec.action,
        JSON.stringify(rec.params),
        rec.why,
        'pending',
      ]);
    }
  }

  if (sheetRows.length > 0 && config.trackingSheetId) {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId: config.trackingSheetId,
        range: 'Dispatch!A:F',
        valueInputOption: 'RAW',
        requestBody: { values: sheetRows },
      });

      for (const target of sheetTargets) {
        if (byTarget[target]) {
          console.log(`  Dispatched ${byTarget[target].length} instructions to ${target} via Sheet`);
          dispatched.push({ target, instructions: byTarget[target].length });
        }
      }
    } catch (err) {
      console.warn(`  Sheet dispatch failed: ${err.message}`);
    }
  } else if (sheetRows.length > 0 && !config.trackingSheetId) {
    console.warn('  No tracking_sheet_id — cannot dispatch to Sheet');
  }

  // Podcast / content-production dispatch via topic-weights.json + git push
  // This still uses git because the VPS pulls from git, not Sheets
  if (byTarget['content-production']) {
    try {
      const { execSync } = require('child_process');
      const podcastRepo = config._raw.org?.path?.replace('~', process.env.HOME);
      if (!podcastRepo) {
        console.warn('  Cannot dispatch to content-production: no org.path in business YAML');
      } else {
        const weightsPath = require('path').join(podcastRepo, 'ghl-podcast-pipeline/data/topic-weights.json');
        const fs = require('fs');
        if (fs.existsSync(weightsPath)) {
          const existing = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
          const weights = existing.weights || {};

          for (const rec of byTarget['content-production']) {
            if (rec.action === 'adjust_topic_weights' && rec.params?.topics) {
              const multiplier = rec.params.direction === 'increase' ? 1.3 : 0.7;
              for (const topic of rec.params.topics) {
                weights[topic] = Math.round((weights[topic] || 1.0) * multiplier * 10) / 10;
              }
            }
          }

          const updated = {
            updated_by: 'analytics-team',
            updated_at: now,
            weights,
            reason: byTarget['content-production'].map(r => r.why).join('; '),
          };

          fs.writeFileSync(weightsPath, JSON.stringify(updated, null, 2));

          try {
            const repoDir = require('path').join(podcastRepo, 'ghl-podcast-pipeline');
            execSync(`cd "${repoDir}" && git add data/topic-weights.json && git commit -m "analytics-team: update topic weights" && git push`, {
              stdio: 'pipe',
              timeout: 30000,
            });
            console.log('  Pushed topic-weights.json to remote');
          } catch (gitErr) {
            console.warn(`  Git push failed: ${gitErr.message}`);
          }

          dispatched.push({ target: 'content-production', instructions: byTarget['content-production'].length });

          // Also log to Sheet for visibility
          if (config.trackingSheetId) {
            try {
              const auth = await getAuthClient();
              const sheets = google.sheets({ version: 'v4', auth });
              const rows = byTarget['content-production'].map(rec => [
                date, 'content-production', rec.action, JSON.stringify(rec.params), rec.why, 'pushed-to-git',
              ]);
              await sheets.spreadsheets.values.append({
                spreadsheetId: config.trackingSheetId,
                range: 'Dispatch!A:F',
                valueInputOption: 'RAW',
                requestBody: { values: rows },
              });
            } catch (e) {
              // non-fatal — git push already happened
            }
          }
        } else {
          console.warn(`  topic-weights.json not found at ${weightsPath}`);
        }
      }
    } catch (e) {
      console.warn(`  Content-production dispatch failed: ${e.message}`);
    }
  }

  if (dispatched.length === 0) {
    console.log('  No dispatches this run (no high-confidence actionable recommendations)');
  }

  return dispatched;
}

module.exports = { dispatch };
