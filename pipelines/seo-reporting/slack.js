/**
 * Slack delivery for SEO reports.
 * Posts to the business's Slack channel via Bot Token (chat.postMessage API).
 * Set SLACK_BOT_TOKEN and SLACK_CHANNEL_ID in env vars.
 */

const config = require('./config');

const SLACK_CHANNEL = config.slackChannelId;

async function sendToSlack(subject, body) {
  const token = config.slackBotToken || process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('No SLACK_BOT_TOKEN set — skipping Slack delivery.');
    return false;
  }

  // Slack messages max out at 40,000 chars. Split if needed.
  const fullText = `*${subject}*\n\n${body}`;
  const chunks = [];
  for (let i = 0; i < fullText.length; i += 3900) {
    chunks.push(fullText.slice(i, i + 3900));
  }

  try {
    for (const chunk of chunks) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: SLACK_CHANNEL,
          text: chunk,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        console.warn(`Slack failed: ${data.error}`);
        return false;
      }
    }

    console.log(`Slack message sent (${chunks.length} part${chunks.length > 1 ? 's' : ''})`);
    return true;
  } catch (err) {
    console.warn(`Slack error: ${err.message}`);
    return false;
  }
}

module.exports = { sendToSlack };
