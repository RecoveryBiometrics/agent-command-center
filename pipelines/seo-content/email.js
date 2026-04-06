/**
 * Email notification for the content pipeline.
 * Uses Gmail API with OAuth refresh token.
 */
const config = require('./config');

const TO = config.EMAIL_TO;
const QUOTA_PROJECT = 'gen-lang-client-0592529269';

async function getOAuthToken() {
  const credsJson = process.env.GOOGLE_OAUTH_CREDENTIALS;
  if (!credsJson) return null;

  const creds = JSON.parse(credsJson);
  const params = new URLSearchParams({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: creds.refresh_token,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  return data.access_token || null;
}

async function sendPipelineEmail(results, failures) {
  const token = await getOAuthToken();
  if (!token) {
    console.warn('No OAuth credentials — skipping pipeline email.');
    return false;
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const totalDeployed = results.reduce((sum, r) => sum + (r.deployed || 0), 0);
  const businessName = config.BUSINESS_NAME;

  let body = `${businessName} Content Pipeline — ${date}\n\n`;
  body += `Cities processed: ${results.length + failures.length}\n`;
  body += `Articles deployed: ${totalDeployed}\n`;
  body += `Failures: ${failures.length}\n\n`;

  if (results.length > 0) {
    body += `--- DEPLOYED ---\n\n`;
    for (const r of results) {
      if (r.deployed > 0) {
        body += `${r.city}, ${r.state}: ${r.deployed} new articles\n`;
        body += `  Preview: ${r.url}\n`;
        for (const a of r.articles || []) {
          body += `  - ${a.title}\n`;
        }
        body += '\n';
      } else if (r.reason) {
        body += `${r.city}: skipped — ${r.reason}\n`;
      }
    }
  }

  if (failures.length > 0) {
    body += `--- FAILURES ---\n\n`;
    body += failures.join(', ') + '\n';
  }

  const subject = `${businessName} Pipeline: ${totalDeployed} articles deployed${failures.length > 0 ? ` (${failures.length} failures)` : ''}`;

  const raw = Buffer.from(
    `From: williamcourterwelch@gmail.com\nTo: ${TO}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`
  ).toString('base64url');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': QUOTA_PROJECT,
    },
    body: JSON.stringify({ raw }),
  });

  if (res.ok) {
    console.log(`Pipeline email sent to ${TO}`);
    return true;
  } else {
    console.warn(`Pipeline email failed: ${res.status}`);
    return false;
  }
}

module.exports = { sendPipelineEmail };
