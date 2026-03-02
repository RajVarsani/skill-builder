import { useEffect, useRef, type ReactNode } from 'react'

const COLORS = ['#E8604C', '#F8A91F', '#EC6426', '#72AC43', '#E4A5CA', '#FDE3CF', '#2E573A', '#FFD700']

type Shape = 'square' | 'plus' | 'diamond' | 'star' | 'dot' | 'ring'
const SHAPES: Shape[] = ['square', 'plus', 'diamond', 'star', 'dot', 'ring']

interface BurstParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  shape: Shape
  opacity: number
  life: number
  maxLife: number
  rotation: number
  rotSpeed: number
}

function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, shape: Shape) {
  switch (shape) {
    case 'square':
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
      break
    case 'dot':
      ctx.fillRect(x - s / 4, y - s / 4, s / 2, s / 2)
      break
    case 'plus': {
      const t = Math.max(1, s / 3)
      ctx.fillRect(x - s / 2, y - t / 2, s, t)
      ctx.fillRect(x - t / 2, y - s / 2, t, s)
      break
    }
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(x, y - s / 2)
      ctx.lineTo(x + s / 2, y)
      ctx.lineTo(x, y + s / 2)
      ctx.lineTo(x - s / 2, y)
      ctx.closePath()
      ctx.fill()
      break
    case 'star': {
      const arm = s / 2
      const t = Math.max(1, s / 4)
      ctx.fillRect(x - arm, y - t / 2, arm * 2, t)
      ctx.fillRect(x - t / 2, y - arm, t, arm * 2)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-arm * 0.6, -t / 2, arm * 1.2, t)
      ctx.fillRect(-t / 2, -arm * 0.6, t, arm * 1.2)
      ctx.restore()
      break
    }
    case 'ring': {
      ctx.lineWidth = Math.max(1, s / 4)
      ctx.beginPath()
      ctx.arc(x, y, s / 2, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
  }
}

function spawnBurst(cx: number, cy: number, count: number): BurstParticle[] {
  const particles: BurstParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3.5 + 1.5
    const maxLife = Math.random() * 40 + 30
    particles.push({
      x: cx + (Math.random() - 0.5) * 20,
      y: cy + (Math.random() - 0.5) * 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 7 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      opacity: Math.random() * 0.4 + 0.6,
      life: 0,
      maxLife,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
    })
  }
  return particles
}

interface SparkleButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function SparkleButton({ children, className = '', onClick, disabled }: SparkleButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<BurstParticle[]>([])
  const hoveringRef = useRef(false)
  const animIdRef = useRef<number>(0)
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const PAD = 150

    function resize() {
      if (!canvas || !wrap) return
      const rect = wrap.getBoundingClientRect()
      canvas.width = rect.width + PAD * 2
      canvas.height = rect.height + PAD * 2
    }
    resize()

    // Convert page mouse coords to canvas coords
    function toCanvas(e: MouseEvent) {
      if (!wrap) return { x: 0, y: 0 }
      const rect = wrap.getBoundingClientRect()
      return {
        x: e.clientX - rect.left + PAD,
        y: e.clientY - rect.top + PAD,
      }
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const alive: BurstParticle[] = []

      for (const p of particlesRef.current) {
        p.life++
        if (p.life > p.maxLife) continue

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.97
        p.vy *= 0.97
        p.rotation += p.rotSpeed

        const progress = p.life / p.maxLife
        const alpha = progress > 0.6 ? p.opacity * (1 - (progress - 0.6) / 0.4) : p.opacity

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, alpha)
        ctx.fillStyle = p.color
        ctx.strokeStyle = p.color
        drawShape(ctx, 0, 0, p.size, p.shape)
        ctx.restore()

        alive.push(p)
      }

      particlesRef.current = alive

      if (alive.length > 0 || hoveringRef.current) {
        animIdRef.current = requestAnimationFrame(animate)
      }
    }

    function handleMove(e: MouseEvent) {
      mouseRef.current = toCanvas(e)
    }

    function handleEnter(e: MouseEvent) {
      hoveringRef.current = true
      mouseRef.current = toCanvas(e)

      // Initial burst at cursor
      const { x, y } = mouseRef.current
      particlesRef.current.push(...spawnBurst(x, y, 25))
      animIdRef.current = requestAnimationFrame(animate)

      // Continuous bursts that follow the cursor
      spawnTimerRef.current = setInterval(() => {
        if (!hoveringRef.current) return
        const { x: mx, y: my } = mouseRef.current
        const jitterX = (Math.random() - 0.5) * 30
        const jitterY = (Math.random() - 0.5) * 20
        particlesRef.current.push(...spawnBurst(mx + jitterX, my + jitterY, 8))
      }, 120)
    }

    function handleLeave() {
      hoveringRef.current = false
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current)
        spawnTimerRef.current = null
      }
    }

    wrap.addEventListener('mouseenter', handleEnter)
    wrap.addEventListener('mousemove', handleMove)
    wrap.addEventListener('mouseleave', handleLeave)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
      wrap.removeEventListener('mouseenter', handleEnter)
      wrap.removeEventListener('mousemove', handleMove)
      wrap.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{ top: -150, left: -150 }}
      />
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    </div>
  )
}
