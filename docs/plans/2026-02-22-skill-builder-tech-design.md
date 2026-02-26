# Skill Builder — Technical Design

**Date:** 2026-02-22 | **Updated:** 2026-02-27
**Status:** v3 — Building Blocks Architecture
**Author:** Raj Varsani + Claude

---

## Overview

A web platform with a tool-use-driven agentic backend that orchestrates a 3-4 minute conversation to generate personal identity skills. The AI emits structured "identity blocks" via Claude's native tool_use alongside conversational text. Blocks animate into a gamified identity card in real-time. The output is an installable Agent Skills package.

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
└─────────┼──────────────────┼─────────────────┼──────────┘
          │                  │                 │
          ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────┐
│                 External Services                      │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │ Claude   │  │ GitHub   │  │ Auth   │  │ Postgres│ │
│  │ API      │  │ API      │  │ (OAuth)│  │ (state) │ │
│  └──────────┘  └──────────┘  └────────┘  └─────────┘ │
└──────────────────────────────────────────────────────┘
```

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

### Database
- **PostgreSQL** — conversation state, user profiles, block state, published skills

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

Instead of parsing regex from Claude's text responses, we use **Claude's native `tool_use`** to emit structured identity blocks. Each tool call = one visual block on the card. The streaming order is architecturally perfect:

1. **Text content blocks** stream first → chat UI updates
2. **Tool_use content blocks** follow → identity card blocks animate in

This creates the "discover then visualize" flow naturally.

### The 4 Tools

Claude has exactly 4 tools available. Each has a distinct purpose:

#### 1. `add_identity_block` — The primary discovery tool

Called every time Claude learns something concrete. Emits one visual block.

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

### Why 4 Tools, Not More

Anthropic's guidance: "Consolidate related operations into fewer tools rather than creating a separate tool for every action." The `add_identity_block` tool handles 9 categories through its `category` enum. Fewer tools = less selection ambiguity for Claude = more reliable behavior.

### Tool Result Handling: Fire-and-Forget

These tools are **side-effect-only** — they update the UI, not the conversation. After each tool call:

1. The backend intercepts the tool_use block from the stream
2. Emits the block data to the frontend via SSE
3. Auto-responds with `{ success: true }` as the tool result
4. The conversation continues without waiting for actual tool execution

Claude is instructed in the system prompt: "Your tool calls are observational side-effects that update the identity card. Emit them alongside your conversational text."

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
```

### Universal Blocks (all domains)

| Block ID | Category | Required | Chip Options |
|----------|----------|----------|-------------|
| `seniority` | working_style | Yes | Junior, Mid, Senior, Lead/Staff, Principal |
| `core_value` | core_value | Yes | Speed, Quality, Simplicity, Learning, Impact |
| `communication_style` | communication_style | Yes | Direct & concise, Diplomatic & detailed, Casual & warm, Formal & precise |
| `risk_tolerance` | personality_trait | Yes | — (scenario-based) |
| `decision_heuristic` | decision_pattern | Yes | — (inferred from scenarios) |
| `anti_pattern` | anti_pattern | Yes | — (free text: "what do most people do wrong?") |
| `hot_take` | opinion | Yes | — (free text: strongest opinion) |
| `superpower` | personality_trait | No | — (free text: "what's your superpower?") |
| `conflict_style` | personality_trait | No | — (inferred) |

### Engineering Blocks (when domain selected)

| Block ID | Category | Required | Depends On | Chip Options |
|----------|----------|----------|-----------|-------------|
| `eng_approach` | working_style | Yes | — | Plan first, Prototype fast, Research deep, Jump in |
| `eng_primary_stack` | tool_preference | Yes | — | — (free text) |
| `eng_architecture` | opinion | Yes | eng_approach | Monolith, Microservices, Start mono split later, Depends |
| `eng_testing` | opinion | No | — | TDD zealot, Integration-first, Test critical path, Tests slow me down |
| `eng_review_style` | communication_style | Yes | communication_style | Approve with notes, Request changes, Pair on it, Rewrite it |

### Design / Product / Data / Marketing / Operations Blocks

Similar domain-specific blocks defined per domain. Typically 3-5 per domain, mostly chip-answerable.

### State Machine Logic

Each conversation turn:

