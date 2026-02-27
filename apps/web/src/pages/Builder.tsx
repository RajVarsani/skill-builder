import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Nav } from '../components/layout/Nav'
import { ChatPanel } from '../components/chat/ChatPanel'
import { IdentityCard } from '../components/card/IdentityCard'
import { SkillReviewList } from '../components/publish/SkillReviewList'
import { PublishButtons } from '../components/publish/PublishButtons'
import { useConversation } from '../hooks/use-conversation'
import { useConversationStore } from '../lib/store'
import { apiFetch } from '../lib/api'
import { PHASE_STEP } from '@skill-builder/shared/src/types'

export function Builder() {
  const { initConversation, sendMessage, cancelStream } = useConversation()
  const phase = useConversationStore((s) => s.phase)
  const conversationId = useConversationStore((s) => s.conversationId)
  const rejectSkill = useConversationStore((s) => s.rejectSkill)
  const [isPublishing, setIsPublishing] = useState(false)
  const navigate = useNavigate()
  const helloSentRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    helloSentRef.current = false
    initConversation()
      .then(() => {
        if (cancelled) return
        const { messages: msgs } = useConversationStore.getState()
        if (msgs.length === 0 && !helloSentRef.current) {
          helloSentRef.current = true
          sendMessage('Hello')
        }
      })
      .catch((err) => {
        console.error('Init conversation error:', err)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStartFresh = useCallback(async () => {
    try {
      cancelStream()
      const { id } = await apiFetch<{ id: string }>('/conversations/active/reset', {
        method: 'POST',
      })
      useConversationStore.getState().reset()
      useConversationStore.getState().setConversationId(id)
      helloSentRef.current = true
      sendMessage('Hello')
    } catch (error) {
      console.error('Start fresh error:', error)
    }
  }, [sendMessage, cancelStream])

  const handlePublish = async () => {
    if (!conversationId || isPublishing) return
    setIsPublishing(true)
    try {
      const result = await apiFetch<{ id: string; installCommand: string; repoUrl: string }>(
        `/conversations/${conversationId}/publish`,
        { method: 'POST' }
      )
      navigate(`/success/${result.id}`)
    } catch (error) {
      console.error('Publish error:', error)
      setIsPublishing(false)
    }
  }

  const handlePublishGitHub = async () => {
    handlePublish()
  }

  const handleRemoveSkill = async (skillId: string) => {
    if (!conversationId) return
    rejectSkill(skillId)
    try {
      const skill = useConversationStore.getState().matchedSkills.find((s) => s.skillId === skillId)
      const endpoint = skill?.status === 'rejected' ? 'reject' : 'confirm'
      await apiFetch(`/conversations/${conversationId}/skills/${skillId}/${endpoint}`, { method: 'POST' })
    } catch (error) {
      console.error('Skill status update error:', error)
    }
  }

  const step = PHASE_STEP[phase]
  const isReviewPhase = phase === 'review' || phase === 'published'

  return (
    <div className="h-screen flex flex-col bg-page">
      <Nav step={step} onStartFresh={handleStartFresh} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left side — chat or review */}
        <div className="w-[55%] border-r border-muted/20 flex flex-col overflow-y-auto">
          {isReviewPhase ? (
            <div className="flex-1 flex flex-col">
              <div className="px-10 pt-10 pb-4">
                <h2 className="font-display text-[24px] uppercase tracking-[0.02em] text-surface">
                  Review Your Skills
                </h2>
                <p className="font-body text-[13px] text-muted mt-2">
                  Confirm or remove matched skills before publishing your identity.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-10 pb-8 space-y-8">
                <SkillReviewList onRemove={handleRemoveSkill} />
                <PublishButtons
                  onPublish={handlePublish}
                  onPublishGitHub={handlePublishGitHub}
                  isPublishing={isPublishing}
                />
              </div>
            </div>
          ) : (
            <ChatPanel onSend={sendMessage} />
          )}
        </div>

        {/* Right side — card */}
        <div className="w-[45%] flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-sm">
            <IdentityCard />
          </div>
        </div>
      </div>
    </div>
  )
}
