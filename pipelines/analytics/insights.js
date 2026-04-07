/**
 * Insight Generator — Translates analytics data into plain-English insights.
 *
 * Reads business niche from config to frame insights appropriately.
 * Outputs structured insights with category, message, data backing, and confidence.
 */
const config = require('./config');

function generateInsights(snapshot, trendData) {
  const insights = [];
  const { overview, channels, landingPages, conversions, geo, devices, newVsReturning } = snapshot;
  const { trends, anomalies, channelTrends, serviceAreaCoverage, newTopPages, botSuspect } = trendData;

  if (botSuspect) {
    insights.push({
      category: 'data_quality',
      message: 'Possible bot traffic detected — session spike with very high bounce rate. Treat traffic numbers with caution this period.',
      confidence: 'low',
      data: anomalies.find(a => a.type === 'bot_suspect'),
    });
  }

  // Traffic trend insight
  const sessionTrend = trends.find(t => t.metric === 'sessions');
  if (sessionTrend && overview.current) {
    if (sessionTrend.significant) {
      const dir = sessionTrend.direction === 'up' ? 'grew' : 'dropped';
      insights.push({
        category: 'traffic',
        message: `Overall traffic ${dir} ${Math.abs(sessionTrend.changePct)}% — from ${sessionTrend.prior} to ${sessionTrend.current} sessions.`,
        confidence: botSuspect ? 'low' : 'high',
        data: sessionTrend,
      });
    } else {
      insights.push({
        category: 'traffic',
        message: `Traffic is stable at ${overview.current.sessions} sessions (${sessionTrend.changePct > 0 ? '+' : ''}${sessionTrend.changePct}% vs prior period).`,
        confidence: 'high',
        data: sessionTrend,
      });
    }
  }

  // Channel insights — find biggest mover
  const significantChannels = channelTrends.filter(c => c.significant && c.changePct !== null);
  if (significantChannels.length > 0) {
    const sorted = significantChannels.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
    const top = sorted[0];
    const dir = top.changePct > 0 ? 'up' : 'down';
    insights.push({
      category: 'channels',
      message: `${top.channel} traffic is ${dir} ${Math.abs(top.changePct)}% (${top.priorSessions} → ${top.sessions} sessions). ${top.channel === 'Organic Search' && dir === 'up' ? 'SEO efforts are paying off.' : ''}`,
      confidence: 'high',
      data: top,
    });
  }

  // Organic search share
  const organicChannel = channels.find(c => c.channel === 'Organic Search');
  const totalSessions = channels.reduce((sum, c) => sum + c.sessions, 0);
  if (organicChannel && totalSessions > 0) {
    const organicPct = Math.round((organicChannel.sessions / totalSessions) * 100);
    insights.push({
      category: 'channels',
      message: `Organic Search accounts for ${organicPct}% of all traffic (${organicChannel.sessions} of ${totalSessions} sessions).`,
      confidence: 'high',
      data: { organicPct, organicSessions: organicChannel.sessions, totalSessions },
    });
  }

  // Conversion insights
  for (const [eventName, data] of Object.entries(conversions)) {
    const change = data.prior > 0 ? Math.round(((data.current - data.prior) / data.prior) * 100) : null;
    if (data.current > 0 || data.prior > 0) {
      const changeStr = change !== null ? ` (${change > 0 ? '+' : ''}${change}% vs prior)` : '';
      insights.push({
        category: 'conversions',
        message: `"${eventName}" events: ${data.current} this period${changeStr}.`,
        confidence: data.current >= 5 ? 'high' : 'medium',
        data,
      });
    }
  }

  // Landing page insights — top converter
  const pagesWithConversions = landingPages.filter(p => p.conversions > 0);
  if (pagesWithConversions.length > 0) {
    const topConverter = pagesWithConversions.sort((a, b) => b.conversions - a.conversions)[0];
    insights.push({
      category: 'content',
      message: `Top converting page: ${topConverter.page} — ${topConverter.conversions} conversions from ${topConverter.sessions} sessions.`,
      confidence: topConverter.sessions >= 10 ? 'high' : 'medium',
      data: topConverter,
    });
  }

  // High-traffic low-engagement pages
  const highBouncePages = landingPages
    .filter(p => p.sessions >= 10 && p.bounceRate > 0.8)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 3);
  if (highBouncePages.length > 0) {
    insights.push({
      category: 'content',
      message: `${highBouncePages.length} high-traffic pages have bounce rates above 80%: ${highBouncePages.map(p => p.page).join(', ')}. These get visitors but don't engage them.`,
      confidence: 'high',
      data: highBouncePages,
    });
  }

  // Service area coverage (local service businesses)
  if (serviceAreaCoverage && serviceAreaCoverage.coveragePct > 0) {
    insights.push({
      category: 'geo',
      message: `${serviceAreaCoverage.coveragePct}% of traffic comes from service area states (${serviceAreaCoverage.states.join(', ')}). ${serviceAreaCoverage.coveragePct < 50 ? 'Most traffic is from outside the service area — content may need better geo-targeting.' : 'Good service area coverage.'}`,
      confidence: 'high',
      data: serviceAreaCoverage,
    });
  }

  // Geo concentration
  if (geo.length > 0) {
    const topRegion = geo[0];
    const topRegionPct = totalSessions > 0 ? Math.round((topRegion.sessions / totalSessions) * 100) : 0;
    if (topRegionPct > 30) {
      insights.push({
        category: 'geo',
        message: `${topRegion.region} dominates traffic at ${topRegionPct}% (${topRegion.sessions} sessions). Consider expanding content to other regions.`,
        confidence: 'medium',
        data: topRegion,
      });
    }
  }

  // Device insight
  const mobileDevice = devices.find(d => d.device === 'mobile');
  const desktopDevice = devices.find(d => d.device === 'desktop');
  if (mobileDevice && desktopDevice) {
    const mobileShare = Math.round((mobileDevice.sessions / (mobileDevice.sessions + desktopDevice.sessions)) * 100);
    if (mobileShare > 60) {
      insights.push({
        category: 'devices',
        message: `${mobileShare}% of traffic is mobile. Make sure pages load fast and CTAs are thumb-friendly.`,
        confidence: 'high',
        data: { mobileShare, mobileSessions: mobileDevice.sessions, desktopSessions: desktopDevice.sessions },
      });
    }
  }

  // New vs returning
  const newVisitors = newVsReturning.find(n => n.type === 'new');
  const returning = newVsReturning.find(n => n.type === 'returning');
  if (newVisitors && returning) {
    const newPct = Math.round((newVisitors.sessions / (newVisitors.sessions + returning.sessions)) * 100);
    if (newPct > 85) {
      insights.push({
        category: 'audience',
        message: `${newPct}% of sessions are new visitors. The audience is growing but few return. Consider email capture or retargeting.`,
        confidence: 'medium',
        data: { newPct },
      });
    }
  }

  // New pages appearing in top 30
  if (newTopPages.length > 0) {
    insights.push({
      category: 'content',
      message: `${newTopPages.length} new pages entered the top landing pages: ${newTopPages.map(p => p.page).join(', ')}. New content is gaining traction.`,
      confidence: 'high',
      data: newTopPages,
    });
  }

  // Anomaly insights
  for (const anomaly of anomalies) {
    if (anomaly.type !== 'bot_suspect') {
      insights.push({
        category: 'anomaly',
        message: anomaly.message,
        confidence: 'medium',
        data: anomaly,
      });
    }
  }

  console.log(`  Generated ${insights.length} insights (${insights.filter(i => i.confidence === 'high').length} high, ${insights.filter(i => i.confidence === 'medium').length} medium, ${insights.filter(i => i.confidence === 'low').length} low)`);

  return insights;
}

module.exports = { generateInsights };
