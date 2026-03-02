import { User } from '../db/models/user'
import { createToken } from './jwt'

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
}

async function getGoogleUserInfo(code: string): Promise<GoogleUserInfo> {
  const redirectUri = `${process.env.FRONTEND_URL}/auth/google/callback`
  console.log('Google OAuth token exchange with redirect_uri:', redirectUri)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()

  if (tokenData.error) {
    console.error('Google token exchange failed:', tokenData.error, tokenData.error_description)
    throw new Error(`Google token exchange failed: ${tokenData.error_description || tokenData.error}`)
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const userInfo = await userRes.json()

  if (!userInfo.sub) {
    console.error('Google userinfo failed:', userInfo)
    throw new Error('Failed to get user info from Google')
  }

  return userInfo
}

export async function handleGoogleAuth(code: string) {
  const info = await getGoogleUserInfo(code)

  let user = await User.findOne({ googleId: info.sub })
  if (!user) {
    user = await User.findOne({ email: info.email })
    if (user) {
      user.googleId = info.sub
      if (info.picture) user.avatarUrl = info.picture
      await user.save()
    } else {
      user = await User.create({
        email: info.email,
        name: info.name,
        avatarUrl: info.picture,
        googleId: info.sub,
      })
    }
  }

  const token = await createToken(user._id.toString())
  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasGithub: !!user.githubId,
    },
  }
}
