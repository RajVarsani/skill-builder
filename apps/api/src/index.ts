import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { connectDB } from './db/connection'
import { auth } from './routes/auth'
import { conversations } from './routes/conversations'
import { skills } from './routes/skills'
import { skillEngine } from './agent/skill-matching-engine'
import path from 'path'

const app = new Hono()

connectDB()

const datasetDir = path.resolve(import.meta.dir, '../../../dataset')
skillEngine.loadDataset(datasetDir)

app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/auth', auth)
app.route('/conversations', conversations)
app.route('/', skills)

const port = Number(process.env.PORT) || 3000
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120,
}
