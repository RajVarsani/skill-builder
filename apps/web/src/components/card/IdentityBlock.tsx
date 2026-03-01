import { motion } from 'framer-motion'
import type { IdentityBlock as IBlock } from '@actingas/shared/src/types'

interface IdentityBlockProps {
  block: IBlock
  index: number
}

export function IdentityBlock({ block, index }: IdentityBlockProps) {
  const isConfirmed = block.status === 'confirmed'

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isConfirmed ? 1 : 0.8, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
      }}
      className={`inline-flex px-3.5 py-1.5 text-[10px] font-display uppercase transition-all ${
        isConfirmed
          ? 'bg-[#E04A2F26] text-accent border-2 border-accent'
          : 'bg-[#E04A2F15] text-accent/80 border-2 border-accent/50'
      }`}
    >
      {block.label}
    </motion.span>
  )
}
