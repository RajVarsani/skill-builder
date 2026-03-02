# Gemini Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Anthropic Claude with Google Gemini 2.0 Flash using `@google/genai` SDK on Vertex AI.

**Architecture:** Swap SDK, rewrite tool definitions to Gemini's `functionDeclarations` format, rewrite the streaming conversation loop to use `generateContentStream()` with Gemini's chunk-based iteration, and rewrite the skill generator to use `generateContent()`. The `processToolCall` function and all SSE event types stay identical.

**Tech Stack:** `@google/genai` SDK, Vertex AI, Gemini 2.0 Flash, Bun runtime

---

### Task 1: Swap SDK dependencies

**Files:**
- Modify: `apps/api/package.json`

**Step 1: Remove old SDKs and add new one**

Run:
```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder/apps/api && bun remove @anthropic-ai/sdk @anthropic-ai/vertex-sdk && bun add @google/genai
```

**Step 2: Verify installation**

Run:
```bash
ls node_modules/@google/genai/package.json
```
Expected: File exists

**Step 3: Commit**

```bash
git add apps/api/package.json bun.lock
git commit -m "chore: swap Anthropic SDKs for @google/genai"
```

---

### Task 2: Rewrite ai-client.ts for Gemini

**Files:**
- Modify: `apps/api/src/lib/ai-client.ts`

**Step 1: Replace the entire file with:**

```typescript
import { GoogleGenAI } from '@google/genai'

const project = process.env.GOOGLE_CLOUD_PROJECT
if (!project) throw new Error('GOOGLE_CLOUD_PROJECT env var is required')

const location = process.env.GOOGLE_CLOUD_REGION || 'global'

export const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
})

export const AI_MODEL = 'gemini-2.0-flash'
```

**Step 2: Verify typecheck**

Run:
```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder/apps/api && bunx tsc --noEmit
```
Expected: Errors in files that still import old types (tools.ts, conversation-agent.ts, skill-generator.ts) — that's fine, we'll fix those next.

**Step 3: Commit**

```bash
git add apps/api/src/lib/ai-client.ts
git commit -m "feat: rewrite ai-client for Gemini via @google/genai"
```

---

### Task 3: Rewrite tools.ts for Gemini functionDeclarations

**Files:**
- Modify: `apps/api/src/agent/tools.ts`

**Step 1: Replace the entire file with:**

```typescript
import type { FunctionDeclaration } from '@google/genai'

export const identityTools: FunctionDeclaration[] = [
  {
    name: 'add_identity_block',
    description:
      'Record a discovered aspect of the user\'s professional identity. Call this 1-3 times per turn whenever you learn something concrete. Fire-and-forget — no response needed.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'personality_trait',
            'core_value',
            'domain_expertise',
            'communication_style',
            'decision_pattern',
            'tool_preference',
            'opinion',
            'anti_pattern',
            'working_style',
          ],
          description: 'Category of the identity block',
        },
        label: {
          type: 'string',
          description: 'Short display label, 2-4 words, e.g. "Pragmatic", "Ship-oriented"',
        },
        detail: {
          type: 'string',
          description: 'One sentence explaining WHY this is true about the user',
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'How confident you are about this block',
        },
        source_type: {
          type: 'string',
          enum: ['inferred', 'stated', 'confirmed'],
          description: 'Whether the user stated this directly or you inferred it',
        },
        related_domain: {
          type: 'string',
          description: 'Optional domain this block relates to',
        },
        display_priority: {
          type: 'number',
          description: 'Priority 1-10. 10 = defining trait.',
        },
      },
      required: ['category', 'label', 'detail', 'confidence', 'source_type'],
    },
  },
  {
    name: 'confirm_identity_block',
    description:
      'Lock in a tentative block after the user confirms it. Triggers visual solidification animation.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'The label of the block to confirm',
        },
        new_confidence: {
          type: 'string',
          enum: ['medium', 'high'],
          description: 'Updated confidence level',
        },
      },
      required: ['label', 'new_confidence'],
    },
  },
  {
    name: 'offer_quick_replies',
    description:
      'Present tappable chip options alongside your question. Call this with EVERY question that can be answered by tapping.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        chips: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Chip display text' },
              value: { type: 'string', description: 'Value sent when tapped' },
              emoji: { type: 'string', description: 'Optional emoji prefix' },
            },
            required: ['label', 'value'],
          },
          description: 'Array of chip options to show',
        },
        allow_custom: {
          type: 'boolean',
          description: 'Whether to show an "Other..." free-text option',
        },
        multi_select: {
          type: 'boolean',
          description: 'Whether multiple chips can be selected (for domain selection)',
        },
      },
      required: ['chips'],
    },
  },
  {
    name: 'signal_phase_transition',
    description:
      'Move the conversation to the next phase. Call this when the current phase objectives are met.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        completed_phase: {
          type: 'string',
          enum: ['domain_discovery', 'rapid_profiling', 'review'],
          description: 'The phase that just completed',
        },
        next_phase: {
          type: 'string',
          enum: ['rapid_profiling', 'review', 'published'],
          description: 'The phase to transition to',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of what was accomplished in the completed phase',
        },
      },
      required: ['completed_phase', 'next_phase', 'summary'],
    },
  },
  {
    name: 'match_skills',
    description:
      'Search the 75k+ skills.sh dataset for matching community skills. Call after domain selection, after learning specific tools/frameworks, and during the final review sweep. This is a REAL tool that returns actual search results.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query, e.g. "react state management", "laravel", "git workflows"',
        },
        domain: {
          type: 'string',
          description: 'Optional domain filter: engineering, design, product, data, marketing, operations',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 5, max 10)',
        },
      },
      required: ['query'],
    },
  },
]
```

