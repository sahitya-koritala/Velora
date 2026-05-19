const axios = require('axios');
const { attachRelevanceScores } = require('./relevance');

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKI_REST_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const TIMEOUT_MS = 10000;
const WIKI_HEADERS = {
  'User-Agent': 'VeloraSearch/1.0 (https://github.com/velora; admin@velora.ai)',
  Accept: 'application/json',
};

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .trim();
}

function wikiArticleUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function isDisambiguation(text) {
  const t = (text || '').toLowerCase();
  return t.includes('may refer to:') || t.includes('may also refer to');
}

/**
 * Preliminary relevance before full extract (used to rank candidates).
 */
function scoreCandidate(query, candidate, rankIndex) {
  const queryLower = query.toLowerCase().trim();
  const titleLower = (candidate.title || '').toLowerCase();
  const snippetLower = (candidate.snippet || '').toLowerCase();
  const haystack = `${titleLower} ${snippetLower}`;

  let score = Math.max(0.35, 0.95 - rankIndex * 0.08);

  if (queryLower && titleLower === queryLower) score += 0.25;
  else if (titleLower.startsWith(queryLower) || titleLower.includes(queryLower)) score += 0.12;

  const words = queryLower.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const matched = words.filter((w) => haystack.includes(w)).length;
    score += (matched / words.length) * 0.2;
  }

  if (candidate.snippet && queryLower.length > 2 && snippetLower.includes(queryLower)) {
    score += 0.08;
  }

  if (isDisambiguation(candidate.snippet || candidate.content)) {
    score -= 0.12;
  }

  return Math.min(0.99, Math.max(0.12, score));
}

async function wikiApiGet(params) {
  const { data } = await axios.get(WIKI_API, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
    params: { format: 'json', origin: '*', ...params },
  });
  return data;
}

/** MediaWiki full-text search (primary — works for any keyword). */
async function searchViaListSearch(q, limit) {
  const data = await wikiApiGet({
    action: 'query',
    list: 'search',
    srsearch: q,
    srlimit: limit,
    srwhat: 'text',
  });

  return (data?.query?.search || []).map((hit, index) => ({
    title: hit.title,
    snippet: stripHtml(hit.snippet),
    searchIndex: index,
    source: 'search',
  }));
}

/** OpenSearch title suggestions (fast, broad coverage). */
async function searchViaOpenSearch(q, limit) {
  const data = await wikiApiGet({
    action: 'opensearch',
    search: q,
    limit,
    namespace: 0,
  });

  const titles = Array.isArray(data?.[1]) ? data[1] : [];
  const descriptions = Array.isArray(data?.[2]) ? data[2] : [];

  return titles.map((title, index) => ({
    title,
    snippet: (descriptions[index] || '').trim(),
    searchIndex: index,
    source: 'opensearch',
  }));
}

/** Generator search — returns pages with extracts in one request. */
async function searchViaGenerator(q, limit) {
  const { data } = await axios.get(WIKI_API, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
    params: {
      action: 'query',
      generator: 'search',
      gsrsearch: q,
      gsrlimit: limit,
      gsrnamespace: 0,
      prop: 'extracts|info',
      inprop: 'url',
      exintro: 1,
      explaintext: 1,
      exsentences: 5,
      redirects: 1,
      format: 'json',
      origin: '*',
    },
  });

  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages)
    .filter((p) => p.title && !p.missing)
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((page, index) => ({
      title: page.title,
      content: (page.extract || '').trim(),
      url: page.fullurl || wikiArticleUrl(page.title),
      snippet: (page.extract || '').slice(0, 200),
      searchIndex: index,
      source: 'generator',
    }));
}

/** Direct title lookup when the query matches an article name (e.g. "Albert Einstein"). */
async function tryDirectTitleMatch(q) {
  const data = await wikiApiGet({
    action: 'query',
    titles: q,
    redirects: 1,
    prop: 'extracts|info',
    inprop: 'url',
    exintro: 1,
    explaintext: 1,
    exsentences: 5,
  });

  const pages = Object.values(data?.query?.pages || {});
  const page = pages.find((p) => p.pageid && !p.missing && p.title);
  if (!page) return null;

  return {
    title: page.title,
    content: (page.extract || '').trim(),
    url: page.fullurl || wikiArticleUrl(page.title),
    snippet: (page.extract || '').slice(0, 200),
    searchIndex: 0,
    source: 'direct',
  };
}

/**
 * Discover article candidates from every strategy (Google-like coverage).
 */
