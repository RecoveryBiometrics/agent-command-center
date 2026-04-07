/**
 * GA4 Collector — Fetches ALL analytics data for a business.
 *
 * Collects: traffic overview, channels, landing pages, events, devices,
 * geo, new/returning, page-to-event paths. Saves dated snapshot + latest.
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getAuthClient } = require('./auth');
const config = require('./config');

const PROPERTY_ID = config.ga4PropertyId;

function dateRange28Days() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 27);
  const priorEnd = new Date(start);
  priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - 27);
  const fmt = d => d.toISOString().split('T')[0];
  return {
    current: { startDate: fmt(start), endDate: fmt(end) },
    prior: { startDate: fmt(priorStart), endDate: fmt(priorEnd) },
  };
}

function parseRows(res, dimCount) {
  return (res.data.rows || []).map(row => {
    const dims = row.dimensionValues?.map(d => d.value) || [];
    const mets = row.metricValues?.map(m => m.value) || [];
    return { dims, mets };
  });
}

async function collect() {
  const auth = await getAuthClient();
  const api = google.analyticsdata({ version: 'v1beta', auth });
  const prop = `properties/${PROPERTY_ID}`;
  const { current, prior } = dateRange28Days();
  const dateRanges = [current, prior];

  console.log(`  Collecting GA4 data for property ${PROPERTY_ID}`);
  console.log(`  Current: ${current.startDate} → ${current.endDate}`);
  console.log(`  Prior:   ${prior.startDate} → ${prior.endDate}`);

  // Helper to run a report
  async function query(dimensions, metrics, opts = {}) {
    const requestBody = {
      dateRanges: opts.bothPeriods ? dateRanges : [current],
      dimensions: dimensions.map(name => ({ name })),
      metrics: metrics.map(name => ({ name })),
    };
    if (opts.limit) requestBody.limit = opts.limit;
    if (opts.orderBy) {
      requestBody.orderBys = [{ metric: { metricName: opts.orderBy }, desc: true }];
    }
    if (opts.dimensionFilter) requestBody.dimensionFilter = opts.dimensionFilter;
    return api.properties.runReport({ property: prop, requestBody });
  }

  // 1. Overall site metrics (current + prior)
  const overallRes = await query(
    [],
    ['sessions', 'totalUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate', 'engagedSessions'],
    { bothPeriods: true }
  );
  const parseOverall = (row) => row ? {
    sessions: parseInt(row.metricValues[0].value),
    users: parseInt(row.metricValues[1].value),
    newUsers: parseInt(row.metricValues[2].value),
    pageviews: parseInt(row.metricValues[3].value),
    avgSessionDuration: parseFloat(row.metricValues[4].value),
    bounceRate: parseFloat(row.metricValues[5].value),
    engagedSessions: parseInt(row.metricValues[6].value),
  } : null;

  const currentOverall = parseOverall(overallRes.data.rows?.[0]);
  const priorOverall = parseOverall(overallRes.data.rows?.[1]);

  // 2. Traffic by channel
  const channelRes = await query(
    ['sessionDefaultChannelGroup'],
    ['sessions', 'totalUsers', 'engagedSessions', 'bounceRate', 'conversions'],
    { orderBy: 'sessions', limit: 15 }
  );
  const channels = parseRows(channelRes).map(r => ({
    channel: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
    engaged: parseInt(r.mets[2]),
    bounceRate: parseFloat(r.mets[3]),
    conversions: parseInt(r.mets[4]),
  }));

  // 3. Top landing pages
  const pagesRes = await query(
    ['landingPage'],
    ['sessions', 'totalUsers', 'bounceRate', 'averageSessionDuration', 'conversions'],
    { orderBy: 'sessions', limit: 30 }
  );
  const landingPages = parseRows(pagesRes).map(r => ({
    page: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
    bounceRate: parseFloat(r.mets[2]),
    avgDuration: parseFloat(r.mets[3]),
    conversions: parseInt(r.mets[4]),
  }));

  // 4. All events
  const eventsRes = await query(
    ['eventName'],
    ['eventCount'],
    { orderBy: 'eventCount', limit: 30 }
  );
  const events = parseRows(eventsRes).map(r => ({
    event: r.dims[0],
    count: parseInt(r.mets[0]),
  }));

  // 5. Conversion events (from YAML config)
  const conversionData = {};
  for (const eventName of config.conversionEvents) {
    try {
      const convRes = await query(
        ['eventName'],
        ['eventCount'],
        {
          bothPeriods: true,
          dimensionFilter: {
            filter: { fieldName: 'eventName', stringFilter: { value: eventName, matchType: 'EXACT' } },
          },
        }
      );
      const currentCount = parseInt(convRes.data.rows?.[0]?.metricValues?.[0]?.value || '0');
      const priorCount = parseInt(convRes.data.rows?.[1]?.metricValues?.[0]?.value || '0');
      conversionData[eventName] = { current: currentCount, prior: priorCount };
    } catch (e) {
      console.warn(`  Could not fetch conversion event "${eventName}": ${e.message}`);
    }
  }

  // 6. Device breakdown
  const deviceRes = await query(
    ['deviceCategory'],
    ['sessions', 'totalUsers', 'bounceRate'],
    { orderBy: 'sessions' }
  );
  const devices = parseRows(deviceRes).map(r => ({
    device: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
    bounceRate: parseFloat(r.mets[2]),
  }));

  // 7. Geographic breakdown (region/state level)
  const geoRes = await query(
    ['region'],
    ['sessions', 'totalUsers'],
    { orderBy: 'sessions', limit: 25 }
  );
  const geo = parseRows(geoRes).map(r => ({
    region: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
  }));

  // 8. New vs returning
  const nvrRes = await query(
    ['newVsReturning'],
    ['sessions', 'totalUsers', 'engagedSessions'],
    { orderBy: 'sessions' }
  );
  const newVsReturning = parseRows(nvrRes).map(r => ({
    type: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
    engaged: parseInt(r.mets[2]),
  }));

  // 9. Daily sessions (for trend line)
  const dailyRes = await query(
    ['date'],
    ['sessions', 'totalUsers'],
    { bothPeriods: true }
  );
  const daily = parseRows(dailyRes).map(r => ({
    date: r.dims[0],
    sessions: parseInt(r.mets[0]),
    users: parseInt(r.mets[1]),
  }));

  // Build snapshot
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    businessId: config.businessId,
    businessName: config.businessName,
    propertyId: PROPERTY_ID,
    periods: { current, prior },
    overview: { current: currentOverall, prior: priorOverall },
    channels,
    landingPages,
    events,
    conversions: conversionData,
    devices,
    geo,
    newVsReturning,
    daily,
  };

  // Save dated snapshot + latest
  const dateStr = new Date().toISOString().split('T')[0];
  const snapshotPath = path.join(config.stateDir, `analytics-${dateStr}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(config.latestPath, JSON.stringify(snapshot, null, 2));

  console.log(`  Saved snapshot: ${snapshotPath}`);
  console.log(`  Sessions: ${currentOverall?.sessions ?? 0} (prior: ${priorOverall?.sessions ?? 0})`);
  console.log(`  Users: ${currentOverall?.users ?? 0} | Pages: ${landingPages.length} | Events: ${events.length}`);
  console.log(`  Channels: ${channels.map(c => `${c.channel}:${c.sessions}`).join(', ')}`);

  return snapshot;
}

module.exports = { collect };
