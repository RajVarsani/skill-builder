import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OGImageCard } from '../og/OGImageCard'
import type { OGImageCardProps } from '../../lib/og-capture'

const TOTAL_DOTS = 7
const STEP_LABELS = [
  'GENERATING IMAGE',
  'PREPARING FILES',
  'CREATING REPO',
  'PUSHING TO GITHUB',
  'SAVING SKILL',
  'ALMOST THERE',
  'SKILL PUBLISHED',
]

// ~30s total across 6 intermediate steps
const STEP_INTERVAL = 5000

interface PublishModalProps {
  open: boolean
  ogProps: OGImageCardProps | null
  publishDone: boolean
  onComplete: () => void
}

function PixelCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position.startsWith('t')
  const isLeft = position.endsWith('l')
  return (
    <div
      className="absolute"
      style={{
        [isTop ? 'top' : 'bottom']: -2,
        [isLeft ? 'left' : 'right']: -2,
        width: 12,
        height: 12,
        borderTop: isTop ? '2px solid #E85D3A' : 'none',
        borderBottom: !isTop ? '2px solid #E85D3A' : 'none',
        borderLeft: isLeft ? '2px solid #E85D3A' : 'none',
        borderRight: !isLeft ? '2px solid #E85D3A' : 'none',
      }}
    />
  )
}

export function PublishModal({ open, ogProps, publishDone, onComplete }: PublishModalProps) {
  const [activeDot, setActiveDot] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!open) setActiveDot(0)
  }, [open])

  useEffect(() => {
    if (!open) return

    if (publishDone) {
      setActiveDot(TOTAL_DOTS - 1)
      const timer = setTimeout(() => onCompleteRef.current(), 1500)
      return () => clearTimeout(timer)
    }

    if (activeDot >= TOTAL_DOTS - 2) return

    const timer = setTimeout(() => {
      setActiveDot((d) => d + 1)
    }, STEP_INTERVAL)
    return () => clearTimeout(timer)
  }, [open, activeDot, publishDone])

  if (!ogProps) return null

  const isDone = activeDot === TOTAL_DOTS - 1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(26, 16, 8, 0.94)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
            style={{ width: 640 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 self-start">
              <div className="w-2 h-2 bg-accent shrink-0" />
              <span className="font-display text-[13px] text-cream tracking-[0.08em] uppercase">
                {isDone ? 'Published' : 'Publishing'}
              </span>
              {!isDone && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'steps(1)' }}
                  className="font-display text-[13px] text-accent"
                >
                  _
                </motion.span>
              )}
            </div>

            {/* Card frame with pixel corners */}
            <div className="relative" style={{ padding: 3 }}>
              <PixelCorner position="tl" />
              <PixelCorner position="tr" />
              <PixelCorner position="bl" />
              <PixelCorner position="br" />

              {/* Outer border */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: 600,
                  height: 315,
                  border: '1px solid #3A3530',
                  boxShadow: '0 0 0 1px #2A2520, 0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(232,93,58,0.06)',
                }}
              >
                {/* Scaled card */}
                <div
                  style={{
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                    width: 1200,
                    height: 630,
                  }}
                >
                  <OGImageCard {...ogProps} />
                </div>

                {/* Scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                  }}
                />

                {/* Vignette */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            </div>

            {/* Progress section */}
            <div className="flex flex-col items-center mt-8 gap-4" style={{ width: 600 }}>
              {/* Progress bar track */}
              <div className="w-full flex items-center gap-1">
                {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
                  const isCompleted = i < activeDot
                  const isActive = i === activeDot
                  return (
                    <motion.div
                      key={i}
                      className="flex-1"
                      style={{ height: 3 }}
                      animate={
                        isActive
                          ? { opacity: [1, 0.3, 1] }
                          : { opacity: 1 }
                      }
                      transition={
                        isActive
                          ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                          : { duration: 0.4 }
                      }
                    >
                      <div
                        className="h-full"
                        style={{
                          backgroundColor: isCompleted || isActive ? '#E85D3A' : '#3A3530',
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>

              {/* Status row */}
              <div className="w-full flex items-center justify-between">
                <span className="font-body text-[11px] text-muted tracking-[0.05em] uppercase">
                  {STEP_LABELS[activeDot]}
                </span>
                <span className="font-body text-[11px] text-muted/50">
                  {activeDot + 1}/{TOTAL_DOTS}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
