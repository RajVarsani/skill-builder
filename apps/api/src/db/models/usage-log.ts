import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface IUsageLog extends Document {
  conversationId: Types.ObjectId | null
  userId: Types.ObjectId | null
  source: 'conversation' | 'skill_generation'
  modelId: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  createdAt: Date
}

const usageLogSchema = new Schema<IUsageLog>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['conversation', 'skill_generation'], required: true },
    modelId: { type: String, required: true },
    inputTokens: { type: Number, required: true },
    outputTokens: { type: Number, required: true },
    costUsd: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

usageLogSchema.index({ userId: 1 })
usageLogSchema.index({ conversationId: 1 })

export const UsageLog = mongoose.model<IUsageLog>('UsageLog', usageLogSchema)
