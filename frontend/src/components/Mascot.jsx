import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function Mascot({ size = 'default' }) {
  const [tipIndex, setTipIndex] = useState(0)

  const tips = [
    "Hi, I'm Devvy! Ready for liftoff with DevSphere? 🚀",
    "I index codebases using Google Gemini & answer with exact line numbers! 📂",
    "I automatically review Pull Requests before merge! 🛡️",
    "Floating in zero gravity • Powered by Supabase pgvector! 🪐",
  ]

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length)
  }

  const isSmall = size === 'small'

  return (
    <div
      data-cursor="Say hi to Devvy! 🤖"
      className="relative inline-flex flex-col items-center select-none group"
    >
      {/* Interactive Speech Bubble */}
      {!isSmall && (
        <div
          onClick={nextTip}
          className="mb-4 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 text-slate-200 text-xs shadow-xl shadow-black/40 backdrop-blur-xl cursor-pointer hover:border-blue-400/50 transition-all duration-300 flex items-center gap-2 max-w-xs text-center animate-bounce-slow"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
          <span className="font-medium text-[11px] leading-tight text-slate-100">{tips[tipIndex]}</span>
        </div>
      )}

      {/* Devvy Sphere Mascot Graphic in Zero Gravity */}
      <div
        onClick={nextTip}
        className={`relative cursor-pointer transition-transform duration-500 hover:scale-110 active:scale-95 ${
          isSmall ? 'w-14 h-14' : 'w-36 h-36'
        }`}
      >
        {/* Google Chromatic Iridescent Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/30 via-emerald-500/20 to-amber-500/25 blur-2xl animate-pulse" />

        {/* Mascot Robot Body (Google Antigravity Style) */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full relative z-10 drop-shadow-[0_12px_28px_rgba(49,134,255,0.35)] animate-float"
        >
          <defs>
            {/* Chromatic Visor Gradient */}
            <linearGradient id="googleChroma" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3186FF" />
              <stop offset="35%" stopColor="#8B5CF6" />
              <stop offset="70%" stopColor="#00B95C" />
              <stop offset="100%" stopColor="#FBBC04" />
            </linearGradient>

            {/* Astronaut Glass Dome */}
            <linearGradient id="domeGrad" x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Eye Glow */}
            <filter id="eyeGlowGoogle" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Zero-gravity Orbital Ring */}
          <ellipse
            cx="60"
            cy="70"
            rx="56"
            ry="14"
            fill="none"
            stroke="url(#googleChroma)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="animate-spin"
            style={{ transformOrigin: 'center', animationDuration: '14s' }}
          />

          {/* Antenna with Google Colored Pulse */}
          <line x1="60" y1="24" x2="60" y2="10" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="8" r="4.5" fill="#3186FF" filter="url(#eyeGlowGoogle)" />
          <circle cx="60" cy="8" r="3" fill="#ffffff" />

          {/* Antigravity Jet / Thrusters (Bottom) */}
          <ellipse cx="60" cy="98" rx="14" ry="4" fill="rgba(49, 134, 255, 0.4)" filter="url(#eyeGlowGoogle)" className="animate-pulse" />

          {/* Main Spherical Helmet / Body */}
          <circle cx="60" cy="62" r="40" fill="url(#domeGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {/* Front Chrome Visor */}
          <rect x="33" y="46" width="54" height="32" rx="16" fill="#030712" stroke="url(#googleChroma)" strokeWidth="2" />

          {/* Friendly Expressive Cyan/Blue Glowing Eyes */}
          <g filter="url(#eyeGlowGoogle)">
            {/* Left Eye */}
            <ellipse cx="48" cy="62" rx="4.5" ry="6" fill="#38BDF8" className="animate-blink" />
            <circle cx="46.5" cy="60" r="1.5" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse cx="72" cy="62" rx="4.5" ry="6" fill="#38BDF8" className="animate-blink" />
            <circle cx="70.5" cy="60" r="1.5" fill="#ffffff" />
          </g>

          {/* Cute Smile */}
          <path d="M 54 70 Q 60 74 66 70" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

          {/* Tiny Floating Zero-Gravity Hands */}
          <circle cx="18" cy="66" r="6" fill="#1e293b" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" className="animate-float" style={{ animationDelay: '0.5s' }} />
          <circle cx="102" cy="66" r="6" fill="#1e293b" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" className="animate-float" style={{ animationDelay: '1s' }} />
        </svg>

        {/* Small Antigravity Capsule Tag */}
        {!isSmall && (
          <div className="text-center mt-3">
            <span className="text-[10px] tracking-widest font-bold text-slate-300 uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              Devvy • Zero-G AI
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
