import React from "react";

import { useQuery } from "@tanstack/react-query";
import { Search, FileText, TrendingUp, Shield, Database, Activity } from "lucide-react";

import StatsGrid from "../components/Dashboard/StatsGrid";
import ActivityChart from "../components/Dashboard/ActivityChart";
import RecentQueries from "../components/Dashboard/recentQueries";
import SecurityInsightsWidget from "../components/Dashboard/SecurityInsightsWidget";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Dashboard() {
 const { data: documents = [] } = useQuery({
 queryKey: ["documents"],
 queryFn: async () => {
 const res = await fetch("http://localhost:5000/api/documents");
 return res.ok ? res.json() : [];
 },
 });

 const { data: queries = [] } = useQuery({
 queryKey: ["queries"],
 queryFn: async () => {
 const res = await fetch("http://localhost:5000/api/history");
 const data = res.ok ? await res.json() : [];
 return data.map(q => ({
 ...q,
 query_text: q.query,
 was_successful: q.resultCount > 0,
 response_time_ms: 250 // mock response time
 }));
 },
 });

 const { data: policies = [] } = useQuery({
 queryKey: ["policies"],
 queryFn: async () => {
 const res = await fetch("http://localhost:5000/api/policies");
 return res.ok ? await res.json() : [];
 },
 });

 const successfulQueries = queries.filter((q) => q.was_successful).length;
 const successRate = queries.length > 0 ? Math.round((successfulQueries / queries.length) * 100) : 0;
 const avgResponseTime = queries.length > 0
 ? Math.round(queries.reduce((sum, q) => sum + (q.response_time_ms || 0), 0) / queries.length)
 : 0;

 const stats = [
 { label: "Total Documents", value: documents.length, icon: FileText, color: "bg-indigo-500", change: 12 },
 { label: "Searches Today", value: queries.length, icon: Search, color: "bg-emerald-500", change: 8 },
 { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "bg-amber-500", change: successRate > 50 ? 5 : -3 },
 { label: "Active Policies", value: policies.filter((p) => p.status === "active").length, icon: Shield, color: "bg-purple-500" },
 ];

 const handleReplay = (query) => {
 window.location.href = createPageUrl("Search") + `?q=${encodeURIComponent(query.query_text)}`;
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-primary-dark ">Dashboard</h1>
 <p className="text-sm text-secondary-blue mt-0.5">Overview of your semantic search engine</p>
 </div>
 <Link
 to={createPageUrl("Search")}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-primary-dark text-sm font-medium transition-colors"
 >
 <Search className="w-4 h-4" />
 New Search
 </Link>
 </div>

 <StatsGrid stats={stats} />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2">
 <ActivityChart />
 </div>
 <div>
 <RecentQueries queries={queries} onReplay={handleReplay} />
 </div>
 </div>

 {/* Quick insights */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="glass-card-premium rounded-xl border border-divider p-5">
 <div className="flex items-center gap-2 mb-3">
 <Database className="w-4 h-4 text-indigo-600" />
 <h3 className="font-semibold text-primary-dark ">Document Index</h3>
 </div>
 <div className="grid grid-cols-3 gap-3">
 {["technical", "business", "research"].map((cat) => {
 const count = documents.filter((d) => d.category === cat).length;
 return (
 <div key={cat} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-white/50 border border-divider">
 <p className="text-lg font-bold text-primary-dark ">{count}</p>
 <p className="text-[10px] text-secondary-blue capitalize">{cat}</p>
 </div>
 );
 })}
 </div>
 </div>
 <div className="glass-card-premium rounded-xl border border-divider p-5">
 <div className="flex items-center gap-2 mb-3">
 <Activity className="w-4 h-4 text-emerald-600" />
 <h3 className="font-semibold text-primary-dark ">Performance</h3>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/50 border border-divider">
 <p className="text-lg font-bold text-primary-dark ">{avgResponseTime}ms</p>
 <p className="text-[10px] text-secondary-blue">Avg Response Time</p>
 </div>
 <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/50 border border-divider">
 <p className="text-lg font-bold text-primary-dark ">{documents.filter((d) => d.embedding_status === "generated").length}</p>
 <p className="text-[10px] text-secondary-blue">Indexed Docs</p>
 </div>
 </div>
 </div>
 </div>

 <SecurityInsightsWidget />
 </div>
 );
}
