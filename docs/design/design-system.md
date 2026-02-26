# Skill Builder — UX & Interaction Design

**Updated:** 2026-02-27

**Design philosophy:** Building Blocks + Skill Matching. Every answer = a block. Every block = a visual element. The card assembles piece by piece. Meanwhile, AI matches your demonstrated expertise against the real skills.sh registry. "Unlocking" not "filling out." "Discovering" not "guessing."

---

## Core Interaction: Quick-Reply Chips

The primary interaction method. Most questions are answered by tapping chips, not typing. Typing is the escape hatch, not the default.

**Behavior:**
- 3-5 chips per question (sweet spot: 4)
- Always include one slightly playful/creative option to break monotony
- Chips wrap to 2 rows max for 5-6 options
- Minimum tap target: 48x48px (mobile-safe)

**States:**
- **Default** — tappable, neutral
- **Hover** — subtle background shift
- **Pressed** — scale down 2% (50ms), spring back with overshoot (150ms). Satisfying micro-bounce.
- **Selected** — fills dark with checkmark fade-in (100ms)
- **Disabled** — after selection, unselected chips fade to 40% opacity (200ms). Can't change your mind — keeps momentum.

**Multi-select chips:**
- Selected chips get a checkmark, stay tappable (toggle on/off)
- "Continue" button appears after 1+ selections
- Used for: domain selection, skill confirmation

**"Other..." chip:**
- Always last in row
- Visually distinct: dashed border
- Tap expands inline text input below the chips
- Keeps the flow — user doesn't have to scroll to a separate input

**Why chips work:** 5-8 seconds per question vs 20-45 seconds for free text. 89% completion rate vs 83% for open-ended. Speed IS delight.

---

## The Identity Card — The Hero

The card is the most important element in the product. It's always visible, always updating. The chat is the input; the card is the output.

### Two Types of Blocks

The card shows TWO distinct types of building blocks:

1. **Identity blocks** — personality traits, values, communication style, working preferences. Inferred from conversation. Freeform labels like "Pragmatic", "Direct", "Ship fast".

2. **Matched skills** — real skills from the 75k+ skills.sh dataset. Machine-readable slugs like `react-architecture`, `api-design-patterns`. These carry a "skills.sh" attribution badge and represent actual installable skills.

3. **Custom skills** — niche expertise with no match in skills.sh. Rare (0-3 per session). Marked with a star badge.

This duality captures WHO you are (identity) and WHAT you can do (skills), grounded in real-world definitions.

### Card Sections

```
┌─────────────────────────────────┐
│  ┌──────┐                        │
│  │Avatar│  Name                   │
│  └──────┘  Role                   │
│                                   │
│         ╔══ 65% ══╗               │
│                                   │
│  ── Identity ──                   │
│  [Pragmatic] [Direct] [Fast]     │
│  [Simplicity-first]              │
│                                   │
│  ── Skills (matched) ──          │
│  [react-architecture]  ✓ skills.sh│
│  [api-design-patterns] ✓ skills.sh│
│  [code-review-expert]  ✓ skills.sh│
│                                   │
│  ── Custom Skills ──             │
│  [startup-velocity]   ★ custom    │
│                                   │
│  15 blocks · 4 skills matched     │
└─────────────────────────────────┘
```

**Sections appear progressively:**
- Header (name, avatar, completion %) — always visible from the start
- Identity section — first blocks appear in Phase 1 (quick roll)
- Matched Skills section — header fades in when the first skill match arrives (usually mid Phase 2)
- Custom Skills section — only appears if needed. Most users won't see this.
- Footer — block count + skill match count

**The card height is dynamic** — it grows as sections populate. Starts compact, ends full.

### Gradient Intensification = Progress

The card's background gradient is the primary progress indicator. Not a progress bar — the ENTIRE card gets more vibrant.

| Completion | Feel |
|-----------|------|
| 0-15% | Dormant — muted, almost grayscale. Waiting. |
| 15-25% | Waking up — faint warm tint emerging |
| 25-50% | Coming alive — soft gradient visible |
| 50-75% | Vibrant — rich and warm |
| 75-95% | Nearly there — full luminous energy |
| 100% | Complete — full glow. This IS the celebration. |

Start at 15% (endowed progress). Never show a 0% empty card — that's demoralizing. The user should feel momentum from the first tap.

### Endowed Progress (15%)

The card begins at 15% to create a sense that something has already started. Psychologically, people are more likely to complete a task that's already partially done. The gradient reflects this — faintly alive, not dead.

---

## Block Behavior & Animation

### Identity Block Lifecycle

Each identity block goes through 3 states:

1. **Materializing** — Fades in from below with scale spring. Dashed border, 60% opacity, slight blur. Feels like it's "forming."

2. **Tentative** — Settled but unconfirmed. Opacity increases to 80%, solid thin border. The AI has inferred this, but the user hasn't confirmed it yet.

3. **Confirmed** — Locked in. Scale pulse + full opacity + subtle glow. This trait is part of the user's identity now.

**Entrance:** Fade in from BELOW. Spring animation (300ms).

### Matched Skill Block Lifecycle

Same 3 states, but visually distinct:

1. **Materializing** — Slides in from the RIGHT (not below). This directional difference is the key cue that a skill was MATCHED from the registry, not inferred.

2. **Tentative** — "skills.sh" micro-label fades in. The user can see this is a real, registered skill.

3. **Confirmed** — Checkmark appears before the "skills.sh" label. Pop animation on the checkmark.

**Entrance:** Slide in from the RIGHT. Spring animation (350ms). Mono typography for the skill slug.

**Why right vs below?** Different entrance directions create an intuitive visual language without needing to explain: "things that fade up from below are about you; things that slide in from the right are things the AI found for you."

