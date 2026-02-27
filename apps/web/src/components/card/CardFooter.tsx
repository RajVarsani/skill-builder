import { useConversationStore } from '../../lib/store'

export function CardFooter() {
  const completion = useConversationStore((s) => s.completion)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cream/10">
      <span className="text-[10px] font-mono uppercase tracking-widest text-cream/40">
        {completion.blocksDiscovered} Blocks Discovered
      </span>
      <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
        {completion.skillsMatched} Skills Matched
      </span>
    </div>
  )
}
