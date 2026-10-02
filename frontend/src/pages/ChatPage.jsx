import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import apiClient from '../api/client'
import {
  Sparkles,
  Bot,
  Send,
  GitBranch,
  Layers,
  Search,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  FileCode2,
  Terminal,
  RotateCcw,
  Clock,
  FolderGit2,
  ChevronRight,
  Database,
  ShieldCheck,
  Code2
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

export default function ChatPage({ username, onLogout, hideOwnLogout }) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')

  const [indexStatus, setIndexStatus] = useState('not-connected') // not-connected | indexing | ready | error
  const [indexError, setIndexError] = useState('')

  const [recentRepos, setRecentRepos] = useState([])
  const [searchRepoFilter, setSearchRepoFilter] = useState('')
  const [activeRepoKey, setActiveRepoKey] = useState(null)

  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAsking])

  useEffect(() => {
    loadRecentRepos()
  }, [])

  const loadRecentRepos = async () => {
    try {
      const res = await apiClient.get('/api/repos/indexed')
      setRecentRepos(res.data.repos || [])
    } catch {
      setRecentRepos([])
    }
  }

  const loadHistory = async (repoKey) => {
    const [repoOwner, repoName] = repoKey.split('/')
    try {
      const res = await apiClient.get('/api/repos/history', {
        params: { owner: repoOwner, repo: repoName },
      })
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages)
      } else {
        setMessages([
          {
            role: 'system',
            text: `Connected to **${repoKey}** (${branch || 'main'}). Grounded vector index is active in pgvector.`,
          },
        ])
      }
    } catch {
      setMessages([
        {
          role: 'system',
          text: `Connected to **${repoKey}**. Ask any question regarding the architecture, endpoints, or code implementation.`,
        },
      ])
    }
  }

  const handleConnect = async (e) => {
    e?.preventDefault()
    if (!owner.trim() || !repo.trim()) return

    setIndexStatus('indexing')
    setIndexError('')
    setMessages([])

    try {
      await apiClient.post('/api/repos/build-index', {
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
      })
      const repoKey = `${owner.trim()}/${repo.trim()}`
      setIndexStatus('ready')
      setActiveRepoKey(repoKey)
      await loadHistory(repoKey)
      loadRecentRepos()
    } catch (err) {
      setIndexStatus('error')
      setIndexError(err.response?.data?.detail || 'Could not index this repository. Verify repository name, branch, and visibility.')
    }
  }

  const handleSwitchRepo = async (repoKey) => {
    const [repoOwner, repoName] = repoKey.split('/')
    setOwner(repoOwner)
    setRepo(repoName)
    setActiveRepoKey(repoKey)
    setIndexStatus('ready')
    await loadHistory(repoKey)
  }

  const handleAsk = async (e, customPrompt) => {
    e?.preventDefault()
    const promptToSend = customPrompt || question.trim()
    if (!promptToSend || isAsking || indexStatus !== 'ready') return

    setMessages((prev) => [...prev, { role: 'user', text: promptToSend }])
    if (!customPrompt) setQuestion('')
    setIsAsking(true)

    try {
      const res = await apiClient.post('/api/repos/ask', {
        owner: owner.trim(),
        repo: repo.trim(),
        question: promptToSend,
      })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.data.answer, sources: res.data.sources },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          text: err.response?.data?.detail || 'Something went wrong while retrieving or generating the response.',
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const filteredRecentRepos = recentRepos.filter((r) =>
    r.repo_key.toLowerCase().includes(searchRepoFilter.toLowerCase())
  )

  const starterPrompts = [
    {
      title: 'Architecture Overview',
      prompt: 'Explain the high-level architecture and how the components in this codebase interact.',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
    {
      title: 'Authentication & Security',
      prompt: 'Where and how is authentication implemented, and how are tokens validated?',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'API Endpoints & Routes',
      prompt: 'List the main REST API endpoints, their request parameters, and response structures.',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
    },
    {
      title: 'Database & Schemas',
      prompt: 'What database models, tables, or storage mechanisms are defined in this project?',
      icon: <Database className="w-4 h-4 text-purple-400" />,
    },
  ]

  return (
    <div className="flex w-full h-full bg-[#05070f] overflow-hidden select-text font-sans">
      {/* LEFT SIDEBAR: Repository Connector & Switcher */}
      <aside className="w-80 shrink-0 border-r border-white/[0.08] bg-slate-950/60 backdrop-blur-xl flex flex-col h-full overflow-hidden">
        {/* Repo Connect Form Header */}
        <div className="p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 mb-1">
            <GithubIcon className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Repository Indexer
            </h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Index any public GitHub repository to enable RAG codebase queries.
          </p>
        </div>

        {/* Inputs */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Owner / Organization
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. chauhankanak90"
                disabled={indexStatus === 'indexing'}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Repository Name
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. devsphere"
                disabled={indexStatus === 'indexing'}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Branch
              </label>
              <div className="relative">
                <GitBranch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  disabled={indexStatus === 'indexing'}
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              data-cursor="Index Repo"
              disabled={indexStatus === 'indexing' || !owner.trim() || !repo.trim()}
              className="w-full py-2.5 px-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md shadow-white/10 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {indexStatus === 'indexing' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Chunking & Embedding…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Index Repository</span>
                </>
              )}
            </button>
          </form>

          {/* Status Indicators */}
          {indexStatus === 'indexing' && (
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Generating Gemini Embeddings</span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-1 leading-snug">
                Fetching GitHub tree, chunking syntax with line numbers, and syncing vectors to Supabase pgvector.
              </p>
            </div>
          )}

          {indexStatus === 'error' && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">{indexError}</p>
            </div>
          )}

          {/* RECENT REPOS SECTION */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Indexed Repositories ({recentRepos.length})
              </span>
            </div>

            {recentRepos.length > 3 && (
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchRepoFilter}
                  onChange={(e) => setSearchRepoFilter(e.target.value)}
                  placeholder="Filter repositories…"
                  className="w-full pl-7 pr-2 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-[11px] text-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredRecentRepos.map((r) => {
                const isActive = activeRepoKey === r.repo_key
                return (
                  <button
                    key={r.repo_key}
                    onClick={() => handleSwitchRepo(r.repo_key)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-start justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/40 shadow-sm shadow-blue-500/10'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <FolderGit2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono font-medium truncate ${
                            isActive ? 'text-blue-200 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          {r.repo_key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {r.chunk_count} chunks indexed
                        </span>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1 shadow-sm shadow-blue-400/50" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )
              })}

              {recentRepos.length === 0 && (
                <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                  No repos indexed yet. Connect your first repository above.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN ARENA: Interactive Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#05070f] relative">
        {/* Workspace Sub-header */}
        <div className="h-12 border-b border-white/[0.08] bg-slate-950/40 backdrop-blur-sm px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <GithubIcon className="w-4 h-4 text-blue-400 shrink-0" />
            {activeRepoKey ? (
              <div className="flex items-center gap-2 text-xs font-mono truncate">
                <span className="text-white font-semibold">{activeRepoKey}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-blue-300 border border-white/10 flex items-center gap-1">
                  <GitBranch className="w-2.5 h-2.5" />
                  {branch || 'main'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  pgvector ready
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                No active repository selected. Connect or select one from the left sidebar.
              </span>
            )}
          </div>

          {activeRepoKey && (
            <div className="flex items-center gap-2">
              <a
                href={`https://github.com/${activeRepoKey}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                onClick={() => setMessages([])}
                title="Clear current view"
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto my-auto py-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#3186FF] via-[#00B95C] to-[#FBBC04] p-0.5 shadow-xl mb-4">
                <div className="w-full h-full bg-[#05070f] rounded-full flex items-center justify-center">
                  <Bot className="w-7 h-7 text-blue-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeRepoKey ? `Explore ${activeRepoKey}` : 'DevSphere Codebase Intelligence'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                {activeRepoKey
                  ? 'Ask any natural language question grounded in the code chunks, files, and functions of this repository.'
                  : 'Connect a public GitHub repository from the left panel or click a recent repository to start asking questions.'}
              </p>

              {/* Starter Prompts Grid */}
              {activeRepoKey && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {starterPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(null, item.prompt)}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {item.icon}
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Render */}
          {messages.map((msg, idx) => (
            <div key={idx} className="max-w-3xl mx-auto">
              {msg.role === 'system' && (
                <div className="my-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-300 font-mono flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="markdown-body inline-block">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="flex justify-end gap-3 my-4">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-md text-sm leading-relaxed border border-white/10">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex items-start gap-3.5 my-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3186FF] to-[#00B95C] p-[1.5px] shrink-0 mt-1 shadow-md shadow-blue-500/20">
                    <div className="w-full h-full bg-[#05070f] rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 rounded-[24px] rounded-tl-sm bg-slate-900/70 border border-white/10 p-5 shadow-xl relative group backdrop-blur-xl">
                    {/* Header info & Copy Button */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">DevSphere Assistant</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                          Gemini RAG
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(msg.text, idx)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
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

                    {/* Markdown Body */}
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Interactive Source Citations (Capsule Style) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Retrieved Grounding Sources ({msg.sources.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((s, sIdx) => {
                            const lineLabel = s.start_line ? `:${s.start_line}-${s.end_line}` : ''
                            const githubUrl = activeRepoKey
                              ? `https://github.com/${activeRepoKey}/blob/${branch || 'main'}/${s.file_path}${
                                  s.start_line ? `#L${s.start_line}-L${s.end_line}` : ''
                                }`
                              : null

                            return (
                              <a
                                key={sIdx}
                                href={githubUrl || '#'}
                                target={githubUrl ? '_blank' : '_self'}
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 transition-all group/source"
                              >
                                <Code2 className="w-3 h-3 text-blue-400" />
                                <span>
                                  {s.file_path}
                                  <span className="text-blue-300">{lineLabel}</span>
                                </span>
                                {githubUrl && (
                                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover/source:text-blue-300 ml-0.5" />
                                )}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {msg.role === 'error' && (
                <div className="my-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              )}
            </div>
          ))}

          {/* Assistant Thinking Indicator */}
          {isAsking && (
            <div className="max-w-3xl mx-auto flex items-start gap-3.5 my-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3186FF] to-[#00B95C] p-[1.5px] shrink-0 mt-1 shadow-md shadow-blue-500/20">
                <div className="w-full h-full bg-[#05070f] rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div className="rounded-[24px] rounded-tl-sm bg-slate-900/70 border border-white/10 p-4 shadow-lg flex items-center gap-3 backdrop-blur-xl">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-slate-300">
                  Searching pgvector embeddings & generating Gemini response…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Capsule Input Bar */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-md">
          <form
            onSubmit={(e) => handleAsk(e)}
            className="max-w-3xl mx-auto flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full p-1.5 shadow-xl focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all backdrop-blur-xl"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                indexStatus === 'ready'
                  ? `Ask anything about ${activeRepoKey || 'this codebase'}…`
                  : 'Connect a repository first using the left sidebar'
              }
              disabled={indexStatus !== 'ready' || isAsking}
              className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={indexStatus !== 'ready' || isAsking || !question.trim()}
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between text-[11px] text-slate-400 px-3">
            <span>Powered by Google Gemini 1.5 Flash + Supabase pgvector</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </main>
    </div>
  )
}