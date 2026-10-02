import { useState, useEffect } from 'react'

/**
 * Modern smooth trailing glowing cursor effect
 * Gives a subtle emerald tech glow following the mouse
 */
export default function CursorEffect() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
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

  // Smooth trailing effect
  useEffect(() => {
    let animationFrameId
    const updateTrailing = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.15,
        y: prev.y + (pos.y - prev.y) * 0.15,
      }))
      animationFrameId = requestAnimationFrame(updateTrailing)
    }

    animationFrameId = requestAnimationFrame(updateTrailing)
    return () => cancelAnimationFrame(animationFrameId)
  }, [pos])

  if (!isVisible) return null

  return (
    <>
      {/* Outer ambient emerald glow */}
      <div
        className="fixed pointer-events-none z-50 w-72 h-72 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-30 transition-opacity duration-300"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.15) 50%, transparent 70%)',
        }}
      />

      {/* Center precise interactive cursor dot */}
      <div
        className="fixed pointer-events-none z-50 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 bg-emerald-400 shadow-[0_0_12px_#34d399] transition-transform duration-75"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
      />
    </>
  )
}
