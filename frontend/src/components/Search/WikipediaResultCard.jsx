import React, { useState } from "react";
import { Globe, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toRelevancePercent, relevanceColors } from "@/lib/relevance";

export default function WikipediaResultCard({ item, rank, similarityScore, explanation }) {
  const [expanded, setExpanded] = useState(false);

  const scorePercent = toRelevancePercent(similarityScore);
  const { text: scoreColor, bar: scoreBg } = relevanceColors(scorePercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="group rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white shadow-sm hover:border-sky-300 hover:shadow-md transition-all"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">#{rank}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-sky-100 text-sky-800 border-0 text-xs font-medium">
                  <Globe className="w-3 h-3 mr-1" />
                  Wikipedia
                </Badge>
                <span className="text-xs text-sky-700">External Knowledge</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-sky-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBg}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${scoreColor}`}>{scorePercent}%</span>
            </div>
            <span className="text-[10px] text-sky-600 uppercase tracking-wider font-medium">
              relevance
            </span>
          </div>
        </div>

        <p className={`mt-3 text-sm text-slate-700 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
          {item.content}
        </p>

        {explanation && expanded && (
          <div className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-100">
            <p className="text-xs text-sky-800 leading-relaxed">{explanation}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
              {expanded ? "Less" : "More"}
            </Button>
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900"
            >
              Read on Wikipedia
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
