import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import conversations from './routes/conversations'
import skills from './routes/skills'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', auth)

// Protected routes
app.use('/conversations/*', authMiddleware)
app.route('/conversations', conversations)
app.route('/', skills)

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})

export default app
