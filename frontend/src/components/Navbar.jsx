import React from 'react'
import { Sparkles, Bot, GitPullRequest, Bug, BarChart3, LogOut, Terminal, CheckCircle2, ChevronDown, Home, HelpCircle, Shield, ShieldCheck } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, username, userRole = 'team_lead', onSwitchRole, onLogout, onGoHome, onOpenGuide }) {
  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#05070f]/80 backdrop-blur-2xl sticky top-0 z-50 flex items-center justify-between px-6 select-none">
      {/* Brand Logo & Home action */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          data-cursor="Return Home"
          title="Return to Landing Page"
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#3186FF] via-[#00B95C] to-[#FBBC04] p-[1.5px] shadow-md shadow-blue-500/25 cursor-pointer group"
        >
          <div className="w-full h-full bg-[#05070f] group-hover:bg-slate-900 rounded-full flex items-center justify-center transition-colors">
            <Sparkles className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <div className="flex items-baseline gap-2">
          <button
            onClick={onGoHome}
            className="text-base font-bold tracking-tight text-white hover:text-blue-300 transition-colors cursor-pointer"
          >
            DevSphere
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Workspace
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs (Capsule Style) */}
      <nav className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 shadow-inner">
        <button
          onClick={() => setActiveTab('chat')}
          data-cursor="Module 1"
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-slate-950 shadow-md ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Codebase Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          data-cursor="Module 2"
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-white text-slate-950 shadow-md ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>PR Code Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('bugs')}
          data-cursor="Module 3"
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'bugs'
              ? 'bg-white text-slate-950 shadow-md ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>Bug Triage</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          data-cursor="Module 4"
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-950 shadow-md ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Team Analytics</span>
        </button>
      </nav>

      {/* Right User & Actions Area */}
      <div className="flex items-center gap-3">
        {/* Interactive Role Switcher Toggle (FR-5 demo mode) */}
        <button
          onClick={() => onSwitchRole && onSwitchRole(userRole === 'team_lead' ? 'developer' : 'team_lead')}
          data-cursor="Switch Role"
          title="Click to toggle role between Team Lead and Developer view"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
            userRole === 'team_lead' || userRole === 'admin'
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>{userRole === 'team_lead' || userRole === 'admin' ? 'Role: Team Lead' : 'Role: Developer'}</span>
        </button>

        {/* Interactive Guide Quick Button */}
        <button
          onClick={onOpenGuide}
          data-cursor="Tour Guide"
          title="Open Interactive Tour"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Tour</span>
        </button>

        {/* Backend Online Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>FastAPI + pgvector</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {username ? username.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline-block max-w-[100px] truncate">
            {username || 'Developer'}
          </span>
          <button
            onClick={onLogout}
            data-cursor="Log Out"
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
