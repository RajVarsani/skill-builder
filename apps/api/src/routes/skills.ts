import { Hono } from 'hono'
import { authMiddleware } from '../auth/middleware'
import { Conversation } from '../db/models/conversation'
import { PublishedSkill } from '../db/models/published-skill'
import { User } from '../db/models/user'
import { generateSkillPackage, generateSkillMarkdown, generateSkillOverrides } from '../generator/skill-generator'
import { publishToGitHub, listAppInstallations } from '../generator/github-publisher'
import { checkSpendingLimit, recordUsage, getUsageStats } from '../billing/usage-tracker'
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

  const spendCheck = await checkSpendingLimit()
  if (!spendCheck.allowed) {
    return c.json({ error: 'Spending limit exceeded', totalSpent: spendCheck.totalSpent, limit: spendCheck.limit }, 503)
  }

  try {
    console.log(`Preview: generating for ${user.name}, ${conversation.matchedSkills.length} skills, domains: ${conversation.selectedDomains}`)
    const { markdown, usage } = await generateSkillMarkdown(
      user.name,
      conversation.blockStates,
      conversation.matchedSkills,
      conversation.selectedDomains
    )
    console.log(`Preview: generated ${markdown.length} chars`)

    if (usage) {
      await recordUsage({
        conversationId: conversation._id,
        userId,
        source: 'skill_generation',
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      })
    }

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

skills.get('/skills/check-slug/:slug', authMiddleware, async (c) => {
  const slug = c.req.param('slug').toLowerCase()
  const skillName = `acting-as-${slug}`
  const existing = await PublishedSkill.findOne({ skillName })
  const available = !existing
  return c.json({ available, skillName })
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

  const spendCheck = await checkSpendingLimit()
  if (!spendCheck.allowed) {
    return c.json({ error: 'Spending limit exceeded', totalSpent: spendCheck.totalSpent, limit: spendCheck.limit }, 503)
  }

  try {
    const body = await c.req.json<{ skillMarkdown?: string; target?: 'org' | 'personal'; ogImage?: string; customSlug?: string }>().catch(() => ({} as { skillMarkdown?: string; target?: 'org' | 'personal'; ogImage?: string; customSlug?: string }))
    const slug = body.customSlug?.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || user.name.toLowerCase().replace(/\s+/g, '-')

    let files: Array<{ path: string; content: string; encoding?: 'base64' }>
    let generationUsage: { inputTokens: number; outputTokens: number; model: string } | null = null

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
      const result = await generateSkillPackage(
        user.name,
        conversation.blockStates,
        conversation.matchedSkills,
        conversation.selectedDomains
      )
      files = result.files
      generationUsage = result.usage
    }

    if (generationUsage) {
      await recordUsage({
        conversationId: conversation._id,
        userId,
        source: 'skill_generation',
        model: generationUsage.model,
        inputTokens: generationUsage.inputTokens,
        outputTokens: generationUsage.outputTokens,
      })
    }

    if (body.ogImage) {
      files.push({ path: 'og-image.png', content: body.ogImage, encoding: 'base64' })
    }

    console.log(`Publish: ${files.length} files for ${user.name}`)

    const usePersonalGithub = body.target === 'personal' && user.githubAccessToken
    const publishResult = await publishToGitHub({
      userName: user.name,
      slug,
      files,
      githubAccessToken: usePersonalGithub ? user.githubAccessToken : undefined,
    })

    const repoName = `acting-as-${slug}`
    const ogImageUrl = body.ogImage
      ? `https://raw.githubusercontent.com/${publishResult.repoOwner}/${repoName}/main/og-image.png`
      : undefined

    const skillName = `acting-as-${slug}`
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
        ...(ogImageUrl ? { ogImageUrl } : {}),
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
      ogImageUrl: skill.ogImageUrl,
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
      ogImageUrl: skill.ogImageUrl,
    },
    user: user
      ? { name: user.name, avatarUrl: user.avatarUrl }
      : null,
  })
})

skills.get('/debug/github-installations', async (c) => {
  const pk = process.env.GITHUB_APP_PRIVATE_KEY ?? ''
  try {
    const installations = await listAppInstallations()
    return c.json({
      currentInstallationId: process.env.GITHUB_APP_INSTALLATION_ID ?? '(not set)',
      keyInfo: { length: pk.length, first10: pk.substring(0, 10), last10: pk.substring(pk.length - 10) },
      installations,
    })
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      keyInfo: { length: pk.length, first10: pk.substring(0, 10), last10: pk.substring(pk.length - 10) },
    }, 500)
  }
})

skills.get('/usage/stats', async (c) => {
  const stats = await getUsageStats()
  return c.json(stats)
})

export { skills }
