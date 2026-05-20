require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const searchRoutes = require('./routes/search');
const documentsRoutes = require('./routes/documents');
const historyRoutes = require('./routes/history');
const policiesRoutes = require('./routes/policies');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const { seedIfEmpty } = require('./lib/seedOnStartup');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully.');
    await seedIfEmpty();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/search', searchRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Velora Backend API' });
});

const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Velora Backend Server running on port ${PORT}`);
});
