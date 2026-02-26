# Skill Builder — Product Requirements Document

**Date:** 2026-02-22
**Status:** Draft v2 — Web-first
**Author:** Raj Varsani + Claude

---

## Problem

AI coding agents are powerful but generic. They don't know how *you* think, what you value, how you make decisions, or what patterns you follow. There's no way to capture a person's professional identity — their expertise, personality, opinions, and working style — in a portable, installable format that makes an AI agent act *as them*.

## Solution

A web platform that feels magical. Through an agentic conversation, it deeply interviews a user across their professional domains, analyzes their real work artifacts, and generates a personal identity skill — installable via `npx skills add` — that makes Claude (or any compatible agent) think and work like them.

The core experience: you chat on the left, your digital identity materializes on the right. Personality traits appear. Skill badges form. Your professional self takes shape in real-time.

## Target Users

**Primary: Any professional** who wants to encode their expertise into an AI skill.
- Engineers (FE, BE, fullstack, infra, ML)
- Designers (UI, UX, motion, brand)
- Product managers
- Data scientists / analysts
- Anyone with domain expertise

**Secondary: Teams** who want to install a colleague's skill to get AI guidance aligned with that person's thinking.

## User Stories

1. **As an engineer**, I want to create a skill that captures my coding patterns, architecture opinions, and review style so that when others install it, they get code written the way I would write it.

2. **As a designer**, I want to capture my design sensibility, tool preferences, and feedback style so that AI-generated UI work follows my aesthetic and process.

3. **As a team lead**, I want my team to install my skill so the AI gives guidance aligned with how I'd approach problems — even when I'm not available.

4. **As a developer**, I want to install a senior engineer's skill so I can learn from their decision-making patterns while I code.

5. **As a non-technical professional**, I want to go to a website, have a conversation, and get an installable skill — no CLI knowledge needed.

---

## Authentication

### Sign-In Options
- **Google** — lowest friction, works for everyone
- **GitHub** — for users who want to publish to their own repo

### Publishing Auth
At publish time, two paths:
1. **Platform repo (default):** Skill is published to the platform's GitHub org (e.g., `skillbuilder-community/acting-as-raj`). No GitHub auth needed — Google login is sufficient. Platform handles the GitHub side.
2. **Personal repo:** User connects their GitHub account and the skill is published to their own repo (e.g., `rajvarsani/acting-as-raj`). Requires GitHub OAuth.

This means **zero GitHub friction** for most users. Sign in with Google, chat, publish. Done.

---

## User Flow

### Overview

```
Landing → Sign In → Domain Selection → Deep Conversation → Artifact Analysis → Skill Assembly → Publish
                       (Phase 1)          (Phase 2)            (Phase 3)          (Phase 4)
```

### Landing Page

- Hero: clear value prop — "Create your digital professional identity"
- Show what a generated skill looks like (preview)
- Show install command and how it works
- CTA: "Build Your Skill" → sign in

### Phase 1: Domain Discovery

**What happens:**
- User lands on the builder interface after signing in
- Split layout: chat on the left, empty identity card on the right
- AI greets the user and explains what's about to happen
- Presents multi-select domain options:
  - Engineering
  - Design
  - Product
  - Data / Analytics
  - Marketing
  - Operations
  - (User can type custom domains)
- User selects one or more domains
- AI confirms and sets expectations: "This will take about 15-20 minutes. Let's start."

**Design notes:**
- Multi-select chips/pills for domains — tactile, satisfying to tap
- Each domain has a distinct icon
- Custom domain input with autocomplete suggestions
- The identity card on the right starts empty/skeletal — just the user's name/avatar from auth
- Subtle animation: the card "wakes up" when domains are selected — first sections start to form

### Phase 2: Deep Conversational Discovery

**What happens:**
- AI asks questions one at a time, going deep before moving to the next topic
- Questions are agentic — driven by domain hints, not hardcoded
- Periodic summaries reflected back to the user

**Question layers (AI moves through these organically):**

| Layer | Focus | Example Questions |
|-------|-------|-------------------|
| Context | Who they are professionally | "What's your current role? What takes up most of your time?" |
| Domain depth | Technical expertise per domain | "Walk me through how you'd structure a new React app from scratch" |
| Opinions & tradeoffs | How they make decisions | "Monolith or microservices for a 5-person team — what's your take?" |
| Anti-patterns | What they reject | "What's a common practice in your field that you think is actually harmful?" |
| Communication | How they express themselves | Inferred from conversation, validated explicitly |

