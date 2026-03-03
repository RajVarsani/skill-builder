import { FunctionCallingConfigMode } from '@google/genai'
import type { Content, Part } from '@google/genai'
import { ai, AI_MODEL } from '../lib/ai-client'
import type {
  ConversationPhase,
  MatchedSkill,
  IdentityBlock,
} from '@actingas/shared/src/types'
import { buildSystemPrompt } from './system-prompts'
import { identityTools } from './tools'
import { BlockStateMachine } from './block-state-machine'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'

export type ConversationEvent =
  | { type: 'text_chunk'; data: { text: string } }
  | { type: 'tool_activity'; data: { tool: string; label: string } }
  | { type: 'block_added'; data: { block: IdentityBlock } }
  | { type: 'block_confirmed'; data: { blockId: string } }
  | { type: 'skill_matched'; data: { skill: MatchedSkill } }
  | { type: 'quick_replies'; data: { chips: string[]; multiSelect: boolean } }
  | { type: 'phase_change'; data: { phase: ConversationPhase } }
  | { type: 'completion_update'; data: { percentage: number; blocksDiscovered: number; skillsMatched: number } }
  | { type: 'usage'; data: { inputTokens: number; outputTokens: number; model: string } }
  | { type: 'done'; data: { assistantMessage: string } }

interface ToolInput {
  [key: string]: unknown
}

interface RunTurnParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  phase: ConversationPhase
  blockStates: IBlockState[]
  matchedSkills: IMatchedSkill[]
  selectedDomains: string[]
  skillSearchFn: (query: string, domain?: string, limit?: number) => unknown[]
}

export async function* runConversationTurn(
  params: RunTurnParams
): AsyncGenerator<ConversationEvent> {
  const { messages, phase, blockStates, matchedSkills, selectedDomains, skillSearchFn } = params

  const blockMachine = new BlockStateMachine(selectedDomains, blockStates)
  const currentPhase = { value: phase }

  const systemPrompt = buildSystemPrompt(
    currentPhase.value,
    blockMachine,
    matchedSkills as MatchedSkill[],
    selectedDomains
  )

  // Convert messages to Gemini Content format
  const contents: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const TOOL_LABELS: Record<string, string> = {
    add_identity_block: 'Discovering identity trait',
    confirm_identity_block: 'Confirming trait',
    match_skills: 'Searching skills registry',
    offer_quick_replies: 'Preparing options',
    signal_phase_transition: 'Moving to next phase',
  }

  let continueLoop = true
  let fullAssistantText = ''
  let quickRepliesEmitted = false
  const MAX_TOOL_ITERATIONS = 5

  for (let iteration = 0; continueLoop && iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        tools: [{ functionDeclarations: identityTools }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    })

    let turnText = ''
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = []
    const originalModelParts: Part[] = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for await (const chunk of stream) {
      // Extract usage metadata
      if (chunk.usageMetadata) {
        totalInputTokens = chunk.usageMetadata.promptTokenCount || 0
        totalOutputTokens = chunk.usageMetadata.candidatesTokenCount || 0
      }

      const parts = chunk.candidates?.[0]?.content?.parts
      if (!parts) continue

      for (const part of parts) {
        originalModelParts.push(part)

        if (part.text && part.text.length > 0) {
          yield { type: 'text_chunk', data: { text: part.text } }
          turnText += part.text
        }

        if (part.functionCall) {
          const fnName = part.functionCall.name!
          const fnArgs = (part.functionCall.args || {}) as Record<string, unknown>
          const label = TOOL_LABELS[fnName] || fnName
          yield { type: 'tool_activity', data: { tool: fnName, label } }

          functionCalls.push({ name: fnName, args: fnArgs })
          if (fnName === 'offer_quick_replies') quickRepliesEmitted = true
        }
      }
    }

    fullAssistantText += turnText

    yield {
      type: 'usage' as const,
      data: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        model: AI_MODEL,
      },
    }

    if (functionCalls.length > 0) {
      // Process tool calls and build function responses
      const functionResponseParts: Part[] = []

      for (const fc of functionCalls) {
        const input: ToolInput = fc.args

        // Process side effects (blocks, skills, phases)
        const events = processToolCall(
          fc.name,
          input,
          blockMachine,
          currentPhase,
          skillSearchFn
        )
        for (const evt of events) {
          yield evt
        }

        // Build function response — Gemini requires response to be a plain object, not an array
        const rawResult =
          fc.name === 'match_skills'
            ? skillSearchFn(
                input.query as string,
                input.domain as string | undefined,
                input.limit as number | undefined
              )
            : { success: true }

        // Wrap arrays in an object since Gemini functionResponse.response must be an object
        const result = Array.isArray(rawResult) ? { results: rawResult } : rawResult

        functionResponseParts.push({
          functionResponse: {
            name: fc.name,
            response: result as Record<string, unknown>,
          },
        })
      }

      contents.push({ role: 'model', parts: originalModelParts })
      contents.push({ role: 'user', parts: functionResponseParts })
    } else {
      continueLoop = false
    }

    const completion = blockMachine.getCompletion()
    yield {
      type: 'completion_update',
      data: {
        percentage: completion.percentage,
        blocksDiscovered: completion.filled,
        skillsMatched: matchedSkills.filter((s) => s.status !== 'rejected').length,
      },
    }
  }

  // If model produced no text at all (only tool calls or empty response),
  // generate a fallback so the user never sees an empty bubble
  if (!fullAssistantText.trim()) {
    const fallback = getFallbackMessage(currentPhase.value)
    yield { type: 'text_chunk', data: { text: fallback } }
    fullAssistantText = fallback
  }

  // Fallback: if the model asked a question but forgot to call offer_quick_replies,
  // auto-generate chips so the UI always shows tappable options
  if (!quickRepliesEmitted && fullAssistantText.includes('?')) {
    const chips = extractFallbackChips(fullAssistantText, currentPhase.value)
    if (chips.length > 0) {
      yield { type: 'tool_activity', data: { tool: 'offer_quick_replies', label: 'Preparing options' } }
      yield { type: 'quick_replies', data: { chips, multiSelect: currentPhase.value === 'domain_discovery' } }
    }
  }

  yield { type: 'done', data: { assistantMessage: fullAssistantText } }
}

