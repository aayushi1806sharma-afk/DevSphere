import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import {
  GitPullRequest,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  FileCode2,
  RefreshCw,
  GitCommit,
  Sparkles
} from 'lucide-react'

export default function PRReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | completed | pending | failed

  const [selectedReview, setSelectedReview] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await apiClient.get('/api/reviews')
      setReviews(res.data || [])
    } catch (err) {
      setLoadError(err.response?.data?.detail || 'Could not load past PR reviews.')
    } finally {
      setLoading(false)
    }
  }

  const openReview = async (review) => {
    const [owner, repoName] = review.repo_full_name.split('/')
    setDetailLoading(true)
    setSelectedReview({ ...review, issues: [] })
    try {
      const res = await apiClient.get(`/api/reviews/${owner}/${repoName}/${review.pr_number}`)
      setSelectedReview(res.data)
    } catch (err) {
      setSelectedReview({ ...review, issues: [], loadFailed: true })
    } finally {
      setDetailLoading(false)
    }
  }

  // Analytics KPI counts
  const totalReviews = reviews.length
  const totalIssuesFound = reviews.reduce((sum, r) => sum + (r.issues_found || 0), 0)
  const completedCount = reviews.filter((r) => r.status === 'completed').length
  const successRate = totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 100

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.repo_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.pr_number).includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (selectedReview) {
    return (
      <ReviewDetail
        review={selectedReview}
        loading={detailLoading}
        onBack={() => setSelectedReview(null)}
      />
    )
  }

  return (
    <div className="flex-1 w-full h-full bg-[#05070f] overflow-y-auto p-6 lg:p-10 select-text font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold tracking-wide mb-2">
              <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
              <span>Automated GitHub Webhook Reviews</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              PR Code Reviews
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Autonomous Gemini code reviews triggered automatically by GitHub pull request events.
            </p>
          </div>

          <button
            onClick={loadReviews}
            disabled={loading}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Reviews</span>
          </button>
        </div>

        {/* Analytics KPI Metrics Cards (Google Antigravity Rounded Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Reviews
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{totalReviews}</span>
              <span className="text-xs text-slate-400">runs</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Issues Flagged
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 font-mono">{totalIssuesFound}</span>
              <span className="text-xs text-slate-400">detected</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Passed Rate
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 font-mono">{successRate}%</span>
              <span className="text-xs text-slate-400">clean</span>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg backdrop-blur-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Webhook Listener
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-300">Active</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by repo or PR #…"
              className="w-full pl-10 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-full border border-white/10 w-full sm:w-auto">
            {['all', 'completed', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading pull request reviews…</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{loadError}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !loadError && filteredReviews.length === 0 && (
          <div className="py-16 text-center rounded-[32px] bg-slate-900/40 border border-white/10 p-8 backdrop-blur-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-slate-400 mb-3 border border-white/10">
              <GitPullRequest className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-white">No Pull Request reviews found</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Configure the webhook on your GitHub repository to point to your DevSphere backend. When a PR is opened or updated, it will show up here immediately.
            </p>
          </div>
        )}

        {/* Review Cards Grid */}
        <div className="grid gap-3">
          {filteredReviews.map((r) => (
            <button
              key={r.id}
              onClick={() => openReview(r)}
              className="w-full text-left p-5 rounded-[24px] bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-lg group cursor-pointer backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-mono font-bold text-white group-hover:text-blue-300 transition-colors">
                      {r.repo_full_name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-[11px] font-mono text-blue-300 border border-white/10">
                      <GitPullRequest className="w-3 h-3" />
                      PR #{r.pr_number}
                    </span>
                    {r.commit_sha && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-slate-400 border border-white/10">
                        <GitCommit className="w-2.5 h-2.5" />
                        {r.commit_sha.slice(0, 7)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTime(r.created_at)}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-medium ${
                        r.issues_found === 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {r.issues_found === 0
                        ? 'Clean PR (0 issues)'
                        : `${r.issues_found} issue${r.issues_found === 1 ? '' : 's'} identified`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusPill status={r.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewDetail({ review, loading, onBack }) {
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [copiedIndex, setCopiedIndex] = useState(null)

  const issues = review.issues || []
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const suggestionCount = issues.filter((i) => i.severity === 'suggestion').length

  const filteredIssues = issues.filter((i) =>
    selectedSeverity === 'all' ? true : i.severity === selectedSeverity
  )

  const handleCopyIssue = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const githubPrUrl = `https://github.com/${review.repo_full_name}/pull/${review.pr_number}`

  return (
    <div className="flex-1 w-full h-full bg-[#05070f] overflow-y-auto p-6 lg:p-10 select-text font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all reviews</span>
        </button>

        {/* PR Header Banner */}
        <div className="p-6 sm:p-8 rounded-[32px] bg-slate-900/60 border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-xl font-bold font-mono text-white">
                  {review.repo_full_name}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-white/5 text-xs font-mono text-blue-300 border border-white/10">
                  PR #{review.pr_number}
                </span>
                <StatusPill status={review.status} />
              </div>
              <p className="text-xs text-slate-400">
                Created on {formatTime(review.created_at)} • Commit{' '}
                <span className="font-mono text-slate-300">{review.commit_sha?.slice(0, 7)}</span>
              </p>
            </div>

            <a
              href={githubPrUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <span>View PR on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Severity Counters Bar */}
          <div className="pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium mr-1">Filter by severity:</span>
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              All ({issues.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('critical')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'critical'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold'
                  : 'bg-white/5 text-red-400/80 hover:text-red-300'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setSelectedSeverity('warning')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'bg-white/5 text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Warnings ({warningCount})
            </button>
            <button
              onClick={() => setSelectedSeverity('suggestion')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'suggestion'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold'
                  : 'bg-white/5 text-blue-400/80 hover:text-blue-300'
              }`}
            >
              Suggestions ({suggestionCount})
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading code review issues…</p>
          </div>
        )}

        {/* Failed Review Summary */}
        {!loading && review.status === 'failed' && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Review Failed</p>
              <p className="mt-1 text-slate-300">{review.summary || 'An unexpected error occurred during review analysis.'}</p>
            </div>
          </div>
        )}

        {/* Clean Review */}
        {!loading && issues.length === 0 && review.status === 'completed' && (
          <div className="p-8 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-emerald-300">Clean Pull Request</h3>
            <p className="text-xs text-emerald-400/80 max-w-md mx-auto">
              DevSphere AI analyzed the code diff and found no critical bugs, safety vulnerabilities, or anti-patterns.
            </p>
          </div>
        )}

        {/* Issues List */}
        {!loading && filteredIssues.length > 0 && (
          <div className="space-y-3">
            {filteredIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-5 rounded-[24px] bg-slate-900/50 border border-white/10 shadow-lg space-y-3 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <SeverityPill severity={issue.severity} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{issue.file_path}</span>
                      <span className="text-blue-300">: Line {issue.line_number}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyIssue(`${issue.file_path}:${issue.line_number} - ${issue.comment}`, idx)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 font-sans">
                  {issue.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const config = {
    pending: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400 animate-ping',
      label: 'Pending',
    },
    completed: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      label: 'Completed',
    },
    failed: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      dot: 'bg-red-400',
      label: 'Failed',
    },
  }[status] || {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    label: status,
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  )
}

function SeverityPill({ severity }) {
  const config = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'CRITICAL',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'WARNING',
    },
    suggestion: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      label: 'SUGGESTION',
    },
  }[severity] || {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-slate-400',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: severity?.toUpperCase() || 'INFO',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border tracking-wider ${config.bg} ${config.border} ${config.text}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  )
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}