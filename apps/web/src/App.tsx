import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from './lib/auth'
import { Landing } from './pages/Landing'
import { SignIn } from './pages/SignIn'
import { Builder } from './pages/Builder'
import { Success } from './pages/Success'
import { Profile } from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-8">
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-8 bg-accent"
              style={{
                animation: 'pixelBounce 0.6s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <p className="font-display text-[11px] uppercase tracking-[0.08em] text-muted">
          Loading
          <span className="inline-flex w-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-1 h-1 bg-muted mx-[1px]"
                style={{
                  animation: 'pixelBounce 0.8s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        </p>
        <style>{`
          @keyframes pixelBounce {
            0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/auth/google/callback" element={<SignIn />} />
          <Route path="/auth/github/callback" element={<SignIn />} />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success/:id"
            element={
              <ProtectedRoute>
                <Success />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
