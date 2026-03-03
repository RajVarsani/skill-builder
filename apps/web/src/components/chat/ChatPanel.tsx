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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
  }, [messages, isStreaming, streamingText, toolActivity])

  return (
    <div className="flex flex-col h-full bg-page">
      <PhaseIndicator phase={phase} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        <StreamingMessage />
        <div ref={bottomRef} />
      </div>

      <QuickReplyChips onSelect={onSend} />
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
