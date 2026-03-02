import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversationStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'
import { SkillReviewRow } from './SkillReviewRow'
import type { MatchedSkill } from '@actingas/shared/src/types'

interface SkillSearchResult {
  skillId: string
  name: string
  source: string
  installs: number
  relevanceScore: number
}

interface SkillReviewListProps {
  onRemove: (skillId: string) => void
  onAdd: (skill: MatchedSkill) => void
}

export function SkillReviewList({ onRemove, onAdd }: SkillReviewListProps) {
  const matchedSkills = useConversationStore((s) => s.matchedSkills)
  const conversationId = useConversationStore((s) => s.conversationId)

  const activeCount = matchedSkills.filter((s) => s.status !== 'rejected').length
  const rejectedCount = matchedSkills.length - activeCount

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SkillSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const searchSkills = useCallback(
    async (q: string) => {
      if (!conversationId || q.length < 2) {
        setResults([])
        return
      }
      setIsSearching(true)
      try {
        const { results: r } = await apiFetch<{ results: SkillSearchResult[] }>(
          `/conversations/${conversationId}/skills/search?q=${encodeURIComponent(q)}`
        )
        // Filter out already-added skills
        const existingIds = new Set(matchedSkills.map((s) => s.skillId))
        setResults(r.filter((s) => !existingIds.has(s.skillId)))
      } catch (e) {
        console.error('Skill search error:', e)
      } finally {
        setIsSearching(false)
      }
    },
    [conversationId, matchedSkills]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => searchSkills(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchSkills])

  const handleAdd = async (result: SkillSearchResult) => {
    if (!conversationId) return
    try {
      await apiFetch(`/conversations/${conversationId}/skills/add`, {
        method: 'POST',
        body: JSON.stringify({ skill: result }),
      })
      const newSkill: MatchedSkill = { ...result, status: 'proposed' }
      onAdd(newSkill)
      // Remove from search results
      setResults((prev) => prev.filter((r) => r.skillId !== result.skillId))
      setQuery('')
    } catch (e) {
      console.error('Add skill error:', e)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
            Matched Skills
          </span>
          <span className="text-[11px] font-display uppercase tracking-[0.08em] text-accent">
            Confirm or Remove
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted">
          {activeCount} active{rejectedCount > 0 ? ` · ${rejectedCount} removed` : ''}
        </span>
      </div>

      {/* Search to add skills */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 75K+ skills to add..."
            className="w-full px-3.5 py-2.5 bg-transparent border-2 border-dashed border-surface text-[12px] font-body text-surface placeholder:text-surface/50 focus:outline-none focus:border-accent transition-colors"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-accent"
                  style={{
                    animation: 'pixelBounce 0.8s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="border-2 border-muted/30 max-h-[200px] overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.skillId}
                onClick={() => handleAdd(result)}
                className="flex items-center gap-3 w-full px-3.5 py-2 hover:bg-surface/10 transition-colors text-left border-b border-muted/10 last:border-b-0"
              >
                <span className="text-[14px] text-accent shrink-0">+</span>
                <span className="font-display text-[10px] tracking-[0.04em] uppercase text-surface w-[180px] shrink-0 truncate">
                  {result.name}
                </span>
                <span className="text-[11px] font-body text-muted flex-1 truncate">
                  {result.source}
                </span>
                <span className="text-[9px] font-body uppercase tracking-[0.08em] text-muted/60 shrink-0">
                  {result.installs > 0 ? `${result.installs.toLocaleString()}` : '—'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
        {matchedSkills.map((skill) => (
          <SkillReviewRow
            key={skill.skillId}
            skill={skill}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 border-2 border-dashed border-muted">
        <span className="text-[13px] font-body text-accent">★</span>
        <span className="text-[11px] font-body text-surface-secondary">
          Custom skills generated from your unique expertise
        </span>
      </div>
    </div>
  )
}
