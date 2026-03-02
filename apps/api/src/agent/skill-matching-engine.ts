interface SkillEntry {
  source: string
  name: string
  installs: number
}

interface SearchResult {
  skillId: string
  name: string
  source: string
  installs: number
  relevanceScore: number
}

export class SkillMatchingEngine {
  private skills: SkillEntry[] = []
  private nameTokenIndex: Map<string, SkillEntry[]> = new Map()
  private loaded = false

  async loadDataset(dir: string): Promise<void> {
    const fs = await import('fs')
    const path = await import('path')

    try {
      const metaPath = path.join(dir, 'meta.json')
      if (!fs.existsSync(metaPath)) {
        console.warn('Dataset not found at', dir)
        return
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      const chunkCount = meta.totalChunks || 76

      for (let i = 1; i <= chunkCount; i++) {
        const chunkPath = path.join(dir, `skills-chunk-${i}.json`)
        if (!fs.existsSync(chunkPath)) continue
        const chunkData = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'))
        const skills: SkillEntry[] = chunkData.skills || chunkData
        this.skills.push(...skills)
      }

      this.buildIndices()
      this.loaded = true
      console.log(`Skill matching engine loaded: ${this.skills.length} skills`)
    } catch (error) {
      console.error('Failed to load dataset:', error)
    }
  }

  private buildIndices(): void {
    for (const skill of this.skills) {
      const tokens = this.tokenize(skill.name)
      for (const token of tokens) {
        if (!this.nameTokenIndex.has(token)) {
          this.nameTokenIndex.set(token, [])
        }
        this.nameTokenIndex.get(token)!.push(skill)
      }
    }
  }

  private tokenize(name: string): string[] {
    return name
      .toLowerCase()
      .split(/[-_\s]+/)
      .filter((t) => t.length > 1)
  }

  private findPrefixMatches(prefix: string): SkillEntry[] {
    const results: Set<SkillEntry> = new Set()
    for (const [token, skills] of this.nameTokenIndex) {
      if (token.startsWith(prefix)) {
        for (const skill of skills) results.add(skill)
      }
    }
    return Array.from(results)
  }

  search(query: string, domain?: string, limit: number = 5): SearchResult[] {
    if (!this.loaded || this.skills.length === 0) {
      return []
    }

    const queryTokens = new Set(this.tokenize(query))
    const scored = new Map<string, { skill: SkillEntry; score: number }>()

    const addCandidate = (skill: SkillEntry, isPrefix: boolean) => {
      const key = `${skill.source}/${skill.name}`
      const skillTokens = new Set(this.tokenize(skill.name))

      // Count how many query tokens match (exact or prefix)
      let matchCount = 0
      for (const qt of queryTokens) {
        for (const st of skillTokens) {
          if (st === qt || st.startsWith(qt) || qt.startsWith(st)) {
            matchCount++
            break
          }
        }
      }
      if (matchCount === 0) return

      const intersection = [...queryTokens].filter((t) => skillTokens.has(t)).length
      const union = new Set([...queryTokens, ...skillTokens]).size
      const jaccard = union > 0 ? intersection / union : 0

      const isExact = skill.name.toLowerCase() === query.toLowerCase()
      const prefixRatio = matchCount / queryTokens.size
      const baseScore = isExact ? 1.0 : Math.max(jaccard, prefixRatio * 0.7)
      const installBoost = skill.installs > 0 ? Math.log10(skill.installs) / 10 : 0
      const score = baseScore + installBoost

      const existing = scored.get(key)
      if (!existing || score > existing.score) {
        scored.set(key, { skill, score })
      }
    }

    for (const token of queryTokens) {
      // Exact token matches
      const exactMatches = this.nameTokenIndex.get(token) || []
      for (const skill of exactMatches) addCandidate(skill, false)

      // Prefix matches (only for tokens >= 2 chars)
      if (token.length >= 2) {
        const prefixMatches = this.findPrefixMatches(token)
        for (const skill of prefixMatches) addCandidate(skill, true)
      }
    }

    return Array.from(scored.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(limit, 10))
      .map(({ skill, score }) => ({
        skillId: skill.name,
        name: skill.name,
        source: skill.source,
        installs: skill.installs,
        relevanceScore: Math.round(score * 100) / 100,
      }))
  }

  isLoaded(): boolean {
    return this.loaded
  }
}

export const skillEngine = new SkillMatchingEngine()