async function discoverCandidates(q, poolSize = 12) {
  const byTitle = new Map();

  const merge = (items) => {
    for (const item of items || []) {
      if (!item?.title) continue;
      const key = item.title.toLowerCase();
      const existing = byTitle.get(key);
      if (!existing) {
        byTitle.set(key, item);
        continue;
      }
      if ((item.content || '').length > (existing.content || '').length) {
        byTitle.set(key, { ...existing, ...item, content: item.content || existing.content });
      }
      if ((item.snippet || '').length > (existing.snippet || '').length) {
        byTitle.set(key, { ...existing, snippet: item.snippet });
      }
    }
  };

  const settled = await Promise.allSettled([
    tryDirectTitleMatch(q),
    searchViaListSearch(q, poolSize),
    searchViaOpenSearch(q, poolSize),
    searchViaGenerator(q, poolSize),
  ]);

  const direct = settled[0].status === 'fulfilled' ? settled[0].value : null;
  if (direct) merge([direct]);

  if (settled[1].status === 'fulfilled') merge(settled[1].value);
  else console.warn('Wikipedia list search failed:', settled[1].reason?.message);

  if (settled[2].status === 'fulfilled') merge(settled[2].value);
  else console.warn('Wikipedia opensearch failed:', settled[2].reason?.message);

  if (settled[3].status === 'fulfilled') merge(settled[3].value);
  else console.warn('Wikipedia generator search failed:', settled[3].reason?.message);

  const candidates = Array.from(byTitle.values());
  candidates.forEach((c, i) => {
    c.preScore = scoreCandidate(q, c, c.searchIndex ?? i);
  });

  return candidates.sort((a, b) => (b.preScore || 0) - (a.preScore || 0));
}

async function fetchDetailsByTitles(titles) {
  if (!titles.length) return new Map();

  const { data } = await axios.get(WIKI_API, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
    params: {
      action: 'query',
      titles: titles.join('|'),
      redirects: 1,
      prop: 'extracts|info',
      inprop: 'url',
      exintro: 1,
      explaintext: 1,
      exsentences: 6,
      format: 'json',
      origin: '*',
    },
  });

  const pages = Object.values(data?.query?.pages || {}).filter((p) => p.title && !p.missing);
  const map = new Map();
  for (const page of pages) {
    map.set(page.title.toLowerCase(), {
      title: page.title,
      content: (page.extract || '').trim(),
      url: page.fullurl || wikiArticleUrl(page.title),
    });
  }

  const redirects = data?.query?.redirects || [];
  for (const r of redirects) {
    const target = map.get(r.to.toLowerCase());
    if (target) map.set(r.from.toLowerCase(), target);
  }

  return map;
}

async function fetchSummaryByTitle(title) {
  const pathTitle = encodeURIComponent(title.replace(/ /g, '_'));
  const { data } = await axios.get(`${WIKI_REST_SUMMARY}/${pathTitle}`, {
    timeout: TIMEOUT_MS,
    headers: WIKI_HEADERS,
  });

  return {
    title: data?.title || title,
    content: (data?.extract || data?.description || '').trim(),
    url: data?.content_urls?.desktop?.page || wikiArticleUrl(data?.title || title),
  };
}

function toResult(doc, preScore) {
  const content =
    (doc.content || '').trim() ||
    (doc.snippet || '').trim() ||
    `Wikipedia article about ${doc.title}.`;

  return {
    _id: `wiki-${doc.title}`,
    title: doc.title,
    content,
    source: 'Wikipedia',
    category: 'external',
    metadata: { source: 'Wikipedia', url: doc.url || wikiArticleUrl(doc.title) },
    url: doc.url || wikiArticleUrl(doc.title),
    score: preScore ?? 0.5,
  };
}

/**
 * Fetch Wikipedia articles for any search query (search → title → summary).
 * Returns ranked results with relevance scores; never filters by minimum score.
 */
async function fetchWikipediaResults(query, limit = 6) {
  const q = (query || '').trim();
  if (!q) return [];

  let candidates = [];
  try {
    candidates = await discoverCandidates(q, Math.max(limit * 2, 10));
  } catch (err) {
    console.warn('Wikipedia discovery failed:', err.message);
    return [];
  }

  if (!candidates.length) return [];

  const top = candidates.slice(0, limit);
  const needFetch = top.filter((c) => !c.content || c.content.length < 50).map((c) => c.title);

  let detailMap = new Map();
  if (needFetch.length) {
    try {
      detailMap = await fetchDetailsByTitles(needFetch);
    } catch (err) {
      console.warn('Wikipedia batch extract failed:', err.message);
    }
  }

  const rows = [];
  for (const candidate of top) {
    let doc = {
      title: candidate.title,
      content: candidate.content,
      url: candidate.url,
      snippet: candidate.snippet,
    };

    const detail =
      detailMap.get(candidate.title.toLowerCase()) ||
      detailMap.get((candidate.title || '').toLowerCase());

    if (detail) {
      doc = { ...doc, ...detail };
    }

    if (!doc.content || doc.content.length < 40) {
      try {
        const summary = await fetchSummaryByTitle(candidate.title);
        doc = { ...doc, title: summary.title, content: summary.content, url: summary.url };
      } catch {
        /* keep partial content */
      }
    }

    rows.push(toResult(doc, candidate.preScore));
  }

  const scored = attachRelevanceScores(q, rows);
  const seen = new Set();
  return scored
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .filter((row) => {
      const key = (row.title || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

module.exports = { fetchWikipediaResults };
