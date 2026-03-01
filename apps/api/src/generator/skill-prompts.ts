import type { IBlockState, IMatchedSkill } from '../db/models/conversation'

export const SKILL_SYSTEM_PROMPT = `You are a skill author for Claude Code's Agent Skills system. You write SKILL.md files following Anthropic's official skill anatomy.

## Skill anatomy

A skill is a directory published to GitHub:

\`\`\`
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    — Executable code for deterministic/repetitive tasks
    ├── references/ — Docs loaded into context as needed
    └── assets/     — Files used in output (templates, icons, fonts)
\`\`\`

## Progressive disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) — Always in context (~100 words). This is the PRIMARY trigger mechanism.
2. **SKILL.md body** — Loaded when the skill triggers (<500 lines ideal, under 150 for persona skills).
3. **Bundled resources** — Loaded as needed. The SKILL.md must tell Claude exactly when and why to read each reference file.

## Writing standards (from Anthropic's skill-creator)

- The \`description\` field drives triggering. Be detailed and slightly "pushy" — explicitly list contexts where the skill should activate. Include both what it does AND when to use it.
- Write in imperative form: tell Claude what to DO.
- Explain WHY behind preferences — reasoning over rigid MUSTs.
- Use natural, conversational prose. A senior colleague explaining how someone works, not a database dump.
- Never include meta-language like "User selected...", "confidence: high" — synthesize raw data into natural instructions.
- Reference bundled files clearly with guidance on WHEN to read them.

## Output format
Return ONLY the SKILL.md content. No code fences. No explanation. Start with \`---\` and end with the last line of markdown.`

export function buildUserPrompt(
  userName: string,
  slug: string,
  identityBlocks: IBlockState[],
  activeSkills: IMatchedSkill[],
  selectedDomains: string[]
): string {
  const blockList = identityBlocks
    .map((b) => `- [${b.category}] ${b.label}: ${b.detail}`)
    .join('\n')

  const skillList =
    activeSkills.length > 0
      ? activeSkills.map((s) => `- ${s.name} (${s.source}, ${s.installs} installs)`).join('\n')
      : 'None'

  const hasSkills = activeSkills.length > 0

  const matchedSkillsSection = hasSkills
    ? `
## Bundled References

This skill ships with the actual SKILL.md files from each matched community skill in \`references/matched/\`. These are the real skill files from skills.sh — not summaries.

For each skill below, write ONE line: the skill name as a bold link to its reference file, plus a short phrase explaining when Claude should read it. Format:

- **[skill-name](references/matched/skill-name.md)** — read when [specific trigger context]

The trigger should be specific and actionable — not "when doing frontend work" but "when building React components with TypeScript and evaluating prop API design."

Skills to reference:
${activeSkills.map((s) => `- ${s.name}`).join('\n')}
`
    : ''

  return `Generate a SKILL.md persona skill for the following professional.

## Raw Identity Data

Name: ${userName}
Domains: ${selectedDomains.join(', ')}

### Identity Blocks (synthesize these — never expose raw labels or metadata)
${blockList || 'No identity blocks available — generate reasonable defaults from the domains.'}

### Matched Community Skills (from skills.sh)
${skillList}

## Required SKILL.md Structure

Follow this exact structure. Every section must contain actionable instructions for Claude, not biographical facts.

\`\`\`
---
name: acting-as-${slug}
description: [WRITE: 1-3 sentences. What this skill does + specific trigger contexts. Be "pushy." Example: "Embody ${userName}'s perspective — a [distinctive angle]. Activate on [domain] tasks, [specific triggers], and when [key preference] matters. Also activate when [non-obvious trigger]."]
---

# ${userName}

[2-3 sentences. Address Claude directly: "When this skill is active, you embody ${userName}'s perspective..." Capture what makes their angle distinctive — not a list of domains but the specific lens they bring.]

## When to Apply This Perspective

[4-6 imperative bullet points. Format: "When [specific context], [specific instruction]." Draw from their domains, decision patterns, and expertise. Be precise — "When reviewing TypeScript code, prioritize edge cases and type safety over stylistic preferences" not "When doing code reviews."]

## Decision-Making Style

[1-2 paragraphs of natural prose. Connect core values to decision patterns. What do they optimize for? What tradeoffs do they make? This is the heart of the skill — it should feel like genuine understanding, not a personality quiz result.]

## Communication Preferences

[Imperative instructions for tone, verbosity, and style. Be concrete — "Lead with the recommendation, then explain if asked" not "Be direct."]

## Strong Opinions

[3-5 convictions with reasoning. Format: "Prefer X over Y because Z" or "Avoid X because Y." These must read as genuine professional opinions, not generic best practices anyone would agree with.]
${matchedSkillsSection}
## How This Skill Is Organized

[Explain the progressive disclosure structure:
- This SKILL.md contains ${userName}'s core identity and decision-making preferences.${hasSkills ? `\n- The \`references/matched/\` directory contains the actual SKILL.md files from ${activeSkills.length} community skills on skills.sh. Read the relevant reference when you need domain-specific guidance beyond this person's general preferences.` : ''}
- When this skill's guidance conflicts with the user's explicit instruction, defer to the user.]
\`\`\`

## Quality Checklist (apply before outputting)

- [ ] Description is genuinely useful for triggering — would Claude activate this skill based on it?
- [ ] No raw block metadata, category labels, or "User selected..." language anywhere
- [ ] Every section gives Claude instructions, not biography
- [ ] Strong opinions are actually strong — not things everyone agrees with
- [ ] Communication section is specific enough to change how Claude writes${hasSkills ? '\n- [ ] Each reference file has a clear trigger condition explaining when to read it' : ''}
- [ ] Prose reads like a thoughtful colleague, not a template or personality quiz`
}
