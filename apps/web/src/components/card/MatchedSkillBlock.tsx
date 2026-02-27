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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 22,
        delay: index * 0.1,
      }}
      className="flex items-center gap-2 bg-surface/60 rounded-sm px-3 py-2"
    >
      <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-cream truncate flex-1">
        {skill.name}
      </span>
      <span className="text-[10px] font-mono text-cream/40 shrink-0">
        {formatInstalls(skill.installs)} INSTALLS
      </span>
      <span className="text-[9px] font-display uppercase tracking-wider text-accent shrink-0">
        SKILLS.SH
      </span>
    </motion.div>
  )
}
