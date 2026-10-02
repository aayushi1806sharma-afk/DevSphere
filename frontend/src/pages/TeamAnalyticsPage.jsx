import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FolderGit2,
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  GitPullRequest,
  Check,
  Copy,
  TrendingUp,
  TrendingDown,
  Flame,
  Bug,
  Activity,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Minus,
  ArrowRight,
  Zap,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatLastUpdated(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function SeverityDot({ level }) {
  const cls =
    level === 'High' ? 'bg-red-400' : level === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} shrink-0`} />
}

function AnimatedBar({ pct, color }) {
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function KPICard({ label, value, unit, sub, icon: Icon, accent, trend }) {
  const accents = {
    blue: 'from-blue-600/20 to-blue-500/5 border-blue-500/25',
    emerald: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/25',
    purple: 'from-purple-600/20 to-purple-500/5 border-purple-500/25',
    amber: 'from-amber-600/20 to-amber-500/5 border-amber-500/25',
    red: 'from-red-600/20 to-red-500/5 border-red-500/25',
  }
  const iconAccents = {
    blue: 'bg-blue-500/15 text-blue-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    purple: 'bg-purple-500/15 text-purple-400',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
  }
  const valueAccents = {
    blue: 'text-blue-300',
    emerald: 'text-emerald-300',
    purple: 'text-purple-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br ${accents[accent]} border backdrop-blur-xl relative overflow-hidden group`}
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ring-1 ring-white/10" />

      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconAccents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold font-mono tracking-tight ${valueAccents[accent]}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>

      {sub && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === 'neutral' && <Minus className="w-3 h-3 text-slate-500" />}
          <span>{sub}</span>
        </div>
      )}
    </div>
  )
}

function SectionCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl bg-slate-900/60 border border-white/[0.07] shadow-xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}

