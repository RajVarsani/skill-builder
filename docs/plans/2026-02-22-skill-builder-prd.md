# Skill Builder — Product Requirements Document

**Date:** 2026-02-22 | **Updated:** 2026-02-27
**Status:** v4 — Skills-First Building Blocks
**Author:** Raj Varsani + Claude

---

## Problem

AI coding agents are powerful but generic. They don't know how *you* think, what you value, how you make decisions, or what patterns you follow. There's no way to capture a person's professional identity — their expertise, personality, opinions, and working style — in a portable, installable format that makes an AI agent act *as them*.

Meanwhile, the skills.sh ecosystem already contains 75,000+ community-authored skills covering virtually every professional domain, tool, framework, and workflow. But discovering the right skills is hard. Nobody has time to browse 75k entries. The expertise already exists — it just isn't connected to the right people.

## Solution

A web platform that feels magical. Through a rapid, delightful conversation (3-4 minutes), the AI interviews a professional using quick-tap questions, simultaneously building their identity profile AND matching them against the 75k+ skills.sh dataset in real-time. The output is a personalized skill bundle: real, battle-tested skills from the ecosystem — selected by the AI based on the conversation — layered with the user's identity, preferences, and opinions as overrides.

**The key insight:** The 75k+ skills.sh dataset is the PRIMARY source of expertise in the output skill. The conversation is designed to narrow down which existing skills match the user's actual workflow, tools, and domain knowledge. Identity traits (personality, values, communication style) personalize HOW those matched skills behave. Custom skill generation is a fallback reserved for truly niche expertise that doesn't exist in the dataset.

**The core experience:** You tap quick-reply chips on the left. On the right, two things happen simultaneously: identity blocks materialize on your character card, AND matched skills from skills.sh surface beneath them. Your professional self assembles like building blocks — each answer snaps a new piece into place AND refines which real-world skills the AI selects for you. The card is the hero, not the chat.

**Design philosophy: Building Blocks.** Every answer = a block. Every block = a visual element on the card. Some blocks are identity traits inferred from the conversation. Other blocks are matched skills pulled from the 75k+ skills.sh dataset. The user watches their identity AND their skill bundle assemble piece by piece, like a character being created in a game — stats AND equipment.

## Target Users

**Primary: Any professional** who wants to encode their expertise into an AI skill.
- Engineers, designers, product managers, data scientists, marketers, ops — anyone with domain expertise

**Secondary: Teams** who want to install a colleague's skill to get AI guidance aligned with that person's thinking.

## User Stories

1. **As an engineer**, I want to spend 3 minutes tapping through quick questions and get a skill that captures my coding patterns, architecture opinions, and review style — built on top of real, proven skills from the ecosystem that match how I actually work.

2. **As a designer**, I want to watch my design sensibility materialize as a collectible card while the AI simultaneously finds existing design skills that match my process, tools, and philosophy.

3. **As a non-technical professional**, I want to tap through a quick conversation and get an installable skill — no typing essays, no browsing a catalog of 75k skills, no CLI knowledge needed. The AI finds what fits me.

4. **As a team lead**, I want my team to install my skill so the AI gives guidance aligned with how I'd approach problems — using real domain skills that I've verified, personalized with my opinions and preferences.

5. **As a professional in a niche domain**, I want the system to recognize when my expertise doesn't map to existing skills and generate custom ones, rather than forcing a bad match.

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
Landing -> Sign In -> Domain Selection -> Rapid Profiling + Skill Matching -> Review & Publish
                        (30 seconds)        (2-3 minutes)                     (30 seconds)
