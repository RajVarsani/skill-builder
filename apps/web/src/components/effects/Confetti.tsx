import { useEffect, useRef } from 'react'

const COLORS = ['#E8604C', '#F8A91F', '#EC6426', '#72AC43', '#E4A5CA', '#2E573A', '#632713', '#FFD700', '#FF6B6B']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
  wobble: number
  wobbleSpeed: number
}

function createBurst(w: number, h: number, count: number, originY: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 4 + 1
    particles.push({
      x: Math.random() * w,
      y: originY + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.3 + Math.random() * 1.5,
      width: Math.random() * 10 + 5,
      height: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      opacity: 1,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.random() * 0.06 + 0.02,
    })
  }
  return particles
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const w = canvas.width
    const h = canvas.height

    // Multiple burst waves for full coverage
    const particles: Particle[] = [
      ...createBurst(w, h, 350, -20),       // Top rain
      ...createBurst(w, h, 150, h * 0.25),  // Upper mid
      ...createBurst(w, h, 120, h * 0.5),   // Mid
      ...createBurst(w, h, 80, h * 0.75),   // Lower mid
    ]

    // Schedule additional bursts for continuous rain
    const laterParticles: Particle[][] = []
    const burstTimings = [40, 80, 130, 180, 240]
    for (const _t of burstTimings) {
      laterParticles.push(createBurst(w, h, 100, -30))
    }

    let animId: number
    let frame = 0

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add delayed bursts
      for (let i = 0; i < burstTimings.length; i++) {
        if (frame === burstTimings[i]) {
          particles.push(...laterParticles[i])
        }
      }

      let alive = 0
      for (const p of particles) {
        // Gentle gravity — slow drift down
        p.vy += 0.06
        // Wobble side-to-side like real confetti
        p.wobble += p.wobbleSpeed
        p.x += p.vx + Math.sin(p.wobble) * 1.2
        p.y += p.vy
        p.vx *= 0.995
        p.rotation += p.rotationSpeed

        // Fade out when falling below viewport or after frame 350
        if (p.y > canvas.height + 50) {
          p.opacity = 0
        } else if (frame > 350) {
          p.opacity = Math.max(0, p.opacity - 0.005)
        }

        if (p.opacity <= 0) continue
        alive++

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color

        // Draw confetti piece — flat rectangles that tumble
        const scaleY = Math.cos(frame * 0.05 + p.wobble)
        ctx.fillRect(-p.width / 2, -p.height / 2 * scaleY, p.width, p.height * Math.abs(scaleY) + 0.5)

        ctx.restore()
      }

      frame++
      if (alive > 0 && frame < 800) {
        animId = requestAnimationFrame(animate)
      }
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}
