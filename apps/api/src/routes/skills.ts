import { Hono } from 'hono'
import { db } from '../db'
import { conversations, publishedSkills, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { generateSkillPackage } from '../agent/skill-generator'
import type { IdentityModel } from '@skill-builder/shared'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const skills = new Hono()

// Protected publish endpoint
const protectedSkills = new Hono<AuthEnv>()
protectedSkills.use('*', authMiddleware)

protectedSkills.post('/conversations/:id/publish', async (c) => {
  const convId = c.req.param('id')
  const userId = c.get('userId')
  const { destination } = await c.req.json() // 'platform' | 'personal'

  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1)
  if (!conversation) return c.json({ error: 'Not found' }, 404)

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const identity = conversation.identityModel as unknown as IdentityModel
  const username = user.name.toLowerCase().replace(/\s+/g, '-')
  const skillName = `acting-as-${username}`

  // Generate skill package
  const generated = await generateSkillPackage(identity, user.name)

  const skillFiles: Record<string, string> = {
    'SKILL.md': generated.skillMd,
  }
  for (const o of generated.overrides) {
    skillFiles[`references/overrides/${o.filename}`] = o.content
  }
  for (const c2 of generated.custom) {
    skillFiles[`references/custom/${c2.filename}`] = c2.content
  }
  skillFiles['references/examples/decisions.md'] = generated.examples.decisions
  skillFiles['references/examples/communication.md'] = generated.examples.communication
  skillFiles['references/examples/reviews.md'] = generated.examples.reviews

  const repoOwner = destination === 'personal' && user.githubAccessToken
    ? username
    : 'skillbuilder-community'

  const installCommand = `npx skills add ${repoOwner}/${skillName}`

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

  await db.update(conversations).set({ status: 'completed' }).where(eq(conversations.id, convId))

  return c.json({
    id: published.id,
    skillName,
    installCommand,
    githubRepoUrl: published.githubRepoUrl,
    files: skillFiles,
  })
})

skills.route('/', protectedSkills)

// Public endpoints — no auth required
skills.get('/skills/:id', async (c) => {
  const id = c.req.param('id')
  const [skill] = await db.select().from(publishedSkills).where(eq(publishedSkills.id, id)).limit(1)
  if (!skill) return c.json({ error: 'Not found' }, 404)
  return c.json(skill)
})

// Public profile
skills.get('/users/:username/skill', async (c) => {
  const username = c.req.param('username')
  const skillName = `acting-as-${username}`
  const [skill] = await db.select().from(publishedSkills).where(eq(publishedSkills.skillName, skillName)).limit(1)
  if (!skill) return c.json({ error: 'Not found' }, 404)
  return c.json({
    skillName: skill.skillName,
    installCommand: skill.installCommand,
    identityModel: skill.identityModel,
    publishedAt: skill.publishedAt,
  })
})

export default skills
