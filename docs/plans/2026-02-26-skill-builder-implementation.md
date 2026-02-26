# Skill Builder v1 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full Skill Builder web platform — a conversational AI that interviews professionals, builds a gamified identity card in real-time, and generates an installable persona skill package.

**Architecture:** Next.js frontend (App Router) with a separate Hono backend service. The backend orchestrates a 4-phase conversation with Claude, maintains an identity model, and streams updates via SSE. PostgreSQL for persistence. The frontend renders a split-pane chat + identity card UI with Framer Motion animations.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, Hono, Anthropic SDK, PostgreSQL (Drizzle ORM), Google/GitHub OAuth, Geist + JetBrains Mono fonts.

---

## Phase 1: Project Scaffolding & Foundation

### Task 1: Initialize monorepo structure

**Files:**
- Create: `apps/web/` (Next.js frontend)
- Create: `apps/api/` (Hono backend)
- Create: `packages/shared/` (shared types)
- Modify: `package.json` (root workspace config)

**Step 1: Set up pnpm workspace**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Update root `package.json`:
```json
{
  "name": "skill-builder",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build": "pnpm -r build",
    "scrape-skills": "node scripts/scrape-skills.mjs"
  },
  "packageManager": "pnpm@10.11.0",
  "dependencies": {
    "axios": "^1.13.5"
  }
}
```

**Step 2: Scaffold Next.js frontend**

Run: `pnpm create next-app apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm`

Then update `apps/web/package.json` name to `"web"`.

**Step 3: Scaffold Hono backend**

Create `apps/api/package.json`:
```json
{
  "name": "api",
  "version": "0.0.1",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsx src/index.ts"
  },
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.13.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

Create `apps/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true,
    "paths": {
      "@shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

Create `apps/api/src/index.ts`:
```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})

export default app
```

**Step 4: Create shared types package**

Create `packages/shared/package.json`:
```json
{
  "name": "@skill-builder/shared",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Create `packages/shared/src/index.ts`:
```typescript
export * from './types'
```

Create `packages/shared/src/types.ts`:
```typescript
// Phase types
export type Phase =
  | { type: 'domain_discovery' }
  | { type: 'deep_discovery'; domains: string[]; questionCount: number }
  | { type: 'artifact_collection'; pendingArtifacts: string[] }
  | { type: 'skill_assembly'; subStep: 'proposal' | 'roleplay' | 'publish' }

// Identity model
export interface PersonalityTrait {
  label: string
  confidence: 'low' | 'medium' | 'high'
  source: 'inferred' | 'confirmed' | 'artifact'
}

export interface IdentityModel {
  name: string
  avatar?: string
  role?: string
  domains: string[]

  personality: {
    traits: PersonalityTrait[]
    values: Array<{ label: string; priority: number; reason?: string }>
    riskTolerance?: string
    conflictStyle?: string
  }

  communication: {
    tone?: string
    formality?: string
    feedbackStyle?: string
    vocabularyPatterns?: string[]
  }

  decisionPatterns: {
    defaultHeuristic?: string
    consistentlyRejects?: string[]
    consistentlyPrioritizes?: string[]
  }

  expertise: Array<{
    domain: string
    depth: 'beginner' | 'proficient' | 'advanced' | 'expert'
    subSkills: string[]
    tools: string[]
    opinions: string[]
  }>

  artifacts: Array<{
    type: 'github_repo' | 'github_pr' | 'url' | 'upload' | 'text'
    source: string
    insights: string[]
  }>

  subSkills: {
    overrides: Array<{ baseSkillName: string; customizations: string[] }>
    custom: Array<{ name: string; description: string; content?: string }>
  }

  completionPercent: number
}

// SSE event types
export type IdentityUpdate =
  | { type: 'personality_trait_added'; trait: PersonalityTrait }
  | { type: 'personality_trait_confirmed'; traitLabel: string }
  | { type: 'domain_added'; domain: { name: string; depth: string } }
  | { type: 'communication_updated'; field: string; value: string }
  | { type: 'decision_pattern_added'; pattern: { kind: string; value: string } }
  | { type: 'sub_skill_proposed'; skill: { name: string; type: 'override' | 'custom' } }
  | { type: 'sub_skill_confirmed'; skillName: string }
  | { type: 'artifact_insight'; insight: string }
  | { type: 'completion_updated'; percent: number }
  | { type: 'full_model_sync'; model: IdentityModel }

export type SSEEvent =
  | { event: 'message_chunk'; data: string }
  | { event: 'identity_update'; data: IdentityUpdate }
  | { event: 'phase_change'; data: { phase: Phase } }
  | { event: 'artifact_request'; data: { artifactType: string; prompt: string } }
  | { event: 'done'; data: {} }

// API types
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  phase: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

// Domain options
export const DOMAINS = [
  'Engineering',
  'Design',
  'Product',
  'Data / Analytics',
  'Marketing',
  'Operations',
] as const

export type Domain = (typeof DOMAINS)[number]
```

**Step 5: Install dependencies and verify**

Run: `pnpm install`
Run: `pnpm dev:api` — verify health check responds at `http://localhost:3001/health`
Run: `pnpm dev:web` — verify Next.js starts at `http://localhost:3000`

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo with Next.js frontend, Hono backend, shared types"
```

---

### Task 2: Configure Tailwind + Design System tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/lib/fonts.ts`

**Step 1: Install fonts**

Run in `apps/web/`: `pnpm add geist`

Create `apps/web/src/lib/fonts.ts`:
```typescript
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const fontSans = GeistSans
export const fontMono = GeistMono
```

**Step 2: Configure globals.css with design tokens**

Replace `apps/web/src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-canvas: #EEECEB;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F5F3F1;
  --color-text-primary: #111111;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #A0A0A0;

  --font-sans: 'Geist Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;

  --radius-card: 1.25rem;
  --radius-pill: 9999px;
  --radius-button: 0.75rem;
}

body {
  background-color: var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Step 3: Update root layout**

Replace `apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { fontSans } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Skill Builder',
  description: 'Create your digital professional identity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fontSans.className}>
      <body className="min-h-[100dvh]">{children}</body>
    </html>
  )
}
```

**Step 4: Verify dev server renders with correct font + background**

Run: `pnpm dev:web` — page should show warm gray (#EEECEB) background with Geist font.

**Step 5: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/app/layout.tsx apps/web/src/lib/fonts.ts
git commit -m "feat: configure design system tokens — Geist font, warm gray canvas, custom radii"
```

---

### Task 3: Database schema + Drizzle ORM setup

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/.env.example`

**Step 1: Install database dependencies**

Run in `apps/api/`:
```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

**Step 2: Create .env.example**

