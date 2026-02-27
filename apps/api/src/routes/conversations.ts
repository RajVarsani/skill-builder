import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { runConversationTurn } from '../agent/conversation-agent'
import { skillEngine } from '../agent/skill-matching-engine'
import type { AppEnv } from '../types'

const conversations = new Hono<AppEnv>()

conversations.use('*', authMiddleware)

conversations.post('/', async (c) => {
  const userId = c.get('userId')

  const existing = await Conversation.findOne({ userId, status: 'active' })
  if (existing) {
    return c.json({ id: existing._id.toString(), resuming: true })
  }

  const conversation = await Conversation.create({
    userId,
    phase: 'domain_discovery',
    selectedDomains: [],
    blockStates: [],
    matchedSkills: [],
    messages: [],
    status: 'active',
  })

  return c.json({ id: conversation._id.toString(), resuming: false })
})

conversations.get('/active', async (c) => {
  const userId = c.get('userId')
  const conversation = await Conversation.findOne({ userId, status: 'active' })

  if (!conversation) {
    return c.json({ conversation: null })
  }

  return c.json({
    conversation: {
      id: conversation._id.toString(),
      phase: conversation.phase,
      selectedDomains: conversation.selectedDomains,
      blockStates: conversation.blockStates,
      matchedSkills: conversation.matchedSkills,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        phase: m.phase,
      })),
      status: conversation.status,
    },
  })
})

conversations.post('/:id/messages', async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')
  const { content } = await c.req.json<{ content: string }>()

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
    status: 'active',
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  conversation.messages.push({
    role: 'user',
    content,
    phase: conversation.phase,
    createdAt: new Date(),
  })
  await conversation.save()

  const messages = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return streamSSE(c, async (stream) => {
    try {
      const events = runConversationTurn({
        messages,
        phase: conversation.phase,
        blockStates: conversation.blockStates,
        matchedSkills: conversation.matchedSkills,
        selectedDomains: conversation.selectedDomains,
        skillSearchFn: (query, domain, limit) =>
          skillEngine.search(query, domain, limit),
      })

      for await (const event of events) {
        if (event.type === 'block_added') {
          conversation.blockStates.push({
            blockId: event.data.block.blockId,
            category: event.data.block.category,
            label: event.data.block.label,
            detail: event.data.block.detail,
            confidence: event.data.block.confidence,
            sourceType: event.data.block.sourceType,
            status: event.data.block.status,
          })
        }

        if (event.type === 'block_confirmed') {
          const block = conversation.blockStates.find(
            (b) => b.blockId === event.data.blockId
          )
          if (block) {
            block.status = 'confirmed'
          }
        }

        if (event.type === 'skill_matched') {
          const existing = conversation.matchedSkills.find(
            (s) => s.skillId === event.data.skill.skillId
          )
          if (!existing) {
            conversation.matchedSkills.push({
              skillId: event.data.skill.skillId,
              name: event.data.skill.name,
              source: event.data.skill.source,
              installs: event.data.skill.installs,
              relevanceScore: event.data.skill.relevanceScore,
              status: 'proposed',
            })
          }
        }

        if (event.type === 'phase_change') {
          conversation.phase = event.data.phase
          if (event.data.phase === 'rapid_profiling' && conversation.selectedDomains.length === 0) {
            const userMsg = conversation.messages[conversation.messages.length - 1]
            if (userMsg) {
              conversation.selectedDomains = parseDomains(userMsg.content)
            }
          }
        }

        if (event.type === 'done') {
          conversation.messages.push({
            role: 'assistant',
            content: event.data.assistantMessage,
            phase: conversation.phase,
            createdAt: new Date(),
          })
          await conversation.save()
        }

        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event.data),
        })
      }
    } catch (error) {
      console.error('Conversation stream error:', error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ message: 'An error occurred during the conversation' }),
      })
    }
  })
})

conversations.get('/:id/blocks', async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  })
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  return c.json({ blocks: conversation.blockStates })
})

conversations.get('/:id/skills', async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  })
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  return c.json({ skills: conversation.matchedSkills })
})

conversations.post('/:id/skills/:skillId/confirm', async (c) => {
  const userId = c.get('userId')
  const { id, skillId } = c.req.param()

  const conversation = await Conversation.findOne({ _id: id, userId })
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const skill = conversation.matchedSkills.find((s) => s.skillId === skillId)
  if (!skill) return c.json({ error: 'Skill not found' }, 404)

  skill.status = 'confirmed'
  await conversation.save()

  return c.json({ skill })
})

conversations.post('/:id/skills/:skillId/reject', async (c) => {
  const userId = c.get('userId')
  const { id, skillId } = c.req.param()

  const conversation = await Conversation.findOne({ _id: id, userId })
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const skill = conversation.matchedSkills.find((s) => s.skillId === skillId)
  if (!skill) return c.json({ error: 'Skill not found' }, 404)

  skill.status = 'rejected'
  await conversation.save()

  return c.json({ skill })
})

function parseDomains(text: string): string[] {
  const domainMap: Record<string, string> = {
    engineering: 'engineering',
    design: 'design',
    product: 'product',
    data: 'data',
    analytics: 'data',
    marketing: 'marketing',
    operations: 'operations',
  }

  const lower = text.toLowerCase()
  return Object.entries(domainMap)
    .filter(([key]) => lower.includes(key))
    .map(([, value]) => value)
    .filter((v, i, a) => a.indexOf(v) === i)
}

export { conversations }
