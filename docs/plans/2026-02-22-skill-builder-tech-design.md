# Skill Builder — Technical Design

**Date:** 2026-02-22 | **Updated:** 2026-02-27
**Status:** v4 — Skills.sh-First Architecture
**Author:** Raj Varsani + Claude

---

## Overview

A web platform with a tool-use-driven agentic backend that orchestrates a 3-4 minute conversation to generate personal identity skills. The AI emits structured "identity blocks" via Claude's native tool_use alongside conversational text, and actively matches the user's expertise against the **75k+ skills.sh dataset** (stored locally as JSON chunks in `dataset/`). Blocks animate into a gamified identity card in real-time. Matched skills from skills.sh form the PRIMARY content of the output — custom skill generation is reserved only for niche expertise with no existing match. The output is an installable Agent Skills package.

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Frontend                          │
│                  (Next.js App)                         │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Chat Panel    │  │ Identity Card │  │ Publish View │ │
│  │ + Quick Chips │  │ + Block Queue │  │              │ │
│  │ + Skill Chips │  │ + Skill Slots │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │ SSE              │ SSE             │          │
└─────────┼──────────────────┼────────────────┼──────────┘
          │                  │                │
          ▼                  ▼                ▼
┌──────────────────────────────────────────────────────┐
│                    API Layer                           │
│                 (Hono Backend)                          │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Conversation  │  │ Block State  │  │ Skill        │ │
│  │ Agent         │  │ Machine      │  │ Generator    │ │
│  │ (tool_use)    │  │              │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                 │          │
│         │    ┌──────────────────────┐        │          │
│         └───►│ Skill Matching Engine │◄───────┘          │
│              │ (skills.sh dataset)  │                   │
│              └──────────┬───────────┘                   │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────────────────────────────────────────────┐
│                 External Services                      │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │ Claude   │  │ GitHub   │  │ Auth   │  │ Postgres│ │
│  │ API      │  │ API      │  │ (OAuth)│  │ (state) │ │
│  └──────────┘  └──────────┘  └────────┘  └─────────┘ │
└──────────────────────────────────────────────────────┘

Data Flow:
  User answers → Block State Machine → identity blocks
                                     → Skill Matching Engine → matched skills from dataset
                                     → Skill Generator → assembled output
