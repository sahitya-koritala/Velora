const express = require('express');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');
const { getEmbedding } = require('../lib/embeddings');
const { fetchWikipediaResults } = require('../lib/wikipedia');
const { attachRelevanceScores } = require('../lib/relevance');
const router = express.Router();

async function vectorSearchDocuments(queryEmbedding, limit = 10) {
  const searchPipeline = [
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
  return Document.aggregate(searchPipeline);
}

function isZeroVector(embedding) {
  return !Array.isArray(embedding) || embedding.length === 0 || embedding.every((v) => v === 0);
}

/** Match any word from the query in title or content (used when vector search is empty). */
async function keywordSearchDocuments(query, limit = 10) {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (!terms.length) return [];

  const orClauses = [];
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    orClauses.push({ title: re }, { content: re });
  }

  let docs = await Document.find({ $or: orClauses }).limit(limit).lean();

  if (docs.length === 0) {
    const phrase = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    docs = await Document.find({ $or: [{ title: phrase }, { content: phrase }] })
      .limit(limit)
      .lean();
  }

  return docs
    .map((doc) => {
      const haystack = `${doc.title || ''} ${doc.content || ''}`.toLowerCase();
      const matched = terms.filter((t) => haystack.includes(t.toLowerCase())).length;
      const score = 0.25 + (matched / terms.length) * 0.65;
      return { ...doc, score: Math.min(0.95, score) };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

function mergeInternalResults(vectorDocs, keywordDocs) {
  const byId = new Map();

  for (const doc of [...vectorDocs, ...keywordDocs]) {
    const id = String(doc._id);
    const prev = byId.get(id);
    if (!prev || (doc.score || 0) > (prev.score || 0)) {
      byId.set(id, doc);
    }
  }

  return Array.from(byId.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
}

async function searchInternalDocuments(query, queryEmbedding, limit = 10) {
  let vectorDocs = [];
  if (!isZeroVector(queryEmbedding)) {
    try {
      vectorDocs = await vectorSearchDocuments(queryEmbedding, limit);
    } catch (err) {
      console.warn('Vector search failed:', err.message);
    }
  }

  const keywordDocs = await keywordSearchDocuments(query, limit);

  if (vectorDocs.length === 0) {
    return keywordDocs;
  }

  return mergeInternalResults(vectorDocs, keywordDocs).slice(0, limit);
}

/**
 * AI-powered query suggestions from embeddings + document corpus + past searches
 */
router.get('/suggestions', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = new Set();
    const lower = q.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    const pastSearches = await SearchHistory.find({
      activityType: 'search',
      query: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    pastSearches.forEach((p) => suggestions.add(p.query));

    const keywordDocs = await Document.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(12)
      .lean();

    keywordDocs.forEach((doc) => {
      if (doc.title) suggestions.add(doc.title);
      const snippets = (doc.content || '')
        .split(/[.!?\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > q.length && s.toLowerCase().includes(lower));
      snippets.slice(0, 2).forEach((s) => suggestions.add(s.slice(0, 72)));
    });

    try {
      const queryEmbedding = await getEmbedding(q);
      const semanticDocs = await vectorSearchDocuments(queryEmbedding, 6);
      semanticDocs.forEach((doc) => {
        if (doc.title) suggestions.add(doc.title);
        if (doc.score > 0.3 && doc.content) {
          const firstLine = doc.content.split('\n')[0].trim();
          if (firstLine.length > q.length) {
            suggestions.add(firstLine.slice(0, 72));
          }
        }
      });
    } catch (e) {
      console.warn('Semantic suggestions fallback:', e.message);
    }

    const templates = [
      `${q} work policy`,
      `${q} access security`,
      `work from home ${q} rules`,
      `${q} collaboration guidelines`,
      `${q} requirements`,
      `company ${q} policy`,
    ];
    templates.forEach((t) => suggestions.add(t));

    const ranked = Array.from(suggestions)
      .filter((s) => s && s.toLowerCase() !== lower)
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lower) ? 1 : 0;
        const bStarts = b.toLowerCase().startsWith(lower) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        const aWords = words.filter((w) => a.toLowerCase().includes(w)).length;
        const bWords = words.filter((w) => b.toLowerCase().includes(w)).length;
        return bWords - aWords;
      })
      .slice(0, 8);

    res.json({ suggestions: ranked, query: q });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ suggestions: [], error: 'Failed to load suggestions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await getEmbedding(query);

    const [mongoSettled, wikiSettled] = await Promise.allSettled([
      searchInternalDocuments(query, queryEmbedding, 10),
      fetchWikipediaResults(query, 6),
    ]);

    let results = mongoSettled.status === 'fulfilled' ? mongoSettled.value : [];
    const wikipediaResults = wikiSettled.status === 'fulfilled' ? wikiSettled.value : [];

    results = attachRelevanceScores(query, results).sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedWiki = [...wikipediaResults].sort((a, b) => (b.score || 0) - (a.score || 0));

    const totalMatches = results.length + sortedWiki.length;
    const actorId = userId || 'admin@velora.ai';

    SearchHistory.create({
      userId: actorId,
      query,
      activityType: 'search',
      resultCount: totalMatches,
    }).catch((err) => console.error('Failed to log search history:', err));

    res.json({
      query,
      resultsCount: results.length,
      wikipediaCount: wikipediaResults.length,
      totalMatches,
      results,
      wikipediaResults: sortedWiki,
    });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

module.exports = router;
