import { useConversationStore } from '../../lib/store'
import { SkillReviewRow } from './SkillReviewRow'

interface SkillReviewListProps {
  onRemove: (skillId: string) => void
}

export function SkillReviewList({ onRemove }: SkillReviewListProps) {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)

  const activeCount = matchedSkills.filter((s) => s.status !== 'rejected').length

  const rejectedCount = matchedSkills.length - activeCount

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
            Matched Skills
          </span>
          <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
            Confirm or Remove
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted">
          {activeCount} active{rejectedCount > 0 ? ` · ${rejectedCount} removed` : ''}
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
        {matchedSkills.map((skill) => (
          <SkillReviewRow
            key={skill.skillId}
            skill={skill}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 border-2 border-dashed border-muted">
        <span className="text-[13px] font-body text-accent">★</span>
        <span className="text-[11px] font-body text-surface-secondary">
          Custom skills generated from your unique expertise
        </span>
      </div>
    </div>
  )
}