function EmptyPlaceholder({ icon: Icon, text, sub }) {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-center">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <p className="text-xs font-semibold text-slate-400">{text}</p>
      {sub && <p className="text-[11px] text-slate-600">{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TeamAnalyticsPage({ userRole, onSwitchRole }) {
  const [repoKey, setRepoKey] = useState('')
  const [indexedRepos, setIndexedRepos] = useState([])
  const [period, setPeriod] = useState('7d')

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const [openBugs, setOpenBugs] = useState([])
  const [bugsLoading, setBugsLoading] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [showAllBugs, setShowAllBugs] = useState(false)

  const [copiedSummary, setCopiedSummary] = useState(false)

  const isLeadOrAdmin = userRole === 'team_lead' || userRole === 'admin' || userRole === 'lead'

  // Load indexed repos on mount
  useEffect(() => {
    loadIndexedRepos()
  }, [])

  // Reload everything when repo or period changes
  useEffect(() => {
    if (repoKey && isLeadOrAdmin) {
      handleRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoKey, period, isLeadOrAdmin])

  const loadIndexedRepos = async () => {
    try {
      const res = await apiClient.get('/api/repos/indexed')
      const list = res.data?.repos || []
      setIndexedRepos(list)
      if (list.length > 0 && !repoKey) {
        setRepoKey(list[0].repo_key)
      }
    } catch {
      // ignore
    }
  }

  const loadAnalytics = useCallback(async (key, p) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/api/analytics', {
        params: { repo_key: key, period: p },
      })
      setAnalytics(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to load analytics. Check that the backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepoBugs = useCallback(async (key) => {
    setBugsLoading(true)
    try {
      const res = await apiClient.get('/api/bugs', { params: { repo_key: key } })
      const all = res.data?.bugs || []
      setOpenBugs(all.filter((b) => (b.status || 'open').toLowerCase() === 'open'))
    } catch {
      setOpenBugs([])
    } finally {
      setBugsLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (!repoKey) return
    loadAnalytics(repoKey, period)
    loadRepoBugs(repoKey)
    setShowAllBugs(false)
  }, [repoKey, period, loadAnalytics, loadRepoBugs])

  const handleResolveBug = async (bugId) => {
    setResolvingId(bugId)
    try {
      await apiClient.patch(`/api/analytics/bugs/${bugId}/status`, { status: 'resolved' })
      await Promise.all([loadAnalytics(repoKey, period), loadRepoBugs(repoKey)])
    } catch (err) {
      console.error('Failed to resolve bug:', err)
    } finally {
      setResolvingId(null)
    }
  }

  const handleCopySummary = () => {
    if (analytics?.ai_summary) {
      navigator.clipboard.writeText(analytics.ai_summary)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    }
  }

  // ─────────────────────────────────────────────
  // Role Access Guard
  // ─────────────────────────────────────────────
  if (!isLeadOrAdmin) {
    return (
      <div className="flex-1 w-full h-full bg-[#05070f] flex items-center justify-center p-6 select-text">
        <div className="max-w-sm w-full p-8 rounded-3xl bg-gradient-to-br from-amber-950/30 to-slate-900/60 border border-amber-500/20 shadow-2xl backdrop-blur-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The Team Analytics Dashboard is only visible to{' '}
              <span className="text-amber-300 font-semibold">Team Lead</span> and{' '}
              <span className="text-amber-300 font-semibold">Admin</span> roles.
            </p>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <span className="text-slate-500">Your current role</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-semibold text-[10px] uppercase tracking-wide">
              {userRole || 'developer'}
            </span>
          </div>
          <button
            onClick={() => onSwitchRole?.('team_lead')}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Switch to Team Lead (Demo)
          </button>
        </div>
      </div>
    )
  }

  // Derived metrics
  const sevBreakdown = analytics?.bug_severity_breakdown || { low: 0, medium: 0, high: 0 }
  const totalBugs = (sevBreakdown.low || 0) + (sevBreakdown.medium || 0) + (sevBreakdown.high || 0)
  const highPct = totalBugs > 0 ? Math.round((sevBreakdown.high / totalBugs) * 100) : 0
  const medPct = totalBugs > 0 ? Math.round((sevBreakdown.medium / totalBugs) * 100) : 0
  const lowPct = totalBugs > 0 ? Math.round((sevBreakdown.low / totalBugs) * 100) : 0

  const visibleBugs = showAllBugs ? openBugs : openBugs.slice(0, 4)
  const maxChurn = analytics?.top_churn_files?.[0]?.count || 1

  return (
    <div className="flex-1 w-full h-full bg-[#05070f] overflow-y-auto select-text">
      <div className="max-w-6xl mx-auto px-5 lg:px-10 py-8 space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                <span>Team Lead Dashboard</span>
              </div>
              {lastUpdated && (
                <span className="text-[11px] text-slate-600">
                  Updated {formatLastUpdated(lastUpdated)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Team Velocity &amp; Health
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Aggregated from PR Reviews · Bug Triage · Gemini AI Insights
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period toggle */}
            <div className="flex items-center p-1 bg-white/[0.04] rounded-full border border-white/10 gap-0.5">
              {['7d', '30d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    period === p
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || !repoKey}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Repo Selector ── */}
        <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            Repository
          </div>
          <div className="flex flex-wrap gap-2">
            {indexedRepos.length === 0 && (
              <span className="text-xs text-slate-500 italic">No indexed repos found</span>
            )}
            {indexedRepos.map((r) => (
              <button
                key={r.repo_key}
                onClick={() => setRepoKey(r.repo_key)}
                className={`text-xs font-mono px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  repoKey === r.repo_key
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold shadow-sm shadow-blue-500/10'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <span>{r.repo_key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/8 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── No repo selected ── */}
        {!repoKey && !loading && (
          <div className="py-24 text-center">
            <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500">Select a repository above</p>
            <p className="text-xs text-slate-600 mt-1">Analytics will load automatically</p>
          </div>
        )}

        {/* ── Loading Spinner (initial) ── */}
        {loading && !analytics && repoKey && (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-blue-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Aggregating review &amp; bug intelligence…</p>
          </div>
        )}

        {/* ── Main Dashboard ── */}
        {analytics && (
          <div className="space-y-6">

            {/* 1. KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Avg PR Turnaround"
                value={analytics.avg_pr_turnaround_hours}
                unit="hrs"
                icon={Clock}
                accent="blue"
                sub={analytics.avg_pr_turnaround_hours === 0 ? 'No completed reviews' : 'Target < 4h'}
                trend={
                  analytics.avg_pr_turnaround_hours === 0
                    ? 'neutral'
                    : analytics.avg_pr_turnaround_hours < 4
                    ? 'up'
                    : 'down'
                }
              />
              <KPICard
                label="Bug Resolution Rate"
                value={`${analytics.bugs_resolved_pct}%`}
                icon={CheckCircle2}
                accent={analytics.bugs_resolved_pct >= 80 ? 'emerald' : analytics.bugs_resolved_pct >= 50 ? 'amber' : 'red'}
                sub={`${analytics.bugs_resolved} resolved · ${analytics.bugs_open} open`}
                trend={analytics.bugs_resolved_pct >= 80 ? 'up' : analytics.bugs_resolved_pct >= 50 ? 'neutral' : 'down'}
              />
              <KPICard
                label="Pull Requests"
                value={analytics.prs_merged}
                unit="distinct"
                icon={GitPullRequest}
                accent="purple"
                sub={`${analytics.prs_reviewed} review runs`}
                trend="neutral"
              />
              <KPICard
                label="Bugs Triaged"
                value={analytics.bugs_total}
                unit="total"
                icon={Bug}
                accent={sevBreakdown.high > 0 ? 'red' : 'amber'}
                sub={`${sevBreakdown.high} High · ${sevBreakdown.medium} Med · ${sevBreakdown.low} Low`}
                trend={sevBreakdown.high > 2 ? 'down' : 'neutral'}
              />
            </div>

            {/* 2. AI Summary Banner */}
            <SectionCard>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Gemini Executive Summary</h3>
                      <span className="text-[10px] text-slate-500">
                        AI-synthesized from Module 2 + Module 3 data
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-slate-200 leading-relaxed">
                  {loading ? (
                    <span className="text-slate-500 italic">Regenerating summary…</span>
                  ) : (
                    analytics.ai_summary
                  )}
                </div>
              </div>
            </SectionCard>

            {/* 3. Churn Hotspots + Severity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Churn Hotspots (3 cols) */}
              <SectionCard className="lg:col-span-3">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">Code Churn Hotspots</h3>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wide">
                      Reviews + Bugs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Files with the most flagged review comments and bug reports combined.
                  </p>

                  {analytics.top_churn_files.length === 0 ? (
                    <EmptyPlaceholder
                      icon={FileCode2}
                      text="No hotspots detected"
                      sub="No concentrated review or bug activity in this window"
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {analytics.top_churn_files.map((item, idx) => {
                        const pct = Math.round((item.count / maxChurn) * 100)
                        const heatColor =
                          idx === 0
                            ? 'from-red-500 to-amber-400'
                            : idx === 1
                            ? 'from-amber-500 to-yellow-400'
                            : 'from-blue-500 to-blue-400'

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:border-white/[0.1] transition-colors space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    idx === 0
                                      ? 'bg-red-500/20 text-red-300'
                                      : idx === 1
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-slate-700/60 text-slate-400'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <span className="font-mono text-slate-200 truncate">{item.file}</span>
                              </div>
                              <span className="font-bold text-white shrink-0 font-mono">{item.count}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${heatColor} rounded-full transition-all duration-700`}
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <GitPullRequest className="w-3 h-3" />
                                {item.review_issues} review
                              </span>
                              <span className="flex items-center gap-1">
                                <Bug className="w-3 h-3" />
                                {item.bug_reports} bug
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Severity Breakdown (2 cols) */}
              <SectionCard className="lg:col-span-2">
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Bug Severity</h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Distribution of triaged defects over the selected period.
                  </p>

                  {totalBugs === 0 ? (
                    <EmptyPlaceholder
                      icon={Bug}
                      text="No bugs logged"
                      sub="Zero defects triaged in this period"
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Stacked bar */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden gap-px bg-white/5">
                        {highPct > 0 && (
                          <div
                            style={{ width: `${highPct}%` }}
                            className="h-full bg-red-500 transition-all duration-700"
                            title={`High: ${sevBreakdown.high}`}
                          />
                        )}
                        {medPct > 0 && (
                          <div
                            style={{ width: `${medPct}%` }}
                            className="h-full bg-amber-400 transition-all duration-700"
                            title={`Medium: ${sevBreakdown.medium}`}
                          />
                        )}
                        {lowPct > 0 && (
                          <div
                            style={{ width: `${lowPct}%` }}
                            className="h-full bg-blue-500 transition-all duration-700"
                            title={`Low: ${sevBreakdown.low}`}
                          />
                        )}
                      </div>

                      {/* Row breakdown */}
                      <div className="space-y-2">
                        {[
                          { label: 'High', count: sevBreakdown.high, pct: highPct, bar: 'bg-red-500', text: 'text-red-300', bg: 'bg-red-500/10 border-red-500/20' },
                          { label: 'Medium', count: sevBreakdown.medium, pct: medPct, bar: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
                          { label: 'Low', count: sevBreakdown.low, pct: lowPct, bar: 'bg-blue-500', text: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' },
                        ].map(({ label, count, pct, bar, text, bg }) => (
                          <div key={label} className={`p-3 rounded-xl border ${bg} space-y-1.5`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${text}`}>{label} Severity</span>
                              <span className="font-mono font-bold text-white">
                                {count} <span className="text-slate-500 font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <AnimatedBar pct={pct} color={bar} />
                          </div>
                        ))}
                      </div>

                      <div className="text-center text-[11px] text-slate-600 font-mono">
                        {totalBugs} total bugs triaged
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* 4. Bug Resolution Queue */}
            <SectionCard>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Bug Resolution Queue</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {bugsLoading && (
                      <div className="w-3.5 h-3.5 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-xs text-slate-500">
                      {openBugs.length} open {openBugs.length === 1 ? 'issue' : 'issues'}
                    </span>
                  </div>
                </div>

                {openBugs.length === 0 && !bugsLoading ? (
                  <div className="py-8 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-300">All clear — no open bugs</p>
                    <p className="text-[11px] text-emerald-600">100% resolution rate for this repo</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {visibleBugs.map((bug) => (
                        <div
                          key={bug.bug_id}
                          className="group p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row sm:items-start gap-3"
                        >
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                  (bug.severity || '').toLowerCase() === 'high'
                                    ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                    : (bug.severity || '').toLowerCase() === 'medium'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {bug.severity || 'Medium'}
                              </span>
                              <span className="text-xs text-slate-200 font-medium truncate">
                                {bug.root_cause || bug.report_text || 'Bug report'}
                              </span>
                            </div>
                            {bug.affected_files?.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {bug.affected_files.slice(0, 3).map((f, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 truncate max-w-[180px]"
                                  >
                                    {f}
                                  </span>
                                ))}
                                {bug.affected_files.length > 3 && (
                                  <span className="text-[10px] text-slate-600">
                                    +{bug.affected_files.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleResolveBug(bug.bug_id)}
                            disabled={resolvingId === bug.bug_id}
                            className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0 group-hover:shadow-sm group-hover:shadow-emerald-500/10"
                          >
                            {resolvingId === bug.bug_id ? (
                              <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Mark Resolved
                          </button>
                        </div>
                      ))}
                    </div>

                    {openBugs.length > 4 && (
                      <button
                        onClick={() => setShowAllBugs((v) => !v)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showAllBugs ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Show fewer
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Show {openBugs.length - 4} more bugs
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  )
}
