import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../../lib/api'

interface SlugConflictModalProps {
  open: boolean
  defaultSlug: string
  onConfirm: (slug: string) => void
  onCancel: () => void
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

export function SlugConflictModal({ open, defaultSlug, onConfirm, onCancel }: SlugConflictModalProps) {
  const [slug, setSlug] = useState(defaultSlug)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSlug(defaultSlug)
      setAvailable(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, defaultSlug])

  const checkSlug = useCallback(async (value: string) => {
    if (!value.trim()) {
      setAvailable(null)
      return
    }
    setChecking(true)
    try {
      const { available: isAvailable } = await apiFetch<{ available: boolean }>(`/skills/check-slug/${value}`)
      setAvailable(isAvailable)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }, [])

  const handleChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    setSlug(sanitized)
    setAvailable(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => checkSlug(sanitized), 400)
  }

  const handleSubmit = () => {
    if (available && slug.trim()) onConfirm(slug)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(26, 16, 8, 0.94)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[480px]"
            style={{ padding: 3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <PixelCorner position="tl" />
            <PixelCorner position="tr" />
            <PixelCorner position="bl" />
            <PixelCorner position="br" />

            <div
              className="flex flex-col gap-6 p-8"
              style={{
                backgroundColor: '#2A2520',
                border: '1px solid #3A3530',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(232,93,58,0.06)',
              }}
            >
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent shrink-0" />
                  <span className="font-display text-[13px] text-accent tracking-[0.08em] uppercase">
                    Name Taken
                  </span>
                </div>
                <p className="font-body text-[14px] leading-[22px] text-cream/80">
                  <span className="text-cream font-display text-[12px] uppercase">acting-as-{defaultSlug}</span>{' '}
                  already exists. Pick a unique slug for your skill.
                </p>
              </div>

              {/* Input */}
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center"
                  style={{ border: `2px solid ${available === false ? '#E85D3A' : available ? '#4CAF50' : '#3A3530'}` }}
                >
                  <span
                    className="font-display text-[11px] uppercase tracking-[0.04em] px-3 py-3 shrink-0"
                    style={{ color: '#8A8070', backgroundColor: '#221E1B', borderRight: '2px solid #3A3530' }}
                  >
                    acting-as-
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={slug}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="flex-1 bg-transparent px-3 py-3 font-display text-[12px] uppercase tracking-[0.04em] text-cream outline-none placeholder:text-cream/20"
                    placeholder="your-unique-name"
                  />
                </div>
                <div className="h-4">
                  {checking && (
                    <span className="font-body text-[10px] text-muted uppercase tracking-[0.05em]">Checking...</span>
                  )}
                  {!checking && available === true && (
                    <span className="font-body text-[10px] uppercase tracking-[0.05em]" style={{ color: '#4CAF50' }}>
                      Available
                    </span>
                  )}
                  {!checking && available === false && (
                    <span className="font-body text-[10px] text-accent uppercase tracking-[0.05em]">
                      Also taken — try another
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-5 border-2 border-cream/20 font-display text-[11px] uppercase tracking-[0.04em] text-cream/60 hover:bg-cream/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!available || checking || !slug.trim()}
                  className="flex-1 py-3 px-5 bg-accent font-display text-[11px] uppercase tracking-[0.04em] text-cream disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  Publish as acting-as-{slug || '...'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
