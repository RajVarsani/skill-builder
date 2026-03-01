# actingas — Implementation Plan

**Created:** 2026-02-27
**Status:** Active

---

## Context

**Product:** A web platform where an AI interviews professionals through a rapid 3-4 minute conversation and generates an installable persona skill (`skills install {username}`). The AI matches expertise against the 75k+ skills.sh dataset in real-time and builds a gamified identity card — block by block.

**Design reference:** Paper UI — https://app.paper.design/file/01KJ9R8F0VP3WF0DQQNN7X41VF?page=01KJF0VEMCXHXDHMTFFHJ0ESGB

**Paper Design Node IDs** (use `mcp__paper__get_screenshot` with these IDs to fetch designs):

| Screen | Node ID | Description |
|--------|---------|-------------|
| Sign In | `58U-0` | Centered auth card — Google + GitHub sign-in |
| Domain Discovery (Step 1/4) | `59L-0` | Phase 1 — domain chips, dormant card at 15% |
| Rapid Profiling (Step 2/4) | `55O-0` | Phase 2 — chat + quick roll + chips, card at 45% |
| Review & Publish (Step 3/4) | `523-0` | Phase 3 — skill checklist, confirm/remove, card at 95% |
| Skill is Live (Step 4/4) | `4ZB-0` | Success — install command, share, completed card at 100% |
| Landing Page | `5BZ-0` | Marketing page — hero, sample card, 4-step explainer, CTA |

To fetch a design during any phase: `mcp__paper__get_screenshot({ nodeId: "<ID>" })` or `mcp__paper__get_screenshot({ nodeId: "<ID>", scale: 2 })` for reading small text.

**Docs:**
- PRD: `docs/plans/2026-02-22-skill-builder-prd.md`
- Tech Design: `docs/plans/2026-02-22-skill-builder-tech-design.md`
- UX Design: `docs/design/design-system.md`

**Skill creation references:**
- Anthropic skill-creator: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- Boris Tane workflow: https://boristane.com/blog/how-i-use-claude-code/

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | **Bun** | Fast, built-in bundler, native TS |
| BE Framework | **Hono** | Lightweight, Bun-native, SSE support |
| Database | **MongoDB** | Flexible schema for block states, conversation data |
| ODM | **Mongoose** | Schema validation, familiar API |
| Auth | **JWT** via `jose` | Stateless sessions, no session store needed |
| AI | **Anthropic SDK** (`@anthropic-ai/sdk`) | Claude tool_use for structured extraction |
| FE Framework | **React 19** + **Vite** | Fast dev, no SSR complexity needed |
| UI Primitives | **Radix UI** | Accessible, unstyled, composable |
| Styling | **Tailwind CSS v4** | Utility-first, design token support |
| Animation | **Framer Motion** | Spring physics, layout animations |
| Routing | **React Router v7** | Simple, mature |
| State | **Zustand** | Lightweight, no boilerplate |
| Fonts | **Archivo Black** (display), **Inter** (body), **JetBrains Mono** (code) | Matches the retro/pixel design |

---

## Design System (from Paper UI)

**Aesthetic:** Retro/pixel/arcade — NOT soft gradients. Think game character creation screen.

**Palette:**
- Page background: warm beige/tan (`~#D4C9B8`)
- Card surfaces: dark charcoal/brown (`~#2A2520`)
- Accent: red/coral (`~#E85D3A`)
- Text on dark: warm cream/white
- Text on light: dark brown/charcoal
- Muted text: `~#8A8070`

**Typography:**
- Display: Archivo Black (pixel/blocky feel), uppercase, large
- Body: Inter (clean sans-serif)
- Code/slugs: JetBrains Mono or similar mono
- Labels: uppercase, tracked, small

**Card:** Dark background with warm gradient border (red/coral tones). Three sections: Identity (pill chips), Matched Skills (full-width bars with install counts + SKILLS.SH badge), Custom Skills (similar bars with CUSTOM badge).

**Nav:** "SKILL BUILDER" wordmark left. "STEP N OF 4" + progress dots right. Thin red accent line below.

**Key components from design:**
- Phase badges: red background, white uppercase text (e.g., "PHASE 1")
- Quick-reply chips: outlined rectangles, uppercase, "OTHER..." has dashed border
- Matched skill rows: dark bg, skill name in bold mono, description muted, "SKILLS.SH" badge right
- Install command: dark input with red COPY button
- Publish buttons: "PUBLISH TO SKILL BUILDER" (red/filled) + "PUBLISH TO GITHUB" (outlined)

