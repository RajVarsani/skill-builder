import type { ReactNode } from 'react'

interface GradientBorderProps {
  completion: number
  children: ReactNode
}

export function GradientBorder({ completion, children }: GradientBorderProps) {
  const t = Math.min(1, completion / 100)
  const borderWidth = 3

  return (
    <div
      className="transition-all duration-700"
      style={{
        padding: `${borderWidth}px`,
        background: `linear-gradient(135deg,
          rgba(224,74,47,${0.15 + t * 0.85}),
          rgba(26,16,8,${0.9 - t * 0.3}),
          rgba(224,74,47,${0.1 + t * 0.7}),
          rgba(26,16,8,${0.9 - t * 0.3}),
          rgba(224,74,47,${0.15 + t * 0.85}))`,
        boxShadow: t > 0.8
          ? `0 0 ${12 + (t - 0.8) * 100}px rgba(224,74,47,${0.2 + (t - 0.8) * 1.5}), inset 0 0 ${6 + (t - 0.8) * 40}px rgba(224,74,47,0.05)`
          : 'none',
      }}
    >
      {children}
    </div>
  )
}
