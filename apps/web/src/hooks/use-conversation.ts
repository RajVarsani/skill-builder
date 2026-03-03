import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { connectSSE } from '../lib/sse'
import { useConversationStore } from '../lib/store'
import { apiFetch } from '../lib/api'
import type { ConversationPhase } from '@actingas/shared/src/types'

export function useConversation() {
  const abortRef = useRef<AbortController | null>(null)
  const navigate = useNavigate()

  const initConversation = useCallback(async () => {
    const store = useConversationStore.getState()
    const existing = await apiFetch<{
      conversation: {
        id: string
        phase: ConversationPhase
        status?: string
        publishedSkillId?: string
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
        skillMarkdown?: string | null
        completion?: { percentage: number; blocksDiscovered: number; skillsMatched: number }
      } | null
    }>('/conversations/active')

    if (existing.conversation) {
      // If the conversation is completed and published, redirect to success page
      if (
        existing.conversation.status === 'completed' &&
        existing.conversation.phase === 'published' &&
        existing.conversation.publishedSkillId
      ) {
        navigate(`/success/${existing.conversation.publishedSkillId}`, { replace: true })
        return existing.conversation.id
      }

      store.setConversationId(existing.conversation.id)
      store.loadState({
        phase: existing.conversation.phase,
        messages: existing.conversation.messages.map((m) => ({
          ...m,
          createdAt: new Date().toISOString(),
        })),
        blocks: existing.conversation.blockStates,
        matchedSkills: existing.conversation.matchedSkills,
        skillMarkdown: existing.conversation.skillMarkdown ?? null,
        completion: existing.conversation.completion,
      })
      return existing.conversation.id
    }

    const { id } = await apiFetch<{ id: string }>('/conversations', {
      method: 'POST',
    })
    store.setConversationId(id)
    return id
  }, [navigate])

  const sendMessage = useCallback(
    async (content: string) => {
      const store = useConversationStore.getState()
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
          const s = useConversationStore.getState()
          const data = JSON.parse(rawData)

          switch (event) {
            case 'text_chunk':
              s.appendStreamingText(data.text)
              break
            case 'tool_activity':
              s.setToolActivity(data.label)
              break
            case 'block_added':
              s.addBlock(data.block)
              break
            case 'block_confirmed':
              s.confirmBlock(data.blockId)
              break
            case 'skill_matched':
              s.addMatchedSkill(data.skill)
              break
            case 'quick_replies':
              s.setChips(data.chips, data.multiSelect)
              break
            case 'phase_change':
              s.setPhase(data.phase)
              break
            case 'completion_update':
              s.updateCompletion(data)
              break
            case 'done':
              if (data.assistantMessage?.trim()) {
                s.addMessage({
                  role: 'assistant',
                  content: data.assistantMessage,
                  phase: s.phase,
                  createdAt: new Date().toISOString(),
                })
              }
              s.clearStreamingText()
              s.setStreaming(false)
              break
            case 'error':
              console.error('SSE error:', data.message)
              s.setStreaming(false)
              break
          }
        },
        () => {
          useConversationStore.getState().setStreaming(false)
        },
        (error) => {
          console.error('SSE connection error:', error)
          useConversationStore.getState().setStreaming(false)
        }
      )
    },
    []
  )

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
    useConversationStore.getState().setStreaming(false)
  }, [])

  return { initConversation, sendMessage, cancelStream }
}
