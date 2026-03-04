import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { useNavigate } from 'react-router'
import { GlitchLogo } from '../GlitchLogo'

interface NavProps {
  step?: number
  onStartFresh?: () => void
  onPublish?: () => void
  publishEnabled?: boolean
}

export function Nav({ step, onStartFresh, onPublish, publishEnabled }: NavProps) {
  const { user, isAuthenticated, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <nav className="flex items-center justify-between px-4 md:px-[60px] py-4 md:py-5 border-b-[3px] border-surface">
      <button onClick={() => navigate('/')}>
        <GlitchLogo size="sm" />
      </button>

      <div className="flex items-center gap-2 md:gap-4">
        {step && (
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline font-body text-[14px] uppercase tracking-[0.08em] text-surface">
              Step {step} of 4
            </span>
            <div className="flex gap-1 md:gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-5 md:w-8 h-1.5 ${
                    s <= step ? 'bg-accent' : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {onStartFresh && (
          <button
            onClick={onStartFresh}
            className="px-3 md:px-4 py-2 border border-muted/40 font-display text-[9px] uppercase tracking-[0.04em] text-muted/60 hover:border-surface hover:text-surface transition-colors"
          >
            Start Fresh
          </button>
        )}

        {onPublish && (
          <button
            onClick={onPublish}
            disabled={!publishEnabled}
            className="px-4 py-2 bg-accent font-display text-[10px] uppercase tracking-[0.04em] text-cream hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Publish
          </button>
        )}

        {isAuthenticated && user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 bg-accent flex items-center justify-center text-cream text-xs font-display uppercase"
            >
              {user.name.charAt(0)}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 bg-cream border-2 border-surface py-1 z-50 min-w-[140px]">
                <div className="px-4 py-2 border-b border-muted/20">
                  <span className="font-body text-[11px] text-surface-secondary truncate block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 font-display text-[10px] uppercase tracking-[0.04em] text-surface hover:bg-surface/5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
