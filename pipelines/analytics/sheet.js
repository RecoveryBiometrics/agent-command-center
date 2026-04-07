/**
 * Sheet Logger — Appends analytics row to the business's Google Sheet.
 *
 * Creates an "Analytics" tab if it doesn't exist, then appends one row per run.
 * Columns: Date, Period, Sessions, Users, Conversions, Top Insight, Recommendations, Actions Dispatched, Confidence
 */
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SHEET_TAB = 'Analytics';

async function logToSheet(snapshot, checkedInsights, recommendations, suggestions, dispatched) {
  if (!config.trackingSheetId) {
    console.log('  No tracking_sheet_id in business YAML — skipping Sheet log');
    return false;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = config.trackingSheetId;

    // Check if Analytics tab exists
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const tabExists = sheetMeta.data.sheets.some(s => s.properties.title === SHEET_TAB);

    if (!tabExists) {
      // Create the tab with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_TAB } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TAB}!A1:I1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Date', 'Period', 'Sessions', 'Users', 'Conversions', 'Top Insight', 'Recommendations', 'Actions Dispatched', 'Confidence']],
        },
      });
      console.log(`  Created "${SHEET_TAB}" tab with headers`);
    }

    // Build row data
    const date = new Date().toISOString().split('T')[0];
    const period = `${snapshot.periods.current.startDate} – ${snapshot.periods.current.endDate}`;

    const overview = snapshot.overview.current;
    const sessionStr = overview ? `${overview.sessions}` : 'N/A';
    const userStr = overview ? `${overview.users}` : 'N/A';

    // Conversion summary
    const convParts = Object.entries(snapshot.conversions)
      .map(([name, data]) => `${name}: ${data.current}`)
      .filter(Boolean);
    const convStr = convParts.length > 0 ? convParts.join(', ') : 'N/A';

    // Top insight (first high-confidence)
    const topInsight = checkedInsights.find(i => i.confidence === 'high');
    const insightStr = topInsight ? topInsight.message : (checkedInsights[0]?.message || 'No insights');

    // Recommendations summary
    const recStr = recommendations.map(r => r.what).join('; ') || 'None';

    // Dispatched actions
    const dispatchStr = dispatched.map(d => `→ ${d.target} (${d.instructions} instruction${d.instructions !== 1 ? 's' : ''})`).join('; ') || 'None';

    // Overall confidence
    const highCount = checkedInsights.filter(i => i.confidence === 'high').length;
    const totalCount = checkedInsights.length;
    const confidenceStr = totalCount > 0 ? `${highCount}/${totalCount} high` : 'N/A';

    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:I`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[date, period, sessionStr, userStr, convStr, insightStr, recStr, dispatchStr, confidenceStr]],
      },
    });

    console.log(`  Logged to Sheet: ${date} | ${sessionStr} sessions | ${dispatched.length} dispatches`);
    return true;
  } catch (err) {
    console.warn(`  Sheet logging failed: ${err.message}`);
    return false;
  }
}

module.exports = { logToSheet };