```

**Total: ~3-4 minutes.** Not 15-25 minutes. Speed is a feature.

### Landing Page

- Hero: "Make AI Think Like You"
- Show a completed identity card (the gradient collectible card) as the hero visual, including matched skills from skills.sh
- Show the install command
- CTA: "Build Your Skill ->"

### Phase 1: Domain Selection (30 seconds)

**What happens:**
- Split layout: chat on the left, empty identity card on the right
- AI sends a warm one-line greeting + multi-select domain chips
- User taps 1-3 domains
- AI immediately does two things:
  1. Infers 2-3 "quick roll" identity blocks from domains alone (e.g., Engineering -> "Systems Thinker", "Ship-oriented")
  2. Performs a first-pass skill match against skills.sh — pre-loads candidate skills for the selected domains
- Tentative identity blocks materialize on the card instantly
- A "Skill Radar" indicator appears at the bottom of the card: "Scanning 75k+ skills..." then resolves to "12 potential matches found"

**The "Quick Roll" — key UX innovation:**
After domain selection, the AI pre-infers initial blocks and presents them as tentative. The user confirms or adjusts with single taps. This saves 2-3 questions and creates an instant "wow" moment — the card starts filling before the first real question. Meanwhile, the skill matching engine has already narrowed the 75k+ dataset to a working set of candidates.

**Design notes:**
- Multi-select chips for domains — tactile, satisfying to tap
- Identity card starts at ~15% (endowed progress, not 0% — creates momentum)
- Card gradient is muted/dormant, wakes up when domains are selected
- Quick-roll blocks appear with "materializing" animation (faded, dashed border)
- Skill match count appears subtly — signals that real skills are being found

### Phase 2: Rapid Profiling + Skill Matching (2-3 minutes, 8-12 questions)

**What happens:**
The conversation has a dual purpose that the user experiences as one seamless flow:

1. **Identity extraction** — Building personality, values, and communication style blocks
2. **Skill narrowing** — Every answer refines which skills from the 75k+ skills.sh dataset match the user

The AI asks questions that serve BOTH purposes simultaneously. "What's your approach to code reviews?" builds an identity block ("Thorough reviewer") AND narrows skill matches (surfaces "code-review-checklist", "pr-review-patterns", drops "rubber-stamp-reviews").

**How skill matching works during conversation:**
- Domain selection seeds the initial candidate pool (hundreds of skills)
- Each answer acts as a filter: tools mentioned, frameworks named, approaches described, opinions stated
- The matching engine uses semantic similarity + keyword extraction + domain taxonomy to score candidates
- Top matches surface progressively on the card as confidence increases
- By end of conversation, the engine has narrowed 75k+ down to 5-15 high-confidence matches

**Question types and pacing:**

| Round | Questions | Type | Identity Purpose | Skill Matching Purpose |
|-------|-----------|------|------------------|----------------------|
| 1 | 4-5 | Quick-tap chips | "Who are you" — seniority, approach, core value, communication style | Narrows by experience level, methodology, tool preferences |
| 2 | 2-3 | Inference confirm + 1 free text | AI reflects back inferences, asks for strongest opinion | Refines matches based on specific tools/frameworks/patterns mentioned |
| 3 | 2-3 | Scenario chips | Decision patterns — "tight deadline, you would..." | Matches workflow skills, prioritization styles, decision frameworks |

**Time per question type:**
- Chip tap: 5-8 seconds
- Confirm/deny: 3-5 seconds
- Free text: 20-45 seconds (use sparingly — max 1-2)
- Summary checkpoint: 10-15 seconds

**The building blocks moment:**
Each answer triggers TWO types of blocks materializing on the card:
1. **Identity blocks** — personality traits, values, opinions (inferred from the conversation)
2. **Matched skill blocks** — real skills from skills.sh that the AI matched based on answers (surfaced as the matching engine gains confidence)

The user literally watches themselves being assembled — identity AND expertise. Blocks start as faded/dashed (tentative), then lock in as solid (confirmed) after summaries. The gradient on the card intensifies as completion rises.

**Inference-then-confirm pattern (the power move):**
User gives one broad answer -> AI infers 3-5 traits AND surfaces 2-3 skill matches -> user confirms with a single tap. One answer generates 2-3x the information without extra effort. This is how you build a rich profile AND a curated skill bundle in 3 minutes.

**Skill match surfacing pattern:**
Early questions: no matched skills shown yet (still narrowing). After Round 1 (~5 answers): first 2-3 high-confidence skills appear on the card with a subtle "Matched" label. After Round 2: 5-8 matches visible. By end of Round 3: full set of 5-15 matched skills, ranked by confidence. The reveal is progressive — skills don't all appear at once. They surface as confidence crosses a threshold, creating a "discovery" feel.

**Summary checkpoints (every 4-5 blocks):**
AI reflects back BOTH dimensions: "I'm seeing you as a pragmatic senior engineer who values simplicity and ships fast. I've found 6 skills that match your workflow — including react-architecture, api-design-patterns, and code-review-checklist. Ring true?" User taps [Spot on!] or [Close, but...]. Confirmed blocks solidify on the card with a satisfying animation.

**Design notes:**
- Quick-reply chips: 3-5 per question, horizontal row, pill-shaped, one always slightly playful
- One question at a time — clean, focused, no walls of text
- AI messages are SHORT (1-3 sentences max)
- No explicit progress bar — the card IS the progress indicator
- Identity blocks stagger in with 400ms delay between each — creates "discovery" feel
- Matched skill blocks surface with a different animation (slide-in from right) to distinguish from identity blocks
- Skill count indicator on card updates as new matches appear

### Phase 3: Review & Publish (30 seconds)

**What happens:**
- AI presents a 2-3 sentence summary of the complete identity
- Below the summary, AI shows: **"We found N skills that match your expertise"** — listing each matched skill from skills.sh with a one-line description
- User sees their complete card: identity blocks on top, matched skills below
- User can:
  - **Confirm** a matched skill (default state — all matches start confirmed)
  - **Remove** a matched skill that doesn't fit ("I don't actually use this")
  - **See more** to browse additional near-miss matches from skills.sh
- If the AI identified expertise with no good skills.sh match, those appear as "Custom Skills" — generated from the conversation
- User confirms or makes final adjustments (1 tap or 1 correction)
- All blocks lock in with satisfying confirmation animation
- Skill generation happens instantly (pre-generated during conversation, using matched skills.sh skills as the base + identity overrides)
- Install command appears with copy button
- Celebration: the card reaches full luminous glow — no confetti, no modals. The beautiful finished card IS the celebration.

**The matched skills review:**
```
We found 8 skills that match your expertise:

  [x] react-architecture      — Component patterns, state management, performance
  [x] api-design-patterns     — RESTful design, error handling, versioning
  [x] code-review-checklist   — Systematic PR review with quality gates
  [x] typescript-strict       — Strict TS config, type-safe patterns
  [x] testing-strategy        — Test pyramid, integration-first approach
  [x] ci-cd-pipelines         — GitHub Actions, deploy automation
  [ ] kubernetes-basics        — Removed: "I don't do infra"
  [x] technical-writing       — Clear docs, ADRs, RFC patterns

  + 3 custom skills generated from your unique expertise
  [See 5 more near-matches...]
