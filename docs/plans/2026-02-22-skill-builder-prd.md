# Skill Builder — Product Requirements Document

**Date:** 2026-02-22 | **Updated:** 2026-02-27
**Status:** v3 — Building Blocks
**Author:** Raj Varsani + Claude

---

## Problem

AI coding agents are powerful but generic. They don't know how *you* think, what you value, how you make decisions, or what patterns you follow. There's no way to capture a person's professional identity — their expertise, personality, opinions, and working style — in a portable, installable format that makes an AI agent act *as them*.

## Solution

A web platform that feels magical. Through a rapid, delightful conversation (3-4 minutes), the AI interviews a professional using quick-tap questions, infers their identity aggressively, and assembles a visual "character card" in real-time — block by block. The output is an installable persona skill via `npx skills add`.

**The core experience:** You tap quick-reply chips on the left. Identity blocks materialize on the right. Your professional self assembles like building blocks — each answer snaps a new piece into place. The card is the hero, not the chat.

**Design philosophy: Building Blocks.** Every answer = a block. Every block = a visual element on the card. The user watches their identity assemble piece by piece, like a character being created in a game.

## Target Users

**Primary: Any professional** who wants to encode their expertise into an AI skill.
- Engineers, designers, product managers, data scientists, marketers, ops — anyone with domain expertise

**Secondary: Teams** who want to install a colleague's skill to get AI guidance aligned with that person's thinking.

## User Stories

1. **As an engineer**, I want to spend 3 minutes tapping through quick questions and get a skill that captures my coding patterns, architecture opinions, and review style.

2. **As a designer**, I want to watch my design sensibility materialize as a collectible card while I answer questions about my process.

3. **As a non-technical professional**, I want to tap through a quick conversation and get an installable skill — no typing essays, no CLI knowledge needed.

4. **As a team lead**, I want my team to install my skill so the AI gives guidance aligned with how I'd approach problems.

---

## Authentication

### Sign-In Options
- **Google** — lowest friction, works for everyone
- **GitHub** — for users who want to publish to their own repo

### Publishing Auth
At publish time, two paths:
1. **Platform repo (default):** Published to the platform's GitHub org. No GitHub auth needed.
2. **Personal repo:** User connects GitHub, skill published to their own repo.

Zero GitHub friction for most users. Sign in with Google, chat, publish. Done.

---

## User Flow

### Overview

```
Landing → Sign In → Domain Selection → Rapid Profiling → Review & Publish
                       (30 seconds)     (2-3 minutes)     (30 seconds)
```

**Total: ~3-4 minutes.** Not 15-25 minutes. Speed is a feature.

### Landing Page

- Hero: "Make AI Think Like You"
- Show a completed identity card (the gradient collectible card) as the hero visual
- Show the install command
- CTA: "Build Your Skill →"

### Phase 1: Domain Selection (30 seconds)

**What happens:**
- Split layout: chat on the left, empty identity card on the right
- AI sends a warm one-line greeting + multi-select domain chips
- User taps 1-3 domains
- AI immediately infers 2-3 "quick roll" blocks from domains alone (e.g., Engineering → "Systems Thinker", "Ship-oriented")
- These tentative blocks materialize on the card instantly — the magic starts immediately

**The "Quick Roll" — key UX innovation:**
After domain selection, the AI pre-infers initial blocks and presents them as tentative. The user confirms or adjusts with single taps. This saves 2-3 questions and creates an instant "wow" moment — the card starts filling before the first real question.

**Design notes:**
- Multi-select chips for domains — tactile, satisfying to tap
- Identity card starts at ~15% (endowed progress, not 0% — creates momentum)
- Card gradient is muted/dormant, wakes up when domains are selected
- Quick-roll blocks appear with "materializing" animation (faded, dashed border)

### Phase 2: Rapid Profiling (2-3 minutes, 8-12 questions)

