import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useConversationStore } from '../../lib/store'
import { MatchedSkillBlock } from './MatchedSkillBlock'

const VISIBLE_COUNT = 4

export function MatchedSkillsSection() {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasOverflow = activeSkills.length > VISIBLE_COUNT
  const visible = expanded ? activeSkills : activeSkills.slice(0, VISIBLE_COUNT)
  const hiddenCount = activeSkills.length - VISIBLE_COUNT

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-0.5 bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">
          Matched Skills
        </span>
        <div className="flex-1 h-0.5 bg-cream/10" />
      </div>

      <div
        ref={scrollRef}
        className={expanded ? 'max-h-[160px] overflow-y-auto scrollbar-thin' : ''}
      >
        <div className="space-y-2">
          <AnimatePresence mode="sync">
            {visible.map((skill, i) => (
              <MatchedSkillBlock key={skill.skillId} skill={skill} index={i} />
            ))}
          </AnimatePresence>

          {activeSkills.length === 0 && (
            <div className="flex items-center justify-center py-2 px-3.5 border-2 border-dashed border-[#A898804D]">
              <span className="text-[10px] font-body uppercase text-[#A8988066]">
                Select domains to start scanning skills...
              </span>
            </div>
          )}
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
          {expanded ? 'Show less' : `+${hiddenCount} more skills`}
        </button>
      )}
    </div>
  )
}
