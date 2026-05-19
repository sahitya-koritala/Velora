const Document = require('../models/Document');
const Policy = require('../models/Policy');
const SearchHistory = require('../models/SearchHistory');
const { getEmbedding } = require('./embeddings');

const SEED_DOCUMENTS = [
  {
    title: 'Company Leave Policy 2026',
    content:
      'Employees receive 20 days paid time off per year. Sick leave is 10 days. Submit leave requests to HR at least two weeks in advance.',
    metadata: { category: 'legal', source: 'HR Dept', tags: ['hr', 'policy'] },
  },
  {
    title: 'Password Reset & 2FA Guide',
    content:
      'Use Forgot Password on the login page to receive a reset link. Enable two-factor authentication with an authenticator app for better security.',
    metadata: { category: 'technical', source: 'IT Support', tags: ['security'] },
  },
  {
    title: 'Q3 Financial Performance Report',
    content:
      'Revenue grew 15% in Q3. Operating margins reached 22%. Enterprise software subscriptions drove most of the growth.',
    metadata: { category: 'business', source: 'Finance', tags: ['finance', 'q3'] },
  },
  {
    title: 'Remote Work Guidelines',
    content:
      'Employees may work remotely up to 3 days per week. Core hours are 10 AM to 3 PM EST. Use a stable connection for video calls.',
    metadata: { category: 'operations', source: 'Management', tags: ['remote'] },
  },
];

const SEED_POLICIES = [
  {
    name: 'Boost Recent Documents',
    description: 'Increase ranking weight for documents added in the last 30 days.',
    rule_type: 'boost',
    status: 'active',
    source: 'system',
  },
  {
    name: 'Penalize Low Relevance',
    description: 'Reduce score when vector similarity is below 0.5.',
    rule_type: 'penalize',
    status: 'active',
    source: 'system',
  },
  {
    name: 'Filter Confidential Content',
    description: 'Hide confidential documents from standard search results.',
    rule_type: 'filter',
    status: 'pending_approval',
    source: 'system',
  },
];

async function seedIfEmpty() {
  try {
    const docCount = await Document.countDocuments();
    if (docCount === 0) {
      console.log('Seeding sample documents...');
      for (const doc of SEED_DOCUMENTS) {
        const embedding = await getEmbedding(doc.content);
        const created = await Document.create({
          title: doc.title,
          content: doc.content,
          metadata: { ...doc.metadata, dateAdded: new Date(), access_level: 'public' },
          embedding,
        });
        await SearchHistory.create({
          userId: 'system@velora.ai',
          query: `Added Document: ${created.title}`,
          activityType: 'document',
          refId: String(created._id),
          resultCount: 1,
        }).catch(() => {});
      }
      console.log(`Seeded ${SEED_DOCUMENTS.length} documents.`);
    }

    const policyCount = await Policy.countDocuments();
    if (policyCount === 0) {
      console.log('Seeding sample policies...');
      for (const policy of SEED_POLICIES) {
        const created = await Policy.create(policy);
        await SearchHistory.create({
          userId: 'system@velora.ai',
          query: `Created Policy: ${created.name}`,
          activityType: 'policy',
          refId: String(created._id),
          resultCount: 1,
        }).catch(() => {});
      }
      console.log(`Seeded ${SEED_POLICIES.length} policies.`);
    }
  } catch (err) {
    console.error('Startup seed error:', err.message);
  }
}

module.exports = { seedIfEmpty };
