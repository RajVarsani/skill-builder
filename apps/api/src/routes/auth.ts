import { Hono } from 'hono'
import { handleGoogleAuth } from '../auth/google'
import { handleGitHubAuth, connectGitHub } from '../auth/github'
import { authMiddleware } from '../auth/middleware'
import { User } from '../db/models/user'
import type { AppEnv } from '../types'

const auth = new Hono<AppEnv>()

auth.post('/google', async (c) => {
  const { code } = await c.req.json<{ code: string }>()
  if (!code) return c.json({ error: 'Missing code' }, 400)

  try {
    const result = await handleGoogleAuth(code)
    return c.json(result)
  } catch (error) {
    console.error('Google auth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

auth.post('/github', async (c) => {
  const { code } = await c.req.json<{ code: string }>()
  if (!code) return c.json({ error: 'Missing code' }, 400)

  try {
    const result = await handleGitHubAuth(code)
    return c.json(result)
  } catch (error) {
    console.error('GitHub auth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

auth.post('/github/connect', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const { code } = await c.req.json<{ code: string }>()
  if (!code) return c.json({ error: 'Missing code' }, 400)

  try {
    const result = await connectGitHub(userId, code)
    return c.json(result)
  } catch (error) {
    console.error('GitHub connect error:', error)
    return c.json({ error: 'Failed to connect GitHub' }, 500)
  }
})

auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const user = await User.findById(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasGithub: !!user.githubId,
    },
  })
})

export { auth }
