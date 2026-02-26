'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useConversation } from '@/lib/use-conversation'
import { ChatPanel } from '@/components/builder/chat-panel'
import { IdentityCard } from '@/components/builder/identity-card'
import { PublishView } from '@/components/builder/publish-view'
import { apiFetch } from '@/lib/api'
import { User } from '@phosphor-icons/react'

export default function BuilderPage() {
  const { user } = useAuth()
  const {
    conversationId,
    messages,
    identity,
    phase,
    isStreaming,
    streamingText,
    startConversation,
    sendMessage,
  } = useConversation()

  const [publishedSkill, setPublishedSkill] = useState<{
    installCommand: string
    skillPreview: string
  } | null>(null)

  useEffect(() => {
    startConversation().catch(() => {
      // Auth may not be ready yet -- expected without login
    })
  }, [startConversation])

  function handleSelectDomains(domains: string[]) {
    sendMessage(`I work in: ${domains.join(', ')}`)
  }

  async function handlePublish() {
    if (!conversationId) return
    try {
      const result = await apiFetch(`/conversations/${conversationId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ destination: 'platform' }),
      })
      setPublishedSkill({
        installCommand: result.installCommand,
        skillPreview: result.files?.['SKILL.md'] || '',
      })
    } catch {
      // publish failed — stay on builder
    }
  }

  // Show celebration view after publishing
  if (publishedSkill && identity) {
    return (
      <PublishView
        identity={identity}
        installCommand={publishedSkill.installCommand}
        skillPreview={publishedSkill.skillPreview}
      />
    )
  }

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-light tracking-tight text-text-primary">
          Skill Builder
        </span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-text-secondary">{user.name}</span>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User size={16} weight="regular" className="text-text-muted" />
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-6 pb-6">
        <div className="overflow-hidden rounded-[1.5rem] bg-surface shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="grid min-h-[calc(100dvh-6rem)] grid-cols-1 lg:grid-cols-[1fr_380px]">
            {/* Left: Chat */}
            <ChatPanel
              messages={messages}
              streamingText={streamingText}
              isStreaming={isStreaming}
              phase={phase}
              onSendMessage={sendMessage}
              onSelectDomains={handleSelectDomains}
              onPublish={phase.startsWith('skill_assembly_publish') ? handlePublish : undefined}
            />

            {/* Right: Identity Card */}
            <div className="hidden border-l border-surface-muted p-4 lg:block">
              <IdentityCard identity={identity} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