Create `apps/api/.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skill_builder
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

**Step 3: Define database schema**

Create `apps/api/src/db/schema.ts`:
```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  githubId: text('github_id').unique(),
  githubAccessToken: text('github_access_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  phase: text('phase').notNull().default('domain_discovery'),
  identityModel: jsonb('identity_model').notNull().default('{}'),
  domainHints: jsonb('domain_hints'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  identityModelDelta: jsonb('identity_model_delta'),
  phase: text('phase').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const publishedSkills = pgTable('published_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  skillName: text('skill_name').notNull(),
  githubRepoUrl: text('github_repo_url').notNull(),
  githubRepoOwner: text('github_repo_owner').notNull(),
  installCommand: text('install_command').notNull(),
  identityModel: jsonb('identity_model').notNull(),
  skillFiles: jsonb('skill_files').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
})

export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  type: text('type').notNull(),
  source: text('source').notNull(),
  analysis: jsonb('analysis'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```

**Step 4: Create DB connection**

Create `apps/api/src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

**Step 5: Create Drizzle config**

Create `apps/api/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 6: Generate initial migration**

Run in `apps/api/`: `pnpm drizzle-kit generate`

**Step 7: Commit**

```bash
git add apps/api/src/db/ apps/api/drizzle.config.ts apps/api/.env.example
git commit -m "feat: add database schema with Drizzle ORM — users, conversations, messages, skills, artifacts"
```

---

### Task 4: Authentication (Google + GitHub OAuth)

**Files:**
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/lib/jwt.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Install auth dependencies**

Run in `apps/api/`:
```bash
pnpm add jose
```

**Step 2: Create JWT utilities**

Create `apps/api/src/lib/jwt.ts`:
```typescript
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as { userId: string; email: string }
}
```

**Step 3: Create auth middleware**

Create `apps/api/src/middleware/auth.ts`:
```typescript
import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../lib/jwt'

type AuthEnv = {
  Variables: {
    userId: string
    email: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    c.set('userId', payload.userId)
    c.set('email', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
```

**Step 4: Create auth routes**

Create `apps/api/src/routes/auth.ts`:
```typescript
import { Hono } from 'hono'
import { db } from '../db'
import { users } from '../db/schema'
import { signToken } from '../lib/jwt'
import { eq } from 'drizzle-orm'

const auth = new Hono()

// Google OAuth callback
auth.post('/google', async (c) => {
  const { credential } = await c.req.json()

  // Verify Google ID token
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
  if (!res.ok) return c.json({ error: 'Invalid Google token' }, 401)

  const googleUser = await res.json() as {
    sub: string; email: string; name: string; picture: string
  }

  // Upsert user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleUser.sub))
    .limit(1)

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleId: googleUser.sub,
      })
      .returning()
  }

  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } })
})

// GitHub OAuth callback
auth.post('/github', async (c) => {
  const { code } = await c.req.json()

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token: string }

  // Get GitHub user
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const githubUser = await userRes.json() as {
    id: number; login: string; name: string; avatar_url: string; email: string
  }

  // Upsert user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubId, String(githubUser.id)))
    .limit(1)

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: githubUser.email || `${githubUser.login}@github`,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
        githubId: String(githubUser.id),
        githubAccessToken: tokenData.access_token,
      })
      .returning()
  } else {
    await db
      .update(users)
      .set({ githubAccessToken: tokenData.access_token })
      .where(eq(users.id, user.id))
  }

  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } })
})

// Connect GitHub to existing account (for publishing)
auth.post('/github/connect', async (c) => {
  // Uses auth middleware — userId already set
  const userId = c.get('userId' as never) as string
  const { code } = await c.req.json()

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token: string }

  await db
    .update(users)
    .set({ githubAccessToken: tokenData.access_token })
    .where(eq(users.id, userId))

  return c.json({ connected: true })
})

// Get current user
auth.get('/me', async (c) => {
  const userId = c.get('userId' as never) as string
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
})

export default auth
```

**Step 5: Register routes in main app**

Update `apps/api/src/index.ts` to import and mount auth routes:
```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config'
import auth from './routes/auth'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/auth', auth)

// Protected routes will be added here
// app.use('/conversations/*', authMiddleware)

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})

export default app
```

**Step 6: Commit**

```bash
git add apps/api/src/routes/auth.ts apps/api/src/lib/jwt.ts apps/api/src/middleware/auth.ts apps/api/src/index.ts
git commit -m "feat: add Google + GitHub OAuth with JWT session management"
```

---

## Phase 2: Core Conversation Engine

### Task 5: Conversation Agent — Phase Manager + Domain Hints

**Files:**
- Create: `apps/api/src/agent/phase-manager.ts`
- Create: `apps/api/src/agent/domain-hints.ts`
- Create: `apps/api/src/agent/system-prompts.ts`
- Create: `apps/api/src/agent/identity-builder.ts`

**Step 1: Create domain hints**

Create `apps/api/src/agent/domain-hints.ts`:
```typescript
export interface DomainHint {
  domain: string
  areasToExplore: string[]
  signalsToExtract: string[]
  artifactsToRequest: string[]
}

export const domainHints: Record<string, DomainHint> = {
  Engineering: {
    domain: 'Engineering',
    areasToExplore: [
      'Primary languages and why they prefer them',
      'Framework opinions — not just what, but WHY',
      'Architecture philosophy: monolith vs microservice, modular vs flat',
      'Testing philosophy: TDD? integration-first? what they skip and why',
      'Code review style: what they look for, what they ignore, feedback approach',
      'Technical debt tolerance: when they accept it, when they refuse',
      'Naming conventions and code organization patterns',
    ],
    signalsToExtract: [
      'Decision heuristics — "I always X because Y"',
      'Strong opinions — "I think X is harmful because..."',
      'Tradeoff patterns — "I\'d choose X over Y when..."',
      'Anti-patterns they reject — "I never do X because..."',
    ],
    artifactsToRequest: [
      'GitHub repos they\'re proud of',
      'Code reviews they\'ve written',
      'Technical blog posts or docs',
    ],
  },
  Design: {
    domain: 'Design',
    areasToExplore: [
      'Primary discipline: UI, UX, motion, brand, product design',
      'Tools and workflow preferences',
      'Process: wireframe-first, prototype-first, code-first',
      'Design system opinions: atomic design, tokens, component libraries',
      'Accessibility stance: compliance-driven or values-driven',
      'Visual style: minimalist, bold, playful, corporate',
    ],
    signalsToExtract: [
      'Aesthetic judgment patterns — "Good design is..."',
      'Process preferences — "I always start with..."',
      'Collaboration style with engineers',
      'Non-negotiable standards',
    ],
    artifactsToRequest: [
      'Portfolio pieces or case studies',
      'Figma files or design documentation',
      'Before/after redesigns',
    ],
  },
  Product: {
    domain: 'Product',
    areasToExplore: [
      'Prioritization framework: RICE, ICE, gut, data-driven',
      'How they write specs/PRDs',
      'Stakeholder management style',
      'Metrics philosophy: north star, leading/lagging',
      'Feature scoping: how they say no, how they cut scope',
      'Roadmap philosophy: fixed vs flexible',
    ],
    signalsToExtract: [
      'Prioritization heuristics',
      'Communication style with engineers vs leadership',
      'Handling competing priorities',
      'What makes a "good" product decision',
    ],
    artifactsToRequest: [
      'PRDs or specs they\'ve written',
      'Roadmap examples',
      'Strategy documents',
    ],
  },
  'Data / Analytics': {
    domain: 'Data / Analytics',
    areasToExplore: [
      'Tools: SQL, Python, R, BI tools',
      'Data modeling philosophy',
      'Statistical rigor vs speed tradeoffs',
      'Data storytelling approach',
      'Pipeline architecture preferences',
    ],
    signalsToExtract: [
      'How they balance rigor with speed',
      'Communication style for non-technical audiences',
      'What makes a "good" analysis',
    ],
    artifactsToRequest: [
      'Analysis notebooks or dashboards',
      'Data documentation or blog posts',
    ],
  },
  Marketing: {
    domain: 'Marketing',
    areasToExplore: [
      'Channels and specialization',
      'Copy and messaging philosophy',
      'Data-driven vs creative instinct balance',
      'Brand voice development approach',
    ],
    signalsToExtract: [
      'What makes messaging "work"',
      'How they measure success',
      'Creative process patterns',
    ],
    artifactsToRequest: [
      'Campaign examples or case studies',
      'Copy samples or brand guidelines',
    ],
  },
  Operations: {
    domain: 'Operations',
    areasToExplore: [
      'Process design philosophy',
      'Automation vs human judgment balance',
      'Scaling approach',
      'Cross-functional coordination style',
    ],
    signalsToExtract: [
      'Efficiency heuristics',
      'When they standardize vs customize',
      'How they handle exceptions',
    ],
    artifactsToRequest: [
      'Process documentation',
      'Workflow designs',
    ],
  },
}