---

## Project Structure

```
skills-builder/
├── apps/
│   ├── web/                        # React + Vite frontend
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.tsx            # Entry point
│   │       ├── App.tsx             # Router setup
│   │       ├── index.css           # Tailwind imports + custom fonts
│   │       ├── lib/
│   │       │   ├── api.ts          # API client (fetch wrapper)
│   │       │   ├── auth.ts         # Auth context + hooks
│   │       │   ├── sse.ts          # SSE client helper
│   │       │   └── store.ts        # Zustand stores
│   │       ├── hooks/
│   │       │   ├── use-conversation.ts   # SSE consumer + state
│   │       │   └── use-block-queue.ts    # Staggered block render
│   │       ├── components/
│   │       │   ├── ui/             # Radix-based primitives
│   │       │   ├── layout/         # Nav, page shells
│   │       │   ├── chat/           # Chat panel, messages, input
│   │       │   ├── chips/          # Quick-reply chips
│   │       │   ├── card/           # Identity card + blocks
│   │       │   └── publish/        # Review, publish, success
│   │       └── pages/
│   │           ├── Landing.tsx
│   │           ├── SignIn.tsx
│   │           ├── Builder.tsx     # Main split-pane (chat + card)
│   │           ├── Success.tsx     # "Your skill is live"
│   │           └── Profile.tsx     # Public profile page
│   │
│   └── api/                        # Hono + Bun backend
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            # Server entry, Hono app
│           ├── db/
│           │   ├── connection.ts   # MongoDB connection
│           │   └── models/
│           │       ├── user.ts
│           │       ├── conversation.ts
│           │       └── published-skill.ts
│           ├── auth/
│           │   ├── google.ts       # Google OAuth flow
│           │   ├── github.ts       # GitHub OAuth flow
│           │   ├── jwt.ts          # Token creation/verification
│           │   └── middleware.ts    # Auth middleware
│           ├── agent/
│           │   ├── tools.ts        # 5 tool definitions
│           │   ├── system-prompts.ts
│           │   ├── conversation-agent.ts  # AsyncGenerator with tool_use loop
│           │   ├── block-state-machine.ts
│           │   ├── domain-hints.ts
│           │   └── skill-matching-engine.ts  # Dataset loader + search
│           ├── generator/
│           │   ├── skill-generator.ts    # SKILL.md assembly
│           │   ├── override-generator.ts # Preference overrides
│           │   └── github-publisher.ts   # Publish to GitHub
│           └── routes/
│               ├── auth.ts
│               ├── conversations.ts  # SSE streaming routes
│               ├── skills.ts
│               └── users.ts
│
├── packages/
│   └── shared/                     # Shared types
│       ├── package.json
│       └── src/
│           └── types.ts            # SSE events, block types, phases
│
├── dataset/                        # 75k+ skills.sh data (already exists)
│   ├── meta.json
│   └── skills-chunk-*.json
│
├── scripts/
│   └── scrape-skills.mjs          # Skills.sh scraper (already exists)
│
├── docs/                           # Design docs (already exist)
├── .github/workflows/              # GitHub Actions (already exists)
├── .claude/skills/                 # Phase management skills
├── PLAN.md                         # This file
├── EXECUTION.md                    # Phase execution log
├── CLAUDE.md                       # Project conventions
├── package.json                    # Root workspace
├── bunfig.toml                     # Bun config
└── .gitignore
```

---

## Implementation Phases

### Iteration 0: Foundation

#### Phase 0.1: Project Scaffold

**Scope:** Set up the monorepo from scratch with Bun workspaces, React+Vite frontend, Hono backend, shared types package, Tailwind, and basic project config.

**What gets built:**
- Root `package.json` with Bun workspaces (`apps/*`, `packages/*`)
- `bunfig.toml`
- `apps/web/` — Vite + React 19 + Tailwind v4 + Radix UI setup
  - `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`
  - `src/main.tsx`, `src/App.tsx`, `src/index.css`
  - Install: `react`, `react-dom`, `@radix-ui/themes`, `tailwindcss`, `framer-motion`, `react-router`, `zustand`
- `apps/api/` — Hono + Bun server setup
  - `src/index.ts` with basic Hono app, CORS, health check
  - Install: `hono`, `mongoose`, `@anthropic-ai/sdk`, `jose`
- `packages/shared/` — TypeScript types package
  - `src/types.ts` with initial SSE event types, phase types, block types
- `CLAUDE.md` with project conventions
- `.gitignore` updated for Bun

