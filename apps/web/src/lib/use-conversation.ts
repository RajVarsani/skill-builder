'use client'

import { useState, useCallback } from 'react'
import { apiFetch, apiSSE } from './api'
import type { IdentityModel, IdentityUpdate, ConversationMessage } from '@skill-builder/shared'

export function useConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [identity, setIdentity] = useState<IdentityModel | null>(null)
  const [phase, setPhase] = useState<string>('domain_discovery')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const startConversation = useCallback(async () => {
    const conv = await apiFetch('/conversations', { method: 'POST' })
    setConversationId(conv.id)
    setIdentity(conv.identityModel)
    setPhase(conv.phase)
    if (conv.status === 'active') {
      try {
        const msgs = await apiFetch(`/conversations/${conv.id}/messages`)
        setMessages(msgs)
      } catch {}
    }
    return conv
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || isStreaming) return

    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      phase,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingText('')

    let fullText = ''

    apiSSE(`/conversations/${conversationId}/messages`, { content }, (event, data) => {
      switch (event) {
        case 'message_chunk':
          fullText += data
          setStreamingText(fullText)
          break

        case 'identity_update': {
          try {
            const update = JSON.parse(data) as IdentityUpdate
            setIdentity(prev => {
              if (!prev) return prev
              const next = structuredClone(prev)
              if (update.type === 'personality_trait_added') {
                next.personality.traits.push(update.trait)
              } else if (update.type === 'personality_trait_confirmed') {
                const trait = next.personality.traits.find(t => t.label === update.traitLabel)
                if (trait) trait.source = 'confirmed'
              } else if (update.type === 'completion_updated') {
                next.completionPercent = update.percent
              } else if (update.type === 'full_model_sync') {
                return update.model
              } else if (update.type === 'domain_added') {
                next.expertise.push({
                  domain: update.domain.name,
                  depth: update.domain.depth as any,
                  subSkills: [], tools: [], opinions: [],
                })
              } else if (update.type === 'communication_updated') {
                (next.communication as any)[update.field] = update.value
              }
              return next
            })
          } catch {}
          break
        }

        case 'phase_change': {
          try {
            const { phase: newPhase } = JSON.parse(data)
            setPhase(newPhase.type === 'skill_assembly'
              ? `skill_assembly_${newPhase.subStep}`
              : newPhase.type)
          } catch {}
          break
        }

        case 'done': {
          const assistantMsg: ConversationMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullText,
            phase,
            createdAt: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamingText('')
          setIsStreaming(false)
          break
        }
      }
    })
  }, [conversationId, isStreaming, phase])

  return {
    conversationId,
    messages,
    identity,
    phase,
    isStreaming,
    streamingText,
    startConversation,
    sendMessage,
  }
}
