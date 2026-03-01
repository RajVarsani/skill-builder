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

  // Slug conflict state
  const [slugModalOpen, setSlugModalOpen] = useState(false)
  const [defaultSlug, setDefaultSlug] = useState('')
  const pendingTargetRef = useRef<'org' | 'personal'>('org')

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
    const confirmed = store.blocks.filter((b) => b.status === 'confirmed')
    const active = store.matchedSkills.filter((s) => s.status !== 'rejected')
    const formatCategory = (cat: string) =>
      cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const domains = [...new Set(confirmed.map((b) => b.category))].map(formatCategory)

    const ogProps: OGImageCardProps = {
      name: user?.name ?? '',
      title: domains.join(' + ') || 'Professional',
      blocksDiscovered: confirmed.length,
      skillsMatched: active.length,
      completionPercent: store.completion.percentage,
      traits: confirmed.map((b) => b.label).slice(0, 8),
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
