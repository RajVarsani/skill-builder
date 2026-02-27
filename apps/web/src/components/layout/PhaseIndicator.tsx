import { PHASE_LABELS, PHASE_STEP } from '@skill-builder/shared/src/types'
import type { ConversationPhase } from '@skill-builder/shared/src/types'

interface PhaseIndicatorProps {
  phase: ConversationPhase
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const step = PHASE_STEP[phase]
  const label = PHASE_LABELS[phase]

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="bg-accent text-cream text-[10px] font-display uppercase tracking-wider px-2 py-0.5">
        Phase {step}
      </span>
      <span className="text-xs font-mono uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="flex-1 h-px bg-muted/20" />
    </div>
  )
}
