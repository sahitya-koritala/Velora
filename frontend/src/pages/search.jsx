import React, { useState, useCallback, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Clock, Database, Globe } from "lucide-react";

import SearchBar from "../components/Search/SearchBar";
import SearchResultCard from "../components/Search/SearchResultCard";
import WikipediaResultCard from "../components/Search/WikipediaResultCard";
import QueryWarning from "../components/Search/QueryWarning";
import { getCurrentUserId } from "@/Api/apiClient";

function mapInternalResult(doc) {
  const meta = doc.metadata || {};
  const explanations = {
    semantic: "Matched via MongoDB Atlas semantic vector search",
    keyword: "Matched via keywords in your internal document title or content",
  };

  return {
    document: {
      ...doc,
      id: doc._id || doc.id,
      category: meta.category || doc.category,
      source: meta.source || doc.source,
      tags: meta.tags || doc.tags,
      access_level: meta.access_level || doc.access_level,
    },
    similarityScore: doc.score ?? 0,
    explanation: explanations[doc.matchType] || explanations.semantic,
  };
}

function mapWikipediaResult(item) {
  return {
    item: {
      ...item,
      id: item._id || item.id,
      url: item.url || item.metadata?.url,
    },
    similarityScore: item.score ?? 0,
    explanation: "Matched via Wikipedia search API based on your query keywords and article relevance.",
  };
}

export default function Search() {
  const [searchMode, setSearchMode] = useState("semantic");
  const [internalResults, setInternalResults] = useState([]);
  const [wikipediaResults, setWikipediaResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [warning, setWarning] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: pastQueries = [] } = useQuery({
    queryKey: ["past-queries"],
    queryFn: async () => {
      const API_BASE = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${API_BASE}/api/history`);
      const data = res.ok ? await res.json() : [];
      return data
        .filter((q) => !q.activityType || q.activityType === "search")
        .map((q) => ({
          id: q._id,
          query_text: q.query,
          was_successful: q.resultCount > 0,
        }));
    },
  });

  const handleSearch = useCallback(
    async (query) => {
      setIsSearching(true);
      setWarning(null);
      setSuggestions([]);
      setCurrentQuery(query);
      setInternalResults([]);
      setWikipediaResults([]);

      try {
        const API_BASE = import.meta.env.VITE_API_URL ?? "";
        const userId = await getCurrentUserId();
        const response = await fetch(`${API_BASE}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, userId }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        const internal = (data.results || []).map(mapInternalResult);
        const wiki = (data.wikipediaResults || []).map(mapWikipediaResult);
        const totalMatches = internal.length + wiki.length;

        setInternalResults(internal);
        setWikipediaResults(wiki);

        if (totalMatches === 0) {
          const failedQueries = pastQueries.filter(
            (q) =>
              !q.was_successful &&
              q.query_text.toLowerCase().includes(query.toLowerCase().split(" ")[0])
          );
          if (failedQueries.length >= 2) {
            setWarning(
              `Similar queries have returned poor results ${failedQueries.length} times before.`
            );
            setSuggestions(
              pastQueries
                .filter((q) => q.was_successful)
                .slice(0, 3)
                .map((q) => q.query_text)
            );
          }
        } else {
          setWarning(null);
          setSuggestions([]);
        }
      } catch (err) {
        console.error(err);
        setWarning(
          "Search API is currently unavailable or MongoDB Atlas is not configured properly."
        );
      } finally {
        setIsSearching(false);
      }

      queryClient.invalidateQueries({ queryKey: ["past-queries"] });
      queryClient.invalidateQueries({ queryKey: ["all-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    [pastQueries, queryClient]
  );

  const handleFeedback = async (docId, type) => {
    const recentQuery = pastQueries.find((q) => q.query_text === currentQuery);
    if (recentQuery && window.entities?.SearchQuery?.update) {
      await window.entities.SearchQuery.update(recentQuery.id, {
        feedback_rating: type === "up" ? 5 : 1,
        was_successful: type === "up",
      });
    }
  };

  const handleSuggestionSearch = (suggestion) => {
    setWarning(null);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) handleSearch(q);
  }, [handleSearch]);

  const hasInternal = internalResults.length > 0;
  const hasWiki = wikipediaResults.length > 0;
  const hasAnyResults = hasInternal || hasWiki;
  const showHero = !currentQuery && !isSearching;
  const showResultsLayout = currentQuery && !isSearching;

  return (
    <div className="min-h-screen bg-transparent">
      <div
        className={`transition-all duration-500 ${showResultsLayout ? "pt-8 pb-6" : "pt-24 pb-16"}`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {showHero && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Semantic Search Engine
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-primary-dark tracking-tight">
                Find what you <span className="text-[#10B981]">mean</span>,<br />
                not just what you type.
              </h1>
              <p className="text-lg text-secondary-blue mt-4 max-w-2xl mx-auto">
                Search your MongoDB documents and related Wikipedia knowledge together.
              </p>
            </motion.div>
          )}

          <SearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
            pastQueries={pastQueries.map((q) => q.query_text)}
            searchMode={searchMode}
            onModeChange={setSearchMode}
          />

          <AnimatePresence>
            {warning && (
              <QueryWarning
                warning={warning}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionSearch}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {isSearching && (
          <div className="flex flex-col items-center py-16">
            <div className="relative w-16 h-16">
              <motion.div className="absolute inset-0 rounded-full border-4 border-[#10B981]/30" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#10B981] animate-spin" />
            </div>
            <p className="text-sm text-secondary-blue mt-4">
              Searching MongoDB Atlas and Wikipedia...
            </p>
          </div>
        )}

        {showResultsLayout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <section>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-[#10B981]" />
                  <h2 className="text-lg font-semibold text-primary-dark">
                    Internal Documents
                  </h2>
                  <span className="text-sm text-secondary-blue">
                    ({internalResults.length} from MongoDB Atlas)
                  </span>
                </div>
              {hasInternal ? (
                <div className="space-y-3">
                  {internalResults.map((r, i) => (
                    <SearchResultCard
                      key={r.document?.id || r.document?._id || `doc-${i}`}
                      document={r.document}
                      rank={i + 1}
                      similarityScore={r.similarityScore}
                      explanation={r.explanation}
                      currentQuery={currentQuery}
                      onFeedback={handleFeedback}
                      onView={(doc) => setSelectedDoc(doc)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-blue rounded-lg border border-divider bg-white/60 px-4 py-3">
                  No internal documents matched this query.
                </p>
              )}
            </section>

            <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-sky-600" />
                  <h2 className="text-lg font-semibold text-primary-dark">
                    External Knowledge
                  </h2>
                  <span className="text-sm text-sky-700">
                    ({wikipediaResults.length} from Wikipedia)
                  </span>
                </div>
              {hasWiki ? (
                <div className="space-y-3">
                  {wikipediaResults.map((r, i) => (
                    <WikipediaResultCard
                      key={r.item?.id || `wiki-${i}`}
                      item={r.item}
                      rank={i + 1}
                      similarityScore={r.similarityScore}
                      explanation={r.explanation}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-sky-700 rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3">
                  No Wikipedia articles matched this query.
                </p>
              )}
            </section>
          </motion.div>
        )}

        {!isSearching && !currentQuery && pastQueries.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-primary-dark mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {pastQueries.slice(0, 6).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSearch(q.query_text)}
                  className="px-3 py-1.5 rounded-full bg-white/60 border border-divider text-sm text-primary-dark hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors shadow-sm"
                >
                  {q.query_text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedDoc(null)}
          role="presentation"
        />
      )}
    </div>
  );
}
