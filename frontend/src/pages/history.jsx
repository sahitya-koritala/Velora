import React, { useState } from "react";
import { apiClient } from "@/Api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import SearchTimeline from "../components/History/SearchTimeLine";

export default function History() {
  const [intentFilter, setIntentFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const { data: queries = [], isLoading, refetch } = useQuery({
    queryKey: ["all-history"],
    queryFn: () => apiClient.entities.SearchQuery.list(),
  });

  const filtered = queries.filter((q) => {
    const matchesIntent = intentFilter === "all" || q.intent?.toLowerCase() === intentFilter.toLowerCase();
    const matchesMode = modeFilter === "all" || q.search_mode === modeFilter;
    return matchesIntent && matchesMode;
  });

  const handleReplay = (query) => {
    if (query._type !== "search") return;
    window.location.href = createPageUrl("Search") + `?q=${encodeURIComponent(query.query_text)}`;
  };

  const handleDeleteItem = async (id, type, refId) => {
    if (!window.confirm("Are you sure you want to delete this history item?")) return;
    await apiClient.entities.SearchQuery.delete(id);
    refetch();
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear your entire activity history?")) return;
    await apiClient.entities.SearchQuery.clearAll();
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-primary-dark flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Activity History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{queries.length} activities recorded</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Intent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            {["search", "document", "policy", "feedback"].map((i) => (
              <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Mode" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            {["semantic", "search", "document", "policy", "feedback"].map((m) => (
              <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span>Success: <strong className="text-emerald-600">{queries.filter((q) => q.was_successful).length}</strong></span>
          <span>Failed: <strong className="text-rose-600">{queries.filter((q) => !q.was_successful).length}</strong></span>
          <Button
            variant="outline"
            size="sm"
            className="text-rose-500 border-rose-200 hover:bg-rose-50 h-8"
            onClick={handleClearAll}
          >
            Clear History
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <SearchTimeline
          queries={filtered}
          onReplay={handleReplay}
          onDelete={(id, type, refId) => handleDeleteItem(id, type, refId)}
        />
      )}
    </div>
  );
}