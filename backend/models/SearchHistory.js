const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
  userId: { type: String },
  query: { type: String, required: true },
  activityType: { type: String, default: 'search' },
  refId: { type: String },
  createdAt: { type: Date, default: Date.now },
  resultCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
