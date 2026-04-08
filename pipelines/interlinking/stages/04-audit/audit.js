/**
 * Stage 4: Audit Link Health
 *
 * Checks the link graph and article relatedLinks for issues:
 * - Orphan pages (0 inbound links)
 * - Over-linked pages (>max outbound links)
 * - Broken links (target doesn't exist)
 */
const fs = require('fs');
const path = require('path');

function auditLinks(config) {
  const graphPath = config.LINK_GRAPH_PATH;
  if (!fs.existsSync(graphPath)) {
    console.log('  No link graph — run stage 01-graph first');
    return null;
  }

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const maxOutbound = config.MAX_OUTBOUND_LINKS;
  const validPaths = new Set(Object.keys(graph.nodes));

  // Count inbound links per node
  const inboundCount = {};
  for (const path of validPaths) inboundCount[path] = 0;
  for (const edge of graph.edges) {
    if (inboundCount[edge.to] !== undefined) {
      inboundCount[edge.to]++;
    }
  }

  // Count outbound links per node
  const outboundCount = {};
  for (const path of validPaths) outboundCount[path] = 0;
  for (const edge of graph.edges) {
    if (outboundCount[edge.from] !== undefined) {
      outboundCount[edge.from]++;
    }
  }

  // Find orphans (city/service pages with 0 inbound — articles are OK to have 0)
  const orphans = Object.entries(inboundCount)
    .filter(([p, count]) => count === 0 && graph.nodes[p].type !== 'article')
    .map(([p]) => p);

  // Find over-linked pages
  const overLinked = Object.entries(outboundCount)
    .filter(([, count]) => count > maxOutbound)
    .map(([p, count]) => ({ path: p, count }));

  // Check relatedLinks in article files for broken links
  const broken = [];
  const newsDir = config.LOCAL_NEWS_DIR;
  if (fs.existsSync(newsDir)) {
    for (const file of fs.readdirSync(newsDir).filter(f => f.endsWith('.json'))) {
      try {
        const articles = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
        for (const article of articles) {
          for (const link of (article.relatedLinks || [])) {
            if (!validPaths.has(link.href)) {
              broken.push({ file, article: article.slug, href: link.href });
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  // Report
  console.log(`  Audit results:`);
  console.log(`    Orphan pages: ${orphans.length}`);
  if (orphans.length > 0 && orphans.length <= 10) {
    orphans.forEach(p => console.log(`      - ${p}`));
  } else if (orphans.length > 10) {
    orphans.slice(0, 10).forEach(p => console.log(`      - ${p}`));
    console.log(`      ... and ${orphans.length - 10} more`);
  }

  console.log(`    Over-linked pages: ${overLinked.length}`);
  overLinked.forEach(({ path: p, count }) => console.log(`      - ${p} (${count} links)`));

  console.log(`    Broken relatedLinks: ${broken.length}`);
  broken.forEach(b => console.log(`      - ${b.file}/${b.article} → ${b.href}`));

  return { orphans, overLinked, broken };
}

module.exports = { auditLinks };
