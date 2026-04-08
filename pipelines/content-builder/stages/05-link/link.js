/**
 * Stage 5: Generate Internal Links
 *
 * Adds relatedLinks to the article using the interlinking pipeline's cluster logic.
 */
const fs = require('fs');
const path = require('path');
const { getServiceForCategory } = require('../../../interlinking/lib/clusters');

/**
 * Generate relatedLinks for a new article.
 */
function addLinks(article, config, constants) {
  const links = [];
  const maxLinks = 3;

  // Find a relevant service page
  const serviceSlug = getServiceForCategory(article.category);
  const service = constants.services.find(s => s.slug === serviceSlug);
  if (service) {
    links.push({
      text: service.name,
      href: `/bathroom-safety-services/${service.slug}`,
    });
  }

  // Find a nearby city page — pick one from the same county if possible
  // Use the keyword to guess which city this content is about
  const keyword = article._keyword || '';
  let targetCounty = null;

  for (const county of constants.counties) {
    for (const city of county.cities) {
      if (keyword.toLowerCase().includes(city.name.toLowerCase())) {
        targetCounty = county;
        break;
      }
    }
    if (targetCounty) break;
  }

  // Default to first county if no match
  if (!targetCounty) targetCounty = constants.counties[0];

  if (targetCounty && links.length < maxLinks) {
    // Pick a city from the county
    const city = targetCounty.cities[Math.floor(Math.random() * targetCounty.cities.length)];
    const slug = city.slug || city.name.toLowerCase().replace(/[^\w]+/g, '-');
    const state = (city.state || '').toLowerCase();
    links.push({
      text: `Bathroom safety in ${city.name}, ${city.state}`,
      href: `/bathroom-safety-${slug}-${state}`,
    });
  }

  // Find a related article in nearby city
  const newsDir = config.LOCAL_NEWS_DIR;
  if (fs.existsSync(newsDir) && links.length < maxLinks) {
    const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      if (links.length >= maxLinks) break;
      try {
        const articles = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
        const sameCategory = articles.find(a => a.category === article.category);
        if (sameCategory) {
          const citySlug = file.replace('.json', '');
          // Find the city's full page slug
          let pageSlug = null;
          for (const county of constants.counties) {
            const city = county.cities.find(c => c.slug === citySlug);
            if (city) {
              pageSlug = `bathroom-safety-${city.slug}-${city.state.toLowerCase()}`;
              links.push({
                text: `${sameCategory.title} — ${city.name}, ${city.state}`,
                href: `/${pageSlug}/local-news/${sameCategory.slug}`,
              });
              break;
            }
          }
          if (links.length >= maxLinks) break;
        }
      } catch { /* skip */ }
    }
  }

  article.relatedLinks = links;

  // Clean up internal metadata
  delete article._keyword;

  console.log(`  Links: added ${links.length} relatedLinks`);
  return article;
}

module.exports = { addLinks };
