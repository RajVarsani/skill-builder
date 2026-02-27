// ─── Phases ──────────────────────────────────────────────
export type ConversationPhase =
  | 'domain_discovery'
  | 'rapid_profiling'
  | 'review'
  | 'published'

export const PHASE_LABELS: Record<ConversationPhase, string> = {
  domain_discovery: 'Domain Discovery',
  rapid_profiling: 'Rapid Profiling',
  review: 'Review & Publish',
  published: 'Published',
}

export const PHASE_STEP: Record<ConversationPhase, number> = {
  domain_discovery: 1,
  rapid_profiling: 2,
  review: 3,
  published: 4,
}

// ─── Blocks ──────────────────────────────────────────────
export type BlockConfidence = 'low' | 'medium' | 'high'
export type BlockSourceType = 'inferred' | 'stated' | 'confirmed'
export type BlockStatus = 'tentative' | 'confirmed'

export interface IdentityBlock {
  blockId: string
  category: string
  label: string
  detail: string
  confidence: BlockConfidence
  sourceType: BlockSourceType
  status: BlockStatus
}

// ─── Skills ──────────────────────────────────────────────
export type SkillStatus = 'proposed' | 'confirmed' | 'rejected'

export interface MatchedSkill {
  skillId: string
  name: string
  source: string
  installs: number
  relevanceScore: number
  status: SkillStatus
}

// ─── Messages ────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant'

export interface ConversationMessage {
  role: MessageRole
  content: string
  phase: ConversationPhase
  createdAt: string
}

// ─── SSE Events ──────────────────────────────────────────
export type SSEEventType =
  | 'text_chunk'
  | 'block_added'
  | 'block_confirmed'
  | 'skill_matched'
  | 'skill_confirmed'
  | 'quick_replies'
  | 'phase_change'
  | 'completion_update'
  | 'done'
  | 'error'

export interface SSEEvent<T = unknown> {
  type: SSEEventType
  data: T
}

export interface TextChunkData {
  text: string
}

export interface BlockAddedData {
  block: IdentityBlock
}

export interface BlockConfirmedData {
  blockId: string
}

export interface SkillMatchedData {
  skill: MatchedSkill
}

export interface SkillConfirmedData {
  skillId: string
  status: 'confirmed' | 'rejected'
}

export interface QuickRepliesData {
  chips: string[]
  multiSelect: boolean
}

export interface PhaseChangeData {
  phase: ConversationPhase
}

export interface CompletionUpdateData {
  percentage: number
  blocksDiscovered: number
  skillsMatched: number
}

export interface ErrorData {
  message: string
}

// ─── API Contracts ───────────────────────────────────────
export interface AuthResponse {
  token: string
  user: UserPublic
}

export interface UserPublic {
  id: string
  email: string
  name: string
  avatarUrl?: string
  hasGithub: boolean
}
