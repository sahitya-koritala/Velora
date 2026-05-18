import React, { useState } from "react";
import { apiClient } from "@/Api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import PolicyCard from "../components/policies/PolicyCard";
import { useToast } from "@/components/ui/use-toast";

export default function Policies() {
 const { toast } = useToast();
 const [statusFilter, setStatusFilter] = useState("all");
 const [showCreate, setShowCreate] = useState(false);
 const [newPolicy, setNewPolicy] = useState({ name: "", description: "", rule_type: "boost", source: "manual" });
 const queryClient = useQueryClient();

 const { data: policies = [], isLoading } = useQuery({
 queryKey: ["policies"],
 queryFn: () => apiClient.entities.SearchPolicy.list("-created_date", 50),
 });

 // Change filter logic to properly handle "all" case for all statuses including pending_approval
 const filtered = policies.filter(p => {
 if (statusFilter === "all") return true;
 return p.status === statusFilter;
 });

 const handleApprove = async (policy) => {
 await apiClient.entities.SearchPolicy.update(policy.id, { status: "active" });
 queryClient.invalidateQueries({ queryKey: ["policies"] });
 };

 const handleReject = async (policy) => {
 await apiClient.entities.SearchPolicy.update(policy.id, { status: "rejected" });
 queryClient.invalidateQueries({ queryKey: ["policies"] });
 };

 const handleCreate = async () => {
 try {
 await apiClient.entities.SearchPolicy.create({
 ...newPolicy,
 description: newPolicy.description?.trim() || "No description provided",
 status: "pending_approval",
 });
 setShowCreate(false);
 setNewPolicy({ name: "", description: "", rule_type: "boost", source: "manual" });
 queryClient.invalidateQueries({ queryKey: ["policies"] });
 queryClient.invalidateQueries({ queryKey: ["all-history"] });
 toast({ title: "Policy created", description: "Saved to MongoDB and added to history." });
 } catch (err) {
 toast({ variant: "destructive", title: "Failed to create policy", description: err.message });
 }
 };

 return (
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark: text-primary-dark flex items-center gap-2">
 <Shield className="w-6 h-6 text-indigo-600" />
 Ranking Policies
 </h1>
 <p className="text-sm text-slate-500 mt-0.5">
 {policies.filter(p => p.status === "pending_approval").length} pending approval
 </p>
 </div>
 <Button onClick={() => setShowCreate(true)} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-md shadow-[#10B981]/20">
 <Plus className="w-4 h-4 mr-2" />New Policy
 </Button>
 </div>

 <div className="flex items-center gap-3 mb-6">
 <Filter className="w-4 h-4 text-slate-400" />
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Status</SelectItem>
 <SelectItem value="active">Active</SelectItem>
 <SelectItem value="pending_approval">Pending Approval</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 <SelectItem value="disabled">Disabled</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {isLoading ? (
 <div className="space-y-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="bg-white  rounded-xl border  p-5 animate-pulse">
 <div className="h-4 w-1/2 bg-slate-200  rounded mb-2" />
 <div className="h-3 w-3/4 bg-slate-100  rounded" />
 </div>
 ))}
 </div>
 ) : filtered.length > 0 ? (
 <div className="space-y-3">
 {filtered.map((policy, i) => (
 <PolicyCard
 key={policy.id}
 policy={policy}
 index={i}
 onApprove={handleApprove}
 onReject={handleReject}
 onDelete={async (p) => {
 if (window.confirm("Are you sure you want to delete this policy?")) {
 await apiClient.entities.SearchPolicy.delete?.(p.id) || handleReject(p);
 queryClient.invalidateQueries({ queryKey: ["policies"] });
 }
 }}
 />
 ))}
 </div>
 ) : (
 <div className="text-center py-16">
 <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <p className="text-slate-500">No policies found</p>
 <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4 border-divider text-secondary-blue hover:bg-white/50">
 <Plus className="w-4 h-4 mr-2" />Create your first policy
 </Button>
 </div>
 )}

 {/* Create Dialog */}
 <Dialog open={showCreate} onOpenChange={setShowCreate}>
 <DialogContent
   className="sm:max-w-md bg-white border-divider text-primary-dark shadow-xl"
   onCloseClick={() => setShowCreate(false)}
   onEscapeKeyDown={() => setShowCreate(false)}
   onPointerDownOutside={() => setShowCreate(false)}
 >
 <DialogHeader>
 <DialogTitle>Create Ranking Policy</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div>
 <Label>Name</Label>
 <Input value={newPolicy.name} onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })} placeholder="Policy name" className="mt-1.5 border-divider focus:border-[#10B981] bg-slate-50" />
 </div>
 <div>
 <Label>Description</Label>
 <Textarea value={newPolicy.description} onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })} placeholder="What does this policy do?" className="mt-1.5 border-divider focus:border-[#10B981] bg-slate-50" />
 </div>
 <div>
 <Label>Rule Type</Label>
 <Select value={newPolicy.rule_type} onValueChange={(v) => setNewPolicy({ ...newPolicy, rule_type: v })}>
 <SelectTrigger className="mt-1.5 border-divider focus:border-[#10B981] bg-slate-50"><SelectValue /></SelectTrigger>
 <SelectContent>
 {["boost", "penalize", "filter", "rerank", "suggest"].map(r => (
 <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setShowCreate(false)} className="border-divider text-secondary-blue hover:bg-slate-50">Cancel</Button>
 <Button onClick={handleCreate} disabled={!newPolicy.name} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-md shadow-[#10B981]/20">Create</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}