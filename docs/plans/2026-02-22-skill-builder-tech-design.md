# Skill Builder — Technical Design Document

**Date:** 2026-02-22
**Status:** Draft v2 — Web-first
**Author:** Raj Varsani + Claude

---

## Overview

A web platform with an agentic backend that orchestrates a conversation to generate personal identity skills. Users chat through a browser, their professional identity materializes in real-time on screen, and the output is an installable Agent Skills package published to GitHub and available via `npx skills add`.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│                    (Next.js App)                          │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Chat Panel   │  │ Identity Card │  │ Publish Flow   │  │
│  │ (streaming)  │  │ (real-time)   │  │ (GitHub API)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                     API Layer                            │
│              (Node.js Backend)                           │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Conversation │  │ Artifact     │  │ Skill          │  │
│  │ Agent        │  │ Analyzer     │  │ Generator      │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                   External Services                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  │
│  │ Claude   │  │ GitHub   │  │ Auth   │  │ Database  │  │
│  │ API      │  │ API      │  │ (OAuth)│  │ (state)   │  │
│  └──────────┘  └──────────┘  └────────┘  └───────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Next.js** (React) — app router, server components where useful
- **TypeScript** — throughout
- **Tailwind CSS** — styling
- **Framer Motion** — identity card animations, phase transitions
- Streaming chat UI (SSE from backend)

### Backend (Separate Node.js Service)
- **Node.js** with **Express** or **Hono**
- **TypeScript** — throughout
- **Anthropic SDK** — Claude API for the agentic conversation
- Custom agent orchestration layer (not a thin wrapper — manages phases, state, domain hints)

### Database
- **PostgreSQL** — conversation state, user profiles, published skills
- Tables: users, conversations, conversation_messages, published_skills

### Auth
- **Google OAuth** — primary sign-in
- **GitHub OAuth** — optional, for personal repo publishing
- Session management via JWT or server-side sessions

### Infrastructure
- Frontend: Vercel (natural fit for Next.js)
- Backend: Railway / Fly.io / AWS (separate service)
- Database: Managed Postgres (Supabase / Neon / Railway)
- File storage: GitHub repos (for published skills)

---

## Agentic Backend Design

The backend is the brain. It's not a passthrough to Claude — it's an **agent orchestrator** that manages conversation state, loads context dynamically, and drives the 4-phase flow.

### Agent Architecture

```
ConversationAgent
├── PhaseManager         — tracks current phase, handles transitions
├── DomainHintLoader     — loads relevant hints based on selected domains
├── IdentityModelBuilder — maintains the evolving identity model
├── ArtifactAnalyzer     — analyzes GitHub repos, URLs, uploaded content
├── SkillGenerator       — generates the final skill package
└── PublishManager       — handles GitHub repo creation + publishing
```

### Phase Management

The agent tracks which phase the conversation is in and adjusts its behavior:

```typescript
type Phase =
  | { type: 'domain_discovery' }
  | { type: 'deep_discovery'; domains: string[]; questionCount: number }
  | { type: 'artifact_collection'; pendingArtifacts: string[] }
  | { type: 'skill_assembly'; subStep: 'proposal' | 'roleplay' | 'publish' }
```

Phase transitions are determined by the AI based on conversation completeness — not hardcoded message counts. The system prompt includes transition criteria:

- **Domain Discovery → Deep Discovery:** User has selected at least one domain
- **Deep Discovery → Artifact Collection:** AI has explored all selected domains with sufficient depth (typically 15-25 questions) and the user has confirmed at least one summary
- **Artifact Collection → Skill Assembly:** AI has analyzed submitted artifacts OR user indicates no artifacts to share
- **Skill Assembly (proposal → roleplay):** User has confirmed the sub-skill list
- **Skill Assembly (roleplay → publish):** User confirms the roleplay feels accurate

### Identity Model

The backend maintains a structured identity model that updates as the conversation progresses. This model drives the identity card on the frontend.

