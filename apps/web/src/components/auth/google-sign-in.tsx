'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string
              size?: string
              width?: number
              shape?: string
              text?: string
            }
          ) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = '151982860698-ijnsfi4nk3oavkob72g2h6t2vh6u2hdf.apps.googleusercontent.com'

export function GoogleSignIn() {
  const { login } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderButton = () => {
      if (!window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await login('google', response.credential)
        },
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 300,
      })
    }

    // Google script may already be loaded
    if (window.google) {
      renderButton()
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderButton()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [login])

  return <div ref={buttonRef} />
}
