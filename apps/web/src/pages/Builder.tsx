import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Nav } from '../components/layout/Nav'
import { ChatPanel } from '../components/chat/ChatPanel'
import { IdentityCard } from '../components/card/IdentityCard'
import { SkillReviewList } from '../components/publish/SkillReviewList'
import { PublishButtons } from '../components/publish/PublishButtons'
import { SkillMarkdownEditor } from '../components/publish/SkillMarkdownEditor'
import { useConversation } from '../hooks/use-conversation'
import { useConversationStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { apiFetch } from '../lib/api'
import { PHASE_STEP } from '@skill-builder/shared/src/types'

export function Builder() {
  const { initConversation, sendMessage, cancelStream } = useConversation()
  const { user } = useAuth()
  const phase = useConversationStore((s) => s.phase)
  const conversationId = useConversationStore((s) => s.conversationId)
  const rejectSkill = useConversationStore((s) => s.rejectSkill)
  const setSkillMarkdown = useConversationStore((s) => s.setSkillMarkdown)
  const skillMarkdown = useConversationStore((s) => s.skillMarkdown)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishTarget, setPublishTarget] = useState<'org' | 'personal'>('org')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const navigate = useNavigate()
  const helloSentRef = useRef(false)
  const previewFetchedRef = useRef(false)

  const step = PHASE_STEP[phase]
  const isReviewPhase = phase === 'review' || phase === 'published'

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

  const fetchPreview = useCallback(async () => {
    if (!conversationId) return
    setIsPreviewLoading(true)
    try {
      const { markdown } = await apiFetch<{ markdown: string }>(
        `/conversations/${conversationId}/preview`,
        { method: 'POST' }
      )
      setSkillMarkdown(markdown)
    } catch (error) {
      console.error('Preview fetch error:', error)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [conversationId, setSkillMarkdown])

  useEffect(() => {
    if (isReviewPhase && conversationId && !previewFetchedRef.current && !skillMarkdown) {
      previewFetchedRef.current = true
      fetchPreview()
    }
  }, [isReviewPhase, conversationId, skillMarkdown, fetchPreview])

  const handleStartFresh = useCallback(async () => {
    try {
      cancelStream()
      const { id } = await apiFetch<{ id: string }>('/conversations/active/reset', {
        method: 'POST',
      })
      previewFetchedRef.current = false
      useConversationStore.getState().reset()
      useConversationStore.getState().setConversationId(id)
      helloSentRef.current = true
      sendMessage('Hello')
    } catch (error) {
      console.error('Start fresh error:', error)
    }
  }, [sendMessage, cancelStream])

  const handlePublish = async (target: 'org' | 'personal' = 'org') => {
    if (!conversationId || isPublishing) return
    setPublishTarget(target)
    setIsPublishing(true)
    try {
      const currentMarkdown = useConversationStore.getState().skillMarkdown
      const result = await apiFetch<{ id: string; installCommand: string; repoUrl: string }>(
        `/conversations/${conversationId}/publish`,
        {
          method: 'POST',
          body: JSON.stringify({ skillMarkdown: currentMarkdown, target }),
        }
      )
      navigate(`/success/${result.id}`)
    } catch (error) {
      console.error('Publish error:', error)
      setIsPublishing(false)
    }
  }

  const handlePublishGitHub = async () => {
    handlePublish('personal')
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

  return (
    <div className="h-screen flex flex-col bg-page">
      <Nav step={step} onStartFresh={handleStartFresh} />
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* Left side — chat or review */}
        <div className="w-full md:w-[55%] md:border-r border-muted/20 flex flex-col shrink-0 h-[65vh] md:h-auto md:overflow-y-auto">
          {isReviewPhase ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-5 md:px-10 pt-6 md:pt-10 pb-4">
                <h2 className="font-display text-[20px] md:text-[24px] uppercase tracking-[0.02em] text-surface">
                  Review Your Skills
                </h2>
                <p className="font-body text-[13px] text-muted mt-2">
                  Confirm or remove matched skills before publishing your identity.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 md:px-10 pb-6 space-y-8">
                <SkillReviewList onRemove={handleRemoveSkill} />
                <SkillMarkdownEditor
                  onRegenerate={fetchPreview}
                  isLoading={isPreviewLoading}
                />
              </div>
              <div className="shrink-0 px-5 md:px-10 py-4 border-t border-muted/20 bg-page">
                <PublishButtons
                  onPublish={() => handlePublish('org')}
                  onPublishGitHub={handlePublishGitHub}
                  isPublishing={isPublishing}
                  isGenerating={isPreviewLoading || !skillMarkdown}
                  publishTarget={publishTarget}
                  hasGithub={user?.hasGithub ?? false}
                />
              </div>
            </div>
          ) : (
            <ChatPanel onSend={sendMessage} />
          )}
        </div>

        {/* Right side — card */}
        <div className="w-full md:w-[45%] flex items-center justify-center p-5 md:p-8 overflow-y-auto">
          <div className="w-full max-w-sm">
            <IdentityCard />
          </div>
        </div>
      </div>
    </div>
  )
}
