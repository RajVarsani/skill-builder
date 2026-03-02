// Load .env only in development — in production, env vars come from the platform
import dotenv from 'dotenv'
if (!process.env.K_SERVICE) {
  dotenv.config({ path: new URL('../.env', import.meta.url).pathname, override: true })
}

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { connectDB } from './db/connection'
import { auth } from './routes/auth'
import { conversations } from './routes/conversations'
import { skills } from './routes/skills'
import { skillEngine } from './agent/skill-matching-engine'
import { handleProfileOG } from './middleware/og-meta'
import path from 'path'

const app = new Hono()

connectDB()

const datasetDir = path.resolve(import.meta.dir, '../../../dataset')
skillEngine.loadDataset(datasetDir)

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'https://actingas.me',
        'https://www.actingas.me',
      ]
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
  })
)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/auth', auth)
app.route('/conversations', conversations)
app.route('/', skills)

// Crawler intercept for OG meta tags on profile pages
app.get('/profile/:username', async (c, next) => {
  const ua = c.req.header('user-agent') || ''
  const html = await handleProfileOG(c.req.param('username'), ua)
  if (html) return c.html(html)
  return next()
})

// Static files from Vite build (production single-service deployment)
app.use('/*', serveStatic({ root: './apps/web/dist' }))
// SPA fallback — serve index.html for client-side routes
app.get('*', serveStatic({ root: './apps/web/dist', path: 'index.html' }))

const port = Number(process.env.PORT) || 3000
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120,
}
