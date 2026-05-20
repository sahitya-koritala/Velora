const express = require('express');
const axios = require('axios');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/\w+/g) || [];
}

function pickVariant(text, seed) {
  const variants = Array.isArray(text) ? text : [text];
  if (variants.length <= 1) return variants[0] || '';
  let h = 0;
  for (const ch of String(seed || 'seed')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return variants[h % variants.length];
}

function buildHelpAnswer(userText, history = []) {
  const raw = String(userText || '').trim();
  const tokens = tokenize(raw);
  const t = tokens.join(' ');

  const phrase = (arr) => pickVariant(arr, `${raw}:${tokens.length}`);
  const has = (w) => t.includes(w);
  const asksWhy = /\b(why|issue|error|problem|not|missing|fail)\b/.test(t);

  // Greeting / casual conversation
  if (/\b(hi|hello|hey)\b/.test(t) || /\bgood\s+(morning|afternoon|evening)\b/.test(t)) {
    return phrase([
      "Hello! 👋 I’m Velora Helper. How can I assist you today?",
      "Hi there! 👋 I’m Velora Helper. What would you like help with?",
      "Hey! I’m Velora Helper. Tell me what you’re trying to do in Velora.",
    ]);
  }
  if (/\b(thanks|thank\s*you|thx|ty)\b/.test(t)) {
    return phrase([
      "You’re welcome! Happy to help.",
      "Anytime! If you want, I can also suggest next troubleshooting steps.",
      "Glad I could help. Ask me anything else about Velora.",
    ]);
  }
  if (/\b(bye|goodbye|see\s*you)\b/.test(t)) {
    return phrase([
      "Got it — see you soon!",
      "Bye! I’m here whenever you need help.",
      "Take care! Come back anytime for help with Velora.",
    ]);
  }

  // Topic entities from current question + recent user context
  const recentUserText = history
    .filter((m) => m && m.role === 'user')
    .slice(-3)
    .map((m) => m.text || '')
    .join(' ')
    .toLowerCase();
  const context = `${t} ${recentUserText}`;
  const entity = {
    semantic: /\b(semantic|meaning|similarity)\b/.test(context),
    embeddings: /\b(embedding|embeddings|vectorize|vectorise|model)\b/.test(context),
    vector: /\b(vector|vectors|vectorsearch)\b/.test(context),
    mongo: /\b(mongodb|atlas|index)\b/.test(context),
    docs: /\b(document|documents|upload|uploaded|file|pdf)\b/.test(context),
    dashboard: /\b(dashboard|stats|chart|analytics)\b/.test(context),
    history: /\b(history|timeline|recent|activity)\b/.test(context),
    policies: /\b(policy|policies|rule|rules)\b/.test(context),
    feedback: /\b(feedback|rating|thumb|thumbs)\b/.test(context),
    wiki: /\b(wikipedia|external|internet)\b/.test(context),
    troubleshoot: /\b(not|missing|issue|error|problem|failed|empty|showing)\b/.test(context),
  };

  const intentScores = {
    explain_documents: 0,
    explain_semantic: 0,
    explain_embeddings: 0,
    explain_mongodb: 0,
    explain_dashboard_history: 0,
    explain_policies_feedback: 0,
    explain_wikipedia: 0,
    troubleshoot_search: 0,
    general_help: 0,
  };

  if (entity.docs) intentScores.explain_documents += 2;
  if (entity.semantic || has('search')) intentScores.explain_semantic += 1.5;
  if (entity.embeddings) intentScores.explain_embeddings += 2;
  if (entity.mongo || entity.vector) intentScores.explain_mongodb += 2;
  if (entity.dashboard || entity.history) intentScores.explain_dashboard_history += 2;
  if (entity.policies || entity.feedback) intentScores.explain_policies_feedback += 2;
  if (entity.wiki) intentScores.explain_wikipedia += 2;
  if (entity.troubleshoot || asksWhy) intentScores.troubleshoot_search += 2;
  if (/\b(help|how|what|guide)\b/.test(t)) intentScores.general_help += 1;

  const topIntent = Object.entries(intentScores).sort((a, b) => b[1] - a[1])[0]?.[0];

  switch (topIntent) {
    case 'explain_documents':
      return phrase([
        "Documents are your internal knowledge source in Velora. When you upload documents, they become searchable so users can retrieve relevant information quickly by query keywords (and semantic signals when available).",
        "In Velora, uploaded documents act as the core knowledge base. Search uses their title/content to return the most relevant matches and show relevance percentages.",
      ]);
    case 'explain_semantic':
      return phrase([
        "Semantic search matches intent/meaning, not just exact words. That helps return useful results even when your query wording differs from document wording.",
        "Semantic search in Velora uses vector similarity to find conceptually related content, then ranks results by relevance score.",
      ]);
    case 'explain_embeddings':
      return phrase([
        "AI embeddings convert text into vectors so similar ideas are close mathematically. Velora uses these vectors for semantic retrieval and ranking.",
        "Embeddings are numeric representations of text. Velora generates them to power vector-based search and improve relevance beyond exact keyword match.",
      ]);
    case 'explain_mongodb':
      return phrase([
        "MongoDB Atlas stores documents and supports vector search (via vector index). Velora queries Atlas to retrieve top matching internal documents for each search.",
        "Velora relies on MongoDB Atlas for data + vector retrieval. Properly stored documents and index configuration are important for strong internal search quality.",
      ]);
    case 'explain_dashboard_history':
      return entity.dashboard
        ? phrase([
            "Dashboard summarizes search activity (like searches today and trend charts) so you can track usage and quality over time.",
            "Use Dashboard to monitor search metrics and activity trends. It gives a quick view of how the system is being used.",
          ])
        : phrase([
            "History keeps past searches and activity events so users can revisit queries and clear old entries when needed.",
            "Search History helps audit and revisit previous queries. It is useful for tracking what worked and what needs improvement.",
          ]);
    case 'explain_policies_feedback':
      return entity.feedback
        ? phrase([
            "Feedback (thumbs up/down) helps indicate whether results were useful. It can be used to evaluate and improve relevance behavior.",
            "Result feedback captures user satisfaction per search outcome and helps you identify where retrieval quality needs tuning.",
          ])
        : phrase([
            "Policies define governance/ranking behavior in the platform. They help control how results are prioritized or filtered.",
            "Use Policies to manage rule-based behavior in search workflows and maintain consistency across results.",
          ]);
    case 'explain_wikipedia':
      return phrase([
        "In the current version, external Wikipedia integration is disabled, so Velora focuses on internal document search only.",
        "Right now this build runs without external Wikipedia results. If needed, that integration can be re-enabled in a controlled update.",
      ]);
    case 'troubleshoot_search':
      return phrase([
        "If results are not showing: check that documents exist in Documents, use a keyword that appears in title/content, and verify Atlas/vector setup if semantic mode is expected.",
        "Common causes of empty results are missing document content, weak query terms, or vector/index configuration issues. Start by testing with an exact keyword from an uploaded document.",
      ]);
    default:
      return phrase([
        "I can help with semantic search, embeddings, MongoDB Atlas, uploaded documents, vector search, dashboard/history, policies, feedback, and troubleshooting. What do you want to fix first?",
        "Ask me about any Velora feature (search quality, documents, dashboard, history, policies, feedback, or troubleshooting), and I’ll guide you step by step.",
      ]);
  }
}

async function callAiChat({ message, history }) {
  // We don't know the exact AI service API. Try a couple of common endpoints safely.
  const payload = {
    message,
    text: message,
    query: message,
    history,
    messages: [
      { role: 'system', content: 'You are a helpful support chatbot for the Velora web app. Answer questions about using the app. Be concise and practical.' },
      ...(Array.isArray(history) ? history.map((m) => ({ role: m.role, content: m.text })) : []),
      { role: 'user', content: message },
    ],
  };
  const options = { timeout: 8000 };

  const endpoints = [`${AI_SERVICE_URL}/chat`, `${AI_SERVICE_URL}/ask`];

  let lastErr;
  for (const url of endpoints) {
    try {
      const res = await axios.post(url, payload, options);
      const reply =
        res.data?.reply ||
        res.data?.answer ||
        res.data?.response ||
        res.data?.text;
      if (typeof reply === 'string' && reply.trim()) {
        return reply.trim();
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('AI chat unavailable');
}

router.post('/', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    try {
      const reply = await callAiChat({ message, history });
      return res.json({ reply, source: 'ai' });
    } catch (e) {
      const reply = buildHelpAnswer(message, history);
      return res.json({ reply, source: 'fallback' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate reply' });
  }
});

module.exports = router;

