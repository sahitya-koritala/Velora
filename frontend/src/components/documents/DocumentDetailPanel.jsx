import React from "react";
import { X, FileText, Tag, Clock, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentDetailPanel({ document, onClose, onDelete, deleting }) {
 if (!document) return null;

 return (
 <AnimatePresence>
 <motion.div
 initial={{ opacity: 0, x: 300 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 300 }}
 className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-white border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto"
 >
 <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-2">
 <h2 className="font-semibold text-slate-900">Document Details</h2>
 <div className="flex items-center gap-1">
 {onDelete && (
 <Button variant="ghost" size="sm" disabled={deleting} onClick={onDelete} className="text-rose-500 hover:bg-rose-50">
 <Trash2 className="w-4 h-4 mr-1" />{deleting ? "Deleting..." : "Delete"}
 </Button>
 )}
 <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
 </div>
 </div>

 <div className="p-6 space-y-6">
 <div>
 <h3 className="text-xl font-bold text-slate-900 dark: text-primary-dark ">{document.title}</h3>
 <div className="flex items-center gap-2 mt-2 flex-wrap">
 {document.category && (
 <Badge variant="secondary" className="text-xs">{document.category}</Badge>
 )}
 <Badge variant="outline" className="text-xs">
 <Shield className="w-3 h-3 mr-1" />{document.access_level || "public"}
 </Badge>
 <Badge variant="outline" className="text-xs">
 {document.status || "indexed"}
 </Badge>
 </div>
 </div>

 <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
 <Clock className="h-5 w-5 text-emerald-700" />
 </div>
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Created</p>
 <p className="text-base font-bold text-emerald-950">
 {document.created_date
 ? format(new Date(document.created_date), "MMM d, yyyy")
 : "N/A"}
 </p>
 {document.created_date && (
 <p className="text-xs text-emerald-700">
 {format(new Date(document.created_date), "h:mm a")}
 </p>
 )}
 </div>
 </div>
 </div>

 {document.source && (
 <div>
 <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</label>
 <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
 <FileText className="w-4 h-4 text-slate-400" />{document.source}
 </p>
 </div>
 )}

 <div>
 <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Content</label>
 <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{document.content}</p>
 </div>

 {document.tags?.length > 0 && (
 <div>
 <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tags</label>
 <div className="flex flex-wrap gap-1.5 mt-2">
 {document.tags.map((tag, i) => (
 <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
 <Tag className="w-3 h-3" />{tag}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </AnimatePresence>
 );
}