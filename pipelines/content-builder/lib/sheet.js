/**
 * Google Sheets helpers for Content Builder
 *
 * Reads Active TODOs, updates status, logs to SEO Changelog.
 */
const { google } = require('googleapis');

let _authClient = null;

async function getAuth() {
  if (_authClient) return _authClient;
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  }
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _authClient = await auth.getClient();
  return _authClient;
}

/**
 * Read Active TODOs where Status = "New"
 * Returns array of { row, area, task, priority, status, notes }
 */
async function readPendingTodos(sheetId) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "'Active TODOs'!A:E",
  });

  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const todos = [];
  for (let i = 1; i < rows.length; i++) {
    const [area, task, priority, status, notes] = rows[i];
    if ((status || '').toLowerCase().trim() === 'new') {
      todos.push({
        row: i + 1, // 1-indexed for Sheets API
        area: area || '',
        task: task || '',
        priority: priority || '',
        status: status || '',
        notes: notes || '',
      });
    }
  }

  return todos;
}

/**
 * Update a TODO row's status and notes
 */
async function updateTodoStatus(sheetId, row, newStatus, newNotes) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `'Active TODOs'!D${row}:E${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newStatus, newNotes]] },
  });
}

/**
 * Log to SEO Changelog tab
 */
async function logToChangelog(sheetId, entry) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'SEO Changelog'!A:F",
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString().split('T')[0],
        entry.page || '',
        entry.action || 'content-built',
        entry.detail || '',
        entry.source || 'content-builder',
        entry.category || '',
      ]],
    },
  });
}

module.exports = { readPendingTodos, updateTodoStatus, logToChangelog };
