import { Hono } from 'hono'
import { db } from '../db'
import { users } from '../db/schema'
import { signToken } from '../lib/jwt'
import { eq } from 'drizzle-orm'

const auth = new Hono()

// Google OAuth callback — receives ID token from frontend
auth.post('/google', async (c) => {
  const { credential } = await c.req.json()

  // Verify Google ID token
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
  if (!res.ok) return c.json({ error: 'Invalid Google token' }, 401)

  const googleUser = await res.json() as {
    sub: string; email: string; name: string; picture: string
  }

  // Upsert user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleUser.sub))
    .limit(1)

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleId: googleUser.sub,
      })
      .returning()
  }

  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } })
})

// GitHub OAuth callback — receives auth code from frontend
auth.post('/github', async (c) => {
  const { code } = await c.req.json()

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token: string }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const githubUser = await userRes.json() as {
    id: number; login: string; name: string; avatar_url: string; email: string
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubId, String(githubUser.id)))
    .limit(1)

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: githubUser.email || `${githubUser.login}@github`,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
        githubId: String(githubUser.id),
        githubAccessToken: tokenData.access_token,
      })
      .returning()
  } else {
    await db.update(users).set({ githubAccessToken: tokenData.access_token }).where(eq(users.id, user.id))
  }

  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } })
})

// Connect GitHub to existing Google-auth account
auth.post('/github/connect', async (c) => {
  const userId = c.get('userId' as never) as string
  const { code } = await c.req.json()

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token: string }

  await db.update(users).set({ githubAccessToken: tokenData.access_token }).where(eq(users.id, userId))
  return c.json({ connected: true })
})

// Get current user
auth.get('/me', async (c) => {
  const userId = c.get('userId' as never) as string
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl })
})

export default auth