// General hints — always loaded
export const generalHints = {
  personalityAndCommunication: [
    'Communication style: direct vs diplomatic, concise vs detailed',
    'How they handle disagreements or pushback',
    'Decision-making speed: deliberate vs fast',
    'Risk tolerance: conservative vs experimental',
    'Values hierarchy: quality vs speed vs learning vs impact',
  ],
  workingStyle: [
    'How they approach new problems',
    'Collaboration preferences: async vs sync, solo vs pair',
    'How they handle being wrong or making mistakes',
  ],
  metaObservation: [
    'Sentence structure and length (thinking style)',
    'Vocabulary complexity (communication preference)',
    'Use of qualifiers vs definitive statements',
    'Whether they think in systems, narratives, or data',
  ],
}
```

**Step 2: Create phase manager**

Create `apps/api/src/agent/phase-manager.ts`:
```typescript
import type { Phase } from '@skill-builder/shared'

export function getNextPhase(current: Phase, signal: string): Phase | null {
  switch (current.type) {
    case 'domain_discovery':
      if (signal === 'domains_selected') {
        return { type: 'deep_discovery', domains: [], questionCount: 0 }
      }
      break
    case 'deep_discovery':
      if (signal === 'discovery_complete') {
        return { type: 'artifact_collection', pendingArtifacts: [] }
      }
      break
    case 'artifact_collection':
      if (signal === 'artifacts_complete' || signal === 'skip_artifacts') {
        return { type: 'skill_assembly', subStep: 'proposal' }
      }
      break
    case 'skill_assembly':
      if (signal === 'proposal_confirmed' && current.subStep === 'proposal') {
        return { type: 'skill_assembly', subStep: 'roleplay' }
      }
      if (signal === 'roleplay_confirmed' && current.subStep === 'roleplay') {
        return { type: 'skill_assembly', subStep: 'publish' }
      }
      break
  }
  return null
}

export function getPhaseLabel(phase: Phase): string {
  switch (phase.type) {
    case 'domain_discovery': return 'domain_discovery'
    case 'deep_discovery': return 'deep_discovery'
    case 'artifact_collection': return 'artifact_collection'
    case 'skill_assembly': return `skill_assembly_${phase.subStep}`
  }
}
```

**Step 3: Create identity builder**

Create `apps/api/src/agent/identity-builder.ts`:
```typescript
import type { IdentityModel, IdentityUpdate } from '@skill-builder/shared'

export function createEmptyIdentityModel(name: string, avatar?: string): IdentityModel {
  return {
    name,
    avatar,
    domains: [],
    personality: { traits: [], values: [] },
    communication: {},
    decisionPatterns: {},
    expertise: [],
    artifacts: [],
    subSkills: { overrides: [], custom: [] },
    completionPercent: 0,
  }
}

export function applyUpdate(model: IdentityModel, update: IdentityUpdate): IdentityModel {
  const next = structuredClone(model)

  switch (update.type) {
    case 'personality_trait_added':
      next.personality.traits.push(update.trait)
      break
    case 'personality_trait_confirmed': {
      const trait = next.personality.traits.find(t => t.label === update.traitLabel)
      if (trait) trait.source = 'confirmed'
      break
    }
    case 'domain_added':
      next.expertise.push({
        domain: update.domain.name,
        depth: update.domain.depth as any,
        subSkills: [],
        tools: [],
        opinions: [],
      })
      break
    case 'communication_updated':
      (next.communication as any)[update.field] = update.value
      break
    case 'decision_pattern_added':
      if (update.pattern.kind === 'rejects') {
        next.decisionPatterns.consistentlyRejects ??= []
        next.decisionPatterns.consistentlyRejects.push(update.pattern.value)
      } else if (update.pattern.kind === 'prioritizes') {
        next.decisionPatterns.consistentlyPrioritizes ??= []
        next.decisionPatterns.consistentlyPrioritizes.push(update.pattern.value)
      } else if (update.pattern.kind === 'heuristic') {
        next.decisionPatterns.defaultHeuristic = update.pattern.value
      }
      break
    case 'completion_updated':
      next.completionPercent = update.percent
      break
    case 'full_model_sync':
      return update.model
  }

  return next
}
```

**Step 4: Create system prompts**

Create `apps/api/src/agent/system-prompts.ts`:
```typescript
import type { IdentityModel, Phase } from '@skill-builder/shared'
import { domainHints, generalHints } from './domain-hints'

