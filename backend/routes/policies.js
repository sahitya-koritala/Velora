const express = require('express');
const Policy = require('../models/Policy');
const SearchHistory = require('../models/SearchHistory');
const router = express.Router();

// GET all policies
router.get('/', async (req, res) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// POST new policy
router.post('/', async (req, res) => {
  try {
    const { name, description, rule_type, source } = req.body;
    const newPolicy = await Policy.create({ name, description, rule_type, source });

    await SearchHistory.create({
      userId: 'user-123',
      query: `Created Policy: ${newPolicy.name}`,
      activityType: 'policy',
      refId: String(newPolicy._id),
      resultCount: 1,
    }).catch(err => console.error("Failed to log policy activity:", err));

    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// PUT update policy status
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

// DELETE policy
router.delete('/:id', async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

module.exports = router;
