import React from "react";
import { Search, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

const intentColors = {
 lookup: "bg-blue-100 text-blue-700",
 comparison: "bg-purple-100 text-purple-700",
 exploration: "bg-amber-100 text-amber-700",
 analysis: "bg-emerald-100 text-emerald-700",
 troubleshooting: "bg-rose-100 text-rose-700",
 unknown: "bg-slate-100 text-slate-700",
};

export default function RecentQueries({ queries = [], onReplay, loading }) {
 if (loading) {
 return (
 <div className="glass-card-premium rounded-xl border border-divider p-8 text-center animate-pulse">
 <p className="text-sm text-secondary-blue">Loading recent searches...</p>
 </div>
 );
 }

 if (queries.length === 0) {
 return (
 <div className="glass-card-premium rounded-xl border border-divider p-8 text-center">
 <Clock className="w-8 h-8 text-secondary-blue mx-auto mb-2" />
 <p className="text-sm text-secondary-blue">No searches yet. Run a search to see activity here.</p>
 </div>
 );
 }

 return (
 <div className="glass-card-premium rounded-xl border border-divider overflow-hidden">
 <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
 <h3 className="font-semibold text-primary-dark ">Recent Searches</h3>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {queries.slice(0, 8).map((q, i) => (
 <motion.div
 key={q.id}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: i * 0.05 }}
 className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/50 border border-divider/50 transition-colors cursor-pointer group"
 onClick={() => onReplay?.(q)}
 >
 <div className={`p-1.5 rounded-lg ${q.was_successful ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-white/50 border border-divider"}`}>
 {q.was_successful ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
 ) : (
 <Search className="w-3.5 h-3.5 text-secondary-blue" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm text-slate-700 dark:text-secondary-blue truncate">{q.query_text}</p>
 <div className="flex items-center gap-2 mt-0.5">
 {q.intent && (
 <Badge className={`${intentColors[q.intent] || intentColors.unknown} text-[10px] font-medium border-0 py-0`}>
 {q.intent}
 </Badge>
 )}
 <span className="text-[10px] text-secondary-blue">
 {q.result_count || 0} results
 </span>
 <span className="text-[10px] text-secondary-blue">
 {q.created_date ? format(new Date(q.created_date), "MMM d, HH:mm") : ""}
 </span>
 </div>
 </div>
 <ArrowRight className="w-4 h-4 text-secondary-blue opacity-0 group-hover:opacity-100 transition-opacity" />
 </motion.div>
 ))}
 </div>
 </div>
 );
}
