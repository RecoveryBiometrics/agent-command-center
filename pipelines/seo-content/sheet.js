/**
 * Sheet Logger — Appends content changes to the business's Google Sheet.
 *
 * Creates an "SEO Changelog" tab if it doesn't exist, then appends one row
 * per city batch so the SEO reporting pipeline can read what changed.
 */
const { google } = require('googleapis');
const config = require('./config');

const SHEET_TAB = 'SEO Changelog';
// Column order matches existing Sheet: Date | Type | URLs Affected | What Changed | Expected Impact | Check By
const HEADERS = ['Date', 'Type', 'URLs Affected', 'What Changed', 'Expected Impact', 'Check By'];

async function getAuthClient() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set.');
  }
  const credentials = JSON.parse(key);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

async function logChangeToSheet({ city, state, count, url }) {
  if (!config.TRACKING_SHEET_ID) {
    console.log('  No tracking_sheet_id in business YAML — skipping Sheet log');
    return false;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = config.TRACKING_SHEET_ID;

    // Check if SEO Changelog tab exists
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const tabExists = sheetMeta.data.sheets.some(s => s.properties.title === SHEET_TAB);

    if (!tabExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_TAB } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_TAB}'!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS] },
      });
      console.log(`  Created "${SHEET_TAB}" tab with headers`);
    }

    const date = new Date().toISOString().split('T')[0];
    const row = [
      date,
      'new content',
      url,
      `Added ${count} articles for ${city}, ${state}`,
      'New local content — impressions growth expected in 4-8 weeks',
      'Pending',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_TAB}'!A:F`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    console.log(`  Logged to Sheet: ${date} | ${count} articles for ${city}, ${state}`);
    return true;
  } catch (err) {
    console.warn(`  Sheet logging failed (non-fatal): ${err.message}`);
    return false;
  }
}

module.exports = { logChangeToSheet };
