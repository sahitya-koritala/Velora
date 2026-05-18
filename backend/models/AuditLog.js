const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'SEARCH_PERFORMED', 'DOCUMENT_ADDED', 'LOGIN'
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
