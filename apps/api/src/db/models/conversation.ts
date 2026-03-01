import mongoose, { Schema, type Document, type Types } from 'mongoose'
import type {
  ConversationPhase,
  BlockConfidence,
  BlockSourceType,
  BlockStatus,
  SkillStatus,
} from '@skill-builder/shared/src/types'

export interface IBlockState {
  blockId: string
  category: string
  label: string
  detail: string
  confidence: BlockConfidence
  sourceType: BlockSourceType
  status: BlockStatus
}

export interface IMatchedSkill {
  skillId: string
  name: string
  source: string
  installs: number
  relevanceScore: number
  status: SkillStatus
}

export interface IMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: unknown[]
  phase: ConversationPhase
  createdAt: Date
}

export interface IConversation extends Document {
  userId: Types.ObjectId
  phase: ConversationPhase
  selectedDomains: string[]
  blockStates: IBlockState[]
  matchedSkills: IMatchedSkill[]
  messages: IMessage[]
  skillMarkdown: string | null
  status: 'active' | 'completed' | 'abandoned'
  createdAt: Date
  updatedAt: Date
}

const blockStateSchema = new Schema<IBlockState>(
  {
    blockId: { type: String, required: true },
    category: { type: String, required: true },
    label: { type: String, required: true },
    detail: { type: String, required: true },
    confidence: { type: String, enum: ['low', 'medium', 'high'], required: true },
    sourceType: { type: String, enum: ['inferred', 'stated', 'confirmed'], required: true },
    status: { type: String, enum: ['tentative', 'confirmed'], default: 'tentative' },
  },
  { _id: false }
)

const matchedSkillSchema = new Schema<IMatchedSkill>(
  {
    skillId: { type: String, required: true },
    name: { type: String, required: true },
    source: { type: String, required: true },
    installs: { type: Number, default: 0 },
    relevanceScore: { type: Number, default: 0 },
    status: { type: String, enum: ['proposed', 'confirmed', 'rejected'], default: 'proposed' },
  },
  { _id: false }
)

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    toolCalls: { type: Schema.Types.Mixed },
    phase: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phase: {
      type: String,
      enum: ['domain_discovery', 'rapid_profiling', 'review', 'published'],
      default: 'domain_discovery',
    },
    selectedDomains: [{ type: String }],
    blockStates: [blockStateSchema],
    matchedSkills: [matchedSkillSchema],
    messages: [messageSchema],
    skillMarkdown: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
  },
  { timestamps: true }
)

conversationSchema.index({ userId: 1, status: 1 })

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema)
