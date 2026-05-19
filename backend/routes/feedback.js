const express = require('express');
const Feedback = require('../models/Feedback');
const SearchHistory = require('../models/SearchHistory');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, message, status } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const entry = await Feedback.create({
      name: name || 'Anonymous',
      email: email || '',
      message: message.trim(),
      status: status || 'new',
    });

    const actorId = email?.trim() || name?.trim() || 'feedback@velora.ai';
    await SearchHistory.create({
      userId: actorId,
      query: `Feedback: ${entry.message.substring(0, 60)}`,
      activityType: 'feedback',
      refId: String(entry._id),
      resultCount: 1,
    }).catch((err) => console.error('Failed to log feedback activity:', err));

    res.status(201).json(entry);
  } catch (error) {
    console.error('Feedback create error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

module.exports = router;
