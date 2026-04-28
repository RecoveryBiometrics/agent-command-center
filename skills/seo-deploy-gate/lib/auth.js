/**
 * Shared Google auth loader for the SEO deploy gate.
 *
 * Priority order:
 *   1. credentialsPath — file path to a service account JSON (preferred; key never enters env)
 *   2. GOOGLE_SERVICE_ACCOUNT_KEY — env var containing JSON (legacy fallback; avoid)
 *   3. Application Default Credentials — gcloud login (may lack scopes)
 */
const fs = require('fs');

function getGoogleAuth({ googleapis, credentialsPath, scopes }) {
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    return new googleapis.google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes,
    });
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    return new googleapis.google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes,
    });
  }

  return new googleapis.google.auth.GoogleAuth({ scopes });
}

module.exports = { getGoogleAuth };
