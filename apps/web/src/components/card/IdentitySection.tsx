import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useConversationStore } from '../../lib/store'
import { IdentityBlock } from './IdentityBlock'

const VISIBLE_COUNT = 5

export function IdentitySection() {
  const blocks = useConversationStore((s) => s.blocks)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasOverflow = blocks.length > VISIBLE_COUNT
  const visible = expanded ? blocks : blocks.slice(0, VISIBLE_COUNT)
  const hiddenCount = blocks.length - VISIBLE_COUNT

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-0.5 bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">
          Identity
        </span>
        <div className="flex-1 h-0.5 bg-cream/10" />
      </div>

      <div
        ref={scrollRef}
        className={expanded ? 'max-h-[120px] overflow-y-auto scrollbar-thin' : ''}
      >
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="sync">
            {visible.map((block, i) => (
              <IdentityBlock key={block.blockId} block={block} index={i} />
            ))}
          </AnimatePresence>

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

      {hasOverflow && (
        <button
          onClick={() => {
            setExpanded(!expanded)
            if (!expanded && scrollRef.current) {
              scrollRef.current.scrollTop = 0
            }
          }}
          className="mt-2 text-[9px] font-body uppercase tracking-[0.08em] text-accent hover:text-accent/80 transition-colors"
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  )
}
