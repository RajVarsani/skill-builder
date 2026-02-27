import { useCallback, useRef } from 'react'
import { connectSSE } from '../lib/sse'
import { useConversationStore } from '../lib/store'
import { apiFetch } from '../lib/api'
import type { ConversationPhase } from '@skill-builder/shared/src/types'

export function useConversation() {
  const store = useConversationStore()
  const abortRef = useRef<AbortController | null>(null)

  const initConversation = useCallback(async () => {
    const existing = await apiFetch<{
      conversation: {
        id: string
        phase: ConversationPhase
        selectedDomains: string[]
        blockStates: Array<{
          blockId: string
          category: string
          label: string
          detail: string
          confidence: 'low' | 'medium' | 'high'
          sourceType: 'inferred' | 'stated' | 'confirmed'
          status: 'tentative' | 'confirmed'
        }>
        matchedSkills: Array<{
          skillId: string
          name: string
          source: string
          installs: number
          relevanceScore: number
          status: 'proposed' | 'confirmed' | 'rejected'
        }>
        messages: Array<{
          role: 'user' | 'assistant'
          content: string
          phase: ConversationPhase
        }>
      } | null
    }>('/conversations/active')

    if (existing.conversation) {
      store.setConversationId(existing.conversation.id)
      store.loadState({
        phase: existing.conversation.phase,
        messages: existing.conversation.messages.map((m) => ({
          ...m,
          createdAt: new Date().toISOString(),
        })),
        blocks: existing.conversation.blockStates,
        matchedSkills: existing.conversation.matchedSkills,
      })
      return existing.conversation.id
    }

    const { id } = await apiFetch<{ id: string }>('/conversations', {
      method: 'POST',
    })
    store.setConversationId(id)
    return id
  }, [store])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!store.conversationId || store.isStreaming) return

      store.clearChips()
      store.addMessage({
        role: 'user',
        content,
        phase: store.phase,
        createdAt: new Date().toISOString(),
      })
      store.setStreaming(true)
      store.clearStreamingText()

      abortRef.current = connectSSE(
        store.conversationId,
        content,
        (event, rawData) => {
          const data = JSON.parse(rawData)

          switch (event) {
            case 'text_chunk':
              store.appendStreamingText(data.text)
              break
            case 'block_added':
              store.addBlock(data.block)
              break
            case 'block_confirmed':
              store.confirmBlock(data.blockId)
              break
            case 'skill_matched':
              store.addMatchedSkill(data.skill)
              break
            case 'quick_replies':
              store.setChips(data.chips, data.multiSelect)
              break
            case 'phase_change':
              store.setPhase(data.phase)
              break
            case 'completion_update':
              store.updateCompletion(data)
              break
            case 'done':
              if (data.assistantMessage) {
                store.addMessage({
                  role: 'assistant',
                  content: data.assistantMessage,
                  phase: store.phase,
                  createdAt: new Date().toISOString(),
                })
              }
              store.clearStreamingText()
              store.setStreaming(false)
              break
            case 'error':
              console.error('SSE error:', data.message)
              store.setStreaming(false)
              break
          }
        },
        () => {
          store.setStreaming(false)
        },
        (error) => {
          console.error('SSE connection error:', error)
          store.setStreaming(false)
        }
      )
    },
    [store]
  )

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
    store.setStreaming(false)
  }, [store])

  return { initConversation, sendMessage, cancelStream }
}
