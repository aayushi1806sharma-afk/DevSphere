import { useState } from 'react'
import {
  X,
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
  HelpCircle
} from 'lucide-react'

export default function GuideModal({ isOpen, onClose, onLaunchApp }) {
  const [activeStep, setActiveStep] = useState(0)

  if (!isOpen) return null

  const steps = [
    {
      id: 'welcome',
      badge: 'DevSphere Tour',
      title: 'What is DevSphere?',
      subtitle: 'An AI-Powered Developer Productivity & Team Intelligence Platform',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <p>
            <strong className="text-white">DevSphere</strong> is designed for high-velocity software engineering teams, featuring two end-to-end working modules:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1.5">
                <Bot className="w-4 h-4" />
                <span>1. Codebase Intelligence (RAG)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect any public GitHub repository. DevSphere converts your code into semantic embeddings with Google Gemini and PostgreSQL (Supabase pgvector) so you can query code in natural language with verifiable line-range citations.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1.5">
                <GitPullRequest className="w-4 h-4" />
                <span>2. AI PR Code Review</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                GitHub webhooks send Pull Request events to the FastAPI backend. HMAC signatures are cryptographically verified, and Gemini reviews each file diff, outputting structured issues (critical, warning, suggestion) directly on the PR.
              </p>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Click through this interactive tour to see the liftoff sequence for both modules.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'step1',
      badge: 'Liftoff Sequence • 01',
      title: 'Connecting & Indexing a Repository',
      subtitle: 'What happens when you enter owner/repo and click "Index Repository"',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">1</span>
              <div>
                <strong className="text-white block mb-0.5">GitHub REST API Ingestion:</strong>
                FastAPI traverses the repository tree, reading supported code files (.py, .js, .java, .cpp, .go, .sql, etc.).
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">2</span>
              <div>
                <strong className="text-white block mb-0.5">Semantic Syntax Chunking:</strong>
                Code is split into logical segments while meticulously recording <code className="text-blue-300">start_line</code> and <code className="text-blue-300">end_line</code> numbers.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">3</span>
              <div>
                <strong className="text-white block mb-0.5">Google Gemini Embeddings:</strong>
                Each chunk is converted into high-dimensional vector representations via Google Gemini's Embedding API.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">4</span>
              <div>
                <strong className="text-white block mb-0.5">Supabase pgvector Storage:</strong>
                Embeddings are persisted into PostgreSQL with the pgvector extension. Future questions query existing vectors instantly without re-indexing.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'step2',
      badge: 'Liftoff Sequence • 02',
      title: 'Querying Code with Grounded RAG',
      subtitle: 'Zero hallucinations: Answers grounded strictly in retrieved repository code',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            When you ask a question like <em>"Where is database connection pooling handled?"</em>:
          </p>
          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-blue-400 font-semibold">1. Semantic Vector Match</div>
            <div className="text-slate-400 pl-4">→ Converts question to vector & calculates cosine distance against pgvector code chunks.</div>
            <div className="text-emerald-400 font-semibold">2. Gemini Contextual Synthesis</div>
            <div className="text-slate-400 pl-4">→ Gemini reads ONLY the top matching code snippets to produce a clean, factual explanation.</div>
            <div className="text-amber-400 font-semibold">3. Clickable GitHub Citations</div>
            <div className="text-slate-400 pl-4">→ Produces citation badges like <span className="text-cyan-300">db.py:45-62</span> that open the exact GitHub source file!</div>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            💡 Chat history is persisted per user and repository in PostgreSQL, so conversation continuity is maintained across sessions.
          </p>
        </div>
      ),
    },
    {
      id: 'step3',
      badge: 'Liftoff Sequence • 03',
      title: 'Autonomous PR Code Review Bot',
      subtitle: 'Automated GitHub webhooks & Gemini diff inspections',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            When a developer submits or pushes changes to a GitHub Pull Request:
          </p>
          <div className="grid gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Cryptographic Webhook Verification:</strong>
                GitHub sends an HTTP POST event to FastAPI (<code className="text-emerald-300">/api/webhooks/github</code>). The HMAC SHA-256 signature is verified with <code className="text-emerald-300">GITHUB_WEBHOOK_SECRET</code>.
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
              <Bot className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Gemini Code Analysis:</strong>
                The diff is parsed and reviewed by Gemini with specialized code-review prompts to catch bugs, security issues, and performance bottlenecks.
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
              <GitPullRequest className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Automatic PR Comments & Dashboard:</strong>
                Structured review comments are posted directly on the GitHub PR, and saved to PostgreSQL for tracking on the DevSphere dashboard.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'demo',
      badge: 'Presentation Cheatsheet',
      title: 'How to Present This Project',
      subtitle: 'A smooth, impressive demonstration flow for evaluators and recruiters',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <p className="font-semibold text-white">Recommended Demo Sequence:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300">
              <li><strong>Landing Showcase:</strong> Show the Google Antigravity-style hero, zero-gravity particles, and Devvy mascot.</li>
              <li><strong>Instant Sign In:</strong> Click "Launch Platform" and use "Auto-fill Demo Credentials" to sign in with zero typing.</li>
              <li><strong>Module 1 (Codebase Q&A):</strong> Switch to a recent indexed repo (or index a new public one), click any starter prompt, and demonstrate the answer with clickable GitHub source citations.</li>
              <li><strong>Module 2 (PR Code Reviews):</strong> Open "PR Code Reviews" tab, click a review card, and demonstrate the severity filtering (Critical, Warning, Suggestion) and "View PR on GitHub" link.</li>
            </ol>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[activeStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-[32px] bg-[#080c16]/95 border border-white/15 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-white/5 text-blue-400 border border-white/10">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Interactive Tour
              </span>
              <h3 className="text-base font-bold text-white">DevSphere Liftoff Guide</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Capsule Selectors */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto p-2 gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeStep === idx
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {idx === 0 ? 'Overview' : idx === 4 ? 'Demo Flow' : `Step ${idx}`}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-blue-300 border border-white/10">
              {current.badge}
            </span>
            <h4 className="text-lg font-bold text-white mt-2.5">{current.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
          </div>

          <div className="pt-2">{current.content}</div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeStep === idx ? 'w-6 bg-blue-400' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Previous
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose()
                  if (onLaunchApp) onLaunchApp()
                }}
                className="px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch DevSphere</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
