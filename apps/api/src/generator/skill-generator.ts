import Anthropic from '@anthropic-ai/sdk'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'

const anthropic = new Anthropic()

interface GeneratedSkill {
  path: string
  content: string
}

export async function generateSkillPackage(
  userName: string,
  blockStates: IBlockState[],
  matchedSkills: IMatchedSkill[],
  selectedDomains: string[]
): Promise<GeneratedSkill[]> {
  const confirmed = matchedSkills.filter((s) => s.status === 'confirmed')
  const files: GeneratedSkill[] = []

  const identityBlocks = blockStates.filter((b) => b.status === 'confirmed' || b.confidence !== 'low')
  const slug = userName.toLowerCase().replace(/\s+/g, '-')

  const identitySummary = identityBlocks
    .map((b) => `- **${b.label}** (${b.category}): ${b.detail}`)
    .join('\n')

  const skillList = confirmed
    .map((s) => `- ${s.name} (${s.source}, ${s.installs} installs)`)
    .join('\n')

  const skillMd = `---
name: acting-as-${slug}
description: Use when you want responses reflecting ${userName}'s perspective as a ${selectedDomains.join(' + ')} professional. Activates on ${selectedDomains.join(', ')} tasks, code reviews, architecture decisions, and communication.
---

# ${userName}

## Who I Am
${generateWhoIAm(identityBlocks, selectedDomains)}

## How I Think
${generateHowIThink(identityBlocks)}

## How I Communicate
${generateHowICommunicate(identityBlocks)}

## What I Reject
${generateWhatIReject(identityBlocks)}

## Skills

### From skills.sh (with my preferences)
${confirmed.map((s) => `- **${s.name}** — ${s.source} (${s.installs} installs)`).join('\n')}

## Guardrails
- This skill represents ${userName}'s professional perspective
- Apply these preferences when the context matches ${selectedDomains.join('/')} work
- Default to the community skill behavior when my preferences don't apply
`

  files.push({
    path: `acting-as-${slug}/SKILL.md`,
    content: skillMd,
  })

  for (const skill of confirmed) {
    const override = await generateOverride(skill, identityBlocks)
    files.push({
      path: `acting-as-${slug}/references/matched/${skill.name}.md`,
      content: override,
    })
  }

  return files
}

function generateWhoIAm(blocks: IBlockState[], domains: string[]): string {
  const traits = blocks.filter((b) =>
    ['personality_trait', 'working_style', 'domain_expertise'].includes(b.category)
  )
  if (traits.length === 0) return `A ${domains.join(' and ')} professional.`

  const topTraits = traits.slice(0, 3).map((t) => t.label.toLowerCase())
  return `A ${topTraits.join(', ')} ${domains.join(' and ')} professional. ${traits.map((t) => t.detail).join(' ')}`
}

function generateHowIThink(blocks: IBlockState[]): string {
  const decisions = blocks.filter((b) =>
    ['decision_pattern', 'core_value'].includes(b.category)
  )
  if (decisions.length === 0) return 'Pragmatic and context-driven.'
  return decisions.map((d) => `- ${d.label}: ${d.detail}`).join('\n')
}

function generateHowICommunicate(blocks: IBlockState[]): string {
  const comm = blocks.filter((b) => b.category === 'communication_style')
  if (comm.length === 0) return 'Direct and clear.'
  return comm.map((c) => `- ${c.label}: ${c.detail}`).join('\n')
}

function generateWhatIReject(blocks: IBlockState[]): string {
  const anti = blocks.filter((b) =>
    ['anti_pattern', 'opinion'].includes(b.category)
  )
  if (anti.length === 0) return 'Over-engineering and unnecessary complexity.'
  return anti.map((a) => `- ${a.label}: ${a.detail}`).join('\n')
}

async function generateOverride(
  skill: IMatchedSkill,
  blocks: IBlockState[]
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Generate a short preference override (max 20 lines) for the skills.sh skill "${skill.name}" based on this user's identity:

${blocks.map((b) => `- ${b.label}: ${b.detail}`).join('\n')}

The override should layer the user's personality on top of the community skill without replacing it. Format as markdown.`,
        },
      ],
    })

    const text = response.content[0]
    return text.type === 'text' ? text.text : `# ${skill.name}\n\nDefault preferences apply.`
  } catch {
    return `# ${skill.name}\n\nDefault preferences apply.`
  }
}
