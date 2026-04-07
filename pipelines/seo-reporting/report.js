const fs = require('fs');
const path = require('path');
const config = require('./config');
const { fetchPendingChangesFromSheet } = require('./sheet');

const REPORTS_DIR = config.reportsDir;
const BASELINE = config.baseline;
const CHANGELOG_PATH = config.changelogPath;

/**
 * Parse SEO-CHANGELOG.md to extract deployed changes and their status.
 * Each entry starts with ### YYYY-MM-DD — Title and has **Status:** line.
 */
function parsePendingChanges() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.warn('SEO-CHANGELOG.md not found — pending changes section will be empty');
    return [];
  }

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const entries = [];
  const entryPattern = /^### (\d{4}-\d{2}-\d{2}) — (.+)$/gm;

  let match;
  while ((match = entryPattern.exec(content)) !== null) {
    const deployed = match[1];
    const label = match[2].trim();
    const entryStart = match.index;

    // Find the status line within this entry (before the next ### or end of file)
    const nextEntry = content.indexOf('\n### ', entryStart + 1);
    const entryBlock = nextEntry !== -1
      ? content.slice(entryStart, nextEntry)
      : content.slice(entryStart);

    const statusMatch = entryBlock.match(/\*\*Status:\*\*\s*(.+)/);
    const status = statusMatch ? statusMatch[1].trim() : '';

    // Only include entries that are still pending (not marked ✅ complete)
    const isComplete = status.startsWith('✅') && /complete|done|assessed/i.test(status);
    entries.push({ label, deployed, status, isComplete });
  }

  return entries;
}

function weeksSince(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(1) : 'N/A';
}

function pctChange(current, prior) {
  if (!prior || prior === 0) return '';
  const pct = ((current - prior) / prior) * 100;
  const sign = pct >= 0 ? '+' : '';
  return ` (${sign}${pct.toFixed(1)}%)`;
}

