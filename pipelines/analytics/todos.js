/**
 * TODO Writer — Writes analytics suggestions and dispatch log to
 * the business's Google Sheet "Active TODOs" tab.
 *
 * Suggestions (MEDIUM confidence) → human-visible TODOs
 * Dispatched items → informational "Auto-handled" entries
 */
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SHEET_TAB = 'Active TODOs';
const HEADERS = ['Area', 'Task', 'Priority', 'Status', 'Notes'];

async function writeSuggestionsAsTodos(suggestions, dispatched) {
  if (!config.trackingSheetId) {
    console.log('  No tracking_sheet_id — skipping TODO write');
    return 0;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = config.trackingSheetId;

    // Ensure tab exists
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
        range: `'${SHEET_TAB}'!A1:E1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS] },
      });
    }

    // Read existing tasks for dedup
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_TAB}'!B:B`,
    });
    const existingTasks = new Set(
      (existing.data.values || []).slice(1).map(row => (row[0] || '').toLowerCase().trim())
    );

    const rows = [];

    // Suggestions → human TODOs
    for (const sug of suggestions) {
      const task = sug.what;
      if (existingTasks.has(task.toLowerCase().trim())) continue;
      rows.push([
        'Analytics',
        task,
        'Medium',
        'New',
        sug.why || '',
      ]);
    }

    // Dispatched → informational entries
    for (const d of dispatched) {
      const task = `Dispatched to ${d.target}: ${d.instructions} instruction${d.instructions !== 1 ? 's' : ''}`;
      if (existingTasks.has(task.toLowerCase().trim())) continue;
      rows.push([
        'Analytics — Dispatched',
        task,
        'Info',
        'Auto-handled',
        `Agents will execute on next ${d.target} run`,
      ]);
    }

    if (rows.length === 0) {
      console.log('  No new TODOs from analytics');
      return 0;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_TAB}'!A:E`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    console.log(`  Added ${rows.length} TODOs to Sheet`);
    return rows.length;
  } catch (err) {
    console.warn(`  TODO write failed (non-fatal): ${err.message}`);
    return 0;
  }
}

module.exports = { writeSuggestionsAsTodos };
