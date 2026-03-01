import Anthropic from '@anthropic-ai/sdk'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'
import { SKILL_SYSTEM_PROMPT, buildUserPrompt } from './skill-prompts'
import { fetchSkillFiles } from './skill-fetcher'

const anthropic = new Anthropic()

interface GeneratedSkill {
  path: string
  content: string
}

export async function generateSkillMarkdown(
  userName: string,
  blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  selectedDomains: string[]
): Promise<string> {
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')
  const identityBlocks = blockStates.filter((b) => b.status === 'confirmed' || b.confidence !== 'low')
  const slug = userName.toLowerCase().replace(/\s+/g, '-')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SKILL_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(userName, slug, identityBlocks, activeSkills, selectedDomains) },
      ],
    })

    const text = response.content[0]
    if (text.type === 'text') {
      const content = text.text.trim()
      // Strip code fences if Claude wraps the output
      if (content.startsWith('```')) {
        const lines = content.split('\n')
        const start = lines[0].startsWith('```') ? 1 : 0
        const end = lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length
        return lines.slice(start, end).join('\n').trim()
      }
      return content
    }
    throw new Error('Unexpected response type')
  } catch (error) {
    console.error('SKILL.md generation failed:', error instanceof Error ? error.message : error)
    return buildFallback(userName, slug, identityBlocks, activeSkills, selectedDomains)
  }
}

export async function generateSkillOverrides(
  userName: string,
  _blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  _selectedDomains: string[]
): Promise<GeneratedSkill[]> {
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')
  if (activeSkills.length === 0) return []

  const slug = userName.toLowerCase().replace(/\s+/g, '-')
  return fetchSkillFiles(slug, activeSkills)
}

export async function generateSkillPackage(
  userName: string,
  blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  selectedDomains: string[]
): Promise<GeneratedSkill[]> {
  const slug = userName.toLowerCase().replace(/\s+/g, '-')

  const [skillMd, overrides] = await Promise.all([
    generateSkillMarkdown(userName, blockStates, matchedSkills, selectedDomains),
    generateSkillOverrides(userName, blockStates, matchedSkills, selectedDomains),
  ])

  return [
    { path: `acting-as-${slug}/SKILL.md`, content: skillMd },
    ...overrides,
  ]
}

function buildFallback(
  userName: string,
  slug: string,
  blocks: IBlockState[],
  skills: IMatchedSkill[],
  domains: string[]
): string {
  const traits = blocks.filter((b) => ['personality_trait', 'working_style', 'domain_expertise'].includes(b.category))
  const decisions = blocks.filter((b) => ['decision_pattern', 'core_value'].includes(b.category))
  const comm = blocks.filter((b) => b.category === 'communication_style')
  const opinions = blocks.filter((b) => ['anti_pattern', 'opinion'].includes(b.category))

  const intro = traits.length > 0
    ? traits.map((t) => t.detail).join(' ')
    : `A ${domains.join(' and ')} professional.`

  const decisionStyle = decisions.length > 0
    ? decisions.map((d) => `${d.label}: ${d.detail}`).join('\n\n')
    : 'Pragmatic and context-driven.'

  const commStyle = comm.length > 0
    ? comm.map((c) => c.detail).join(' ')
    : 'Direct and clear.'

  const strongOpinions = opinions.length > 0
    ? opinions.map((o) => `- ${o.detail}`).join('\n')
    : '- Avoid over-engineering and unnecessary complexity.'

  const skillSection = skills.length > 0
    ? `## Matched Skills\n\n${skills.map((s) => `- **${s.name}** — see \`references/matched/${s.name}.md\``).join('\n')}`
    : ''

  return `---
name: acting-as-${slug}
description: Use when you want responses reflecting ${userName}'s perspective as a ${domains.join(' + ')} professional. Activates on ${domains.join(', ')} tasks, code reviews, architecture decisions, and communication.
---

# ${userName}

${intro}

## When to Apply This Perspective

- When working on ${domains.join(' or ')} tasks
- When reviewing code or making architecture decisions
- When the user's professional context matches ${domains.join('/')} work

## Decision-Making Style

${decisionStyle}

## Communication Preferences

${commStyle}

## Strong Opinions

${strongOpinions}

${skillSection}

## Working With This Skill

This skill captures ${userName}'s core professional identity.${skills.length > 0 ? ' For deeper, skill-specific preferences, read the override files in references/matched/.' : ''} When this skill conflicts with a user's explicit instruction, defer to the user.
`
}
