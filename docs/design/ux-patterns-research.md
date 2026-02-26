# UX Patterns Research: Conversational Profile-Building Interfaces

**Date:** 2026-02-27
**Goal:** Minimize user effort and maximize speed for building a complete professional profile in 3-4 minutes
**Context:** Research for the Skill Builder conversational identity card builder

---

## 1. Quick-Reply / Suggested Response Patterns

### The Core Principle

Recognition over recall. Surface what is possible through visible affordances -- buttons, chips, and quick replies -- so users tap instead of type. Research from NNGroup confirms that prompt controls in generative AI chatbots "increase usability by decreasing interaction cost, as commonly used commands can be executed with a click instead of typing."

### Pattern 1A: Typeform -- One Question at a Time with Smart Branching

**How it works:**
- Shows a single question on screen at a time, creating a focused conversational rhythm
- Logic jumps adapt the next question based on the previous answer, creating personalized paths
- AI features detect vague responses and automatically generate clarifying follow-ups
- Answers feel like a dialogue, not a form

**Key lesson for Skill Builder:** The one-at-a-time format is the foundation. But Typeform's weakness is that it still feels like a form. The AI conversation should feel more like a dialogue that INFERS answers, not just collects them.

**Implementation pattern:**
```
AI: "What kind of engineering do you focus on?"
[Frontend] [Backend] [Fullstack] [Infra/DevOps] [ML/AI] [Mobile]

→ User taps [Frontend]

AI: "Frontend -- nice. What's your primary framework?"
[React] [Vue] [Angular] [Svelte] [Other]
```

### Pattern 1B: Duolingo -- Gamified Tap Responses with Immediate Feedback

**How it works:**
- Question-answer flow where users tap answers without typing
- Each correct answer triggers an immediate "ding" sound, a green "correct" banner, and the progress bar fills
- Variable rewards: XP points, leveling up, praise from the Duo owl mascot
- Onboarding postpones registration until after users have already engaged (gradual engagement)
- The experience starts as a game, then reveals it is learning

**Key lesson for Skill Builder:** The satisfying feedback loop is critical. When a user taps a quick-reply chip, something should HAPPEN -- the identity card should visibly react. Not just "thanks, next question" but a visible discovery being made. The trait pill animates in, a stat bar ticks up, the completion percentage nudges forward.

**Implementation pattern:**
```
User taps [React] → Identity card: "React" badge slides in under Skills
User taps [TypeScript] → Identity card: "TypeScript" appears, React badge gets a "+TS" modifier
AI: "React + TypeScript -- strong combo. What's your preferred meta-framework?"
[Next.js] [Remix] [Vite + React Router] [None, vanilla React]
```

### Pattern 1C: ChatGPT -- Suggested Follow-up Actions

**How it works:**
- After generating a response, ChatGPT provides contextual follow-up buttons
- Quick-action modifiers: "Shorter," "Longer," "More casual," "More formal"
- Follow-up question suggestions (Perplexity shows 3 related questions after each answer)
- Reduces the "blank text box" problem where users do not know what to say next

