/**
 * Sheet Reader — Reads SEO Changelog from the business's Google Sheet.
 *
 * Returns the same data shapes as the markdown parsers in interpret.js and report.js,
 * so both can switch to Sheet-first with markdown fallback.
 */
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SHEET_TAB = 'SEO Changelog';

/**
 * Fetch changelog entries from the Google Sheet.
 * Returns same shape as parseChangelog() in interpret.js:
 *   [{ deployed, label, type, urlPatterns, expectedImpact, status }]
 * Returns null on failure (signal to fall back to markdown).
 */
async function fetchChangelogFromSheet() {
  if (!config.trackingSheetId) return null;

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.trackingSheetId,
      range: `'${SHEET_TAB}'!A:F`,
    });

    const rows = res.data.values;
    if (!rows || rows.length <= 1) return [];

    // Skip header row
    // Sheet columns: Date | Type | URLs Affected | What Changed | Expected Impact | Check By
    return rows.slice(1).map(row => ({
      deployed: row[0] || '',
      type: row[1] || 'unknown',
      urlPatterns: (row[2] || '').split(',').map(s => s.trim()).filter(Boolean),
      label: row[3] || '',
      expectedImpact: row[4] || '',
      status: row[5] || '',
    }));
  } catch (err) {
    console.warn(`  Sheet read failed (falling back to markdown): ${err.message}`);
    return null;
  }
}

/**
 * Fetch pending changes from the Google Sheet.
 * Returns same shape as parsePendingChanges() in report.js:
 *   [{ label, deployed, status, isComplete }]
 * Returns null on failure (signal to fall back to markdown).
 */
async function fetchPendingChangesFromSheet() {
  const entries = await fetchChangelogFromSheet();
  if (entries === null) return null;

  return entries.map(e => ({
    label: e.label,
    deployed: e.deployed,
    status: e.status,
    isComplete: e.status.startsWith('\u2705') && /complete|done|assessed/i.test(e.status),
  }));
}

/**
 * Write weekly SEO report summary to the "Weekly SEO Report" tab.
 * Appends one row per run. Creates tab with headers if it doesn't exist.
 */
async function writeReportToSheet(analysis, inspection) {
  if (!config.trackingSheetId) {
    console.log('  No tracking_sheet_id — skipping Sheet report');
    return false;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = config.trackingSheetId;
    const TAB = 'Weekly SEO Report';

    // Check if tab exists
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const tabExists = meta.data.sheets.some(s => s.properties.title === TAB);

    if (!tabExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${TAB}'!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['Date', 'Clicks', 'Impressions', 'CTR', 'Avg Position', 'Indexed Pages', 'Wins', 'Drops']] },
      });
    }

    const date = new Date().toISOString().split('T')[0];
    const t = analysis.currentTotals || {};
    const indexed = inspection?.summary?.indexed || 'N/A';

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${TAB}'!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          date,
          String(t.clicks || 0),
          String(t.impressions || 0),
          String(t.ctr ? (t.ctr * 100).toFixed(1) + '%' : 'N/A'),
          String(t.avgPosition ? t.avgPosition.toFixed(1) : 'N/A'),
          String(indexed),
          String(analysis.wins?.length || 0),
          String(analysis.drops?.length || 0),
        ]],
      },
    });

    console.log(`  Logged to Weekly SEO Report tab: ${date}`);
    return true;
  } catch (err) {
    console.warn(`  Sheet report write failed: ${err.message}`);
    return false;
  }
}

module.exports = { fetchChangelogFromSheet, fetchPendingChangesFromSheet, writeReportToSheet };
