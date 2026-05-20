const express = require('express');
const axios = require('axios');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/\w+/g) || [];
}

function buildHelpAnswer(userText) {
  const raw = String(userText || '').trim();
  const tokens = tokenize(raw);
  const t = tokens.join(' ');

  // Simple intent scoring: choose the best matching topic instead of returning the first regex hit.
  const intents = [
    {
      id: 'search',
      keywords: ['search', 'query', 'find', 'results', 'relevance', 'accuracy'],
      answer:
        "To search, open Search from the sidebar and type your query. You can click a suggestion under the search bar, or type your own. Each result shows a relevance %.",
    },
    {
      id: 'suggestions',
      keywords: ['suggest', 'suggestions', 'autocomplete', 'recommend', 'recommendation'],
      answer:
        "Search suggestions appear as you type in the Search bar. Try typing 2–3 characters. Suggestions come from recent searches and document text.",
    },
    {
      id: 'documents_add',
      keywords: ['upload', 'add', 'create', 'document', 'documents', 'pdf', 'file'],
      answer:
        "To add internal documents, go to Documents and add/upload a document. After adding, search using words that appear in the document title or content.",
    },
    {
      id: 'documents_delete',
      keywords: ['delete', 'remove', 'clear', 'document', 'documents'],
      answer: "To delete documents, open Documents and delete the selected document(s).",
    },
    {
      id: 'history',
      keywords: ['history', 'recent', 'timeline', 'activity', 'clear', 'delete'],
      answer: "To view or clear searches, open History.",
    },
    {
      id: 'dashboard',
      keywords: ['dashboard', 'stats', 'chart', 'today', 'activity'],
      answer: "Open Dashboard to view searches today, activity, and charts.",
    },
    {
      id: 'policies',
      keywords: ['policy', 'policies', 'rules', 'governance'],
      answer: "Open Policies to view governance rules and configuration.",
    },
    {
      id: 'feedback',
      keywords: ['feedback', 'thumb', 'thumbs', 'rating', 'like', 'dislike'],
      answer: "You can leave feedback on results with thumbs up/down.",
    },
    {
      id: 'auth',
      keywords: ['login', 'signin', 'sign', 'logout', 'profile', 'account', 'user'],
      answer: "Use Profile for account info, and the Sign Out button in the sidebar to log out.",
    },
    {
      id: 'internal_search_troubleshoot',
      keywords: ['mongodb', 'atlas', 'internal', 'vector', 'embedding', 'index', 'not', 'showing', 'missing'],
      answer:
        "If internal results aren’t showing: 1) confirm your docs are visible in Documents, 2) search using a keyword that exists in the doc title/content, 3) verify MongoDB Atlas vector index is configured (if using semantic search).",
    },
  ];

  const scoreIntent = (intent) => {
    let score = 0;
    for (const kw of intent.keywords) {
      if (t.includes(kw)) score += 1;
    }
    // Boost when user explicitly asks "how" or "why" etc.
    if (tokens.includes('how') || tokens.includes('why') || tokens.includes('what')) score += 0.25;
    return score;
  };

  const ranked = intents
    .map((i) => ({ ...i, score: scoreIntent(i) }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0]?.score >= 1) {
    return ranked[0].answer;
  }

  const hint = tokens.slice(0, 6).join(' ');
  return (
    `I didn’t fully understand that one, but I can help.\n\n` +
    `Your question: \"${raw || hint}\"\n\n` +
    `Try asking like:\n` +
    `- \"How do I upload documents?\"\n` +
    `- \"Why are internal search results not showing?\"\n` +
    `- \"How do search suggestions work?\"`
  );
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
      const reply = buildHelpAnswer(message);
      return res.json({ reply, source: 'fallback' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate reply' });
  }
});

module.exports = router;

