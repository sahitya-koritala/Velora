const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  metadata: {
    category: { type: String, default: "General" },
    source: { type: String, default: "Internal" },
    author: { type: String, default: "Admin" },
    dateAdded: { type: Date, default: Date.now }
  },
  // This is the crucial field for MongoDB Atlas Vector Search
  embedding: {
    type: [Number], // Array of floats
    required: true
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
