/**
 * Slack Reporter — Posts analytics summary to business + CEO channels.
 *
 * Format: short summary + link to Sheet. Anomalies included when detected.
 */
const config = require('./config');

async function postToSlack(snapshot, checkedInsights, recommendations, suggestions, dispatched, todosAdded = 0) {
  const token = config.slackBotToken || process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('  No SLACK_BOT_TOKEN — skipping Slack');
    return false;
  }

  const date = new Date().toISOString().split('T')[0];
  const overview = snapshot.overview.current;
  const priorOverview = snapshot.overview.prior;

  // Build KPI line
  let kpiLine = '';
  if (overview && priorOverview) {
    const sessionChange = priorOverview.sessions > 0
      ? Math.round(((overview.sessions - priorOverview.sessions) / priorOverview.sessions) * 100)
      : 0;
    kpiLine = `Sessions: ${overview.sessions.toLocaleString()} (${sessionChange > 0 ? '+' : ''}${sessionChange}% WoW)`;

    // Add primary conversion if available
    const convEntries = Object.entries(snapshot.conversions);
    if (convEntries.length > 0) {
      const [name, data] = convEntries[0];
      const convChange = data.prior > 0 ? Math.round(((data.current - data.prior) / data.prior) * 100) : 0;
      kpiLine += ` | ${name}: ${data.current} (${convChange > 0 ? '+' : ''}${convChange}%)`;
    }
  }

  // Top insight
  const topInsight = checkedInsights.find(i => i.confidence === 'high') || checkedInsights[0];
  const insightLine = topInsight ? topInsight.message : 'No significant insights this period.';

  // Actions taken
  let actionsBlock = '';
  if (dispatched.length > 0) {
    const lines = dispatched.map(d => `• → ${d.target}: ${d.instructions} instruction${d.instructions !== 1 ? 's' : ''}`);
    actionsBlock = `\n*Actions taken:*\n${lines.join('\n')}`;
  }

  // Recommendations not dispatched (suggestions)
  let suggestionsBlock = '';
  if (suggestions.length > 0) {
    const lines = suggestions.slice(0, 3).map(s => `• ${s.what}`);
    suggestionsBlock = `\n*Suggestions (review in Sheet):*\n${lines.join('\n')}`;
  }

  // Anomalies
  let anomalyBlock = '';
  const anomalies = checkedInsights.filter(i => i.category === 'anomaly');
  if (anomalies.length > 0) {
    anomalyBlock = `\n⚠️ *Anomalies:*\n${anomalies.map(a => `• ${a.message}`).join('\n')}`;
  }

  // Sheet link
  const sheetLink = config.trackingSheetId
    ? `\n<https://docs.google.com/spreadsheets/d/${config.trackingSheetId}|Full report in Sheet>`
    : '';

  const todoBlock = todosAdded > 0 ? `\n📋 ${todosAdded} item${todosAdded !== 1 ? 's' : ''} added to Active TODOs tab` : '';

  const message = `📊 *${config.businessName} Analytics — ${date}*\n\n${kpiLine}\n*Top insight:* ${insightLine}${actionsBlock}${suggestionsBlock}${anomalyBlock}${todoBlock}${sheetLink}`;

  // Post to business channel
  const channels = [config.slackChannelId, config.slackCeoChannel].filter(Boolean);
  let success = false;

  for (const channel of channels) {
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, text: message }),
      });
      const data = await res.json();
      if (data.ok) {
        console.log(`  Posted to Slack channel ${channel}`);
        success = true;
      } else {
        console.warn(`  Slack failed for ${channel}: ${data.error}`);
      }
    } catch (err) {
      console.warn(`  Slack error for ${channel}: ${err.message}`);
    }
  }

  return success;
}

module.exports = { postToSlack };
