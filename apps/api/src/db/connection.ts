import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_builder'

let isConnected = false

export async function connectDB() {
  if (isConnected) return

  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
