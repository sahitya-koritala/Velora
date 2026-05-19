const express = require('express');
const Policy = require('../models/Policy');
const SearchHistory = require('../models/SearchHistory');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, rule_type, source, status } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Policy name is required' });
    }

    const newPolicy = await Policy.create({
      name: name.trim(),
      description: description?.trim() || 'No description provided',
      rule_type: rule_type || 'boost',
      source: source || 'manual',
      status: status || 'pending_approval',
    });

    const actorId = req.body.userId || 'policies@velora.ai';
    await SearchHistory.create({
      userId: actorId,
      query: `Created Policy: ${newPolicy.name}`,
      activityType: 'policy',
      refId: String(newPolicy._id),
      resultCount: 1,
    }).catch((err) => console.error('Failed to log policy activity:', err));

    res.status(201).json(newPolicy);
  } catch (error) {
    console.error('Policy create error:', error.message);
    res.status(500).json({ error: 'Failed to create policy', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedPolicy = await Policy.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedPolicy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

module.exports = router;