```

The **Skill Matching Engine** is the key addition in v4. It sits between the Conversation Agent and the Skill Generator. When Claude identifies expertise areas during the conversation, it calls the `match_skills` tool, which triggers a server-side search against the locally-stored skills.sh dataset. Matched skills are returned to Claude as tool results, presented to the user for confirmation, and ultimately form the primary content of the published skill package.

---

## Tech Stack

### Frontend
- **Next.js 15** — App Router, server components where useful
- **TypeScript** — throughout
- **Tailwind CSS v4** — styling with design system tokens
- **Framer Motion** — block animations, card transitions
- **Geist** — sans + mono fonts

### Backend
- **Hono** — lightweight, fast HTTP framework
- **TypeScript** — throughout
- **Anthropic SDK** — Claude API with streaming tool_use
- **Drizzle ORM** — type-safe PostgreSQL access

### Dataset
- **skills.sh JSON chunks** — 75,468 skills across 76 JSON files in `dataset/`, loaded into memory at startup. Each skill has: `source`, `skillId`, `name`, `installs`. This is the primary source for skill output.

### Database
- **PostgreSQL** — conversation state, user profiles, block state, matched skills, published skills

### Auth
- **Google OAuth** — primary sign-in
- **GitHub OAuth** — optional, for personal repo publishing
- **JWT** — session management via `jose`

### Infrastructure
- **Vercel** — frontend hosting
- **Railway / Fly.io** — backend service
- **Managed Postgres** — Neon / Supabase / Railway

---

## Core Architecture: Tool-Use Building Blocks

### The Key Insight

Instead of parsing regex from Claude's text responses, we use **Claude's native `tool_use`** to emit structured identity blocks AND to search the skills.sh dataset. Each tool call = either one visual block on the card or a skill matching operation. The streaming order is architecturally perfect:

1. **Text content blocks** stream first -> chat UI updates
2. **Tool_use content blocks** follow -> identity card blocks animate in, or skill matches return

This creates the "discover then visualize" flow naturally, while also enabling Claude to actively search for matching skills as it learns about the user.

### The 5 Tools

Claude has exactly 5 tools available. The first 4 are fire-and-forget side-effect tools. The 5th — `match_skills` — is a real tool that returns search results to Claude.

#### 1. `add_identity_block` — The primary discovery tool

Called every time Claude learns something concrete about the user's identity. Emits one visual block.

```typescript
{
  name: "add_identity_block",
  description: "Record a newly discovered aspect of the user's professional identity. Call this EVERY time you learn something concrete. Each call adds one visual block to their identity card.",
  input_schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: [
          "personality_trait", "core_value", "domain_expertise",
          "communication_style", "decision_pattern", "tool_preference",
          "opinion", "anti_pattern", "working_style"
        ]
      },
      label: {
        type: "string",
        description: "Short display label (2-4 words). E.g. 'Pragmatic', 'TypeScript Advocate'"
      },
      detail: {
        type: "string",
        description: "WHY this is true, in one sentence. The causal reasoning."
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"]
      },
      source_type: {
        type: "string",
        enum: ["inferred", "stated", "confirmed"]
      },
      related_domain: { type: "string" },
      display_priority: {
        type: "number",
        description: "1-10. 10 = hero-level defining trait."
      }
    },
    required: ["category", "label", "detail", "confidence", "source_type"]
  }
}
```

#### 2. `confirm_identity_block` — Lock in a tentative block

Called when user confirms a summary. Triggers solidification animation.

```typescript
{
  name: "confirm_identity_block",
  description: "Upgrade an existing block's confidence after the user confirms. Triggers visual solidification.",
  input_schema: {
    type: "object",
    properties: {
      label: { type: "string", description: "Label of the block to confirm" },
      new_confidence: { type: "string", enum: ["medium", "high"] }
    },
    required: ["label", "new_confidence"]
  }
}
```

#### 3. `offer_quick_replies` — Present tappable chips

Called with every question. Provides chips the user can tap instead of typing.

```typescript
{
  name: "offer_quick_replies",
  description: "Present tappable quick-reply chips alongside your message.",
  input_schema: {
    type: "object",
    properties: {
      chips: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            value: { type: "string" },
            emoji: { type: "string" }
          },
          required: ["label", "value"]
        }
      },
      allow_custom: { type: "boolean" },
      multi_select: { type: "boolean" }
    },
    required: ["chips"]
  }
}
```

#### 4. `signal_phase_transition` — Move to next phase

Called once when a phase's objectives are met.

```typescript
{
  name: "signal_phase_transition",
  description: "Signal that the conversation should move to the next phase.",
  input_schema: {
    type: "object",
    properties: {
      completed_phase: {
        type: "string",
        enum: ["domain_discovery", "rapid_profiling", "review"]
      },
      next_phase: {
        type: "string",
        enum: ["rapid_profiling", "review", "publish"]
      },
      summary: { type: "string" }
    },
    required: ["completed_phase", "next_phase"]
  }
}
```

#### 5. `match_skills` — Search the skills.sh dataset (REAL tool, returns results)

Called when Claude identifies expertise areas or tool preferences. Unlike the other 4 tools, this is NOT fire-and-forget. The backend searches the 75k+ skills.sh dataset and returns matching skills as the tool result. Claude then presents matches to the user for confirmation.

```typescript
{
  name: "match_skills",
  description: "Search the skills.sh dataset (75k+ community skills) to find skills matching the user's expertise. Call this when you identify a domain, tool, framework, or workflow the user works with. Results are returned to you — present the top matches to the user for confirmation.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query based on user's expertise. E.g. 'react state management', 'laravel', 'git workflows', 'interaction design'"
      },
      domain: {
        type: "string",
        description: "Optional domain filter to narrow results. E.g. 'engineering', 'design', 'data'"
      },
      limit: {
        type: "number",
        description: "Max results to return. Default 5, max 10."
      }
    },
    required: ["query"]
  }
}
```

**Tool result schema** (returned to Claude):

```typescript
{
  matches: Array<{
    skillId: string        // e.g. "react-state-management"
    name: string           // e.g. "react-state-management"
    source: string         // e.g. "wshobson/agents"
    installs: number       // e.g. 2916
    relevanceScore: number // 0-1, how well it matches the query
  }>,
  totalMatches: number,
  query: string
}
```

### Why 5 Tools

The first 4 follow Anthropic's guidance: "Consolidate related operations into fewer tools rather than creating a separate tool for every action." The `add_identity_block` tool handles 9 categories through its `category` enum. The 5th tool — `match_skills` — is fundamentally different: it is a real retrieval tool that returns data to Claude, not a side-effect emitter. It earns its own tool because it serves a distinct purpose (dataset search) and has a different execution model (synchronous result vs fire-and-forget).

### Tool Result Handling: Two Models

**Fire-and-forget (tools 1-4):** These tools are side-effect-only — they update the UI, not the conversation. After each tool call:

1. The backend intercepts the tool_use block from the stream
2. Emits the block data to the frontend via SSE
3. Auto-responds with `{ success: true }` as the tool result
4. The conversation continues without waiting for actual tool execution

**Real result (tool 5 — `match_skills`):** This tool returns actual data to Claude:

1. The backend intercepts the tool_use block from the stream
2. Runs the search against the in-memory skills.sh dataset
3. Returns the matching skills as the tool result
4. Claude receives the matches and presents them to the user
5. The backend also emits `skill_matched` SSE events to the frontend so skill chips render immediately

Claude is instructed in the system prompt: "Tools 1-4 are fire-and-forget side effects. `match_skills` is a real tool — use the results it returns to present skill matches to the user."

---

## Skill Matching Engine

The Skill Matching Engine is the core addition in v4. It is the bridge between the conversation and the 75k+ skills.sh dataset.

### Dataset Loading

At server startup, the engine loads all 76 JSON chunks from `dataset/` into memory:

```typescript
interface SkillRecord {
  source: string    // e.g. "wshobson/agents"
  skillId: string   // e.g. "react-state-management"
  name: string      // e.g. "react-state-management"
  installs: number  // e.g. 2916
}

class SkillMatchingEngine {
  private skills: SkillRecord[] = []
  private nameIndex: Map<string, SkillRecord[]> = new Map()  // token → skills
  private domainIndex: Map<string, SkillRecord[]> = new Map() // inferred domain → skills