**The magic — the identity card evolves in real-time:**

As the AI learns, the right-side identity card updates live:
- **Personality traits** appear as tags/chips (e.g., "Pragmatic", "Direct communicator", "Simplicity-first")
- **Domain badges** form with depth indicators
- **Decision patterns** get listed as short heuristics
- **Communication style** section fills in
- Items animate in smoothly — feels like the AI is "discovering" the user
- User can see themselves being defined — this is the magical moment

**Periodic summaries:**
AI pauses and reflects back:
> "Here's what I'm picking up so far: You're a pragmatic fullstack engineer who leans toward simplicity. You prefer React + TypeScript, think most state management is overkill, and value shipping speed over perfection. Does this resonate?"

When a summary is confirmed, the identity card updates with a satisfying animation — traits lock in, opacity goes full.

**Design notes:**
- Chat interface: clean, focused, one question at a time
- Identity card: the hero. Skeleton → filling in → complete. Each new discovery animates in.
- Traits should feel like they're being "uncovered" not "generated"
- Summary moments: special card in the chat + corresponding update on the identity card
- No explicit progress bar — the identity card IS the progress indicator (how filled it is)
- Mobile: identity card could be a collapsible panel or a tab view

### Phase 3: Artifact Collection & Analysis

**What happens:**
- AI makes targeted artifact requests based on Phase 2 discoveries
- Requests are specific: "You mentioned you have strong opinions about API design — got a repo I can look at?"

**Supported artifact types:**

| Domain | Artifacts |
|--------|-----------|
| Engineering | GitHub repos, PRs, code review comments, technical blog posts |
| Design | Figma links, portfolio links, screenshots, images |
| Product | PRDs, roadmap docs, strategy documents |
| General | Blog posts, Twitter/X threads, talks/presentations |

**Input methods:**
- Paste a URL (GitHub, Figma, portfolio, etc.)
- Upload a file (images, PDFs, docs)
- Paste text directly

**After analysis, AI surfaces findings:**
> "From your repo I noticed you consistently use barrel exports, prefer co-located test files, and have a custom ESLint config that enforces early returns. I also noticed you write very detailed PR descriptions. Adding all this to your profile."

**Identity card updates:** New discoveries from artifacts animate into the card. Artifact-sourced traits could have a subtle "verified" indicator (came from real work, not just self-reported).

**Design notes:**
- Clean drag-and-drop / paste area for artifacts
- Analysis loading state — show what the AI is reading (file names scrolling, repo structure appearing)
- Findings cards with confirm/reject actions
- "Verified" badge on identity card items that came from artifact analysis (builds trust)

### Phase 4: Skill Assembly & Validation

**Step 4a — Sub-skill proposal:**

AI presents the proposed skill breakdown:

