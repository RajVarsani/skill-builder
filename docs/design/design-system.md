# Skill Builder — Design System

**Vibe:** Soft light gray canvas with beautiful warm gradient accents (pink, orange, peach, lavender). Clean modern typography. The UI is minimal and muted — light grays, whites, thin type — but the gradients bring warmth and life. The identity card on the right is NOT a resume — it's a gamified character card with minimal stats, like a collectible trading card or game profile.

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
| Warm gradient | Pink → orange → peach with white/lavender highlights. Used on the identity card background and as accent imagery. The signature visual element. |

No flat accent color. The gradient IS the accent.

## Typography

- **Font:** Inter or similar clean sans-serif
- **Display:** 36-56px, light or regular weight (NOT bold — elegant, not heavy)
- **Headings:** 20-28px, medium weight
- **Body:** 15px, regular
- **Labels:** 11-12px, medium, uppercase, tracked
- **Mono:** JetBrains Mono for code

Note the shift: display type is LIGHT weight, not bold. The reference uses thin/light large type — elegant, not punchy.

## Radius

Generous and soft.
- Cards/panels: `16-24px`
- Buttons: `full (pill-shaped)` for primary, `12px` for secondary
- Chips/pills: `9999px`

## Depth

Minimal. No heavy shadows. Cards are just white on the light gray background — the color difference is enough. Optional very subtle shadow on the main container card.

---

## The Identity Card — Gamified, Not Resume

The right panel shows a **collectible character card**, not a resume/document. Think:
- Trading card / game character profile
- The warm gradient as the card's background art
- User's name and avatar prominent
- A few minimal stats displayed as clean numbers (not paragraphs)
- Trait chips as small pills
- Skill levels as thin bars or radial gauges
- Overall completion % as a bold number
- Feels like unlocking achievements, not filling out a form