  async loadDataset(datasetDir: string): Promise<void> {
    const meta = await readJSON(`${datasetDir}/meta.json`)
    for (let i = 1; i <= meta.totalChunks; i++) {
      const chunk = await readJSON(`${datasetDir}/skills-chunk-${i}.json`)
      this.skills.push(...chunk.skills)
    }
    this.buildIndices()
  }
}
```

Memory footprint: ~75k records x ~100 bytes each = ~7.5MB. Trivial for a server process.

### Index Building

On load, the engine builds two indices for fast matching:

```typescript
private buildIndices(): void {
  for (const skill of this.skills) {
    // Token index: split skill name on hyphens, index each token
    const tokens = skill.name.split('-')
    for (const token of tokens) {
      if (!this.nameIndex.has(token)) this.nameIndex.set(token, [])
      this.nameIndex.get(token)!.push(skill)
    }

    // Domain index: infer domain from name/source heuristics
    const domain = inferDomain(skill.name, skill.source)
    if (domain) {
      if (!this.domainIndex.has(domain)) this.domainIndex.set(domain, [])
      this.domainIndex.get(domain)!.push(skill)
    }
  }
}
```

### Search Algorithm

When `match_skills` is called, the engine runs a multi-signal search:

```typescript
search(query: string, domain?: string, limit: number = 5): SkillMatch[] {
  const queryTokens = tokenize(query) // lowercase, split on spaces/hyphens

  let candidates: Map<string, { skill: SkillRecord; score: number }> = new Map()

  // 1. Exact name match (highest signal)
  for (const skill of this.skills) {
    if (skill.name === query.toLowerCase().replace(/\s+/g, '-')) {
      candidates.set(skill.skillId, { skill, score: 1.0 })
    }
  }

  // 2. Token overlap scoring
  for (const token of queryTokens) {
    const matches = this.nameIndex.get(token) || []
    for (const skill of matches) {
      const existing = candidates.get(skill.skillId)
      const tokenScore = tokenOverlapScore(queryTokens, skill.name.split('-'))
      if (existing) {
        existing.score = Math.max(existing.score, tokenScore)
      } else {
        candidates.set(skill.skillId, { skill, score: tokenScore })
      }
    }
  }

  // 3. Domain filter (if provided, remove non-matching)
  if (domain) {
    const domainSkills = new Set(
      (this.domainIndex.get(domain) || []).map(s => s.skillId)
    )
    for (const [id, entry] of candidates) {
      if (domainSkills.has(id)) {
        entry.score *= 1.2 // boost domain matches
      }
    }
  }

  // 4. Install count tiebreaker (popularity signal)
  const results = Array.from(candidates.values())
    .map(({ skill, score }) => ({
      ...skill,
      relevanceScore: score * (1 + Math.log10(Math.max(skill.installs, 1)) / 10)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)

  return results
}
```

**Scoring breakdown:**
- **Exact name match:** score = 1.0 (e.g., query "react-state-management" matches skill name exactly)
- **Token overlap:** Jaccard similarity between query tokens and skill name tokens (0-1)
- **Domain boost:** 1.2x multiplier if skill is in the user's domain
- **Install tiebreaker:** log10(installs) / 10 as a small additive boost — popular skills surface first among similar scores

### Matching Flow (end-to-end)

```
1. User says: "I work mostly with React and TypeScript, lots of state management"
2. Claude emits identity blocks: domain_expertise "React", tool_preference "TypeScript"
3. Claude calls match_skills({ query: "react state management", domain: "engineering" })
4. Backend searches dataset → returns top 5 matches:
   - react-state-management (2916 installs, score: 0.95)
   - modern-javascript-patterns (3101 installs, score: 0.72)
   - react-native-design (3137 installs, score: 0.61)
   - ...
5. Claude receives results as tool_result
6. Claude presents: "I found some matching skills from the community:
   - react-state-management (2.9k installs) — covers state patterns
   - modern-javascript-patterns (3.1k installs) — JS best practices
   Want me to add these to your skill set?"
7. User taps "Yes" or selects specific ones via quick-reply chips
8. Confirmed skills get added as matched_skill blocks on the identity card
```

### When Claude Calls `match_skills`

Claude is instructed to call `match_skills` at specific moments:

- **After domain selection** — broad domain query (e.g., "engineering frontend")
- **After learning specific tools/frameworks** — targeted query (e.g., "laravel", "react native")
- **After learning workflow preferences** — workflow query (e.g., "git workflows", "monorepo management")
- **During review phase** — final sweep for any missed matches based on all confirmed blocks

Typically 2-4 match_skills calls per conversation.

---

## Block State Machine

Rather than freeform conversation, we define a finite set of **blocks to fill** per domain. Claude picks the next unfilled block based on context, but the system ensures complete coverage.

### Block Definition

```typescript
interface BlockDefinition {
  id: string
  category: string                // Maps to tool's category enum
  label: string                   // Human-readable
  phase: 'discovery' | 'deep' | 'review'
  required: boolean
  dependsOn?: string[]            // Other block IDs that must be filled first
  questionHint: string            // Guidance for Claude on how to ask
  chipOptions?: string[]          // Pre-built quick-reply options
}

interface BlockState {
  blockId: string
  status: 'empty' | 'tentative' | 'confirmed'
  value?: string
  confidence: 'low' | 'medium' | 'high'
}

// NEW in v4: matched skill block
interface MatchedSkillBlock {
  blockId: string                 // e.g. "matched_react-state-management"
  category: 'matched_skill'
  skillId: string                 // skills.sh skillId
  name: string                    // skill display name
  source: string                  // skills.sh source (e.g. "wshobson/agents")
  installs: number
  relevanceScore: number
  status: 'proposed' | 'confirmed' | 'rejected'
  userNotes?: string              // optional user annotation
}
```

### Block Categories

Blocks fall into two distinct groups:

**Identity blocks** — personality, values, communication style, opinions, etc. These are discovered through conversation and emitted via `add_identity_block`. They define WHO the user is.

**Matched skill blocks** (`matched_skill`) — skills from the skills.sh dataset that match the user's expertise. These are discovered via `match_skills` and confirmed by the user. They define WHAT tools/skills the user wants in their package. These are fundamentally different from identity blocks because they represent actual installable community skills, not personality traits.

### Universal Blocks (all domains)

| Block ID | Category | Required | Chip Options |
|----------|----------|----------|-------------|
| `seniority` | working_style | Yes | Junior, Mid, Senior, Lead/Staff, Principal |
| `core_value` | core_value | Yes | Speed, Quality, Simplicity, Learning, Impact |
| `communication_style` | communication_style | Yes | Direct & concise, Diplomatic & detailed, Casual & warm, Formal & precise |
| `risk_tolerance` | personality_trait | Yes | -- (scenario-based) |
| `decision_heuristic` | decision_pattern | Yes | -- (inferred from scenarios) |
| `anti_pattern` | anti_pattern | Yes | -- (free text: "what do most people do wrong?") |
| `hot_take` | opinion | Yes | -- (free text: strongest opinion) |
| `superpower` | personality_trait | No | -- (free text: "what's your superpower?") |
| `conflict_style` | personality_trait | No | -- (inferred) |

### Engineering Blocks (when domain selected)

| Block ID | Category | Required | Depends On | Chip Options |
|----------|----------|----------|-----------|-------------|
| `eng_approach` | working_style | Yes | -- | Plan first, Prototype fast, Research deep, Jump in |
| `eng_primary_stack` | tool_preference | Yes | -- | -- (free text) |
| `eng_architecture` | opinion | Yes | eng_approach | Monolith, Microservices, Start mono split later, Depends |
| `eng_testing` | opinion | No | -- | TDD zealot, Integration-first, Test critical path, Tests slow me down |
| `eng_review_style` | communication_style | Yes | communication_style | Approve with notes, Request changes, Pair on it, Rewrite it |

### Design / Product / Data / Marketing / Operations Blocks

Similar domain-specific blocks defined per domain. Typically 3-5 per domain, mostly chip-answerable.

### State Machine Logic

Each conversation turn:

1. **Get next targets** — `getNextTargets(3)` returns the 3 highest-priority unfilled blocks whose dependencies are met
2. **Inject into system prompt** — Claude sees: filled blocks (don't re-ask), next targets with question hints and chip options, plus any pending matched skills awaiting confirmation
3. **Claude asks about the top target** — naturally worded, using the hint as guidance
4. **Parse tool calls** — `add_identity_block` calls map back to block IDs by matching category + label; `match_skills` calls trigger dataset search
5. **Update state** — mark identity blocks as tentative or confirmed; add matched skill blocks as proposed
6. **Skill matching triggers** — when `domain_expertise` or `tool_preference` blocks are filled, the system prompt hints that Claude should call `match_skills` to find relevant community skills

### Completion Percentage

```
identityCompletion = (filledIdentityBlocks / totalIdentityBlocks) * 100
skillCompletion = (confirmedSkills / proposedSkills) * 100
overallCompletion = (identityCompletion * 0.4) + (skillCompletion * 0.4) + (phaseProgress * 0.2)
```

Starts at 15% (endowed progress). Domain selection immediately fills 1-3 blocks and triggers the first `match_skills` call, jumping to ~25%.

---

## Conversation Flow: System Prompts

### Dynamic System Prompt Assembly

Each turn, the system prompt is assembled from:

```
[Base persona — warm, perceptive, SHORT messages]
+
[Phase-specific instructions — what to explore, question budget, pacing]
+
[Block state context — filled blocks, next targets with hints/chips]
+
[Matched skill context — proposed skills pending confirmation, confirmed skills]
+
[Domain hints — loaded for selected domains]
+
[Skill matching instructions — when and how to call match_skills]
```

### Base Persona (always included)

```
You are the Skill Builder — a warm, perceptive interviewer who discovers
professional identities through quick, engaging questions.

CRITICAL RULES:
1. Ask ONE question at a time. Never stack multiple questions.
2. Keep messages SHORT — 1-3 sentences max.
3. Use offer_quick_replies for EVERY question that can be answered with a tap.
4. Call add_identity_block EVERY time you learn something concrete (1-3 per turn).
5. Infer aggressively from short answers. One "PM at a startup" answer should
   generate 3 blocks: role, company_stage, likely_skills.
6. After emitting a block, briefly acknowledge the discovery before the next question.

TOOL USAGE:
- add_identity_block: Call aggressively. 1-3 blocks per turn is normal.
  These are fire-and-forget — they update the identity card.
- offer_quick_replies: Use for every answerable-by-tap question.
  Fire-and-forget.
- confirm_identity_block: Use when user agrees with your summary.
  Fire-and-forget.
- signal_phase_transition: Call ONCE when phase objectives are met.
  Fire-and-forget.
- match_skills: Call when you identify a specific tool, framework, language,
  or workflow the user works with. This is a REAL tool — it searches 75k+
  community skills and returns results. Use those results to present matching
  skills to the user for confirmation.

SKILL MATCHING STRATEGY:
- The user's answers feed directly into skill matching. Ask questions that
  help narrow down what tools, frameworks, and workflows they actually use.
- When you learn about specific technologies (React, Laravel, Git workflows,
  etc.), call match_skills immediately.
- Present matched skills naturally: "I found some community skills that match
  your expertise — want me to add these to your skill set?"
- Let the user confirm or reject each match. Confirmed matches become the
  PRIMARY content of their published skill package.
- For the final review, do a sweep: look at all confirmed identity blocks and
  make one last match_skills call for anything you might have missed.
```

### Phase: Domain Discovery (budget: 1 question)

```
Welcome them warmly in 1 sentence. Ask them to select domains.
Use offer_quick_replies with multi_select: true.
Domains: Engineering, Design, Product, Data / Analytics, Marketing, Operations.

When they select, immediately:
1. Infer 2-3 initial blocks from domains alone (the "quick roll").
   Emit them as low-confidence inferred blocks.
2. Call match_skills with a broad domain query (e.g. "engineering frontend")
   to seed initial skill matches.
3. Call signal_phase_transition to move to rapid_profiling.
```

### Phase: Rapid Profiling (budget: 8-12 questions)

```
Ask focused questions to fill remaining blocks. Alternate between:
- Quick-tap chips (every 2 out of 3 questions) for speed
- Short free-text (every 3rd question) for depth
- Summary + confirmation after every 4-5 blocks

QUESTION TYPES:
1. "Pick the one that resonates" — forced choice reveals values
2. "Quick scenario: [situation]. You would..." — reveals decision patterns
3. "What's your hot take on [topic]?" — extracts opinions (free text)
4. Confirmation: "I'm seeing [traits]. Ring true?" — locks in blocks

SKILL MATCHING DURING PROFILING:
- Every time you learn a specific tool, framework, or workflow,
  call match_skills. Don't wait — match as you learn.
- After calling match_skills, present the top 2-3 results naturally
  in conversation. Use offer_quick_replies with skill names as chips
  so the user can confirm with a tap.
- Typical pattern: ask about their stack → emit identity blocks →
  call match_skills → present matches → next question.

After [target - 2] blocks are filled AND the user has confirmed or rejected
all proposed skill matches, transition to review.
```

### Phase: Review (budget: 1-2 questions)

```
Present a 2-3 sentence summary of the user's complete identity.
Include a count of matched skills: "I matched X skills from the community
that fit your expertise."

Use offer_quick_replies: ["Spot on!", "Close, but...", "Let me adjust"].

If confirmed:
1. Call confirm_identity_block for all tentative blocks.
2. Do a final match_skills sweep — look at ALL confirmed blocks and
   search for any skills you might have missed.
3. Present any new matches for quick confirmation.
4. Call signal_phase_transition to publish.

If adjustments needed, ask ONE question, update, then confirm.
```

### Domain Hints

Loaded into the system prompt when the user selects domains. Each provides:
- **Areas to explore** — directional, not prescriptive questions
- **Signals to extract** — what to infer from answers
- **Personality inference points** — how answers reveal traits
- **Skill matching hints** — what kinds of queries to run against the dataset for this domain

Pre-defined for: Engineering, Design, Product, Data/Analytics, Marketing, Operations. For custom domains, AI improvises using general hints as a base.

### Skill Matching Context (injected each turn)

```
MATCHED SKILLS STATUS:
- Proposed (awaiting confirmation): [list of proposed skills with names and install counts]
- Confirmed by user: [list of confirmed skills]
- Rejected by user: [list — don't re-propose these]

When presenting new matches, don't re-propose rejected skills.
```

---

## Streaming Architecture

### SSE Event Protocol

```typescript
type SSEEvent =
  // Text streaming
  | { event: 'text_chunk'; data: string }

  // Block discovered — animate it in
  | { event: 'block_added'; data: {
      id: string
      category: string
      label: string
      detail: string
      confidence: 'low' | 'medium' | 'high'
      sourceType: 'inferred' | 'stated' | 'confirmed'
      relatedDomain?: string
      displayPriority?: number
    }}

  // Block confirmed — solidify animation
  | { event: 'block_confirmed'; data: {
      label: string
      newConfidence: 'medium' | 'high'
    }}

  // Skill matched from skills.sh dataset — show skill chip
  | { event: 'skill_matched'; data: {
      skillId: string
      name: string
      source: string
      installs: number
      relevanceScore: number
      status: 'proposed'
    }}

  // Skill confirmation updated by user
  | { event: 'skill_confirmed'; data: {
      skillId: string
      status: 'confirmed' | 'rejected'
    }}

  // Quick-reply chips to render
  | { event: 'quick_replies'; data: {
      chips: Array<{ label: string; value: string; emoji?: string }>
      allowCustom: boolean
      multiSelect: boolean
    }}

  // Phase transition
  | { event: 'phase_change'; data: {
      from: string
      to: string
      summary: string
    }}

  // Completion update
  | { event: 'completion_update'; data: {
      percent: number
      totalBlocks: number
      filledBlocks: number
      matchedSkills: number
      confirmedSkills: number
    }}

  // Stream complete
  | { event: 'done'; data: {} }
```

### Streaming Flow (per user message)

```
Claude API stream begins
  │
  ├─ content_block_start (type: "text")
  │    └─ content_block_delta (text_delta) → emit SSE text_chunk events
  │    └─ content_block_stop
  │
  ├─ content_block_start (type: "tool_use", name: "add_identity_block")
  │    └─ content_block_delta (input_json_delta) → accumulate JSON
  │    └─ content_block_stop → parse JSON, emit SSE block_added
  │
  ├─ content_block_start (type: "tool_use", name: "match_skills")
  │    └─ content_block_delta (input_json_delta) → accumulate JSON
  │    └─ content_block_stop → parse JSON, search dataset,
  │         emit SSE skill_matched for each result,
  │         return results as tool_result to Claude
  │
  ├─ content_block_start (type: "tool_use", name: "offer_quick_replies")
  │    └─ content_block_delta (input_json_delta) → accumulate JSON
  │    └─ content_block_stop → parse JSON, emit SSE quick_replies
  │
  └─ message_stop → emit SSE done, update DB

Note: When match_skills is called, the stream pauses while the backend
searches the dataset. The tool_result is injected and Claude continues
generating text that references the matched skills. This is handled via
Claude's multi-turn tool_use flow (message → tool_use stop_reason →
tool_result → continued assistant message).
```

### Conversation Agent (AsyncGenerator)

```typescript
async function* runConversationTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  phase: Phase,
  blockState: BlockStateMachine,
  matchedSkills: MatchedSkillBlock[],
  selectedDomains: string[],
  skillEngine: SkillMatchingEngine,
): AsyncGenerator<ConversationEvent> {
  const systemPrompt = buildSystemPrompt(phase, blockState, matchedSkills, selectedDomains)

  // Initial API call
  let currentMessages = [...messages]
  let continueLoop = true

  while (continueLoop) {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: currentMessages,
      tools: identityTools, // all 5 tools
    })

    let currentToolName: string | null = null
    let currentToolInput = ''
    let currentToolUseId: string | null = null
    let pendingToolResults: Array<{ tool_use_id: string; content: string }> = []
    let stopReason: string | null = null

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', data: event.delta.text }
      }

      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        currentToolName = event.content_block.name
        currentToolUseId = event.content_block.id
        currentToolInput = ''
      }

      if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        currentToolInput += event.delta.partial_json
      }

      if (event.type === 'content_block_stop' && currentToolName) {
        const input = JSON.parse(currentToolInput)

        if (currentToolName === 'match_skills') {
          // REAL tool: search dataset and return results
          const results = skillEngine.search(input.query, input.domain, input.limit)
          for (const match of results) {
            yield { type: 'skill_matched', data: match }
          }
          pendingToolResults.push({
            tool_use_id: currentToolUseId!,
            content: JSON.stringify({ matches: results, totalMatches: results.length, query: input.query })
          })
        } else {
          // Fire-and-forget: emit SSE event, auto-respond with success
          yield mapToolCallToEvent(currentToolName, input)
          pendingToolResults.push({
            tool_use_id: currentToolUseId!,
            content: JSON.stringify({ success: true })
          })
        }

        currentToolName = null
        currentToolUseId = null
      }

      if (event.type === 'message_stop') {
        stopReason = event.message?.stop_reason || 'end_turn'
      }
    }

    // If Claude stopped because it used tools, continue the loop with tool results
    if (stopReason === 'tool_use' && pendingToolResults.length > 0) {
      currentMessages.push(
        { role: 'assistant', content: stream.finalMessage().content },
        { role: 'user', content: pendingToolResults.map(r => ({
          type: 'tool_result',
          tool_use_id: r.tool_use_id,
          content: r.content
        }))}
      )
    } else {
      continueLoop = false
    }
  }

  yield { type: 'done' }
}
```

The key difference from v3: the conversation agent now runs in a **loop**. When Claude calls `match_skills`, the stop_reason is `tool_use`. The backend searches the dataset, constructs tool results, and continues the conversation. Claude then generates text that references the matched skills. For fire-and-forget tools, the loop still works — it just auto-responds with `{ success: true }`.

### Frontend SSE Consumption

```typescript
// useConversation hook consumes SSE events:
// - text_chunk → append to current message
// - block_added → enqueue in block render queue (staggered)
// - block_confirmed → update block visual state
// - skill_matched → add to matched skills panel with "proposed" status
// - skill_confirmed → update skill chip visual state
// - quick_replies → display chips below current message
// - completion_update → update card percentage (now includes skill counts)
// - phase_change → update phase state
// - done → finalize message, enable input
```

### Block Render Queue (Stagger)

When multiple blocks arrive in one turn, they're queued and rendered with 400ms delay between each:

```typescript
const BLOCK_STAGGER_MS = 400