**Acceptance criteria:**
- `bun run dev` starts both FE (Vite) and BE (Hono) simultaneously
- FE renders a blank page at `localhost:5173`
- BE responds to `GET /health` at `localhost:3000`
- Tailwind classes work in FE
- Shared types importable from both apps

---

#### Phase 0.2: MongoDB + Models

**Scope:** MongoDB connection, Mongoose models for users, conversations, and published skills.

**What gets built:**
- `apps/api/src/db/connection.ts` — MongoDB connection with env var
- `apps/api/src/db/models/user.ts`
  ```typescript
  {
    email: string (unique)
    name: string
    avatarUrl?: string
    googleId?: string (unique, sparse)
    githubId?: string (unique, sparse)
    githubAccessToken?: string
  }
  ```
- `apps/api/src/db/models/conversation.ts`
  ```typescript
  {
    userId: ObjectId (ref User)
    phase: 'domain_discovery' | 'rapid_profiling' | 'review' | 'published'
    selectedDomains: string[]
    blockStates: Array<{
      blockId: string
      category: string
      label: string
      detail: string
      confidence: 'low' | 'medium' | 'high'
      sourceType: 'inferred' | 'stated' | 'confirmed'
      status: 'tentative' | 'confirmed'
    }>
    matchedSkills: Array<{
      skillId: string
      name: string
      source: string
      installs: number
      relevanceScore: number
      status: 'proposed' | 'confirmed' | 'rejected'
    }>
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      toolCalls?: any[]
      phase: string
      createdAt: Date
    }>
    status: 'active' | 'completed' | 'abandoned'
  }
  ```
- `apps/api/src/db/models/published-skill.ts`
  ```typescript
  {
    userId: ObjectId (ref User)
    conversationId: ObjectId (ref Conversation)
    skillName: string
    githubRepoUrl: string
    githubRepoOwner: string
    installCommand: string
    blockStates: any[]
    matchedSkills: any[]
    customSkills: any[]
    skillFiles: any[]
  }
  ```

**Acceptance criteria:**
- MongoDB connects on server start
- Models can be imported and used
- Indexes created on unique fields

---

### Iteration 1: Auth System

#### Phase 1.1: BE — Auth Routes + JWT

**Scope:** Google OAuth, GitHub OAuth, JWT session management, auth middleware.

**What gets built:**
- `apps/api/src/auth/jwt.ts` — `createToken(userId)`, `verifyToken(token)` using `jose`
- `apps/api/src/auth/google.ts` — Exchange Google auth code for user info, create/find user, return JWT
- `apps/api/src/auth/github.ts` — Exchange GitHub auth code for user info, create/find user, return JWT. Also handle "connect GitHub to existing account" flow.
- `apps/api/src/auth/middleware.ts` — Hono middleware: extract JWT from `Authorization: Bearer` header, attach `userId` to context
- `apps/api/src/routes/auth.ts`:
  - `POST /auth/google` — Google OAuth callback
  - `POST /auth/github` — GitHub OAuth callback
  - `POST /auth/github/connect` — Connect GitHub to existing account
  - `GET /auth/me` — Get current user (requires auth)
  - `POST /auth/logout` — Logout (client-side token discard)
- Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`, `MONGODB_URI`

**Acceptance criteria:**
- Can exchange Google auth code for JWT
- Can exchange GitHub auth code for JWT
- `/auth/me` returns user info with valid JWT
- Invalid/missing JWT returns 401

---

#### Phase 1.2: FE — Sign-In Screen + Auth Flow

**Paper design:** `58U-0` (Sign In screen)

**Scope:** Sign-in page matching the Paper design, auth context, protected routes.

**What gets built:**
- `apps/web/src/lib/auth.ts` — AuthContext provider: stores JWT in localStorage, exposes `user`, `signIn`, `signOut`, `isAuthenticated`
- `apps/web/src/lib/api.ts` — Fetch wrapper that auto-attaches JWT to requests
- `apps/web/src/pages/SignIn.tsx` — Matches Paper design screen 4:
  - Centered card on beige background
  - Decorative pixel bar at top
  - "SKILL BUILDER" heading (Archivo Black)
  - "Build your professional identity. Let AI discover who you are — block by block."
  - "SIGN IN WITH GOOGLE" button (dark/filled, G icon)
  - "SIGN IN WITH GITHUB" button (outlined, GH icon)
  - "No credit card. No setup. Just a 3-minute conversation."
- `apps/web/src/components/layout/Nav.tsx` — Top nav bar: "SKILL BUILDER" wordmark left, step indicator + user avatar right
- `apps/web/src/App.tsx` — React Router setup with:
  - `/` — Landing (public)
  - `/sign-in` — Sign-in (public)
  - `/builder` — Builder (protected)
  - `/success/:id` — Success (protected)
  - `/profile/:username` — Public profile

**Acceptance criteria:**
- Sign-in page renders and matches Paper design
- Google sign-in flow works end-to-end (redirect → callback → JWT → redirect to /builder)
- GitHub sign-in flow works end-to-end
- Protected routes redirect to /sign-in when unauthenticated
- Nav shows user avatar when authenticated

---

### Iteration 2: Conversation Engine (THE CORE)

#### Phase 2.1: BE — Claude Conversation Agent

**Scope:** The heart of the product. Claude tool_use agent with 5 tools, system prompt assembly, SSE streaming, conversation API routes.

**What gets built:**

**Tools (`apps/api/src/agent/tools.ts`):**

All 5 tool definitions as specified in the tech design:
1. `add_identity_block` — Record a discovered identity trait (fire-and-forget)
2. `confirm_identity_block` — Lock in a tentative block (fire-and-forget)
3. `offer_quick_replies` — Present tappable chips (fire-and-forget)
4. `signal_phase_transition` — Move to next phase (fire-and-forget)
5. `match_skills` — Search skills.sh dataset (REAL tool, returns results)

**System prompts (`apps/api/src/agent/system-prompts.ts`):**

Dynamic assembly per turn:
```
[Base persona — warm, perceptive, SHORT messages, tool usage rules]
+
[Phase-specific instructions — question budget, pacing, what to explore]
+
[Block state context — filled blocks, next targets with hints/chips]
+
[Matched skill context — proposed/confirmed/rejected skills]
+
[Domain hints — loaded for selected domains]
```

The system prompt is THE most important piece. Use /brainstorming skill before writing it to explore the conversation design deeply.

**Conversation agent (`apps/api/src/agent/conversation-agent.ts`):**

AsyncGenerator that streams SSE events. Handles the tool_use loop:
- Fire-and-forget tools (1-4): auto-respond with `{ success: true }`
- `match_skills` (5): search dataset, return results, Claude continues

Key: When Claude's stop_reason is `tool_use`, the agent loops — constructs tool results, sends them back, and Claude continues generating.

**Block state machine (`apps/api/src/agent/block-state-machine.ts`):**

Registry of block definitions per domain. Each block has: id, category, required, dependsOn, questionHint, chipOptions. The machine tracks which blocks are filled, returns next targets, calculates completion %.

**Domain hints (`apps/api/src/agent/domain-hints.ts`):**

Per-domain exploration guidance: areas to explore, signals to extract, skill matching hints. Pre-defined for: Engineering, Design, Product, Data/Analytics, Marketing, Operations.

**Routes (`apps/api/src/routes/conversations.ts`):**
- `POST /conversations` — Start new conversation (creates in DB)
- `GET /conversations/active` — Get user's active conversation (resume)
- `POST /conversations/:id/messages` — Send message → returns SSE stream
- `GET /conversations/:id/blocks` — Get current block states
- `GET /conversations/:id/skills` — Get matched skills + status
- `POST /conversations/:id/skills/:skillId/confirm` — Confirm a skill
- `POST /conversations/:id/skills/:skillId/reject` — Reject a skill

**SSE event types** (from shared types):
- `text_chunk` — Streaming text
- `block_added` — New identity block
- `block_confirmed` — Block locked in
- `skill_matched` — Skill found from dataset
- `skill_confirmed` — Skill confirm/reject
- `quick_replies` — Chips to render
- `phase_change` — Phase transition
- `completion_update` — % + counts
- `done` — Stream complete

**Acceptance criteria:**
- Can start a conversation and get SSE stream back
- Claude emits identity blocks via tool_use
- Quick-reply chips are emitted and can be tapped
- Phase transitions work (domain → profiling → review)
- Block state machine tracks completion
- All 5 tools work correctly
- Conversation persists in MongoDB
- Can resume an active conversation

---

#### Phase 2.2: FE — Chat Panel + Quick-Reply Chips

**Paper design:** `59L-0` (Domain Discovery — for domain chips, phase indicator, chat layout), `55O-0` (Rapid Profiling — for quick roll, chip styles, message bubbles, chat input)

**Scope:** The left side of the split pane. Chat messages, SSE consumption, quick-reply chips, streaming text, phase indicators.

**What gets built:**

**SSE client (`apps/web/src/lib/sse.ts`):**
- `connectSSE(conversationId, message)` — Opens SSE connection, dispatches events
- Auto-reconnect on error

**Conversation store (`apps/web/src/lib/store.ts`):**
- Zustand store for: messages, blocks, matchedSkills, phase, completion, chips, isStreaming
- Actions: addMessage, addBlock, confirmBlock, addMatchedSkill, setChips, setPhase, updateCompletion

**Conversation hook (`apps/web/src/hooks/use-conversation.ts`):**
- Consumes SSE events, dispatches to store
- Handles: text_chunk → append to current message, block_added → add block, quick_replies → show chips, etc.

**Components:**
- `chat/ChatPanel.tsx` — Scrollable message list + input area
- `chat/MessageBubble.tsx` — User messages (right, dark bg) + AI messages (left, light bg, "SKILL BUILDER" label above)
- `chat/QuickRoll.tsx` — The "QUICK ROLL" section with confirmed + tentative blocks inline
- `chat/ChatInput.tsx` — Text input with arrow send button. "Or type your answer..." placeholder. Disabled during streaming.
- `chat/StreamingCursor.tsx` — Blinking pipe cursor during text stream
- `chips/QuickReplyChips.tsx` — Chip row below AI messages. Pill-shaped, uppercase. "OTHER..." has dashed border. Multi-select mode with "CONTINUE" button for domain selection.
- `chips/SkillConfirmChips.tsx` — Chips specifically for confirming/rejecting matched skills

**Phase indicator:**
- `layout/PhaseIndicator.tsx` — Red badge + phase name + horizontal rule. "PHASE 1 DOMAIN DISCOVERY", etc.
- `layout/StepIndicator.tsx` — "STEP N OF 4" + colored progress dots in nav

**Pages:**
- `pages/Builder.tsx` — Split-pane layout: chat left (~55%), card right (~45%). Phase indicator above chat. Step indicator in nav.

**Acceptance criteria:**
- Messages render correctly (user right, AI left with "SKILL BUILDER" label)
- Text streams in real-time with blinking cursor
- Quick-reply chips appear below AI messages
- Tapping a chip sends it as a message
- "OTHER..." chip expands to text input
- Multi-select chips work for domain selection (checkmarks + CONTINUE button)
- Phase indicator shows current phase
- Step indicator shows progress in nav
- Chat scrolls to bottom on new messages
- Input disabled during AI response

---

#### Phase 2.3: Integration — End-to-End Conversation Flow

**Scope:** Wire FE to BE. Full conversation flow from domain selection through profiling.

**What gets built:**
- Connect SSE client to actual backend endpoints
- Handle auth token in SSE connections
- Test the full flow:
  1. User loads /builder → conversation created
  2. AI sends greeting + domain chips
  3. User taps domains → AI sends quick-roll blocks
  4. Phase transitions to rapid profiling
  5. AI asks questions with chips
  6. User answers → blocks appear
  7. Summary checkpoints work
- Error handling: API errors, SSE disconnects, reconnection
- Conversation resume: if user refreshes, load existing conversation state from DB

**Acceptance criteria:**
- Full conversation flows from domain selection through rapid profiling
- Blocks accumulate correctly in store
- Phase transitions trigger UI changes
- Conversation survives page refresh
- Errors are handled gracefully (retry, user-facing error message)

---

### Iteration 3: Skill Matching + Identity Card

#### Phase 3.1: BE — Skill Matching Engine

**Scope:** Load the 75k+ skills.sh dataset, build search index, implement the `match_skills` tool handler.

**What gets built:**

**Skill matching engine (`apps/api/src/agent/skill-matching-engine.ts`):**
- `loadDataset(dir)` — Load all 76 JSON chunks into memory (~7.5MB)
- `buildIndices()` — Token index on skill names (split on hyphens), domain index via heuristic
- `search(query, domain?, limit?)` — Multi-signal search:
  1. Exact name match (score: 1.0)
  2. Token overlap (Jaccard similarity)
  3. Domain boost (1.2x)
  4. Install count tiebreaker (log10)
- Returns: `Array<{ skillId, name, source, installs, relevanceScore }>`

**Integration with conversation agent:**
- When Claude calls `match_skills`, the agent:
  1. Runs `engine.search()` against the in-memory dataset
  2. Returns results as tool_result to Claude
  3. Emits `skill_matched` SSE events to frontend
  4. Claude presents matches in conversation text

**Dataset loading on startup:**
- Engine loads once when server starts
- If dataset missing, server logs error but doesn't crash (graceful degradation)

**Acceptance criteria:**
- Dataset loads in <2 seconds on startup
- Search returns relevant results for common queries ("react state management", "api design", etc.)
- `match_skills` tool call returns results to Claude
- Claude presents matched skills naturally in conversation
- Matched skills persist in conversation DB

---

#### Phase 3.2: FE — Identity Card

**Paper design:** `59L-0` (dormant card at 15% with placeholders), `55O-0` (card at 45% with blocks + matched skills appearing), `523-0` (card at 95% nearly complete), `4ZB-0` (card at 100% fully complete)

**Scope:** The right side of the split pane. The gamified identity card with three sections, block animations, gradient intensification.

**What gets built:**

**Block queue (`apps/web/src/hooks/use-block-queue.ts`):**
- Staggered render queue: identity blocks first (from below, 400ms apart), then matched skills (from right, 400ms apart, 200ms gap between groups)
- Completion % updates after all blocks in batch render

**Components:**
- `card/IdentityCard.tsx` — The main card component. Dark background, warm gradient border. Three sections + header + footer.
- `card/CardHeader.tsx` — Avatar (initials in red square), name (Archivo Black), role (muted), progress bar + percentage
- `card/IdentitySection.tsx` — "IDENTITY" section header + flex-wrap pill chips
- `card/IdentityBlock.tsx` — Single identity pill. 3 states: materializing (dashed, 60% opacity, fade from below) → tentative (solid thin border, 80%) → confirmed (solid, full opacity, glow). Framer Motion spring animations.
- `card/MatchedSkillsSection.tsx` — "MATCHED SKILLS" section header + skill rows
- `card/MatchedSkillBlock.tsx` — Full-width row: skill name (mono, bold) + install count + "SKILLS.SH" badge. Slides in from right. Tentative → confirmed with checkmark.
- `card/CustomSkillsSection.tsx` — "CUSTOM SKILLS" section (conditional, only if custom skills exist)
- `card/CustomSkillBlock.tsx` — Similar to matched but with "CUSTOM" badge
- `card/CardFooter.tsx` — "N BLOCKS DISCOVERED" left, "N SKILLS MATCHED" right (red text)
- `card/GradientBorder.tsx` — The warm gradient border that intensifies with completion. 0-15% dormant/muted, 100% full glow.
- `card/PlaceholderBlocks.tsx` — Dashed "???" placeholder blocks shown in dormant state
- `card/ScanningIndicator.tsx` — "SCANNING 75K+ SKILLS..." placeholder in matched skills section, "SELECT DOMAINS TO START SCANNING 75K+ SKILLS..." in initial state

**Gradient intensification:**
The card border gradient goes from muted/dormant to vibrant/glowing as completion rises. Use CSS custom properties driven by completion % in Zustand store.

**Mobile behavior:**
- Card collapses to a mini bar above the chat
- Mini bar shows: completion %, 2-3 top traits, skill match count
- Tap to expand full card

**Acceptance criteria:**
- Card renders all three sections correctly
- Identity blocks animate in from below with spring physics
- Matched skills slide in from the right
- Placeholder "???" blocks show in empty slots
- "SCANNING 75K+ SKILLS..." indicator shows before first match
- Gradient border intensifies with completion
- Stagger queue works (blocks don't all appear at once)
- Footer counts update dynamically
- Card is responsive (collapsible on mobile)

---

#### Phase 3.3: Integration — Live Card from Conversation

**Scope:** Connect the conversation flow to the identity card. Blocks appear in real-time as the AI discovers traits and matches skills.

**What gets built:**
- Wire `block_added` SSE events → identity card blocks
- Wire `skill_matched` SSE events → matched skills section
- Wire `block_confirmed` → solidification animation
- Wire `completion_update` → gradient + footer + progress bar
- The full flow:
  1. Domain selection → quick-roll blocks appear on card + "scanning" indicator
  2. Answers → identity blocks materialize + matched skills surface
  3. Summary checkpoint → tentative blocks confirm with animation
  4. Review phase → all blocks and skills visible
- Test that the stagger queue handles mixed block types correctly

**Acceptance criteria:**
- Blocks appear on card in real-time during conversation
- Matched skills appear when confidence crosses threshold
- Stagger ordering is correct (identity first, skills second)
- Gradient intensifies visually as blocks accumulate
- Everything survives page refresh (state loaded from DB)

---

### Iteration 4: Publish Flow

#### Phase 4.1: BE — Skill Generation Pipeline

**Scope:** Generate the installable skill package from confirmed blocks and matched skills.

**What gets built:**

**Skill generator (`apps/api/src/generator/skill-generator.ts`):**
1. Collect confirmed matched skills from conversation
2. Generate preference overrides for each matched skill (Claude call)
3. Generate custom skills for unmatched expertise (Claude call)
4. Assemble SKILL.md from template
5. Return complete file structure

**Override generator (`apps/api/src/generator/override-generator.ts`):**
- For each confirmed skills.sh match, generate a short (<30 lines) preference override
- Uses Claude to combine the community skill with the user's identity blocks

**GitHub publisher (`apps/api/src/generator/github-publisher.ts`):**
- Create repo or commit to existing repo via GitHub API
- Two paths:
  1. Platform repo: commit to the platform's GitHub org (default)
  2. Personal repo: commit to user's connected GitHub account
- Create the directory structure: `acting-as-{username}/SKILL.md` + `references/`

**SKILL.md template** (based on Anthropic's skill-creator pattern):
```markdown
---
name: acting-as-{username}
description: Use when you want responses reflecting {name}'s perspective as a {role}. Activates on {domain} tasks, code reviews, architecture decisions, and communication.
---

