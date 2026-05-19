const Document = require('../models/Document');
const { isZeroVector } = require('./embeddings');

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

function keywordOverlapScore(query, doc) {
  const queryLower = query.toLowerCase().trim();
  const title = (doc.title || '').toLowerCase();
  const content = (doc.content || '').toLowerCase();
  const haystack = `${title} ${content}`;

  const terms = queryLower.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0.15;

  let matched = 0;
  for (const term of terms) {
    if (haystack.includes(term)) matched += 1;
  }

  let score = 0.25 + (matched / terms.length) * 0.55;
  if (title.includes(queryLower)) score += 0.15;
  if (title === queryLower) score += 0.1;

  return Math.min(0.95, Math.max(0.15, score));
}

/**
 * Keyword search — matches any query word in title or content (always runs).
 */
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

  let docs = await Document.find({ $or: orClauses }).limit(limit * 3).lean();

  if (docs.length === 0 && query.trim().length > 0) {
    const phrase = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    docs = await Document.find({ $or: [{ title: phrase }, { content: phrase }] })
      .limit(limit)
      .lean();
  }

  return docs
    .map((doc) => ({
      ...doc,
      score: keywordOverlapScore(query, doc),
      matchType: 'keyword',
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

function mergeResults(existingMap, docs, defaultMatchType) {
  for (const doc of docs) {
    const id = String(doc._id);
    const score = doc.score ?? 0;
    const prev = existingMap.get(id);
    if (!prev || score > (prev.score || 0)) {
      existingMap.set(id, {
        ...doc,
        matchType: doc.matchType || defaultMatchType,
        score,
      });
    }
  }
}

/**
 * Hybrid internal search: keyword (reliable) + vector (semantic) merged by best score.
 */
async function searchInternalDocuments(query, queryEmbedding, limit = 10) {
  const merged = new Map();

  try {
    const keywordHits = await keywordSearchDocuments(query, limit);
    mergeResults(merged, keywordHits, 'keyword');
  } catch (err) {
    console.warn('Internal keyword search failed:', err.message);
  }

  if (!isZeroVector(queryEmbedding)) {
    try {
      const vectorHits = await vectorSearchDocuments(queryEmbedding, limit);
      const normalized = vectorHits.map((doc) => ({
        ...doc,
        matchType: 'semantic',
        score: doc.score ?? 0,
      }));
      mergeResults(merged, normalized, 'semantic');
    } catch (err) {
      console.warn('Internal vector search failed:', err.message);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

module.exports = {
  searchInternalDocuments,
  keywordSearchDocuments,
  vectorSearchDocuments,
};
