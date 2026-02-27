# Skill Builder — Handoff Summary

## What is this project?

An AI-powered web app that interviews professionals about their expertise, builds an identity profile, matches relevant skills from the 75k+ skills.sh directory, and generates an installable `SKILL.md` file that can be published to GitHub.

**Stack:** Bun monorepo — `apps/web` (React 19 + Vite + Tailwind v4), `apps/api` (Hono + Bun), `packages/shared` (types)

---

## How to run

```bash
bun install
bun run dev          # Starts both FE (5173) + BE (3000)
bun run typecheck    # Verify no TS errors
```

If ports are busy:
```bash
lsof -ti:3000,5173 | xargs kill -9
```

---

## Current state

### All 12 implementation phases are COMPLETE. Recent work has been polish/bug fixes:

**Fixed bugs:**
- **Infinite re-render loop (critical):** `useConversation()` hook was using `const store = useConversationStore()` as a `useCallback` dependency — new ref every render → effects looped. Fixed by using `useConversationStore.getState()` inside callbacks with empty deps `[]`.
- **Double "Hello" on start fresh:** Replaced effect-based approach with `useRef` guard
- **SSE parser dropping events:** Fixed buffer flush on stream end
- **Phase transition showing both panels:** Fixed conditional rendering
- **Various UI issues:** margins, cursor pointers, responsive layout, card overflow

**Features added:**
- Pixel loader animation (bouncing squares) during chat streaming
- **Tool activity indicators** — shows "Searching skills registry...", "Discovering identity trait..." etc. when AI processes tool calls (new SSE event `tool_activity`)
- Markdown rendering for chat messages (`react-markdown`)
- Start Fresh button + logout dropdown in Nav
- Logo click → home navigation
- Pixelated emoji icons via `pixelarticons` npm package (replaces system emojis in domain chips)
- Responsive landing page with mobile hamburger menu
- Collapsible card sections (scroll instead of expanding)
- Custom font: JapanRamen (display), GeistPixel-Circle (body)

### Uncommitted changes (IMPORTANT — commit these first!)

There are ~25 modified files that haven't been committed. Run:
```bash
git add -A
git commit -m "feat: polish UI — fix infinite loop, add tool activity indicators, pixel icons, responsive landing"
```

Key uncommitted files:
- `apps/web/src/hooks/use-conversation.ts` — **critical fix** (stable callbacks)
- `apps/web/src/pages/Builder.tsx` — **critical fix** (effect deps)
- `apps/web/src/lib/store.ts` — added `toolActivity` state
- `apps/api/src/agent/conversation-agent.ts` — added `tool_activity` SSE event
- `apps/web/src/components/icons/PixelIcon.tsx` — **new file** (pixel emoji mapping)
- `apps/web/public/fonts/JapanRamen.otf` — **new file**

---

## Architecture overview

### Conversation flow
```
User opens /builder
  → GET /conversations/active (loads existing or creates new)
  → sendMessage('Hello') if no messages exist
  → AI responds via SSE streaming
  → Tool calls: add_identity_block, match_skills, offer_quick_replies, etc.
  → Events update Zustand store → UI updates in real-time
  → Phase transitions: domain_discovery → rapid_profiling → review → published
```

### Publish flow
```
User clicks "Publish"
  → POST /conversations/{id}/publish
  → generateSkillPackage() — Claude generates SKILL.md + per-skill overrides
  → publishToGitHub() — creates repo + uploads files via GitHub API
  → PublishedSkill saved to MongoDB
  → Navigate to /success/{id}
```