```

Each matched skill from skills.sh will be bundled with the user's preference overrides: their opinions, their variations, their exceptions. The matched skill provides the domain knowledge; the identity provides the personality.

**Publishing options:**
- "Publish to Skill Builder" (default) — zero friction
- "Publish to my GitHub" — requires GitHub connection

**Design notes:**
- Matched skills section is interactive — checkboxes, not just a list
- Each skill has a tiny "preview" expand to see what it does
- Install command: massive, centered, one-click copy
- Share buttons: X, LinkedIn, copy link
- The card at 100% = full gradient vibrancy, all blocks confirmed, matched skills locked in
- Feels like an achievement, not a form submission

---

## Skill Matching Engine

**This is the core technical differentiator.** The 75k+ skills.sh dataset is not a nice-to-have — it IS the product's expertise layer. The matching engine is what turns a 3-minute conversation into a rich, battle-tested skill bundle.

### How It Works

**Input signals from conversation:**
- Domains selected (Phase 1)
- Tools and frameworks mentioned (explicit or inferred)
- Seniority and experience level
- Methodologies and approaches (e.g., "test-first", "ship fast", "design-system-driven")
- Specific opinions and anti-patterns mentioned
- Scenario responses (reveals workflow preferences)

**Matching approach:**
1. **Domain filtering** — Narrow 75k+ to relevant domain(s). A "React engineer" doesn't need Kubernetes skills unless they mention infra.
2. **Semantic scoring** — Each conversation answer is embedded and compared against skill descriptions/metadata in the dataset. High semantic similarity = candidate match.
3. **Keyword extraction** — Tools, frameworks, and patterns explicitly named by the user are matched against skill tags and content.
4. **Confidence thresholds** — Skills only surface on the card when confidence exceeds a threshold. Early in conversation, few matches. Late in conversation, many.
5. **Diversity constraint** — Ensure matched skills cover different aspects of the user's expertise, not 8 variations of the same thing.

**Matching happens in real-time:**
- After each answer, the matching engine re-scores candidates
- New high-confidence matches surface on the card immediately
- Previously surfaced matches can be de-prioritized if later answers contradict
- The engine runs asynchronously — never blocks the conversation flow

**Custom skill generation (fallback):**
When a user describes expertise that has NO good match in the 75k+ dataset (confidence below threshold for all candidates in that area), the system generates a custom skill from the conversation content. This is the exception, not the rule. For most professionals, 80-100% of their expertise maps to existing skills.

**Expected distribution:**
- Typical user: 5-12 matched skills from skills.sh, 0-3 custom generated
- Niche expert: 3-8 matched skills, 3-5 custom generated
- Generalist: 8-15 matched skills, 0-1 custom generated

---

## The Identity Card (Core UI Component)

**This is the most important element in the entire product.** It's a gamified collectible character card, not a resume. It shows TWO types of building blocks: identity traits (who you are) and matched skills (what you know).

**Structure:**
```
+-----------------------------------+
|  +------+                         |
|  |Avatar|  Name                   |
|  +------+  Role                   |
|                                   |
|          == 65% ==                |
|                                   |
|  IDENTITY                         |
|  [Pragmatic] [Direct] [Fast]     |
|  [Simplicity-first]              |
|                                   |
|  MATCHED SKILLS (8)               |
|  > react-architecture     Expert  |
|  > api-design-patterns    Senior  |
|  > code-review-checklist  Expert  |
|  > typescript-strict      Expert  |
|  > testing-strategy       Senior  |
|  + 3 more                         |
|                                   |
|  CUSTOM (2)                       |
|  > startup-velocity               |
|  > monorepo-opinion               |
|                                   |
|  18 blocks discovered             |
+-----------------------------------+
```

**Two block types, one card:**

1. **Identity blocks** (top section) — Personality traits, values, communication style, decision patterns. Inferred from conversation. These personalize HOW the matched skills behave. Example: "Pragmatic", "Direct communicator", "Simplicity-first", "Ship > Perfect".

2. **Matched skill blocks** (middle section) — Real skills from the 75k+ skills.sh dataset that the matching engine selected based on the conversation. These ARE the expertise. They come with the user's preference overrides baked in. Example: "react-architecture" with override "Prefer composition over inheritance, co-locate state".

3. **Custom skill blocks** (bottom section, if any) — Generated from conversation for expertise not found in the dataset. Rare for most users. Example: "startup-velocity" — a custom skill about shipping fast in early-stage startups that doesn't map to any existing skill.

**Block visual lifecycle:**
```
empty -> materializing -> tentative -> confirmed
          (fade+scale    (dashed,     (solid,
           from below)    60% opacity)  full glow)
