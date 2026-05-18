const express = require('express');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');
const { getEmbedding } = require('../lib/embeddings');

const router = express.Router();

/**
 * Main Semantic Search Endpoint
 * 1. Takes user query
 * 2. Calls Python AI service to get vector embedding
 * 3. Uses MongoDB Atlas Vector Search to find similar documents
 */
router.post('/', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await getEmbedding(query);

    // Step 2: Perform MongoDB Atlas Vector Search
    // Note: The index 'vector_index' has been successfully created in your database!
    const searchPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10
        }
      },
      {
        $project: {
          title: 1,
          content: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' } // Include the similarity score
        }
      }
    ];

    const results = await Document.aggregate(searchPipeline);

    // Step 3: Log the search history
    SearchHistory.create({
      userId: userId || 'user-123',
      query,
      activityType: 'search',
      resultCount: results.length,
    }).catch(err => console.error("Failed to log search history:", err));

    res.json({
      query,
      resultsCount: results.length,
      results
    });

  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

module.exports = router;