Note: The `FunctionDeclaration` type import may need adjustment. If `@google/genai` doesn't export it directly, check the package exports and use the correct path. The type may also be inline-able without importing.

**Step 2: Verify typecheck** (tools.ts only — other files still broken)

Run:
```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder/apps/api && bunx tsc --noEmit 2>&1 | grep tools.ts
```
Expected: No errors from tools.ts

**Step 3: Commit**

```bash
git add apps/api/src/agent/tools.ts
git commit -m "refactor: rewrite tool definitions for Gemini functionDeclarations"
```

---

### Task 4: Rewrite conversation-agent.ts for Gemini streaming

This is the biggest task. The `processToolCall` function (lines 202-296) stays **completely unchanged**. Only the streaming loop and message formatting change.

**Files:**
- Modify: `apps/api/src/agent/conversation-agent.ts`

**Step 1: Replace the entire file with:**

```typescript
import type { Content, Part } from '@google/genai'
import { ai, AI_MODEL } from '../lib/ai-client'
import type {
  ConversationPhase,
  MatchedSkill,
  IdentityBlock,
} from '@actingas/shared/src/types'
import { buildSystemPrompt } from './system-prompts'
import { identityTools } from './tools'
import { BlockStateMachine } from './block-state-machine'
import type { IBlockState, IMatchedSkill } from '../db/models/conversation'

export type ConversationEvent =
  | { type: 'text_chunk'; data: { text: string } }
  | { type: 'tool_activity'; data: { tool: string; label: string } }
  | { type: 'block_added'; data: { block: IdentityBlock } }
  | { type: 'block_confirmed'; data: { blockId: string } }
  | { type: 'skill_matched'; data: { skill: MatchedSkill } }
  | { type: 'quick_replies'; data: { chips: string[]; multiSelect: boolean } }
  | { type: 'phase_change'; data: { phase: ConversationPhase } }
  | { type: 'completion_update'; data: { percentage: number; blocksDiscovered: number; skillsMatched: number } }
  | { type: 'usage'; data: { inputTokens: number; outputTokens: number; model: string } }
  | { type: 'done'; data: { assistantMessage: string } }

interface ToolInput {
  [key: string]: unknown
}

interface RunTurnParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  phase: ConversationPhase
  blockStates: IBlockState[]
  matchedSkills: IMatchedSkill[]
  selectedDomains: string[]
  skillSearchFn: (query: string, domain?: string, limit?: number) => unknown[]
}

export async function* runConversationTurn(
  params: RunTurnParams
): AsyncGenerator<ConversationEvent> {
  const { messages, phase, blockStates, matchedSkills, selectedDomains, skillSearchFn } = params

  const blockMachine = new BlockStateMachine(selectedDomains, blockStates)
  const currentPhase = { value: phase }

  const systemPrompt = buildSystemPrompt(
    currentPhase.value,
    blockMachine,
    matchedSkills as MatchedSkill[],
    selectedDomains
  )

  // Convert messages to Gemini's Content format
  const contents: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const TOOL_LABELS: Record<string, string> = {
    add_identity_block: 'Discovering identity trait',
    confirm_identity_block: 'Confirming trait',
    match_skills: 'Searching skills registry',
    offer_quick_replies: 'Preparing options',
    signal_phase_transition: 'Moving to next phase',
  }

  let continueLoop = true
  let fullAssistantText = ''

  while (continueLoop) {
    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        tools: [{ functionDeclarations: identityTools }],
      },
    })

    let turnText = ''
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = []
    const modelParts: Part[] = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for await (const chunk of stream) {
      // Extract usage metadata
      if (chunk.usageMetadata) {
        totalInputTokens = chunk.usageMetadata.promptTokenCount || 0
        totalOutputTokens = chunk.usageMetadata.candidatesTokenCount || 0
      }

      const parts = chunk.candidates?.[0]?.content?.parts
      if (!parts) continue

      for (const part of parts) {
        if (part.text) {
          yield { type: 'text_chunk', data: { text: part.text } }
          turnText += part.text
        }

        if (part.functionCall) {
          const fnName = part.functionCall.name!
          const fnArgs = (part.functionCall.args || {}) as Record<string, unknown>
          const label = TOOL_LABELS[fnName] || fnName
          yield { type: 'tool_activity', data: { tool: fnName, label } }

          functionCalls.push({ name: fnName, args: fnArgs })
          modelParts.push({ functionCall: { name: fnName, args: fnArgs } })
        }
      }
    }

    fullAssistantText += turnText

    // Add any text to model parts
    if (turnText) {
      modelParts.unshift({ text: turnText })
    }

    yield {
      type: 'usage' as const,
      data: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        model: AI_MODEL,
      },
    }

    if (functionCalls.length > 0) {
      // Process tool calls and build function responses
      const functionResponseParts: Part[] = []

      for (const fc of functionCalls) {
        const input: ToolInput = fc.args

        // Process side effects (blocks, skills, phases)
        const events = processToolCall(
          fc.name,
          input,
          blockMachine,
          currentPhase,
          skillSearchFn
        )
        for (const evt of events) {
          yield evt
        }

        // Build function response
        const result =
          fc.name === 'match_skills'
            ? skillSearchFn(
                input.query as string,
                input.domain as string | undefined,
                input.limit as number | undefined
              )
            : { success: true }

        functionResponseParts.push({
          functionResponse: {
            name: fc.name,
            response: result as object,
          },
        })
      }

      // Add model turn + function response turn to conversation
      contents.push({ role: 'model', parts: modelParts })
      contents.push({ role: 'user', parts: functionResponseParts })
    } else {
      continueLoop = false
    }

    const completion = blockMachine.getCompletion()
    yield {
      type: 'completion_update',
      data: {
        percentage: completion.percentage,
        blocksDiscovered: completion.filled,
        skillsMatched: matchedSkills.filter((s) => s.status !== 'rejected').length,
      },
    }
  }

  yield { type: 'done', data: { assistantMessage: fullAssistantText } }
}

// processToolCall stays EXACTLY the same — copy from current file lines 202-296
function processToolCall(
  toolName: string,
  input: ToolInput,
  blockMachine: BlockStateMachine,
  currentPhase: { value: ConversationPhase },
  skillSearchFn: (query: string, domain?: string, limit?: number) => unknown[]
): ConversationEvent[] {
  const events: ConversationEvent[] = []

  switch (toolName) {
    case 'add_identity_block': {
      const blockId = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const block: IdentityBlock = {
        blockId,
        category: input.category as string,
        label: input.label as string,
        detail: input.detail as string,
        confidence: input.confidence as 'low' | 'medium' | 'high',
        sourceType: input.source_type as 'inferred' | 'stated' | 'confirmed',
        status: 'tentative',
      }
      blockMachine.addBlock({
        blockId,
        category: block.category,
        label: block.label,
        detail: block.detail,
        confidence: block.confidence,
        sourceType: block.sourceType,
        status: 'tentative',
      })
      events.push({ type: 'block_added', data: { block } })
      break
    }

    case 'confirm_identity_block': {
      const confirmed = blockMachine.confirmBlock(
        input.label as string,
        input.new_confidence as 'medium' | 'high'
      )
      if (confirmed) {
        events.push({ type: 'block_confirmed', data: { blockId: confirmed.blockId } })
      }
      break
    }

    case 'offer_quick_replies': {
      const chips = (input.chips as Array<{ label: string; value: string }>).map(
        (c) => c.label
      )
      events.push({
        type: 'quick_replies',
        data: {
          chips,
          multiSelect: (input.multi_select as boolean) || false,
        },
      })
      break
    }

    case 'signal_phase_transition': {
      currentPhase.value = input.next_phase as ConversationPhase
      events.push({
        type: 'phase_change',
        data: { phase: input.next_phase as ConversationPhase },
      })
      break
    }

    case 'match_skills': {
      const results = skillSearchFn(
        input.query as string,
        input.domain as string | undefined,
        input.limit as number | undefined
      ) as Array<{
        skillId: string
        name: string
        source: string
        installs: number
        relevanceScore: number
      }>

      for (const result of results) {
        events.push({
          type: 'skill_matched',
          data: {
            skill: { ...result, status: 'proposed' },
          },
        })
      }
      break
    }
  }

  return events
}
```

