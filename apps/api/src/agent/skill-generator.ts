import Anthropic from '@anthropic-ai/sdk'
import type { IdentityModel } from '@skill-builder/shared'

const anthropic = new Anthropic()

interface GeneratedSkill {
  skillMd: string
  overrides: Array<{ filename: string; content: string }>
  custom: Array<{ filename: string; content: string }>
  examples: {
    decisions: string
    communication: string
    reviews: string
  }
}

export async function generateSkillPackage(
  identity: IdentityModel,
  username: string,
): Promise<GeneratedSkill> {
  const skillName = `acting-as-${username.toLowerCase().replace(/\s+/g, '-')}`

  // Generate the persona SKILL.md
  const skillMdResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: `You are a skill generator. Given a professional identity model, generate a SKILL.md file following the Anthropic Agent Skills format. The skill should be high-level and opinionated — it captures the person's SOUL, not every detail. Every preference must include causal reasoning ("because..."). Keep it under 200 lines. Output ONLY the markdown content, no wrapping.`,
    messages: [{
      role: 'user',
      content: `Generate a SKILL.md for this identity:

Name: ${identity.name}
Skill Name: ${skillName}
Domains: ${identity.domains.join(', ')}
Role: ${identity.role || 'Professional'}

Personality Traits: ${identity.personality.traits.map(t => t.label).join(', ')}
Values: ${identity.personality.values.map(v => `${v.label} (${v.reason || 'core value'})`).join(', ')}
Risk Tolerance: ${identity.personality.riskTolerance || 'moderate'}

Communication:
- Tone: ${identity.communication.tone || 'direct'}
- Formality: ${identity.communication.formality || 'casual-professional'}
- Feedback Style: ${identity.communication.feedbackStyle || 'constructive'}
- Vocabulary: ${identity.communication.vocabularyPatterns?.join(', ') || 'standard'}

Decision Patterns:
- Default Heuristic: ${identity.decisionPatterns.defaultHeuristic || 'not specified'}
- Consistently Rejects: ${identity.decisionPatterns.consistentlyRejects?.join(', ') || 'not specified'}
- Consistently Prioritizes: ${identity.decisionPatterns.consistentlyPrioritizes?.join(', ') || 'not specified'}

Expertise:
${identity.expertise.map(e => `- ${e.domain} (${e.depth}): ${e.opinions.join('; ')}`).join('\n')}

Override Skills (from skills.sh): ${identity.subSkills.overrides.map(s => s.baseSkillName).join(', ') || 'none'}
Custom Skills: ${identity.subSkills.custom.map(s => s.name).join(', ') || 'none'}

Use this template structure:
---
name: ${skillName}
description: Use when you want responses reflecting ${identity.name}'s perspective as a ${identity.role || 'professional'}. Activates on ${identity.domains.join(', ')} tasks.
---

# ${identity.name}

## Who I Am
{2-3 sentences — role, context, what drives them}

## How I Think
- **Core values**: {ordered, with WHY}
- **Default heuristic**: {go-to when uncertain, with reasoning}
- **Risk tolerance**: {description}

## How I Communicate
- **Tone**: {description}
- **Feedback style**: {description}
- **Vocabulary**: {characteristic phrases}

## What I Reject
{Anti-patterns with causal reasoning}

## Skills
### From skills.sh (with my preferences)
{list with one-line customization summaries pointing to references/overrides/}

### Custom
{list pointing to references/custom/}

## Guardrails
- **Covers**: {scope}
- **Does NOT cover**: {boundaries}`,
    }],
  })

  const skillMd = (skillMdResponse.content[0] as { type: 'text'; text: string }).text

  // Generate override files for existing skills
  const overrides: Array<{ filename: string; content: string }> = []
  for (const override of identity.subSkills.overrides) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate a skill override file for "${override.baseSkillName}" with these customizations: ${override.customizations.join(', ')}. Person: ${identity.name}. Format as markdown with sections: Base Skill, Preferences, Examples. Keep it concise — under 50 lines.`,
      }],
    })
    overrides.push({
      filename: `${override.baseSkillName}.md`,
      content: (res.content[0] as { type: 'text'; text: string }).text,
    })
  }

  // Generate custom skill files
  const custom: Array<{ filename: string; content: string }> = []
  for (const skill of identity.subSkills.custom) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate a custom skill file for "${skill.name}": ${skill.description}. Person: ${identity.name}. Include: What This Covers, Core Principles (with causal rationale — "because..."), Preferred Patterns, Anti-Patterns, Decision Heuristics, Examples. Keep it focused and opinionated, under 100 lines.`,
      }],
    })
    custom.push({
      filename: `${skill.name.toLowerCase().replace(/\s+/g, '-')}.md`,
      content: (res.content[0] as { type: 'text'; text: string }).text,
    })
  }

  return {
    skillMd,
    overrides,
    custom,
    examples: {
      decisions: '<!-- TODO: extract from conversation transcript -->',
      communication: '<!-- TODO: extract from conversation transcript -->',
      reviews: '<!-- TODO: extract from conversation transcript -->',
    },
  }
}
