import { useAuth } from '../../lib/auth'

interface NavProps {
  step?: number
}

export function Nav({ step }: NavProps) {
  const { user, isAuthenticated } = useAuth()

  return (
    <nav className="flex items-center justify-between px-[60px] py-5 border-b-[3px] border-surface">
      <span className="font-display text-[16px] uppercase tracking-[0.05em] text-surface">
        Skill Builder
      </span>

      <div className="flex items-center gap-4">
        {step && (
          <div className="flex items-center gap-3">
            <span className="font-body text-[14px] uppercase tracking-[0.08em] text-surface">
              Step {step} of 4
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1.5 ${
                    s <= step ? 'bg-accent' : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="w-10 h-10 bg-accent flex items-center justify-center text-cream text-xs font-display uppercase">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
    </nav>
  )
}