**What happens:**
- AI asks ONE focused question at a time
- Most questions offer **quick-reply chips** (tap, don't type)
- Every answer emits 1-3 identity blocks that animate onto the card
- AI infers aggressively from short answers — user confirms, not explains

**Question types and pacing:**

| Round | Questions | Type | Purpose |
|-------|-----------|------|---------|
| 1 | 4-5 | Quick-tap chips | "Who are you" — seniority, approach, core value, communication style |
| 2 | 2-3 | Inference confirm + 1 free text | AI reflects back inferences, asks for strongest opinion |
| 3 | 2-3 | Scenario chips | Decision patterns — "tight deadline, you would..." |

**Time per question type:**
- Chip tap: 5-8 seconds
- Confirm/deny: 3-5 seconds
- Free text: 20-45 seconds (use sparingly — max 1-2)
- Summary checkpoint: 10-15 seconds

**The building blocks moment:**
Each answer triggers identity blocks materializing on the card. The user literally watches themselves being assembled. Blocks start as faded/dashed (tentative), then lock in as solid (confirmed) after summaries. The gradient on the card intensifies as completion rises.

**Inference-then-confirm pattern (the power move):**
User gives one broad answer → AI infers 3-5 traits → user confirms with a single tap. One answer generates 2-3x the information without extra effort. This is how you build a rich profile in 3 minutes.

**Summary checkpoints (every 4-5 blocks):**
AI reflects back: "I'm seeing you as a pragmatic senior engineer who values simplicity and ships fast. Ring true?" User taps [Spot on!] or [Close, but...]. Confirmed blocks solidify on the card with a satisfying animation.

**Design notes:**
- Quick-reply chips: 3-5 per question, horizontal row, pill-shaped, one always slightly playful
- One question at a time — clean, focused, no walls of text
- AI messages are SHORT (1-3 sentences max)
- No explicit progress bar — the card IS the progress indicator
- Blocks stagger in with 400ms delay between each — creates "discovery" feel

### Phase 3: Review & Publish (30 seconds)

**What happens:**
- AI presents a 2-3 sentence summary of the complete identity
- User confirms or makes final adjustments (1 tap or 1 correction)
- All blocks lock in with satisfying confirmation animation
- Skill generation happens instantly (pre-generated during conversation)
- Install command appears with copy button
- Celebration: the card reaches full luminous glow — no confetti, no modals. The beautiful finished card IS the celebration.

**Publishing options:**
- "Publish to Skill Builder" (default) — zero friction
- "Publish to my GitHub" — requires GitHub connection

**Design notes:**
- Install command: massive, centered, one-click copy
- Share buttons: X, LinkedIn, copy link
- The card at 100% = full gradient vibrancy, all blocks confirmed
- Feels like an achievement, not a form submission

---

## The Identity Card (Core UI Component)

**This is the most important element in the entire product.** It's a gamified collectible character card, not a resume.

**Structure:**
```
┌─────────────────────────────────┐
│  ┌──────┐                       │
│  │Avatar│  Name                  │
│  └──────┘  Role                  │
│                                  │
│         ╔══ 65% ══╗              │
│                                  │
│  [Pragmatic] [Direct] [Fast]    │
│  [Simplicity-first]             │
│                                  │
│  React Arch  ████████░░  Expert  │
│  API Design  ██████░░░░  Senior  │
│  Code Review ████████░░  Expert  │
│                                  │
│  12 blocks discovered            │
└─────────────────────────────────┘
```

**Block visual lifecycle:**
```
empty → materializing → tentative → confirmed
         (fade+scale    (dashed,     (solid,
          from below)    60% opacity)  full glow)
```

**Gradient intensification = progress:**
- 0%: Muted/grayscale gradient — dormant
- 25%: Faint warm color emerging
- 50%: Soft gradient visible
- 75%: Rich and vibrant
- 100%: Full luminous glow — the celebration IS the card

**Key behaviors:**
- Starts at 15% (endowed progress — not empty)
- Blocks stagger in with 400ms delay
- Tentative blocks: dashed border, 60% opacity
- Confirmed blocks: solid border, full opacity, subtle glow
- The card is always visible — never hidden, never a secondary view
- Mobile: card is a collapsible panel above the chat

---

## Key Screens

1. **Landing page** — value prop, completed card as hero, CTA
2. **Builder: domain selection** — multi-select chips + dormant card
3. **Builder: rapid profiling** — quick-reply chips + card assembling block by block
4. **Builder: review & publish** — summary + install command + card at full glow
5. **Profile page** — public page showing the published card (shareable)

---

## Scope

### In Scope (v1)
- Web application with building-blocks conversational UI
- Split-pane layout: chat with quick-reply chips + evolving identity card
- Google + GitHub authentication
- 3-phase rapid flow: domain selection → profiling → publish
- Tool-use based identity extraction (Claude emits structured blocks)
- Block state machine ensuring complete coverage
- Quick-reply chips for most questions (minimize typing)
- Skill generation in Agent Skills format (SKILL.md + references/)
- Skill matching against 75k+ skills.sh dataset
- Dual publishing: platform org OR personal GitHub repo
- Install command generation
- Conversation persistence (resume if you leave)

### Out of Scope (v1)
- Artifact analysis (GitHub repos, Figma files — v2)
- Live roleplay testing (v2 — adds complexity, delays publish)
- Skill versioning / update flow
- Team-based skills
- Deep Figma/video/audio analysis
- Skill marketplace / discovery
- Analytics on skill usage
- Mobile app

### Future (v2+)
- Artifact analysis for "verified" blocks
- Roleplay testing mode
- Skill evolution: re-run specific phases to update
- Skill composition: combine multiple personas
- Marketplace with search/browse/trending

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Completion rate | >80% of users who start finish and publish |
| Time to complete | 3-4 minutes average |
| Blocks per session | 12-20 identity blocks discovered |
| Chip usage | >70% of interactions are chip taps (not free text) |
| Install adoption | >20% of published skills get installed by 1+ others |
| Return rate | >30% of users come back to view/share their profile |

---

## Open Questions

1. **Skill updates:** How does a user update their skill? v1: regenerate from scratch.
2. **Privacy:** Should skills have private sections for sensitive opinions?
3. **Profile page:** How much of the card is public vs. what's in the installable skill?
4. **Platform name:** What's the product called?
5. **Conversation resume:** How long do we persist incomplete sessions?
