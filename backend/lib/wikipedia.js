const axios = require('axios');

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const TIMEOUT_MS = 6000;
const WIKI_HEADERS = {
  'User-Agent': 'VeloraSearch/1.0 (https://github.com/velora; admin@velora.ai)',
  Accept: 'application/json',
};

/**
 * Compute relevance (0–1) from rank and query–title overlap.
 */
function computeRelevance(query, title, rankIndex) {
  const base = Math.max(0.45, 0.98 - rankIndex * 0.12);
  const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const titleLower = title.toLowerCase();
  if (qWords.length === 0) return base;
  const matched = qWords.filter((w) => titleLower.includes(w)).length;
  const overlapBoost = (matched / qWords.length) * 0.15;
  return Math.min(0.99, base + overlapBoost);
}

/**
 * Fetch related Wikipedia articles for a search query.
 * @returns {Promise<Array<{ title, content, url, source, score }>>}
 */
async function fetchViaGeneratorSearch(q, limit) {
  const { data } = await axios.get(WIKI_API, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
    params: {
      action: 'query',
      generator: 'search',
      gsrsearch: q,
      gsrlimit: limit,
      prop: 'extracts|info',
      inprop: 'url',
      exintro: 1,
      explaintext: 1,
      exsentences: 4,
      format: 'json',
    },
  });

  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages)
    .filter((p) => p.title && !p.missing)
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((page, index) => formatWikiPage(q, page, index));
}

/** Fallback when generator search is blocked — OpenSearch + summaries */
async function fetchViaOpenSearch(q, limit) {
  const { data } = await axios.get(WIKI_API, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
    params: {
      action: 'opensearch',
      search: q,
      limit,
      namespace: 0,
      format: 'json',
    },
  });

  const titles = data?.[1] || [];
  const descriptions = data?.[2] || [];
  const urls = data?.[3] || [];

  return titles.map((title, index) => ({
    _id: `wiki-${title}`,
    title,
    content: (descriptions[index] || '').trim() || `Wikipedia article about ${title}.`,
    source: 'Wikipedia',
    category: 'external',
    metadata: { source: 'Wikipedia', url: urls[index] },
    url: urls[index] || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    score: computeRelevance(q, title, index),
  }));
}

function formatWikiPage(q, page, index) {
  const title = page.title;
  const extract = (page.extract || '').trim();
  const content = extract || `Wikipedia article about ${title}.`;
  const url =
    page.fullurl ||
    `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

  return {
    _id: `wiki-${title}`,
    title,
    content,
    source: 'Wikipedia',
    category: 'external',
    metadata: { source: 'Wikipedia', url },
    url,
    score: computeRelevance(q, title, index),
  };
}

async function fetchWikipediaResults(query, limit = 5) {
  const q = (query || '').trim();
  if (!q) return [];

  try {
    return await fetchViaGeneratorSearch(q, limit);
  } catch (err) {
    console.warn('Wikipedia generator search failed, trying opensearch:', err.message);
    try {
      return await fetchViaOpenSearch(q, limit);
    } catch (err2) {
      console.warn('Wikipedia API unavailable:', err2.message);
      return [];
    }
  }
}

module.exports = { fetchWikipediaResults };
