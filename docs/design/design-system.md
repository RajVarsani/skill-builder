# Skill Builder — Design System

**Updated:** 2026-02-27

**Vibe:** Soft light gray canvas with beautiful warm gradient accents (pink, orange, peach, lavender). Clean modern typography. The UI is minimal and muted — light grays, whites, thin type — but the gradients bring warmth and life. The identity card is a gamified character card with building blocks that assemble in real-time.

**Design philosophy:** Building Blocks. Every answer = a block. Every block = a visual element. The card assembles piece by piece. "Unlocking" not "filling out."

**Reference mood:** GRDNT website. Soft neutrals + dreamy warm gradients. Elegant, modern, airy.

---

## Colors

Neutral base. Gradients are the color.

| Token | Role |
|-------|------|
| `#EEECEB` | Page background — warm light gray |
| `#FFFFFF` | Cards, surfaces |
| `#F5F3F1` | Nested/muted containers |
| `#111111` | Primary text |
| `#6B6B6B` | Secondary text, labels |
| `#A0A0A0` | Muted/placeholder text |
| Warm gradient | Pink → orange → peach with white/lavender highlights. The signature visual. |

No flat accent color. The gradient IS the accent.

## Typography

- **Font:** Geist Sans (clean, modern sans-serif)
- **Display:** 36-56px, light or regular weight (NOT bold — elegant, not heavy)
- **Headings:** 20-28px, medium weight
- **Body:** 15px, regular
- **Labels:** 11-12px, medium, uppercase, tracked
- **Mono:** Geist Mono for code / install commands

Display type is LIGHT weight. Elegant, not punchy.

## Radius

Generous and soft.
- Cards/panels: `16-24px`
- Buttons: `full (pill-shaped)` for primary, `12px` for secondary
- Chips/pills: `9999px`
- Identity blocks: `8-12px`

## Depth

Minimal. No heavy shadows. Cards are white on light gray — color difference is enough. Optional very subtle shadow on main container.

---

## Quick-Reply Chips

The primary interaction method. Most questions are answered by tapping chips, not typing.

**Layout:**
- Horizontal row, wrapping to 2 rows for 5-6 chips
- 3-5 chips per question (sweet spot: 4)
- Always include one slightly playful/creative option

**Sizing:**
- Min height: 40px
- Padding: 12px 20px
- Font: 14px, medium weight
- Border-radius: 9999px (full pill)
- Min tap target: 48x48px

**States:**
- Default: `bg-white border border-gray-200 text-text-primary`
- Hover: `bg-surface-muted border-gray-300`
- Pressed: Scale down 2% (50ms), spring back with overshoot (150ms)
- Selected: `bg-text-primary text-white` + checkmark fade-in (100ms)
- Disabled (after selection): fade to 40% opacity (200ms)

**Multi-select chips:**
- Selected chips get a checkmark, stay tappable
- Submit button appears after 1+ selections

**"Other..." chip:**
- Always last in row
- Slightly different style: dashed border
- Tap opens inline text input

---

## The Identity Card — Building Blocks

### Card Structure

The right panel shows a collectible character card with blocks assembling in real-time.

```
┌─────────────────────────────────┐
│         [warm gradient bg]       │
│                                  │
│  ┌──────┐                        │
│  │Avatar│  Name                   │
│  └──────┘  Role                   │
│                                   │
│         ╔══ 65% ══╗               │
│                                   │
│  ── Blocks ──                     │
│  [Pragmatic] [Direct] [Fast]     │
│  [Simplicity-first] [Ship fast]  │
│                                   │
│  ── Expertise ──                  │
│  React Arch  ████████░░  Expert   │
│  API Design  ██████░░░░  Senior   │
│                                   │
│  12 blocks discovered             │
└─────────────────────────────────┘
```

### Gradient Intensification = Progress

The card's gradient is the primary progress indicator. It intensifies as blocks fill:

| Completion | Gradient State |
|-----------|----------------|
| 0-15% | Muted, near-grayscale — dormant |
| 15-25% | Faint warm tint emerging |
| 25-50% | Soft visible gradient |
| 50-75% | Rich and vibrant |
| 75-95% | Nearly full luminous |
| 100% | Full glow — the celebration |

Start at 15% (endowed progress). Never show an empty card.

### Block Visual Lifecycle

Each identity block goes through 3 states:

