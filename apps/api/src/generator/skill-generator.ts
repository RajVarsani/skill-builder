import { ai, AI_MODEL } from '../lib/ai-client'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'
import { SKILL_SYSTEM_PROMPT, buildUserPrompt } from './skill-prompts'
import { fetchSkillFiles } from './skill-fetcher'

interface GeneratedSkill {
  path: string
  content: string
}

export interface SkillGenerationUsage {
  inputTokens: number
  outputTokens: number
  model: string
}

export async function generateSkillMarkdown(
  userName: string,
  slug: string,
  blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  selectedDomains: string[]
): Promise<{ markdown: string; usage: SkillGenerationUsage | null }> {
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')
  const identityBlocks = blockStates.filter((b) => b.status === 'confirmed' || b.confidence !== 'low')

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: buildUserPrompt(userName, slug, identityBlocks, activeSkills, selectedDomains) }] },
      ],
      config: {
        systemInstruction: SKILL_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const usage: SkillGenerationUsage = {
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      model: AI_MODEL,
    }

    const content = (response.text ?? '').trim()
    if (!content) throw new Error('Empty response from model')

    // Strip code fences if the model wraps the output
    if (content.startsWith('```')) {
      const lines = content.split('\n')
      const start = lines[0].startsWith('```') ? 1 : 0
      const end = lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length
      return { markdown: lines.slice(start, end).join('\n').trim(), usage }
    }
    return { markdown: content, usage }
  } catch (error) {
    console.error('SKILL.md generation failed:', error instanceof Error ? error.message : error)
    return { markdown: buildFallback(userName, slug, identityBlocks, activeSkills, selectedDomains), usage: null }
  }
}

export async function generateSkillOverrides(
  slug: string,
  matchedSkills: IMatchedSkill[]
): Promise<GeneratedSkill[]> {
  const activeSkills = matchedSkills.filter((s) => s.status !== 'rejected')
  if (activeSkills.length === 0) return []

  return fetchSkillFiles(slug, activeSkills)
}

export async function generateSkillPackage(
  userName: string,
  slug: string,
  blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  selectedDomains: string[]
): Promise<{ files: GeneratedSkill[]; usage: SkillGenerationUsage | null }> {
  const [skillResult, overrides] = await Promise.all([
    generateSkillMarkdown(userName, slug, blockStates, matchedSkills, selectedDomains),
    generateSkillOverrides(slug, matchedSkills),
  ])

  return {
    files: [
      { path: `acting-as-${slug}/SKILL.md`, content: skillResult.markdown },
      ...overrides,
    ],
    usage: skillResult.usage,
  }
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
