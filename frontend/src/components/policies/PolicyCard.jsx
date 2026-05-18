import React from "react";
import { Filter, Trash2, ArrowRightCircle, Star, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PolicyCard({ policy, index, onApprove, onReject, onDelete }) {
 const isBoost = policy.rule_type === "boost";
 const isPenalize = policy.rule_type === "penalize";

 return (
 <div
 className={`
 relative overflow-hidden rounded-xl border p-5 transition-all
 ${policy.status === "active"
 ? "bg-white border-slate-200 dark:bg-white dark:border-slate-800"
 : policy.status === "pending_approval"
 ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30"
 : "bg-slate-50 border-slate-100 opacity-75 grayscale-[0.5] dark:bg-white/50 dark:border-slate-800/50"
 }
 `}
 >
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1.5">
 <h3 className="font-semibold text-slate-900 dark: text-primary-dark flex items-center gap-2">
 {policy.name}
 {policy.status === "active" && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
 </h3>
 <Badge variant="outline" className={`
 text-[10px] uppercase font-bold tracking-wider
 ${isBoost ? "text-emerald-600 border-emerald-200 dark:border-emerald-900/50" : ""}
 ${isPenalize ? "text-rose-600 border-rose-200 dark:border-rose-900/50" : ""}
 `}>
 {policy.rule_type}
 </Badge>
 <Badge variant="secondary" className="text-[10px] capitalize">
 {policy.status}
 </Badge>
 </div>

 <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
 {policy.description}
 </p>

 <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
 <span className="flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 {policy.created_date ? format(new Date(policy.created_date), "MMM d, yyyy") : "Unknown Date"}
 </span>
 <span className="flex items-center gap-1.5">
 <ArrowRightCircle className="w-3.5 h-3.5" />
 {policy.times_applied || 0} applications
 </span>
 <span className="flex items-center gap-1.5">
 {policy.source === "automated" ? <Star className="w-3.5 h-3.5 text-amber-500" /> : <Filter className="w-3.5 h-3.5" />}
 {policy.source || "manual"}
 </span>
 </div>
 </div>

 <div className="flex flex-col items-end gap-2">
 {policy.status === "pending_approval" && (
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => onReject(policy)}
 className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-900/20"
 >
 Reject
 </Button>
 <Button
 size="sm"
 onClick={() => onApprove(policy)}
 className="bg-emerald-600 hover:bg-emerald-700 text-primary-dark"
 >
 Approve
 </Button>
 </div>
 )}
 {onDelete && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onDelete(policy)}
 className="text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 px-2"
 title="Delete Policy"
 >
 <Trash2 className="w-4 h-4" />
 </Button>
 )}
 </div>
 </div>
 </div>
 );
}