function useBlockQueue(onRender: (block) => void) {
  const queue = useRef([])

  function enqueue(block) {
    queue.current.push(block)
    if (!processing) processQueue()
  }

  async function processQueue() {
    while (queue.current.length > 0) {
      onRender(queue.current.shift())
      if (queue.current.length > 0) {
        await sleep(BLOCK_STAGGER_MS)
      }
    }
  }
}
```

### Animation Timing (per turn with skill matching)

```
t=0ms      text_chunk events start streaming
t=200ms    First text appears in chat
t=800ms    Text streaming complete, Claude emits tool_use blocks
t=900ms    First block_added → Block 1 materializes (300ms spring)
t=1300ms   Block 2 materializes (staggered)
t=1500ms   match_skills tool call detected → backend searches dataset (~50ms)
t=1600ms   skill_matched events emit → skill chips slide in on identity card
t=1700ms   Tool result returned to Claude → continued generation
t=2000ms   Claude's follow-up text streams: "I found matching skills..."
t=2400ms   quick_replies with skill confirmation chips slide in
t=2600ms   completion_update → percentage ticks up
```

---

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  github_access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  phase TEXT NOT NULL DEFAULT 'domain_discovery',
  block_states JSONB NOT NULL DEFAULT '[]',
  selected_domains JSONB NOT NULL DEFAULT '[]',
  matched_skills JSONB NOT NULL DEFAULT '[]',  -- tracks skills.sh matches + status
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  phase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE published_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  skill_name TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  github_repo_owner TEXT NOT NULL,
  install_command TEXT NOT NULL,
  block_states JSONB NOT NULL,
  matched_skills JSONB NOT NULL,     -- confirmed skills.sh matches in final output
  custom_skills JSONB DEFAULT '[]',  -- custom-generated skills (niche only)
  skill_files JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now()
);
```

