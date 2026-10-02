import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Google Antigravity Interactive Custom Cursor
 * Transforms into a pill capsule with context tags on hoverable elements
 */
export default function AntigravityCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 })
  const [cursorText, setCursorText] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)

      // Check if hovering over element with data-cursor attribute
      const target = e.target.closest('[data-cursor]')
      if (target) {
        setCursorText(target.getAttribute('data-cursor'))
      } else {
        setCursorText(null)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isVisible])

  // Smooth spring-like trailing physics
  useEffect(() => {
    let animationFrameId
    const updateTrailing = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.18,
        y: prev.y + (pos.y - prev.y) * 0.18,
      }))
      animationFrameId = requestAnimationFrame(updateTrailing)
    }

    animationFrameId = requestAnimationFrame(updateTrailing)
    return () => cancelAnimationFrame(animationFrameId)
  }, [pos])

  if (!isVisible) return null

  return (
    <>
      {/* Outer ambient chromatic Google aura */}
      <div
        className="fixed pointer-events-none z-50 w-72 h-72 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-25 transition-opacity duration-300"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          background: 'radial-gradient(circle, rgba(49, 134, 255, 0.4) 0%, rgba(168, 85, 247, 0.2) 40%, rgba(0, 185, 92, 0.1) 70%, transparent 85%)',
        }}
      />

      {/* Dynamic Cursor Entity */}
      <div
        className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
      >
        {cursorText ? (
          // Antigravity Expanded Pill Capsule
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-950 text-xs font-semibold shadow-2xl border border-slate-200/40 animate-scale-up whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
            <span>{cursorText}</span>
          </div>
        ) : (
          // Minimalist Google Chromatic Dot
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(49,134,255,0.9)] ring-2 ring-blue-500/50" />
        )}
      </div>
    </>
  )
}
