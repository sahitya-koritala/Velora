/**
 * Normalize raw scores to 0–1 relevance for UI display.
 */
function normalizeScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return 0;
  let s = Number(raw);
  if (s > 1 && s <= 100) s = s / 100;
  if (s > 1) s = 1;
  return Math.min(0.99, Math.max(0, s));
}

/**
 * Relevance from vector score, rank, and query–text overlap (never filters results out).
 */
function computeDocumentRelevance(query, doc, vectorScore, rankIndex) {
  let base = normalizeScore(vectorScore);

  if (base < 0.05) {
    base = Math.max(0.28, 0.9 - rankIndex * 0.07);
  }

  const qWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const haystack = `${doc.title || ''} ${doc.content || ''}`.toLowerCase();
  if (qWords.length > 0) {
    const matched = qWords.filter((w) => haystack.includes(w)).length;
    base += (matched / qWords.length) * 0.18;
  }

  return Math.min(0.99, Math.max(0.12, base));
}

function attachRelevanceScores(query, documents) {
  return documents.map((doc, index) => ({
    ...doc,
    score: computeDocumentRelevance(query, doc, doc.score, index),
  }));
}

module.exports = {
  normalizeScore,
  computeDocumentRelevance,
  attachRelevanceScores,
};
