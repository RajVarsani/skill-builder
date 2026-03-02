import { GoogleGenAI } from '@google/genai'

const project = process.env.GOOGLE_CLOUD_PROJECT
if (!project) throw new Error('GOOGLE_CLOUD_PROJECT env var is required')

const location = process.env.GOOGLE_CLOUD_REGION || 'global'

export const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
})

export const AI_MODEL = 'gemini-2.0-flash'
