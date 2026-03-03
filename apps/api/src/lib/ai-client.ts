import { GoogleGenAI } from '@google/genai'

const project = process.env.GOOGLE_CLOUD_PROJECT
if (!project) throw new Error('GOOGLE_CLOUD_PROJECT env var is required')

const location = process.env.GOOGLE_CLOUD_REGION || 'global'

// In production, use a service account key JSON string via GOOGLE_SERVICE_ACCOUNT_KEY.
// Locally, ADC from `gcloud auth application-default login` is used automatically.
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const googleAuthOptions = serviceAccountKey
  ? { credentials: JSON.parse(serviceAccountKey) }
  : undefined

export const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
  googleAuthOptions,
})

export const AI_MODEL = 'gemini-2.5-flash'
