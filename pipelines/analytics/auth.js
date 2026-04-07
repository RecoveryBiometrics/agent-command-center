const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
];

async function getAuthClient() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not set. Set it in .env or as a GitHub Actions secret.'
    );
  }
  const credentials = JSON.parse(key);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
  return auth.getClient();
}

module.exports = { getAuthClient };
