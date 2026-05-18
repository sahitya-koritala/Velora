const express = require('express');
const axios = require('axios');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/', async (req, res) => {
  try {
    const docs = await Document.find().sort({ 'metadata.dateAdded': -1 }).limit(50);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, category, source, tags, access_level } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const docContent = (content && String(content).trim()) || title.trim();

    // Generate embedding
    let embedding;
    try {
      const embeddingResponse = await axios.post(`${AI_SERVICE_URL}/embed`, { text: docContent });
      embedding = embeddingResponse.data.embedding;
    } catch (e) {
      console.warn("AI Service unavailable. Using dummy embedding.");
      embedding = Array(384).fill(0);
    }

    const newDoc = await Document.create({
      title: title.trim(),
      content: docContent,
      metadata: {
        category: category || 'general',
        source: source || 'User Upload',
        tags: tags || [],
        access_level: access_level || 'public',
        dateAdded: new Date(),
      },
      embedding,
    });

    await SearchHistory.create({
      userId: 'user-123',
      query: `Added Document: ${newDoc.title}`,
      activityType: 'document',
      refId: String(newDoc._id),
      resultCount: 1,
    }).catch(err => console.error("Failed to log document activity:", err));

    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Document Creation Error:", error);
    res.status(500).json({ error: 'Failed to create document and embedding' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