export function buildSystemPrompt(phase: Phase, identity: IdentityModel, selectedDomains: string[]): string {
  const parts: string[] = []

  // Base persona
  parts.push(`You are the Skill Builder AI. You interview professionals to deeply understand who they are — their expertise, personality, opinions, decision-making patterns, and communication style. You are warm, curious, and perceptive. You ask one question at a time and go deep before moving on.

Your goal is to build a rich identity model of this person. Every preference you discover should include the REASONING behind it — not just "prefers React" but "prefers React because component model matches how they think about UIs as composable units."

IMPORTANT: You output structured identity updates alongside your conversational responses. When you discover something about the user, emit an identity_update JSON block. Format:
\`\`\`identity_update
{"type": "personality_trait_added", "trait": {"label": "Pragmatic", "confidence": "medium", "source": "inferred"}}
\`\`\`

You can emit multiple identity_update blocks per response. Always wrap them in \`\`\`identity_update code fences.`)

  // Phase-specific instructions
  switch (phase.type) {
    case 'domain_discovery':
      parts.push(`
CURRENT PHASE: Domain Discovery
You are greeting the user for the first time. Explain what's about to happen — you'll have a conversation to build their professional identity card. Ask them to select their domains of expertise. Present these options: Engineering, Design, Product, Data / Analytics, Marketing, Operations. They can also type custom domains. Keep it warm and exciting — this is the start of something cool.

When the user selects domains, emit:
\`\`\`phase_signal
domains_selected
\`\`\``)
      break

    case 'deep_discovery':
      parts.push(`
CURRENT PHASE: Deep Conversational Discovery
The user has selected domains: ${selectedDomains.join(', ')}

Ask questions one at a time. Go deep on each topic before moving on. Periodically (every 5-7 questions), pause and reflect a summary back to the user. When the summary is confirmed, mark traits as confirmed.

After sufficient depth across all domains (typically 15-25 questions and at least one confirmed summary), emit:
\`\`\`phase_signal
discovery_complete
\`\`\``)

      // Load domain hints
      for (const domain of selectedDomains) {
        const hint = domainHints[domain]
        if (hint) {
          parts.push(`
Domain hints for ${domain}:
- Explore: ${hint.areasToExplore.join('; ')}
- Extract signals: ${hint.signalsToExtract.join('; ')}`)
        }
      }

      // Always load general hints
      parts.push(`
General signals to extract:
- Personality: ${generalHints.personalityAndCommunication.join('; ')}
- Working style: ${generalHints.workingStyle.join('; ')}
- Meta-observation (infer from HOW they answer): ${generalHints.metaObservation.join('; ')}`)
      break

    case 'artifact_collection':
      parts.push(`
CURRENT PHASE: Artifact Collection
Make targeted artifact requests based on what you've learned. Be specific — reference what the user told you. Accept GitHub repos, URLs, uploaded files, or pasted text. Analyze what's shared and surface findings.

If the user has no artifacts or says they're done, emit:
\`\`\`phase_signal
artifacts_complete
\`\`\`

Also emit skip signal if user wants to skip:
\`\`\`phase_signal
skip_artifacts
\`\`\``)
      break

    case 'skill_assembly':
      if (phase.subStep === 'proposal') {
        parts.push(`
CURRENT PHASE: Skill Assembly — Proposal
Present the proposed skill breakdown based on what you've learned. List existing skills from skills.sh that match (with the user's customizations) and any custom skills needed. Let the user add, remove, rename, or request more exploration.

When the user confirms the skill list, emit:
\`\`\`phase_signal
proposal_confirmed
\`\`\``)
      } else if (phase.subStep === 'roleplay') {
        parts.push(`
CURRENT PHASE: Skill Assembly — Roleplay Test
You are now responding AS the user's persona. Announce the mode switch. The user will throw scenarios at you. Respond as them — use their voice, opinions, decision patterns, and communication style. Every correction feeds back into the identity model.

When the user confirms the roleplay feels accurate, emit:
\`\`\`phase_signal
roleplay_confirmed
\`\`\``)
      } else if (phase.subStep === 'publish') {
        parts.push(`
CURRENT PHASE: Skill Assembly — Publish
The skill is ready. Generate a preview of the SKILL.md and present publishing options. Celebrate the completion.`)
      }
      break
  }

  // Current identity model context
  if (identity.personality.traits.length > 0 || identity.expertise.length > 0) {
    parts.push(`
CURRENT IDENTITY MODEL (what you've learned so far):
${JSON.stringify(identity, null, 2)}`)
  }

  return parts.join('\n\n')
}
```

**Step 5: Commit**

```bash
git add apps/api/src/agent/
git commit -m "feat: add conversation agent — phase manager, domain hints, identity builder, system prompts"
```

---

### Task 6: Conversation API routes with SSE streaming

**Files:**
- Create: `apps/api/src/routes/conversations.ts`
- Create: `apps/api/src/agent/conversation-agent.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Install Anthropic SDK**

Run in `apps/api/`: `pnpm add @anthropic-ai/sdk`

**Step 2: Create conversation agent**

Create `apps/api/src/agent/conversation-agent.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { IdentityModel, IdentityUpdate, Phase } from '@skill-builder/shared'
import { buildSystemPrompt } from './system-prompts'
import { getNextPhase } from './phase-manager'
import { applyUpdate } from './identity-builder'

const anthropic = new Anthropic()

interface AgentResponse {
  textChunks: AsyncIterable<string>
  identityUpdates: IdentityUpdate[]
  phaseSignal: string | null
}

export async function* runConversationTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentPhase: Phase,
  identityModel: IdentityModel,
  selectedDomains: string[],
): AsyncGenerator<
  | { type: 'text'; data: string }
  | { type: 'identity_update'; data: IdentityUpdate }
  | { type: 'phase_signal'; data: string }
  | { type: 'done' }
> {
  const systemPrompt = buildSystemPrompt(currentPhase, identityModel, selectedDomains)

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })

  let fullResponse = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      yield { type: 'text', data: event.delta.text }
    }
  }

  // Parse identity updates from the full response
  const identityUpdateRegex = /```identity_update\n([\s\S]*?)```/g
  let match
  while ((match = identityUpdateRegex.exec(fullResponse)) !== null) {
    try {
      const update = JSON.parse(match[1].trim()) as IdentityUpdate
      yield { type: 'identity_update', data: update }
    } catch {
      // Skip malformed updates
    }
  }

  // Parse phase signals
  const phaseSignalRegex = /```phase_signal\n([\s\S]*?)```/g
  while ((match = phaseSignalRegex.exec(fullResponse)) !== null) {
    const signal = match[1].trim()
    yield { type: 'phase_signal', data: signal }
  }

  yield { type: 'done' }
}

// Strip identity_update and phase_signal blocks from visible text
export function cleanResponseText(text: string): string {
  return text
    .replace(/```identity_update\n[\s\S]*?```/g, '')
    .replace(/```phase_signal\n[\s\S]*?```/g, '')
    .trim()
}
```

**Step 3: Create conversation routes**

Create `apps/api/src/routes/conversations.ts`:
```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { db } from '../db'
import { conversations, conversationMessages } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { runConversationTurn, cleanResponseText } from '../agent/conversation-agent'
import { createEmptyIdentityModel, applyUpdate } from '../agent/identity-builder'
import { getNextPhase, getPhaseLabel } from '../agent/phase-manager'
import type { Phase, IdentityModel } from '@skill-builder/shared'

const conv = new Hono()

// Start new conversation
conv.post('/', async (c) => {
  const userId = c.get('userId' as never) as string
  const user = c.get('user' as never) as any

  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.status, 'active')))
    .limit(1)

  if (existing) {
    return c.json(existing)
  }

  const identityModel = createEmptyIdentityModel(user?.name || 'User', user?.avatarUrl)

  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      phase: 'domain_discovery',
      identityModel: identityModel as any,
    })
    .returning()

  return c.json(conversation, 201)
})

// Get active conversation
conv.get('/active', async (c) => {
  const userId = c.get('userId' as never) as string

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.status, 'active')))
    .limit(1)

  if (!conversation) return c.json({ error: 'No active conversation' }, 404)
  return c.json(conversation)
})

// Get identity model
conv.get('/:id/identity', async (c) => {
  const id = c.req.param('id')
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1)

  if (!conversation) return c.json({ error: 'Not found' }, 404)
  return c.json(conversation.identityModel)
})

// Get conversation history
conv.get('/:id/messages', async (c) => {
  const id = c.req.param('id')
  const msgs = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, id))
    .orderBy(conversationMessages.createdAt)

  return c.json(msgs)
})

// Send message — returns SSE stream
conv.post('/:id/messages', async (c) => {
  const id = c.req.param('id')
  const { content } = await c.req.json()

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1)

  if (!conversation) return c.json({ error: 'Not found' }, 404)

  // Save user message
  const phase = conversation.phase
  await db.insert(conversationMessages).values({
    conversationId: id,
    role: 'user',
    content,
    phase,
  })

  // Load message history
  const history = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, id))
    .orderBy(conversationMessages.createdAt)

  const messages = history.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const currentPhase = parsePhase(conversation.phase)
  let identityModel = conversation.identityModel as unknown as IdentityModel
  const domains = identityModel.domains || []

  return streamSSE(c, async (stream) => {
    let fullText = ''
    const updates: any[] = []

    for await (const event of runConversationTurn(messages, currentPhase, identityModel, domains)) {
      switch (event.type) {
        case 'text':
          fullText += event.data
          await stream.writeSSE({ event: 'message_chunk', data: event.data })
          break

        case 'identity_update':
          identityModel = applyUpdate(identityModel, event.data)
          updates.push(event.data)
          await stream.writeSSE({
            event: 'identity_update',
            data: JSON.stringify(event.data),
          })
          break

        case 'phase_signal': {
          const nextPhase = getNextPhase(currentPhase, event.data)
          if (nextPhase) {
            await db
              .update(conversations)
              .set({ phase: getPhaseLabel(nextPhase) })
              .where(eq(conversations.id, id))

            await stream.writeSSE({
              event: 'phase_change',
              data: JSON.stringify({ phase: nextPhase }),
            })
          }
          break
        }

        case 'done': {
          // Save assistant message
          const cleanText = cleanResponseText(fullText)
          await db.insert(conversationMessages).values({
            conversationId: id,
            role: 'assistant',
            content: cleanText,
            identityModelDelta: updates.length > 0 ? updates as any : null,
            phase,
          })

          // Persist updated identity model
          await db
            .update(conversations)
            .set({
              identityModel: identityModel as any,
              updatedAt: new Date(),
            })
            .where(eq(conversations.id, id))

          await stream.writeSSE({ event: 'done', data: '{}' })
          break
        }
      }
    }
  })
})

function parsePhase(phaseStr: string): Phase {
  if (phaseStr === 'domain_discovery') return { type: 'domain_discovery' }
  if (phaseStr === 'deep_discovery') return { type: 'deep_discovery', domains: [], questionCount: 0 }
  if (phaseStr === 'artifact_collection') return { type: 'artifact_collection', pendingArtifacts: [] }
  if (phaseStr.startsWith('skill_assembly_')) {
    const subStep = phaseStr.replace('skill_assembly_', '') as 'proposal' | 'roleplay' | 'publish'
    return { type: 'skill_assembly', subStep }
  }
  return { type: 'domain_discovery' }
}

export default conv
```

