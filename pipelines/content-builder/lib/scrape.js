/**
 * Web research utilities — DuckDuckGo SERP + Reddit question scraping.
 * Ported from GHL's 5-blog.py to Node.js for the shared content-builder.
 */

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

/**
 * Scrape DuckDuckGo HTML search results.
 * Returns [{title, snippet, url}]
 */
async function scrapeDuckDuckGo(query, maxResults = 5) {
  let cheerio;
  try {
    cheerio = require('cheerio');
  } catch {
    console.log('  cheerio not installed — skipping SERP scrape');
    return [];
  }

  try {
    const resp = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `q=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });

    const html = await resp.text();
    const $ = cheerio.load(html);
    const results = [];

    $('.result__body').each((i, el) => {
      if (results.length >= maxResults) return false;
      // Skip ads
      if ($(el).find('.badge--ad').length) return;

      const title = $(el).find('.result__title').text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      const url = $(el).find('.result__url').text().trim();

      if (title && snippet) {
        results.push({ title, snippet, url });
      }
    });

    console.log(`  SERP: ${results.length} results for "${query}"`);
    return results;
  } catch (err) {
    console.log(`  SERP scrape failed: ${err.message}`);
    return [];
  }
}

/**
 * Search Reddit for real user questions about a topic.
 * Returns [string] — post titles.
 */
async function scrapeReddit(query, subreddits, maxResults = 5) {
  const questions = [];

  for (const subreddit of subreddits) {
    if (questions.length >= maxResults) break;

    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&limit=${maxResults}&type=link`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'ContentBuilderBot/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      const data = await resp.json();
      const posts = data?.data?.children || [];

      for (const post of posts) {
        const title = post?.data?.title;
        if (title && !questions.includes(title)) {
          questions.push(title);
        }
      }
    } catch (err) {
      console.log(`  Reddit r/${subreddit} failed: ${err.message}`);
    }
  }

  console.log(`  Reddit: ${questions.length} questions found`);
  return questions.slice(0, maxResults);
}

module.exports = { scrapeDuckDuckGo, scrapeReddit };
