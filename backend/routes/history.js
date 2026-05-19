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

/** Dashboard metrics: searches only (not document/policy uploads) */
router.get('/dashboard', async (req, res) => {
  try {
    const searches = await SearchHistory.find({ activityType: 'search' })
      .sort({ createdAt: -1 })
      .lean();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const searchesToday = searches.filter((s) => new Date(s.createdAt) >= startOfToday);
    const successful = searches.filter((s) => (s.resultCount ?? 0) > 0);
    const successRate =
      searches.length > 0 ? Math.round((successful.length / searches.length) * 100) : 0;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayItems = searches.filter((s) => {
        const t = new Date(s.createdAt);
        return t >= dayStart && t < dayEnd;
      });

      chartData.push({
        day: dayLabels[dayStart.getDay()],
        date: dayStart.toISOString(),
        queries: dayItems.length,
        successful: dayItems.filter((s) => (s.resultCount ?? 0) > 0).length,
      });
    }

    const recentSearches = searches.slice(0, 10).map((s) => ({
      id: s._id,
      query_text: s.query,
      was_successful: (s.resultCount ?? 0) > 0,
      result_count: s.resultCount ?? 0,
      created_date: s.createdAt,
      user_id: s.userId,
    }));

    res.json({
      searchesToday: searchesToday.length,
      totalSearches: searches.length,
      successRate,
      chartData,
      recentSearches,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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