**Step 4: Mount conversation routes in main app**

Update `apps/api/src/index.ts` — add:
```typescript
import conversations from './routes/conversations'

// After auth routes:
app.use('/conversations/*', authMiddleware)
app.route('/conversations', conversations)
```

**Step 5: Commit**

```bash
git add apps/api/src/agent/conversation-agent.ts apps/api/src/routes/conversations.ts apps/api/src/index.ts
git commit -m "feat: add conversation API with SSE streaming, Claude integration, phase transitions"
```

---

## Phase 3: Frontend — Chat + Identity Card

### Task 7: Auth context + API client

**Files:**
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/auth-context.tsx`
- Create: `apps/web/src/lib/use-sse.ts`

**Step 1: Install frontend deps**

Run in `apps/web/`:
```bash
pnpm add framer-motion @phosphor-icons/react
```

**Step 2: Create API client**

Create `apps/web/src/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function apiSSE(path: string, body: object, onEvent: (event: string, data: string) => void) {
  const token = getToken()

  fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = 'message'
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7)
        } else if (line.startsWith('data: ')) {
          onEvent(currentEvent, line.slice(6))
        }
      }
    }
  })
}
```

**Step 3: Create auth context**

Create `apps/web/src/lib/auth-context.tsx`:
```tsx
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from './api'

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (provider: 'google' | 'github', credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      setToken(stored)
      apiFetch('/auth/me')
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (provider: 'google' | 'github', credential: string) => {
    const body = provider === 'google' ? { credential } : { code: credential }
    const data = await apiFetch(`/auth/${provider}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/
git commit -m "feat: add API client, SSE helper, and auth context"
```

---

### Task 8: Builder layout — split pane with chat + identity card

**Files:**
- Create: `apps/web/src/app/builder/page.tsx`
- Create: `apps/web/src/app/builder/layout.tsx`
- Create: `apps/web/src/components/builder/chat-panel.tsx`
- Create: `apps/web/src/components/builder/identity-card.tsx`
- Create: `apps/web/src/components/builder/message-bubble.tsx`
- Create: `apps/web/src/components/builder/domain-selector.tsx`
- Create: `apps/web/src/components/builder/chat-input.tsx`
- Create: `apps/web/src/lib/use-conversation.ts`

**Step 1: Create conversation hook**

Create `apps/web/src/lib/use-conversation.ts`:
```typescript
'use client'

import { useState, useCallback } from 'react'
import { apiFetch, apiSSE } from './api'
import type { IdentityModel, IdentityUpdate, ConversationMessage } from '@skill-builder/shared'

export function useConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [identity, setIdentity] = useState<IdentityModel | null>(null)
  const [phase, setPhase] = useState<string>('domain_discovery')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const startConversation = useCallback(async () => {
    const conv = await apiFetch('/conversations', { method: 'POST' })
    setConversationId(conv.id)
    setIdentity(conv.identityModel)
    setPhase(conv.phase)

    // Load existing messages if resuming
    if (conv.status === 'active') {
      const msgs = await apiFetch(`/conversations/${conv.id}/messages`)
      setMessages(msgs)
    }

    return conv
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || isStreaming) return

    // Optimistic user message
    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      phase,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingText('')

    let fullText = ''

    apiSSE(`/conversations/${conversationId}/messages`, { content }, (event, data) => {
      switch (event) {
        case 'message_chunk':
          fullText += data
          setStreamingText(fullText)
          break

        case 'identity_update': {
          const update = JSON.parse(data) as IdentityUpdate
          setIdentity(prev => {
            if (!prev) return prev
            // Apply update immutably (simplified — use applyUpdate from shared)
            const next = structuredClone(prev)
            if (update.type === 'personality_trait_added') {
              next.personality.traits.push(update.trait)
            } else if (update.type === 'completion_updated') {
              next.completionPercent = update.percent
            } else if (update.type === 'full_model_sync') {
              return update.model
            }
            return next
          })
          break
        }

        case 'phase_change': {
          const { phase: newPhase } = JSON.parse(data)
          setPhase(newPhase.type === 'skill_assembly'
            ? `skill_assembly_${newPhase.subStep}`
            : newPhase.type)
          break
        }

        case 'done': {
          const assistantMsg: ConversationMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullText,
            phase,
            createdAt: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamingText('')
          setIsStreaming(false)
          break
        }
      }
    })
  }, [conversationId, isStreaming, phase])

  return {
    conversationId,
    messages,
    identity,
    phase,
    isStreaming,
    streamingText,
    startConversation,
    sendMessage,
  }
}
```

**Step 2: Create domain selector component**

Create `apps/web/src/components/builder/domain-selector.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DOMAINS, type Domain } from '@skill-builder/shared'

interface DomainSelectorProps {
  onSelect: (domains: string[]) => void
}

const domainIcons: Record<string, string> = {
  Engineering: '/icons/engineering.svg',
  Design: '/icons/design.svg',
  Product: '/icons/product.svg',
  'Data / Analytics': '/icons/data.svg',
  Marketing: '/icons/marketing.svg',
  Operations: '/icons/operations.svg',
}

export function DomainSelector({ onSelect }: DomainSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [custom, setCustom] = useState('')

  const toggle = (domain: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

  const handleConfirm = () => {
    const domains = [...selected]
    if (custom.trim()) domains.push(custom.trim())
    if (domains.length > 0) onSelect(domains)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((domain) => (
          <motion.button
            key={domain}
            onClick={() => toggle(domain)}
            whileTap={{ scale: 0.96 }}
            className={`
              rounded-full px-5 py-2.5 text-sm font-medium transition-colors
              ${selected.has(domain)
                ? 'bg-text-primary text-white'
                : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-transparent hover:border-text-muted/20'
              }
            `}
          >
            {domain}
          </motion.button>
        ))}
      </div>

      <input
        type="text"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Or type a custom domain..."
        className="w-full rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-text-muted/30"
      />

      {selected.size > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          className="rounded-full bg-text-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-text-primary/90 transition-colors"
        >
          Continue with {selected.size} domain{selected.size > 1 ? 's' : ''}
        </motion.button>
      )}
    </div>
  )
}
```

**Step 3: Create message bubble component**

Create `apps/web/src/components/builder/message-bubble.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed
          ${isUser
            ? 'bg-text-primary text-white rounded-br-md'
            : 'bg-surface-muted text-text-primary rounded-bl-md'
          }
        `}
      >
        {content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-text-muted/50 ml-0.5 animate-pulse rounded-full" />
        )}
      </div>
    </motion.div>
  )
}
```

**Step 4: Create chat input**

Create `apps/web/src/components/builder/chat-input.tsx`:
```tsx
'use client'