Key changes from v3:
- `conversations.matched_skills` — JSONB array tracking all skills.sh matches with their status (`proposed`, `confirmed`, `rejected`). Structure: `Array<{ skillId, name, source, installs, relevanceScore, status, userNotes? }>`
- `published_skills.matched_skills` — JSONB array of confirmed skills.sh matches in the final output
- `published_skills.custom_skills` — JSONB array of custom-generated skills (only for niche expertise with no dataset match)

---

## API Endpoints

### Auth
```
POST /auth/google          — Google OAuth callback
POST /auth/github          — GitHub OAuth callback
POST /auth/github/connect  — Connect GitHub to existing account
GET  /auth/me              — Get current user
POST /auth/logout          — Logout
```

### Conversation
```
POST /conversations                — Start new conversation
GET  /conversations/active         — Get active conversation (resume)
POST /conversations/:id/messages   — Send message (returns SSE stream)
GET  /conversations/:id/blocks     — Get current block states
GET  /conversations/:id/skills     — Get matched skills and their status
POST /conversations/:id/skills/:skillId/confirm  — Confirm a matched skill
POST /conversations/:id/skills/:skillId/reject   — Reject a matched skill
GET  /conversations/:id/messages   — Get conversation history
```

### Skills
```
POST /conversations/:id/publish   — Generate and publish skill
GET  /skills/:id                  — Get published skill details
GET  /users/:username/skill       — Public profile / skill page
```

