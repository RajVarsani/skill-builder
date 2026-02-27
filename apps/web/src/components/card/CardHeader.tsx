import { useAuth } from '../../lib/auth'
import { useConversationStore } from '../../lib/store'

export function CardHeader() {
  const { user } = useAuth()
  const completion = useConversationStore((s) => s.completion)
  const blocks = useConversationStore((s) => s.blocks)

  const name = user?.name || 'Unknown'
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const domains = [...new Set(blocks.map((b) => b.category))]
  const domainLabel =
    domains.length > 0
      ? domains.slice(0, 3).join(' + ').toUpperCase()
      : 'AWAITING DOMAINS...'

  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-sm shrink-0">
          <span className="font-display text-sm text-cream">{initials}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base uppercase tracking-wide text-cream truncate">
            {name}
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-cream/40">
            {domainLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-cream/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
        <span className="text-xs font-mono text-accent">{completion.percentage}%</span>
      </div>
    </div>
  )
}