**Important notes for the implementer:**
- The `Content` and `Part` types may not be exported directly from `@google/genai`. Check the package exports. If not available, use inline types or import from a subpath.
- `chunk.candidates?.[0]?.content?.parts` — defensive chaining is critical; some chunks may not have parts.
- `part.functionCall.args` returns a plain object, not a JSON string — no need to `JSON.parse`.
- `functionResponse.response` must be an object (not a string). For `match_skills`, pass the array directly. For others, pass `{ success: true }`.
- The `role` mapping: Anthropic uses `'assistant'`, Gemini uses `'model'`.

**Step 2: Verify typecheck**

Run:
```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder/apps/api && bunx tsc --noEmit
```
Expected: May still have errors in skill-generator.ts, but conversation-agent.ts should be clean.

**Step 3: Commit**

```bash
git add apps/api/src/agent/conversation-agent.ts
git commit -m "refactor: rewrite conversation-agent for Gemini streaming + tool calling"
```

---

### Task 5: Rewrite skill-generator.ts for Gemini

**Files:**
- Modify: `apps/api/src/generator/skill-generator.ts`

**Step 1: Update imports and the generateSkillMarkdown function**

Replace lines 1 and 27-55 (the import and the API call + response parsing inside the try block):

Change import from:
```typescript
import { ai, AI_MODEL } from '../lib/ai-client'
```
(This stays the same — no change needed.)

