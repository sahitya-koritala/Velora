import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

const STORAGE_KEY = "velora_help_chat_v1";

function nowIso() {
  return new Date().toISOString();
}

function safeLoadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((m) => m && typeof m.role === "string" && typeof m.text === "string");
  } catch {
    return null;
  }
}

function safeSaveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    // ignore storage errors
  }
}

function buildHelpAnswer(userText) {
  const t = (userText || "").toLowerCase();

  const answers = [
    {
      match: /(search|query|find)/,
      text:
        "To search, open **Search** from the sidebar and type your query. You can click a suggested query under the search bar, or type your own. Results show a **relevance %** per document.",
    },
    {
      match: /(suggest|autocomplete|recommend)/,
      text:
        "Search suggestions appear as you type in the Search bar. They’re based on your recent searches and document content, so try typing 2–3 characters to trigger them.",
    },
    {
      match: /(upload|add|create)\s+(doc|document)/,
      text:
        "To add internal documents, go to **Documents** → use the add/upload option. After adding, you can search by words that appear in the document’s **title** or **content**.",
    },
    {
      match: /(delete|remove|clear)\s+(doc|document)/,
      text:
        "To delete documents, go to **Documents**. You can delete a single document (per item) or delete all if that option is available in your build.",
    },
    {
      match: /(history|recent|timeline)/,
      text:
        "To review or clear previous searches, open **History**. You can delete individual entries or clear the list (depending on your permissions).",
    },
    {
      match: /(dashboard|stats|chart)/,
      text:
        "The **Dashboard** shows searches today, recent activity, and charts. If something looks off, try refreshing the page and re-running a search to generate activity.",
    },
    {
      match: /(policy|policies)/,
      text:
        "Open **Policies** to view governance rules. Policies can affect ranking and visibility depending on how they are configured.",
    },
    {
      match: /(feedback|thumbs|rating)/,
      text:
        "You can leave feedback on results (thumbs up/down). This helps track whether the query was successful and improves what you see in the dashboard/history.",
    },
    {
      match: /(login|sign\s*in|logout|sign\s*out)/,
      text:
        "If you’re having trouble signing in/out, go to **Profile** or use the **Sign Out** button in the sidebar. If you’re stuck, refresh and try again.",
    },
    {
      match: /(mongodb|atlas|vector)/,
      text:
        "Internal search uses MongoDB Atlas. If internal results are missing, ensure documents exist in **Documents**, and try a keyword that appears in the document text. If Atlas vector search isn’t configured, the app can still rely on keyword matches.",
    },
  ];

  for (const a of answers) {
    if (a.match.test(t)) return a.text;
  }

  return (
    "I can help with Velora usage: searching, suggestions, documents, dashboard, history, policies, and feedback.\n\n" +
    "Tell me what you’re trying to do (e.g., “How do I upload documents?” or “Why aren’t my internal results showing?”)."
  );
}

function formatMarkdownish(text) {
  // Lightweight formatting: convert **bold** and line breaks for display.
  const parts = String(text).split(/\n+/g);
  return parts.map((p, idx) => (
    <p key={idx} className={idx === 0 ? "" : "mt-2"}>
      {p.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-primary-dark">
              {chunk.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{chunk}</span>;
      })}
    </p>
  ));
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const listRef = useRef(null);
  const messagesRef = useRef([]);

  const initialMessages = useMemo(() => {
    const saved = safeLoadHistory();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: "welcome",
        role: "assistant",
        text: "Hi! I’m the Velora helper. Ask me anything about using this app (Search, Documents, Dashboard, History, etc.).",
        ts: nowIso(),
      },
    ];
  }, []);

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    messagesRef.current = messages;
    safeSaveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text, ts: nowIso() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setIsReplying(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL ?? "";
      const prev = messagesRef.current || [];
      const recent = [...prev.slice(-9), userMsg].map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: recent }),
      });

      const data = res.ok ? await res.json() : null;
      const replyText =
        (data && typeof data.reply === "string" && data.reply.trim()) || buildHelpAnswer(text);

      const botMsg = {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        text: replyText,
        ts: nowIso(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg = {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        text: buildHelpAnswer(text),
        ts: nowIso(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="fixed right-5 bottom-5 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-[320px] sm:w-[380px] max-h-[70vh] rounded-2xl glass-panel shadow-2xl border border-divider/40 overflow-hidden mb-3"
            role="dialog"
            aria-label="Velora help chat"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider/40 bg-white/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center shadow-md shadow-[#10B981]/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-primary-dark truncate">Velora Helper</div>
                  <div className="text-[11px] font-medium text-secondary-blue truncate">
                    Ask about using the app
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-secondary-blue hover:text-primary-dark hover:bg-white/40 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={listRef} className="px-4 py-3 space-y-3 overflow-y-auto max-h-[50vh]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-[#10B981] text-white"
                        : "bg-white/70 border border-divider text-secondary-blue",
                    ].join(" ")}
                  >
                    {m.role === "assistant" ? formatMarkdownish(m.text) : m.text}
                  </div>
                </div>
              ))}
              {isReplying && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm bg-white/70 border border-divider text-secondary-blue">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-3 border-t border-divider/40 bg-white/20">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Type your question…"
                  disabled={isReplying}
                  className="flex-1 h-10 rounded-xl bg-white/70 border border-divider px-3 text-sm text-primary-dark placeholder:text-secondary-blue focus:outline-none focus:ring-2 focus:ring-[#10B981]/40"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={isReplying}
                  className="h-10 w-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-[#10B981]/25 hover:bg-[#059669] transition-colors"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-2xl shadow-[#10B981]/30 hover:bg-[#059669] transition-colors"
        aria-label={open ? "Close help chat" : "Open help chat"}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}

