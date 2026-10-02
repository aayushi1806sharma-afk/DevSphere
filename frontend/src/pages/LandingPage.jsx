import { useState } from 'react'
import Mascot from '../components/Mascot'
import ZeroGravityParticles from '../components/ZeroGravityParticles'
import {
  Sparkles,
  Bot,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Database,
  ExternalLink,
  ChevronRight,
  Code2,
  Terminal,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileCode2,
  Layers,
  Cpu,
  Play,
  RotateCcw
} from 'lucide-react'

function GithubIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function LandingPage({ onLaunchApp, onOpenGuide }) {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'reviews'

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col overflow-x-hidden relative font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Zero Gravity Particle Field Canvas */}
      <ZeroGravityParticles />

      {/* Google Antigravity Signature Chromatic Glows */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-amber-500/10 via-rose-500/10 to-cyan-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* FLOATING CAPSULE NAVBAR (Google Antigravity Style) */}
      <div className="sticky top-5 z-40 w-full px-4 sm:px-8 max-w-5xl mx-auto">
        <header className="rounded-full border border-white/10 bg-slate-950/70 backdrop-blur-2xl px-5 sm:px-6 h-14 flex items-center justify-between shadow-2xl shadow-black/50">
          {/* Brand */}
          <div
            onClick={() => scrollTo('hero')}
            data-cursor="DevSphere Home"
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Chromatic Google Antigravity Orb */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#3186FF] via-[#00B95C] to-[#FBBC04] p-[1.5px] shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#05070f] rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
              DevSphere
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors cursor-pointer">
              About
            </button>
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
              Liftoff Guide
            </button>
            <button onClick={() => scrollTo('tech-stack')} className="hover:text-white transition-colors cursor-pointer">
              Tech Stack
            </button>
            <button
              onClick={onOpenGuide}
              data-cursor="Interactive Tour"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-slate-300"
            >
              <HelpCircle className="w-3 h-3 text-blue-400" />
              <span>Tour</span>
            </button>
          </nav>

          {/* Pure White Capsule CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              data-cursor="Liftoff! 🚀"
              className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs shadow-lg shadow-white/10 transition-all duration-300 flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-16 sm:pt-24 pb-20 px-6 lg:px-12 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Antigravity Chromatic Pill Badge */}
        <div
          data-cursor="Gemini + pgvector"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium tracking-wide mb-6 shadow-sm backdrop-blur-xl hover:border-blue-500/40 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 animate-ping" />
          <span>DevSphere 2.0 • AI-Powered Liftoff for Developer Teams</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
          Experience liftoff for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            your codebase.
          </span>
        </h1>

        {/* Project Name & Relatable Tagline */}
        <p className="mt-5 text-lg sm:text-xl font-medium text-slate-200 max-w-2xl leading-snug">
          An AI-Powered Developer Productivity & Team Intelligence Platform
        </p>

        <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
          Ask natural-language questions about any GitHub repository with exact line citations, and let our AI bot review your Pull Requests before you merge.
        </p>

        {/* Action Buttons in Antigravity Capsule Style */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onLaunchApp}
            data-cursor="Enter Workspace"
            className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-white/10 transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <span>Get Started with DevSphere</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenGuide}
            data-cursor="Watch Walkthrough"
            className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer backdrop-blur-xl shadow-lg"
          >
            <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span>Interactive Guide</span>
          </button>
        </div>

        {/* Zero-G Mascot Devvy */}
        <div className="mt-14 flex flex-col items-center">
          <Mascot />
        </div>
      </section>

      {/* FEATURE EXPLORER SECTION (Google Antigravity Style) */}
      <section id="features" className="py-20 px-6 lg:px-12 border-t border-white/[0.06] bg-slate-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
              Feature Explorer
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 tracking-tight">
              Two Modules. Zero Friction.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Everything your team needs to understand complex codebases and automate PR code reviews.
            </p>
          </div>

          {/* Google Antigravity Capsule Switcher */}
          <div className="flex justify-center mb-8">
            <div className="p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl flex gap-1 shadow-inner">
              <button
                onClick={() => setActiveTab('chat')}
                data-cursor="Module 1"
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Codebase Intelligence</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                data-cursor="Module 2"
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>AI PR Code Review</span>
              </button>
            </div>
          </div>

          {/* Antigravity Rounded-3xl Card Display */}
          <div
            data-cursor={activeTab === 'chat' ? 'RAG Engine' : 'Diff Inspector'}
            className="rounded-[32px] bg-slate-900/60 border border-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Chromatic Corner Gradient */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            {activeTab === 'chat' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">chauhankanak90/devsphere</span>
                    <span className="text-slate-400">: main</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-mono">
                    142 chunks in pgvector
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs sm:text-sm text-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Developer Question:</span>
                  "How does the RAG pipeline find code chunks and formulate grounded answers with line numbers?"
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs sm:text-sm text-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>DevSphere AI Grounded Synthesis:</span>
                  </div>
                  <p className="leading-relaxed text-slate-300 text-xs sm:text-sm">
                    DevSphere retrieves the top cosine similarity matches from PostgreSQL (<code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded">code_chunks</code> table using the <code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded">&lt;=&gt;</code> pgvector operator). Gemini reads only those chunks to construct an answer and generates clickable source citations linking to the exact file and lines on GitHub.
                  </p>
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Verified Sources:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-blue-300">
                      <Code2 className="w-3 h-3 text-blue-400" />
                      <span>app/services/db_vector_service.py:54-82</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300">
                    <GitPullRequest className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white">PR #12: Refactor auth JWT expiry handling</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono">
                    Status: Verified
                  </span>
                </div>

                <div className="grid gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px] tracking-wide">
                      CRITICAL
                    </span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-mono text-slate-400 block mb-1">backend/app/api/auth.py:42</span>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        JWT secret fallback detected: <code className="text-red-300 bg-red-950/40 px-1 rounded">os.getenv("JWT_SECRET", "default_secret")</code> allows tokens signed with default keys in production. Always raise a configuration error if missing.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] tracking-wide">
                      WARNING
                    </span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-mono text-slate-400 block mb-1">backend/app/config.py:18</span>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        Access token expiration is set to 30 days. Recommend reducing to 24 hours with a refresh token mechanism for improved session security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (LIFTOFF SEQUENCE) */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
              Liftoff Sequence
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 tracking-tight">
              How DevSphere Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From repository ingestion to automated reviews on GitHub, everything is streamlined.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Connect Repo',
                desc: 'Enter your GitHub repo (owner/name/branch). DevSphere securely reads the tree through GitHub REST APIs.',
              },
              {
                step: '02',
                title: 'Vectorize',
                desc: 'Files are segmented with start/end line numbers and converted to high-dimensional embeddings using Gemini.',
              },
              {
                step: '03',
                title: 'Query & Cite',
                desc: 'Ask questions in plain English. DevSphere performs semantic search and writes grounded answers with line citations.',
              },
              {
                step: '04',
                title: 'Automate PRs',
                desc: 'GitHub webhooks trigger real-time AI code reviews. Diffs are analyzed and inline comments are posted automatically.',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                data-cursor={`Step ${s.step}`}
                className="p-6 rounded-[28px] bg-slate-900/40 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-3 group backdrop-blur-xl"
              >
                <span className="text-xs font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {s.step} // SEQUENCE
                </span>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / MISSION SECTION */}
      <section id="about" className="py-20 px-6 lg:px-12 border-t border-white/[0.06] bg-slate-950/60">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/80 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            <div className="max-w-2xl space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                Capstone Project
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                DevSphere — Built for High Velocity Engineering
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                DevSphere was engineered as a final-year B.Tech capstone project to demonstrate the practical application of RAG (Retrieval-Augmented Generation) and autonomous LLM agents in real-world software engineering workflows.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  FastAPI Backend
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  Google Gemini Embeddings
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  Supabase pgvector
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  GitHub HMAC Webhooks
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section id="tech-stack" className="py-20 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-8 tracking-tight">
            Engineered with Modern Technologies
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'FastAPI', desc: 'Python Async Engine', icon: <Terminal className="w-5 h-5 text-blue-400" /> },
              { name: 'React + Vite', desc: 'Client Interface', icon: <Code2 className="w-5 h-5 text-teal-400" /> },
              { name: 'pgvector', desc: 'Supabase Vector DB', icon: <Database className="w-5 h-5 text-emerald-400" /> },
              { name: 'Gemini AI', desc: 'Embeddings & Chat', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
              { name: 'GitHub API', desc: 'REST & Webhooks', icon: <GithubIcon className="w-5 h-5 text-slate-300" /> },
              { name: 'JWT Auth', desc: 'Bcrypt Security', icon: <ShieldCheck className="w-5 h-5 text-rose-400" /> },
            ].map((tech, i) => (
              <div
                key={i}
                data-cursor={tech.name}
                className="p-4 rounded-[22px] bg-slate-900/40 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col items-center justify-center text-center backdrop-blur-xl"
              >
                <div className="mb-2 p-2.5 rounded-full bg-white/5 border border-white/10">
                  {tech.icon}
                </div>
                <span className="text-xs font-bold text-white">{tech.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{tech.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 px-6 lg:px-12 border-t border-white/[0.06] bg-[#03050c] text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">DevSphere</span>
            <span>— AI-Powered Developer Productivity Platform</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Final Year B.Tech Project • Full Working Modules
          </div>

          <button
            onClick={onLaunchApp}
            className="text-xs text-white hover:text-blue-300 font-semibold transition-colors cursor-pointer"
          >
            Launch Platform →
          </button>
        </div>
      </footer>
    </div>
  )
}