/**
 * Extract chip labels from the assistant's text when the model forgets to call offer_quick_replies.
 * Tries to parse comma/or-separated lists from the text, falls back to phase-appropriate defaults.
 */
function getFallbackMessage(phase: ConversationPhase): string {
  switch (phase) {
    case 'domain_discovery':
      return "What areas of expertise are you interested in? I'd love to help you find the right skills."
    case 'rapid_profiling':
      return "Tell me more about your experience — what tools and technologies do you work with day to day?"
    case 'review':
      return "Let's review what we've discovered so far. Does everything look accurate?"
    default:
      return "I'm here to help — could you tell me a bit more about what you're looking for?"
  }
}

function extractFallbackChips(text: string, phase: ConversationPhase): string[] {
  // Domain discovery phase — always offer domain chips
  if (phase === 'domain_discovery') {
    return ['Engineering', 'Design', 'Product', 'Data & Analytics', 'Marketing', 'Operations']
  }

  // Try to extract options from patterns like "A, B, C, or D" or "A / B / C"
  // Look for the last question in the text
  const sentences = text.split(/[.!]\s+/)
  const questionSentence = [...sentences].reverse().find((s) => s.includes('?'))
  if (questionSentence) {
    // Pattern: "X, Y, Z, or W" or "X, Y, Z, and W"
    const commaOrMatch = questionSentence.match(
      /(?:^|:\s*)([\w\s&-]+(?:,\s*[\w\s&-]+)+(?:,?\s*(?:or|and)\s+[\w\s&-]+))/i
    )
    if (commaOrMatch) {
      const options = commaOrMatch[1]
        .split(/,\s*(?:or|and)?\s*|\s+(?:or|and)\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 40)
      if (options.length >= 2 && options.length <= 8) return options
    }

    // Pattern: "X / Y / Z"
    const slashMatch = questionSentence.match(/([\w\s&-]+(?:\s*\/\s*[\w\s&-]+){1,7})/)
    if (slashMatch) {
      const options = slashMatch[1].split(/\s*\/\s*/).map((s) => s.trim()).filter((s) => s.length > 0 && s.length < 40)
      if (options.length >= 2 && options.length <= 8) return options
    }
  }

  // Phase-appropriate generic fallback chips
  if (phase === 'rapid_profiling') {
    return ['Absolutely', 'Not quite', 'Tell me more']
  }
  if (phase === 'review') {
    return ['Looks good!', 'Needs adjustments', 'Add more skills']
  }

  return ['Yes', 'No', 'Tell me more']
}

function processToolCall(
  toolName: string,
  input: ToolInput,
  blockMachine: BlockStateMachine,
  currentPhase: { value: ConversationPhase },
  skillSearchFn: (query: string, domain?: string, limit?: number) => unknown[]
): ConversationEvent[] {
  const events: ConversationEvent[] = []

  switch (toolName) {
    case 'add_identity_block': {
      const blockId = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const block: IdentityBlock = {
        blockId,
        category: input.category as string,
        label: input.label as string,
        detail: input.detail as string,
        confidence: input.confidence as 'low' | 'medium' | 'high',
        sourceType: input.source_type as 'inferred' | 'stated' | 'confirmed',
        status: 'tentative',
      }
      blockMachine.addBlock({
        blockId,
        category: block.category,
        label: block.label,
        detail: block.detail,
        confidence: block.confidence,
        sourceType: block.sourceType,
        status: 'tentative',
      })
      events.push({ type: 'block_added', data: { block } })
      break
    }

    case 'confirm_identity_block': {
      const confirmed = blockMachine.confirmBlock(
        input.label as string,
        input.new_confidence as 'medium' | 'high'
      )
      if (confirmed) {
        events.push({ type: 'block_confirmed', data: { blockId: confirmed.blockId } })
      }
      break
    }

    case 'offer_quick_replies': {
      const chips = (input.chips as Array<{ label: string; value: string }>).map(
        (c) => c.label
      )
      events.push({
        type: 'quick_replies',
        data: {
          chips,
          multiSelect: (input.multi_select as boolean) || false,
        },
      })
      break
    }

    case 'signal_phase_transition': {
      currentPhase.value = input.next_phase as ConversationPhase
      events.push({
        type: 'phase_change',
        data: { phase: input.next_phase as ConversationPhase },
      })
      break
    }

    case 'match_skills': {
      const results = skillSearchFn(
        input.query as string,
        input.domain as string | undefined,
        input.limit as number | undefined
      ) as Array<{
        skillId: string
        name: string
        source: string
        installs: number
        relevanceScore: number
      }>

      for (const result of results) {
        events.push({
          type: 'skill_matched',
          data: {
            skill: { ...result, status: 'proposed' },
          },
        })
      }
      break
    }
  }

  return events
}
