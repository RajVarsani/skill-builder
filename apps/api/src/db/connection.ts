import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_builder'

let isConnected = false

export async function connectDB() {
  if (isConnected) return

  try {
    console.log('MongoDB connecting to:', MONGODB_URI.replace(/:([^@]+)@/, ':***@'))
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
    isConnected = true
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