# {Name}

## Who I Am
{2-3 sentences from identity blocks}

## How I Think
{Core values, decision heuristics, risk tolerance}

## How I Communicate
{Communication style, feedback patterns}

## What I Reject
{Anti-patterns with reasoning}

## Skills

### From skills.sh (with my preferences)
{List of matched skills with install counts + override summaries}

### Custom (niche expertise)
{List of custom-generated skills}

## Guardrails
{Scope and boundaries}
```

**Routes (`apps/api/src/routes/skills.ts`):**
- `POST /conversations/:id/publish` — Generate + publish skill
- `GET /skills/:id` — Get published skill details
- `GET /users/:username/skill` — Public profile

**Acceptance criteria:**
- Skill generation produces valid SKILL.md following Anthropic's format
- Matched skills have preference overrides
- Custom skills generated for unmatched expertise
- Publishing to platform GitHub repo works
- Publishing to personal GitHub repo works (when connected)
- Install command is correct: `skills install {username}`

---

#### Phase 4.2: FE — Review + Publish UI

**Paper design:** `523-0` (Review & Publish — skill checklist, confirm/remove, publish buttons), `4ZB-0` (Success — install command, share buttons, completed card)

**Scope:** Phase 3 (Review & Publish) and Step 4 (Success) screens from the Paper design.

**What gets built:**

**Review screen (matches Paper screen 3):**
- AI summary message: "Your identity is complete! You're a..."
- "MATCHED SKILLS" header + "CONFIRM OR REMOVE" label
- Skill list with X buttons:
  - Each row: [X button] [SKILL-NAME in bold mono] [description muted] [SKILLS.SH badge]
  - Removed skills get struck through / faded
  - "+ See N more near-matches" link
  - Star + "N custom skills generated from your unique expertise"
- "PUBLISH YOUR SKILL" section:
  - "PUBLISH TO SKILL BUILDER" (red/filled button)
  - "PUBLISH TO GITHUB" (outlined button)

**Success screen (matches Paper screen 1):**
- `pages/Success.tsx`:
  - "YOUR SKILL IS LIVE" heading (Archivo Black)
  - Summary text: "Your professional identity has been encoded..."
  - "INSTALL COMMAND" label + dark input with `skills install {username}` + red COPY button
  - "SHARE YOUR SKILL" section: SHARE ON X, LINKEDIN, COPY LINK buttons
  - Completed identity card at 100% on the right

**Components:**
- `publish/SkillReviewList.tsx` — The matched skills checklist
- `publish/SkillReviewRow.tsx` — Single skill row with remove button
- `publish/PublishButtons.tsx` — The two publish buttons
- `publish/InstallCommand.tsx` — Dark input with copy button
- `publish/ShareButtons.tsx` — Social share buttons

**Acceptance criteria:**
- Review screen shows all matched skills with confirm/remove
- Removing a skill strikes it through and updates the card
- "See more near-matches" loads additional matches
- Publishing triggers skill generation
- Loading state during publish
- Success screen shows install command with working copy
- Share buttons have correct URLs
- Card shows 100% with full gradient glow on success

---

#### Phase 4.3: Integration — End-to-End Publish

**Scope:** Wire the review + publish flow together. Full journey from conversation to published skill.

**What gets built:**
- Connect review screen to BE skill confirm/reject endpoints
- Connect publish buttons to BE publish endpoint
- Handle publish loading state + errors
- Redirect to success page after publish
- Test the FULL flow:
  1. Sign in
  2. Domain selection → quick roll
  3. Rapid profiling → blocks + skills appear
  4. Review → confirm/remove skills → publish
  5. Success → install command + share
- Ensure published skill is actually accessible via `skills install`

**Acceptance criteria:**
- Full end-to-end flow works (sign in → publish → install command)
- Published skill is valid and installable
- Error handling for all failure modes
- Session persistence throughout

---

### Iteration 5: Landing + Polish

#### Phase 5.1: Landing Page

**Paper design:** `5BZ-0` (Landing Page — hero, sample card, 4-step explainer, CTA, footer)

**Scope:** The marketing landing page (Paper screen 6). FE only.

**What gets built:**

**`pages/Landing.tsx`** matching the Paper design:
- Nav: "SKILL BUILDER" + "HOW IT WORKS" + "EXAMPLES" + "BUILD YOURS" (red button)
- Hero section (red border frame):
  - "BUILD YOUR EXPERTISE BLOCK BY BLOCK" (Archivo Black, "EXPERTISE" in red)
  - Subtitle: "An AI interviews you about what you know. It assembles your skills into an installable identity — pixel by pixel."
- Sample identity card preview (static, pre-built)
- "HOW IT WORKS" section:
  - "FOUR STEPS TO YOUR SKILL IDENTITY"
  - 4 cards: 01 DISCOVER → 02 INTERVIEW → 03 REVIEW → 04 PUBLISH
  - (Note: Paper design shows "ROLEPLAY" for step 3 — we change this to "REVIEW" since roleplay is out of scope for v1)
- CTA section (dark background):
  - "READY TO BUILD YOUR BLOCKS?"
  - "START BUILDING" (red) + "VIEW EXAMPLES" (outlined)
- Footer: copyright + links

**Acceptance criteria:**
- Landing page matches Paper design
- "BUILD YOURS" / "START BUILDING" navigates to sign-in or builder (if authenticated)
- Responsive on mobile
- Sample card is static but visually accurate

---

#### Phase 5.2: Profile Page + Polish

**Scope:** Public profile page, edge cases, final polish, deploy prep.

**What gets built:**
- `pages/Profile.tsx` — Public shareable page showing the completed card + install command
- Mobile responsiveness audit across all screens
- Edge case handling:
  - User closes browser mid-conversation → resume on return
  - Very short answers → aggressive inference
  - Custom domain with no hints → AI improvises
  - GitHub publish fails → retry + download fallback
  - 0 skill matches → lean on custom generation
- Performance: lazy loading, code splitting
- SEO: meta tags, OG images for share links
- Deploy configuration: Vercel (FE), Railway/Fly (BE)

**Acceptance criteria:**
- Profile page shows published card with install command
- All edge cases handled gracefully
- Mobile responsive across all screens
- Deploy pipeline works

---

## Key Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Monorepo structure | Bun workspaces | Shared types, single install |
| DB for conversations | MongoDB | Flexible JSONB-like storage for blocks, no migrations |
| SSE over WebSocket | SSE | Simpler, one-directional (server→client), works with HTTP/2 |
| tool_use over regex parsing | Claude native tool_use | Guaranteed schema conformance, streaming order perfect |
| In-memory dataset | Load 75k skills at startup | ~7.5MB, sub-millisecond search, no external search service |
| Fire-and-forget vs real tools | 4 fire-and-forget + 1 real | Identity blocks are side effects; skill matching needs results |
| JWT over sessions | Stateless auth | No session store, horizontal scaling |
| Zustand over Redux | Lightweight state | Simple, no boilerplate, perfect for real-time updates |
| React Router over Next.js | No SSR needed | Simpler, Vite is faster, no server components overhead |

---

## Prompt Engineering Notes

The system prompt for the conversation agent is the SINGLE most important technical artifact. Before writing it (Phase 2.1), use `/brainstorming` to explore:

1. **Tone calibration** — How warm vs. professional? How many emojis (if any)?
2. **Question pacing** — When to use chips vs. free text? How often summary checkpoints?
3. **Inference aggressiveness** — How much to infer from a single answer? When to confirm?
4. **Skill matching timing** — When during conversation to call `match_skills`? How to present results naturally?
5. **Phase transition triggers** — What makes the AI decide to move forward?
6. **Edge cases** — What if user gives one-word answers? What if they're an expert in 5 domains?

This prompt will be iterated heavily. Start with a working version, then refine based on actual conversation quality.
