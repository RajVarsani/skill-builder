import { motion } from 'framer-motion'
import type { IdentityBlock as IBlock } from '@skill-builder/shared/src/types'

interface IdentityBlockProps {
  block: IBlock
  index: number
}

export function IdentityBlock({ block, index }: IdentityBlockProps) {
  const isConfirmed = block.status === 'confirmed'

  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isConfirmed ? 1 : 0.8, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.08,
      }}
      className={`inline-flex px-2.5 py-1 text-[11px] font-display uppercase tracking-wider rounded-sm transition-all ${
        isConfirmed
          ? 'bg-accent text-cream border border-accent'
          : 'bg-accent/70 text-cream/90 border border-accent/50'
      }`}
    >
      {block.label}
    </motion.span>
  )
}
