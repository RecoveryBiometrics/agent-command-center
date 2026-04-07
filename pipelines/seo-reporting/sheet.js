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

module.exports = { fetchChangelogFromSheet, fetchPendingChangesFromSheet };
