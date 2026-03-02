# Vertex AI Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `@anthropic-ai/sdk` with `@anthropic-ai/vertex-sdk` so all Claude API calls route through Google Vertex AI.

**Architecture:** Swap the SDK dependency and update 4 files. The Vertex SDK has the same `messages.create()` / `messages.stream()` API surface, so streaming, tool use, and type imports stay identical. Auth switches from API key to Google ADC.

**Tech Stack:** `@anthropic-ai/vertex-sdk`, Google ADC (`google-auth-library` bundled in the SDK), Bun runtime

---

### Task 1: Swap SDK dependency

**Files:**
- Modify: `apps/api/package.json`

**Step 1: Remove old SDK and add new one**

Run:
```bash
cd apps/api && bun remove @anthropic-ai/sdk && bun add @anthropic-ai/vertex-sdk
```

**Step 2: Verify installation**

Run:
```bash
ls node_modules/@anthropic-ai/vertex-sdk/package.json
```
Expected: File exists

**Step 3: Commit**

```bash
git add apps/api/package.json bun.lock
git commit -m "chore: swap @anthropic-ai/sdk for @anthropic-ai/vertex-sdk"
```

---

### Task 2: Create shared Vertex AI client config

**Files:**
- Create: `apps/api/src/lib/ai-client.ts`

**Step 1: Create the client module**

This centralizes the Vertex AI client so both conversation-agent and skill-generator share one instance and config.

```typescript
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk'

const projectId = process.env.GOOGLE_CLOUD_PROJECT
if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT env var is required')

const region = process.env.GOOGLE_CLOUD_REGION || 'us-east5'

export const ai = new AnthropicVertex({ projectId, region })

export const AI_MODEL = 'claude-haiku-4-5@20251001'
```

**Step 2: Verify typecheck**

Run:
```bash
cd apps/api && bunx tsc --noEmit
```
Expected: No errors related to ai-client.ts (may have other pre-existing errors)

**Step 3: Commit**

```bash
git add apps/api/src/lib/ai-client.ts
git commit -m "feat: add centralized Vertex AI client config"
```

---

### Task 3: Migrate conversation-agent.ts

**Files:**
- Modify: `apps/api/src/agent/conversation-agent.ts`

**Step 1: Update imports and client**

Replace line 1:
```typescript
import Anthropic from '@anthropic-ai/sdk'
```
With:
```typescript
import type { AnthropicVertex } from '@anthropic-ai/vertex-sdk'
import { ai, AI_MODEL } from '../lib/ai-client'
```

Remove line 12:
```typescript
const anthropic = new Anthropic()
```

**Step 2: Update the stream call (line 73-79)**

Replace:
```typescript
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages as Anthropic.MessageParam[],
      tools: identityTools,
    })
```
With:
```typescript
    const stream = ai.messages.stream({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages as AnthropicVertex.MessageParam[],
      tools: identityTools,
    })
```

**Step 3: Update usage event model string (line 169)**

Replace:
```typescript
        model: 'claude-haiku-4-5',
```
With:
```typescript
        model: AI_MODEL,
```

**Step 4: Verify typecheck**

Run:
```bash
cd apps/api && bunx tsc --noEmit
```
Expected: No new errors

**Step 5: Commit**

```bash
git add apps/api/src/agent/conversation-agent.ts
git commit -m "refactor: migrate conversation-agent to Vertex AI SDK"
```

---

### Task 4: Migrate skill-generator.ts

**Files:**
- Modify: `apps/api/src/generator/skill-generator.ts`

**Step 1: Update imports and client**

Replace line 1:
```typescript
import Anthropic from '@anthropic-ai/sdk'
```
With:
```typescript
import { ai, AI_MODEL } from '../lib/ai-client'
```

Remove line 6:
```typescript
const anthropic = new Anthropic()
```

**Step 2: Update messages.create call (line 30-37)**

Replace:
```typescript
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
```
With:
```typescript
    const response = await ai.messages.create({
      model: AI_MODEL,
```

**Step 3: Update usage model string (line 43)**

Replace:
```typescript
      model: 'claude-haiku-4-5',
```
With:
```typescript
      model: AI_MODEL,
```

**Step 4: Verify typecheck**

Run:
```bash
cd apps/api && bunx tsc --noEmit
```
Expected: No new errors

**Step 5: Commit**

```bash
git add apps/api/src/generator/skill-generator.ts
git commit -m "refactor: migrate skill-generator to Vertex AI SDK"
```

---

### Task 5: Migrate tools.ts type import

**Files:**
- Modify: `apps/api/src/agent/tools.ts`

**Step 1: Update import path**

Replace line 1:
```typescript
import type { Tool } from '@anthropic-ai/sdk/resources/messages'
```
With:
```typescript
import type { Tool } from '@anthropic-ai/vertex-sdk/resources/messages'
```

Note: If this import path doesn't resolve, try:
```typescript
import type { Tool } from '@anthropic-ai/vertex-sdk/resources'
```

**Step 2: Verify typecheck**

Run:
```bash
cd apps/api && bunx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/agent/tools.ts
git commit -m "refactor: update Tool type import to vertex-sdk"
```

---

### Task 6: Update error message and env config

**Files:**
- Modify: `apps/api/src/routes/conversations.ts` (line ~241)
- Modify: `apps/api/.env.example`

**Step 1: Update error message in conversations.ts**

Replace:
```typescript
            ? 'AI service authentication failed — check ANTHROPIC_API_KEY'
```
With:
```typescript
            ? 'AI service authentication failed — check Vertex AI credentials (run gcloud auth application-default login)'
```

**Step 2: Update .env.example**

Replace the `ANTHROPIC_API_KEY` line and spending limit comment:
```
ANTHROPIC_API_KEY=sk-ant-...
```
With:
```
# Google Vertex AI (for Claude API access)
# Auth: run `gcloud auth application-default login` for local dev
# Production: set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_REGION=us-east5
```

Also update the spending limit comment from "Anthropic API" to "Vertex AI":
```
# Spending limit (USD) for Vertex AI usage
SPENDING_LIMIT_USD=50
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/conversations.ts apps/api/.env.example
git commit -m "chore: update error messages and env config for Vertex AI"
```

---

### Task 7: Local smoke test

**Step 1: Set up local auth**

Run:
```bash
gcloud auth application-default login
```

**Step 2: Set environment variables**

Add to `apps/api/.env`:
```
GOOGLE_CLOUD_PROJECT=<your-project-id>
GOOGLE_CLOUD_REGION=us-east5
```

Remove `ANTHROPIC_API_KEY` from `apps/api/.env`.

**Step 3: Start the API server**

Run:
```bash
bun run dev:api
```
Expected: Server starts without import/config errors

**Step 4: Test a conversation turn**

Send a message through the frontend or via curl to verify streaming works end-to-end through Vertex AI.

**Step 5: Final commit (if any env tweaks needed)**

```bash
git add -A && git commit -m "chore: finalize Vertex AI migration"
```
