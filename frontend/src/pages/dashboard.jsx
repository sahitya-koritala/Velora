import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, TrendingUp, Shield, Database, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import StatsGrid from "../components/Dashboard/StatsGrid";
import ActivityChart from "../components/Dashboard/ActivityChart";
import RecentQueries from "../components/Dashboard/recentQueries";
import SecurityInsightsWidget from "../components/Dashboard/SecurityInsightsWidget";
import { apiClient } from "@/Api/apiClient";
import { createPageUrl } from "@/utils";

function docCategory(doc) {
  const cat = doc.metadata?.category || doc.category || "general";
  return typeof cat === "string" ? cat.toLowerCase() : "general";
}

export default function Dashboard() {
  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiClient.entities.SearchDocument.list(),
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: () => apiClient.entities.SearchPolicy.list(),
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiClient.dashboard.getStats(),
    refetchInterval: 15000,
  });

  const searchQueries = dashboardStats?.recentSearches || [];
  const chartData = dashboardStats?.chartData || [];
  const searchesToday = dashboardStats?.searchesToday ?? 0;
  const successRate = dashboardStats?.successRate ?? 0;

  const stats = [
    { label: "Total Documents", value: documents.length, icon: FileText, color: "bg-indigo-500", change: 12 },
    {
      label: "Searches Today",
      value: searchesToday,
      icon: Search,
      color: "bg-emerald-500",
      change: searchesToday > 0 ? 8 : 0,
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "bg-amber-500",
      change: successRate > 50 ? 5 : -3,
    },
    {
      label: "Active Policies",
      value: policies.filter((p) => p.status === "active").length,
      icon: Shield,
      color: "bg-purple-500",
    },
  ];

  const indexedCount = documents.filter(
    (d) => Array.isArray(d.embedding) ? d.embedding.length > 0 : true
  ).length;

  const handleReplay = (query) => {
    window.location.href =
      createPageUrl("Search") + `?q=${encodeURIComponent(query.query_text)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Dashboard</h1>
          <p className="text-sm text-secondary-blue mt-0.5">
            Overview of your semantic search engine
          </p>
        </div>
        <Link
          to={createPageUrl("Search")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4" />
          New Search
        </Link>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart data={chartData.length > 0 ? chartData : undefined} loading={statsLoading} />
        </div>
        <div>
          <RecentQueries queries={searchQueries} onReplay={handleReplay} loading={statsLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card-premium rounded-xl border border-divider p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-primary-dark">Document Index</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["technical", "business", "research"].map((cat) => {
              const count = documents.filter((d) => docCategory(d) === cat).length;
              return (
                <div
                  key={cat}
                  className="text-center p-3 rounded-lg bg-slate-50 border border-divider"
                >
                  <p className="text-lg font-bold text-primary-dark">{count}</p>
                  <p className="text-[10px] text-secondary-blue capitalize">{cat}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card-premium rounded-xl border border-divider p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-primary-dark">Performance</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-divider">
              <p className="text-lg font-bold text-primary-dark">{successRate}%</p>
              <p className="text-[10px] text-secondary-blue">Search Success Rate</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-divider">
              <p className="text-lg font-bold text-primary-dark">{indexedCount}</p>
              <p className="text-[10px] text-secondary-blue">Indexed Docs</p>
            </div>
          </div>
        </div>
      </div>

      <SecurityInsightsWidget />
    </div>
  );
}
