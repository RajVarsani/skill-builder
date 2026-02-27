import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { createElement } from 'react'
import type { UserPublic } from '@skill-builder/shared/src/types'
import { apiFetch } from './api'

interface AuthState {
  user: UserPublic | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (token: string, user: UserPublic) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }

    apiFetch<{ user: UserPublic }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setIsLoading(false))
  }, [])

  const signIn = useCallback((token: string, user: UserPublic) => {
    localStorage.setItem('token', token)
    setUser(user)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return createElement(
    AuthContext.Provider,
    { value: { user, isLoading, isAuthenticated: !!user, signIn, signOut } },
    children
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
