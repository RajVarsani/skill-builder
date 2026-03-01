import Anthropic from '@anthropic-ai/sdk'
import type {
  ConversationPhase,
  MatchedSkill,
  IdentityBlock,
} from '@actingas/shared/src/types'
import { buildSystemPrompt } from './system-prompts'
import { identityTools } from './tools'
import { BlockStateMachine } from './block-state-machine'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'

const anthropic = new Anthropic()

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

type MessageContent = string | Array<Record<string, unknown>>

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

  const apiMessages: Array<{ role: 'user' | 'assistant'; content: MessageContent }> = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content as MessageContent,
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

  while (continueLoop) {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages as Anthropic.MessageParam[],
      tools: identityTools,
    })

    let currentToolName = ''
    let currentToolInput = ''
    let currentToolId = ''
    const pendingToolResults: Array<{
      type: 'tool_result'
      tool_use_id: string
      content: string
    }> = []
    const assistantContent: Array<{ type: string; [key: string]: unknown }> = []
    let turnText = ''

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolName = event.content_block.name
          currentToolId = event.content_block.id
          currentToolInput = ''
          const label = TOOL_LABELS[currentToolName] || currentToolName
          yield { type: 'tool_activity', data: { tool: currentToolName, label } }
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text_chunk', data: { text: event.delta.text } }
          turnText += event.delta.text
        } else if (event.delta.type === 'input_json_delta') {
          currentToolInput += event.delta.partial_json
        }
      }

      if (event.type === 'content_block_stop') {
        if (currentToolName) {
          const input: ToolInput = currentToolInput
            ? JSON.parse(currentToolInput)
            : {}

          const events = processToolCall(
            currentToolName,
            input,
            blockMachine,
            currentPhase,
            skillSearchFn
          )
          for (const evt of events) {
            yield evt
          }

          const toolResult =
            currentToolName === 'match_skills'
              ? JSON.stringify(skillSearchFn(
                  input.query as string,
                  input.domain as string | undefined,
                  input.limit as number | undefined
                ))
              : JSON.stringify({ success: true })

          pendingToolResults.push({
            type: 'tool_result',
            tool_use_id: currentToolId,
            content: toolResult,
          })

          assistantContent.push({
            type: 'tool_use',
            id: currentToolId,
            name: currentToolName,
            input,
          })

          currentToolName = ''
          currentToolInput = ''
          currentToolId = ''
        } else if (turnText) {
          assistantContent.push({ type: 'text', text: turnText })
        }
      }
    }

    fullAssistantText += turnText

    const finalMessage = await stream.finalMessage()

    yield {
      type: 'usage' as const,
      data: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        model: 'claude-sonnet-4-6',
      },
    }

    if (
      finalMessage.stop_reason === 'tool_use' &&
      pendingToolResults.length > 0
    ) {
      apiMessages.push({
        role: 'assistant',
        content: assistantContent as unknown as MessageContent,
      })
      apiMessages.push({
        role: 'user',
        content: pendingToolResults as unknown as MessageContent,
      })
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

  yield { type: 'done', data: { assistantMessage: fullAssistantText } }
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
