# Prompts: Skill Builder UI Screens

For Gemini. Narrative style, real content, creative freedom on composition.

---

## Gemini Prompting Notes

- Narrative > keywords. Describe like you're briefing a designer.
- Real content, not placeholders.
- Positive framing — describe what IS there.
- Iterate by changing one variable at a time in follow-ups.

---

## Screen 1: Main Builder — Conversation + Identity Card

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing the main interface of "Skill Builder" — a product where an AI interviews professionals and builds a gamified identity card of them in real-time.

The page sits on a soft warm light-gray background (#EEECEB). The main content area is a large white rounded card containing a split-pane layout. On the left, an AI conversation is happening. On the right, a gamified identity card is being built live.

The LEFT side shows a clean chat. The AI is asking thoughtful questions about the user's engineering approach, and the user is responding with answers about preferring React with TypeScript, simplicity over abstraction, and fast shipping. About 4-5 messages are visible. One special AI message is a summary reflection — "Here's what I'm picking up: You're a pragmatic fullstack engineer who leans toward simplicity. You prefer React + TypeScript, think most state management is overkill, and value shipping speed over perfection." This summary looks visually distinct. At the bottom is a clean text input.

The RIGHT side shows a gamified "Identity Card" — NOT a resume or document. Think of it like a collectible character card or game profile. The card has a beautiful warm gradient background — soft pinks flowing into peach, orange, and hints of lavender, with a bright white glow in the center (exactly like the GRDNT website aesthetic — dreamy, warm, luminous gradients). On top of this gradient card:
- The user's name "Raj Varsani" in clean white type
- A small avatar
- A bold completion stat like "65%" in large display type — how much of their identity has been discovered
- A few minimal trait pills: "Pragmatic" "Direct" "Simplicity-first"
- 2-3 tiny stat bars or radial indicators for top skills (React, API Design, Code Review) — minimal, not detailed
- A small "12 traits discovered" or similar count

The card should feel like a game achievement card being unlocked — minimal stats, beautiful gradient art, not a wall of text. It's about 65% complete and feels alive, still being filled in.

The top has a minimal navigation with "Skill Builder" wordmark on the left and a small user avatar on the right. Buttons are pill-shaped with thin borders. Typography is clean sans-serif (Inter), with display text in light/regular weight — elegant, not heavy. The overall palette is soft warm neutrals with the gradient as the only real color. Minimal, modern, airy.
```

---

## Screen 2: Domain Selection (Phase 1 — Start)

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing the opening state of "Skill Builder."

Soft warm light-gray background (#EEECEB), main content in a large white rounded card, split-pane layout. Same warm gradient visual style as GRDNT — soft neutrals with dreamy pink/peach/orange gradients as accent.

The LEFT chat shows the AI greeting: "Let's discover who you are professionally. I'll ask questions, analyze your work, and build your identity card. First — what domains define your expertise?" Below, selectable domain pills: Engineering, Design, Product, Data / Analytics, Marketing, Operations. "Engineering" and "Product" are selected (filled dark with white text), others are outlined/light.

The RIGHT side shows the identity card in its empty state — the beautiful warm gradient background is there but muted/faded, like it hasn't powered up yet. Just the user's name "Raj Varsani" in white type, an avatar, and a bold "0%" in large display text. A few ghost placeholder dots where trait pills will eventually appear. The card feels dormant — beautiful but waiting to come alive.

Clean sans-serif typography, pill-shaped buttons, minimal navigation. Elegant and modern.
```

---

## Screen 3: Artifact Analysis (Phase 3)

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing "Skill Builder" during artifact analysis — the AI is reading the user's actual code.

Same visual style — soft warm gray background, white rounded main card, warm gradient identity card on the right.

The LEFT chat shows the AI: "You mentioned strong opinions about API design. Got a repo I can look at?" The user pasted github.com/rajvarsani/api-framework. Below, a clean card shows the analysis in progress — file paths in monospace (package.json, src/routes/index.ts, tsconfig.json) with a thin progress bar. Then the AI responds: "I noticed you use barrel exports, co-located test files, and enforce early returns. Adding to your card."

The RIGHT identity card is more alive now — the gradient is brighter and more vibrant. The completion stat reads something like "78%". More trait pills are filled in. A couple items have a small "verified" mark — confirmed from real code. Skill bars for React Architecture, API Design, and Code Review show varying levels. A count like "18 traits discovered" is visible. The card is noticeably more complete than the Phase 1 state but not finished.

Clean, minimal, warm gradient energy. Modern sans-serif type.
```

---

## Screen 4: Roleplay Testing (Phase 4)

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing "Skill Builder" in roleplay testing mode — the AI is responding AS the user's generated skill.

Same visual style — warm gray background, white rounded card, warm gradient identity card.

The LEFT chat has a subtle mode indicator — a small label or banner showing "Roleplay Mode — Testing Your Skill." The user asks: "How would you approach reviewing a PR that rewrites the auth system?" The AI responds in the user's voice: "First thing I'd check is whether this was scoped properly. If it's already done, I'd focus on API surface area and session handling, skip nitpicking names, and make sure there are integration tests for the happy path and token expiry."

The RIGHT identity card is nearly complete — the gradient is at full vibrancy, rich and luminous. The stat reads "94%". All trait pills are filled/confirmed. Skill bars are full. The card feels complete and polished — like a finished collectible card. It glows with warmth.

The roleplay mode has a gentle visual distinction from normal chat but isn't jarring. Clean, modern, minimal.
```

---

## Screen 5: Publish & Celebration (Phase 4c)

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing "Skill Builder" at the moment of publishing — the identity skill is live.

Same warm visual style but the layout shifts from split-pane to a centered celebration layout on the warm gray background.

A large elegant heading in light-weight display type reads "Your Identity is Live." Below, the install command sits in a dark rounded card with monospace white text: "npx skills add skillbuilder-community/acting-as-raj" with a copy button.

The completed Identity Card is displayed prominently and large — fully vibrant gradient, "100%" stat, all traits confirmed, all skills maxed. The card is the hero of the page — beautiful, complete, collectible. Below it, pill-shaped share buttons and a "Publish to My GitHub" option.

The celebration is elegant and warm — the gradient card at full glow IS the celebration. No confetti, no flashy effects. Just the beautiful finished card and clean typography.
```

---

## Screen 6: Landing Page

```
Create a high-fidelity web app UI mockup for a desktop screen (1440x900) showing the landing page of "Skill Builder."

Soft warm light-gray background (#EEECEB) with a large white rounded container card. On the left side, a bold headline in elegant light-weight display type: "Make AI Think Like You" or "Build Your Professional Identity." A short subtitle explains the concept — an AI interviews you, analyzes your work, and generates an installable skill. A pill-shaped "Build Your Skill →" CTA button.

On the right side, a large beautiful warm gradient panel (pink → peach → orange → lavender, luminous) showing a preview of a completed identity card — a sample character card with a name, completion percentage, trait pills, and skill bars. This gradient visual is the hero imagery of the page — the same dreamy GRDNT-style gradient that makes the product feel warm and premium.

Below the hero, a section showing how it works: Conversation → Analysis → Skill Generation → Publish. Clean, minimal cards or icons for each step. Maybe show the install command (npx skills add ...) in a small dark code card.

Navigation at the top: "Skill Builder" wordmark, a few links, and a dark pill-shaped "Get started" button. Clean sans-serif typography, elegant light-weight headings, warm and modern.
```