**Key lesson for Skill Builder:** After the AI makes an inference, offer quick-reply CORRECTIONS, not just forward-moving options. "Based on what you've said, I'd guess you're more pragmatic than perfectionist." Then offer: [Nailed it] [Close, but...] [Actually, I'm more...]

**NNGroup guidelines for suggested replies:**
- Offer 3-5 task examples demonstrating capabilities
- Include relevant follow-up suggestions (3 related questions is the sweet spot)
- Always pair icons with descriptive labels
- Keep labels concise, under 30 characters
- Use precise, functional descriptions rather than vague branded names

### Pattern 1D: Notion AI -- Conversational Onboarding with Real-Time UI Updates

**How it works:**
- Onboarding survey feels like a thoughtful conversation, not a form
- Interface preview morphs in real-time as users define their intended use case
- Segments users based on responses, then only surfaces relevant features and templates
- Creates a tailored experience from the very first interaction

**Key lesson for Skill Builder:** The split-pane layout (chat left, identity card right) directly mirrors this. As the user answers in the chat, the identity card MUST update in real-time. Notion proves this pattern works -- users feel like their answers matter because they can SEE the effect.

### Pattern 1E: Linear -- Action-Oriented Setup Wizard

**How it works:**
- Setup wizard is built around ACTIONS, not passive information
- Modal/standalone flow presenting a sequence of screens, each representing a step
- Progress indication throughout, with minimal total steps
- Users choose workspace name, create first team, configure settings -- all action-oriented

**Key lesson for Skill Builder:** Every question in the conversation should feel like it is DOING something. Not just collecting data for later -- building the card NOW. Linear proves that users tolerate multi-step flows when each step has visible, immediate output.

### Pattern 1F: Slack -- Teaching Through Doing

**How it works:**
- Most onboarding tips conveyed through Slackbot interactions
- Users learn by USING the platform: create a channel, send a message, invite someone
- Each step combines a direct action with onboarding
- Interface components build out in real-time as users complete steps

**Key lesson for Skill Builder:** The conversation IS the product. Slack does not explain features then ask users to try them -- the explanation IS the trial. Similarly, the Skill Builder conversation should not feel like "answering questions for later" but "building your identity right now."

### Quick-Reply Design Specifications

Based on research across sources:

| Attribute | Recommendation |
|-----------|---------------|
| Options per question | 3-6 chips (sweet spot: 4) |
| Label length | Under 30 characters, 1-2 words ideal |
| Visual treatment | Pill/chip shape, clear selected/unselected states |
| Selection feedback | Color change + checkmark or icon + border shift |
| Tap target size | Minimum 44x44px (iOS HIG), recommended 48x48px |
| Spacing between chips | 8-12px gap for comfortable tapping |
| Layout | Horizontal row for 3-4 options, wrap to 2 rows for 5-6 |
| Multi-select indicator | Use checkmarks, not radio-button style |
| Always include | "Other" or free-text escape hatch for power users |

---

## 2. Progressive Disclosure in Chat

### The Core Principle

Each question builds on the last, with the AI doing most of the inference work. The user's role shifts from "answerer" to "confirmer." Research from NNGroup and LogRocket confirms that progressive disclosure "reduces cognitive load by gradually revealing information as needed."

### Pattern 2A: Inference-Then-Confirm (The Power Pattern)

**How it works:**
```
Step 1: Ask a broad question → User gives brief answer
Step 2: AI infers 3-5 specific traits from that answer
Step 3: Present inferences as confirmable chips
Step 4: User confirms/rejects with single taps
Step 5: AI drills deeper on confirmed areas
```

**Example flow:**
```
AI: "What's your primary tech stack?"
User taps: [React] [TypeScript] [Node.js]

AI: "React + TypeScript + Node.js -- classic fullstack web setup. Based on that,
I'm guessing a few things about you:"

[You prefer composition over inheritance] ← confirmable chip
[You use functional components exclusively] ← confirmable chip
[You care about type safety] ← confirmable chip
[You ship to Vercel or similar] ← confirmable chip

"Tap the ones that resonate. Skip what doesn't fit."

→ User taps 3 of 4

AI: "Got it. You skipped 'ship to Vercel' -- where do you typically deploy?"
[AWS] [GCP] [Self-hosted] [Depends on the project]
```

**Why this is powerful:** One broad answer (3 chip taps) generated 4 inferences. The user only had to confirm/deny, not articulate. The AI extracted maximum signal from minimum input.

### Pattern 2B: Summary-and-Validate Checkpoints

**How it works:**
- After every 3-4 exchanges, AI pauses and reflects back a summary
- Summary is presented as a distinct visual element (card, not just text)
- User can confirm with one tap or correct specific parts
- Confirmed traits "lock in" on the identity card (full opacity, solid border)

**Example:**
```
AI (summary card):
┌──────────────────────────────────────────────┐
│  "Here's what I'm picking up so far:         │
│                                              │
│  You're a pragmatic fullstack engineer who   │
│  leans toward simplicity. You prefer React + │
│  TypeScript, think most state management is  │
│  overkill, and value shipping speed over     │
│  perfection."                                │
│                                              │
│  [Yes, nailed it]  [Close, but...]  [Nope]  │
└──────────────────────────────────────────────┘
```

**Key design details:**
- Summary card has visually distinct treatment (background color, border, icon)
- Confirming triggers a satisfying animation on the identity card
- "Close, but..." opens a targeted correction flow (not a blank text input)
- "Nope" is rare and triggers the AI to ask what is off

### Pattern 2C: Branching Depth Based on Signal Strength

**How it works:**
- AI monitors confidence levels for each trait it is inferring
- High-confidence inferences get quick confirm/deny chips
- Low-confidence areas get deeper follow-up questions
- Users spend time only where it matters

**Example:**
```
High confidence (from clear signals):
AI: "You clearly value simplicity -- I saw you mention it three times.
[Confirm: Simplicity-first] ← one tap, done

Low confidence (ambiguous signals):
AI: "I can't quite tell your testing philosophy. Which resonates most?"
[Test the happy path, ship fast]
[Full coverage or bust]
[Integration tests > unit tests]
[Testing is a spectrum -- depends on the feature]
```

### Pattern 2D: Progressive Profile Enrichment (The Funnel)

Structure the conversation as a narrowing funnel:

```
Layer 1: BROAD (1-2 questions)
"What domains define your expertise?" → multi-select chips
"What's your current role?" → chips + optional free text

Layer 2: CONTEXTUAL (2-3 questions, branched by domain)
"You picked Engineering. What's your primary stack?" → chips
"How many years of professional experience?" → chips: [1-3] [3-7] [7-12] [12+]

Layer 3: OPINION (3-4 questions, the richest signal)
"Monolith or microservices for a 5-person team?" → chips + explain
"What's a common practice you think is actually harmful?" → free text (rare, high-value)

Layer 4: INFERENCE + CONFIRM (2-3 checkpoints)
AI presents personality/style inferences → confirm/reject chips

Layer 5: REFINEMENT (1-2 targeted questions)
"One thing I can't figure out -- how do you feel about AI-generated code?"
→ [Love it, use it daily] [Useful but verify everything] [Skeptical] [Depends on the task]
```

Total: ~12-15 interactions, but most are single-tap. Estimated time: 3-4 minutes.

---

## 3. Building Blocks / Card Assembly UX

### The Core Principle

The identity card is not a static output -- it is a LIVE visualization that assembles in real-time as the conversation progresses. This transforms a data-collection exercise into a discovery experience.

### Pattern 3A: Game Character Creation -- Quick Choices, Visual Updates

**How it works in games:**
- Player makes a few key choices (class, race, background, defining traits)
- Each choice immediately updates the character's visual appearance
- Avatar/character preview updates in real-time as selections are made
- Prioritizes accessibility -- players jump into action immediately
- Pre-generated templates/playbooks reduce analysis paralysis

**Application to Skill Builder:**
```
User selects [Engineering] domain →
  Identity card: "Engineering" badge slides in, domain section appears

User selects [React] as primary framework →
  Identity card: React skill bar appears at base level, icon added

User confirms "pragmatic" inference →
  Identity card: "Pragmatic" personality trait pill animates in

User completes summary checkpoint →
  Identity card: Multiple confirmed traits shift from translucent → solid
  Completion percentage ticks up with smooth animation
```

**Key UX details from game design:**
- Place the character preview (identity card) at the top/right where it is always visible
- Less vital elements separated into tabs for progressive reveal
- Visual consistency -- every element matches and is cohesive, allowing the user to "settle in"
- Show hierarchy: critical traits prominent, secondary traits smaller

### Pattern 3B: Trading Card Stats -- Filling In Progressively

**How it works in TCGs:**
- Cards have defined anatomy: name, cost, art, type, rules text, stats, rarity
- Stats are large enough to see at a glance
- Rarity indicators create a sense of value (common, rare, legendary)
- Holographic/foil effects on powerful cards create desire

**Application to Skill Builder:**
```
Identity Card Anatomy:
┌─────────────────────────────────┐
│  [Avatar]  Name                 │ ← Present from auth, never empty
│            Role (fills in)      │
│                                 │
│  [65%] ← completion ring/bar   │ ← Ticks up with each discovery
│                                 │
│  ── Personality ──              │ ← Section fades in when first trait discovered
│  [Pragmatic] [Direct] [???]    │ ← Undiscovered traits show as ghost/locked
│                                 │
│  ── Stack ──                    │ ← Appears when tech stack discussed
│  React ████░░  TypeScript ███░ │ ← Bars fill as expertise confirmed
│                                 │
│  ── Signals ──                  │ ← Decision patterns section
│  "Ships fast" "Hates ceremony" │
│                                 │
│  12 traits discovered           │ ← Running count, feels like achievements
└─────────────────────────────────┘
```

**Animation specifications:**
- New trait discovery: fade-in (200ms) + slight slide-up (8px) + settle
- Confirmation: opacity 0.5 → 1.0 transition (300ms) + subtle pulse
- Section reveal: height grows from 0 with ease-out-cubic (400ms)
- Completion percentage: smooth counter animation (number ticks up)
- Skill bars: width grows with spring easing (500ms)

### Pattern 3C: LinkedIn Profile Strength -- Endowed Progress

**How it works:**
- Progress bar shows profile completeness percentage
- LinkedIn increased full profile completion by 55% with this one mechanic
- Users start with progress pre-filled (name + avatar from auth = 10-15%)
- Level names create milestones: "Beginner," "Intermediate," "All-Star"
- Each new piece of info visibly moves the needle

**Psychological principles at play:**

1. **Endowed Progress Effect:** People work harder when they feel they have a head start. Starting the identity card at 10-15% (from auth data) instead of 0% makes users more likely to complete it. Research shows pre-filling even artificial progress significantly increases completion rates.

2. **Zeigarnik Effect:** People remember and are drawn to incomplete tasks. An identity card at 65% creates cognitive tension -- users WANT to see it reach 100%. The incomplete card stays in working memory.

3. **Goal Gradient Effect:** Motivation accelerates as you approach the goal. Originally proven by Hull (1934) -- rats ran faster as they neared food. In UX: customers with a 12-stamp card pre-filled with 2 stamps complete purchases faster than those with a blank 10-stamp card. The identity card should feel like it is accelerating as it nears completion.

**Application to Skill Builder:**
- Start at ~15% (name + avatar + domain selection)
- Each answered question adds 3-8% depending on signal richness
- After Phase 1 (domain selection): ~20%
- After first 3-4 exchanges: ~35-40%
- After first summary checkpoint: ~50-55% (big jump for confirmed inference)
- After deep questions: ~70-80%
- After final confirmation: ~95%
- Publish: 100%

The card should feel like it accelerates -- early questions add small increments, later confirmations add larger chunks. This matches the goal gradient effect.

### Pattern 3D: The "Unlocking" Metaphor vs. "Filling Out"

This is a critical framing distinction:

| "Filling Out" (bad) | "Unlocking/Discovering" (good) |
|---------------------|-------------------------------|
| Empty form fields | Locked/mystery trait slots |
| Progress bar fills | Card "powers up" with vibrant gradient |
| "Complete your profile" | "Discover your professional identity" |
| Data entry | Archaeology / excavation |
| Obligation | Curiosity |

**Implementation:**
- Ghost placeholder elements where undiscovered traits will go (creates curiosity)
- Traits emerge from the gradient background, not inserted into empty slots
- The gradient itself intensifies as completion increases (muted at 0%, vibrant at 100%)
- Sound/haptic feedback on discoveries (optional, respect preferences)
- Language in the AI: "I just discovered something" not "Please tell me about"

---

## 4. Optimal Question Count and Types for 3-4 Minute Flows

### Research-Backed Numbers

**Time per question type:**
- Multiple choice chip tap: 5-8 seconds (including read time + decision)
- Confirm/deny single tap: 3-5 seconds
- Multi-select chips: 8-12 seconds (scanning + multiple taps)
- Summary checkpoint: 10-15 seconds (read + confirm/correct)
- Free-text response: 20-45 seconds (think + type)
- AI inference display + reaction: 5-10 seconds (read + tap)

**Completion rate by question type (SurveyMonkey data):**
- Surveys starting with multiple choice: 89% completion rate
- Surveys starting with open-ended text: 83% completion rate (6% drop)
- This means ~6 out of every 100 users are lost just because the opening question seemed like too much work

**Optimal survey length (SurveyMonkey):**
- At 7.5 seconds per simple question, a 3-minute flow supports ~24 simple taps
- At 10 seconds per moderate question, a 4-minute flow supports ~24 moderate interactions
- Adding free-text questions reduces total count significantly

### Recommended Question Architecture for 3-4 Minutes

**Total interaction count: 12-16 interactions**

```
Phase 1: Domain Discovery (30 seconds)
  Q1: Multi-select domain chips .............. 10 sec
  Q2: Current role chips ..................... 8 sec

Phase 2: Stack & Context (60 seconds)
  Q3: Primary tech/tools chips ............... 10 sec
  Q4: Experience level chips ................. 5 sec
  Q5: AI inference + confirm/reject .......... 10 sec
  Q6: Framework preferences chips ............ 8 sec
  Q7: Summary checkpoint #1 .................. 15 sec

Phase 3: Opinions & Style (60 seconds)
  Q8: Architecture opinion chips ............. 8 sec
  Q9: AI inference + confirm/reject .......... 10 sec
  Q10: "What do you reject?" free text ....... 30 sec
  Q11: Working style chips ................... 8 sec

Phase 4: Refinement (30-60 seconds)
  Q12: Summary checkpoint #2 ................. 15 sec
  Q13: Communication style inference ......... 10 sec
  Q14: AI personality summary + confirm ...... 15 sec
  Q15: "Anything I missed?" (optional) ....... 0-30 sec

Total: 12-15 interactions in ~3-4 minutes
```

**Question type mix:**
| Type | Count | Time% | Signal Value |
|------|-------|-------|-------------|
| Multi-select chips | 3-4 | 20% | Foundational data (domain, stack) |
| Single-select chips | 3-4 | 15% | Preferences and opinions |
| Confirm/deny inference | 3-4 | 15% | Personality and style |
| Summary checkpoint | 2 | 15% | Validation and trust |
| Free text | 1-2 | 25% | Richest signal, highest effort |
| AI inference display | 2-3 | 10% | Card updates, visual reward |

### Key Principle: Extract Maximum Signal from Minimum Input

**The AI Inference Multiplier:**
Each user tap should generate 2-3x the apparent information:

```
User taps: [React] [TypeScript] [Next.js]

AI infers (does not ask explicitly):
- Frontend-focused engineer
- Values type safety
- Prefers meta-framework structure
- Likely deploys to Vercel or similar
- Probably uses App Router (modern Next.js)
- Component-driven architecture preference
- Probably familiar with server components

→ 3 taps generated 7 inferences, 5 of which can be confirmed with single taps
```

**Expert recommendation (Wes Bush, "Product-Led Growth"):**
"When it comes to your signup experience, think about what those 2-3 questions could be that would help you identify your ideal users and then help them get value faster."

For Skill Builder: The first 2-3 questions (domain + stack + role) should generate enough signal for the AI to start building the identity card visibly. Users should see the card update BEFORE they finish the conversation. Value comes first.

---

## 5. Micro-Interactions That Create Delight

### The Core Principle

Every animation should clearly map to a user action. Feedback must feel immediate -- even a slight delay makes an action feel unresponsive. Keep animations under 300ms for direct feedback, under 500ms for transitions.

### Pattern 5A: Chip Selection Feedback (The Tap Moment)

**Current standard:** Chip toggles background color on tap. Boring.

**Delightful version:**
1. User taps chip → chip immediately scales down 2% (press feedback, 50ms)
2. Chip springs back to size with slight overshoot (spring animation, 150ms)
3. Background color transitions (100ms)
4. Checkmark icon fades in from the left (100ms)
5. Simultaneously: corresponding element on identity card starts its entrance animation
6. If the chip completes a category, a subtle "completion" pulse ripples across the section

**CSS/Framer Motion pseudocode:**
```
onTap:
  chip: scale(0.95) → scale(1.02) → scale(1.0) [spring, stiffness: 300]
  chip: bg-transparent → bg-primary [100ms ease]
  chip: opacity 0 → 1 for checkmark [100ms]
  identityCard.trait: translateY(8px), opacity(0) → translateY(0), opacity(1) [200ms ease-out]
```

### Pattern 5B: Identity Card Trait Entrance (The Discovery Moment)

**The most important micro-interaction in the entire product.** This is when the user sees themselves being "discovered."

**Animation sequence:**
1. Trait pill fades in from slightly below (translateY 8px, opacity 0 → 1, 200ms)
2. Pill has a brief glow/highlight effect on entrance (box-shadow pulse, 400ms)
3. Completion percentage counter animates up (number ticks smoothly, 500ms)
4. If this trait came from AI inference (not direct user input), add a subtle sparkle/shimmer
5. If this is a confirmation of an already-shown translucent trait, the opacity transition from 0.5 → 1.0 should feel like "locking in" (300ms + subtle scale pulse)

**For summary confirmations (big moment):**
1. All unconfirmed traits in the section simultaneously transition to full opacity
2. Section header gets a brief checkmark animation
3. Gradient background brightens slightly (brightness 0.95 → 1.0)
4. Completion percentage takes a bigger jump (number acceleration visible)
5. Brief, subtle border glow on the entire identity card (200ms)

### Pattern 5C: Progress as "Powering Up" Not "Filling In"

**The gradient intensification pattern:**
- 0%: Card has muted, nearly grayscale gradient. Dormant.
- 25%: Faint color starts to emerge. First hints of pink/peach.
- 50%: Gradient is visible but soft. Card is "warming up."
- 75%: Gradient is rich and vibrant. Card feels alive.
- 90%: Gradient is at full saturation. Almost there.
- 100%: Full glow effect. Luminous. The card radiates.

This maps directly to the GRDNT-style gradient described in the Skill Builder design prompts. The gradient IS the progress indicator. No separate progress bar needed.

### Pattern 5D: Section Reveal Animations

When the conversation uncovers a new category of the identity (personality, communication style, decision patterns), the entire section appears:

**Animation sequence:**
1. Section header fades in with a slight delay (200ms delay, 200ms fade)
2. Section area height expands from 0 (ease-out-cubic, 400ms)
3. First trait within the section enters with a slight cascade delay (100ms between items)
4. The identity card gently scrolls to show the new section if it was below the fold

### Pattern 5E: Completion Celebration (The 100% Moment)

**This is the single most important animation in the product.** When the identity reaches completion:

1. Final trait locks in with the standard animation
2. Brief pause (200ms) to build anticipation
3. Completion number ticks from 95% → 100% with acceleration
4. The gradient does a full brightness pulse (brief flash, 300ms)
5. All trait pills simultaneously do a subtle shimmer wave (cascade, 50ms delay between)
6. The card border gets a brief luminous glow (fade in 200ms, hold 500ms, fade out 300ms)
7. The overall effect should feel like the card "powering on" -- warm, alive, complete

**What NOT to do:**
- No confetti (feels generic, unearned)
- No sound effects (unexpected, annoying)
- No modal overlay (breaks the flow)
- No "congratulations" toast (patronizing)

The card itself reaching its full visual state IS the celebration. It should feel like a collectible card reaching its final form -- the art glows, the stats are all maxed, it is complete.

### Pattern 5F: Typing/Thinking Indicators

When the AI is "thinking" about what to infer:

**Standard:** Three bouncing dots. Boring.

**Delightful version:**
- The identity card shows a subtle shimmer/scan effect over the area being analyzed
- A brief "processing" indicator on the card itself (scanning lines across skills, traits)
- The AI typing indicator in chat is secondary -- the card is where the action is
- When the AI finishes "thinking," the result appears on the card FIRST, then the chat explanation follows

This reversal (card updates before chat explains) makes it feel like the AI is truly discovering, not just asking and recording.

---

## 6. Synthesis: Recommended Architecture for Skill Builder

### The 3-4 Minute Flow Blueprint

```
00:00-00:30  DOMAIN DISCOVERY
             - Greeting + domain multi-select chips
             - Identity card: name/avatar pre-filled, gradient muted, "15%"
             - 2 interactions (multi-select, confirm)

00:30-01:30  STACK & CONTEXT
             - Primary tools/frameworks (chips)
             - Experience level (chips)
             - AI inference burst: 4-5 traits inferred from stack choices
             - User confirms/rejects inferences (single taps)
             - Summary checkpoint #1
             - Identity card: personality traits appearing, stack section forming, ~45%
             - 5 interactions

01:30-02:30  OPINIONS & STYLE
             - Architecture/approach opinions (chips)
             - "What's overrated in your field?" (single free-text, high-value)
             - AI inference from free text: communication style, personality depth
             - Identity card: decision patterns section fills, communication style appears, ~70%
             - 3-4 interactions

02:30-03:30  REFINEMENT
             - Summary checkpoint #2 (full personality reflection)
             - Targeted corrections (if any)
             - Final inference: working style, collaboration approach
             - Identity card: nearly complete, gradient vibrant, ~90-95%
             - 2-3 interactions

03:30-04:00  COMPLETION
             - "Anything I missed?" (optional)
             - Final confirmation
             - Identity card: 100%, full glow, celebration animation
             - 1-2 interactions
```

### Interaction Budget

| Type | Count | Avg Time | Total |
|------|-------|----------|-------|
| Multi-select chips | 2 | 10 sec | 20 sec |
| Single-select chips | 4 | 7 sec | 28 sec |
| Confirm/deny inference | 4 | 5 sec | 20 sec |
| Summary checkpoints | 2 | 12 sec | 24 sec |
| Free text | 1 | 30 sec | 30 sec |
| AI thinking + card updates | 5 | 8 sec | 40 sec |
| Reading AI messages | 8 | 6 sec | 48 sec |
| **Total** | **~15** | | **~3.5 min** |

### Critical Design Rules

1. **The card is the hero, not the chat.** The chat is the input mechanism. The card is where the magic happens. Users should spend more time looking right (at their identity forming) than left (at the chat).

2. **Every tap should visibly change the card.** No "dead" interactions where nothing updates. If the user taps something, the card reacts.

3. **AI does 70% of the work.** The user provides seeds. The AI grows them into full traits. A 3-word chip selection should generate a paragraph of personality inference.

4. **Start fast, end fast.** The first card update should happen within 15 seconds of starting. The last 3 interactions should be quick confirmations, not new questions.

5. **Free text is precious.** Use it exactly once, for the highest-value question. Everything else should be tappable.

6. **Summaries are celebrations.** Each summary checkpoint is both a validation moment and a visual reward. The card makes a noticeable jump at each checkpoint.

7. **The gradient IS the progress bar.** No separate progress indicator needed. The card's gradient vibrancy tells users exactly where they are.

---

## Sources

### Quick-Reply and Conversational UI Patterns
- [Prompt Controls in GenAI Chatbots: 4 Main Uses and Best Practices - NNGroup](https://www.nngroup.com/articles/prompt-controls-genai/)
- [Typeform Blog: Create Better Online Forms](https://www.typeform.com/blog/create-better-online-forms)
- [Traditional Forms vs. Conversational Interactions - Medium](https://medium.com/design-bootcamp/agentic-ux-in-enterprise-when-to-use-conversational-agents-vs-traditional-forms-93cf588eac21)
- [31 Chatbot UI Examples from Product Designers - Eleken](https://www.eleken.co/blog-posts/chatbot-ui-examples)
- [Chat UX Best Practices - Stream](https://getstream.io/blog/chat-ux/)
- [UX Design Best Practices for Conversational AI - NeuronUX](https://www.neuronux.com/post/ux-design-for-conversational-ai-and-chatbots)
- [AI Chatbot UX 2026 Best Practices - Groto](https://www.letsgroto.com/blog/ux-best-practices-for-ai-chatbots)

### Duolingo and Gamified Onboarding
- [Duolingo User Onboarding Breakdown - UserGuiding](https://userguiding.com/blog/duolingo-onboarding-ux)
- [Duolingo's Delightful Onboarding - Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding)
- [UX Case Study: Duolingo - Usability Geek](https://usabilitygeek.com/ux-case-study-duolingo/)
- [Duolingo Gamification Explained - StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)

### Progressive Disclosure
- [Progressive Disclosure - NNGroup](https://www.nngroup.com/articles/progressive-disclosure/)
- [Progressive Disclosure Types and Use Cases - LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [The Power of Progressive Disclosure in SaaS UX - Lollypop Design](https://lollypop.design/blog/2025/may/progressive-disclosure/)
- [What is Progressive Disclosure - Interaction Design Foundation](https://www.interaction-design.org/literature/topics/progressive-disclosure)

### Profile Completion and Gamification
- [LinkedIn Profile Completion Analysis - Samantha Freedman](http://www.samanthafreedman.com/profile-completion)
- [Analysis of LinkedIn Gamification - Captain Up](https://blog.captainup.com/analysis-of-linkedin-driving-engagement-with-gamification/)
- [From RPGs to UX: Progress Indicators - UX Collective](https://uxdesign.cc/from-rpgs-to-ux-how-progress-indicators-affect-user-engagement-8748f02d766a)
- [Designing Smart Complete Your Profile UI - LogRocket](https://blog.logrocket.com/ux-design/complete-profile-ui-interaction/)
- [Design to Drive Behaviors: Profile Completion - UX Collective](https://uxdesign.cc/designing-to-drive-behaviors-f09b62e5162c)

### Onboarding Flow Research
- [Studied 200+ Onboarding Flows - DesignerUp](https://designerup.co/blog/i-studied-the-ux-ui-of-over-200-onboarding-flows-heres-everything-i-learned/)
- [7 User Onboarding Best Practices 2026 - Formbricks](https://formbricks.com/blog/user-onboarding-best-practices)
- [User Onboarding Best Practices - UserGuiding](https://userguiding.com/blog/user-onboarding-best-practices)
- [Slack Onboarding Flow Analysis - UserPilot](https://userpilot.com/blog/slack-onboarding/)
- [3 Subtle Ways Slack Created Effortless Onboarding - UX Planet](https://uxplanet.org/3-subtle-ways-slack-have-created-an-effortless-onboarding-flow-ac42f069baea)
- [Notion Personalized Onboarding - Candu](https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users)
- [Linear Web Onboarding Flow - Mobbin](https://mobbin.com/explore/flows/64ae582c-747c-4c77-8629-812abcbef186)

### Survey and Question Research
- [Does Adding One More Question Impact Completion Rate - SurveyMonkey](https://www.surveymonkey.com/curiosity/survey_questions_and_completion_rates/)
- [How Long Should a Survey Be - SurveyMonkey](https://www.surveymonkey.com/curiosity/survey_completion_times/)
- [Survey Completion Rate Research - Pointerpro](https://pointerpro.com/blog/average-survey-response-rate/)
- [Conversational Forms: The Ultimate Guide - SurveySparrow](https://surveysparrow.com/blog/how-can-conversational-forms-increase-survey-response-rates/)

### Psychological Effects
- [Zeigarnik Effect - Laws of UX](https://lawsofux.com/zeigarnik-effect/)
- [Goal-Gradient Effect - Laws of UX](https://lawsofux.com/goal-gradient-effect/)
- [Design Perfect UX Tasks: Endowed Progress Effect - Medium](https://medium.com/@davidteodorescu/design-perfect-ux-tasks-the-endowed-progress-effect-7461ca20076c)
- [Psychology Behind Progress Bars - UserPilot](https://userpilot.com/blog/progress-bar-psychology/)

### Micro-Interactions
- [10 Micro-Interaction Patterns - Bootcamp/Medium](https://medium.com/design-bootcamp/10-micro-interaction-patterns-that-make-users-subconsciously-love-your-product-3c341c78acb4)
- [Designing Onboarding Microinteractions - UXPin](https://www.uxpin.com/studio/blog/designing-onboarding-microinteractions-guide/)
- [Micro-Interactions That Delight: UX Animations That Convert - Big Drop](https://www.bigdropinc.com/blog/micro-interactions-that-delight-ux-animations-that-convert/)
- [Micro Interactions in Web Design 2025 - Stan Vision](https://www.stan.vision/journal/micro-interactions-2025-in-web-design)

### Chip/Selection UI Patterns
- [Chip UI Design Best Practices - Mobbin](https://mobbin.com/glossary/chip)
- [Chip UI Design Tutorial - SetProduct](https://www.setproduct.com/blog/chip-ui-design)
- [Chip Component Anatomy - Design Systems Surf](https://designsystems.surf/blueprints/chip)
- [Selection Controls UI Component Series - UX Collective](https://uxdesign.cc/selection-controls-ui-component-series-3badc0bdb546)

### Game UX and Character Creation
- [Game UX: Creating RPG Character Screen - Medium](https://medium.com/@salvadortali/game-ux-creating-new-rpg-character-screen-for-a-console-game-7f8658cd4e14)
- [The UX Design Process: Building a Character Creator - Medium](https://medium.com/@fpocha/the-ux-design-process-building-a-simple-character-creator-5ae7eddb5597)
- [Visual Feedback in Game Design - Icon Era](https://icon-era.com/blog/visual-feedback-in-game-design-why-animation-matters-for-engagement.532/)
- [Redesigning the Roll20 Character Builder - Roll20](https://blog.roll20.net/posts/redesigning-the-roll20-character-builder/)
