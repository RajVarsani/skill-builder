# Vertex AI Migration Design

## Goal

Replace direct Anthropic API (`@anthropic-ai/sdk`) with Google Vertex AI (`@anthropic-ai/vertex-sdk`) for all Claude model access. Full replacement, no dual-provider support.

## Context

The app currently uses `@anthropic-ai/sdk` v0.78.0 with `claude-haiku-4-5` in two backend files:
- **conversation-agent.ts** — streaming with tool use (`messages.stream()`)
- **skill-generator.ts** — non-streaming generation (`messages.create()`)

Frontend has zero SDK usage; all AI goes through backend SSE.

## Approach

Use `@anthropic-ai/vertex-sdk` — Anthropic's official Vertex SDK. Near-identical API surface to the direct SDK. Same `messages.create()`, `messages.stream()`, same tool definitions, same types.

## Changes

### Dependencies (apps/api/package.json)
- Remove: `@anthropic-ai/sdk`
- Add: `@anthropic-ai/vertex-sdk`

### Environment Variables
- Remove: `ANTHROPIC_API_KEY`
- Add: `GOOGLE_CLOUD_PROJECT` (GCP project ID), `GOOGLE_CLOUD_REGION` (default: `us-east5`)
- Auth: Application Default Credentials (ADC) via `gcloud auth application-default login`

### File Changes

**`apps/api/src/agent/conversation-agent.ts`**
- Import: `AnthropicVertex` from `@anthropic-ai/vertex-sdk`
- Constructor: `new AnthropicVertex({ projectId, region })`
- Model: `claude-haiku-4-5@20251001`
- Streaming/tools/events: unchanged

**`apps/api/src/generator/skill-generator.ts`**
- Same import/constructor swap
- Same model string change
- `messages.create()` call: unchanged

**`apps/api/src/agent/tools.ts`**
- Type import path: `@anthropic-ai/vertex-sdk/resources/messages`

**`apps/api/src/routes/conversations.ts`**
- Update error message referencing `ANTHROPIC_API_KEY` to reference Vertex AI auth

**`.env.example`**
- Add new env vars with setup instructions

### Auth Setup (Local Dev)
```bash
gcloud auth application-default login
```

### Auth Setup (Production)
Use a service account with Vertex AI permissions. Set `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to the service account JSON key file.
