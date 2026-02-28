import { User } from '../db/models/user'
import { createToken } from './jwt'

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

async function getGitHubUserInfo(code: string) {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token as string

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const user: GitHubUser = await userRes.json()

  let email = user.email
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const emailData = await emailRes.json()
    const emails = Array.isArray(emailData) ? emailData as Array<{ email: string; primary: boolean }> : []
    email = emails.find((e) => e.primary)?.email ?? emails[0]?.email ?? null
  }

  return { user, email, accessToken }
}

export async function handleGitHubAuth(code: string) {
  const { user: ghUser, email, accessToken } = await getGitHubUserInfo(code)

  if (!email) {
    throw new Error('No email found on GitHub account')
  }

  let user = await User.findOne({ githubId: String(ghUser.id) })
  if (!user) {
    user = await User.findOne({ email })
    if (user) {
      user.githubId = String(ghUser.id)
      user.githubAccessToken = accessToken
      if (ghUser.avatar_url) user.avatarUrl = ghUser.avatar_url
      await user.save()
    } else {
      user = await User.create({
        email,
        name: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url,
        githubId: String(ghUser.id),
        githubAccessToken: accessToken,
      })
    }
  } else {
    user.githubAccessToken = accessToken
    await user.save()
  }

  const token = await createToken(user._id.toString())
  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasGithub: true,
    },
  }
}

export async function connectGitHub(userId: string, code: string) {
  const { user: ghUser, accessToken } = await getGitHubUserInfo(code)

  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  user.githubId = String(ghUser.id)
  user.githubAccessToken = accessToken
  await user.save()

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasGithub: true,
    },
  }
}