Replace the try block (lines 27-55) with:
```typescript
  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: buildUserPrompt(userName, slug, identityBlocks, activeSkills, selectedDomains),
      config: {
        systemInstruction: SKILL_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
      },
    })

    const usage: SkillGenerationUsage = {
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      model: AI_MODEL,
    }

    const text = response.text
    if (text) {
      const content = text.trim()
      // Strip code fences if model wraps the output
      if (content.startsWith('```')) {
        const lines = content.split('\n')
        const start = lines[0].startsWith('```') ? 1 : 0
        const end = lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length
        return { markdown: lines.slice(start, end).join('\n').trim(), usage }
      }
      return { markdown: content, usage }
    }
    throw new Error('No text in response')
```

**Key differences:**
- `ai.models.generateContent()` instead of `ai.messages.create()`
- `contents` is just a string (the user prompt)
- `config.systemInstruction` instead of `system` param
- `response.text` is a convenience getter instead of `response.content[0].text`
- Usage: `response.usageMetadata.promptTokenCount` / `candidatesTokenCount`

**Step 2: Verify typecheck**

Run:
```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder/apps/api && bunx tsc --noEmit
```
Expected: Clean — no errors

**Step 3: Commit**

```bash
git add apps/api/src/generator/skill-generator.ts
git commit -m "refactor: rewrite skill-generator for Gemini generateContent"
```

---

### Task 6: Update error handling and env config

**Files:**
- Modify: `apps/api/src/routes/conversations.ts` (line ~241-242)
- Modify: `apps/api/.env.example`

**Step 1: Update error message in conversations.ts**

Replace:
```typescript
            ? 'AI service authentication failed — check Vertex AI credentials (run gcloud auth application-default login)'
            : errMsg.includes('rate_limit')
```
With:
```typescript
            ? 'AI service authentication failed — check Vertex AI credentials (run gcloud auth application-default login)'
            : errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('rate_limit')
```

This ensures Gemini's quota error (`RESOURCE_EXHAUSTED`) is caught alongside rate limits.

**Step 2: Update .env.example comments**

In `.env.example`, update the Vertex AI comment block to mention Gemini:

Replace:
```
# Google Vertex AI (for Claude API access)
```
With:
```
# Google Vertex AI (for Gemini API access)
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/conversations.ts apps/api/.env.example
git commit -m "chore: update error handling and env docs for Gemini"
```

---

### Task 7: Smoke test

**Step 1: Kill any running dev server**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

**Step 2: Start the API server**

```bash
cd /Users/abhisheknaidu/Desktop/workspace/POCs/skill-builder && bun run dev:api
```

Expected: Server starts, MongoDB connects, skills loaded, no import errors.

**Step 3: Test via frontend or curl**

Open the frontend at `http://localhost:5173` and start a conversation. Verify:
- Text streams back
- Tool calls work (blocks appear, quick replies show)
- No 429 quota errors (Gemini has default quota)

**Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "chore: finalize Gemini migration"
```
