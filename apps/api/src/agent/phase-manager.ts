import type { Phase } from '@skill-builder/shared'

export function getNextPhase(current: Phase, signal: string): Phase | null {
  switch (current.type) {
    case 'domain_discovery':
      if (signal === 'domains_selected') {
        return { type: 'deep_discovery', domains: [], questionCount: 0 }
      }
      break
    case 'deep_discovery':
      if (signal === 'discovery_complete') {
        return { type: 'artifact_collection', pendingArtifacts: [] }
      }
      break
    case 'artifact_collection':
      if (signal === 'artifacts_complete' || signal === 'skip_artifacts') {
        return { type: 'skill_assembly', subStep: 'proposal' }
      }
      break
    case 'skill_assembly':
      if (signal === 'proposal_confirmed' && current.subStep === 'proposal') {
        return { type: 'skill_assembly', subStep: 'roleplay' }
      }
      if (signal === 'roleplay_confirmed' && current.subStep === 'roleplay') {
        return { type: 'skill_assembly', subStep: 'publish' }
      }
      break
  }
  return null
}

export function getPhaseLabel(phase: Phase): string {
  switch (phase.type) {
    case 'domain_discovery':
      return 'domain_discovery'
    case 'deep_discovery':
      return 'deep_discovery'
    case 'artifact_collection':
      return 'artifact_collection'
    case 'skill_assembly':
      return `skill_assembly_${phase.subStep}`
  }
}
