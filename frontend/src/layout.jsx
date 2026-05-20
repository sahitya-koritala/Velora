import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { useAuth } from "@/lib/AuthContext";
import {
  Search,
  LayoutDashboard,
  FileText,
  Clock,
  Shield,
  ScrollText,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BrainCircuit,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget";

const NAV_ITEMS = [
  { name: "Home", icon: BrainCircuit, page: "Home" },
  { name: "Search", icon: Search, page: "Search" },
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Documents", icon: FileText, page: "Documents" },
  { name: "Feedback", icon: MessageSquare, page: "Feedback" },
  { name: "History", icon: Clock, page: "History" },
  { name: "Policies", icon: Shield, page: "Policies" },
  { name: "Audit Logs", icon: ScrollText, page: "AuditLogs" },
  { name: "Profile", icon: UserIcon, page: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const { isAppLaunched, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show layout for Home page when not launched, or Login page
  if ((currentPageName === "Home" && !isAppLaunched) || currentPageName === "Login") {
    return children;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-main-gradient text-primary-dark font-sans relative">
      <div className="relative z-10">

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel rounded-none border-x-0 border-t-0 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-primary-dark" />
          </button>
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sidebar-gradient flex items-center justify-center shadow-md shadow-[#10B981]/20">
                <div className="w-7 h-7 rounded-lg bg-sidebar-gradient flex items-center justify-center shadow-sm shrink-0"><span className="text-white font-black text-sm">V</span></div>
              </div>
            <span className="font-bold text-primary-dark text-lg tracking-tight">Velora</span>
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-[#1F2D3D]/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 m-4 rounded-2xl glass-panel shadow-2xl z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-divider/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-gradient flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                <div className="w-7 h-7 rounded-lg bg-sidebar-gradient flex items-center justify-center shadow-sm shrink-0"><span className="text-white font-black text-sm">V</span></div>
              </div>
              <div>
                <span className="font-bold text-primary-dark text-xl tracking-tight leading-tight">Velora</span>
                <p className="text-[11px] font-semibold text-secondary-blue uppercase tracking-wider">Semantic Engine</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-secondary-blue" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 hover:bg-[#059669] translate-x-1"
                    : "text-secondary-blue hover:bg-white/50 hover:text-primary-dark"
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#10B981]/70"}`} />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/80" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-divider/40 bg-white/20 rounded-b-2xl">
            {user && (
              <>
                <div className="flex items-center gap-3 px-2 py-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sidebar-gradient flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#10B981]/20">
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-dark truncate">{user.full_name || "User"}</p>
                    <p className="text-xs font-medium text-secondary-blue truncate">{user.email}</p>
                  </div>
                  <Link to={createPageUrl("Profile")} className="p-2 rounded-xl text-secondary-blue hover:text-[#10B981] hover:bg-white/60 transition-all shadow-sm">
                    <UserIcon className="w-4 h-4" />
                  </Link>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm font-semibold text-secondary-blue hover:text-white hover:bg-red-500/90 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[320px] min-h-screen pt-20 pb-8 px-4 sm:px-8 lg:pt-8 transition-all">
        {children}
      </main>
      <ChatbotWidget />
      </div>
    </div>
  );
}