### Key files
| File | What it does |
|------|-------------|
| `apps/api/src/agent/conversation-agent.ts` | Claude tool_use loop, SSE event generator |
| `apps/api/src/agent/system-prompts.ts` | Per-phase system prompts |
| `apps/api/src/agent/skill-matching-engine.ts` | 75k skills search (Jaccard similarity) |
| `apps/api/src/generator/skill-generator.ts` | SKILL.md file assembly |
| `apps/api/src/generator/github-publisher.ts` | GitHub API repo creation + file upload |
| `apps/api/src/routes/conversations.ts` | SSE streaming route, CRUD, reset |
| `apps/api/src/routes/skills.ts` | Publish endpoint, skill retrieval |
| `apps/web/src/hooks/use-conversation.ts` | SSE client, store updates |
| `apps/web/src/lib/store.ts` | Zustand store (messages, blocks, skills, phase, toolActivity) |
| `apps/web/src/pages/Builder.tsx` | Main builder page (chat + card split pane) |
| `apps/web/src/components/card/IdentityCard.tsx` | Animated identity card |
| `apps/web/src/components/chat/StreamingMessage.tsx` | Streaming text + tool activity indicators |

---

## What's remaining

### 1. GitHub OAuth (BLOCKING for real publishing)

**Status:** Code infrastructure exists but credentials are not configured.

**What's needed:**
- Create a GitHub OAuth App at: Settings → Developer settings → OAuth Apps → New
- **Callback URL:** `http://localhost:3000/api/auth/github/callback`
- Add credentials to `apps/api/.env`:
  ```
  GITHUB_CLIENT_ID=your-client-id
  GITHUB_CLIENT_SECRET=your-client-secret
  ```
- Add to `apps/web/.env`:
  ```
  VITE_GITHUB_CLIENT_ID=your-client-id
  ```

**What's already built:**
- `apps/api/src/auth/` has GitHub OAuth route handlers
- `apps/api/src/generator/github-publisher.ts` has full GitHub API integration (repo creation, file upload)
- Without a token, publishing falls back to mock URLs (`skill-builder-platform` org)

**What needs wiring:**
- The GitHub OAuth callback needs to store `githubAccessToken` on the User model
- The publish flow needs to pass the user's GitHub token to `publishToGitHub()`
- May need to verify the OAuth scopes include `repo` for creating repos

### 2. skills.sh Directory

**No action needed!** skills.sh auto-indexes skills via CLI telemetry. Once a SKILL.md is in a GitHub repo and users install it with `npx skills add <owner>/<repo>`, it appears on the leaderboard automatically.

### 3. Nice-to-haves (not blocking)
- App naming (was discussed, "SKILL.SH" was top pick but no change made yet)
- The install command format needs verification: should it be `npx skills add <owner>/<repo>` (skills.sh standard) or `npx skills install <slug>` (current)
- Public skill gallery page (endpoint exists but no frontend page)
- Mobile responsive builder page (landing is responsive, builder is not)

---

## Environment variables

### `apps/api/.env`
```
MONGODB_URI=mongodb://localhost:27017/skill_builder
ANTHROPIC_API_KEY=sk-ant-...     # REQUIRED — for conversation AI + skill generation
GOOGLE_CLIENT_ID=...              # For Google OAuth sign-in
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=                 # EMPTY — needs GitHub OAuth App
GITHUB_CLIENT_SECRET=             # EMPTY — needs GitHub OAuth App
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### `apps/web/.env`
```
VITE_GOOGLE_CLIENT_ID=151982860698-...
VITE_GITHUB_CLIENT_ID=            # EMPTY — needs GitHub OAuth App
```

---

## Design system

- **Fonts:** JapanRamen (display/headings, uppercase), GeistPixel-Circle (body/mono)
- **Colors:** page=#D4C8B0, surface=#1A1008, accent=#E04A2F, cream=#F0E6D4, muted=#A89880
- **Style:** Retro/pixel/arcade aesthetic, chunky borders, no soft gradients
- **Icons:** `pixelarticons` package for pixel-art SVG icons in domain chips

---

## Known gotchas

1. **Dev server ports:** Vite auto-increments ports if 5173 is busy. Kill orphan processes first.
2. **MongoDB:** Must be running locally on default port 27017.
3. **Anthropic API key:** Required for both conversation (claude-sonnet-4-6) and skill generation.
4. **Dataset:** 76 JSON chunks in `/dataset/` — loaded at API startup, takes ~2 seconds.
5. **SSE streaming:** Custom parser in `apps/web/src/lib/sse.ts` — had buffer edge cases, now fixed.
