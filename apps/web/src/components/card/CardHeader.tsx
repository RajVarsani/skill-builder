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
    <div>
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <div className="w-12 h-12 bg-accent flex items-center justify-center shrink-0">
          <span className="font-display text-[14px] text-cream">{initials}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[16px] uppercase text-cream truncate">
            {name}
          </h2>
          <p className="text-[11px] font-body uppercase tracking-[0.1em] text-muted">
            {domainLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pb-5">
        <div className="flex-1 h-1.5 bg-cream/10 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-700"
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
        <span className="text-[12px] font-body text-accent">{completion.percentage}%</span>
      </div>
    </div>
  )
}
