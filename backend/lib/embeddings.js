const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const EMBEDDING_SIZE = 384;

/**
 * Deterministic local embedding when the AI service is unavailable.
 * Keeps query vectors comparable to document vectors created offline.
 */
function hashEmbedding(text) {
  const vec = Array(EMBEDDING_SIZE).fill(0);
  const tokens = String(text)
    .toLowerCase()
    .match(/\w+/g) || ['empty'];

  for (const token of tokens) {
    for (let i = 0; i < token.length; i++) {
      const idx = (token.charCodeAt(i) * 31 + token.length + i) % EMBEDDING_SIZE;
      vec[idx] += 1;
    }
  }

  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function isZeroVector(embedding) {
  return !Array.isArray(embedding) || embedding.length === 0 || embedding.every((v) => v === 0);
}

async function getEmbedding(text) {
  const input = (text && String(text).trim()) || 'empty';
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/embed`,
      { text: input },
      { timeout: 2500 }
    );
    const embedding = response.data?.embedding;
    if (Array.isArray(embedding) && embedding.length > 0 && !isZeroVector(embedding)) {
      return embedding;
    }
  } catch (e) {
    console.warn('AI embed unavailable, using hash embedding:', e.code || e.message);
  }
  return hashEmbedding(input);
}

module.exports = {
  getEmbedding,
  hashEmbedding,
  isZeroVector,
  EMBEDDING_SIZE,
};
