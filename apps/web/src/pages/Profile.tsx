import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { InstallCommand } from '../components/publish/InstallCommand'
import { ShareButtons } from '../components/publish/ShareButtons'

interface ProfileData {
  skill: {
    id: string
    skillName: string
    installCommand: string
    repoUrl: string
    blockStates: Array<{
      blockId: string
      category: string
      label: string
      status: string
    }>
    matchedSkills: Array<{
      skillId: string
      name: string
      installs: number
      status: string
    }>
  }
  user: {
    name: string
    avatarUrl?: string
  } | null
}

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const IDENTITY_LIMIT = 5
const SKILLS_LIMIT = 4

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [identityExpanded, setIdentityExpanded] = useState(false)
  const [skillsExpanded, setSkillsExpanded] = useState(false)

  useEffect(() => {
    if (!username) return
    fetch(`/api/users/${username}/skill`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="font-body text-[13px] text-muted animate-pulse">Loading profile...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
        <h1 className="font-display text-[24px] text-surface uppercase">Skill Not Found</h1>
        <p className="font-body text-[14px] text-muted">
          No published skill found for &quot;{username}&quot;
        </p>
        <a
          href="/"
          className="font-display text-[11px] uppercase tracking-[0.04em] text-accent hover:underline"
        >
          Back to Home
        </a>
      </div>
    )
  }

  const { skill, user } = data
  const name = user?.name || username || 'Unknown'
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const domains = [...new Set(skill.blockStates.map((b) => b.category))]
  const confirmedBlocks = skill.blockStates.filter((b) => b.status === 'confirmed')
  const activeSkills = skill.matchedSkills.filter((s) => s.status !== 'rejected')
  const profileUrl = `${window.location.origin}/profile/${username}`

  const visibleBlocks = identityExpanded ? confirmedBlocks : confirmedBlocks.slice(0, IDENTITY_LIMIT)
  const hiddenBlockCount = confirmedBlocks.length - IDENTITY_LIMIT
  const visibleSkills = skillsExpanded ? activeSkills : activeSkills.slice(0, SKILLS_LIMIT)
  const hiddenSkillCount = activeSkills.length - SKILLS_LIMIT

  return (
    <div className="min-h-screen bg-page">
      {/* Nav */}
      <nav className="flex items-center justify-between px-[60px] py-5 border-b-[3px] border-surface">
        <a href="/" className="font-display text-[16px] uppercase tracking-[0.05em] text-surface">
          Skill Builder
        </a>
        <a
          href="/sign-in"
          className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[12px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors"
        >
          Build Yours
        </a>
      </nav>

      {/* Content */}
      <div className="flex items-start justify-center gap-16 px-[60px] py-16">
        {/* Left — info */}
        <div className="w-[440px] space-y-8">
          <div>
            <h1 className="font-display text-[32px] leading-[42px] tracking-[0.02em] text-surface uppercase">
              {name}
            </h1>
            <p className="font-body text-[14px] text-muted uppercase tracking-[0.1em] mt-1">
              {domains.join(' + ') || 'Professional'}
            </p>
          </div>

          <InstallCommand command={skill.installCommand} />
          <ShareButtons skillUrl={profileUrl} skillName={skill.skillName} />

          <div className="pt-4">
            <span className="font-body text-[12px] text-muted uppercase tracking-[0.08em]">
              {confirmedBlocks.length} blocks · {activeSkills.length} skills matched
            </span>
          </div>
        </div>

        {/* Right — card */}
        <div className="w-[400px] shrink-0">
          <div className="border-[3px] border-accent">
            <div className="bg-surface overflow-hidden">
              {/* Pixel bar */}
              <div className="flex h-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${
                      [0, 1, 3, 4, 6, 7].includes(i)
                        ? i % 3 === 0 ? 'bg-accent' : 'bg-surface-secondary'
                        : 'bg-cream/10'
                    }`}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 px-6 pt-6 pb-4">
                <div className="w-12 h-12 bg-accent flex items-center justify-center shrink-0">
                  <span className="font-display text-[14px] text-cream">{initials}</span>
                </div>
                <div>
                  <h2 className="font-display text-[16px] uppercase text-cream">{name}</h2>
                  <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">
                    {domains.join(' + ') || 'Professional'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 px-6 pb-5">
                <div className="flex-1 h-1.5 bg-cream/10 overflow-hidden">
                  <div className="h-full bg-accent w-full" />
                </div>
                <span className="text-[12px] font-body text-accent">100%</span>
              </div>

              {/* Identity */}
              <div className="px-6 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-0.5 bg-cream/20" />
                  <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">Identity</span>
                  <div className="flex-1 h-0.5 bg-cream/10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleBlocks.map((block) => (
                    <span
                      key={block.blockId}
                      className="px-3.5 py-1.5 text-[10px] font-display uppercase bg-[#E04A2F26] text-accent border-2 border-accent"
                    >
                      {block.label}
                    </span>
                  ))}
                </div>
                {hiddenBlockCount > 0 && (
                  <button
                    onClick={() => setIdentityExpanded(!identityExpanded)}
                    className="mt-2 text-[9px] font-body uppercase tracking-[0.08em] text-accent hover:text-accent/80 transition-colors"
                  >
                    {identityExpanded ? 'Show less' : `+${hiddenBlockCount} more`}
                  </button>
                )}
              </div>

              {/* Matched Skills */}
              <div className="px-6 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-0.5 bg-cream/20" />
                  <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted">Matched Skills</span>
                  <div className="flex-1 h-0.5 bg-cream/10" />
                </div>
                <div className="space-y-2">
                  {visibleSkills.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="flex items-center justify-between bg-surface-secondary border-2 border-surface-secondary px-3.5 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-display text-[10px] uppercase text-cream truncate">{skill.name}</span>
                        <span className="text-[9px] font-body text-muted shrink-0">{formatInstalls(skill.installs)} INSTALLS</span>
                      </div>
                      <span className="text-[9px] font-body uppercase text-accent shrink-0">SKILLS.SH</span>
                    </div>
                  ))}
                </div>
                {hiddenSkillCount > 0 && (
                  <button
                    onClick={() => setSkillsExpanded(!skillsExpanded)}
                    className="mt-2 text-[9px] font-body uppercase tracking-[0.08em] text-accent hover:text-accent/80 transition-colors"
                  >
                    {skillsExpanded ? 'Show less' : `+${hiddenSkillCount} more skills`}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t-2 border-surface-secondary">
                <span className="text-[10px] font-body uppercase tracking-[0.05em] text-muted">
                  {confirmedBlocks.length} Blocks Discovered
                </span>
                <span className="text-[10px] font-body uppercase tracking-[0.05em] text-muted">
                  {activeSkills.length} Skills Matched
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
