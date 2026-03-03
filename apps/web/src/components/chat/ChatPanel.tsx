import { useEffect, useRef } from 'react'
import { useConversationStore } from '../../lib/store'
import { MessageBubble } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'
import { ChatInput } from './ChatInput'
import { QuickReplyChips } from '../chips/QuickReplyChips'
import { PhaseIndicator } from '../layout/PhaseIndicator'

interface ChatPanelProps {
  onSend: (message: string) => void
}

export function ChatPanel({ onSend }: ChatPanelProps) {
  const messages = useConversationStore((s) => s.messages)
  const phase = useConversationStore((s) => s.phase)
  const isStreaming = useConversationStore((s) => s.isStreaming)
  const streamingText = useConversationStore((s) => s.streamingText)
  const toolActivity = useConversationStore((s) => s.toolActivity)
  const backgroundActivity = useConversationStore((s) => s.backgroundActivity)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
  }, [messages, isStreaming, streamingText, toolActivity, backgroundActivity])

  return (
    <div className="flex flex-col h-full bg-page">
      <PhaseIndicator phase={phase} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        <StreamingMessage />
        {backgroundActivity && !isStreaming && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-accent"
                  style={{
                    animation: `pixelBounce 0.8s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-display uppercase tracking-[0.06em] text-muted">
              {backgroundActivity}...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <QuickReplyChips onSelect={onSend} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
