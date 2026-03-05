import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Nav } from '../components/layout/Nav'
import { ChatPanel } from '../components/chat/ChatPanel'
import { IdentityCard } from '../components/card/IdentityCard'
import { SkillReviewList } from '../components/publish/SkillReviewList'
import { PublishButtons } from '../components/publish/PublishButtons'
import { SkillMarkdownEditor } from '../components/publish/SkillMarkdownEditor'
import { PublishModal } from '../components/publish/PublishModal'
import { SlugConflictModal } from '../components/publish/SlugConflictModal'
import { useConversation } from '../hooks/use-conversation'
import { useConversationStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { apiFetch } from '../lib/api'
import { captureOGImage, type OGImageCardProps } from '../lib/og-capture'
import { PHASE_STEP } from '@actingas/shared/src/types'
import type { MatchedSkill } from '@actingas/shared/src/types'

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

  // Publish modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalOgProps, setModalOgProps] = useState<OGImageCardProps | null>(null)
  const [publishDone, setPublishDone] = useState(false)
  const publishResultRef = useRef<{ id: string } | null>(null)

  // Publish error state
  const [publishError, setPublishError] = useState<string | null>(null)

  // Slug conflict state
  const [slugModalOpen, setSlugModalOpen] = useState(false)
  const [defaultSlug, setDefaultSlug] = useState('')
  const pendingTargetRef = useRef<'org' | 'personal'>('org')

  const messages = useConversationStore((s) => s.messages)
  const isStreaming = useConversationStore((s) => s.isStreaming)

  const step = PHASE_STEP[phase]
  const isReviewPhase = phase === 'review' || phase === 'published'

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const publishEnabled = userMessageCount >= 4 && !isStreaming
  const handlePublishCTA = useCallback(() => {
    sendMessage('lets publish now')
  }, [sendMessage])

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

  const handlePublish = async (target: 'org' | 'personal' = 'org', customSlug?: string) => {
    if (!conversationId || isPublishing) return

    const slug = customSlug || (user?.name ?? '').toLowerCase().replace(/\s+/g, '-')

    // Check slug availability before publishing (skip if user already chose a custom slug)
    if (!customSlug) {
      try {
        const { available } = await apiFetch<{ available: boolean }>(`/skills/check-slug/${slug}`)
        if (!available) {
          setDefaultSlug(slug)
          pendingTargetRef.current = target
          setSlugModalOpen(true)
          return
        }
      } catch (e) {
        console.error('Slug check failed, proceeding:', e)
      }
    }

    setPublishTarget(target)
    setIsPublishing(true)

    const store = useConversationStore.getState()
    // Use all blocks for OG image — server confirms them all on publish
    const allBlocks = store.blocks
    const active = store.matchedSkills.filter((s) => s.status !== 'rejected')
    const formatCategory = (cat: string) =>
      cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const domains = [...new Set(allBlocks.map((b) => b.category))].slice(0, 4).map(formatCategory)

    const ogProps: OGImageCardProps = {
      name: user?.name ?? '',
      title: domains.join(' + ') || 'Professional',
      blocksDiscovered: allBlocks.length,
      skillsMatched: active.length,
      completionPercent: store.completion.percentage,
      traits: allBlocks.map((b) => b.label).slice(0, 8),
      skills: active.slice(0, 3).map((s) => ({ name: s.name, installs: s.installs })),
    }

    // Open modal with card preview
    publishResultRef.current = null
    setPublishDone(false)
    setModalOgProps(ogProps)
    setModalOpen(true)

    try {
      let ogImage: string | undefined
      try {
        ogImage = await captureOGImage(ogProps)
      } catch (e) {
        console.error('OG image capture failed, publishing without:', e)
      }

      const currentMarkdown = store.skillMarkdown
      const result = await apiFetch<{ id: string; installCommand: string; repoUrl: string }>(
        `/conversations/${conversationId}/publish`,
        {
          method: 'POST',
          body: JSON.stringify({ skillMarkdown: currentMarkdown, target, ogImage, customSlug: customSlug || undefined }),
        }
      )

      publishResultRef.current = result
      setPublishDone(true)
    } catch (error) {
      console.error('Publish error:', error)
      const msg = error instanceof Error ? error.message : 'Something went wrong'
      setPublishError(msg.includes('reconnect')
        ? 'Your GitHub connection needs to be refreshed. Please reconnect your GitHub account and try again.'
        : msg
      )
      setModalOpen(false)
      setIsPublishing(false)
    }
  }

  const handleSlugConfirm = (slug: string) => {
    setSlugModalOpen(false)
    handlePublish(pendingTargetRef.current, slug)
  }

  const handlePublishComplete = useCallback(() => {
    if (publishResultRef.current) {
      navigate(`/success/${publishResultRef.current.id}`)
    }
  }, [navigate])

  const [checkingInstall, setCheckingInstall] = useState(false)

  const handlePublishGitHub = async () => {
    if (!user?.hasGithub) return
    setCheckingInstall(true)
    try {
      const { installed, installUrl } = await apiFetch<{ installed: boolean; installUrl?: string }>(
        '/github/install-check'
      )
      if (!installed) {
        // Redirect to GitHub App installation page — they'll come back to /builder after
        window.location.href = installUrl || 'https://github.com/apps/skill-builder-publisher/installations/new'
        return
      }
    } catch (e) {
      console.error('Install check failed, proceeding:', e)
    }
    setCheckingInstall(false)
    handlePublish('personal')
  }

  const handleRemoveSkill = async (skillId: string) => {
    if (!conversationId) return
    rejectSkill(skillId)
    try {
      const skill = useConversationStore.getState().matchedSkills.find((s) => s.skillId === skillId)
      const endpoint = skill?.status === 'rejected' ? 'reject' : 'confirm'
      await apiFetch(`/conversations/${conversationId}/skills/${skillId}/${endpoint}`, { method: 'POST' })
      // Regenerate SKILL.md to reflect the change
      fetchPreview()
    } catch (error) {
      console.error('Skill status update error:', error)
    }
  }

  const handleAddSkill = (skill: MatchedSkill) => {
    const { addMatchedSkill } = useConversationStore.getState()
    addMatchedSkill(skill)
    // Regenerate SKILL.md to include the new skill
    fetchPreview()
  }

  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <Nav
        step={step}
        onStartFresh={handleStartFresh}
        onPublish={!isReviewPhase ? handlePublishCTA : undefined}
        publishEnabled={publishEnabled}
      />
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left side — chat or review */}
        <div className={`w-full md:w-[55%] md:border-r border-muted/20 flex flex-col ${isReviewPhase ? 'flex-1 min-h-0' : 'h-[65vh] md:h-auto'} overflow-hidden`}>
          {isReviewPhase ? (
            <>
              <div className="shrink-0 px-5 md:px-10 pt-6 md:pt-10 pb-4">
                <h2 className="font-display text-[20px] md:text-[24px] uppercase tracking-[0.02em] text-surface">
                  Review Your Skills
                </h2>
                <p className="font-body text-[13px] text-muted mt-2">
                  Confirm or remove matched skills before publishing your identity.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 px-5 md:px-10 pb-24 space-y-8">
                <SkillReviewList onRemove={handleRemoveSkill} onAdd={handleAddSkill} />
                <SkillMarkdownEditor
                  onRegenerate={fetchPreview}
                  isLoading={isPreviewLoading}
                />
              </div>
            </>
          ) : (
            <ChatPanel onSend={sendMessage} />
          )}
        </div>

        {/* Right side — card */}
        <div className={`w-full md:w-[45%] flex items-center justify-center p-5 md:p-8 ${isReviewPhase ? 'hidden md:flex' : ''} overflow-y-auto`}>
          <div className="w-full max-w-sm">
            <IdentityCard />
          </div>
        </div>
      </div>

      {/* Publish buttons — fixed to viewport bottom, always visible */}
      {isReviewPhase && (
        <div className="fixed bottom-0 left-0 w-full md:w-[55%] px-5 md:px-10 py-4 border-t border-muted/20 bg-page z-20">
          {publishError && (
            <div className="mb-3 rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-300">
              <p>{publishError}</p>
              <button
                onClick={() => setPublishError(null)}
                className="mt-1 text-xs text-red-400 underline hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}
          <PublishButtons
            onPublish={() => { setPublishError(null); handlePublish('org') }}
            onPublishGitHub={() => { setPublishError(null); handlePublishGitHub() }}
            isPublishing={isPublishing || checkingInstall}
            isGenerating={isPreviewLoading || !skillMarkdown}
            publishTarget={checkingInstall ? 'personal' : publishTarget}
            hasGithub={user?.hasGithub ?? false}
          />
        </div>
      )}

      <SlugConflictModal
        open={slugModalOpen}
        defaultSlug={defaultSlug}
        onConfirm={handleSlugConfirm}
        onCancel={() => setSlugModalOpen(false)}
      />

      <PublishModal
        open={modalOpen}
        ogProps={modalOgProps}
        publishDone={publishDone}
        onComplete={handlePublishComplete}
      />
    </div>
  )
}
