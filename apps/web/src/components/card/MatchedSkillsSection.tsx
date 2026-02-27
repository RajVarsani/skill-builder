import { useConversationStore } from '../../lib/store'
import { MatchedSkillBlock } from './MatchedSkillBlock'

export function MatchedSkillsSection() {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-px bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-widest text-accent">
          Matched Skills
        </span>
        <div className="flex-1 h-px bg-cream/10" />
      </div>

      <div className="space-y-1.5">
        {activeSkills.map((skill, i) => (
          <MatchedSkillBlock key={skill.skillId} skill={skill} index={i} />
        ))}

        {activeSkills.length === 0 && (
          <div className="flex items-center justify-center py-4 border border-dashed border-cream/15 rounded-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cream/20">
              Select domains to start scanning 75K+ skills...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
