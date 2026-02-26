'use client'

import { useRef, useEffect } from 'react'
import { Lightning } from '@phosphor-icons/react'
import type { ConversationMessage } from '@skill-builder/shared'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { DomainSelector } from './domain-selector'

interface ChatPanelProps {
  messages: ConversationMessage[]
  streamingText: string
  isStreaming: boolean
  phase: string
  onSendMessage: (content: string) => void
  onSelectDomains: (domains: string[]) => void
  onPublish?: () => void
}

export function ChatPanel({
  messages,
  streamingText,
  isStreaming,
  phase,
  onSendMessage,
  onSelectDomains,
  onPublish,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, streamingText])

  const showDomainSelector =
    phase === 'domain_discovery' && messages.length <= 1

  const isRoleplay = phase === 'skill_assembly_roleplay'

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-5"
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
          />
        ))}

        {isStreaming && streamingText && (
          <MessageBubble
            role="assistant"
            content={streamingText}
            isStreaming
          />
        )}

        {showDomainSelector && (
          <div className="py-2">
            <DomainSelector onSelect={onSelectDomains} />
          </div>
        )}
      </div>

      {/* Roleplay indicator */}
      {isRoleplay && (
        <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-xs text-text-secondary">
          <Lightning size={14} weight="fill" className="text-amber-500" />
          <span>Roleplay mode -- respond as you naturally would</span>
        </div>
      )}

      {/* Publish button */}
      {onPublish && (
        <div className="mx-5 mb-2">
          <button
            onClick={onPublish}
            className="w-full rounded-button bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-transform active:scale-[0.98]"
          >
            Publish My Skill
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-muted px-5 py-3">
        <ChatInput onSend={onSendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