```typescript
interface IdentityModel {
  // Basic info (from auth)
  name: string
  avatar?: string

  // Phase 1
  domains: string[]

  // Phase 2 (evolves during conversation)
  personality: {
    traits: Array<{ label: string; confidence: 'low' | 'medium' | 'high'; source: 'inferred' | 'confirmed' }>
    values: Array<{ label: string; priority: number }>
    riskTolerance?: string
    conflictStyle?: string
  }
  communication: {
    tone?: string
    formality?: string
    feedbackStyle?: string
    vocabularyPatterns?: string[]
  }
  decisionPatterns: {
    defaultHeuristic?: string
    consistentlyRejects?: string[]
    consistentlyPrioritizes?: string[]
  }

  // Phase 2-3 (domains filled progressively)
  expertise: Array<{
    domain: string
    depth: 'beginner' | 'proficient' | 'advanced' | 'expert'
    subSkills: string[]
    tools: string[]
    opinions: string[]
  }>

  // Phase 3
  artifacts: Array<{
    type: 'github_repo' | 'github_pr' | 'url' | 'upload' | 'text'
    source: string
    insights: string[]
  }>

  // Phase 4
  subSkills: {
    overrides: Array<{ baseSkilName: string; customizations: string[] }>
    custom: Array<{ name: string; description: string; content?: string }>
  }
}
```

The identity model is:
1. Stored in the database (persisted across sessions)
2. Sent to the frontend via SSE for real-time identity card updates
3. Included in the AI's system prompt context so it knows what it's already learned
4. Used as input for skill generation

### How the AI Conversation Works

Each user message triggers:

1. **Load context:** Current identity model + conversation history + phase-appropriate system prompt + domain hints
2. **Call Claude API** with streaming enabled
3. **Parse AI response** for:
   - Text reply (streamed to frontend chat)
   - Identity model updates (structured data extracted from the AI's response)
   - Phase transition signals
4. **Update identity model** in database
5. **Push identity card update** to frontend via SSE

The system prompt is **dynamically assembled** based on the current phase:

```
[Base system prompt — personality, tone, constraints]
+
[Phase-specific instructions — what to explore, when to transition]
+
[Domain hints — loaded for selected domains]
+
[Current identity model — what's been learned so far]
+
[Conversation history — recent messages for continuity]
```

### Domain Hint System

Domain hints are stored as structured data (not markdown files, since this is a backend, not a Claude Code skill). They tell the AI what to explore for each domain.

```typescript
interface DomainHint {
  domain: string
  areasToExplore: string[]
  signalToExtract: string[]
  artifactsToRequest: string[]
  personalityInferencePoints: string[]
}
```

Hints for common domains (engineering, design, product, data, general) are pre-defined. For custom/niche domains, the AI improvises using the general hints as a base.

The hints are **directional, not prescriptive** — they tell the AI "explore architecture philosophy" not "ask: do you prefer monolith or microservice?"

### Artifact Analysis

When a user shares an artifact, the backend:

**GitHub repos:**
1. Uses GitHub API to fetch repo structure, README, package.json/config files, sample source files
2. Sends relevant file contents to Claude for analysis
3. Extracts: language/framework choices, project structure patterns, naming conventions, dependency choices, architecture patterns
4. Cross-references with existing identity model

**GitHub PRs / code reviews:**
1. Uses GitHub API to fetch PR descriptions, review comments
2. Analyzes feedback tone, focus areas, approval patterns
3. Extracts communication style signal

**URLs (blog posts, portfolios, docs):**
1. Fetches page content
2. Sends to Claude for analysis
3. Extracts: voice, opinion strength, teaching style, expertise depth

**Uploaded files:**
1. Stores temporarily
2. Sends content to Claude for analysis
3. Extracts domain-specific signal

### Skill Generation

When the user confirms sub-skills and passes roleplay validation:

1. **Assemble the SKILL.md** from the identity model using the persona template
2. **Generate override files** for each existing skill with user preferences
3. **Generate custom skill files** for each novel sub-skill
4. **Generate example files** from conversation excerpts and roleplay responses
5. **Package** into the Agent Skills directory structure

The generated structure:

```
acting-as-{username}/
├── SKILL.md                          # Identity core
├── references/
│   ├── overrides/
│   │   ├── {existing-skill-1}.md     # Existing skill + user preferences
│   │   └── ...
│   ├── custom/
│   │   ├── {custom-skill-1}.md       # Novel skill from conversation
│   │   └── ...
│   └── examples/
│       ├── decisions.md              # Decision-making traces
│       ├── communication.md          # Voice/tone examples
│       └── reviews.md               # Feedback examples
```

### Publishing Flow

**Option A: Platform org (default)**
1. Backend creates repo in platform's GitHub org via GitHub App/Bot
2. Commits all skill files
3. Returns install command: `npx skills add skillbuilder-community/acting-as-{username}`

**Option B: Personal repo**
1. User's GitHub OAuth token used to create repo in their account
2. Commits all skill files
3. Returns install command: `npx skills add {username}/acting-as-{username}`

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  github_access_token TEXT, -- encrypted, nullable
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations (one active per user, persisted for resume)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  phase TEXT NOT NULL DEFAULT 'domain_discovery',
  identity_model JSONB NOT NULL DEFAULT '{}',
  domain_hints JSONB, -- loaded hints for selected domains
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation Messages
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  identity_model_delta JSONB, -- what changed in the identity model after this message
  phase TEXT NOT NULL, -- which phase this message was in
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Published Skills
CREATE TABLE published_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  skill_name TEXT NOT NULL, -- acting-as-{username}
  github_repo_url TEXT NOT NULL,
  github_repo_owner TEXT NOT NULL, -- platform org or personal
  install_command TEXT NOT NULL,
  identity_model JSONB NOT NULL, -- snapshot at publish time
  skill_files JSONB NOT NULL, -- generated file contents
  published_at TIMESTAMPTZ DEFAULT now()
);

