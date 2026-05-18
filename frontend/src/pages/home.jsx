import React, { useState } from "react";
import { Search, Zap, LayoutDashboard, Database, Layers, Network, BrainCircuit, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`${createPageUrl("Search")}?q=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate(createPageUrl("Search"));
        }
    };

    return (
        <div className="min-h-screen bg-main-gradient flex flex-col font-sans">
            {/* Top Navbar */}
            <header className="absolute top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar-gradient flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                        <div className="w-7 h-7 rounded-lg bg-sidebar-gradient flex items-center justify-center shadow-sm shrink-0"><span className="text-white font-black text-sm">V</span></div>
                    </div>
                    <span className="text-2xl font-bold text-primary-dark tracking-wide">
                        Velora
                    </span>
                </div>

                <nav className="flex items-center gap-6">
                    <span className="text-secondary-blue text-sm font-medium hidden sm:block">Intelligent Semantic Search</span>
                    {isAuthenticated ? (
                        <Link
                            to={createPageUrl("Dashboard")}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl glass-panel text-primary-dark font-semibold hover:bg-white/20 transition-all shadow-sm border-divider"
                        >
                            <LayoutDashboard className="w-4 h-4 text-[#10B981]" />
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                to={createPageUrl("Login")}
                                className="text-primary-dark hover:text-[#10B981] font-medium transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to={createPageUrl("Login")}
                                className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-primary-dark font-semibold transition-all shadow-lg shadow-[#10B981]/30"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <main className="relative flex items-center min-h-[600px] h-screen overflow-hidden">

                {/* Background elements */}
                <div className="absolute inset-0 z-0 bg-main-gradient">
                    <img
                        src="/semantic_bg.png"
                        alt="Hero Background Graphic"
                        className="w-full h-full object-cover opacity-15 pointer-events-none"
                    />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center h-full pt-16">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Left Column: Special Heading */}
                        <div className="space-y-6 max-w-2xl relative">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-divider shadow-sm text-[#10B981] text-xs font-bold tracking-widest uppercase backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                                Vector-Powered Engine
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black text-primary-dark leading-tight tracking-tighter">
                                <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#10B981] to-[#059669]">
                                    Velora.
                                </span>
                                <br />
                                <span className="text-4xl md:text-5xl font-bold text-primary-dark font-light tracking-tight mt-2 block">
                                    Find meaning, instantly.
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-secondary-blue max-w-lg leading-relaxed font-medium">
                                Velora transforms MongoDB documents into an intelligent semantic search experience. Find relevant results instantly using AI-powered vector search and contextual understanding.
                            </p>
                        </div>

                        {/* Right Column: Floating Search Box */}
                        <div className="w-full max-w-md ml-auto">
                            <div className="glass-panel p-8 relative overflow-hidden group hover:glow-highlight transition-all duration-500">
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-sidebar-gradient"></div>

                                <h3 className="text-xl font-bold text-primary-dark mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-[#10B981]" />
                                    </div>
                                    Execute Query
                                </h3>

                                <form onSubmit={handleSearch} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-blue uppercase tracking-wider ml-1">
                                            Semantic Search
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Search className="h-5 w-5 text-[#10B981]/70" />
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="e.g. Server deployment instructions"
                                                className="w-full pl-11 pr-4 py-4 bg-white/60 border border-divider rounded-xl text-primary-dark placeholder-secondary-blue/60 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all font-medium backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 px-6 bg-[#10B981] hover:bg-[#059669] text-primary-dark rounded-xl font-bold text-lg shadow-lg shadow-[#10B981]/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    >
                                        <Activity className="w-5 h-5" />
                                        Search Database
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-divider flex items-center justify-between text-xs font-semibold text-secondary-blue">
                                    <span>Powered by MongoDB Atlas</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Feature Cards Section */}
            <div className="bg-secondary-gradient border-t border-divider flex-1 w-full pb-16 pt-16">
                <div className="max-w-7xl mx-auto px-6 sm:px-12">
                    <div className="grid md:grid-cols-3 gap-8">

                        <div className="glass-card-premium p-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm border border-divider/50">
                                <Network className="w-6 h-6 text-[#10B981]" />
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-3">Semantic Vector Search</h3>
                            <p className="text-secondary-blue leading-relaxed font-medium text-sm">
                                Understand the meaning behind every query using AI-powered vector embeddings. Velora finds relevant MongoDB documents even when exact keywords are not used.
                            </p>
                        </div>

                        <div className="glass-card-premium p-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm border border-divider/50">
                                <Database className="w-6 h-6 text-[#10B981]" />
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-3">MongoDB Atlas</h3>
                            <p className="text-secondary-blue leading-relaxed font-medium text-sm">
                                Integrated with MongoDB Atlas Vector Search for fast, scalable, and intelligent document retrieval across indexed data.
                            </p>
                        </div>

                        <div className="glass-card-premium p-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm border border-divider/50">
                                <Layers className="w-6 h-6 text-[#10B981]" />
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-3">Document Analytics</h3>
                            <p className="text-secondary-blue leading-relaxed font-medium text-sm">
                                Track search activity, monitor document insights, and manage semantic search performance through a clean and interactive analytics dashboard.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
