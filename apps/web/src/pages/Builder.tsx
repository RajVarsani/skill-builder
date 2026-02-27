import { useEffect, useState } from 'react'
import { Nav } from '../components/layout/Nav'
import { ChatPanel } from '../components/chat/ChatPanel'
import { useConversation } from '../hooks/use-conversation'
import { useConversationStore } from '../lib/store'
import { PHASE_STEP } from '@skill-builder/shared/src/types'

export function Builder() {
  const { initConversation, sendMessage } = useConversation()
  const phase = useConversationStore((s) => s.phase)
  const messages = useConversationStore((s) => s.messages)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initConversation().then(() => setReady(true))
  }, [initConversation])

  useEffect(() => {
    if (ready && messages.length === 0) {
      sendMessage('Hello')
    }
  }, [ready, messages.length, sendMessage])

  const step = PHASE_STEP[phase]

  return (
    <div className="h-screen flex flex-col bg-page">
      <Nav step={step} />
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel — left side */}
        <div className="w-[55%] border-r border-muted/20 flex flex-col">
          <ChatPanel onSend={sendMessage} />
        </div>

        {/* Card panel — right side (placeholder until Phase 3.2) */}
        <div className="w-[45%] flex items-center justify-center p-8">
          <p className="font-mono text-xs text-muted uppercase tracking-wider">
            Identity card — coming next
          </p>
        </div>
      </div>
    </div>
  )
}
