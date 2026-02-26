import type { IdentityModel, IdentityUpdate } from '@skill-builder/shared'

export function createEmptyIdentityModel(name: string, avatar?: string): IdentityModel {
  return {
    name,
    avatar,
    domains: [],
    personality: { traits: [], values: [] },
    communication: {},
    decisionPatterns: {},
    expertise: [],
    artifacts: [],
    subSkills: { overrides: [], custom: [] },
    completionPercent: 0,
  }
}

export function applyUpdate(model: IdentityModel, update: IdentityUpdate): IdentityModel {
  const next = structuredClone(model)

  switch (update.type) {
    case 'personality_trait_added':
      next.personality.traits.push(update.trait)
      break
    case 'personality_trait_confirmed': {
      const trait = next.personality.traits.find(t => t.label === update.traitLabel)
      if (trait) trait.source = 'confirmed'
      break
    }
    case 'domain_added':
      next.domains.push(update.domain.name)
      next.expertise.push({
        domain: update.domain.name,
        depth: update.domain.depth as 'beginner' | 'proficient' | 'advanced' | 'expert',
        subSkills: [],
        tools: [],
        opinions: [],
      })
      break
    case 'communication_updated':
      (next.communication as Record<string, string>)[update.field] = update.value
      break
    case 'decision_pattern_added':
      if (update.pattern.kind === 'rejects') {
        next.decisionPatterns.consistentlyRejects ??= []
        next.decisionPatterns.consistentlyRejects.push(update.pattern.value)
      } else if (update.pattern.kind === 'prioritizes') {
        next.decisionPatterns.consistentlyPrioritizes ??= []
        next.decisionPatterns.consistentlyPrioritizes.push(update.pattern.value)
      } else if (update.pattern.kind === 'heuristic') {
        next.decisionPatterns.defaultHeuristic = update.pattern.value
      }
      break
    case 'completion_updated':
      next.completionPercent = update.percent
      break
    case 'full_model_sync':
      return update.model
  }

  return next
}
