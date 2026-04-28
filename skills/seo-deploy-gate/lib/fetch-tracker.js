/**
 * Fetch tracker rows from Google Sheets.
 * Uses service account credentials (same pattern as seo-content pipeline).
 * Returns normalized rows with columns: date, type, urlsAffected, whatChanged, status, rowIndex.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getGoogleAuth } = require('./auth');

async function fetchTrackerRows(spreadsheetId, range = 'A2:H200', credentialsPath = null) {
  // Try to use service account first (automated), fall back to gracefully returning empty
  const googleapis = safeRequire('googleapis');
  if (!googleapis) {
    // No googleapis available — skill runs without tracker data (rules 1, 3, 8 become PASS by default)
    return [];
  }

  try {
    const auth = getGoogleAuth({
      googleapis,
      credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = googleapis.google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    // Normalize to the tracker schema we know:
    // A=Date, B=Type, C=URLs Affected, D=What Changed, E=Expected Impact, F=Check By, G=Status, H=Notes
    return rows.map((cols, idx) => ({
      rowIndex: idx + 2, // +2 because range started at A2, sheet rows are 1-indexed
      date: cols[0] || '',
      type: cols[1] || '',
      urlsAffected: cols[2] || '',
      whatChanged: cols[3] || '',
      expectedImpact: cols[4] || '',
      checkBy: cols[5] || '',
      status: cols[6] || '',
      notes: cols[7] || '',
    })).filter(r => r.date); // drop empty rows
  } catch (e) {
    console.error('Tracker fetch failed:', e.message);
    return [];
  }
}

function safeRequire(mod) {
  try {
    return require(mod);
  } catch {
    return null;
  }
}

module.exports = { fetchTrackerRows };