1. **Get next targets** — `getNextTargets(3)` returns the 3 highest-priority unfilled blocks whose dependencies are met
2. **Inject into system prompt** — Claude sees: filled blocks (don't re-ask), next targets with question hints and chip options
3. **Claude asks about the top target** — naturally worded, using the hint as guidance
4. **Parse tool calls** — `add_identity_block` calls map back to block IDs by matching category + label
5. **Update state** — mark blocks as tentative or confirmed

The state machine ensures **coverage without rigidity** — Claude writes questions in its own voice, guided by hints.

### Completion Percentage

```
completion = (filledBlocks / totalBlocks) * 100
```

Starts at 15% (endowed progress). Domain selection immediately fills 1-3 blocks, jumping to ~25%.

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
[Domain hints — loaded for selected domains]
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
- offer_quick_replies: Use for every answerable-by-tap question.
- confirm_identity_block: Use when user agrees with your summary.
- signal_phase_transition: Call ONCE when phase objectives are met.

Your tool calls are fire-and-forget side effects. They update the identity card.
Emit them alongside your conversational text.
```

### Phase: Domain Discovery (budget: 1 question)

```
Welcome them warmly in 1 sentence. Ask them to select domains.
Use offer_quick_replies with multi_select: true.
Domains: Engineering, Design, Product, Data / Analytics, Marketing, Operations.

When they select, immediately infer 2-3 initial blocks from domains alone
(the "quick roll"). Emit them as low-confidence inferred blocks.
Then call signal_phase_transition to move to rapid_profiling.
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

After [target - 2] blocks are filled, transition to review.
```

### Phase: Review (budget: 1-2 questions)

```
Present a 2-3 sentence summary of the user's complete identity.
Use offer_quick_replies: ["Spot on!", "Close, but...", "Let me adjust"].
If confirmed, call confirm_identity_block for all tentative blocks.
Then call signal_phase_transition to publish.
If adjustments needed, ask ONE question, update, then confirm.
```

### Domain Hints

Loaded into the system prompt when the user selects domains. Each provides:
- **Areas to explore** — directional, not prescriptive questions
- **Signals to extract** — what to infer from answers
- **Personality inference points** — how answers reveal traits

Pre-defined for: Engineering, Design, Product, Data/Analytics, Marketing, Operations. For custom domains, AI improvises using general hints as a base.

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
  ├─ content_block_start (type: "tool_use", name: "offer_quick_replies")
  │    └─ content_block_delta (input_json_delta) → accumulate JSON
  │    └─ content_block_stop → parse JSON, emit SSE quick_replies
  │
  └─ message_stop → emit SSE done, update DB
```

### Conversation Agent (AsyncGenerator)

```typescript
async function* runConversationTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  phase: Phase,
  blockState: BlockStateMachine,
  selectedDomains: string[],
): AsyncGenerator<ConversationEvent> {
  const systemPrompt = buildSystemPrompt(phase, blockState, selectedDomains)

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
    tools: identityTools,
    // tool_choice: "auto" (default) — Claude decides when to emit blocks
  })

  let currentToolName: string | null = null
  let currentToolInput = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield { type: 'text', data: event.delta.text }
    }

    if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
      currentToolName = event.content_block.name
      currentToolInput = ''
    }

    if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
      currentToolInput += event.delta.partial_json
    }

    if (event.type === 'content_block_stop' && currentToolName) {
      const input = JSON.parse(currentToolInput)
      // Dispatch to appropriate SSE event based on tool name
      yield mapToolCallToEvent(currentToolName, input)
      currentToolName = null
    }
  }

  yield { type: 'done' }
}
```

### Frontend SSE Consumption

```typescript
// useConversation hook consumes SSE events:
// - text_chunk → append to current message
// - block_added → enqueue in block render queue (staggered)
// - block_confirmed → update block visual state
// - quick_replies → display chips below current message
// - completion_update → update card percentage
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

### Animation Timing (per turn)

```
t=0ms      text_chunk events start streaming
t=200ms    First text appears in chat
t=800ms    Text streaming complete
t=900ms    First block_added → Block 1 materializes (300ms spring)
t=1300ms   Block 2 materializes (staggered)
t=1700ms   Block 3 materializes
t=2100ms   completion_update → percentage ticks up
t=2200ms   quick_replies → chips slide in from bottom
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
  skill_files JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now()
);
```

Key change from v2: `identity_model JSONB` → `block_states JSONB` — the block state machine IS the identity model.

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

When the user confirms their identity in the review phase:

1. **Assemble SKILL.md** — From confirmed blocks. Short, opinionated, every preference has a "because" attached. Under 200 lines.

2. **Match existing skills** — Search 75k+ skills.sh dataset for skills matching user's domains/expertise. Match by domain + block labels.

3. **Generate overrides** — For each matched skill, generate a lightweight override with user's preferences.

4. **Generate custom skills** — For expertise with no match, generate custom skill following Anthropic patterns (YAML frontmatter, progressive disclosure, CSO-optimized description).

5. **Extract examples** — Pull decision traces and communication examples from conversation transcript.

### Output Structure

```
acting-as-{username}/
├── SKILL.md                          # Identity core
├── references/
│   ├── overrides/
│   │   ├── {existing-skill-1}.md     # skills.sh skill + user prefs
│   │   └── ...
│   ├── custom/
│   │   ├── {custom-skill-1}.md       # Novel skill from conversation
│   │   └── ...
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
- `{skill-name}` — {customization summary}
  → See references/overrides/{skill-name}.md

### Custom
- `{custom-skill}` — {description}
  → See references/custom/{custom-skill}.md

## Guardrails
- **Covers**: {scope}
- **Does NOT cover**: {boundaries}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| User closes browser mid-conversation | Block states persisted in DB, resumes on return |
| User gives very short answers | AI infers aggressively, presents confirmations |
| Claude API error during conversation | Retry with exponential backoff, show error in chat |
| Very fast user (all chip taps) | AI may complete in under 3 minutes — that's fine |
| User wants to change a confirmed block | Tap the block on the card → edit mode |
| Custom domain with no predefined hints | AI improvises using general hints |
| GitHub publish fails | Retry, or offer file download as fallback |

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/agent/tools.ts` | Tool definitions (the 4 tools) |
| `apps/api/src/agent/block-state-machine.ts` | Block registry + state machine |
| `apps/api/src/agent/conversation-agent.ts` | AsyncGenerator streaming agent with tool_use |
| `apps/api/src/agent/system-prompts.ts` | Dynamic system prompt assembly |
| `apps/api/src/agent/domain-hints.ts` | Per-domain exploration hints |
| `apps/api/src/agent/skill-generator.ts` | SKILL.md + reference generation |
| `apps/api/src/routes/conversations.ts` | SSE streaming routes |
| `packages/shared/src/types.ts` | SSE events, block types, phase types |
| `apps/web/src/lib/use-conversation.ts` | SSE consumer + state management |
| `apps/web/src/lib/use-block-queue.ts` | Staggered block render queue |
| `apps/web/src/components/builder/identity-card.tsx` | Animated card with block lifecycle |
| `apps/web/src/components/builder/chat-panel.tsx` | Chat with quick-reply chips |
| `apps/web/src/components/builder/quick-reply-chips.tsx` | Tappable chip component |
