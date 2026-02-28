import { Hono } from 'hono'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { PublishedSkill } from '../db/models/published-skill'
import { User } from '../db/models/user'
import { generateSkillPackage, generateSkillMarkdown, generateSkillOverrides } from '../generator/skill-generator'
import { publishToGitHub } from '../generator/github-publisher'
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
    return c.json({ markdown })
  } catch (error) {
    console.error('Preview error details:', error instanceof Error ? error.message : error)
    console.error('Preview error stack:', error instanceof Error ? error.stack : 'no stack')
    return c.json({ error: 'Failed to generate preview' }, 500)
  }
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
    const body = await c.req.json<{ skillMarkdown?: string }>().catch(() => ({} as { skillMarkdown?: string }))
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

    const publishResult = await publishToGitHub({
      userName: user.name,
      files,
      githubAccessToken: user.githubAccessToken,
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
        publishMethod: user.githubAccessToken ? 'personal' : 'org',
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
    console.error('Publish error:', error)
    return c.json({ error: 'Failed to publish skill' }, 500)
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

export { skills }
