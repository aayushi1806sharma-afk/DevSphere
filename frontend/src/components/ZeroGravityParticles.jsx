import { useEffect, useRef } from 'react'

/**
 * Google Antigravity Zero-Gravity Floating Particle Canvas
 * Renders chromatic glowing micro-particles floating in zero gravity
 */
export default function ZeroGravityParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Chromatic Google Antigravity Palette
    const colors = [
      'rgba(49, 134, 255, 0.45)', // Google Blue
      'rgba(0, 185, 92, 0.4)',    // Emerald Green
      'rgba(251, 188, 4, 0.4)',   // Solar Yellow
      'rgba(252, 65, 61, 0.35)',  // Coral Red
      'rgba(168, 85, 247, 0.4)',  // Purple/Gemini Violet
      'rgba(255, 255, 255, 0.5)', // Pure White Stardust
    ]

    const particleCount = Math.min(Math.floor(window.innerWidth / 20), 65)
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.15, // Floating gently upward (zero gravity liftoff)
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      })
    }

    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Floating physics
        p.x += p.vx
        p.y += p.vy
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01

        // Mouse gentle repulsion (zero gravity disturbance)
        const dx = p.x - mouseX
        const dy = p.y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120
          p.x += (dx / dist) * force * 1.5
          p.y += (dy / dist) * force * 1.5
        }

        // Wrap around screen
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        // Draw particle with soft glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  )
}
