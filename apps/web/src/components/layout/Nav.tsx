import { useAuth } from '../../lib/auth'

interface NavProps {
  step?: number
}

export function Nav({ step }: NavProps) {
  const { user, isAuthenticated } = useAuth()

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-accent">
      <span className="font-display text-lg uppercase tracking-wider text-surface">
        Skill Builder
      </span>

      <div className="flex items-center gap-4">
        {step && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              Step {step} of 4
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${
                    s <= step ? 'bg-accent' : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-cream text-xs font-bold uppercase">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
    </nav>
  )
}
