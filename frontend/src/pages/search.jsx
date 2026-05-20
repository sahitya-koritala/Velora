import React, { useState, useCallback, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, FileText, Clock } from "lucide-react";

import SearchBar from "../components/Search/SearchBar";
import SearchResultCard from "../components/Search/SearchResultCard";
import QueryWarning from "../components/Search/QueryWarning";
import { getCurrentUserId } from "@/Api/apiClient";

export default function Search() {
 const [searchMode, setSearchMode] = useState("semantic");
 const [results, setResults] = useState([]);
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

 const handleSearch = useCallback(async (query) => {
 setIsSearching(true);
 setWarning(null);
 setSuggestions([]);
 setCurrentQuery(query);

 // Check for historically failed queries (Module 6: Consequence-Aware Warning)
 const failedQueries = pastQueries.filter(
 (q) => !q.was_successful && q.query_text.toLowerCase().includes(query.toLowerCase().split(" ")[0])
 );
 if (failedQueries.length >= 2) {
 setWarning(`Similar queries have returned poor results ${failedQueries.length} times before.`);
 const successfulAlt = pastQueries.filter((q) => q.was_successful).slice(0, 3).map((q) => q.query_text);
 setSuggestions(successfulAlt);
 }

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
 
 const rankedResults = (data.results || []).map((doc) => ({
 document: doc,
 similarityScore: doc.score,
 explanation: "Matched via Semantic Vector Search",
 }));

 setResults(rankedResults);
 } catch (err) {
 console.error(err);
 setWarning("Search API is currently unavailable or MongoDB Atlas is not configured properly.");
 } finally {
 setIsSearching(false);
 }

 queryClient.invalidateQueries({ queryKey: ["past-queries"] });
 queryClient.invalidateQueries({ queryKey: ["all-history"] });
 queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
 queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
 }, [searchMode, pastQueries, queryClient]);

 const handleFeedback = async (docId, type) => {
 // Find the query and update feedback
 const recentQuery = pastQueries.find((q) => q.query_text === currentQuery);
 if (recentQuery) {
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

 return (
 <div className="min-h-screen bg-transparent ">
 {/* Hero search area */}
 <div className={`transition-all duration-500 ${results.length > 0 ? "pt-8 pb-6" : "pt-24 pb-16"}`}>
 <div className="max-w-5xl mx-auto px-4 sm:px-6">
 {results.length === 0 && !isSearching && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-sm font-medium mb-4">
 <Sparkles className="w-4 h-4" />
 Semantic Search Engine
 </div>
 <h1 className="text-4xl sm:text-5xl font-bold text-primary-dark tracking-tight">
 Find what you <span className="text-[#10B981]">mean</span>,<br />not just what you type.
 </h1>
 <p className="text-lg text-secondary-blue mt-4 max-w-2xl mx-auto">
 Search your documents using natural language. Our AI understands context, intent, and meaning.
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

 {/* Results */}
 <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
 {isSearching && (
 <div className="flex flex-col items-center py-16">
 <div className="relative w-16 h-16">
 <div className="absolute inset-0 rounded-full border-4 border-[#10B981]/30" />
 <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#10B981] animate-spin" />
 </div>
 <p className="text-sm text-secondary-blue mt-4">Analyzing query semantics...</p>
 </div>
 )}

 {!isSearching && results.length > 0 && (
 <div>
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm text-secondary-blue">
 <span className="font-semibold text-primary-dark ">{results.length}</span> results found
 </p>
 </div>
 <div className="space-y-3">
 {results.map((r, i) => (
 <SearchResultCard
 key={r.document?.id || i}
 document={r.document}
 rank={i + 1}
 similarityScore={r.similarityScore}
 explanation={r.explanation}
 currentQuery={currentQuery}
 onFeedback={handleFeedback}
 onView={(doc) => {
 setSelectedDoc(doc);
 }}
 />
 ))}
 </div>
 </div>
 )}

 {!isSearching && results.length === 0 && currentQuery && (
 <div className="text-center py-16">
 <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
 <p className="text-primary-dark">No matching documents found</p>
 <p className="text-sm text-secondary-blue mt-1">Try rephrasing your query or use different keywords</p>
 </div>
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

 {/* Document detail panel */}
 {selectedDoc && (
 <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedDoc(null)} />
 )}
 </div>
 );
}