---

## Skill Generation Pipeline

When the user confirms their identity in the review phase, the pipeline runs. The skills.sh dataset is the PRIMARY source — custom generation is the fallback.

### Step 1: Collect All Confirmed Matched Skills

Gather all `matched_skill` blocks with status `confirmed` from the conversation. These are the skills.sh skills the user has explicitly approved. This is the bulk of the output.

```typescript
const confirmedSkills = matchedSkills.filter(s => s.status === 'confirmed')
// Typical: 5-15 confirmed skills per user
```

### Step 2: Generate Preference Overrides for Each Matched Skill

For each confirmed skills.sh skill, generate a lightweight preference override based on the user's identity blocks. The override doesn't replace the community skill — it layers the user's personality on top.

```typescript
async function generateOverride(
  skill: MatchedSkillBlock,
  identityBlocks: BlockState[],
): Promise<string> {
  // Use Claude to generate a short override that combines the skill
  // with the user's confirmed identity traits
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    system: `Generate a preference override for a skills.sh skill based on the user's identity.
The override should be SHORT (under 30 lines). It layers the user's preferences
on top of the community skill without replacing it.`,
    messages: [{
      role: 'user',
      content: `Skill: ${skill.name} (from ${skill.source})
User identity: ${JSON.stringify(identityBlocks)}
Generate a preference override.`
    }]
  })
  return response.content[0].text
}
```

