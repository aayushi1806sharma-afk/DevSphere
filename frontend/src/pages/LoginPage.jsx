import { useState } from 'react'
import apiClient from '../api/client'
import Mascot from '../components/Mascot'
import ZeroGravityParticles from '../components/ZeroGravityParticles'
import {
  Sparkles,
  Bot,
  GitPullRequest,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'

export default function LoginPage({ onLoginSuccess, onBackHome }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await apiClient.post(endpoint, { username, password })
      localStorage.setItem('devsphere_token', res.data.access_token)
      onLoginSuccess(res.data.username)
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoFill = () => {
    setUsername('demo_developer')
    setPassword('developer123')
  }

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col lg:flex-row overflow-hidden relative font-sans">
      {/* Zero Gravity Particles */}
      <ZeroGravityParticles />

      {/* Google Antigravity Chromatic Aurora Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Back to Home Button */}
      {onBackHome && (
        <button
          onClick={onBackHome}
          data-cursor="Back"
          className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md cursor-pointer backdrop-blur-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </button>
      )}

      {/* Left Column: Showcase & Mascot */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-14 z-10 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-slate-950/40 backdrop-blur-md mt-12 lg:mt-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium tracking-wide mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>DevSphere Intelligence Platform</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            DevSphere
          </h1>

          <p className="mt-2 text-base lg:text-lg font-medium text-slate-300 max-w-lg leading-snug">
            An AI-Powered Developer Productivity & Team Intelligence Platform
          </p>

          <p className="mt-3 text-slate-400 text-xs lg:text-sm max-w-lg leading-relaxed">
            Sign in to start querying connected GitHub repositories with Gemini RAG embeddings, or view automated webhook PR code reviews.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 grid gap-3 max-w-lg">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Module 1: Codebase Intelligence</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Natural language answers with verifiable line-range citations like <code className="text-blue-300">file.py:45-62</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Module 2: AI PR Code Review</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated HMAC webhook bot catches critical bugs and writes inline comments directly on GitHub PRs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mascot Mini Greeting */}
        <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 max-w-lg">
          <Mascot size="small" />
          <div className="text-xs text-slate-300">
            <strong className="text-white block">Evaluating for Capstone?</strong>
            Click <button onClick={handleDemoFill} className="text-blue-400 underline font-semibold cursor-pointer">"Auto-fill Demo Credentials"</button> to sign in and test the platform immediately!
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 lg:p-12 z-10">
        <div className="w-full max-w-sm rounded-[32px] bg-slate-900/70 border border-white/15 backdrop-blur-2xl p-7 sm:p-8 shadow-2xl shadow-black/80">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#3186FF] via-[#00B95C] to-[#FBBC04] p-0.5 shadow-lg shadow-blue-500/25 mb-3">
              <div className="w-full h-full bg-[#05070f] rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Sign In to DevSphere' : 'Create Free Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Access your indexed repositories and PR code reviews'
                : 'Get started with AI Codebase Intelligence in seconds'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-white/5 rounded-full border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_dev"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-cursor="Enter"
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg shadow-white/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to DevSphere' : 'Create Free Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Button */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Auto-fill Demo Credentials</span>
              <Terminal className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}