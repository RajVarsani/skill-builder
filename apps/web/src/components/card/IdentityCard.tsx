import { motion } from 'framer-motion'
import { useConversationStore } from '../../lib/store'
import { GradientBorder } from './GradientBorder'
import { CardHeader } from './CardHeader'
import { IdentitySection } from './IdentitySection'
import { MatchedSkillsSection } from './MatchedSkillsSection'
import { CardFooter } from './CardFooter'

export function IdentityCard() {
  const completion = useConversationStore((s) => s.completion)

  return (
    <GradientBorder completion={completion.percentage}>
      <motion.div
        layout
        className="bg-surface overflow-hidden"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Pixel bar */}
        <div className="flex h-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${
                [0, 1, 3, 4, 6, 7].includes(i)
                  ? i % 3 === 0
                    ? 'bg-accent'
                    : 'bg-surface-secondary'
                  : 'bg-cream/10'
              }`}
            />
          ))}
        </div>

        <CardHeader />
        <IdentitySection />
        <MatchedSkillsSection />
        <CardFooter />
      </motion.div>
    </GradientBorder>
  )
}
