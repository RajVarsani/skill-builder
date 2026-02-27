import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Nav } from '../components/layout/Nav'
import { IdentityCard } from '../components/card/IdentityCard'
import { InstallCommand } from '../components/publish/InstallCommand'
import { ShareButtons } from '../components/publish/ShareButtons'
import { apiFetch } from '../lib/api'
import { useConversationStore } from '../lib/store'

interface PublishedSkillData {
  skill: {
    id: string
    skillName: string
    installCommand: string
    repoUrl: string
    blockStates: Array<{
      blockId: string
      category: string
      label: string
      detail: string
      confidence: string
      sourceType: string
      status: string
    }>
    matchedSkills: Array<{
      skillId: string
      name: string
      source: string
      installs: number
      relevanceScore: number
      status: string
    }>
  }
}

export function Success() {
  const { id } = useParams<{ id: string }>()
  const [skillData, setSkillData] = useState<PublishedSkillData | null>(null)
  const [loading, setLoading] = useState(true)
  const setBlocks = useConversationStore((s) => s.setBlocks)
  const setMatchedSkills = useConversationStore((s) => s.setMatchedSkills)

  useEffect(() => {
    if (!id) return
    apiFetch<PublishedSkillData>(`/skills/${id}`)
      .then((data) => {
        setSkillData(data)
        if (data.skill.blockStates) {
          setBlocks(data.skill.blockStates as Parameters<typeof setBlocks>[0])
        }
        if (data.skill.matchedSkills) {
          setMatchedSkills(data.skill.matchedSkills as Parameters<typeof setMatchedSkills>[0])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, setBlocks, setMatchedSkills])

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="font-body text-[13px] text-muted animate-pulse">Loading your skill...</p>
      </div>
    )
  }

  if (!skillData) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="font-body text-[13px] text-muted">Skill not found</p>
      </div>
    )
  }

  const { skill } = skillData
  const profileUrl = `${window.location.origin}/profile/${skill.skillName.replace('acting-as-', '')}`

  return (
    <div className="h-screen flex flex-col bg-page">
      <Nav step={4} />

      <div className="flex-1 flex items-center justify-center gap-20 px-16 overflow-hidden">
        {/* Left — content */}
        <div className="w-[440px] space-y-8">
          <h1 className="font-display text-[32px] leading-[42px] tracking-[0.02em] text-surface uppercase">
            Your Skill is Live
          </h1>

          <p className="text-[14px] font-body leading-[22px] text-surface-secondary">
            Your professional identity has been encoded into an installable skill.
            {' '}{skill.blockStates?.length || 0} blocks discovered,
            {' '}{skill.matchedSkills?.length || 0} matched from the skills.sh registry.
          </p>

          <InstallCommand command={skill.installCommand} />
          <ShareButtons skillUrl={profileUrl} skillName={skill.skillName} />
        </div>

        {/* Right — card */}
        <div className="w-[380px] shrink-0">
          <IdentityCard />
        </div>
      </div>
    </div>
  )
}