async function generateReport(data, analysis, interpretation, reviewResult, inspection) {
  const date = new Date().toISOString().split('T')[0];
  const { currentTotals, priorTotals, wins, drops, opportunities, gaps } = analysis;

  let md = `# ${config.businessName} SEO Report — ${date}\n\n`;
  md += `> Auto-generated from Google Search Console\n`;
  md += `> **Current period:** ${data.currentPeriod.startDate} → ${data.currentPeriod.endDate}\n`;
  md += `> **Prior period:** ${data.priorPeriod.startDate} → ${data.priorPeriod.endDate}\n\n`;
  md += `---\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Metric | This Period | Prior 28 Days | Baseline (${BASELINE.period}) |\n`;
  md += `|--------|-------------|---------------|----------------------------|\n`;
  md += `| Clicks | **${currentTotals.clicks}** | ${priorTotals.clicks}${pctChange(currentTotals.clicks, priorTotals.clicks)} | ${BASELINE.clicks} |\n`;
  md += `| Impressions | **${currentTotals.impressions}** | ${priorTotals.impressions}${pctChange(currentTotals.impressions, priorTotals.impressions)} | ${BASELINE.impressions} |\n`;
  md += `| CTR | **${(currentTotals.ctr * 100).toFixed(2)}%** | ${(priorTotals.ctr * 100).toFixed(2)}% | ${(BASELINE.ctr * 100).toFixed(1)}% |\n`;
  md += `| Avg Position | **${fmt(currentTotals.avgPosition)}** | — | ${BASELINE.avgPosition} |\n`;
  md += `| Pages tracked | ${analysis.pageCount} | — | — |\n\n`;

  // Indexing Status (from URL Inspection API)
  if (inspection && !inspection.skipped && inspection.summary) {
    const s = inspection.summary;
    md += `## Indexing Status — Crawled-Not-Indexed Tracker\n\n`;
    md += `> Checked all ${s.totalPages} pages from sitemap\n\n`;
    md += `| Status | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Indexed (PASS) | **${s.indexed}** |\n`;
    md += `| Not Indexed | ${s.notIndexed} |\n`;
    md += `| Errors | ${s.errors} |\n\n`;

    // Show newly indexed pages (wins!)
    const newlyIndexed = inspection.inspected.filter(r => r.verdict === 'PASS');
    if (newlyIndexed.length > 0) {
      md += `### Newly Indexed Pages\n\n`;
      md += `_These pages were on the not-indexed list but are now indexed._\n\n`;
      for (const p of newlyIndexed) {
        const slug = p.url.replace(config.siteBase, '') || '/';
        md += `- ${slug}\n`;
      }
      md += '\n';
    }

    // Show pages still not indexed with last crawl info
    const stillNotIndexed = inspection.inspected.filter(
      r => r.verdict !== 'PASS' && r.verdict !== 'ERROR'
    );
    if (stillNotIndexed.length > 0) {
      md += `### Still Not Indexed (${stillNotIndexed.length} pages)\n\n`;
      md += `| Page | Coverage State | Last Crawl | Fetch Status |\n`;
      md += `|------|---------------|------------|-------------|\n`;
      const show = stillNotIndexed.slice(0, 20); // Cap at 20 in report
      for (const p of show) {
        const slug = p.url.replace(config.siteBase, '') || '/';
        const crawl = p.lastCrawlTime ? p.lastCrawlTime.split('T')[0] : '—';
        md += `| ${slug} | ${p.coverageState} | ${crawl} | ${p.pageFetchState || '—'} |\n`;
      }
      if (stillNotIndexed.length > 20) {
        md += `| _...and ${stillNotIndexed.length - 20} more_ | | | |\n`;
      }
      md += '\n';
    }

    // Load cumulative stats if available
    const cumulativePath = path.join(__dirname, '../../seo-data/inspect-cumulative.json');
    if (fs.existsSync(cumulativePath)) {
      const cum = JSON.parse(fs.readFileSync(cumulativePath, 'utf8'));
      md += `### Cumulative Progress\n\n`;
      md += `| Metric | Value |\n`;
      md += `|--------|-------|\n`;
      md += `| Total URLs inspected (all time) | ${cum.totalInspected} |\n`;
      md += `| Currently indexed | **${cum.indexed}** |\n`;
      md += `| Still not indexed | ${cum.notIndexed} |\n`;
      md += `| Index rate | ${cum.totalInspected > 0 ? ((cum.indexed / cum.totalInspected) * 100).toFixed(1) : 0}% |\n\n`;
    }
  }

  // Wins
  if (wins.length > 0) {
    md += `## Wins — Pages Moving Up\n\n`;
    md += `| Page | Now | Was | Change | Clicks |\n`;
    md += `|------|-----|-----|--------|--------|\n`;
    for (const w of wins) {
      const slug = w.url.replace(config.siteBase, '') || '/';
      md += `| ${slug} | ${fmt(w.position)} | ${fmt(w.priorPosition)} | **+${fmt(w.positionDelta)}** | ${w.clicks} |\n`;
    }
    md += '\n';
  }

  // Drops
  if (drops.length > 0) {
    md += `## Drops — Pages Moving Down\n\n`;
    md += `_Check SEO-CHANGELOG.md before acting — these may reflect a recent change that needs more time._\n\n`;
    md += `| Page | Now | Was | Change | Impressions |\n`;
    md += `|------|-----|-----|--------|-------------|\n`;
    for (const d of drops) {
      const slug = d.url.replace(config.siteBase, '') || '/';
      md += `| ${slug} | ${fmt(d.position)} | ${fmt(d.priorPosition)} | **${fmt(d.positionDelta)}** | ${d.impressions} |\n`;
    }
    md += '\n';
  }

  // Opportunities
  if (opportunities.length > 0) {
    md += `## Opportunities — Close to Page 1 (Positions 8–20)\n\n`;
    md += `_These pages are close. Better title/meta or 2 internal links could push them to page 1._\n\n`;
    md += `| Page | Position | Impressions | CTR |\n`;
    md += `|------|----------|-------------|-----|\n`;
    for (const o of opportunities) {
      const slug = o.keys[0].replace(config.siteBase, '') || '/';
      md += `| ${slug} | ${fmt(o.position)} | ${o.impressions} | ${(o.ctr * 100).toFixed(2)}% |\n`;
    }
    md += '\n';
  }

  // Gaps
  if (gaps.length > 0) {
    md += `## Gaps — Queries With No Dedicated Page\n\n`;
    md += `_High impressions, zero clicks. Each is a candidate for a new city/service page._\n\n`;
    md += `| Query | Impressions | Avg Position |\n`;
    md += `|-------|-------------|-------------|\n`;
    for (const g of gaps) {
      md += `| ${g.keys[0]} | ${g.impressions} | ${fmt(g.position)} |\n`;
    }
    md += '\n';
  }

  // --- INTERPRETATION: What's working and why ---
  if (interpretation && reviewResult) {
    md += `## Analysis — What's Working (and What's Not)\n\n`;
    md += `> **Overall confidence:** ${reviewResult.overallConfidence}\n`;
    md += `> Attributed: ${reviewResult.stats.totalAttributed} pages | Unattributed: ${reviewResult.stats.totalUnattributed} pages | Warnings: ${reviewResult.stats.warningCount}\n\n`;

    // Attributions
    if (interpretation.attributions.length > 0) {
      md += `### Changes Linked to Page Movement\n\n`;
      for (const attr of interpretation.attributions) {
        const arrow = attr.direction === 'up' ? '📈' : '📉';
        const deltaSign = attr.direction === 'up' ? '+' : '';
        md += `**${arrow} ${attr.url}** — position ${fmt(attr.positionWas)} → ${fmt(attr.positionNow)} (${deltaSign}${fmt(attr.delta)})\n`;
        md += `- **Likely cause:** ${attr.likelyCause.change} _(deployed ${attr.likelyCause.deployed}, ${attr.likelyCause.weeksAgo} weeks ago)_\n`;
        md += `- **Confidence:** ${attr.likelyCause.confidence.toUpperCase()} — ${attr.likelyCause.reason}\n`;
        if (attr.allMatchingChanges.length > 1) {
          md += `- **Also matched:** ${attr.allMatchingChanges.slice(1).map(c => c.change).join(', ')}\n`;
        }
        md += '\n';
      }
    }

    // Unattributed
    if (interpretation.unattributed.length > 0) {
      md += `### Unattributed Movement (No Matching Change)\n\n`;
      md += `_These pages moved but don't match any logged SEO change. Could be algorithm updates, competitor changes, or external links._\n\n`;
      md += `| Page | Direction | Delta | Impressions |\n`;
      md += `|------|-----------|-------|-------------|\n`;
      for (const u of interpretation.unattributed) {
        const dir = u.direction === 'up' ? '↑' : '↓';
        md += `| ${u.url} | ${dir} | ${fmt(Math.abs(u.delta))} | ${u.impressions} |\n`;
      }
      md += '\n';
    }

    // Boosted opportunities
    if (interpretation.boostedOpportunities.length > 0) {
      md += `### Opportunities Boosted by Recent Changes\n\n`;
      md += `_These pages are close to page 1 AND were affected by a recent change. A small push could get them there._\n\n`;
      for (const opp of interpretation.boostedOpportunities) {
        md += `- **${opp.url}** — position ${fmt(opp.position)}, ${opp.impressions} impressions. Affected by "${opp.change}" (${opp.weeksAgo} weeks ago)\n`;
      }
      md += '\n';
    }

    // Warnings from review agent
    if (reviewResult.warnings.length > 0) {
      md += `### ⚠️ Review Warnings\n\n`;
      for (const w of reviewResult.warnings) {
        const icon = w.severity === 'high' ? '🔴' : '🟡';
        md += `${icon} **${w.type.replace(/_/g, ' ').toUpperCase()}:** ${w.message}\n\n`;
      }
    }

    // Insights from review agent
    if (reviewResult.insights.length > 0) {
      md += `### 💡 Insights\n\n`;
      for (const i of reviewResult.insights) {
        const icon = i.actionable ? '👉' : 'ℹ️';
        md += `${icon} ${i.message}\n\n`;
      }
    }
  }

  // Pending changes — from Google Sheet first, markdown fallback
  const sheetPending = await fetchPendingChangesFromSheet();
  const allChanges = sheetPending !== null ? sheetPending : parsePendingChanges();
  const pending = allChanges.filter(c => !c.isComplete);
  const completed = allChanges.filter(c => c.isComplete);

  if (pending.length > 0) {
    md += `## Pending Changes — Do Not Reverse Yet\n\n`;
    md += `| Change | Deployed | Weeks Elapsed | Evaluation Status |\n`;
    md += `|--------|----------|---------------|-------------------|\n`;
    for (const c of pending) {
      const weeks = weeksSince(c.deployed);
      const evalStatus = weeks < 8 ? '🟡 Too early to evaluate' : weeks < 12 ? '🔵 Evaluating' : '✅ Ready to assess';
      md += `| ${c.label} | ${c.deployed} | ${weeks} | ${evalStatus} |\n`;
    }
    md += '\n';
  }

  if (completed.length > 0) {
    md += `## Completed Changes\n\n`;
    md += `| Change | Deployed | Weeks Ago |\n`;
    md += `|--------|----------|-----------|\n`;
    for (const c of completed) {
      md += `| ${c.label} | ${c.deployed} | ${weeksSince(c.deployed)} |\n`;
    }
    md += '\n';
  }

  md += `---\n\n_Next report generated automatically next Tuesday at 9am ET_\n`;
  md += `_To add delivery via email or GHL, see scripts/seo-agent/index.js — delivery section_\n`;

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const reportPath = path.join(REPORTS_DIR, `${date}.md`);
  fs.writeFileSync(reportPath, md);
  console.log(`Report saved → seo-reports/${date}.md`);
  return { md, reportPath };
}

