import { PHASE_LABELS, PHASE_STEP } from '@actingas/shared/src/types'
import type { ConversationPhase } from '@actingas/shared/src/types'

interface PhaseIndicatorProps {
  phase: ConversationPhase
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const step = PHASE_STEP[phase]
  const label = PHASE_LABELS[phase]

  return (
    <div className="flex items-center gap-4 pt-6 pb-5">
      <span className="bg-accent text-cream text-[10px] font-display uppercase px-3 py-1">
        Phase {step}
      </span>
      <span className="text-[12px] font-display uppercase tracking-[0.05em] text-surface">
        {label}
      </span>
      <div className="flex-1 h-0.5 bg-muted/20" />
    </div>
  )
}
