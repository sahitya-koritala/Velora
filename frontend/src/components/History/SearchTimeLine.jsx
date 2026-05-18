import React from "react";
import { Clock, RotateCcw, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function SearchTimeline({ queries = [], onReplay, onDelete }) {
  if (!queries || queries.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No search history to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

      <div className="space-y-4">
        {queries.map((q, i) => (
          <motion.div
            key={q.id || `history-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pl-14"
          >
            {/* Dot */}
            <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${q.was_successful ? "bg-emerald-500" : "bg-slate-300"
              }`} />

            <div className="bg-white dark:bg-white rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-primary-dark">{q.query_text}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{q.search_mode || "semantic"}</Badge>
                    {q.intent && <Badge variant="secondary" className="text-[10px]">{q.intent}</Badge>}
                    <span className="text-[10px] text-slate-400">{q.result_count || 0} results</span>
                    {q.response_time_ms && (
                      <span className="text-[10px] text-slate-400">{q.response_time_ms}ms</span>
                    )}
                    {q.feedback_rating && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />{q.feedback_rating}/5
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">
                    {q.created_date && !isNaN(new Date(q.created_date).getTime()) ? format(new Date(q.created_date), "MMM d, yyyy") : ""}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {q.created_date && !isNaN(new Date(q.created_date).getTime()) ? format(new Date(q.created_date), "HH:mm") : ""}
                  </p>
                </div>
              </div>
              {(!q._type || q._type === 'search') && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600" onClick={() => onReplay?.(q)}>
                    <RotateCcw className="w-3 h-3 mr-1" />Replay
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-rose-500 hover:text-rose-600" onClick={() => onDelete?.(q.id, q._type, q.refId)}>
                    <Trash2 className="w-3 h-3 mr-1" />Delete
                  </Button>
                </div>
              )}
              {q._type && q._type !== 'search' && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" className="text-xs text-rose-500 hover:text-rose-600" onClick={() => onDelete?.(q.id, q._type, q.refId)}>
                    <Trash2 className="w-3 h-3 mr-1" />Delete
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}