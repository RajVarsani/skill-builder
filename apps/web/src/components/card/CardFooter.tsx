import { useConversationStore } from '../../lib/store'

export function CardFooter() {
  const completion = useConversationStore((s) => s.completion)

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t-2 border-surface-secondary">
      <span className="text-[10px] font-body uppercase tracking-[0.05em] text-muted">
        {completion.blocksDiscovered} Blocks Discovered
      </span>
      <span className="text-[10px] font-body uppercase tracking-[0.05em] text-muted">
        {completion.skillsMatched} Skills Matched
      </span>
    </div>
  )
}
