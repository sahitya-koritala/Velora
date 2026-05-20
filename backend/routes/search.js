const express = require('express');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');
const { getEmbedding } = require('../lib/embeddings');
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
        title: 1,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
  return Document.aggregate(searchPipeline);
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

    let results = [];
    try {
      results = await vectorSearchDocuments(queryEmbedding, 10);
    } catch (vectorErr) {
      console.warn('Vector search failed, using text fallback:', vectorErr.message);
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      results = await Document.find({
        $or: [{ title: regex }, { content: regex }],
      })
        .limit(10)
        .lean();
      results = results.map((d, i) => ({ ...d, score: 1 - i * 0.05 }));
    }

    const actorId = userId || 'admin@velora.ai';

    SearchHistory.create({
      userId: actorId,
      query,
      activityType: 'search',
      resultCount: results.length,
    }).catch((err) => console.error('Failed to log search history:', err));

    res.json({
      query,
      resultsCount: results.length,
      results,
    });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

module.exports = router;