```

Identity blocks and matched skill blocks use slightly different animations:
- Identity blocks: fade in from below (introspective, personal)
- Matched skill blocks: slide in from the right (discovered, found for you)
- Custom skill blocks: pulse in (generated, unique to you)

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
- Matched skills show a small "skills.sh" origin badge
- The card is always visible — never hidden, never a secondary view
- Mobile: card is a collapsible panel above the chat

---

## Key Screens

1. **Landing page** — value prop, completed card (with matched skills visible) as hero, CTA
2. **Builder: domain selection** — multi-select chips + dormant card + "Scanning skills..." indicator
3. **Builder: rapid profiling** — quick-reply chips + card assembling identity blocks AND matched skills progressively
4. **Builder: review & publish** — summary + matched skills checklist + install command + card at full glow
5. **Profile page** — public page showing the published card with matched skills listed (shareable)

---

## Scope

### In Scope (v1)

**Core: Skill Matching Engine**
- Real-time matching against the 75k+ skills.sh dataset during conversation
- Semantic scoring + keyword extraction + domain filtering
- Confidence-based progressive surfacing (skills appear as confidence grows)
- Diversity constraints to ensure breadth of matched skills
- Matched skill review UI: confirm, remove, see more near-matches
- Preference override generation for each matched skill (user's opinions layered on top)
- Custom skill generation as fallback for unmatched expertise

**Core: Conversational Builder**
- Web application with building-blocks conversational UI
- Split-pane layout: chat with quick-reply chips + evolving identity card
- Dual-purpose questions that extract identity AND narrow skill matches simultaneously
- Tool-use based identity extraction (Claude emits structured blocks)
- Block state machine ensuring complete coverage
- Quick-reply chips for most questions (minimize typing)
- Summary checkpoints that reflect both identity and matched skills

**Core: Identity Card**
- Two block types: identity blocks + matched skill blocks (+ custom skill blocks)
- Progressive assembly with distinct animations per block type
- Gradient intensification as completion rises
- Matched skill count indicator

**Infrastructure**
- Google + GitHub authentication
- 3-phase rapid flow: domain selection -> profiling + matching -> review + publish
- Skill generation in Agent Skills format (SKILL.md + references/) using matched skills.sh skills as base
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
- Manual browsing of the 75k+ skills.sh catalog (the AI curates for you)

### Future (v2+)
- Artifact analysis for "verified" blocks
- Roleplay testing mode
- Skill evolution: re-run specific phases to update matched skills
- Skill composition: combine multiple personas
- Marketplace with search/browse/trending
- "Skill diff" — show how your matched skills differ from another user with similar domain
- Skill recommendation refinement — learn from which matches users keep vs. remove

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Completion rate | >80% of users who start finish and publish |
| Time to complete | 3-4 minutes average |
| Blocks per session | 12-20 total blocks discovered (identity + matched + custom) |
| Chip usage | >70% of interactions are chip taps (not free text) |
| **Skill match accuracy** | **>75% of matched skills are kept by users (not removed during review)** |
| **Skill match coverage** | **>80% of output skills come from skills.sh matches (not custom generated)** |
| **Match discovery satisfaction** | **>60% of users click "See more near-matches" (signal of engagement with matching)** |
| Install adoption | >20% of published skills get installed by 1+ others |
| Return rate | >30% of users come back to view/share their profile |

---

## Open Questions

1. **Skill updates:** How does a user update their skill? v1: regenerate from scratch. Does re-matching happen, or do we remember previous matches?
2. **Privacy:** Should skills have private sections for sensitive opinions?
3. **Profile page:** How much of the card is public vs. what's in the installable skill? Do matched skill names appear publicly?
4. **Platform name:** What's the product called?
5. **Conversation resume:** How long do we persist incomplete sessions?
6. **Match transparency:** Should users see WHY a skill was matched? ("Matched because you mentioned React, composition patterns, and performance optimization") — could build trust but adds UI complexity.
7. **Skills.sh dataset freshness:** How often do we sync the 75k+ dataset? Skills.sh is growing — new skills appear daily.
8. **Override depth:** How deep should preference overrides go? Light touch ("prefer X over Y") vs. deep customization (rewriting sections of the matched skill)?
