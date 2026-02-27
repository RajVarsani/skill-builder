import { useConversationStore } from '../../lib/store'
import { MatchedSkillBlock } from './MatchedSkillBlock'

export function MatchedSkillsSection() {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-0.5 bg-cream/20" />
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">
          Matched Skills
        </span>
        <div className="flex-1 h-0.5 bg-cream/10" />
      </div>

      <div className="space-y-2">
        {activeSkills.map((skill, i) => (
          <MatchedSkillBlock key={skill.skillId} skill={skill} index={i} />
        ))}

        {activeSkills.length === 0 && (
          <div className="flex items-center justify-center py-2 px-3.5 border-2 border-dashed border-[#A898804D]">
            <span className="text-[10px] font-body uppercase text-[#A8988066]">
              Select domains to start scanning 75K+ skills...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
