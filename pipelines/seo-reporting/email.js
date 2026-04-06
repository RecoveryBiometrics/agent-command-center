const TO = 'bill@reiamplifi.com';
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

async function sendReport(subject, markdownBody) {
  const token = await getOAuthToken();
  if (!token) {
    console.warn('No OAuth credentials — skipping email.');
    return false;
  }

  const raw = Buffer.from(
    `From: williamcourterwelch@gmail.com\nTo: ${TO}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${markdownBody}`
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
    console.log(`Email sent to ${TO}`);
    return true;
  } else {
    const err = await res.text();
    console.warn(`Email failed: ${res.status} ${err}`);
    return false;
  }
}

module.exports = { sendReport };
