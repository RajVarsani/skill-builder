import { next } from '@vercel/functions'

const CRAWLERS = [
  'Twitterbot',
  'facebookexternalhit',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Discordbot',
  'TelegramBot',
]

export default async function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || ''
  const isCrawler = CRAWLERS.some((bot) => ua.includes(bot))
  if (!isCrawler) return next()

  const url = new URL(request.url)
  const username = url.pathname.split('/profile/')[1]?.split('/')[0]?.split('?')[0]
  if (!username) return next()

  const backendUrl = `https://actingas-api.onrender.com/profile/${username}`
  const response = await fetch(backendUrl, {
    headers: { 'user-agent': ua },
  })

  // If backend returned OG HTML, serve it; otherwise pass through
  if (response.ok) {
    return new Response(response.body, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  return next()
}

export const config = {
  matcher: '/profile/:path*',
}
