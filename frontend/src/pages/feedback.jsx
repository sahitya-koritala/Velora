import React, { useState } from "react";
import { apiClient } from "@/Api/apiClient";
import { MessageSquare, CheckCircle2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export default function Feedback() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.entities.Feedback.create({
                name: formData.name,
                email: formData.email,
                message: formData.message,
                status: "new"
            });
            await apiClient.integrations.Core.SendEmail({
                to: "support@velera.ai", // Mock support email
                subject: `New App Feedback from ${formData.name}`,
                body: `From: ${formData.name} (${formData.email})\n\nMessage: ${formData.message}`,
            });
            setSubmitted(true);
            setFormData({ name: "", email: "", message: "" });
            queryClient.invalidateQueries({ queryKey: ["all-history"] });
            toast({ title: "Feedback submitted", description: "Your feedback was saved and appears in History." });
        } catch (err) {
            console.error("Feedback submission failed:", err);
            toast({ variant: "destructive", title: "Submission failed", description: err.message || "Could not save feedback." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Send Us Feedback</h1>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Help us improve Velora by sharing your thoughts, suggestions, or issues.
                </p>
            </div>

            <Card className="glass-card relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-20 h-20 text-primary" />
                </div>
                <CardHeader className="relative z-10 border-b border-border pb-8 mt-4 mx-6">
                    <CardTitle className="text-xl text-foreground">Share Your Thoughts</CardTitle>
                    <CardDescription className="text-slate-400">
                        Every piece of feedback is reviewed by our engineering team to improve your search experience.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-10 relative z-10 px-8 pb-12">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary-dark mb-2">Feedback Received!</h3>
                            <p className="text-slate-400 mb-8 max-w-xs mx-auto">Thank you for helping us grow. We've received your feedback and will review it shortly.</p>
                            <Button
                                variant="outline"
                                onClick={() => setSubmitted(false)}
                                className="border-slate-800 hover:bg-slate-800 text-slate-300"
                            >
                                Send Another
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-sm font-semibold text-muted-foreground ml-1">Your Name</label>
                                    <Input
                                        placeholder="Alex Rivera"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-background/50 border-border text-foreground h-12 focus:ring-primary/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="alex@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-background/50 border-border text-foreground h-12 focus:ring-primary/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-semibold text-muted-foreground ml-1">What's on your mind?</label>
                                <Textarea
                                    placeholder="I'd love to see more filtering options on the search results page..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="bg-background/50 border-border text-foreground min-h-[180px] p-4 focus:ring-primary/50 resize-none"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {loading ? "Sending..." : (
                                    <span className="flex items-center gap-2">
                                        Submit Feedback
                                        <Send className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Bug Reports", desc: "Something not working? Let us know and we'll fix it.", color: "text-amber-400" },
                    { title: "Feature Requests", desc: "Missing something? Suggest new features for our roadmap.", color: "text-indigo-400" },
                    { title: "General Inquiries", desc: "Questions about how things work? We're here to help.", color: "text-emerald-400" },
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/40 border border-slate-800/50">
                        <h3 className={`font-bold mb-2 ${item.color}`}>{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
