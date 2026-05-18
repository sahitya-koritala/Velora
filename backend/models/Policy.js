const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: 'No description provided' },
  rule_type: { type: String, required: true, default: 'boost' },
  status: { type: String, default: 'pending_approval' },
  source: { type: String, default: 'manual' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Policy', policySchema);
