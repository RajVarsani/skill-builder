import { useAuth } from '../lib/auth'
import { apiFetch } from '../lib/api'
import type { AuthResponse } from '@skill-builder/shared/src/types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID

function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function getGitHubAuthUrl() {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/github/callback`,
    scope: 'read:user user:email',
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export function SignIn() {
  const { signIn } = useAuth()

  const handleOAuthCallback = async (provider: 'google' | 'github', code: string) => {
    const result = await apiFetch<AuthResponse>(`/auth/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    signIn(result.token, result.user)
    window.location.href = '/builder'
  }

  // Check for OAuth callback
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const path = url.pathname

  if (code && path.includes('/auth/google/callback')) {
    handleOAuthCallback('google', code)
    return <LoadingScreen />
  }
  if (code && path.includes('/auth/github/callback')) {
    handleOAuthCallback('github', code)
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cream border-2 border-surface rounded-sm shadow-[4px_4px_0_0_rgba(42,37,32,0.3)] p-8">
        {/* Decorative pixel bar */}
        <div className="flex gap-1 mb-8 justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 ${
                [2, 3, 5, 6, 9, 10].includes(i) ? 'bg-accent' : 'bg-muted/30'
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl text-center uppercase tracking-wide text-surface">
          Skill Builder
        </h1>

        {/* Red divider */}
        <div className="w-8 h-1 bg-accent mx-auto mt-4 mb-6" />

        {/* Subtitle */}
        <p className="text-center text-muted text-sm leading-relaxed mb-8">
          Build your professional identity. Let AI
          <br />
          discover who you are — block by block.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <a
            href={getGoogleAuthUrl()}
            className="flex items-center justify-center gap-3 w-full py-4 bg-surface text-cream font-display text-sm uppercase tracking-wider rounded-sm hover:bg-surface/90 transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </a>

          <a
            href={getGitHubAuthUrl()}
            className="flex items-center justify-center gap-3 w-full py-4 bg-transparent text-surface font-display text-sm uppercase tracking-wider rounded-sm border-2 border-surface hover:bg-surface/5 transition-colors"
          >
            <GitHubIcon />
            Sign in with GitHub
          </a>
        </div>

        {/* Footer text */}
        <p className="text-center text-muted/60 text-xs mt-6">
          No credit card. No setup. Just a 3-minute conversation.
        </p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <p className="font-mono text-sm text-muted animate-pulse">Signing in...</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