import { useState, type KeyboardEvent } from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = 'Type your message...' }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl bg-surface-muted p-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-text-primary placeholder:text-text-muted outline-none"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-text-primary p-2.5 text-white transition-all hover:bg-text-primary/90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
      >
        <PaperPlaneRight size={18} weight="fill" />
      </button>
    </div>
  )
}
```

**Step 5: Create identity card component**

Create `apps/web/src/components/builder/identity-card.tsx`:
```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { IdentityModel } from '@skill-builder/shared'

interface IdentityCardProps {
  identity: IdentityModel | null
}

export function IdentityCard({ identity }: IdentityCardProps) {
  const completion = identity?.completionPercent ?? 0
  const traits = identity?.personality.traits ?? []
  const expertise = identity?.expertise ?? []

  // Gradient opacity scales with completion
  const gradientOpacity = Math.max(0.3, completion / 100)

  return (
    <div className="relative h-full rounded-[1.5rem] overflow-hidden">
      {/* Warm gradient background */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: gradientOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-orange-200 to-amber-200" />
        <div className="absolute inset-0 bg-gradient-to-tl from-violet-200/40 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-white/60 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-8 h-full">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {identity?.avatar ? (
            <img
              src={identity.avatar}
              alt=""
              className="w-16 h-16 rounded-full border-2 border-white/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border border-white/20" />
          )}
          <div className="text-center">
            <h2 className="text-xl font-medium text-white drop-shadow-sm">
              {identity?.name || 'Your Identity'}
            </h2>
            {identity?.role && (
              <p className="text-sm text-white/70 mt-0.5">{identity.role}</p>
            )}
          </div>
        </div>

        {/* Completion stat */}
        <motion.div
          key={completion}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-5xl font-light text-white tracking-tighter mb-6"
        >
          {completion}%
        </motion.div>

        {/* Traits */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-6">
          <AnimatePresence mode="popLayout">
            {traits.map((trait) => (
              <motion.span
                key={trait.label}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={`
                  rounded-full px-3 py-1 text-xs font-medium
                  ${trait.source === 'confirmed'
                    ? 'bg-white/30 text-white backdrop-blur-sm border border-white/20'
                    : 'bg-white/15 text-white/70 backdrop-blur-sm border border-dashed border-white/15'
                  }
                `}
              >
                {trait.label}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Skill bars */}
        {expertise.length > 0 && (
          <div className="w-full max-w-[200px] space-y-2 mt-auto">
            {expertise.slice(0, 4).map((exp) => (
              <motion.div
                key={exp.domain}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex justify-between">
                  <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                    {exp.domain}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: exp.depth === 'expert' ? '100%'
                        : exp.depth === 'advanced' ? '75%'
                        : exp.depth === 'proficient' ? '50%'
                        : '25%'
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-white/60 rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Traits count */}
        {traits.length > 0 && (
          <p className="text-[11px] text-white/50 mt-4">
            {traits.length} trait{traits.length !== 1 ? 's' : ''} discovered
          </p>
        )}
      </div>
    </div>
  )
}
```

**Step 6: Create chat panel**

Create `apps/web/src/components/builder/chat-panel.tsx`:
```tsx
'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { DomainSelector } from './domain-selector'
import type { ConversationMessage } from '@skill-builder/shared'

interface ChatPanelProps {
  messages: ConversationMessage[]
  streamingText: string
  isStreaming: boolean
  phase: string
  onSendMessage: (content: string) => void
  onSelectDomains: (domains: string[]) => void
}

export function ChatPanel({
  messages,
  streamingText,
  isStreaming,
  phase,
  onSendMessage,
  onSelectDomains,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  const isRoleplay = phase === 'skill_assembly_roleplay'

  return (
    <div className={`flex flex-col h-full ${isRoleplay ? 'bg-surface-muted/50' : ''}`}>
      {/* Phase indicator */}
      {isRoleplay && (
        <div className="px-4 py-2 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Roleplay Mode — Testing Your Skill
          </span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingText && (
          <MessageBubble role="assistant" content={streamingText} isStreaming />
        )}

        {/* Domain selector inline */}
        {phase === 'domain_discovery' && messages.length <= 1 && (
          <DomainSelector onSelect={onSelectDomains} />
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-muted">
        <ChatInput
          onSend={onSendMessage}
          disabled={isStreaming}
          placeholder={isRoleplay ? 'Test a scenario...' : 'Type your message...'}
        />
      </div>
    </div>
  )
}
```

**Step 7: Create builder page**

Create `apps/web/src/app/builder/layout.tsx`:
```tsx
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

Create `apps/web/src/app/builder/page.tsx`:
```tsx
'use client'

import { useEffect } from 'react'
import { ChatPanel } from '@/components/builder/chat-panel'
import { IdentityCard } from '@/components/builder/identity-card'
import { useConversation } from '@/lib/use-conversation'
import { useAuth } from '@/lib/auth-context'

export default function BuilderPage() {
  const { user } = useAuth()
  const {
    messages,
    identity,
    phase,
    isStreaming,
    streamingText,
    startConversation,
    sendMessage,
  } = useConversation()

  useEffect(() => {
    startConversation()
  }, [startConversation])

  const handleSelectDomains = (domains: string[]) => {
    sendMessage(`I work in: ${domains.join(', ')}`)
  }

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4">
        <span className="text-lg font-medium tracking-tight text-text-primary">
          Skill Builder
        </span>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">{user.name}</span>
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
            )}
          </div>
        )}
      </header>

      {/* Main split pane */}
      <main className="mx-auto max-w-[1400px] px-6 pb-6">
        <div className="bg-surface rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-[calc(100dvh-6rem)]">
          {/* Chat panel — left */}
          <ChatPanel
            messages={messages}
            streamingText={streamingText}
            isStreaming={isStreaming}
            phase={phase}
            onSendMessage={sendMessage}
            onSelectDomains={handleSelectDomains}
          />

          {/* Identity card — right */}
          <div className="hidden lg:block p-4">
            <IdentityCard identity={identity} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add builder UI — split pane chat + gamified identity card with real-time updates"
```

---

## Phase 4: Skill Generation + Publishing

### Task 9: Skill generator

**Files:**
- Create: `apps/api/src/agent/skill-generator.ts`

**Step 1: Create skill generator**

Create `apps/api/src/agent/skill-generator.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { IdentityModel } from '@skill-builder/shared'

const anthropic = new Anthropic()

interface GeneratedSkill {
  skillMd: string
  overrides: Array<{ filename: string; content: string }>
  custom: Array<{ filename: string; content: string }>
  examples: {
    decisions: string
    communication: string
    reviews: string
  }
}

export async function generateSkillPackage(
  identity: IdentityModel,
  username: string,
): Promise<GeneratedSkill> {
  const skillName = `acting-as-${username.toLowerCase().replace(/\s+/g, '-')}`

  // Generate the persona SKILL.md
  const skillMdResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: `You are a skill generator. Given a professional identity model, generate a SKILL.md file following the Anthropic Agent Skills format. The skill should be high-level and opinionated — it captures the person's SOUL, not every detail. Every preference must include causal reasoning ("because..."). Keep it under 200 lines. Output ONLY the markdown content, no wrapping.`,
    messages: [{
      role: 'user',
      content: `Generate a SKILL.md for this identity:

Name: ${identity.name}
Skill Name: ${skillName}
Domains: ${identity.domains.join(', ')}
Role: ${identity.role || 'Professional'}

Personality Traits: ${identity.personality.traits.map(t => t.label).join(', ')}
Values: ${identity.personality.values.map(v => `${v.label} (${v.reason || 'core value'})`).join(', ')}
Risk Tolerance: ${identity.personality.riskTolerance || 'moderate'}

Communication:
- Tone: ${identity.communication.tone || 'direct'}
- Formality: ${identity.communication.formality || 'casual-professional'}
- Feedback Style: ${identity.communication.feedbackStyle || 'constructive'}
- Vocabulary: ${identity.communication.vocabularyPatterns?.join(', ') || 'standard'}

Decision Patterns:
- Default Heuristic: ${identity.decisionPatterns.defaultHeuristic || 'not specified'}
- Consistently Rejects: ${identity.decisionPatterns.consistentlyRejects?.join(', ') || 'not specified'}
- Consistently Prioritizes: ${identity.decisionPatterns.consistentlyPrioritizes?.join(', ') || 'not specified'}

Expertise:
${identity.expertise.map(e => `- ${e.domain} (${e.depth}): ${e.opinions.join('; ')}`).join('\n')}

Override Skills (from skills.sh): ${identity.subSkills.overrides.map(s => s.baseSkillName).join(', ') || 'none'}
Custom Skills: ${identity.subSkills.custom.map(s => s.name).join(', ') || 'none'}

Use the template:
---
name: ${skillName}
description: Use when you want responses reflecting ${identity.name}'s perspective as a ${identity.role || 'professional'}. Activates on ${identity.domains.join(', ')} tasks.
---

# ${identity.name}

## Who I Am
...

## How I Think
...

## How I Communicate
...

## What I Reject
...

## Skills
### From skills.sh (with my preferences)
...

### Custom
...

## Guardrails
...`,
    }],
  })

  const skillMd = (skillMdResponse.content[0] as any).text

  // Generate override files
  const overrides: Array<{ filename: string; content: string }> = []
  for (const override of identity.subSkills.overrides) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate a skill override file for "${override.baseSkillName}" with these customizations: ${override.customizations.join(', ')}. Identity: ${identity.name}. Format as markdown with sections: Base Skill, Preferences, Examples. Keep it concise.`,
      }],
    })
    overrides.push({
      filename: `${override.baseSkillName}.md`,
      content: (res.content[0] as any).text,
    })
  }

  // Generate custom skill files
  const custom: Array<{ filename: string; content: string }> = []
  for (const skill of identity.subSkills.custom) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate a custom skill file for "${skill.name}": ${skill.description}. Identity: ${identity.name}. Include: What This Covers, Core Principles (with causal rationale), Preferred Patterns, Anti-Patterns, Decision Heuristics, Examples. Keep it focused and opinionated.`,
      }],
    })
    custom.push({
      filename: `${skill.name.toLowerCase().replace(/\s+/g, '-')}.md`,
      content: (res.content[0] as any).text,
    })
  }

  return {
    skillMd,
    overrides,
    custom,
    examples: {
      decisions: 'TODO: extract from conversation',
      communication: 'TODO: extract from conversation',
      reviews: 'TODO: extract from conversation',
    },
  }
}
```

**Step 2: Commit**

```bash
git add apps/api/src/agent/skill-generator.ts
git commit -m "feat: add skill generator — produces SKILL.md + overrides + custom skills from identity model"
```

---

### Task 10: Publish routes + skill preview

**Files:**
- Create: `apps/api/src/routes/skills.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Create skills routes**

Create `apps/api/src/routes/skills.ts`:
```typescript
import { Hono } from 'hono'
import { db } from '../db'
import { conversations, publishedSkills, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { generateSkillPackage } from '../agent/skill-generator'
import type { IdentityModel } from '@skill-builder/shared'

const skills = new Hono()

// Generate and publish skill
skills.post('/conversations/:id/publish', async (c) => {
  const convId = c.req.param('id')
  const userId = c.get('userId' as never) as string
  const { destination } = await c.req.json() // 'platform' | 'personal'

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, convId))
    .limit(1)

  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const identity = conversation.identityModel as unknown as IdentityModel
  const username = user.name.toLowerCase().replace(/\s+/g, '-')
  const skillName = `acting-as-${username}`

  // Generate skill package
  const generated = await generateSkillPackage(identity, user.name)

  const skillFiles = {
    'SKILL.md': generated.skillMd,
    ...Object.fromEntries(
      generated.overrides.map(o => [`references/overrides/${o.filename}`, o.content])
    ),
    ...Object.fromEntries(
      generated.custom.map(c => [`references/custom/${c.filename}`, c.content])
    ),
    'references/examples/decisions.md': generated.examples.decisions,
    'references/examples/communication.md': generated.examples.communication,
    'references/examples/reviews.md': generated.examples.reviews,
  }

  // Determine repo owner
  const repoOwner = destination === 'personal' && user.githubAccessToken
    ? username
    : 'skillbuilder-community'

  const installCommand = `npx skills add ${repoOwner}/${skillName}`

  // Save to database
  const [published] = await db
    .insert(publishedSkills)
    .values({
      userId,
      conversationId: convId,
      skillName,
      githubRepoUrl: `https://github.com/${repoOwner}/${skillName}`,
      githubRepoOwner: repoOwner,
      installCommand,
      identityModel: identity as any,
      skillFiles: skillFiles as any,
    })
    .returning()

  // Mark conversation as completed
  await db
    .update(conversations)
    .set({ status: 'completed' })
    .where(eq(conversations.id, convId))

  // TODO: Create GitHub repo and push files via GitHub API

  return c.json({
    id: published.id,
    skillName,
    installCommand,
    githubRepoUrl: published.githubRepoUrl,
    files: skillFiles,
  })
})

