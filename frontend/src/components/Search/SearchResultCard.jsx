import React, { useState } from "react";
import { FileText, Tag, Eye, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, BarChart3, Shield, BookmarkPlus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

const categoryColors = {
 technical: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
 business: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
 legal: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
 research: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
 operations: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
 general: "bg-slate-100 text-slate-700 dark:bg-[#12221C] dark:text-emerald-100/80",
};

export default function SearchResultCard({ document, rank, similarityScore, explanation, currentQuery, onFeedback, onView }) {
 const [expanded, setExpanded] = useState(false);
 const [feedback, setFeedback] = useState(null);
 const [isMemoryDialogOpen, setIsMemoryDialogOpen] = useState(false);
 const [notes, setNotes] = useState("");
 const [tagsInput, setTagsInput] = useState("");
 const [isSaving, setIsSaving] = useState(false);

 const { user } = useAuth();

 const scorePercent = Math.round((similarityScore || 0) * 100);
 const scoreColor = scorePercent >= 80 ? "text-primary-dark0" : scorePercent >= 60 ? "text-amber-500" : "text-rose-500";
 const scoreBg = scorePercent >= 80 ? "bg-emerald-500" : scorePercent >= 60 ? "bg-amber-500" : "bg-rose-500";

 const handleFeedback = (type) => {
 setFeedback(type);
 onFeedback?.(document.id, type);
 };

 const handleSaveMemory = async () => {
 try {
 if (!currentQuery) {
 toast.error("No query to save!");
 return;
 }
 setIsSaving(true);

 const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

 await {};

 await logUserAction("memory_save", `Saved query '${currentQuery}' to Team Memory`, { query: currentQuery, resource_id: document.id });

 toast.success("Saved to Team Memory!");
 setIsMemoryDialogOpen(false);
 setNotes("");
 setTagsInput("");
 } catch (err) {
 console.error(err);
 toast.error("Failed to save memory.");
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: rank * 0.05 }}
 className="group glass-card-premium hover:border-[#10B981]/40 transition-all duration-300 hover:shadow-lg"
 >
 <div className="p-5">
 {/* Header */}
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center shadow-md shadow-[#10B981]/20">
 <span className="text-xs font-bold text-white">#{rank}</span>
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="font-semibold text-primary-dark truncate">{document.title}</h3>
 <div className="flex items-center gap-2 mt-1 flex-wrap">
 {document.category && (
 <Badge className={`${categoryColors[document.category] || categoryColors.general} text-xs font-medium border-0`}>
 {document.category}
 </Badge>
 )}
 {document.source && (
 <span className="text-xs text-secondary-blue flex items-center gap-1">
 <FileText className="w-3 h-3" />{document.source}
 </span>
 )}
 {document.access_level && document.access_level !== "public" && (
 <Badge variant="outline" className="text-xs">
 <Shield className="w-3 h-3 mr-1" />{document.access_level}
 </Badge>
 )}
 </div>
 </div>
 </div>

 {/* Score */}
 <div className="flex-shrink-0 text-right">
 <div className="flex items-center gap-2">
 <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
 <div className={`h-full rounded-full ${scoreBg} transition-all`} style={{ width: `${scorePercent}%` }} />
 </div>
 <span className={`text-sm font-bold ${scoreColor}`}>{scorePercent}%</span>
 </div>
 <span className="text-[10px] text-secondary-blue uppercase tracking-wider">match</span>
 </div>
 </div>

 {/* Content preview */}
 <p className={`mt-3 text-sm text-secondary-blue leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
 {document.content}
 </p>

 {/* Tags */}
 {document.tags?.length > 0 && (
 <div className="flex items-center gap-1.5 mt-3 flex-wrap">
 <Tag className="w-3 h-3 text-secondary-blue" />
 {document.tags.slice(0, 5).map((tag, i) => (
 <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-divider text-secondary-blue">
 {tag}
 </span>
 ))}
 </div>
 )}

 {/* Explanation (Explainable AI) */}
 {explanation && expanded && (
 <div className="mt-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
 <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 mb-1">
 <BarChart3 className="w-3.5 h-3.5" />
 Why this result?
 </div>
 <p className="text-xs text-[#10B981] leading-relaxed">{explanation}</p>
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center justify-between mt-4 pt-3 border-t border-divider">
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs text-secondary-blue hover:text-primary-dark hover:bg-white/50">
 {expanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
 {expanded ? "Less" : "More"}
 </Button>
 <Button variant="ghost" size="sm" onClick={() => onView?.(document)} className="text-xs text-secondary-blue hover:text-primary-dark hover:bg-white/50">
 <Eye className="w-3.5 h-3.5 mr-1" />View
 </Button>

 {currentQuery && (
 <Dialog open={isMemoryDialogOpen} onOpenChange={setIsMemoryDialogOpen}>
 <DialogTrigger asChild>
 <Button variant="ghost" size="sm" className="text-xs text-indigo-500 hover:text-[#10B981] hover:bg-white/50">
 <BookmarkPlus className="w-3.5 h-3.5 mr-1" /> Save to Team Memory
 </Button>
 </DialogTrigger>
 <DialogContent
   onCloseClick={() => setIsMemoryDialogOpen(false)}
   onEscapeKeyDown={() => setIsMemoryDialogOpen(false)}
   onPointerDownOutside={() => setIsMemoryDialogOpen(false)}
 >
 <DialogHeader>
 <DialogTitle>Save to Team Memory</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Query</label>
 <Input value={currentQuery || ""} disabled className="bg-slate-50 dark:bg-transparent text-slate-600" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Notes & Context</label>
 <textarea
 className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
 placeholder="Why is this document a good result for this query?"
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Tags (comma separated)</label>
 <Input
 placeholder="e.g. onboarding, legal, important"
 value={tagsInput}
 onChange={(e) => setTagsInput(e.target.value)}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsMemoryDialogOpen(false)}>Cancel</Button>
 <Button onClick={handleSaveMemory} disabled={isSaving}>
 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
 {isSaving ? "Saving..." : "Save Memory"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )}
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleFeedback("up")}
 className={`p-1.5 rounded-lg transition-colors ${feedback === "up" ? "bg-[#10B981]/20 text-[#10B981]" : "text-secondary-blue hover:text-[#10B981] hover:bg-white/50"}`}
 >
 <ThumbsUp className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleFeedback("down")}
 className={`p-1.5 rounded-lg transition-colors ${feedback === "down" ? "bg-rose-100 text-rose-600" : "text-secondary-blue hover:text-rose-500 hover:bg-white/50"}`}
 >
 <ThumbsDown className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 );
}
