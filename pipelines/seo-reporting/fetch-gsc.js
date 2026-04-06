const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SITE_URL = config.gscSiteUrl;
const DATA_DIR = config.dataDir;

function getDateRange(daysBack, length = 28) {
  const end = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - length * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

async function query(wm, dates, dimensions, rowLimit = 25000) {
  const res = await wm.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { ...dates, dimensions, rowLimit },
  });
  return res.data.rows || [];
}

async function fetchSearchConsoleData() {
  const auth = await getAuthClient();
  const wm = google.webmasters({ version: 'v3', auth });

  const current = getDateRange(1, 28);   // last 28 days
  const prior = getDateRange(29, 28);    // 28 days before that

  console.log(`Fetching current period: ${current.startDate} → ${current.endDate}`);
  console.log(`Fetching prior period:   ${prior.startDate} → ${prior.endDate}`);

  const [byPage, byQuery, priorByPage] = await Promise.all([
    query(wm, current, ['page']),
    query(wm, current, ['query']),
    query(wm, prior, ['page']),
  ]);

  const data = {
    fetchedAt: new Date().toISOString(),
    currentPeriod: current,
    priorPeriod: prior,
    byPage,
    byQuery,
    priorByPage,
  };

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const latestPath = path.join(DATA_DIR, 'latest.json');
  if (fs.existsSync(latestPath)) {
    const prev = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    const archiveName = prev.fetchedAt.split('T')[0] + '.json';
    fs.copyFileSync(latestPath, path.join(DATA_DIR, archiveName));
  }

  fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
  console.log(`Fetched ${byPage.length} pages, ${byQuery.length} queries`);
  return data;
}

module.exports = { fetchSearchConsoleData };
