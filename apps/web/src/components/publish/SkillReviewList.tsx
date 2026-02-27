import { useConversationStore } from '../../lib/store'
import { SkillReviewRow } from './SkillReviewRow'

interface SkillReviewListProps {
  onRemove: (skillId: string) => void
}

export function SkillReviewList({ onRemove }: SkillReviewListProps) {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)

  const activeCount = matchedSkills.filter((s) => s.status !== 'rejected').length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 pb-1">
        <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
          Matched Skills
        </span>
        <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
          Confirm or Remove
        </span>
      </div>

      <div className="space-y-2">
        {matchedSkills.map((skill) => (
          <SkillReviewRow
            key={skill.skillId}
            skill={skill}
            onRemove={onRemove}
          />
        ))}
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 py-1">
          <span className="text-[11px] font-body text-muted">+</span>
          <span className="text-[11px] font-body text-muted underline cursor-pointer hover:text-surface-secondary">
            See more near-matches
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3.5 py-2 border-2 border-dashed border-muted">
        <span className="text-[13px] font-body text-accent">★</span>
        <span className="text-[11px] font-body text-surface-secondary">
          Custom skills generated from your unique expertise
        </span>
      </div>
    </div>
  )
}
