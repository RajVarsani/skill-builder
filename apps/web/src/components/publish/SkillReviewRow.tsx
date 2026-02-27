import type { MatchedSkill } from '@skill-builder/shared/src/types'

interface SkillReviewRowProps {
  skill: MatchedSkill
  onRemove: (skillId: string) => void
}

export function SkillReviewRow({ skill, onRemove }: SkillReviewRowProps) {
  const isRejected = skill.status === 'rejected'

  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-2.5 border-2 ${
        isRejected
          ? 'border-dashed border-muted opacity-45'
          : 'border-surface bg-surface'
      }`}
    >
      <button
        onClick={() => onRemove(skill.skillId)}
        className={`text-[14px] font-body w-[18px] shrink-0 ${
          isRejected ? 'text-muted line-through' : 'text-accent'
        } hover:opacity-70 transition-opacity`}
      >
        x
      </button>
      <span
        className={`font-display text-[10px] tracking-[0.04em] uppercase w-[180px] shrink-0 ${
          isRejected ? 'text-muted line-through' : 'text-cream'
        }`}
      >
        {skill.name}
      </span>
      <span className="text-[11px] font-body text-muted flex-1 truncate">
        {isRejected ? `Removed` : `${skill.source || 'Matched from dataset'}`}
      </span>
      {!isRejected && (
        <span className="text-[9px] font-body uppercase tracking-[0.08em] text-accent shrink-0">
          SKILLS.SH
        </span>
      )}
    </div>
  )
}
