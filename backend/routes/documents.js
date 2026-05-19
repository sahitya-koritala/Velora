const express = require('express');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');
const { getEmbedding } = require('../lib/embeddings');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const docs = await Document.find().sort({ 'metadata.dateAdded': -1 }).limit(100);
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
    const embedding = await getEmbedding(docContent);

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

    const actorId = req.body.userId || 'documents@velora.ai';
    await SearchHistory.create({
      userId: actorId,
      query: `Added Document: ${newDoc.title}`,
      activityType: 'document',
      refId: String(newDoc._id),
      resultCount: 1,
    }).catch((err) => console.error('Failed to log document activity:', err));

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Document Creation Error:', error.message);
    res.status(500).json({
      error: 'Failed to create document',
      details: error.message,
    });
  }
});

router.delete('/', async (req, res) => {
  try {
    const docs = await Document.find({}, '_id title');
    const count = docs.length;

    if (count === 0) {
      return res.json({ deleted: 0, message: 'No documents to delete' });
    }

    const refIds = docs.map((d) => String(d._id));
    await Document.deleteMany({});
    await SearchHistory.deleteMany({
      $or: [
        { activityType: 'document', refId: { $in: refIds } },
        { query: { $regex: /^Added Document:/ } },
      ],
    });

    await SearchHistory.create({
      userId: 'user-123',
      query: `Deleted all documents (${count} removed)`,
      activityType: 'document_delete',
      resultCount: count,
    }).catch(() => {});

    res.json({ deleted: count, success: true });
  } catch (error) {
    console.error('Delete all documents error:', error.message);
    res.status(500).json({ error: 'Failed to delete all documents' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await Document.findByIdAndDelete(req.params.id);
    await SearchHistory.deleteMany({
      refId: String(req.params.id),
      activityType: 'document',
    });

    await SearchHistory.create({
      userId: 'user-123',
      query: `Deleted Document: ${doc.title}`,
      activityType: 'document_delete',
      refId: String(req.params.id),
      resultCount: 0,
    }).catch(() => {});

    res.json({ success: true, title: doc.title });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
