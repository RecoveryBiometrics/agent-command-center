/**
 * Stage 3: Inject Related Links into Articles
 *
 * Adds a relatedLinks array to each article JSON object.
 * Links are chosen by: nearby city page + relevant service + same-category article nearby.
 *
 * Non-destructive: preserves all existing article fields, only adds/updates relatedLinks.
 */
const fs = require('fs');
const path = require('path');
const { getAdjacentCounties, getServiceForCategory } = require('../../lib/clusters');
const { parseConstants } = require('../../lib/parse-constants');

function slugifyCity(city) {
  const slug = city.slug || city.name.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  const state = (city.state || '').toLowerCase();
  return `bathroom-safety-${slug}-${state}`;
}

function injectLinks(config) {
  const newsDir = config.LOCAL_NEWS_DIR;
  if (!fs.existsSync(newsDir)) {
    console.log('  No local-news directory — nothing to inject');
    return { filesUpdated: 0, linksAdded: 0 };
  }

  const maxLinks = config.MAX_RELATED_LINKS;
  const { counties, services } = parseConstants(config.CONSTANTS_PATH);
  const slugPrefix = config.CITY_SLUG_PREFIX;

  // Build lookup: city data slug → { cityObj, county, pageSlug }
  const cityLookup = {};
  for (const county of counties) {
    for (const city of county.cities) {
      cityLookup[city.slug] = {
        city,
        county: county.county,
        pageSlug: slugifyCity(city),
      };
    }
  }

  // Load all articles indexed by city slug
  const allArticles = {};
  const newsFiles = fs.readdirSync(newsDir).filter(f => f.endsWith('.json'));
  for (const file of newsFiles) {
    const citySlug = file.replace('.json', '');
    try {
      allArticles[citySlug] = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
    } catch { /* skip */ }
  }

  // Known larger/more recognizable cities — prioritize these as neighbors
  const PRIORITY_CITIES = new Set([
    'west-chester', 'phoenixville', 'downingtown', 'exton', 'malvern', 'paoli',
    'media', 'drexel-hill', 'havertown', 'springfield', 'ardmore', 'broomall',
    'norristown', 'king-of-prussia', 'lansdale', 'conshohocken', 'collegeville',
    'philadelphia', 'center-city', 'germantown', 'chestnut-hill', 'fishtown',
    'wilmington', 'newark', 'middletown', 'bear',
    'lancaster', 'lititz', 'ephrata',
    'elkton',
    'rockville', 'bethesda', 'silver-spring', 'gaithersburg',
    'las-vegas', 'henderson', 'north-las-vegas', 'summerlin',
    'myrtle-beach', 'north-myrtle-beach', 'conway',
    'kennett-square', 'coatesville', 'oxford',
  ]);

  // Find same-county cities that have articles, prioritizing recognizable cities
  function getNearbyCitiesWithArticles(citySlug) {
    const info = cityLookup[citySlug];
    if (!info) return [];
    const candidates = Object.keys(allArticles)
      .filter(s => s !== citySlug && cityLookup[s]?.county === info.county);
    // Sort: priority cities first, then alphabetical
    candidates.sort((a, b) => {
      const aPriority = PRIORITY_CITIES.has(a) ? 0 : 1;
      const bPriority = PRIORITY_CITIES.has(b) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.localeCompare(b);
    });
    return candidates.slice(0, 5);
  }

  let filesUpdated = 0;
  let linksAdded = 0;

  for (const [citySlug, articles] of Object.entries(allArticles)) {
    const info = cityLookup[citySlug];
    if (!info) continue;

    let changed = false;

    for (const article of articles) {
      const links = [];

      // Link 1: nearby city page (geographic)
      const nearbyCities = getNearbyCitiesWithArticles(citySlug);
      if (nearbyCities.length > 0) {
        // Pick a different nearby city for variety — use article index as seed
        const idx = articles.indexOf(article) % nearbyCities.length;
        const nearbySlug = nearbyCities[idx];
        const nearbyInfo = cityLookup[nearbySlug];
        if (nearbyInfo) {
          links.push({
            text: `Bathroom safety in ${nearbyInfo.city.name}, ${nearbyInfo.city.state}`,
            href: `/${nearbyInfo.pageSlug}`,
          });
        }
      }

      // Link 2: relevant service page
      const serviceSlug = getServiceForCategory(article.category);
      const service = services.find(s => s.slug === serviceSlug);
      if (service) {
        links.push({
          text: service.name,
          href: `/bathroom-safety-services/${service.slug}`,
        });
      }

      // Link 3: same-category article in nearby city (include city name for context)
      for (const nearbySlug of nearbyCities) {
        if (links.length >= maxLinks) break;
        const nearbyArticles = allArticles[nearbySlug] || [];
        const sameCategory = nearbyArticles.find(a =>
          a.category === article.category && a.slug !== article.slug
        );
        if (sameCategory) {
          const nearbyInfo = cityLookup[nearbySlug];
          if (nearbyInfo) {
            links.push({
              text: `${sameCategory.title} — ${nearbyInfo.city.name}, ${nearbyInfo.city.state}`,
              href: `/${nearbyInfo.pageSlug}/local-news/${sameCategory.slug}`,
            });
            break;
          }
        }
      }

      // Always update — regenerate links with latest logic
      article.relatedLinks = links;
      linksAdded += links.length;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(
        path.join(newsDir, `${citySlug}.json`),
        JSON.stringify(articles, null, 2)
      );
      filesUpdated++;
    }
  }

  console.log(`  Inject: ${filesUpdated} files updated, ${linksAdded} links added`);
  return { filesUpdated, linksAdded };
}

module.exports = { injectLinks };
