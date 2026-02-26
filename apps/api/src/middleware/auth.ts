import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../lib/jwt'

type AuthEnv = {
  Variables: {
    userId: string
    email: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    c.set('userId', payload.userId)
    c.set('email', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
