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
      <div className="bg-dark rounded-sm overflow-hidden">
        {/* Pixel bar */}
        <div className="flex h-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${
                [0, 1, 3, 4, 6, 7].includes(i)
                  ? i % 3 === 0
                    ? 'bg-accent'
                    : 'bg-surface'
                  : 'bg-cream/10'
              }`}
            />
          ))}
        </div>

        <CardHeader />
        <IdentitySection />
        <MatchedSkillsSection />
        <CardFooter />
      </div>
    </GradientBorder>
  )
}
