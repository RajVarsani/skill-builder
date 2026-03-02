import { AnthropicVertex } from '@anthropic-ai/vertex-sdk'

const projectId = process.env.GOOGLE_CLOUD_PROJECT
if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT env var is required')

const region = process.env.GOOGLE_CLOUD_REGION || 'global'

export const ai = new AnthropicVertex({ projectId, region })

export const AI_MODEL = 'claude-haiku-4-5'
