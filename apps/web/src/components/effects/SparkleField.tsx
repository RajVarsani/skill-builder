import { useEffect, useRef } from 'react'

const COLORS = ['#E8604C', '#F8A91F', '#EC6426', '#72AC43', '#E4A5CA', '#FDE3CF', '#2E573A', '#FFD700']

type Shape = 'square' | 'plus' | 'diamond' | 'star' | 'dot'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  color: string
  shape: Shape
  opacity: number
  phase: number
  speed: number
  driftX: number
  driftY: number
}

const SHAPES: Shape[] = ['square', 'plus', 'diamond', 'star', 'dot']

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color

  const s = p.size

  switch (p.shape) {
    case 'square':
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
      break

    case 'dot':
      ctx.fillRect(p.x - s / 4, p.y - s / 4, s / 2, s / 2)
      break

    case 'plus': {
      const t = Math.max(1, s / 3)
      ctx.fillRect(p.x - s / 2, p.y - t / 2, s, t)
      ctx.fillRect(p.x - t / 2, p.y - s / 2, t, s)
      break
    }

    case 'diamond': {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - s / 2)
      ctx.lineTo(p.x + s / 2, p.y)
      ctx.lineTo(p.x, p.y + s / 2)
      ctx.lineTo(p.x - s / 2, p.y)
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'star': {
      const arm = s / 2
      const t = Math.max(1, s / 4)
      // Horizontal
      ctx.fillRect(p.x - arm, p.y - t / 2, arm * 2, t)
      // Vertical
      ctx.fillRect(p.x - t / 2, p.y - arm, t, arm * 2)
      // Diagonal TL-BR
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-arm * 0.6, -t / 2, arm * 1.2, t)
      ctx.fillRect(-t / 2, -arm * 0.6, t, arm * 1.2)
      ctx.restore()
      break
    }
  }
}

function createParticles(w: number, h: number, count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    particles.push({
      x,
      y,
      baseX: x,
      baseY: y,
      size: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      opacity: Math.random() * 0.5 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
      driftX: (Math.random() - 0.5) * 30,
      driftY: (Math.random() - 0.5) * 20,
    })
  }
  return particles
}

export function SparkleField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    let animId: number
    let particles: Particle[] = []

    function resize() {
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      particles = createParticles(canvas.width, canvas.height, 45)
    }

    resize()

    let time = 0
    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 1

      for (const p of particles) {
        const t = time * p.speed + p.phase
        p.x = p.baseX + Math.sin(t) * p.driftX
        p.y = p.baseY + Math.cos(t * 0.7) * p.driftY

        // Gentle pulse on opacity
        const pulse = Math.sin(t * 1.5) * 0.15
        ctx.globalAlpha = Math.max(0.05, p.opacity + pulse)

        drawParticle(ctx, p)
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}
