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

  const [byPage, byQuery, priorByPage, byQueryCountry] = await Promise.all([
    query(wm, current, ['page']),
    query(wm, current, ['query']),
    query(wm, prior, ['page']),
    query(wm, current, ['query', 'country']),
  ]);

  // Bucket queries by language based on country
  const COUNTRY_TO_LANG = {
    MEX: 'es', COL: 'es', ARG: 'es', ESP: 'es', CHL: 'es', PER: 'es', ECU: 'es',
    IND: 'en-IN',
    ARE: 'ar', SAU: 'ar', EGY: 'ar', QAT: 'ar', OMN: 'ar',
  };
  const queryByLang = { es: [], 'en-IN': [], ar: [] };
  for (const row of byQueryCountry) {
    const lang = COUNTRY_TO_LANG[row.keys[1]];
    if (lang && queryByLang[lang]) {
      queryByLang[lang].push({
        keys: [row.keys[0]],
        country: row.keys[1],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
    }
  }
  // Sort each bucket by impressions desc
  for (const lang of Object.keys(queryByLang)) {
    queryByLang[lang].sort((a, b) => b.impressions - a.impressions);
  }

  console.log(`  Language queries: ES:${queryByLang.es.length} IN:${queryByLang['en-IN'].length} AR:${queryByLang.ar.length}`);

  const data = {
    fetchedAt: new Date().toISOString(),
    currentPeriod: current,
    priorPeriod: prior,
    byPage,
    byQuery,
    priorByPage,
    queryByLang,
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