// Get published skill details
skills.get('/skills/:id', async (c) => {
  const id = c.req.param('id')
  const [skill] = await db
    .select()
    .from(publishedSkills)
    .where(eq(publishedSkills.id, id))
    .limit(1)

  if (!skill) return c.json({ error: 'Not found' }, 404)
  return c.json(skill)
})

// Public profile page
skills.get('/users/:username/skill', async (c) => {
  const username = c.req.param('username')
  const skillName = `acting-as-${username}`

  const [skill] = await db
    .select()
    .from(publishedSkills)
    .where(eq(publishedSkills.skillName, skillName))
    .limit(1)

  if (!skill) return c.json({ error: 'Not found' }, 404)
  return c.json({
    skillName: skill.skillName,
    installCommand: skill.installCommand,
    identityModel: skill.identityModel,
    publishedAt: skill.publishedAt,
  })
})

export default skills
```

**Step 2: Mount in main app**

Add to `apps/api/src/index.ts`:
```typescript
import skills from './routes/skills'

app.route('/', skills)
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/skills.ts apps/api/src/index.ts
git commit -m "feat: add skill publishing routes — generate, persist, and serve published skills"
```

---

## Phase 5: Landing Page + Polish

### Task 11: Landing page

**Files:**
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/components/landing/hero.tsx`