### Step 3: Generate Custom Skills for Unmatched Expertise

For any `domain_expertise` or `tool_preference` identity blocks where NO skill from skills.sh was matched (or all matches were rejected), generate a custom skill from scratch. This is the FALLBACK path — most users will have few or zero custom skills.

```typescript
const unmatchedExpertise = identityBlocks
  .filter(b => ['domain_expertise', 'tool_preference'].includes(b.category))
  .filter(b => !confirmedSkills.some(s => isRelated(s, b)))

// Only generate custom skills for truly niche, unmatched expertise
for (const block of unmatchedExpertise) {
  await generateCustomSkill(block, identityBlocks)
}
```

### Step 4: Assemble SKILL.md

Compose the final skill package that references matched skills + custom skills + identity layer.

```typescript
function assembleSkillPackage(
  username: string,
  identityBlocks: BlockState[],
  confirmedSkills: MatchedSkillBlock[],
  customSkills: CustomSkill[],
  examples: { decisions: string; communication: string },
): SkillPackage {
  return {
    skillMd: generateSkillMd(username, identityBlocks, confirmedSkills, customSkills),
    matchedSkillFiles: confirmedSkills.map(s => ({
      path: `references/matched/${s.skillId}.md`,
      content: s.overrideContent
    })),
    customSkillFiles: customSkills.map(s => ({
      path: `references/custom/${s.id}.md`,
      content: s.content
    })),
    exampleFiles: [
      { path: 'references/examples/decisions.md', content: examples.decisions },
      { path: 'references/examples/communication.md', content: examples.communication },
    ]
  }
}
```

