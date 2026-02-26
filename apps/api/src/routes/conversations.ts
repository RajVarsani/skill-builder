import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { db } from '../db'
import { conversations, conversationMessages, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { runConversationTurn, cleanResponseText } from '../agent/conversation-agent'
import { createEmptyIdentityModel, applyUpdate } from '../agent/identity-builder'
import { getNextPhase, getPhaseLabel } from '../agent/phase-manager'
import type { Phase, IdentityModel } from '@skill-builder/shared'

const conv = new Hono()

// Start new conversation (or return active one)
conv.post('/', async (c) => {
  const userId = c.get('userId' as never) as string

  // Check for existing active conversation
  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.status, 'active')))
    .limit(1)

  if (existing) {
    return c.json(existing)
  }

  // Get user info for identity model
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const identityModel = createEmptyIdentityModel(user?.name || 'User', user?.avatarUrl || undefined)

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
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
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

  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const phase = conversation.phase

  // Save user message
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

  const currentPhase = parsePhase(phase)
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
          await stream.writeSSE({ event: 'identity_update', data: JSON.stringify(event.data) })
          break

        case 'phase_signal': {
          const nextPhase = getNextPhase(currentPhase, event.data)
          if (nextPhase) {
            await db.update(conversations).set({ phase: getPhaseLabel(nextPhase) }).where(eq(conversations.id, id))
            await stream.writeSSE({ event: 'phase_change', data: JSON.stringify({ phase: nextPhase }) })
          }
          break
        }

        case 'done': {
          const cleanText = cleanResponseText(fullText)
          await db.insert(conversationMessages).values({
            conversationId: id,
            role: 'assistant',
            content: cleanText,
            identityModelDelta: updates.length > 0 ? updates as any : null,
            phase,
          })
          await db.update(conversations).set({ identityModel: identityModel as any, updatedAt: new Date() }).where(eq(conversations.id, id))
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
