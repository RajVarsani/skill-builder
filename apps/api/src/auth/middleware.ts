import type { Context, Next } from 'hono'
import { verifyToken } from './jwt'
import type { AppEnv } from '../types'

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = header.slice(7)
  const userId = await verifyToken(token)
  if (!userId) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('userId', userId)
  await next()
}
