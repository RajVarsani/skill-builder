import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface IPublishedSkill extends Document {
  userId: Types.ObjectId
  conversationId: Types.ObjectId
  skillName: string
  githubRepoUrl: string
  githubRepoOwner: string
  installCommand: string
  publishMethod?: 'personal' | 'org'
  blockStates: unknown[]
  matchedSkills: unknown[]
  customSkills: unknown[]
  skillFiles: Array<{ path: string; content: string }>
  createdAt: Date
  updatedAt: Date
}

const publishedSkillSchema = new Schema<IPublishedSkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    skillName: { type: String, required: true },
    githubRepoUrl: { type: String, required: true },
    githubRepoOwner: { type: String, required: true },
    installCommand: { type: String, required: true },
    publishMethod: { type: String, enum: ['personal', 'org'] },
    blockStates: { type: Schema.Types.Mixed, default: [] },
    matchedSkills: { type: Schema.Types.Mixed, default: [] },
    customSkills: { type: Schema.Types.Mixed, default: [] },
    skillFiles: [
      {
        path: { type: String, required: true },
        content: { type: String, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
)

publishedSkillSchema.index({ skillName: 1 }, { unique: true })

export const PublishedSkill = mongoose.model<IPublishedSkill>('PublishedSkill', publishedSkillSchema)