/**
 * Generate a plain-English, client-ready email body.
 * Written for paying clients who want to understand what's happening
 * with their SEO each week — and what we're doing about it.
 */
async function generateEmailBody(data, analysis, interpretation, reviewResult, inspection, ga4 = null) {
  const date = new Date().toISOString().split('T')[0];
  const { currentTotals, priorTotals, wins, drops, opportunities, gaps } = analysis;

  let out = `${config.businessName} SEO Weekly Update — ${date}\n`;
  out += `=`.repeat(45) + `\n\n`;
  out += `Here's your weekly update on how ${config.siteBase.replace('https://', '')} is performing in Google search.\n\n`;

  // --- Summary ---
  out += `YOUR NUMBERS THIS WEEK\n\n`;

  const clickChange = pctChange(currentTotals.clicks, priorTotals.clicks);
  const impChange = pctChange(currentTotals.impressions, priorTotals.impressions);

  out += `Over the last 28 days, your site received ${currentTotals.clicks} clicks from Google search`;
  if (priorTotals.clicks) {
    const clickDiff = currentTotals.clicks - priorTotals.clicks;
    if (clickDiff > 0) {
      out += ` — that's ${clickDiff} more than last period${clickChange}`;
    } else if (clickDiff < 0) {
      out += ` — that's ${Math.abs(clickDiff)} fewer than last period${clickChange}`;
    } else {
      out += ` — same as last period`;
    }
  }
  out += `. For context, when the site first launched (${BASELINE.period}), it was getting about ${BASELINE.clicks} clicks per period`;
  out += currentTotals.clicks > BASELINE.clicks
    ? `, so we've come a long way.\n\n`
    : `. We're working to grow that number.\n\n`;

  out += `Your site showed up in search results ${currentTotals.impressions} times`;
  out += priorTotals.impressions ? `${impChange} compared to last period` : '';
  out += `. Of those, ${(currentTotals.ctr * 100).toFixed(2)}% of people clicked through to the site. `;
  out += `Your average search position across all pages is ${fmt(currentTotals.avgPosition)}. `;
  out += `We're actively monitoring ${analysis.pageCount} pages.\n\n`;

  // --- GA4 Website Traffic ---
  if (ga4 && ga4.current) {
    const c = ga4.current;
    const p = ga4.prior;

    out += `WEBSITE TRAFFIC\n\n`;
    out += `Your site had ${c.sessions} visit${c.sessions !== 1 ? 's' : ''} from ${c.users} people over the last 28 days`;
    if (p) {
      const diff = c.sessions - p.sessions;
      if (diff > 0) out += ` — that's ${diff} more visits than the prior period`;
      else if (diff < 0) out += ` — that's ${Math.abs(diff)} fewer visits than the prior period`;
      else out += ` — same as the prior period`;
    }
    out += `. They viewed ${c.pageviews} pages total. `;

    const avgMins = Math.floor(c.avgSessionDuration / 60);
    const avgSecs = Math.round(c.avgSessionDuration % 60);
    out += `The average visitor spent ${avgMins > 0 ? avgMins + ' minute' + (avgMins !== 1 ? 's' : '') + ' and ' : ''}${avgSecs} seconds on the site. `;

    const bouncePercent = (c.bounceRate * 100).toFixed(0);
    out += `${bouncePercent}% of visitors left without interacting (bounce rate)`;
    if (parseInt(bouncePercent) > 70) {
      out += ` — that's on the high side, which usually means people aren't finding what they expected or the page isn't compelling enough to keep them`;
    } else if (parseInt(bouncePercent) < 40) {
      out += ` — that's really good, meaning most visitors are engaging with the site`;
    }
    out += `.\n\n`;

    if (ga4.phoneClicks > 0) {
      out += `${ga4.phoneClicks} people clicked on a phone number link on the site — those are potential leads.\n\n`;
    }

    if (ga4.sources && ga4.sources.length > 0) {
      out += `Where your traffic is coming from:\n\n`;
      for (const s of ga4.sources) {
        const engageRate = s.sessions > 0 ? ((s.engaged / s.sessions) * 100).toFixed(0) : 0;
        out += `  ${s.channel}: ${s.sessions} visits from ${s.users} people (${engageRate}% engaged)\n`;
      }
      out += `\n`;
      const organicSource = ga4.sources.find(s => s.channel === 'Organic Search');
      if (organicSource) {
        out += `Organic Search (people finding you through Google) brought in ${organicSource.sessions} visits. This is the number we're working to grow through SEO.\n\n`;
      }
    }

    if (ga4.topPages && ga4.topPages.length > 0) {
      out += `Your most visited pages:\n\n`;
      for (const pg of ga4.topPages.slice(0, 10)) {
        const dur = Math.round(pg.avgDuration);
        out += `  ${pg.path} — ${pg.sessions} visits, ${dur}s avg time on page\n`;
      }
      out += `\n`;
    }
  }

  // --- Indexing ---
  if (inspection && !inspection.skipped && inspection.summary) {
    const s = inspection.summary;
    out += `GOOGLE INDEXING UPDATE\n\n`;
    out += `For your pages to show up in search results, Google needs to "index" them — basically add them to its database. `;
    out += `This week we checked all ${s.totalPages} pages on the site: ${s.indexed} are fully indexed and live in Google, and ${s.notIndexed} are still waiting to be added.`;
    if (s.errors > 0) out += ` We ran into ${s.errors} inspection errors that we'll keep an eye on.`;
    out += `\n\n`;

    const newlyIndexed = inspection.inspected.filter(r => r.verdict === 'PASS');
    if (newlyIndexed.length > 0) {
      out += `Good news — ${newlyIndexed.length} new page${newlyIndexed.length > 1 ? 's' : ''} got indexed since last week. That means Google picked them up and they're now eligible to appear in search results:\n\n`;
      for (const p of newlyIndexed) {
        const slug = p.url.replace(config.siteBase, '') || '/';
        out += `  - ${slug}\n`;
      }
      out += `\n`;
    }

    const stillNotIndexed = inspection.inspected.filter(
      r => r.verdict !== 'PASS' && r.verdict !== 'ERROR'
    );
    if (stillNotIndexed.length > 0) {
      out += `There are still ${stillNotIndexed.length} page${stillNotIndexed.length > 1 ? 's' : ''} waiting to be indexed. `;
      out += `This is completely normal — Google processes new pages on its own schedule, and it can take several weeks. `;
      out += `We're monitoring these and will flag anything that seems stuck.\n\n`;
    }

    const cumulativePath = path.join(__dirname, '../../seo-data/inspect-cumulative.json');
    if (fs.existsSync(cumulativePath)) {
      const cum = JSON.parse(fs.readFileSync(cumulativePath, 'utf8'));
      const rate = cum.totalInspected > 0 ? ((cum.indexed / cum.totalInspected) * 100).toFixed(1) : 0;
      out += `Overall, ${cum.indexed} out of ${cum.totalInspected} total pages are indexed — a ${rate}% index rate.\n\n`;
    }
  }

  // --- Wins ---
  if (wins.length > 0) {
    out += `WHAT'S IMPROVING\n\n`;
    out += `${wins.length} page${wins.length > 1 ? 's' : ''} moved up in Google rankings this period. `;
    out += `This means people searching for your services are more likely to see these pages:\n\n`;
    for (const w of wins) {
      const slug = w.url.replace(config.siteBase, '') || '/';
      out += `  ${slug}\n`;
      out += `    Moved from position ${fmt(w.priorPosition)} to ${fmt(w.position)} (up ${fmt(w.positionDelta)} spots). Got ${w.clicks} click${w.clicks !== 1 ? 's' : ''} this period.\n\n`;
    }
    out += `We'll keep reinforcing these pages with internal links and fresh content to hold and improve these positions.\n\n`;
  }

  // --- Drops ---
  if (drops.length > 0) {
    out += `WHAT SLIPPED\n\n`;
    out += `${drops.length} page${drops.length > 1 ? 's' : ''} dropped in rankings this period. `;
    out += `Some movement up and down is completely normal in SEO — Google is constantly re-evaluating pages. `;
    out += `Here's what we saw:\n\n`;
    for (const d of drops) {
      const slug = d.url.replace(config.siteBase, '') || '/';
      out += `  ${slug}\n`;
      out += `    Went from position ${fmt(d.priorPosition)} to ${fmt(d.position)} (down ${fmt(Math.abs(d.positionDelta))} spots, ${d.impressions} impression${d.impressions !== 1 ? 's' : ''})\n\n`;
    }
    out += `What we're doing about it: We review every drop to see if it's tied to a change we made, a Google algorithm update, or competitor activity. `;
    out += `If a page keeps dropping for more than 2–3 weeks, we'll adjust the page content, title tags, or internal linking to recover it.\n\n`;
  }

  // --- Opportunities ---
  if (opportunities.length > 0) {
    out += `ALMOST ON PAGE 1\n\n`;
    out += `These pages are ranking between positions 8–20 — meaning they're close to Google's first page. `;
    out += `With some targeted improvements like better title tags or a few internal links, we can push them onto page 1 where most clicks happen:\n\n`;
    for (const o of opportunities) {
      const slug = o.keys[0].replace(config.siteBase, '') || '/';
      out += `  ${slug}\n`;
      out += `    Currently at position ${fmt(o.position)} with ${o.impressions} impressions and ${(o.ctr * 100).toFixed(2)}% click-through rate.\n\n`;
    }
    out += `These are our best short-term targets. We're prioritizing these pages for optimization.\n\n`;
  }

  // --- Gaps ---
  if (gaps.length > 0) {
    out += `SEARCH TERMS WE'RE MISSING\n\n`;
    out += `People are searching for these terms and your site is showing up, but nobody is clicking through. `;
    out += `This usually means we don't have a dedicated page targeting that exact search term yet:\n\n`;
    for (const g of gaps) {
      out += `  "${g.keys[0]}" — ${g.impressions} people saw your site for this search, average position ${fmt(g.position)}\n`;
    }
    out += `\nEach of these is a potential new page we can create to capture this traffic. We'll evaluate which ones have the best potential and add them to the content plan.\n\n`;
  }

  // --- Interpretation / Analysis ---
  if (interpretation && reviewResult) {
    out += `WHAT'S DRIVING THESE RESULTS\n\n`;

    if (interpretation.attributions.length > 0) {
      out += `We were able to connect ${reviewResult.stats.totalAttributed} ranking change${reviewResult.stats.totalAttributed !== 1 ? 's' : ''} to specific work we've done on the site:\n\n`;
      for (const attr of interpretation.attributions) {
        const slug = attr.url.replace(config.siteBase, '') || attr.url;
        const dir = attr.direction === 'up' ? 'improved' : 'dropped';
        const deltaDir = attr.direction === 'up' ? 'up' : 'down';
        out += `  ${slug} ${dir} from position ${fmt(attr.positionWas)} to ${fmt(attr.positionNow)} (${deltaDir} ${fmt(Math.abs(attr.delta))} spots). `;
        out += `This is likely the result of "${attr.likelyCause.change}" which we deployed ${attr.likelyCause.weeksAgo} week${attr.likelyCause.weeksAgo !== 1 ? 's' : ''} ago`;
        out += attr.likelyCause.confidence === 'high' ? ` (high confidence).\n\n` : ` (${attr.likelyCause.confidence} confidence — we'll keep watching).\n\n`;
      }
    }

    if (reviewResult.stats.totalUnattributed > 0) {
      out += `${reviewResult.stats.totalUnattributed} page${reviewResult.stats.totalUnattributed !== 1 ? 's' : ''} moved in rankings but we can't tie ${reviewResult.stats.totalUnattributed !== 1 ? 'them' : 'it'} to a specific change we made. `;
      out += `This can happen due to Google algorithm updates, competitor changes, or new backlinks. We're tracking these to see if a pattern emerges.\n\n`;
    }

    if (interpretation.boostedOpportunities.length > 0) {
      out += `Some of our recent work is helping pages that are close to page 1:\n\n`;
      for (const opp of interpretation.boostedOpportunities) {
        const slug = opp.url.replace(config.siteBase, '') || opp.url;
        out += `  ${slug} is at position ${fmt(opp.position)} with ${opp.impressions} impressions — and our "${opp.change}" update from ${opp.weeksAgo} weeks ago is helping it climb.\n`;
      }
      out += `\n`;
    }

    if (reviewResult.warnings.length > 0) {
      out += `THINGS WE'RE WATCHING\n\n`;
      for (const w of reviewResult.warnings) {
        out += `  - ${w.message}\n`;
      }
      out += `\nWe're keeping an eye on these and will take action if needed.\n\n`;
    }

    if (reviewResult.insights.length > 0) {
      out += `OUR RECOMMENDATIONS\n\n`;
      for (const i of reviewResult.insights) {
        out += `  - ${i.message}\n`;
      }
      out += `\n`;
    }
  }

  // --- Pending changes — from Google Sheet first, markdown fallback ---
  const sheetPending = await fetchPendingChangesFromSheet();
  const allChanges2 = sheetPending !== null ? sheetPending : parsePendingChanges();
  const pending = allChanges2.filter(c => !c.isComplete);

  if (pending.length > 0) {
    out += `WORK IN PROGRESS\n\n`;
    out += `SEO changes typically take 4–12 weeks to show their full effect in Google. Here are changes we've made that are still building momentum:\n\n`;
    for (const c of pending) {
      const weeks = weeksSince(c.deployed);
      let status;
      if (weeks < 4) status = 'just deployed — too early for results';
      else if (weeks < 8) status = 'building momentum — early signs may appear soon';
      else if (weeks < 12) status = 'should be showing results — we\'re evaluating';
      else status = 'fully matured — ready to assess impact';
      out += `  "${c.label}"\n`;
      out += `    Deployed ${c.deployed} (${weeks} week${weeks !== 1 ? 's' : ''} ago). Status: ${status}.\n\n`;
    }
  }

  out += `—\n\n`;
  out += `That's it for this week. Next update drops here automatically next Tuesday at 9am ET.\n\n`;
  out += `— ${config.businessName} SEO Agent\n`;

  return out;
}

module.exports = { generateReport, generateEmailBody };
