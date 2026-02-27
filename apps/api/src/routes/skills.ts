import { Hono } from 'hono'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { PublishedSkill } from '../db/models/published-skill'
import { User } from '../db/models/user'
import { generateSkillPackage } from '../generator/skill-generator'
import { publishToGitHub } from '../generator/github-publisher'
import type { AppEnv } from '../types'

const skills = new Hono<AppEnv>()

skills.post('/conversations/:id/publish', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('id')

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
    status: 'active',
  })
  if (!conversation) return c.json({ error: 'Conversation not found' }, 404)

  const user = await User.findById(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  try {
    const files = await generateSkillPackage(
      user.name,
      conversation.blockStates,
      conversation.matchedSkills,
      conversation.selectedDomains
    )

    const publishResult = await publishToGitHub({
      userName: user.name,
      files,
      githubAccessToken: user.githubAccessToken,
    })

    const publishedSkill = await PublishedSkill.create({
      userId: user._id,
      conversationId: conversation._id,
      skillName: `acting-as-${user.name.toLowerCase().replace(/\s+/g, '-')}`,
      githubRepoUrl: publishResult.repoUrl,
      githubRepoOwner: publishResult.repoOwner,
      installCommand: publishResult.installCommand,
      blockStates: conversation.blockStates,
      matchedSkills: conversation.matchedSkills,
      customSkills: [],
      skillFiles: files,
    })

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