-- Artifacts
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  type TEXT NOT NULL, -- 'github_repo' | 'github_pr' | 'url' | 'upload' | 'text'
  source TEXT NOT NULL, -- URL or file reference
  analysis JSONB, -- extracted insights
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

### Auth
```
POST /auth/google          — Google OAuth callback
POST /auth/github          — GitHub OAuth callback
POST /auth/github/connect  — Connect GitHub to existing account (for publishing)
GET  /auth/me              — Get current user
POST /auth/logout          — Logout
```

### Conversation
```
POST /conversations                — Start new conversation
GET  /conversations/active         — Get active conversation (resume)
POST /conversations/:id/messages   — Send message (returns SSE stream)
GET  /conversations/:id/identity   — Get current identity model
GET  /conversations/:id/messages   — Get conversation history
```

### Artifacts
```
POST /conversations/:id/artifacts       — Submit artifact (URL or upload)
GET  /conversations/:id/artifacts       — List artifacts
GET  /conversations/:id/artifacts/:aid  — Get artifact analysis
```

### Skills
```
POST /conversations/:id/publish   — Generate and publish skill
GET  /skills/:id                  — Get published skill details
GET  /skills/:id/files            — Get generated skill files
GET  /users/:username/skill       — Public profile / skill page
```

### SSE Stream (on POST /conversations/:id/messages)
```
event: message_chunk    — streaming AI text response
event: identity_update  — identity model changed (update the card)
event: phase_change     — conversation moved to a new phase
event: artifact_request — AI is requesting a specific artifact type
event: done             — response complete
```

---

## Real-Time Identity Card Updates

The identity card on the frontend receives structured updates via SSE. Each update targets a specific section of the card:

```typescript
type IdentityUpdate =
  | { type: 'personality_trait_added'; trait: { label: string; confidence: string } }
  | { type: 'personality_trait_confirmed'; traitLabel: string }
  | { type: 'domain_added'; domain: { name: string; depth: string } }
  | { type: 'communication_updated'; field: string; value: string }
  | { type: 'decision_pattern_added'; pattern: { type: string; value: string } }
  | { type: 'sub_skill_proposed'; skill: { name: string; type: 'override' | 'custom' } }
  | { type: 'sub_skill_confirmed'; skillName: string }
  | { type: 'artifact_insight'; insight: string }
  | { type: 'full_model_sync'; model: IdentityModel }
```

Frontend handles each update type with appropriate animation:
- `personality_trait_added` → new chip fades + slides in
- `personality_trait_confirmed` → chip goes from dashed/transparent to solid
- `domain_added` → new badge appears with depth bar
- `artifact_insight` → "verified" indicator appears on related items

---

## Domain Hints (Backend Data)

Pre-defined for common domains. These are loaded into the AI's system prompt when the user selects domains.

### Engineering Hints
```
Areas to explore:
- Primary language(s) and why they prefer them
- Framework opinions (not just what — WHY)
- Architecture philosophy: monolith vs microservice, modular vs flat
- Testing philosophy: TDD? Integration-first? What they skip and why
- Code review style: what they look for, what they ignore, how they give feedback
- DevOps opinions: CI/CD, deployment, monitoring
- Technical debt tolerance: when they accept it, when they refuse
- Naming conventions and code organization patterns

Signal to extract:
- Decision heuristics ("I always X because Y")
- Strong opinions ("I think X is harmful because...")
- Tradeoff patterns ("I'd choose X over Y when...")
- Anti-patterns they reject ("I never do X because...")

Artifacts to request:
- GitHub repos they're proud of (architecture signal)
- Code reviews they've written (feedback style)
- Technical blog posts or docs (communication signal)
```

### Design Hints
```
Areas to explore:
- Primary discipline: UI, UX, motion, brand, product design
- Tools: Figma, Sketch, Framer, prototyping tools
- Process: wireframe-first, prototype-first, code-first
- Design system opinions: atomic design, tokens, component libraries
- Accessibility stance: compliance-driven or values-driven
- Handoff process: how they work with engineers
- Visual style: minimalist, bold, playful, corporate
- Typography and spacing sensibilities

Signal to extract:
- Aesthetic judgment patterns ("Good design is...")
- Process preferences ("I always start with...")
- Collaboration style with engineers
- What they consider non-negotiable

Artifacts to request:
- Portfolio pieces or case studies
- Figma files showing component organization
- Before/after redesigns they led
```

### Product Hints
```
Areas to explore:
- Prioritization framework: RICE, ICE, gut, data-driven
- How they write specs/PRDs: structure, depth, audience
- Stakeholder management style
- Metrics philosophy: north star, leading/lagging indicators
- Feature scoping: how they say no, how they cut scope
- User research approach: qualitative vs quantitative lean
- Roadmap philosophy: fixed vs flexible, time-based vs outcome-based

Signal to extract:
- Prioritization heuristics
- Communication style with engineers vs leadership
- How they handle competing priorities
- What makes a "good" product decision in their view

Artifacts to request:
- PRDs or specs they've written
- Roadmap examples
- Strategy documents
```

### General Hints (always loaded)
```
Personality & communication:
- Communication style: direct vs diplomatic, concise vs detailed
- How they handle disagreements or pushback
- Decision-making speed: deliberate vs fast
- Risk tolerance: conservative vs experimental
- Values hierarchy: quality vs speed vs learning vs impact

Working style:
- How they approach new problems
- Collaboration preferences: async vs sync, solo vs pair
- How they handle being wrong or making mistakes

Meta-observation (infer from HOW they answer):
- Sentence structure and length (thinking style)
- Vocabulary complexity (communication preference)
- Use of qualifiers ("maybe", "probably" vs definitive)
- Whether they think in systems, narratives, or data
```

---

## Skill Output Format

Identical to the original design — the output is a standard Agent Skills package:

