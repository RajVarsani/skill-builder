// Phase types
export type Phase =
  | { type: 'domain_discovery' }
  | { type: 'deep_discovery'; domains: string[]; questionCount: number }
  | { type: 'artifact_collection'; pendingArtifacts: string[] }
  | { type: 'skill_assembly'; subStep: 'proposal' | 'roleplay' | 'publish' }

// Identity model
export interface PersonalityTrait {
  label: string
  confidence: 'low' | 'medium' | 'high'
  source: 'inferred' | 'confirmed' | 'artifact'
}

export interface IdentityModel {
  name: string
  avatar?: string
  role?: string
  domains: string[]

  personality: {
    traits: PersonalityTrait[]
    values: Array<{ label: string; priority: number; reason?: string }>
    riskTolerance?: string
    conflictStyle?: string
  }

  communication: {
    tone?: string
    formality?: string
    feedbackStyle?: string
    vocabularyPatterns?: string[]
  }

  decisionPatterns: {
    defaultHeuristic?: string
    consistentlyRejects?: string[]
    consistentlyPrioritizes?: string[]
  }

  expertise: Array<{
    domain: string
    depth: 'beginner' | 'proficient' | 'advanced' | 'expert'
    subSkills: string[]
    tools: string[]
    opinions: string[]
  }>

  artifacts: Array<{
    type: 'github_repo' | 'github_pr' | 'url' | 'upload' | 'text'
    source: string
    insights: string[]
  }>

  subSkills: {
    overrides: Array<{ baseSkillName: string; customizations: string[] }>
    custom: Array<{ name: string; description: string; content?: string }>
  }

  completionPercent: number
}

// SSE event types
export type IdentityUpdate =
  | { type: 'personality_trait_added'; trait: PersonalityTrait }
  | { type: 'personality_trait_confirmed'; traitLabel: string }
  | { type: 'domain_added'; domain: { name: string; depth: string } }
  | { type: 'communication_updated'; field: string; value: string }
  | { type: 'decision_pattern_added'; pattern: { kind: string; value: string } }
  | { type: 'sub_skill_proposed'; skill: { name: string; type: 'override' | 'custom' } }
  | { type: 'sub_skill_confirmed'; skillName: string }
  | { type: 'artifact_insight'; insight: string }
  | { type: 'completion_updated'; percent: number }
  | { type: 'full_model_sync'; model: IdentityModel }

export type SSEEvent =
  | { event: 'message_chunk'; data: string }
  | { event: 'identity_update'; data: IdentityUpdate }
  | { event: 'phase_change'; data: { phase: Phase } }
  | { event: 'artifact_request'; data: { artifactType: string; prompt: string } }
  | { event: 'done'; data: Record<string, never> }

// API types
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  phase: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

// Domain options
export const DOMAINS = [
  'Engineering',
  'Design',
  'Product',
  'Data / Analytics',
  'Marketing',
  'Operations',
] as const

export type Domain = (typeof DOMAINS)[number]
