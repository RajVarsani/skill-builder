import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { PublishedSkill } from '../db/models/published-skill'
import { runConversationTurn } from '../agent/conversation-agent'
import { skillEngine } from '../agent/skill-matching-engine'
import { BlockStateMachine } from '../agent/block-state-machine'
import { checkSpendingLimit, recordUsage } from '../billing/usage-tracker'
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

  // First check for an active conversation
  const active = await Conversation.findOne({ userId, status: 'active' })
  if (active) {
    const bsm = new BlockStateMachine(active.selectedDomains, active.blockStates)
    const comp = bsm.getCompletion()

    return c.json({
      conversation: {
        id: active._id.toString(),
        phase: active.phase,
        selectedDomains: active.selectedDomains,
        blockStates: active.blockStates,
        matchedSkills: active.matchedSkills,
        messages: active.messages.map((m) => ({
          role: m.role,
          content: m.content,
          phase: m.phase,
        })),
        status: active.status,
        skillMarkdown: active.skillMarkdown ?? null,
        completion: {
          percentage: comp.percentage,
          blocksDiscovered: comp.filled,
          skillsMatched: active.matchedSkills.length,
        },
      },
    })
  }

  // Check for a recently completed/published conversation so the frontend
  // can redirect to the success page instead of starting fresh
  const completed = await Conversation.findOne({
    userId,
    status: 'completed',
    phase: 'published',
  }).sort({ updatedAt: -1 })

  if (completed) {
    const publishedSkill = await PublishedSkill.findOne({
      conversationId: completed._id,
    })

    if (publishedSkill) {
      return c.json({
        conversation: {
          id: completed._id.toString(),
          phase: completed.phase,
          status: completed.status,
          publishedSkillId: publishedSkill._id.toString(),
          selectedDomains: completed.selectedDomains,
          blockStates: completed.blockStates,
          matchedSkills: completed.matchedSkills,
          messages: [],
        },
      })
    }
  }

  return c.json({ conversation: null })
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

  const spendCheck = await checkSpendingLimit()
  if (!spendCheck.allowed) {
    return c.json({
      error: 'Spending limit exceeded',
      totalSpent: spendCheck.totalSpent,
      limit: spendCheck.limit,
    }, 503)
  }

  const messages = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return streamSSE(c, async (stream) => {
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let model = 'gemini-3-flash-preview'

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
        if (event.type === 'usage') {
          totalInputTokens += event.data.inputTokens
          totalOutputTokens += event.data.outputTokens
          model = event.data.model
          continue
        }

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
          // Mark arrays as modified — Mongoose may lose dirty tracking
          // after the earlier save() that persisted the user message
          conversation.markModified('blockStates')
          conversation.markModified('matchedSkills')
          await conversation.save()
        }

        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event.data),
        })
      }

      if (totalInputTokens > 0 || totalOutputTokens > 0) {
        await recordUsage({
          conversationId: conversation._id,
          userId,
          source: 'conversation',
          model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        })
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('Conversation stream error:', errMsg)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({
          message: errMsg.includes('RESOURCE_EXHAUSTED')
            ? 'AI quota exhausted — please try again later'
            : errMsg.includes('authentication_error') || errMsg.includes('UNAUTHENTICATED')
              ? 'AI service authentication failed — check Vertex AI credentials (run gcloud auth application-default login)'
              : errMsg.includes('rate_limit') || errMsg.includes('RATE_LIMIT')
                ? 'Rate limited — please try again in a moment'
                : 'An error occurred during the conversation',
        }),
      })
    }
  })
})

conversations.post('/active/reset', async (c) => {
  const userId = c.get('userId')
  const conversation = await Conversation.findOne({ userId, status: 'active' })

  if (conversation) {
    conversation.status = 'abandoned'
    await conversation.save()
  }

  const newConversation = await Conversation.create({
    userId,
    phase: 'domain_discovery',
    selectedDomains: [],
    blockStates: [],
    matchedSkills: [],
    messages: [],
    status: 'active',
  })

  return c.json({ id: newConversation._id.toString() })
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

conversations.get('/:id/skills/search', async (c) => {
  const query = c.req.query('q')
  if (!query || query.length < 2) return c.json({ results: [] })
  const results = skillEngine.search(query, undefined, 10)
  return c.json({ results })
})

conversations.post('/:id/skills/add', async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')
  const { skill } = await c.req.json<{
    skill: { skillId: string; name: string; source: string; installs: number; relevanceScore: number }
  }>()

  const conversation = await Conversation.findOne({ _id: conversationId, userId })
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const existing = conversation.matchedSkills.find((s) => s.skillId === skill.skillId)
  if (existing) {
    if (existing.status === 'rejected') {
      existing.status = 'proposed'
      await conversation.save()
    }
    return c.json({ skill: existing })
  }

  const newSkill = { ...skill, status: 'proposed' as const }
  conversation.matchedSkills.push(newSkill)
  await conversation.save()
  return c.json({ skill: newSkill })
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