**Existing skills (from skills.sh, with user's preferences):**
- Listed as cards with the base skill name + customization summary
- e.g., "code-review — Your style: direct, architecture-focused, approve-fast"

**Custom skills (generated from conversation):**
- Listed as cards with name + description
- e.g., "react-architecture — Your component patterns, state opinions, file structure"

User can: add, remove, rename, or request more exploration on any skill.

**Identity card:** Sub-skills section fills in. Each skill is a distinct badge/card within the identity.

**Step 4b — Live roleplay test:**

The critical, magical moment. The interface shifts:
- Chat area changes to "roleplay mode" — visually distinct (different background, border, or chat bubble style)
- AI announces: "I'm going to respond as your skill now. Throw scenarios at me."
- User tests with real scenarios
- Every correction feeds back into the skill
- Identity card items that get corrected pulse/update in real-time

**Step 4c — Publish:**

- AI generates the complete skill package
- Shows a preview of the generated skill (formatted, readable)
- Publishing options:
  - **"Publish to Skill Builder"** (default) — publishes to platform org, zero friction
  - **"Publish to my GitHub"** — requires GitHub connection, publishes to personal repo
- After publishing: shows the install command with a copy button
  ```
  npx skills add skillbuilder-community/acting-as-raj
  ```
- Celebration moment — confetti, "Your digital identity is live" message
- Share buttons (Twitter/X, LinkedIn, copy link)

**Design notes:**
- Sub-skill cards: draggable to reorder priority, swipe to remove
- Roleplay mode: distinctly different visual treatment — the user should FEEL the mode switch
- Publish flow: 2 clicks maximum. Pick destination → publish → done.
- Install command: massive, centered, one-click copy
- Celebration: make it feel like an achievement, not a form submission

---

## Key Screens (for designer)

1. **Landing page** — value prop, preview of what you get, CTA
2. **Builder: domain selection** — multi-select chips + empty identity card
3. **Builder: conversation** — chat left, evolving identity card right
4. **Builder: artifact input** — chat + drag-drop/URL input + analysis loading
5. **Builder: sub-skill proposal** — skill cards with edit/remove + identity card complete
6. **Builder: roleplay test** — distinct chat mode + live-updating identity card
7. **Builder: publish** — preview + publish options + install command + celebration
8. **Profile page** — public page showing the user's published skill (shareable)

---

## The Identity Card (Core UI Component)

This is the most important UI element in the entire product. It's the magic.

**Structure:**
```
┌─────────────────────────────────┐
│  [Avatar]  Name                 │
│            Role/Title           │
│                                 │
│  ── Personality ──              │
│  [Pragmatic] [Direct] [Fast]   │
│  [Simplicity-first]            │
│                                 │
│  ── Communication ──            │
│  Tone: Direct but warm          │
│  Feedback: Specific, actionable │
│                                 │
│  ── Decision Patterns ──        │
│  • Default: Choose simplicity   │
│  • Rejects: Over-engineering    │
│  • Prioritizes: Ship speed      │
│                                 │
│  ── Skills ──                   │
│  [React Arch ████] [API ███]   │
│  [Code Review ████] [Git ██]   │
│                                 │
│  ── Guardrails ──               │
│  Covers: FE, API, Code Review   │
│  Won't: DevOps, ML, Mobile     │
└─────────────────────────────────┘
```

**Behavior:**
- Starts empty/skeletal (just name + avatar from auth)
- Sections appear as the AI discovers them
- Items animate in smoothly (fade + slide)
- Unconfirmed items: slightly transparent / dashed border
- Confirmed items (after summary): full opacity / solid
- Artifact-verified items: small "verified" indicator
- The card itself is the progress indicator — user watches themselves materialize

---

## Scope

### In Scope (v1)
- Web application with conversational builder UI
- Split-pane layout: chat + evolving identity card
- Google + GitHub authentication
- Full 4-phase agentic conversation flow
- Multi-domain support (user selects 1+)
- Agentic backend with domain hints (not hardcoded questions)
- Artifact analysis: GitHub repos, URLs, uploaded files, pasted text
- Skill generation in Agent Skills format (SKILL.md + references/)
- Existing skill overrides (from skills.sh) + custom skill generation
- Live roleplay validation
- Dual publishing: platform org repo OR personal GitHub repo
- Install command generation (`npx skills add`)
- Conversation persistence (resume if you leave)
- Public profile page for published skills

### Out of Scope (v1)
- Skill versioning / update flow (regenerate from scratch for now)
- Team-based skills (combining multiple people's skills)
- Deep Figma analysis (links stored, not parsed)
- Video/audio analysis
- Skill marketplace / discovery within the platform
- Analytics on skill usage
- Mobile app

### Future Considerations (v2+)
- Skill evolution: re-run specific phases to update your skill
- Skill composition: "Use Raj's frontend skills but Sarah's API design"
- Team skills: merge multiple personas into a team standard
- Skill marketplace with search/browse/trending
- Figma API integration for deep design analysis
- Mobile-optimized experience

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Completion rate | >60% of users who start the conversation finish and publish |
| Roleplay accuracy | User confirms "that's me" within 5 correction rounds |
| Install adoption | >20% of published skills get installed by at least 1 other person |
| Time to complete | 15-25 minutes for the full flow |
| Sub-skill count | Average 4-8 sub-skills per persona |
| Return rate | >30% of users come back to view/share their profile |

---

## Open Questions

1. **Skill updates:** How does a user update their skill as they evolve? v1: regenerate. v2: incremental?
2. **Privacy:** Some personality/opinion data is sensitive. Should skills have private sections?
3. **Profile page:** How much of the identity card is publicly visible vs. what's in the installable skill?
4. **Platform name:** What's the product called? skill-builder? buildme? something else?
5. **Conversation save/resume:** How long do we persist incomplete conversations?
6. **Rate limiting:** How often can a user regenerate their skill? (AI costs)
