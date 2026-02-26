'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@phosphor-icons/react'
import type { IdentityModel } from '@skill-builder/shared'

interface IdentityCardProps {
  identity: IdentityModel | null
}

const spring = { type: 'spring' as const, stiffness: 140, damping: 20 }

const depthToWidth: Record<string, string> = {
  beginner: '25%',
  proficient: '50%',
  advanced: '75%',
  expert: '100%',
}

export function IdentityCard({ identity }: IdentityCardProps) {
  const completionPercent = identity?.completionPercent ?? 0
  const gradientOpacity = Math.max(0.3, Math.min(1.0, completionPercent / 100))
  const traits = identity?.personality.traits ?? []
  const expertise = identity?.expertise ?? []
  const totalTraits = traits.length

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem]"
      style={{ opacity: gradientOpacity }}
    >
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-orange-200 to-amber-200" />
      <div className="absolute inset-0 bg-gradient-to-tl from-violet-200/40 via-transparent to-transparent" />

      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-1 flex-col gap-5 p-6">
        {/* Avatar + identity header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
            {identity?.avatar ? (
              <img
                src={identity.avatar}
                alt={identity.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User size={24} weight="regular" className="text-white/70" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-medium text-white drop-shadow-sm">
              {identity?.name || 'Your Identity'}
            </p>
            <p className="truncate text-sm text-white/70">
              {identity?.role || 'Discovering...'}
            </p>
          </div>
        </div>

        {/* Completion stat */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={completionPercent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
              className="text-5xl font-light tracking-tighter text-white drop-shadow-sm"
            >
              {completionPercent}%
            </motion.div>
          </AnimatePresence>
          <p className="mt-1 text-xs text-white/50">identity complete</p>
        </div>

        {/* Trait chips */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {traits.map((trait) => (
                <motion.span
                  key={trait.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={spring}
                  layout
                  className={`rounded-full px-3 py-1 text-xs ${
                    trait.source === 'confirmed' || trait.source === 'artifact'
                      ? 'border border-white/20 bg-white/30 text-white'
                      : 'border border-dashed border-white/15 bg-white/15 text-white/70'
                  }`}
                >
                  {trait.label}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Skill bars */}
        {expertise.length > 0 && (
          <div className="mt-auto space-y-2.5">
            {expertise.map((skill) => (
              <div key={skill.domain} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">{skill.domain}</span>
                  <span className="text-[10px] text-white/40">{skill.depth}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: depthToWidth[skill.depth] || '25%' }}
                    transition={{ ...spring, stiffness: 100 }}
                    className="h-full rounded-full bg-white/60"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Traits count footer */}
        <p className="mt-auto text-[11px] text-white/50">
          {totalTraits} trait{totalTraits !== 1 ? 's' : ''} discovered
        </p>
      </div>
    </div>
  )
}