### Output Structure

```
acting-as-{username}/
├── SKILL.md                          # Identity core + skill composition
├── references/
│   ├── matched/
│   │   ├── {skills-sh-skill-1}.md    # skills.sh skill + user preference overrides
│   │   ├── {skills-sh-skill-2}.md
│   │   └── ...                       # (PRIMARY content — typically 5-15 files)
│   ├── custom/
│   │   ├── {custom-skill-1}.md       # Only for niche, no-match expertise
│   │   └── ...                       # (FALLBACK — typically 0-3 files)
│   └── examples/
│       ├── decisions.md              # Decision-making traces
│       └── communication.md          # Voice/tone examples
```

### SKILL.md Template

```markdown
---
name: acting-as-{username}
description: Use when you want responses reflecting {name}'s perspective
  as a {role}. Activates on {domain} tasks, code reviews, architecture
  decisions, and communication involving {domains}.
---

# {Name}

## Who I Am
{2-3 sentences — opinionated, not resume-like}

## How I Think
- **Core values**: {ordered, with WHY each matters}
- **Default heuristic**: {go-to when uncertain, with reasoning}
- **Risk tolerance**: {description + when they flex}

## How I Communicate
- **Tone**: {description}
- **Feedback style**: {description + priorities}
- **Vocabulary**: {characteristic phrases}

## What I Reject
{Anti-patterns with causal reasoning — "I reject X because Y"}

## Skills

### From skills.sh (with my preferences)
These are community skills matched to my expertise, with my personal
preference overrides applied. They form the core of this skill package.

- `{skill-name}` ({installs} installs) — {customization summary}
  → See references/matched/{skill-name}.md
- `{skill-name-2}` ({installs} installs) — {customization summary}
  → See references/matched/{skill-name-2}.md
{... typically 5-15 matched skills}

### Custom (niche expertise)
Skills generated for expertise areas with no matching community skill.

- `{custom-skill}` — {description}
  → See references/custom/{custom-skill}.md
{... typically 0-3 custom skills, often none}

## Guardrails
- **Covers**: {scope}
- **Does NOT cover**: {boundaries}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| User closes browser mid-conversation | Block states + matched skills persisted in DB, resumes on return |
| User gives very short answers | AI infers aggressively, presents confirmations |
| Claude API error during conversation | Retry with exponential backoff, show error in chat |
| Very fast user (all chip taps) | AI may complete in under 3 minutes — that's fine |
| User wants to change a confirmed block | Tap the block on the card -> edit mode |
| Custom domain with no predefined hints | AI improvises using general hints |
| GitHub publish fails | Retry, or offer file download as fallback |
| `match_skills` returns 0 results | Claude acknowledges and moves on; these become candidates for custom skill generation |
| User rejects all matched skills | That's fine — output will lean on custom generation. Rare but handled. |
| Dataset not loaded at startup | Server fails fast with clear error. Dataset is required. |
| Skill matching is slow (>500ms) | Should not happen (in-memory search). If it does, return partial results and log. |
| Same skill matched multiple times | Deduplicate by skillId. Keep highest relevance score. |
| User confirms a skill then changes mind | Tap the skill chip on the card -> toggle to rejected |

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/agent/tools.ts` | Tool definitions (the 5 tools, including match_skills) |
| `apps/api/src/agent/block-state-machine.ts` | Block registry + state machine (identity + matched_skill blocks) |
| `apps/api/src/agent/conversation-agent.ts` | AsyncGenerator streaming agent with tool_use loop for match_skills |
| `apps/api/src/agent/skill-matching-engine.ts` | Dataset loader, index builder, search algorithm |
| `apps/api/src/agent/system-prompts.ts` | Dynamic system prompt assembly (includes skill matching context) |
| `apps/api/src/agent/domain-hints.ts` | Per-domain exploration hints + skill matching hints |
| `apps/api/src/agent/skill-generator.ts` | SKILL.md + reference generation (matched + custom + overrides) |
| `apps/api/src/routes/conversations.ts` | SSE streaming routes (includes skill_matched events) |
| `packages/shared/src/types.ts` | SSE events, block types, phase types, MatchedSkillBlock |
| `dataset/meta.json` | Dataset metadata (75,468 skills, 76 chunks) |
| `dataset/skills-chunk-*.json` | Raw skills.sh data (loaded at startup) |
| `apps/web/src/lib/use-conversation.ts` | SSE consumer + state management (handles skill_matched) |
| `apps/web/src/lib/use-block-queue.ts` | Staggered block render queue |
| `apps/web/src/components/builder/identity-card.tsx` | Animated card with block lifecycle + skill slots |
| `apps/web/src/components/builder/chat-panel.tsx` | Chat with quick-reply chips |
| `apps/web/src/components/builder/quick-reply-chips.tsx` | Tappable chip component |
| `apps/web/src/components/builder/matched-skill-chip.tsx` | Skill match chip with confirm/reject actions |
