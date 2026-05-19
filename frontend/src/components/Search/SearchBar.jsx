import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Sparkles, Zap, ArrowRight, X, Brain, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/Api/apiClient";

export default function SearchBar({
  onSearch,
  isLoading,
  pastQueries = [],
  searchMode = "semantic",
  onModeChange,
}) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (text) => {
    if (!text || text.trim().length < 2) {
      setAiSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const suggestions = await apiClient.search.suggestions(text);
      setAiSuggestions(suggestions);
    } catch {
      setAiSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setAiSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  const pastMatches = query.length > 0
    ? pastQueries.filter((q) => q.toLowerCase().includes(query.toLowerCase())).slice(0, 2)
    : pastQueries.slice(0, 2);

  const displaySuggestions = [
    ...pastMatches,
    ...aiSuggestions.filter((s) => !pastMatches.includes(s)),
  ].slice(0, 8);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 2px rgba(16, 185, 129, 0.3), 0 20px 60px -15px rgba(0,0,0,0.15)"
              : "0 4px 20px -5px rgba(0,0,0,0.15)",
          }}
          className="relative rounded-2xl bg-white border border-divider overflow-hidden"
        >
          <div className="flex items-center gap-1 px-4 pt-3 pb-1">
            {["semantic", "keyword", "hybrid"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange?.(mode)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  searchMode === mode
                    ? "bg-[#10B981]/20 text-primary-dark"
                    : "text-secondary-blue hover:text-primary-dark"
                }`}
              >
                {mode === "semantic" && <Sparkles className="inline w-3 h-3 mr-1" />}
                {mode === "hybrid" && <Zap className="inline w-3 h-3 mr-1" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center px-4 pb-3">
            <Search className="w-5 h-5 text-secondary-blue mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setFocused(false);
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Ask anything in plain English..."
              className="flex-1 bg-transparent text-lg text-primary-dark placeholder:text-secondary-blue/60 outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setAiSuggestions([]);
                }}
                className="p-1 mr-2 text-secondary-blue hover:text-primary-dark"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl px-5 h-10"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </motion.div>
      </form>

      <AnimatePresence>
        {showSuggestions && (displaySuggestions.length > 0 || loadingSuggestions) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-divider shadow-xl overflow-hidden"
          >
            <div className="px-4 py-2 border-b border-divider flex items-center gap-2 bg-[#10B981]/5">
              <Brain className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#10B981]">
                AI-Powered Suggestions
              </span>
              {loadingSuggestions && (
                <span className="text-[10px] text-secondary-blue ml-auto">Analyzing...</span>
              )}
            </div>
            {loadingSuggestions && displaySuggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-secondary-blue">Finding related queries...</div>
            ) : (
              displaySuggestions.map((s, i) => {
                const isPast = pastMatches.includes(s);
                return (
                  <button
                    key={`${s}-${i}`}
                    type="button"
                    onMouseDown={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-primary-dark hover:bg-slate-50 transition-colors border-b border-divider/50 last:border-0"
                  >
                    {isPast ? (
                      <Clock className="w-3.5 h-3.5 text-secondary-blue flex-shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                    )}
                    <span className="truncate">{s}</span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
