import { motion } from 'framer-motion'
import type { MatchedSkill } from '@skill-builder/shared/src/types'

interface MatchedSkillBlockProps {
  skill: MatchedSkill
  index: number
}

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function MatchedSkillBlock({ skill, index }: MatchedSkillBlockProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 22,
        delay: index * 0.1,
      }}
      className="flex items-center justify-between bg-surface-secondary border-2 border-surface-secondary px-3.5 py-2"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="font-display text-[10px] uppercase text-cream truncate">
          {skill.name}
        </span>
        <span className="text-[9px] font-body text-muted shrink-0">
          {formatInstalls(skill.installs)} INSTALLS
        </span>
      </div>
      <span className="text-[9px] font-body uppercase text-accent shrink-0">
        SKILLS.SH
      </span>
    </motion.div>
  )
}
