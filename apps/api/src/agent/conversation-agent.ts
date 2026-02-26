import Anthropic from '@anthropic-ai/sdk'
import type { IdentityModel, IdentityUpdate, Phase } from '@skill-builder/shared'
import { buildSystemPrompt } from './system-prompts'

const anthropic = new Anthropic()

export async function* runConversationTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentPhase: Phase,
  identityModel: IdentityModel,
  selectedDomains: string[],
): AsyncGenerator<
  | { type: 'text'; data: string }
  | { type: 'identity_update'; data: IdentityUpdate }
  | { type: 'phase_signal'; data: string }
  | { type: 'done' }
> {
  const systemPrompt = buildSystemPrompt(currentPhase, identityModel, selectedDomains)

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })

  let fullResponse = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      yield { type: 'text', data: event.delta.text }
    }
  }

  // Parse identity updates from the full response
  const identityUpdateRegex = /```identity_update\n([\s\S]*?)```/g
  let match
  while ((match = identityUpdateRegex.exec(fullResponse)) !== null) {
    try {
      const update = JSON.parse(match[1].trim()) as IdentityUpdate
      yield { type: 'identity_update', data: update }
    } catch {
      // Skip malformed updates
    }
  }

  // Parse phase signals
  const phaseSignalRegex = /```phase_signal\n([\s\S]*?)```/g
  while ((match = phaseSignalRegex.exec(fullResponse)) !== null) {
    const signal = match[1].trim()
    yield { type: 'phase_signal', data: signal }
  }

  yield { type: 'done' }
}

export function cleanResponseText(text: string): string {
  return text
    .replace(/```identity_update\n[\s\S]*?```/g, '')
    .replace(/```phase_signal\n[\s\S]*?```/g, '')
    .trim()
}
