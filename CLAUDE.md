# Skill Builder — Project Conventions

## Commands

```bash
bun install              # Install all dependencies
bun run dev              # Start both FE + BE in dev mode
bun run dev:web          # Start FE only (Vite)
bun run dev:api          # Start BE only (Hono)
bun run typecheck        # TypeScript check across all packages
bun run lint             # ESLint across all packages
bun run build            # Build all packages
```

## Project Structure

Bun monorepo with workspaces: `apps/web` (React + Vite), `apps/api` (Hono + Bun), `packages/shared` (types).

## Tech Stack

- **Runtime:** Bun
- **BE:** Hono, Mongoose (MongoDB), Anthropic SDK, jose (JWT)
- **FE:** React 19, Vite, Tailwind CSS v4, Radix UI, Framer Motion, React Router v7, Zustand
- **Fonts:** Archivo Black (display), Inter (body), JetBrains Mono (code)

## Core Principles

1. **Keep it simple.** No over-engineering. If the docs don't require it, don't build it.
2. **Files < 200 lines.** Split when a file exceeds this. Components, hooks, and utilities should be focused.
3. **Types in shared package.** SSE events, block types, phase types, API contracts — all in `packages/shared/src/types.ts`.
4. **No barrel exports.** Import directly from the file, not through index.ts re-exports.
5. **Colocation.** Component styles, types, and helpers live next to the component.

## TypeScript

- Strict mode everywhere
- Prefer `interface` for object shapes, `type` for unions/intersections
- Inline types for function params when used once. Extract to shared when used across files.
- No `any` — use `unknown` and narrow.

## Components

- Radix UI for accessible primitives (Dialog, Tooltip, etc.)
- Tailwind for all styling — no CSS files, no styled-components
- Framer Motion for animations (blocks, card, chips)
- Component naming: PascalCase files, one component per file

## State Management

- **Zustand** for conversation state (messages, blocks, matched skills, phase, completion)
- Keep stores minimal — derive computed values in components
- No global state for UI-only concerns (use local useState)

## API Layer

- Hono routes in `apps/api/src/routes/`
- Auth middleware on protected routes
- SSE for conversation streaming (not WebSocket)
- MongoDB via Mongoose models in `apps/api/src/db/models/`

## Design

- Retro/pixel/arcade aesthetic (NOT soft gradients)
- Archivo Black for display headings (uppercase)
- Dark card backgrounds, warm beige page, red/coral accents
- Reference Paper UI designs via node IDs in PLAN.md

## Phase Workflow

Use `/phase-start` and `/phase-end` skills to manage implementation phases.
Plan tracked in `PLAN.md`, execution in `EXECUTION.md`.

## Git

- Commit after each logical unit of work
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`
- Don't commit `.env`, `node_modules/`, build artifacts
