const express = require('express');
const SearchHistory = require('../models/SearchHistory');
const Document = require('../models/Document');
const Policy = require('../models/Policy');
const Feedback = require('../models/Feedback');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ createdAt: -1 }).limit(100);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/activity', async (req, res) => {
  try {
    const { query, activityType, refId, userId, resultCount } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }
    const entry = await SearchHistory.create({
      query,
      activityType: activityType || 'search',
      refId,
      userId: userId || 'user-123',
      resultCount: resultCount ?? 0,
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

router.delete('/', async (req, res) => {
  try {
    await SearchHistory.deleteMany({});
    await Feedback.deleteMany({}).catch(() => {});
    res.json({ message: 'History cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await SearchHistory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'History item not found' });
    }

    if (item.activityType === 'document' && item.refId) {
      await Document.findByIdAndDelete(item.refId).catch(() => {});
    } else if (item.activityType === 'policy' && item.refId) {
      await Policy.findByIdAndDelete(item.refId).catch(() => {});
    } else if (item.activityType === 'feedback' && item.refId) {
      await Feedback.findByIdAndDelete(item.refId).catch(() => {});
    }

    await SearchHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'History item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

module.exports = router;
