import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import {
  Bug,
  Send,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Sparkles,
  Clock,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Layers,
  Database,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Helper: format timestamp accurately in user's local timezone
// ─────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return ''
  let safeIso = String(iso).trim()
  if (safeIso.includes(' ') && !safeIso.includes('T')) {
    safeIso = safeIso.replace(' ', 'T')
  }
  // If no timezone offset is present (+, -, or Z), treat as UTC
  if (!safeIso.endsWith('Z') && !safeIso.slice(10).includes('+') && !safeIso.slice(10).includes('-')) {
    safeIso += 'Z'
  }
  const date = new Date(safeIso)
  if (isNaN(date.getTime())) return String(iso)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─────────────────────────────────────────────
// SeverityBadge — mirrors PRReviewsPage SeverityPill
// ─────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const cfg = {
    High: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    Medium: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    Low: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
    },
  }[severity] || {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-slate-400',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border tracking-wider ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      {cfg.icon}
      <span>{(severity || 'UNKNOWN').toUpperCase()}</span>
    </span>
  )
}

// ─────────────────────────────────────────────
// TriageResultCard — shows one triage result
// ─────────────────────────────────────────────
function TriageResultCard({ result, isNew = false }) {
  const [similarOpen, setSimilarOpen] = useState(false)

  const hasSimilar = result.similar_past_issues && result.similar_past_issues.length > 0
  const hasRepoFiles = result.affected_files && result.affected_files.length > 0
  const hasExternalFiles = result.external_files && result.external_files.length > 0

  return (
    <div
      className={`p-6 rounded-[28px] bg-slate-900/60 border shadow-xl backdrop-blur-xl space-y-5 ${
        isNew ? 'border-blue-500/40 shadow-blue-500/10' : 'border-white/10'
      }`}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isNew && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold tracking-wider uppercase">
              New Result
            </span>
          )}
          <SeverityBadge severity={result.severity} />
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(result.created_at)}
        </span>
      </div>

      {/* Root Cause */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Root Cause
        </p>
        <p className="text-sm text-slate-100 leading-relaxed bg-white/[0.03] rounded-2xl p-3.5 border border-white/5">
          {result.root_cause || '—'}
        </p>
      </div>

      {/* Verified Repository Affected Files */}
      {hasRepoFiles && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Affected Repository Files
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified in Repo
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.affected_files.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* External / Library References (files mentioned in trace that are NOT in this repo) */}
      {hasExternalFiles && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Stack Trace References
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              External / Not in Repo
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.external_files.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400"
                title="This file was mentioned in the stack trace, but is an external dependency or outside this repo."
              >
                <FileCode2 className="w-3 h-3 text-slate-500 shrink-0" />
                {f}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            These files appear in the stack trace, but are external dependencies, libraries, or outside this repository.
          </p>
        </div>
      )}

      {/* When no files matched at all */}
      {!hasRepoFiles && !hasExternalFiles && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Affected Files
          </p>
          <p className="text-xs text-slate-500 italic bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
            No specific repository files directly identified in this stack trace.
          </p>
        </div>
      )}

      {/* Suggested Fix */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Suggested Fix
        </p>
        <p className="text-sm text-slate-200 leading-relaxed bg-emerald-500/5 rounded-2xl p-3.5 border border-emerald-500/10">
          {result.suggested_fix || '—'}
        </p>
      </div>

      {/* Similar Past Issues — collapsible */}
      {hasSimilar && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setSimilarOpen((p) => !p)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {similarOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              {result.similar_past_issues.length} Similar Past{' '}
              {result.similar_past_issues.length === 1 ? 'Issue' : 'Issues'}
            </span>
          </button>

          {similarOpen && (
            <div className="mt-3 space-y-2">
              {result.similar_past_issues.map((issue, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3"
                >
                  <Database className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">{issue.summary}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                    {(issue.score * 100).toFixed(0)}% match
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// BugTriagePage — main page component
// ─────────────────────────────────────────────
export default function BugTriagePage() {
  // Repo selection
  const [repoKey, setRepoKey] = useState('')
  const [indexedRepos, setIndexedRepos] = useState([])
  const [reportText, setReportText] = useState('')

  // Triage state
  const [triaging, setTriaging] = useState(false)
  const [triageError, setTriageError] = useState('')
  const [latestResult, setLatestResult] = useState(null)

  // History list
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoryBug, setSelectedHistoryBug] = useState(null)

  // Load user's indexed repositories on mount
  useEffect(() => {
    loadUserIndexedRepos()
  }, [])

  const loadUserIndexedRepos = async () => {
    try {
      const res = await apiClient.get('/api/repos/indexed')
      const repos = res.data?.repos || []
      setIndexedRepos(repos)
      // Auto-select first repo if available and repoKey is empty
      if (repos.length > 0 && !repoKey) {
        setRepoKey(repos[0].repo_key)
      }
    } catch {
      // ignore
    }
  }

  // Fetch history whenever repo changes
  useEffect(() => {
    if (repoKey.trim()) {
      loadHistory(repoKey.trim())
    } else {
      setHistory([])
    }
  }, [repoKey])

  const loadHistory = async (key) => {
    setHistoryLoading(true)
    try {
      const res = await apiClient.get('/api/bugs', { params: { repo_key: key } })
      setHistory(res.data?.bugs || [])
    } catch {
      // silently ignore — repo may have no bugs yet
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleTriage = async () => {
    if (!repoKey.trim()) {
      setTriageError('Please enter or select a repository key (e.g. owner/repo).')
      return
    }
    if (!reportText.trim()) {
      setTriageError('Please paste an error message or stack trace.')
      return
    }

    setTriageError('')
    setTriaging(true)
    setLatestResult(null)

    try {
      const res = await apiClient.post('/api/bugs/triage', {
        repo_key: repoKey.trim(),
        report_text: reportText.trim(),
      })
      const result = { ...res.data, created_at: res.data.created_at || new Date().toISOString() }
      setLatestResult(result)
      // Refresh history to include the new entry
      loadHistory(repoKey.trim())
    } catch (err) {
      setTriageError(
        err.response?.data?.detail || 'Triage failed. Check the repo is indexed and the backend is running.'
      )
    } finally {
      setTriaging(false)
    }
  }

  if (selectedHistoryBug) {
    return (
      <div className="flex-1 w-full h-full bg-[#05070f] overflow-y-auto p-6 lg:p-10 select-text font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            onClick={() => setSelectedHistoryBug(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bug Triage</span>
          </button>

          {/* Report text preview */}
          <div className="p-4 rounded-[24px] bg-slate-900/50 border border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Original Report
            </p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {selectedHistoryBug.report_text}
            </pre>
          </div>

          <TriageResultCard result={selectedHistoryBug} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full h-full bg-[#05070f] overflow-y-auto p-6 lg:p-10 select-text font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold tracking-wide mb-2">
            <Bug className="w-3.5 h-3.5 text-red-400" />
            <span>RAG-Powered Diagnosis</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Bug Triage Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Paste an error message or stack trace. DevSphere verifies against real repository files,
            retrieves past issues & code context, and diagnoses the root cause.
          </p>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Past Bugs
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{history.length}</span>
              <span className="text-xs text-slate-400">triaged</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              High Severity
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-400 font-mono">
                {history.filter((b) => b.severity === 'High').length}
              </span>
              <span className="text-xs text-slate-400">bugs</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Engine
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-300">Gemini + pgvector</span>
            </div>
          </div>
        </div>

        {/* ── Main 2-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-[28px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold text-white">Submit Bug Report</h2>

              {/* Repo Key input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Repository (owner/repo)
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={repoKey}
                    onChange={(e) => setRepoKey(e.target.value)}
                    placeholder="e.g. owner/repo"
                    className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                {/* Quick-select indexed repositories */}
                {indexedRepos.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Your Indexed Repositories:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {indexedRepos.map((r) => (
                        <button
                          key={r.repo_key}
                          type="button"
                          onClick={() => setRepoKey(r.repo_key)}
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                            repoKey === r.repo_key
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <FolderGit2 className="w-2.5 h-2.5" />
                          <span>{r.repo_key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500">
                  Must be indexed in Codebase Intelligence so code files are available.
                </p>
              </div>

              {/* Report text area */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Error / Stack Trace
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder={`Paste your error message or stack trace here…\n\nExample:\nTraceback (most recent call last):\n  File "index.html", line 42\n    TypeError: Cannot read properties of undefined`}
                  rows={12}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-slate-200 placeholder-slate-600 font-mono leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {/* Error message */}
              {triageError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{triageError}</span>
                </div>
              )}

              {/* Diagnose Button */}
              <button
                onClick={handleTriage}
                disabled={triaging}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {triaging ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Diagnosing…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Diagnose Bug</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT — Results + History */}
          <div className="lg:col-span-3 space-y-5">
            {/* Latest result */}
            {latestResult && (
              <TriageResultCard result={latestResult} isNew />
            )}

            {/* Loading spinner (first triage, no result yet) */}
            {triaging && !latestResult && (
              <div className="py-16 text-center rounded-[28px] bg-slate-900/40 border border-white/10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">
                  Retrieving context and running diagnosis…
                </p>
              </div>
            )}

            {/* History list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Past Triage Results</h2>
                {repoKey.trim() && (
                  <button
                    onClick={() => loadHistory(repoKey.trim())}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                )}
              </div>

              {!repoKey.trim() && (
                <div className="py-10 text-center rounded-[24px] bg-slate-900/40 border border-white/10">
                  <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Enter or select a repository key to see past triage results.</p>
                </div>
              )}

              {repoKey.trim() && historyLoading && (
                <div className="py-10 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                </div>
              )}

              {repoKey.trim() && !historyLoading && history.length === 0 && !latestResult && (
                <div className="py-10 text-center rounded-[24px] bg-slate-900/40 border border-white/10">
                  <Bug className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No past triage results for this repository yet.</p>
                </div>
              )}

              {history.map((bug) => (
                <button
                  key={bug.bug_id}
                  onClick={() => setSelectedHistoryBug(bug)}
                  className="w-full text-left p-4 rounded-[20px] bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SeverityBadge severity={bug.severity} />
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(bug.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{bug.root_cause}</p>
                      {bug.affected_files && bug.affected_files.length > 0 && (
                        <p className="text-[10px] text-emerald-400 font-mono truncate">
                          Repo: {bug.affected_files.slice(0, 2).join(', ')}
                          {bug.affected_files.length > 2 && ` +${bug.affected_files.length - 2}`}
                        </p>
                      )}
                      {bug.external_files && bug.external_files.length > 0 && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          Ext: {bug.external_files.slice(0, 2).join(', ')}
                          {bug.external_files.length > 2 && ` +${bug.external_files.length - 2}`}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white -rotate-90 transition-all shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