#### 1. Materializing (entrance)
- **Animation:** Fade-in from below + scale from 0.7 to 1.0
- **Duration:** 300ms spring (stiffness: 200, damping: 20)
- **Visual:** Dashed border, 60% opacity, slight blur
- **CSS:** `border-dashed border-white/20 bg-white/10 text-white/60`

#### 2. Tentative (settled but unconfirmed)
- **Animation:** Opacity increases to 80%
- **Duration:** 200ms ease
- **Visual:** Thin solid border, medium opacity
- **CSS:** `border-solid border-white/25 bg-white/20 text-white/80`

#### 3. Confirmed (locked in)
- **Animation:** Scale pulse [1, 1.05, 1] + opacity to 100% + brief glow
- **Duration:** 300ms spring (stiffness: 300, damping: 12)
- **Visual:** Solid border, full opacity, subtle outer glow
- **CSS:** `border-solid border-white/30 bg-white/30 text-white shadow-[0_0_8px_rgba(255,255,255,0.15)]`

### Block Stagger Queue

When multiple blocks arrive in one turn (normal: 1-3 per turn), render them with staggered delay:

- **Delay between blocks:** 400ms
- **Creates "discovery" feel** — each trait appears individually
- **Completion % updates AFTER** all blocks in the batch render (200ms delay)

### Animation Timing (full turn)

```
t=0ms      AI text starts streaming to chat
t=200ms    First text appears
t=800ms    Text streaming complete
t=900ms    Block 1 materializes (300ms spring animation)
t=1200ms   Block 1 settled
t=1300ms   Block 2 materializes
t=1600ms   Block 2 settled
t=1700ms   Block 3 materializes
t=2000ms   Block 3 settled
t=2200ms   Completion % ticks up (number counter animation)
t=2400ms   Quick-reply chips slide in from bottom (200ms spring)
```

### AI Thinking Indicator

Instead of standard bouncing dots in the chat, show a **shimmer/scan effect on the identity card** while waiting. The card "searching" for the next trait. Card updates BEFORE the chat explanation — feels like genuine discovery.

### Completion Celebration (100%)

When the final block locks in:
1. Brief pause for anticipation (300ms)
2. Number ticks from 97% to 100% with acceleration
3. Gradient brightness pulse (200ms)
4. Shimmer wave across all blocks (400ms)
5. Luminous border glow settles in

No confetti. No modals. No toasts. The card reaching full glow IS the celebration.

---

## Chat Panel

### Message Bubbles
- **User:** Dark background, right-aligned, 14px
- **Assistant:** Light/transparent background, left-aligned, 15px
- **Summary messages:** Slightly distinct style — subtle left border or background tint
- **Streaming cursor:** Blinking pipe `|` while text streams

### Chat Input
- Clean textarea, single-line default, expands with content
- Send button: pill-shaped, appears when text is entered
- Enter to send, Shift+Enter for newline
- Disabled during AI response (grayed out with subtle pulse)

### Quick Replies in Chat
- Chips appear below the AI message, above the input
- Slide in from bottom with spring animation (200ms)
- After selection, selected chip stays highlighted, others fade
- Input area is still visible but de-emphasized while chips are showing

---

## Layout

### Builder (Desktop)
- Split-pane: `grid-cols-[1fr_380px]`
- Chat panel: left, scrollable, full height
- Identity card: right, sticky, centered vertically
- Minimal nav header: logo left, user avatar right

### Builder (Mobile)
- Identity card: collapsible panel above chat
- Tap to expand/collapse
- Shows mini version (just completion %, 2-3 top traits) when collapsed
- Full card slides down when expanded

### Landing Page
- Asymmetric split: copy left, gradient card preview right
- The preview card is the hero visual
- How-it-works: 4 steps in a clean grid

---

## Key Interactions

| Interaction | Feedback |
|-------------|----------|
| Tap quick-reply chip | Scale bounce + chip fills + block materializes on card |
| Type and send message | Message appears + AI typing shimmer on card |
| Block materializes | Fade+slide in from below, 300ms spring |
| Block confirmed | Scale pulse + opacity solidify + glow |
| Phase transition | Subtle card shimmer + new section appears |
| Completion hits 100% | Gradient pulse + shimmer wave + glow settle |
| Copy install command | Button flashes "Copied!" + subtle confetti (just the button) |
