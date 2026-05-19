const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const EMBEDDING_SIZE = 384;

function dummyEmbedding() {
  return Array(EMBEDDING_SIZE).fill(0);
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
    if (Array.isArray(embedding) && embedding.length > 0) {
      return embedding;
    }
  } catch (e) {
    console.warn('AI embed unavailable, using dummy vector:', e.code || e.message);
  }
  return dummyEmbedding();
}

module.exports = { getEmbedding, dummyEmbedding, EMBEDDING_SIZE };
