# Skill Generation Engine — Design Document

**Date:** 2026-02-26
**Status:** Approved
**Approach:** Hybrid — Anthropic structure + Superpowers "explain why" principle

---

## Generation Methodology

**Approach C:** Anthropic-compatible format for ecosystem compatibility (YAML frontmatter, progressive disclosure, CSO-optimized descriptions). Superpowers "explain why" principle for persona depth — every preference includes causal reasoning.

**Validation:** Lightweight — roleplay test in chat (PRD Phase 4b). No backend eval pipeline.

---

## Generation Pipeline (Phase 4)

1. **Persona SKILL.md** — Claude generates high-level, opinionated identity core from the identity model. Short, punchy, not exhaustive. Every preference has a "because" attached.

2. **Skill matching** — Backend searches 75k+ skills.sh dataset for skills matching user's domains/expertise. Uses domain + sub-skill labels from identity model. Presents top matches in Phase 4a.

3. **Override generation** — For each selected existing skill, Claude generates lightweight override: base skill name + user's specific preferences/modifications.

4. **Custom skill generation** — For expertise with no skills.sh match, Claude generates custom skill following Anthropic patterns (frontmatter, CSO description, progressive disclosure).

5. **Example extraction** — Pull decision traces, communication examples, review-style examples from conversation transcript.

---

## Output Structure

```
acting-as-{username}/
├── SKILL.md                          # Identity core (the "soul")
├── references/
│   ├── overrides/
│   │   ├── {existing-skill-1}.md     # skills.sh skill + user prefs
│   │   └── ...
│   ├── custom/
│   │   ├── {custom-skill-1}.md       # Novel skill from conversation
│   │   └── ...
│   └── examples/
│       ├── decisions.md              # Decision-making traces
│       ├── communication.md          # Voice/tone examples
│       └── reviews.md                # Feedback examples
```

---

## SKILL.md Template

```markdown
---
name: acting-as-{username}
description: Use when you want responses reflecting {name}'s perspective
  as a {role}. Activates on {domain} tasks, code reviews, architecture
  decisions, and communication involving {domains}.
---

# {Name}

## Who I Am
{2-3 sentences — role, context, what drives them. Opinionated, not resume-like.}

## How I Think
- **Core values**: {ordered, with WHY each matters to them}
- **Default heuristic**: {go-to when uncertain, with reasoning}
- **Risk tolerance**: {description + when they flex}

## How I Communicate
- **Tone**: {description}
- **Feedback style**: {description + what they prioritize}
- **Vocabulary**: {characteristic phrases, jargon patterns}

## What I Reject
{Anti-patterns with causal reasoning — "I reject X because Y"}

## Skills
### From skills.sh (with my preferences)
- `{skill-name}` — {one-line customization summary}
  → See references/overrides/{skill-name}.md

### Custom
- `{custom-skill}` — {one-line description}
  → See references/custom/{custom-skill}.md

## Guardrails
- **Covers**: {scope}
- **Does NOT cover**: {boundaries}
```

Key principles:
- Under 200 lines
- Every preference has causal reasoning
- Skills section is pointers, not content
- CSO-optimized description for triggering
