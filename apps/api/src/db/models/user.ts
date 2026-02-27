import mongoose, { Schema, type Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  name: string
  avatarUrl?: string
  googleId?: string
  githubId?: string
  githubAccessToken?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    githubAccessToken: { type: String },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', userSchema)