### Custom Skill Block Lifecycle

Same as identity blocks (fade from below). Custom skills are unique to the user, not externally sourced. Star badge distinguishes them from identity traits.

### Stagger Queue

When multiple blocks arrive in one turn (normal: 1-3 identity blocks + 0-2 matched skills):

**Ordering:**
1. Identity blocks render first (fade from below, 400ms apart)
2. Matched skills render second (slide from right, 400ms apart, 200ms gap after last identity block)
3. Custom skills render last (fade from below, 400ms apart)

**This creates a narrative:** "Here is who you are... and here is what you can do."

**Completion % updates AFTER all blocks in the batch render** (200ms delay after last item). The number tick-up is the punctuation mark at the end.

### Animation Timing (per turn)

**Turn with skill matches:**
```
t=0ms      AI text starts streaming
t=200ms    First text appears in chat
t=800ms    Text complete
t=900ms    Identity Block 1 materializes (from below)
t=1300ms   Identity Block 2 materializes
t=1700ms   [200ms gap between groups]
t=1900ms   Matched Skill 1 slides in (from right)
t=2300ms   Matched Skill 2 slides in
t=2500ms   Completion % ticks up
t=2700ms   Quick-reply chips slide in from bottom
```

**Identity-only turn:**
```
t=0ms      AI text starts streaming
t=200ms    First text appears
t=800ms    Text complete
t=900ms    Block 1 materializes
t=1300ms   Block 2 materializes
t=1700ms   Block 3 materializes
t=2100ms   Completion % ticks up
t=2300ms   Quick-reply chips slide in
```

---

## AI Thinking Indicator

No bouncing dots. Instead:

**Shimmer/scan effect on the identity card** while waiting. The card appears to be "searching" for the next trait. Card updates BEFORE the chat explanation — this makes it feel like genuine discovery, not just text generation.

**When checking skills.sh:** The shimmer concentrates in the "Skills (matched)" section — a subtle horizontal scan line. Signals "searching the registry."

---

## Completion Celebration (100%)

When the final block locks in:

1. Brief pause for anticipation (300ms)
2. Number ticks from 97% to 100% with acceleration
3. Gradient brightness pulse (200ms)
4. Shimmer wave across ALL blocks and skills (400ms)
5. Luminous border glow settles in
6. Footer updates with final counts

**No confetti. No modals. No toasts.** The card reaching full glow IS the celebration. Understated. Elegant. The user looks at their completed card and feels pride, not distraction.

---

## Layout Behavior

### Builder (Desktop)
- Split-pane: chat left, identity card right
- Chat is scrollable, full height
- Card is sticky, centered vertically, grows with content
- Minimal nav header

### Builder (Mobile)
- Card collapses to a mini bar above the chat
- Mini bar shows: completion %, 2-3 top traits, skill match count
- Tap to expand full card (slides down)
- Chat takes full screen when card is collapsed

### Landing Page
- Asymmetric split: copy left, completed card preview right
- The preview card shows BOTH identity blocks AND matched skills — communicates the dual nature immediately
- The card is the hero visual, not an illustration

---

## Chat Behavior

### Messages
- User messages: right-aligned
- AI messages: left-aligned
- Summary/reflection messages: visually distinct (subtle left border or tint) so user recognizes "this is a checkpoint, not a question"
- Streaming: blinking pipe `|` cursor while text streams

### Input
- Clean textarea, single-line default, expands with content
- Send button appears when text is entered
- Enter to send, Shift+Enter for newline
- **Disabled during AI response** — grayed out with subtle pulse. Prevents double-sends.

### Quick Replies in Chat
- Chips appear below the AI message, above the input
- Slide in from bottom with spring animation (200ms)
- After selection: selected chip stays highlighted, others fade out
- Input area visible but de-emphasized while chips are showing

---

## Key Interactions Summary

| Interaction | What Happens |
|-------------|-------------|
| Tap chip | Scale bounce → chip fills → block materializes on card |
| Type and send | Message appears → AI shimmer on card |
| Identity block arrives | Fades up from below (300ms spring) |
| Matched skill arrives | Slides in from right (350ms spring) — different direction = different source |
| "skills.sh" label appears | Fades in 200ms after skill settles |
| Block/skill confirmed | Scale pulse + solidify + glow (+ checkmark for matched skills) |
| New card section appears | Section header fades in → first block enters |
| Phase transition | Card shimmer + new section appears |
| 100% completion | Gradient pulse → shimmer wave → glow settle |
| Copy install command | Button flashes "Copied!" |

---

## Delight Principles

1. **Speed is delight.** Every interaction should feel FAST. Chips respond instantly. Blocks appear within 1 second of the answer. No waiting screens.

2. **Discovery, not data entry.** The user isn't filling out a form. They're watching the AI discover who they are. The card updates BEFORE the chat explanation — "oh it already figured that out!"

3. **Real skills, real credibility.** Seeing actual skills.sh skills on the card feels different from seeing abstract traits. It's "the AI found these for me" not "the AI made these up."

4. **Progressive reveal.** The card starts dormant and comes alive. Sections appear when relevant. The gradient intensifies. Everything earns its presence.

5. **The card IS the reward.** No celebration modal. No confetti explosion. The beautiful, fully-glowing card with your identity and matched skills IS the payoff. Look at what we built together.

6. **Momentum over accuracy.** Start at 15%. Quick-roll blocks appear before the first question. The user is never staring at an empty state. Always moving forward.

7. **Tap > Type.** Every question that CAN be a chip SHOULD be a chip. Free text is the exception (max 1-2 per session). The user's thumb does 90% of the work.
