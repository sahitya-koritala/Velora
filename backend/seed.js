require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Document = require('./models/Document');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const seedDocuments = [
  {
    title: "Company Leave Policy 2026",
    content: "Employees are entitled to 20 days of paid time off per year. Sick leave is 10 days. Maternity leave is 6 months fully paid. To request leave, please submit a form to the HR department at least two weeks in advance.",
    metadata: { category: "legal", source: "HR Dept" }
  },
  {
    title: "How to Reset Password and Setup 2FA",
    content: "If you forgot your password, go to the login page and click 'Forgot Password'. A reset link will be sent to your email. We strongly recommend setting up Two-Factor Authentication (2FA) using an authenticator app for extra security.",
    metadata: { category: "technical", source: "IT Support" }
  },
  {
    title: "Q3 Financial Performance Report",
    content: "Our revenue grew by 15% in Q3 compared to Q2. Operating margins improved to 22%. The biggest driver of growth was our enterprise software division, which saw a 30% increase in new subscriptions.",
    metadata: { category: "business", source: "Finance" }
  },
  {
    title: "Remote Work Guidelines",
    content: "Employees can work remotely up to 3 days a week. Core hours are 10 AM to 3 PM EST. Please ensure you have a stable internet connection and a quiet background for video meetings.",
    metadata: { category: "operations", source: "Management" }
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Clearing old documents...");
    await Document.deleteMany({}); // Optional: clear existing
    
    console.log("Generating embeddings and saving documents...");
    for (const doc of seedDocuments) {
      console.log(`Processing: ${doc.title}`);
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/embed`, { text: doc.content });
        const embedding = response.data.embedding;
        
        await Document.create({
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          embedding: embedding
        });
        console.log(`Saved: ${doc.title}`);
      } catch (err) {
        console.error(`Failed to generate embedding for ${doc.title}:`, err.message);
      }
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
}

seed();
