# Gemini Migration Design

## Goal

Replace Anthropic Claude (via Vertex AI SDK) with Google Gemini 2.0 Flash using `@google/genai` SDK on Vertex AI. Full replacement — no Anthropic fallback.

## Context

The app uses two AI integration points:
- **conversation-agent.ts** — streaming with 5 custom tools (tool use loop)
- **skill-generator.ts** — non-streaming text generation

Currently wired to Anthropic's Vertex SDK which has 0 GCP quota. Switching to Gemini eliminates the quota blocker since Gemini models have default quota on Vertex AI.

## Approach

Use `@google/genai` — Google's unified GenAI SDK. Set `vertexai: true` for Vertex AI auth (ADC). Uses `generateContentStream()` for streaming and `functionDeclarations` for tool calling.

## Key API Differences

| Concept | Anthropic | Gemini (@google/genai) |
|---------|-----------|----------------------|
| SDK | `@anthropic-ai/vertex-sdk` | `@google/genai` |
| Client | `new AnthropicVertex({ projectId, region })` | `new GoogleGenAI({ vertexai: true, project, location })` |
| Model | `claude-haiku-4-5` | `gemini-2.0-flash` |
| Messages | `{ role, content: string }` | `{ role, parts: [{ text }] }` |
| System prompt | `system` param | `config.systemInstruction` |
| Streaming | `messages.stream()` → event types | `models.generateContentStream()` → chunk iteration |
| Tool defs | `input_schema: { ... }` | `parametersJsonSchema: { ... }` |
| Tool calls | `content_block` with `tool_use` type | `chunk.candidates[0].content.parts` with `functionCall` |
| Tool results | `{ type: 'tool_result', tool_use_id, content }` | `{ functionResponse: { name, response } }` |
| Usage | `usage.input_tokens / output_tokens` | `usageMetadata.promptTokenCount / candidatesTokenCount` |

## Changes

### Dependencies (apps/api/package.json)
- Remove: `@anthropic-ai/sdk`, `@anthropic-ai/vertex-sdk`
- Add: `@google/genai`

### ai-client.ts — New client config
```typescript
import { GoogleGenAI } from '@google/genai'
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_REGION || 'global',
})
export { ai }
export const AI_MODEL = 'gemini-2.0-flash'
```

### tools.ts — Convert 5 tool definitions
Convert from Anthropic `input_schema` format to Gemini `functionDeclarations` format. Schema shapes are nearly identical.

### conversation-agent.ts — Full rewrite of streaming + tool loop
- Convert message format to Gemini's `contents` with `parts`
- Use `generateContentStream()` instead of `messages.stream()`
- Parse streaming chunks for text parts and function calls
- Implement tool use loop with `functionResponse` parts
- Extract usage from `usageMetadata`

### skill-generator.ts — Rewrite to use generateContent
- Use `ai.models.generateContent()` instead of `messages.create()`
- Extract text from response parts

### conversations.ts — Update error messages
- Reference Gemini/Vertex AI instead of Anthropic

### .env.example — Update comments
- Reference Gemini instead of Claude
