const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getAuthClient } = require('./auth');
const config = require('./config');

const PROPERTY_ID = config.ga4PropertyId;
const DATA_DIR = config.dataDir;

/**
 * Fetch GA4 data for the last 28 days + prior 28 days.
 * Returns sessions, users, pageviews, engagement, top pages, and phone click events.
 */
async function fetchGA4Data() {
  const auth = await getAuthClient();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

  // Date ranges
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1); // yesterday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 27); // 28 days back
  const priorEnd = new Date(startDate);
  priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - 27);

  const fmt = d => d.toISOString().split('T')[0];

  const dateRanges = [
    { startDate: fmt(startDate), endDate: fmt(endDate) },
    { startDate: fmt(priorStart), endDate: fmt(priorEnd) },
  ];

  // 1. Overall site metrics
  const overallRes = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges,
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagedSessions' },
      ],
    },
  });

  // 2. Top pages by sessions
  const pagesRes = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [dateRanges[0]],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 25,
    },
  });

  // 3. Traffic sources
  const sourcesRes = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [dateRanges[0]],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'engagedSessions' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });

  // 4. Phone click events (tel: link clicks tracked by enhanced measurement)
  let phoneClicks = 0;
  try {
    const eventsRes = await analyticsdata.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [dateRanges[0]],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'click', matchType: 'EXACT' },
          },
        },
      },
    });
    const clickRow = eventsRes.data.rows?.find(r => r.dimensionValues[0].value === 'click');
    phoneClicks = clickRow ? parseInt(clickRow.metricValues[0].value) : 0;
  } catch (e) {
    console.warn('Could not fetch click events:', e.message);
  }

  // Parse overall metrics
  const parseRow = (row) => ({
    sessions: parseInt(row.metricValues[0].value),
    users: parseInt(row.metricValues[1].value),
    pageviews: parseInt(row.metricValues[2].value),
    avgSessionDuration: parseFloat(row.metricValues[3].value),
    bounceRate: parseFloat(row.metricValues[4].value),
    engagedSessions: parseInt(row.metricValues[5].value),
  });

  const current = overallRes.data.rows?.[0] ? parseRow(overallRes.data.rows[0]) : null;
  const prior = overallRes.data.rows?.[1] ? parseRow(overallRes.data.rows[1]) : null;

  // Parse top pages
  const topPages = (pagesRes.data.rows || []).map(row => ({
    path: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
    pageviews: parseInt(row.metricValues[1].value),
    avgDuration: parseFloat(row.metricValues[2].value),
    bounceRate: parseFloat(row.metricValues[3].value),
  }));

  // Parse sources
  const sources = (sourcesRes.data.rows || []).map(row => ({
    channel: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
    users: parseInt(row.metricValues[1].value),
    engaged: parseInt(row.metricValues[2].value),
  }));

  const data = {
    fetchedAt: new Date().toISOString(),
    propertyId: PROPERTY_ID,
    currentPeriod: { start: fmt(startDate), end: fmt(endDate) },
    priorPeriod: { start: fmt(priorStart), end: fmt(priorEnd) },
    current,
    prior,
    topPages,
    sources,
    phoneClicks,
  };

  // Save
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'ga4-latest.json'), JSON.stringify(data, null, 2));

  console.log(`GA4: ${current?.sessions ?? 0} sessions, ${current?.users ?? 0} users, ${topPages.length} pages, ${phoneClicks} click events`);

  return data;
}

module.exports = { fetchGA4Data };
