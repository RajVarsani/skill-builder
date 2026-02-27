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
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="font-mono text-sm text-muted animate-pulse">Loading...</p>
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
