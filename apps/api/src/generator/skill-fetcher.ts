import type { IMatchedSkill } from '../db/models/conversation'

interface FetchedSkill {
  path: string
  content: string
}

/**
 * Fetch the actual SKILL.md content from GitHub for each matched skill.
 * The source field is a GitHub repo (e.g. "wshobson/agents") and we need
 * to find the SKILL.md file that corresponds to the skill name within it.
 */
export async function fetchSkillFiles(
  slug: string,
  skills: IMatchedSkill[]
): Promise<FetchedSkill[]> {
  const results = await Promise.allSettled(
    skills.map(async (skill) => {
      const content = await fetchSkillMd(skill.source, skill.name)
      return {
        path: `acting-as-${slug}/references/matched/${skill.name}.md`,
        content,
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<FetchedSkill> => r.status === 'fulfilled')
    .map((r) => r.value)
}

async function fetchSkillMd(source: string, skillName: string): Promise<string> {
  // Try common path patterns used by skill repos
  const patterns = [
    `skills/${skillName}/SKILL.md`,
    `${skillName}/SKILL.md`,
    `plugins/${skillName}/SKILL.md`,
  ]

  for (const pattern of patterns) {
    const url = `https://raw.githubusercontent.com/${source}/main/${pattern}`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const content = await res.text()
        if (content.trim().length > 0) return content
      }
    } catch {
      // Try next pattern
    }
  }

  // Fallback: search the repo tree for any SKILL.md containing this skill name
  const content = await searchRepoTree(source, skillName)
  if (content) return content

  return buildPlaceholder(source, skillName)
}

async function searchRepoTree(source: string, skillName: string): Promise<string | null> {
  try {
    const treeUrl = `https://api.github.com/repos/${source}/git/trees/main?recursive=1`
    const res = await fetch(treeUrl, {
      headers: { 'User-Agent': 'skill-builder' },
    })
    if (!res.ok) return null

    const tree = await res.json()
    const entries = tree.tree as Array<{ path: string; type: string }>

    // Find SKILL.md files that contain the skill name in their path
    const candidates = entries
      .filter((e) => e.type === 'blob' && e.path.endsWith('SKILL.md'))
      .filter((e) => {
        const parts = e.path.toLowerCase().split('/')
        return parts.some((p) => p === skillName.toLowerCase())
      })

    if (candidates.length === 0) return null

    // Fetch the first matching SKILL.md
    const rawUrl = `https://raw.githubusercontent.com/${source}/main/${candidates[0].path}`
    const fileRes = await fetch(rawUrl)
    if (!fileRes.ok) return null

    return fileRes.text()
  } catch {
    return null
  }
}

function buildPlaceholder(source: string, skillName: string): string {
  return `# ${skillName}

> Source: [${source}](https://github.com/${source})
> Install: \`npx skills add https://github.com/${source} --skill ${skillName}\`

_Could not fetch the original SKILL.md from GitHub. Install the skill directly using the command above._
`
}
