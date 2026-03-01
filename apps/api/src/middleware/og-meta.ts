import { PublishedSkill } from '../db/models/published-skill'
import { User } from '../db/models/user'

const CRAWLERS = [
  'Twitterbot',
  'facebookexternalhit',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Discordbot',
  'TelegramBot',
]

function isCrawler(ua: string): boolean {
  return CRAWLERS.some((bot) => ua.includes(bot))
}

export async function handleProfileOG(username: string, ua: string): Promise<string | null> {
  if (!isCrawler(ua)) return null

  const skillName = `acting-as-${username.toLowerCase()}`
  const skill = await PublishedSkill.findOne({ skillName })
  if (!skill?.ogImageUrl) return null

  const user = await User.findById(skill.userId)
  const displayName = user?.name ?? username

  const blocks = Array.isArray(skill.blockStates) ? skill.blockStates.length : 0
  const skills = Array.isArray(skill.matchedSkills) ? skill.matchedSkills.length : 0
  const description = `${blocks} blocks discovered, ${skills} skills matched`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${displayName} | actingas.me</title>
  <meta property="og:title" content="${displayName} | actingas.me">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${skill.ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="profile">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayName} | actingas.me">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${skill.ogImageUrl}">
</head>
<body></body>
</html>`
}
