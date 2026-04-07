/**
 * Trend Detector — Compares current vs prior periods and flags anomalies.
 *
 * Detects: traffic changes, channel shifts, bounce rate spikes,
 * new top pages, geographic shifts, conversion changes.
 */
const config = require('./config');

function pctChange(current, prior) {
  if (!prior || prior === 0) return current > 0 ? 100 : 0;
  return ((current - prior) / prior) * 100;
}

function detectTrends(snapshot) {
  const { overview, channels, landingPages, geo, conversions, devices, newVsReturning } = snapshot;
  const thresholds = config.alertThresholds;
  const trends = [];
  const anomalies = [];

  // 1. Overall traffic change
  if (overview.current && overview.prior) {
    const sessionChange = pctChange(overview.current.sessions, overview.prior.sessions);
    const userChange = pctChange(overview.current.users, overview.prior.users);
    const bounceChange = overview.current.bounceRate - overview.prior.bounceRate;

    trends.push({
      metric: 'sessions',
      current: overview.current.sessions,
      prior: overview.prior.sessions,
      changePct: Math.round(sessionChange * 10) / 10,
      direction: sessionChange > 0 ? 'up' : 'down',
      significant: Math.abs(sessionChange) > 15,
    });

    trends.push({
      metric: 'users',
      current: overview.current.users,
      prior: overview.prior.users,
      changePct: Math.round(userChange * 10) / 10,
      direction: userChange > 0 ? 'up' : 'down',
      significant: Math.abs(userChange) > 15,
    });

    trends.push({
      metric: 'bounceRate',
      current: Math.round(overview.current.bounceRate * 1000) / 10,
      prior: Math.round(overview.prior.bounceRate * 1000) / 10,
      changePct: Math.round(bounceChange * 1000) / 10,
      direction: bounceChange > 0 ? 'up' : 'down',
      significant: Math.abs(bounceChange * 100) > 5,
    });

    // Anomaly: traffic drop
    if (sessionChange < -thresholds.trafficDropPct) {
      anomalies.push({
        type: 'traffic_drop',
        severity: 'warning',
        message: `Sessions dropped ${Math.abs(Math.round(sessionChange))}% (${overview.prior.sessions} → ${overview.current.sessions})`,
        changePct: sessionChange,
      });
    }

    // Anomaly: traffic spike (could be bot)
    if (sessionChange > thresholds.trafficSpikePct) {
      anomalies.push({
        type: 'traffic_spike',
        severity: 'warning',
        message: `Sessions spiked ${Math.round(sessionChange)}% (${overview.prior.sessions} → ${overview.current.sessions}). Check for bot traffic.`,
        changePct: sessionChange,
      });
    }

    // Anomaly: bounce rate ceiling
    if (overview.current.bounceRate * 100 > thresholds.bounceRateCeiling) {
      anomalies.push({
        type: 'high_bounce',
        severity: 'warning',
        message: `Bounce rate at ${Math.round(overview.current.bounceRate * 100)}% — above ${thresholds.bounceRateCeiling}% threshold`,
        value: overview.current.bounceRate,
      });
    }
  }

  // 2. Conversion event changes
  for (const [eventName, data] of Object.entries(conversions)) {
    const change = pctChange(data.current, data.prior);
    trends.push({
      metric: `conversion:${eventName}`,
      current: data.current,
      prior: data.prior,
      changePct: Math.round(change * 10) / 10,
      direction: change > 0 ? 'up' : 'down',
      significant: Math.abs(change) > 15,
    });

    if (change < -30 && data.prior >= 5) {
      anomalies.push({
        type: 'conversion_drop',
        severity: 'critical',
        message: `Conversion event "${eventName}" dropped ${Math.abs(Math.round(change))}% (${data.prior} → ${data.current})`,
        changePct: change,
      });
    }
  }

  // 3. Channel shifts — compare to prior snapshot if available
  const channelTrends = channels.map(ch => {
    const priorCh = config.priorSnapshot?.channels?.find(c => c.channel === ch.channel);
    const change = priorCh ? pctChange(ch.sessions, priorCh.sessions) : null;
    return {
      channel: ch.channel,
      sessions: ch.sessions,
      priorSessions: priorCh?.sessions || null,
      changePct: change !== null ? Math.round(change * 10) / 10 : null,
      significant: change !== null && Math.abs(change) > 20,
    };
  });

  // 4. Geo analysis — service area coverage
  let serviceAreaCoverage = null;
  if (config.serviceAreaStates.length > 0) {
    const totalSessions = geo.reduce((sum, g) => sum + g.sessions, 0);
    const serviceAreaSessions = geo
      .filter(g => config.serviceAreaStates.some(state => g.region.includes(state)))
      .reduce((sum, g) => sum + g.sessions, 0);
    serviceAreaCoverage = {
      totalSessions,
      serviceAreaSessions,
      coveragePct: totalSessions > 0 ? Math.round((serviceAreaSessions / totalSessions) * 100) : 0,
      states: config.serviceAreaStates,
    };
  }

  // 5. New pages appearing in top landing pages (vs prior snapshot)
  let newTopPages = [];
  if (config.priorSnapshot?.landingPages) {
    const priorPageSet = new Set(config.priorSnapshot.landingPages.map(p => p.page));
    newTopPages = landingPages
      .filter(p => !priorPageSet.has(p.page))
      .slice(0, 5);
  }

  // 6. Bot traffic check on daily data
  let botSuspect = false;
  if (snapshot.daily) {
    const dailySessions = snapshot.daily.map(d => d.sessions).filter(s => s > 0);
    if (dailySessions.length > 2) {
      const avg = dailySessions.reduce((a, b) => a + b, 0) / dailySessions.length;
      const max = Math.max(...dailySessions);
      if (max > avg * 3 && overview.current?.bounceRate > 0.85) {
        botSuspect = true;
        anomalies.push({
          type: 'bot_suspect',
          severity: 'warning',
          message: `Possible bot traffic: daily spike of ${max} sessions (avg ${Math.round(avg)}) with ${Math.round(overview.current.bounceRate * 100)}% bounce rate`,
        });
      }
    }
  }

  return {
    trends,
    anomalies,
    channelTrends,
    serviceAreaCoverage,
    newTopPages,
    botSuspect,
  };
}

module.exports = { detectTrends };