### Generated SKILL.md
```markdown
---
name: acting-as-{username}
description: >
  Embodies {name}'s professional identity as a {role}.
  Captures their {domains} expertise, {communication_style}
  communication style, and {decision_style} decision-making.
  Use when you want responses reflecting {name}'s perspective.
---

# Identity: {name}

## Role & Context
{2-3 sentences about who they are professionally}

## Personality Profile
- **Core values**: {ordered values}
- **Risk tolerance**: {description}
- **Conflict style**: {description}

## Communication Style
- **Tone**: {description}
- **Formality**: {spectrum position}
- **Feedback style**: {description}
- **Vocabulary patterns**: {phrases, jargon}

## Decision-Making Patterns
- **Default heuristic**: {go-to when uncertain}
- **Consistently rejects**: {patterns}
- **Consistently prioritizes**: {patterns}

## Sub-Skills

### Existing Skills (with preferences)
{overrides with pointers to reference files}

### Custom Skills
{custom skills with pointers to reference files}

## Guardrails
- Covers: {scope}
- Does NOT cover: {boundaries}
```

### Override files (references/overrides/)
```markdown
# {Skill Name} — {username}'s Style

## Base Skill
Builds on the `{base-skill}` skill with these preferences.

## Preferences
{specific customizations}

## Examples
{characteristic examples}
```

### Custom skill files (references/custom/)
```markdown
# {Skill Name}

## What This Covers
{scope}

## Core Principles
- {principle with causal rationale}

## Preferred Patterns
{patterns with reasoning}

## Anti-Patterns
{what to avoid and why}

## Decision Heuristics
{if-then rules}

## Examples
{input/output examples}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| User closes browser mid-conversation | Conversation persisted in DB, resumes on return |
| User gives very short answers | AI adapts to ask more specific/multiple-choice questions |
| GitHub API rate limit during artifact analysis | Queue analysis, retry with backoff, inform user |
| User has no artifacts to share | Skip Phase 3, work from conversation signal only |
| Roleplay test reveals major gaps | Agent loops back to Phase 2 for targeted questions |
| User disagrees with inferred personality | Identity model updated immediately, AI asks clarifying questions |
| Custom domain with no predefined hints | Use general hints + AI improvises based on domain name |
| Claude API error during conversation | Retry with exponential backoff, show error state in UI |
| GitHub publish fails | Retry, or offer file download as fallback |
| Very long conversation (context limits) | Summarize older messages, keep recent + identity model in context |

---

## Implementation Plan

### Phase 1: Foundation
1. Project setup: Next.js frontend + Node.js backend monorepo
2. Database schema + migrations (Postgres)
3. Auth: Google OAuth + GitHub OAuth
4. Basic chat UI with streaming (no identity card yet)
5. Basic Claude API integration — conversation works end-to-end

### Phase 2: Agent Core
6. Phase management system in backend
7. Domain hint loader
8. Identity model builder (structured extraction from AI responses)
9. SSE streaming for identity updates
10. Identity card component (frontend) with animations

### Phase 3: Artifacts & Skills
11. Artifact submission (URL, upload, text)
12. GitHub API integration for repo/PR analysis
13. Skill generation from identity model + templates
14. Sub-skill proposal UI

### Phase 4: Validation & Publishing
15. Roleplay mode (distinct UI + agent behavior)
16. GitHub publishing (platform org + personal)
17. Install command generation
18. Public profile page

### Phase 5: Polish
19. Landing page
20. Animations and transitions (Framer Motion)
21. Error handling and edge cases
22. Mobile responsiveness
23. Performance optimization

---

## Dependencies

| Dependency | Purpose | Required? |
|------------|---------|-----------|
| Claude API (Anthropic SDK) | Powers all AI conversation | Yes |
| GitHub API / Octokit | Repo analysis + publishing | Yes |
| Google OAuth | Primary authentication | Yes |
| PostgreSQL | Conversation + user state | Yes |
| Vercel | Frontend hosting | Recommended |
| Node.js runtime | Backend service | Yes |
