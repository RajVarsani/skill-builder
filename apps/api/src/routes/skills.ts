import { Hono } from 'hono'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { PublishedSkill } from '../db/models/published-skill'
import { User } from '../db/models/user'
import { generateSkillPackage, generateSkillMarkdown, generateSkillOverrides } from '../generator/skill-generator'
import { publishToGitHub, listAppInstallations } from '../generator/github-publisher'
import type { AppEnv } from '../types'

const skills = new Hono<AppEnv>()

skills.post('/conversations/:id/preview', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
    status: { $in: ['active', 'completed'] },
  })
  if (!conversation) return c.json({ error: 'Conversation not found' }, 404)

  const user = await User.findById(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  try {
    console.log(`Preview: generating for ${user.name}, ${conversation.matchedSkills.length} skills, domains: ${conversation.selectedDomains}`)
    const markdown = await generateSkillMarkdown(
      user.name,
      conversation.blockStates,
      conversation.matchedSkills,
      conversation.selectedDomains
    )
    console.log(`Preview: generated ${markdown.length} chars`)
    conversation.skillMarkdown = markdown
    await conversation.save()
    return c.json({ markdown })
  } catch (error) {
    console.error('Preview error details:', error instanceof Error ? error.message : error)
    console.error('Preview error stack:', error instanceof Error ? error.stack : 'no stack')
    return c.json({ error: 'Failed to generate preview' }, 500)
  }
})

skills.patch('/conversations/:id/skill-markdown', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')
  const { markdown } = await c.req.json<{ markdown: string }>()

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
    status: { $in: ['active', 'completed'] },
  })
  if (!conversation) return c.json({ error: 'Conversation not found' }, 404)

  conversation.skillMarkdown = markdown
  await conversation.save()
  return c.json({ ok: true })
})

skills.post('/conversations/:id/publish', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
    status: { $in: ['active', 'completed'] },
  })
  if (!conversation) return c.json({ error: 'Conversation not found' }, 404)

  const user = await User.findById(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  try {
    const body = await c.req.json<{ skillMarkdown?: string; target?: 'org' | 'personal' }>().catch(() => ({} as { skillMarkdown?: string; target?: 'org' | 'personal' }))
    const slug = user.name.toLowerCase().replace(/\s+/g, '-')

    let files: { path: string; content: string }[]

    if (body.skillMarkdown) {
      // User's edited SKILL.md + generate override files for references/matched/
      const overrides = await generateSkillOverrides(
        user.name,
        conversation.blockStates,
        conversation.matchedSkills,
        conversation.selectedDomains
      )
      files = [
        { path: `acting-as-${slug}/SKILL.md`, content: body.skillMarkdown },
        ...overrides,
      ]
    } else {
      files = await generateSkillPackage(
        user.name,
        conversation.blockStates,
        conversation.matchedSkills,
        conversation.selectedDomains
      )
    }

    console.log(`Publish: ${files.length} files for ${user.name}`)

    const usePersonalGithub = body.target === 'personal' && user.githubAccessToken
    const publishResult = await publishToGitHub({
      userName: user.name,
      files,
      githubAccessToken: usePersonalGithub ? user.githubAccessToken : undefined,
    })

    const skillName = `acting-as-${user.name.toLowerCase().replace(/\s+/g, '-')}`
    const publishedSkill = await PublishedSkill.findOneAndUpdate(
      { skillName },
      {
        userId: user._id,
        conversationId: conversation._id,
        skillName,
        githubRepoUrl: publishResult.repoUrl,
        githubRepoOwner: publishResult.repoOwner,
        installCommand: publishResult.installCommand,
        publishMethod: usePersonalGithub ? 'personal' : 'org',
        blockStates: conversation.blockStates,
        matchedSkills: conversation.matchedSkills,
        customSkills: [],
        skillFiles: files,
      },
      { upsert: true, new: true }
    )

    conversation.phase = 'published'
    conversation.status = 'completed'
    await conversation.save()

    return c.json({
      id: publishedSkill._id.toString(),
      installCommand: publishResult.installCommand,
      repoUrl: publishResult.repoUrl,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[publish] Failed for user ${user.name}:`, msg)
    if (error instanceof Error && error.stack) {
      console.error('[publish] Stack:', error.stack)
    }
    return c.json({ error: `Failed to publish skill: ${msg}` }, 500)
  }
})

skills.get('/skills/:id', async (c) => {
  const skillId = c.req.param('id')
  const skill = await PublishedSkill.findById(skillId)
  if (!skill) return c.json({ error: 'Skill not found' }, 404)

  return c.json({
    skill: {
      id: skill._id.toString(),
      skillName: skill.skillName,
      installCommand: skill.installCommand,
      repoUrl: skill.githubRepoUrl,
      blockStates: skill.blockStates,
      matchedSkills: skill.matchedSkills,
    },
  })
})

skills.get('/users/:username/skill', async (c) => {
  const username = c.req.param('username')
  const skillName = `acting-as-${username.toLowerCase()}`
  const skill = await PublishedSkill.findOne({ skillName })
  if (!skill) return c.json({ error: 'Skill not found' }, 404)

  const user = await User.findById(skill.userId)

  return c.json({
    skill: {
      id: skill._id.toString(),
      skillName: skill.skillName,
      installCommand: skill.installCommand,
      repoUrl: skill.githubRepoUrl,
      blockStates: skill.blockStates,
      matchedSkills: skill.matchedSkills,
    },
    user: user
      ? { name: user.name, avatarUrl: user.avatarUrl }
      : null,
  })
})

skills.get('/debug/github-installations', async (c) => {
  try {
    const installations = await listAppInstallations()
    return c.json({
      currentInstallationId: process.env.GITHUB_APP_INSTALLATION_ID ?? '(not set)',
      installations,
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})

export { skills }
