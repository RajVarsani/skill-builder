# GTM: Agent Identity Launch

**Created:** 2026-02-28
**Status:** Approved
**Approach:** A — "Agent Identity"

---

## Strategy

**Core narrative:** In the agent era, your LinkedIn profile is irrelevant. Agents don't read PDFs — they install skills. Skill Builder is the first tool that builds your agent-native identity.

**Angle:** "Agents need identity. Build yours."
**Tone:** Hype + technical (Vercel launch energy)
**Wave:** Agents replacing profiles — MCP, tool use, agent-native identity
**Platforms:** X, LinkedIn, Reddit (r/ClaudeAI, r/programming), Hacker News

---

## Landing Page Copy Changes

### Hero

**Before:**
> BUILD YOUR / EXPERTISE / BLOCK BY BLOCK
> "An AI interviews you about what you know. It assembles your skills into an installable identity — pixel by pixel."

**After:**
> AGENTS DON'T READ / RESUMES / THEY INSTALL SKILLS
> "Build your AI persona in 3 minutes. An agent interviews you, matches your expertise against 75K+ skills, and publishes an installable identity — block by block."

### Steps

| # | Before | After |
|---|--------|-------|
| 01 | "Pick Your Domains" — Select the areas you work in. Frontend, backend, design, data — you choose the starting blocks. | **"Choose Your Class"** — Select your domains. Engineering, design, data, product — every persona starts with a class. |
| 02 | "AI Deep Dive" — An AI interviewer asks targeted questions about your experience, tools, and problem-solving style. | **"3-Minute Interview"** — An AI agent asks rapid-fire questions. It infers your expertise, tools, and decision-making style in real time. |
| 03 | "Prove Your Skills" — Review matched skills from 75K+ in the registry. Confirm, remove, or let the AI generate custom ones. | **"Match 75K+ Skills"** — Your answers are matched against the entire skills.sh registry. Confirm, reject, or let it generate custom ones. |
| 04 | "Ship Your Identity" — Get an installable SKILL.md file. Share it, add it to your repo, let Claude know who you are. | **"Publish & Install"** — Get a SKILL.md file. Anyone can run `skills install you`. Your persona is now part of every AI workflow. |

### CTA Section

**Before:**
> READY TO BUILD / YOUR BLOCKS?
> "Your expertise deserves to be structured, portable, and installable. Start the interview."

**After:**
> YOUR PERSONA / IS NOT A PDF
> "In the agent era, identity is code. Build yours in 3 minutes. Make yourself installable."

Second button: "How It Works" → **"See Example Persona"**

### Nav

CTA button: "Build Yours" → **"Build Your Persona"**

---

## Sign-In Page Copy Changes

**Subtitle before:** "Build your professional identity. Let AI discover who you are — block by block."
**Subtitle after:** "Build your AI persona. 3 minutes. 75K+ skills matched. One install command."

**Footer before:** "No credit card. No setup. Just a 3-minute conversation."
**Footer after:** "No credit card. No setup. Just a conversation with an agent."

---

## Success Page Copy Changes

**Heading before:** "Your Skill is Live"
**Heading after:** "You're Installable"

**Body before:** "Your professional identity has been encoded into an installable skill."
**Body after:** "Your persona is live. {N} blocks discovered, {N} skills matched from the registry. Anyone with Claude Code can now install you."

---

## Share Text

**X share (pre-filled) before:** "I just built my professional identity skill: {skillName}"

**X share after:**
```
I just made myself installable.

skills install {username}

{N} identity blocks. {N} skills matched from 75K+ in the registry.

Build yours:
```

---

## Social Media Content

### X/Twitter Thread

**Post 1 (hook):**
> Agents don't read resumes. They install skills.
>
> I built a tool that interviews you for 3 minutes, matches your expertise against 75K+ real skills, and publishes your persona as an installable SKILL.md.
>
> `skills install {you}`
>
> [screenshot/GIF of card building up]

**Post 2 (how it works):**
> How it works:
>
> 1. An AI agent interviews you — rapid-fire questions about your stack, your decisions, your style
> 2. It matches your answers against the entire skills.sh registry (75,486 skills)
> 3. It generates a SKILL.md — your persona, installable by any AI tool
>
> The whole thing takes 3 minutes.

**Post 3 (tech):**
> The tech:
>
> - Claude tool_use with 5 fire-and-forget tools for real-time identity extraction
> - In-memory index of 75K+ skills (~7.5MB, sub-ms search)
> - SSE streaming — you watch your identity card build block by block
> - Bun + Hono + React + Zustand
>
> Open source. Built in a weekend.

**Post 4 (CTA):**
> In the agent era, your identity is code.
>
> MCP servers don't check LinkedIn. Claude Code doesn't care about your resume. But `skills install {username}` — that works.
>
> Build your persona: [link]

### LinkedIn

> I just made myself installable.
>
> `skills install abhishek`
>
> In the age of AI agents, your professional identity isn't a PDF someone skims — it's a skill file an agent installs. I built Skill Builder to test this idea.
>
> How it works: An AI interviews you for 3 minutes. It asks about your stack, your decision-making, your expertise. Behind the scenes, it matches you against 75K+ skills from the skills.sh registry and generates a SKILL.md — a machine-readable persona.
>
> The result: anyone running Claude Code can install your expertise. Your preferences. Your style. Your tools.
>
> This isn't a resume replacement. It's an identity primitive for the agent era.
>
> Try it: [link]
>
> #AI #ClaudeCode #DeveloperTools #AgentNative

### Reddit (r/ClaudeAI, r/programming)

**Title:** I built a tool that turns a 3-minute AI interview into an installable persona (`skills install {you}`)

**Body:**

Hey all — I built something I've been thinking about for a while.

The idea: in the agent era, your identity should be machine-readable. Not a PDF. Not a LinkedIn page. A skill file that any AI tool can install.

**What Skill Builder does:**
1. An AI agent interviews you for ~3 minutes — rapid-fire questions about your stack, decisions, style
2. Behind the scenes it matches your answers against the entire skills.sh registry (75,486 skills)
3. It generates a SKILL.md — an installable persona file following Anthropic's skill format
4. You publish it. Anyone can run `skills install {username}`.

**The tech:**
- Claude API with `tool_use` — 5 tools, 4 fire-and-forget (identity extraction, chips, phase transitions) + 1 real tool (skill matching against the 75K index)
- In-memory skill index loaded at startup (~7.5MB, sub-millisecond search using token overlap + Jaccard similarity)
- SSE streaming so you watch your identity card build up block by block in real-time
- Stack: Bun monorepo, Hono backend, React 19 + Zustand + Framer Motion frontend

The whole thing is open source. Feedback welcome.

[link]

### Hacker News

**Title:** Show HN: Skill Builder – AI interviews you and publishes an installable persona skill

**Body:**

An AI agent interviews you for 3 minutes about your expertise, tools, and decision-making style. It matches your answers against 75K+ skills from the skills.sh registry and publishes an installable SKILL.md — your persona, as code.

Anyone can run `skills install {username}` to load your expertise into their AI tools.

Tech: Bun + Hono + React 19. Claude tool_use with 5 tools (4 fire-and-forget for identity extraction, 1 real for skill matching). In-memory index of 75K skills with sub-ms search. SSE streaming for real-time card rendering.

The thesis: in the agent era, professional identity is code, not a PDF. Agents don't check LinkedIn — they install skills.

[link]
