import { useConversationStore } from '../../lib/store'
import { IdentityBlock } from './IdentityBlock'

export function IdentitySection() {
  const blocks = useConversationStore((s) => s.blocks)

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-0.5 bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">
          Identity
        </span>
        <div className="flex-1 h-0.5 bg-cream/10" />
      </div>

      <div className="flex flex-wrap gap-2">
        {blocks.map((block, i) => (
          <IdentityBlock key={block.blockId} block={block} index={i} />
        ))}

        {blocks.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <span
              key={`placeholder-${i}`}
              className="inline-flex px-3.5 py-1.5 text-[10px] font-display uppercase text-[#A8988080] border-2 border-dashed border-[#A8988066]"
            >
              ???
            </span>
          ))}
      </div>
    </div>
  )
}
