/**
 * TODO Writer — Extracts actionable items from SEO analysis and writes to
 * the business's Google Sheet "Active TODOs" tab.
 *
 * Deduplicates: reads existing tasks before appending, skips duplicates.
 * Categorizes: agent-handled vs human-required for Slack surfacing.
 */
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SHEET_TAB = 'Active TODOs';
const HEADERS = ['Area', 'Task', 'Priority', 'Status', 'Notes'];

/**
 * Determine if a task is handled by agents or requires human action.
 */
function classifyHandler(area, task) {
  const lower = (area + ' ' + task).toLowerCase();
  // Agent-handled
  if (lower.includes('content') && !lower.includes('review')) return 'agent';
  if (lower.includes('directory') && !lower.includes('review')) return 'agent';
  if (lower.includes('internal link')) return 'agent';
  if (lower.includes('article')) return 'agent';
  // Human-required
  if (lower.includes('gbp') || lower.includes('google business')) return 'human';
  if (lower.includes('review request') || lower.includes('reviews')) return 'human';
  if (lower.includes('investigate')) return 'human';
  if (lower.includes('phone') || lower.includes('call')) return 'human';
  if (lower.includes('photo')) return 'human';
  if (lower.includes('nap') || lower.includes('address')) return 'human';
  // Default: human (safer to surface than hide)
  return 'human';
}

/**
 * Extract TODOs from SEO analysis results.
 */
function extractTodos(analysis, interpretation) {
  const todos = [];
  const siteBase = config.siteBase;

  // Opportunities — pages ranking 8-20, close to page 1
  for (const opp of (analysis.opportunities || []).slice(0, 10)) {
    const slug = (opp.keys?.[0] || '').replace(siteBase, '') || '/';
    todos.push({
      area: 'SEO — Opportunity',
      task: `Optimize ${slug} — position ${opp.position?.toFixed(1)}, ${opp.impressions} impressions`,
      priority: 'High',
      status: 'New',
      notes: `Close to page 1. Better title/meta or internal links could push it up.`,
    });
  }

  // Gaps — queries with impressions but no clicks
  for (const gap of (analysis.gaps || []).slice(0, 5)) {
    const query = gap.keys?.[0] || '';
    todos.push({
      area: 'SEO — Gap',
      task: `No page for "${query}" — ${gap.impressions} impressions, position ${gap.position?.toFixed(1)}`,
      priority: 'Medium',
      status: 'New',
      notes: 'High impressions, zero clicks. Candidate for a new dedicated page.',
    });
  }

  // Language-specific gaps — queries from non-English markets with no matching page
  const LANG_NAMES = { es: 'Spanish', 'en-IN': 'India', ar: 'Arabic' };
  for (const [lang, langGaps] of Object.entries(analysis.langGaps || {})) {
    const langName = LANG_NAMES[lang] || lang;
    for (const gap of langGaps.slice(0, 5)) {
      todos.push({
        area: `SEO — Gap (${langName})`,
        task: `No page for "${gap.query}" — ${gap.impressions} impressions, position ${gap.position?.toFixed(1)}`,
        priority: 'Medium',
        status: 'New',
        notes: `${langName} market (${gap.country}). High impressions, zero clicks. Needs ${langName} page.`,
      });
    }
  }

  // Unattributed drops — need human investigation
  if (interpretation?.unattributed) {
    for (const drop of interpretation.unattributed.filter(u => u.direction === 'down').slice(0, 5)) {
      todos.push({
        area: 'SEO — Investigate',
        task: `${drop.url} dropped ${Math.abs(drop.delta).toFixed(1)} positions — no known cause`,
        priority: 'Medium',
        status: 'New',
        notes: `Was position ${drop.positionWas?.toFixed(1)}, now ${drop.positionNow?.toFixed(1)}. Could be algorithm update or competitor.`,
      });
    }
  }

  return todos;
}

/**
 * Write TODOs to the Active TODOs tab, deduplicating against existing rows.
 * Returns { added: [...], skipped: number } for Slack summary.
 */
async function writeTodosToSheet(analysis, interpretation) {
  if (!config.trackingSheetId) {
    console.log('  No tracking_sheet_id — skipping TODO write');
    return { added: [], skipped: 0 };
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
      console.log(`  Created "${SHEET_TAB}" tab with headers`);
    }

    // Read existing tasks for dedup
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_TAB}'!B:D`,
    });
    const existingTasks = (existing.data.values || []).slice(1).map(row => ({
      task: (row[0] || '').toLowerCase().trim(),
      status: (row[2] || '').toLowerCase().trim(),
    }));

    // Extract and dedup
    const todos = extractTodos(analysis, interpretation);
    const newTodos = [];
    let skipped = 0;

    for (const todo of todos) {
      const taskLower = todo.task.toLowerCase().trim();
      const isDuplicate = existingTasks.some(e =>
        e.task === taskLower || (e.status !== 'done' && taskLower.includes(e.task.split(' — ')[0]))
      );
      if (!isDuplicate) {
        newTodos.push(todo);
      } else {
        skipped++;
      }
    }

    if (newTodos.length === 0) {
      console.log(`  No new TODOs to add (${skipped} already exist)`);
      return { added: [], skipped };
    }

    // Append
    const rows = newTodos.map(t => [t.area, t.task, t.priority, t.status, t.notes]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_TAB}'!A:E`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    console.log(`  Added ${newTodos.length} TODOs to Sheet (${skipped} duplicates skipped)`);

    // Classify for Slack
    const added = newTodos.map(t => ({
      ...t,
      handledBy: classifyHandler(t.area, t.task),
    }));

    return { added, skipped };
  } catch (err) {
    console.warn(`  TODO write failed (non-fatal): ${err.message}`);
    return { added: [], skipped: 0 };
  }
}

/**
 * Format TODO results as a Slack action items message.
 */
function formatTodosForSlack(todoResult) {
  const { added, skipped } = todoResult;
  if (added.length === 0) return null;

  const humanItems = added.filter(t => t.handledBy === 'human');
  const agentItems = added.filter(t => t.handledBy === 'agent');

  let msg = '';

  if (humanItems.length > 0) {
    msg += `*ACTION ITEMS FOR YOU (${humanItems.length} this week)*\n\n`;
    for (const item of humanItems) {
      const icon = item.priority === 'High' ? '🔴' : '🟡';
      msg += `${icon} *${item.priority.toUpperCase()}:* ${item.task}\n   → ${item.notes}\n\n`;
    }
  }

  if (agentItems.length > 0) {
    msg += `✅ ${agentItems.length} item${agentItems.length > 1 ? 's' : ''} auto-handled by agents (no action needed)\n`;
  }

  if (skipped > 0) {
    msg += `_${skipped} existing items unchanged_\n`;
  }

  return msg;
}

module.exports = { writeTodosToSheet, formatTodosForSlack };