**Step 1: Create hero component**

Create `apps/web/src/components/landing/hero.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="min-h-[100dvh] bg-canvas">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-[1400px] mx-auto">
        <span className="text-lg font-medium tracking-tight">Skill Builder</span>
        <Link
          href="/builder"
          className="rounded-full bg-text-primary px-5 py-2 text-sm font-medium text-white hover:bg-text-primary/90 transition-colors"
        >
          Get started
        </Link>
      </header>

      {/* Hero content */}
      <div className="max-w-[1400px] mx-auto px-8 pt-16 lg:pt-24">
        <div className="bg-surface rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">
          {/* Left — copy */}
          <div className="flex flex-col justify-center px-10 lg:px-16 py-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl tracking-tighter leading-none font-light text-text-primary"
            >
              Make AI
              <br />
              Think Like You
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-base text-text-secondary leading-relaxed max-w-[45ch]"
            >
              An AI interviews you, analyzes your work, and generates an
              installable skill that makes any compatible agent think and work
              like you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex items-center gap-4"
            >
              <Link
                href="/builder"
                className="rounded-full bg-text-primary px-7 py-3 text-sm font-medium text-white hover:bg-text-primary/90 transition-colors active:scale-[0.98]"
              >
                Build Your Skill
              </Link>
            </motion.div>

            {/* Install command preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 rounded-xl bg-zinc-900 px-5 py-3 inline-flex items-center gap-3 max-w-fit"
            >
              <code className="text-sm text-zinc-300 font-mono">
                npx skills add acting-as-you
              </code>
            </motion.div>
          </div>

          {/* Right — gradient identity card preview */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-orange-200 to-amber-200" />
            <div className="absolute inset-0 bg-gradient-to-tl from-violet-200/40 via-transparent to-transparent" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-white/60 rounded-full blur-3xl" />

            {/* Sample card content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-12 px-8">
              <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm border border-white/20 mb-4" />
              <p className="text-xl font-medium text-white drop-shadow-sm">Your Name</p>
              <p className="text-sm text-white/60 mt-1">Your Role</p>
              <p className="text-5xl font-light text-white tracking-tighter mt-6">100%</p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-6">
                {['Pragmatic', 'Direct', 'Simplicity-first', 'Fast shipper'].map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full px-3 py-1 text-xs font-medium bg-white/25 text-white backdrop-blur-sm border border-white/15"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-[1400px] mx-auto px-8 py-20">
        <h2 className="text-2xl font-light tracking-tight text-text-primary text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Conversation', desc: 'AI interviews you about your expertise, opinions, and working style' },
            { step: '02', title: 'Analysis', desc: 'Share code, docs, or artifacts. AI verifies your patterns from real work' },
            { step: '03', title: 'Validation', desc: 'Test your skill in roleplay mode. Correct anything that feels off' },
            { step: '04', title: 'Publish', desc: 'Get an installable skill anyone can add with one command' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                {item.step}
              </span>
              <h3 className="text-lg font-medium text-text-primary">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Create landing page**

Replace `apps/web/src/app/page.tsx`:
```tsx
import { Hero } from '@/components/landing/hero'

export default function HomePage() {
  return <Hero />
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/components/landing/
git commit -m "feat: add landing page with asymmetric hero, gradient card preview, how-it-works section"
```

---

### Task 12: Publish celebration page

**Files:**
- Create: `apps/web/src/components/builder/publish-view.tsx`

This component renders when phase is `skill_assembly_publish`. Shows the completed identity card prominently, the install command in a dark pill, copy button, and share options. Elegant, warm — the gradient card at full glow IS the celebration.

**Step 1: Create publish view**

Create `apps/web/src/components/builder/publish-view.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, GithubLogo, XLogo, LinkedinLogo } from '@phosphor-icons/react'
import { IdentityCard } from './identity-card'
import type { IdentityModel } from '@skill-builder/shared'

interface PublishViewProps {
  identity: IdentityModel
  installCommand: string
  skillPreview: string
}

export function PublishView({ identity, installCommand, skillPreview }: PublishViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col items-center px-6 py-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-light tracking-tighter text-text-primary text-center"
      >
        Your Identity is Live
      </motion.h1>

      {/* Install command */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 rounded-2xl bg-zinc-900 px-6 py-4 flex items-center gap-4 max-w-lg w-full"
      >
        <code className="flex-1 text-sm text-zinc-300 font-mono truncate">
          {installCommand}
        </code>
        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white transition-colors active:scale-95"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </motion.div>

      {/* Identity card — hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
        className="mt-12 w-full max-w-sm h-[480px]"
      >
        <IdentityCard identity={{ ...identity, completionPercent: 100 }} />
      </motion.div>

      {/* Share */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex items-center gap-3"
      >
        <span className="text-sm text-text-muted">Share:</span>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <XLogo size={18} />
        </button>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <LinkedinLogo size={18} />
        </button>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <GithubLogo size={18} />
        </button>
      </motion.div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/builder/publish-view.tsx
git commit -m "feat: add publish celebration view — install command, completed identity card, share buttons"
```

---

## Summary of Tasks

| # | Task | Phase | Est. |
|---|------|-------|------|
| 1 | Monorepo scaffolding | Foundation | 5 min |
| 2 | Tailwind + design tokens | Foundation | 3 min |
| 3 | Database schema + Drizzle | Foundation | 5 min |
| 4 | Auth (Google + GitHub OAuth) | Foundation | 5 min |
| 5 | Agent: phase manager + domain hints + system prompts | Core Engine | 5 min |
| 6 | Conversation API with SSE streaming | Core Engine | 5 min |
| 7 | Frontend: auth context + API client | Frontend | 3 min |
| 8 | Builder: chat panel + identity card + domain selector | Frontend | 5 min |
| 9 | Skill generator | Skills | 3 min |
| 10 | Publish routes | Skills | 3 min |
| 11 | Landing page | Polish | 3 min |
| 12 | Publish celebration page | Polish | 3 min |

**Not included (follow-up tasks):**
- Artifact analysis routes (GitHub API integration for repo/PR analysis)
- GitHub publishing (creating repos via GitHub API)
- Mobile responsive tweaks
- Error states / loading skeletons
- Conversation persistence / resume flow
- Public profile page at `/u/{username}`
