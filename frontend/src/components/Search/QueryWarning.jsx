import React from "react";
import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function QueryWarning({ warning, suggestions = [], onSuggestionClick }) {
  if (!warning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="max-w-4xl mx-auto mb-4"
    >
      <div className="rounded-xl glass-card-premium border border-amber-300 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">{warning}</p>
            {suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="font-medium">Try instead:</span>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick?.(s)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-amber-200 text-sm text-amber-800 hover:bg-amber-100 transition-colors w-full text-left"
                  >
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
