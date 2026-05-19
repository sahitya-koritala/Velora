import React, { useState } from "react";
import { apiClient, logUserAction } from "@/Api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Shield, Filter, AlertTriangle, Info, AlertCircle, Download, Activity, Users as UsersIcon, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

const severityConfig = {
 info: { icon: Info, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
 warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
 critical: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

export default function AuditLogs() {
 const [severityFilter, setSeverityFilter] = useState("all");
 const [actionFilter, setActionFilter] = useState("all");

 const { data: logs = [], isLoading } = useQuery({
 queryKey: ["audit-logs"],
 queryFn: () => apiClient.entities.AuditLog.list("-created_date", 500),
 });

 const filtered = logs.filter((l) => {
 const matchesSeverity = severityFilter === "all" || l.severity === severityFilter;
 const matchesAction = actionFilter === "all" || l.action === actionFilter;
 return matchesSeverity && matchesAction;
 });

 // Calculate analytics
 const totalLogs = filtered.length;
 const criticalLogs = filtered.filter(l => l.severity === "critical").length;

 const userCounts = filtered.reduce((acc, l) => {
 const id = l.user_id || l.created_by || "system";
 acc[id] = (acc[id] || 0) + 1;
 return acc;
 }, {});
 const sortedUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
 const mostActiveUser = sortedUsers[0]?.[0] || "None";
 const mostActiveCount = sortedUsers[0]?.[1] || 0;

 const actionCounts = filtered.reduce((acc, l) => {
 if (!l.action) return acc;
 acc[l.action] = (acc[l.action] || 0) + 1;
 return acc;
 }, {});
 const topAction = Object.keys(actionCounts).sort((a, b) => actionCounts[b] - actionCounts[a])[0] || "None";

 const handleExport = () => {
 const csvContent = "data:text/csv;charset=utf-8,"
 + ["Action,Severity,User,IP,Date,Details"].join(",") + "\n"
 + filtered.map(l => [
 l.action,
 l.severity,
 l.user_id || l.created_by || "system",
 l.ip_address || "",
 l.created_date ? new Date(l.created_date).toISOString() : "",
 `"${(l.details || "").replace(/"/g, '""')}"`
 ].join(",")).join("\n");

 const encodedUri = encodeURI(csvContent);
 const link = document.createElement("a");
 link.setAttribute("href", encodedUri);
 link.setAttribute("download", `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);

 logUserAction("export", `Exported ${filtered.length} audit logs to CSV`);
 };

 return (
 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark: text-primary-dark flex items-center gap-2">
 <Shield className="w-6 h-6 text-indigo-600" />
 Audit Logs & Security Insights
 </h1>
 <p className="text-sm text-slate-500 mt-0.5">Enterprise security and compliance audit trail</p>
 </div>
 <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
 <Download className="w-4 h-4" /> Export CSV
 </Button>
 </div>

 {/* Analytics Panel */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
 <div className="flex items-center gap-3 text-slate-500 mb-2">
 <Activity className="w-4 h-4 text-indigo-500" /> <span className="text-xs font-medium uppercase tracking-wider">Total Events</span>
 </div>
 <div className="text-2xl font-bold text-slate-900">{totalLogs}</div>
 </div>
 <div className="bg-white rounded-xl border border-rose-200 p-4 relative overflow-hidden shadow-sm">
 <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full" />
 <div className="flex items-center gap-3 text-rose-500 mb-2">
 <AlertTriangle className="w-4 h-4" /> <span className="text-xs font-medium uppercase tracking-wider">Critical Alerts</span>
 </div>
 <div className="text-2xl font-bold text-rose-600">{criticalLogs}</div>
 </div>
 <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
 <div className="flex items-center gap-3 text-slate-500 mb-2">
 <UsersIcon className="w-4 h-4 text-emerald-500" /> <span className="text-xs font-medium uppercase tracking-wider">Most Active User</span>
 </div>
 <div className="text-lg font-bold text-slate-900 truncate" title={mostActiveUser}>{mostActiveUser}</div>
 <p className="text-[10px] text-slate-400 mt-0.5">{mostActiveCount} event{mostActiveCount !== 1 ? "s" : ""}</p>
 </div>
 <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
 <div className="flex items-center gap-3 text-slate-500 mb-2">
 <Database className="w-4 h-4 text-amber-500" /> <span className="text-xs font-medium uppercase tracking-wider">Top Action</span>
 </div>
 <div className="text-lg font-bold text-slate-900 capitalize">{topAction.replace(/_/g, ' ')}</div>
 </div>
 </div>

 <div className="flex items-center gap-3 mb-6 flex-wrap bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
 <Filter className="w-4 h-4 text-slate-400 ml-1" />
 <Select value={severityFilter} onValueChange={setSeverityFilter}>
 <SelectTrigger className="w-36 bg-transparent border-none shadow-none focus:ring-0 text-slate-900"><SelectValue placeholder="Severity" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Severity</SelectItem>
 <SelectItem value="info">Info</SelectItem>
 <SelectItem value="warning">Warning</SelectItem>
 <SelectItem value="critical">Critical</SelectItem>
 </SelectContent>
 </Select>
 <div className="w-px h-6 bg-slate-200" />
 <Select value={actionFilter} onValueChange={setActionFilter}>
 <SelectTrigger className="w-44 bg-transparent border-none shadow-none focus:ring-0 text-slate-900"><SelectValue placeholder="Action" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Actions</SelectItem>
 {["search", "document", "document_delete", "policy", "feedback", "document_view", "memory_save", "policy_change", "login", "logout", "export"].map(a => (
 <SelectItem key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <div className="ml-auto text-xs text-slate-400 mr-2 border border-slate-200 rounded-full px-3 py-1">
 Showing {filtered.length} logs
 </div>
 </div>

 {isLoading ? (
 <div className="space-y-3">
 {[1, 2, 3, 4, 5].map(i => (
 <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
 <div className="h-4 w-1/2 bg-slate-200 rounded mb-2" />
 <div className="h-3 w-3/4 bg-slate-100 rounded" />
 </div>
 ))}
 </div>
 ) : filtered.length > 0 ? (
 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
 <div className="divide-y divide-slate-100">
 {filtered.map((log, i) => {
 const config = severityConfig[log.severity] || severityConfig.info;
 const Icon = config.icon;
 return (
 <motion.div
 key={log.id}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: i * 0.01 }}
 className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
 >
 <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0 mt-0.5`}>
 <Icon className={`w-4 h-4 ${config.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
 <div className="flex items-center gap-2">
 <Badge variant="outline" className={`text-[10px] ${config.color} border-${config.color.replace('text-', '')}`}>
 {log.action?.replace(/_/g, " ")}
 </Badge>
 <span className="text-xs font-semibold text-slate-600">{log.user_id || log.created_by || 'system'}</span>
 </div>
 <span className="text-[10px] text-slate-400">
 {log.created_date ? format(new Date(log.created_date), "MMM d, yyyy HH:mm:ss") : ""}
 </span>
 </div>
 <span className="text-sm text-slate-700">{log.details}</span>
 {log.ip_address && (
 <div className="mt-1 flex items-center gap-2">
 <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">IP: {log.ip_address}</span>
 </div>
 )}
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 ) : (
 <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed shadow-sm">
 <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <p className="text-slate-500">No audit logs recorded matching filters</p>
 </div>
 )}
 </div>
 );
}
