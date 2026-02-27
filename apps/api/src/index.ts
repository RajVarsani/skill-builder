import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { connectDB } from './db/connection'

const app = new Hono()

connectDB()

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

const port = Number(process.env.PORT) || 3000
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
