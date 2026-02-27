import { useConversationStore } from '../../lib/store'
import { IdentityBlock } from './IdentityBlock'

export function IdentitySection() {
  const blocks = useConversationStore((s) => s.blocks)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-px bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-widest text-accent">
          Identity
        </span>
        <div className="flex-1 h-px bg-cream/10" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {blocks.map((block, i) => (
          <IdentityBlock key={block.blockId} block={block} index={i} />
        ))}

        {blocks.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <span
              key={`placeholder-${i}`}
              className="inline-flex px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-cream/20 border border-dashed border-cream/15 rounded-sm"
            >
              ???
            </span>
          ))}
      </div>
    </div>
  )
}
